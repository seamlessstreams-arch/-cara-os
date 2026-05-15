-- Staff Secondment Management
create table if not exists public.cs_staff_secondment_management (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  staff_name text not null,
  secondment_type text not null,
  sending_organisation text not null,
  receiving_organisation text not null,
  start_date date not null,
  end_date date,
  status text not null,
  agreement_signed boolean not null default false,
  dbs_transferred boolean not null default false,
  induction_completed boolean not null default false,
  supervision_arranged boolean not null default false,
  objectives_agreed boolean not null default false,
  review_date date,
  extension_requested boolean not null default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_staff_secondment_management enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_staff_secondment_management
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
