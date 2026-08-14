create or replace function private.track_product_activity_events()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  conversation_patient_id uuid;
begin
  if tg_table_name = 'appointment_requests' then
    if old.status is distinct from new.status and new.status = 'confirmed' then
      insert into public.product_events (event_name, surface, actor_type, actor_user_id)
      values ('booking_confirmed', 'clinic', 'staff', new.managed_by);
    elsif old.status is distinct from new.status and new.status = 'cancelled' then
      insert into public.product_events (event_name, surface, actor_type, actor_user_id)
      values ('booking_cancelled', 'clinic', 'staff', new.managed_by);
    elsif old.status is distinct from new.status and new.status = 'completed' then
      insert into public.product_events (event_name, surface, actor_type, actor_user_id)
      values ('booking_completed', 'clinic', 'staff', new.managed_by);
    elsif new.status = 'confirmed'
      and old.status = 'confirmed'
      and old.confirmed_starts_at is distinct from new.confirmed_starts_at then
      insert into public.product_events (event_name, surface, actor_type, actor_user_id)
      values ('booking_rescheduled', 'clinic', 'staff', new.managed_by);
    end if;

    return new;
  end if;

  if tg_table_name = 'patient_documents' then
    if new.uploaded_by = new.patient_id then
      insert into public.product_events (event_name, surface, actor_type, actor_user_id)
      values ('patient_document_uploaded', 'patient', 'patient', new.patient_id);
    end if;

    return new;
  end if;

  if tg_table_name = 'messages' then
    if not coalesce(new.is_internal, false) then
      select c.patient_id
      into conversation_patient_id
      from public.conversations c
      where c.id = new.conversation_id;

      if conversation_patient_id is not null and new.sender_user_id = conversation_patient_id then
        insert into public.product_events (event_name, surface, actor_type, actor_user_id)
        values ('patient_message_sent', 'patient', 'patient', conversation_patient_id);
      end if;
    end if;

    return new;
  end if;

  return new;
end;
$$;

revoke all on function private.track_product_activity_events() from public;

create trigger appointment_requests_product_events
  after update on public.appointment_requests
  for each row execute function private.track_product_activity_events();

create trigger patient_documents_product_events
  after insert on public.patient_documents
  for each row execute function private.track_product_activity_events();

create trigger patient_messages_product_events
  after insert on public.messages
  for each row execute function private.track_product_activity_events();
