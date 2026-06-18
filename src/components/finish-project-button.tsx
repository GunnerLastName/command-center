"use client";

import { useState, useTransition } from "react";
import { CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { finishProject, reopenProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function FinishProjectButton({
  projectId,
  projectName,
  status,
  openTaskCount,
}: {
  projectId: string;
  projectName: string;
  status: string;
  openTaskCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [archiveTasks, setArchiveTasks] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (status === "completed") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await reopenProject(projectId);
            toast.success("Project reopened.");
          })
        }
      >
        <RefreshCw className="size-3.5" /> Reopen
      </Button>
    );
  }

  function complete() {
    startTransition(async () => {
      await finishProject(projectId, archiveTasks);
      setOpen(false);
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      toast.success(`${projectName} — shipped.`);
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <CheckCircle className="size-3.5" /> Mark complete
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Complete project?</DialogTitle>
          </DialogHeader>
          <FinishForm
            key={projectId}
            projectName={projectName}
            openTaskCount={openTaskCount}
            archiveTasks={archiveTasks}
            onArchiveChange={setArchiveTasks}
            onConfirm={complete}
            onCancel={() => setOpen(false)}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function FinishForm({
  projectName,
  openTaskCount,
  archiveTasks,
  onArchiveChange,
  onConfirm,
  onCancel,
  isPending,
}: {
  projectName: string;
  openTaskCount: number;
  archiveTasks: boolean;
  onArchiveChange: (v: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Mark <span className="font-medium text-foreground">{projectName}</span> as
        completed.
      </p>
      {openTaskCount > 0 && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium">
            {openTaskCount} task{openTaskCount === 1 ? "" : "s"} still open
          </p>
          <div className="space-y-1.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="taskDisposition"
                checked={!archiveTasks}
                onChange={() => onArchiveChange(false)}
                className="accent-foreground"
              />
              Keep tasks open
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="taskDisposition"
                checked={archiveTasks}
                onChange={() => onArchiveChange(true)}
                className="accent-foreground"
              />
              Archive open tasks
            </label>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Button onClick={onConfirm} disabled={isPending} className="flex-1">
          {isPending ? "Completing…" : "Mark complete"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
