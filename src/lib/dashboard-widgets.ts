import { z } from "zod";

export const widgetKeys = [
  "score",
  "focusHours",
  "checklist",
  "todayFocus",
  "overdue",
  "activeProjects",
  "recentIdeas",
  "dailyReview",
  "weekSnapshot",
  "assistant",
] as const;

export type WidgetKey = (typeof widgetKeys)[number];

const widgetSchema = z.object({
  score: z.boolean().default(true),
  focusHours: z.boolean().default(true),
  checklist: z.boolean().default(true),
  todayFocus: z.boolean().default(true),
  overdue: z.boolean().default(true),
  activeProjects: z.boolean().default(true),
  recentIdeas: z.boolean().default(true),
  dailyReview: z.boolean().default(false),
  weekSnapshot: z.boolean().default(false),
  assistant: z.boolean().default(true),
});

export type WidgetSettings = z.infer<typeof widgetSchema>;

export const widgetDefaults: WidgetSettings = widgetSchema.parse({});

export const widgetLabels: Record<WidgetKey, string> = {
  score: "Today's score",
  focusHours: "Focused hours",
  checklist: "Daily checklist",
  todayFocus: "Today's focus",
  overdue: "Overdue tasks",
  activeProjects: "Active projects",
  recentIdeas: "Recent ideas",
  dailyReview: "Daily review status",
  weekSnapshot: "Weekly snapshot",
  assistant: "AI Assistant",
};

export function parseWidgetSettings(json: string): WidgetSettings {
  try {
    return widgetSchema.parse(JSON.parse(json));
  } catch {
    return widgetDefaults;
  }
}
