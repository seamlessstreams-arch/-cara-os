-- Migration: 354_digital_wellbeing
-- Domain: Children's Services — Social Media & Digital Wellbeing Management
-- Description: Tracks social media risk assessments, screen time reviews,
-- privacy settings checks, age verification reviews, content filtering,
-- online friendship audits, gaming risk assessments, account management,
-- digital literacy sessions, online bullying responses, image sharing and
-- live streaming risk assessments, dark web awareness, digital footprint
-- reviews, and positive digital use celebrations.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 12 (online safety),
-- KCSIE 2023 (online safety),
-- UK Age Appropriate Design Code (Children's Code),
-- Online Safety Act 2023,
-- SCCIF: Safety — "The home manages online risks."
-- Ofcom guidance on children's media use.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_digital_wellbeing (
  id                                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                           uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                        text NOT NULL,
  record_date                       date NOT NULL,
  recorded_by                       text NOT NULL,
  record_type                       text NOT NULL DEFAULT 'Social Media Risk Assessment',
  platform_involved                 text NULL,
  risk_level                        text NOT NULL DEFAULT 'No Identified Risk',
  age_appropriate_use               boolean NOT NULL DEFAULT true,
  privacy_settings_reviewed         boolean NOT NULL DEFAULT false,
  contact_with_strangers_identified boolean NOT NULL DEFAULT false,
  harmful_content_exposure          boolean NOT NULL DEFAULT false,
  cyberbullying_identified          boolean NOT NULL DEFAULT false,
  image_sharing_concerns            boolean NOT NULL DEFAULT false,
  excessive_use_identified          boolean NOT NULL DEFAULT false,
  parental_controls_active          boolean NOT NULL DEFAULT false,
  agreed_screen_time_hours          numeric NULL,
  actual_screen_time_hours          numeric NULL,
  action_taken                      text NULL,
  education_provided                boolean NOT NULL DEFAULT false,
  child_views_obtained              boolean NOT NULL DEFAULT false,
  social_worker_informed            boolean NULL,
  next_review_date                  date NULL,
  notes                             text NULL,
  created_at                        timestamptz NOT NULL DEFAULT now(),
  updated_at                        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_digital_wellbeing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_digital_wellbeing
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_digital_wellbeing_home
  ON cs_digital_wellbeing(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_digital_wellbeing_date
  ON cs_digital_wellbeing(record_date);

CREATE INDEX IF NOT EXISTS idx_cs_digital_wellbeing_risk
  ON cs_digital_wellbeing(risk_level);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
