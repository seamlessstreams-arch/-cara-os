-- Staff Performance Dips — ARIA Staff Intelligence Layer
-- Uses soft, human language: possible dip, pattern emerging, needs exploration
-- Never punitive labels. Supports managers to think fairly.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_performance_dips (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id          uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  staff_name       text NOT NULL,
  staff_id         uuid,
  dip_category     text NOT NULL DEFAULT 'recording_quality',
  dip_severity     text NOT NULL DEFAULT 'possible_dip',
  dip_status       text NOT NULL DEFAULT 'identified',
  frequency_pattern text NOT NULL DEFAULT 'unknown',
  session_date     date NOT NULL DEFAULT CURRENT_DATE,
  identified_by    text NOT NULL,
  description      text NOT NULL,
  evidence_summary text NOT NULL,
  possible_triggers text,
  support_offered_detail text,
  manager_response text,
  staff_response   text,
  evidence_documented    boolean NOT NULL DEFAULT false,
  manager_aware          boolean NOT NULL DEFAULT false,
  staff_informed         boolean NOT NULL DEFAULT false,
  support_offered        boolean NOT NULL DEFAULT false,
  triggers_explored      boolean NOT NULL DEFAULT false,
  supervision_discussed  boolean NOT NULL DEFAULT false,
  training_considered    boolean NOT NULL DEFAULT false,
  wellbeing_assessed     boolean NOT NULL DEFAULT false,
  action_plan_created    boolean NOT NULL DEFAULT false,
  staff_responded        boolean NOT NULL DEFAULT false,
  follow_up_scheduled    boolean NOT NULL DEFAULT false,
  recorded_promptly      boolean NOT NULL DEFAULT true,
  issues_found     jsonb NOT NULL DEFAULT '[]',
  actions_taken    jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_staff_performance_dips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_performance_dips_home" ON cs_staff_performance_dips;
CREATE POLICY "staff_performance_dips_home" ON cs_staff_performance_dips
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_staff_performance_dips_home ON cs_staff_performance_dips(home_id);
CREATE INDEX IF NOT EXISTS idx_staff_performance_dips_staff ON cs_staff_performance_dips(staff_name);

EXCEPTION WHEN others THEN RAISE NOTICE 'staff_performance_dips migration: %', SQLERRM;
END $$;
