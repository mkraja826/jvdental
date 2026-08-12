create table public.assistant_knowledge (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null check (category in ('clinic','implants','guided_implants','international','travel','appointments','pricing_policy','dental_education','safety')),
  content text not null,
  keywords text[] not null default '{}',
  is_verified boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.staff_profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assistant_knowledge_active_category_idx on public.assistant_knowledge(is_active, category);

create table public.assistant_sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_token uuid not null unique,
  locale text not null default 'en',
  country_hint text,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  message_count integer not null default 0 check (message_count >= 0),
  high_intent boolean not null default false,
  converted_to_patient boolean not null default false
);
create index assistant_sessions_last_activity_idx on public.assistant_sessions(last_activity_at desc);

create table public.assistant_messages (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.assistant_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  body text not null check (char_length(body) between 1 and 6000),
  intent text,
  safety_classification text check (safety_classification is null or safety_classification in ('general','clinic','clinical_education','diagnosis_request','medication_request','emergency','high_intent','travel','pricing')),
  model_provider text,
  model_name text,
  created_at timestamptz not null default now()
);
create index assistant_messages_session_created_idx on public.assistant_messages(session_id, created_at);

create table public.assistant_handoffs (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.assistant_sessions(id) on delete cascade,
  handoff_type text not null check (handoff_type in ('implant_assessment','patient_login','doctor_review','emergency_care','appointment')),
  reason text,
  created_at timestamptz not null default now()
);
create index assistant_handoffs_session_idx on public.assistant_handoffs(session_id, created_at desc);

create table public.assistant_feedback (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.assistant_sessions(id) on delete cascade,
  message_id bigint references public.assistant_messages(id) on delete set null,
  helpful boolean not null,
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now()
);

create trigger assistant_knowledge_touch_updated_at before update on public.assistant_knowledge for each row execute function public.touch_updated_at();

alter table public.assistant_knowledge enable row level security;
alter table public.assistant_sessions enable row level security;
alter table public.assistant_messages enable row level security;
alter table public.assistant_handoffs enable row level security;
alter table public.assistant_feedback enable row level security;

create policy "staff reads assistant knowledge" on public.assistant_knowledge for select to authenticated using (private.is_active_staff());
create policy "clinical content staff manages assistant knowledge" on public.assistant_knowledge for all to authenticated using (private.has_staff_role(array['owner','admin','implantologist','doctor'])) with check (private.has_staff_role(array['owner','admin','implantologist','doctor']));
create policy "owner admin reads assistant sessions" on public.assistant_sessions for select to authenticated using (private.has_staff_role(array['owner','admin']));
create policy "owner admin reads assistant messages" on public.assistant_messages for select to authenticated using (private.has_staff_role(array['owner','admin']));
create policy "owner admin reads assistant handoffs" on public.assistant_handoffs for select to authenticated using (private.has_staff_role(array['owner','admin']));
create policy "owner admin reads assistant feedback" on public.assistant_feedback for select to authenticated using (private.has_staff_role(array['owner','admin']));

grant select on public.assistant_knowledge to authenticated;
grant select on public.assistant_sessions to authenticated;
grant select on public.assistant_messages to authenticated;
grant select on public.assistant_handoffs to authenticated;
grant select on public.assistant_feedback to authenticated;
grant insert, update, delete on public.assistant_knowledge to authenticated;

insert into public.assistant_knowledge (slug,title,category,content,keywords,is_verified) values
('guided-implants-dionavi','DIOnavi guided implant surgery','guided_implants','JV Dental uses DIOnavi technology for guided implant workflows. Guided implant treatment uses digital records and planning to support precise implant positioning. A patient-specific recommendation still requires review by the implantologist.','{dionavi,guided implant,guided surgery,digital implant,implant planning}',true),
('international-assessment','International implant assessment','international','International patients can begin remotely by creating a patient account, completing medical and dental history, and uploading available OPG, CBCT, X-rays, photographs or prior treatment records. The clinic can then review the case before travel planning.','{international patient,overseas,foreign patient,assessment,opg,cbct,xray,travel}',true),
('clinical-boundary','Online information is preliminary','safety','The JV Dental assistant provides clinic information and general dental education only. It does not diagnose a patient, interpret an individual X-ray or CBCT, prescribe medication, or promise a treatment outcome. Personal treatment recommendations require clinician review.','{diagnosis,xray,cbct,prescription,medicine,treatment recommendation}',true),
('emergency-boundary','Urgent dental symptoms','safety','Severe facial swelling, difficulty breathing or swallowing, uncontrolled bleeding, significant trauma, or severe symptoms with fever can require urgent in-person assessment. The assistant should direct the person to urgent local dental or medical care rather than continue routine chatbot advice.','{emergency,swelling,breathing,swallowing,bleeding,trauma,fever}',true),
('estimate-policy','Treatment estimates','pricing_policy','Implant costs vary with the number of implants, bone condition, prosthetic design, grafting needs, diagnostics and other clinical factors. Any website or chatbot amount is only indicative; a patient-specific preliminary estimate is prepared after appropriate records and clinician review.','{price,cost,estimate,quote,full mouth,implant cost}',true),
('implant-education','Dental implant basics','dental_education','A dental implant is a component placed in the jaw to support a replacement tooth or prosthesis. Treatment planning can involve bone assessment, restorative planning and evaluation of medical and dental history. Healing time and the number of visits vary by case.','{dental implant,implant,tooth replacement,healing}',true),
('full-mouth-education','Full-mouth implant rehabilitation','dental_education','Full-mouth implant rehabilitation can use multiple implants to support a fixed prosthesis. The number and position of implants, need for grafting, immediate loading suitability and prosthetic design depend on the individual clinical situation and imaging.','{full mouth,all on 4,all-on-4,all on 6,all-on-6,fixed teeth}',true)
on conflict (slug) do update set title=excluded.title, category=excluded.category, content=excluded.content, keywords=excluded.keywords, is_verified=excluded.is_verified, is_active=true;
