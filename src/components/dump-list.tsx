"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArrowRight,
  Brain,
  Inbox,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Sun,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  convertDumpToTask,
  deleteDump,
  setDumpStatus,
  updateDump,
} from "@/app/actions/braindump";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectOption } from "@/lib/types";
import { EmptyState } from "./empty-state";
import { NO_PROJECT, ProjectSelect } from "./quick-add";

export interface DumpItemData {
  id: string;
  title: string;
  notes: string;
  category: string;
  status: string;
  projectId: string | null;
  projectName: string | null;
  createdAt: string; // formatted for display
}

// Mounted fresh on each dialog open, so state initializes straight from props.
function DumpEditForm({
  item,
  projects,
  onDone,
}: {
  item: DumpItemData;
  projects: ProjectOption[];
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes);
  const [category, setCategory] = useState(item.category);
  const [projectId, setProjectId] = useState(item.projectId ?? NO_PROJECT);

  function submit() {
    if (!title.trim()) return;
    startTransition(async () => {
      await updateDump(item.id, {
        title,
        notes,
        category,
        projectId: projectId === NO_PROJECT ? null : projectId,
      });
      toast.success("Idea updated.");
      onDone();
    });
  }

  return (
    <div className="space-y-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Idea"
      />
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder="Notes"
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Content, offer, system…"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Project</Label>
          <ProjectSelect
            projects={projects}
            value={projectId}
            onChange={setProjectId}
          />
        </div>
      </div>
      <Button
        onClick={submit}
        disabled={isPending || !title.trim()}
        className="w-full"
      >
        Save changes
      </Button>
    </div>
  );
}

function DumpEditDialog({
  open,
  onOpenChange,
  item,
  projects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: DumpItemData | null;
  projects: ProjectOption[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit idea</DialogTitle>
        </DialogHeader>
        {item && (
          <DumpEditForm
            key={item.id}
            item={item}
            projects={projects}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DumpRow({
  item,
  onEdit,
}: {
  item: DumpItemData;
  onEdit: (item: DumpItemData) => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.18 }}
      className="group flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm">{item.title}</p>
        {item.notes && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {item.notes}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{item.createdAt}</span>
          {item.category && (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              {item.category}
            </Badge>
          )}
          {item.projectName && <span>{item.projectName}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
        {item.status !== "converted" && item.status !== "archived" && (
          <Button
            variant="ghost"
            size="sm"
            title="Convert to task"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await convertDumpToTask(item.id);
                toast.success("Converted to task.");
              })
            }
          >
            <ListChecks className="size-3.5" /> Task
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Pencil className="size-3.5" /> Edit
            </DropdownMenuItem>
            {item.status !== "converted" && item.status !== "archived" && (
              <DropdownMenuItem
                onClick={() =>
                  startTransition(async () => {
                    await convertDumpToTask(item.id, true);
                    toast.success("Converted — on today's list.");
                  })
                }
              >
                <Sun className="size-3.5" /> Convert for today
              </DropdownMenuItem>
            )}
            {item.status === "inbox" && (
              <DropdownMenuItem
                onClick={() =>
                  startTransition(() => setDumpStatus(item.id, "reviewed"))
                }
              >
                <ArrowRight className="size-3.5" /> Mark reviewed
              </DropdownMenuItem>
            )}
            {item.status !== "inbox" && (
              <DropdownMenuItem
                onClick={() =>
                  startTransition(() => setDumpStatus(item.id, "inbox"))
                }
              >
                <Inbox className="size-3.5" /> Back to inbox
              </DropdownMenuItem>
            )}
            {item.status !== "archived" && (
              <DropdownMenuItem
                onClick={() =>
                  startTransition(() => setDumpStatus(item.id, "archived"))
                }
              >
                <Archive className="size-3.5" /> Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => startTransition(() => deleteDump(item.id))}
            >
              <Trash2 className="size-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

export function DumpList({
  items,
  projects,
  emptyTitle = "Nothing here",
  emptyDescription,
}: {
  items: DumpItemData[];
  projects: ProjectOption[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [editing, setEditing] = useState<DumpItemData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Brain}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <DumpRow
            key={item.id}
            item={item}
            onEdit={(i) => {
              setEditing(i);
              setDialogOpen(true);
            }}
          />
        ))}
      </AnimatePresence>
      <DumpEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        projects={projects}
      />
    </div>
  );
}
