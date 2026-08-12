create or replace view public.available_implant_batches
with (security_invoker = true)
as
select
  b.id,
  b.item_id,
  b.scan_code,
  b.lot_number,
  b.expiry_date,
  b.quantity_on_hand,
  b.storage_location,
  b.received_at,
  i.name,
  i.brand,
  i.system,
  i.diameter_mm,
  i.length_mm,
  i.connection,
  i.gtin,
  i.sku
from public.inventory_batches b
join public.inventory_items i on i.id = b.item_id
where i.is_active = true
  and i.category = 'implant'
  and b.quantity_on_hand > 0
  and (b.expiry_date is null or b.expiry_date >= current_date);

grant select on public.available_implant_batches to authenticated;
