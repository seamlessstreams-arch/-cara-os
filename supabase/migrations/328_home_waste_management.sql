-- Migration: 330_home_waste_management
-- Domain: Home Waste Management & Recycling
-- Tracks waste audits, recycling compliance, duty of care, and environmental practice
-- CHR 2015 Reg 25 (premises), Environmental Protection Act 1990,
-- Waste (England and Wales) Regulations 2011, Duty of Care requirements

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_home_waste_management (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  audit_date             date        NOT NULL,
  auditor_name           text        NOT NULL,

  waste_category         text        NOT NULL CHECK (waste_category IN ('General Waste','Recycling — Paper/Card','Recycling — Plastic','Recycling — Glass','Recycling — Metal','Food Waste','Garden Waste','Clinical/Sharps','Confidential Documents','Electrical/WEEE','Hazardous','Bulky Items')),

  collection_frequency   text        NOT NULL CHECK (collection_frequency IN ('Daily','Twice Weekly','Weekly','Fortnightly','Monthly','On Request')),

  provider_name              text        NULL,
  annual_cost                numeric     NULL,
  contamination_found        boolean     NOT NULL DEFAULT false,
  contamination_details      text        NULL,

  bin_condition              text        NOT NULL CHECK (bin_condition IN ('Good','Fair','Poor','Replacement Needed')),
  storage_compliant          boolean     NOT NULL DEFAULT false,
  young_people_involved      boolean     NOT NULL DEFAULT false,
  duty_of_care_compliant     boolean     NOT NULL DEFAULT false,
  waste_transfer_note_held   boolean     NOT NULL DEFAULT false,
  waste_carrier_licence_checked boolean  NOT NULL DEFAULT false,
  next_audit_date            date        NULL,

  compliance_status          text        NOT NULL CHECK (compliance_status IN ('Compliant','Non-Compliant','Action Required','Under Review')),

  notes             text    NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_home_waste_management ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_home_waste_management;
CREATE POLICY "Tenant isolation" ON cs_home_waste_management
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_home_waste_management_home
  ON cs_home_waste_management(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_home_waste_management_date
  ON cs_home_waste_management(audit_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
