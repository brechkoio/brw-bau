-- close_forgotten_shifts() sets a transaction-local bypass flag so its own
-- UPDATE isn't clobbered by enforce_end_time_only_self_update, but never
-- reset it afterwards. Currently harmless (pg_cron invokes this function as
-- its own isolated statement/transaction, so the flag can't leak anywhere),
-- but it's a latent footgun: if this function is ever called as one step
-- inside a larger transaction that also touches work_reports afterward,
-- those later statements would silently run with the lockdown trigger
-- disabled too. Resetting the flag right after use closes that gap.
create or replace function public.close_forgotten_shifts()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  perform set_config('app.bypass_end_time_lock', 'true', true);

  update public.work_reports
  set end_time = time '23:59:59'
  where end_time is null
    and work_date < (now() at time zone 'Europe/Berlin')::date;

  perform set_config('app.bypass_end_time_lock', 'false', true);
end;
$$;
