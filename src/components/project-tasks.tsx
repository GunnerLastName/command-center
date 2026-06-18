"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { reorderProjectTasks } from "@/app/actions/tasks";
import type { TaskItemData } from "@/lib/serialize";
import type { ProjectOption } from "@/lib/types";
import { TaskList } from "./task-list";

/** Tasks section of a project page, filterable by status. */
export function ProjectTasks({
  tasks,
  projects,
  projectId,
}: {
  tasks: TaskItemData[];
  projects: ProjectOption[];
  projectId: string;
}) {
  const openTasks = tasks.filter(
    (t) => t.status === "todo" || t.status === "doing"
  );
  const doing = tasks.filter((t) => t.status === "doing");
  const done = tasks.filter((t) => t.status === "done");

  const listProps = {
    projects,
    showProject: false,
    showAddButton: true,
    defaultProjectId: projectId,
  };

  return (
    <Tabs defaultValue="open">
      <TabsList>
        <TabsTrigger value="open">Open · {openTasks.length}</TabsTrigger>
        <TabsTrigger value="doing">Doing · {doing.length}</TabsTrigger>
        <TabsTrigger value="done">Done · {done.length}</TabsTrigger>
      </TabsList>
      <TabsContent value="open" className="mt-3">
        <TaskList
          tasks={openTasks}
          reorderable
          onReorder={reorderProjectTasks}
          emptyTitle="No open tasks"
          emptyDescription="Add the next concrete step for this project."
          {...listProps}
        />
      </TabsContent>
      <TabsContent value="doing" className="mt-3">
        <TaskList
          tasks={doing}
          emptyTitle="Nothing in motion"
          emptyDescription="Mark a task as doing when you start it."
          {...listProps}
        />
      </TabsContent>
      <TabsContent value="done" className="mt-3">
        <TaskList tasks={done} emptyTitle="Nothing finished yet" {...listProps} />
      </TabsContent>
    </Tabs>
  );
}
