-- Staff Burnout Indicators — ARIA Staff Intelligence Layer
-- Protective, not punitive. Values people. Supports people early.
-- Protects children through better management insight.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_burnout_indicators (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id          uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  staff_name       text NOT NULL,
  staff_id         uuid,
  indicator_type   text NOT NULL DEFAULT 'emotional_exhaustion',
  burnout_severity text NOT NULL DEFAULT 'early_sign',
  support_status   text NOT NULL DEFAULT 'monitoring',
  impact_level     text NOT NULL DEFAULT 'low',
  session_date     date NOT NULL DEFAULT CURRENT_DATE,
  observed_by      text NOT NULL,
  description      text NOT NULL,
  evidence_summary text NOT NULL,
  possible_causes  text,
  support_offered_detail text,
  staff_response   text,
  staff_aware              boolean NOT NULL DEFAULT false,
  manager_aware            boolean NOT NULL DEFAULT false,
  support_offered          boolean NOT NULL DEFAULT false,
  wellbeing_check_done     boolean NOT NULL DEFAULT false,
  supervision_adjusted     boolean NOT NULL DEFAULT false,
  workload_reviewed        boolean NOT NULL DEFAULT false,
  leave_offered            boolean NOT NULL DEFAULT false,
  occupational_health_referred boolean NOT NULL DEFAULT false,
  peer_support_arranged    boolean NOT NULL DEFAULT false,
  care_plan_reflects       boolean NOT NULL DEFAULT false,
  team_informed            boolean NOT NULL DEFAULT false,
  recorded_promptly        boolean NOT NULL DEFAULT true,
  issues_found     jsonb NOT NULL DEFAULT '[]',
  actions_taken    jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_staff_burnout_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_burnout_indicators_home" ON cs_staff_burnout_indicators;
CREATE POLICY "staff_burnout_indicators_home" ON cs_staff_burnout_indicators
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_staff_burnout_indicators_home ON cs_staff_burnout_indicators(home_id);
CREATE INDEX IF NOT EXISTS idx_staff_burnout_indicators_staff ON cs_staff_burnout_indicators(staff_name);

EXCEPTION WHEN others THEN RAISE NOTICE 'staff_burnout_indicators migration: %', SQLERRM;
END $$;
