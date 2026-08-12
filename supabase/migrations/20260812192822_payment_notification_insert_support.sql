drop trigger if exists payment_received_notification on public.payments;
drop trigger if exists payment_refund_notification on public.payment_refunds;

create or replace function public.notify_payment_ledger_changes()
returns trigger language plpgsql security definer set search_path=public,private as $$
begin
  if tg_table_name='payments' and new.status='succeeded' and (tg_op='INSERT' or old.status is distinct from new.status) then
    insert into public.notifications(recipient_user_id,case_id,kind,title,body,href,dedupe_key)
    values(new.patient_id,new.case_id,'payment_received','Payment received','Your payment was received and recorded securely.','/patient/payments','payment-received:'||new.id::text)
    on conflict(dedupe_key) do nothing;
  elsif tg_table_name='payment_refunds' and new.status='succeeded' and (tg_op='INSERT' or old.status is distinct from new.status) then
    insert into public.notifications(recipient_user_id,case_id,kind,title,body,href,dedupe_key)
    select p.patient_id,p.case_id,'payment_refund','Refund processed','A refund was processed for one of your JV Dental payments.','/patient/payments','payment-refund:'||new.id::text from public.payments p where p.id=new.payment_id
    on conflict(dedupe_key) do nothing;
  end if;
  return new;
end;
$$;

create trigger payment_received_notification after insert or update of status on public.payments for each row execute function public.notify_payment_ledger_changes();
create trigger payment_refund_notification after insert or update of status on public.payment_refunds for each row execute function public.notify_payment_ledger_changes();
