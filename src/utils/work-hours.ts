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
  hours: number | string | null;
  hourly_rate?: number | string | null;
}

export interface CreditedTotals {
  rawHours: number;
  creditedHours: number;
  creditedEarned: number;
  breakMinutes: number;
}

// Groups rows by work_date (a day can have several shift rows) and applies
// the lunch-break deduction once per day, then re-derives earnings from the
// credited hours rather than trusting each row's already-computed `earned`.
export function aggregateCreditedHours(rows: DailyHoursRow[]): CreditedTotals {
  const byDate = new Map<string, { rawHours: number; rate: number }>();
  for (const r of rows) {
    const existing = byDate.get(r.work_date);
    if (existing) {
      existing.rawHours += Number(r.hours ?? 0);
    } else {
      byDate.set(r.work_date, { rawHours: Number(r.hours ?? 0), rate: Number(r.hourly_rate ?? 0) });
    }
  }

  const totals: CreditedTotals = {
    rawHours: 0,
    creditedHours: 0,
    creditedEarned: 0,
    breakMinutes: 0,
  };
  for (const { rawHours, rate } of byDate.values()) {
    const credited = creditedDayHours(rawHours);
    totals.rawHours += rawHours;
    totals.creditedHours += credited;
    totals.creditedEarned += credited * rate;
    totals.breakMinutes += Math.round((rawHours - credited) * 60);
  }
  return totals;
}
