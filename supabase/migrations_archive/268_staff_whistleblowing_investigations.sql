-- Staff Whistleblowing Investigations
create table if not exists public.cs_staff_whistleblowing_investigations (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  staff_name text not null,
  staff_id uuid,
  disclosure_date date not null,
  concern_category text not null,
  investigation_outcome text not null default 'ongoing',
  investigation_status text not null default 'received',
  whistleblower_protection text not null default 'confidential_disclosure',
  investigating_officer text,
  whistleblower_supported boolean not null default false,
  no_detriment_confirmed boolean not null default false,
  regulatory_body_notified boolean not null default false,
  organisational_learning_identified boolean not null default false,
  learning_shared_with_team boolean not null default false,
  policy_change_required boolean not null default false,
  completion_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_staff_whistleblowing_investigations enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_staff_whistleblowing_investigations
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
