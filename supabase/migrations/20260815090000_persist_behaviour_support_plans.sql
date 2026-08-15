-- ─────────────────────────────────────────────────────────────────────────
-- Persistence: behaviour_support_plans.
--
-- The typed DAL creates and updates behaviour support plans, but no migration
-- ever created the table, so both writes fell through to the in-memory store.
-- That store is per-serverless-instance: on the live tenant a plan — and the
-- clinical detail added to it — survived only until the next cold start.
--
-- A behaviour support plan is what staff read while a child is escalating.
-- It is the one record that must still be there tomorrow.
--
-- Shape follows BehaviourSupportPlan in src/types/extended.ts. The ten nested
-- clinical shapes (primary_behaviours, known_triggers, de_escalation,
-- positive_strategies, rewards, boundaries, safety_plan, professional_input,
-- restrictive_interventions, review_history) are arrays of objects, so they
-- are jsonb with a '[]' default — an absent section reads as empty rather
-- than null, matching what the plan view already expects. The plain string
-- lists (diagnosis, early_warnings, staff_guidance) are text[].
--
-- Columns are nullable except id (house convention from
-- 20260722120000_persist_typed_tables.sql: a write must never fail on an
-- omitted field), and id is text to accept the app-generated "bsp_*" ids
-- alongside uuids. RLS on with the tenant policy — the app queries as
-- service_role and bypasses RLS, so this protects anyone holding the anon key.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists behaviour_support_plans (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  created_date text,
  created_by text,
  review_date text,
  last_reviewed text,
  status text,
  diagnosis text[] default '{}',
  primary_behaviours jsonb default '[]'::jsonb,
  known_triggers jsonb default '[]'::jsonb,
  early_warnings text[] default '{}',
  de_escalation jsonb default '[]'::jsonb,
  positive_strategies jsonb default '[]'::jsonb,
  rewards jsonb default '[]'::jsonb,
  boundaries jsonb default '[]'::jsonb,
  safety_plan jsonb default '[]'::jsonb,
  communication_needs text,
  sensory_considerations text,
  child_views text,
  parent_views text,
  professional_input jsonb default '[]'::jsonb,
  staff_guidance text[] default '{}',
  restrictive_interventions jsonb default '[]'::jsonb,
  review_history jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by text
);

alter table behaviour_support_plans enable row level security;

create index if not exists idx_behaviour_support_plans_home on behaviour_support_plans(home_id);
create index if not exists idx_behaviour_support_plans_child on behaviour_support_plans(child_id);

drop policy if exists "Tenant isolation" on behaviour_support_plans;
create policy "Tenant isolation" on behaviour_support_plans
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
