-- Migration: 356_driving_independence
-- Domain: Children's Services — Driving Lessons & Transport Independence
-- Description: Tracks provisional licence applications, theory and practical test
-- preparation, driving lessons, CBT (moped/scooter), car insurance research, road
-- safety education, cycling proficiency, bus/train journey planning, and travel card
-- applications for care leavers and looked-after young people approaching independence.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 5 (independence preparation),
-- Children (Leaving Care) Act 2000,
-- DfE guidance on supporting care leavers,
-- SCCIF: Experiences & progress — "Young people are prepared for independence."
-- DVLA provisional licence at 17, theory test, CBT (moped).

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_driving_independence (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  young_person_name           text NOT NULL,
  record_date                 date NOT NULL,
  supporting_staff            text NOT NULL,
  activity_type               text NOT NULL DEFAULT 'Driving Lesson',
  provider_name               text NULL,
  lesson_number               integer NULL,
  total_lessons_funded        integer NULL,
  funding_source              text NOT NULL DEFAULT 'Local Authority',
  cost_per_lesson             numeric NULL,
  total_spent                 numeric NULL,
  young_person_engaged        boolean NOT NULL DEFAULT false,
  personal_adviser_involved   boolean NOT NULL DEFAULT false,
  pathway_plan_linked         boolean NOT NULL DEFAULT false,
  social_worker_informed      boolean NOT NULL DEFAULT false,
  next_milestone              text NULL,
  next_date                   date NULL,
  notes                       text NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_driving_independence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_driving_independence
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_driving_independence_home
  ON cs_driving_independence(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_driving_independence_date
  ON cs_driving_independence(record_date);

CREATE INDEX IF NOT EXISTS idx_cs_driving_independence_type
  ON cs_driving_independence(activity_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
