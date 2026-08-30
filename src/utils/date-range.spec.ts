import { describe, it, expect, vi, afterEach } from 'vitest';
import { currentMonthRange } from './date-range';

describe('currentMonthRange', () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTz;
    vi.useRealTimers();
  });

  it('spans the 1st to the last day of the current month', () => {
    process.env.TZ = 'Europe/Berlin';
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 15, 12, 0, 0)); // Aug 15, 2026, midday local
    expect(currentMonthRange()).toEqual({ from: '2026-08-01', to: '2026-08-31' });
  });

  it('gets February right in a leap year', () => {
    process.env.TZ = 'Europe/Berlin';
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2028, 1, 10)); // 2028 is a leap year
    expect(currentMonthRange()).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  // Regression coverage for the exact bug the user reported: the calendar
  // showed "31.07.2026 – 30.08.2026" instead of "01.08.2026 – 31.08.2026"
  // because the old implementation converted through UTC.
  it('does not roll the range back a day for a timezone ahead of UTC, right at local midnight', () => {
    process.env.TZ = 'Europe/Kyiv'; // UTC+3
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 1, 0, 5, 0)); // just after local midnight, Aug 1
    expect(currentMonthRange()).toEqual({ from: '2026-08-01', to: '2026-08-31' });
  });
});
