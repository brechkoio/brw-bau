-- Verifies the geolocation "was this shift started/ended within the
-- workplace address's radius" check: within_radius() (PostGIS ST_DWithin
-- wrapper) and the start_location_status/end_location_status columns on
-- work_report_earnings. The rule: missing coordinates (address has none,
-- or the browser never produced a fix) must read as 'unknown', never
-- block the shift and never be reported as 'out_of_range'.
begin;
select plan(9);

-- Kyiv city-hall-ish point, used as the workplace address's own coordinates.
-- ~44m north is well inside a 100m radius; ~1.1km north is well outside it.
select ok(
  public.within_radius(50.4501, 30.5234, 50.4501, 30.5234, 100),
  'the exact same point is within radius'
);
select ok(
  public.within_radius(50.4505, 30.5234, 50.4501, 30.5234, 100),
  'a point ~44m away is within a 100m radius'
);
select ok(
  not public.within_radius(50.4601, 30.5234, 50.4501, 30.5234, 100),
  'a point ~1.1km away is outside a 100m radius'
);

insert into auth.users (id, email) values
  ('f4000000-0000-0000-0000-000000000001', 'loc-worker-inrange@test.local'),
  ('f4000000-0000-0000-0000-000000000002', 'loc-worker-outrange@test.local'),
  ('f4000000-0000-0000-0000-000000000003', 'loc-worker-nocoords@test.local'),
  ('f4000000-0000-0000-0000-000000000004', 'loc-worker-noaddresscoords@test.local'),
  ('f4000000-0000-0000-0000-000000000005', 'loc-worker-open@test.local'),
  ('f4000000-0000-0000-0000-000000000099', 'loc-admin@test.local');
update public.profiles set first_name = 'Test', last_name = 'InRange'
  where id = 'f4000000-0000-0000-0000-000000000001';
update public.profiles set first_name = 'Test', last_name = 'OutOfRange'
  where id = 'f4000000-0000-0000-0000-000000000002';
update public.profiles set first_name = 'Test', last_name = 'NoCoords'
  where id = 'f4000000-0000-0000-0000-000000000003';
update public.profiles set first_name = 'Test', last_name = 'NoAddressCoords'
  where id = 'f4000000-0000-0000-0000-000000000004';
update public.profiles set first_name = 'Test', last_name = 'OpenShift'
  where id = 'f4000000-0000-0000-0000-000000000005';
update public.profiles set first_name = 'Test', last_name = 'Admin', role = 'admin'
  where id = 'f4000000-0000-0000-0000-000000000099';

insert into public.workplace_address (id, name, lat, lng) values
  ('f5000000-0000-0000-0000-000000000001', 'Location Test Site', 50.4501, 30.5234);
insert into public.workplace_address (id, name, lat, lng) values
  ('f5000000-0000-0000-0000-000000000002', 'Location Test Site No Coords', null, null);

select set_config('request.jwt.claim.sub', 'f4000000-0000-0000-0000-000000000099', true);

-- Worker in range: starts and ends ~44m from the address.
insert into public.work_reports (id, user_id, workplace_address_id, work_date, start_time, end_time) values
  ('f6000000-0000-0000-0000-000000000001', 'f4000000-0000-0000-0000-000000000001', 'f5000000-0000-0000-0000-000000000001', current_date, '08:00', null);
update public.work_reports
  set work_date = '2026-08-10', start_time = '08:00', end_time = '12:00',
      start_lat = 50.4505, start_lng = 30.5234, end_lat = 50.4505, end_lng = 30.5234
  where id = 'f6000000-0000-0000-0000-000000000001';

-- Worker out of range: starts and ends ~1.1km from the address.
insert into public.work_reports (id, user_id, workplace_address_id, work_date, start_time, end_time) values
  ('f6000000-0000-0000-0000-000000000002', 'f4000000-0000-0000-0000-000000000002', 'f5000000-0000-0000-0000-000000000001', current_date, '08:00', null);
update public.work_reports
  set work_date = '2026-08-10', start_time = '08:00', end_time = '12:00',
      start_lat = 50.4601, start_lng = 30.5234, end_lat = 50.4601, end_lng = 30.5234
  where id = 'f6000000-0000-0000-0000-000000000002';

-- Worker with no coordinates captured at all (permission denied / no GPS fix).
insert into public.work_reports (id, user_id, workplace_address_id, work_date, start_time, end_time) values
  ('f6000000-0000-0000-0000-000000000003', 'f4000000-0000-0000-0000-000000000003', 'f5000000-0000-0000-0000-000000000001', current_date, '08:00', null);
update public.work_reports
  set work_date = '2026-08-10', start_time = '08:00', end_time = '12:00',
      start_lat = null, start_lng = null, end_lat = null, end_lng = null
  where id = 'f6000000-0000-0000-0000-000000000003';

-- Worker whose own coordinates are fine, but the address itself has none set.
insert into public.work_reports (id, user_id, workplace_address_id, work_date, start_time, end_time) values
  ('f6000000-0000-0000-0000-000000000004', 'f4000000-0000-0000-0000-000000000004', 'f5000000-0000-0000-0000-000000000002', current_date, '08:00', null);
update public.work_reports
  set work_date = '2026-08-10', start_time = '08:00', end_time = '12:00',
      start_lat = 50.4501, start_lng = 30.5234, end_lat = 50.4501, end_lng = 30.5234
  where id = 'f6000000-0000-0000-0000-000000000004';

-- Worker still clocked in: end_time stays null, so end_location_status must
-- be null too (not 'unknown' — the shift simply hasn't ended yet).
insert into public.work_reports (id, user_id, workplace_address_id, work_date, start_time, end_time) values
  ('f6000000-0000-0000-0000-000000000005', 'f4000000-0000-0000-0000-000000000005', 'f5000000-0000-0000-0000-000000000001', current_date, '08:00', null);
update public.work_reports
  set work_date = '2026-08-10', start_time = '08:00',
      start_lat = 50.4505, start_lng = 30.5234
  where id = 'f6000000-0000-0000-0000-000000000005';

select is(
  (select start_location_status from public.work_report_earnings where id = 'f6000000-0000-0000-0000-000000000001'),
  'in_range',
  'worker within ~44m of the address is flagged in_range'
);
select is(
  (select end_location_status from public.work_report_earnings where id = 'f6000000-0000-0000-0000-000000000001'),
  'in_range',
  'same worker''s clock-out point is also flagged in_range'
);
select is(
  (select start_location_status from public.work_report_earnings where id = 'f6000000-0000-0000-0000-000000000002'),
  'out_of_range',
  'worker ~1.1km from the address is flagged out_of_range'
);
select is(
  (select start_location_status from public.work_report_earnings where id = 'f6000000-0000-0000-0000-000000000003'),
  'unknown',
  'a shift with no captured coordinates is unknown, never blocked and never out_of_range'
);
select is(
  (select start_location_status from public.work_report_earnings where id = 'f6000000-0000-0000-0000-000000000004'),
  'unknown',
  'an address with no coordinates set makes the status unknown regardless of the worker''s own coordinates'
);
select is(
  (select end_location_status from public.work_report_earnings where id = 'f6000000-0000-0000-0000-000000000005'),
  null,
  'a still-open shift has a null end_location_status, distinct from unknown'
);

select * from finish();
rollback;
