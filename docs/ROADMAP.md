# Command Center — Roadmap

Future build ideas. None of these are implemented yet. Do not build them
without explicit direction.

---

## AI features

### ✅ AI command assistant on Dashboard — BUILT (Session 4)
Dashboard card with natural-language commands → tool calls → Prisma mutations.
- Local regex parser: works without API key, covers ~20 command patterns
- Claude API fallback: `claude-haiku-4-5-20251001` via `@anthropic-ai/sdk`
- Set `ANTHROPIC_API_KEY` in `.env.local` to enable
- Voice input: Web Speech API, fills textarea (user reviews before submit)
- Confirmation gate: destructive actions require explicit confirmation click
- See `src/lib/assistant/` for all code; `CLAUDE.md` for full command list

### Voice input improvements
The current voice implementation uses Web Speech API (browser dictation).
Future improvements: Whisper for offline/accurate transcription, auto-submit
after clear pause, multi-sentence capture for daily reviews.

### Claude streaming responses
Currently the route waits for the full tool call. For `get_summary` and future
query-type tools, streaming the response text (via `ai` SDK or SSE) would feel faster.

---

## Mobile and deployment

### ✅ Mobile-friendly responsive pass — BUILT (Session 6)
- Bottom navigation bar (`MobileNav`) replaces the icon sidebar on mobile
- Desktop sidebar hidden on mobile; full sidebar shows at lg+ breakpoint
- Layout bottom padding clears the bottom nav (96px on mobile)
- iPhone notch: `viewport-fit=cover` + `env(safe-area-inset-bottom)` on bottom nav
- Assistant modal: `max-h-[85dvh]` + scrollable body on mobile
- Assistant launcher: above bottom nav on mobile, bottom-right on desktop
- Work log `min-w` overflow fixed

### Mobile touch-friendly task interactions
Tap targets on task checkboxes and habit check buttons could be enlarged further.
A focused "one-tap complete" mode for the Today task list would be ideal for thumb use.

### ✅ PWA basics — BUILT (Session 5)
`src/app/manifest.ts` served at `/manifest.webmanifest`. Apple web app metadata
and viewport export added to `layout.tsx`. SVG icon at `public/icons/icon.svg`
(dark background, gold ⌘). PNG icons (192 and 512) in `public/icons/`. No service
worker; offline caching skipped because app depends on Prisma server routes.

### ✅ iPhone PWA install polish — BUILT (Session 7)
Apple touch icon wired into `metadata.icons` (Safari reads `rel="apple-touch-icon"`).
`dev:host` script added (`next dev -H 0.0.0.0`). `Launch Command Center Mobile Host.cmd`
prints local IPs and starts with host binding. `/mobile-setup` page with same-Wi-Fi
and Tailscale step-by-step guides. Settings → App/Mobile links to the setup page.
`docs/APP_PACKAGING_PLAN.md` restructured to 4 phases.

### ✅ Floating assistant launcher — BUILT (Session 5)
`src/components/assistant-launcher.tsx` — fixed bottom-right Sparkles button on
all pages. Dispatches `COMMAND_ASSISTANT_EVENT`, same as Ctrl+K. Mounted in
`layout.tsx` alongside `<GlobalAssistant />`.

### ✅ PWA / phone access — BUILT (Session 7)
- **Same Wi-Fi:** `npm run dev:host` or `Launch Command Center Mobile Host.cmd`
- **Anywhere (recommended):** Tailscale — no code change, keeps SQLite
- **In-app guide:** `/mobile-setup` page with step-by-step instructions
- **Cloud (later):** migrate to Postgres + deploy Vercel + add auth — see `docs/APP_PACKAGING_PLAN.md`

### Authentication / private access before deployment
Currently no auth — fine for localhost. Before any public deploy, add a simple
auth layer:
- Option A: `next-auth` with a single hardcoded user (email + password)
- Option B: password-only gate (single shared secret in `.env`)
- Option C: Cloudflare Access or Tailscale for network-level protection

### Cloud database migration (SQLite → Supabase / Postgres)
SQLite + better-sqlite3 is local-only. To deploy:
- Migrate schema to Postgres (Prisma handles most of it; fix `String` → `enum`
  where needed, remove SQLite-specific notes)
- Use Supabase free tier or Railway
- Prisma client swap: remove `@prisma/adapter-better-sqlite3`, use default
  Postgres adapter
- Move secrets to Vercel env vars

### Vercel deployment plan
1. Migrate DB to Postgres (see above)
2. `npm run build` passes clean
3. `vercel deploy` from the `command-center/` directory
4. Set `DATABASE_URL` in Vercel project settings
5. Run seed once via Vercel CLI or manual DB insert

---

## Feature improvements

### Recurring tasks
A `Task` variant that auto-resets on a schedule (daily, weekly, specific weekday).
Model change: add `recurring Boolean`, `recurrencePattern String?`. Cron-style
reset via a server route hit by a cron service or Vercel cron jobs.

### Time estimates vs. actuals
`Task.estimatedMinutes` already exists. Need to surface it:
- Show estimated total on Today ("~3h of tasks planned")
- After completing, compare vs. actual session time logged against that task
- Weekly summary: estimated vs. actual

### Project health score
Auto-compute from: tasks overdue, last active session date, bottleneck field
non-empty, etc. Show a health indicator on the Project Map.

### Brain dump triage mode
A focused "one at a time" review mode — show one inbox item, choose: convert to
task / convert to project idea / archive / keep in inbox. Good for weekly review.

### Daily/weekly review streaks
Track how many consecutive days/weeks the review was completed. Visible on the
Standards page alongside habit streaks.

### Export / backup
One-click export of: daily reviews (Markdown), brain dump inbox, habit history.
JSON export of everything for migration purposes.

---

## Polish and performance

### Optimistic updates for habit checks and task toggles
Currently every server action triggers a full server re-render. For the two
most frequent actions (check habit, toggle task done), add optimistic UI via
`useOptimistic` from React 19.

### Global search (Command+K)
Search across tasks, projects, brain dump items. Already have keyboard shortcut
infrastructure in `keyboard-shortcuts.tsx`. Would use a dialog with live
`/api/search?q=` endpoint (simple SQLite LIKE query).

### Notification / daily reminder
A desktop notification at a set time ("Time to do your daily review") via
the Notifications API. Works on desktop Chrome. Could use the existing
Settings model to store preferred reminder time.

---

## Next recommended prompt for fresh session

Paste this into a new Claude Code session to resume work:

---

```
You are continuing work on the Command Center app, a personal daily operating
system built with Next.js 16, Prisma 7 + SQLite, Tailwind CSS v4, and shadcn/ui.

The project is at: c:\Users\gunne\Documents\Website Design\command-center\

IMPORTANT: prisma/dev.db contains REAL LIFE/WORK DATA. Never reset or delete it
without explicit approval. Before any schema change or migration, create a backup:
  Copy-Item prisma\dev.db prisma\backups\dev-$(Get-Date -Format 'yyyyMMdd-HHmm').db

Start by reading these files in order:
1. command-center/CLAUDE.md — project rules, stack notes, conventions
2. command-center/docs/PROJECT_HANDOFF.md — full feature/architecture state
3. command-center/docs/ROADMAP.md — future ideas (don't build without direction)

Then read the specific files relevant to what I ask you to work on before making
any changes. Run `npm run typecheck` and `npm run lint` before calling any change done.

Today I want to work on: [describe what you want to build or fix here]
```
