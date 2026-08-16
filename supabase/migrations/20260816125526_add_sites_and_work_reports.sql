-- Construction sites/objects, managed by admins, picked by users when
-- filing a daily work report.
create table public.sites (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.sites enable row level security;

create policy "Authenticated users can view sites"
  on public.sites
  for select
  to authenticated
  using (true);

create policy "Admins can manage sites"
  on public.sites
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- One row per (date, site) a user worked; multiple rows per day are
-- expected (e.g. two objects in one day).
create table public.work_reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  site_id    uuid not null references public.sites(id),
  work_date  date not null,
  start_time time not null,
  end_time   time not null,
  hours      numeric(5, 2) generated always as (
    round((extract(epoch from (end_time - start_time)) / 3600.0)::numeric, 2)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

comment on table public.work_reports is
  'Daily work log entries a user files themselves; hours is derived from start/end time.';

create index work_reports_user_id_work_date_idx
  on public.work_reports (user_id, work_date);

create trigger work_reports_set_updated_at
  before update on public.work_reports
  for each row
  execute function public.set_updated_at();

alter table public.work_reports enable row level security;

create policy "Users can view their own reports, admins view all"
  on public.work_reports
  for select
  to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());

create policy "Users can file their own reports"
  on public.work_reports
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can edit their own reports"
  on public.work_reports
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own reports"
  on public.work_reports
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Each report's earnings, using the employee_rates row effective on that
-- report's work_date (rates can change mid-month, so a flat "current rate"
-- would misprice older entries). security_invoker so the view is subject
-- to the caller's own RLS on work_reports/employee_rates, not the view
-- owner's.
create view public.work_report_earnings
with (security_invoker = true)
as
select
  wr.*,
  (
    select er.hourly_rate
    from public.employee_rates er
    where er.user_id = wr.user_id
      and er.effective_from <= wr.work_date
    order by er.effective_from desc
    limit 1
  ) as hourly_rate,
  wr.hours * coalesce((
    select er.hourly_rate
    from public.employee_rates er
    where er.user_id = wr.user_id
      and er.effective_from <= wr.work_date
    order by er.effective_from desc
    limit 1
  ), 0) as earned
from public.work_reports wr;

grant select on public.work_report_earnings to authenticated;
