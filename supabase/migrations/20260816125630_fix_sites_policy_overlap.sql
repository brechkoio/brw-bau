-- advisor: multiple_permissive_policies — "for all" on the admin policy
-- overlapped with the SELECT policy that's already open to everyone.
-- Split into insert/update/delete only.

drop policy "Admins can manage sites" on public.sites;

create policy "Admins can add sites"
  on public.sites
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update sites"
  on public.sites
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete sites"
  on public.sites
  for delete
  to authenticated
  using (public.is_admin());
