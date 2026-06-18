/**
 * Local command parser — handles natural language without an API key.
 *
 * Flow:
 *   normalize(input) → match intent → resolve entities via AppContext → call tool
 *
 * AppContext (pre-loaded by the API route) contains habits, tasks, projects.
 * The resolver uses fuzzy + alias matching so imperfect phrasing still works.
 */

import type { AssistantResult, PendingConfirmation } from "./types";
import type { HabitRow, TaskRow, ProjectRow } from "./resolver";
import {
  resolveHabits,
  resolveTasks,
  resolveProject,
  resolveProjects,
  suggestMatches,
} from "./resolver";
import {
  toolCheckHabit,
  toolCreateBrainDump,
  toolCreateTask,
  toolGetSummary,
  toolLogWork,
  toolMarkTaskDone,
  toolMarkTaskToday,
  toolUpdateProjectStatus,
  toolWriteDailyReview,
} from "./tools";

// ─── context ─────────────────────────────────────────────────────────────────

export interface AppContext {
  habits: HabitRow[];
  todayTasks: TaskRow[];
  allOpenTasks: TaskRow[];
  projects: ProjectRow[];
  todayKey: string;
}

// ─── normalization ────────────────────────────────────────────────────────────

// Filler words that never carry meaning
const FILLERS = /\b(for me|please|can you|could you|would you|in daily tasks?|in daily habits?|in my checklist|on the dashboard|in the app|like|about|roughly|around|approximately)\b/gi;

// Normalize natural-language time expressions to numeric forms
function normalizeTimeExpressions(text: string): string {
  return text
    .replace(/\ban?\s+hour\s+and\s+a\s+half\b/gi, "90 minutes")
    .replace(/\bhalf\s+an?\s+hour\b/gi, "30 minutes")
    .replace(/\ban?\s+hour\b/gi, "1 hour")
    .replace(/\ba\s+couple\s+(?:of\s+)?hours?\b/gi, "2 hours")
    .replace(/\ba\s+few\s+hours?\b/gi, "3 hours")
    .replace(/\ba\s+couple\s+(?:of\s+)?minutes?\b/gi, "2 minutes");
}

