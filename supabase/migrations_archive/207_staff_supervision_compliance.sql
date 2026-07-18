-- Migration: 207_staff_supervision_compliance
-- Monitors staff supervision frequency and quality

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_supervision_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  supervision_type text NOT NULL DEFAULT 'formal_one_to_one',
  frequency_compliance text NOT NULL DEFAULT 'on_schedule',
  quality_rating text NOT NULL DEFAULT 'not_assessed',
  action_completion text NOT NULL DEFAULT 'not_applicable',
  supervision_date date NOT NULL DEFAULT now(),
  staff_name text NOT NULL,
  supervisor_name text NOT NULL,
  agenda_prepared boolean NOT NULL DEFAULT true,
  safeguarding_discussed boolean NOT NULL DEFAULT true,
  wellbeing_discussed boolean NOT NULL DEFAULT true,
  training_needs_reviewed boolean NOT NULL DEFAULT true,
  actions_agreed boolean NOT NULL DEFAULT true,
  previous_actions_reviewed boolean NOT NULL DEFAULT true,
  professional_development_planned boolean NOT NULL DEFAULT true,
  concerns_raised boolean NOT NULL DEFAULT false,
  confidentiality_maintained boolean NOT NULL DEFAULT true,
  notes_shared boolean NOT NULL DEFAULT true,
  manager_oversight boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  supervision_duration_minutes integer NOT NULL DEFAULT 60,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_staff_supervision_compliance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_staff_supervision_compliance_home ON cs_staff_supervision_compliance;
CREATE POLICY cs_staff_supervision_compliance_home ON cs_staff_supervision_compliance
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 207 idempotent: %', SQLERRM;
END $$;
