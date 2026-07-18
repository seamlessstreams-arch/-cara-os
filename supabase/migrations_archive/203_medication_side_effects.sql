-- Migration: 203_medication_side_effects
-- Tracks medication side effects, severity, GP responses

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_medication_side_effects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  side_effect_type text NOT NULL DEFAULT 'other',
  severity text NOT NULL DEFAULT 'not_assessed',
  gp_response text NOT NULL DEFAULT 'awaiting_review',
  medication_category text NOT NULL DEFAULT 'other',
  reported_date date NOT NULL DEFAULT now(),
  child_name text NOT NULL,
  child_id uuid,
  reported_by text NOT NULL,
  child_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT false,
  social_worker_informed boolean NOT NULL DEFAULT true,
  gp_contacted_promptly boolean NOT NULL DEFAULT true,
  pharmacy_consulted boolean NOT NULL DEFAULT false,
  medication_review_requested boolean NOT NULL DEFAULT true,
  daily_functioning_assessed boolean NOT NULL DEFAULT true,
  wellbeing_monitored boolean NOT NULL DEFAULT true,
  care_plan_updated boolean NOT NULL DEFAULT true,
  yellow_card_considered boolean NOT NULL DEFAULT false,
  staff_aware boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_medication_side_effects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_medication_side_effects_home ON cs_medication_side_effects;
CREATE POLICY cs_medication_side_effects_home ON cs_medication_side_effects
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 203 idempotent: %', SQLERRM;
END $$;
