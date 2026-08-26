-- Account deletion (Settings → Security → "Видалити акаунт") anonymizes the
-- profile before the auth.users row is removed. profiles.id already cascades
-- from auth.users, so the row disappears either way — deleted_at is mostly
-- a paper trail in case anonymization and the auth delete ever race.
--
-- work_reports must survive: they're needed for payroll/company records
-- after the employee's account is gone. Right now work_reports.user_id
-- cascades from profiles, which would silently delete report history along
-- with the account — switch it to SET NULL and drop the NOT NULL so an
-- orphaned report just loses its author instead of disappearing.

alter table public.profiles add column deleted_at timestamptz;

alter table public.work_reports
  drop constraint work_reports_user_id_fkey;

alter table public.work_reports
  alter column user_id drop not null;

alter table public.work_reports
  add constraint work_reports_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;
