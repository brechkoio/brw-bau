-- Admins can already SELECT every work_reports row ("... admins view all"),
-- but there was no admin override for UPDATE/DELETE — only the owning
-- user could edit/delete their own row. That leaves the admin with no way
-- to correct a report that needs attention (e.g. a shift auto-closed by
-- close_forgotten_shifts() at 23:59:59, flagged for review because it's
-- unrealistically long) — the whole point of surfacing it to them.
-- Additive: these sit alongside the existing self-service policies, they
-- don't replace them.
create policy "Admins can edit any report"
  on public.work_reports
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete any report"
  on public.work_reports
  for delete
  to authenticated
  using (public.is_admin());
