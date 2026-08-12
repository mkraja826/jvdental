alter table public.staff_profiles add column if not exists email text;
alter table public.staff_profiles add column if not exists phone text;
alter table public.staff_profiles add column if not exists job_title text;
alter table public.staff_profiles add column if not exists invited_at timestamptz;
alter table public.staff_profiles add column if not exists deactivated_at timestamptz;
alter table public.staff_profiles add column if not exists created_by uuid references auth.users(id) on delete set null;

create unique index if not exists staff_profiles_email_unique on public.staff_profiles(lower(email)) where email is not null and btrim(email) <> '';
create index if not exists staff_profiles_role_active_idx on public.staff_profiles(role, is_active);

create or replace function private.enforce_staff_governance()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role text;
  v_other_owner_exists boolean;
begin
  new.email := case when new.email is null then null else lower(btrim(new.email)) end;

  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'Staff user identity cannot be changed';
  end if;

  if v_actor is null then
    if tg_op = 'UPDATE' and new.is_active = false and old.is_active = true then
      new.deactivated_at := coalesce(new.deactivated_at, now());
    elsif tg_op = 'UPDATE' and new.is_active = true then
      new.deactivated_at := null;
    end if;
    return new;
  end if;

  select sp.role into v_actor_role
  from public.staff_profiles sp
  where sp.user_id = v_actor and sp.is_active = true;

  if v_actor_role not in ('owner','admin') then
    raise exception 'Only owner or admin can manage staff';
  end if;

  if tg_op = 'INSERT' then
    if new.role in ('owner','admin') and v_actor_role <> 'owner' then
      raise exception 'Only an owner can grant owner or admin access';
    end if;
    return new;
  end if;

  if old.user_id = v_actor and new.is_active = false then
    raise exception 'You cannot deactivate your own staff account';
  end if;

  if v_actor_role = 'admin' and (old.role in ('owner','admin') or new.role in ('owner','admin')) then
    raise exception 'Admins cannot manage owner or admin roles';
  end if;

  if new.role in ('owner','admin') and v_actor_role <> 'owner' then
    raise exception 'Only an owner can grant owner or admin access';
  end if;

  if old.role = 'owner' and (new.role <> 'owner' or new.is_active = false) then
    select exists(
      select 1 from public.staff_profiles sp
      where sp.user_id <> old.user_id and sp.role = 'owner' and sp.is_active = true
    ) into v_other_owner_exists;
    if not v_other_owner_exists then
      raise exception 'The clinic must retain at least one active owner';
    end if;
  end if;

  if new.is_active = false and old.is_active = true then
    new.deactivated_at := coalesce(new.deactivated_at, now());
  elsif new.is_active = true then
    new.deactivated_at := null;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_staff_governance() from public;

drop trigger if exists staff_profiles_governance_guard on public.staff_profiles;
create trigger staff_profiles_governance_guard
before insert or update on public.staff_profiles
for each row execute function private.enforce_staff_governance();
