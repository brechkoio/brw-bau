-- Include the site name so the frontend doesn't need a second query/join
-- just to render the reports table.

drop view public.work_report_earnings;

create view public.work_report_earnings
with (security_invoker = true)
as
select
  wr.*,
  s.name as site_name,
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
from public.work_reports wr
join public.sites s on s.id = wr.site_id;

grant select on public.work_report_earnings to authenticated;
