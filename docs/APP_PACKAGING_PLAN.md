# Command Center — App Packaging Plan

A phased plan for turning this local Next.js app into something that feels,
installs, and behaves like a real desktop/mobile app.

---

## Current state

- Local Next.js 16 dev server on `localhost:3000`
- SQLite database (`prisma/dev.db`) — all data is local to this machine
- Chrome app window launcher (`Launch Command Center.cmd`) for chromeless desktop launch
- PWA shell: manifest, Apple web app metadata, app icons (SVG + 192 + 512 PNGs)
- Mobile-responsive: bottom nav bar, assistant modal, safe-area insets
- Two launcher scripts:
  - `Launch Command Center.cmd` — desktop (localhost, chromeless Chrome window)
  - `Launch Command Center Mobile Host.cmd` — phone access (binds to 0.0.0.0, shows local IP)

---

## Phase 1 — iPhone PWA via local network or Tailscale ✅ READY

**Goal:** Access Command Center from iPhone, install to Home Screen, use it like an app.

**How it works:**
- The app runs on your PC. Your iPhone connects over your network.
- iPhone and PC share the same SQLite database — all changes sync instantly.
- The app installs to iPhone Home Screen via Safari's "Add to Home Screen" — fullscreen, no browser chrome.
- Your PC must be on and `npm run dev:host` must be running.

### Option A — Same Wi-Fi (quick, temporary)

Works while both devices are on the same network. Does not work away from home.

```powershell
# 1. Find your PC's local IP
ipconfig
# Look for IPv4 Address under Wi-Fi adapter — e.g. 192.168.1.42

# 2. Start the server bound to all interfaces
npm run dev:host
# or double-click: Launch Command Center Mobile Host.cmd

# 3. On iPhone (Safari): http://192.168.x.x:3000
#    Share → Add to Home Screen → Add
```

### Option B — Tailscale (recommended, works anywhere)

Tailscale creates a private encrypted network between your devices. Your iPhone
can reach your PC from anywhere — no cloud migration, no code change, free tier works.

```powershell
# PC setup: install Tailscale from tailscale.com/download/windows
# iPhone setup: App Store → Tailscale (same account)
# Find your PC's Tailscale IP (100.x.x.x) in the Tailscale app
# Start the server:
npm run dev:host
# On iPhone (Safari): http://100.x.x.x:3000
# Share → Add to Home Screen → Add
```

### Windows Firewall

Windows may block incoming connections. If the phone can't connect:

1. Open Windows Defender Firewall → Advanced Settings → Inbound Rules
2. Create a new rule for TCP port 3000, or check for a blocking Node.js rule

