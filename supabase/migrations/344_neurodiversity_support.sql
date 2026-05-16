-- Migration: 344_neurodiversity_support
-- Domain: Children's Services — Neurodiversity & SEND Support
-- Description: Tracks neurodiversity and SEND support for looked-after children
-- including autism spectrum, ADHD, dyslexia, dyspraxia, sensory processing,
-- learning disabilities, speech and language disorders, attachment disorders,
-- EHCPs, specialist involvement, reasonable adjustments, sensory profiles,
-- communication plans, behaviour support plans, staff training, school liaison,
-- CAMHS involvement, OT, SALT, medication management, and transition planning.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 5 (individual needs),
-- CHR 2015 Reg 10 (health and wellbeing),
-- SEND Code of Practice 2015,
-- Equality Act 2010 (disability),
-- Autism Act 2009,
-- NICE CG170 (autism in under 19s),
-- NICE NG87 (ADHD),
-- SCCIF: Experiences & progress — "The home meets SEND children's needs."

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_neurodiversity_support (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  assessment_date             date NOT NULL,
  assessor_name               text NOT NULL,
  condition_type              text NOT NULL DEFAULT 'Autism Spectrum',
  diagnosis_status            text NOT NULL DEFAULT 'Awaiting Assessment',
  ehcp_in_place               boolean NOT NULL DEFAULT false,
  specialist_involved         boolean NOT NULL DEFAULT false,
  specialist_type             text NULL,
  reasonable_adjustments      text NOT NULL DEFAULT '',
  sensory_profile_completed   boolean NOT NULL DEFAULT false,
  communication_plan          boolean NOT NULL DEFAULT false,
  behaviour_support_plan      boolean NOT NULL DEFAULT false,
  staff_training_completed    boolean NOT NULL DEFAULT false,
  school_liaison              boolean NOT NULL DEFAULT false,
  camhs_involved              boolean NOT NULL DEFAULT false,
  ot_involved                 boolean NOT NULL DEFAULT false,
  salt_involved               boolean NOT NULL DEFAULT false,
  social_worker_informed      boolean NOT NULL DEFAULT false,
  medication_managed          boolean NOT NULL DEFAULT false,
  medication_details          text NULL,
  transition_plan             boolean NOT NULL DEFAULT false,
  review_date                 date NULL,
  status                      text NOT NULL DEFAULT 'Active',
  notes                       text NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_neurodiversity_support ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_neurodiversity_support
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_neurodiversity_support_home
  ON cs_neurodiversity_support(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_neurodiversity_support_date
  ON cs_neurodiversity_support(assessment_date);

CREATE INDEX IF NOT EXISTS idx_cs_neurodiversity_support_condition
  ON cs_neurodiversity_support(condition_type);

CREATE INDEX IF NOT EXISTS idx_cs_neurodiversity_support_status
  ON cs_neurodiversity_support(status);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
