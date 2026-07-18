-- Migration: cs_ofsted_action_plans
-- Tracks Ofsted inspection findings, recommendations, and action plan progress

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_ofsted_action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  finding_type text NOT NULL DEFAULT 'other',
  action_status text NOT NULL DEFAULT 'not_started',
  finding_priority text NOT NULL DEFAULT 'medium',
  inspection_type text NOT NULL DEFAULT 'other',
  inspection_date date NOT NULL DEFAULT now(),
  finding_description text NOT NULL DEFAULT '',
  action_plan text NOT NULL DEFAULT '',
  responsible_person text NOT NULL DEFAULT '',
  target_date date NOT NULL DEFAULT now(),
  evidence_gathered boolean NOT NULL DEFAULT false,
  progress_documented boolean NOT NULL DEFAULT false,
  staff_briefed boolean NOT NULL DEFAULT false,
  training_provided boolean NOT NULL DEFAULT false,
  policy_updated boolean NOT NULL DEFAULT false,
  practice_changed boolean NOT NULL DEFAULT false,
  monitored_by_ri boolean NOT NULL DEFAULT false,
  children_informed boolean NOT NULL DEFAULT false,
  social_worker_notified boolean NOT NULL DEFAULT false,
  board_informed boolean NOT NULL DEFAULT false,
  follow_up_inspection_ready boolean NOT NULL DEFAULT false,
  regulation_referenced boolean NOT NULL DEFAULT false,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_by text,
  completion_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_ofsted_action_plans_home ON cs_ofsted_action_plans(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_ofsted_action_plans_date ON cs_ofsted_action_plans(inspection_date);

ALTER TABLE cs_ofsted_action_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_ofsted_action_plans_home_isolation ON cs_ofsted_action_plans;
CREATE POLICY cs_ofsted_action_plans_home_isolation ON cs_ofsted_action_plans
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_ofsted_action_plans migration: %', SQLERRM;
END $$;
