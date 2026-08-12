create or replace function private.guard_payment_request_financial_identity()
returns trigger language plpgsql set search_path=public,private as $$
declare
  v_paid bigint;
  v_refunded bigint;
  v_net bigint;
begin
  if old.status <> 'draft' and (
    new.patient_id is distinct from old.patient_id
    or new.case_id is distinct from old.case_id
    or new.treatment_plan_id is distinct from old.treatment_plan_id
    or new.amount_minor is distinct from old.amount_minor
    or new.currency is distinct from old.currency
  ) then
    raise exception 'Sent payment requests cannot change financial identity';
  end if;

  if new.status is distinct from old.status then
    select coalesce(sum(p.amount_minor),0) into v_paid
      from public.payments p
     where p.payment_request_id=old.id
       and p.status in ('succeeded','partially_refunded','refunded');

    select coalesce(sum(r.amount_minor),0) into v_refunded
      from public.payment_refunds r
      join public.payments p on p.id=r.payment_id
     where p.payment_request_id=old.id
       and r.status='succeeded';

    v_net := v_paid-v_refunded;

    if new.status='paid' and v_net < old.amount_minor then
      raise exception 'Payment request cannot be marked paid without matching successful ledger funds';
    end if;
    if new.status='partially_paid' and not (v_net > 0 and v_net < old.amount_minor) then
      raise exception 'Payment request partially-paid status must match the payment ledger';
    end if;
    if new.status='cancelled' and v_net > 0 then
      raise exception 'Payment request with received funds cannot be cancelled';
    end if;
    if new.status='draft' and old.status <> 'draft' then
      raise exception 'Sent payment requests cannot return to draft';
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.audit_payment_request_change()
returns trigger language plpgsql security definer set search_path=public,private as $$
begin
  if tg_op='INSERT' then
    insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(new.created_by,'payment_request_created','payment_request',new.id::text,jsonb_build_object('case_id',new.case_id,'amount_minor',new.amount_minor,'currency',new.currency,'request_type',new.request_type));
  elsif old.status is distinct from new.status then
    insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values((select auth.uid()),'payment_request_status_changed','payment_request',new.id::text,jsonb_build_object('from',old.status,'to',new.status,'case_id',new.case_id));
  end if;
  return new;
end;
$$;
revoke all on function private.audit_payment_request_change() from public,anon,authenticated;

drop trigger if exists payment_request_audit on public.payment_requests;
create trigger payment_request_audit after insert or update of status on public.payment_requests for each row execute function private.audit_payment_request_change();
