-- Migration: 201_self_harm_risk_monitoring
-- Table: cs_self_harm_risk_monitoring
-- CHR 2015 Reg 12 (health/wellbeing), Reg 34 (safeguarding)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_self_harm_risk_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  risk_level text NOT NULL CHECK (risk_level IN ('critical','high','medium','low','resolved')),
  intervention_type text NOT NULL CHECK (intervention_type IN ('therapeutic_conversation','safety_plan_review','camhs_referral','crisis_team_contact','one_to_one_support','environmental_safety','medication_review','distraction_technique','peer_support','other')),
  safety_plan_status text NOT NULL CHECK (safety_plan_status IN ('active_reviewed','active_needs_review','being_developed','not_in_place','not_required')),
  trigger_type text NOT NULL CHECK (trigger_type IN ('family_contact','peer_conflict','school_pressure','anniversary_date','placement_change','trauma_reminder','social_media','unknown','multiple_triggers','other')),
  monitoring_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  monitored_by text NOT NULL,
  child_engaged boolean NOT NULL DEFAULT true,
  safety_plan_shared boolean NOT NULL DEFAULT true,
  camhs_involved boolean NOT NULL DEFAULT false,
  gp_informed boolean NOT NULL DEFAULT false,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT false,
  environment_checked boolean NOT NULL DEFAULT true,
  means_restriction_applied boolean NOT NULL DEFAULT true,
  observation_level_set boolean NOT NULL DEFAULT true,
  staff_trained boolean NOT NULL DEFAULT true,
  care_plan_updated boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_self_harm_risk_monitoring ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_self_harm_risk_monitoring_home ON cs_self_harm_risk_monitoring;
CREATE POLICY cs_self_harm_risk_monitoring_home ON cs_self_harm_risk_monitoring
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_self_harm_risk_monitoring_home ON cs_self_harm_risk_monitoring(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_self_harm_risk_monitoring_date ON cs_self_harm_risk_monitoring(monitoring_date);
CREATE INDEX IF NOT EXISTS idx_cs_self_harm_risk_monitoring_level ON cs_self_harm_risk_monitoring(risk_level);

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 201 self_harm_risk_monitoring: %', SQLERRM;
END $$;
