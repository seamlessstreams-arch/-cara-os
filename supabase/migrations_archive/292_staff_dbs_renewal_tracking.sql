-- Staff DBS Renewal Tracking
create table if not exists public.cs_staff_dbs_renewal_tracking (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  staff_name text not null,
  staff_id uuid,
  check_date date not null,
  dbs_type text not null default 'enhanced',
  dbs_status text not null default 'current',
  check_outcome text not null default 'clear',
  renewal_priority text not null default 'routine',
  dbs_number text,
  issue_date date not null,
  renewal_date date,
  enhanced_check_completed boolean not null default false,
  barred_list_checked boolean not null default false,
  update_service_registered boolean not null default false,
  identity_verified boolean not null default false,
  right_to_work_confirmed boolean not null default false,
  risk_assessment_completed boolean not null default false,
  overseas_check_completed boolean not null default false,
  references_verified boolean not null default false,
  reviewer_name text,
  disclosed_information text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_staff_dbs_renewal_tracking enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_staff_dbs_renewal_tracking
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
