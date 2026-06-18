# Command Center

Gunner's personal founder/agency command center: external brain, daily
execution system, project map, habit tracker, and work-hour tracker.
Local-first, single user, no auth. **All core data persists in SQLite via
Prisma — never store projects, tasks, habits, sessions, reviews, or settings
only in React state or localStorage.**

## Heads up: newer-than-training-data stack

This project uses Next.js 16 and Prisma 7, which have breaking changes vs.
older versions. Before writing code against unfamiliar APIs, read the bundled
docs in `node_modules/next/dist/docs/`. Key differences already handled here:

- Next 16: `params`/`searchParams` are Promises (`await` them), Turbopack is
  the default bundler, `next lint` is gone (use `npx eslint .`).
- Prisma 7: generator is `prisma-client` outputting to `src/generated/prisma`
  (import types from `@/generated/prisma/client`), CLI config lives in
  `prisma.config.ts`, and the runtime client requires a driver adapter
  (`@prisma/adapter-better-sqlite3`, wired up in `src/lib/db.ts`).

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (radix-ui)
· Prisma 7 + SQLite (better-sqlite3 adapter) · framer-motion · lucide-react ·
date-fns + date-fns-tz · zod · sonner (toasts) · canvas-confetti

## Run locally

```bash
npm run dev        # dev server on http://localhost:3000
npm run dev:host   # dev server bound to 0.0.0.0 (phone access via local IP or Tailscale)
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint .
```

Daily use: the **"Command Center" desktop shortcut** runs
`Launch Command Center.cmd`, which starts the dev server if port 3000 isn't
listening (minimized "Command Center Server" window) and opens the app in a
chromeless Chrome app window. Don't delete that .cmd file.

For phone access: `Launch Command Center Mobile Host.cmd` — starts with `-H 0.0.0.0`
and prints local IP addresses so you can connect from iPhone. See `/mobile-setup` in-app
or `docs/APP_PACKAGING_PLAN.md` for full iPhone setup instructions.

## Database

SQLite file: `prisma/dev.db` — **this is real life/work data. Never reset or
delete it without explicit approval. Always create a backup before migrations.**

```bash
npm run db:migrate   # prisma migrate dev (after schema changes)
npm run db:seed      # idempotent seed (default projects/areas/habits/settings)
npm run db:studio    # browse data in Prisma Studio
```

Backups live in `prisma/backups/` (not committed). Before any schema change:
```bash
Copy-Item prisma/dev.db prisma/backups/dev-$(Get-Date -Format 'yyyyMMdd-HHmm').db
```

`DATABASE_URL` lives in `.env` (`file:./prisma/dev.db`). After changing
`prisma/schema.prisma`, run `npm run db:migrate` then `npx prisma generate`
to regenerate the client into `src/generated/prisma`.

## Where things live

- `prisma/schema.prisma` — 10 models: Project, ProjectArea, Task,
  BrainDumpItem, WorkSession, DailyReview, DailyHabit, HabitCompletion,
  Settings (singleton, id "singleton"), WeeklyReview (weekStart @unique).
  Status/priority are plain strings (SQLite has no enums) validated by zod.
  Key fields: Task.sortOrder + todaySortOrder (drag order), DailyHabit.scheduleDays
  (CSV "1,2,3,4,5,6,7") + timesPerDay (multi-instance), HabitCompletion.completedCount
  (partial credit), Settings.userName + dashboardWidgets + dayRolloverHour,
  Project.completedAt.

- `src/lib/db.ts` — Prisma client singleton with the better-sqlite3 adapter.

- `src/lib/dates.ts` — `APP_TIMEZONE = "America/Denver"` (single choke point).
  All date math is timezone-correct via `date-fns-tz`. Key functions:
  - `dateKey(date)` — calendar date in Denver as "yyyy-MM-dd"
  - `appDateKey(now, rolloverHour)` — **operational** date: before rolloverHour,
    returns previous calendar date (use this for anything "today")
  - `appTodayBounds(now, rolloverHour)` — UTC start/end of the operational day
  - `isoDayOf(key)` — 1 (Mon)…7 (Sun) for habit schedule filtering
  - `todayBounds`, `weekBounds`, `dayBounds` — plain calendar boundaries

