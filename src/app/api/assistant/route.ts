import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseCommand, executeConfirmedAction } from "@/lib/assistant/parser";
import type { AppContext } from "@/lib/assistant/parser";
import { hasApiKey, runWithClaude } from "@/lib/assistant/claude";
import type { AssistantResult } from "@/lib/assistant/types";
import { prisma } from "@/lib/db";
import { appDateKey } from "@/lib/dates";

const bodySchema = z.object({
  command: z.string().trim().min(1),
  confirm: z
    .object({
      action: z.string(),
      payload: z.record(z.string(), z.unknown()),
    })
    .optional(),
});

/** Load the app context needed by the parser and Claude. One DB round-trip each. */
async function loadAppContext(): Promise<AppContext> {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const rolloverHour = settings?.dayRolloverHour ?? 2;
  const todayKey = appDateKey(new Date(), rolloverHour);

  const [habits, todayTasks, allOpenTasks, projects] = await Promise.all([
    prisma.dailyHabit.findMany({
      where: { active: true },
      select: { id: true, name: true, timesPerDay: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.task.findMany({
      where: { today: true, status: { notIn: ["done", "archived"] } },
      select: { id: true, title: true, status: true, today: true },
    }),
    prisma.task.findMany({
      where: { status: { in: ["todo", "doing"] } },
      select: { id: true, title: true, status: true, today: true },
    }),
    prisma.project.findMany({
      where: { status: { in: ["active", "paused"] } },
      select: { id: true, name: true, status: true },
    }),
  ]);

  return { habits, todayTasks, allOpenTasks, projects, todayKey };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Missing command." }, { status: 400 });
  }

  const { command, confirm } = parsed.data;

  // ── Confirmed action ───────────────────────────────────────────────────────
  if (confirm) {
    try {
      const result = await executeConfirmedAction(confirm.action, confirm.payload);
      return NextResponse.json(result);
    } catch (err) {
      console.error("[assistant] confirmed action error:", err);
      return NextResponse.json({ ok: false, message: "Action failed." }, { status: 500 });
    }
  }

  // Load context once, shared by parser + Claude
  const ctx = await loadAppContext();

  // ── Local parser first ─────────────────────────────────────────────────────
  const localResult = parseCommand(command, ctx);

  if (localResult.matched) {
    if ("confirmation" in localResult) {
      return NextResponse.json({
        ok: true,
        message: localResult.confirmation.prompt,
        needsConfirmation: localResult.confirmation,
      } satisfies AssistantResult);
    }
    try {
      const result = await localResult.result;
      return NextResponse.json(result);
    } catch (err) {
      console.error("[assistant] tool error:", err);
      return NextResponse.json(
        { ok: false, message: "Command failed — check the logs." },
        { status: 500 }
      );
    }
  }

  // ── Claude API fallback ────────────────────────────────────────────────────
  if (!hasApiKey()) {
    return NextResponse.json({
      ok: false,
      message:
        "Command not recognized. Add ANTHROPIC_API_KEY to .env.local for natural language support.",
    });
  }

  try {
    const claudeResult = await runWithClaude(command, ctx);
    if (!claudeResult) {
      return NextResponse.json({
        ok: false,
        message: "Could not interpret that command. Try rephrasing.",
      });
    }
    if (claudeResult.needsConfirmation) {
      return NextResponse.json({
        ok: true,
        message: claudeResult.needsConfirmation.prompt,
        needsConfirmation: claudeResult.needsConfirmation,
      } satisfies AssistantResult);
    }
    return NextResponse.json(claudeResult.result ?? { ok: false, message: "No result." });
  } catch (err) {
    console.error("[assistant] Claude API error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    const friendly = msg.includes("401") || msg.includes("invalid") || msg.includes("auth")
      ? "Invalid API key — check ANTHROPIC_API_KEY in .env.local."
      : msg.includes("402") || msg.includes("credit") || msg.includes("balance")
      ? "No API credits — add a payment method at console.anthropic.com → Billing."
      : msg.includes("429") || msg.includes("rate")
      ? "Rate limited — wait a moment and try again."
      : `AI request failed: ${msg.slice(0, 120)}`;
    return NextResponse.json({ ok: false, message: friendly }, { status: 500 });
  }
}
