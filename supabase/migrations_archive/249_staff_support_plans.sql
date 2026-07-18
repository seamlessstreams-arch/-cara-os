-- Staff Support Plans — ARIA Staff Intelligence Layer
-- Supportive, pre-formal plans. Shows care, fairness and evidence.
-- Created before things become formal — early intervention.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_support_plans (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id          uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  staff_name       text NOT NULL,
  staff_id         uuid,
  concern_area     text NOT NULL DEFAULT 'wellbeing',
  plan_status      text NOT NULL DEFAULT 'draft',
  approval_status  text NOT NULL DEFAULT 'pending',
  supervision_frequency text NOT NULL DEFAULT 'fortnightly',
  session_date     date NOT NULL DEFAULT CURRENT_DATE,
  created_by       text NOT NULL,
  what_is_working_well text NOT NULL,
  what_we_are_worried_about text NOT NULL,
  what_needs_to_improve text NOT NULL,
  support_being_offered text,
  wellbeing_considerations text,
  reasonable_adjustments text,
  mentor_buddy     text,
  timescale        text,
  staff_response   text,
  approved_by      text,
  approved_at      timestamptz,
  what_working_well_recorded boolean NOT NULL DEFAULT false,
  concerns_documented        boolean NOT NULL DEFAULT false,
  improvements_identified    boolean NOT NULL DEFAULT false,
  support_offered            boolean NOT NULL DEFAULT false,
  wellbeing_considered       boolean NOT NULL DEFAULT false,
  adjustments_offered        boolean NOT NULL DEFAULT false,
  mentor_assigned            boolean NOT NULL DEFAULT false,
  staff_consulted            boolean NOT NULL DEFAULT false,
  staff_agreed               boolean NOT NULL DEFAULT false,
  review_date_set            boolean NOT NULL DEFAULT false,
  approved_by_senior         boolean NOT NULL DEFAULT false,
  recorded_promptly          boolean NOT NULL DEFAULT true,
  issues_found     jsonb NOT NULL DEFAULT '[]',
  actions_taken    jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_staff_support_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_support_plans_home" ON cs_staff_support_plans;
CREATE POLICY "staff_support_plans_home" ON cs_staff_support_plans
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_staff_support_plans_home ON cs_staff_support_plans(home_id);
CREATE INDEX IF NOT EXISTS idx_staff_support_plans_staff ON cs_staff_support_plans(staff_name);

EXCEPTION WHEN others THEN RAISE NOTICE 'staff_support_plans migration: %', SQLERRM;
END $$;
