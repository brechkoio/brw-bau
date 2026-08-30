-- Business runs out of Germany, not Ukraine — the "end of day" the
-- previous migration pinned to Kyiv (fixed UTC+3, no DST) was wrong.
-- Germany observes DST (CET/UTC+1 in winter, CEST/UTC+2 in summer), so a
-- single fixed UTC cron time would drift an hour off twice a year.
--
-- Instead of guessing a UTC offset, compare against Europe/Berlin's actual
-- calendar date (Postgres resolves this correctly year-round via the IANA
-- tz database, DST included) and run frequently enough that the lag after
-- Berlin midnight is negligible — the stored end_time is still exactly
-- 23:59:59 of the correct day regardless of the few minutes' delay in when
-- the job happens to catch it.
create or replace function public.close_forgotten_shifts()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.work_reports
  set end_time = time '23:59:59'
  where end_time is null
    and work_date < (now() at time zone 'Europe/Berlin')::date;
end;
$$;

select cron.schedule(
  'close-forgotten-shifts',
  '*/5 * * * *',
  $$select public.close_forgotten_shifts()$$
);
