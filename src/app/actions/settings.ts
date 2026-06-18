"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { revalidateAll } from "./revalidate";

const settingsInput = z.object({
  dailyMinimumHours: z.number().min(0).max(24),
  dailyStretchHours: z.number().min(0).max(24),
  workScoreWeight: z.number().int().min(0).max(100),
  habitsScoreWeight: z.number().int().min(0).max(100),
  tasksScoreWeight: z.number().int().min(0).max(100),
  reviewScoreWeight: z.number().int().min(0).max(100),
  theme: z.string(),
  userName: z.string().min(1),
  dashboardWidgets: z.string(),
  keyboardShortcuts: z.string(),
  dayRolloverHour: z.number().int().min(0).max(12),
});

export async function updateSettings(input: unknown) {
  const data = settingsInput.partial().parse(input);
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
  revalidateAll();
}
