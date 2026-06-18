"use client";

import { useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { toast } from "sonner";
import { setHabitProgress } from "@/app/actions/habits";
import { cn } from "@/lib/utils";

export interface HabitItemData {
  id: string;
  name: string;
  description: string;
  category: string;
  points: number;
  timesPerDay: number;
  completedCount: number;
  done: boolean;
}

function HabitRow({ habit, dateKey }: { habit: HabitItemData; dateKey: string }) {
  const [isPending, startTransition] = useTransition();
  const isMulti = habit.timesPerDay > 1;
  const count = habit.completedCount;

  function increment() {
    const next = count >= habit.timesPerDay ? 0 : count + 1;
    startTransition(async () => {
      await setHabitProgress(habit.id, dateKey, next);
      if (next === habit.timesPerDay) toast.success(`${habit.name} — done.`);
    });
  }

  function decrement(e: React.MouseEvent) {
    e.stopPropagation();
    if (count === 0) return;
    startTransition(async () => {
      await setHabitProgress(habit.id, dateKey, count - 1);
    });
  }

  return (
    <motion.div
      layout
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg border px-3 py-3 transition-colors",
        habit.done
          ? "border-primary/30 bg-primary/10"
          : "border-border bg-card"
      )}
    >
      <button
        onClick={increment}
        disabled={isPending}
        className="flex items-center gap-3 min-w-0 flex-1 text-left"
      >
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
            habit.done
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40"
          )}
        >
          <AnimatePresence>
            {habit.done && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
              >
                <Check className="size-3.5" strokeWidth={3} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-sm font-medium",
              habit.done && "text-primary"
            )}
          >
            {habit.name}
          </span>
          {(habit.description || habit.category) && (
            <span className="block truncate text-xs text-muted-foreground">
              {habit.description || habit.category}
            </span>
          )}
        </span>
        {isMulti && (
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="flex gap-0.5">
              {Array.from({ length: habit.timesPerDay }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "size-1.5 rounded-full transition-colors",
                    i < count ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {count}/{habit.timesPerDay}
            </span>
          </span>
        )}
        {!isMulti && habit.points > 1 && (
          <span className="text-xs text-muted-foreground shrink-0">{habit.points} pts</span>
        )}
      </button>
      {isMulti && count > 0 && (
        <button
          onClick={decrement}
          disabled={isPending}
          className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
          aria-label="Decrement"
        >
          <Minus className="size-3" />
        </button>
      )}
    </motion.div>
  );
}

export function HabitChecklist({
  habits,
  dateKey,
}: {
  habits: HabitItemData[];
  dateKey: string;
}) {
  return (
    <div className="space-y-2">
      {habits.map((h) => (
        <HabitRow key={h.id} habit={h} dateKey={dateKey} />
      ))}
    </div>
  );
}
