"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion, Reorder, useDragControls } from "framer-motion";
import {
  Archive,
  Calendar,
  Check,
  GripVertical,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Sun,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteTask, setTaskStatus, setTaskToday } from "@/app/actions/tasks";
import { startSession } from "@/app/actions/sessions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dateKey } from "@/lib/dates";
import type { TaskItemData } from "@/lib/serialize";
import type { ProjectOption } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";
import { TaskDialog } from "./task-dialog";

const priorityDot: Record<string, string> = {
  low: "bg-zinc-500",
  medium: "bg-sky-400",
  high: "bg-rose-400",
};

function TaskRow({
  task,
  showProject,
  onEdit,
  reorderable = false,
}: {
  task: TaskItemData;
  showProject: boolean;
  onEdit: (task: TaskItemData) => void;
  reorderable?: boolean;
}) {
  const controls = useDragControls();
  const [isPending, startTransition] = useTransition();
  const done = task.status === "done";
  const overdue =
    !done && task.dueDate !== null && task.dueDate < dateKey(new Date());

  function toggleDone() {
    startTransition(async () => {
      await setTaskStatus(task.id, done ? "todo" : "done");
      if (!done) toast.success("Done. Move to the next one.");
    });
  }

  const rowClassName = cn(
    "group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5",
    done && "opacity-60"
  );

  const inner = (
    <>
      {reorderable && (
        <button
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-3.5" />
        </button>
      )}
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={toggleDone}
        disabled={isPending}
        aria-label={done ? "Mark as not done" : "Mark as done"}
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 hover:border-primary/60"
        )}
      >
        <AnimatePresence>
          {done && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <Check className="size-3" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm",
            done && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", priorityDot[task.priority])} />
          {showProject && task.projectName && <span>{task.projectName}</span>}
          {task.status === "doing" && (
            <Badge
              variant="outline"
              className="border-sky-500/30 bg-sky-500/10 px-1.5 py-0 text-[10px] text-sky-400"
            >
              Doing
            </Badge>
          )}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1",
                overdue && "font-medium text-rose-400"
              )}
            >
              <Calendar className="size-3" />
              {task.dueDate}
              {overdue && " · overdue"}
            </span>
          )}
          {task.estimatedMinutes && <span>~{task.estimatedMinutes}m</span>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
        {!done && (
          <Button
            variant="ghost"
            size="icon-sm"
            title="Start work session on this task"
            onClick={() =>
              startTransition(async () => {
                await startSession({
                  taskId: task.id,
                  projectId: task.projectId,
                  description: task.title,
                });
                toast.success("Session started. Lock in.");
              })
            }
          >
            <Play className="size-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          title={task.today ? "Remove from today" : "Add to today"}
          onClick={() =>
            startTransition(() => setTaskToday(task.id, !task.today))
          }
        >
          <Sun
            className={cn(
              "size-3.5",
              task.today && "fill-amber-400 text-amber-400"
            )}
          />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="size-3.5" /> Edit
            </DropdownMenuItem>
            {task.status !== "doing" && !done && (
              <DropdownMenuItem
                onClick={() =>
                  startTransition(() => setTaskStatus(task.id, "doing"))
                }
              >
                <Play className="size-3.5" /> Mark as doing
              </DropdownMenuItem>
            )}
            {task.status === "doing" && (
              <DropdownMenuItem
                onClick={() =>
                  startTransition(() => setTaskStatus(task.id, "todo"))
                }
              >
                Back to to-do
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() =>
                startTransition(() => setTaskStatus(task.id, "archived"))
              }
            >
              <Archive className="size-3.5" /> Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => startTransition(() => deleteTask(task.id))}
            >
              <Trash2 className="size-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  if (reorderable) {
    return (
      <Reorder.Item
        value={task}
        dragListener={false}
        dragControls={controls}
        className={rowClassName}
      >
        {inner}
      </Reorder.Item>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.18 }}
      className={rowClassName}
    >
      {inner}
    </motion.div>
  );
}

export function TaskList({
  tasks,
  projects,
  showProject = true,
  emptyTitle = "Nothing here",
  emptyDescription,
  showAddButton = false,
  defaultProjectId,
  defaultToday = false,
  reorderable,
  onReorder,
}: {
  tasks: TaskItemData[];
  projects: ProjectOption[];
  showProject?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  showAddButton?: boolean;
  defaultProjectId?: string | null;
  defaultToday?: boolean;
  reorderable?: boolean;
  onReorder?: (ids: string[]) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState<TaskItemData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // manualOrder holds the user's drag order (IDs only); null = use prop order
  const [manualOrder, setManualOrder] = useState<string[] | null>(null);
  const [, startReorderTransition] = useTransition();

  // Derives the displayed list: apply manual order on top of fresh server data.
  // Handles task additions/removals automatically without explicit sync effects.
  const items = useMemo(() => {
    if (!reorderable || !manualOrder) return tasks;
    const byId = new Map(tasks.map((t) => [t.id, t]));
    const ordered = manualOrder.flatMap((id) => {
      const t = byId.get(id);
      return t ? [t] : [];
    });
    const seen = new Set(manualOrder);
    return [...ordered, ...tasks.filter((t) => !seen.has(t.id))];
  }, [tasks, manualOrder, reorderable]);

  function openEdit(task: TaskItemData) {
    setEditing(task);
    setDialogOpen(true);
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function handleReorder(reordered: TaskItemData[]) {
    const ids = reordered.map((t) => t.id);
    setManualOrder(ids);
    if (onReorder) {
      startReorderTransition(() => {
        onReorder(ids);
      });
    }
  }

  return (
    <div>
      {showAddButton && (
        <div className="mb-3">
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="size-3.5" /> Add task
          </Button>
        </div>
      )}
      {items.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : reorderable ? (
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={handleReorder}
          className="space-y-2"
        >
          {items.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              showProject={showProject}
              onEdit={openEdit}
              reorderable
            />
          ))}
        </Reorder.Group>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                showProject={showProject}
                onEdit={openEdit}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projects={projects}
        task={editing}
        defaultProjectId={defaultProjectId}
        defaultToday={defaultToday}
      />
    </div>
  );
}
