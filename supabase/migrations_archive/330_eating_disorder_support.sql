-- Migration: 330_eating_disorder_support
-- Domain: Eating Disorder & Disordered Eating Support
-- Tracks assessments, specialist referrals, meal plans, monitoring regimes,
-- behavioural indicators, professional engagement, and recovery status for
-- children with eating disorders or disordered eating patterns.
-- CHR 2015 Reg 10 (health and wellbeing), Reg 13 (health care arrangements),
-- NICE NG69 (eating disorders), NICE QS175,
-- SCCIF: Health -- "The home ensures children's physical and mental health needs are met."

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_eating_disorder_support (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  child_name                  text        NOT NULL,
  assessment_date             date        NOT NULL,
  lead_professional           text        NOT NULL,

  concern_type                text        NOT NULL CHECK (concern_type IN ('Anorexia Nervosa','Bulimia Nervosa','Binge Eating Disorder','ARFID','Orthorexia','Pica','Rumination Disorder','Disordered Eating Patterns','Body Image Concerns','Emotional Eating','Other')),
  risk_level                  text        NOT NULL CHECK (risk_level IN ('Low','Medium','High','Critical')),

  weight_monitoring_in_place  boolean     NOT NULL DEFAULT false,
  gp_consulted                boolean     NOT NULL DEFAULT false,
  specialist_referral_made    boolean     NOT NULL DEFAULT false,
  specialist_service          text        NULL,
  camhs_engaged               boolean     NOT NULL DEFAULT false,
  dietitian_involved          boolean     NOT NULL DEFAULT false,
  meal_plan_in_place          boolean     NOT NULL DEFAULT false,
  supervised_meals            boolean     NOT NULL DEFAULT false,
  bathroom_supervision        boolean     NOT NULL DEFAULT false,
  exercise_monitoring         boolean     NOT NULL DEFAULT false,

  purging_behaviours_identified   boolean NOT NULL DEFAULT false,
  food_restriction_identified     boolean NOT NULL DEFAULT false,
  binge_behaviours_identified     boolean NOT NULL DEFAULT false,
  self_induced_vomiting           boolean NOT NULL DEFAULT false,
  laxative_misuse                 boolean NOT NULL DEFAULT false,

  body_weight_status          text        NOT NULL CHECK (body_weight_status IN ('Significantly Underweight','Underweight','Healthy Weight','Overweight','Unknown')),

  young_person_engaged        boolean     NOT NULL DEFAULT false,
  family_involved             boolean     NOT NULL DEFAULT false,
  school_aware                boolean     NOT NULL DEFAULT false,
  social_worker_informed      boolean     NOT NULL DEFAULT false,

  review_date                 date        NULL,
  status                      text        NOT NULL CHECK (status IN ('Active','Under Review','Recovery','Relapse','Discharged')),
  notes                       text        NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_eating_disorder_support ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_eating_disorder_support;
CREATE POLICY "Tenant isolation" ON cs_eating_disorder_support
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_eating_disorder_support_home
  ON cs_eating_disorder_support(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_eating_disorder_support_date
  ON cs_eating_disorder_support(assessment_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
