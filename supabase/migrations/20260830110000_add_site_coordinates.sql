-- Base coordinates for a site, set by admins. Used later to verify a
-- worker's clock-in geolocation (work_reports.start_lat/start_lng) against
-- the site they picked; the verification logic itself is a separate change.
alter table public.sites
  add column lat double precision,
  add column lng double precision;

comment on column public.sites.lat is 'Site latitude, set by an admin.';
comment on column public.sites.lng is 'Site longitude, set by an admin.';
