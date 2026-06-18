import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { NewProjectButton } from "@/components/project-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/db";
import { formatHours, weekBounds } from "@/lib/dates";
import {
  priorityClass,
  priorityLabel,
  priorityRank,
  projectStatusClass,
  projectStatusLabel,
} from "@/lib/labels";
import { getProjectWeekStats, liveSessionMinutes } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "active", label: "Active" },
  { key: "ideas", label: "Ideas" },
  { key: "paused", label: "Paused" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
] as const;

function filterToWhere(filter: string) {
  switch (filter) {
    case "ideas":
      return { status: "idea" };
    case "paused":
      return { status: "paused" };
    case "completed":
      return { status: "completed" };
    case "all":
      return {};
    default:
      return { status: "active" };
  }
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "active" } = await searchParams;
  const { start, end } = weekBounds();

  const [fetchedProjects, weekSessions, weekStats] = await Promise.all([
    prisma.project.findMany({
      where: filterToWhere(filter),
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            tasks: { where: { status: { in: ["todo", "doing"] } } },
            brainDumps: { where: { status: { in: ["inbox", "reviewed"] } } },
          },
        },
      },
    }),
    prisma.workSession.findMany({
      where: { startTime: { gte: start, lte: end }, projectId: { not: null } },
    }),
    getProjectWeekStats(),
  ]);

  // Priority is a string column, so rank it in JS instead of SQL.
  const projects = [...fetchedProjects].sort(
    (a, b) => (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0)
  );

  const now = new Date();
  const weekMinutesByProject = new Map<string, number>();
  for (const s of weekSessions) {
    if (!s.projectId) continue;
    weekMinutesByProject.set(
      s.projectId,
      (weekMinutesByProject.get(s.projectId) ?? 0) + liveSessionMinutes(s, now)
    );
  }

  return (
    <div>
      <PageHeader
        title="Project Map"
        subtitle="Everything you have in motion, in one view."
      >
        <NewProjectButton />
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            asChild
            variant={filter === f.key ? "secondary" : "ghost"}
            size="sm"
          >
            <Link href={`/projects?filter=${f.key}`}>{f.label}</Link>
          </Button>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={MapIcon}
          title="No projects in this view"
          description="Create a project or switch filters."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const weekMinutes = weekMinutesByProject.get(p.id) ?? 0;
            const ws = weekStats.get(p.id);
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="h-full gap-4 transition-colors hover:border-muted-foreground/30">
                  <CardContent className="flex h-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-tight">{p.name}</p>
                      <div className="flex shrink-0 gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-1.5 py-0 text-[10px]",
                            projectStatusClass[p.status]
                          )}
                        >
                          {projectStatusLabel[p.status]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-1.5 py-0 text-[10px]",
                            priorityClass[p.priority]
                          )}
                        >
                          {priorityLabel[p.priority]}
                        </Badge>
                      </div>
                    </div>

                    {p.mainGoal && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {p.mainGoal}
                      </p>
                    )}

                    {p.nextBestAction && (
                      <p className="line-clamp-2 text-xs">
                        <span className="text-muted-foreground">Next: </span>
                        {p.nextBestAction}
                      </p>
                    )}

                    <div className="mt-auto space-y-2 pt-1">
                      {ws?.weekProgress != null ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={ws.weekProgress * 100}
                              className="flex-1"
                            />
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {ws.doneThisWeek}/{ws.doneThisWeek + ws.openCount}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            This week · goal {p.progressPercent}%
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Progress value={p.progressPercent} className="flex-1" />
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {p.progressPercent}%
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Goal progress · no tasks in play this week
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatHours(weekMinutes)}h this week · {p._count.tasks}{" "}
                        open · {p._count.brainDumps} idea
                        {p._count.brainDumps === 1 ? "" : "s"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
