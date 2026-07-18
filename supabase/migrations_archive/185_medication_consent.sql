-- Migration: cs_medication_consent
-- Tracks consent for medication administration

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_medication_consent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  consent_type text NOT NULL DEFAULT 'parental_consent',
  consent_status text NOT NULL DEFAULT 'active',
  medication_type text NOT NULL DEFAULT 'prescribed_regular',
  consent_given_by text NOT NULL DEFAULT 'parent_mother',
  consent_date date NOT NULL DEFAULT now(),
  child_name text NOT NULL DEFAULT '',
  child_id uuid,
  medication_name text NOT NULL DEFAULT '',
  consent_documented boolean NOT NULL DEFAULT true,
  capacity_assessed boolean NOT NULL DEFAULT true,
  child_informed boolean NOT NULL DEFAULT true,
  side_effects_explained boolean NOT NULL DEFAULT true,
  alternatives_discussed boolean NOT NULL DEFAULT false,
  review_date_set boolean NOT NULL DEFAULT true,
  social_worker_notified boolean NOT NULL DEFAULT true,
  gp_consulted boolean NOT NULL DEFAULT true,
  restrictions_noted boolean NOT NULL DEFAULT false,
  self_admin_assessed boolean NOT NULL DEFAULT false,
  storage_confirmed boolean NOT NULL DEFAULT true,
  disposal_arranged boolean NOT NULL DEFAULT false,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  recorded_by text NOT NULL DEFAULT '',
  review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_medication_consent_home ON cs_medication_consent(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_medication_consent_date ON cs_medication_consent(consent_date);

ALTER TABLE cs_medication_consent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_medication_consent_home_isolation ON cs_medication_consent;
CREATE POLICY cs_medication_consent_home_isolation ON cs_medication_consent
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_medication_consent migration: %', SQLERRM;
END $$;
