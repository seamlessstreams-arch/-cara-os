-- Reg 44 Independent Visitor Reports
create table if not exists public.cs_reg44_independent_visitor_reports (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  visitor_name text not null,
  visit_date date not null,
  report_date date not null,
  area_inspected text not null,
  finding_severity text not null,
  finding_summary text not null,
  recommendation text,
  action_status text not null default 'not_started',
  report_status text not null default 'draft',
  children_spoken_to integer not null default 0,
  staff_spoken_to integer not null default 0,
  records_reviewed boolean not null default false,
  previous_actions_followed_up boolean not null default false,
  child_views_captured boolean not null default false,
  manager_response text,
  response_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_reg44_independent_visitor_reports enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_reg44_independent_visitor_reports
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
