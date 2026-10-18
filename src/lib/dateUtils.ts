/**
 * Timezone-safe date utilities.
 * All service/follow-up dates are stored as "YYYY-MM-DD" strings.
 * Parsing them with `new Date("YYYY-MM-DD")` treats them as UTC midnight,
 * which shifts the day backward in negative-offset timezones. These helpers
 * construct dates in local time so the calendar day is preserved.
 */

/** Parse a "YYYY-MM-DD" string into a local Date at midnight. */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Return today's date as a "YYYY-MM-DD" string in local time. */
export function todayLocalISO(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Return a local Date at midnight for today (no time component). */
export function todayLocalMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function todayLocalStartISOString(): string {
  return todayLocalMidnight().toISOString();
}

export function tomorrowLocalStartISOString(): string {
  const tomorrow = todayLocalMidnight();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString();
}

/** Format a "YYYY-MM-DD" string as a local Date at midnight (alias for clarity). */
export function localDateFromISO(iso: string): Date {
  return parseLocalDate(iso);
}
