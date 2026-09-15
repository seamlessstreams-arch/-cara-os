-- Migration: 206_complaint_resolution_tracking
-- Tracks complaint resolutions, timelines, outcomes

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_complaint_resolution_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  complaint_category text NOT NULL DEFAULT 'other',
  resolution_status text NOT NULL DEFAULT 'received',
  outcome_type text NOT NULL DEFAULT 'pending',
  response_timeline text NOT NULL DEFAULT 'within_28_days',
  complaint_date date NOT NULL DEFAULT now(),
  complainant_name text NOT NULL,
  handled_by text NOT NULL,
  acknowledged_promptly boolean,
  investigation_thorough boolean,
  child_views_sought boolean,
  complainant_updated boolean,
  ofsted_notified boolean NOT NULL DEFAULT false,
  learning_identified boolean,
  action_plan_created boolean,
  outcome_communicated boolean,
  satisfaction_assessed boolean,
  appeal_offered boolean,
  records_updated boolean,
  manager_oversight boolean,
  recorded_promptly boolean,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  resolution_days integer NOT NULL DEFAULT 0,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_complaint_resolution_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_complaint_resolution_tracking_home ON cs_complaint_resolution_tracking;
CREATE POLICY cs_complaint_resolution_tracking_home ON cs_complaint_resolution_tracking
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 206 idempotent: %', SQLERRM;
END $$;
