-- Record every patient-case status transition at the database layer.

create or replace function private.on_patient_case_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if old.status is distinct from new.status then
    insert into public.case_status_history(case_id, previous_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

revoke all on function private.on_patient_case_status_change() from public, anon, authenticated;

drop trigger if exists patient_cases_record_status_change on public.patient_cases;
create trigger patient_cases_record_status_change
after update of status on public.patient_cases
for each row execute function private.on_patient_case_status_change();

-- The document trigger only advances the case. The status trigger above owns history.
create or replace function private.on_patient_document_insert()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  current_status text;
begin
  if new.case_id is null then
    return new;
  end if;

  select status into current_status
  from public.patient_cases
  where id = new.case_id
  for update;

  if current_status in ('new', 'records_requested') then
    update public.patient_cases
    set status = 'records_received', updated_at = now()
    where id = new.case_id;
  end if;

  return new;
end;
$$;

revoke all on function private.on_patient_document_insert() from public, anon, authenticated;
