import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { AreaGrid } from "@/components/area-dialog";
import { DumpList } from "@/components/dump-list";
import { FinishProjectButton } from "@/components/finish-project-button";
import { NotesEditor } from "@/components/notes-editor";
import { EditProjectButton } from "@/components/project-dialog";
import { ProjectTasks } from "@/components/project-tasks";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/db";
import {
  dateKey,
  formatHours,
  formatInAppTz,
  formatMinutes,
  todayBounds,
  weekBounds,
} from "@/lib/dates";
import {
  priorityClass,
  priorityLabel,
  projectStatusClass,
  projectStatusLabel,
  sortTasksForFocus,
} from "@/lib/labels";
import { getProjectOptions, getProjectWeekStats, getWorkedMinutes, liveSessionMinutes } from "@/lib/queries";
import { toTaskItem } from "@/lib/serialize";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      areas: {
        orderBy: { sortOrder: "asc" },
        include: {
          _count: {
            select: {
              tasks: { where: { status: { in: ["todo", "doing"] } } },
              brainDumps: { where: { status: { in: ["inbox", "reviewed"] } } },
            },
          },
        },
      },
      tasks: {
        where: { status: { not: "archived" } },
        include: { project: true, projectArea: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      brainDumps: {
        where: { status: { not: "archived" } },
        include: { project: true, projectArea: true },
        orderBy: { createdAt: "desc" },
      },
      workSessions: {
        orderBy: { startTime: "desc" },
        take: 10,
        include: { task: true },
      },
    },
  });

  if (!project) notFound();

  const today = todayBounds();
  const week = weekBounds();
  const [projectOptions, todayMinutes, weekMinutes, allSessions, weekStatsMap] =
    await Promise.all([
      getProjectOptions(),
      getWorkedMinutes(today.start, today.end, project.id),
      getWorkedMinutes(week.start, week.end, project.id),
      prisma.workSession.findMany({ where: { projectId: project.id } }),
      getProjectWeekStats(),
    ]);

  const ws = weekStatsMap.get(project.id);
  const openTaskCount = project.tasks.filter(
    (t) => t.status === "todo" || t.status === "doing"
  ).length;

  const now = new Date();
  const allTimeMinutes = allSessions.reduce(
    (sum, s) => sum + liveSessionMinutes(s, now),
    0
  );

  return (
    <div>
      <Link
        href="/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Project Map
      </Link>

      {/* Overview */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <Badge
              variant="outline"
              className={cn("text-[11px]", projectStatusClass[project.status])}
            >
              {projectStatusLabel[project.status]}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-[11px]", priorityClass[project.priority])}
            >
              {priorityLabel[project.priority]}
            </Badge>
          </div>
          {project.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <FinishProjectButton
            projectId={project.id}
            projectName={project.name}
            status={project.status}
            openTaskCount={openTaskCount}
          />
          <EditProjectButton
            project={{
              id: project.id,
              name: project.name,
              description: project.description,
              category: project.category,
              status: project.status,
              priority: project.priority,
              mainGoal: project.mainGoal,
              currentBottleneck: project.currentBottleneck,
              nextBestAction: project.nextBestAction,
              deadline: project.deadline ? dateKey(project.deadline) : null,
              progressPercent: project.progressPercent,
            }}
          />
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Main goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {project.mainGoal || (
                <span className="text-muted-foreground">Not set yet.</span>
              )}
            </p>
            {project.deadline && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="size-3.5" />
                Deadline: {formatInAppTz(project.deadline, "MMM d, yyyy")}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Bottleneck → next best action
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Stuck on: </span>
              {project.currentBottleneck || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Next: </span>
              {project.nextBestAction || "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ws?.weekProgress != null && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Progress value={ws.weekProgress * 100} className="flex-1" />
                  <span className="text-sm tabular-nums">
                    {ws.doneThisWeek}/{ws.doneThisWeek + ws.openCount}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">This week</p>
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Progress value={project.progressPercent} className="flex-1" />
                <span className="text-sm tabular-nums">
                  {project.progressPercent}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Goal progress</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatHours(todayMinutes)}h today · {formatHours(weekMinutes)}h
              this week · {formatHours(allTimeMinutes)}h all-time
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="areas">
        <TabsList>
          <TabsTrigger value="areas">
            Areas · {project.areas.length}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks · {project.tasks.filter((t) => t.status !== "done").length}
          </TabsTrigger>
          <TabsTrigger value="ideas">
            Ideas · {project.brainDumps.length}
          </TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="time">Time</TabsTrigger>
        </TabsList>

        <TabsContent value="areas" className="mt-4">
          <AreaGrid
            projectId={project.id}
            areas={project.areas.map((a) => ({
              id: a.id,
              name: a.name,
              description: a.description,
              openTasks: a._count.tasks,
              ideas: a._count.brainDumps,
            }))}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <ProjectTasks
            tasks={
              (project.tasks.some((t) => t.sortOrder > 0)
                ? project.tasks
                : sortTasksForFocus(project.tasks)
              ).map(toTaskItem)
            }
            projects={projectOptions}
            projectId={project.id}
          />
        </TabsContent>

        <TabsContent value="ideas" className="mt-4">
          <DumpList
            items={project.brainDumps.map((d) => ({
              id: d.id,
              title: d.title,
              notes: d.notes,
              category: d.category,
              status: d.status,
              projectId: d.projectId,
              projectName: d.project?.name ?? null,
              createdAt: formatInAppTz(d.createdAt, "MMM d"),
            }))}
            projects={projectOptions}
            emptyTitle="No ideas attached"
            emptyDescription="Brain dump ideas land here when you attach them to this project."
          />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesEditor projectId={project.id} initialNotes={project.notes} />
        </TabsContent>

        <TabsContent value="time" className="mt-4">
          <div className="mb-4 grid grid-cols-3 gap-4">
            {[
              { label: "Today", minutes: todayMinutes },
              { label: "This week", minutes: weekMinutes },
              { label: "All-time", minutes: allTimeMinutes },
            ].map((stat) => (
              <Card key={stat.label} className="gap-1 py-4">
                <CardContent>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {formatHours(stat.minutes)}h
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          {project.workSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sessions logged on this project yet.
            </p>
          ) : (
            <div className="space-y-2">
              {project.workSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate">
                      {s.description || s.task?.title || "Focused work"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatInAppTz(s.startTime, "MMM d · h:mm a")}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {s.endTime
                      ? formatMinutes(s.durationMinutes)
                      : "running"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
