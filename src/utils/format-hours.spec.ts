import { describe, it, expect } from 'vitest';
import { hoursToParts, formatHoursLabel, formatHoursClock } from './format-hours';

describe('hoursToParts', () => {
  it('splits a clean decimal into whole hours and minutes', () => {
    expect(hoursToParts(10.5)).toEqual({ hours: 10, minutes: 30 });
  });

  it('rounds to the nearest minute instead of truncating', () => {
    // 1.14h * 60 = 68.4min -> rounds to 68 -> 1h 8m
    expect(hoursToParts(1.14)).toEqual({ hours: 1, minutes: 8 });
    // 0.77h * 60 = 46.2min -> rounds to 46 -> the exact value from the
    // original bug report ("що це за 0.77?").
    expect(hoursToParts(0.77)).toEqual({ hours: 0, minutes: 46 });
  });

  it('handles a whole number of hours with zero minutes', () => {
    expect(hoursToParts(3)).toEqual({ hours: 3, minutes: 0 });
  });

  it('handles zero', () => {
    expect(hoursToParts(0)).toEqual({ hours: 0, minutes: 0 });
  });

  it('clamps negative input to zero rather than producing a negative duration', () => {
    expect(hoursToParts(-5)).toEqual({ hours: 0, minutes: 0 });
  });

  it('carries a minute rounding that reaches 60 over into the next hour', () => {
    // 1.999h * 60 = 119.94min -> rounds to 120min -> 2h 0m, not 1h 60m.
    expect(hoursToParts(1.999)).toEqual({ hours: 2, minutes: 0 });
  });
});

describe('formatHoursLabel', () => {
  const t = (key: string, params?: Record<string, unknown>) => {
    const h = Number(params?.h);
    const m = Number(params?.m);
    return key === 'common.hoursOnly' ? `${h}h` : `${h}h ${m}m`;
  };

  it('omits the minutes phrase when there are none', () => {
    expect(formatHoursLabel(3, t)).toBe('3h');
  });

  it('includes both parts when there are minutes', () => {
    expect(formatHoursLabel(1.14, t)).toBe('1h 8m');
  });
});

describe('formatHoursClock', () => {
  it('formats as H:MM with a zero-padded minute part', () => {
    expect(formatHoursClock(3.5)).toBe('3:30');
    expect(formatHoursClock(0.75)).toBe('0:45');
  });
});
