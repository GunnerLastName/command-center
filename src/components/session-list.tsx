"use client";

import { useState, useTransition } from "react";
import { Pencil, Timer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteSession, updateSession } from "@/app/actions/sessions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatInAppTz, formatMinutes } from "@/lib/dates";
import type { SessionItemData } from "@/lib/serialize";
import type { ProjectOption } from "@/lib/types";
import { EmptyState } from "./empty-state";
import { SessionForm, type TaskOption } from "./timer-panel";

function SessionRow({
  session,
  onEdit,
}: {
  session: SessionItemData;
  onEdit?: (session: SessionItemData) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const start = new Date(session.startTime);

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          {session.description || session.taskTitle || "Focused work"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatInAppTz(start, "EEE MMM d · h:mm a")}
          {session.endTime &&
            ` – ${formatInAppTz(new Date(session.endTime), "h:mm a")}`}
          {session.projectName && ` · ${session.projectName}`}
        </p>
      </div>
      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
        {session.endTime ? formatMinutes(session.durationMinutes) : "running"}
      </span>
      {onEdit && session.endTime && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100"
          onClick={() => onEdit(session)}
          aria-label="Edit session"
        >
          <Pencil className="size-3.5" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={isPending}
        className="opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100"
        onClick={() => startTransition(() => deleteSession(session.id))}
        aria-label="Delete session"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

export function SessionList({
  sessions,
  projects,
  tasks,
  emptyTitle = "No sessions yet",
  emptyDescription,
}: {
  sessions: SessionItemData[];
  /** Pass projects + tasks to enable editing finished sessions. */
  projects?: ProjectOption[];
  tasks?: TaskOption[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [editing, setEditing] = useState<SessionItemData | null>(null);
  const editable = projects !== undefined && tasks !== undefined;

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={Timer}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <SessionRow
          key={s.id}
          session={s}
          onEdit={editable ? setEditing : undefined}
        />
      ))}
      {editable && (
        <Dialog
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit session</DialogTitle>
            </DialogHeader>
            {editing && (
              <SessionForm
                key={editing.id}
                projects={projects}
                tasks={tasks}
                initial={{
                  date: formatInAppTz(new Date(editing.startTime), "yyyy-MM-dd"),
                  startTime: formatInAppTz(new Date(editing.startTime), "HH:mm"),
                  durationMinutes: editing.durationMinutes,
                  projectId: editing.projectId,
                  taskId: editing.taskId,
                  description: editing.description,
                }}
                submitLabel="Save changes"
                onSubmit={async (values) => {
                  await updateSession(editing.id, values);
                  toast.success("Session updated.");
                  setEditing(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
