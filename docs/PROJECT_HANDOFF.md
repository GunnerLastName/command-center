# Command Center — Project Handoff

This document is a complete state snapshot for a new Claude Code session. Read
`CLAUDE.md` first for conventions and stack notes, then this file for current
feature status and architecture.

---

## What has been built

A personal daily operating system for Gunner Busic. It is local-first, single-
user, no authentication. All data is in `prisma/dev.db` (real life/work data —
never delete or reset without explicit approval).

Built across four sessions:
- **Session 1 (Round 1–2):** Core app — projects, tasks, brain dump, work log,
  daily standards/habits, daily review, settings, sidebar nav, keyboard
  shortcuts, scoring engine, Quick Add, Today page, Weekly Review.
- **Session 2 (Round 2 iteration):** Loading skeletons, Tasks as major dashboard
  module, interactive HabitChecklist on dashboard, 2 AM day rollover, past review
  editing (pencil icons), QA and bug fixes.
- **Session 3 (Round 3):** Timezone foundation (`date-fns-tz`, `APP_TIMEZONE`),
  habit schedules (days of week + times per day), habit drag-and-drop, daily
  review date-change control, weekly reflection model + page, computed project
  week progress, task drag-and-drop (Project Detail + Today), Add Existing Task
  to Today dialog, Finish Project + confetti celebration, personalized Greeting
  component (live clock), dashboard widget toggles.
- **Session 4 (Round 4):** AI Assistant module — local regex parser + optional
  Claude API (claude-haiku-4-5-20251001), `/api/assistant` route, `AssistantCard`
  dashboard widget with voice input, confirmation flow, session history.
- **Session 5 (Round 5):** Theme system fully fixed (48 themes, CSS cascade specificity
  fix: `html.theme-X` beats `.dark`). Floating assistant launcher (bottom-right Sparkles
  button on all pages, fires `COMMAND_ASSISTANT_EVENT`). PWA basics: `src/app/manifest.ts`,
  Apple web app metadata, viewport export, SVG icon at `public/icons/icon.svg`.
  Settings → App section. `docs/APP_PACKAGING_PLAN.md` with phased desktop/mobile path.
  Debug Neon theme added. All hardcoded emerald active-state colors replaced with `bg-primary`.
- **Session 6 (Round 6):** Mobile-first responsive pass. Bottom navigation bar
  (`src/components/mobile-nav.tsx`) on all pages below lg breakpoint — Dashboard, Today,
  Standards, Tasks, More (sheet overlay). Desktop sidebar hidden on mobile (`hidden lg:flex`).
  Layout padding updated (`pl-0 pb-24 lg:pl-60 lg:pb-0`). `viewport-fit=cover` for iPhone
  notch. Assistant launcher repositioned above bottom nav. Assistant modal capped at
  `85dvh` with overflow scroll. Work-log `min-w-56` overflow fixed. Checkpoint backup
  created at `command-center-backup-20260612-1831/`. `.gitignore` updated to exclude
  `prisma/dev.db` and `prisma/backups/`.
- **Session 7 (Round 7):** iPhone PWA install polish. Apple touch icon added to `metadata.icons`
  in `layout.tsx` (Safari reads `rel="apple-touch-icon"` from this). `dev:host` script added
  to `package.json` (`next dev -H 0.0.0.0`). `Launch Command Center Mobile Host.cmd` created —
  prints local IP addresses and starts with host binding. `/mobile-setup` page added with
  step-by-step iPhone install guide for both same-Wi-Fi and Tailscale paths; includes Windows
  Firewall instructions and honest limitation notes. Settings → App/Mobile section updated
  with link to `/mobile-setup`. `docs/APP_PACKAGING_PLAN.md` restructured to 4 clear phases.
  TypeScript 0 errors, ESLint 0 errors.

---

## App architecture

