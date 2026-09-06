-- Moves the lunch-break credited-hours calculation from a frontend TS
-- utility (src/utils/work-hours.ts) into the database, so it becomes the
-- single source of truth for ANY consumer (reports, direct SQL, future
-- integrations) instead of only the report pages that happen to import
-- that file. See the "работає — і добре" discussion: patching the symptom
-- (three inconsistent numbers in reports) with a frontend-only fix left
-- the real gap in place — the rule belongs in the layer that owns the data.
--
-- New requirement folded in at the same time: the break duration is no
-- longer a hardcoded 30 minutes for everyone — each employee_rates row can
-- specify 30 or 60 minutes, defaulting to 30. The 6-hour THRESHOLD that
-- triggers the deduction stays global/fixed; only the deducted AMOUNT is
-- per-employee. It lives on employee_rates (not a separate table) so it
-- automatically inherits the same effective_from history as the hourly
-- rate — no separate versioning mechanism needed.

alter table public.employee_rates
  add column lunch_break_minutes integer not null default 30
  check (lunch_break_minutes in (30, 60));

comment on column public.employee_rates.lunch_break_minutes is
  'Minutes deducted once per calendar day once raw hours reach the 6h threshold. Only 30 or 60 are valid.';

-- The one place the deduction RULE lives. immutable: pure function of its
-- inputs, safe to use in generated/window expressions.
create or replace function public.credited_hours(raw_hours numeric, break_minutes integer default 30)
returns numeric
language sql
immutable
as $$
  select case
    when raw_hours >= 6 then greatest(raw_hours - (break_minutes / 60.0), 0)
    else raw_hours
  end;
$$;

-- Extends work_report_earnings with day-level columns (repeated on every
-- shift row of that day, same as the existing hourly_rate/earned columns
-- are already repeated for a day with several shifts) so a report can show
-- *why* a given day was or wasn't docked, without recomputing anything
-- itself. Existing columns/order are untouched — only new trailing columns
-- are added — so this stays a plain CREATE OR REPLACE, no drop needed.
--
-- LEFT JOIN LATERAL (not a plain window function) is used for both the
-- rate lookup and the day total so a worker with zero employee_rates rows
-- still gets a row back (hourly_rate/lunch_break_minutes default via
-- coalesce) instead of silently disappearing from the view — matching the
-- existing "no rate set -> still shown, earns 0" behavior exactly.
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
  ) * 60) as day_break_minutes
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

-- Period-range totals (what a report's summary bar needs) computed
-- entirely server-side: de-duplicates the repeated per-day values (a day
-- with 2 shifts must count once, not twice) and sums across the range.
-- security invoker (not definer) so it's subject to the caller's own RLS
-- on work_reports/employee_rates via work_report_earnings, same as every
-- other query in this app — a non-admin only ever sees their own totals.
--
-- p_user_id matters for a reason that isn't obvious from RLS alone: the
-- "view your own reports, admins view all" policy means an ADMIN's SELECT
-- returns every worker's rows, not just their own. HomePage/MonthlyReportPage
-- need "my personal totals" regardless of the caller's role, so they pass
-- p_user_id = auth.uid() explicitly; the admin-facing workplace-address
-- reports leave it null to get whatever RLS naturally allows (all workers).
create or replace function public.work_report_credited_summary(
  p_from date,
  p_to date,
  p_workplace_address_id uuid default null,
  p_user_id uuid default null
)
returns table (
  raw_hours numeric,
  credited_hours numeric,
  credited_earned numeric,
  break_minutes integer,
  people_count integer
)
language sql
security invoker
stable
as $$
  with rows_in_range as (
    select *
    from public.work_report_earnings
    where work_date between p_from and p_to
      and (p_workplace_address_id is null or workplace_address_id = p_workplace_address_id)
      and (p_user_id is null or user_id = p_user_id)
  ),
  daily as (
    select distinct on (user_id, work_date)
      user_id, work_date, day_raw_hours, day_credited_hours, hourly_rate
    from rows_in_range
    order by user_id, work_date
  )
  select
    coalesce(sum(day_raw_hours), 0),
    coalesce(sum(day_credited_hours), 0),
    coalesce(sum(day_credited_hours * coalesce(hourly_rate, 0)), 0),
    coalesce(sum(round((day_raw_hours - day_credited_hours) * 60)), 0)::int,
    count(distinct user_id)::int
  from daily;
$$;

revoke all on function public.work_report_credited_summary(date, date, uuid, uuid) from public;
grant execute on function public.work_report_credited_summary(date, date, uuid, uuid) to authenticated;
