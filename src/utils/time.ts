/**
 * Given a base date (with the correct day), set time to 21:00 (9 PM local).
 */
export function defaultStartFromDate(base: Date): Date {
  const d = new Date(base);
  d.setHours(21, 0, 0, 0);
  return d;
}

/**
 * Given a base date (with the correct day), set time to 02:00 (2 AM next day).
 */
export function defaultEndFromDate(base: Date): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + 1);
  d.setHours(2, 0, 0, 0);
  return d;
}

/**
 * Default 21:00–02:00 window using "today" as the base date.
 * Useful as a last-resort fallback when parsing fails completely.
 */
export function defaultDateTimes(): { start: Date; end: Date } {
  const base = new Date();
  return {
    start: defaultStartFromDate(base),
    end: defaultEndFromDate(base),
  };
}

/**
 * Safe date check.
 */
export function isValidDate(d: unknown): d is Date {
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Parse a date (no time) from text like:
 *  - "Sat, 15 Feb 2025"
 *  - "15 Feb 2025"
 *  - "February 15, 2025"
 *  - "2025-02-15"
 */
export function parseDateFromText(text: string): Date | undefined {
  if (!text) return undefined;

  // ISO style: YYYY-MM-DD
  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [_, y, m, d] = isoMatch;
    const year = Number(y);
    const month = Number(m) - 1;
    const day = Number(d);
    const date = new Date(year, month, day);
    if (isValidDate(date)) return date;
  }

  // "15 Feb 2025"
  const dmyMatch = text.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (dmyMatch) {
    const [, dayStr, monthStr, yearStr] = dmyMatch;
    const day = Number(dayStr);
    const year = Number(yearStr);
    const month = monthNameToIndex(monthStr);
    if (month !== -1) {
      const date = new Date(year, month, day);
      if (isValidDate(date)) return date;
    }
  }

  // "Feb 15, 2025" / "February 15, 2025"
  const mdyMatch = text.match(/([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})/);
  if (mdyMatch) {
    const [, monthStr, dayStr, yearStr] = mdyMatch;
    const day = Number(dayStr);
    const year = Number(yearStr);
    const month = monthNameToIndex(monthStr);
    if (month !== -1) {
      const date = new Date(year, month, day);
      if (isValidDate(date)) return date;
    }
  }

  return undefined;
}

/**
 * Parse a time range like:
 *  - "22:00 - 04:00"
 *  - "10:00pm – 3:00am"
 * Returns Date objects using the given base date.
 */
export function parseTimeRangeFromText(
  text: string,
  baseDate: Date
): { start: Date; end: Date } | undefined {
  if (!text) return undefined;

  const rangeMatch = text.match(
    /(\d{1,2}:\d{2})\s*(am|pm)?\s*[-–]\s*(\d{1,2}:\d{2})\s*(am|pm)?/i
  );
  if (!rangeMatch) return undefined;

  const [, startTimeStr, startAmPm, endTimeStr, endAmPm] = rangeMatch;

  const start = applyTimeToDate(baseDate, startTimeStr, startAmPm);
  const end = applyTimeToDate(baseDate, endTimeStr, endAmPm);

  // If end is "earlier" than start, assume it crosses midnight
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  if (!isValidDate(start) || !isValidDate(end)) {
    return undefined;
  }

  return { start, end };
}

/**
 * Convert something like "22:00" + optional "pm" into a Date based on baseDate.
 */
export function applyTimeToDate(
  base: Date,
  timeStr: string,
  ampm?: string
): Date {
  const [hStr, mStr] = timeStr.split(":");
  let hours = Number(hStr);
  const minutes = Number(mStr);

  const result = new Date(base);

  if (ampm) {
    const lower = ampm.toLowerCase();
    if (lower === "pm" && hours < 12) hours += 12;
    if (lower === "am" && hours === 12) hours = 0;
  }

  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Map English month names (short or long) to 0-based index.
 */
export function monthNameToIndex(name: string): number {
  const lower = name.toLowerCase().slice(0, 3); // normalize to 3 letters
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  return months.indexOf(lower);
}
