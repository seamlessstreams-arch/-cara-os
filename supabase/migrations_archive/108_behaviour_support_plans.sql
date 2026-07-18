-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — BEHAVIOUR SUPPORT PLANS
-- CHR 2015 Reg 19 (behaviour management — positive strategies),
-- Reg 20 (restraint — proportionate responses),
-- Reg 6 (quality and purpose of care — individual planning).
-- Tables: cs_behaviour_support_plans
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_behaviour_support_plans (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  child_id                    uuid NOT NULL,
  bsp_status                  text NOT NULL DEFAULT 'draft',
  created_date                date NOT NULL,
  review_date                 date,
  next_review_date            date,
  created_by                  text NOT NULL,
  reviewed_by                 text,
  triggers                    jsonb NOT NULL DEFAULT '[]',
  trigger_details             text,
  strategies                  jsonb NOT NULL DEFAULT '[]',
  strategy_details            text,
  positive_reinforcements     jsonb NOT NULL DEFAULT '[]',
  de_escalation_steps         jsonb NOT NULL DEFAULT '[]',
  effectiveness_rating        text NOT NULL DEFAULT 'not_yet_evaluated',
  incidents_since_last_review integer NOT NULL DEFAULT 0,
  child_involved_in_plan      boolean NOT NULL DEFAULT false,
  child_views                 text,
  parent_informed             boolean NOT NULL DEFAULT false,
  social_worker_approved      boolean NOT NULL DEFAULT false,
  psychologist_input          boolean NOT NULL DEFAULT false,
  staff_briefed               boolean NOT NULL DEFAULT false,
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bsp_home        ON cs_behaviour_support_plans(home_id);
CREATE INDEX IF NOT EXISTS idx_bsp_child       ON cs_behaviour_support_plans(child_id);
CREATE INDEX IF NOT EXISTS idx_bsp_status      ON cs_behaviour_support_plans(bsp_status);
CREATE INDEX IF NOT EXISTS idx_bsp_effective   ON cs_behaviour_support_plans(effectiveness_rating);

ALTER TABLE cs_behaviour_support_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own behaviour support plans"
    ON cs_behaviour_support_plans FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
