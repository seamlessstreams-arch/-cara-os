-- Staff Professional Registration
create table if not exists public.cs_staff_professional_registrations (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  staff_name text not null,
  professional_body text not null,
  registration_number text not null,
  registration_status text not null,
  registration_date date not null,
  expiry_date date,
  pin_verified boolean not null default false,
  pin_verification_date date,
  cpd_hours_completed numeric not null default 0,
  cpd_hours_required numeric not null default 0,
  fitness_to_practise_clear boolean not null default true,
  conditions_on_registration boolean not null default false,
  renewal_submitted boolean not null default false,
  renewal_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_staff_professional_registrations enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_staff_professional_registrations
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
