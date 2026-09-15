-- ═══════════════════════════════════════════════════════════════════════════
-- BEHAVIOUR CONSOLIDATION (2 of 6) — the ABC capture goes live.
--
-- Canonical per the consolidation brief: cs_behaviour_entries is what
-- behaviour-service captures (full ABC model + de-escalation + physical-
-- intervention tracking); store.behaviourLog was a seed-only intelligence
-- shape. Promoted from migrations_archive/039_placement_behaviour.sql under
-- live conventions. Judgement/observation defaults are STRIPPED per doctrine:
-- de_escalation_effective (a false default asserts failure),
-- physical_intervention and pi_debrief_completed (harm-observation and
-- completion claims must be recorded, never assumed) — the capture service
-- writes every one explicitly.
--
-- APPLIED MANUALLY after merge (seventh pending live migration).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists cs_behaviour_entries (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  date date,
  time time,
  category text,
  description text,
  antecedent text,
  behaviour text,
  consequence text,
  de_escalation_used jsonb default '[]'::jsonb,
  de_escalation_effective boolean,
  physical_intervention boolean,
  pi_technique text,
  pi_duration_minutes integer,
  pi_staff_involved jsonb default '[]'::jsonb,
  pi_injuries_child boolean,
  pi_injuries_staff boolean,
  pi_debrief_completed boolean,
  pi_debrief_date date,
  outcome text,
  recorded_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cs_behaviour_entries enable row level security;
create index if not exists idx_cs_behaviour_entries_home on cs_behaviour_entries(home_id);
drop policy if exists "Tenant isolation" on cs_behaviour_entries;
create policy "Tenant isolation" on cs_behaviour_entries
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cs_behaviour_entries_child on cs_behaviour_entries(child_id);
create index if not exists idx_cs_behaviour_entries_date on cs_behaviour_entries(date);
