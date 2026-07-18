-- Migration: 238_self_esteem_confidence_building
-- Service: self-esteem-confidence-building-service
-- CHR 2015 Reg 10(2)(a) (building self-esteem), Reg 11(2)(a) (positive self-image)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_self_esteem_confidence_building (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  intervention_type text NOT NULL CHECK (intervention_type IN ('one_to_one_session','group_activity','achievement_recognition','skill_building','peer_support','creative_expression','physical_activity','therapeutic_support','role_modelling','other')),
  confidence_level text NOT NULL CHECK (confidence_level IN ('very_confident','confident','developing','low_confidence','very_low')),
  progress_assessment text NOT NULL CHECK (progress_assessment IN ('significant_improvement','some_improvement','maintained','slight_decline','significant_decline')),
  self_image_rating text NOT NULL CHECK (self_image_rating IN ('very_positive','positive','neutral','negative','very_negative')),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  supported_by text NOT NULL,
  child_led_activity boolean NOT NULL DEFAULT true,
  strengths_identified boolean NOT NULL DEFAULT true,
  goals_set boolean NOT NULL DEFAULT true,
  achievements_celebrated boolean NOT NULL DEFAULT true,
  safe_space_provided boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT true,
  peers_supportive boolean NOT NULL DEFAULT true,
  culturally_affirming boolean NOT NULL DEFAULT true,
  progress_shared boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_self_esteem_home ON cs_self_esteem_confidence_building(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_self_esteem_date ON cs_self_esteem_confidence_building(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_self_esteem_type ON cs_self_esteem_confidence_building(intervention_type);

ALTER TABLE cs_self_esteem_confidence_building ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_self_esteem_confidence_building_home_isolation" ON cs_self_esteem_confidence_building;
CREATE POLICY "cs_self_esteem_confidence_building_home_isolation" ON cs_self_esteem_confidence_building
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 238 self_esteem_confidence_building: %', SQLERRM;
END $$;
