-- Staff Return-to-Work Interview
create table if not exists public.cs_staff_return_to_work_interviews (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  staff_name text not null,
  interview_date date not null,
  absence_type text not null,
  absence_duration_days integer not null,
  interviewer_name text not null,
  fit_to_return boolean not null default true,
  phased_return boolean not null default false,
  adjustments_required boolean not null default false,
  adjustment_details text,
  occupational_health_referral boolean not null default false,
  support_plan_agreed boolean not null default false,
  trigger_level_reached boolean not null default false,
  trigger_level text,
  welfare_check_completed boolean not null default true,
  follow_up_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_staff_return_to_work_interviews enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_staff_return_to_work_interviews
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
