-- Migration: 195_cultural_identity_support
-- Table: cs_cultural_identity_support
-- CHR 2015 Reg 5 (identity), Reg 16 (diversity)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_cultural_identity_support (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  identity_area text NOT NULL CHECK (identity_area IN ('cultural_heritage','religious_faith','language','ethnicity','gender_identity','sexuality','disability_identity','family_history','nationality','other')),
  support_type text NOT NULL CHECK (support_type IN ('cultural_activity','religious_observance','language_support','food_dietary','celebration_festival','community_connection','identity_discussion','specialist_referral','resource_provision','other')),
  engagement_level text NOT NULL CHECK (engagement_level IN ('enthusiastic','engaged','neutral','reluctant','declined')),
  cultural_competency text NOT NULL CHECK (cultural_competency IN ('highly_competent','competent','developing','needs_training','not_assessed')),
  support_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  staff_name text NOT NULL,
  child_views_sought boolean NOT NULL DEFAULT true,
  culturally_appropriate boolean NOT NULL DEFAULT true,
  family_consulted boolean NOT NULL DEFAULT true,
  identity_celebrated boolean NOT NULL DEFAULT true,
  resources_available boolean NOT NULL DEFAULT true,
  staff_trained boolean NOT NULL DEFAULT true,
  care_plan_reflects_identity boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT false,
  community_links_made boolean NOT NULL DEFAULT false,
  dietary_needs_met boolean NOT NULL DEFAULT true,
  language_supported boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_cultural_identity_support ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_cultural_identity_support_home ON cs_cultural_identity_support;
CREATE POLICY cs_cultural_identity_support_home ON cs_cultural_identity_support
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_cultural_identity_support_home ON cs_cultural_identity_support(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_cultural_identity_support_date ON cs_cultural_identity_support(support_date);
CREATE INDEX IF NOT EXISTS idx_cs_cultural_identity_support_area ON cs_cultural_identity_support(identity_area);

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 195 cultural_identity_support: %', SQLERRM;
END $$;
