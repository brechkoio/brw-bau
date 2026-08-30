-- Support clock-in/clock-out: a shift row can now be inserted with only
-- start_time set (end_time is filled in later when the worker clocks out),
-- plus the GPS coordinates captured at clock-in time.

alter table public.work_reports
  alter column end_time drop not null;

-- Replace the old "end_time > start_time" check (auto-named by Postgres,
-- looked up dynamically since its generated name isn't guaranteed) with one
-- that also allows a still-open shift (end_time is null).
do $$
declare
  c_name text;
begin
  select conname into c_name
  from pg_constraint
  where conrelid = 'public.work_reports'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%end_time%start_time%';

  if c_name is not null then
    execute format('alter table public.work_reports drop constraint %I', c_name);
  end if;
end $$;

alter table public.work_reports
  add constraint work_reports_end_after_start_check
  check (end_time is null or end_time > start_time);

alter table public.work_reports
  add column start_lat double precision,
  add column start_lng double precision;

comment on column public.work_reports.start_lat is
  'Latitude captured from the browser when the worker clocked in, best-effort.';
comment on column public.work_reports.start_lng is
  'Longitude captured from the browser when the worker clocked in, best-effort.';

-- A worker can only have one open (not yet clocked out) shift at a time.
create unique index work_reports_one_open_shift_per_user
  on public.work_reports (user_id)
  where end_time is null;