```
command-center/
├── prisma/
│   ├── schema.prisma       # 10 models
│   ├── dev.db              # Real data — protect this
│   ├── seed.ts             # Idempotent seed
│   ├── backups/            # Manual backups (not committed)
│   └── migrations/         # 4 applied migrations
├── src/
│   ├── app/                # Next.js App Router pages + server actions
│   │   ├── page.tsx        # Dashboard (/)
│   │   ├── loading.tsx     # Dashboard skeleton
│   │   ├── layout.tsx      # Root layout: sidebar, theme, keyboard shortcuts
│   │   ├── api/assistant/  # POST /api/assistant — AI command processing
│   │   ├── brain-dump/     # Brain dump inbox
│   │   ├── daily-review/   # Daily review + past reviews sidebar
│   │   ├── projects/       # Project map + [id] detail
│   │   ├── settings/       # Settings page
│   │   ├── standards/      # Daily standards (score history, habit streaks)
│   │   ├── tasks/          # All tasks list
│   │   ├── today/          # Today's focus (drag-ordered task list)
│   │   ├── weekly-review/  # Weekly review + reflection
│   │   ├── work-log/       # Work session timer + session list
│   │   └── actions/        # Server actions (one file per domain)
│   ├── components/         # Client components
│   │   └── assistant-card.tsx  # AI assistant dashboard card
│   ├── generated/prisma/   # Auto-generated Prisma client (don't edit)
│   └── lib/
│       ├── assistant/      # Assistant layer
│       │   ├── types.ts    # Shared types
│       │   ├── tools.ts    # Server-side Prisma tool functions
│       │   ├── parser.ts   # Local regex command parser
│       │   └── claude.ts   # Claude API integration (optional)
│       └── ...             # Other shared utilities
└── CLAUDE.md               # Project rules for Claude Code
```

### Key architectural decisions

- **Server components everywhere**: Every page is a server component
  (`export const dynamic = "force-dynamic"`). Client components handle
  interactivity only.
- **Single revalidation**: All server actions call `revalidateAll()` which does
  `revalidatePath("/", "layout")` — refreshes everything everywhere.
- **Single source of truth for tasks**: One `Task` row; `today: boolean` flag
  marks it for today. Same `TaskList` component used everywhere. No duplication.
- **No localStorage**: All persistence goes through Prisma/SQLite.

---

## Routes / pages

| Route | File | Description |
|---|---|---|
| `/` | `app/page.tsx` | Dashboard — greeting, score, hours, habits checklist, tasks, overdue, projects, ideas, optional widgets |
| `/today` | `app/today/page.tsx` | Today's focus — drag-ordered open tasks, done section, add task dialog |
| `/standards` | `app/standards/page.tsx` | Daily standards — score history chart, habit streaks, settings summary |
| `/projects` | `app/projects/page.tsx` | Project map — all projects, status filters, week progress bars |
| `/projects/[id]` | `app/projects/[id]/page.tsx` | Project detail — tasks (drag-reorderable), areas, notes, stats, Finish Project button |
| `/tasks` | `app/tasks/page.tsx` | All tasks — filter by project/status/priority, bulk actions |
| `/brain-dump` | `app/brain-dump/page.tsx` | Brain dump inbox — capture, review, convert to task/project |
| `/work-log` | `app/work-log/page.tsx` | Work timer — start/stop sessions, today's log, this week's sessions |
| `/daily-review` | `app/daily-review/page.tsx` | Daily review form + 30 past reviews in sidebar with pencil-edit links |
| `/weekly-review` | `app/weekly-review/page.tsx` | Weekly review — hours/tasks summary, weekly reflection form, week nav |
| `/settings` | `app/settings/page.tsx` | Settings — name, scoring weights, hours goal, day rollover, theme, dashboard widgets, habit manager |

Loading skeletons exist for: `/`, `/today`, `/standards`, `/daily-review`, `/work-log`.

---

## Prisma models

