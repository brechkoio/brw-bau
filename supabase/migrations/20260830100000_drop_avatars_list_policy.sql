-- The `avatars` bucket is already public (public = true), so object URLs
-- work without any RLS SELECT policy on storage.objects. This policy's only
-- real effect was letting anyone call the storage `list` endpoint and
-- enumerate every file in the bucket (folder names are user ids) — flagged
-- by the Supabase linter as public_bucket_allows_listing.
drop policy "Avatar images are publicly accessible" on storage.objects;
