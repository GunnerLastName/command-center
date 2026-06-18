"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { zonedDateTime } from "@/lib/dates";
import { revalidateAll } from "./revalidate";

async function stopActiveSessions(now: Date) {
  const active = await prisma.workSession.findMany({
    where: { endTime: null },
  });
  for (const s of active) {
    await prisma.workSession.update({
      where: { id: s.id },
      data: {
        endTime: now,
        durationMinutes: Math.max(
          0,
          Math.round((now.getTime() - s.startTime.getTime()) / 60_000)
        ),
      },
    });
  }
}

const startInput = z.object({
  projectId: z.string().nullable().default(null),
  taskId: z.string().nullable().default(null),
  description: z.string().default(""),
});

/** Starts the timer. Any session still running is stopped first. */
export async function startSession(input: unknown) {
  const data = startInput.parse(input);
  const now = new Date();
  await stopActiveSessions(now);
  await prisma.workSession.create({
    data: { ...data, startTime: now },
  });
  revalidateAll();
}

export async function stopSession() {
  await stopActiveSessions(new Date());
  revalidateAll();
}

const manualInput = z.object({
  date: z.string().min(1), // "yyyy-MM-dd"
  startTime: z.string().default("12:00"), // "HH:mm"
  durationMinutes: z.number().int().positive(),
  projectId: z.string().nullable().default(null),
  taskId: z.string().nullable().default(null),
  description: z.string().default(""),
});

export async function createManualSession(input: unknown) {
  const data = manualInput.parse(input);
  const start = zonedDateTime(data.date, data.startTime);
  const end = new Date(start.getTime() + data.durationMinutes * 60_000);
  await prisma.workSession.create({
    data: {
      projectId: data.projectId,
      taskId: data.taskId,
      description: data.description,
      startTime: start,
      endTime: end,
      durationMinutes: data.durationMinutes,
    },
  });
  revalidateAll();
}

/** Edit a finished session — same fields as manual entry. */
export async function updateSession(id: string, input: unknown) {
  const data = manualInput.parse(input);
  const start = zonedDateTime(data.date, data.startTime);
  const end = new Date(start.getTime() + data.durationMinutes * 60_000);
  await prisma.workSession.update({
    where: { id },
    data: {
      projectId: data.projectId,
      taskId: data.taskId,
      description: data.description,
      startTime: start,
      endTime: end,
      durationMinutes: data.durationMinutes,
    },
  });
  revalidateAll();
}

export async function deleteSession(id: string) {
  await prisma.workSession.delete({ where: { id } });
  revalidateAll();
}
