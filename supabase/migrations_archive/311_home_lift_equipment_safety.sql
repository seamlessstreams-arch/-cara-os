-- Home Lift Equipment Safety
create table if not exists public.cs_home_lift_equipment_safety (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  inspection_date date not null,
  inspector_name text not null,
  equipment_type text not null,
  equipment_location text not null,
  inspection_type text not null,
  result text not null,
  defects_found integer not null default 0,
  remedial_completed boolean not null default false,
  certificate_issued boolean not null default true,
  safe_working_load_confirmed boolean not null default true,
  next_inspection_date date,
  compliance_status text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_home_lift_equipment_safety enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_home_lift_equipment_safety
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
