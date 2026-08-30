-- Verifies work_date/start_time/end_time are always stamped from the
-- SERVER's own clock (Europe/Berlin), ignoring whatever a client sends —
-- this is what makes shift times immune to a worker's device having the
-- wrong timezone/clock set.
begin;
select plan(5);

insert into auth.users (id, email) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'worker-f@test.local');
update public.profiles set first_name = 'Test', last_name = 'WorkerF'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
insert into public.sites (id, name) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Test Site 5');

-- Deliberately send an obviously-wrong work_date/start_time (as if the
-- worker's phone clock were broken) — the trigger should override both.
insert into public.work_reports (id, user_id, site_id, work_date, start_time, end_time) values (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '2000-01-01',
  '03:00:00',
  null
);

select is(
  (select work_date from public.work_reports where id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  (now() at time zone 'Europe/Berlin')::date,
  'work_date on insert is stamped from the server clock, not the client-sent value'
);

select ok(
  (select abs(extract(epoch from (
    start_time - (now() at time zone 'Europe/Berlin')::time
  ))) from public.work_reports where id = 'ffffffff-ffff-ffff-ffff-ffffffffffff') < 5,
  'start_time on insert is stamped from the server clock (within a few seconds), not the client-sent value'
);

-- Now close it as the worker, deliberately sending a wrong end_time too.
update public.work_reports set end_time = '09:00:00'
  where id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

select ok(
  (select abs(extract(epoch from (
    end_time - (now() at time zone 'Europe/Berlin')::time
  ))) from public.work_reports where id = 'ffffffff-ffff-ffff-ffff-ffffffffffff') < 5,
  'end_time on the self-service close is stamped from the server clock too'
);

select isnt(
  (select end_time from public.work_reports where id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  '09:00:00'::time,
  'the client-sent end_time value was discarded, not stored verbatim'
);

-- An admin correcting a report still needs full control over the exact
-- time they enter — this path must NOT be forced to "now".
insert into auth.users (id, email) values
  ('11223344-1122-3344-1122-334411223344', 'admin-clock-test@test.local');
update public.profiles set first_name = 'Test', last_name = 'Admin', role = 'admin'
  where id = '11223344-1122-3344-1122-334411223344';
select set_config('request.jwt.claim.sub', '11223344-1122-3344-1122-334411223344', true);

update public.work_reports set work_date = '2026-08-01', start_time = '07:00:00', end_time = '15:00:00'
  where id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

select is(
  (select row(work_date, start_time, end_time)::text from public.work_reports
    where id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  (select row('2026-08-01'::date, '07:00:00'::time, '15:00:00'::time)::text),
  'an admin correction is stored exactly as entered, not overridden by the server clock'
);

select * from finish();
rollback;
