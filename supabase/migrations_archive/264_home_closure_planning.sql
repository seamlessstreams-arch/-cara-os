-- Home Closure Planning
create table if not exists public.cs_home_closure_planning (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  closure_reason text not null,
  closure_phase text not null default 'pre_planning',
  planned_closure_date date not null,
  actual_closure_date date,
  child_name text not null,
  child_id uuid,
  child_transfer_status text not null default 'not_started',
  receiving_home text,
  stakeholder_notified text not null,
  notification_date date,
  child_views_sought boolean not null default false,
  child_wishes_documented boolean not null default false,
  staff_consultation_completed boolean not null default false,
  regulatory_notification_sent boolean not null default false,
  transition_plan_in_place boolean not null default false,
  risk_assessment_completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_home_closure_planning enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_home_closure_planning
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
