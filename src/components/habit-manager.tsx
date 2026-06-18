"use client";

import { useState, useTransition } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createHabit, deleteHabit, reorderHabits, updateHabit } from "@/app/actions/habits";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface HabitManagerItem {
  id: string;
  name: string;
  description: string;
  category: string;
  points: number;
  active: boolean;
  scheduleDays: string;
  timesPerDay: number;
}

const ALL_DAYS = "1,2,3,4,5,6,7";
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NUMS = [1, 2, 3, 4, 5, 6, 7];

function scheduleLabel(scheduleDays: string | null | undefined, timesPerDay: number): string {
  const days = (scheduleDays || "1,2,3,4,5,6,7").split(",").map(Number).filter((n) => n >= 1 && n <= 7);
  const dayPart = days.length === 7 ? "Every day" : days.map((d) => DAY_LABELS[d - 1]).join(" ");
  const timePart = timesPerDay > 1 ? ` · ${timesPerDay}x` : "";
  return dayPart + timePart;
}

// Mounted fresh on each dialog open, so state initializes straight from props.
function HabitForm({
  habit,
  onDone,
}: {
  habit: HabitManagerItem | null;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(habit?.name ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [category, setCategory] = useState(habit?.category ?? "");
  const [points, setPoints] = useState(String(habit?.points ?? 1));
  const [timesPerDay, setTimesPerDay] = useState(String(habit?.timesPerDay ?? 1));
  const [selectedDays, setSelectedDays] = useState<number[]>(
    (habit?.scheduleDays ?? ALL_DAYS).split(",").map(Number)
  );

  function toggleDay(d: number) {
    setSelectedDays((prev) => {
      if (prev.includes(d)) {
        const next = prev.filter((x) => x !== d);
        return next.length === 0 ? prev : next; // at least one day required
      }
      return [...prev, d].sort((a, b) => a - b);
    });
  }

  function setAllDays() {
    setSelectedDays([1, 2, 3, 4, 5, 6, 7]);
  }

  function submit() {
    if (!name.trim()) return;
    const payload = {
      name,
      description,
      category,
      points: Math.min(10, Math.max(1, Math.round(Number(points) || 1))),
      timesPerDay: Math.min(10, Math.max(1, Math.round(Number(timesPerDay) || 1))),
      scheduleDays: selectedDays.sort((a, b) => a - b).join(","),
    };
    startTransition(async () => {
      if (habit) {
        await updateHabit(habit.id, payload);
        toast.success("Habit updated.");
      } else {
        await createHabit(payload);
        toast.success("Habit added.");
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
          placeholder="Read Bible"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Description (optional)</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Faith, health…"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Points</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Days</Label>
          {selectedDays.length < 7 && (
            <button
              type="button"
              onClick={setAllDays}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Every day
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {DAY_NUMS.map((d, i) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={cn(
                "flex size-8 items-center justify-center rounded text-xs font-medium transition-colors",
                selectedDays.includes(d)
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {DAY_LABELS[i]}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Times per day</Label>
        <Input
          type="number"
          min={1}
          max={10}
          value={timesPerDay}
          onChange={(e) => setTimesPerDay(e.target.value)}
        />
      </div>
      <Button
        onClick={submit}
        disabled={isPending || !name.trim()}
        className="w-full"
      >
        {habit ? "Save changes" : "Add habit"}
      </Button>
    </div>
  );
}

function HabitDialog({
  open,
  onOpenChange,
  habit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: HabitManagerItem | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{habit ? "Edit habit" : "New habit"}</DialogTitle>
        </DialogHeader>
        <HabitForm
          key={habit?.id ?? "new"}
          habit={habit}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function HabitRow({
  habit,
  onEdit,
}: {
  habit: HabitManagerItem;
  onEdit: (h: HabitManagerItem) => void;
}) {
  const controls = useDragControls();
  const [, startTransition] = useTransition();

  return (
    <Reorder.Item
      value={habit}
      dragListener={false}
      dragControls={controls}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5",
        !habit.active && "opacity-50"
      )}
    >
      <button
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{habit.name}</p>
        <p className="text-xs text-muted-foreground">
          {[
            habit.category,
            `${habit.points} pt${habit.points === 1 ? "" : "s"}`,
            scheduleLabel(habit.scheduleDays, habit.timesPerDay),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <Switch
        checked={habit.active}
        onCheckedChange={(active) =>
          startTransition(() => updateHabit(habit.id, { active }))
        }
        aria-label={habit.active ? "Deactivate habit" : "Activate habit"}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(habit)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                await deleteHabit(habit.id);
                toast.success("Habit deleted.");
              })
            }
          >
            <Trash2 className="size-3.5" /> Delete (removes history)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Reorder.Item>
  );
}

export function HabitManager({ habits: initial }: { habits: HabitManagerItem[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HabitManagerItem | null>(null);
  const [items, setItems] = useState(initial);
  const [, startTransition] = useTransition();

  function handleReorder(reordered: HabitManagerItem[]) {
    setItems(reordered);
    startTransition(() => reorderHabits(reordered.map((h) => h.id)));
  }

  return (
    <div className="space-y-2">
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={handleReorder}
        className="space-y-2"
      >
        {items.map((h) => (
          <HabitRow
            key={h.id}
            habit={h}
            onEdit={(habit) => {
              setEditing(habit);
              setDialogOpen(true);
            }}
          />
        ))}
      </Reorder.Group>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      >
        <Plus className="size-3.5" /> Add habit
      </Button>
      <HabitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        habit={editing}
      />
    </div>
  );
}
