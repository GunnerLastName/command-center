import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Brain,
  Check,
  Circle,
  Map,
  NotebookPen,
  Target,
  Timer,
} from "lucide-react";
import { AssistantCard } from "@/components/assistant-card";
import { EmptyState } from "@/components/empty-state";
import { Greeting } from "@/components/greeting";
import { HabitChecklist } from "@/components/habit-checklist";
import { ScoreRing } from "@/components/score-ring";
import { TaskList } from "@/components/task-list";
import { WorkProgress } from "@/components/work-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  formatHours,
  formatInAppTz,
  formatMinutes,
  weekBounds,
} from "@/lib/dates";
import { parseWidgetSettings } from "@/lib/dashboard-widgets";
import {
  projectStatusClass,
  projectStatusLabel,
  sortTasksForFocus,
} from "@/lib/labels";
import {
  getActiveSession,
  getProjectOptions,
  getTodayStandards,
  getWeekWorkedMinutes,
  liveSessionMinutes,
} from "@/lib/queries";
import { toTaskItem } from "@/lib/serialize";
import { workStatus } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // getTodayStandards loads settings (including dayRolloverHour) and rolls
  // stale done tasks off today's list. Must run before other queries.
  const standards = await getTodayStandards();
  const { todayKey, settings, workedMinutes, habits, breakdown, reviewDone } = standards;
  const rolloverHour = settings.dayRolloverHour ?? 2;
  const yesterdayKey = addDaysToKey(todayKey, -1);
  const { start: weekStart, end: weekEnd } = weekBounds();

  const widgets = parseWidgetSettings(settings.dashboardWidgets ?? "{}");

  const [weekMinutes, activeSession, projectOptions, todayTasks, overdueTasks, recentDumps, activeProjects, yesterdayReview, weekTasksDone] =
    await Promise.all([
      getWeekWorkedMinutes(),
      getActiveSession(rolloverHour),
      getProjectOptions(),
      prisma.task.findMany({
        where: { today: true, status: { not: "archived" } },
        include: { project: true, projectArea: true },
        orderBy: { todaySortOrder: "asc" },
      }),
      prisma.task.findMany({
        where: {
          status: { in: ["todo", "doing"] },
          dueDate: { lt: new Date() },
        },
        include: { project: true, projectArea: true },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.brainDumpItem.findMany({
        where: { status: "inbox" },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.project.findMany({
        where: { status: "active" },
        orderBy: { updatedAt: "desc" },
        include: {
          _count: {
            select: {
              tasks: { where: { status: { in: ["todo", "doing"] } } },
            },
          },
        },
        take: 6,
      }),
      prisma.dailyReview.findUnique({
        where: { date: yesterdayKey },
        select: { tomorrowFocus: true },
      }),
      prisma.task.count({
        where: { status: "done", completedAt: { gte: weekStart, lte: weekEnd } },
      }),
    ]);

  const status = workStatus(
    workedMinutes,
    settings.dailyMinimumHours,
    settings.dailyStretchHours
  );

  const yesterdayFocus = yesterdayReview?.tomorrowFocus?.trim() || null;
  const subline = activeSession
    ? "Session running — locked in."
    : workedMinutes >= settings.dailyMinimumHours * 60
    ? "Minimum hit. Still in motion."
    : yesterdayFocus
    ? `Yesterday you pointed at: ${yesterdayFocus}`
    : undefined;

  // Map habits to HabitChecklist format
  const habitItems = habits.map((h) => ({
    id: h.id,
    name: h.name,
    description: h.description,
    category: h.category,
    points: h.points,
    timesPerDay: h.timesPerDay,
    completedCount: h.completions[0]?.completedCount ?? 0,
    done: h.completions[0]?.completed ?? false,
  }));

  const openTodayTasks = sortTasksForFocus(todayTasks.filter((t) => t.status !== "done"));
  const doneTodayTasks = todayTasks.filter((t) => t.status === "done");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <Greeting userName={settings.userName} subline={subline} />
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/daily-review">
              <NotebookPen className="size-3.5" /> Daily review
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/today">
              Today&apos;s focus <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Row 1: Score + Hours + Habits */}
      <div className="grid gap-4 lg:grid-cols-3">
        {widgets.score && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today&apos;s score
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <ScoreRing score={breakdown.score} />
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <Link href="/standards">
                  <Target className="size-3.5" /> Open Daily Standards
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {widgets.focusHours && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Focused hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">
                  {formatHours(workedMinutes)}h
                </span>
                <span className="text-sm text-muted-foreground">{status}</span>
              </div>
              <WorkProgress
                minutes={workedMinutes}
                minimumHours={settings.dailyMinimumHours}
                stretchHours={settings.dailyStretchHours}
              />
              <p className="text-xs text-muted-foreground">
                This week: {formatHours(weekMinutes)}h
              </p>
              {activeSession ? (
                <Link
                  href="/work-log"
                  className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
                >
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  In session · {formatMinutes(liveSessionMinutes(activeSession))} ·{" "}
                  {activeSession.description ||
                    activeSession.project?.name ||
                    "Focused work"}
                </Link>
              ) : (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/work-log">
                    <Timer className="size-3.5" /> Start a work session
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Interactive daily checklist */}
        {widgets.checklist && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Daily checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {habitItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active habits — add some in Settings.
                </p>
              ) : (
                <HabitChecklist habits={habitItems} dateKey={todayKey} />
              )}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center gap-2 text-sm">
                  {reviewDone ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground/50" />
                  )}
                  <span className={reviewDone ? "text-muted-foreground" : ""}>
                    Daily review written
                  </span>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Today&apos;s tasks</span>
                    <span>
                      {standards.todayTasksDone}/{standards.todayTasksTotal} done
                    </span>
                  </div>
                  <Progress
                    value={
                      standards.todayTasksTotal > 0
                        ? (standards.todayTasksDone / standards.todayTasksTotal) * 100
                        : 0
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {workedMinutes / 60 >= settings.dailyMinimumHours
                    ? "Minimum standard hit today."
                    : `${formatHours(
                        Math.max(0, settings.dailyMinimumHours * 60 - workedMinutes)
                      )}h left to hit minimum.`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 2: Tasks — major full-width module */}
      {widgets.todayFocus && (
        <Card className="mt-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today&apos;s tasks
              </CardTitle>
              {todayTasks.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {doneTodayTasks.length}/{todayTasks.length} done
                </Badge>
              )}
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/today">
                Full view <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <TaskList
              tasks={openTodayTasks.map(toTaskItem)}
              projects={projectOptions}
              showProject
              showAddButton
              defaultToday
              emptyTitle="Nothing chosen for today yet"
              emptyDescription="Add tasks below, or pull from your projects on the Today page."
            />
            {doneTodayTasks.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Done · {doneTodayTasks.length}
                </p>
                <TaskList
                  tasks={doneTodayTasks.map(toTaskItem)}
                  projects={projectOptions}
                  showProject
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Row 3: Overdue + optional */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {widgets.overdue && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueTasks.length === 0 ? (
                <EmptyState
                  icon={Check}
                  title="Nothing overdue"
                  description="Clean slate. Keep it that way."
                />
              ) : (
                <TaskList
                  tasks={overdueTasks.map(toTaskItem)}
                  projects={projectOptions}
                />
              )}
            </CardContent>
          </Card>
        )}

        {widgets.activeProjects && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active projects
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/projects">
                  <Map className="size-3.5" /> Project map
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeProjects.length === 0 ? (
                <EmptyState
                  icon={Map}
                  title="No active projects"
                  description="Create one from the Project Map."
                />
              ) : (
                activeProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-muted-foreground/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <Badge
                          variant="outline"
                          className={`px-1.5 py-0 text-[10px] ${projectStatusClass[p.status]}`}
                        >
                          {projectStatusLabel[p.status]}
                        </Badge>
                      </div>
                      {p.nextBestAction && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          Next: {p.nextBestAction}
                        </p>
                      )}
                    </div>
                    <div className="w-20 shrink-0">
                      <Progress value={p.progressPercent} />
                      <p className="mt-1 text-right text-[10px] text-muted-foreground">
                        {p._count.tasks} open
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 4: Recent Ideas */}
      {widgets.recentIdeas && (
        <div className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent ideas
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/brain-dump">
                  <Brain className="size-3.5" /> Clear the inbox
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentDumps.length === 0 ? (
                <EmptyState
                  icon={Brain}
                  title="Inbox is clear"
                  description="Use Quick add the moment something comes to mind."
                />
              ) : (
                recentDumps.map((d) => (
                  <Link
                    key={d.id}
                    href="/brain-dump"
                    className="block rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-muted-foreground/30"
                  >
                    <p className="truncate text-sm">{d.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatInAppTz(d.createdAt, "MMM d")}
                      {d.category ? ` · ${d.category}` : ""}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Assistant */}
      {widgets.assistant && (
        <div className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Bot className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                AI Assistant
              </CardTitle>
              <span className="ml-auto text-[11px] text-muted-foreground/60">
                Tell Command Center what changed.
              </span>
            </CardHeader>
            <CardContent>
              <AssistantCard />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Optional widgets */}
      {(widgets.dailyReview || widgets.weekSnapshot) && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {widgets.dailyReview && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Daily review
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/daily-review">
                    <NotebookPen className="size-3.5" /> Open
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {reviewDone ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground/50" />
                  )}
                  <span>
                    {reviewDone
                      ? "Review written for today."
                      : "Review not yet written."}
                  </span>
                </div>
                {yesterdayFocus && (
                  <p className="text-xs text-muted-foreground">
                    Yesterday: {yesterdayFocus}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {widgets.weekSnapshot && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Week snapshot
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/weekly-review">Open</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tabular-nums">
                    {formatHours(weekMinutes)}h
                  </span>
                  <span className="text-sm text-muted-foreground">this week</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {weekTasksDone} task{weekTasksDone === 1 ? "" : "s"} shipped
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
