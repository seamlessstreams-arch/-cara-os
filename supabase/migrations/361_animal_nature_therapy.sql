-- Migration: 361_animal_nature_therapy
-- Domain: Children's Services — Animal-Assisted & Nature-Based Therapy
-- Description: Tracks equine-assisted therapy, canine-assisted therapy, farm therapy,
-- forest school, horticultural therapy, nature walks, pet responsibility programmes,
-- and other animal/nature-based therapeutic and recreational sessions for
-- looked-after children.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 9 (quality of care), Reg 10 (wellbeing),
-- NICE CG26 (PTSD — complementary therapies),
-- SCCIF: Experiences & progress — "The home provides therapeutic interventions."
-- Animal Welfare Act 2006, HSE guidance on animals in care settings.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_animal_nature_therapy (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  session_date                date NOT NULL,
  facilitator_name            text NOT NULL,
  therapy_type                text NOT NULL DEFAULT 'Equine-Assisted Therapy',
  animal_involved             text NULL,
  qualified_therapist         boolean NOT NULL DEFAULT false,
  therapy_or_activity         text NOT NULL DEFAULT 'Structured Activity',
  risk_assessment_completed   boolean NOT NULL DEFAULT false,
  allergy_check               boolean NOT NULL DEFAULT false,
  animal_welfare_compliant    boolean NOT NULL DEFAULT false,
  parental_consent            boolean NOT NULL DEFAULT false,
  child_choice                boolean NOT NULL DEFAULT false,
  engagement_level            text NOT NULL DEFAULT 'Participated',
  emotional_response          text NOT NULL DEFAULT 'Neutral',
  therapeutic_goal            text NULL,
  progress_noted              text NULL,
  linked_to_care_plan         boolean NOT NULL DEFAULT false,
  injury_occurred             boolean NOT NULL DEFAULT false,
  injury_details              text NULL,
  notes                       text NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_animal_nature_therapy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_animal_nature_therapy
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_animal_nature_therapy_home
  ON cs_animal_nature_therapy(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_animal_nature_therapy_date
  ON cs_animal_nature_therapy(session_date);

CREATE INDEX IF NOT EXISTS idx_cs_animal_nature_therapy_type
  ON cs_animal_nature_therapy(therapy_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
