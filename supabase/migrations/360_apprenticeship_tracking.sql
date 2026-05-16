-- Migration: 360_apprenticeship_tracking
-- Domain: Children's Services — Apprenticeship & Vocational Training Tracking
-- Description: Tracks apprenticeship exploration, applications, enrolment, progress
-- reviews, employer liaison, bursary applications, qualification achievements, and
-- pastoral support for looked-after young people.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 5 (education/development),
-- Apprenticeships, Skills, Children and Learning Act 2009,
-- DfE apprenticeship funding for care leavers (bursary),
-- SCCIF: Experiences & progress — "The home supports vocational aspirations."
-- Gatsby Benchmark 6 (experiences of workplaces).

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_apprenticeship_tracking (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  young_person_name           text NOT NULL,
  record_date                 date NOT NULL,
  supporting_staff            text NOT NULL,
  record_type                 text NOT NULL DEFAULT 'Exploration Session',
  apprenticeship_level        text NULL,
  sector                      text NULL,
  employer_name               text NULL,
  training_provider           text NULL,
  start_date                  date NULL,
  expected_end_date           date NULL,
  bursary_applied             boolean NOT NULL DEFAULT false,
  bursary_received            boolean NOT NULL DEFAULT false,
  young_person_engaged        boolean NOT NULL DEFAULT false,
  personal_adviser_involved   boolean NOT NULL DEFAULT false,
  pathway_plan_linked         boolean NOT NULL DEFAULT false,
  social_worker_informed      boolean NOT NULL DEFAULT false,
  at_risk_of_dropping_out     boolean NOT NULL DEFAULT false,
  support_plan_in_place       boolean NULL,
  notes                       text NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_apprenticeship_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_apprenticeship_tracking
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_apprenticeship_tracking_home
  ON cs_apprenticeship_tracking(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_apprenticeship_tracking_date
  ON cs_apprenticeship_tracking(record_date);

CREATE INDEX IF NOT EXISTS idx_cs_apprenticeship_tracking_type
  ON cs_apprenticeship_tracking(record_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
