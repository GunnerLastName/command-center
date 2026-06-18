"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseDateKey } from "@/lib/dates";
import { PRIORITIES, TASK_STATUSES } from "@/lib/labels";
import { revalidateAll } from "./revalidate";

const taskInput = z.object({
  title: z.string().trim().min(1, "Title is required"),
  notes: z.string().default(""),
  status: z.enum(TASK_STATUSES).default("todo"),
  priority: z.enum(PRIORITIES).default("medium"),
  projectId: z.string().nullable().default(null),
  projectAreaId: z.string().nullable().default(null),
  dueDate: z.string().nullable().default(null), // "yyyy-MM-dd" or null
  estimatedMinutes: z.number().int().positive().nullable().default(null),
  today: z.boolean().default(false),
});

function toDueDate(value: string | null): Date | null {
  return value ? parseDateKey(value) : null;
}

export async function createTask(input: unknown) {
  const data = taskInput.parse(input);
  const task = await prisma.task.create({
    data: {
      ...data,
      dueDate: toDueDate(data.dueDate),
      completedAt: data.status === "done" ? new Date() : null,
    },
  });
  revalidateAll();
  return task.id;
}

export async function updateTask(id: string, input: unknown) {
  const data = taskInput.partial().parse(input);
  await prisma.task.update({
    where: { id },
    data: {
      ...data,
      ...(data.dueDate !== undefined ? { dueDate: toDueDate(data.dueDate) } : {}),
      ...(data.status !== undefined
        ? { completedAt: data.status === "done" ? new Date() : null }
        : {}),
    },
  });
  revalidateAll();
}

export async function setTaskStatus(id: string, status: string) {
  const parsed = z.enum(TASK_STATUSES).parse(status);
  await prisma.task.update({
    where: { id },
    data: {
      status: parsed,
      completedAt: parsed === "done" ? new Date() : null,
    },
  });
  revalidateAll();
}

export async function setTaskToday(id: string, today: boolean) {
  await prisma.task.update({ where: { id }, data: { today } });
  revalidateAll();
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
  revalidateAll();
}

export async function reorderProjectTasks(ids: string[]) {
  await prisma.$transaction(
    ids.map((id, i) => prisma.task.update({ where: { id }, data: { sortOrder: i + 1 } }))
  );
  revalidateAll();
}

export async function reorderTodayTasks(ids: string[]) {
  await prisma.$transaction(
    ids.map((id, i) => prisma.task.update({ where: { id }, data: { todaySortOrder: i + 1 } }))
  );
  revalidateAll();
}
