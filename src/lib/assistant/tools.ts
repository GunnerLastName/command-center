/**
 * Assistant tool implementations — pure server-side functions that call Prisma.
 * All "today" logic uses appDateKey/appTodayBounds so the 2 AM rollover is respected.
 * These are called by both the local parser and the Claude API route.
 */

import { prisma } from "@/lib/db";
import { appDateKey, appTodayBounds, zonedDateTime } from "@/lib/dates";
import { getSettings } from "@/lib/queries";
import { revalidateAll } from "@/app/actions/revalidate";
import type { AssistantResult } from "./types";

// ─── helpers ────────────────────────────────────────────────────────────────

async function getRolloverHour(): Promise<number> {
  const s = await getSettings();
  return s.dayRolloverHour ?? 2;
}

function fuzzyMatch(query: string, name: string): boolean {
  return name.toLowerCase().includes(query.toLowerCase().trim());
}

// ─── tasks ──────────────────────────────────────────────────────────────────

export interface CreateTaskInput {
  title: string;
  priority?: "low" | "medium" | "high";
  projectName?: string;
  today?: boolean;
}

export async function toolCreateTask(input: CreateTaskInput): Promise<AssistantResult> {
  const rolloverHour = await getRolloverHour();

  let projectId: string | null = null;
  if (input.projectName) {
    const project = await prisma.project.findFirst({
      where: { status: { not: "archived" } },
      orderBy: { name: "asc" },
    });
    const allProjects = await prisma.project.findMany({
      where: { status: { not: "archived" } },
    });
    const match = allProjects.find((p) => fuzzyMatch(input.projectName!, p.name));
    projectId = match?.id ?? null;
    if (input.projectName && !projectId) {
      return { ok: false, message: `No project found matching "${input.projectName}". Task not created.` };
    }
    void project; // suppress unused warning
  }

  const task = await prisma.task.create({
    data: {
      title: input.title,
      priority: input.priority ?? "medium",
      today: input.today ?? false,
      projectId,
    },
  });
  void task;
  void rolloverHour;
  revalidateAll();

  const where = input.today ? " (added to today)" : "";
  const proj = projectId
    ? ` under ${(await prisma.project.findUnique({ where: { id: projectId } }))?.name ?? "project"}`
    : "";
  return { ok: true, message: `Task added${proj}${where}: "${input.title}"` };
}

export async function toolMarkTaskDone(titleQuery: string): Promise<AssistantResult> {
  const tasks = await prisma.task.findMany({
    where: { status: { in: ["todo", "doing"] } },
  });
  const match = tasks.find((t) => fuzzyMatch(titleQuery, t.title));
  if (!match) {
    return { ok: false, message: `No open task found matching "${titleQuery}".` };
  }
  await prisma.task.update({
    where: { id: match.id },
    data: { status: "done", completedAt: new Date(), today: false },
  });
  revalidateAll();
  return { ok: true, message: `Marked done: "${match.title}"` };
}

export async function toolMarkTaskToday(titleQuery: string): Promise<AssistantResult> {
  const tasks = await prisma.task.findMany({
    where: { status: { in: ["todo", "doing"] }, today: false },
  });
  const match = tasks.find((t) => fuzzyMatch(titleQuery, t.title));
  if (!match) {
    return { ok: false, message: `No task found matching "${titleQuery}" that isn't already on today.` };
  }
  await prisma.task.update({ where: { id: match.id }, data: { today: true } });
  revalidateAll();
  return { ok: true, message: `Moved to today: "${match.title}"` };
}

// ─── habits ─────────────────────────────────────────────────────────────────

export async function toolCheckHabit(nameQuery: string, done: boolean): Promise<AssistantResult> {
  const rolloverHour = await getRolloverHour();
  const todayKey = appDateKey(new Date(), rolloverHour);

  const habits = await prisma.dailyHabit.findMany({ where: { active: true } });
  const match = habits.find((h) => fuzzyMatch(nameQuery, h.name));
  if (!match) {
    return { ok: false, message: `No active habit found matching "${nameQuery}".` };
  }

  const count = done ? (match.timesPerDay ?? 1) : 0;
  const completed = count >= (match.timesPerDay ?? 1);
  await prisma.habitCompletion.upsert({
    where: { habitId_date: { habitId: match.id, date: todayKey } },
    update: { completedCount: count, completed, completedAt: completed ? new Date() : null },
    create: { habitId: match.id, date: todayKey, completedCount: count, completed, completedAt: completed ? new Date() : null },
  });
  revalidateAll();

  const verb = done ? "Checked off" : "Unchecked";
  return { ok: true, message: `${verb}: "${match.name}"` };
}

// ─── work log ────────────────────────────────────────────────────────────────

export interface LogWorkInput {
  minutes: number;
  projectName?: string;
  description?: string;
}

