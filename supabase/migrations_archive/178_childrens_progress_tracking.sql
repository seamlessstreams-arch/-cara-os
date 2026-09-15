-- Migration: cs_childrens_progress_tracking
-- Tracks individual children's progress across outcome domains

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_childrens_progress_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  outcome_domain text NOT NULL DEFAULT 'other',
  progress_rating text NOT NULL DEFAULT 'some_progress',
  assessment_tool text NOT NULL DEFAULT 'observation',
  review_period text NOT NULL DEFAULT 'monthly',
  assessment_date date NOT NULL DEFAULT now(),
  child_name text NOT NULL DEFAULT '',
  child_id uuid,
  baseline_established boolean,
  targets_set boolean,
  targets_smart boolean,
  child_involved boolean,
  social_worker_informed boolean,
  parent_informed boolean,
  evidence_documented boolean,
  care_plan_updated boolean,
  celebration_planned boolean NOT NULL DEFAULT false,
  barriers_identified boolean NOT NULL DEFAULT false,
  support_in_place boolean,
  multi_agency_input boolean NOT NULL DEFAULT false,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  assessed_by text NOT NULL DEFAULT '',
  current_score integer,
  previous_score integer,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_childrens_progress_tracking_home ON cs_childrens_progress_tracking(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_childrens_progress_tracking_date ON cs_childrens_progress_tracking(assessment_date);

ALTER TABLE cs_childrens_progress_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_childrens_progress_tracking_home_isolation ON cs_childrens_progress_tracking;
CREATE POLICY cs_childrens_progress_tracking_home_isolation ON cs_childrens_progress_tracking
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_childrens_progress_tracking migration: %', SQLERRM;
END $$;
