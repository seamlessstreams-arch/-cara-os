-- ═══════════════════════════════════════════════════════════════════════════
-- RISK CONSOLIDATION (3 of 6) — the likelihood×impact capture goes live.
--
-- Canonical per the consolidation brief: cs_risk_assessments is what
-- risk-assessment-service captures; store.riskAssessments was seed-only.
-- Promoted from migrations_archive/033 under live conventions. The archive's
-- GENERATED inherent_risk_score would hard-reject the service's insert (it
-- sends the computed score explicitly) — plain integer here, the service's
-- own likelihood×impact product. status 'active' default kept (the honest
-- creation state of a new assessment); CHECKs dropped per convention.
--
-- APPLIED MANUALLY after merge (eighth pending live migration).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists cs_risk_assessments (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  category text,
  title text,
  description text,
  likelihood integer,
  impact integer,
  inherent_risk_score integer,
  current_risk_level text,
  residual_risk_level text,
  mitigations jsonb default '[]'::jsonb,
  triggers jsonb default '[]'::jsonb,
  protective_factors jsonb default '[]'::jsonb,
  status text default 'active',
  assessor_id text,
  reviewer_id text,
  review_date date,
  next_review_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cs_risk_assessments enable row level security;
create index if not exists idx_cs_risk_assessments_home on cs_risk_assessments(home_id);
drop policy if exists "Tenant isolation" on cs_risk_assessments;
create policy "Tenant isolation" on cs_risk_assessments
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cs_risk_assessments_child on cs_risk_assessments(child_id);
create index if not exists idx_cs_risk_assessments_status on cs_risk_assessments(status);
