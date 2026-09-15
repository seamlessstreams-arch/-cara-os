-- Migration: cs_positive_handling
-- Tracks positive handling plans and de-escalation strategies

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_positive_handling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  plan_type text NOT NULL DEFAULT 'other',
  review_outcome text NOT NULL DEFAULT 'plan_effective',
  trigger_category text NOT NULL DEFAULT 'other',
  intervention_level text NOT NULL DEFAULT 'verbal_de_escalation',
  review_date date NOT NULL DEFAULT now(),
  child_name text NOT NULL DEFAULT '',
  child_id uuid,
  triggers_identified boolean,
  early_warning_signs boolean,
  de_escalation_steps boolean,
  calming_strategies boolean,
  staff_trained boolean,
  child_consulted boolean,
  parent_informed boolean,
  social_worker_informed boolean,
  plan_accessible boolean,
  regularly_reviewed boolean,
  post_incident_support boolean,
  medication_considered boolean NOT NULL DEFAULT false,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  reviewed_by text NOT NULL DEFAULT '',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_positive_handling_home ON cs_positive_handling(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_positive_handling_date ON cs_positive_handling(review_date);

ALTER TABLE cs_positive_handling ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_positive_handling_home_isolation ON cs_positive_handling;
CREATE POLICY cs_positive_handling_home_isolation ON cs_positive_handling
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_positive_handling migration: %', SQLERRM;
END $$;
