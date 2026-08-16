-- auth_rls_initplan advisor: wrap auth.uid() in a subselect so Postgres
-- evaluates it once per query instead of once per row.

drop policy "Users can view their own profile" on public.profiles;

create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);
