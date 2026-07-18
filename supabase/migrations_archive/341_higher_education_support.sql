-- Migration: 341_higher_education_support
-- Domain: Children's Services — Higher Education & Further Education Support
-- Description: Tracks HE/FE support for looked-after children and care leavers
-- including UCAS applications, personal statement support, university visits,
-- student finance applications, bursary applications, accommodation planning,
-- course research, interview preparation, results day support, freshers
-- preparation, ongoing university support, college enrolment, apprenticeship
-- applications, and T-Level support.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 5 (development/independence),
-- Children (Leaving Care) Act 2000 s24B (assistance with education/training),
-- Children and Social Work Act 2017,
-- DfE guidance on supporting care leavers into higher education 2023,
-- SCCIF: Experiences and progress — "The home supports educational aspirations."
-- UCAS/student finance support.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_higher_education_support (
  id                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  young_person_name         text NOT NULL,
  record_date               date NOT NULL,
  supporting_staff          text NOT NULL,
  record_type               text NOT NULL DEFAULT 'Course Research',
  institution_name          text NULL,
  course_name               text NULL,
  qualification_level       text NOT NULL DEFAULT 'Other',
  application_status        text NOT NULL DEFAULT 'Not Applicable',
  student_finance_applied   boolean NOT NULL DEFAULT false,
  bursary_applied           boolean NOT NULL DEFAULT false,
  accommodation_secured     boolean NOT NULL DEFAULT false,
  personal_adviser_involved boolean NOT NULL DEFAULT false,
  pathway_plan_updated      boolean NOT NULL DEFAULT false,
  social_worker_informed    boolean NOT NULL DEFAULT false,
  young_person_engaged      boolean NOT NULL DEFAULT true,
  mentoring_in_place        boolean NOT NULL DEFAULT false,
  next_milestone_date       date NULL,
  notes                     text NULL,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_higher_education_support ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_higher_education_support
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_higher_education_support_home
  ON cs_higher_education_support(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_higher_education_support_date
  ON cs_higher_education_support(record_date);

CREATE INDEX IF NOT EXISTS idx_cs_higher_education_support_type
  ON cs_higher_education_support(record_type);

CREATE INDEX IF NOT EXISTS idx_cs_higher_education_support_status
  ON cs_higher_education_support(application_status);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
