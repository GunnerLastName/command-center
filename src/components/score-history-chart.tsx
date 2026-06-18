"use client";

import { motion } from "framer-motion";
import { formatDateKey } from "@/lib/dates";
import { scoreMessage } from "@/lib/scoring";

export interface DayScorePoint {
  date: string; // "yyyy-MM-dd"
  score: number;
  workedMinutes: number;
}

function dotColor(score: number): string {
  if (score >= 90) return "fill-emerald-300";
  if (score >= 75) return "fill-emerald-400";
  if (score >= 50) return "fill-sky-400";
  if (score >= 25) return "fill-amber-400";
  return "fill-rose-400";
}

const W = 560;
const H = 150;
const PAD_X = 14;
const PAD_TOP = 14;
const PAD_BOTTOM = 28;

/** Simple SVG line chart of recent daily scores. */
export function ScoreHistoryChart({ points }: { points: DayScorePoint[] }) {
  if (points.length < 2) return null;

  const x = (i: number) =>
    PAD_X + (i / (points.length - 1)) * (W - PAD_X * 2);
  const y = (score: number) =>
    PAD_TOP + (1 - score / 100) * (H - PAD_TOP - PAD_BOTTOM);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Daily score history"
    >
      {/* reference lines at 75% (minimum) and 90% (strong) */}
      {[75, 90].map((mark) => (
        <g key={mark}>
          <line
            x1={PAD_X}
            x2={W - PAD_X}
            y1={y(mark)}
            y2={y(mark)}
            className="stroke-border"
            strokeDasharray="3 5"
            strokeWidth="1"
          />
          <text
            x={W - PAD_X}
            y={y(mark) - 4}
            textAnchor="end"
            className="fill-muted-foreground text-[9px]"
          >
            {mark}
          </text>
        </g>
      ))}

      <motion.path
        d={path}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-muted-foreground/70"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />

      {points.map((p, i) => {
        return (
          <g key={p.date}>
            <circle cx={x(i)} cy={y(p.score)} r="4" className={dotColor(p.score)}>
              <title>
                {`${formatDateKey(p.date, "EEE MMM d")} — ${p.score}% (${scoreMessage(p.score)}), ${(p.workedMinutes / 60).toFixed(1)}h worked`}
              </title>
            </circle>
            <text
              x={x(i)}
              y={H - 12}
              textAnchor="middle"
              className={
                i === points.length - 1
                  ? "fill-foreground text-[9px] font-semibold"
                  : "fill-muted-foreground text-[9px]"
              }
            >
              {formatDateKey(p.date, "EEEEE")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
