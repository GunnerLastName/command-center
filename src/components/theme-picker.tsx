"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateSettings } from "@/app/actions/settings";
import { THEMES, THEME_CATEGORIES, resolveThemeId } from "@/lib/themes";
import type { ThemeCategory } from "@/lib/themes";

function ThemeTestPanel() {
  const [checked, setChecked] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Theme preview</p>

      {/* Card sample */}
      <div className="rounded-md border border-border bg-background p-3 space-y-1">
        <p className="text-sm font-semibold">Sample card</p>
        <p className="text-xs text-muted-foreground">Secondary text takes on the theme hue.</p>
      </div>

      {/* Buttons row */}
      <div className="flex flex-wrap gap-2">
        <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90">
          Primary
        </button>
        <button className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-opacity hover:opacity-90">
          Secondary
        </button>
        <button className="rounded-md border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent">
          Outline
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">Primary badge</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Muted badge</span>
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">Accent badge</span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Progress bar (68%)</p>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[68%] rounded-full bg-primary transition-all" />
        </div>
      </div>

      {/* Input */}
      <input
        type="text"
        placeholder="Input field…"
        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-1"
        readOnly
      />

      {/* Checkbox row */}
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
        style={{ borderColor: checked ? "color-mix(in oklch, var(--primary) 30%, transparent)" : undefined,
                 backgroundColor: checked ? "color-mix(in oklch, var(--primary) 10%, transparent)" : undefined }}
      >
        <span
          onClick={() => setChecked((v) => !v)}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            checked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40"
          )}
        >
          {checked && <Check className="size-3" strokeWidth={3} />}
        </span>
        <span className={cn("text-sm font-medium", checked && "text-primary")}>
          {checked ? "Habit done" : "Mark habit done"}
        </span>
      </label>

      {/* Ring / focus demo */}
      <p className="text-xs text-muted-foreground">
        Focus any element above to see the themed ring color.
      </p>
    </div>
  );
}

interface ThemePickerProps {
  currentTheme: string;
}

export function ThemePicker({ currentTheme }: ThemePickerProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(() => resolveThemeId(currentTheme));
  const [activeCategory, setActiveCategory] = useState<ThemeCategory | "all">("all");
  const [isPending, startTransition] = useTransition();

  function applyTheme(themeId: string) {
    const theme = THEMES.find((t) => t.id === themeId);
    if (!theme) return;

    setActiveId(themeId);

    // Immediate DOM apply — no page refresh flicker
    const el = document.documentElement;
    el.classList.forEach((cls) => {
      if (cls.startsWith("theme-")) el.classList.remove(cls);
    });
    el.classList.remove("dark");
    if (theme.isDark) el.classList.add("dark");
    el.classList.add(`theme-${theme.id}`);

    startTransition(async () => {
      await updateSettings({ theme: themeId });
      router.refresh();
    });
  }

  const visible =
    activeCategory === "all"
      ? THEMES
      : THEMES.filter((t) => t.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {THEME_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Theme grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {visible.map((theme) => {
          const isActive = theme.id === activeId;
          return (
            <button
              key={theme.id}
              onClick={() => applyTheme(theme.id)}
              disabled={isPending}
              title={theme.description}
              className={cn(
                "group relative flex flex-col gap-2 rounded-lg border p-2.5 text-left transition-all hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "border-ring ring-1 ring-ring"
                  : "border-border hover:bg-accent/30"
              )}
            >
              {/* Color swatches */}
              <div className="flex gap-1">
                <span
                  className="h-5 flex-1 rounded-sm"
                  style={{ backgroundColor: theme.preview.bg }}
                />
                <span
                  className="h-5 flex-1 rounded-sm"
                  style={{ backgroundColor: theme.preview.card }}
                />
                <span
                  className="h-5 flex-1 rounded-sm"
                  style={{ backgroundColor: theme.preview.primary }}
                />
                <span
                  className="h-5 flex-1 rounded-sm"
                  style={{ backgroundColor: theme.preview.text }}
                />
              </div>

              {/* Theme name */}
              <span className="text-xs font-medium leading-tight">{theme.name}</span>

              {/* Active checkmark */}
              {isActive && (
                <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-2.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <ThemeTestPanel />

      {isPending && (
        <p className="text-xs text-muted-foreground">Saving…</p>
      )}
    </div>
  );
}
