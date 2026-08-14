create or replace function private.protect_last_active_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_owner_count integer;
begin
  if tg_op = 'DELETE' then
    if old.role = 'owner' and old.is_active then
      select count(*) into active_owner_count
      from public.staff_profiles
      where role = 'owner' and is_active = true and user_id <> old.user_id;
      if active_owner_count = 0 then
        raise exception 'cannot remove the last active owner';
      end if;
    end if;
    return old;
  end if;

  if old.role = 'owner' and old.is_active
     and (new.role <> 'owner' or new.is_active = false) then
    select count(*) into active_owner_count
    from public.staff_profiles
    where role = 'owner' and is_active = true and user_id <> old.user_id;
    if active_owner_count = 0 then
      raise exception 'cannot deactivate or demote the last active owner';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.protect_last_active_owner() from public, anon, authenticated;

drop trigger if exists protect_last_active_owner on public.staff_profiles;
create trigger protect_last_active_owner
before update or delete on public.staff_profiles
for each row execute function private.protect_last_active_owner();
