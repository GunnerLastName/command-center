import { AddToTodayDialog } from "@/components/add-to-today-dialog";
import { PageHeader } from "@/components/page-header";
import { QuickTaskInput } from "@/components/quick-task-input";
import { TaskList } from "@/components/task-list";
import { WorkProgress } from "@/components/work-progress";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatHours, formatInAppTz, formatMinutes } from "@/lib/dates";
import { sortTasksForFocus } from "@/lib/labels";
import { getProjectOptions, getTodayStandards } from "@/lib/queries";
import { workStatus } from "@/lib/scoring";
import { toTaskItem } from "@/lib/serialize";
import { reorderTodayTasks } from "@/app/actions/tasks";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  // getTodayStandards first: it rolls stale done tasks off today's list.
  const standards = await getTodayStandards();
  const [projectOptions, taskRows, availableRows] = await Promise.all([
    getProjectOptions(),
    prisma.task.findMany({
      where: { today: true, status: { not: "archived" } },
      include: { project: true, projectArea: true },
      orderBy: { todaySortOrder: "asc" },
    }),
    prisma.task.findMany({
      where: { today: false, status: { in: ["todo", "doing"] } },
      include: { project: true, projectArea: true },
      orderBy: [{ projectId: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const { settings, workedMinutes } = standards;
  const minimumMinutes = settings.dailyMinimumHours * 60;
  const stretchMinutes = settings.dailyStretchHours * 60;
  const toMinimum = Math.max(0, minimumMinutes - workedMinutes);
  const toStretch = Math.max(0, stretchMinutes - workedMinutes);
  const status = workStatus(
    workedMinutes,
    settings.dailyMinimumHours,
    settings.dailyStretchHours
  );

  // Before first drag all todaySortOrders are 0 → use sortTasksForFocus.
  // After any drag they get explicit non-zero values → trust DB order.
  const hasExplicitOrder = taskRows.some((t) => t.todaySortOrder > 0);
  const sortedTasks = hasExplicitOrder
    ? taskRows
    : sortTasksForFocus(taskRows);

  const open = sortedTasks.filter((t) => t.status !== "done");
  const done = sortedTasks.filter((t) => t.status === "done");

  return (
    <div>
      <PageHeader
        title="Today"
        subtitle={formatInAppTz(new Date(), "EEEE, MMMM d")}
      />

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-x-10 gap-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Worked today</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatHours(workedMinutes)}h
            </p>
            <p className="text-xs text-muted-foreground">{status}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              To {settings.dailyMinimumHours}h minimum
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {toMinimum === 0 ? "Hit" : formatMinutes(toMinimum)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              To {settings.dailyStretchHours}h stretch
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {toStretch === 0 ? "Hit" : formatMinutes(toStretch)}
            </p>
          </div>
          <div className="min-w-56 flex-1">
            <WorkProgress
              minutes={workedMinutes}
              minimumHours={settings.dailyMinimumHours}
              stretchHours={settings.dailyStretchHours}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <QuickTaskInput />
      </div>

      <div className="space-y-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              In play · {open.length}
            </h2>
            <AddToTodayDialog availableTasks={availableRows.map(toTaskItem)} />
          </div>
          <TaskList
            tasks={open.map(toTaskItem)}
            projects={projectOptions}
            reorderable
            onReorder={reorderTodayTasks}
            emptyTitle="No open tasks for today"
            emptyDescription="Add one above, or pull tasks in from the Tasks page."
            defaultToday
          />
        </div>

        {done.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Done · {done.length}
            </h2>
            <TaskList
              tasks={done.map(toTaskItem)}
              projects={projectOptions}
              defaultToday
            />
          </div>
        )}
      </div>
    </div>
  );
}
