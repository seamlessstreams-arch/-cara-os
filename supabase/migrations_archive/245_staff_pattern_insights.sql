-- Staff Pattern Insights — ARIA Staff Intelligence Layer
-- CHR 2015 Reg 13 (leadership), Reg 33 (employment), Reg 34 (fitness), Reg 35 (supervision)
-- Strengths-based, fair, contextual, evidence-led. ARIA suggests. Humans decide.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_pattern_insights (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id          uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  staff_name       text NOT NULL,
  staff_id         uuid,
  insight_type     text NOT NULL DEFAULT 'repeated_concern',
  insight_severity text NOT NULL DEFAULT 'needs_exploration',
  confidence_level text NOT NULL DEFAULT 'medium',
  insight_status   text NOT NULL DEFAULT 'draft',
  session_date     date NOT NULL DEFAULT CURRENT_DATE,
  identified_by    text NOT NULL,
  title            text NOT NULL,
  description      text NOT NULL,
  evidence_summary text NOT NULL,
  period_start     date,
  period_end       date,
  context          text,
  alternative_explanations text,
  manager_notes    text,
  staff_comment    text,
  evidence_verified                  boolean NOT NULL DEFAULT false,
  context_provided                   boolean NOT NULL DEFAULT false,
  alternative_explanations_considered boolean NOT NULL DEFAULT false,
  manager_reviewed                   boolean NOT NULL DEFAULT false,
  staff_notified                     boolean NOT NULL DEFAULT false,
  staff_commented                    boolean NOT NULL DEFAULT false,
  action_plan_created                boolean NOT NULL DEFAULT false,
  support_offered                    boolean NOT NULL DEFAULT false,
  training_identified                boolean NOT NULL DEFAULT false,
  supervision_discussed              boolean NOT NULL DEFAULT false,
  wellbeing_checked                  boolean NOT NULL DEFAULT false,
  recorded_promptly                  boolean NOT NULL DEFAULT true,
  issues_found     jsonb NOT NULL DEFAULT '[]',
  actions_taken    jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_staff_pattern_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_pattern_insights_home" ON cs_staff_pattern_insights;
CREATE POLICY "staff_pattern_insights_home" ON cs_staff_pattern_insights
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_staff_pattern_insights_home ON cs_staff_pattern_insights(home_id);
CREATE INDEX IF NOT EXISTS idx_staff_pattern_insights_staff ON cs_staff_pattern_insights(staff_name);

EXCEPTION WHEN others THEN RAISE NOTICE 'staff_pattern_insights migration: %', SQLERRM;
END $$;
