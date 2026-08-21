revoke execute on function public.receive_inventory_batch(uuid,text,integer,date,uuid,numeric,text,text,uuid) from anon;
revoke execute on function public.adjust_inventory_batch(uuid,integer,text,text,uuid) from anon;
revoke execute on function public.place_implant_from_inventory(uuid,uuid,text,date,text,uuid) from anon;
revoke execute on function public.clinic_dashboard_summary() from anon;
revoke execute on function public.dashboard_low_stock_count() from anon;
revoke execute on function public.touch_updated_at() from anon, authenticated;

grant execute on function public.receive_inventory_batch(uuid,text,integer,date,uuid,numeric,text,text,uuid) to authenticated;
grant execute on function public.adjust_inventory_batch(uuid,integer,text,text,uuid) to authenticated;
grant execute on function public.place_implant_from_inventory(uuid,uuid,text,date,text,uuid) to authenticated;
grant execute on function public.clinic_dashboard_summary() to authenticated;
grant execute on function public.dashboard_low_stock_count() to authenticated;
