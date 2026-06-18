/**
 * Entity resolver — finds the best matching habit, task, or project
 * from pre-loaded app context using scoring:
 *   exact match > alias match > contains match > word overlap
 *
 * All functions are pure (no DB calls); data is passed in as parameters.
 */

import { HABIT_ALIASES, PROJECT_ALIASES, resolveAlias } from "./aliases";

export interface ResolveResult<T> {
  item: T;
  score: number; // 0–100
  matchedBy: "exact" | "alias" | "contains" | "wordOverlap" | "partial";
}

// ─── scoring helpers ─────────────────────────────────────────────────────────

function wordOverlapScore(query: string, name: string): number {
  const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const nWords = name.toLowerCase().split(/\s+/).filter(Boolean);
  if (qWords.length === 0 || nWords.length === 0) return 0;

  let matches = 0;
  for (const qw of qWords) {
    if (nWords.some((nw) => nw.includes(qw) || qw.includes(nw))) matches++;
  }
  const ratio = matches / Math.max(qWords.length, nWords.length);
  return Math.round(ratio * 65);
}

function score<T extends { name?: string; title?: string }>(
  query: string,
  item: T,
  aliasMap?: Record<string, string[]>
): ResolveResult<T> | null {
  const rawName = (item.name ?? (item as Record<string, unknown>).title ?? "") as string;
  const name = rawName.toLowerCase();
  const q = query.toLowerCase().trim();

  if (!name || !q) return null;

  // Exact
  if (name === q) return { item, score: 100, matchedBy: "exact" };

  // Alias
  if (aliasMap) {
    const canonical = resolveAlias(q, aliasMap);
    if (canonical && canonical.toLowerCase() === name)
      return { item, score: 95, matchedBy: "alias" };
    // Also check if the query itself is an alias pointing to THIS item
    const aliases = aliasMap[rawName] ?? [];
    if (aliases.some((a) => a.toLowerCase() === q))
      return { item, score: 95, matchedBy: "alias" };
    // Partial alias match (alias contains query or vice versa)
    if (aliases.some((a) => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))) {
      const partial = aliases.find(
        (a) => a.toLowerCase().includes(q) || q.includes(a.toLowerCase())
      )!;
      const ratio = Math.min(q.length, partial.length) / Math.max(q.length, partial.length);
      if (ratio > 0.6) return { item, score: Math.round(85 * ratio), matchedBy: "alias" };
    }
  }

  // Name contains query (e.g. query="bible" name="Read Bible")
  if (name.includes(q)) return { item, score: 80, matchedBy: "contains" };

  // Query contains name (e.g. query="read the bible today" name="Read Bible")
  if (q.includes(name)) return { item, score: 75, matchedBy: "contains" };

  // Word overlap
  const ws = wordOverlapScore(q, name);
  if (ws >= 30) return { item, score: ws, matchedBy: "wordOverlap" };

  // Partial: first significant word of the name matches something in the query
  const firstWord = name.split(" ")[0];
  if (firstWord.length >= 3 && q.includes(firstWord)) {
    return { item, score: 50, matchedBy: "partial" };
  }

  return null;
}

// ─── public resolvers ────────────────────────────────────────────────────────

export type HabitRow = { id: string; name: string; timesPerDay: number };
export type TaskRow = { id: string; title: string; status: string; today: boolean };
export type ProjectRow = { id: string; name: string; status: string };

/** Find the best-matching active habit. */
export function resolveHabit(
  query: string,
  habits: HabitRow[]
): ResolveResult<HabitRow> | null {
  const results = habits
    .map((h) => score(query, { ...h, name: h.name }, HABIT_ALIASES))
    .filter((r): r is ResolveResult<HabitRow> => r !== null)
    .sort((a, b) => b.score - a.score);
  return results[0] ?? null;
}

/** Return top-N habit matches (for ambiguity detection). */
export function resolveHabits(
  query: string,
  habits: HabitRow[],
  limit = 3
): ResolveResult<HabitRow>[] {
  return habits
    .map((h) => score(query, { ...h, name: h.name }, HABIT_ALIASES))
    .filter((r): r is ResolveResult<HabitRow> => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Find the best-matching task. */
export function resolveTask(
  query: string,
  tasks: TaskRow[]
): ResolveResult<TaskRow> | null {
  const results = tasks
    .map((t) => {
      const r = score(query, { ...t, name: t.title });
      if (!r) return null;
      return { item: t, score: r.score, matchedBy: r.matchedBy } satisfies ResolveResult<TaskRow>;
    })
    .filter((r): r is ResolveResult<TaskRow> => r !== null)
    .sort((a, b) => b.score - a.score);
  return results[0] ?? null;
}

/** Return top-N task matches. */
export function resolveTasks(
  query: string,
  tasks: TaskRow[],
  limit = 3
): ResolveResult<TaskRow>[] {
  return tasks
    .map((t) => {
      const r = score(query, { ...t, name: t.title });
      if (!r) return null;
      return { item: t, score: r.score, matchedBy: r.matchedBy } satisfies ResolveResult<TaskRow>;
    })
    .filter((r): r is ResolveResult<TaskRow> => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Find the best-matching project. */
export function resolveProject(
  query: string,
  projects: ProjectRow[]
): ResolveResult<ProjectRow> | null {
  const results = projects
    .map((p) => score(query, { ...p, name: p.name }, PROJECT_ALIASES))
    .filter((r): r is ResolveResult<ProjectRow> => r !== null)
    .sort((a, b) => b.score - a.score);
  return results[0] ?? null;
}

/** Return top-N project matches. */
export function resolveProjects(
  query: string,
  projects: ProjectRow[],
  limit = 3
): ResolveResult<ProjectRow>[] {
  return projects
    .map((p) => score(query, { ...p, name: p.name }, PROJECT_ALIASES))
    .filter((r): r is ResolveResult<ProjectRow> => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Suggest closest matches when nothing meets the confidence threshold. */
export function suggestMatches(
  query: string,
  habits: HabitRow[],
  tasks: TaskRow[],
  projects: ProjectRow[]
): string {
  const habitMatches = resolveHabits(query, habits, 2)
    .filter((r) => r.score >= 25)
    .map((r) => `"${r.item.name}" (habit)`);
  const taskMatches = resolveTasks(query, tasks, 2)
    .filter((r) => r.score >= 25)
    .map((r) => `"${r.item.title}" (task)`);
  const projectMatches = resolveProjects(query, projects, 2)
    .filter((r) => r.score >= 25)
    .map((r) => `"${r.item.name}" (project)`);

  const all = [...habitMatches, ...taskMatches, ...projectMatches].slice(0, 3);
  if (all.length === 0) return "";
  return `Did you mean: ${all.join(", ")}?`;
}
