/**
 * Date and timezone utilities for CarCopilot (strictly centered on Colombia Time: UTC-5)
 */

/**
 * Returns a Date object representing the current moment in Colombia's local time (UTC-5),
 * but mapping the Colombia hour, day, month, and year directly to UTC methods (getUTC*).
 * This prevents any local timezone leaks from the device itself.
 */
export function getColombiaNow(): Date {
  // Date.now() is timezone-independent milliseconds since epoch.
  // Colombia is always UTC-5 (no daylight saving time).
  const colombiaOffsetMs = -5 * 60 * 60 * 1000;
  return new Date(Date.now() + colombiaOffsetMs);
}

/**
 * Returns the current date in Colombia formatted as "YYYY-MM-DD"
 */
export function getColombiaDateString(): string {
  const date = getColombiaNow();
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns the current year in Colombia as a number
 */
export function getColombiaYear(): number {
  return getColombiaNow().getUTCFullYear();
}

/**
 * Returns the date from 30 days ago in Colombia formatted as "YYYY-MM-DD"
 */
export function getColombia30DaysAgoString(): string {
  const date = getColombiaNow();
  // Subtract 30 days in milliseconds
  date.setTime(date.getTime() - 30 * 24 * 60 * 60 * 1000);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Adds a specified number of years to a "YYYY-MM-DD" date string, returning "YYYY-MM-DD".
 * This operation is completely timezone-agnostic.
 */
export function addYearsToDateString(dateStr: string, years: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Create a Date using UTC components to avoid timezone offsets shifting the day
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCFullYear(date.getUTCFullYear() + years);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Formats a "YYYY-MM-DD" date string into "Month Name de YYYY" (e.g. "Junio de 2026")
 * in Spanish, completely timezone-independently.
 */
export function formatMonthYear(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length < 2) return "";
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  const monthName = monthNames[monthIdx] || "";
  return `${monthName} de ${year}`;
}

/**
 * Formats a month number (1-12) to Spanish short month name (e.g. "jun")
 */
export function getShortMonthName(monthStrOrNum: string | number): string {
  const monthIdx = typeof monthStrOrNum === "string" ? parseInt(monthStrOrNum, 10) - 1 : monthStrOrNum - 1;
  const shortMonths = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic"
  ];
  return shortMonths[monthIdx] || "";
}
