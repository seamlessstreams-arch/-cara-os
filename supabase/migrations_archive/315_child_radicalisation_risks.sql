-- Migration: 315_child_radicalisation_risks
-- Domain: Child Radicalisation Risk Assessment
-- Tracks Prevent duty referrals, Channel programme, extremism indicators

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_child_radicalisation_risks (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  assessment_date  date        NOT NULL,
  assessor_name    text        NOT NULL,
  child_name       text        NOT NULL,

  risk_level       text        NOT NULL CHECK (risk_level IN ('No Identified Risk','Low','Medium','High','Immediate')),
  extremism_type   text        NOT NULL CHECK (extremism_type IN ('Islamist','Far Right','Far Left','Incel','Mixed/Unclear','Single Issue','Not Determined')),
  indicator_type   text        NOT NULL CHECK (indicator_type IN ('Online Activity','Social Isolation','Expressed Views','Material Possession','Behavioural Change','Association','Travel Concerns','Not Determined')),

  prevent_referral_made   boolean NOT NULL DEFAULT false,
  channel_programme       boolean NOT NULL DEFAULT false,
  police_notification     boolean NOT NULL DEFAULT false,
  safety_plan_in_place    boolean NOT NULL DEFAULT false,
  multi_agency_referral   boolean NOT NULL DEFAULT false,
  internet_monitoring     boolean NOT NULL DEFAULT false,

  next_review_date     date    NULL,
  compliance_status    text    NOT NULL CHECK (compliance_status IN ('Compliant','Non-Compliant','Under Review','Escalated')),
  notes                text    NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_child_radicalisation_risks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_child_radicalisation_risks;
CREATE POLICY "Tenant isolation" ON cs_child_radicalisation_risks
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_child_radicalisation_risks_home
  ON cs_child_radicalisation_risks(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_child_radicalisation_risks_date
  ON cs_child_radicalisation_risks(assessment_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
