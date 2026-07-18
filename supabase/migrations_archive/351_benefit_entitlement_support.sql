-- Migration: 351_benefit_entitlement_support
-- Domain: Children's Services — Benefit Entitlement & Welfare Support
-- Description: Tracks benefit entitlement awareness, application support, and
-- welfare provision for care leavers and looked-after young people. Covers
-- Universal Credit, Housing Benefit, Council Tax Exemption, PIP, DLA, ESA,
-- Carers Allowance, Healthy Start Vouchers, education bursaries, care leaver
-- grants, and utility support schemes.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 5 (independence preparation),
-- Children (Leaving Care) Act 2000,
-- DWP guidance for care leavers,
-- Universal Credit for care leavers (exempt from shared accommodation rate),
-- Council tax exemption for care leavers,
-- SCCIF: Experiences & progress — "Young people understand their entitlements."

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_benefit_entitlement_support (
  id                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  young_person_name         text NOT NULL,
  record_date               date NOT NULL,
  supporting_staff          text NOT NULL,
  entitlement_type          text NOT NULL DEFAULT 'Universal Credit',
  support_stage             text NOT NULL DEFAULT 'Awareness Raising',
  amount_awarded            numeric NULL,
  payment_frequency         text NULL,
  young_person_engaged      boolean NOT NULL DEFAULT true,
  application_successful    boolean NULL,
  appeal_outcome            text NULL,
  personal_adviser_involved boolean NOT NULL DEFAULT false,
  social_worker_informed    boolean NOT NULL DEFAULT false,
  pathway_plan_linked       boolean NOT NULL DEFAULT false,
  next_review_date          date NULL,
  notes                     text NULL,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_benefit_entitlement_support ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_benefit_entitlement_support
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_benefit_entitlement_support_home
  ON cs_benefit_entitlement_support(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_benefit_entitlement_support_date
  ON cs_benefit_entitlement_support(record_date);

CREATE INDEX IF NOT EXISTS idx_cs_benefit_entitlement_support_type
  ON cs_benefit_entitlement_support(entitlement_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
