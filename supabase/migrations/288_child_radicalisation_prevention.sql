-- Child Radicalisation Prevention (Prevent Duty)
create table if not exists public.cs_child_radicalisation_prevention (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  child_id uuid,
  assessment_date date not null,
  vulnerability_level text not null default 'no_identified_risk',
  referral_outcome text not null default 'no_referral_needed',
  assessment_status text not null default 'initial_screening',
  concern_type text not null default 'mixed_ideology',
  prevent_training_completed boolean not null default false,
  online_activity_monitored boolean not null default false,
  channel_referral_made boolean not null default false,
  multi_agency_involved boolean not null default false,
  child_views_obtained boolean not null default false,
  family_engaged boolean not null default false,
  safety_plan_in_place boolean not null default false,
  ideology_challenged boolean not null default false,
  assessor_name text,
  vulnerability_indicators text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_child_radicalisation_prevention enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_child_radicalisation_prevention
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
