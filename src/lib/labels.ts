// Shared labels and badge styles for status/priority strings.

export const PROJECT_STATUSES = [
  "idea",
  "active",
  "paused",
  "completed",
  "archived",
] as const;

export const TASK_STATUSES = ["todo", "doing", "done", "archived"] as const;

export const PRIORITIES = ["low", "medium", "high"] as const;

export const DUMP_STATUSES = [
  "inbox",
  "reviewed",
  "converted",
  "archived",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type DumpStatus = (typeof DUMP_STATUSES)[number];

export const projectStatusLabel: Record<string, string> = {
  idea: "Idea",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

export const projectStatusClass: Record<string, string> = {
  idea: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  paused: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  completed: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  archived: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export const taskStatusLabel: Record<string, string> = {
  todo: "To do",
  doing: "Doing",
  done: "Done",
  archived: "Archived",
};

export const priorityLabel: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const priorityClass: Record<string, string> = {
  low: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  medium: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  high: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export const dumpStatusLabel: Record<string, string> = {
  inbox: "Inbox",
  reviewed: "Reviewed",
  converted: "Converted",
  archived: "Archived",
};

// Status/priority are strings in SQLite, so SQL ORDER BY sorts them
// alphabetically ('high' < 'low' < 'medium'). Always sort in JS with these.
export const priorityRank: Record<string, number> = {
  high: 2,
  medium: 1,
  low: 0,
};

export const taskStatusRank: Record<string, number> = {
  doing: 0,
  todo: 1,
  done: 2,
  archived: 3,
};

/** Open tasks first (doing, then todo), then priority high→low, then oldest first. */
export function sortTasksForFocus<
  T extends { status: string; priority: string; createdAt: Date },
>(tasks: T[]): T[] {
  return [...tasks].sort(
    (a, b) =>
      (taskStatusRank[a.status] ?? 9) - (taskStatusRank[b.status] ?? 9) ||
      (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0) ||
      a.createdAt.getTime() - b.createdAt.getTime()
  );
}
