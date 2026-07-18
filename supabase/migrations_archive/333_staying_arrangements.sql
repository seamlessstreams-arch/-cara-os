-- Migration: 333_staying_arrangements
-- Domain: Leaving Care — Staying Put & Staying Close Arrangements
-- Description: Tracks Staying Put and Staying Close arrangements for care leavers,
-- including pathway planning, financial arrangements, education/training status,
-- independent living skills progress, and review management.
--
-- UK Regulatory Framework:
-- Children and Families Act 2014 s98 (Staying Put),
-- Children and Social Work Act 2017 (Staying Close),
-- DfE Staying Put guidance 2021,
-- CHR 2015 Reg 5 (independence preparation),
-- SCCIF: Experiences and progress — "Young people are supported beyond 18."
-- Leaving Care Act 2000 pathway planning.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staying_arrangements (
  id                              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  young_person_name               text NOT NULL,
  arrangement_type                text NOT NULL DEFAULT 'Staying Put',
  start_date                      date NOT NULL,
  planned_end_date                date NULL,
  actual_end_date                 date NULL,
  previous_placement_type         text NOT NULL DEFAULT 'Residential',
  current_accommodation           text NOT NULL,
  support_level                   text NOT NULL DEFAULT 'Regular',
  personal_adviser_name           text NOT NULL,
  pathway_plan_in_place           boolean NOT NULL DEFAULT false,
  pathway_plan_review_date        date NULL,
  financial_arrangement           text NOT NULL DEFAULT 'Local Authority Funded',
  weekly_support_hours            numeric NULL,
  education_training_status       text NOT NULL DEFAULT 'In Education',
  health_needs_met                boolean NOT NULL DEFAULT true,
  mental_health_support           boolean NOT NULL DEFAULT false,
  independent_living_skills_progress text NOT NULL DEFAULT 'Developing',
  social_network_maintained       boolean NOT NULL DEFAULT true,
  young_person_satisfied          boolean NOT NULL DEFAULT true,
  regular_contact_maintained      boolean NOT NULL DEFAULT true,
  review_frequency                text NOT NULL DEFAULT 'Monthly',
  last_review_date                date NULL,
  risk_of_breakdown               boolean NOT NULL DEFAULT false,
  early_termination_risk          text NULL,
  status                          text NOT NULL DEFAULT 'Active',
  notes                           text NULL,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_staying_arrangements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_staying_arrangements
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_staying_arrangements_home
  ON cs_staying_arrangements(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_staying_arrangements_yp
  ON cs_staying_arrangements(young_person_name);

CREATE INDEX IF NOT EXISTS idx_cs_staying_arrangements_type
  ON cs_staying_arrangements(arrangement_type);

CREATE INDEX IF NOT EXISTS idx_cs_staying_arrangements_status
  ON cs_staying_arrangements(status);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