### Project
Projects map to real-world initiatives. Status: `idea | active | paused | completed | archived`.
Key fields: `name`, `status`, `priority`, `mainGoal`, `currentBottleneck`, `nextBestAction`,
`deadline`, `progressPercent` (manual %, 0–100), `completedAt` (set by finishProject action),
`notes`.

### ProjectArea
Sub-sections within a project (e.g., "Backend", "Marketing"). Ordered by `sortOrder`.

### Task
Single source of truth. Status: `todo | doing | done | archived`.
Key fields: `title`, `status`, `priority`, `dueDate`, `estimatedMinutes`, `today` (boolean flag),
`todaySortOrder` (drag order on Today page), `sortOrder` (drag order within project),
`completedAt`, `projectId`, `projectAreaId`.

### BrainDumpItem
Inbox capture. Status: `inbox | reviewed | converted | archived`.

### WorkSession
Logged work blocks. `startTime`, `endTime` (null = running), `durationMinutes`,
optional `projectId` + `taskId`. Auto-stopped by `getActiveSession()` if forgotten overnight.

### DailyReview
One row per day (`date` is unique). Five text fields: `whatGotDone`, `whatIAvoided`,
`biggestWin`, `lesson`, `tomorrowFocus`. "Review done" = any field non-empty.

### DailyHabit
Active habits. Key fields: `name`, `points` (score weight), `active`, `sortOrder` (drag order),
`scheduleDays` (CSV of ISO weekdays "1,2,3,4,5,6,7" = every day), `timesPerDay` (1 = once;
multi-instance shows partial credit "1/2").

### HabitCompletion
One row per `(habitId, date)`. Fields: `completed` (bool, true when count ≥ timesPerDay),
`completedCount` (partial credit counter). Backfill: all pre-Round-3 rows have `completedCount = 1`.

### Settings
Singleton row (id = "singleton"). Key fields:
- `dailyMinimumHours` (default 6), `dailyStretchHours` (default 8)
- `workScoreWeight`, `habitsScoreWeight`, `tasksScoreWeight`, `reviewScoreWeight`
- `theme` ("dark" default), `userName` ("Gunner" default)
- `dashboardWidgets` (JSON string, parsed by `parseWidgetSettings()`)
- `dayRolloverHour` (default 2) — the 2 AM rollover setting

### WeeklyReview
One row per week (`weekStart` = yyyy-MM-dd Monday). Fields: `whatWorked`, `whatToFix`,
`nextWeekFocus`, `notes`. Navigated via `?week=yyyy-MM-dd` query param.

---

## Applied migrations

1. `20260611004208_init` — initial schema
2. `20260611053838_add_indexes` — performance indexes on WorkSession, Task, BrainDumpItem
3. `20260611222234_round3` — Round 3 schema: DailyHabit.scheduleDays + timesPerDay,
   HabitCompletion.completedCount + backfill, Task.sortOrder + todaySortOrder,
   Project.completedAt, Settings.userName + dashboardWidgets, WeeklyReview model
4. `20260612062655_add_day_rollover_setting` — Settings.dayRolloverHour

---

## Seed data

`prisma/seed.ts` is idempotent. It creates:
- Default Settings singleton
- Example projects (Octagon Outreach, Personal Brand, etc.)
- Default habits (Morning Routine, Deep Work, Pray, etc.)
- Sample brain dump items

Safe to re-run anytime — uses `upsert` throughout.

---

## Dashboard behavior

The dashboard (`/`) loads via `getTodayStandards()` which:
1. Reads `dayRolloverHour` from Settings
2. Computes the operational `todayKey` via `appDateKey(now, rolloverHour)`
3. Rolls stale done tasks off today's list (tasks done before today's start)
4. Returns score breakdown, habits, worked minutes

Then in parallel fetches: week minutes, active session, today tasks, overdue tasks,
brain dump inbox, active projects, yesterday's review (for greeting subline),
week task count.

