-- Migration: cs_home_decoration_personalisation
-- Tracks children's bedroom and communal space personalisation

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_home_decoration_personalisation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  personalisation_type text NOT NULL DEFAULT 'bedroom_decoration',
  satisfaction_level text NOT NULL DEFAULT 'satisfied',
  personalisation_scope text NOT NULL DEFAULT 'bedroom_only',
  budget_status text NOT NULL DEFAULT 'within_budget',
  assessment_date date NOT NULL DEFAULT now(),
  child_name text NOT NULL DEFAULT '',
  child_id uuid,
  assessed_by text NOT NULL DEFAULT '',
  child_chose boolean NOT NULL DEFAULT true,
  child_involved_planning boolean NOT NULL DEFAULT true,
  reflects_identity boolean NOT NULL DEFAULT true,
  culturally_appropriate boolean NOT NULL DEFAULT true,
  sensory_needs_met boolean NOT NULL DEFAULT true,
  age_appropriate boolean NOT NULL DEFAULT true,
  safety_checked boolean NOT NULL DEFAULT true,
  photographs_taken boolean NOT NULL DEFAULT false,
  social_worker_informed boolean NOT NULL DEFAULT false,
  budget_discussed boolean NOT NULL DEFAULT false,
  child_satisfied boolean NOT NULL DEFAULT true,
  regularly_updated boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  budget_amount numeric,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_home_decoration_personalisation_home ON cs_home_decoration_personalisation(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_home_decoration_personalisation_date ON cs_home_decoration_personalisation(assessment_date);

ALTER TABLE cs_home_decoration_personalisation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_home_decoration_personalisation_home_isolation ON cs_home_decoration_personalisation;
CREATE POLICY cs_home_decoration_personalisation_home_isolation ON cs_home_decoration_personalisation
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_home_decoration_personalisation migration: %', SQLERRM;
END $$;
