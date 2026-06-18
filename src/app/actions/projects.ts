"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseDateKey } from "@/lib/dates";
import { PRIORITIES, PROJECT_STATUSES } from "@/lib/labels";
import { revalidateAll } from "./revalidate";

const projectInput = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().default(""),
  category: z.string().default(""),
  status: z.enum(PROJECT_STATUSES).default("active"),
  priority: z.enum(PRIORITIES).default("medium"),
  mainGoal: z.string().default(""),
  currentBottleneck: z.string().default(""),
  nextBestAction: z.string().default(""),
  deadline: z.string().nullable().default(null), // "yyyy-MM-dd" or null
  progressPercent: z.number().int().min(0).max(100).default(0),
  notes: z.string().default(""),
});

function toDeadline(value: string | null): Date | null {
  return value ? parseDateKey(value) : null;
}

export async function createProject(input: unknown) {
  const data = projectInput.parse(input);
  const project = await prisma.project.create({
    data: { ...data, deadline: toDeadline(data.deadline) },
  });
  revalidateAll();
  return project.id;
}

export async function updateProject(id: string, input: unknown) {
  const data = projectInput.partial().parse(input);
  await prisma.project.update({
    where: { id },
    data: {
      ...data,
      ...(data.deadline !== undefined
        ? { deadline: toDeadline(data.deadline) }
        : {}),
    },
  });
  revalidateAll();
}

export async function setProjectStatus(id: string, status: string) {
  await prisma.project.update({
    where: { id },
    data: { status: z.enum(PROJECT_STATUSES).parse(status) },
  });
  revalidateAll();
}

export async function saveProjectNotes(id: string, notes: string) {
  await prisma.project.update({ where: { id }, data: { notes } });
  revalidateAll();
}

export async function finishProject(id: string, archiveOpenTasks: boolean) {
  await prisma.project.update({
    where: { id },
    data: { status: "completed", completedAt: new Date() },
  });
  if (archiveOpenTasks) {
    await prisma.task.updateMany({
      where: { projectId: id, status: { in: ["todo", "doing"] } },
      data: { status: "archived", today: false },
    });
  }
  revalidateAll();
}

export async function reopenProject(id: string) {
  await prisma.project.update({
    where: { id },
    data: { status: "active", completedAt: null },
  });
  revalidateAll();
}

const areaInput = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().default(""),
  status: z.string().default("active"),
});

export async function createArea(projectId: string, input: unknown) {
  const data = areaInput.parse(input);
  const last = await prisma.projectArea.findFirst({
    where: { projectId },
    orderBy: { sortOrder: "desc" },
  });
  await prisma.projectArea.create({
    data: { ...data, projectId, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
  revalidateAll();
}

export async function updateArea(id: string, input: unknown) {
  const data = areaInput.partial().parse(input);
  await prisma.projectArea.update({ where: { id }, data });
  revalidateAll();
}

export async function deleteArea(id: string) {
  await prisma.projectArea.delete({ where: { id } });
  revalidateAll();
}
