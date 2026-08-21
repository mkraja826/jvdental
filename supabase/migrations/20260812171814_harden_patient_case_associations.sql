-- Ensure patient-created records and conversations can only reference the patient's own case.
-- Also keep conversation ordering fresh whenever a message is inserted.

drop policy if exists "patient uploads own document metadata" on public.patient_documents;
create policy "patient uploads own document metadata"
on public.patient_documents for insert to authenticated
with check (
  patient_id = auth.uid()
  and uploaded_by = auth.uid()
  and (
    case_id is null
    or exists (
      select 1 from public.patient_cases pc
      where pc.id = patient_documents.case_id
        and pc.patient_id = auth.uid()
    )
  )
);

drop policy if exists "conversation patient creates own" on public.conversations;
create policy "conversation patient creates own"
on public.conversations for insert to authenticated
with check (
  patient_id = auth.uid()
  and (
    case_id is null
    or exists (
      select 1 from public.patient_cases pc
      where pc.id = conversations.case_id
        and pc.patient_id = auth.uid()
    )
  )
);

create or replace function private.on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

revoke all on function private.on_message_insert() from public, anon, authenticated;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
after insert on public.messages
for each row execute function private.on_message_insert();
