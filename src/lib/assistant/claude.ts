/**
 * Claude API integration for the assistant.
 * Only used when ANTHROPIC_API_KEY is set in .env.local.
 * If no key, returns null — caller falls back to local parser.
 *
 * Architecture: Claude uses tool_use to select and parameterize one of the
 * assistant tool functions. We execute that tool server-side and return the result.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { AssistantResult, PendingConfirmation } from "./types";
import type { AppContext } from "./parser";
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

export function hasApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// ─── tool definitions ────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "create_task",
    description: "Create a new task, optionally marked for today, with optional priority and project.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title" },
        priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority" },
        projectName: { type: "string", description: "Project name (fuzzy matched)" },
        today: { type: "boolean", description: "Add to today's list" },
      },
      required: ["title"],
    },
  },
  {
    name: "mark_task_done",
    description: "Mark an open task as done by fuzzy-matching its title.",
    input_schema: {
      type: "object",
      properties: { titleQuery: { type: "string", description: "Partial or full task title" } },
      required: ["titleQuery"],
    },
  },
  {
    name: "mark_task_today",
    description: "Move a task onto today's list.",
    input_schema: {
      type: "object",
      properties: { titleQuery: { type: "string" } },
      required: ["titleQuery"],
    },
  },
  {
    name: "check_habit",
    description: "Check off (or uncheck) a habit for today.",
    input_schema: {
      type: "object",
      properties: {
        nameQuery: { type: "string", description: "Habit name (fuzzy matched)" },
        done: { type: "boolean", description: "true to check off, false to uncheck" },
      },
      required: ["nameQuery", "done"],
    },
  },
  {
    name: "log_work",
    description: "Log a manual work session for today.",
    input_schema: {
      type: "object",
      properties: {
        minutes: { type: "number", description: "Duration in minutes" },
        projectName: { type: "string", description: "Project name (fuzzy matched)" },
        description: { type: "string" },
      },
      required: ["minutes"],
    },
  },
  {
    name: "create_brain_dump",
    description: "Add an item to the brain dump inbox.",
    input_schema: {
      type: "object",
      properties: { title: { type: "string" } },
      required: ["title"],
    },
  },
  {
    name: "write_daily_review",
    description: "Save today's daily review. Pass individual fields or rawText for freeform.",
    input_schema: {
      type: "object",
      properties: {
        whatGotDone: { type: "string" },
        whatIAvoided: { type: "string" },
        biggestWin: { type: "string" },
        lesson: { type: "string" },
        tomorrowFocus: { type: "string" },
        rawText: { type: "string", description: "Freeform text saved as whatGotDone" },
      },
    },
  },
  {
    name: "update_project_status",
    description:
      "Change a project's status. Completing or archiving a project MUST be confirmed first — set needsConfirmation=true.",
    input_schema: {
      type: "object",
      properties: {
        nameQuery: { type: "string" },
        status: { type: "string", enum: ["active", "paused", "completed", "archived", "idea"] },
        needsConfirmation: {
          type: "boolean",
          description: "Set true for completed/archived to require user confirmation",
        },
      },
      required: ["nameQuery", "status"],
    },
  },
  {
    name: "get_summary",
    description: "Return a summary of today: hours worked, open tasks, pending habits.",
    input_schema: { type: "object", properties: {} },
  },
];

async function executeToolUse(toolUse: Anthropic.ToolUseBlock): Promise<ClaudeResult> {
  const inp = toolUse.input as Record<string, unknown>;

  switch (toolUse.name) {
    case "create_task":
      return {
        result: await toolCreateTask({
          title: inp.title as string,
          priority: inp.priority as "low" | "medium" | "high" | undefined,
          projectName: inp.projectName as string | undefined,
          today: (inp.today as boolean | undefined) ?? false,
        }),
      };
    case "mark_task_done":
      return { result: await toolMarkTaskDone(inp.titleQuery as string) };
    case "mark_task_today":
      return { result: await toolMarkTaskToday(inp.titleQuery as string) };
    case "check_habit":
      return { result: await toolCheckHabit(inp.nameQuery as string, inp.done as boolean) };
    case "log_work":
      return {
        result: await toolLogWork({
          minutes: inp.minutes as number,
          projectName: inp.projectName as string | undefined,
          description: inp.description as string | undefined,
        }),
      };
    case "create_brain_dump":
      return { result: await toolCreateBrainDump(inp.title as string) };
    case "write_daily_review":
      return {
        result: await toolWriteDailyReview({
          whatGotDone: inp.whatGotDone as string | undefined,
          whatIAvoided: inp.whatIAvoided as string | undefined,
          biggestWin: inp.biggestWin as string | undefined,
          lesson: inp.lesson as string | undefined,
          tomorrowFocus: inp.tomorrowFocus as string | undefined,
          rawText: inp.rawText as string | undefined,
        }),
      };
    case "update_project_status": {
      const status = inp.status as "active" | "paused" | "completed" | "archived" | "idea";
      if (inp.needsConfirmation) {
        const name = inp.nameQuery as string;
        return {
          needsConfirmation: {
            action: "update_project_status",
            payload: { nameQuery: name, status },
            prompt: `Mark project "${name}" as ${status}?`,
          },
        };
      }
      return { result: await toolUpdateProjectStatus(inp.nameQuery as string, status) };
    }
    case "get_summary":
      return { result: await toolGetSummary() };
    default:
      return { result: { ok: false, message: `Unknown tool: ${toolUse.name}` } };
  }
}

function buildSystemPrompt(ctx: AppContext): string {
  const habitList =
    ctx.habits.length > 0
      ? ctx.habits.map((h) => `  - ${h.name}`).join("\n")
      : "  (none configured)";

  const todayTaskList =
    ctx.todayTasks.length > 0
      ? ctx.todayTasks.map((t) => `  - ${t.title}`).join("\n")
      : "  (none on today's list)";

  const projectList =
    ctx.projects.length > 0
      ? ctx.projects.map((p) => `  - ${p.name} [${p.status}]`).join("\n")
      : "  (none active)";

  return `You are the Command Center assistant — a calm, direct productivity tool.
Your job is to call the right tool(s) based on the user's natural language command.
If the command has multiple parts (e.g. "finish X and create Y"), call one tool per action — you may call multiple tools.
Do not explain what you are doing — just call the tools.

Today's date key: ${ctx.todayKey}

Active habits (use these exact names for check_habit nameQuery):
${habitList}

Today's tasks (use these exact titles for mark_task_done/mark_task_today titleQuery):
${todayTaskList}

Active/paused projects (use these exact names for projectName / nameQuery):
${projectList}

Rules:
- For "complete project" or "archive project" commands, call update_project_status with needsConfirmation=true.
- For project "pause" commands, call update_project_status with needsConfirmation=true.
- For all other commands, call the tool directly.
- Use the exact habit/task/project names listed above when they match the user's intent.
- "today" and "for today" both mean today=true on a task.
- If the user logs hours, convert to minutes (e.g. "2 hours" = 120 minutes).
- If the intent is unclear, call get_summary.`;
}

// ─── main entry ──────────────────────────────────────────────────────────────

export interface ClaudeResult {
  result?: AssistantResult;
  needsConfirmation?: PendingConfirmation;
}

export async function runWithClaude(command: string, ctx: AppContext): Promise<ClaudeResult | null> {
  if (!hasApiKey()) return null;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: buildSystemPrompt(ctx),
    tools: TOOLS,
    messages: [{ role: "user", content: command }],
  });

  const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  if (toolUses.length === 0) return null;

  // Execute all tool calls in sequence, stop early if one needs confirmation
  const results: AssistantResult[] = [];
  for (const toolUse of toolUses) {
    const outcome = await executeToolUse(toolUse);
    if (outcome.needsConfirmation) {
      // If we already did some work, report that first next time
      return outcome;
    }
    if (outcome.result) results.push(outcome.result);
  }

  if (results.length === 0) return null;
  if (results.length === 1) return { result: results[0] };

  // Combine multiple results into one message
  const allOk = results.every((r) => r.ok);
  const message = results.map((r) => r.message).join(" · ");
  return { result: { ok: allOk, message } };
}
