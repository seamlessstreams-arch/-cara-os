-- Staff Mandatory Refresher Training
create table if not exists public.cs_staff_mandatory_refresher_training (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  staff_name text not null,
  training_type text not null,
  completion_date date not null,
  expiry_date date not null,
  training_status text not null,
  training_provider text,
  certificate_held boolean not null default true,
  assessed_competent boolean not null default true,
  refresher_booked boolean not null default false,
  refresher_date date,
  training_hours numeric not null default 0,
  delivery_method text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_staff_mandatory_refresher_training enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_staff_mandatory_refresher_training
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
