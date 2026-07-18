-- Medication Incident Reporting
create table if not exists public.cs_medication_incident_reports (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  child_id uuid,
  incident_date date not null,
  incident_type text not null,
  incident_severity text not null default 'no_harm',
  investigation_status text not null default 'reported',
  contributing_factor text not null,
  staff_involved text not null,
  medication_name text not null,
  gp_notified boolean not null default false,
  parent_notified boolean not null default false,
  social_worker_notified boolean not null default false,
  ofsted_notified boolean not null default false,
  root_cause_identified boolean not null default false,
  learning_shared boolean not null default false,
  duty_of_candour_applied boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_medication_incident_reports enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_medication_incident_reports
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
