create or replace function public.dashboard_low_stock_count()
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)::bigint
  from (
    select i.id
    from public.inventory_items i
    left join public.inventory_batches b on b.item_id = i.id
    where i.is_active = true
    group by i.id, i.min_stock
    having coalesce(sum(b.quantity_on_hand), 0) <= i.min_stock
  ) low_stock_items;
$$;

grant execute on function public.dashboard_low_stock_count() to authenticated;
