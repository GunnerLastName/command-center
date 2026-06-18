import Database from "better-sqlite3";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const db = new Database(dbPath, { readonly: true });
const exportDir = path.join(process.cwd(), "prisma", "export");
mkdirSync(exportDir, { recursive: true });

const tables = [
  "Project",
  "ProjectArea",
  "Task",
  "BrainDumpItem",
  "WorkSession",
  "DailyReview",
  "DailyHabit",
  "HabitCompletion",
  "Settings",
  "WeeklyReview",
];

let totalRows = 0;
for (const table of tables) {
  try {
    const rows = db.prepare(`SELECT * FROM "${table}"`).all();
    writeFileSync(
      path.join(exportDir, `${table}.json`),
      JSON.stringify(rows, null, 2)
    );
    console.log(`✓ ${table}: ${rows.length} rows`);
    totalRows += rows.length;
  } catch (err) {
    console.log(`✗ ${table}: ${(err as Error).message}`);
  }
}

db.close();
console.log(`\nTotal: ${totalRows} rows exported to prisma/export/`);
