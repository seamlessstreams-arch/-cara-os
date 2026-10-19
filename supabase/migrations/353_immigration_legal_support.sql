-- Migration: 353_immigration_legal_support
-- Domain: Children's Services — Immigration Status & Legal Support
-- Description: Tracks immigration status, legal proceedings, and support for
-- looked-after children subject to immigration control including status updates,
-- solicitor appointments, Home Office correspondence, biometric appointments,
-- appeal hearings, tribunals, age assessments, travel document applications,
-- citizenship applications, leave to remain applications, status decisions,
-- support meetings, right to work checks, NI number applications, and
-- emergency legal support.
--
-- UK Regulatory Framework:
-- Immigration Act 2016, Nationality and Borders Act 2022,
-- UNCRC Article 22 (refugee children),
-- Home Office guidance on children subject to immigration control,
-- CHR 2015 Reg 5 (meeting individual needs),
-- SCCIF: Overall experiences — "The home supports children with immigration needs."

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_immigration_legal_support (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  record_date                 date NOT NULL,
  worker_name                 text NOT NULL,
  record_type                 text NOT NULL DEFAULT 'Status Update',
  current_immigration_status  text NOT NULL DEFAULT 'Pending Decision',
  legal_representation        boolean NOT NULL DEFAULT false,
  solicitor_firm              text NULL,
  legal_aid_funded            boolean NOT NULL DEFAULT false,
  interpreter_required        boolean NOT NULL DEFAULT false,
  interpreter_language        text NULL,
  deadline_date               date NULL,
  action_required             text NULL,
  outcome                     text NULL,
  social_worker_informed      boolean NOT NULL DEFAULT false,
  personal_adviser_involved   boolean NOT NULL DEFAULT false,
  emotional_support_provided  boolean NOT NULL DEFAULT false,
  next_appointment_date       date NULL,
  status                      text NOT NULL DEFAULT 'Active',
  notes                       text NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_immigration_legal_support ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_immigration_legal_support
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_immigration_legal_support_home
  ON cs_immigration_legal_support(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_immigration_legal_support_date
  ON cs_immigration_legal_support(record_date);

CREATE INDEX IF NOT EXISTS idx_cs_immigration_legal_support_status
  ON cs_immigration_legal_support(status);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
