"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { DUMP_STATUSES } from "@/lib/labels";
import { revalidateAll } from "./revalidate";

const dumpInput = z.object({
  title: z.string().trim().min(1, "Title is required"),
  notes: z.string().default(""),
  category: z.string().default(""),
  projectId: z.string().nullable().default(null),
  projectAreaId: z.string().nullable().default(null),
  status: z.enum(DUMP_STATUSES).default("inbox"),
});

export async function createDump(input: unknown) {
  const data = dumpInput.parse(input);
  await prisma.brainDumpItem.create({ data });
  revalidateAll();
}

export async function updateDump(id: string, input: unknown) {
  const data = dumpInput.partial().parse(input);
  await prisma.brainDumpItem.update({ where: { id }, data });
  revalidateAll();
}

export async function setDumpStatus(id: string, status: string) {
  await prisma.brainDumpItem.update({
    where: { id },
    data: { status: z.enum(DUMP_STATUSES).parse(status) },
  });
  revalidateAll();
}

export async function deleteDump(id: string) {
  await prisma.brainDumpItem.delete({ where: { id } });
  revalidateAll();
}

/** Turn an idea into a task and mark the idea converted. */
export async function convertDumpToTask(id: string, today: boolean = false) {
  const dump = await prisma.brainDumpItem.findUniqueOrThrow({ where: { id } });
  await prisma.$transaction([
    prisma.task.create({
      data: {
        title: dump.title,
        notes: dump.notes,
        projectId: dump.projectId,
        projectAreaId: dump.projectAreaId,
        today,
      },
    }),
    prisma.brainDumpItem.update({
      where: { id },
      data: { status: "converted" },
    }),
  ]);
  revalidateAll();
}
