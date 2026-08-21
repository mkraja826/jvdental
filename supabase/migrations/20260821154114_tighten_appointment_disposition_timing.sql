create or replace function private.guard_appointment_integrity()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_case_patient uuid;
  v_staff_role text;
  v_staff_active boolean;
begin
  if new.ends_at is not null and new.ends_at <= new.starts_at then
    raise exception 'Appointment end time must be after start time';
  end if;

  if new.case_id is not null then
    select pc.patient_id into v_case_patient
    from public.patient_cases pc
    where pc.id = new.case_id;
    if v_case_patient is null or v_case_patient is distinct from new.patient_id then
      raise exception 'Appointment patient must match the linked case patient';
    end if;
  end if;

  if tg_op = 'INSERT' or new.clinician_user_id is distinct from old.clinician_user_id then
    if new.clinician_user_id is not null then
      select sp.role, sp.is_active into v_staff_role, v_staff_active
      from public.staff_profiles sp
      where sp.user_id = new.clinician_user_id;
      if coalesce(v_staff_active, false) = false
         or v_staff_role not in ('owner','admin','doctor','implantologist') then
        raise exception 'Appointment clinician must be active clinical staff';
      end if;
    end if;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'scheduled' then
      raise exception 'New appointments must start in scheduled status';
    end if;
    if new.starts_at <= now() then
      raise exception 'New scheduled appointments must be in the future';
    end if;
  else
    if new.patient_id is distinct from old.patient_id
       or new.case_id is distinct from old.case_id
       or new.appointment_type is distinct from old.appointment_type
       or new.created_at is distinct from old.created_at then
      raise exception 'Appointment patient, case, type and creation time are immutable';
    end if;

    if old.status is distinct from new.status then
      if old.status <> 'scheduled' or new.status not in ('completed','cancelled','no_show') then
        raise exception 'Invalid appointment status transition';
      end if;
      if new.status in ('completed','no_show') and old.starts_at > now() then
        raise exception 'Future appointments cannot be completed or marked no-show';
      end if;
    end if;

    if new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at then
      if old.status <> 'scheduled' or new.status <> 'scheduled' then
        raise exception 'Only scheduled appointments may be rescheduled';
      end if;
      if new.starts_at <= now() then
        raise exception 'Rescheduled appointment must be in the future';
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.guard_appointment_integrity() from public, anon, authenticated;
