-- Move SECURITY DEFINER RLS helpers out of the exposed public API schema.
-- This migration is intentionally idempotent enough for fresh environments built from the repo.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = auth.uid()
      and sp.is_active = true
  );
$$;

create or replace function private.has_staff_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = auth.uid()
      and sp.is_active = true
      and sp.role = any(allowed_roles)
  );
$$;

revoke all on function private.is_active_staff() from public;
revoke all on function private.has_staff_role(text[]) from public;
grant execute on function private.is_active_staff() to anon, authenticated;
grant execute on function private.has_staff_role(text[]) to anon, authenticated;

-- Repoint every existing RLS policy that references the old public helpers.
do $$
declare
  p record;
  next_qual text;
  next_check text;
  stmt text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname in ('public', 'storage')
      and (
        coalesce(qual, '') ~ '(^|[^a-zA-Z0-9_.])is_active_staff\(\)'
        or coalesce(qual, '') ~ '(^|[^a-zA-Z0-9_.])has_staff_role\('
        or coalesce(with_check, '') ~ '(^|[^a-zA-Z0-9_.])is_active_staff\(\)'
        or coalesce(with_check, '') ~ '(^|[^a-zA-Z0-9_.])has_staff_role\('
      )
  loop
    next_qual := p.qual;
    next_check := p.with_check;

    if next_qual is not null then
      next_qual := regexp_replace(next_qual, '(^|[^a-zA-Z0-9_.])is_active_staff\(\)', '\1private.is_active_staff()', 'g');
      next_qual := regexp_replace(next_qual, '(^|[^a-zA-Z0-9_.])has_staff_role\(', '\1private.has_staff_role(', 'g');
    end if;

    if next_check is not null then
      next_check := regexp_replace(next_check, '(^|[^a-zA-Z0-9_.])is_active_staff\(\)', '\1private.is_active_staff()', 'g');
      next_check := regexp_replace(next_check, '(^|[^a-zA-Z0-9_.])has_staff_role\(', '\1private.has_staff_role(', 'g');
    end if;

    stmt := format('alter policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
    if next_qual is not null then
      stmt := stmt || format(' using (%s)', next_qual);
    end if;
    if next_check is not null then
      stmt := stmt || format(' with check (%s)', next_check);
    end if;
    execute stmt;
  end loop;
end;
$$;

-- These helpers are no longer required in the exposed public schema.
drop function if exists public.is_active_staff();
drop function if exists public.has_staff_role(text[]);
