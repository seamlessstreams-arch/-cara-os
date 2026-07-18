-- Migration: 197_child_wellbeing_checkin
-- Table: cs_child_wellbeing_checkin
-- CHR 2015 Reg 12 (health/wellbeing), Reg 7 (individual child)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_child_wellbeing_checkin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  mood_rating text NOT NULL CHECK (mood_rating IN ('very_happy','happy','okay','unhappy','very_unhappy')),
  emotional_state text NOT NULL CHECK (emotional_state IN ('calm','content','anxious','sad','angry','withdrawn','excited','confused','overwhelmed','other')),
  wellbeing_domain text NOT NULL CHECK (wellbeing_domain IN ('emotional','physical','social','educational','spiritual')),
  check_in_type text NOT NULL CHECK (check_in_type IN ('morning_routine','after_school','evening','bedtime','ad_hoc')),
  check_in_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  staff_name text NOT NULL,
  child_engaged boolean NOT NULL DEFAULT true,
  child_voice_captured boolean NOT NULL DEFAULT true,
  concerns_identified boolean NOT NULL DEFAULT false,
  follow_up_needed boolean NOT NULL DEFAULT false,
  care_plan_reviewed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT false,
  social_worker_informed boolean NOT NULL DEFAULT false,
  private_time_offered boolean NOT NULL DEFAULT true,
  physical_health_checked boolean NOT NULL DEFAULT true,
  eating_well boolean NOT NULL DEFAULT true,
  sleeping_well boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  wellbeing_score integer NOT NULL DEFAULT 7,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_child_wellbeing_checkin ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_child_wellbeing_checkin_home ON cs_child_wellbeing_checkin;
CREATE POLICY cs_child_wellbeing_checkin_home ON cs_child_wellbeing_checkin
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_child_wellbeing_checkin_home ON cs_child_wellbeing_checkin(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_child_wellbeing_checkin_date ON cs_child_wellbeing_checkin(check_in_date);
CREATE INDEX IF NOT EXISTS idx_cs_child_wellbeing_checkin_mood ON cs_child_wellbeing_checkin(mood_rating);

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 197 child_wellbeing_checkin: %', SQLERRM;
END $$;
