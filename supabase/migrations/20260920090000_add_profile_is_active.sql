-- Admins can deactivate a user. The actual lockout happens in Supabase
-- Auth itself (banned_until, set via the service-role key from the
-- set-user-active edge function) so a deactivated user is rejected at
-- sign-in with the standard `user_banned` error, and can never obtain a
-- session to read their own reports or rate. is_active just mirrors that
-- ban status into a column the client can read, so the users table can
-- display/sort/toggle it without needing admin.auth access.

alter table public.profiles add column is_active boolean not null default true;
