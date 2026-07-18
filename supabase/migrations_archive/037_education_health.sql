-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — EDUCATION & ACTIVITIES + HEALTH & WELLBEING
-- Migration 037: Education records, attendance, enrichment activities,
-- health profiles, appointments, and wellbeing assessments (SDQ) for
-- Reg 8, 10, and 23 compliance.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Education records ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_education_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id              uuid NOT NULL,
  education_status      text NOT NULL
                          CHECK (education_status IN (
                            'full_time_school','part_time_school','alternative_provision',
                            'preschool','college','apprenticeship','neet',
                            'home_educated','excluded','awaiting_placement'
                          )),
  school_name           text NOT NULL DEFAULT '',
  year_group            text,
  sen_status            text CHECK (sen_status IN ('none','sen_support','ehcp')),
  pupil_premium_plus    boolean NOT NULL DEFAULT false,
  virtual_school_contact text,
  designated_teacher    text,
  pep_date              date,
  next_pep_date         date,
  attendance_percentage numeric(5,2),
  exclusion_count       integer NOT NULL DEFAULT 0,
  achievements          jsonb NOT NULL DEFAULT '[]'::jsonb,
  concerns              jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_current            boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edu_home     ON cs_education_records(home_id);
CREATE INDEX IF NOT EXISTS idx_edu_child    ON cs_education_records(child_id);
CREATE INDEX IF NOT EXISTS idx_edu_status   ON cs_education_records(education_status);
CREATE INDEX IF NOT EXISTS idx_edu_current  ON cs_education_records(is_current);

-- ── Attendance entries ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_attendance_entries (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id              uuid NOT NULL,
  education_record_id   uuid NOT NULL REFERENCES cs_education_records(id) ON DELETE CASCADE,
  date                  date NOT NULL,
  mark                  text NOT NULL
                          CHECK (mark IN (
                            'present','authorised_absence','unauthorised_absence',
                            'late','excluded','medical','activity'
                          )),
  session               text NOT NULL CHECK (session IN ('am','pm')),
  notes                 text,
  recorded_by           uuid NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attend_home    ON cs_attendance_entries(home_id);
CREATE INDEX IF NOT EXISTS idx_attend_child   ON cs_attendance_entries(child_id);
CREATE INDEX IF NOT EXISTS idx_attend_date    ON cs_attendance_entries(date);
CREATE INDEX IF NOT EXISTS idx_attend_edu     ON cs_attendance_entries(education_record_id);

-- ── Activities / enrichment ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_activities (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id              uuid NOT NULL,
  activity_name         text NOT NULL,
  category              text NOT NULL
                          CHECK (category IN (
                            'sport','creative','social','educational','life_skills',
                            'community','therapeutic','outdoor','cultural','employment'
                          )),
  date                  date NOT NULL,
  duration_minutes      integer,
  location              text,
  description           text,
  child_feedback        text,
  child_enjoyed         boolean NOT NULL DEFAULT true,
  skills_developed      jsonb NOT NULL DEFAULT '[]'::jsonb,
  staff_member          uuid NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_home     ON cs_activities(home_id);
CREATE INDEX IF NOT EXISTS idx_activity_child    ON cs_activities(child_id);
CREATE INDEX IF NOT EXISTS idx_activity_category ON cs_activities(category);
CREATE INDEX IF NOT EXISTS idx_activity_date     ON cs_activities(date);

-- ── Health profiles ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_health_profiles (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                 uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                uuid NOT NULL UNIQUE,
  immunisation_status     text NOT NULL DEFAULT 'unknown'
                            CHECK (immunisation_status IN (
                              'up_to_date','partially_complete','unknown',
                              'declined','medical_exemption'
                            )),
  allergies               jsonb NOT NULL DEFAULT '[]'::jsonb,
  dietary_requirements    jsonb NOT NULL DEFAULT '[]'::jsonb,
  registered_gp           text NOT NULL DEFAULT '',
  registered_dentist      text NOT NULL DEFAULT '',
  registered_optician     text NOT NULL DEFAULT '',
  camhs_status            text NOT NULL DEFAULT 'none'
                            CHECK (camhs_status IN ('none','referred','active','discharged')),
  last_health_assessment  date,
  next_health_assessment  date,
  health_conditions       jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_home     ON cs_health_profiles(home_id);
CREATE INDEX IF NOT EXISTS idx_health_child    ON cs_health_profiles(child_id);

-- ── Health appointments ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_health_appointments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id              uuid NOT NULL,
  appointment_type      text NOT NULL
                          CHECK (appointment_type IN (
                            'gp','dentist','optician','camhs','hospital',
                            'specialist','sexual_health','immunisation','health_assessment'
                          )),
  provider_name         text NOT NULL DEFAULT '',
  appointment_date      date NOT NULL,
  outcome               text NOT NULL DEFAULT 'attended'
                          CHECK (outcome IN ('attended','cancelled','dna','rescheduled')),
  notes                 text,
  follow_up_required    boolean NOT NULL DEFAULT false,
  follow_up_date        date,
  consent_obtained      boolean NOT NULL DEFAULT true,
  accompanied_by        uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_appt_home   ON cs_health_appointments(home_id);
CREATE INDEX IF NOT EXISTS idx_health_appt_child  ON cs_health_appointments(child_id);
CREATE INDEX IF NOT EXISTS idx_health_appt_type   ON cs_health_appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_health_appt_date   ON cs_health_appointments(appointment_date);

-- ── Wellbeing assessments (including SDQ) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_wellbeing_assessments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id              uuid NOT NULL,
  assessment_date       date NOT NULL,
  assessment_type       text NOT NULL DEFAULT 'informal'
                          CHECK (assessment_type IN ('sdq','informal','professional')),
  sdq_scores            jsonb,
  overall_wellbeing     smallint NOT NULL CHECK (overall_wellbeing BETWEEN 1 AND 10),
  sleep_quality         smallint CHECK (sleep_quality BETWEEN 1 AND 5),
  appetite              smallint CHECK (appetite BETWEEN 1 AND 5),
  self_care             smallint CHECK (self_care BETWEEN 1 AND 5),
  notes                 text,
  assessed_by           uuid NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wellbeing_home   ON cs_wellbeing_assessments(home_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_child  ON cs_wellbeing_assessments(child_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_date   ON cs_wellbeing_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_wellbeing_type   ON cs_wellbeing_assessments(assessment_type);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE cs_education_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_attendance_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_activities             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_health_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_health_appointments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_wellbeing_assessments  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY edu_home_policy ON cs_education_records
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY attend_home_policy ON cs_attendance_entries
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY activity_home_policy ON cs_activities
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY health_profile_home_policy ON cs_health_profiles
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY health_appt_home_policy ON cs_health_appointments
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY wellbeing_home_policy ON cs_wellbeing_assessments
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
