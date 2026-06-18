import Link from "next/link";
import { NewTaskButton } from "@/components/new-task-button";
import { PageHeader } from "@/components/page-header";
import { TaskList } from "@/components/task-list";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { todayBounds } from "@/lib/dates";
import { priorityRank } from "@/lib/labels";
import { getProjectOptions } from "@/lib/queries";
import { toTaskItem } from "@/lib/serialize";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const VIEWS = [
  { key: "open", label: "Open" },
  { key: "today", label: "Today" },
  { key: "doing", label: "Doing" },
  { key: "high", label: "High priority" },
  { key: "overdue", label: "Overdue" },
  { key: "done", label: "Done" },
  { key: "archived", label: "Archived" },
] as const;

function viewToWhere(view: string): Prisma.TaskWhereInput {
  switch (view) {
    case "today":
      return { today: true, status: { not: "archived" } };
    case "doing":
      return { status: "doing" };
    case "high":
      return { priority: "high", status: { in: ["todo", "doing"] } };
    case "overdue":
      return {
        status: { in: ["todo", "doing"] },
        dueDate: { lt: todayBounds().start },
      };
    case "done":
      return { status: "done" };
    case "archived":
      return { status: "archived" };
    default:
      return { status: { in: ["todo", "doing"] } };
  }
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; project?: string }>;
}) {
  const { view = "open", project } = await searchParams;
  const projectOptions = await getProjectOptions();

  const fetched = await prisma.task.findMany({
    where: {
      ...viewToWhere(view),
      ...(project ? { projectId: project } : {}),
    },
    include: { project: true, projectArea: true },
    orderBy:
      view === "done"
        ? { completedAt: "desc" }
        : [{ today: "desc" }, { createdAt: "desc" }],
  });
  // Priority is a string column, so rank it in JS instead of SQL.
  const tasks =
    view === "done"
      ? fetched
      : [...fetched].sort(
          (a, b) =>
            Number(b.today) - Number(a.today) ||
            (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0) ||
            b.createdAt.getTime() - a.createdAt.getTime()
        );

  return (
    <div>
      <PageHeader title="Tasks" subtitle="Everything on your plate.">
        <NewTaskButton projects={projectOptions} />
      </PageHeader>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {VIEWS.map((v) => (
          <Button
            key={v.key}
            asChild
            variant={view === v.key ? "secondary" : "ghost"}
            size="sm"
          >
            <Link
              href={`/tasks?view=${v.key}${project ? `&project=${project}` : ""}`}
            >
              {v.label}
            </Link>
          </Button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5">
        <Button
          asChild
          variant={!project ? "secondary" : "ghost"}
          size="xs"
        >
          <Link href={`/tasks?view=${view}`}>All projects</Link>
        </Button>
        {projectOptions.map((p) => (
          <Button
            key={p.id}
            asChild
            variant={project === p.id ? "secondary" : "ghost"}
            size="xs"
          >
            <Link href={`/tasks?view=${view}&project=${p.id}`}>{p.name}</Link>
          </Button>
        ))}
      </div>

      <TaskList
        tasks={tasks.map(toTaskItem)}
        projects={projectOptions}
        emptyTitle="No tasks in this view"
        emptyDescription="Switch filters or add a new task."
      />
    </div>
  );
}
