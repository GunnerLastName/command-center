import Link from "next/link";
import { Brain, ChevronLeft, ChevronRight } from "lucide-react";
import { WeeklyReflectionForm } from "@/components/weekly-reflection-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/db";
import {
  addDaysToKey,
  dateKey,
  formatDateKey,
  formatHours,
  isValidDateKey,
  parseDateKey,
  weekBounds,
  weekDayKeys,
} from "@/lib/dates";
import { getSettings, liveSessionMinutes } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WeeklyReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const now = new Date();

  // ?week= accepts any date inside the target week ("yyyy-MM-dd").
  const anchor = week && isValidDateKey(week) ? parseDateKey(week) : now;
  const { start, end } = weekBounds(anchor);
  const dayKeys = weekDayKeys(anchor); // Mon..Sun of the viewed week
  const todayKey = dateKey(now);
  const isCurrentWeek = dayKeys.includes(todayKey);

  const weekStartKey = dayKeys[0]; // Monday of the viewed week

  const [settings, sessions, completedTasks, unfinishedCount, weekDumps, weeklyReview] =
    await Promise.all([
      getSettings(),
      prisma.workSession.findMany({
        where: { startTime: { gte: start, lte: end } },
        include: { project: true },
      }),
      prisma.task.findMany({
        where: { status: "done", completedAt: { gte: start, lte: end } },
        orderBy: { completedAt: "desc" },
      }),
      prisma.task.count({ where: { status: { in: ["todo", "doing"] } } }),
      prisma.brainDumpItem.findMany({
        where: { createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.weeklyReview.findUnique({ where: { weekStart: weekStartKey } }),
    ]);

  const totalMinutes = sessions.reduce(
    (sum, s) => sum + liveSessionMinutes(s, now),
    0
  );

  // Past weeks average over all 7 days; the current week only over days
  // elapsed so far (Mon..today), minimum 1.
  const daysElapsed = isCurrentWeek ? dayKeys.indexOf(todayKey) + 1 : 7;
  const avgMinutesPerDay = totalMinutes / daysElapsed;

  // Hours per project, sorted.
  const byProject = new Map<string, { name: string; minutes: number }>();
  for (const s of sessions) {
    const key = s.projectId ?? "none";
    const name = s.project?.name ?? "No project";
    const entry = byProject.get(key) ?? { name, minutes: 0 };
    entry.minutes += liveSessionMinutes(s, now);
    byProject.set(key, entry);
  }
  const projectRows = [...byProject.values()].sort(
    (a, b) => b.minutes - a.minutes
  );
  const maxProjectMinutes = projectRows[0]?.minutes ?? 1;

  // Daily breakdown Mon–Sun, grouped by Denver date key.
  const minutesByDay = new Map<string, number>();
  for (const s of sessions) {
    const k = dateKey(s.startTime);
    minutesByDay.set(k, (minutesByDay.get(k) ?? 0) + liveSessionMinutes(s, now));
  }
  const days = dayKeys.map((key) => ({
    key,
    minutes: minutesByDay.get(key) ?? 0,
  }));
  const maxDayMinutes = Math.max(
    settings.dailyStretchHours * 60,
    ...days.map((d) => d.minutes)
  );

  return (
    <div>
      <PageHeader
        title="Weekly Review"
        subtitle={`${formatDateKey(dayKeys[0], "MMM d")} – ${formatDateKey(
          dayKeys[6],
          "MMM d, yyyy"
        )}${isCurrentWeek ? " · this week" : ""}`}
      >
        <Button asChild variant="outline" size="icon-sm" aria-label="Previous week">
          <Link href={`/weekly-review?week=${addDaysToKey(dayKeys[0], -7)}`}>
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        {!isCurrentWeek && (
          <>
            <Button asChild variant="outline" size="icon-sm" aria-label="Next week">
              <Link href={`/weekly-review?week=${addDaysToKey(dayKeys[0], 7)}`}>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/weekly-review">This week</Link>
            </Button>
          </>
        )}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total hours", value: `${formatHours(totalMinutes)}h` },
          {
            label: "Average per day",
            value: `${formatHours(avgMinutesPerDay)}h`,
          },
          {
            label: "Tasks completed",
            value: String(completedTasks.length),
          },
        ].map((stat) => (
          <Card key={stat.label} className="gap-1 py-4">
            <CardContent>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-semibold tabular-nums">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Daily breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-2">
              {days.map(({ key, minutes }) => {
                const heightPercent =
                  maxDayMinutes > 0 ? (minutes / maxDayMinutes) * 100 : 0;
                const hitMin = minutes >= settings.dailyMinimumHours * 60;
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    className="flex flex-1 flex-col items-center gap-1.5"
                  >
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {minutes > 0 ? `${formatHours(minutes)}h` : ""}
                    </span>
                    <div className="flex h-28 w-full items-end rounded bg-muted/40">
                      <div
                        className={cn(
                          "w-full rounded",
                          hitMin ? "bg-primary" : "bg-primary/50"
                        )}
                        style={{ height: `${Math.min(100, heightPercent)}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px]",
                        isToday
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatDateKey(key, "EEE")}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Green bars hit the {settings.dailyMinimumHours}h minimum.{" "}
              {unfinishedCount} task{unfinishedCount === 1 ? "" : "s"} still
              open across all projects.
            </p>
          </CardContent>
        </Card>

        {/* Time by project */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Where the hours went
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sessions logged this week yet.
              </p>
            ) : (
              projectRows.map((row) => (
                <div key={row.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{row.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatHours(row.minutes)}h
                    </span>
                  </div>
                  <Progress value={(row.minutes / maxProjectMinutes) * 100} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Completed tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Shipped this week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing checked off yet this week.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {completedTasks.slice(0, 10).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span className="truncate">{t.title}</span>
                  </li>
                ))}
                {completedTasks.length > 10 && (
                  <li className="text-xs text-muted-foreground">
                    + {completedTasks.length - 10} more
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Ideas captured */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ideas captured
            </CardTitle>
            <Link
              href="/brain-dump"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear the inbox
            </Link>
          </CardHeader>
          <CardContent>
            {weekDumps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No new ideas captured this week.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {weekDumps.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Brain className="size-3.5 shrink-0" />
                    <span className="truncate">{d.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly reflection */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Weekly reflection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyReflectionForm
            key={weekStartKey}
            weekStart={weekStartKey}
            initial={{
              whatWorked: weeklyReview?.whatWorked ?? "",
              whatToFix: weeklyReview?.whatToFix ?? "",
              nextWeekFocus: weeklyReview?.nextWeekFocus ?? "",
              notes: weeklyReview?.notes ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
