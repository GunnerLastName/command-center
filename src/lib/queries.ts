import { prisma } from "./db";
import {
  addDaysToKey,
  appDateKey,
  appTodayBounds,
  dayBounds,
  isoDayOf,
  parseDateKey,
  weekBounds,
} from "./dates";
import { computeDailyScore, type ScoreBreakdown } from "./scoring";
import type { ProjectOption } from "./types";

export async function getSettings() {
  return prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

/** Minutes for a session — live-counting if it's still running. */
export function liveSessionMinutes(
  session: { startTime: Date; endTime: Date | null; durationMinutes: number },
  now: Date = new Date()
): number {
  return session.endTime
    ? session.durationMinutes
    : Math.max(0, Math.round((now.getTime() - session.startTime.getTime()) / 60_000));
}

export async function getWorkedMinutes(
  start: Date,
  end: Date,
  projectId?: string
): Promise<number> {
  const sessions = await prisma.workSession.findMany({
    where: { startTime: { gte: start, lte: end }, ...(projectId ? { projectId } : {}) },
  });
  const now = new Date();
  return sessions.reduce((sum, s) => sum + liveSessionMinutes(s, now), 0);
}

export async function getActiveSession(rolloverHour = 2) {
  const { start: todayStart } = appTodayBounds(new Date(), rolloverHour);

  // A timer forgotten overnight would otherwise credit unbounded hours to the
  // start day. Close any session from a previous operational day at that day's
  // end, capped at 12h, so today's numbers stay honest.
  const stale = await prisma.workSession.findMany({
    where: { endTime: null, startTime: { lt: todayStart } },
  });
  for (const s of stale) {
    const end = dayBounds(s.startTime).end;
    const minutes = Math.min(
      Math.max(0, Math.round((end.getTime() - s.startTime.getTime()) / 60_000)),
      12 * 60
    );
    await prisma.workSession.update({
      where: { id: s.id },
      data: { endTime: end, durationMinutes: minutes },
    });
  }

  return prisma.workSession.findFirst({
    where: { endTime: null },
    include: { project: true, task: true },
    orderBy: { startTime: "desc" },
  });
}

export async function getProjectOptions(): Promise<ProjectOption[]> {
  const projects = await prisma.project.findMany({
    where: { status: { not: "archived" } },
    orderBy: { name: "asc" },
    include: { areas: { orderBy: { sortOrder: "asc" } } },
  });
  const order: Record<string, number> = { active: 0, idea: 1, paused: 2, completed: 3 };
  projects.sort((a, b) => (order[a.status] ?? 4) - (order[b.status] ?? 4));
  return projects.map((p) => ({
    id: p.id,
    name: p.status === "completed" ? `${p.name} (completed)` : p.name,
    areas: p.areas.map((a) => ({ id: a.id, name: a.name })),
  }));
}

export interface ProjectWeekStats {
  openCount: number;
  doneThisWeek: number;
  weekProgress: number | null;
}

export async function getProjectWeekStats(): Promise<Map<string, ProjectWeekStats>> {
  const { start, end } = weekBounds();
  const [openRows, doneRows] = await Promise.all([
    prisma.task.groupBy({
      by: ["projectId"],
      where: { status: { in: ["todo", "doing"] }, projectId: { not: null } },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ["projectId"],
      where: {
        status: "done",
        completedAt: { gte: start, lte: end },
        projectId: { not: null },
      },
      _count: { _all: true },
    }),
  ]);

  const result = new Map<string, ProjectWeekStats>();
  const allIds = new Set([
    ...openRows.map((r) => r.projectId!),
    ...doneRows.map((r) => r.projectId!),
  ]);
  for (const id of allIds) {
    const open = openRows.find((r) => r.projectId === id)?._count._all ?? 0;
    const done = doneRows.find((r) => r.projectId === id)?._count._all ?? 0;
    const total = open + done;
    result.set(id, { openCount: open, doneThisWeek: done, weekProgress: total > 0 ? done / total : null });
  }
  return result;
}

const DEFAULT_SCHEDULE = "1,2,3,4,5,6,7";

function parseScheduleDays(scheduleDays: string | null | undefined): number[] {
  return (scheduleDays || DEFAULT_SCHEDULE).split(",").map(Number);
}

export async function getHabitsForDate(key: string) {
  const dayOfWeek = isoDayOf(key);
  const habits = await prisma.dailyHabit.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: { completions: { where: { date: key } } },
  });
  return habits.filter((h) => parseScheduleDays(h.scheduleDays).includes(dayOfWeek));
}

