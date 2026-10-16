begin;

alter table public.profiles enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles') then
    raise exception 'Review existing profiles policies before applying this migration';
  end if;
end;
$$;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, name, email, role, affiliation, mobility_device)
  on table public.profiles to authenticated;
grant update (name, affiliation, mobility_device)
  on table public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (
    (select auth.uid()) = id
    and role = 'surveyor'
    and email = (select auth.jwt() ->> 'email')
    and length(trim(name)) > 0
  );

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id and length(trim(name)) > 0);

create function public.validate_profile_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from auth.users
    where id = new.id and email = new.email and email_confirmed_at is not null
  ) then
    raise exception 'Profile requires a verified account with a matching email';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_profile_account() from public, anon, authenticated;
create trigger profiles_validate_account
  before insert on public.profiles
  for each row execute function public.validate_profile_account();

commit;
