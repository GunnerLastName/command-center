"use client";

import { Sparkles } from "lucide-react";
import { COMMAND_ASSISTANT_EVENT } from "@/components/assistant/global-assistant";

export function AssistantLauncher() {
  function openAssistant() {
    window.dispatchEvent(new CustomEvent(COMMAND_ASSISTANT_EVENT));
  }

  return (
    <button
      onClick={openAssistant}
      title="Command Assistant (Ctrl+K)"
      aria-label="Open Command Assistant"
      className="fixed bottom-24 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-border/50 transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:bottom-8 lg:right-8"
    >
      <Sparkles className="size-5" />
    </button>
  );
}
