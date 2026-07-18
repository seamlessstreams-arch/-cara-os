-- 255: Staff Mandatory Training Matrix
-- Tracks mandatory training requirements per role with completion/expiry dates and compliance rates
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_mandatory_training (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  staff_name text NOT NULL,
  staff_id uuid,
  training_category text NOT NULL CHECK (training_category IN ('safeguarding_level_3','first_aid','fire_safety','medication_administration','physical_intervention','food_hygiene','data_protection','health_and_safety','equality_diversity','other')),
  compliance_status text NOT NULL DEFAULT 'not_started' CHECK (compliance_status IN ('current','expiring_soon','expired','not_started','booked')),
  training_level text NOT NULL CHECK (training_level IN ('awareness','foundation','intermediate','advanced','specialist')),
  delivery_method text NOT NULL CHECK (delivery_method IN ('classroom','e_learning','blended','workplace','external_provider','conference','shadowing','self_directed','coaching','other')),
  session_date date NOT NULL,
  recorded_by text NOT NULL,
  training_title text NOT NULL,
  provider_name text NOT NULL,
  completion_date date,
  expiry_date date,
  certificate_reference text,
  cost text,
  staff_feedback text,
  competence_assessment text,
  refresher_due date,
  manager_notes text,
  approved_by text,
  approved_at timestamptz,
  certificate_held boolean NOT NULL DEFAULT false,
  competence_assessed boolean NOT NULL DEFAULT false,
  staff_attended boolean NOT NULL DEFAULT false,
  learning_objectives_met boolean NOT NULL DEFAULT false,
  applied_in_practice boolean NOT NULL DEFAULT false,
  refresher_scheduled boolean NOT NULL DEFAULT false,
  manager_verified boolean NOT NULL DEFAULT false,
  cost_approved boolean NOT NULL DEFAULT false,
  linked_to_development_plan boolean NOT NULL DEFAULT false,
  accessible_format boolean NOT NULL DEFAULT false,
  evaluation_completed boolean NOT NULL DEFAULT false,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_staff_mandatory_training_home ON cs_staff_mandatory_training(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_staff_mandatory_training_staff ON cs_staff_mandatory_training(staff_name);
CREATE INDEX IF NOT EXISTS idx_cs_staff_mandatory_training_date ON cs_staff_mandatory_training(session_date);
CREATE INDEX IF NOT EXISTS idx_cs_staff_mandatory_training_expiry ON cs_staff_mandatory_training(expiry_date);

ALTER TABLE cs_staff_mandatory_training ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_mandatory_training_home" ON cs_staff_mandatory_training;
CREATE POLICY "staff_mandatory_training_home" ON cs_staff_mandatory_training
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 255 (staff mandatory training): %', SQLERRM;
END $$;
