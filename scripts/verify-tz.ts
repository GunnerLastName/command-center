// Step-1 verification: date helpers must return identical results regardless
// of the machine timezone (run with TZ=America/Denver, TZ=UTC, TZ=Asia/Tokyo).
import {
  addDaysToKey,
  dateKey,
  dayBounds,
  formatDateKey,
  formatInAppTz,
  isoDayOf,
  isValidDateKey,
  parseDateKey,
  todayBounds,
  weekBounds,
  weekDayKeys,
  zonedDateTime,
} from "../src/lib/dates";

// A fixed instant: 2026-06-11 23:30 in Denver (MDT, UTC-6) = 2026-06-12 05:30 UTC.
// A machine-local implementation would call this June 12 in UTC/Tokyo.
const lateNight = new Date("2026-06-12T05:30:00.000Z");

// DST edge: US spring-forward 2026-03-08. 2026-03-08T01:30 MST = 08:30 UTC.
const dstDay = new Date("2026-03-08T08:30:00.000Z");

const out = {
  tzEnv: process.env.TZ ?? "(unset)",
  lateNightKey: dateKey(lateNight), // expect 2026-06-11
  lateNightDisplay: formatInAppTz(lateNight, "EEE MMM d h:mm a"), // Thu Jun 11 11:30 PM
  dstDayKey: dateKey(dstDay), // 2026-03-08
  dstDayStart: dayBounds(dstDay).start.toISOString(), // 2026-03-08T07:00:00Z (MST midnight)
  dstDayEnd: dayBounds(dstDay).end.toISOString(), // 2026-03-09T05:59:59.999Z (MDT end — 23h day)
  parsed: parseDateKey("2026-06-11").toISOString(), // 2026-06-11T06:00:00Z (MDT midnight)
  weekStart: weekBounds(lateNight).start.toISOString(), // Mon 2026-06-08T06:00:00Z
  weekKeys: weekDayKeys(lateNight).join(","),
  todayStart: todayBounds(lateNight).start.toISOString(),
  keyMath: addDaysToKey("2026-03-01", -1), // 2026-02-28
  isoDayKey: isoDayOf("2026-06-13"), // 6 (Saturday)
  isoDayInstant: isoDayOf(lateNight), // 4 (Thursday in Denver; Friday in UTC/Tokyo)
  zoned: zonedDateTime("2026-06-11", "14:30").toISOString(), // 2026-06-11T20:30:00Z
  validGood: isValidDateKey("2026-02-28"),
  validBad: isValidDateKey("2026-02-31"),
  displayKey: formatDateKey("2026-06-11", "EEEE"), // Thursday
};

console.log(JSON.stringify(out, null, 2));
