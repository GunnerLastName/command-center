"use client";

import { useEffect, useState, useTransition } from "react";
import { Play, Plus, Square } from "lucide-react";
import { toast } from "sonner";
import { createManualSession, startSession, stopSession } from "@/app/actions/sessions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { dateKey } from "@/lib/dates";
import type { ProjectOption } from "@/lib/types";
import { NO_PROJECT, ProjectSelect } from "./quick-add";

export interface TaskOption {
  id: string;
  title: string;
  projectId: string | null;
}

export interface ActiveSessionData {
  id: string;
  description: string;
  startTime: string; // ISO
  projectName: string | null;
  taskTitle: string | null;
}

function LiveElapsed({ startIso }: { startIso: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const totalSeconds = Math.max(0, Math.floor((now - Date.parse(startIso)) / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-mono text-4xl font-semibold tabular-nums">
      {h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`}
    </span>
  );
}

export interface SessionFormValues {
  date: string; // "yyyy-MM-dd"
  startTime: string; // "HH:mm"
  durationMinutes: number;
  projectId: string | null;
  taskId: string | null;
  description: string;
}

/**
 * Shared date/time/project/task/description form for manual entry and
 * editing. Mount fresh per dialog open (key it) so state inits from props.
 */
export function SessionForm({
  projects,
  tasks,
  initial,
  submitLabel,
  onSubmit,
}: {
  projects: ProjectOption[];
  tasks: TaskOption[];
  initial?: Partial<SessionFormValues>;
  submitLabel: string;
  onSubmit: (values: SessionFormValues) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(initial?.date ?? dateKey(new Date()));
  const [startTime, setStartTime] = useState(initial?.startTime ?? "12:00");
  const [duration, setDuration] = useState(
    String(initial?.durationMinutes ?? 60)
  );
  const [projectId, setProjectId] = useState(initial?.projectId ?? NO_PROJECT);
  const [taskId, setTaskId] = useState(initial?.taskId ?? NO_PROJECT);
  const [description, setDescription] = useState(initial?.description ?? "");

  const taskOptions =
    projectId === NO_PROJECT
      ? tasks
      : tasks.filter((t) => t.projectId === projectId);

  function submit() {
    const minutes = Math.round(Number(duration));
    if (!date || !minutes || minutes <= 0) return;
    startTransition(() =>
      onSubmit({
        date,
        startTime: startTime || "12:00",
        durationMinutes: minutes,
        projectId: projectId === NO_PROJECT ? null : projectId,
        taskId: taskId === NO_PROJECT ? null : taskId,
        description,
      })
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Start</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Minutes</Label>
          <Input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Project</Label>
        <ProjectSelect
          projects={projects}
          value={projectId}
          onChange={(v) => {
            setProjectId(v);
            setTaskId(NO_PROJECT);
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Task (optional)</Label>
        <Select value={taskId} onValueChange={setTaskId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="No task" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PROJECT}>No task</SelectItem>
            {taskOptions.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you work on?"
        />
      </div>
      <Button
        onClick={submit}
        disabled={isPending || !Number(duration)}
        className="w-full"
      >
        {submitLabel}
      </Button>
    </div>
  );
}

export function ManualSessionButton({
  projects,
  tasks,
}: {
  projects: ProjectOption[];
  tasks: TaskOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" /> Log time manually
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log time manually</DialogTitle>
          </DialogHeader>
          {open && (
            <SessionForm
              projects={projects}
              tasks={tasks}
              submitLabel="Log session"
              onSubmit={async (values) => {
                await createManualSession(values);
                toast.success("Session logged.");
                setOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TimerPanel({
  activeSession,
  projects,
  tasks,
}: {
  activeSession: ActiveSessionData | null;
  projects: ProjectOption[];
  tasks: TaskOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(NO_PROJECT);
  const [taskId, setTaskId] = useState(NO_PROJECT);

  const taskOptions =
    projectId === NO_PROJECT
      ? tasks
      : tasks.filter((t) => t.projectId === projectId);

  function start() {
    startTransition(async () => {
      const task = tasks.find((t) => t.id === taskId);
      await startSession({
        description: description || task?.title || "",
        projectId:
          projectId === NO_PROJECT ? (task?.projectId ?? null) : projectId,
        taskId: taskId === NO_PROJECT ? null : taskId,
      });
      setDescription("");
      toast.success("Session started. Lock in.");
    });
  }

  if (activeSession) {
    return (
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
              </span>
              <LiveElapsed startIso={activeSession.startTime} />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {activeSession.description || "Focused work"}
              {activeSession.projectName && ` · ${activeSession.projectName}`}
              {activeSession.taskTitle && ` · ${activeSession.taskTitle}`}
            </p>
          </div>
          <Button
            size="lg"
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await stopSession();
                toast.success("Session logged. Good work.");
              })
            }
          >
            <Square className="size-4" /> Stop session
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="space-y-3">
        <p className="text-sm font-medium">Start a focused session</p>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && start()}
            className="min-w-48 flex-1"
          />
          <div className="w-44">
            <ProjectSelect
              projects={projects}
              value={projectId}
              onChange={(v) => {
                setProjectId(v);
                setTaskId(NO_PROJECT);
              }}
            />
          </div>
          <Select value={taskId} onValueChange={setTaskId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="No task" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PROJECT}>No task</SelectItem>
              {taskOptions.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={start} disabled={isPending}>
            <Play className="size-4" /> Start
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
