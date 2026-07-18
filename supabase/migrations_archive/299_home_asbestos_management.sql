-- Home Asbestos Management
create table if not exists public.cs_home_asbestos_management (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  survey_date date not null,
  surveyor_name text not null,
  location text not null,
  asbestos_type text not null,
  condition_rating text not null,
  risk_score integer not null default 0,
  management_action text not null,
  management_plan_in_place boolean not null default false,
  register_updated boolean not null default true,
  staff_awareness_confirmed boolean not null default false,
  labelling_in_place boolean not null default false,
  reinspection_date date,
  compliance_status text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_home_asbestos_management enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_home_asbestos_management
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
