-- Both `work_date`/`start_time` (on insert, i.e. "Почати робочий день")
-- and `end_time` (on the self-service "Закінчити робочий день" update)
-- were being taken from the CLIENT's own device clock. If a worker's
-- phone has the wrong timezone/time set, their shift could get filed
-- under the wrong calendar day, or drift out of sync with the server's
-- own Europe/Berlin reference that close_forgotten_shifts() uses for its
-- day boundary. Fixing this at the source: stamp both from the server's
-- own clock instead of trusting whatever the client sent.
--
-- The only INSERT path into work_reports is starting a shift (there is no
-- admin "add a historical entry" flow — that dialog was removed in favour
-- of the clock-in/out flow), so it's safe to unconditionally override
-- work_date/start_time on every insert.
create or replace function public.stamp_shift_start_from_server_clock()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  berlin_now timestamp := now() at time zone 'Europe/Berlin';
begin
  new.work_date := berlin_now::date;
  new.start_time := berlin_now::time;
  return new;
end;
$$;

revoke execute on function public.stamp_shift_start_from_server_clock() from public, anon, authenticated;

create trigger work_reports_stamp_start_from_server
  before insert on public.work_reports
  for each row
  execute function public.stamp_shift_start_from_server_clock();

-- end_time is different: an admin correcting a report needs to set an
-- arbitrary, deliberately-chosen time, so only the non-admin "close my own
-- open shift" path gets the server-clock override — admins keep full
-- control over whatever value they enter.
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

  new.end_time := (now() at time zone 'Europe/Berlin')::time;
  return new;
end;
$$;
