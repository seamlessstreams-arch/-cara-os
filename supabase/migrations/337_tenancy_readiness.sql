-- Migration: 337_tenancy_readiness
-- Domain: Leaving Care — Tenancy Readiness & Housing Skills
-- Description: Tracks tenancy readiness sessions for care leavers, including
-- housing skill areas, delivery methods, competency assessments, engagement,
-- practical components, housing applications, pathway plan linkage, and
-- personal adviser involvement.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 5 (preparing children for independence),
-- Children (Leaving Care) Act 2000,
-- Homelessness Reduction Act 2017,
-- SCCIF: Experiences and progress — "Young people are prepared for independent
-- living including housing."
-- DfE statutory guidance on care leavers.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_tenancy_readiness (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  young_person_name           text NOT NULL,
  session_date                date NOT NULL,
  facilitator_name            text NOT NULL,
  skill_area                  text NOT NULL DEFAULT 'Understanding Tenancy Agreements',
  delivery_method             text NOT NULL DEFAULT '1-to-1 Session',
  competency_level            text NOT NULL DEFAULT 'Not Yet Started',
  young_person_engaged        boolean NOT NULL DEFAULT false,
  practical_component         boolean NOT NULL DEFAULT false,
  housing_application_started boolean NOT NULL DEFAULT false,
  housing_register_joined     boolean NOT NULL DEFAULT false,
  deposit_scheme_aware        boolean NOT NULL DEFAULT false,
  guarantee_scheme_explored   boolean NOT NULL DEFAULT false,
  pathway_plan_linked         boolean NOT NULL DEFAULT false,
  personal_adviser_involved   boolean NOT NULL DEFAULT false,
  social_worker_informed      boolean NOT NULL DEFAULT false,
  next_session_date           date NULL,
  notes                       text NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_tenancy_readiness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_tenancy_readiness
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_tenancy_readiness_home
  ON cs_tenancy_readiness(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_tenancy_readiness_date
  ON cs_tenancy_readiness(session_date);

CREATE INDEX IF NOT EXISTS idx_cs_tenancy_readiness_skill
  ON cs_tenancy_readiness(skill_area);

CREATE INDEX IF NOT EXISTS idx_cs_tenancy_readiness_competency
  ON cs_tenancy_readiness(competency_level);

CREATE INDEX IF NOT EXISTS idx_cs_tenancy_readiness_yp
  ON cs_tenancy_readiness(young_person_name);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
