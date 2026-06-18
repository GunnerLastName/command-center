import Link from "next/link";
import { ArrowRight, Check, Circle, Flame, Settings } from "lucide-react";
import { HabitChecklist } from "@/components/habit-checklist";
import { PageHeader } from "@/components/page-header";
import { ScoreHistoryChart } from "@/components/score-history-chart";
import { ScoreRing } from "@/components/score-ring";
import { WorkProgress } from "@/components/work-progress";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatHours, formatInAppTz } from "@/lib/dates";
import {
  getHabitStreaks,
  getScoreHistory,
  getTodayStandards,
} from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function BreakdownRow({
  label,
  detail,
  fraction,
  weight,
  counted,
}: {
  label: string;
  detail: string;
  fraction: number;
  weight: number;
  counted: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span>
          {label}{" "}
          <span className="text-xs text-muted-foreground">({weight}%)</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {counted ? detail : "Not counted today"}
        </span>
      </div>
      <Progress value={counted ? fraction * 100 : 0} />
    </div>
  );
}

export default async function StandardsPage() {
  const standards = await getTodayStandards();
  const rolloverHour = standards.settings.dayRolloverHour ?? 2;
  const [streaks, history] = await Promise.all([
    getHabitStreaks(rolloverHour),
    getScoreHistory(14, rolloverHour),
  ]);
  const {
    settings,
    todayKey: key,
    workedMinutes,
    habits,
    breakdown,
    reviewDone,
    habitPointsDone,
    habitPointsTotal,
    todayTasksDone,
    todayTasksTotal,
  } = standards;
  const habitItems = habits.map((h) => ({
    id: h.id,
    name: h.name,
    description: h.description,
    category: h.category,
    points: h.points,
    timesPerDay: h.timesPerDay,
    completedCount: h.completions[0]?.completedCount ?? 0,
    done: h.completions[0]?.completed ?? false,
  }));

  return (
    <div>
      <PageHeader
        title="Daily Standards"
        subtitle={formatInAppTz(new Date(), "EEEE, MMMM d")}
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/settings">
            <Settings className="size-3.5" /> Edit standards
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <ScoreRing score={breakdown.score} size={180} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Score breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <BreakdownRow
              label="Work hours"
              detail={`${formatHours(workedMinutes)}h of ${settings.dailyStretchHours}h`}
              fraction={breakdown.work.fraction}
              weight={breakdown.work.weight}
              counted={breakdown.work.counted}
            />
            <BreakdownRow
              label="Daily habits"
              detail={`${Math.round(habitPointsDone * 10) / 10}/${habitPointsTotal} points`}
              fraction={breakdown.habits.fraction}
              weight={breakdown.habits.weight}
              counted={breakdown.habits.counted}
            />
            <BreakdownRow
              label="Today's tasks"
              detail={`${todayTasksDone}/${todayTasksTotal} done`}
              fraction={breakdown.tasks.fraction}
              weight={breakdown.tasks.weight}
              counted={breakdown.tasks.counted}
            />
            <BreakdownRow
              label="Daily review"
              detail={reviewDone ? "Written" : "Not yet"}
              fraction={breakdown.review.fraction}
              weight={breakdown.review.weight}
              counted={breakdown.review.counted}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Work hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums">
                {formatHours(workedMinutes)}h
              </span>
              <span className="text-sm text-muted-foreground">
                of {settings.dailyMinimumHours}h minimum /{" "}
                {settings.dailyStretchHours}h stretch
              </span>
            </div>
            <WorkProgress
              minutes={workedMinutes}
              minimumHours={settings.dailyMinimumHours}
              stretchHours={settings.dailyStretchHours}
            />
            <Button asChild variant="outline" size="sm">
              <Link href="/work-log">
                Open work log <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Habit checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            {habitItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active habits.{" "}
                <Link href="/settings" className="underline hover:text-foreground">
                  Add some in Settings.
                </Link>
              </p>
            ) : (
              <HabitChecklist habits={habitItems} dateKey={key} />
            )}
            <div className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
              <div className="flex items-center gap-2">
                {todayTasksTotal > 0 && todayTasksDone === todayTasksTotal ? (
                  <Check className="size-4 text-primary" />
                ) : (
                  <Circle className="size-4 text-muted-foreground/50" />
                )}
                <span>
                  Today&apos;s tasks · {todayTasksDone}/{todayTasksTotal}
                </span>
                <Link
                  href="/today"
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                >
                  Open
                </Link>
              </div>
              <div className="flex items-center gap-2">
                {reviewDone ? (
                  <Check className="size-4 text-primary" />
                ) : (
                  <Circle className="size-4 text-muted-foreground/50" />
                )}
                <span>Daily review</span>
                <Link
                  href="/daily-review"
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                >
                  {reviewDone ? "Open" : "Write it"}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last 14 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreHistoryChart points={history} />
            <p className="mt-2 text-xs text-muted-foreground">
              Dashed lines: 75% minimum, 90% strong. Past days score work +
              habits + review; today includes tasks too.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Streaks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {streaks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active habits yet.
              </p>
            ) : (
              streaks.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                >
                  <Flame
                    className={cn(
                      "size-4 shrink-0",
                      s.current >= 3
                        ? "fill-amber-400 text-amber-400"
                        : s.current >= 1
                          ? "text-amber-400"
                          : "text-muted-foreground/40"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.current} day{s.current === 1 ? "" : "s"} · best {s.best}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {s.last7.map((done, i) => (
                      <span
                        key={i}
                        className={cn(
                          "size-2 rounded-full",
                          done === null
                            ? "bg-muted/30"
                            : done
                              ? "bg-primary"
                              : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
