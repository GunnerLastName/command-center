import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const exportDir = path.join(process.cwd(), "prisma", "export");

function load<T>(table: string): T[] {
  const file = path.join(exportDir, `${table}.json`);
  if (!existsSync(file)) { console.log(`Skipping ${table}: no export file`); return []; }
  return JSON.parse(readFileSync(file, "utf-8")) as T[];
}

function bool(v: unknown): boolean { return v === 1 || v === true; }
function dt(v: unknown): Date | null { return v ? new Date(v as string) : null; }
function dtR(v: unknown): Date { return new Date(v as string); }

async function main() {
  console.log("Importing data into Supabase...\n");

  const settings = load<Record<string, unknown>>("Settings");
  for (const s of settings) {
    await prisma.settings.upsert({
      where: { id: s.id as string },
      create: { id: s.id as string, dailyMinimumHours: s.dailyMinimumHours as number, dailyStretchHours: s.dailyStretchHours as number, workScoreWeight: s.workScoreWeight as number, habitsScoreWeight: s.habitsScoreWeight as number, tasksScoreWeight: s.tasksScoreWeight as number, reviewScoreWeight: s.reviewScoreWeight as number, theme: s.theme as string, userName: s.userName as string, dashboardWidgets: s.dashboardWidgets as string, keyboardShortcuts: s.keyboardShortcuts as string, dayRolloverHour: s.dayRolloverHour as number, createdAt: dtR(s.createdAt), updatedAt: dtR(s.updatedAt) },
      update: { dailyMinimumHours: s.dailyMinimumHours as number, dailyStretchHours: s.dailyStretchHours as number, workScoreWeight: s.workScoreWeight as number, habitsScoreWeight: s.habitsScoreWeight as number, tasksScoreWeight: s.tasksScoreWeight as number, reviewScoreWeight: s.reviewScoreWeight as number, theme: s.theme as string, userName: s.userName as string, dashboardWidgets: s.dashboardWidgets as string, keyboardShortcuts: s.keyboardShortcuts as string, dayRolloverHour: s.dayRolloverHour as number },
    });
  }
  console.log("Settings: " + settings.length);

  const projects = load<Record<string, unknown>>("Project");
  for (const p of projects) {
    await prisma.project.upsert({
      where: { id: p.id as string },
      create: { id: p.id as string, name: p.name as string, description: p.description as string, category: p.category as string, status: p.status as string, priority: p.priority as string, mainGoal: p.mainGoal as string, currentBottleneck: p.currentBottleneck as string, nextBestAction: p.nextBestAction as string, deadline: dt(p.deadline), progressPercent: p.progressPercent as number, completedAt: dt(p.completedAt), notes: p.notes as string, createdAt: dtR(p.createdAt), updatedAt: dtR(p.updatedAt) },
      update: { name: p.name as string, description: p.description as string, status: p.status as string },
    });
  }
  console.log("Projects: " + projects.length);

  const areas = load<Record<string, unknown>>("ProjectArea");
  for (const a of areas) {
    await prisma.projectArea.upsert({
      where: { id: a.id as string },
      create: { id: a.id as string, projectId: a.projectId as string, name: a.name as string, description: a.description as string, status: a.status as string, sortOrder: a.sortOrder as number, createdAt: dtR(a.createdAt), updatedAt: dtR(a.updatedAt) },
      update: { name: a.name as string, status: a.status as string },
    });
  }
  console.log("ProjectAreas: " + areas.length);

  const tasks = load<Record<string, unknown>>("Task");
  for (const t of tasks) {
    await prisma.task.upsert({
      where: { id: t.id as string },
      create: { id: t.id as string, projectId: t.projectId as string | null, projectAreaId: t.projectAreaId as string | null, title: t.title as string, notes: t.notes as string, status: t.status as string, priority: t.priority as string, dueDate: dt(t.dueDate), estimatedMinutes: t.estimatedMinutes as number | null, today: bool(t.today), todaySortOrder: t.todaySortOrder as number, sortOrder: t.sortOrder as number, completedAt: dt(t.completedAt), createdAt: dtR(t.createdAt), updatedAt: dtR(t.updatedAt) },
      update: { title: t.title as string, status: t.status as string, today: bool(t.today) },
    });
  }
  console.log("Tasks: " + tasks.length);

  const dumps = load<Record<string, unknown>>("BrainDumpItem");
  for (const b of dumps) {
    await prisma.brainDumpItem.upsert({
      where: { id: b.id as string },
      create: { id: b.id as string, title: b.title as string, notes: b.notes as string, category: b.category as string, projectId: b.projectId as string | null, projectAreaId: b.projectAreaId as string | null, status: b.status as string, createdAt: dtR(b.createdAt), updatedAt: dtR(b.updatedAt) },
      update: { title: b.title as string, status: b.status as string },
    });
  }
  console.log("BrainDumpItems: " + dumps.length);

  const sessions = load<Record<string, unknown>>("WorkSession");
  for (const s of sessions) {
    await prisma.workSession.upsert({
      where: { id: s.id as string },
      create: { id: s.id as string, projectId: s.projectId as string | null, taskId: s.taskId as string | null, description: s.description as string, startTime: dtR(s.startTime), endTime: dt(s.endTime), durationMinutes: s.durationMinutes as number, createdAt: dtR(s.createdAt), updatedAt: dtR(s.updatedAt) },
      update: { durationMinutes: s.durationMinutes as number, endTime: dt(s.endTime) },
    });
  }
  console.log("WorkSessions: " + sessions.length);

  const reviews = load<Record<string, unknown>>("DailyReview");
  for (const r of reviews) {
    await prisma.dailyReview.upsert({
      where: { date: r.date as string },
      create: { id: r.id as string, date: r.date as string, whatGotDone: r.whatGotDone as string, whatIAvoided: r.whatIAvoided as string, biggestWin: r.biggestWin as string, lesson: r.lesson as string, tomorrowFocus: r.tomorrowFocus as string, createdAt: dtR(r.createdAt), updatedAt: dtR(r.updatedAt) },
      update: { whatGotDone: r.whatGotDone as string },
    });
  }
  console.log("DailyReviews: " + reviews.length);

  const habits = load<Record<string, unknown>>("DailyHabit");
  for (const h of habits) {
    await prisma.dailyHabit.upsert({
      where: { id: h.id as string },
      create: { id: h.id as string, name: h.name as string, description: h.description as string, category: h.category as string, active: bool(h.active), points: h.points as number, sortOrder: h.sortOrder as number, scheduleDays: h.scheduleDays as string, timesPerDay: h.timesPerDay as number, createdAt: dtR(h.createdAt), updatedAt: dtR(h.updatedAt) },
      update: { name: h.name as string, active: bool(h.active) },
    });
  }
  console.log("DailyHabits: " + habits.length);

  const completions = load<Record<string, unknown>>("HabitCompletion");
  for (const c of completions) {
    await prisma.habitCompletion.upsert({
      where: { habitId_date: { habitId: c.habitId as string, date: c.date as string } },
      create: { id: c.id as string, habitId: c.habitId as string, date: c.date as string, completed: bool(c.completed), completedCount: c.completedCount as number, completedAt: dt(c.completedAt), createdAt: dtR(c.createdAt), updatedAt: dtR(c.updatedAt) },
      update: { completed: bool(c.completed), completedCount: c.completedCount as number },
    });
  }
  console.log("HabitCompletions: " + completions.length);

  const weekly = load<Record<string, unknown>>("WeeklyReview");
  for (const w of weekly) {
    await prisma.weeklyReview.upsert({
      where: { weekStart: w.weekStart as string },
      create: { id: w.id as string, weekStart: w.weekStart as string, whatWorked: w.whatWorked as string, whatToFix: w.whatToFix as string, nextWeekFocus: w.nextWeekFocus as string, notes: w.notes as string, createdAt: dtR(w.createdAt), updatedAt: dtR(w.updatedAt) },
      update: { whatWorked: w.whatWorked as string },
    });
  }
  console.log("WeeklyReviews: " + weekly.length);

  console.log("\nAll data imported.");
  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
