-- Verifies the earnings-calculation chain: work_report_earnings picks the
-- correct employee_rates row for a given work_date, prices `earned`
-- accordingly, and degrades to 0 (not an error) when no rate exists.
begin;
select plan(5);

-- Inserting into auth.users alone already auto-creates a public.profiles
-- row via the on_auth_user_created -> handle_new_user() trigger (which is
-- why email must be set here, and why we UPDATE rather than INSERT below).
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'worker-a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'worker-b@test.local'),
  ('11111111-1111-1111-1111-111111111199', 'admin-earnings-test@test.local');

update public.profiles set first_name = 'Test', last_name = 'WorkerA'
  where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set first_name = 'Test', last_name = 'WorkerB'
  where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set first_name = 'Test', last_name = 'Admin', role = 'admin'
  where id = '11111111-1111-1111-1111-111111111199';

insert into public.sites (id, name) values
  ('33333333-3333-3333-3333-333333333333', 'Test Site');

-- Worker A's rate changes mid-month.
insert into public.employee_rates (user_id, hourly_rate, effective_from) values
  ('11111111-1111-1111-1111-111111111111', 10.00, '2026-01-01'),
  ('11111111-1111-1111-1111-111111111111', 20.00, '2026-08-15');

-- Worker B never gets a rate at all.

-- work_date/start_time get stamped from the server clock on insert (see
-- server_clock_stamping.test.sql), and would collide with a literal
-- end_time '16:00' sent alongside them (server "now" can easily be later
-- than 16:00, tripping the end-after-start check on the insert itself) —
-- so insert as a still-open shift, then as an admin set work_date/
-- start_time/end_time together to the exact historical values this test
-- needs (admins bypass the server-clock override entirely). Each row is
-- closed before the next is inserted for the same worker, since the
-- one-open-shift-per-user index forbids two null end_times at once.
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111199', true);

insert into public.work_reports (id, user_id, site_id, work_date, start_time, end_time) values
  ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', current_date, '08:00', null);
update public.work_reports set work_date = '2026-08-10', start_time = '08:00', end_time = '16:00' where id = 'a1000000-0000-0000-0000-000000000001';

insert into public.work_reports (id, user_id, site_id, work_date, start_time, end_time) values
  ('a1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', current_date, '08:00', null);
update public.work_reports set work_date = '2026-08-20', start_time = '08:00', end_time = '16:00' where id = 'a1000000-0000-0000-0000-000000000002';

insert into public.work_reports (id, user_id, site_id, work_date, start_time, end_time) values
  ('a1000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', current_date, '08:00', null);
update public.work_reports set work_date = '2026-08-10', start_time = '08:00', end_time = '16:00' where id = 'a1000000-0000-0000-0000-000000000003';

select is(
  (select hourly_rate from public.work_report_earnings
    where user_id = '11111111-1111-1111-1111-111111111111' and work_date = '2026-08-10'),
  10.00,
  'uses the rate in effect before a later rate change'
);

select is(
  (select hourly_rate from public.work_report_earnings
    where user_id = '11111111-1111-1111-1111-111111111111' and work_date = '2026-08-20'),
  20.00,
  'switches to the new rate on/after its effective_from date'
);

select is(
  (select earned from public.work_report_earnings
    where user_id = '11111111-1111-1111-1111-111111111111' and work_date = '2026-08-20'),
  160.00,
  'earned = hours * the rate in effect for that day (8h * 20)'
);

select is(
  (select earned from public.work_report_earnings
    where user_id = '22222222-2222-2222-2222-222222222222'),
  0.00,
  'a worker with no rate set at all earns 0, not an error'
);

select is(
  (select hours from public.work_report_earnings
    where user_id = '22222222-2222-2222-2222-222222222222'),
  8.00,
  'hours are still computed correctly even when there is no rate'
);

select * from finish();
rollback;
