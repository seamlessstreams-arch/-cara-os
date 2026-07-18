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
  acknowledged_promptly boolean NOT NULL DEFAULT true,
  investigation_thorough boolean NOT NULL DEFAULT true,
  child_views_sought boolean NOT NULL DEFAULT true,
  complainant_updated boolean NOT NULL DEFAULT true,
  ofsted_notified boolean NOT NULL DEFAULT false,
  learning_identified boolean NOT NULL DEFAULT true,
  action_plan_created boolean NOT NULL DEFAULT true,
  outcome_communicated boolean NOT NULL DEFAULT true,
  satisfaction_assessed boolean NOT NULL DEFAULT true,
  appeal_offered boolean NOT NULL DEFAULT true,
  records_updated boolean NOT NULL DEFAULT true,
  manager_oversight boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
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