- `src/lib/queries.ts` — shared server reads. `getTodayStandards()` is the main
  entry point: loads settings (including dayRolloverHour), computes operational
  day key, returns `TodayStandards` with `todayKey` for pages to reuse. Also:
  `getActiveSession(rolloverHour)`, `getHabitStreaks(rolloverHour)`,
  `getScoreHistory(days, rolloverHour)`. All rollover-aware.

- `src/lib/dashboard-widgets.ts` — zod schema + defaults + `parseWidgetSettings(json)`.
  Widget keys: score, focusHours, checklist, todayFocus, overdue, activeProjects,
  recentIdeas (all ON by default), dailyReview, weekSnapshot (both OFF by default).

- `src/lib/scoring.ts` — `computeDailyScore`, `scoreMessage`, `workStatus`.

- `src/lib/labels.ts` — status/priority labels, badge classes, and JS sort
  helpers (**never `orderBy` priority/status in SQL** — they're strings and
  sort alphabetically; use `priorityRank`/`sortTasksForFocus`).

- `src/app/actions/*` — all mutations as server actions; each validates with
  zod and ends with `revalidateAll()` (`revalidatePath("/", "layout")`).

- `src/app/<section>/page.tsx` — server components, all
  `export const dynamic = "force-dynamic"` so data is always fresh.

- `src/app/<section>/loading.tsx` — skeleton shown by Next.js before the server
  component resolves (instant perceived performance). Exists for: `/`, `/today`,
  `/standards`, `/daily-review`, `/work-log`.

- `src/components/*` — client components (dialogs, lists, timer, checklists);
  `src/components/ui/*` is generated shadcn/ui (add more via
  `npx shadcn@latest add <name>`). Notable: `Greeting` (live clock, context-aware
  subline), `HabitChecklist` (interactive, multi-instance), `FinishProjectButton`
  (confetti), `AddToTodayDialog` (search existing tasks + new task shortcut).

## Conventions for new features

1. Data model first: add/extend a Prisma model, backup dev.db, `npm run db:migrate`,
   `npx prisma generate`.
2. Add a server action in `src/app/actions/` (zod-parse input, call prisma,
   `revalidateAll()`).
3. Read data in the server page, pass plain serializable props to client
   components (`src/lib/serialize.ts` has the task/session mappers).
4. Dialog forms: keep form state in an inner component mounted inside
   `DialogContent` with a `key` (radix unmounts content on close), not in a
   reset-on-open `useEffect` — the lint config rejects that pattern.
5. Dates: use `appDateKey(now, rolloverHour)` for "today" computations;
   `appTodayBounds(now, rolloverHour)` for start/end bounds. Load rolloverHour
   from `getSettings()` first. `dateKey()`/`todayBounds()` are calendar-only
   (no rollover) — use for display formatting, not for "is this today?" logic.
6. Keep the voice calm and grounded ("Minimum hit", "Still in motion",
   "Next best action") — no cheesy motivational copy, no exclamation marks.
7. Run `npm run typecheck` and `npm run lint` before calling it done.
8. After redirect() in a server action, catch blocks must re-throw with
   `isRedirectError` from `next/dist/client/components/redirect-error` or the
   navigation never fires.

## Scoring rules (Settings can change the numbers)

- Work hours: 6h/day minimum, 8h stretch = full work credit (capped at 100%).
- Default weights: work 40 / habits 35 / today's tasks 15 / daily review 10.
- Components with nothing to measure (no active habits, no today tasks) are
  excluded and the remaining weights re-normalized.
- Messages: 0–24 "Behind standard", 25–49 "Warming up", 50–74 "In motion",
  75–89 "Minimum hit", 90–100 "Strong day".
- Habit completions are keyed by `(habitId, date)` so each day has its own
  checklist. Multi-instance habits use `completedCount`/`timesPerDay` for
  partial credit (min(count, timesPerDay)/timesPerDay × points).
- Score history reconstructs past days from sessions/completions/reviews;
  late-night sessions (before rolloverHour) are bucketed via `appDateKey`.

## Day rollover

`dayRolloverHour` (Settings, default 2) controls when the "app day" flips.
Before 2:00 AM Denver, the app still considers it the previous calendar day.
All "today" queries go through `appDateKey(now, rolloverHour)` /
`appTodayBounds(now, rolloverHour)` — never raw `dateKey()`.

