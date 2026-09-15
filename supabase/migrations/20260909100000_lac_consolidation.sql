-- ═══════════════════════════════════════════════════════════════════════════
-- LAC REVIEWS CONSOLIDATION (4 of 6) — statutory review capture goes live.
--
-- Canonical per the consolidation brief: cs_lac_reviews is what TWO services
-- already write — lac-review-service (the 088-shaped record: IRO, six-member
-- participation scale, domain-reviewed flags) and placement-service (the
-- 039-shaped record: chair, attendee names, plan changes, minutes). The
-- archive holds THREE competing DDLs (039, 057, 088); this table is the
-- UNION OF THE TWO REAL WRITE CONTRACTS — 057's columns nobody writes are
-- not promoted. All observation/judgement defaults stripped: a column
-- default must not answer whether the child participated, views were
-- recorded, anyone attended, or a domain was reviewed. status keeps its
-- lifecycle default 'scheduled' — the honest zero-state of a review row
-- (it exists before it is held; only completed rows project). The jsonb
-- lists carry NO '[]' default: each writer omits the other shape's columns,
-- so a default empty list would forge a recorded "none" — unrecorded must
-- stay null.
--
-- APPLIED MANUALLY after merge (ninth pending live migration).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists cs_lac_reviews (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  child_name text,
  review_type text,
  review_date date,
  status text default 'scheduled',
  -- lac-review-service shape
  next_review_due date,
  iro_name text,
  child_participation text,
  child_views_recorded boolean,
  parent_attended boolean,
  social_worker_attended boolean,
  key_worker_attended boolean,
  outcome text,
  recommendations jsonb,
  actions_agreed jsonb,
  placement_stability_discussed boolean,
  permanence_plan_reviewed boolean,
  health_reviewed boolean,
  education_reviewed boolean,
  within_timescale boolean,
  notes text,
  -- placement-service shape
  chaired_by text,
  attendees jsonb,
  outcomes jsonb,
  actions jsonb,
  child_participated boolean,
  plan_changes jsonb,
  next_review_date date,
  minutes_recorded boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cs_lac_reviews enable row level security;
create index if not exists idx_cs_lac_reviews_home on cs_lac_reviews(home_id);
drop policy if exists "Tenant isolation" on cs_lac_reviews;
create policy "Tenant isolation" on cs_lac_reviews
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cs_lac_reviews_child on cs_lac_reviews(child_id);
create index if not exists idx_cs_lac_reviews_status on cs_lac_reviews(status);
create index if not exists idx_cs_lac_reviews_date on cs_lac_reviews(review_date);
