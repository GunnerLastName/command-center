import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Shield, Smartphone, Wifi } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "iPhone Setup — Command Center",
};

const FIREWALL_CMD =
  `New-NetFirewallRule -DisplayName "Command Center Dev" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow`;

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
        {n}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {children}
      </div>
    </li>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <code className="mt-1.5 block rounded bg-muted/40 px-3 py-2 font-mono text-xs text-foreground">
      {children}
    </code>
  );
}

export default function MobileSetupPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="iPhone Setup"
        subtitle="Install Command Center on your iPhone as an app."
      />

      {/* Honest reality callout */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-5">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-400" />
            <div className="space-y-1.5 text-sm">
              <p className="font-medium text-foreground">How this works right now</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>· Command Center runs on your PC — your iPhone connects to it over the network</li>
                <li>
                  · Your PC must be on, and the dev server must be running with{" "}
                  <code className="rounded bg-muted/60 px-1 text-xs text-foreground/80">
                    npm run dev:host
                  </code>
                </li>
                <li>
                  · All data stays in{" "}
                  <code className="rounded bg-muted/60 px-1 text-xs text-foreground/80">
                    prisma/dev.db
                  </code>{" "}
                  on your PC — phone and PC share the same database
                </li>
                <li>· Not a native App Store app — installs from Safari via Add to Home Screen</li>
                <li>· No offline support — the app requires the server to load</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Path A — Same Wi-Fi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Wifi className="size-4" />
            Path A — Same Wi-Fi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Quick and easy. Works while your iPhone and PC are on the same Wi-Fi network. Does not work when you leave home.
          </p>

          <ol className="space-y-4">
            <Step n={1} title="Find your PC local IP address">
              <p className="mt-0.5 text-xs text-muted-foreground">
                Open PowerShell or Command Prompt and run:
              </p>
              <CodeBlock>ipconfig</CodeBlock>
              <p className="mt-1 text-xs text-muted-foreground">
                Look for{" "}
                <span className="text-foreground">IPv4 Address</span> under your
                Wi-Fi adapter — something like{" "}
                <span className="text-foreground">192.168.1.42</span>
              </p>
            </Step>

            <Step n={2} title="Start the server for phone access">
              <p className="mt-0.5 text-xs text-muted-foreground">
                In the project folder, run:
              </p>
              <CodeBlock>npm run dev:host</CodeBlock>
              <p className="mt-1 text-xs text-muted-foreground">
                Or double-click{" "}
                <span className="text-foreground">
                  Launch Command Center Mobile Host.cmd
                </span>
                . This binds to all interfaces (not just localhost) so your
                phone can reach it.
              </p>
            </Step>

            <Step n={3} title="Open the app on your iPhone">
              <p className="mt-0.5 text-xs text-muted-foreground">
                In Safari, navigate to the PC IP:
              </p>
              <CodeBlock>http://192.168.x.x:3000</CodeBlock>
              <p className="mt-1 text-xs text-muted-foreground">
                Replace{" "}
                <span className="text-foreground">192.168.x.x</span> with the
                actual IP from step 1.
              </p>
            </Step>

            <Step n={4} title="Add to Home Screen">
              <p className="mt-0.5 text-xs text-muted-foreground">
                In Safari, tap the{" "}
                <span className="text-foreground">Share</span> button (box with
                arrow pointing up), then tap{" "}
                <span className="text-foreground">Add to Home Screen</span>, then tap{" "}
                <span className="text-foreground">Add</span>. The app opens
                fullscreen with no browser chrome — it feels like a native app.
              </p>
            </Step>
          </ol>
        </CardContent>
      </Card>

      {/* Path B — Tailscale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Shield className="size-4" />
            Path B — Tailscale (recommended, works anywhere)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tailscale creates a private encrypted network between your devices. Your iPhone can reach your PC from anywhere — gym, coffee shop, wherever. Free tier works. No code change, no cloud migration, data stays local.
          </p>

          <ol className="space-y-4">
            <Step n={1} title="Install Tailscale on your PC">
              <p className="mt-0.5 text-xs text-muted-foreground">
                Download from{" "}
                <span className="text-foreground">tailscale.com/download/windows</span>{" "}
                and sign in with Google or GitHub.
              </p>
            </Step>

            <Step n={2} title="Install Tailscale on your iPhone">
              <p className="mt-0.5 text-xs text-muted-foreground">
                App Store → search{" "}
                <span className="text-foreground">Tailscale</span> → install → sign
                in with the same account used on the PC.
              </p>
            </Step>

            <Step n={3} title="Find the PC Tailscale IP">
              <p className="mt-0.5 text-xs text-muted-foreground">
                Open the Tailscale app on your PC — your machine shows a{" "}
                <span className="text-foreground">100.x.x.x</span> address. Copy
                that IP.
              </p>
            </Step>

            <Step n={4} title="Start the server for phone access">
              <CodeBlock>npm run dev:host</CodeBlock>
            </Step>

            <Step n={5} title="Open on iPhone and add to Home Screen">
              <p className="mt-0.5 text-xs text-muted-foreground">
                In Safari, open:
              </p>
              <CodeBlock>http://100.x.x.x:3000</CodeBlock>
              <p className="mt-1 text-xs text-muted-foreground">
                Then Share → Add to Home Screen. Works from anywhere as long as
                your PC is on and Tailscale is connected on both devices.
              </p>
            </Step>
          </ol>
        </CardContent>
      </Card>

      {/* Windows Firewall */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Troubleshooting — Windows Firewall
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If the page will not load on your iPhone, Windows Firewall may be
            blocking incoming connections. Try:
          </p>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>
              1. Open{" "}
              <span className="text-foreground">
                Windows Defender Firewall → Advanced Settings → Inbound Rules
              </span>
            </li>
            <li>
              2. Look for a Node.js rule that is blocking — or create a new
              inbound rule for TCP port 3000
            </li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Or run this in PowerShell as Administrator (review before running):
          </p>
          <CodeBlock>{FIREWALL_CMD}</CodeBlock>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">Important:</span>{" "}
            <code className="rounded bg-muted/60 px-1 text-xs text-foreground/80">
              localhost:3000
            </code>{" "}
            on your iPhone means the iPhone itself — not your PC. You must use
            the PC actual IP address (local or Tailscale).
          </p>
        </CardContent>
      </Card>

      {/* What's next */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Future: true anywhere access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Tailscale is the best current option — works from anywhere with no
            data migration. For a PC-off, always-on experience:
          </p>
          <ul className="space-y-1">
            <li>· Migrate database: SQLite → Postgres (Supabase)</li>
            <li>· Add an auth gate (single password or next-auth)</li>
            <li>· Deploy to Vercel — accessible via URL, no PC required</li>
            <li>· Optional: Capacitor wrapper for App Store if PWA is not enough</li>
          </ul>
          <p className="pt-1 text-xs">
            See{" "}
            <code className="rounded bg-muted/60 px-1 text-foreground/80">
              docs/APP_PACKAGING_PLAN.md
            </code>{" "}
            for the full phased plan.{" "}
            <Link href="/settings" className="text-primary hover:underline">
              Back to Settings
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Bottom install reminder */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <Smartphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          After adding to Home Screen, the app opens fullscreen — no Safari
          chrome, no URL bar. The gold ⌘ icon appears on your iPhone home
          screen. It runs exactly the same as the desktop version, sharing the
          same database on your PC.
        </p>
      </div>
    </div>
  );
}
