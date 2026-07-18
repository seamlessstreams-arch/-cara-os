-- Migration: 316_staff_whistleblowing_management
-- Domain: Staff Whistleblowing Management
-- Tracks PIDA 1998 disclosures, investigation outcomes, whistleblower protection

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_whistleblowing_disclosures (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  disclosure_date   date        NOT NULL,
  handler_name      text        NOT NULL,
  discloser_name    text        NOT NULL,

  disclosure_type   text        NOT NULL CHECK (disclosure_type IN ('Safeguarding Concern','Criminal Offence','Health & Safety','Environmental Damage','Miscarriage of Justice','Regulatory Breach','Financial Misconduct','Cover-Up','Other')),
  disclosure_method text        NOT NULL CHECK (disclosure_method IN ('Internal','External Regulator','Police','CQC','Ofsted','Local Authority','Other')),

  investigation_opened    boolean NOT NULL DEFAULT false,
  investigation_outcome   text    NULL CHECK (investigation_outcome IS NULL OR investigation_outcome IN ('Substantiated','Partially Substantiated','Unsubstantiated','Inconclusive','Ongoing')),
  action_taken            boolean NOT NULL DEFAULT false,

  whistleblower_protected boolean NOT NULL DEFAULT true,
  anonymity_maintained    boolean NOT NULL DEFAULT true,
  detriment_reported      boolean NOT NULL DEFAULT false,
  feedback_provided       boolean NOT NULL DEFAULT false,
  regulator_notified      boolean NOT NULL DEFAULT false,

  compliance_status    text    NOT NULL CHECK (compliance_status IN ('Open','Under Investigation','Closed','Escalated')),
  notes                text    NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_staff_whistleblowing_disclosures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_staff_whistleblowing_disclosures;
CREATE POLICY "Tenant isolation" ON cs_staff_whistleblowing_disclosures
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_staff_whistleblowing_home
  ON cs_staff_whistleblowing_disclosures(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_staff_whistleblowing_date
  ON cs_staff_whistleblowing_disclosures(disclosure_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
