"use client";

import { useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { moveDailyReview } from "@/app/actions/reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChangeReviewDate({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState(date);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!newDate || newDate === date) return;
    startTransition(async () => {
      try {
        await moveDailyReview(date, newDate);
      } catch (err) {
        if (isRedirectError(err)) throw err;
        toast.error(err instanceof Error ? err.message : "Could not move review.");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <CalendarClock className="size-3.5" />
        Change date
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={newDate}
        onChange={(e) => setNewDate(e.target.value)}
        className="h-7 w-40 text-xs"
      />
      <Button size="sm" disabled={isPending || !newDate || newDate === date} onClick={submit}>
        Move
      </Button>
      <button
        onClick={() => { setOpen(false); setNewDate(date); }}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Cancel
      </button>
    </div>
  );
}
