-- A worker who forgets to tap "Закінчити робочий день" leaves their shift
-- open (end_time is null) indefinitely — which also blocks their next
-- clock-in, since only one open shift per user is allowed
-- (work_reports_one_open_shift_per_user). Auto-close anything still open
-- from a previous calendar day, crediting a fixed 12h from start_time.
--
-- end_time/start_time are `time` (no date component) and the table's own
-- check constraint requires end_time > start_time on the same day — there
-- are no legitimate shifts crossing midnight (confirmed business rule), so
-- if start_time + 12h would wrap past midnight, cap at 23:59:59 instead
-- (`time + interval` wraps around silently in Postgres, so the wraparound
-- has to be detected explicitly — a naive `least()` after adding the
-- interval would pick the wrapped, smaller value and violate the check
-- constraint).
create or replace function public.close_forgotten_shifts()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.work_reports
  set end_time = case
    when (start_time + interval '12 hours')::time < start_time
      then time '23:59:59'
    else (start_time + interval '12 hours')::time
  end
  where end_time is null
    and work_date < current_date;
end;
$$;

revoke execute on function public.close_forgotten_shifts() from public, anon, authenticated;

create extension if not exists pg_cron with schema extensions;

-- Runs once daily, shortly after UTC midnight. Kyiv is UTC+3, so a Kyiv
-- work_date always turns "yesterday" before the UTC date does — comparing
-- against the UTC current_date here can only close a forgotten shift a few
-- hours later than Kyiv's own midnight, never earlier/prematurely, so this
-- doesn't need the session pinned to a specific timezone.
select cron.schedule(
  'close-forgotten-shifts',
  '5 0 * * *',
  $$select public.close_forgotten_shifts()$$
);
