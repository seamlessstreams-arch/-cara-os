-- Staff Retention & Exit Analysis
create table if not exists public.cs_staff_retention_exit_analysis (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  staff_name text not null,
  staff_id uuid,
  exit_date date not null,
  exit_reason text not null default 'other',
  retention_risk_level text not null default 'low',
  analysis_status text not null default 'exit_interview_scheduled',
  length_of_service_band text not null default 'under_6_months',
  exit_interview_completed boolean not null default false,
  stay_interview_completed boolean not null default false,
  counter_offer_made boolean not null default false,
  counter_offer_accepted boolean not null default false,
  notice_period_served boolean not null default false,
  knowledge_transfer_completed boolean not null default false,
  replacement_recruited boolean not null default false,
  team_impact_assessed boolean not null default false,
  exit_interview_findings text,
  retention_strategy_notes text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_staff_retention_exit_analysis enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_staff_retention_exit_analysis
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
