-- Boundary Management — CHR 2015 Reg 12, Reg 7, Reg 11
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_boundary_management (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  boundary_type text NOT NULL DEFAULT 'house_rules',
  child_response text NOT NULL DEFAULT 'accepted',
  staff_approach text NOT NULL DEFAULT 'calm_explanation',
  consistency_rating text NOT NULL DEFAULT 'fully_consistent',
  incident_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid REFERENCES children(id) ON DELETE SET NULL,
  staff_name text NOT NULL,
  boundary_explained boolean NOT NULL DEFAULT true,
  age_appropriate boolean NOT NULL DEFAULT true,
  child_voice_heard boolean NOT NULL DEFAULT true,
  trauma_informed boolean NOT NULL DEFAULT true,
  care_plan_consistent boolean NOT NULL DEFAULT true,
  relationship_maintained boolean NOT NULL DEFAULT true,
  de_escalation_used boolean NOT NULL DEFAULT false,
  restorative_offered boolean NOT NULL DEFAULT true,
  learning_identified boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT false,
  social_worker_informed boolean NOT NULL DEFAULT false,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  recorded_by text NOT NULL,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_boundary_management ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_boundary_management_home ON cs_boundary_management;
CREATE POLICY cs_boundary_management_home ON cs_boundary_management
  USING (home_id = get_my_home_id());

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
