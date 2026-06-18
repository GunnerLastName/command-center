import {
  addDays,
  endOfDay,
  endOfWeek,
  format,
  getISODay,
  parse,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

// Every date in the app is interpreted in this zone — keys, day/week bounds,
// parsing, AND display. Never use machine-local date math outside this file:
// the dev box happens to be in Denver time, but a deploy target won't be.
export const APP_TIMEZONE = "America/Denver";

export const DATE_KEY_FORMAT = "yyyy-MM-dd";

/** The Denver calendar date of an instant, as a "yyyy-MM-dd" key. */
export function dateKey(date: Date = new Date()): string {
  return formatInTimeZone(date, APP_TIMEZONE, DATE_KEY_FORMAT);
}

/** The UTC instant of Denver midnight for a "yyyy-MM-dd" key. */
export function parseDateKey(key: string): Date {
  return fromZonedTime(`${key}T00:00:00`, APP_TIMEZONE);
}

/** True for a well-formed, calendar-valid "yyyy-MM-dd" key (rejects 02-31). */
export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const parsed = parse(key, DATE_KEY_FORMAT, new Date());
  return !Number.isNaN(parsed.getTime()) && format(parsed, DATE_KEY_FORMAT) === key;
}

/** Format any instant as Denver wall-clock time. */
export function formatInAppTz(date: Date, fmt: string): string {
  return formatInTimeZone(date, APP_TIMEZONE, fmt);
}

/** Format a "yyyy-MM-dd" key for display (always renders that calendar day). */
export function formatDateKey(key: string, fmt: string): string {
  return formatInTimeZone(parseDateKey(key), APP_TIMEZONE, fmt);
}

/** The instant of a Denver wall-clock date + time ("HH:mm"). */
export function zonedDateTime(key: string, time: string): Date {
  return fromZonedTime(`${key}T${time}:00`, APP_TIMEZONE);
}

/** Pure calendar arithmetic on date keys (no timezone involved). */
export function addDaysToKey(key: string, days: number): string {
  const d = parse(key, DATE_KEY_FORMAT, new Date());
  return format(addDays(d, days), DATE_KEY_FORMAT);
}

/** ISO weekday (1=Mon … 7=Sun) of a date key or of an instant in Denver. */
export function isoDayOf(value: string | Date): number {
  if (typeof value === "string") {
    return getISODay(parse(value, DATE_KEY_FORMAT, new Date()));
  }
  return Number(formatInTimeZone(value, APP_TIMEZONE, "i"));
}

/** Start/end instants of the Denver calendar day containing `date`. */
export function dayBounds(date: Date) {
  const zoned = toZonedTime(date, APP_TIMEZONE);
  return {
    start: fromZonedTime(startOfDay(zoned), APP_TIMEZONE),
    end: fromZonedTime(endOfDay(zoned), APP_TIMEZONE),
  };
}

export function todayBounds(now: Date = new Date()) {
  return dayBounds(now);
}

/** Start/end instants of the Denver Mon–Sun week containing `now`. */
export function weekBounds(now: Date = new Date()) {
  const zoned = toZonedTime(now, APP_TIMEZONE);
  return {
    start: fromZonedTime(startOfWeek(zoned, { weekStartsOn: 1 }), APP_TIMEZONE),
    end: fromZonedTime(endOfWeek(zoned, { weekStartsOn: 1 }), APP_TIMEZONE),
  };
}

/** The 7 date keys (Mon→Sun) of the Denver week containing `now`. */
export function weekDayKeys(now: Date = new Date()): string[] {
  const zoned = toZonedTime(now, APP_TIMEZONE);
  const monday = startOfWeek(zoned, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(monday, i), DATE_KEY_FORMAT)
  );
}

/**
 * The "operational" app date. Before rolloverHour (Denver local time), the app
 * still considers it the previous calendar day — so late-night work stays on
 * the correct day.
 *
 * Example with rolloverHour=2:
 *   Tuesday 1:30 AM Denver → returns Monday's date key.
 *   Tuesday 2:00 AM Denver → returns Tuesday's date key.
 */
export function appDateKey(now: Date = new Date(), rolloverHour = 2): string {
  const hourInDenver = Number(formatInTimeZone(now, APP_TIMEZONE, "H"));
  return hourInDenver < rolloverHour
    ? addDaysToKey(dateKey(now), -1)
    : dateKey(now);
}

/**
 * UTC start/end of the operational day.
 * Day runs from rolloverHour:00 Denver on the app-date through
 * rolloverHour:00 Denver on the next calendar date.
 */
export function appTodayBounds(now: Date = new Date(), rolloverHour = 2) {
  const key = appDateKey(now, rolloverHour);
  const pad = String(rolloverHour).padStart(2, "0");
  return {
    start: fromZonedTime(`${key}T${pad}:00:00`, APP_TIMEZONE),
    end: fromZonedTime(`${addDaysToKey(key, 1)}T${pad}:00:00`, APP_TIMEZONE),
  };
}

export function formatMinutes(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatHours(totalMinutes: number): string {
  return (Math.max(0, totalMinutes) / 60).toFixed(1);
}
