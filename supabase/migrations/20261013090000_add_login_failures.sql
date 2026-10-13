-- Failed sign-in attempts, so an admin can see who couldn't get in, when,
-- and why. Supabase's own auth logs don't cover this: they're kept for
-- about a day, don't carry the email of a rejected password attempt, and
-- can't see failures that never reached the server at all (no network on
-- the worker's phone). The client queues every failure locally and sends
-- it through the log-login-failure edge function once it can, so
-- occurred_at is the client's time of the attempt, created_at is when the
-- record finally arrived.
--
-- Rows are only ever written by that edge function under the service-role
-- key, so there's no insert policy: neither anon nor authenticated can
-- write here directly.

create table public.login_failures (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  occurred_at timestamptz not null,
  -- null for a Google attempt that failed before an account was chosen
  email text,
  method text not null check (method in ('password', 'google')),
  error_code text,
  error_status integer,
  error_message text not null,
  was_online boolean,
  ip text,
  user_agent text
);

create index login_failures_occurred_at_idx on public.login_failures (occurred_at desc);

alter table public.login_failures enable row level security;

create policy "Admins can view login failures"
  on public.login_failures
  for select
  to authenticated
  using (public.is_admin());
