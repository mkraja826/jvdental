create or replace function private.guard_treatment_plan_history()
returns trigger
language plpgsql
set search_path = public, private
as $$
declare
  v_content_changed boolean;
  v_feedback_response text;
begin
  if tg_op = 'DELETE' then
    if old.status not in ('draft','preliminary') then
      raise exception 'Sent or responded treatment plans are immutable and cannot be deleted';
    end if;
    return old;
  end if;

  if new.patient_id is distinct from old.patient_id
     or new.case_id is distinct from old.case_id
     or new.version is distinct from old.version
     or new.created_by is distinct from old.created_by then
    raise exception 'Treatment plan identity cannot be changed';
  end if;

  v_content_changed :=
    new.title is distinct from old.title
    or new.summary is distinct from old.summary
    or new.doctor_message is distinct from old.doctor_message
    or new.estimated_stay_days_min is distinct from old.estimated_stay_days_min
    or new.estimated_stay_days_max is distinct from old.estimated_stay_days_max
    or new.second_visit_required is distinct from old.second_visit_required
    or new.valid_until is distinct from old.valid_until;

  if old.status in ('accepted','superseded') then
    raise exception 'Accepted or superseded treatment plans are immutable';
  end if;

  if old.status in ('draft','preliminary') then
    if new.status = old.status then
      if new.sent_at is distinct from old.sent_at
         or new.accepted_at is distinct from old.accepted_at
         or new.patient_responded_at is distinct from old.patient_responded_at then
        raise exception 'Treatment plan response timestamps cannot be edited';
      end if;
      return new;
    end if;

    if old.status = 'draft' and new.status = 'preliminary' and not v_content_changed
       and new.sent_at is not distinct from old.sent_at
       and new.accepted_at is not distinct from old.accepted_at
       and new.patient_responded_at is not distinct from old.patient_responded_at then
      return new;
    end if;

    if new.status = 'sent' and not v_content_changed
       and new.sent_at is not null
       and new.accepted_at is not distinct from old.accepted_at
       and new.patient_responded_at is not distinct from old.patient_responded_at then
      return new;
    end if;

    raise exception 'Invalid treatment plan transition from % to %', old.status, new.status;
  end if;

  if old.status = 'sent' then
    if v_content_changed or new.sent_at is distinct from old.sent_at then
      raise exception 'Sent treatment plan content cannot be changed';
    end if;

    if new.status = 'superseded'
       and new.accepted_at is not distinct from old.accepted_at
       and new.patient_responded_at is not distinct from old.patient_responded_at then
      return new;
    end if;

    if new.status in ('accepted','requested_changes') then
      select response into v_feedback_response
        from public.treatment_plan_feedback
       where treatment_plan_id = old.id
         and patient_id = old.patient_id
       order by created_at desc
       limit 1;

      if (new.status = 'accepted' and v_feedback_response <> 'accepted')
         or (new.status = 'requested_changes' and v_feedback_response <> 'request_changes')
         or v_feedback_response is null then
        raise exception 'Patient feedback is required for this treatment plan transition';
      end if;

      if new.patient_responded_at is null then
        raise exception 'Patient response timestamp is required';
      end if;
      if new.status = 'accepted' and new.accepted_at is null then
        raise exception 'Accepted timestamp is required';
      end if;
      if new.status = 'requested_changes' and new.accepted_at is distinct from old.accepted_at then
        raise exception 'Requested-changes transition cannot set acceptance time';
      end if;
      return new;
    end if;

    raise exception 'Invalid treatment plan transition from sent to %', new.status;
  end if;

  if old.status = 'requested_changes' then
    if new.status = 'superseded'
       and not v_content_changed
       and new.sent_at is not distinct from old.sent_at
       and new.accepted_at is not distinct from old.accepted_at
       and new.patient_responded_at is not distinct from old.patient_responded_at then
      return new;
    end if;
    raise exception 'Requested-changes plans must be revised as a new version';
  end if;

  raise exception 'Unsupported treatment plan state %', old.status;
end;
$$;

revoke all on function private.guard_treatment_plan_history() from public, anon, authenticated;

drop trigger if exists treatment_plan_history_guard on public.treatment_plans;
create trigger treatment_plan_history_guard
before update or delete on public.treatment_plans
for each row execute function private.guard_treatment_plan_history();

create or replace function private.guard_treatment_plan_item_history()
returns trigger
language plpgsql
set search_path = public, private
as $$
declare
  v_plan_id uuid;
  v_status text;
begin
  v_plan_id := case when tg_op = 'DELETE' then old.treatment_plan_id else new.treatment_plan_id end;
  select status into v_status from public.treatment_plans where id = v_plan_id;
  if v_status is null then
    raise exception 'Treatment plan not found';
  end if;
  if v_status not in ('draft','preliminary') then
    raise exception 'Line items on sent or responded treatment plans are immutable';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.guard_treatment_plan_item_history() from public, anon, authenticated;

drop trigger if exists treatment_plan_item_history_guard on public.treatment_plan_items;
create trigger treatment_plan_item_history_guard
before insert or update or delete on public.treatment_plan_items
for each row execute function private.guard_treatment_plan_item_history();
