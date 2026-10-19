-- Migration: 326_self_harm_prevention_plans
-- Domain: Self-Harm Prevention Planning
-- Tracks prevention plans, triggers, coping strategies, supervision levels, CAMHS engagement
-- CHR 2015 Reg 12, Reg 13, NICE CG133, SCCIF Safety, DfE KCSIE 2023

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_self_harm_prevention_plans (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  child_name           text        NOT NULL,
  plan_date            date        NOT NULL,
  lead_professional    text        NOT NULL,
  review_date          date        NULL,

  triggers_identified      text    NOT NULL,
  warning_signs            text    NOT NULL,
  coping_strategies        text    NOT NULL,
  safe_environment_actions text    NOT NULL,
  professional_support     text    NOT NULL,
  emergency_contacts       text    NOT NULL,

  young_person_contributed boolean NOT NULL DEFAULT false,
  risk_level               text   NOT NULL CHECK (risk_level IN ('Low','Medium','High','Critical')),
  last_incident_date       date   NULL,
  frequency_category       text   NOT NULL CHECK (frequency_category IN ('Isolated','Occasional','Frequent','Daily','Historical')),
  method_awareness         boolean NOT NULL DEFAULT false,

  night_supervision_level  text   NOT NULL CHECK (night_supervision_level IN ('Standard','Enhanced','1-to-1','Waking Night')),
  sharps_management        text   NOT NULL CHECK (sharps_management IN ('Not Required','Locked Storage','Supervised Access','Full Restriction')),
  medication_management    text   NOT NULL CHECK (medication_management IN ('Self-Administered','Supervised','Controlled','Withheld Pending Review')),

  camhs_engaged            boolean NOT NULL DEFAULT false,
  school_aware             boolean NOT NULL DEFAULT false,
  social_worker_informed   boolean NOT NULL DEFAULT false,
  plan_shared_with_child   boolean NOT NULL DEFAULT false,

  status                   text   NOT NULL CHECK (status IN ('Active','Under Review','Archived')),
  notes                    text   NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_self_harm_prevention_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_self_harm_prevention_plans;
CREATE POLICY "Tenant isolation" ON cs_self_harm_prevention_plans
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_self_harm_prevention_plans_home
  ON cs_self_harm_prevention_plans(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_self_harm_prevention_plans_date
  ON cs_self_harm_prevention_plans(plan_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
