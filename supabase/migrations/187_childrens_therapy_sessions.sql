-- Migration: cs_childrens_therapy_sessions
-- Tracks individual therapy sessions for children

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_childrens_therapy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  therapy_type text NOT NULL DEFAULT 'camhs',
  session_outcome text NOT NULL DEFAULT 'positive_progress',
  child_engagement text NOT NULL DEFAULT 'fully_engaged',
  therapy_frequency text NOT NULL DEFAULT 'weekly',
  session_date date NOT NULL DEFAULT now(),
  child_name text NOT NULL DEFAULT '',
  child_id uuid,
  therapist_name text NOT NULL DEFAULT '',
  child_prepared boolean NOT NULL DEFAULT true,
  transport_arranged boolean NOT NULL DEFAULT true,
  consent_current boolean NOT NULL DEFAULT true,
  feedback_obtained boolean NOT NULL DEFAULT true,
  care_plan_updated boolean NOT NULL DEFAULT false,
  social_worker_informed boolean NOT NULL DEFAULT true,
  progress_documented boolean NOT NULL DEFAULT true,
  goals_reviewed boolean NOT NULL DEFAULT true,
  staff_briefed boolean NOT NULL DEFAULT true,
  follow_up_actions boolean NOT NULL DEFAULT true,
  child_debriefed boolean NOT NULL DEFAULT true,
  multi_agency_liaison boolean NOT NULL DEFAULT false,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  session_duration_minutes integer NOT NULL DEFAULT 50,
  next_session_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_childrens_therapy_sessions_home ON cs_childrens_therapy_sessions(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_childrens_therapy_sessions_date ON cs_childrens_therapy_sessions(session_date);

ALTER TABLE cs_childrens_therapy_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_childrens_therapy_sessions_home_isolation ON cs_childrens_therapy_sessions;
CREATE POLICY cs_childrens_therapy_sessions_home_isolation ON cs_childrens_therapy_sessions
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_childrens_therapy_sessions migration: %', SQLERRM;
END $$;
