-- Migration: 364_respite_arrangements
-- Domain: Children's Services — Respite & Short Break Arrangements
-- Description: Tracks planned and emergency respite care, short breaks, shared care
-- arrangements, and specialist breaks for looked-after children. Covers provider
-- details, care plan sharing, handover procedures, and child experience outcomes.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 7 (children's plan), Children Act 1989 s17/s20,
-- Short Breaks Regulations 2011,
-- SCCIF: Overall experiences — "The home arranges appropriate breaks."
-- SEND Short Breaks duty.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_respite_arrangements (
  id                              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                      text NOT NULL,
  break_date                      date NOT NULL,
  return_date                     date NOT NULL,
  arrangement_type                text NOT NULL DEFAULT 'Planned Respite',
  provider_name                   text NOT NULL,
  provider_type                   text NOT NULL DEFAULT 'Another Residential Home',
  risk_assessment_completed       boolean NOT NULL DEFAULT false,
  care_plan_shared                boolean NOT NULL DEFAULT false,
  medication_plan_shared          boolean NOT NULL DEFAULT false,
  dietary_needs_shared            boolean NOT NULL DEFAULT false,
  emergency_contacts_provided     boolean NOT NULL DEFAULT false,
  child_prepared                  boolean NOT NULL DEFAULT false,
  child_views_obtained            boolean NOT NULL DEFAULT false,
  social_worker_approved          boolean NOT NULL DEFAULT false,
  parental_consent                boolean NULL,
  handover_completed              boolean NOT NULL DEFAULT false,
  return_debrief                  boolean NOT NULL DEFAULT false,
  child_experience_rating         text NULL,
  concerns_raised                 boolean NOT NULL DEFAULT false,
  concern_details                 text NULL,
  next_break_date                 date NULL,
  notes                           text NULL,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_respite_arrangements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_respite_arrangements
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_respite_arrangements_home
  ON cs_respite_arrangements(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_respite_arrangements_date
  ON cs_respite_arrangements(break_date);

CREATE INDEX IF NOT EXISTS idx_cs_respite_arrangements_type
  ON cs_respite_arrangements(arrangement_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
