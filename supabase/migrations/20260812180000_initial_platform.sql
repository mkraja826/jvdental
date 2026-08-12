-- JV Dental initial platform schema
-- Patient portal + staff access + secure messaging + implant inventory traceability.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Core staff / patient identity
-- -----------------------------------------------------------------------------

create table public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in (
    'owner', 'admin', 'implantologist', 'doctor', 'coordinator', 'receptionist', 'dental_assistant'
  )),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  date_of_birth date,
  gender text,
  country text,
  city text,
  phone text,
  whatsapp text,
  preferred_language text not null default 'en',
  preferred_contact_method text check (preferred_contact_method in ('portal', 'email', 'phone', 'whatsapp')),
  intake_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medical_histories (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null unique references public.patient_profiles(user_id) on delete cascade,
  diabetes boolean,
  hypertension boolean,
  heart_condition boolean,
  blood_thinners boolean,
  allergies text,
  current_medications text,
  smoking_status text,
  previous_surgeries text,
  other_conditions text,
  updated_at timestamptz not null default now()
);

create table public.dental_intakes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null unique references public.patient_profiles(user_id) on delete cascade,
  primary_concern text,
  missing_teeth text,
  loose_teeth boolean,
  existing_dentures boolean,
  previous_implants text,
  pain_or_infection text,
  treatment_interest text[] not null default '{}',
  preferred_treatment_month date,
  notes text,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- International implant case workflow
-- -----------------------------------------------------------------------------

