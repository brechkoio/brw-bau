-- Let users edit their own name/avatar, and add storage for avatar images.

alter table public.profiles add column avatar_url text;

-- Self-update policy, but only for the columns a user should be able to
-- touch themselves. Column-level grants (not the RLS policy) are what stop
-- someone from PATCHing their own `role` to 'admin'.
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke update on public.profiles from authenticated;
grant update (first_name, last_name, avatar_url) on public.profiles to authenticated;

-- Public bucket: avatars aren't sensitive, and this keeps rendering them
-- (in the sidebar, admin lists, etc.) simple with plain public URLs.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (select auth.uid()::text) = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid()::text) = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid()::text) = (storage.foldername(name))[1]
  );
