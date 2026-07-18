-- Migration: 313_staff_exit_interview_management
-- Domain: Staff Exit Interview Management
-- Tracks departure interviews, reasons, knowledge transfer, handover compliance

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_exit_interviews (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  interview_date    date        NOT NULL,
  interviewer_name  text        NOT NULL,
  staff_name        text        NOT NULL,

  departure_reason  text        NOT NULL CHECK (departure_reason IN ('Resignation','Retirement','Redundancy','End of Contract','Dismissal','Transfer','Career Change','Personal Reasons','Other')),
  departure_date    date        NOT NULL,
  notice_period_met boolean     NOT NULL DEFAULT true,

  knowledge_transfer_completed boolean NOT NULL DEFAULT false,
  handover_document_provided   boolean NOT NULL DEFAULT false,
  equipment_returned           boolean NOT NULL DEFAULT false,
  access_revoked               boolean NOT NULL DEFAULT false,
  final_pay_confirmed          boolean NOT NULL DEFAULT false,
  reference_agreed             boolean NOT NULL DEFAULT false,

  satisfaction_rating  integer NULL CHECK (satisfaction_rating BETWEEN 1 AND 10),
  would_recommend      boolean NULL,

  compliance_status    text    NOT NULL CHECK (compliance_status IN ('Complete','Incomplete','Pending','Overdue')),
  notes                text    NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_staff_exit_interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_staff_exit_interviews;
CREATE POLICY "Tenant isolation" ON cs_staff_exit_interviews
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_staff_exit_interviews_home
  ON cs_staff_exit_interviews(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_staff_exit_interviews_date
  ON cs_staff_exit_interviews(interview_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
