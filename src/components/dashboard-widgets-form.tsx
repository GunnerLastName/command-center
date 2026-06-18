"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSettings } from "@/app/actions/settings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { widgetKeys, widgetLabels, type WidgetSettings } from "@/lib/dashboard-widgets";

export function DashboardWidgetsForm({ widgets: initial }: { widgets: WidgetSettings }) {
  const [widgets, setWidgets] = useState(initial);
  const [, startTransition] = useTransition();

  function toggle(key: keyof WidgetSettings, value: boolean) {
    const updated = { ...widgets, [key]: value };
    setWidgets(updated);
    startTransition(async () => {
      await updateSettings({ dashboardWidgets: JSON.stringify(updated) });
      toast.success("Dashboard updated.");
    });
  }

  return (
    <div className="space-y-3">
      {widgetKeys.map((key) => (
        <div key={key} className="flex items-center justify-between">
          <Label className="text-sm font-normal">{widgetLabels[key]}</Label>
          <Switch
            checked={widgets[key]}
            onCheckedChange={(v) => toggle(key, v)}
          />
        </div>
      ))}
    </div>
  );
}
