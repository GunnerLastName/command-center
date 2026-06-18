"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { matchesShortcut } from "@/lib/shortcuts";
import type { ShortcutSettings } from "@/lib/shortcuts";
import { COMMAND_ASSISTANT_EVENT } from "@/components/assistant/global-assistant";

/** Fired on window to open the Quick add dialog from anywhere. */
export const QUICK_ADD_EVENT = "command-center:quick-add";

/** Fired on window to open the Quick brain dump dialog. */
export const QUICK_BRAIN_DUMP_EVENT = "command-center:brain-dump";

const GO_ROUTES: Record<string, string> = {
  d: "/",
  t: "/today",
  s: "/standards",
  p: "/projects",
  b: "/brain-dump",
  k: "/tasks",
  w: "/work-log",
  r: "/daily-review",
  v: "/weekly-review",
  ",": "/settings",
};

interface KeyboardShortcutsProps {
  shortcuts?: ShortcutSettings;
}

/**
 * Global keyboard shortcuts.
 *
 * Modifier combos (Ctrl+K etc.) are handled first — these work even while typing.
 * Single-key shortcuts (q = quick add, g then letter = navigate) are only
 * fired when the user is not typing and no dialog/menu is open.
 */
export function KeyboardShortcuts({ shortcuts }: KeyboardShortcutsProps) {
  const router = useRouter();
  const goMode = useRef(false);
  const goTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable ref so the event listener always has the latest shortcuts without re-registering
  const shortcutsRef = useRef<ShortcutSettings | undefined>(shortcuts);
  useLayoutEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    function isTyping(): boolean {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (el as HTMLElement).isContentEditable
      );
    }

    function overlayOpen(): boolean {
      return !!document.querySelector('[role="dialog"], [role="menu"]');
    }

    function onKey(e: KeyboardEvent) {
      const s = shortcutsRef.current;

      // ── Modifier shortcuts (Ctrl+K etc.) ──────────────────────────────────
      // These fire regardless of focus, unless a dialog is already open (to
      // avoid fighting with browser DevTools etc.)
      if (e.ctrlKey || e.metaKey) {
        // Open assistant
        if (s && matchesShortcut(e, s.openAssistant)) {
          e.preventDefault();
          // If a dialog is open, close it first; second Ctrl+K opens assistant
          window.dispatchEvent(new CustomEvent(COMMAND_ASSISTANT_EVENT));
          return;
        }
        // Quick add task
        if (s && matchesShortcut(e, s.quickAddTask)) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(QUICK_ADD_EVENT));
          return;
        }
        // Quick brain dump
        if (s && matchesShortcut(e, s.quickBrainDump)) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(QUICK_BRAIN_DUMP_EVENT));
          return;
        }
        // Navigation shortcuts
        if (s && matchesShortcut(e, s.goToDashboard)) {
          e.preventDefault();
          router.push("/");
          return;
        }
        if (s && matchesShortcut(e, s.goToToday)) {
          e.preventDefault();
          router.push("/today");
          return;
        }
        // startStopSession fires a custom event; the timer component listens for it
        if (s && matchesShortcut(e, s.startStopSession)) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("command-center:toggle-session"));
          return;
        }
      }

      // ── Single-key shortcuts — suppressed while typing or in dialogs ──────
      if (isTyping() || overlayOpen()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (goMode.current) {
        goMode.current = false;
        if (goTimer.current) clearTimeout(goTimer.current);
        const href = GO_ROUTES[key];
        if (href) {
          e.preventDefault();
          router.push(href);
        }
        return;
      }

      if (key === "q") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(QUICK_ADD_EVENT));
      } else if (key === "g") {
        goMode.current = true;
        goTimer.current = setTimeout(() => {
          goMode.current = false;
        }, 1500);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (goTimer.current) clearTimeout(goTimer.current);
    };
  }, [router]); // shortcuts read via ref — no need to re-register on change

  return null;
}
