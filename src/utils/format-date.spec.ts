import { describe, it, expect, afterEach } from 'vitest';
import { formatDisplayDate, toLocalIsoDate } from './format-date';

describe('formatDisplayDate', () => {
  it('converts YYYY-MM-DD to DD.MM.YYYY', () => {
    expect(formatDisplayDate('2026-08-01')).toBe('01.08.2026');
  });
});

describe('toLocalIsoDate', () => {
  // Regression coverage for a real bug found and fixed this session:
  // `date.toISOString().slice(0, 10)` converts through UTC first, which
  // silently rolls the date back a day for any timezone ahead of UTC
  // whenever local time is close enough to midnight — e.g. 00:30 in Kyiv
  // (+3) is still 21:30 the *previous* day in UTC. That bug affected the
  // default month-range calendar and, more seriously, `work_date` when
  // starting a shift, which could misfile a late-night/early-morning clock-in
  // under the wrong calendar day.
  const originalTz = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it('does not roll back a day for a timezone ahead of UTC (the actual bug scenario)', () => {
    process.env.TZ = 'Europe/Kyiv'; // UTC+3, no DST since 2022
    // Local midnight on the 1st — in UTC this is still 21:00 on the 31st.
    const localMidnight = new Date(2026, 7, 1, 0, 0, 0);
    expect(toLocalIsoDate(localMidnight)).toBe('2026-08-01');
    // The buggy version would have produced '2026-07-31' here.
    expect(localMidnight.toISOString().slice(0, 10)).toBe('2026-07-31');
  });

  it('does not roll forward a day for a timezone behind UTC', () => {
    process.env.TZ = 'America/Los_Angeles'; // UTC-7/-8
    // Local 23:30 on the 1st — in UTC this has already rolled to the 2nd.
    const lateLocalNight = new Date(2026, 7, 1, 23, 30, 0);
    expect(toLocalIsoDate(lateLocalNight)).toBe('2026-08-01');
  });

  it('pads single-digit months and days', () => {
    process.env.TZ = 'UTC';
    expect(toLocalIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