## Keyboard shortcuts (src/components/keyboard-shortcuts.tsx)

- `q` — open Quick add
- `g` then a letter — navigate: `d` dashboard, `t` today, `s` standards,
  `p` projects, `b` brain dump, `k` tasks, `w` work log, `r` daily review,
  `v` weekly review, `,` settings.
- Suppressed while typing in a field or while a dialog/menu is open.

## Drag-and-drop reorder pattern

Used in `HabitManager`, `TaskList` (reorderable mode), and the Today/Project open tabs.

- framer-motion `Reorder.Group` + `Reorder.Item` with `dragListener={false}` + explicit
  `useDragControls` on a `GripVertical` handle button.
- `TaskList` takes optional `reorderable` + `onReorder(ids[])` props.
- Server actions write **1-based** indices (`i + 1`) to prevent the
  `hasExplicitOrder` heuristic from falsely resetting single-task lists.
- `reorderTodayTasks(ids[])` → writes `todaySortOrder`;
  `reorderProjectTasks(ids[])` → writes `sortOrder`. Both transactional.

## Finish Project / Reopen

`finishProject(id, archiveOpenTasks)` sets `status = "completed"`, `completedAt = now`.
`reopenProject(id)` resets to `status = "active"`, `completedAt = null`.
`FinishProjectButton` shows confirm dialog with open-task count + keep/archive choice,
canvas-confetti burst on success. Completed projects appear with "(completed)" suffix
in task-edit project selectors.

## AI Assistant (src/lib/assistant/)

Global command assistant accessible from anywhere via Ctrl+K (or the compact
card on the Dashboard).

**Architecture:**
- `src/lib/assistant/types.ts` — shared types (`AssistantResult`, `HistoryEntry`, `PendingConfirmation`)
- `src/lib/assistant/tools.ts` — server-side Prisma tool functions (all rollover-aware)
- `src/lib/assistant/aliases.ts` — habit and project alias maps (e.g. "bible" → "Read Bible")
- `src/lib/assistant/resolver.ts` — pure fuzzy entity resolver; scoring: exact > alias > contains > word overlap
- `src/lib/assistant/parser.ts` — local NL parser with normalization + AppContext entity resolution
- `src/lib/assistant/claude.ts` — optional Claude API via `@anthropic-ai/sdk`; only used when `ANTHROPIC_API_KEY` is set
- `src/app/api/assistant/route.ts` — POST `/api/assistant`; loads AppContext from DB, tries local parser first, then Claude fallback
- `src/components/assistant/global-assistant.tsx` — Dialog modal with full UI; opened via `COMMAND_ASSISTANT_EVENT`
- `src/components/assistant-card.tsx` — compact launcher button on Dashboard; fires `COMMAND_ASSISTANT_EVENT`

**AppContext** is loaded once per request from DB and contains:
- `habits` — active DailyHabits
- `todayTasks` — tasks marked for today (not done/archived)
- `allOpenTasks` — all todo/doing tasks
- `projects` — active + paused projects
- `todayKey` — operational date (rollover-aware)

**Parser normalization:** strips filler words ("for me", "please", "can you", etc.)
before matching, so natural conversational phrasing resolves cleanly.

**Parser patterns** (case-insensitive):
- Habits: `check [off] <name>`, `I prayed`, `I read`, `bible done`, `uncheck <name>`
- Tasks: `add [priority] task [for today] [for <project>]: <title>`, `remind me to <title>`, `I need to <title>`, `put <title> on today`, `mark <title> done`, `I finished <title>`
- Work: `log 2 hours [for <project>]`, `I worked 90 minutes on <project>`
- Brain dump: `brain dump: <text>`, `idea: <text>`, `note: <text>`
- Daily review: `write my daily review: <text>` or `daily review: <text>`
- Projects: `mark <name> as completed` (needs confirmation), `pause <name>` (needs confirmation), `activate <name>`
- Summary: `what should I focus on`, `next best action`, `summary`, `status`

**Safety rules (built in):**
- Completing/pausing a project → `needsConfirmation` returned; user must click Confirm
- Deleting is not supported via the assistant
- All mutations go through Prisma (same as existing server actions)

