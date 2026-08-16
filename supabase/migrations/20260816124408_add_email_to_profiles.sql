-- Client code can't query auth.users directly (it's not exposed via
-- PostgREST), so mirror the email onto profiles for anywhere users are
-- listed (employee picker, future admin tables, etc).

alter table public.profiles add column email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id;

alter table public.profiles alter column email set not null;

-- Keep new signups populated too.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  );
  return new;
end;
$$;

-- email isn't in the self-update column grant: changing it should go
-- through Supabase Auth's own email-change/confirmation flow, not a
-- direct profiles update, so it stays out of sync on purpose otherwise.
