-- Home Atmosphere Assessments
create table if not exists public.cs_home_atmosphere_assessments (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  assessment_date date not null,
  atmosphere_dimension text not null,
  atmosphere_rating text not null default 'good',
  assessment_method text not null,
  action_required text not null default 'none',
  assessor_name text not null,
  child_views_included boolean not null default false,
  staff_views_included boolean not null default false,
  visitor_views_included boolean not null default false,
  improvement_actions_identified boolean not null default false,
  actions_implemented boolean not null default false,
  shared_with_children boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_home_atmosphere_assessments enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_home_atmosphere_assessments
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
