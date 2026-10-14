-- ════════════════════════════════════════════════════════════════════════════
-- Persistence: child_pace_profiles ("what works for this child" — PACE).
--
-- The typed DAL reads and upserts a child's PACE profile (known triggers,
-- calming approaches, trusted adults, phrases that help / escalate, sensory
-- needs, repair approaches, trauma-informed strategies), but no migration backed
-- it — so on a live tenant the profile a shift reads WHILE a child is escalating
-- was empty, and an edit saved only for the life of the serverless instance.
--
-- Schema mirrors the archived 418_pace_intelligence design, with home_id
-- reconciled from uuid-NOT-NULL to a nullable uuid that matches get_my_home_id()
-- and the live homes table (the app writer injects the home uuid on upsert). Only
-- this one table is promoted; 418's sibling tables are out of scope.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists child_pace_profiles (
  child_id                      text primary key,
  home_id                       uuid,
  known_triggers                jsonb not null default '[]',
  calming_approaches            jsonb not null default '[]',
  trusted_adults                jsonb not null default '[]',
  phrases_that_help             jsonb not null default '[]',
  phrases_that_escalate         jsonb not null default '[]',
  sensory_needs                 jsonb not null default '[]',
  repair_approaches             jsonb not null default '[]',
  preferred_debrief_style       text,
  trauma_informed_strategies    jsonb not null default '[]',
  risk_linked_escalation_rules  jsonb not null default '[]',
  updated_by                    text,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

alter table child_pace_profiles enable row level security;

create index if not exists idx_child_pace_profiles_home on child_pace_profiles(home_id);

-- Defence in depth (the server reads as service_role, which bypasses RLS; this
-- scopes any future authenticated/anon access to the caller's own home).
drop policy if exists "Tenant isolation" on child_pace_profiles;
create policy "Tenant isolation" on child_pace_profiles
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
