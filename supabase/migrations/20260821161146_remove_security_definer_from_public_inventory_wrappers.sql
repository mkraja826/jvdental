alter function public.receive_inventory_batch(uuid,text,integer,date,uuid,numeric,text,text,uuid) security invoker;
alter function public.place_implant_from_inventory(uuid,uuid,text,date,text,uuid) security invoker;
alter function public.adjust_inventory_batch(uuid,integer,text,text,uuid) security invoker;

grant execute on function private.receive_inventory_batch(uuid,text,integer,date,uuid,numeric,text,text,uuid) to authenticated;
grant execute on function private.place_implant_from_inventory(uuid,uuid,text,date,text,uuid) to authenticated;
grant execute on function private.adjust_inventory_batch(uuid,integer,text,text,uuid) to authenticated;

revoke execute on function private.receive_inventory_batch(uuid,text,integer,date,uuid,numeric,text,text,uuid) from anon;
revoke execute on function private.place_implant_from_inventory(uuid,uuid,text,date,text,uuid) from anon;
revoke execute on function private.adjust_inventory_batch(uuid,integer,text,text,uuid) from anon;

revoke execute on function public.receive_inventory_batch(uuid,text,integer,date,uuid,numeric,text,text,uuid) from anon;
revoke execute on function public.place_implant_from_inventory(uuid,uuid,text,date,text,uuid) from anon;
revoke execute on function public.adjust_inventory_batch(uuid,integer,text,text,uuid) from anon;

grant execute on function public.receive_inventory_batch(uuid,text,integer,date,uuid,numeric,text,text,uuid) to authenticated;
grant execute on function public.place_implant_from_inventory(uuid,uuid,text,date,text,uuid) to authenticated;
grant execute on function public.adjust_inventory_batch(uuid,integer,text,text,uuid) to authenticated;
