import Link from "next/link";
import { DashboardWidgetsForm } from "@/components/dashboard-widgets-form";
import { HabitManager } from "@/components/habit-manager";
import { KeyboardShortcutSettings } from "@/components/keyboard-shortcut-settings";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings-form";
import { ThemePicker } from "@/components/theme-picker";
import { UserNameField } from "@/components/user-name-field";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { parseWidgetSettings } from "@/lib/dashboard-widgets";
import { parseShortcutSettings } from "@/lib/shortcuts";
import { getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, habits] = await Promise.all([
    getSettings(),
    prisma.dailyHabit.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Your standards. Change them when life changes."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Standards & scoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsForm
              settings={{
                dailyMinimumHours: settings.dailyMinimumHours,
                dailyStretchHours: settings.dailyStretchHours,
                workScoreWeight: settings.workScoreWeight,
                habitsScoreWeight: settings.habitsScoreWeight,
                tasksScoreWeight: settings.tasksScoreWeight,
                reviewScoreWeight: settings.reviewScoreWeight,
                theme: settings.theme,
                dayRolloverHour: settings.dayRolloverHour ?? 2,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily habits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HabitManager
              habits={habits.map((h) => ({
                id: h.id,
                name: h.name,
                description: h.description,
                category: h.category,
                points: h.points,
                active: h.active,
                scheduleDays: h.scheduleDays,
                timesPerDay: h.timesPerDay,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Personalization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <UserNameField initialName={settings.userName} />
          <div>
            <p className="mb-3 text-sm font-medium">Dashboard widgets</p>
            <DashboardWidgetsForm
              widgets={parseWidgetSettings(settings.dashboardWidgets)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ThemePicker currentTheme={settings.theme ?? "dark"} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KeyboardShortcutSettings
            initialShortcuts={parseShortcutSettings(settings.keyboardShortcuts ?? "{}")}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            App / Mobile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">App name</span>
            <span className="font-medium">Command Center</span>
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Runtime</span>
            <span className="font-medium">Local · Next.js dev server</span>
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Data</span>
            <span className="font-medium">Local SQLite (prisma/dev.db)</span>
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Phone access</span>
            <span className="font-medium">Same Wi-Fi or Tailscale</span>
          </div>
          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Desktop (Chrome):</span>{" "}
              open <span className="text-foreground">localhost:3000</span> →{" "}
              <span className="text-foreground">⋮ → Install Command Center</span>
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">iPhone (Safari):</span>{" "}
              requires{" "}
              <code className="rounded bg-muted/60 px-1 text-foreground/80">npm run dev:host</code>{" "}
              + the PC local IP or Tailscale IP, then Share → Add to Home Screen.
            </p>
            <Link
              href="/mobile-setup"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View iPhone setup guide →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
