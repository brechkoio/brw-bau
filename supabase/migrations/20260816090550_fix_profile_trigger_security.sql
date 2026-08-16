-- Advisor findings on the profiles trigger functions:
--   1. function_search_path_mutable: search_path wasn't pinned on set_updated_at.
--   2. anon/authenticated_security_definer_function_executable: both trigger
--      functions were callable directly via /rest/v1/rpc/*, even though they're
--      only meant to run as triggers.

alter function public.set_updated_at() set search_path = public;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
