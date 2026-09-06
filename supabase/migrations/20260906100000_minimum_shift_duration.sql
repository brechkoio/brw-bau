-- A shift shorter than 15 minutes couldn't have produced meaningful work
-- (e.g. an accidental clock-in immediately corrected), so it shouldn't
-- count toward pay or toward the day total used for the lunch-break
-- threshold. Global, not per-employee (unlike lunch_break_minutes) --
-- there's no plausible reason two employees would need a different
-- minimum here.
--
-- wr.hours (the raw shift duration) is deliberately left untouched on the
-- row -- it's the audit trail of what actually happened -- only earned and
-- the day-level aggregates used for pay are zeroed out for a too-short
-- shift. Same "flag, don't silently discard" principle as the long-shift
-- warning already shown in the general report, applied at the other end.
create or replace function public.is_shift_too_short(shift_hours numeric)
returns boolean
language sql
immutable
as $$
  select shift_hours < (15.0 / 60);
$$;

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
  (case when public.is_shift_too_short(wr.hours) then 0 else wr.hours end)
    * coalesce(rate.hourly_rate, 0) as earned,
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
  end as end_location_status,
  public.is_shift_too_short(wr.hours) as is_too_short
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
  select coalesce(sum(
    case when public.is_shift_too_short(wr2.hours) then 0 else wr2.hours end
  ), 0) as day_raw_hours
  from public.work_reports wr2
  where wr2.user_id = wr.user_id
    and wr2.work_date = wr.work_date
) day_totals on true;

grant select on public.work_report_earnings to authenticated;