create table public.patient_cases (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(user_id) on delete restrict,
  case_number bigint generated always as identity unique,
  status text not null default 'new' check (status in (
    'new',
    'records_requested',
    'records_received',
    'doctor_review',
    'more_information_required',
    'consultation_scheduled',
    'preliminary_plan_ready',
    'estimate_sent',
    'patient_considering',
    'travel_confirmed',
    'in_treatment',
    'follow_up',
    'completed',
    'closed'
  )),
  treatment_interest text,
  country_snapshot text,
  assigned_clinician uuid references public.staff_profiles(user_id) on delete set null,
  assigned_coordinator uuid references public.staff_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index patient_cases_patient_id_idx on public.patient_cases(patient_id);
create index patient_cases_status_idx on public.patient_cases(status);
create index patient_cases_assigned_clinician_idx on public.patient_cases(assigned_clinician);

create table public.patient_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(user_id) on delete restrict,
  case_id uuid references public.patient_cases(id) on delete set null,
  category text not null check (category in (
    'opg', 'cbct', 'xray', 'clinical_photo', 'medical_report', 'prescription', 'treatment_plan', 'other'
  )),
  storage_path text not null unique,
  file_name text not null,
  content_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index patient_documents_patient_id_idx on public.patient_documents(patient_id);
create index patient_documents_case_id_idx on public.patient_documents(case_id);

create table public.case_status_history (
  id bigint generated always as identity primary key,
  case_id uuid not null references public.patient_cases(id) on delete cascade,
  previous_status text,
  new_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table public.case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.patient_cases(id) on delete cascade,
  author_user_id uuid not null references public.staff_profiles(user_id) on delete restrict,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Patient <-> clinic secure messaging
-- -----------------------------------------------------------------------------

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(user_id) on delete restrict,
  case_id uuid references public.patient_cases(id) on delete set null,
  subject text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_patient_id_idx on public.conversations(patient_id);
create index conversations_case_id_idx on public.conversations(case_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 10000),
  message_type text not null default 'text' check (message_type in ('text', 'file', 'system')),
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index messages_conversation_created_idx on public.messages(conversation_id, created_at);

create table public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  patient_document_id uuid not null references public.patient_documents(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (message_id, patient_document_id)
);

-- -----------------------------------------------------------------------------
-- Appointments / preliminary plans / estimates
-- -----------------------------------------------------------------------------

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(user_id) on delete restrict,
  case_id uuid references public.patient_cases(id) on delete set null,
  clinician_user_id uuid references public.staff_profiles(user_id) on delete set null,
  appointment_type text not null check (appointment_type in ('video_consultation', 'clinic_consultation', 'procedure', 'follow_up')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  meeting_url text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.treatment_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(user_id) on delete restrict,
  case_id uuid not null references public.patient_cases(id) on delete restrict,
  version integer not null default 1 check (version > 0),
  status text not null default 'draft' check (status in ('draft', 'preliminary', 'sent', 'accepted', 'superseded')),
  summary text,
  estimated_stay_days_min integer,
  estimated_stay_days_max integer,
  second_visit_required boolean,
  created_by uuid not null references public.staff_profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, version)
);

create table public.treatment_plan_items (
  id uuid primary key default gen_random_uuid(),
  treatment_plan_id uuid not null references public.treatment_plans(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) check (unit_price is null or unit_price >= 0),
  currency char(3) not null default 'INR',
  sort_order integer not null default 0
);

-- -----------------------------------------------------------------------------
-- Implant-focused inventory
-- -----------------------------------------------------------------------------

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  gst_number text,
  payment_terms text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  category text not null check (category in (
    'implant', 'healing_abutment', 'prosthetic_abutment', 'cover_screw', 'multi_unit_abutment',
    'temporary_component', 'bone_graft', 'membrane', 'suture', 'biomaterial', 'anaesthetic',
    'medicine', 'sterilisation', 'prosthodontic_material', 'consumable', 'other'
  )),
  name text not null,
  brand text,
  system text,
  diameter_mm numeric(6,2),
  length_mm numeric(6,2),
  connection text,
  unit_of_measure text not null default 'unit',
  min_stock integer not null default 0 check (min_stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inventory_items_category_idx on public.inventory_items(category);
create index inventory_items_brand_idx on public.inventory_items(brand);

create table public.inventory_batches (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  vendor_id uuid references public.vendors(id) on delete set null,
  lot_number text not null,
  expiry_date date,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  unit_cost numeric(12,2) check (unit_cost is null or unit_cost >= 0),
  storage_location text,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, lot_number)
);

create index inventory_batches_item_id_idx on public.inventory_batches(item_id);
create index inventory_batches_expiry_idx on public.inventory_batches(expiry_date) where quantity_on_hand > 0;

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  po_number bigint generated always as identity unique,
  status text not null default 'draft' check (status in ('draft', 'ordered', 'part_received', 'received', 'cancelled')),
  notes text,
  created_by uuid not null references public.staff_profiles(user_id) on delete restrict,
  ordered_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity_ordered integer not null check (quantity_ordered > 0),
  quantity_received integer not null default 0 check (quantity_received >= 0),
  unit_cost numeric(12,2) check (unit_cost is null or unit_cost >= 0)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  batch_id uuid references public.inventory_batches(id) on delete restrict,
  movement_type text not null check (movement_type in (
    'purchase', 'patient_use', 'adjustment', 'damaged', 'expired', 'return_to_vendor', 'transfer'
  )),
  quantity_delta integer not null check (quantity_delta <> 0),
  patient_id uuid references public.patient_profiles(user_id) on delete restrict,
  case_id uuid references public.patient_cases(id) on delete restrict,
  tooth_site text,
  reason text,
  actor_user_id uuid not null references public.staff_profiles(user_id) on delete restrict,
  created_at timestamptz not null default now()
);

create index stock_movements_item_created_idx on public.stock_movements(item_id, created_at desc);
create index stock_movements_case_id_idx on public.stock_movements(case_id);

create table public.implant_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(user_id) on delete restrict,
  case_id uuid references public.patient_cases(id) on delete set null,
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  batch_id uuid not null references public.inventory_batches(id) on delete restrict,
  tooth_site text not null,
  placement_date date not null,
  clinician_user_id uuid not null references public.staff_profiles(user_id) on delete restrict,
  notes text,
  created_at timestamptz not null default now()
);

create index implant_records_patient_id_idx on public.implant_records(patient_id);
create index implant_records_case_id_idx on public.implant_records(case_id);

