-- Staff Development Plans — ARIA Staff Intelligence Layer
-- Evidence-based development plans. Strengths-based, fair, contextual.
-- Turns evidence into practical development with staff consultation.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_development_plans (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id          uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  staff_name       text NOT NULL,
  staff_id         uuid,
  development_area text NOT NULL DEFAULT 'communication',
  plan_status      text NOT NULL DEFAULT 'draft',
  approval_status  text NOT NULL DEFAULT 'pending',
  priority_level   text NOT NULL DEFAULT 'medium',
  session_date     date NOT NULL DEFAULT CURRENT_DATE,
  created_by       text NOT NULL,
  development_area_detail text NOT NULL,
  evidence_summary text NOT NULL,
  possible_underlying_reason text,
  impact_description text,
  strengths_to_build_on text,
  manager_support_actions text,
  staff_actions_detail text,
  training_required text,
  mentoring_detail text,
  success_measures text,
  staff_response   text,
  approved_by      text,
  approved_at      timestamptz,
  evidence_based           boolean NOT NULL DEFAULT false,
  strengths_identified     boolean NOT NULL DEFAULT false,
  staff_consulted          boolean NOT NULL DEFAULT false,
  manager_actions_set      boolean NOT NULL DEFAULT false,
  staff_actions_set        boolean NOT NULL DEFAULT false,
  training_identified      boolean NOT NULL DEFAULT false,
  mentoring_arranged       boolean NOT NULL DEFAULT false,
  success_measures_set     boolean NOT NULL DEFAULT false,
  review_date_set          boolean NOT NULL DEFAULT false,
  staff_agreed             boolean NOT NULL DEFAULT false,
  approved_by_senior       boolean NOT NULL DEFAULT false,
  recorded_promptly        boolean NOT NULL DEFAULT true,
  issues_found     jsonb NOT NULL DEFAULT '[]',
  actions_taken    jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_staff_development_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_development_plans_home" ON cs_staff_development_plans;
CREATE POLICY "staff_development_plans_home" ON cs_staff_development_plans
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_staff_development_plans_home ON cs_staff_development_plans(home_id);
CREATE INDEX IF NOT EXISTS idx_staff_development_plans_staff ON cs_staff_development_plans(staff_name);

EXCEPTION WHEN others THEN RAISE NOTICE 'staff_development_plans migration: %', SQLERRM;
END $$;
