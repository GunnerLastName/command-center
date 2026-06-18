"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createTask, updateTask } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TaskItemData } from "@/lib/serialize";
import type { ProjectOption } from "@/lib/types";
import { NO_PROJECT, ProjectSelect } from "./quick-add";

// Form state lives in this inner component, which mounts fresh every time the
// dialog opens (radix unmounts DialogContent on close), so no reset effect is
// needed.
function TaskForm({
  projects,
  task,
  defaultProjectId,
  defaultProjectAreaId,
  defaultToday,
  onDone,
}: {
  projects: ProjectOption[];
  task?: TaskItemData | null;
  defaultProjectId?: string | null;
  defaultProjectAreaId?: string | null;
  defaultToday: boolean;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [priority, setPriority] = useState(task?.priority ?? "medium");
  const [projectId, setProjectId] = useState(
    task?.projectId ?? defaultProjectId ?? NO_PROJECT
  );
  const [areaId, setAreaId] = useState(
    task?.projectAreaId ?? defaultProjectAreaId ?? NO_PROJECT
  );
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [estimated, setEstimated] = useState(
    task?.estimatedMinutes ? String(task.estimatedMinutes) : ""
  );
  const [today, setToday] = useState(task?.today ?? defaultToday);

  const selectedProject = projects.find((p) => p.id === projectId);
  const areas = selectedProject?.areas ?? [];

  function submit() {
    if (!title.trim()) return;
    const payload = {
      title,
      notes,
      priority,
      projectId: projectId === NO_PROJECT ? null : projectId,
      projectAreaId: areaId === NO_PROJECT ? null : areaId,
      dueDate: dueDate || null,
      estimatedMinutes:
        estimated && Number(estimated) > 0
          ? Math.round(Number(estimated))
          : null,
      today,
    };
    startTransition(async () => {
      if (task) {
        await updateTask(task.id, payload);
        toast.success("Task updated.");
      } else {
        await createTask(payload);
        toast.success("Task added.");
      }
      onDone();
    });
  }

  return (
    <div className="space-y-3">
      <Input
        autoFocus
        placeholder="What needs to move forward?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <Textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Project</Label>
          <ProjectSelect
            projects={projects}
            value={projectId}
            onChange={(v) => {
              setProjectId(v);
              setAreaId(NO_PROJECT);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Area</Label>
          <Select
            value={areaId}
            onValueChange={setAreaId}
            disabled={areas.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="No area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PROJECT}>No area</SelectItem>
              {areas.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Due date</Label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Estimate (min)
          </Label>
          <Input
            type="number"
            min={1}
            placeholder="—"
            value={estimated}
            onChange={(e) => setEstimated(e.target.value)}
          />
        </div>
        <div className="flex items-end pb-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="task-dialog-today"
              checked={today}
              onCheckedChange={(v) => setToday(v === true)}
            />
            <Label htmlFor="task-dialog-today" className="text-sm font-normal">
              Today&apos;s focus
            </Label>
          </div>
        </div>
      </div>
      <Button
        onClick={submit}
        disabled={isPending || !title.trim()}
        className="w-full"
      >
        {task ? "Save changes" : "Add task"}
      </Button>
    </div>
  );
}

export function TaskDialog({
  open,
  onOpenChange,
  projects,
  task,
  defaultProjectId,
  defaultProjectAreaId,
  defaultToday = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectOption[];
  task?: TaskItemData | null;
  defaultProjectId?: string | null;
  defaultProjectAreaId?: string | null;
  defaultToday?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <TaskForm
          key={task?.id ?? "new"}
          projects={projects}
          task={task}
          defaultProjectId={defaultProjectId}
          defaultProjectAreaId={defaultProjectAreaId}
          defaultToday={defaultToday}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
