-- Migration: cs_shift_handover_quality
-- Tracks shift handover quality audits

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_shift_handover_quality (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  handover_type text NOT NULL DEFAULT 'other',
  quality_rating text NOT NULL DEFAULT 'good',
  completion_status text NOT NULL DEFAULT 'fully_complete',
  handover_format text NOT NULL DEFAULT 'verbal_and_written',
  handover_date date NOT NULL DEFAULT now(),
  outgoing_staff text NOT NULL DEFAULT '',
  incoming_staff text NOT NULL DEFAULT '',
  medication_info_shared boolean,
  safeguarding_updates boolean,
  incident_continuity boolean,
  care_plan_updates boolean,
  risk_info_shared boolean,
  appointments_communicated boolean,
  behaviour_updates boolean,
  emotional_wellbeing_noted boolean,
  food_dietary_noted boolean,
  contact_updates boolean,
  key_tasks_identified boolean,
  read_and_signed boolean,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  audited_by text NOT NULL DEFAULT '',
  next_audit_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_shift_handover_quality_home ON cs_shift_handover_quality(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_shift_handover_quality_date ON cs_shift_handover_quality(handover_date);

ALTER TABLE cs_shift_handover_quality ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_shift_handover_quality_home_isolation ON cs_shift_handover_quality;
CREATE POLICY cs_shift_handover_quality_home_isolation ON cs_shift_handover_quality
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_shift_handover_quality migration: %', SQLERRM;
END $$;
