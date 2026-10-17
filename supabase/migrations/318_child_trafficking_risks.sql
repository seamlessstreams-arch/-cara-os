-- Migration: 318_child_trafficking_risks
-- Domain: Child Trafficking Risk Assessment
-- Tracks NRM referrals, trafficking types, first responder duties, safe placement

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_child_trafficking_risks (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  assessment_date  date        NOT NULL,
  assessor_name    text        NOT NULL,
  child_name       text        NOT NULL,

  risk_level       text        NOT NULL CHECK (risk_level IN ('No Identified Risk','Low','Medium','High','Immediate')),
  trafficking_type text        NOT NULL CHECK (trafficking_type IN ('Sexual Exploitation','Labour Exploitation','Criminal Exploitation','Domestic Servitude','Organ Harvesting','Forced Begging','Benefit Fraud','Not Determined')),
  country_of_origin text       NULL,

  nrm_referral_made       boolean NOT NULL DEFAULT false,
  nrm_decision            text    NULL CHECK (nrm_decision IS NULL OR nrm_decision IN ('Reasonable Grounds','Conclusive Grounds','Negative','Pending','Suspended')),
  first_responder_notified boolean NOT NULL DEFAULT false,
  safety_plan_in_place    boolean NOT NULL DEFAULT false,
  safe_accommodation      boolean NOT NULL DEFAULT false,
  multi_agency_referral   boolean NOT NULL DEFAULT false,
  police_notification     boolean NOT NULL DEFAULT false,
  independent_advocate    boolean NOT NULL DEFAULT false,

  next_review_date     date    NULL,
  compliance_status    text    NOT NULL CHECK (compliance_status IN ('Compliant','Non-Compliant','Under Review','Escalated')),
  notes                text    NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_child_trafficking_risks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_child_trafficking_risks;
CREATE POLICY "Tenant isolation" ON cs_child_trafficking_risks
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_child_trafficking_risks_home
  ON cs_child_trafficking_risks(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_child_trafficking_risks_date
  ON cs_child_trafficking_risks(assessment_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
