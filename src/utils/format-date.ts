export function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

// `date.toISOString().slice(0, 10)` converts to UTC first, which silently
// rolls the date to the day before (or after, west of UTC) whenever local
// time is close enough to midnight that the timezone offset crosses a day
// boundary — e.g. 01:00 in Kyiv (+3) is still 22:00 the previous day in
// UTC. Read the Date object's own local Y/M/D fields instead, which never
// leave the local calendar day.
export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
