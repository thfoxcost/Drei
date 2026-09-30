import { formatRelative, formatShortDate } from "#/i18n/lib/format"

// Parses the API's date format, which sometimes duplicates the UTC offset
// e.g. "2026-07-23 11:25:29 -0700 -0700". We only need the first offset.
function parseApiDate(raw: string): Date | null {
  const trimmed = raw.trim();

  // Match: YYYY-MM-DD HH:MM:SS ±HHMM  (ignore anything after the first offset)
  const match = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})\s*([+-]\d{4})/
  );

  if (!match) {
    const fallback = new Date(trimmed);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  const [, datePart, timePart, offset] = match;
  const offsetWithColon = `${offset.slice(0, 3)}:${offset.slice(3)}`;
  const iso = `${datePart}T${timePart}${offsetWithColon}`;
  const parsed = new Date(iso);

  return isNaN(parsed.getTime()) ? null : parsed;
}

const UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: 60 * 60 * 24 * 365 },
  { unit: "month", seconds: 60 * 60 * 24 * 30 },
  { unit: "week", seconds: 60 * 60 * 24 * 7 },
  { unit: "day", seconds: 60 * 60 * 24 },
  { unit: "hour", seconds: 60 * 60 },
  { unit: "minute", seconds: 60 },
  { unit: "second", seconds: 1 },
];

/**
 * Returns a relative-time string in the active locale, e.g. "3 years ago" or
 * "vor 3 Jahren". Falls back to the raw input string if it can't be parsed.
 */
export function timeAgo(raw: string, now: Date = new Date()): string {
  const date = parseApiDate(raw);
  if (!date) return raw;

  const diffSeconds = (date.getTime() - now.getTime()) / 1000;
  const absSeconds = Math.abs(diffSeconds);

  for (const { unit, seconds } of UNITS) {
    if (absSeconds >= seconds || unit === "second") {
      const value = Math.round(diffSeconds / seconds);
      return formatRelative(value, unit);
    }
  }

  return formatRelative(0, "second");
}

/**
 * Returns an absolute, readable date in the active locale (e.g. "Jul 23, 2026"
 * / "23.07.2026") — useful for a tooltip alongside the relative label.
 */
export function absoluteDate(raw: string): string {
  const date = parseApiDate(raw);
  if (!date) return raw;

  return formatShortDate(date);
}
