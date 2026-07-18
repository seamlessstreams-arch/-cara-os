-- Migration: 363_holiday_trip_planning
-- Domain: Children's Services — Holiday & Trip Planning
-- Description: Tracks day trips, holidays, overnight stays, educational visits, and
-- outings for looked-after children. Covers risk assessments, consent, staffing ratios,
-- transport, budgets, and child enjoyment outcomes.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 9 (quality of care — enjoyment/activities),
-- Reg 12 (risk assessment for trips),
-- SCCIF: Experiences — "Children enjoy holidays and outings."
-- Reg 40 (notification for holidays abroad).

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_holiday_trip_planning (
  id                              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                      text NOT NULL,
  trip_date                       date NOT NULL,
  return_date                     date NULL,
  organiser_name                  text NOT NULL,
  trip_type                       text NOT NULL DEFAULT 'Day Trip',
  destination                     text NOT NULL,
  risk_assessment_completed       boolean NOT NULL DEFAULT false,
  parental_consent                boolean NOT NULL DEFAULT false,
  social_worker_consent           boolean NULL,
  passport_checked                boolean NULL,
  insurance_arranged              boolean NOT NULL DEFAULT false,
  emergency_contacts_provided     boolean NOT NULL DEFAULT false,
  medication_packed               boolean NULL,
  dietary_needs_catered           boolean NOT NULL DEFAULT false,
  staffing_ratio_met              boolean NOT NULL DEFAULT false,
  transport_arranged              text NULL,
  budget                          numeric NULL,
  actual_cost                     numeric NULL,
  child_choice                    boolean NOT NULL DEFAULT false,
  child_enjoyment_rating          text NULL,
  notes                           text NULL,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_holiday_trip_planning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_holiday_trip_planning
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_holiday_trip_planning_home
  ON cs_holiday_trip_planning(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_holiday_trip_planning_date
  ON cs_holiday_trip_planning(trip_date);

CREATE INDEX IF NOT EXISTS idx_cs_holiday_trip_planning_type
  ON cs_holiday_trip_planning(trip_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
