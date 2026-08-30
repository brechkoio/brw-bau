-- Verifies close_forgotten_shifts(): a shift left open from a previous
-- (Berlin-calendar) day gets force-closed at exactly 23:59:59, while a
-- shift still open from *today* is left alone. Dates are computed off the
-- same 'Europe/Berlin' reference the function itself uses, not off
-- current_date, so this can't go flaky depending on what time (UTC vs
-- Berlin) the test happens to run.
begin;
select plan(4);

-- Two different workers: the unique partial index
-- work_reports_one_open_shift_per_user forbids two open shifts for the
-- SAME person, so "forgotten yesterday" and "genuinely open today" have to
-- be different people here.
insert into auth.users (id, email) values
  ('44444444-4444-4444-4444-444444444444', 'worker-c@test.local'),
  ('44444444-4444-4444-4444-444444444445', 'worker-e@test.local'),
  ('44444444-4444-4444-4444-444444444499', 'admin-close-test@test.local');
update public.profiles set first_name = 'Test', last_name = 'Worker'
  where id = '44444444-4444-4444-4444-444444444444';
update public.profiles set first_name = 'Test', last_name = 'WorkerToday'
  where id = '44444444-4444-4444-4444-444444444445';
update public.profiles set first_name = 'Test', last_name = 'Admin', role = 'admin'
  where id = '44444444-4444-4444-4444-444444444499';
insert into public.sites (id, name) values
  ('55555555-5555-5555-5555-555555555555', 'Test Site 2');

-- work_date/start_time get stamped from the server clock on insert — as
-- an admin, backdate the "forgotten" row to yesterday afterwards.
insert into public.work_reports (id, user_id, site_id, work_date, start_time, end_time) values
  (
    '66666666-6666-6666-6666-666666666666',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    current_date,
    '20:00:00',
    null
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    '44444444-4444-4444-4444-444444444445',
    '55555555-5555-5555-5555-555555555555',
    current_date,
    '08:00:00',
    null
  );

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444499', true);
update public.work_reports
  set work_date = (now() at time zone 'Europe/Berlin')::date - 1
  where id = '66666666-6666-6666-6666-666666666666';
-- The "today" row is left exactly as the insert trigger stamped it.
select set_config('request.jwt.claim.sub', '', true);

select public.close_forgotten_shifts();

select is(
  (select end_time::text from public.work_reports where id = '66666666-6666-6666-6666-666666666666'),
  '23:59:59',
  'a shift left open from a previous day is closed at exactly 23:59:59'
);

select isnt(
  (select hours from public.work_reports where id = '66666666-6666-6666-6666-666666666666'),
  null,
  'the generated hours column computes once end_time is set (not stuck NULL)'
);

select is(
  (select end_time from public.work_reports where id = '77777777-7777-7777-7777-777777777777'),
  null,
  'a shift still open from TODAY is left untouched'
);

select is(
  (select count(*)::int from public.work_reports where end_time is null),
  1,
  'exactly one open shift remains after cleanup (today''s)'
);

select * from finish();
rollback;
