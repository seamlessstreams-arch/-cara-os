-- Migration: 235_outdoor_spaces_play_areas
-- Service: outdoor-spaces-play-areas-service
-- CHR 2015 Reg 27(4)(b) (outdoor spaces maintained), Reg 9(2)(a) (outdoor play)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_outdoor_spaces_play_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  space_type text NOT NULL CHECK (space_type IN ('garden','play_area','sports_court','sensory_garden','allotment','bike_storage','seating_area','bbq_area','nature_area','other')),
  condition_rating text NOT NULL CHECK (condition_rating IN ('excellent','good','fair','poor','unsafe')),
  safety_assessment text NOT NULL CHECK (safety_assessment IN ('fully_safe','minor_issues','moderate_issues','significant_hazards','closed')),
  accessibility_level text NOT NULL CHECK (accessibility_level IN ('fully_accessible','mostly_accessible','partially_accessible','limited_access','not_accessible')),
  inspection_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  inspected_by text NOT NULL,
  equipment_checked boolean NOT NULL DEFAULT true,
  surface_safe boolean NOT NULL DEFAULT true,
  fencing_secure boolean NOT NULL DEFAULT true,
  lighting_adequate boolean NOT NULL DEFAULT true,
  clean_tidy boolean NOT NULL DEFAULT true,
  age_appropriate boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  maintenance_requested boolean NOT NULL DEFAULT true,
  risk_assessed boolean NOT NULL DEFAULT true,
  children_consulted boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_outdoor_spaces_home ON cs_outdoor_spaces_play_areas(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_outdoor_spaces_date ON cs_outdoor_spaces_play_areas(inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_outdoor_spaces_type ON cs_outdoor_spaces_play_areas(space_type);

ALTER TABLE cs_outdoor_spaces_play_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_outdoor_spaces_play_areas_home_isolation" ON cs_outdoor_spaces_play_areas;
CREATE POLICY "cs_outdoor_spaces_play_areas_home_isolation" ON cs_outdoor_spaces_play_areas
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 235 outdoor_spaces_play_areas: %', SQLERRM;
END $$;
