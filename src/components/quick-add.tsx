"use client";

import { useEffect, useState, useTransition } from "react";
import { Brain, ListChecks, Plus, Timer } from "lucide-react";
import { toast } from "sonner";
import { createDump } from "@/app/actions/braindump";
import { createTask } from "@/app/actions/tasks";
import { startSession } from "@/app/actions/sessions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectOption } from "@/lib/types";
import { QUICK_ADD_EVENT } from "./keyboard-shortcuts";

export const NO_PROJECT = "none";

export function ProjectSelect({
  projects,
  value,
  onChange,
  placeholder = "No project",
}: {
  projects: ProjectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_PROJECT}>{placeholder}</SelectItem>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function QuickAdd({ projects }: { projects: ProjectOption[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // The global `q` shortcut (see keyboard-shortcuts.tsx) opens this dialog.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(QUICK_ADD_EVENT, onOpen);
    return () => window.removeEventListener(QUICK_ADD_EVENT, onOpen);
  }, []);

  // Idea
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaNotes, setIdeaNotes] = useState("");
  const [ideaProject, setIdeaProject] = useState(NO_PROJECT);

  // Task
  const [taskTitle, setTaskTitle] = useState("");
  const [taskProject, setTaskProject] = useState(NO_PROJECT);
  const [taskToday, setTaskToday] = useState(true);

  // Session
  const [sessionDescription, setSessionDescription] = useState("");
  const [sessionProject, setSessionProject] = useState(NO_PROJECT);

  function submitIdea() {
    if (!ideaTitle.trim()) return;
    startTransition(async () => {
      await createDump({
        title: ideaTitle,
        notes: ideaNotes,
        projectId: ideaProject === NO_PROJECT ? null : ideaProject,
      });
      setIdeaTitle("");
      setIdeaNotes("");
      setOpen(false);
      toast.success("Captured. Out of your head.");
    });
  }

  function submitTask() {
    if (!taskTitle.trim()) return;
    startTransition(async () => {
      await createTask({
        title: taskTitle,
        projectId: taskProject === NO_PROJECT ? null : taskProject,
        today: taskToday,
      });
      setTaskTitle("");
      setOpen(false);
      toast.success(taskToday ? "Added to today." : "Task added.");
    });
  }

  function submitSession() {
    startTransition(async () => {
      await startSession({
        description: sessionDescription,
        projectId: sessionProject === NO_PROJECT ? null : sessionProject,
      });
      setSessionDescription("");
      setOpen(false);
      toast.success("Session started. Lock in.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full justify-center gap-2 lg:justify-start"
          title="Quick add (Q)"
        >
          <Plus className="size-4" />
          <span className="hidden lg:inline">Quick add</span>
          <kbd className="ml-auto hidden rounded border border-primary-foreground/20 px-1.5 font-mono text-[10px] opacity-60 lg:inline">
            Q
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick add</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="idea">
          <TabsList className="w-full">
            <TabsTrigger value="idea" className="flex-1 gap-1.5">
              <Brain className="size-3.5" /> Idea
            </TabsTrigger>
            <TabsTrigger value="task" className="flex-1 gap-1.5">
              <ListChecks className="size-3.5" /> Task
            </TabsTrigger>
            <TabsTrigger value="session" className="flex-1 gap-1.5">
              <Timer className="size-3.5" /> Session
            </TabsTrigger>
          </TabsList>

          <TabsContent value="idea" className="mt-4 space-y-3">
            <Input
              autoFocus
              placeholder="What's on your mind?"
              value={ideaTitle}
              onChange={(e) => setIdeaTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitIdea()}
            />
            <Textarea
              placeholder="Notes (optional)"
              value={ideaNotes}
              onChange={(e) => setIdeaNotes(e.target.value)}
              rows={2}
            />
            <ProjectSelect
              projects={projects}
              value={ideaProject}
              onChange={setIdeaProject}
            />
            <Button
              onClick={submitIdea}
              disabled={isPending || !ideaTitle.trim()}
              className="w-full"
            >
              Capture idea
            </Button>
          </TabsContent>

          <TabsContent value="task" className="mt-4 space-y-3">
            <Input
              placeholder="What needs to move forward?"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitTask()}
            />
            <ProjectSelect
              projects={projects}
              value={taskProject}
              onChange={setTaskProject}
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="quick-task-today"
                checked={taskToday}
                onCheckedChange={(v) => setTaskToday(v === true)}
              />
              <Label htmlFor="quick-task-today" className="text-sm font-normal">
                Today&apos;s focus
              </Label>
            </div>
            <Button
              onClick={submitTask}
              disabled={isPending || !taskTitle.trim()}
              className="w-full"
            >
              Add task
            </Button>
          </TabsContent>

          <TabsContent value="session" className="mt-4 space-y-3">
            <Input
              placeholder="What are you working on?"
              value={sessionDescription}
              onChange={(e) => setSessionDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSession()}
            />
            <ProjectSelect
              projects={projects}
              value={sessionProject}
              onChange={setSessionProject}
            />
            <Button
              onClick={submitSession}
              disabled={isPending}
              className="w-full"
            >
              Start session
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
