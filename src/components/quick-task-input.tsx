"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createTask } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** One-line task capture. Defaults to today's list. */
export function QuickTaskInput({
  today = true,
  projectId = null,
  placeholder = "Add a task for today…",
}: {
  today?: boolean;
  projectId?: string | null;
  placeholder?: string;
}) {
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!title.trim()) return;
    startTransition(async () => {
      await createTask({ title, today, projectId });
      setTitle("");
    });
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder={placeholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <Button
        onClick={submit}
        disabled={isPending || !title.trim()}
        size="icon"
        aria-label="Add task"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
