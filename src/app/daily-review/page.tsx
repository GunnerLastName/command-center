import Link from "next/link";
import { PencilLine } from "lucide-react";
import { ChangeReviewDate } from "@/components/change-review-date";
import { EmptyState } from "@/components/empty-state";
import { NotebookPen } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ReviewForm } from "@/components/review-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { appDateKey, formatDateKey, isValidDateKey } from "@/lib/dates";
import { getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DailyReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;

  // Use the app's operational day (respects day rollover setting).
  const settings = await getSettings();
  const rolloverHour = settings.dayRolloverHour ?? 2;
  const todayKey = appDateKey(new Date(), rolloverHour);

  const activeKey = date && isValidDateKey(date) ? date : todayKey;

  const [review, pastReviews] = await Promise.all([
    prisma.dailyReview.findUnique({ where: { date: activeKey } }),
    prisma.dailyReview.findMany({
      orderBy: { date: "desc" },
      take: 30,
    }),
  ]);

  const isToday = activeKey === todayKey;

  return (
    <div>
      <PageHeader
        title="Daily Review"
        subtitle={
          isToday
            ? "Close out the day with a clear head."
            : `Editing ${formatDateKey(activeKey, "EEEE, MMMM d")}`
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {formatDateKey(activeKey, "EEEE, MMMM d, yyyy")}
              </CardTitle>
              {review && <ChangeReviewDate date={activeKey} />}
            </CardHeader>
            <CardContent>
              <ReviewForm
                key={activeKey}
                date={activeKey}
                initial={{
                  whatGotDone: review?.whatGotDone ?? "",
                  whatIAvoided: review?.whatIAvoided ?? "",
                  biggestWin: review?.biggestWin ?? "",
                  lesson: review?.lesson ?? "",
                  tomorrowFocus: review?.tomorrowFocus ?? "",
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Past reviews
          </h2>
          {pastReviews.length === 0 ? (
            <EmptyState
              icon={NotebookPen}
              title="No reviews yet"
              description="Your first one starts tonight."
            />
          ) : (
            <div className="space-y-1.5">
              {pastReviews.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 transition-colors ${
                    r.date === activeKey
                      ? "border-muted-foreground/40 bg-muted/20"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <Link
                    href={`/daily-review?date=${r.date}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="text-sm font-medium">
                      {formatDateKey(r.date, "EEEE, MMM d")}
                      {r.date === todayKey && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          today
                        </span>
                      )}
                    </p>
                    {(r.biggestWin || r.whatGotDone) && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {r.biggestWin || r.whatGotDone}
                      </p>
                    )}
                  </Link>
                  <Link
                    href={`/daily-review?date=${r.date}`}
                    className="shrink-0 rounded p-0.5 text-muted-foreground/40 hover:text-muted-foreground"
                    title="Edit this review"
                  >
                    <PencilLine className="size-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
