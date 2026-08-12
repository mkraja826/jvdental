drop policy if exists "staff records stock movements" on public.stock_movements;
drop policy if exists "clinical staff manages implant records" on public.implant_records;

-- Existing SELECT policies remain in place. All writes now occur only through
-- the audited SECURITY DEFINER inventory procedures, which validate staff role,
-- lock the batch row, change stock and append the paired movement/implant record.
