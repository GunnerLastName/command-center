"use client";

import { useState, useCallback } from "react";
import { Keyboard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateSettings } from "@/app/actions/settings";
import {
  SHORTCUT_ACTIONS,
  shortcutLabels,
  shortcutDefaults,
  eventToShortcut,
  isBrowserReserved,
  findConflict,
} from "@/lib/shortcuts";
import type { ShortcutSettings, ShortcutAction } from "@/lib/shortcuts";

interface Props {
  initialShortcuts: ShortcutSettings;
}

export function KeyboardShortcutSettings({ initialShortcuts }: Props) {
  const [shortcuts, setShortcuts] = useState<ShortcutSettings>(initialShortcuts);
  const [editing, setEditing] = useState<ShortcutAction | null>(null);
  const [saving, setSaving] = useState(false);

  const startCapture = useCallback(
    (action: ShortcutAction) => {
      setEditing(action);

      function onKey(e: KeyboardEvent) {
        e.preventDefault();
        e.stopPropagation();

        if (e.key === "Escape") {
          setEditing(null);
          window.removeEventListener("keydown", onKey, true);
          return;
        }

        const combo = eventToShortcut(e);
        if (!combo) return; // bare modifier key

        window.removeEventListener("keydown", onKey, true);
        setEditing(null);

        if (isBrowserReserved(combo)) {
          toast.warning(`"${combo}" is reserved by the browser and may not work.`);
        }

        const conflict = findConflict(combo, action, shortcuts);
        if (conflict) {
          toast.error(
            `"${combo}" is already used by "${shortcutLabels[conflict]}". Choose a different combo.`
          );
          return;
        }

        setShortcuts((prev) => ({ ...prev, [action]: combo }));
      }

      window.addEventListener("keydown", onKey, true);
    },
    [shortcuts]
  );

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings({ keyboardShortcuts: JSON.stringify(shortcuts) });
      toast.success("Keyboard shortcuts saved.");
    } catch {
      toast.error("Failed to save shortcuts.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setShortcuts(shortcutDefaults);
  }

  const isDirty = JSON.stringify(shortcuts) !== JSON.stringify(initialShortcuts);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {SHORTCUT_ACTIONS.map((action) => {
          const isEditing = editing === action;
          const combo = shortcuts[action];
          const reserved = isBrowserReserved(combo);

          return (
            <div key={action} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-foreground truncate">
                  {shortcutLabels[action]}
                </span>
                {reserved && (
                  <span title="May conflict with browser shortcut">
                    <AlertTriangle className="size-3.5 text-amber-400 shrink-0" />
                  </span>
                )}
              </div>

              <button
                onClick={() => startCapture(action)}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs transition-colors min-w-[80px] justify-center ${
                  isEditing
                    ? "border-primary bg-primary/10 text-primary animate-pulse"
                    : "border-border bg-muted text-foreground hover:border-primary/50 hover:bg-muted/80"
                }`}
                title="Click to record a new shortcut"
              >
                {isEditing ? (
                  <>
                    <Keyboard className="size-3" />
                    Press keys…
                  </>
                ) : (
                  combo
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !isDirty}
        >
          {saving ? "Saving…" : "Save shortcuts"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={handleReset}
          disabled={saving}
        >
          Reset to defaults
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Click a shortcut to record a new combo. Press Escape to cancel.
        Ctrl matches both Ctrl (Windows) and ⌘ (Mac).
      </p>
    </div>
  );
}
