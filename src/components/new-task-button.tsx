"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectOption } from "@/lib/types";
import { TaskDialog } from "./task-dialog";

export function NewTaskButton({
  projects,
  defaultProjectId,
}: {
  projects: ProjectOption[];
  defaultProjectId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" /> New task
      </Button>
      <TaskDialog
        open={open}
        onOpenChange={setOpen}
        projects={projects}
        defaultProjectId={defaultProjectId}
      />
    </>
  );
}
