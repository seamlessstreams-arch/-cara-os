-- Migration: 345_sleep_support
-- Domain: Children's Services — Sleep Support & Wellbeing
-- Description: Tracks sleep support and wellbeing for looked-after children
-- including sleep assessments, sleep diary entries, bedtime routine reviews,
-- sleep environment audits, melatonin reviews, sleep hygiene education,
-- night disturbance logs, nightmare/night terror records, sleep pattern
-- analysis, GP referrals, specialist referrals, waking night observations,
-- and review meetings.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 10 (health and wellbeing),
-- NICE CG158 (sleep problems in CYP),
-- CHR 2015 Reg 12 (children's safety — night supervision),
-- SCCIF: Health — "The home promotes good sleep hygiene."

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_sleep_support (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  record_date                 date NOT NULL,
  recorder_name               text NOT NULL,
  record_type                 text NOT NULL DEFAULT 'Sleep Diary Entry',
  sleep_quality               text NOT NULL DEFAULT 'Fair',
  bedtime                     time NULL,
  wake_time                   time NULL,
  estimated_hours             numeric NULL,
  night_disturbances          integer NULL,
  disturbance_type            text NULL,
  medication_involved         boolean NOT NULL DEFAULT false,
  medication_type             text NULL,
  sleep_environment_suitable  boolean NOT NULL DEFAULT true,
  screen_time_managed         boolean NOT NULL DEFAULT false,
  routine_followed            boolean NOT NULL DEFAULT false,
  young_person_input          boolean NOT NULL DEFAULT false,
  underlying_cause_identified text NULL,
  referral_made               boolean NOT NULL DEFAULT false,
  specialist_service          text NULL,
  next_review_date            date NULL,
  status                      text NOT NULL DEFAULT 'Active',
  notes                       text NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_sleep_support ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_sleep_support
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_sleep_support_home
  ON cs_sleep_support(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_sleep_support_date
  ON cs_sleep_support(record_date);

CREATE INDEX IF NOT EXISTS idx_cs_sleep_support_type
  ON cs_sleep_support(record_type);

CREATE INDEX IF NOT EXISTS idx_cs_sleep_support_status
  ON cs_sleep_support(status);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
