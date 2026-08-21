create or replace function private.guard_patient_document_identity()
returns trigger
language plpgsql
set search_path = public, private
as $$
declare
  v_parts text[];
  v_case_patient uuid;
begin
  v_parts := string_to_array(new.storage_path, '/');
  if coalesce(v_parts[1], '') <> new.patient_id::text then
    raise exception 'Patient document storage path does not match patient';
  end if;

  if new.case_id is not null then
    select patient_id into v_case_patient from public.patient_cases where id = new.case_id;
    if v_case_patient is null or v_case_patient <> new.patient_id then
      raise exception 'Patient document case does not belong to patient';
    end if;
    if coalesce(v_parts[2], '') <> new.case_id::text then
      raise exception 'Patient document storage path does not match case';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_patient_document_identity() from public, anon, authenticated;

drop trigger if exists patient_document_identity_guard on public.patient_documents;
create trigger patient_document_identity_guard
before insert or update of patient_id, case_id, storage_path on public.patient_documents
for each row execute function private.guard_patient_document_identity();

create or replace function private.guard_message_attachment_patient()
returns trigger
language plpgsql
set search_path = public, private
as $$
declare
  v_conversation_patient uuid;
  v_document_patient uuid;
begin
  select c.patient_id
    into v_conversation_patient
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
   where m.id = new.message_id;

  select patient_id
    into v_document_patient
    from public.patient_documents
   where id = new.patient_document_id;

  if v_conversation_patient is null or v_document_patient is null then
    raise exception 'Message or patient document not found';
  end if;

  if v_conversation_patient <> v_document_patient then
    raise exception 'Message attachment document belongs to a different patient';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_message_attachment_patient() from public, anon, authenticated;

drop trigger if exists message_attachment_patient_guard on public.message_attachments;
create trigger message_attachment_patient_guard
before insert or update of message_id, patient_document_id on public.message_attachments
for each row execute function private.guard_message_attachment_patient();
