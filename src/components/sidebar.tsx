"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Brain,
  CalendarRange,
  Command,
  LayoutDashboard,
  ListChecks,
  Map,
  NotebookPen,
  Settings,
  Square,
  Sun,
  Target,
  Timer,
} from "lucide-react";
import { stopSession } from "@/app/actions/sessions";
import { cn } from "@/lib/utils";
import type { ProjectOption } from "@/lib/types";
import { QuickAdd } from "./quick-add";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today", icon: Sun },
  { href: "/standards", label: "Daily Standards", icon: Target },
  { href: "/projects", label: "Project Map", icon: Map },
  { href: "/brain-dump", label: "Brain Dump", icon: Brain },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/work-log", label: "Work Log", icon: Timer },
  { href: "/daily-review", label: "Daily Review", icon: NotebookPen },
  { href: "/weekly-review", label: "Weekly Review", icon: CalendarRange },
  { href: "/settings", label: "Settings", icon: Settings },
];

export interface ActiveSessionInfo {
  id: string;
  description: string;
  startTime: string; // ISO
  projectName: string | null;
}

function elapsedLabel(startIso: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(startIso)) / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ActiveSessionWidget({ session }: { session: ActiveSessionInfo }) {
  const [now, setNow] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
      <Link href="/work-log" className="block">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span className="hidden text-xs font-medium text-primary lg:inline">
            In session · {elapsedLabel(session.startTime, now)}
          </span>
        </div>
        <p className="mt-1 hidden truncate text-xs text-muted-foreground lg:block">
          {session.description || session.projectName || "Focused work"}
        </p>
      </Link>
      <button
        onClick={() => startTransition(() => stopSession())}
        disabled={isPending}
        className="mt-2 hidden w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background/40 py-1 text-xs text-foreground transition-colors hover:bg-background lg:flex"
      >
        <Square className="size-3" /> Stop
      </button>
    </div>
  );
}

export function Sidebar({
  projects,
  activeSession,
}: {
  projects: ProjectOption[];
  activeSession: ActiveSessionInfo | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-60 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-5 lg:px-5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Command className="size-4" />
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-semibold leading-tight">Command Center</p>
          <p className="text-xs text-muted-foreground">Run the day.</p>
        </div>
      </div>

      <div className="px-3 pb-3">
        <QuickAdd projects={projects} />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        {activeSession ? (
          <ActiveSessionWidget session={activeSession} />
        ) : (
          <Link
            href="/work-log"
            className="hidden items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground lg:flex"
          >
            <Timer className="size-3.5" />
            No session running
          </Link>
        )}
      </div>
    </aside>
  );
}
