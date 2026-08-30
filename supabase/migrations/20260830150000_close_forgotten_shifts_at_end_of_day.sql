-- Replaces the "12h from start" cap with a simpler, stricter policy: every
-- shift still open at the end of its own calendar day gets closed at
-- 23:59:59, full stop — no partial-hours guesswork, no wraparound case to
-- reason about anymore.
create or replace function public.close_forgotten_shifts()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.work_reports
  set end_time = time '23:59:59'
  where end_time is null
    and work_date <= current_date;
end;
$$;

-- Runs daily at 23:59 *Kyiv* time. pg_cron's schedule is evaluated in UTC
-- and Ukraine has stayed on fixed UTC+3 (no DST) since 2022, so that's
-- 20:59 UTC — if that policy ever changes, this offset needs updating.
-- `cron.schedule` with an existing job name updates it in place rather
-- than creating a duplicate.
select cron.schedule(
  'close-forgotten-shifts',
  '59 20 * * *',
  $$select public.close_forgotten_shifts()$$
);
