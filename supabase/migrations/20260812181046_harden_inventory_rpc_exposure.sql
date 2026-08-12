alter function public.receive_inventory_batch(uuid,text,integer,date,uuid,numeric,text,text,uuid) set schema private;
alter function public.place_implant_from_inventory(uuid,uuid,text,date,text,uuid) set schema private;
alter function public.adjust_inventory_batch(uuid,integer,text,text,uuid) set schema private;

revoke all on function private.receive_inventory_batch(uuid,text,integer,date,uuid,numeric,text,text,uuid) from public;
revoke all on function private.place_implant_from_inventory(uuid,uuid,text,date,text,uuid) from public;
revoke all on function private.adjust_inventory_batch(uuid,integer,text,text,uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.receive_inventory_batch(uuid,text,integer,date,uuid,numeric,text,text,uuid) to authenticated;
grant execute on function private.place_implant_from_inventory(uuid,uuid,text,date,text,uuid) to authenticated;
grant execute on function private.adjust_inventory_batch(uuid,integer,text,text,uuid) to authenticated;

create function public.receive_inventory_batch(
  p_item_id uuid,
  p_lot_number text,
  p_quantity integer,
  p_expiry_date date default null,
  p_vendor_id uuid default null,
  p_unit_cost numeric default null,
  p_storage_location text default null,
  p_scan_code text default null,
  p_idempotency_key uuid default null
)
returns uuid
language sql
security invoker
set search_path = public, private
as $$
  select private.receive_inventory_batch(
    p_item_id, p_lot_number, p_quantity, p_expiry_date, p_vendor_id,
    p_unit_cost, p_storage_location, p_scan_code, p_idempotency_key
  );
$$;

create function public.place_implant_from_inventory(
  p_batch_id uuid,
  p_case_id uuid,
  p_tooth_site text,
  p_placement_date date default current_date,
  p_notes text default null,
  p_idempotency_key uuid default null
)
returns uuid
language sql
security invoker
set search_path = public, private
as $$
  select private.place_implant_from_inventory(
    p_batch_id, p_case_id, p_tooth_site, p_placement_date, p_notes, p_idempotency_key
  );
$$;

create function public.adjust_inventory_batch(
  p_batch_id uuid,
  p_quantity_delta integer,
  p_movement_type text,
  p_reason text,
  p_idempotency_key uuid default null
)
returns uuid
language sql
security invoker
set search_path = public, private
as $$
  select private.adjust_inventory_batch(
    p_batch_id, p_quantity_delta, p_movement_type, p_reason, p_idempotency_key
  );
$$;

revoke all on function public.receive_inventory_batch(uuid,text,integer,date,uuid,numeric,text,text,uuid) from public;
revoke all on function public.place_implant_from_inventory(uuid,uuid,text,date,text,uuid) from public;
revoke all on function public.adjust_inventory_batch(uuid,integer,text,text,uuid) from public;
grant execute on function public.receive_inventory_batch(uuid,text,integer,date,uuid,numeric,text,text,uuid) to authenticated;
grant execute on function public.place_implant_from_inventory(uuid,uuid,text,date,text,uuid) to authenticated;
grant execute on function public.adjust_inventory_batch(uuid,integer,text,text,uuid) to authenticated;
