-- Safeguarding Partnership Intelligence
create table if not exists public.cs_safeguarding_partnerships (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  child_id uuid,
  referral_date date not null,
  referral_type text not null,
  referral_outcome text not null default 'ongoing_investigation',
  partner_agency text not null,
  urgency_level text not null default 'routine',
  lead_professional text,
  strategy_discussion_held boolean not null default false,
  child_seen_alone boolean not null default false,
  child_views_recorded boolean not null default false,
  home_contributed_to_assessment boolean not null default false,
  outcome_shared_with_home boolean not null default false,
  follow_up_actions_agreed boolean not null default false,
  next_review_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_safeguarding_partnerships enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_safeguarding_partnerships
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
