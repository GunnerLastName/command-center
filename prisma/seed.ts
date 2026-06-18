// Seeds default settings, projects, project areas, and daily habits.
// Idempotent: skips anything that already exists, so it's safe to re-run.
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const file = url.replace(/^file:/, "");
const absolutePath = path.isAbsolute(file)
  ? file
  : path.join(process.cwd(), file);

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: absolutePath }),
});

const seedProjects: Array<{
  name: string;
  category: string;
  status: string;
  areas: string[];
}> = [
  {
    name: "Octagon Outreach",
    category: "Agency",
    status: "active",
    areas: [
      "MMA Gym Offer",
      "Cold Outreach",
      "Sales Scripts",
      "Website",
      "Client Fulfillment",
      "GoHighLevel Systems",
      "Content Ideas",
      "Lead Generation",
      "Case Studies",
      "Pricing",
    ],
  },
  {
    name: "Glass Haven",
    category: "Client",
    status: "active",
    areas: [
      "Facebook Ads",
      "GoHighLevel Automations",
      "Google Business Profile",
      "Review Requests",
      "SEO Pages",
      "Website",
      "Lead Follow-Up",
      "Client Reporting",
    ],
  },
  {
    name: "Pane Perfect",
    category: "Client",
    status: "active",
    areas: [
      "Launch Checklist",
      "Facebook Ads",
      "Website",
      "Local SEO",
      "Lead Follow-Up",
      "Google Business Profile",
      "Offers",
      "Reviews",
    ],
  },
  {
    name: "TikTok Content",
    category: "Content",
    status: "active",
    areas: ["Hooks", "Scripts", "Filming", "Editing", "Posting", "Ideas"],
  },
  { name: "Personal", category: "Personal", status: "active", areas: [] },
  { name: "Future Ideas", category: "Ideas", status: "idea", areas: [] },
];

const seedHabits = [
  { name: "Read Bible", category: "Faith", points: 1, sortOrder: 0 },
  { name: "Pray", category: "Faith", points: 1, sortOrder: 1 },
  { name: "Daily Review", category: "Execution", points: 1, sortOrder: 2 },
];

async function main() {
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  for (const p of seedProjects) {
    const existing = await prisma.project.findFirst({
      where: { name: p.name },
    });
    if (existing) continue;
    await prisma.project.create({
      data: {
        name: p.name,
        category: p.category,
        status: p.status,
        areas: {
          create: p.areas.map((name, i) => ({ name, sortOrder: i })),
        },
      },
    });
  }

  for (const h of seedHabits) {
    const existing = await prisma.dailyHabit.findFirst({
      where: { name: h.name },
    });
    if (existing) continue;
    await prisma.dailyHabit.create({ data: h });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
