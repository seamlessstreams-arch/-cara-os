-- Child Substance Misuse Screening
create table if not exists public.cs_child_substance_misuse_screenings (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  screening_date date not null,
  substance_type text not null,
  screening_outcome text not null,
  intervention_type text,
  referral_made boolean not null default false,
  referral_agency text,
  risk_assessment_completed boolean not null default false,
  safety_plan_in_place boolean not null default false,
  parental_notification boolean not null default false,
  social_worker_notified boolean not null default false,
  follow_up_date date,
  assessor_name text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_child_substance_misuse_screenings enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_child_substance_misuse_screenings
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
