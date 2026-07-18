-- Migration: 332_harmful_sexual_behaviour
-- Domain: Child Protection — Harmful Sexual Behaviour Management
-- Description: Tracks HSB incidents, Hackett continuum assessments, AIM3 framework,
-- Brook Traffic Light tool usage, specialist referrals, safety plans, and multi-agency
-- responses for children in residential care.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 12 (protection of children), Reg 34 (positive behaviour support),
-- NICE NG55 (HSB in children), Hackett continuum (normal → violent),
-- AIM3 assessment framework, Brook Traffic Light Tool,
-- SCCIF: Safety — "The home manages HSB risks effectively."
-- KCSIE 2023 peer-on-peer abuse.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_harmful_sexual_behaviour (
  id                            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                    text NOT NULL,
  incident_date                 date NOT NULL,
  assessor_name                 text NOT NULL,
  referral_source               text NOT NULL DEFAULT 'Staff Observation',
  behaviour_category            text NOT NULL DEFAULT 'Inappropriate',
  behaviour_description         text NOT NULL,
  victim_involved               boolean NOT NULL DEFAULT false,
  victim_support_provided       boolean NOT NULL DEFAULT false,
  aim_assessment_completed      boolean NOT NULL DEFAULT false,
  brook_traffic_light_used      boolean NOT NULL DEFAULT false,
  specialist_referral_made      boolean NOT NULL DEFAULT false,
  specialist_service            text NULL,
  safety_plan_in_place          boolean NOT NULL DEFAULT false,
  environmental_risk_assessment boolean NOT NULL DEFAULT false,
  sleeping_arrangements_reviewed boolean NOT NULL DEFAULT false,
  supervision_level_adjusted    boolean NOT NULL DEFAULT false,
  police_notified               boolean NOT NULL DEFAULT false,
  social_worker_informed        boolean NOT NULL DEFAULT false,
  parents_carers_informed       boolean NOT NULL DEFAULT false,
  multi_agency_meeting_held     boolean NOT NULL DEFAULT false,
  child_views_obtained          boolean NOT NULL DEFAULT false,
  therapeutic_support           boolean NOT NULL DEFAULT false,
  risk_level                    text NOT NULL DEFAULT 'Medium',
  review_date                   date NULL,
  outcome                       text NOT NULL DEFAULT 'Monitoring',
  status                        text NOT NULL DEFAULT 'Active',
  notes                         text NULL,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_harmful_sexual_behaviour ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_harmful_sexual_behaviour
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_harmful_sexual_behaviour_home
  ON cs_harmful_sexual_behaviour(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_harmful_sexual_behaviour_child
  ON cs_harmful_sexual_behaviour(child_name);

CREATE INDEX IF NOT EXISTS idx_cs_harmful_sexual_behaviour_date
  ON cs_harmful_sexual_behaviour(incident_date);

CREATE INDEX IF NOT EXISTS idx_cs_harmful_sexual_behaviour_risk
  ON cs_harmful_sexual_behaviour(risk_level);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
