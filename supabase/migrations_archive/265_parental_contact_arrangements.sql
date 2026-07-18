-- Parental Contact Arrangements
create table if not exists public.cs_parental_contact_arrangements (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  child_id uuid,
  contact_date date not null,
  contact_type text not null,
  contact_outcome text not null default 'positive',
  court_order_status text not null default 'agreed_informally',
  child_experience text not null default 'happy_engaged',
  parent_carer_name text not null,
  duration_minutes integer not null default 0,
  supervised boolean not null default false,
  supervisor_name text,
  court_order_complied boolean not null default true,
  child_views_before boolean not null default false,
  child_views_after boolean not null default false,
  social_worker_informed boolean not null default false,
  recorded_in_care_plan boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_parental_contact_arrangements enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_parental_contact_arrangements
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
