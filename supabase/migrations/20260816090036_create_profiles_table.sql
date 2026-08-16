-- User roles and profiles

create type public.user_role as enum ('admin', 'user');

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name  text not null,
  role       public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Application-specific user data, extending auth.users 1:1.';

-- Keep updated_at current on every row change
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Auto-create a profile row whenever a new user signs up via Supabase Auth.
-- first_name/last_name are read from the signUp() `options.data` payload.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- RLS is enabled with no policies yet (Stage 4 will add them), so the table
-- is fully locked down to anon/authenticated clients in the meantime.
alter table public.profiles enable row level security;
