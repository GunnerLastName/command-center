/**
 * Theme registry — single source of truth for all available themes.
 *
 * Each theme maps to a CSS class applied to <html>:
 *   dark themes:  class="dark theme-{id}"
 *   light themes: class="theme-{id}"
 *
 * The CSS variable overrides live in src/app/themes.css.
 * To add a theme: add an entry here + a .theme-{id} block in themes.css.
 */

export type ThemeCategory = "dark" | "light" | "cyber" | "minimal" | "colorful";

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  category: ThemeCategory;
  isDark: boolean;
  preview: {
    bg: string;     // oklch or hex for swatch
    card: string;
    primary: string;
    text: string;
  };
}

export const THEMES: ThemePreset[] = [
  // ─── DARK ─────────────────────────────────────────────────────────────────
  {
    id: "midnight",
    name: "Midnight",
    description: "Clean dark default. Professional founder dashboard feel.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.14 0.006 264)", card: "oklch(0.175 0.006 264)", primary: "oklch(0.922 0 0)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Dark navy blue. Calm, deep, and focused.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.12 0.04 245)", card: "oklch(0.17 0.033 245)", primary: "oklch(0.62 0.2 220)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "ember",
    name: "Ember",
    description: "Dark charcoal with amber accents. Energetic but not harsh.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.12 0.01 35)", card: "oklch(0.17 0.01 35)", primary: "oklch(0.72 0.22 50)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Dark green, calm and grounded. Like working in deep focus.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.12 0.025 155)", card: "oklch(0.17 0.022 155)", primary: "oklch(0.60 0.18 150)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "royal",
    name: "Royal",
    description: "Dark purple. Polished, premium, and modern.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.12 0.04 295)", card: "oklch(0.17 0.035 295)", primary: "oklch(0.68 0.28 285)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "blood-moon",
    name: "Blood Moon",
    description: "Near-black with deep red accents. Intense and focused.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.09 0.015 15)", card: "oklch(0.13 0.018 15)", primary: "oklch(0.58 0.22 18)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "glacier",
    name: "Glacier",
    description: "Dark icy blue. Cold, clean, high-focus.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.11 0.02 225)", card: "oklch(0.15 0.018 225)", primary: "oklch(0.70 0.15 195)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "gold-standard",
    name: "Gold Standard",
    description: "Dark charcoal with gold accents. Premium, luxury feel.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.11 0.005 60)", card: "oklch(0.15 0.007 60)", primary: "oklch(0.72 0.18 83)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "emerald",
    name: "Emerald",
    description: "Rich dark green. Calm, premium, and focused.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.10 0.03 160)", card: "oklch(0.14 0.025 160)", primary: "oklch(0.62 0.22 155)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Dark navy with aurora teal-green accents.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.10 0.02 250)", card: "oklch(0.14 0.018 250)", primary: "oklch(0.70 0.18 165)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "deep-space",
    name: "Deep Space",
    description: "Dark navy-black with deep purple-blue accents.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.09 0.02 280)", card: "oklch(0.13 0.018 280)", primary: "oklch(0.58 0.22 265)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "coffee",
    name: "Coffee",
    description: "Warm dark brown. Calm, cozy, great for reviewing.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.16 0.02 58)", card: "oklch(0.21 0.022 55)", primary: "oklch(0.62 0.12 58)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "slate",
    name: "Slate",
    description: "Dark blue-gray. Mature, professional, everyday.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.14 0.015 235)", card: "oklch(0.19 0.013 235)", primary: "oklch(0.58 0.14 225)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    description: "Muted dark base with warm yellow accents. Easy on the eyes.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.17 0.025 215)", card: "oklch(0.21 0.022 215)", primary: "oklch(0.72 0.18 80)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "navy-command",
    name: "Navy Command",
    description: "Deep navy with blue accents. Professional agency feel.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.12 0.035 242)", card: "oklch(0.17 0.030 242)", primary: "oklch(0.56 0.18 235)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "copper",
    name: "Copper",
    description: "Dark charcoal with copper accents. Warmer than Ember.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.12 0.01 45)", card: "oklch(0.17 0.015 45)", primary: "oklch(0.65 0.18 52)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "rose-noir",
    name: "Rose Noir",
    description: "Dark plum base with muted rose accents. Elegant.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.10 0.02 330)", card: "oklch(0.14 0.018 330)", primary: "oklch(0.62 0.18 355)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "tactical",
    name: "Tactical",
    description: "Dark olive with muted green. Military, grounded, no-nonsense.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.11 0.01 125)", card: "oklch(0.15 0.012 120)", primary: "oklch(0.56 0.12 125)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "night-ops",
    name: "Night Ops",
    description: "Very dark navy. Muted blue-green accents. Serious late-night.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.09 0.02 230)", card: "oklch(0.13 0.018 230)", primary: "oklch(0.52 0.12 195)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "inferno",
    name: "Inferno",
    description: "Dark base with orange-red fire accents. Intense work mode.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.11 0.01 30)", card: "oklch(0.15 0.015 30)", primary: "oklch(0.68 0.22 42)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "amethyst",
    name: "Amethyst",
    description: "Dark purple. Premium, creative, calm.",
    category: "colorful",
    isDark: true,
    preview: { bg: "oklch(0.11 0.03 305)", card: "oklch(0.15 0.026 305)", primary: "oklch(0.60 0.24 305)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "crimson",
    name: "Crimson",
    description: "Dark charcoal with crimson accent. Aggressive but clean.",
    category: "colorful",
    isDark: true,
    preview: { bg: "oklch(0.11 0.01 20)", card: "oklch(0.15 0.012 20)", primary: "oklch(0.55 0.22 18)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "iron",
    name: "Iron",
    description: "Dark metallic gray with silver accents. Strong, industrial.",
    category: "dark",
    isDark: true,
    preview: { bg: "oklch(0.12 0.005 250)", card: "oklch(0.17 0.004 250)", primary: "oklch(0.75 0.015 250)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "phantom",
    name: "Phantom",
    description: "Near-black with violet-blue accents. Sleek and mysterious.",
    category: "colorful",
    isDark: true,
    preview: { bg: "oklch(0.09 0.02 280)", card: "oklch(0.13 0.016 280)", primary: "oklch(0.62 0.22 282)", text: "oklch(0.985 0 0)" },
  },

  // ─── CYBER ────────────────────────────────────────────────────────────────
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Dark base with neon cyan. Futuristic but readable.",
    category: "cyber",
    isDark: true,
    preview: { bg: "oklch(0.10 0.015 265)", card: "oklch(0.14 0.012 265)", primary: "oklch(0.82 0.22 195)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "neon-grid",
    name: "Neon Grid",
    description: "Dark with electric lime-green. High-voltage.",
    category: "cyber",
    isDark: true,
    preview: { bg: "oklch(0.09 0.01 150)", card: "oklch(0.13 0.012 150)", primary: "oklch(0.78 0.28 145)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "matrix",
    name: "Matrix",
    description: "Near-black with green terminal text. Hacker command center.",
    category: "cyber",
    isDark: true,
    preview: { bg: "oklch(0.06 0 0)", card: "oklch(0.10 0.005 145)", primary: "oklch(0.73 0.26 145)", text: "oklch(0.75 0.2 145)" },
  },
  {
    id: "synthwave",
    name: "Synthwave",
    description: "Dark purple-navy with neon pink accents. Retro-futuristic.",
    category: "cyber",
    isDark: true,
    preview: { bg: "oklch(0.10 0.03 295)", card: "oklch(0.14 0.025 295)", primary: "oklch(0.78 0.28 350)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "vaporwave",
    name: "Vaporwave",
    description: "Dark purple with pink-magenta. Dreamy cyber aesthetic.",
    category: "cyber",
    isDark: true,
    preview: { bg: "oklch(0.11 0.025 285)", card: "oklch(0.15 0.022 285)", primary: "oklch(0.75 0.28 330)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "electric-blue",
    name: "Electric Blue",
    description: "Deep navy with bright blue. Sharp, techy, clean.",
    category: "cyber",
    isDark: true,
    preview: { bg: "oklch(0.10 0.02 250)", card: "oklch(0.14 0.018 250)", primary: "oklch(0.58 0.26 235)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "neon-lime",
    name: "Neon Lime",
    description: "Dark base with lime yellow-green. Energetic cyber.",
    category: "cyber",
    isDark: true,
    preview: { bg: "oklch(0.09 0.008 135)", card: "oklch(0.13 0.01 135)", primary: "oklch(0.82 0.3 130)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "terminal",
    name: "Terminal",
    description: "Near-black with green monochrome accents. Classic command-line.",
    category: "cyber",
    isDark: true,
    preview: { bg: "oklch(0.07 0 0)", card: "oklch(0.11 0.005 145)", primary: "oklch(0.68 0.22 145)", text: "oklch(0.85 0 0)" },
  },
  {
    id: "blueprint",
    name: "Blueprint",
    description: "Dark blue with cyan-white accents. Systems, planning, architecture.",
    category: "cyber",
    isDark: true,
    preview: { bg: "oklch(0.10 0.03 250)", card: "oklch(0.14 0.026 250)", primary: "oklch(0.65 0.2 210)", text: "oklch(0.985 0 0)" },
  },

  {
    id: "debug-neon",
    name: "Debug Neon",
    description: "Hot pink + neon cyan. Deliberately extreme — proves theme plumbing works.",
    category: "cyber",
    isDark: true,
    preview: { bg: "oklch(0.07 0 0)", card: "oklch(0.11 0 0)", primary: "oklch(0.68 0.36 340)", text: "oklch(0.97 0 0)" },
  },

  // ─── MINIMAL ─────────────────────────────────────────────────────────────
  {
    id: "obsidian",
    name: "Obsidian",
    description: "Deep black, minimal. High-focus, no distractions.",
    category: "minimal",
    isDark: true,
    preview: { bg: "oklch(0.08 0 0)", card: "oklch(0.12 0 0)", primary: "oklch(0.88 0 0)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "void",
    name: "Void",
    description: "Near-black with subtle blue-gray. Deep focus, serious.",
    category: "minimal",
    isDark: true,
    preview: { bg: "oklch(0.09 0.005 245)", card: "oklch(0.13 0.005 245)", primary: "oklch(0.55 0.06 230)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "graphite",
    name: "Graphite",
    description: "Neutral dark gray. Very minimal, zero distractions.",
    category: "minimal",
    isDark: true,
    preview: { bg: "oklch(0.13 0 0)", card: "oklch(0.18 0 0)", primary: "oklch(0.72 0 0)", text: "oklch(0.985 0 0)" },
  },
  {
    id: "monochrome",
    name: "Monochrome",
    description: "Black, white, and gray only. Extremely minimal.",
    category: "minimal",
    isDark: true,
    preview: { bg: "oklch(0.10 0 0)", card: "oklch(0.15 0 0)", primary: "oklch(0.85 0 0)", text: "oklch(0.985 0 0)" },
  },

  // ─── LIGHT ───────────────────────────────────────────────────────────────
  {
    id: "paper-light",
    name: "Paper Light",
    description: "Clean pure white. Simple, low-distraction.",
    category: "light",
    isDark: false,
    preview: { bg: "oklch(1 0 0)", card: "oklch(0.97 0 0)", primary: "oklch(0.22 0 0)", text: "oklch(0.145 0 0)" },
  },
  {
    id: "solar-light",
    name: "Solar Light",
    description: "Warm ivory with amber accents. Energized daytime feel.",
    category: "light",
    isDark: false,
    preview: { bg: "oklch(0.98 0.008 85)", card: "oklch(0.96 0.01 85)", primary: "oklch(0.52 0.2 48)", text: "oklch(0.22 0.015 50)" },
  },
  {
    id: "arctic",
    name: "Arctic",
    description: "Cool blue-gray light. Clean and focused.",
    category: "light",
    isDark: false,
    preview: { bg: "oklch(0.97 0.007 220)", card: "oklch(0.995 0.003 220)", primary: "oklch(0.42 0.18 225)", text: "oklch(0.22 0.03 225)" },
  },
  {
    id: "desert",
    name: "Desert",
    description: "Warm sand and bronze tones. Arizona desert inspired.",
    category: "light",
    isDark: false,
    preview: { bg: "oklch(0.97 0.02 80)", card: "oklch(0.94 0.025 80)", primary: "oklch(0.58 0.18 60)", text: "oklch(0.28 0.04 60)" },
  },
  {
    id: "polar-light",
    name: "Polar Light",
    description: "Crisp white with blue accents. Clean, Apple-like.",
    category: "light",
    isDark: false,
    preview: { bg: "oklch(0.99 0.002 220)", card: "oklch(0.97 0.004 220)", primary: "oklch(0.42 0.2 225)", text: "oklch(0.18 0.02 220)" },
  },
  {
    id: "cream",
    name: "Cream",
    description: "Soft warm cream. Low eye strain, calm and simple.",
    category: "light",
    isDark: false,
    preview: { bg: "oklch(0.98 0.015 90)", card: "oklch(0.96 0.018 88)", primary: "oklch(0.38 0.08 50)", text: "oklch(0.25 0.02 60)" },
  },
  {
    id: "solarized-light",
    name: "Solarized Light",
    description: "Muted warm light. Low eye strain, good for daytime.",
    category: "light",
    isDark: false,
    preview: { bg: "oklch(0.97 0.015 90)", card: "oklch(0.95 0.015 88)", primary: "oklch(0.52 0.16 195)", text: "oklch(0.32 0.03 215)" },
  },
  {
    id: "iceberg",
    name: "Iceberg",
    description: "Light blue with icy accents. Cold, clean, sharp.",
    category: "light",
    isDark: false,
    preview: { bg: "oklch(0.97 0.015 220)", card: "oklch(0.99 0.008 215)", primary: "oklch(0.45 0.2 225)", text: "oklch(0.22 0.04 225)" },
  },
  {
    id: "halo",
    name: "Halo",
    description: "White-cream with gold accents. Clean and peaceful.",
    category: "light",
    isDark: false,
    preview: { bg: "oklch(0.995 0.003 90)", card: "oklch(0.975 0.006 88)", primary: "oklch(0.60 0.16 80)", text: "oklch(0.25 0.015 70)" },
  },
  {
    id: "platinum",
    name: "Platinum",
    description: "Light gray-white with silver-blue accents. Premium, professional.",
    category: "light",
    isDark: false,
    preview: { bg: "oklch(0.97 0.004 230)", card: "oklch(0.99 0.002 230)", primary: "oklch(0.40 0.12 220)", text: "oklch(0.20 0.02 225)" },
  },
  {
    id: "mint-light",
    name: "Mint Light",
    description: "Soft light with mint-green accents. Calm and fresh.",
    category: "light",
    isDark: false,
    preview: { bg: "oklch(0.98 0.01 155)", card: "oklch(0.96 0.012 155)", primary: "oklch(0.50 0.18 155)", text: "oklch(0.22 0.03 160)" },
  },
];

/** Map old "dark"/"light" values to the new theme ID system. */
export function resolveThemeId(stored: string): string {
  if (stored === "dark") return "midnight";
  if (stored === "light") return "paper-light";
  const found = THEMES.find((t) => t.id === stored);
  return found?.id ?? "midnight";
}

/** Get a theme preset by ID; falls back to midnight. */
export function getTheme(id: string): ThemePreset {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Compute the HTML class string for a given theme. */
export function themeToHtmlClass(theme: ThemePreset): string {
  return theme.isDark ? `dark theme-${theme.id}` : `theme-${theme.id}`;
}

export const THEME_CATEGORIES: { id: ThemeCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "dark", label: "Dark" },
  { id: "cyber", label: "Cyber" },
  { id: "minimal", label: "Minimal" },
  { id: "light", label: "Light" },
  { id: "colorful", label: "Colorful" },
];
