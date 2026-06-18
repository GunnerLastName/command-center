"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isValidDateKey } from "@/lib/dates";
import { revalidateAll } from "./revalidate";

const dailyReviewInput = z.object({
  whatGotDone: z.string().default(""),
  whatIAvoided: z.string().default(""),
  biggestWin: z.string().default(""),
  lesson: z.string().default(""),
  tomorrowFocus: z.string().default(""),
});

export async function saveDailyReview(date: string, input: unknown) {
  const data = dailyReviewInput.parse(input);
  await prisma.dailyReview.upsert({
    where: { date },
    update: data,
    create: { date, ...data },
  });
  revalidateAll();
}

/** Move a daily review to a different date key. Redirects to the new date. */
export async function moveDailyReview(oldDate: string, newDate: string) {
  if (!isValidDateKey(newDate)) throw new Error("Invalid date.");
  const conflict = await prisma.dailyReview.findUnique({ where: { date: newDate } });
  if (conflict) throw new Error(`A review for ${newDate} already exists.`);
  await prisma.dailyReview.update({ where: { date: oldDate }, data: { date: newDate } });
  revalidateAll();
  redirect(`/daily-review?date=${newDate}`);
}

const weeklyReviewInput = z.object({
  whatWorked: z.string().default(""),
  whatToFix: z.string().default(""),
  nextWeekFocus: z.string().default(""),
  notes: z.string().default(""),
});

export async function saveWeeklyReview(weekStart: string, input: unknown) {
  if (!isValidDateKey(weekStart)) throw new Error("Invalid week start.");
  const data = weeklyReviewInput.parse(input);
  await prisma.weeklyReview.upsert({
    where: { weekStart },
    update: data,
    create: { weekStart, ...data },
  });
  revalidateAll();
}
