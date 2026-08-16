-- Minimal policy so a logged-in user can read their own profile (needed for
-- the login/register UI to show a name). The full RLS policy set (admin
-- visibility, updates, etc.) is designed separately in Stage 4.

create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);
