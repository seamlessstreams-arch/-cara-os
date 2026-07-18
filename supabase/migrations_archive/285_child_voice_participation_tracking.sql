-- Child Voice & Participation Tracking
create table if not exists public.cs_child_voice_participation_tracking (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  child_id uuid,
  participation_date date not null,
  participation_type text not null default 'feedback_session',
  voice_outcome text not null default 'views_acknowledged',
  participation_level text not null default 'consulted',
  feedback_method text not null default 'verbal',
  child_prepared_beforehand boolean not null default false,
  child_understood_process boolean not null default false,
  child_felt_heard boolean not null default false,
  outcome_fed_back boolean not null default false,
  advocate_present boolean not null default false,
  age_appropriate_methods boolean not null default false,
  decision_changed_by_voice boolean not null default false,
  child_satisfied_with_outcome boolean not null default false,
  facilitator_name text,
  child_feedback_verbatim text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_child_voice_participation_tracking enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_child_voice_participation_tracking
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
