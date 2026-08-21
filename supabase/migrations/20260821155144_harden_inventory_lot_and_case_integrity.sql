create or replace function private.receive_inventory_batch(
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
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_batch public.inventory_batches%rowtype;
  v_key uuid := coalesce(p_idempotency_key, gen_random_uuid());
  v_existing_batch uuid;
begin
  if auth.uid() is null or not private.has_staff_role(array['owner','admin','implantologist','receptionist','dental_assistant']) then
    raise exception 'Not authorized to receive inventory';
  end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  if nullif(btrim(p_lot_number), '') is null then raise exception 'Lot number is required'; end if;
  if p_expiry_date is not null and p_expiry_date < current_date then raise exception 'Expired stock cannot be received into active inventory'; end if;
  if p_unit_cost is not null and p_unit_cost < 0 then raise exception 'Unit cost cannot be negative'; end if;
  if not exists (select 1 from public.inventory_items where id = p_item_id and is_active = true) then raise exception 'Inventory item is not active'; end if;

  select batch_id into v_existing_batch from public.stock_movements where idempotency_key = v_key;
  if v_existing_batch is not null then return v_existing_batch; end if;

  perform set_config('app.inventory_mutation', 'allowed', true);
  select * into v_batch from public.inventory_batches where item_id = p_item_id and lot_number = btrim(p_lot_number) for update;

  if found then
    if p_expiry_date is not null and v_batch.expiry_date is not null and v_batch.expiry_date <> p_expiry_date then
      raise exception 'This lot already has a different expiry date';
    end if;
    if p_scan_code is not null and nullif(btrim(p_scan_code), '') is not null and v_batch.scan_code is not null and v_batch.scan_code <> btrim(p_scan_code) then
      raise exception 'This lot already has a different scan code';
    end if;
    update public.inventory_batches
      set quantity_on_hand = quantity_on_hand + p_quantity,
          expiry_date = coalesce(expiry_date, p_expiry_date),
          vendor_id = coalesce(p_vendor_id, vendor_id),
          unit_cost = coalesce(p_unit_cost, unit_cost),
          storage_location = coalesce(nullif(btrim(p_storage_location), ''), storage_location),
          scan_code = coalesce(scan_code, nullif(btrim(p_scan_code), '')),
          received_at = now()
      where id = v_batch.id
      returning * into v_batch;
  else
    insert into public.inventory_batches (item_id, vendor_id, lot_number, expiry_date, quantity_on_hand, unit_cost, storage_location, received_at, scan_code)
    values (p_item_id, p_vendor_id, btrim(p_lot_number), p_expiry_date, p_quantity, p_unit_cost, nullif(btrim(p_storage_location), ''), now(), nullif(btrim(p_scan_code), ''))
    returning * into v_batch;
  end if;

  insert into public.stock_movements (item_id, batch_id, movement_type, quantity_delta, reason, actor_user_id, idempotency_key)
  values (p_item_id, v_batch.id, 'purchase', p_quantity, 'Inventory received', auth.uid(), v_key);

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'inventory_received', 'inventory_batch', v_batch.id::text,
    jsonb_build_object('item_id', p_item_id, 'lot_number', v_batch.lot_number, 'quantity', p_quantity, 'expiry_date', v_batch.expiry_date));

  return v_batch.id;
end;
$$;

revoke all on function private.receive_inventory_batch(uuid,text,integer,date,uuid,numeric,text,text,uuid) from public, anon, authenticated;
grant execute on function private.receive_inventory_batch(uuid,text,integer,date,uuid,numeric,text,text,uuid) to authenticated;

create or replace function private.place_implant_from_inventory(
  p_batch_id uuid,
  p_case_id uuid,
  p_tooth_site text,
  p_placement_date date default current_date,
  p_notes text default null,
  p_idempotency_key uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_batch public.inventory_batches%rowtype;
  v_item public.inventory_items%rowtype;
  v_case public.patient_cases%rowtype;
  v_record_id uuid;
  v_key uuid := coalesce(p_idempotency_key, gen_random_uuid());
begin
  if auth.uid() is null or not private.has_staff_role(array['owner','admin','implantologist','doctor']) then raise exception 'Not authorized to record implant placement'; end if;
  if nullif(btrim(p_tooth_site), '') is null then raise exception 'Tooth/site is required'; end if;
  if p_placement_date is null or p_placement_date > current_date then raise exception 'Placement date cannot be in the future'; end if;

  select id into v_record_id from public.implant_records where idempotency_key = v_key;
  if v_record_id is not null then return v_record_id; end if;

  select * into v_case from public.patient_cases where id = p_case_id;
  if not found then raise exception 'Patient case not found'; end if;
  if v_case.status in ('completed','closed') then raise exception 'Implant placement cannot be recorded against a completed or closed case'; end if;

  select * into v_batch from public.inventory_batches where id = p_batch_id for update;
  if not found then raise exception 'Inventory batch not found'; end if;
  if v_batch.quantity_on_hand <= 0 then raise exception 'Implant batch is out of stock'; end if;
  if v_batch.expiry_date is not null and v_batch.expiry_date < p_placement_date then raise exception 'Expired implant batch cannot be placed'; end if;

  select * into v_item from public.inventory_items where id = v_batch.item_id and is_active = true;
  if not found or v_item.category <> 'implant' then raise exception 'Selected batch is not an active implant item'; end if;

  perform set_config('app.inventory_mutation', 'allowed', true);
  update public.inventory_batches set quantity_on_hand = quantity_on_hand - 1 where id = v_batch.id;

  insert into public.implant_records (
    patient_id, case_id, item_id, batch_id, tooth_site, placement_date, clinician_user_id, notes,
    idempotency_key, lot_number_snapshot, implant_name_snapshot, brand_snapshot, system_snapshot,
    diameter_mm_snapshot, length_mm_snapshot, connection_snapshot
  ) values (
    v_case.patient_id, v_case.id, v_item.id, v_batch.id, btrim(p_tooth_site), p_placement_date, auth.uid(), nullif(btrim(p_notes), ''),
    v_key, v_batch.lot_number, v_item.name, v_item.brand, v_item.system,
    v_item.diameter_mm, v_item.length_mm, v_item.connection
  ) returning id into v_record_id;

  insert into public.stock_movements (item_id, batch_id, movement_type, quantity_delta, patient_id, case_id, tooth_site, reason, actor_user_id, idempotency_key)
  values (v_item.id, v_batch.id, 'patient_use', -1, v_case.patient_id, v_case.id, btrim(p_tooth_site), 'Implant placement', auth.uid(), v_key);

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'implant_placed', 'implant_record', v_record_id::text,
    jsonb_build_object('case_id', v_case.id, 'patient_id', v_case.patient_id, 'batch_id', v_batch.id, 'lot_number', v_batch.lot_number, 'tooth_site', btrim(p_tooth_site)));

  return v_record_id;
end;
$$;

revoke all on function private.place_implant_from_inventory(uuid,uuid,text,date,text,uuid) from public, anon, authenticated;
grant execute on function private.place_implant_from_inventory(uuid,uuid,text,date,text,uuid) to authenticated;
