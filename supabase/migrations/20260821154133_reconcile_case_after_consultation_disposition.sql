create or replace function private.reconcile_case_after_appointment_cancel()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_restore_status text;
begin
  if old.status <> 'scheduled' or new.case_id is null then
    return new;
  end if;

  if new.status = 'completed' then
    update public.patient_cases
       set status = 'doctor_review'
     where id = new.case_id
       and status = 'consultation_scheduled';
    return new;
  end if;

  if new.status in ('cancelled','no_show')
     and not exists (
       select 1
       from public.appointments a
       where a.case_id = new.case_id
         and a.id <> new.id
         and a.status = 'scheduled'
     )
     and exists (
       select 1 from public.patient_cases pc
       where pc.id = new.case_id and pc.status = 'consultation_scheduled'
     ) then

    select csh.previous_status
      into v_restore_status
    from public.case_status_history csh
    where csh.case_id = new.case_id
      and csh.new_status = 'consultation_scheduled'
    order by csh.created_at desc, csh.id desc
    limit 1;

    if v_restore_status is null or v_restore_status = 'consultation_scheduled' then
      v_restore_status := 'doctor_review';
    end if;

    update public.patient_cases
       set status = v_restore_status
     where id = new.case_id
       and status = 'consultation_scheduled';
  end if;

  return new;
end;
$$;

revoke all on function private.reconcile_case_after_appointment_cancel() from public, anon, authenticated;
