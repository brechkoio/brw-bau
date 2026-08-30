type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

export function hoursToParts(decimalHours: number): { hours: number; minutes: number } {
  const totalMinutes = Math.round(Math.max(0, decimalHours) * 60);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

// "162 год 30 хв" (or "162 год" when the minute part is exactly zero) —
// the human-readable form used everywhere a worked-hours duration is shown,
// replacing raw decimals like "1.14" that don't map to a minute count.
export function formatHoursLabel(decimalHours: number, t: TranslateFn): string {
  const { hours, minutes } = hoursToParts(decimalHours);
  return minutes === 0
    ? t('common.hoursOnly', { h: hours })
    : t('common.hoursMinutes', { h: hours, m: minutes });
}

// "3:30" — compact clock-style form for tight spaces (e.g. the weekly
// chart's per-day bar label), matching HomePage's active-shift timer.
export function formatHoursClock(decimalHours: number): string {
  const { hours, minutes } = hoursToParts(decimalHours);
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}