export interface TodayStandards {
  settings: Awaited<ReturnType<typeof getSettings>>;
  todayKey: string;
  workedMinutes: number;
  habits: Awaited<ReturnType<typeof getHabitsForDate>>;
  habitPointsDone: number;
  habitPointsTotal: number;
  todayTasksDone: number;
  todayTasksTotal: number;
  reviewDone: boolean;
  breakdown: ScoreBreakdown;
}

export async function isReviewDone(key: string): Promise<boolean> {
  const review = await prisma.dailyReview.findUnique({ where: { date: key } });
  if (!review) return false;
  return [
    review.whatGotDone,
    review.whatIAvoided,
    review.biggestWin,
    review.lesson,
    review.tomorrowFocus,
  ].some((v) => v.trim() !== "");
}

export async function getTodayStandards(): Promise<TodayStandards> {
  // Load settings first so we can apply the day rollover hour.
  const settings = await getSettings();
  const rolloverHour = settings.dayRolloverHour ?? 2;
  const now = new Date();
  const key = appDateKey(now, rolloverHour);
  const { start, end } = appTodayBounds(now, rolloverHour);

  // Rollover: tasks finished on a previous operational day drop off today's
  // list so yesterday's wins can't inflate today's score.
  await prisma.task.updateMany({
    where: { today: true, status: "done", completedAt: { lt: start } },
    data: { today: false },
  });

  const [workedMinutes, habits, todayTasks, reviewDone] =
    await Promise.all([
      getWorkedMinutes(start, end),
      getHabitsForDate(key),
      prisma.task.findMany({
        where: { today: true, status: { not: "archived" } },
      }),
      isReviewDone(key),
    ]);

  const habitPointsTotal = habits.reduce((s, h) => s + h.points, 0);
  const habitPointsDone = habits.reduce((s, h) => {
    const tpd = h.timesPerDay ?? 1;
    const count = h.completions[0]?.completedCount ?? 0;
    return s + (Math.min(count, tpd) / tpd) * h.points;
  }, 0);

  const todayTasksTotal = todayTasks.length;
  const todayTasksDone = todayTasks.filter((t) => t.status === "done").length;

  const breakdown = computeDailyScore(settings, {
    workedMinutes,
    minimumHours: settings.dailyMinimumHours,
    stretchHours: settings.dailyStretchHours,
    habitPointsDone,
    habitPointsTotal,
    todayTasksDone,
    todayTasksTotal,
    reviewDone,
  });

  return {
    settings,
    todayKey: key,
    workedMinutes,
    habits,
    habitPointsDone,
    habitPointsTotal,
    todayTasksDone,
    todayTasksTotal,
    reviewDone,
    breakdown,
  };
}

export async function getWeekWorkedMinutes(): Promise<number> {
  const { start, end } = weekBounds();
  return getWorkedMinutes(start, end);
}

export interface HabitStreak {
  id: string;
  name: string;
  current: number;
  best: number;
  last7: (boolean | null)[];
}

export async function getHabitStreaks(rolloverHour = 2): Promise<HabitStreak[]> {
  const habits = await prisma.dailyHabit.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: { completions: { where: { completed: true } } },
  });
  const todayKey = appDateKey(new Date(), rolloverHour);

  return habits.map((h) => {
    const done = new Set(h.completions.map((c) => c.date));
    const scheduledDays = parseScheduleDays(h.scheduleDays);

    function isScheduled(key: string): boolean {
      return scheduledDays.includes(isoDayOf(key));
    }

    let current = 0;
    let cursor = done.has(todayKey) ? todayKey : addDaysToKey(todayKey, -1);
    for (let i = 0; i < 365; i++) {
      if (!isScheduled(cursor)) {
        cursor = addDaysToKey(cursor, -1);
        continue;
      }
      if (done.has(cursor)) {
        current++;
        cursor = addDaysToKey(cursor, -1);
      } else {
        break;
      }
    }

    let best = 0;
    let run = 0;
    const allDone = [...done].sort();
    if (allDone.length > 0) {
      let k = allDone[0];
      while (k <= todayKey) {
        if (isScheduled(k)) {
          if (done.has(k)) {
            run++;
            best = Math.max(best, run);
          } else {
            run = 0;
          }
        }
        k = addDaysToKey(k, 1);
      }
    }

    const last7: (boolean | null)[] = Array.from({ length: 7 }, (_, i) => {
      const k = addDaysToKey(todayKey, -(6 - i));
      if (!isScheduled(k)) return null;
      return done.has(k);
    });

    return { id: h.id, name: h.name, current, best: Math.max(best, current), last7 };
  });
}

