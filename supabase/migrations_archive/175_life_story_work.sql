-- Migration: cs_life_story_work
-- Tracks life story work sessions with children

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_life_story_work (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  session_type text NOT NULL DEFAULT 'other',
  child_engagement text NOT NULL DEFAULT 'partially_engaged',
  emotional_response text NOT NULL DEFAULT 'not_recorded',
  session_frequency text NOT NULL DEFAULT 'as_needed',
  session_date date NOT NULL DEFAULT now(),
  child_name text NOT NULL DEFAULT '',
  child_id uuid,
  facilitator_name text NOT NULL DEFAULT '',
  age_appropriate boolean NOT NULL DEFAULT true,
  trauma_informed boolean NOT NULL DEFAULT true,
  child_led boolean NOT NULL DEFAULT true,
  consent_obtained boolean NOT NULL DEFAULT true,
  social_worker_aware boolean NOT NULL DEFAULT true,
  therapist_consulted boolean NOT NULL DEFAULT false,
  materials_created boolean NOT NULL DEFAULT false,
  securely_stored boolean NOT NULL DEFAULT true,
  shared_with_child boolean NOT NULL DEFAULT false,
  parent_involvement boolean NOT NULL DEFAULT false,
  cultural_sensitivity boolean NOT NULL DEFAULT true,
  follow_up_planned boolean NOT NULL DEFAULT false,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  session_duration_minutes integer NOT NULL DEFAULT 30,
  next_session_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_life_story_work_home ON cs_life_story_work(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_life_story_work_date ON cs_life_story_work(session_date);

ALTER TABLE cs_life_story_work ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_life_story_work_home_isolation ON cs_life_story_work;
CREATE POLICY cs_life_story_work_home_isolation ON cs_life_story_work
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_life_story_work migration: %', SQLERRM;
END $$;
