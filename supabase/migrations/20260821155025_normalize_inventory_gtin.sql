create or replace function private.normalize_inventory_item_gtin()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_digits text;
begin
  if new.gtin is null or btrim(new.gtin) = '' then
    new.gtin := null;
    return new;
  end if;

  v_digits := regexp_replace(new.gtin, '[^0-9]', '', 'g');
  if length(v_digits) < 8 or length(v_digits) > 14 then
    raise exception 'GTIN must contain 8 to 14 digits';
  end if;

  new.gtin := lpad(v_digits, 14, '0');
  return new;
end;
$$;

revoke all on function private.normalize_inventory_item_gtin() from public, anon, authenticated;

drop trigger if exists inventory_items_normalize_gtin on public.inventory_items;
create trigger inventory_items_normalize_gtin
before insert or update of gtin on public.inventory_items
for each row execute function private.normalize_inventory_item_gtin();

update public.inventory_items
set gtin = lpad(regexp_replace(gtin, '[^0-9]', '', 'g'), 14, '0')
where gtin is not null and btrim(gtin) <> '';
