-- Migration: 325_substance_misuse_monitoring
-- Domain: Substance Misuse Monitoring
-- Tracks substance misuse assessments, risk levels, referrals, harm reduction plans
-- CHR 2015 Reg 12 (protection), Reg 34 (individual needs), NICE CG115, Drugs Strategy 2021

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_substance_misuse_monitoring (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  child_name        text        NOT NULL,
  assessment_date   date        NOT NULL,
  assessor_name     text        NOT NULL,

  substance_type    text        NOT NULL CHECK (substance_type IN ('Alcohol','Cannabis','Cocaine','MDMA','Nitrous Oxide','Prescription Drugs','Solvents/Inhalants','Synthetic Cannabinoids','Tobacco/Vaping','Other')),
  usage_frequency   text        NOT NULL CHECK (usage_frequency IN ('Single Episode','Occasional','Regular','Daily','Unknown')),
  risk_level        text        NOT NULL CHECK (risk_level IN ('Low','Medium','High','Critical')),

  referral_to_specialist   boolean NOT NULL DEFAULT false,
  specialist_service_name  text    NULL,
  harm_reduction_plan      boolean NOT NULL DEFAULT false,
  young_person_engaged     boolean NOT NULL DEFAULT false,
  parental_carer_informed  boolean NOT NULL DEFAULT false,
  social_worker_informed   boolean NOT NULL DEFAULT false,
  police_involvement       boolean NOT NULL DEFAULT false,
  drug_testing_consent     boolean NOT NULL DEFAULT false,
  support_plan_in_place    boolean NOT NULL DEFAULT false,

  next_review_date  date    NULL,
  outcome           text    NOT NULL CHECK (outcome IN ('Ongoing Support','Reduced Usage','Abstinent','Disengaged','Referred Out','Closed')),
  compliance_status text    NOT NULL CHECK (compliance_status IN ('Compliant','Non-Compliant','Action Required','Under Review')),
  notes             text    NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_substance_misuse_monitoring ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_substance_misuse_monitoring;
CREATE POLICY "Tenant isolation" ON cs_substance_misuse_monitoring
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_substance_misuse_monitoring_home
  ON cs_substance_misuse_monitoring(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_substance_misuse_monitoring_date
  ON cs_substance_misuse_monitoring(assessment_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
