"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Brain,
  CalendarRange,
  LayoutDashboard,
  ListChecks,
  Map,
  MoreHorizontal,
  NotebookPen,
  Settings,
  Sun,
  Target,
  Timer,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today", icon: Sun },
  { href: "/standards", label: "Standards", icon: Target },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
];

const MORE_NAV = [
  { href: "/projects", label: "Projects", icon: Map },
  { href: "/brain-dump", label: "Brain Dump", icon: Brain },
  { href: "/work-log", label: "Work Log", icon: Timer },
  { href: "/daily-review", label: "Daily Review", icon: NotebookPen },
  { href: "/weekly-review", label: "Weekly Review", icon: CalendarRange },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = MORE_NAV.some(
    (item) =>
      item.href === pathname ||
      (item.href !== "/" && pathname.startsWith(item.href))
  );

  return (
    <>
      {/* Fixed bottom navigation bar — visible only below lg breakpoint */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex border-t border-sidebar-border bg-sidebar"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile navigation"
      >
        {PRIMARY_NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          aria-label="More navigation options"
          aria-expanded={moreOpen}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
            moreActive || moreOpen
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {moreOpen ? (
            <X className="size-5" />
          ) : (
            <MoreHorizontal className="size-5" />
          )}
          <span>More</span>
        </button>
      </nav>

      {/* More overlay — slides up from bottom over the bottom nav */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-20">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />

          {/* Sheet */}
          <div
            className="absolute bottom-0 inset-x-0 z-30 rounded-t-2xl border-t border-sidebar-border bg-sidebar px-4 pt-5"
            style={{
              paddingBottom:
                "calc(env(safe-area-inset-bottom) + 5rem)",
            }}
          >
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              More
            </p>
            <div className="grid grid-cols-3 gap-2">
              {MORE_NAV.map((item) => {
                const active =
                  item.href === pathname ||
                  (item.href !== "/" &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition-colors",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="size-5" />
                    <span className="text-center leading-tight">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
