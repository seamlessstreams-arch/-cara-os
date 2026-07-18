-- Migration: 348_creative_arts_activities
-- Domain: Children's Services — Creative Arts & Therapeutic Activities
-- Description: Tracks creative arts and therapeutic activities for looked-after
-- children including art therapy, music therapy, drama therapy, dance/movement,
-- creative writing, photography, film making, pottery/ceramics, textiles/sewing,
-- cooking as creative, gardening/nature art, digital art, graffiti art (guided),
-- music instrument learning, music production, singing/choir, poetry/spoken word,
-- and comics/graphic novel creation.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 9 (quality of care — activities),
-- Reg 10 (wellbeing),
-- SCCIF: Experiences & progress — "The home offers activities that promote
-- creative expression and emotional wellbeing."
-- Arts Council England — arts in care settings,
-- NICE CG26 (PTSD — creative therapies).

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_creative_arts_activities (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  activity_date               date NOT NULL,
  facilitator_name            text NOT NULL,
  activity_type               text NOT NULL DEFAULT 'Art Therapy',
  therapeutic_intent          boolean NOT NULL DEFAULT false,
  therapist_qualified         boolean NULL,
  emotional_expression_enabled boolean NOT NULL DEFAULT true,
  child_choice                boolean NOT NULL DEFAULT true,
  group_or_individual         text NOT NULL DEFAULT 'Individual',
  engagement_level            text NOT NULL DEFAULT 'Participated',
  mood_before                 text NOT NULL DEFAULT 'Neutral',
  mood_after                  text NOT NULL DEFAULT 'Neutral',
  achievement_noted           text NULL,
  exhibited_displayed         boolean NOT NULL DEFAULT false,
  linked_to_care_plan         boolean NOT NULL DEFAULT false,
  young_person_feedback       text NULL,
  notes                       text NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_creative_arts_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_creative_arts_activities
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_creative_arts_activities_home
  ON cs_creative_arts_activities(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_creative_arts_activities_date
  ON cs_creative_arts_activities(activity_date);

CREATE INDEX IF NOT EXISTS idx_cs_creative_arts_activities_type
  ON cs_creative_arts_activities(activity_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
