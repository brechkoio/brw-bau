-- Verifies the enforce_end_time_only_self_update trigger: a non-admin can
-- only ever change end_time on a work_reports row (needed to close their
-- own shift), while an admin (simulated via a JWT claim, since is_admin()
-- reads auth.uid()) can freely edit any column.
begin;
select plan(4);

insert into auth.users (id, email) values
  ('88888888-8888-8888-8888-888888888888', 'worker-d@test.local'),
  ('99999999-9999-9999-9999-999999999999', 'admin-test@test.local');

update public.profiles set first_name = 'Test', last_name = 'Worker'
  where id = '88888888-8888-8888-8888-888888888888';
update public.profiles set first_name = 'Test', last_name = 'Admin', role = 'admin'
  where id = '99999999-9999-9999-9999-999999999999';

insert into public.sites (id, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Site 3'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test Site 4');

insert into public.work_reports (id, user_id, site_id, work_date, start_time, end_time) values
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '88888888-8888-8888-8888-888888888888',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '2026-08-10',
    '08:00:00',
    null
  );

-- No JWT claim set in this raw SQL session, so auth.uid() is NULL and
-- is_admin() is false — this is the "non-admin" branch by default.

select throws_ok(
  $$update public.work_reports set site_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'$$,
  'P0001',
  'Only end_time can be changed when closing your own shift',
  'a non-admin update cannot change site_id'
);

select lives_ok(
  $$update public.work_reports set end_time = '16:00:00' where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'$$,
  'a non-admin CAN close their own shift by setting only end_time'
);

-- end_time itself gets stamped from the server clock (see
-- server_clock_stamping.test.sql), so the sent '16:00:00' is not what
-- lands — only that *some* end_time now took effect.
select isnt(
  (select end_time from public.work_reports where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  null,
  'the end_time change actually took effect'
);

-- Simulate an admin session: is_admin() checks auth.uid() against
-- profiles.role, and auth.uid() reads this exact JWT claim.
select set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999999', true);

select lives_ok(
  $$update public.work_reports set site_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'$$,
  'an admin CAN change any column, bypassing the non-admin restriction'
);

select * from finish();
rollback;
