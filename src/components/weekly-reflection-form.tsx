"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveWeeklyReview } from "@/app/actions/reviews";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface WeeklyReflectionFields {
  whatWorked: string;
  whatToFix: string;
  nextWeekFocus: string;
  notes: string;
}

const FIELDS: Array<{
  key: keyof WeeklyReflectionFields;
  label: string;
  placeholder: string;
}> = [
  {
    key: "whatWorked",
    label: "What worked this week?",
    placeholder: "Wins, momentum, things that clicked.",
  },
  {
    key: "whatToFix",
    label: "What needs to change?",
    placeholder: "Patterns to break, habits to fix, time leaks.",
  },
  {
    key: "nextWeekFocus",
    label: "Next week's focus?",
    placeholder: "One thing that makes next week a win.",
  },
  {
    key: "notes",
    label: "Notes (optional)",
    placeholder: "Anything else worth capturing.",
  },
];

export function WeeklyReflectionForm({
  weekStart,
  initial,
}: {
  weekStart: string;
  initial: WeeklyReflectionFields;
}) {
  const [fields, setFields] = useState<WeeklyReflectionFields>(initial);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {FIELDS.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label className="text-sm">{f.label}</Label>
          <Textarea
            value={fields[f.key]}
            onChange={(e) =>
              setFields((prev) => ({ ...prev, [f.key]: e.target.value }))
            }
            placeholder={f.placeholder}
            rows={2}
          />
        </div>
      ))}
      <Button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await saveWeeklyReview(weekStart, fields);
            toast.success("Reflection saved.");
          })
        }
      >
        {isPending ? "Saving…" : "Save reflection"}
      </Button>
    </div>
  );
}
