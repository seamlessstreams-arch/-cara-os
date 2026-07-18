-- 252: Staff Support Actions
-- Records specific support actions taken for staff — training, mentoring, supervision, adjustments
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_support_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  staff_name text NOT NULL,
  staff_id uuid,
  action_type text NOT NULL CHECK (action_type IN ('training_course','mentoring_session','supervision_adjustment','reasonable_adjustment','wellbeing_intervention','peer_support','workload_review','occupational_health','coaching','other')),
  action_outcome text NOT NULL CHECK (action_outcome IN ('very_positive','positive','neutral','limited','no_change')),
  completion_status text NOT NULL DEFAULT 'planned' CHECK (completion_status IN ('planned','in_progress','completed','cancelled','overdue')),
  action_priority text NOT NULL DEFAULT 'medium' CHECK (action_priority IN ('urgent','high','medium','low','routine')),
  session_date date NOT NULL,
  recorded_by text NOT NULL,
  action_description text NOT NULL,
  evidence_of_need text NOT NULL,
  expected_outcome text,
  actual_outcome text,
  staff_feedback text,
  manager_observation text,
  barriers_encountered text,
  follow_up_plan text,
  linked_plan_id text,
  approved_by text,
  approved_at timestamptz,
  evidence_based boolean NOT NULL DEFAULT false,
  staff_consulted boolean NOT NULL DEFAULT false,
  staff_agreed boolean NOT NULL DEFAULT false,
  action_proportionate boolean NOT NULL DEFAULT false,
  cost_considered boolean NOT NULL DEFAULT false,
  timeline_set boolean NOT NULL DEFAULT false,
  success_criteria_set boolean NOT NULL DEFAULT false,
  follow_up_scheduled boolean NOT NULL DEFAULT false,
  manager_approved boolean NOT NULL DEFAULT false,
  impact_assessed boolean NOT NULL DEFAULT false,
  linked_to_plan boolean NOT NULL DEFAULT false,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_staff_support_actions_home ON cs_staff_support_actions(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_staff_support_actions_staff ON cs_staff_support_actions(staff_name);
CREATE INDEX IF NOT EXISTS idx_cs_staff_support_actions_date ON cs_staff_support_actions(session_date);

ALTER TABLE cs_staff_support_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_support_actions_home" ON cs_staff_support_actions;
CREATE POLICY "staff_support_actions_home" ON cs_staff_support_actions
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 252 (staff support actions): %', SQLERRM;
END $$;
