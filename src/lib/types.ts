import type { Prisma } from "@/generated/prisma/client";

export type TaskWithRefs = Prisma.TaskGetPayload<{
  include: { project: true; projectArea: true };
}>;

export type SessionWithRefs = Prisma.WorkSessionGetPayload<{
  include: { project: true; task: true };
}>;

export type HabitWithCompletions = Prisma.DailyHabitGetPayload<{
  include: { completions: true };
}>;

export type DumpWithRefs = Prisma.BrainDumpItemGetPayload<{
  include: { project: true; projectArea: true };
}>;

export type ProjectWithAreas = Prisma.ProjectGetPayload<{
  include: { areas: true };
}>;

/** Minimal project shape for select dropdowns (passed into client components). */
export interface ProjectOption {
  id: string;
  name: string;
  areas: { id: string; name: string }[];
}
