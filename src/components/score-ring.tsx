"use client";

import { motion } from "framer-motion";
import { scoreMessage } from "@/lib/scoring";
import { cn } from "@/lib/utils";

function scoreColor(score: number): string {
  if (score >= 90) return "stroke-emerald-300";
  if (score >= 75) return "stroke-emerald-400";
  if (score >= 50) return "stroke-sky-400";
  if (score >= 25) return "stroke-amber-400";
  return "stroke-rose-400";
}

export function ScoreRing({
  score,
  size = 140,
  className,
}: {
  score: number;
  size?: number;
  className?: string;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={cn("relative flex flex-col items-center", className)}
      style={{ width: size }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="7"
          className="stroke-muted"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          className={scoreColor(score)}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference * (1 - score / 100),
          }}
          transition={{ type: "spring", stiffness: 50, damping: 18 }}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums">{score}%</span>
        <span className="mt-0.5 text-xs text-muted-foreground">
          {scoreMessage(score)}
        </span>
      </div>
    </div>
  );
}
