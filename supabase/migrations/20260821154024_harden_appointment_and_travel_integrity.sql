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

drop trigger if exists appointments_guard_integrity on public.appointments;
create trigger appointments_guard_integrity
before insert or update on public.appointments
for each row execute function private.guard_appointment_integrity();

drop policy if exists "staff deletes appointments" on public.appointments;

create or replace function private.reconcile_case_after_appointment_cancel()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_restore_status text;
begin
  if old.status = 'scheduled'
     and new.status = 'cancelled'
     and new.case_id is not null
     and not exists (
       select 1 from public.appointments a
       where a.case_id = new.case_id and a.id <> new.id and a.status = 'scheduled'
     )
     and exists (
       select 1 from public.patient_cases pc
       where pc.id = new.case_id and pc.status = 'consultation_scheduled'
     ) then
    select csh.previous_status into v_restore_status
    from public.case_status_history csh
    where csh.case_id = new.case_id and csh.new_status = 'consultation_scheduled'
    order by csh.created_at desc, csh.id desc
    limit 1;
    if v_restore_status is null or v_restore_status = 'consultation_scheduled' then
      v_restore_status := 'doctor_review';
    end if;
    update public.patient_cases
       set status = v_restore_status
     where id = new.case_id and status = 'consultation_scheduled';
  end if;
  return new;
end;
$$;
revoke all on function private.reconcile_case_after_appointment_cancel() from public, anon, authenticated;

drop trigger if exists appointment_cancel_reconcile_case on public.appointments;
create trigger appointment_cancel_reconcile_case
after update of status on public.appointments
for each row execute function private.reconcile_case_after_appointment_cancel();

create or replace function private.guard_travel_plan_integrity()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_case_patient uuid;
begin
  select pc.patient_id into v_case_patient
  from public.patient_cases pc
  where pc.id = new.case_id;
  if v_case_patient is null or v_case_patient is distinct from new.patient_id then
    raise exception 'Travel plan patient must match the linked case patient';
  end if;
  if not exists (
    select 1 from public.treatment_plans tp
    where tp.case_id = new.case_id and tp.patient_id = new.patient_id and tp.status = 'accepted'
  ) then
    raise exception 'Travel planning requires an accepted treatment plan';
  end if;
  if new.arrival_date is not null and new.departure_date is not null and new.departure_date < new.arrival_date then
    raise exception 'Departure date cannot be before arrival date';
  end if;
  if tg_op = 'UPDATE' then
    if new.patient_id is distinct from old.patient_id
       or new.case_id is distinct from old.case_id
       or new.created_at is distinct from old.created_at then
      raise exception 'Travel plan patient, case and creation time are immutable';
    end if;
    if old.status in ('confirmed','completed','cancelled') then
      if new.status is distinct from old.status
         or new.arrival_date is distinct from old.arrival_date
         or new.departure_date is distinct from old.departure_date
         or new.arrival_flight is distinct from old.arrival_flight
         or new.departure_flight is distinct from old.departure_flight
         or new.accommodation_name is distinct from old.accommodation_name
         or new.accommodation_address is distinct from old.accommodation_address
         or new.airport_pickup_required is distinct from old.airport_pickup_required
         or new.companion_name is distinct from old.companion_name
         or new.companion_phone is distinct from old.companion_phone
         or new.patient_notes is distinct from old.patient_notes then
        raise exception 'Confirmed or closed travel plans cannot have patient journey details rewritten';
      end if;
    end if;
    if old.status is distinct from new.status then
      if not (
        (old.status = 'planning' and new.status in ('details_submitted','cancelled'))
        or (old.status = 'details_submitted' and new.status in ('confirmed','cancelled'))
        or (old.status = 'confirmed' and new.status in ('completed','cancelled'))
      ) then
        raise exception 'Invalid travel plan status transition';
      end if;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_travel_plan_integrity() from public, anon, authenticated;

drop trigger if exists travel_plans_guard_integrity on public.travel_plans;
create trigger travel_plans_guard_integrity
before insert or update on public.travel_plans
for each row execute function private.guard_travel_plan_integrity();

drop policy if exists "staff deletes travel plans" on public.travel_plans;
