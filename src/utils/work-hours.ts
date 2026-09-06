// A worker gets a 30-minute unpaid lunch break deducted once per calendar
// day, but only once their raw worked time that day reaches the threshold
// (matches the common "break required past N hours" labor-law pattern) —
// short days aren't docked.
const LUNCH_BREAK_HOURS = 0.5;
const LUNCH_BREAK_THRESHOLD_HOURS = 6;

export function creditedDayHours(rawHours: number): number {
  return rawHours >= LUNCH_BREAK_THRESHOLD_HOURS
    ? Math.max(0, rawHours - LUNCH_BREAK_HOURS)
    : rawHours;
}

export interface DailyHoursRow {
  work_date: string;
  // Optional: without it, every row is treated as the same person (correct
  // for a single-worker report like "Звіт за місяць"). Reports spanning
  // multiple workers (e.g. admin's "Звіт по об'єктах") MUST pass it, or
  // different people's hours on the same date would get merged into one
  // "day" and only docked a single -30min instead of one each.
  user_id?: string | null;
  hours: number | string | null;
  hourly_rate?: number | string | null;
}

export interface CreditedTotals {
  rawHours: number;
  creditedHours: number;
  creditedEarned: number;
  breakMinutes: number;
}

function groupKey(userId: string | null | undefined, workDate: string): string {
  return `${userId ?? ''}|${workDate}`;
}

// Groups rows by (user, work_date) — a day can have several shift rows,
// even across different workplace addresses — and sums the raw hours/rate
// per group. Both aggregateCreditedHours (period totals) and
// creditedHoursByDay (per-day breakdown, so the report can show *why* a
// given day was or wasn't docked) build on this same grouping so they can
// never disagree with each other.
function groupByDayPerson(rows: DailyHoursRow[]): Map<string, { rawHours: number; rate: number }> {
  const byDayPerson = new Map<string, { rawHours: number; rate: number }>();
  for (const r of rows) {
    const key = groupKey(r.user_id, r.work_date);
    const existing = byDayPerson.get(key);
    if (existing) {
      existing.rawHours += Number(r.hours ?? 0);
    } else {
      byDayPerson.set(key, { rawHours: Number(r.hours ?? 0), rate: Number(r.hourly_rate ?? 0) });
    }
  }
  return byDayPerson;
}

export function aggregateCreditedHours(rows: DailyHoursRow[]): CreditedTotals {
  const totals: CreditedTotals = {
    rawHours: 0,
    creditedHours: 0,
    creditedEarned: 0,
    breakMinutes: 0,
  };
  for (const { rawHours, rate } of groupByDayPerson(rows).values()) {
    const credited = creditedDayHours(rawHours);
    totals.rawHours += rawHours;
    totals.creditedHours += credited;
    totals.creditedEarned += credited * rate;
    totals.breakMinutes += Math.round((rawHours - credited) * 60);
  }
  return totals;
}

export interface DayBreakInfo {
  rawHours: number;
  creditedHours: number;
  breakMinutes: number;
}

// Per-(user, work_date) breakdown so a report can show, for each row, either
// "-30 хв" or an explicit "not deducted" — instead of only a period-wide
// total that leaves the reader guessing which days were actually docked.
// Look up with the same key a row belongs to: `${userId ?? ''}|${workDate}`.
export function creditedHoursByDay(rows: DailyHoursRow[]): Map<string, DayBreakInfo> {
  const result = new Map<string, DayBreakInfo>();
  for (const [key, { rawHours }] of groupByDayPerson(rows)) {
    const credited = creditedDayHours(rawHours);
    result.set(key, {
      rawHours,
      creditedHours: credited,
      breakMinutes: Math.round((rawHours - credited) * 60),
    });
  }
  return result;
}
