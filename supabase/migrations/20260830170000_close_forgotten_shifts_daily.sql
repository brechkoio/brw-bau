-- Running every 5 minutes (previous migration) was pointless: the closed
-- end_time is hardcoded to 23:59:59 inside the function itself, so it
-- doesn't matter how many hours late the job actually runs — the stored
-- result is identical either way. Back to once a day.
--
-- 01:00 UTC is a fixed, safe buffer after Berlin's actual midnight in
-- either DST state: Berlin midnight lands at UTC 23:00 (winter, UTC+1) or
-- UTC 22:00 (summer, UTC+2), both on the *previous* UTC calendar day — so
-- 01:00 UTC the next day is always at least an hour past it.
select cron.schedule(
  'close-forgotten-shifts',
  '0 1 * * *',
  $$select public.close_forgotten_shifts()$$
);