export function normalizeCommand(raw: string): string {
  return normalizeTimeExpressions(raw)
    .trim()
    .replace(FILLERS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── priority helper ──────────────────────────────────────────────────────────

function parsePriority(raw: string): "low" | "medium" | "high" | undefined {
  const lower = raw.toLowerCase();
  if (lower.includes("high")) return "high";
  if (lower.includes("low")) return "low";
  if (lower.includes("medium")) return "medium";
  return undefined;
}

// ─── ambiguity helpers ────────────────────────────────────────────────────────

function ambiguousHabit(results: ReturnType<typeof resolveHabits>): AssistantResult {
  const names = results.map((r) => `"${r.item.name}"`).join(", ");
  return { ok: true, message: `Found a few matching habits: ${names}. Which did you mean?` };
}

function ambiguousTask(results: ReturnType<typeof resolveTasks>): AssistantResult {
  const names = results.map((r) => `"${r.item.title}"`).join(", ");
  return { ok: true, message: `Found a few matching tasks: ${names}. Which did you mean?` };
}

function ambiguousProject(results: ReturnType<typeof resolveProjects>): AssistantResult {
  const names = results.map((r) => `"${r.item.name}"`).join(", ");
  return { ok: true, message: `Found a few matching projects: ${names}. Which did you mean?` };
}

function noHabitMatch(query: string, ctx: AppContext): AssistantResult {
  const suggestion = suggestMatches(query, ctx.habits, ctx.allOpenTasks, ctx.projects);
  return {
    ok: false,
    message: suggestion
      ? `Couldn't find a habit matching "${query}". ${suggestion}`
      : `No active habit found matching "${query}". Check your habit list in Settings.`,
  };
}

function noTaskMatch(query: string, ctx: AppContext): AssistantResult {
  const suggestion = suggestMatches(query, ctx.habits, ctx.allOpenTasks, ctx.projects);
  return {
    ok: false,
    message: suggestion
      ? `Couldn't find a task matching "${query}". ${suggestion}`
      : `No open task found matching "${query}". Try adding it first.`,
  };
}

function noProjectMatch(query: string, ctx: AppContext): AssistantResult {
  const suggestion = suggestMatches(query, ctx.habits, ctx.allOpenTasks, ctx.projects);
  return {
    ok: false,
    message: suggestion
      ? `Couldn't find a project matching "${query}". ${suggestion}`
      : `No active project found matching "${query}".`,
  };
}

// ─── confirmation factory ─────────────────────────────────────────────────────

function needsConfirm(
  action: string,
  payload: Record<string, unknown>,
  prompt: string
): AssistantResult {
  return {
    ok: true,
    message: prompt,
    needsConfirmation: { action: action as PendingConfirmation["action"], payload, prompt },
  };
}

// ─── habit check ─────────────────────────────────────────────────────────────

function tryCheckHabit(
  query: string,
  done: boolean,
  ctx: AppContext
): Promise<AssistantResult> | AssistantResult {
  const results = resolveHabits(query, ctx.habits);
  const best = results[0];

  // Clear winner
  if (best && best.score >= 60) {
    // If there's a close second, ask for clarification (gap < 15)
    if (results[1] && results[1].score >= 60 && best.score - results[1].score < 15) {
      return ambiguousHabit(results.slice(0, 2));
    }
    return toolCheckHabit(best.item.name, done);
  }

  // Try falling through to tasks if user might mean a task
  const taskResults = resolveTasks(query, [...ctx.todayTasks, ...ctx.allOpenTasks]);
  const bestTask = taskResults[0];

  if (bestTask && bestTask.score >= 60 && (!best || bestTask.score > best.score)) {
    if (done) return toolMarkTaskDone(bestTask.item.title);
    return { ok: false, message: `"${bestTask.item.title}" is a task, not a habit. Say "mark ${bestTask.item.title} done" to complete it.` };
  }

  return noHabitMatch(query, ctx);
}

// ─── ParseResult type ─────────────────────────────────────────────────────────

export type ParseResult =
  | { matched: true; result: Promise<AssistantResult> | AssistantResult }
  | { matched: true; confirmation: PendingConfirmation }
  | { matched: false };

// ─── main parser ─────────────────────────────────────────────────────────────

export function parseCommand(input: string, ctx: AppContext): ParseResult {
  const raw = normalizeCommand(input);
  const lower = raw.toLowerCase();
  let m: RegExpMatchArray | null;

  // ── HABITS ────────────────────────────────────────────────────────────────

  // "check off <name>" / "check <name>" / "mark <name> complete"
  m = raw.match(/^check(?:\s+off)?\s+(.+)$/i);
  if (!m) m = raw.match(/^mark\s+(.+?)\s+(?:complete|completed|done|as\s+done|as\s+complete)$/i);
  if (m) {
    return { matched: true, result: tryCheckHabit(m[1].trim(), true, ctx) };
  }

  // "uncheck <name>" / "undo <name>" / "mark <name> undone"
  m = raw.match(/^(?:uncheck|undo)\s+(.+)$/i);
  if (!m) m = raw.match(/^mark\s+(.+?)\s+undone$/i);
  if (m) {
    return { matched: true, result: tryCheckHabit(m[1].trim(), false, ctx) };
  }

  // "I [did/read/prayed/went to the gym/finished] <name>"
  m = raw.match(/^i\s+(?:did|read|prayed|prayed\s+today|went\s+to\s+the\s+gym|finished\s+my|did\s+my|completed\s+my|went\s+on)\s+(?:my\s+)?(.+)/i);
  if (m) {
    const query = m[1].trim();
    const habitResult = tryCheckHabit(query, true, ctx);
    if (habitResult instanceof Promise) return { matched: true, result: habitResult };
    if (habitResult.ok || habitResult.message.startsWith("Found a few")) {
      return { matched: true, result: habitResult };
    }
  }

  // "I prayed" / "I read" — short bare forms
  m = raw.match(/^i\s+(prayed|read|meditated|journaled|ran|exercised|worked\s+out|showered)$/i);
  if (m) {
    return { matched: true, result: tryCheckHabit(m[1].trim(), true, ctx) };
  }

  // "<name> done" — could be habit OR task
  m = raw.match(/^(.+?)\s+(?:is\s+)?done$/i);
  if (m && !lower.includes("task") && !lower.includes("project")) {
    const query = m[1].trim();
    // Try habit first, then task
    const habitRes = tryCheckHabit(query, true, ctx);
    const isHabitOk =
      !(habitRes instanceof Promise) &&
      (habitRes.ok || habitRes.message.startsWith("Found a few"));
    if (isHabitOk || habitRes instanceof Promise) {
      return { matched: true, result: habitRes };
    }
    // Fall through to task done handling below
    const taskResults = resolveTasks(query, [...ctx.todayTasks, ...ctx.allOpenTasks]);
    if (taskResults[0] && taskResults[0].score >= 50) {
      const top = taskResults[0];
      if (taskResults[1] && taskResults[1].score >= 50 && top.score - taskResults[1].score < 15) {
        return { matched: true, result: ambiguousTask(taskResults.slice(0, 2)) };
      }
      return { matched: true, result: toolMarkTaskDone(top.item.title) };
    }
  }

  // ── TASKS ─────────────────────────────────────────────────────────────────

  // "add [a] [priority] task [for today] [for <project>]: <title>"
  const addTaskForTodayRe = /^add\s+(?:a\s+)?(?:(high|low|medium)\s+priority\s+)?task\s+for\s+today[:\s]+(.+)/i;
  m = raw.match(addTaskForTodayRe);
  if (m) {
    const [, pri, title] = m;
    return {
      matched: true,
      result: toolCreateTask({ title: title.trim(), priority: parsePriority(pri ?? ""), today: true }),
    };
  }

  const addTaskRe = /^add\s+(?:a\s+)?(?:(high|low|medium)\s+priority\s+)?task(?:\s+for\s+([^:]+?))?[:\s]+(.+)/i;
  m = raw.match(addTaskRe);
  if (m) {
    const [, pri, projectFragment, title] = m;
    const proj = projectFragment?.trim();
    if (proj) {
      const pr = resolveProject(proj, ctx.projects);
      if (!pr) return { matched: true, result: noProjectMatch(proj, ctx) };
    }
    return {
      matched: true,
      result: toolCreateTask({
        title: title.trim(),
        priority: parsePriority(pri ?? ""),
        projectName: proj,
        today: /for today/i.test(raw),
      }),
    };
  }

  // "remind me to <task>" / "I need to <task>" / "make a task to <task>" / "create a task for <task>"
  m = raw.match(/^(?:remind\s+me\s+to|i\s+need\s+to|make\s+a\s+task\s+(?:to|for)|create\s+a\s+task\s+(?:to|for)|add\s+(?:a\s+)?task\s+to\s+do)[:\s]+(.+)/i);
  if (m) {
    return { matched: true, result: toolCreateTask({ title: m[1].trim(), today: false }) };
  }

  // "put <task> on today" / "add <task> to today"
  m = raw.match(/^(?:put|add)\s+(.+?)\s+(?:on|to)\s+today(?:'s\s+list)?$/i);
  if (m) {
    const query = m[1].trim();
    const taskRes = resolveTasks(query, ctx.allOpenTasks);
    if (taskRes[0] && taskRes[0].score >= 50) {
      return { matched: true, result: toolMarkTaskToday(taskRes[0].item.title) };
    }
    // No existing task found — create it as a today task
    return { matched: true, result: toolCreateTask({ title: query, today: true }) };
  }

  // "mark [task] <title> done" / "I finished <task>" / "I got <task> done" / "complete task <title>"
  m = raw.match(/^(?:mark|complete|finish)\s+(?:task\s+)?(.+?)\s+(?:as\s+)?done$/i);
  if (!m) m = raw.match(/^(?:complete|finish)\s+task\s+(.+)$/i);
  if (!m) m = raw.match(/^i\s+(?:finished|completed|got|checked\s+off)\s+(?:the\s+)?(?:task\s+)?(.+?)(?:\s+done)?$/i);
  if (m) {
    const query = m[1].trim();
    const taskResults = resolveTasks(query, [...ctx.todayTasks, ...ctx.allOpenTasks]);
    const best = taskResults[0];
    if (best && best.score >= 50) {
      if (taskResults[1] && taskResults[1].score >= 50 && best.score - taskResults[1].score < 15) {
        return { matched: true, result: ambiguousTask(taskResults.slice(0, 2)) };
      }
      return { matched: true, result: toolMarkTaskDone(best.item.title) };
    }
    return { matched: true, result: noTaskMatch(query, ctx) };
  }

  // "move task <title> to today"
  m = raw.match(/^(?:move|add)\s+(?:task\s+)?(.+?)\s+to\s+today$/i);
  if (m) {
    const query = m[1].trim();
    const taskResults = resolveTasks(query, ctx.allOpenTasks);
    const best = taskResults[0];
    if (best && best.score >= 50) {
      return { matched: true, result: toolMarkTaskToday(best.item.title) };
    }
    return { matched: true, result: noTaskMatch(query, ctx) };
  }

  // ── WORK LOG ──────────────────────────────────────────────────────────────

  // "log/add X hours/minutes [of work] [for/to <project>]"
  // "I worked/spent X hours/minutes on/for <project>"
  const workRe = /^(?:log|add|i\s+(?:worked|spent))\s+(\d+(?:\.\d+)?)\s*(hours?|h|minutes?|mins?|m)\s*(?:of\s+work\s*)?(?:(?:on|for|to)\s+(.+))?$/i;
  m = raw.match(workRe);
  if (m) {
    const [, amount, unit, projectFragment] = m;
    const minutes = /^h/i.test(unit) ? Math.round(parseFloat(amount) * 60) : parseInt(amount);
    if (minutes > 0 && minutes <= 720) {
      if (projectFragment) {
        const proj = resolveProject(projectFragment.trim(), ctx.projects);
        if (!proj) {
          const close = resolveProjects(projectFragment.trim(), ctx.projects, 3).filter(r => r.score >= 25);
          if (close.length > 0) {
            return { matched: true, result: ambiguousProject(close) };
          }
          return { matched: true, result: noProjectMatch(projectFragment.trim(), ctx) };
        }
        return { matched: true, result: toolLogWork({ minutes, projectName: proj.item.name }) };
      }
      return { matched: true, result: toolLogWork({ minutes }) };
    }
  }

  // ── BRAIN DUMP ────────────────────────────────────────────────────────────

  m = raw.match(/^(?:brain\s+dump|dump|create\s+(?:a\s+)?brain\s+dump(?:\s+idea)?|add\s+idea|idea|note\s+this|note|remember\s+this(?:\s+idea)?)[:\s]+(.+)/i);
  if (m) {
    return { matched: true, result: toolCreateBrainDump(m[1].trim()) };
  }

  // ── DAILY REVIEW ──────────────────────────────────────────────────────────

  m = raw.match(/^(?:write\s+(?:my\s+)?(?:daily\s+)?review|daily\s+review|review\s+today|write\s+(?:my\s+)?reflection)[:\s]+([\s\S]+)/i);
  if (m) {
    const text = m[1].trim();
    const structuredRe =
      /(?:(?:what\s*i?\s*)?got\s*done[:\s]+([^,]+))?[,;\s]*(?:(?:what\s*i?\s*)?avoided[:\s]+([^,]+))?[,;\s]*(?:(?:biggest\s*)?win[:\s]+([^,]+))?[,;\s]*(?:lesson[:\s]+([^,]+))?[,;\s]*(?:tomorrow[:\s]+([^,]+))?/i;
    const sm = text.match(structuredRe);
    if (sm && (sm[1] || sm[2] || sm[3] || sm[4] || sm[5])) {
      return {
        matched: true,
        result: toolWriteDailyReview({
          whatGotDone: sm[1]?.trim(),
          whatIAvoided: sm[2]?.trim(),
          biggestWin: sm[3]?.trim(),
          lesson: sm[4]?.trim(),
          tomorrowFocus: sm[5]?.trim(),
        }),
      };
    }
    return { matched: true, result: toolWriteDailyReview({ rawText: text }) };
  }

  // ── PROJECTS ──────────────────────────────────────────────────────────────

  // "mark <project> as completed/done" — requires confirmation
  // Guard: only match if it looks like a short project name, not a multi-step command
  m = raw.match(/^mark\s+(.+?)\s+as\s+(completed|done|finished)$/i);
  if (!m) {
    const finishM = raw.match(/^(?:complete|finish)\s+(?:project\s+)?(.+)$/i);
    // Reject if it contains multi-step indicators or is too long to be a project name
    if (finishM && !/ and | then | also | task /i.test(finishM[1]) && finishM[1].split(" ").length <= 8) {
      m = finishM;
    }
  }
  if (m) {
    const query = m[1].trim();
    const proj = resolveProject(query, ctx.projects);
    if (!proj) return { matched: true, result: noProjectMatch(query, ctx) };
    const c = needsConfirm(
      "update_project_status",
      { nameQuery: proj.item.name, status: "completed" },
      `Mark project "${proj.item.name}" as completed? This can be undone from the Project Map.`
    );
    return { matched: true, confirmation: c.needsConfirmation! };
  }

  // "pause [project] <name>"
  m = raw.match(/^pause\s+(?:project\s+)?(.+)$/i);
  if (m) {
    const query = m[1].trim();
    const proj = resolveProject(query, ctx.projects);
    if (!proj) return { matched: true, result: noProjectMatch(query, ctx) };
    const c = needsConfirm(
      "update_project_status",
      { nameQuery: proj.item.name, status: "paused" },
      `Pause project "${proj.item.name}"?`
    );
    return { matched: true, confirmation: c.needsConfirmation! };
  }

  // "activate/reopen/reactivate [project] <name>"
  m = raw.match(/^(?:activate|reopen|reactivate)\s+(?:project\s+)?(.+)$/i);
  if (m) {
    const query = m[1].trim();
    const proj = resolveProject(query, ctx.projects);
    if (!proj) return { matched: true, result: noProjectMatch(query, ctx) };
    return { matched: true, result: toolUpdateProjectStatus(proj.item.name, "active") };
  }

  // ── SUMMARY ──────────────────────────────────────────────────────────────

  if (
    /^(?:what(?:'s|\s+is|\s+should|\s+do\s+i)\s+(?:next|should\s+i\s+focus|focus)|next\s+(?:best\s+)?action|summary|status|how\s+am\s+i\s+doing)/i.test(lower)
  ) {
    return { matched: true, result: toolGetSummary() };
  }

  return { matched: false };
}

/** Execute a confirmed action by action name + payload. */
export async function executeConfirmedAction(
  action: string,
  payload: Record<string, unknown>
): Promise<AssistantResult> {
  if (action === "update_project_status") {
    return toolUpdateProjectStatus(
      payload.nameQuery as string,
      payload.status as "active" | "paused" | "completed" | "archived" | "idea"
    );
  }
  return { ok: false, message: "Unknown action." };
}
