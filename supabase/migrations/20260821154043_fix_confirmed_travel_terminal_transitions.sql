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
    select 1
    from public.treatment_plans tp
    where tp.case_id = new.case_id
      and tp.patient_id = new.patient_id
      and tp.status = 'accepted'
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
      if new.arrival_date is distinct from old.arrival_date
         or new.departure_date is distinct from old.departure_date
         or new.arrival_flight is distinct from old.arrival_flight
         or new.departure_flight is distinct from old.departure_flight
         or new.accommodation_name is distinct from old.accommodation_name
         or new.accommodation_address is distinct from old.accommodation_address
         or new.airport_pickup_required is distinct from old.airport_pickup_required
         or new.companion_name is distinct from old.companion_name
         or new.companion_phone is distinct from old.companion_phone
         or new.patient_notes is distinct from old.patient_notes
         or new.confirmed_by is distinct from old.confirmed_by
         or new.confirmed_at is distinct from old.confirmed_at then
        raise exception 'Confirmed or closed travel plans cannot have confirmed journey details rewritten';
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