Run as Administrator in PowerShell (review before running):
```powershell
New-NetFirewallRule -DisplayName "Command Center Dev" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### PWA details (already in place)

- `src/app/manifest.ts` → served at `/manifest.webmanifest` (name, short_name, standalone display, theme color)
- `src/app/layout.tsx` → `appleWebApp: { capable: true }`, viewport `viewportFit: "cover"`, apple touch icon
- `public/icons/icon.svg` — dark background, gold ⌘ symbol
- `public/icons/icon-192.png` — 192×192 PNG (for Chrome install badge and Apple touch icon)
- `public/icons/icon-512.png` — 512×512 PNG (maskable, for Android/PWA splash)

To regenerate icons after editing the SVG (sharp is already a dependency):
```powershell
cd "c:\Users\gunne\Documents\Website Design\command-center"
node -e "
const sharp = require('sharp');
const fs = require('fs');
const svg = fs.readFileSync('public/icons/icon.svg');
Promise.all([
  sharp(svg).resize(192, 192).png().toFile('public/icons/icon-192.png'),
  sharp(svg).resize(512, 512).png().toFile('public/icons/icon-512.png'),
]).then(() => console.log('Icons generated'));
"
```

### Limitations of Phase 1

- PC must be on and dev server must be running
- Away-from-home requires Tailscale (or Phase 2)
- No offline support — app requires server routes and Prisma
- Not published to App Store — installs via Safari only
- No authentication — anyone on your Tailscale network could access it

---

## Phase 2 — Cloud database + Vercel deployment (true anywhere access)

**Goal:** Access Command Center from any device, anywhere, without your PC running.

This requires migrating off SQLite — the current local-only database.

### 2a — Database migration (SQLite → Postgres)

1. Back up `prisma/dev.db`
   ```powershell
   Copy-Item prisma\dev.db prisma\backups\dev-$(Get-Date -Format 'yyyyMMdd-HHmm').db
   ```
2. Provision a Postgres database (Supabase free tier recommended — no credit card)
3. Update `prisma/schema.prisma` — remove SQLite adapter references, update field types
4. Update `src/lib/db.ts` — remove `better-sqlite3`, use Prisma Postgres client
5. Set `DATABASE_URL` in `.env.local` for dev
6. Run `npm run db:migrate` against Postgres
7. Import existing data (Prisma Studio export or a migration script)

### 2b — Authentication (required before public URL)

Before any public deployment, add an auth gate. Options (simplest to most robust):

- **Single secret password** — check a `PASSWORD` env var in `middleware.ts`, redirect to a login page if not authenticated. No dependencies.
- **next-auth** — email/password for one user. More work, more flexibility.
- **Network-level (no code)** — Tailscale or Cloudflare Access restricts who can reach the URL at all.

### 2c — Vercel deployment

1. `npm run build` passes clean (verify locally first)
2. `vercel deploy` from the `command-center/` directory
3. Set `DATABASE_URL` in Vercel project settings
4. Set `ANTHROPIC_API_KEY` in Vercel env vars
5. Run one-time seed if needed

**Result:** A private URL you can open on any device, anywhere, without a running PC.

---

## Phase 3 — Desktop native wrapper (optional)

**Goal:** A real downloadable `.exe` rather than a Chrome shortcut.

The existing `Launch Command Center.cmd` + Chrome `--app=` flag already gives a
chromeless window. A proper Electron app just removes the dependency on Chrome.

### Electron (recommended for this stack)

Electron bundles Node.js + Chromium. Next.js server runs inside the Electron main
process. SQLite/Prisma works exactly as today — no DB migration needed.

Rough path:
1. Add Electron as a dev dependency
2. Create `electron/main.ts` — spawn `next start` as a child process, open `BrowserWindow` at `localhost:3000`
3. Wait for port 3000 to be available before loading the window
4. Build with `electron-builder` targeting Windows

**Tradeoffs:** Bundle is large (~150–300 MB). Adds build complexity. But it's the
cleanest path to a self-contained desktop `.exe`.

### Tauri (not recommended for this stack)

Tauri uses the OS WebView instead of Chromium — smaller bundle (~10 MB). But Tauri
expects static files, not a running Node.js server. Next.js App Router with server
components, server actions, and Prisma doesn't work in a static export without
significant rework. Not worth it here.

---

## Phase 4 — Capacitor native wrapper (only if PWA isn't enough)

**Goal:** Publish to the App Store or access device-only APIs (push notifications, camera).

Capacitor wraps a web app in a native iOS/Android shell. It can access native APIs
that PWAs cannot — but it requires the app to be deployed online (Phase 2 first).

**When to consider it:**
- PWA home screen feels janky on a specific device
- You need iOS push notifications (iOS PWA push support is limited)
- You want an App Store listing

**Path:**
1. Complete Phase 2 (cloud DB + public URL) first
2. `npm install @capacitor/core @capacitor/cli`
3. `npx cap init "Command Center" com.gunnerbusic.commandcenter`
4. `npx cap add ios` → open in Xcode → archive → TestFlight
5. App Store submission (overkill for a personal tool — TestFlight is enough)

**Note:** Capacitor is not the right first step. The PWA home screen experience
(Phase 1) is already app-like. The bigger unlock is cloud access (Phase 2), not
a native wrapper.

---

## Summary

| Goal | Phase | Effort | Prerequisite |
|---|---|---|---|
| iPhone Home Screen install | Phase 1 ✅ | Zero — already done | — |
| Access from iPhone anywhere (Tailscale) | Phase 1 ✅ | 30 min, no code change | — |
| Access without your PC running | Phase 2 | High — DB migration + deploy | Auth + Postgres |
| Proper desktop .exe | Phase 3 | Medium — Electron setup | — |
| iOS App Store | Phase 4 | High | Phase 2 + Xcode |

**Recommended order:**
1. ✅ iPhone PWA via Tailscale — done, zero effort
2. When you need PC-off access → Phase 2 (cloud DB + Vercel)
3. When you want a real .exe → Phase 3 (Electron)
4. App Store only if PWA is genuinely insufficient → Phase 4
