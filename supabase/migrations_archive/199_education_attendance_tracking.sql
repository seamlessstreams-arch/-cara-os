-- Migration: 199_education_attendance_tracking
-- Table: cs_education_attendance_tracking
-- CHR 2015 Reg 8 (education), Reg 25 (education records)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_education_attendance_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  attendance_status text NOT NULL CHECK (attendance_status IN ('present','authorised_absence','unauthorised_absence','fixed_term_exclusion','permanent_exclusion','internal_exclusion','part_time_timetable','alternative_provision','school_holiday','other')),
  absence_reason text NOT NULL CHECK (absence_reason IN ('illness','medical_appointment','therapy_session','contact_visit','emotional_wellbeing','refused_to_attend','transport_issue','exclusion','none','other')),
  school_engagement text NOT NULL CHECK (school_engagement IN ('fully_engaged','mostly_engaged','partially_engaged','disengaged','not_assessed')),
  education_setting text NOT NULL CHECK (education_setting IN ('mainstream_school','special_school','alternative_provision','pru','home_education')),
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  recorded_by text NOT NULL,
  school_contacted boolean NOT NULL DEFAULT true,
  reason_documented boolean NOT NULL DEFAULT true,
  return_plan_in_place boolean NOT NULL DEFAULT false,
  pep_up_to_date boolean NOT NULL DEFAULT true,
  virtual_school_informed boolean NOT NULL DEFAULT false,
  social_worker_informed boolean NOT NULL DEFAULT false,
  child_views_sought boolean NOT NULL DEFAULT true,
  alternative_education_arranged boolean NOT NULL DEFAULT false,
  homework_supported boolean NOT NULL DEFAULT true,
  achievement_celebrated boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT false,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  sessions_attended integer NOT NULL DEFAULT 2,
  sessions_possible integer NOT NULL DEFAULT 2,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_education_attendance_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_education_attendance_tracking_home ON cs_education_attendance_tracking;
CREATE POLICY cs_education_attendance_tracking_home ON cs_education_attendance_tracking
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_education_attendance_tracking_home ON cs_education_attendance_tracking(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_education_attendance_tracking_date ON cs_education_attendance_tracking(attendance_date);
CREATE INDEX IF NOT EXISTS idx_cs_education_attendance_tracking_status ON cs_education_attendance_tracking(attendance_status);

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 199 education_attendance_tracking: %', SQLERRM;
END $$;
