"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveDailyReview } from "@/app/actions/reviews";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ReviewFields {
  whatGotDone: string;
  whatIAvoided: string;
  biggestWin: string;
  lesson: string;
  tomorrowFocus: string;
}

const FIELDS: Array<{ key: keyof ReviewFields; label: string; placeholder: string }> = [
  {
    key: "whatGotDone",
    label: "What did I get done?",
    placeholder: "The real output, not the busywork.",
  },
  {
    key: "whatIAvoided",
    label: "What did I avoid?",
    placeholder: "Name it. That's usually tomorrow's first move.",
  },
  {
    key: "biggestWin",
    label: "Biggest win?",
    placeholder: "One thing that moved the needle.",
  },
  {
    key: "lesson",
    label: "Lesson from today?",
    placeholder: "What would you tell yesterday-you?",
  },
  {
    key: "tomorrowFocus",
    label: "Tomorrow's focus?",
    placeholder: "The next best action when you sit down.",
  },
];

export function ReviewForm({
  date,
  initial,
}: {
  date: string;
  initial: ReviewFields;
}) {
  const [fields, setFields] = useState<ReviewFields>(initial);
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
            await saveDailyReview(date, fields);
            toast.success("Review saved. Day closed out.");
          })
        }
      >
        {isPending ? "Saving…" : "Save review"}
      </Button>
    </div>
  );
}
