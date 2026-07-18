-- Migration: 359_dental_optical_health
-- Domain: Children's Services — Dental & Optical Health
-- Description: Tracks dental check-ups, optical examinations, treatment compliance,
-- appointment attendance, provider details, anxiety support, consent, and follow-up
-- scheduling for looked-after children.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 10 (health), Reg 13 (healthcare provision),
-- NICE CG19 (dental recall intervals),
-- SCCIF: Health — "The home ensures timely dental and optical care."
-- Looked-after children health assessments, NHS dental access.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_dental_optical_health (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  appointment_date            date NOT NULL,
  recorded_by                 text NOT NULL,
  appointment_type            text NOT NULL DEFAULT 'Dental — Routine Check',
  provider_name               text NOT NULL,
  provider_type               text NOT NULL DEFAULT 'NHS',
  outcome                     text NOT NULL DEFAULT 'Attended',
  treatment_needed            boolean NOT NULL DEFAULT false,
  treatment_details           text NULL,
  anxiety_support_needed      boolean NOT NULL DEFAULT false,
  sedation_required           boolean NOT NULL DEFAULT false,
  consent_obtained            boolean NOT NULL DEFAULT false,
  accompanied_by              text NOT NULL,
  child_views_considered      boolean NOT NULL DEFAULT false,
  next_appointment_date       date NULL,
  overdue                     boolean NOT NULL DEFAULT false,
  social_worker_informed      boolean NULL,
  notes                       text NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_dental_optical_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_dental_optical_health
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_dental_optical_health_home
  ON cs_dental_optical_health(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_dental_optical_health_date
  ON cs_dental_optical_health(appointment_date);

CREATE INDEX IF NOT EXISTS idx_cs_dental_optical_health_type
  ON cs_dental_optical_health(appointment_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
