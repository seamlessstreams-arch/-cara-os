-- Migration: cs_professional_consultations
-- Tracks consultations with external professionals (CAMHS, psychologists, social workers, etc.)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_professional_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  professional_type text NOT NULL DEFAULT 'other',
  consultation_type text NOT NULL DEFAULT 'other',
  consultation_outcome text NOT NULL DEFAULT 'no_further_action',
  consultation_urgency text NOT NULL DEFAULT 'routine',
  consultation_date date NOT NULL DEFAULT now(),
  professional_name text NOT NULL DEFAULT '',
  professional_organisation text NOT NULL DEFAULT '',
  child_name text NOT NULL DEFAULT '',
  child_id uuid,
  recommendations_documented boolean NOT NULL DEFAULT false,
  actions_agreed boolean NOT NULL DEFAULT false,
  actions_completed boolean NOT NULL DEFAULT false,
  staff_informed boolean NOT NULL DEFAULT false,
  care_plan_updated boolean NOT NULL DEFAULT false,
  parent_carer_informed boolean NOT NULL DEFAULT false,
  social_worker_informed boolean NOT NULL DEFAULT false,
  follow_up_required boolean NOT NULL DEFAULT false,
  follow_up_completed boolean NOT NULL DEFAULT false,
  child_participated boolean NOT NULL DEFAULT false,
  child_views_recorded boolean NOT NULL DEFAULT false,
  consent_obtained boolean NOT NULL DEFAULT false,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  consulted_by text NOT NULL DEFAULT '',
  next_consultation_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_professional_consultations_home ON cs_professional_consultations(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_professional_consultations_date ON cs_professional_consultations(consultation_date);

ALTER TABLE cs_professional_consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_professional_consultations_home_isolation ON cs_professional_consultations;
CREATE POLICY cs_professional_consultations_home_isolation ON cs_professional_consultations
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_professional_consultations migration: %', SQLERRM;
END $$;
