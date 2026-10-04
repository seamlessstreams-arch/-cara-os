-- Staff Conflict of Interest
create table if not exists public.cs_staff_conflict_of_interest (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  staff_name text not null,
  staff_id uuid,
  declaration_date date not null,
  conflict_type text not null,
  risk_level text not null default 'none_identified',
  mitigation_status text not null default 'not_required',
  declaration_status text not null default 'submitted',
  conflict_description text not null,
  mitigation_plan text,
  reviewed_by text,
  annual_review_completed boolean not null default false,
  manager_aware boolean not null default false,
  documented_in_file boolean not null default false,
  no_impact_on_children_confirmed boolean not null default false,
  organisational_learning boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_staff_conflict_of_interest enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_staff_conflict_of_interest
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
