-- Migration: 239_arrival_settling_experience
-- Service: arrival-settling-experience-service
-- CHR 2015 Reg 14(1)(a) (admission and assessment), Reg 10(2)(a) (warm relationships)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_arrival_settling_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  arrival_stage text NOT NULL CHECK (arrival_stage IN ('pre_arrival_planning','first_day_welcome','first_week_review','two_week_check','one_month_review','three_month_review','ongoing_monitoring','peer_introduction','family_visit_arranged','other')),
  settling_quality text NOT NULL CHECK (settling_quality IN ('settled_well','mostly_settled','adjusting','unsettled','very_distressed')),
  welcome_assessment text NOT NULL CHECK (welcome_assessment IN ('excellent','good','adequate','poor','not_provided')),
  comfort_level text NOT NULL CHECK (comfort_level IN ('very_comfortable','comfortable','neutral','uncomfortable','very_uncomfortable')),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  supported_by text NOT NULL,
  room_prepared boolean NOT NULL DEFAULT true,
  personal_items_respected boolean NOT NULL DEFAULT true,
  child_preferences_asked boolean NOT NULL DEFAULT true,
  tour_provided boolean NOT NULL DEFAULT true,
  peer_introductions_made boolean NOT NULL DEFAULT true,
  key_worker_assigned boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT true,
  emergency_contacts_confirmed boolean NOT NULL DEFAULT true,
  dietary_needs_checked boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_arrival_settling_home ON cs_arrival_settling_experience(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_arrival_settling_date ON cs_arrival_settling_experience(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_arrival_settling_stage ON cs_arrival_settling_experience(arrival_stage);

ALTER TABLE cs_arrival_settling_experience ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_arrival_settling_experience_home_isolation" ON cs_arrival_settling_experience;
CREATE POLICY "cs_arrival_settling_experience_home_isolation" ON cs_arrival_settling_experience
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 239 arrival_settling_experience: %', SQLERRM;
END $$;
