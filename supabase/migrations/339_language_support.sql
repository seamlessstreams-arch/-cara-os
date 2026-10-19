-- Migration: 339_language_support
-- Domain: Children's Services — Language Support & Communication Needs
-- Description: Tracks language support and communication needs assessments for
-- children including first language support, EAL, BSL, Makaton, PECS, speech
-- therapy, augmentative devices, easy read materials, visual timetables,
-- social stories, interpreter services, translation services, communication
-- passports, and total communication approaches.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 5 (individual child's linguistic needs),
-- CHR 2015 Reg 7 (children's plan),
-- Equality Act 2010 (disability — communication needs),
-- SEND Code of Practice 2015,
-- SCCIF: Experiences and progress — "The home communicates effectively with all children.",
-- UNCRC Article 12/13 (right to express views),
-- UNCRC Article 30 (right to language).

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_language_support (
  id                              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                      text NOT NULL,
  assessment_date                 date NOT NULL,
  assessor_name                   text NOT NULL,
  support_type                    text NOT NULL DEFAULT 'First Language Support',
  primary_language                text NOT NULL,
  english_proficiency             text NOT NULL DEFAULT 'Fluent',
  communication_needs_level       text NOT NULL DEFAULT 'No Additional Needs',
  specialist_assessment_completed boolean NOT NULL DEFAULT false,
  speech_therapist_involved       boolean NOT NULL DEFAULT false,
  interpreter_regularly_used      boolean NOT NULL DEFAULT false,
  interpreter_language            text NULL,
  communication_tools_in_place    boolean NOT NULL DEFAULT false,
  staff_trained                   boolean NOT NULL DEFAULT false,
  individual_communication_plan   boolean NOT NULL DEFAULT false,
  child_views_accessible          boolean NOT NULL DEFAULT false,
  school_aware                    boolean NOT NULL DEFAULT false,
  social_worker_informed          boolean NOT NULL DEFAULT false,
  review_date                     date NULL,
  status                          text NOT NULL DEFAULT 'Active',
  notes                           text NULL,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_language_support ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_language_support
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_language_support_home
  ON cs_language_support(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_language_support_date
  ON cs_language_support(assessment_date);

CREATE INDEX IF NOT EXISTS idx_cs_language_support_type
  ON cs_language_support(support_type);

CREATE INDEX IF NOT EXISTS idx_cs_language_support_proficiency
  ON cs_language_support(english_proficiency);

CREATE INDEX IF NOT EXISTS idx_cs_language_support_status
  ON cs_language_support(status);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