-- -----------------------------------------------------------------------------
-- Audit trail
-- -----------------------------------------------------------------------------

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs(created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- Updated-at helper
-- -----------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger staff_profiles_touch_updated_at before update on public.staff_profiles
for each row execute function public.touch_updated_at();
create trigger patient_profiles_touch_updated_at before update on public.patient_profiles
for each row execute function public.touch_updated_at();
create trigger medical_histories_touch_updated_at before update on public.medical_histories
for each row execute function public.touch_updated_at();
create trigger dental_intakes_touch_updated_at before update on public.dental_intakes
for each row execute function public.touch_updated_at();
create trigger patient_cases_touch_updated_at before update on public.patient_cases
for each row execute function public.touch_updated_at();
create trigger case_notes_touch_updated_at before update on public.case_notes
for each row execute function public.touch_updated_at();
create trigger conversations_touch_updated_at before update on public.conversations
for each row execute function public.touch_updated_at();
create trigger appointments_touch_updated_at before update on public.appointments
for each row execute function public.touch_updated_at();
create trigger treatment_plans_touch_updated_at before update on public.treatment_plans
for each row execute function public.touch_updated_at();
create trigger vendors_touch_updated_at before update on public.vendors
for each row execute function public.touch_updated_at();
create trigger inventory_items_touch_updated_at before update on public.inventory_items
for each row execute function public.touch_updated_at();
create trigger inventory_batches_touch_updated_at before update on public.inventory_batches
for each row execute function public.touch_updated_at();
create trigger purchase_orders_touch_updated_at before update on public.purchase_orders
for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Authorization helpers. SECURITY DEFINER avoids recursive staff_profiles RLS.
-- -----------------------------------------------------------------------------

create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = auth.uid()
      and sp.is_active = true
  );
$$;

create or replace function public.has_staff_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = auth.uid()
      and sp.is_active = true
      and sp.role = any(allowed_roles)
  );
$$;

revoke all on function public.is_active_staff() from public;
revoke all on function public.has_staff_role(text[]) from public;
grant execute on function public.is_active_staff() to authenticated;
grant execute on function public.has_staff_role(text[]) to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.staff_profiles enable row level security;
alter table public.patient_profiles enable row level security;
alter table public.medical_histories enable row level security;
alter table public.dental_intakes enable row level security;
alter table public.patient_cases enable row level security;
alter table public.patient_documents enable row level security;
alter table public.case_status_history enable row level security;
alter table public.case_notes enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.appointments enable row level security;
alter table public.treatment_plans enable row level security;
alter table public.treatment_plan_items enable row level security;
alter table public.vendors enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_batches enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.implant_records enable row level security;
alter table public.audit_logs enable row level security;

-- Staff profiles
create policy "staff profile self or staff read"
on public.staff_profiles for select to authenticated
using (user_id = auth.uid() or public.is_active_staff());

create policy "owner admin manage staff"
on public.staff_profiles for all to authenticated
using (public.has_staff_role(array['owner','admin']))
with check (public.has_staff_role(array['owner','admin']));

-- Patient profile and intake
create policy "patient profile self or staff read"
on public.patient_profiles for select to authenticated
using (user_id = auth.uid() or public.is_active_staff());

create policy "patient creates own profile"
on public.patient_profiles for insert to authenticated
with check (user_id = auth.uid());

create policy "patient or staff updates profile"
on public.patient_profiles for update to authenticated
using (user_id = auth.uid() or public.is_active_staff())
with check (user_id = auth.uid() or public.is_active_staff());

create policy "medical history patient or staff read"
on public.medical_histories for select to authenticated
using (patient_id = auth.uid() or public.is_active_staff());

create policy "medical history patient creates own"
on public.medical_histories for insert to authenticated
with check (patient_id = auth.uid());

create policy "medical history patient or staff update"
on public.medical_histories for update to authenticated
using (patient_id = auth.uid() or public.is_active_staff())
with check (patient_id = auth.uid() or public.is_active_staff());

