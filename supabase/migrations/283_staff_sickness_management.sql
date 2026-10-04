-- Staff Sickness Management
create table if not exists public.cs_staff_sickness_management (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  staff_name text not null,
  staff_id uuid,
  absence_start_date date not null,
  absence_end_date date,
  absence_type text not null default 'short_term',
  management_status text not null default 'reported',
  trigger_level text not null default 'none',
  fit_note_status text not null default 'not_required',
  days_absent integer not null default 0,
  return_to_work_completed boolean not null default false,
  occupational_health_referred boolean not null default false,
  reasonable_adjustments_made boolean not null default false,
  phased_return_agreed boolean not null default false,
  manager_informed boolean not null default false,
  cover_arranged boolean not null default false,
  impact_on_children_assessed boolean not null default false,
  wellbeing_check_completed boolean not null default false,
  managing_officer text,
  absence_reason_detail text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_staff_sickness_management enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_staff_sickness_management
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
