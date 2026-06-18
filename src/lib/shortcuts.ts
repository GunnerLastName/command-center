import { z } from "zod";

export const SHORTCUT_ACTIONS = [
  "openAssistant",
  "quickAddTask",
  "quickBrainDump",
  "startStopSession",
  "goToToday",
  "goToDashboard",
] as const;

export type ShortcutAction = (typeof SHORTCUT_ACTIONS)[number];

export const shortcutLabels: Record<ShortcutAction, string> = {
  openAssistant: "Open Command Assistant",
  quickAddTask: "Quick Add Task",
  quickBrainDump: "Quick Brain Dump",
  startStopSession: "Start / Stop Work Session",
  goToToday: "Go to Today",
  goToDashboard: "Go to Dashboard",
};

const shortcutSchema = z.object({
  openAssistant: z.string().default("Ctrl+K"),
  quickAddTask: z.string().default("Ctrl+Shift+T"),
  quickBrainDump: z.string().default("Ctrl+Shift+B"),
  startStopSession: z.string().default("Ctrl+Shift+W"),
  goToToday: z.string().default("Ctrl+Shift+D"),
  goToDashboard: z.string().default("Ctrl+Shift+H"),
});

export type ShortcutSettings = z.infer<typeof shortcutSchema>;

export const shortcutDefaults: ShortcutSettings = shortcutSchema.parse({});

export function parseShortcutSettings(json: string): ShortcutSettings {
  try {
    return shortcutSchema.parse(JSON.parse(json));
  } catch {
    return shortcutDefaults;
  }
}

/** Format a shortcut string for display, e.g. "Ctrl+K" → "⌃K" on Mac. */
export function formatShortcut(shortcut: string): string {
  return shortcut
    .replace(/Ctrl/g, "Ctrl")
    .replace(/Shift/g, "⇧")
    .replace(/Alt/g, "Alt");
}

/** Parse a KeyboardEvent into a "Ctrl+Shift+K" style string. */
export function eventToShortcut(e: KeyboardEvent): string | null {
  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) return null;
  const key = e.key;
  // Ignore bare modifier presses
  if (["Control", "Meta", "Shift", "Alt"].includes(key)) return null;
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.shiftKey) parts.push("Shift");
  if (e.altKey) parts.push("Alt");
  parts.push(key.length === 1 ? key.toUpperCase() : key);
  return parts.join("+");
}

/**
 * Returns true if the keyboard event matches a stored shortcut string.
 * "Ctrl" in stored shortcuts matches both ctrlKey (Windows) and metaKey (Mac).
 */
export function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.split("+");
  const storedKey = parts[parts.length - 1].toLowerCase();
  const needsCtrl = parts.some((p) => p.toLowerCase() === "ctrl");
  const needsShift = parts.some((p) => p.toLowerCase() === "shift");
  const needsAlt = parts.some((p) => p.toLowerCase() === "alt");

  const hasCtrl = e.ctrlKey || e.metaKey;

  return (
    e.key.toLowerCase() === storedKey &&
    hasCtrl === needsCtrl &&
    e.shiftKey === needsShift &&
    e.altKey === needsAlt
  );
}

// Browser reserved combos to warn about
const BROWSER_RESERVED = new Set([
  "Ctrl+T",
  "Ctrl+W",
  "Ctrl+R",
  "Ctrl+L",
  "Ctrl+N",
  "Ctrl+P",
  "Ctrl+S",
  "Ctrl+F",
  "Ctrl+G",
  "Ctrl+H",
  "Ctrl+J",
  "Ctrl+U",
  "Ctrl+Shift+N",
  "Ctrl+Shift+I",
  "Ctrl+Shift+J",
  "Ctrl+Shift+Delete",
]);

export function isBrowserReserved(shortcut: string): boolean {
  return BROWSER_RESERVED.has(shortcut);
}

export function findConflict(
  shortcut: string,
  currentAction: ShortcutAction,
  all: ShortcutSettings
): ShortcutAction | null {
  for (const action of SHORTCUT_ACTIONS) {
    if (action === currentAction) continue;
    if (all[action] === shortcut) return action;
  }
  return null;
}
