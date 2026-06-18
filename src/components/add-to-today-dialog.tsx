"use client";

import { useState, useTransition } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { setTaskToday } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { TaskItemData } from "@/lib/serialize";

export function AddToTodayDialog({
  availableTasks,
}: {
  availableTasks: TaskItemData[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  const filtered = availableTasks.filter(
    (t) => !query || t.title.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = new Map<string, TaskItemData[]>();
  for (const task of filtered) {
    const key = task.projectName ?? "No project";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(task);
  }

  function addTask(id: string) {
    startTransition(async () => {
      await setTaskToday(id, true);
      toast.success("Added to today.");
    });
    setQuery("");
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" /> From projects
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add task to today</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search tasks…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="max-h-72 space-y-4 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {query ? "No matches." : "No open tasks outside today."}
                </p>
              ) : (
                [...grouped.entries()].map(([project, tasks]) => (
                  <div key={project}>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                      {project}
                    </p>
                    <div className="space-y-1">
                      {tasks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => addTask(t.id)}
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-muted-foreground/30 hover:bg-muted/50"
                        >
                          {t.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