**Dashboard widgets** (toggleable in Settings):
- ON by default: score ring, focused hours + timer, daily checklist, today's tasks,
  overdue, active projects, recent ideas
- OFF by default (discoverable): daily review status card, week snapshot card

The **Greeting** component shows a live Denver clock, time-of-day greeting,
and a context-aware subline: "Session running — locked in" / "Minimum hit.
Still in motion." / "Yesterday you pointed at: {tomorrowFocus}" / blank.

---

## Tasks behavior

- `Task` rows are the single source of truth
- `today: true` = the task appears on Today and the Dashboard
- The `TaskList` component handles all rendering: edit dialog, check-off, delete,
  move-to-today, reorder (when `reorderable=true`)
- Checking off sets `status = "done"`, `completedAt = now`, `today = false` (deferred)
- Server action `toggleTaskDone` handles the toggle
- **Today sort order**: `todaySortOrder` (1-based after first drag)
- **Fallback sort**: `sortTasksForFocus` from `labels.ts` (priority → status → title)

---

## Daily standards and habits behavior

**Standards page** (`/standards`):
- Score history chart (14 days, bar chart via custom SVG)
- Habit streaks table (current streak, best streak, last-7 dots)
- Score breakdown panel
- Shortcut to Settings for adjusting weights

**Habits**:
- `scheduleDays` CSV: "1,2,3,4,5,6,7" = every day. "3" = Wednesday only.
- `getHabitsForDate(key)` filters to habits scheduled on that ISO weekday
- `timesPerDay > 1`: tapping increments `completedCount`; full count = green;
  partial = shows "1/2" dots; minus button (hover) decrements
- Streaks skip non-scheduled days (null in `last7` = unscheduled, rendered dim)
- Drag-and-drop reorder in Settings → Habit Manager

---

## Scoring

Four components, each with a configurable weight:

| Component | Default weight | Counted when |
|---|---|---|
| Work hours | 40 | Always |
| Habits | 35 | Active habits exist for today |
| Today's tasks | 15 | Today has tasks |
| Daily review | 10 | Always |

Formula: `score = Σ(fraction × weight) / Σ(counted weights) × 100`

Work fraction: `min(workedMinutes/60 / stretchHours, 1.0)`
Habit fraction: `Σ(min(count, timesPerDay)/timesPerDay × points) / Σ(points)`

Score messages: 0–24 "Behind standard", 25–49 "Warming up", 50–74 "In motion",
75–89 "Minimum hit", 90–100 "Strong day".

---

## 2:00 AM day rollover

`Settings.dayRolloverHour` (default 2) controls when the "app day" flips.

Before 2:00 AM Denver time, the app still considers it the previous calendar day:
- Dashboard shows yesterday's date and yesterday's habits
- Work sessions that cross midnight are credited to the correct day
- `getScoreHistory` uses `appDateKey(session.startTime, rolloverHour)` to bucket
  sessions correctly

All "today" queries go through:
- `appDateKey(now, rolloverHour)` — operational date key
- `appTodayBounds(now, rolloverHour)` — UTC start/end of operational day

The rollover hour is loaded from Settings at the top of every page that needs it.
Never hardcode `2` — always read from `getSettings()`.

---

## Daily review behavior

- One `DailyReview` row per `date` (yyyy-MM-dd)
- "Review done" = any of the 5 fields is non-empty
- Five prompts: What got done / What I avoided / Biggest win / Lesson / Tomorrow's focus
- **Past reviews sidebar**: last 30 days shown, each with a pencil icon linking to
  `/daily-review?date=yyyy-MM-dd` for editing
- **Date change control** (`ChangeReviewDate` component): allows moving a review to
  a different date; blocks if target date already has a review
- Default date respects day rollover: `appDateKey(now, rolloverHour)`
- `tomorrowFocus` from yesterday's review feeds the Dashboard greeting subline

---

## Work log behavior

