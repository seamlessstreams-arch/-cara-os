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
  trigger_identified boolean,
  de_escalation_attempted boolean,
  child_views_sought boolean,
  debrief_completed boolean,
  pattern_identified boolean,
  care_plan_updated boolean,
  risk_assessment_updated boolean,
  positive_strategies_used boolean,
  therapeutic_input_considered boolean,
  social_worker_informed boolean,
  parent_informed boolean,
  recorded_promptly boolean,
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
