-- Verifies the minimum-shift-duration rule: a shift under 15 minutes
-- (e.g. an accidental clock-in immediately corrected) doesn't count toward
-- pay, and doesn't inflate the day total used for the lunch-break
-- threshold — but the raw wr.hours duration stays visible for audit.
begin;
select plan(10);

select ok(public.is_shift_too_short(0.24), '14.4 minutes is below the 15-minute minimum');
select ok(not public.is_shift_too_short(0.25), 'exactly 15 minutes is NOT too short');
select ok(not public.is_shift_too_short(1.0), 'a full hour is well above the minimum');

insert into auth.users (id, email) values
  ('f8000000-0000-0000-0000-000000000001', 'msd-worker-onlyshort@test.local'),
  ('f8000000-0000-0000-0000-000000000002', 'msd-worker-mixed@test.local'),
  ('f8000000-0000-0000-0000-000000000099', 'msd-admin@test.local');
update public.profiles set first_name = 'Test', last_name = 'OnlyShort'
  where id = 'f8000000-0000-0000-0000-000000000001';
update public.profiles set first_name = 'Test', last_name = 'Mixed'
  where id = 'f8000000-0000-0000-0000-000000000002';
update public.profiles set first_name = 'Test', last_name = 'Admin', role = 'admin'
  where id = 'f8000000-0000-0000-0000-000000000099';

insert into public.workplace_address (id, name) values
  ('f9000000-0000-0000-0000-000000000001', 'Minimum Shift Test Site');

insert into public.employee_rates (user_id, hourly_rate, effective_from, lunch_break_minutes) values
  ('f8000000-0000-0000-0000-000000000001', 20.00, '2026-01-01', 30),
  ('f8000000-0000-0000-0000-000000000002', 20.00, '2026-01-01', 30);

select set_config('request.jwt.claim.sub', 'f8000000-0000-0000-0000-000000000099', true);

-- Worker with a single 10-minute shift and nothing else that day.
insert into public.work_reports (id, user_id, workplace_address_id, work_date, start_time, end_time) values
  ('fa000000-0000-0000-0000-000000000001', 'f8000000-0000-0000-0000-000000000001', 'f9000000-0000-0000-0000-000000000001', current_date, '08:00', null);
update public.work_reports set work_date = '2026-08-11', start_time = '08:00', end_time = '08:10'
  where id = 'fa000000-0000-0000-0000-000000000001';

-- Worker with an accidental 10-minute shift PLUS a real 7h shift the same day.
insert into public.work_reports (id, user_id, workplace_address_id, work_date, start_time, end_time) values
  ('fa000000-0000-0000-0000-000000000002', 'f8000000-0000-0000-0000-000000000002', 'f9000000-0000-0000-0000-000000000001', current_date, '07:00', null);
update public.work_reports set work_date = '2026-08-11', start_time = '07:00', end_time = '07:10'
  where id = 'fa000000-0000-0000-0000-000000000002';

insert into public.work_reports (id, user_id, workplace_address_id, work_date, start_time, end_time) values
  ('fa000000-0000-0000-0000-000000000003', 'f8000000-0000-0000-0000-000000000002', 'f9000000-0000-0000-0000-000000000001', current_date, '09:00', null);
update public.work_reports set work_date = '2026-08-11', start_time = '09:00', end_time = '16:00'
  where id = 'fa000000-0000-0000-0000-000000000003';

select is(
  (select is_too_short from public.work_report_earnings where id = 'fa000000-0000-0000-0000-000000000001'),
  true,
  'a lone 10-minute shift is flagged is_too_short'
);
select is(
  (select earned::numeric from public.work_report_earnings where id = 'fa000000-0000-0000-0000-000000000001'),
  0.00::numeric,
  'a too-short shift earns nothing even though it has a rate'
);
select is(
  (select day_credited_hours from public.work_report_earnings where id = 'fa000000-0000-0000-0000-000000000001'),
  0.00::numeric,
  'a day made up entirely of a too-short shift credits zero hours'
);

select is(
  (select is_too_short from public.work_report_earnings where id = 'fa000000-0000-0000-0000-000000000002'),
  true,
  'the accidental 10-minute shift is flagged even though the same day has a real shift too'
);
select is(
  (select earned::numeric from public.work_report_earnings where id = 'fa000000-0000-0000-0000-000000000002'),
  0.00::numeric,
  'the accidental shift itself earns nothing'
);
select is(
  (select is_too_short from public.work_report_earnings where id = 'fa000000-0000-0000-0000-000000000003'),
  false,
  'the real 7h shift on the same day is not flagged'
);
select is(
  (select day_credited_hours from public.work_report_earnings where id = 'fa000000-0000-0000-0000-000000000003'),
  6.5::numeric,
  'the day total used for the lunch-break threshold excludes the too-short stray shift (7h, not 7h10m)'
);

select * from finish();
rollback;