- Work sessions stored in `WorkSession` (startTime, endTime, durationMinutes)
- `endTime: null` = currently running
- `getActiveSession(rolloverHour)` auto-closes any session that started before
  today's operational start (stale forgotten sessions), capped at 12h
- Dashboard shows a pulsing green "In session" indicator when a session is running
- Work log page shows today's sessions + this week's sessions grouped by day
- Sessions can be edited (description, project, task) and deleted
- Uses `appTodayBounds(new Date(), settings.dayRolloverHour)` for today's bounds

---

## Weekly review behavior

- `WeeklyReview` model: one row per week (`weekStart` = yyyy-MM-dd Monday)
- Page shows week stats: total hours worked, tasks shipped that week
- `WeeklyReflectionForm`: What worked / What to fix / Next week focus / Notes
- Navigation: `?week=yyyy-MM-dd` query param; previous/next week arrows
- All past weeks are fully editable

---

## Settings behavior

Settings page controls:
- `userName` — displayed in greeting
- `dailyMinimumHours` / `dailyStretchHours` — scoring thresholds
- Score component weights (work / habits / tasks / review)
- `dayRolloverHour` — select (Midnight, 1 AM, 2 AM, 3–6 AM)
- Theme (dark/light/system)
- Dashboard widget toggles (9 toggles, each saved to `dashboardWidgets` JSON)
- Habit manager: add/edit/reorder/deactivate habits

---

## Server actions

| File | Actions |
|---|---|
| `actions/tasks.ts` | createTask, updateTask, deleteTask, toggleTaskDone, setTaskToday, reorderTodayTasks, reorderProjectTasks |
| `actions/habits.ts` | createHabit, updateHabit, deleteHabit, setHabitProgress, reorderHabits |
| `actions/projects.ts` | createProject, updateProject, deleteProject, finishProject, reopenProject |
| `actions/sessions.ts` | startSession, stopSession, updateSession, deleteSession |
| `actions/reviews.ts` | saveDailyReview, moveDailyReview, saveWeeklyReview |
| `actions/settings.ts` | updateSettings |
| `actions/braindump.ts` | createDumpItem, updateDumpItem, deleteDumpItem |
| `actions/revalidate.ts` | revalidateAll (revalidatePath("/", "layout")) |

---

## AI Assistant behavior

The assistant lives on the Dashboard as a toggleable widget (on by default).

**Flow:**
1. User types (or speaks) a command into `AssistantCard`
2. `AssistantCard` POSTs to `/api/assistant`
3. Route tries the **local parser** first (`src/lib/assistant/parser.ts`)
4. If no local match and `ANTHROPIC_API_KEY` is set, falls back to **Claude API** (`claude-haiku-4-5-20251001`) with tool definitions matching all tool functions
5. Tool function runs server-side against Prisma (same DB as all other mutations)
6. `revalidateAll()` fires → Next.js re-renders dashboard with fresh data
7. Client calls `router.refresh()` to pull fresh server data
8. Response message shown in card; history shown below

**To enable Claude API:**
Create `command-center/.env.local` with `ANTHROPIC_API_KEY=sk-ant-...`. Restart dev server.

**Without API key:** ~20 regex patterns work. Unknown commands get a helpful message.

**Confirmation safety gate:**
Actions that are hard to reverse (mark project completed, pause project) return `needsConfirmation` first. The card shows a confirmation prompt; user must click Confirm before the action actually runs.

**Supported local commands:**
- `add task for today: <title>` / `add high priority task for <project>: <title>`
- `mark <title> done` / `complete task <title>`
- `move task <title> to today`
- `check off <habit>` / `uncheck <habit>`
- `log 2 hours [for <project>]` / `log 45 minutes [for <project>]`
- `brain dump: <text>` / `add idea: <text>`
- `write my daily review: <text>` (structured or freeform)
- `mark <project> as completed` → confirmation required
- `pause <project>` → confirmation required
- `activate <project>` / `reopen <project>`
- `what should I focus on` / `summary`

