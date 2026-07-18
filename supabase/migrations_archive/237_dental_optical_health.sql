-- Migration: 237_dental_optical_health
-- Service: dental-optical-health-service
-- CHR 2015 Reg 33(4)(a) (dental and optical services), Reg 7(2)(a) (health promotion)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_dental_optical_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  appointment_type text NOT NULL CHECK (appointment_type IN ('dental_checkup','dental_treatment','dental_emergency','orthodontic','optical_exam','optical_prescription','optical_emergency','routine_screening','specialist_referral','other')),
  compliance_level text NOT NULL CHECK (compliance_level IN ('fully_compliant','mostly_compliant','partially_compliant','non_compliant','refused')),
  treatment_outcome text NOT NULL CHECK (treatment_outcome IN ('completed_successfully','ongoing_treatment','requires_follow_up','treatment_refused','no_treatment_needed')),
  urgency_assessment text NOT NULL CHECK (urgency_assessment IN ('routine','soon','urgent','emergency','preventive')),
  appointment_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  accompanied_by text NOT NULL,
  appointment_attended boolean NOT NULL DEFAULT true,
  consent_obtained boolean NOT NULL DEFAULT true,
  child_prepared boolean NOT NULL DEFAULT true,
  anxiety_managed boolean NOT NULL DEFAULT true,
  treatment_explained boolean NOT NULL DEFAULT true,
  follow_up_booked boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT true,
  prescription_collected boolean NOT NULL DEFAULT true,
  pain_managed boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_dental_optical_home ON cs_dental_optical_health(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_dental_optical_date ON cs_dental_optical_health(appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_dental_optical_type ON cs_dental_optical_health(appointment_type);

ALTER TABLE cs_dental_optical_health ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_dental_optical_health_home_isolation" ON cs_dental_optical_health;
CREATE POLICY "cs_dental_optical_health_home_isolation" ON cs_dental_optical_health
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 237 dental_optical_health: %', SQLERRM;
END $$;
