-- Migration: 312_child_honour_based_abuse_risks
-- Domain: Child Honour-Based Abuse Risk Assessment
-- Tracks HBA risk assessments, safety planning, ACPO/CPS guidance compliance

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_child_honour_based_abuse_risks (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  assessment_date  date        NOT NULL,
  assessor_name    text        NOT NULL,
  child_name       text        NOT NULL,

  risk_level       text        NOT NULL CHECK (risk_level IN ('No Identified Risk','Low','Medium','High','Immediate')),
  abuse_type       text        NOT NULL CHECK (abuse_type IN ('Forced Marriage','FGM','Honour Killing Threat','Physical Violence','Emotional Abuse','Isolation','Financial Control','Not Determined')),
  perpetrator_relationship text NOT NULL CHECK (perpetrator_relationship IN ('Parent','Sibling','Extended Family','Community Member','Partner','Unknown','Other')),

  safety_plan_in_place       boolean NOT NULL DEFAULT false,
  multi_agency_referral      boolean NOT NULL DEFAULT false,
  police_notification        boolean NOT NULL DEFAULT false,
  specialist_service_engaged boolean NOT NULL DEFAULT false,
  safe_accommodation_secured boolean NOT NULL DEFAULT false,
  one_chance_rule_applied    boolean NOT NULL DEFAULT false,

  next_review_date     date    NULL,
  compliance_status    text    NOT NULL CHECK (compliance_status IN ('Compliant','Non-Compliant','Under Review','Escalated')),
  notes                text    NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_child_honour_based_abuse_risks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_child_honour_based_abuse_risks;
CREATE POLICY "Tenant isolation" ON cs_child_honour_based_abuse_risks
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_child_hba_risks_home
  ON cs_child_honour_based_abuse_risks(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_child_hba_risks_date
  ON cs_child_honour_based_abuse_risks(assessment_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
