"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveProjectNotes } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function NotesEditor({
  projectId,
  initialNotes,
}: {
  projectId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [isPending, startTransition] = useTransition();
  const dirty = notes !== initialNotes;

  return (
    <div className="space-y-3">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={10}
        placeholder="Strategy, scripts, offers, plans, context — anything that keeps this project clear."
        className="font-mono text-sm leading-relaxed"
      />
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          disabled={!dirty || isPending}
          onClick={() =>
            startTransition(async () => {
              await saveProjectNotes(projectId, notes);
              toast.success("Notes saved.");
            })
          }
        >
          {isPending ? "Saving…" : "Save notes"}
        </Button>
        {dirty && !isPending && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}
