"use client";

import { useEffect, useState } from "react";
import { APP_TIMEZONE } from "@/lib/dates";

function computeState() {
  const now = new Date();
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { timeZone: APP_TIMEZONE, ...opts }).format(now);
  const hour = Number(fmt({ hour: "numeric", hour12: false }));
  return {
    greeting: hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening",
    date: fmt({ weekday: "long", month: "long", day: "numeric" }),
    time: fmt({ hour: "numeric", minute: "2-digit", hour12: true }),
  };
}

export function Greeting({
  userName,
  subline,
}: {
  userName: string;
  subline?: string;
}) {
  const [state, setState] = useState(computeState);

  useEffect(() => {
    const id = setInterval(() => setState(computeState()), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {state.greeting}, {userName}.
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {state.date} · {state.time}
        {subline && <> — {subline}</>}
      </p>
    </div>
  );
}
