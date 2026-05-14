-- 216: Behaviour Pattern Analysis
-- CHR 2015 Reg 19 (behaviour management — positive strategies), Reg 20 (restraint — as last resort only)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_behaviour_pattern_analysis (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  behaviour_category text NOT NULL DEFAULT 'other',
  trigger_type text NOT NULL DEFAULT 'unknown',
  intervention_outcome text NOT NULL DEFAULT 'de_escalated',
  behaviour_severity text NOT NULL DEFAULT 'low',
  incident_date date NOT NULL DEFAULT now(),
  child_name   text NOT NULL DEFAULT '',
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  staff_involved text NOT NULL DEFAULT '',
  trigger_identified boolean NOT NULL DEFAULT true,
  de_escalation_attempted boolean NOT NULL DEFAULT true,
  child_views_sought boolean NOT NULL DEFAULT true,
  debrief_completed boolean NOT NULL DEFAULT true,
  pattern_identified boolean NOT NULL DEFAULT true,
  care_plan_updated boolean NOT NULL DEFAULT true,
  risk_assessment_updated boolean NOT NULL DEFAULT true,
  positive_strategies_used boolean NOT NULL DEFAULT true,
  therapeutic_input_considered boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_behaviour_pattern_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "behaviour_pattern_analysis_home" ON cs_behaviour_pattern_analysis;
CREATE POLICY "behaviour_pattern_analysis_home" ON cs_behaviour_pattern_analysis
  FOR ALL USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 216 idempotent: %', SQLERRM;
END $$;
