-- Verifies the DB-side lunch-break credited-hours calculation that
-- replaced the frontend-only src/utils/work-hours.ts utility:
-- credited_hours(), the day-level columns on work_report_earnings, and
-- the work_report_credited_summary() period-range RPC. The rule itself
-- (>=6h raw -> deduct the employee's configured break, 30 or 60 min) must
-- now be correct no matter who queries the data, not just the report
-- pages that used to import the JS helper.
begin;
select plan(12);

select is(public.credited_hours(4, 30), 4::numeric, 'below the 6h threshold: no deduction');
select is(public.credited_hours(6, 30), 5.5::numeric, 'at the 6h threshold: flat 30 min deducted');
select is(public.credited_hours(6, 60), 5.0::numeric, 'at the 6h threshold with a 60-min break configured');
select is(public.credited_hours(8, 60), 7.0::numeric, 'above the threshold: still a flat deduction, not proportional');
select is(public.credited_hours(0.25, 60), 0.25::numeric, 'below threshold even with a 60-min break configured: no deduction');

insert into auth.users (id, email) values
  ('f1000000-0000-0000-0000-000000000001', 'ch-worker-a@test.local'),
  ('f1000000-0000-0000-0000-000000000002', 'ch-worker-b@test.local'),
  ('f1000000-0000-0000-0000-000000000003', 'ch-worker-norate@test.local'),
  ('f1000000-0000-0000-0000-000000000099', 'ch-admin@test.local');
update public.profiles set first_name = 'Test', last_name = 'WorkerA'
  where id = 'f1000000-0000-0000-0000-000000000001';
update public.profiles set first_name = 'Test', last_name = 'WorkerB'
  where id = 'f1000000-0000-0000-0000-000000000002';
update public.profiles set first_name = 'Test', last_name = 'WorkerNoRate'
  where id = 'f1000000-0000-0000-0000-000000000003';
update public.profiles set first_name = 'Test', last_name = 'Admin', role = 'admin'
  where id = 'f1000000-0000-0000-0000-000000000099';

insert into public.workplace_address (id, name) values
  ('f2000000-0000-0000-0000-000000000001', 'Credited Hours Test Site');

-- Worker A: default 30-min break. Worker B: configured for 60 min.
insert into public.employee_rates (user_id, hourly_rate, effective_from, lunch_break_minutes) values
  ('f1000000-0000-0000-0000-000000000001', 20.00, '2026-01-01', 30),
  ('f1000000-0000-0000-0000-000000000002', 10.00, '2026-01-01', 60);
-- Worker "no rate" intentionally gets no employee_rates row at all.

select set_config('request.jwt.claim.sub', 'f1000000-0000-0000-0000-000000000099', true);

-- Worker A: two shifts the same day, 3h + 4h = 7h raw -> one 30-min break.
insert into public.work_reports (id, user_id, workplace_address_id, work_date, start_time, end_time) values
  ('f3000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000001', current_date, '08:00', null);
update public.work_reports set work_date = '2026-08-10', start_time = '08:00', end_time = '11:00'
  where id = 'f3000000-0000-0000-0000-000000000001';

insert into public.work_reports (id, user_id, workplace_address_id, work_date, start_time, end_time) values
  ('f3000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001', 'f2000000-0000-0000-0000-000000000001', current_date, '13:00', null);
update public.work_reports set work_date = '2026-08-10', start_time = '13:00', end_time = '17:00'
  where id = 'f3000000-0000-0000-0000-000000000002';

-- Worker B: one 8h shift the same day -> a 60-min break.
insert into public.work_reports (id, user_id, workplace_address_id, work_date, start_time, end_time) values
  ('f3000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000002', 'f2000000-0000-0000-0000-000000000001', current_date, '08:00', null);
update public.work_reports set work_date = '2026-08-10', start_time = '08:00', end_time = '16:00'
  where id = 'f3000000-0000-0000-0000-000000000003';

-- Worker with no rate at all: an 8h shift still needs to show up with the
-- default 30-min break, not disappear or error.
insert into public.work_reports (id, user_id, workplace_address_id, work_date, start_time, end_time) values
  ('f3000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000003', 'f2000000-0000-0000-0000-000000000001', current_date, '08:00', null);
update public.work_reports set work_date = '2026-08-10', start_time = '08:00', end_time = '16:00'
  where id = 'f3000000-0000-0000-0000-000000000004';

select is(
  (select day_credited_hours from public.work_report_earnings
    where id = 'f3000000-0000-0000-0000-000000000001'),
  6.5::numeric,
  'worker A''s two same-day shifts (7h raw) are credited as one 6.5h day, repeated on each row'
);

select is(
  (select day_break_minutes from public.work_report_earnings
    where id = 'f3000000-0000-0000-0000-000000000002'),
  30::numeric,
  'worker A''s configured 30-min break is reflected on the day_break_minutes column'
);

select is(
  (select day_credited_hours from public.work_report_earnings
    where id = 'f3000000-0000-0000-0000-000000000003'),
  7.0::numeric,
  'worker B''s 8h shift is credited as 7h using their configured 60-min break'
);

select is(
  (select day_credited_hours from public.work_report_earnings
    where id = 'f3000000-0000-0000-0000-000000000004'),
  7.5::numeric,
  'a worker with zero employee_rates rows still gets the default 30-min break applied, not an error'
);

select is(
  (select earned::numeric from public.work_report_earnings
    where id = 'f3000000-0000-0000-0000-000000000004'),
  0.00::numeric,
  'the same no-rate worker still earns 0 at the row level, unaffected by the break calculation'
);

-- Whole-month summary includes all three test workers: A (7h raw -> 6.5h,
-- 30 min, 20/h -> 130 earned), B (8h raw -> 7h, 60 min, 10/h -> 70 earned),
-- and the no-rate worker (8h raw -> 7.5h, 30 min default, 0 earned).
select results_eq(
  $$select raw_hours, credited_hours, credited_earned, break_minutes, people_count
    from public.work_report_credited_summary('2026-08-01', '2026-08-31', null)$$,
  $$values (23.00::numeric, 21.0::numeric, 200.00::numeric, 120, 3)$$,
  'the period summary sums per-day credited totals across all workers without double-counting worker A''s two same-day shifts'
);

-- Regression guard: an admin's own "my hours this month" view (HomePage,
-- "Звіт за місяць") must pass p_user_id explicitly and get ONLY that
-- person's totals, even though the "admins view all" RLS policy on
-- work_reports would otherwise hand back every worker's rows here.
select results_eq(
  $$select raw_hours, credited_hours, credited_earned, break_minutes, people_count
    from public.work_report_credited_summary(
      '2026-08-01', '2026-08-31', null, 'f1000000-0000-0000-0000-000000000001'
    )$$,
  $$values (7.00::numeric, 6.5::numeric, 130.00::numeric, 30, 1)$$,
  'passing p_user_id restricts the summary to just that worker, even when called as an admin'
);

select * from finish();
rollback;
