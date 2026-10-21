-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — PLACEMENT & CARE PLANNING + BEHAVIOUR SUPPORT
-- Migration 039: Placement plans, LAC reviews, behaviour entries with ABC
-- analysis, physical intervention tracking, and rewards/sanctions.
-- Reg 11/12/14 (care planning) and Reg 19/20 (behaviour/restraint).
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Placement plans ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_placement_plans (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id             uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id            uuid NOT NULL,
  plan_type           text NOT NULL
                        CHECK (plan_type IN (
                          'placement_plan','care_plan','pathway_plan',
                          'behaviour_support_plan','risk_management_plan',
                          'education_plan','health_plan','missing_protocol'
                        )),
  title               text NOT NULL,
  status              text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','active','under_review','superseded','archived')),
  version             integer NOT NULL DEFAULT 1,
  sections            jsonb NOT NULL DEFAULT '[]'::jsonb,
  objectives          jsonb NOT NULL DEFAULT '[]'::jsonb,
  placing_authority   text NOT NULL DEFAULT '',
  social_worker_name  text,
  iro_name            text,
  created_by          uuid NOT NULL,
  approved_by         uuid,
  approved_date       date,
  review_date         date,
  next_review_date    date,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_home     ON cs_placement_plans(home_id);
CREATE INDEX IF NOT EXISTS idx_plan_child    ON cs_placement_plans(child_id);
CREATE INDEX IF NOT EXISTS idx_plan_type     ON cs_placement_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_plan_status   ON cs_placement_plans(status);

-- ── Rewards and sanctions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_rewards_sanctions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id        uuid NOT NULL,
  type            text NOT NULL CHECK (type IN ('reward','sanction')),
  subtype         text NOT NULL,
  reason          text NOT NULL,
  date            date NOT NULL,
  given_by        uuid NOT NULL,
  child_response  text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rs_home    ON cs_rewards_sanctions(home_id);
CREATE INDEX IF NOT EXISTS idx_rs_child   ON cs_rewards_sanctions(child_id);
CREATE INDEX IF NOT EXISTS idx_rs_type    ON cs_rewards_sanctions(type);
CREATE INDEX IF NOT EXISTS idx_rs_date    ON cs_rewards_sanctions(date);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE cs_placement_plans   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_rewards_sanctions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY plan_home_policy ON cs_placement_plans
    USING (home_id = (select get_my_home_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY rs_home_policy ON cs_rewards_sanctions
    USING (home_id = (select get_my_home_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
