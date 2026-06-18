"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Hours-worked bar scaled from 0 to the stretch goal, with markers at the
 * minimum and stretch targets.
 */
export function WorkProgress({
  minutes,
  minimumHours,
  stretchHours,
  className,
}: {
  minutes: number;
  minimumHours: number;
  stretchHours: number;
  className?: string;
}) {
  const hours = minutes / 60;
  const stretch = Math.max(stretchHours, minimumHours, 1);
  const fillPercent = Math.min((hours / stretch) * 100, 100);
  const minPercent = (minimumHours / stretch) * 100;

  const hitMinimum = hours >= minimumHours;
  const hitStretch = hours >= stretchHours;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="relative h-3 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn(
            "h-full rounded-full",
            hitStretch
              ? "bg-primary"
              : hitMinimum
                ? "bg-primary"
                : "bg-primary/60"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${fillPercent}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
        />
        {/* minimum marker */}
        <div
          className="absolute inset-y-0 w-px bg-foreground/40"
          style={{ left: `${minPercent}%` }}
        />
      </div>
      <div className="relative flex h-4 text-[11px] text-muted-foreground">
        <span
          className={cn(
            "absolute -translate-x-1/2",
            hitMinimum && "font-medium text-primary"
          )}
          style={{ left: `${minPercent}%` }}
        >
          {minimumHours}h min
        </span>
        <span
          className={cn(
            "absolute right-0",
            hitStretch && "font-medium text-primary"
          )}
        >
          {stretchHours}h stretch
        </span>
      </div>
    </div>
  );
}
