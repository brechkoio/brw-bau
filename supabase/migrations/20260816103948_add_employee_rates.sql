-- Helper used by admin-only RLS policies. Runs as invoker (not security
-- definer): it only needs to read the calling user's own profiles row,
-- which the existing self-select policy already allows.
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Admins need to see every profile to populate an employee picker.
create policy "Admins can view all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

create table public.employee_rates (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  hourly_rate    numeric(10, 2) not null check (hourly_rate > 0),
  effective_from date not null,
  created_at     timestamptz not null default now(),
  unique (user_id, effective_from)
);

comment on table public.employee_rates is
  'History of hourly rates per employee; the rate applicable to a given date is the most recent row with effective_from <= that date.';

create index employee_rates_user_id_effective_from_idx
  on public.employee_rates (user_id, effective_from desc);

alter table public.employee_rates enable row level security;

create policy "Users can view their own rates"
  on public.employee_rates
  for select
  to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());

create policy "Admins can set employee rates"
  on public.employee_rates
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update employee rates"
  on public.employee_rates
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
