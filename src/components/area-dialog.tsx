"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createArea, deleteArea, updateArea } from "@/app/actions/projects";
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

export interface AreaCardData {
  id: string;
  name: string;
  description: string;
  openTasks: number;
  ideas: number;
}

// Mounted fresh on each dialog open, so state initializes straight from props.
function AreaForm({
  projectId,
  area,
  onDone,
}: {
  projectId: string;
  area?: AreaCardData | null;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(area?.name ?? "");
  const [description, setDescription] = useState(area?.description ?? "");

  function submit() {
    if (!name.trim()) return;
    startTransition(async () => {
      if (area) {
        await updateArea(area.id, { name, description });
        toast.success("Area updated.");
      } else {
        await createArea(projectId, { name, description });
        toast.success("Area added.");
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
          placeholder="Area name"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Notes</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What this piece is about (optional)"
        />
      </div>
      <Button
        onClick={submit}
        disabled={isPending || !name.trim()}
        className="w-full"
      >
        {area ? "Save changes" : "Add area"}
      </Button>
    </div>
  );
}

function AreaDialog({
  open,
  onOpenChange,
  projectId,
  area,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  area?: AreaCardData | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{area ? "Edit area" : "New area"}</DialogTitle>
        </DialogHeader>
        <AreaForm
          key={area?.id ?? "new"}
          projectId={projectId}
          area={area}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function AreaGrid({
  projectId,
  areas,
}: {
  projectId: string;
  areas: AreaCardData[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AreaCardData | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <div
            key={area.id}
            className="group relative rounded-lg border border-border bg-card p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{area.name}</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  >
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(area);
                      setDialogOpen(true);
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteArea(area.id);
                        toast.success("Area removed.");
                      })
                    }
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {area.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {area.description}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {area.openTasks} open task{area.openTasks === 1 ? "" : "s"} ·{" "}
              {area.ideas} idea{area.ideas === 1 ? "" : "s"}
            </p>
          </div>
        ))}
        <button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="flex min-h-24 items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:text-foreground"
        >
          <Plus className="size-4" /> Add area
        </button>
      </div>
      <AreaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        area={editing}
      />
    </div>
  );
}
