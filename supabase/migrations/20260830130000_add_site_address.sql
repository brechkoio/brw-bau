-- Structured address fields for sites (city / street / house number),
-- alongside the free-text `name`. Nullable at the DB level so existing
-- rows aren't broken by a NOT NULL backfill — required-ness for new/edited
-- sites is enforced in the admin form instead.

alter table public.sites
  add column city text,
  add column street text,
  add column house_number text;

comment on column public.sites.city is 'Site address: city.';
comment on column public.sites.street is 'Site address: street.';
comment on column public.sites.house_number is 'Site address: house/building number.';
