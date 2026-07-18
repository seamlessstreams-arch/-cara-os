-- Migration: 227_leisure_recreation_activities
-- Service: leisure-recreation-activities-service
-- CHR 2015 Reg 9(2)(a) (leisure activities), Reg 9(2)(b) (hobbies/interests)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_leisure_recreation_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('sport','creative_arts','music','outdoor_adventure','community_group','cultural_activity','reading_library','gaming_technology','cooking_baking','other')),
  participation_level text NOT NULL CHECK (participation_level IN ('enthusiastic','willing','reluctant','refused','unable')),
  enjoyment_rating text NOT NULL CHECK (enjoyment_rating IN ('loved_it','enjoyed','neutral','disliked','hated')),
  skill_development text NOT NULL CHECK (skill_development IN ('significant_growth','good_growth','some_growth','no_growth','decline')),
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  facilitated_by text NOT NULL,
  child_chose_activity boolean NOT NULL DEFAULT true,
  age_appropriate boolean NOT NULL DEFAULT true,
  inclusive_access boolean NOT NULL DEFAULT true,
  peer_interaction boolean NOT NULL DEFAULT true,
  community_based boolean NOT NULL DEFAULT true,
  new_experience boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT true,
  risk_assessed boolean NOT NULL DEFAULT true,
  transport_arranged boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_leisure_recreation_home ON cs_leisure_recreation_activities(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_leisure_recreation_date ON cs_leisure_recreation_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_leisure_recreation_type ON cs_leisure_recreation_activities(activity_type);

ALTER TABLE cs_leisure_recreation_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_leisure_recreation_activities_home_isolation" ON cs_leisure_recreation_activities;
CREATE POLICY "cs_leisure_recreation_activities_home_isolation" ON cs_leisure_recreation_activities
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 227 leisure_recreation_activities: %', SQLERRM;
END $$;
