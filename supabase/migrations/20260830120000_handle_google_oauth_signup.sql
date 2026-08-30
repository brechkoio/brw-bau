-- Google OAuth signups don't carry `first_name`/`last_name` in
-- raw_user_meta_data the way email/password signUp() does — Google instead
-- gives `given_name`/`family_name` (or a single `full_name`/`name`) plus an
-- avatar. Extend the profile-creation trigger to fall back to those, and
-- carry the Google avatar over too, so OAuth users don't end up with a
-- blank name.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  full_name  text;
  first_word text;
  rest_words text;
begin
  full_name := coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name');
  first_word := nullif(split_part(full_name, ' ', 1), '');
  rest_words := nullif(trim(substring(full_name from length(coalesce(first_word, '')) + 2)), '');

  insert into public.profiles (id, email, first_name, last_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'given_name', first_word, ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', new.raw_user_meta_data ->> 'family_name', rest_words, ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;
