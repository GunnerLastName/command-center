"use client";

import { useRef, useState, useCallback, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Check,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AssistantResult, HistoryEntry, PendingConfirmation } from "@/lib/assistant/types";

/** Fire this event from anywhere to open the Command Assistant modal. */
export const COMMAND_ASSISTANT_EVENT = "command-center:assistant";

// ─── Web Speech API types ─────────────────────────────────────────────────────

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

function useSpeechSupported() {
  return useSyncExternalStore(
    () => () => {},
    () => !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    () => false,
  );
}

// ─── component ────────────────────────────────────────────────────────────────

export function GlobalAssistant() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [listening, setListening] = useState(false);
  const speechSupported = useSpeechSupported();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for the open event from KeyboardShortcuts or AssistantCard
  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(COMMAND_ASSISTANT_EVENT, onOpen);
    return () => window.removeEventListener(COMMAND_ASSISTANT_EVENT, onOpen);
  }, []);

  // Focus textarea when dialog opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  // Stop mic + clear silence timer when dialog closes
  useEffect(() => {
    if (!open) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      recognitionRef.current?.stop();
    }
  }, [open]);

  function addToHistory(command: string, result: AssistantResult) {
    setHistory((prev) => [
      {
        id: Date.now().toString(),
        command,
        response: result.message,
        ok: result.ok,
        timestamp: new Date(),
      },
      ...prev.slice(0, 9),
    ]);
  }

  const submit = useCallback(
    async (command: string, confirmPayload?: PendingConfirmation) => {
      const trimmed = command.trim();
      if (!trimmed && !confirmPayload) return;

      setLoading(true);
      setPending(null);

      try {
        const body = confirmPayload
          ? {
              command: confirmPayload.prompt,
              confirm: { action: confirmPayload.action, payload: confirmPayload.payload },
            }
          : { command: trimmed };

        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data: AssistantResult = await res.json();

        if (data.needsConfirmation) {
          setPending(data.needsConfirmation);
          addToHistory(confirmPayload ? confirmPayload.prompt : trimmed, {
            ok: true,
            message: data.message,
          });
        } else {
          addToHistory(confirmPayload ? confirmPayload.prompt : trimmed, data);
          if (data.ok) {
            setInput("");
            router.refresh();
          }
        }
      } catch {
        addToHistory(trimmed, { ok: false, message: "Network error — try again." });
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit(input);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function toggleMic() {
    if (!speechSupported) return;

    if (listening) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition!;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    function resetSilenceTimer() {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        rec.stop();
      }, 10000);
    }

    rec.onresult = (e) => {
      resetSilenceTimer();
      // Only append finalized phrases — interim results just reset the timer
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const transcript = e.results[i][0].transcript;
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      }
    };
    rec.onerror = (e) => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setListening(false);
      const code = (e as unknown as { error?: string }).error ?? "";
      if (code === "network" || code === "service-not-allowed" || code === "server") {
        setInput((prev) =>
          prev ? prev : "Voice error — check mic permissions or try again."
        );
      }
    };
    rec.onend = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
    resetSilenceTimer();
    setListening(true);
  }

  const latestEntry = history[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="w-[calc(100vw-2rem)] max-w-lg p-0 gap-0 max-h-[85dvh] flex flex-col overflow-hidden sm:w-full">
        <DialogHeader className="flex flex-row items-center gap-2 border-b border-border px-4 py-3">
          <Bot className="size-4 text-muted-foreground shrink-0" />
          <DialogTitle className="text-sm font-medium">Command Assistant</DialogTitle>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto rounded p-1 text-foreground/60 transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Input row */}
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell Command Center what changed… (⌘↵ to send)"
              className="min-h-[72px] resize-none text-sm"
              disabled={loading}
            />
          </div>

          {/* Button row */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => submit(input)}
              disabled={loading || !input.trim()}
              className="gap-1.5"
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              {loading ? "Working…" : "Send"}
            </Button>

            {speechSupported && (
              <Button
                size="sm"
                variant={listening ? "default" : "outline"}
                onClick={toggleMic}
                disabled={loading}
                className="gap-1.5"
                title={listening ? "Stop listening" : "Start voice input"}
              >
                {listening ? (
                  <>
                    <MicOff className="size-3.5" />
                    Listening…
                  </>
                ) : (
                  <>
                    <Mic className="size-3.5" />
                    Voice
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Empty-state hints */}
          {!input && !loading && history.length === 0 && !pending && (
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
              <p className="mb-1.5 font-medium text-foreground/60">Try:</p>
              <ul className="space-y-0.5">
                <li>· add task: review investor deck by Friday</li>
                <li>· mark [habit] done · uncheck [habit]</li>
                <li>· log 2 hours on [project]</li>
                <li>· what should I focus on</li>
              </ul>
            </div>
          )}

          {/* Pending confirmation */}
          {pending && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
              <p className="text-sm text-amber-200">{pending.prompt}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500/40 text-amber-200 hover:bg-amber-500/20"
                  onClick={() => submit("", pending)}
                  disabled={loading}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => setPending(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Latest response */}
          {latestEntry && !pending && (
            <div
              className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                latestEntry.ok
                  ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-300"
                  : "border-rose-500/20 bg-rose-500/8 text-rose-300"
              }`}
            >
              {latestEntry.ok ? (
                <Check className="mt-0.5 size-3.5 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              )}
              <span>{latestEntry.response}</span>
            </div>
          )}

          {/* History */}
          {history.length > 1 && (
            <div className="space-y-1.5 border-t border-border pt-2">
              {history.slice(1, 4).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-baseline gap-2 text-xs text-muted-foreground"
                >
                  <span className="shrink-0 tabular-nums">
                    {entry.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="truncate">{entry.command}</span>
                  <span
                    className={`shrink-0 ${entry.ok ? "text-emerald-500" : "text-rose-500"}`}
                  >
                    {entry.ok ? "✓" : "✗"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
