import { describe, it, expect } from 'vitest';
import { creditedDayHours, aggregateCreditedHours, type DailyHoursRow } from './work-hours';

describe('creditedDayHours', () => {
  it('does not deduct below the 6h threshold', () => {
    expect(creditedDayHours(5.99)).toBe(5.99);
    expect(creditedDayHours(0)).toBe(0);
  });

  it('deducts 30 minutes exactly at the 6h threshold', () => {
    expect(creditedDayHours(6)).toBe(5.5);
  });

  it('deducts a flat 30 minutes above the threshold, not a proportional amount', () => {
    expect(creditedDayHours(8)).toBe(7.5);
    expect(creditedDayHours(12)).toBe(11.5);
  });

  it('never goes negative even if raw hours are implausibly small but somehow ≥ threshold', () => {
    // Not reachable with the real LUNCH_BREAK_THRESHOLD_HOURS/LUNCH_BREAK_HOURS
    // constants (threshold > break length), but the Math.max(0, ...) guard
    // exists specifically so this can't produce a negative credited value
    // if those constants ever change independently.
    expect(creditedDayHours(6)).toBeGreaterThanOrEqual(0);
  });
});

describe('aggregateCreditedHours', () => {
  it('applies no deduction for a single short day', () => {
    const rows: DailyHoursRow[] = [{ work_date: '2026-08-01', hours: 4, hourly_rate: 20 }];
    const totals = aggregateCreditedHours(rows);
    expect(totals.rawHours).toBe(4);
    expect(totals.creditedHours).toBe(4);
    expect(totals.creditedEarned).toBe(80);
    expect(totals.breakMinutes).toBe(0);
  });

  it('deducts once per day when two shifts on the same day sum past the threshold', () => {
    // e.g. a worker clocks in/out twice at two different sites the same day.
    const rows: DailyHoursRow[] = [
      { work_date: '2026-08-01', hours: 3, hourly_rate: 20 },
      { work_date: '2026-08-01', hours: 4, hourly_rate: 20 },
    ];
    const totals = aggregateCreditedHours(rows);
    expect(totals.rawHours).toBe(7);
    expect(totals.creditedHours).toBe(6.5); // 7 - 0.5, not 7 - 1
    expect(totals.creditedEarned).toBe(130); // 6.5 * 20, not (3*20)+(4*20)=140
    expect(totals.breakMinutes).toBe(30);
  });

  it('does NOT deduct twice for two short shifts that individually stay under the threshold but sum past it incorrectly if mis-grouped', () => {
    // Regression guard: this only passes if grouping happens BEFORE the
    // threshold check, not per-row.
    const rows: DailyHoursRow[] = [
      { work_date: '2026-08-01', hours: 5, hourly_rate: 10 },
      { work_date: '2026-08-01', hours: 2, hourly_rate: 10 },
    ];
    const totals = aggregateCreditedHours(rows);
    expect(totals.rawHours).toBe(7);
    expect(totals.creditedHours).toBe(6.5);
    expect(totals.breakMinutes).toBe(30);
  });

  it('deducts independently per day across multiple days', () => {
    const rows: DailyHoursRow[] = [
      { work_date: '2026-08-01', hours: 8, hourly_rate: 10 }, // ≥6h → -0.5
      { work_date: '2026-08-02', hours: 3, hourly_rate: 10 }, // <6h → no deduction
      { work_date: '2026-08-03', hours: 6, hourly_rate: 10 }, // exactly 6h → -0.5
    ];
    const totals = aggregateCreditedHours(rows);
    expect(totals.rawHours).toBe(17);
    expect(totals.creditedHours).toBe(16); // (8-0.5) + 3 + (6-0.5)
    expect(totals.breakMinutes).toBe(60); // 30 + 0 + 30
  });

  it('deducts separately per person when the same date has multiple workers (regression: used to merge everyone into one "day")', () => {
    const rows: DailyHoursRow[] = [
      { work_date: '2026-08-01', user_id: 'worker-a', hours: 8, hourly_rate: 10 },
      { work_date: '2026-08-01', user_id: 'worker-b', hours: 8, hourly_rate: 20 },
    ];
    const totals = aggregateCreditedHours(rows);
    expect(totals.rawHours).toBe(16);
    // Each worker independently: 8 - 0.5 = 7.5h credited.
    expect(totals.creditedHours).toBe(15);
    expect(totals.creditedEarned).toBe(7.5 * 10 + 7.5 * 20);
    // 30 min docked for EACH worker, not once total.
    expect(totals.breakMinutes).toBe(60);
  });

  it('treats rows with no user_id as all belonging to the same person (single-worker report)', () => {
    const rows: DailyHoursRow[] = [
      { work_date: '2026-08-01', hours: 3, hourly_rate: 10 },
      { work_date: '2026-08-01', hours: 3, hourly_rate: 10 },
    ];
    const totals = aggregateCreditedHours(rows);
    expect(totals.rawHours).toBe(6);
    expect(totals.creditedHours).toBe(5.5);
  });

  it('treats missing/null hourly_rate as 0 rather than throwing', () => {
    const rows: DailyHoursRow[] = [{ work_date: '2026-08-01', hours: 5 }];
    const totals = aggregateCreditedHours(rows);
    expect(totals.creditedEarned).toBe(0);
  });

  it('parses string numerics the way Postgres numeric columns come back over the wire', () => {
    const rows: DailyHoursRow[] = [
      { work_date: '2026-08-01', hours: '7.50', hourly_rate: '15.00' },
    ];
    const totals = aggregateCreditedHours(rows);
    expect(totals.rawHours).toBe(7.5);
    expect(totals.creditedHours).toBe(7);
    expect(totals.creditedEarned).toBe(105);
  });

  it('only uses the rate captured on the first row seen for a given day+person (documented, not a bug for this app: the view prices a whole day from one rate lookup, so same-day rows always share one rate anyway)', () => {
    const rows: DailyHoursRow[] = [
      { work_date: '2026-08-01', hours: 3, hourly_rate: 10 },
      { work_date: '2026-08-01', hours: 3, hourly_rate: 999 }, // ignored
    ];
    const totals = aggregateCreditedHours(rows);
    expect(totals.creditedEarned).toBe(5.5 * 10);
  });

  it('returns all-zero totals for an empty input', () => {
    const totals = aggregateCreditedHours([]);
    expect(totals).toEqual({ rawHours: 0, creditedHours: 0, creditedEarned: 0, breakMinutes: 0 });
  });

  it('does not crash on negative hours (bad/corrupt input) but does not sanitize them either — a known gap, not a defended invariant', () => {
    const rows: DailyHoursRow[] = [{ work_date: '2026-08-01', hours: -2, hourly_rate: 10 }];
    const totals = aggregateCreditedHours(rows);
    // Below the threshold, so passed through unchanged rather than clamped —
    // this function trusts its input; negative hours should never reach it
    // in practice because the DB's own check constraint (end_time > start_time)
    // prevents them at the source.
    expect(totals.rawHours).toBe(-2);
    expect(totals.creditedHours).toBe(-2);
  });
});