export interface DayScore {
  date: string;
  score: number;
  workedMinutes: number;
}

export async function getScoreHistory(days = 14, rolloverHour = 2): Promise<DayScore[]> {
  const now = new Date();
  const todayKey = appDateKey(now, rolloverHour);
  const fromKey = addDaysToKey(todayKey, -(days - 1));
  const from = parseDateKey(fromKey);

  const [settings, sessions, habits, completions, reviews, todayTasks] =
    await Promise.all([
      getSettings(),
      prisma.workSession.findMany({ where: { startTime: { gte: from } } }),
      prisma.dailyHabit.findMany({ where: { active: true } }),
      prisma.habitCompletion.findMany({
        where: { completedCount: { gt: 0 }, date: { gte: fromKey } },
        select: { habitId: true, date: true, completedCount: true },
      }),
      prisma.dailyReview.findMany({ where: { date: { gte: fromKey } } }),
      prisma.task.findMany({
        where: { today: true, status: { not: "archived" } },
      }),
    ]);

  const habitMeta = new Map(
    habits.map((h) => ({
      key: h.id,
      val: {
        points: h.points,
        timesPerDay: h.timesPerDay ?? 1,
        scheduledDays: parseScheduleDays(h.scheduleDays),
      },
    })).map(({ key, val }) => [key, val])
  );

  const completionMap = new Map<string, number>();
  for (const c of completions) {
    completionMap.set(`${c.date}:${c.habitId}`, c.completedCount);
  }

  const reviewDoneByDate = new Set(
    reviews
      .filter((r) =>
        [r.whatGotDone, r.whatIAvoided, r.biggestWin, r.lesson, r.tomorrowFocus].some(
          (v) => v.trim() !== ""
        )
      )
      .map((r) => r.date)
  );

  const minutesByDate = new Map<string, number>();
  for (const s of sessions) {
    // Use appDateKey so late-night sessions (before rolloverHour) get credited
    // to the correct operational day, not the calendar midnight-crossing day.
    const key = appDateKey(s.startTime, rolloverHour);
    minutesByDate.set(
      key,
      (minutesByDate.get(key) ?? 0) + liveSessionMinutes(s, now)
    );
  }

  return Array.from({ length: days }, (_, i) => {
    const key = addDaysToKey(fromKey, i);
    const isToday = key === todayKey;
    const dayOfWeek = isoDayOf(key);
    const workedMinutes = minutesByDate.get(key) ?? 0;

    let habitPointsTotal = 0;
    let habitPointsDone = 0;
    for (const [habitId, meta] of habitMeta) {
      if (!meta.scheduledDays.includes(dayOfWeek)) continue;
      habitPointsTotal += meta.points;
      const count = completionMap.get(`${key}:${habitId}`) ?? 0;
      habitPointsDone +=
        (Math.min(count, meta.timesPerDay) / meta.timesPerDay) * meta.points;
    }

    const breakdown = computeDailyScore(settings, {
      workedMinutes,
      minimumHours: settings.dailyMinimumHours,
      stretchHours: settings.dailyStretchHours,
      habitPointsDone,
      habitPointsTotal,
      todayTasksDone: isToday
        ? todayTasks.filter((t) => t.status === "done").length
        : 0,
      todayTasksTotal: isToday ? todayTasks.length : 0,
      reviewDone: reviewDoneByDate.has(key),
    });
    return { date: key, score: breakdown.score, workedMinutes };
  });
}
