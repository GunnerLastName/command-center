import { PageHeader } from "@/components/page-header";
import { SessionList } from "@/components/session-list";
import {
  ManualSessionButton,
  TimerPanel,
} from "@/components/timer-panel";
import { WorkProgress } from "@/components/work-progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { appTodayBounds, formatHours, weekBounds } from "@/lib/dates";
import {
  getActiveSession,
  getProjectOptions,
  getSettings,
  getWorkedMinutes,
} from "@/lib/queries";
import { toSessionItem } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function WorkLogPage() {
  const settings = await getSettings();
  const today = appTodayBounds(new Date(), settings.dayRolloverHour ?? 2);
  const week = weekBounds();

  const [
    activeSession,
    projectOptions,
    openTasks,
    todaySessions,
    weekSessions,
    todayMinutes,
    weekMinutes,
  ] = await Promise.all([
    getActiveSession(settings.dayRolloverHour ?? 2),
    getProjectOptions(),
    prisma.task.findMany({
      where: { status: { in: ["todo", "doing"] } },
      orderBy: [{ today: "desc" }, { createdAt: "desc" }],
      select: { id: true, title: true, projectId: true },
    }),
    prisma.workSession.findMany({
      where: { startTime: { gte: today.start, lte: today.end } },
      include: { project: true, task: true },
      orderBy: { startTime: "desc" },
    }),
    prisma.workSession.findMany({
      where: { startTime: { gte: week.start, lte: week.end } },
      include: { project: true, task: true },
      orderBy: { startTime: "desc" },
    }),
    getWorkedMinutes(today.start, today.end),
    getWorkedMinutes(week.start, week.end),
  ]);

  const earlierThisWeek = weekSessions.filter(
    (s) => s.startTime < today.start
  );

  return (
    <div>
      <PageHeader title="Work Log" subtitle="Focused hours, tracked honestly.">
        <ManualSessionButton projects={projectOptions} tasks={openTasks} />
      </PageHeader>

      <TimerPanel
        activeSession={
          activeSession
            ? {
                id: activeSession.id,
                description: activeSession.description,
                startTime: activeSession.startTime.toISOString(),
                projectName: activeSession.project?.name ?? null,
                taskTitle: activeSession.task?.title ?? null,
              }
            : null
        }
        projects={projectOptions}
        tasks={openTasks}
      />

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-x-10 gap-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatHours(todayMinutes)}h
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">This week</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatHours(weekMinutes)}h
            </p>
          </div>
          <div className="w-full lg:min-w-56 flex-1">
            <WorkProgress
              minutes={todayMinutes}
              minimumHours={settings.dailyMinimumHours}
              stretchHours={settings.dailyStretchHours}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SessionList
              sessions={todaySessions.map(toSessionItem)}
              projects={projectOptions}
              tasks={openTasks}
              emptyTitle="Nothing logged today"
              emptyDescription="Start the timer or log time manually."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Earlier this week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SessionList
              sessions={earlierThisWeek.map(toSessionItem)}
              projects={projectOptions}
              tasks={openTasks}
              emptyTitle="No earlier sessions this week"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