export async function toolLogWork(input: LogWorkInput): Promise<AssistantResult> {
  const rolloverHour = await getRolloverHour();
  const todayKey = appDateKey(new Date(), rolloverHour);

  let projectId: string | null = null;
  if (input.projectName) {
    const allProjects = await prisma.project.findMany({
      where: { status: { not: "archived" } },
    });
    const match = allProjects.find((p) => fuzzyMatch(input.projectName!, p.name));
    if (!match) {
      return { ok: false, message: `No project found matching "${input.projectName}".` };
    }
    projectId = match.id;
  }

  // Log to middle of the operational day so it's clearly timestamped
  const start = zonedDateTime(todayKey, "12:00");
  const end = new Date(start.getTime() + input.minutes * 60_000);
  await prisma.workSession.create({
    data: {
      startTime: start,
      endTime: end,
      durationMinutes: input.minutes,
      projectId,
      description: input.description ?? "",
    },
  });
  revalidateAll();

  const h = Math.floor(input.minutes / 60);
  const m = input.minutes % 60;
  const duration = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
  const proj = projectId
    ? ` for ${(await prisma.project.findUnique({ where: { id: projectId } }))?.name ?? "project"}`
    : "";
  return { ok: true, message: `Logged ${duration}${proj}.` };
}

// ─── brain dump ──────────────────────────────────────────────────────────────

export async function toolCreateBrainDump(title: string): Promise<AssistantResult> {
  await prisma.brainDumpItem.create({ data: { title, status: "inbox" } });
  revalidateAll();
  return { ok: true, message: `Added to brain dump: "${title}"` };
}

// ─── daily review ────────────────────────────────────────────────────────────

export interface WriteReviewInput {
  whatGotDone?: string;
  whatIAvoided?: string;
  biggestWin?: string;
  lesson?: string;
  tomorrowFocus?: string;
  // Freeform text — parser will try to split this
  rawText?: string;
}

export async function toolWriteDailyReview(input: WriteReviewInput): Promise<AssistantResult> {
  const rolloverHour = await getRolloverHour();
  const todayKey = appDateKey(new Date(), rolloverHour);

  // If raw freeform text, use it as whatGotDone (rest blank — user can fill in)
  const data = {
    whatGotDone: input.whatGotDone ?? input.rawText ?? "",
    whatIAvoided: input.whatIAvoided ?? "",
    biggestWin: input.biggestWin ?? "",
    lesson: input.lesson ?? "",
    tomorrowFocus: input.tomorrowFocus ?? "",
  };

  await prisma.dailyReview.upsert({
    where: { date: todayKey },
    update: data,
    create: { date: todayKey, ...data },
  });
  revalidateAll();
  return { ok: true, message: "Daily review saved." };
}

// ─── projects ────────────────────────────────────────────────────────────────

export async function toolUpdateProjectStatus(
  nameQuery: string,
  status: "active" | "paused" | "completed" | "archived" | "idea"
): Promise<AssistantResult> {
  const projects = await prisma.project.findMany({
    where: { status: { not: "archived" } },
  });
  const match = projects.find((p) => fuzzyMatch(nameQuery, p.name));
  if (!match) {
    return { ok: false, message: `No project found matching "${nameQuery}".` };
  }
  await prisma.project.update({
    where: { id: match.id },
    data: { status, ...(status === "completed" ? { completedAt: new Date() } : {}) },
  });
  revalidateAll();
  return { ok: true, message: `Project "${match.name}" marked as ${status}.` };
}

// ─── summary ─────────────────────────────────────────────────────────────────

export async function toolGetSummary(): Promise<AssistantResult> {
  const rolloverHour = await getRolloverHour();
  const todayKey = appDateKey(new Date(), rolloverHour);
  const { start, end } = appTodayBounds(new Date(), rolloverHour);

  const [tasks, habits, minutesRows] = await Promise.all([
    prisma.task.findMany({
      where: { today: true, status: { not: "archived" } },
      include: { project: true },
    }),
    prisma.habitCompletion.findMany({
      where: { date: todayKey, completed: false },
      include: { habit: true },
    }),
    prisma.workSession.findMany({ where: { startTime: { gte: start, lte: end } } }),
  ]);

  const openTasks = tasks.filter((t) => t.status !== "done");
  const workedMinutes = minutesRows.reduce((s, r) => s + r.durationMinutes, 0);
  const h = Math.floor(workedMinutes / 60);
  const m = workedMinutes % 60;
  const workedStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

  const lines: string[] = [`Worked: ${workedStr} today.`];

  if (openTasks.length > 0) {
    const top = openTasks.slice(0, 3).map((t) => `"${t.title}"`).join(", ");
    lines.push(`Open today tasks (${openTasks.length}): ${top}${openTasks.length > 3 ? "…" : ""}.`);
  } else {
    lines.push("No open tasks on today's list.");
  }

  // all_active habits not yet done today
  const allHabits = await prisma.dailyHabit.findMany({ where: { active: true } });
  const completedHabitIds = new Set(
    (await prisma.habitCompletion.findMany({ where: { date: todayKey, completed: true } })).map(
      (c) => c.habitId
    )
  );
  const pendingHabits = allHabits.filter((h) => !completedHabitIds.has(h.id));
  if (pendingHabits.length > 0) {
    lines.push(`Habits left: ${pendingHabits.map((h) => h.name).join(", ")}.`);
  }

  void habits; // used indirectly above
  return { ok: true, message: lines.join(" ") };
}
