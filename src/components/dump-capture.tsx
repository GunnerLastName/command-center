"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createDump } from "@/app/actions/braindump";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectOption } from "@/lib/types";
import { NO_PROJECT, ProjectSelect } from "./quick-add";

/** The fast capture box at the top of Brain Dump. Title + Enter is enough. */
export function DumpCapture({ projects }: { projects: ProjectOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("");
  const [projectId, setProjectId] = useState(NO_PROJECT);
  const [areaId, setAreaId] = useState(NO_PROJECT);
  const titleRef = useRef<HTMLInputElement>(null);

  const selectedProject = projects.find((p) => p.id === projectId);
  const areas = selectedProject?.areas ?? [];

  function submit() {
    if (!title.trim()) return;
    startTransition(async () => {
      await createDump({
        title,
        notes,
        category,
        projectId: projectId === NO_PROJECT ? null : projectId,
        projectAreaId: areaId === NO_PROJECT ? null : areaId,
      });
      setTitle("");
      setNotes("");
      toast.success("Captured. Keep going.");
      titleRef.current?.focus();
    });
  }

  return (
    <Card className="mb-6">
      <CardContent className="space-y-3">
        <Input
          ref={titleRef}
          autoFocus
          placeholder="Empty your head — what's in there?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="h-10 text-base"
        />
        <Textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Category (optional)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-44"
          />
          <div className="w-44">
            <ProjectSelect
              projects={projects}
              value={projectId}
              onChange={(v) => {
                setProjectId(v);
                setAreaId(NO_PROJECT);
              }}
            />
          </div>
          {areas.length > 0 && (
            <Select value={areaId} onValueChange={setAreaId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="No area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT}>No area</SelectItem>
                {areas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={submit}
            disabled={isPending || !title.trim()}
            className="ml-auto"
          >
            Capture
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
