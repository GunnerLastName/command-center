import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AssistantLauncher } from "@/components/assistant-launcher";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { GlobalAssistant } from "@/components/assistant/global-assistant";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner";
import {
  getActiveSession,
  getProjectOptions,
  getSettings,
} from "@/lib/queries";
import { parseShortcutSettings } from "@/lib/shortcuts";
import { resolveThemeId, getTheme, themeToHtmlClass } from "@/lib/themes";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#080d13",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Command Center",
  description: "Personal founder command center — tasks, habits, work log, and AI assistant.",
  applicationName: "Command Center",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Command Center",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [activeSession, projects, settings] = await Promise.all([
    getActiveSession(),
    getProjectOptions(),
    getSettings(),
  ]);
  const themeId = resolveThemeId(settings.theme ?? "dark");
  const theme = getTheme(themeId);
  const themeClass = themeToHtmlClass(theme);
  const shortcuts = parseShortcutSettings(settings.keyboardShortcuts ?? "{}");

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${themeClass} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <div className="flex min-h-screen">
          <Sidebar
            projects={projects}
            activeSession={
              activeSession
                ? {
                    id: activeSession.id,
                    description: activeSession.description,
                    startTime: activeSession.startTime.toISOString(),
                    projectName: activeSession.project?.name ?? null,
                  }
                : null
            }
          />
          <main className="min-w-0 flex-1 pl-0 pb-24 lg:pl-60 lg:pb-0">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
              {children}
            </div>
          </main>
        </div>
        <MobileNav />
        <Toaster position="bottom-right" />
        <AssistantLauncher />
        <GlobalAssistant />
        <KeyboardShortcuts shortcuts={shortcuts} />
      </body>
    </html>
  );
}
