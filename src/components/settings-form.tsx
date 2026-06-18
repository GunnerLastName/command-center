"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SettingsData {
  dailyMinimumHours: number;
  dailyStretchHours: number;
  workScoreWeight: number;
  habitsScoreWeight: number;
  tasksScoreWeight: number;
  reviewScoreWeight: number;
  theme: string;
  dayRolloverHour: number;
}

export function SettingsForm({ settings }: { settings: SettingsData }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    dailyMinimumHours: String(settings.dailyMinimumHours),
    dailyStretchHours: String(settings.dailyStretchHours),
    workScoreWeight: String(settings.workScoreWeight),
    habitsScoreWeight: String(settings.habitsScoreWeight),
    tasksScoreWeight: String(settings.tasksScoreWeight),
    reviewScoreWeight: String(settings.reviewScoreWeight),
    theme: settings.theme,
    dayRolloverHour: String(settings.dayRolloverHour),
  });

  const weightSum =
    (Number(form.workScoreWeight) || 0) +
    (Number(form.habitsScoreWeight) || 0) +
    (Number(form.tasksScoreWeight) || 0) +
    (Number(form.reviewScoreWeight) || 0);

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    const hours = (v: string) => Math.min(24, Math.max(0, Number(v) || 0));
    const weight = (v: string) =>
      Math.min(100, Math.max(0, Math.round(Number(v) || 0)));
    const minimum = hours(form.dailyMinimumHours);
    startTransition(async () => {
      await updateSettings({
        dailyMinimumHours: minimum,
        dailyStretchHours: Math.max(minimum, hours(form.dailyStretchHours)),
        workScoreWeight: weight(form.workScoreWeight),
        habitsScoreWeight: weight(form.habitsScoreWeight),
        tasksScoreWeight: weight(form.tasksScoreWeight),
        reviewScoreWeight: weight(form.reviewScoreWeight),
        theme: form.theme,
        dayRolloverHour: Math.min(12, Math.max(0, Number(form.dayRolloverHour) || 0)),
      });
      toast.success("Standards updated.");
    });
  }

  const numberField = (
    label: string,
    key: keyof typeof form,
    props: { min?: number; max?: number; step?: string } = {}
  ) => (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        {...props}
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-3 text-sm font-medium">Work hour targets</h3>
        <div className="grid grid-cols-2 gap-3">
          {numberField("Minimum hours / day", "dailyMinimumHours", {
            min: 0,
            max: 24,
            step: "0.5",
          })}
          {numberField("Stretch hours / day", "dailyStretchHours", {
            min: 0,
            max: 24,
            step: "0.5",
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-medium">Daily score weights</h3>
        <p
          className={`mb-3 text-xs ${
            weightSum === 100 ? "text-muted-foreground" : "text-amber-400"
          }`}
        >
          Total: {weightSum}%{weightSum !== 100 && " — aim for 100%"}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {numberField("Work hours %", "workScoreWeight", { min: 0, max: 100 })}
          {numberField("Habits %", "habitsScoreWeight", { min: 0, max: 100 })}
          {numberField("Today's tasks %", "tasksScoreWeight", {
            min: 0,
            max: 100,
          })}
          {numberField("Daily review %", "reviewScoreWeight", {
            min: 0,
            max: 100,
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-medium">Day rollover time</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Before this hour, the app treats it as the previous day. Useful if
          you work past midnight.
        </p>
        <Select
          value={form.dayRolloverHour}
          onValueChange={(v) => set("dayRolloverHour", v)}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Midnight (no rollover)</SelectItem>
            <SelectItem value="1">1:00 AM</SelectItem>
            <SelectItem value="2">2:00 AM (default)</SelectItem>
            <SelectItem value="3">3:00 AM</SelectItem>
            <SelectItem value="4">4:00 AM</SelectItem>
            <SelectItem value="5">5:00 AM</SelectItem>
            <SelectItem value="6">6:00 AM</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={submit} disabled={isPending}>
        {isPending ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
