/**
 * Alias maps for habits, projects, and common terms.
 * Keys are canonical names (matching DB records); values are arrays of aliases.
 * All comparisons happen case-insensitively.
 *
 * To add aliases: add entries here, then re-deploy (no DB change needed).
 */

export const HABIT_ALIASES: Record<string, string[]> = {
  "Read Bible": [
    "bible",
    "scripture",
    "reading",
    "bible reading",
    "read scripture",
    "read the bible",
    "did bible",
    "bible done",
    "read my bible",
    "did my bible reading",
    "bible study",
    "morning reading",
  ],
  Pray: [
    "prayer",
    "prayed",
    "praying",
    "talk to god",
    "talked to god",
    "did prayer",
    "prayer done",
    "did my prayer",
    "said my prayers",
    "prayed today",
    "pray today",
  ],
  "Morning Routine": [
    "morning",
    "routine",
    "morning routine",
    "am routine",
    "morning habits",
  ],
  "Deep Work": [
    "deep work",
    "focus work",
    "focused work",
    "deep focus",
  ],
  Gym: [
    "gym",
    "workout",
    "worked out",
    "hit the gym",
    "exercise",
    "lifted",
    "lifting",
    "training",
    "trained",
  ],
  "Daily Review": [
    "review",
    "daily reflection",
    "reflection",
    "end of day review",
    "night review",
    "day review",
    "eod review",
  ],
  "Cold Shower": [
    "cold shower",
    "shower",
    "cold showers",
    "took a cold shower",
  ],
  Sleep: ["sleep", "went to bed", "bed", "bedtime"],
  Journal: ["journal", "journaled", "journaling", "wrote in journal"],
};

export const PROJECT_ALIASES: Record<string, string[]> = {
  "Octagon Outreach": [
    "octagon",
    "mma agency",
    "agency",
    "outreach",
    "octagon outreach",
    "mma",
  ],
  "Glass Haven": [
    "glass",
    "glass haven",
    "window cleaning montana",
    "montana windows",
    "glass haven automation",
    "glasshaven",
  ],
  "Pane Perfect": [
    "pane",
    "pane perfect",
    "arizona windows",
    "az windows",
    "pane perfect az",
    "pp",
    "paneperfect",
  ],
  "TikTok Content": [
    "tiktok",
    "content",
    "scripts",
    "videos",
    "tik tok",
    "social media",
    "tiktok content",
  ],
  "Personal Brand": [
    "personal brand",
    "brand",
    "branding",
    "my brand",
    "personal",
  ],
  "Glacier Grappling": [
    "glacier",
    "grappling",
    "glacier grappling",
    "gym website",
  ],
  "Command Center": [
    "command center",
    "app",
    "this app",
    "the app",
    "dashboard",
    "productivity app",
  ],
};

/**
 * Given a query string, returns the canonical name if it matches any alias.
 * Returns null if no alias match.
 */
export function resolveAlias(
  query: string,
  aliasMap: Record<string, string[]>
): string | null {
  const q = query.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(aliasMap)) {
    if (canonical.toLowerCase() === q) return canonical;
    for (const alias of aliases) {
      if (alias.toLowerCase() === q) return canonical;
    }
  }
  return null;
}
