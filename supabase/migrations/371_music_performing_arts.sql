DO $$ BEGIN
CREATE TABLE IF NOT EXISTS cs_music_performing_arts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name text NOT NULL,
  session_date date NOT NULL,
  facilitator_name text NOT NULL,
  activity_type text NOT NULL,
  therapeutic_intent boolean NOT NULL DEFAULT false,
  therapist_qualified boolean NULL,
  instrument_provided boolean NULL,
  child_choice boolean NOT NULL DEFAULT false,
  engagement_level text NOT NULL DEFAULT 'Participated',
  emotional_expression boolean NOT NULL DEFAULT false,
  confidence_building boolean NOT NULL DEFAULT false,
  social_interaction boolean NOT NULL DEFAULT false,
  performance_opportunity boolean NOT NULL DEFAULT false,
  achievement_noted text NULL,
  group_or_individual text NOT NULL DEFAULT 'Individual',
  mood_before text NOT NULL DEFAULT 'Neutral',
  mood_after text NOT NULL DEFAULT 'Neutral',
  linked_to_care_plan boolean NOT NULL DEFAULT false,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE cs_music_performing_arts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON cs_music_performing_arts USING (home_id = get_my_home_id());
CREATE INDEX IF NOT EXISTS idx_cs_music_performing_arts_home ON cs_music_performing_arts(home_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
