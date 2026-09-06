-- Rename the "sites" concept to "workplace_address" throughout the schema:
-- table, primary key/unique constraint, RLS policy names, column comments,
-- the FK column on work_reports, its constraint, the work_report_earnings
-- view's output columns, and the trigger function body that reads that
-- column. Postgres tracks views/FKs by object OID, not by name, so renaming
-- the table/columns doesn't break the view or the FK relationship itself —
-- but the view's own OUTPUT column names and any PL/pgSQL function body
-- referencing NEW/OLD.site_id are literal text and must be updated by hand.

alter table public.sites rename to workplace_address;

alter table public.workplace_address
  rename constraint sites_pkey to workplace_address_pkey;
alter table public.workplace_address
  rename constraint sites_name_key to workplace_address_name_key;

alter policy "Authenticated users can view sites"
  on public.workplace_address
  rename to "Authenticated users can view workplace addresses";
alter policy "Admins can add sites"
  on public.workplace_address
  rename to "Admins can add workplace addresses";
alter policy "Admins can update sites"
  on public.workplace_address
  rename to "Admins can update workplace addresses";
alter policy "Admins can delete sites"
  on public.workplace_address
  rename to "Admins can delete workplace addresses";

comment on column public.workplace_address.lat is 'Workplace address latitude, set by an admin.';
comment on column public.workplace_address.lng is 'Workplace address longitude, set by an admin.';
comment on column public.workplace_address.city is 'Workplace address: city.';
comment on column public.workplace_address.street is 'Workplace address: street.';
comment on column public.workplace_address.house_number is 'Workplace address: house/building number.';

alter table public.work_reports rename column site_id to workplace_address_id;
alter table public.work_reports
  rename constraint work_reports_site_id_fkey to work_reports_workplace_address_id_fkey;

alter view public.work_report_earnings rename column site_id to workplace_address_id;
alter view public.work_report_earnings rename column site_name to workplace_address_name;

create or replace function public.enforce_end_time_only_self_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if public.is_admin() or coalesce(current_setting('app.bypass_end_time_lock', true), 'false') = 'true' then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
     or new.workplace_address_id is distinct from old.workplace_address_id
     or new.work_date is distinct from old.work_date
     or new.start_time is distinct from old.start_time
     or new.start_lat is distinct from old.start_lat
     or new.start_lng is distinct from old.start_lng
  then
    raise exception 'Only end_time can be changed when closing your own shift';
  end if;

  new.end_time := (clock_timestamp() at time zone 'Europe/Berlin')::time;
  return new;
end;
$$;
