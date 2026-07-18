-- Migration: 234_first_aid_medical_emergency
-- Service: first-aid-medical-emergency-service
-- CHR 2015 Reg 25(2)(c) (staff first aid training), Reg 31(2)(a) (emergency procedures)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_first_aid_medical_emergency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  incident_type text NOT NULL CHECK (incident_type IN ('minor_injury','major_injury','allergic_reaction','seizure','breathing_difficulty','choking','mental_health_crisis','medication_error','equipment_check','other')),
  severity_level text NOT NULL CHECK (severity_level IN ('minor','moderate','serious','life_threatening','preventive')),
  response_quality text NOT NULL CHECK (response_quality IN ('excellent','good','adequate','poor','failed')),
  outcome_assessment text NOT NULL CHECK (outcome_assessment IN ('full_recovery','improving','ongoing_treatment','hospitalised','escalated')),
  incident_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  responded_by text NOT NULL,
  first_aid_trained boolean NOT NULL DEFAULT true,
  correct_procedure_followed boolean NOT NULL DEFAULT true,
  equipment_available boolean NOT NULL DEFAULT true,
  ambulance_called boolean NOT NULL DEFAULT true,
  parent_notified boolean NOT NULL DEFAULT true,
  gp_informed boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  incident_recorded boolean NOT NULL DEFAULT true,
  ofsted_notified boolean NOT NULL DEFAULT true,
  debrief_completed boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_first_aid_home ON cs_first_aid_medical_emergency(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_first_aid_date ON cs_first_aid_medical_emergency(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_first_aid_type ON cs_first_aid_medical_emergency(incident_type);

ALTER TABLE cs_first_aid_medical_emergency ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_first_aid_medical_emergency_home_isolation" ON cs_first_aid_medical_emergency;
CREATE POLICY "cs_first_aid_medical_emergency_home_isolation" ON cs_first_aid_medical_emergency
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 234 first_aid_medical_emergency: %', SQLERRM;
END $$;
