-- advisor: multiple_permissive_policies — two separate SELECT policies on
-- profiles ("own row" and "admin sees all") both get evaluated on every
-- query. Merge into one.

drop policy "Users can view their own profile" on public.profiles;
drop policy "Admins can view all profiles" on public.profiles;

create policy "Users can view own profile, admins view all"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id or public.is_admin());
