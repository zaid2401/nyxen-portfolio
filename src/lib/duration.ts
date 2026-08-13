/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PERIOD PARSING AND DURATION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * You give a start and an end; everything displayed is computed from them.
 * There is no separate "current" flag to forget to update — writing
 * `end: "present"` is what makes a role current, and the duration keeps
 * counting on its own from then on.
 *
 * Accepted formats, so you can write dates the way you think about them:
 *
 *     "2024-07"     "2024/07"     "Jul 2024"     "July 2024"     "2024"
 *     "present"     "current"     "now"          "ongoing"
 *
 * Durations are inclusive of both end months, which is the convention people
 * (and LinkedIn) use: July 2024 → July 2026 reads as 2 yr 1 mo, not 2 yr.
 */

const PRESENT_WORDS = new Set([
  "present",
  "current",
  "now",
  "ongoing",
  "today",
]);

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export interface ParsedPeriod {
  year: number;
  /** 0-indexed. Defaults to January when only a year was given. */
  month: number;
  /** False when the input was a bare year — so we render "2024", not "Jan 2024". */
  hasMonth: boolean;
  /** True when the input meant "still going". */
  present: boolean;
}

export function isPresent(value: string): boolean {
  return PRESENT_WORDS.has(value.trim().toLowerCase());
}

/** Returns null for anything unparseable, so callers can fall back to raw text. */
export function parsePeriod(
  value: string,
  now: Date = new Date(),
): ParsedPeriod | null {
  const raw = value.trim();
  if (raw.length === 0) return null;

  if (isPresent(raw)) {
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth(),
      hasMonth: true,
      present: true,
    };
  }

  // "2024-07", "2024/7", "2024"
  const numeric = /^(\d{4})(?:[-/\s](\d{1,2}))?$/.exec(raw);
  if (numeric) {
    const year = Number(numeric[1]);
    if (!numeric[2]) return { year, month: 0, hasMonth: false, present: false };
    const month = Number(numeric[2]) - 1;
    if (month < 0 || month > 11) return null;
    return { year, month, hasMonth: true, present: false };
  }

  // "Jul 2024", "July 2024"
  const named = /^([A-Za-z]{3,9})[\s-]+(\d{4})$/.exec(raw);
  if (named) {
    const needle = named[1].toLowerCase();
    const month = MONTH_NAMES.findIndex((name) => name.startsWith(needle));
    if (month === -1) return null;
    return { year: Number(named[2]), month, hasMonth: true, present: false };
  }

  return null;
}

function formatPoint(period: ParsedPeriod): string {
  if (period.present) return "Present";
  if (!period.hasMonth) return String(period.year);
  return `${SHORT_MONTHS[period.month]} ${period.year}`;
}

/** "Jul 2024 — Present". Falls back to the raw strings if either won't parse. */
export function formatPeriodRange(
  start: string,
  end: string,
  now: Date = new Date(),
): string {
  const from = parsePeriod(start, now);
  const to = parsePeriod(end, now);
  if (!from || !to) return `${start} — ${end}`;
  return `${formatPoint(from)} — ${formatPoint(to)}`;
}

/** Whole months covered, inclusive of both ends. Zero if the range is invalid. */
export function periodMonths(
  start: string,
  end: string,
  now: Date = new Date(),
): number {
  const from = parsePeriod(start, now);
  const to = parsePeriod(end, now);
  if (!from || !to) return 0;

  const months = to.year * 12 + to.month - (from.year * 12 + from.month) + 1;
  return Math.max(months, 0);
}

/** 25 → "2 yr 1 mo". Compact by design; this sits in a mono chip. */
export function formatDuration(months: number): string {
  if (months <= 0) return "";
  if (months < 12) return `${months} mo`;

  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest === 0 ? `${years} yr` : `${years} yr ${rest} mo`;
}

/** Convenience: the duration of one role, already formatted. */
export function roleDuration(
  start: string,
  end: string,
  now: Date = new Date(),
): string {
  return formatDuration(periodMonths(start, end, now));
}

/**
 * Total professional experience across every role, with overlapping periods
 * counted once — two concurrent jobs are not four years of experience.
 */
export function totalExperienceMonths(
  roles: { start: string; end: string }[],
  now: Date = new Date(),
): number {
  const spans: [number, number][] = [];

  for (const role of roles) {
    const from = parsePeriod(role.start, now);
    const to = parsePeriod(role.end, now);
    if (!from || !to) continue;
    const a = from.year * 12 + from.month;
    const b = to.year * 12 + to.month;
    if (b < a) continue;
    spans.push([a, b]);
  }

  if (spans.length === 0) return 0;
  spans.sort((x, y) => x[0] - y[0]);

  const merged: [number, number][] = [spans[0]];
  for (const [a, b] of spans.slice(1)) {
    const last = merged[merged.length - 1];
    // `a <= last[1] + 1` also joins back-to-back roles with no gap.
    if (a <= last[1] + 1) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  }

  return merged.reduce((total, [a, b]) => total + (b - a + 1), 0);
}

/** Headline figure for the About panel: "2+ years", "3 years", "8 months". */
export function formatTotalExperience(
  roles: { start: string; end: string }[],
  now: Date = new Date(),
): string {
  const months = totalExperienceMonths(roles, now);
  if (months <= 0) return "Not available";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;

  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (rest === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years}+ years`;
}
