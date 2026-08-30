-- Fixes a mistake in the previous migration: column-level GRANTs apply to
-- the Postgres role, and admin vs. regular user are the SAME role
-- (`authenticated`) here — admin-ness is a data check via is_admin(), not
-- a distinct role. Restricting the UPDATE grant to just `end_time` blocked
-- EVERYONE, including admins, from updating any other column — silently
-- breaking "Admins can edit any report" (site/date/start_time edits in
-- GeneralReportPage/MonthlyReportPage) even though its RLS policy allowed
-- it, because the underlying column privilege didn't.
--
-- Restore the blanket UPDATE grant, and enforce "only end_time may change"
-- for non-admins with a trigger instead — it can compare OLD vs NEW
-- column-by-column, which RLS's USING/WITH CHECK cannot do on its own.
revoke update on public.work_reports from authenticated;
grant update on public.work_reports to authenticated;

create or replace function public.enforce_end_time_only_self_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
     or new.site_id is distinct from old.site_id
     or new.work_date is distinct from old.work_date
     or new.start_time is distinct from old.start_time
     or new.start_lat is distinct from old.start_lat
     or new.start_lng is distinct from old.start_lng
  then
    raise exception 'Only end_time can be changed when closing your own shift';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_end_time_only_self_update() from public, anon, authenticated;

create trigger work_reports_enforce_end_time_only
  before update on public.work_reports
  for each row
  execute function public.enforce_end_time_only_self_update();
