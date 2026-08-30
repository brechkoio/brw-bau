-- Workers can no longer freely edit or delete their own reports —
-- corrections now go strictly through an admin (who already has full
-- edit/delete access via "Admins can edit/delete any report"). The only
-- thing a worker can still do to an existing row is close their own
-- currently-open shift (set end_time once), which "Закінчити робочий
-- день" depends on — everything else (site, date, start_time, or editing
-- an already-closed row) is off-limits.

drop policy "Users can edit their own reports" on public.work_reports;
drop policy "Users can delete their own reports" on public.work_reports;

-- Column-level grant, same technique already used on profiles: RLS alone
-- can't restrict *which columns* an UPDATE touches, only which *rows* it
-- can see — so cut the blanket UPDATE grant back to just end_time.
revoke update on public.work_reports from authenticated;
grant update (end_time) on public.work_reports to authenticated;

create policy "Users can end their own open shift"
  on public.work_reports
  for update
  to authenticated
  using ((select auth.uid()) = user_id and end_time is null)
  with check ((select auth.uid()) = user_id);
