"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createProject, updateProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
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
import { PROJECT_STATUSES, projectStatusLabel } from "@/lib/labels";

export interface ProjectFormData {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  mainGoal: string;
  currentBottleneck: string;
  nextBestAction: string;
  deadline: string | null; // "yyyy-MM-dd"
  progressPercent: number;
}

// Mounted fresh on each dialog open, so state initializes straight from props.
function ProjectForm({
  project,
  onDone,
}: {
  project?: ProjectFormData | null;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [category, setCategory] = useState(project?.category ?? "");
  const [status, setStatus] = useState(project?.status ?? "active");
  const [priority, setPriority] = useState(project?.priority ?? "medium");
  const [mainGoal, setMainGoal] = useState(project?.mainGoal ?? "");
  const [bottleneck, setBottleneck] = useState(
    project?.currentBottleneck ?? ""
  );
  const [nextAction, setNextAction] = useState(project?.nextBestAction ?? "");
  const [deadline, setDeadline] = useState(project?.deadline ?? "");
  const [progress, setProgress] = useState(
    String(project?.progressPercent ?? 0)
  );

  function submit() {
    if (!name.trim()) return;
    const payload = {
      name,
      description,
      category,
      status,
      priority,
      mainGoal,
      currentBottleneck: bottleneck,
      nextBestAction: nextAction,
      deadline: deadline || null,
      progressPercent: Math.min(100, Math.max(0, Number(progress) || 0)),
    };
    startTransition(async () => {
      if (project) {
        await updateProject(project.id, payload);
        toast.success("Project updated.");
      } else {
        await createProject(payload);
        toast.success("Project created.");
      }
      onDone();
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Name</Label>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Main goal</Label>
        <Input
          value={mainGoal}
          onChange={(e) => setMainGoal(e.target.value)}
          placeholder="What does winning look like?"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {projectStatusLabel[s]}
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
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Agency, Client, Content…"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Deadline</Label>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Progress (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Current bottleneck
        </Label>
        <Input
          value={bottleneck}
          onChange={(e) => setBottleneck(e.target.value)}
          placeholder="What's in the way right now?"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Next best action
        </Label>
        <Input
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          placeholder="The single next move"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Short context (optional)"
        />
      </div>
      <Button
        onClick={submit}
        disabled={isPending || !name.trim()}
        className="w-full"
      >
        {project ? "Save changes" : "Create project"}
      </Button>
    </div>
  );
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectFormData | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <ProjectForm
          key={project?.id ?? "new"}
          project={project}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function NewProjectButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        New project
      </Button>
      <ProjectDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditProjectButton({ project }: { project: ProjectFormData }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit project
      </Button>
      <ProjectDialog open={open} onOpenChange={setOpen} project={project} />
    </>
  );
}
