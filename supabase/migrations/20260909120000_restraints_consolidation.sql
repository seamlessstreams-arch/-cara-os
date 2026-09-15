-- ═══════════════════════════════════════════════════════════════════════════
-- RESTRAINTS CONSOLIDATION (5 of 6) — physical-intervention capture goes live.
--
-- Canonical per the consolidation brief: cs_restraint_records is what
-- restraint-service captures; store.restraints was seed-only. Promoted with
-- cs_restraint_debriefs (restraint-debrief-service's standalone capture — no
-- FK between them by design: debriefs are recorded independently and NEVER
-- joined onto records by child+date inference).
--
-- Every judgement/observation default from the archive DDLs is stripped —
-- and this pair had the worst in the codebase: debrief_outcome defaulted to
-- 'no_concerns', child_emotional_state to 'calm', restraint_duration_minutes
-- to 5, duration_minutes to 0, injuries to '[]', every notified/completed
-- flag to FALSE, incident_date to the server's UTC day. A restraint record
-- must say only what the recorder said.
--
-- APPLIED MANUALLY after merge (tenth pending live migration).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists cs_restraint_records (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  child_name text,
  incident_date date,
  incident_time time,
  restraint_type text,
  technique_used text,
  duration_minutes integer,
  staff_involved jsonb,
  antecedent text,
  behaviour_description text,
  de_escalation_attempted jsonb,
  outcome text,
  injuries_child jsonb,
  injuries_staff jsonb,
  body_map_completed boolean,
  child_views_obtained boolean,
  child_views text,
  debrief_completed boolean,
  debrief_date date,
  debrief_notes text,
  manager_reviewed boolean,
  manager_review_date date,
  manager_review_notes text,
  ofsted_notified boolean,
  parent_carer_notified boolean,
  social_worker_notified boolean,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cs_restraint_records enable row level security;
create index if not exists idx_cs_restraint_records_home on cs_restraint_records(home_id);
drop policy if exists "Tenant isolation" on cs_restraint_records;
create policy "Tenant isolation" on cs_restraint_records
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cs_restraint_records_child on cs_restraint_records(child_id);
create index if not exists idx_cs_restraint_records_date on cs_restraint_records(incident_date);

create table if not exists cs_restraint_debriefs (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  debrief_type text,
  restraint_type text,
  debrief_outcome text,
  child_emotional_state text,
  debrief_date date,
  child_name text,
  child_id text,
  staff_involved text,
  child_debrief_completed boolean,
  staff_debrief_completed boolean,
  medical_check_done boolean,
  body_map_completed boolean,
  ofsted_notified boolean,
  social_worker_notified boolean,
  parent_notified boolean,
  witness_statements_taken boolean,
  cctv_reviewed boolean,
  proportionate_response boolean,
  learning_documented boolean,
  plan_updated boolean,
  issues_found jsonb,
  actions_taken jsonb,
  debriefed_by text,
  restraint_duration_minutes integer,
  next_review_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cs_restraint_debriefs enable row level security;
create index if not exists idx_cs_restraint_debriefs_home on cs_restraint_debriefs(home_id);
drop policy if exists "Tenant isolation" on cs_restraint_debriefs;
create policy "Tenant isolation" on cs_restraint_debriefs
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cs_restraint_debriefs_child on cs_restraint_debriefs(child_id);
create index if not exists idx_cs_restraint_debriefs_date on cs_restraint_debriefs(debrief_date);
