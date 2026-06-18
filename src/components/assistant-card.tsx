"use client";

import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMMAND_ASSISTANT_EVENT } from "@/components/assistant/global-assistant";

export function AssistantCard() {
  return (
    <Button
      variant="outline"
      className="w-full justify-start gap-2 text-sm text-muted-foreground"
      onClick={() => window.dispatchEvent(new CustomEvent(COMMAND_ASSISTANT_EVENT))}
    >
      <Bot className="size-4 shrink-0" />
      <span>Ask Command Assistant…</span>
      <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
        Ctrl K
      </kbd>
    </Button>
  );
}

// Named icon export so the dashboard can use it in the card header
export { Bot as AssistantIcon };
