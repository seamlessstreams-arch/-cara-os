-- Migration: 347_sexual_health_education
-- Domain: Children's Services — Sexual Health & Relationships Education
-- Description: Tracks sexual health and relationships education sessions for
-- looked-after children including RSE lessons, 1-to-1 discussions, C-Card scheme
-- access, clinic appointments, GP referrals, pregnancy test support, STI screening,
-- contraception advice, healthy relationships sessions, consent education, online
-- safety (sexual content), CSE awareness, puberty support, gender identity support,
-- LGBTQ+ support, and body confidence sessions.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 10 (health), Reg 13 (healthcare provision),
-- DfE RSHE statutory guidance 2020,
-- Gillick competency, Fraser guidelines,
-- Brook guidance,
-- SCCIF: Health — "The home supports age-appropriate sexual health education."
-- NICE PH51 (contraception), BASHH guidelines.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_sexual_health_education (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  session_date                date NOT NULL,
  facilitator_name            text NOT NULL,
  session_type                text NOT NULL DEFAULT 'RSE Lesson',
  age_appropriate             boolean NOT NULL DEFAULT true,
  gillick_competent           boolean NULL,
  consent_given               boolean NOT NULL DEFAULT true,
  confidentiality_explained   boolean NOT NULL DEFAULT true,
  safeguarding_concerns       boolean NOT NULL DEFAULT false,
  concern_details             text NULL,
  referral_made               boolean NOT NULL DEFAULT false,
  referral_service            text NULL,
  school_aware                boolean NOT NULL DEFAULT false,
  social_worker_informed      boolean NOT NULL DEFAULT false,
  young_person_engaged        boolean NOT NULL DEFAULT true,
  resources_provided          boolean NOT NULL DEFAULT false,
  follow_up_required          boolean NOT NULL DEFAULT false,
  follow_up_date              date NULL,
  notes                       text NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_sexual_health_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_sexual_health_education
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_sexual_health_education_home
  ON cs_sexual_health_education(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_sexual_health_education_date
  ON cs_sexual_health_education(session_date);

CREATE INDEX IF NOT EXISTS idx_cs_sexual_health_education_type
  ON cs_sexual_health_education(session_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
