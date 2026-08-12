-- Advance an international implant case when the patient successfully uploads records.
-- The patient never receives direct permission to update clinical case status.

create schema if not exists private;

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

    insert into public.case_status_history(case_id, previous_status, new_status, changed_by, note)
    values (
      new.case_id,
      current_status,
      'records_received',
      new.uploaded_by,
      'Patient uploaded clinical records.'
    );
  end if;

  return new;
end;
$$;

revoke all on function private.on_patient_document_insert() from public, anon, authenticated;

drop trigger if exists patient_documents_advance_case_status on public.patient_documents;
create trigger patient_documents_advance_case_status
after insert on public.patient_documents
for each row execute function private.on_patient_document_insert();

create index if not exists conversations_updated_idx on public.conversations(updated_at desc);
create index if not exists patient_documents_created_idx on public.patient_documents(created_at desc);