**Voice input:** Web Speech API. Mic button starts listening, transcript fills the input, user reviews before submitting.

---

## Key components

| Component | Purpose |
|---|---|
| `Greeting` | Live Denver clock, time-aware greeting, context subline |
| `TaskList` | Renders tasks with edit/check/delete; optional `reorderable` mode |
| `HabitChecklist` | Interactive habit list with multi-instance tap-to-increment |
| `HabitManager` | Full CRUD + drag reorder for habits (used in Settings) |
| `TimerPanel` | Work session start/stop; shows active session description |
| `ScoreRing` | Circular progress ring for today's score |
| `WorkProgress` | Horizontal progress bar with minimum + stretch markers |
| `ScoreHistoryChart` | 14-day bar chart using custom SVG |
| `ReviewForm` | Daily review text fields (keyed inner component pattern) |
| `WeeklyReflectionForm` | Weekly review text fields |
| `FinishProjectButton` | Confirm dialog + confetti on project completion |
| `AddToTodayDialog` | Search open tasks to add to today / new task shortcut |
| `ProjectTasks` | Project detail task list with drag-reorder |
| `QuickAdd` | Global capture dialog (triggered by `q` key or sidebar button) |
| `ChangeReviewDate` | Date-move control for daily review (re-throws redirect errors) |
| `DashboardWidgetsForm` | Toggle switches for dashboard widget visibility |
| `AssistantCard` | AI assistant card: textarea, voice input, confirmation flow, session history |

---

## Recently fixed bugs (all in current codebase)

1. **Redirect swallowed in ChangeReviewDate**: `moveDailyReview` uses Next.js
   `redirect()` which throws a special error. Catch block was eating it. Fixed:
   `if (isRedirectError(err)) throw err` from `next/dist/client/components/redirect-error`.

2. **Drag order reset on single-task lists**: `reorderTodayTasks` wrote 0-based
   indices, so a single-task list had `todaySortOrder = 0`, making `hasExplicitOrder`
   check return false. Fixed: writes 1-based indices (`i + 1`).

3. **Late-night sessions credited to wrong day**: `getScoreHistory` used `dateKey(s.startTime)`
   (calendar date) instead of `appDateKey(s.startTime, rolloverHour)`. Fixed.

4. **Dashboard Tasks double empty state**: When no tasks, code showed EmptyState
   AND fell through to a second blank TaskList. Fixed: single TaskList with
   `showAddButton` handles its own empty state.

---

## What still needs manual testing

- Check off a habit from the Dashboard (verify it updates without page reload)
- Add a task from the Dashboard Tasks card
- Mark a task done from the Dashboard Tasks card
- Drag task order on Today page — verify persists after refresh
- Drag task order on a Project detail page — verify persists after refresh
- Drag habit order in Settings → verify carries over to Standards/Dashboard
- Finish a project → verify confetti fires, status updates
- Reopen a finished project
- Edit a past daily review (pencil icon in sidebar → edit → save)
- Change a daily review's date using the date-change control
- Weekly review reflection form — fill out, save, navigate to previous week
- Change day rollover hour in Settings → verify operational date shifts
- Work session start → stop → verify it appears in Work Log

---

## Known rough areas / bugs to watch for

- Score history chart is custom SVG — not responsive below ~400px width
- Brain dump "convert to task" flow drops the user back to brain dump without
  showing the new task; could add a toast with a link
- `getProjectOptions()` was not including completed projects in task edit dialogs
  until Round 3 fixed it; if projects are missing from dropdowns, verify the fix
  is in place (should include completed with "(completed)" suffix)
- The `postinstall` script runs `prisma generate` on `npm install`, but after
  a manual `db:migrate` you may also need to run `npx prisma generate` explicitly
  if TypeScript types for new fields are stale
