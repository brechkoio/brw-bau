-- Lets admins see, per shift, whether it was actually started/ended within
-- a workplace address's radius. Deliberately DB-side (not computed in the
-- Vue report), for the same reason work_report_earnings/credited_hours are
-- DB-side: it must be a single source of truth for every consumer, not a
-- rule re-implemented in each report page that happens to display it.
--
-- Uses PostGIS ST_DWithin rather than a hand-rolled distance formula: it
-- measures over the WGS84 ellipsoid (geography type), not a flat-plane
-- approximation, and is the standard, already-tested tool for exactly this
-- kind of check.
create extension if not exists postgis with schema extensions;

-- Coordinates captured from the browser when the worker clocks OUT,
-- mirroring the existing start_lat/start_lng captured at clock-in.
alter table public.work_reports
  add column end_lat double precision,
  add column end_lng double precision;

comment on column public.work_reports.end_lat is
  'Latitude captured from the browser when the worker clocked out, best-effort.';
comment on column public.work_reports.end_lng is
  'Longitude captured from the browser when the worker clocked out, best-effort.';

-- Null-safe: a missing point (no address coordinates set, or the worker's
-- browser never produced a fix) must read as "unknown", not "out of range".
-- Callers are expected to check for null coordinates themselves and only
-- call this once both points are known to exist.
create or replace function public.within_radius(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision,
  radius_m integer default 100
)
returns boolean
language sql
immutable
as $$
  select extensions.ST_DWithin(
    extensions.ST_MakePoint(lng1, lat1)::extensions.geography,
    extensions.ST_MakePoint(lng2, lat2)::extensions.geography,
    radius_m
  );
$$;

-- Per-shift location status: 'in_range' | 'out_of_range' | 'unknown'.
-- 'unknown' covers both "address has no coordinates set" and "this
-- particular clock-in/out has no coordinates" (permission denied, no GPS
-- fix in time, etc.) - in every such case the shift is still allowed, only
-- flagged, per the explicit requirement that missing coordinates must
-- never block a worker from starting/ending a shift.
create or replace view public.work_report_earnings
with (security_invoker = true)
as
select
  wr.id,
  wr.user_id,
  wr.workplace_address_id,
  wr.work_date,
  wr.start_time,
  wr.end_time,
  wr.hours,
  wr.created_at,
  wr.updated_at,
  s.name as workplace_address_name,
  rate.hourly_rate,
  wr.hours * coalesce(rate.hourly_rate, 0) as earned,
  day_totals.day_raw_hours,
  public.credited_hours(day_totals.day_raw_hours, coalesce(rate.lunch_break_minutes, 30))
    as day_credited_hours,
  round((
    day_totals.day_raw_hours
    - public.credited_hours(day_totals.day_raw_hours, coalesce(rate.lunch_break_minutes, 30))
  ) * 60) as day_break_minutes,
  case
    when s.lat is null or s.lng is null or wr.start_lat is null or wr.start_lng is null then 'unknown'
    when public.within_radius(wr.start_lat, wr.start_lng, s.lat, s.lng) then 'in_range'
    else 'out_of_range'
  end as start_location_status,
  case
    when wr.end_time is null then null
    when s.lat is null or s.lng is null or wr.end_lat is null or wr.end_lng is null then 'unknown'
    when public.within_radius(wr.end_lat, wr.end_lng, s.lat, s.lng) then 'in_range'
    else 'out_of_range'
  end as end_location_status
from public.work_reports wr
join public.workplace_address s on s.id = wr.workplace_address_id
left join lateral (
  select er.hourly_rate, er.lunch_break_minutes
  from public.employee_rates er
  where er.user_id = wr.user_id
    and er.effective_from <= wr.work_date
  order by er.effective_from desc
  limit 1
) rate on true
left join lateral (
  select coalesce(sum(wr2.hours), 0) as day_raw_hours
  from public.work_reports wr2
  where wr2.user_id = wr.user_id
    and wr2.work_date = wr.work_date
) day_totals on true;

grant select on public.work_report_earnings to authenticated;