**Day rollover:** all tools call `appDateKey(new Date(), rolloverHour)` — "today" at 1 AM is still yesterday if rollover = 2 AM.

**Adding more commands:** add patterns in `parseCommand()` in `parser.ts` and/or a new tool in `tools.ts`, then add the tool definition to `TOOLS` in `claude.ts`. Add aliases in `aliases.ts`.

**Adding the API key** (for flexible NL support):
1. Create `command-center/.env.local`
2. Add `ANTHROPIC_API_KEY=sk-ant-...`
3. Restart dev server. Model: `claude-haiku-4-5-20251001`.

## Keyboard Shortcuts (src/lib/shortcuts.ts + src/components/keyboard-shortcuts.tsx)

**Customizable modifier combos** stored as JSON in `Settings.keyboardShortcuts`.
Configurable in Settings → Controls.

Default combos:
- `Ctrl+K` — open Command Assistant
- `Ctrl+Shift+T` — quick add task
- `Ctrl+Shift+B` — quick brain dump
- `Ctrl+Shift+W` — start/stop work session
- `Ctrl+Shift+D` — go to Today
- `Ctrl+Shift+H` — go to Dashboard

Single-key shortcuts (suppressed while typing / dialog open):
- `q` — quick add task
- `g` then a letter — navigate (d=dashboard, t=today, s=standards, p=projects, b=brain-dump,
  k=tasks, w=work-log, r=daily-review, v=weekly-review, `,`=settings)

**`matchesShortcut(e, combo)`** — "Ctrl" in the stored string matches both `ctrlKey` (Windows) and `metaKey` (Mac).

**Adding a new shortcut action:**
1. Add to `SHORTCUT_ACTIONS` array in `shortcuts.ts`
2. Add label to `shortcutLabels`
3. Add default to `shortcutSchema`
4. Handle the event in `KeyboardShortcuts` component

## Theme System (src/lib/themes.ts + src/app/themes.css)

48 theme presets selectable from Settings → Appearance. No page flash — theme is
read server-side from DB and applied to `<html>` in layout.tsx before the page
renders.

**Architecture:**
- `src/lib/themes.ts` — theme registry (`THEMES` array, `ThemePreset` interface).
  Exports `resolveThemeId`, `getTheme`, `themeToHtmlClass`.
- `src/app/themes.css` — CSS variable overrides for each `.theme-X` class.
  Imported via `@import "./themes.css"` in `globals.css` *after* `.dark`, so theme
  overrides win the cascade at equal specificity.
- `src/app/layout.tsx` — reads `settings.theme`, calls `resolveThemeId` → `getTheme`
  → `themeToHtmlClass`, applies the result to `<html className>`.
- `src/components/theme-picker.tsx` — visual grid UI in Settings. On click:
  immediately mutates `document.documentElement.classList` (no flicker), then
  persists via `updateSettings({ theme: id })` + `router.refresh()`.
  Includes a live Theme Test Panel showing card, buttons, badges, progress bar,
  input, and checkbox — all using semantic Tailwind classes.

**HTML class convention:**
- Dark themes: `html.dark.theme-{id}` — `.dark` sets base dark values,
  `.theme-{id}` overrides theme-specific accents/backgrounds.
- Light themes: `html.theme-{id}` — no `.dark` class.

**Backwards compatibility:** old "dark" → "midnight", old "light" → "paper-light"
(handled by `resolveThemeId`). No DB migration needed.

**CSS variable design rules (themes.css):**
- Dark backgrounds carry meaningful chroma (0.025–0.08 for tinted themes) — tints must be visible
- Borders: `oklch(primary-L primary-C*0.7 primary-H / 24-32%)` — NOT neutral white-alpha
- `--ring` always matches `--primary` so focus rings are theme-colored
- `--muted-foreground` tinted toward theme hue for text cohesion
- `--sidebar` distinctly darker than `--background`, same hue family
- `--primary` has strong chroma (0.18–0.32) — buttons and active states must pop

**Semantic token rule: NEVER hardcode Tailwind color classes for "completed/active" states.**
Always use `bg-primary`, `border-primary/30`, `bg-primary/10`, `text-primary`,
`text-primary-foreground`. This ensures every themed element changes when the theme changes.

