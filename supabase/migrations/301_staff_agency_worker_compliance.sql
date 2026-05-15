-- Staff Agency Worker Compliance
create table if not exists public.cs_staff_agency_worker_compliance (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  staff_name text not null,
  agency_name text not null,
  start_date date not null,
  end_date date,
  compliance_status text not null,
  dbs_verified boolean not null default false,
  references_verified boolean not null default false,
  qualifications_verified boolean not null default false,
  induction_completed boolean not null default false,
  safeguarding_training_confirmed boolean not null default false,
  mandatory_training_confirmed boolean not null default false,
  id_verified boolean not null default true,
  right_to_work_verified boolean not null default true,
  supervision_arranged boolean not null default false,
  shift_count integer not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_staff_agency_worker_compliance enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_staff_agency_worker_compliance
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
