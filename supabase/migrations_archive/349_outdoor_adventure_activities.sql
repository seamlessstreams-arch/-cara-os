-- Migration: 349_outdoor_adventure_activities
-- Domain: Children's Services — Outdoor Adventure & Physical Activity
-- Description: Tracks outdoor adventure and physical activities for looked-after
-- children including walking/hiking, cycling, swimming, climbing/bouldering,
-- kayaking/canoeing, sailing, surfing, horse riding, camping, Duke of Edinburgh,
-- Scouts/Guides/Cadets, team sports, gym/fitness, yoga/mindfulness, orienteering,
-- bushcraft, fishing, gardening, parkrun/running, and other outdoor activities.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 9 (quality of care — promoting development through activities),
-- AALA licensing (Adventure Activities Licensing Authority),
-- OEAP guidance (Outdoor Education Advisers' Panel),
-- DofE Award,
-- SCCIF: Experiences & progress — "The home provides physical and outdoor
-- activities."

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_outdoor_adventure_activities (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  activity_date               date NOT NULL,
  lead_staff                  text NOT NULL,
  activity_type               text NOT NULL DEFAULT 'Walking/Hiking',
  risk_assessment_completed   boolean NOT NULL DEFAULT true,
  parental_consent            boolean NOT NULL DEFAULT true,
  aala_licence_checked        boolean NULL,
  instructor_qualified        boolean NOT NULL DEFAULT true,
  first_aider_present         boolean NOT NULL DEFAULT true,
  ratio_adequate              boolean NOT NULL DEFAULT true,
  weather_appropriate         boolean NOT NULL DEFAULT true,
  equipment_checked           boolean NOT NULL DEFAULT true,
  young_person_choice         boolean NOT NULL DEFAULT true,
  engagement_level            text NOT NULL DEFAULT 'Participated',
  physical_benefit            boolean NOT NULL DEFAULT true,
  emotional_benefit           boolean NOT NULL DEFAULT false,
  social_benefit              boolean NOT NULL DEFAULT false,
  confidence_building         boolean NOT NULL DEFAULT false,
  achievement_noted           text NULL,
  injury_occurred             boolean NOT NULL DEFAULT false,
  injury_details              text NULL,
  linked_to_care_plan         boolean NOT NULL DEFAULT false,
  notes                       text NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_outdoor_adventure_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_outdoor_adventure_activities
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_outdoor_adventure_activities_home
  ON cs_outdoor_adventure_activities(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_outdoor_adventure_activities_date
  ON cs_outdoor_adventure_activities(activity_date);

CREATE INDEX IF NOT EXISTS idx_cs_outdoor_adventure_activities_type
  ON cs_outdoor_adventure_activities(activity_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