create policy "dental intake patient or staff read"
on public.dental_intakes for select to authenticated
using (patient_id = auth.uid() or public.is_active_staff());

create policy "dental intake patient creates own"
on public.dental_intakes for insert to authenticated
with check (patient_id = auth.uid());

create policy "dental intake patient or staff update"
on public.dental_intakes for update to authenticated
using (patient_id = auth.uid() or public.is_active_staff())
with check (patient_id = auth.uid() or public.is_active_staff());

-- Cases and clinical records
create policy "case patient or staff read"
on public.patient_cases for select to authenticated
using (patient_id = auth.uid() or public.is_active_staff());

create policy "patient creates own case"
on public.patient_cases for insert to authenticated
with check (patient_id = auth.uid() and status = 'new');

create policy "staff creates cases"
on public.patient_cases for insert to authenticated
with check (public.is_active_staff());

create policy "staff updates cases"
on public.patient_cases for update to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

create policy "document metadata patient or staff read"
on public.patient_documents for select to authenticated
using (patient_id = auth.uid() or public.is_active_staff());

create policy "patient uploads own document metadata"
on public.patient_documents for insert to authenticated
with check (patient_id = auth.uid() and uploaded_by = auth.uid());

create policy "staff uploads document metadata"
on public.patient_documents for insert to authenticated
with check (public.is_active_staff() and uploaded_by = auth.uid());

create policy "staff manages document metadata"
on public.patient_documents for update to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

create policy "staff deletes document metadata"
on public.patient_documents for delete to authenticated
using (public.is_active_staff());

create policy "case history patient or staff read"
on public.case_status_history for select to authenticated
using (
  public.is_active_staff()
  or exists (
    select 1 from public.patient_cases pc
    where pc.id = case_status_history.case_id and pc.patient_id = auth.uid()
  )
);

create policy "staff writes case history"
on public.case_status_history for insert to authenticated
with check (public.is_active_staff() and (changed_by = auth.uid() or changed_by is null));

create policy "case notes staff only"
on public.case_notes for all to authenticated
using (public.is_active_staff())
with check (public.is_active_staff() and author_user_id = auth.uid());

-- Conversations
create policy "conversation patient or staff read"
on public.conversations for select to authenticated
using (patient_id = auth.uid() or public.is_active_staff());

create policy "conversation patient creates own"
on public.conversations for insert to authenticated
with check (patient_id = auth.uid());

create policy "conversation staff creates"
on public.conversations for insert to authenticated
with check (public.is_active_staff());

create policy "conversation staff updates"
on public.conversations for update to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

create policy "message participant read"
on public.messages for select to authenticated
using (
  public.is_active_staff()
  or (
    is_internal = false
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.patient_id = auth.uid()
    )
  )
);

create policy "message participant insert"
on public.messages for insert to authenticated
with check (
  sender_user_id = auth.uid()
  and (
    public.is_active_staff()
    or (
      is_internal = false
      and exists (
        select 1 from public.conversations c
        where c.id = messages.conversation_id and c.patient_id = auth.uid()
      )
    )
  )
);

create policy "message attachment participant read"
on public.message_attachments for select to authenticated
using (
  exists (
    select 1
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = message_attachments.message_id
      and (c.patient_id = auth.uid() or public.is_active_staff())
  )
);

create policy "message attachment participant insert"
on public.message_attachments for insert to authenticated
with check (
  exists (
    select 1
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = message_attachments.message_id
      and m.sender_user_id = auth.uid()
      and (c.patient_id = auth.uid() or public.is_active_staff())
  )
);

-- Appointments / plans
create policy "appointment patient or staff read"
on public.appointments for select to authenticated
using (patient_id = auth.uid() or public.is_active_staff());

create policy "staff manages appointments"
on public.appointments for all to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

create policy "treatment plan patient or staff read"
on public.treatment_plans for select to authenticated
using (patient_id = auth.uid() or public.is_active_staff());

create policy "staff manages treatment plans"
on public.treatment_plans for all to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

