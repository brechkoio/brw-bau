-- Bug found while re-verifying the pgTAP suite after the previous
-- migration: close_forgotten_shifts()'s own UPDATE (setting end_time to
-- 23:59:59) fires the enforce_end_time_only_self_update BEFORE UPDATE
-- trigger like any other update to the table. That trigger only skips its
-- server-clock override for admins (is_admin() checks the caller's JWT),
-- but the auto-close job runs with no JWT/session context at all — so the
-- trigger silently clobbered the intended 23:59:59 with "now", defeating
-- the whole forgotten-shift close, and could even violate the
-- end-after-start check constraint when "now" landed on/before start_time.
--
-- Fix: give close_forgotten_shifts() a transaction-local bypass flag the
-- trigger explicitly recognizes, alongside the existing is_admin() bypass.
-- set_config(..., true) is LOCAL to the current transaction, so this can't
-- leak into unrelated statements or sessions.
--
-- Separately: both server-clock stamps used now(), which is frozen to the
-- current transaction's start time, not true wall-clock time. That's
-- indistinguishable from clock_timestamp() for the normal case (each
-- request is its own transaction), but is the wrong primitive for "the
-- actual instant this happened" and can make an insert immediately
-- followed by a close within one transaction produce an identical
-- start_time/end_time (tripping the end-after-start check). Switching to
-- clock_timestamp() is correct regardless of transaction boundaries.
create or replace function public.stamp_shift_start_from_server_clock()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  berlin_now timestamp := clock_timestamp() at time zone 'Europe/Berlin';
begin
  new.work_date := berlin_now::date;
  new.start_time := berlin_now::time;
  return new;
end;
$$;

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
end;
$$;

create or replace function public.enforce_end_time_only_self_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if public.is_admin() or coalesce(current_setting('app.bypass_end_time_lock', true), 'false') = 'true' then
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

  new.end_time := (clock_timestamp() at time zone 'Europe/Berlin')::time;
  return new;
end;
$$;
