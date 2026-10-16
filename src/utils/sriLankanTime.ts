/**
 * Sri Lanka Standard Time (SLST) Utilities for Frontend
 * Sri Lanka is permanently in UTC+05:30 (Asia/Colombo timezone).
 */

export const SRI_LANKA_TIMEZONE = 'Asia/Colombo';
export const SRI_LANKA_OFFSET_MINUTES = 330;

/**
 * Format a date into a Sri Lankan human-readable string (e.g. "2026-09-26 09:30 AM (SLST)")
 */
export function formatSriLankanTime(date: Date | string | number | undefined | null): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: SRI_LANKA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${formatter.format(d)} (SLST)`;
}

/**
 * Format start and end date into a Sri Lankan time period string (e.g. "Sep 26, 2026 • 11:00 PM - 12:00 AM (SLST)")
 */
export function formatSriLankanTimePeriod(
  start: Date | string | number | undefined | null,
  end: Date | string | number | undefined | null
): string {
  if (!start) return 'N/A';
  const s = new Date(start);
  if (isNaN(s.getTime())) return 'Invalid Date';

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: SRI_LANKA_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: SRI_LANKA_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const startTimeStr = timeFormatter.format(s);
  const startDateStr = dateFormatter.format(s);

  if (!end) {
    return `${startDateStr} • ${startTimeStr} (SLST)`;
  }

  const e = new Date(end);
  if (isNaN(e.getTime())) {
    return `${startDateStr} • ${startTimeStr} (SLST)`;
  }

  const endTimeStr = timeFormatter.format(e);
  const endDateStr = dateFormatter.format(e);

  if (startDateStr === endDateStr) {
    return `${startDateStr} • ${startTimeStr} - ${endTimeStr} (SLST)`;
  }
  return `${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr} (SLST)`;
}

/**
 * Format only the clock time in Sri Lankan time (e.g. "12:00 AM (SLST)" or "11:30 PM")
 */
export function formatSriLankanClockTime(date: Date | string | number | undefined | null, includeZone: boolean = true): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: SRI_LANKA_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const formatted = timeFormatter.format(d);
  return includeZone ? `${formatted} (SLST)` : formatted;
}


/**
 * Format a Date object to HTML datetime-local input string format "YYYY-MM-DDTHH:mm" in Sri Lankan time
 */
export function toSriLankanInputString(date: Date | string | number = new Date()): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SRI_LANKA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  let hour = getPart('hour');
  if (hour === '24') hour = '00';
  const minute = getPart('minute');

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Parses an HTML datetime-local value (e.g. "2026-09-26T09:30") interpreted strictly in Sri Lankan time (UTC+05:30)
 * into a UTC Date object.
 */
export function fromSriLankanInputString(inputStr: string): Date {
  if (!inputStr) return new Date();

  if (inputStr.includes('Z') || inputStr.includes('+')) {
    return new Date(inputStr);
  }

  const match = inputStr.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!match) {
    return new Date(inputStr);
  }

  const [, y, m, d, h, min] = match.map(Number);
  const utcMs = Date.UTC(y, m - 1, d, h, min);
  return new Date(utcMs - SRI_LANKA_OFFSET_MINUTES * 60 * 1000);
}