**Intentional exceptions (semantic color coding, not theme-dependent):**
- `score-ring.tsx` — stroke colors encode SCORE LEVEL (emerald ≥90%, sky ≥50%, amber ≥25%, rose below)
- `task-list.tsx` priority dots — low=zinc, medium=sky, high=rose — encode TASK PRIORITY
- `global-assistant.tsx` ok/error — green=success, rose=error — encode ACTION OUTCOME

**Adding a theme:**
1. Add entry to `THEMES` in `themes.ts` with preview colors.
2. Add `.theme-{id} { ... }` block in `themes.css` with all variable overrides.
3. That's it — no other wiring needed.

**Categories:** dark (25) · cyber (9) · minimal (4) · light (11) · colorful (3).

## Mobile navigation (src/components/mobile-nav.tsx)

Bottom navigation bar — visible only below the `lg` breakpoint (`hidden lg:flex` pattern).
Five items: Dashboard · Today · Standards · Tasks · More.
"More" opens a slide-up overlay with: Projects, Brain Dump, Work Log, Daily Review,
Weekly Review, Settings. Overlay has a semi-transparent backdrop that closes on tap.

The desktop sidebar (`src/components/sidebar.tsx`) uses `hidden lg:flex` — it is invisible
on mobile. The mobile nav is its mobile replacement.

Layout changes (layout.tsx):
- `main` padding: `pl-0 pb-24 lg:pl-60 lg:pb-0` — no left padding on mobile (no sidebar),
  96px bottom padding on mobile to clear the bottom nav.
- `viewport.viewportFit = "cover"` — enables safe-area-inset-* on iPhone notch.
- MobileNav uses `style={{ paddingBottom: "env(safe-area-inset-bottom)" }}` so the nav
  bar itself grows correctly on notch iPhones.

AssistantLauncher: `bottom-24 right-4` on mobile (above the bottom nav), `bottom-8 right-8` on desktop.

Assistant modal: `max-h-[85dvh] overflow-hidden` with scrollable content area — fits on mobile screens.

## Floating assistant launcher (src/components/assistant-launcher.tsx)

Fixed bottom-right Sparkles button on every page (mounted in `layout.tsx`).
Dispatches `COMMAND_ASSISTANT_EVENT` — same custom event Ctrl+K fires.
No separate state; `GlobalAssistant` modal handles everything.
Z-index: `z-40` (below dialog overlay, above page content).

## PWA / app-install basics

- `src/app/manifest.ts` — Next.js special file, auto-served at `/manifest.webmanifest`.
- `viewport` export in `layout.tsx` — sets `themeColor`, `viewportFit: "cover"`, device-width.
- `appleWebApp` in `metadata` — enables Add to Home Screen on Safari (`capable`, `statusBarStyle`).
- `icons` in `metadata` — apple touch icon pointing to `icon-192.png` (Safari reads this).
- `public/icons/icon.svg` — dark background (#080d13), gold ⌘ symbol (#fbb415).
- `public/icons/icon-192.png` — 192×192 PNG; used for Chrome install badge and Apple touch icon.
- `public/icons/icon-512.png` — 512×512 PNG; maskable, for PWA splash screens.
- No service worker — intentionally skipped (app requires Prisma server routes).
- iPhone install guide: `/mobile-setup` page in the app.
- See `docs/APP_PACKAGING_PLAN.md` for full desktop/mobile phased plan.

## Known limitations (candidates for next builds)

- Work Log shows today + this week only; older sessions surface per-project
  and via Weekly Review week navigation (`/weekly-review?week=yyyy-MM-dd`).
- Past-day scores in the history chart exclude the tasks component (the `today`
  flag rolls over daily) — they can read slightly different from what the
  day's live score showed.
- No cloud sync, no auth — local-first only. PWA basics are in (manifest, icons,
  Apple metadata) but the data layer is still local SQLite. iPhone requires Tailscale
  or a cloud DB migration before it can access the same data. See `docs/APP_PACKAGING_PLAN.md`.
- The seeded "Daily Review" habit overlaps with the 10% review score
  component by design (the user wanted both).
- Assistant history is session-only (in React state); not persisted to DB.