create policy "treatment plan items patient or staff read"
on public.treatment_plan_items for select to authenticated
using (
  public.is_active_staff()
  or exists (
    select 1 from public.treatment_plans tp
    where tp.id = treatment_plan_items.treatment_plan_id and tp.patient_id = auth.uid()
  )
);

create policy "staff manages treatment plan items"
on public.treatment_plan_items for all to authenticated
using (public.is_active_staff())
with check (public.is_active_staff());

-- Inventory / purchasing
create policy "staff reads vendors"
on public.vendors for select to authenticated
using (public.is_active_staff());

create policy "inventory editors manage vendors"
on public.vendors for all to authenticated
using (public.has_staff_role(array['owner','admin','receptionist','dental_assistant']))
with check (public.has_staff_role(array['owner','admin','receptionist','dental_assistant']));

create policy "staff reads inventory items"
on public.inventory_items for select to authenticated
using (public.is_active_staff());

create policy "inventory editors manage items"
on public.inventory_items for all to authenticated
using (public.has_staff_role(array['owner','admin','implantologist','dental_assistant']))
with check (public.has_staff_role(array['owner','admin','implantologist','dental_assistant']));

create policy "staff reads inventory batches"
on public.inventory_batches for select to authenticated
using (public.is_active_staff());

create policy "inventory editors manage batches"
on public.inventory_batches for all to authenticated
using (public.has_staff_role(array['owner','admin','implantologist','dental_assistant']))
with check (public.has_staff_role(array['owner','admin','implantologist','dental_assistant']));

create policy "staff reads purchase orders"
on public.purchase_orders for select to authenticated
using (public.is_active_staff());

create policy "inventory editors manage purchase orders"
on public.purchase_orders for all to authenticated
using (public.has_staff_role(array['owner','admin','receptionist','dental_assistant']))
with check (public.has_staff_role(array['owner','admin','receptionist','dental_assistant']));

create policy "staff reads purchase order items"
on public.purchase_order_items for select to authenticated
using (public.is_active_staff());

create policy "inventory editors manage purchase order items"
on public.purchase_order_items for all to authenticated
using (public.has_staff_role(array['owner','admin','receptionist','dental_assistant']))
with check (public.has_staff_role(array['owner','admin','receptionist','dental_assistant']));

create policy "staff reads stock movements"
on public.stock_movements for select to authenticated
using (public.is_active_staff());

create policy "staff records stock movements"
on public.stock_movements for insert to authenticated
with check (public.is_active_staff() and actor_user_id = auth.uid());

create policy "implant passport patient or staff read"
on public.implant_records for select to authenticated
using (patient_id = auth.uid() or public.is_active_staff());

create policy "clinical staff manages implant records"
on public.implant_records for all to authenticated
using (public.has_staff_role(array['owner','admin','implantologist','doctor']))
with check (public.has_staff_role(array['owner','admin','implantologist','doctor']));

-- Audit log: staff can append; only owners/admins can read.
create policy "staff appends audit"
on public.audit_logs for insert to authenticated
with check (public.is_active_staff() and actor_user_id = auth.uid());

create policy "owner admin reads audit"
on public.audit_logs for select to authenticated
using (public.has_staff_role(array['owner','admin']));

-- -----------------------------------------------------------------------------
-- Private patient document bucket.
-- Object paths must begin with the patient's auth UUID: <patient-id>/...
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('patient-documents', 'patient-documents', false)
on conflict (id) do update set public = false;

create policy "patient documents object read"
on storage.objects for select to authenticated
using (
  bucket_id = 'patient-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_active_staff()
  )
);

create policy "patient documents object upload"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'patient-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_active_staff()
  )
);

create policy "staff updates patient document objects"
on storage.objects for update to authenticated
using (bucket_id = 'patient-documents' and public.is_active_staff())
with check (bucket_id = 'patient-documents' and public.is_active_staff());

create policy "staff deletes patient document objects"
on storage.objects for delete to authenticated
using (bucket_id = 'patient-documents' and public.is_active_staff());
