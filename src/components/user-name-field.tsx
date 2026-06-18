"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UserNameField({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();

  function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await updateSettings({ userName: trimmed });
      toast.success("Name updated.");
    });
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Your name</Label>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="Gunner"
          className="max-w-xs"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={save}
          disabled={isPending || !name.trim() || name.trim() === initialName}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
