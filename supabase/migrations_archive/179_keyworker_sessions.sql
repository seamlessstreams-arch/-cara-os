-- Migration: cs_keyworker_sessions
-- Tracks 1:1 keyworker sessions with children

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_keyworker_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  session_focus text NOT NULL DEFAULT 'emotional_check_in',
  session_quality text NOT NULL DEFAULT 'good',
  child_mood text NOT NULL DEFAULT 'positive',
  session_location text NOT NULL DEFAULT 'in_home',
  session_date date NOT NULL DEFAULT now(),
  child_name text NOT NULL DEFAULT '',
  child_id uuid,
  keyworker_name text NOT NULL DEFAULT '',
  child_led boolean NOT NULL DEFAULT true,
  targets_reviewed boolean NOT NULL DEFAULT true,
  wishes_feelings_recorded boolean NOT NULL DEFAULT true,
  advocacy_provided boolean NOT NULL DEFAULT false,
  care_plan_discussed boolean NOT NULL DEFAULT false,
  safety_discussed boolean NOT NULL DEFAULT false,
  achievements_celebrated boolean NOT NULL DEFAULT true,
  worries_explored boolean NOT NULL DEFAULT true,
  next_steps_agreed boolean NOT NULL DEFAULT true,
  session_recorded boolean NOT NULL DEFAULT true,
  child_signed boolean NOT NULL DEFAULT false,
  social_worker_updated boolean NOT NULL DEFAULT false,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  session_duration_minutes integer NOT NULL DEFAULT 30,
  next_session_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_keyworker_sessions_home ON cs_keyworker_sessions(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_keyworker_sessions_date ON cs_keyworker_sessions(session_date);

ALTER TABLE cs_keyworker_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_keyworker_sessions_home_isolation ON cs_keyworker_sessions;
CREATE POLICY cs_keyworker_sessions_home_isolation ON cs_keyworker_sessions
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_keyworker_sessions migration: %', SQLERRM;
END $$;
