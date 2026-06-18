"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { revalidateAll } from "./revalidate";

/** Increment/decrement progress for a habit on a given date. */
export async function setHabitProgress(
  habitId: string,
  date: string,
  count: number
) {
  const habit = await prisma.dailyHabit.findUniqueOrThrow({
    where: { id: habitId },
    select: { timesPerDay: true },
  });
  const clamped = Math.max(0, Math.min(count, habit.timesPerDay));
  const completed = clamped >= habit.timesPerDay;
  await prisma.habitCompletion.upsert({
    where: { habitId_date: { habitId, date } },
    update: { completedCount: clamped, completed, completedAt: completed ? new Date() : null },
    create: {
      habitId,
      date,
      completedCount: clamped,
      completed,
      completedAt: completed ? new Date() : null,
    },
  });
  revalidateAll();
}

/** Toggle for 1x habits (backwards-compatible). */
export async function setHabitDone(
  habitId: string,
  date: string,
  done: boolean
) {
  const habit = await prisma.dailyHabit.findUniqueOrThrow({
    where: { id: habitId },
    select: { timesPerDay: true },
  });
  await setHabitProgress(habitId, date, done ? habit.timesPerDay : 0);
}

const habitInput = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().default(""),
  category: z.string().default(""),
  points: z.number().int().min(1).max(10).default(1),
  active: z.boolean().default(true),
  scheduleDays: z.string().default("1,2,3,4,5,6,7"),
  timesPerDay: z.number().int().min(1).max(10).default(1),
});

export async function createHabit(input: unknown) {
  const data = habitInput.parse(input);
  const last = await prisma.dailyHabit.findFirst({
    orderBy: { sortOrder: "desc" },
  });
  await prisma.dailyHabit.create({
    data: { ...data, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
  revalidateAll();
}

export async function updateHabit(id: string, input: unknown) {
  const data = habitInput.partial().parse(input);
  await prisma.dailyHabit.update({ where: { id }, data });
  revalidateAll();
}

export async function deleteHabit(id: string) {
  await prisma.dailyHabit.delete({ where: { id } });
  revalidateAll();
}

export async function reorderHabits(ids: string[]) {
  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.dailyHabit.update({ where: { id }, data: { sortOrder: i } })
    )
  );
  revalidateAll();
}
