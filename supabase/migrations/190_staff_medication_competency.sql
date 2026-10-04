-- Staff Medication Competency — CHR 2015 Reg 32, Reg 33, Reg 23
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_medication_competency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  competency_type text NOT NULL DEFAULT 'initial_assessment',
  assessment_outcome text NOT NULL DEFAULT 'competent',
  medication_category text NOT NULL DEFAULT 'oral_medication',
  training_provider text NOT NULL DEFAULT 'in_house_trainer',
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  staff_name text NOT NULL,
  assessed_by text NOT NULL,
  theory_passed boolean,
  practical_observed boolean,
  error_procedure_known boolean,
  storage_knowledge boolean,
  controlled_drug_trained boolean NOT NULL DEFAULT false,
  side_effects_knowledge boolean,
  consent_understanding boolean,
  record_keeping_competent boolean,
  emergency_response_trained boolean,
  disposal_knowledge boolean,
  child_specific_trained boolean,
  refresher_scheduled boolean,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_staff_medication_competency ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_staff_medication_competency_home ON cs_staff_medication_competency;
CREATE POLICY cs_staff_medication_competency_home ON cs_staff_medication_competency
  USING (home_id = get_my_home_id());

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
