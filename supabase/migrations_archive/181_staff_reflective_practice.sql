-- Migration: cs_staff_reflective_practice
-- Tracks staff reflective practice sessions

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_reflective_practice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  reflection_type text NOT NULL DEFAULT 'individual_reflection',
  reflection_model text NOT NULL DEFAULT 'gibbs',
  reflection_outcome text NOT NULL DEFAULT 'learning_identified',
  reflection_depth text NOT NULL DEFAULT 'moderate',
  reflection_date date NOT NULL DEFAULT now(),
  staff_name text NOT NULL DEFAULT '',
  facilitator_name text NOT NULL DEFAULT '',
  child_focused boolean NOT NULL DEFAULT true,
  values_explored boolean NOT NULL DEFAULT true,
  emotions_acknowledged boolean NOT NULL DEFAULT true,
  learning_identified boolean NOT NULL DEFAULT true,
  action_plan_created boolean NOT NULL DEFAULT false,
  practice_changed boolean NOT NULL DEFAULT false,
  shared_with_team boolean NOT NULL DEFAULT false,
  linked_to_supervision boolean NOT NULL DEFAULT false,
  linked_to_training boolean NOT NULL DEFAULT false,
  evidence_documented boolean NOT NULL DEFAULT true,
  manager_reviewed boolean NOT NULL DEFAULT false,
  child_impact_considered boolean NOT NULL DEFAULT true,
  ethical_considerations boolean NOT NULL DEFAULT false,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  session_duration_minutes integer NOT NULL DEFAULT 45,
  next_reflection_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_staff_reflective_practice_home ON cs_staff_reflective_practice(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_staff_reflective_practice_date ON cs_staff_reflective_practice(reflection_date);

ALTER TABLE cs_staff_reflective_practice ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_staff_reflective_practice_home_isolation ON cs_staff_reflective_practice;
CREATE POLICY cs_staff_reflective_practice_home_isolation ON cs_staff_reflective_practice
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_staff_reflective_practice migration: %', SQLERRM;
END $$;
