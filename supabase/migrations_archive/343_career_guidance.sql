-- Migration: 343_career_guidance
-- Domain: Children's Services — Career Guidance & Work Experience
-- Description: Tracks career guidance and work experience activities including
-- careers interviews, skills assessments, CV writing, interview practice,
-- job search support, work experience placements, employer encounters,
-- workplace visits, mentoring sessions, careers fairs, online research,
-- personal statement support, labour market information, apprenticeship
-- exploration, self-employment awareness, and volunteering placements.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 5 (preparing for independence),
-- Education Act 2011 s29 (duty to provide independent careers guidance),
-- Careers Strategy 2017,
-- Gatsby Benchmarks (8 benchmarks of good careers guidance),
-- Baker Clause (provider access),
-- SCCIF: Experiences and progress — "The home supports educational
-- and career aspirations."

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_career_guidance (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  young_person_name           text NOT NULL,
  session_date                date NOT NULL,
  facilitator_name            text NOT NULL,
  activity_type               text NOT NULL DEFAULT 'Careers Interview',
  gatsby_benchmark            text NULL,
  employer_name               text NULL,
  placement_sector            text NULL,
  duration_hours              numeric NULL,
  young_person_engaged        boolean NOT NULL DEFAULT true,
  practical_component         boolean NOT NULL DEFAULT false,
  cv_created_updated          boolean NOT NULL DEFAULT false,
  interview_skills_practised  boolean NOT NULL DEFAULT false,
  pathway_plan_linked         boolean NOT NULL DEFAULT false,
  personal_adviser_involved   boolean NOT NULL DEFAULT false,
  social_worker_informed      boolean NOT NULL DEFAULT false,
  confidence_before           text NOT NULL DEFAULT 'Medium',
  confidence_after            text NOT NULL DEFAULT 'Medium',
  next_session_date           date NULL,
  notes                       text NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_career_guidance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_career_guidance
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_career_guidance_home
  ON cs_career_guidance(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_career_guidance_date
  ON cs_career_guidance(session_date);

CREATE INDEX IF NOT EXISTS idx_cs_career_guidance_type
  ON cs_career_guidance(activity_type);

CREATE INDEX IF NOT EXISTS idx_cs_career_guidance_benchmark
  ON cs_career_guidance(gatsby_benchmark);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
