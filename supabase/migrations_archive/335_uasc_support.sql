-- Migration: 335_uasc_support
-- Domain: Children's Services — Unaccompanied Asylum-Seeking Children (UASC) Support
-- Description: Tracks UASC assessments, immigration status, legal representation,
-- interpreter needs, age assessments, trafficking screening, NRM referrals,
-- education provision, health screening, mental health support, cultural and
-- religious needs, and review scheduling.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 5 (individual needs — immigration, language, culture),
-- Immigration Act 2016, National Transfer Scheme,
-- UNCRC Articles 22 & 37,
-- SCCIF: Overall experiences — "The home meets UASC children's additional needs."
-- Home Office UASC guidance 2023,
-- Age assessment (Merton compliant).

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_uasc_support (
  id                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                text NOT NULL,
  record_date               date NOT NULL,
  worker_name               text NOT NULL,
  record_type               text NOT NULL DEFAULT 'Initial Assessment',
  immigration_status        text NOT NULL DEFAULT 'Pre-Decision',
  legal_representation      boolean NOT NULL DEFAULT false,
  solicitor_name            text NULL,
  interpreter_required      boolean NOT NULL DEFAULT false,
  interpreter_language      text NULL,
  age_assessment_status     text NOT NULL DEFAULT 'Not Required',
  trafficking_indicators    boolean NOT NULL DEFAULT false,
  nrm_referred              boolean NOT NULL DEFAULT false,
  education_provision       text NOT NULL DEFAULT 'Awaiting Placement',
  health_screening_completed boolean NOT NULL DEFAULT false,
  mental_health_support     boolean NOT NULL DEFAULT false,
  cultural_needs_met        boolean NOT NULL DEFAULT false,
  religious_needs_met       boolean NOT NULL DEFAULT false,
  social_worker_informed    boolean NOT NULL DEFAULT false,
  next_review_date          date NULL,
  status                    text NOT NULL DEFAULT 'Active',
  notes                     text NULL,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_uasc_support ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_uasc_support
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_uasc_support_home
  ON cs_uasc_support(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_uasc_support_date
  ON cs_uasc_support(record_date);

CREATE INDEX IF NOT EXISTS idx_cs_uasc_support_type
  ON cs_uasc_support(record_type);

CREATE INDEX IF NOT EXISTS idx_cs_uasc_support_status
  ON cs_uasc_support(status);

CREATE INDEX IF NOT EXISTS idx_cs_uasc_support_immigration
  ON cs_uasc_support(immigration_status);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
