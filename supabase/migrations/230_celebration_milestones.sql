-- Migration: 230_celebration_milestones
-- Service: celebration-milestones-service
-- CHR 2015 Reg 6(2)(b) (celebrating achievements), Reg 9(2)(a) (enjoyment/achievement)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_celebration_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  celebration_type text NOT NULL CHECK (celebration_type IN ('birthday','academic_achievement','behavioural_milestone','cultural_festival','religious_celebration','sporting_achievement','personal_milestone','transition_event','community_recognition','other')),
  recognition_quality text NOT NULL CHECK (recognition_quality IN ('exceptional','good','adequate','poor','missed')),
  child_response text NOT NULL CHECK (child_response IN ('delighted','happy','neutral','uncomfortable','upset')),
  participation_breadth text NOT NULL CHECK (participation_breadth IN ('whole_home','peer_group','staff_and_child','individual','none')),
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  organised_by text NOT NULL,
  child_chose_celebration boolean NOT NULL DEFAULT true,
  culturally_sensitive boolean NOT NULL DEFAULT true,
  age_appropriate boolean NOT NULL DEFAULT true,
  photos_consent_obtained boolean NOT NULL DEFAULT true,
  family_included boolean NOT NULL DEFAULT true,
  peers_involved boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT true,
  budget_approved boolean NOT NULL DEFAULT true,
  memories_preserved boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_celebration_milestones_home ON cs_celebration_milestones(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_celebration_milestones_date ON cs_celebration_milestones(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_celebration_milestones_type ON cs_celebration_milestones(celebration_type);

ALTER TABLE cs_celebration_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_celebration_milestones_home_isolation" ON cs_celebration_milestones;
CREATE POLICY "cs_celebration_milestones_home_isolation" ON cs_celebration_milestones
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 230 celebration_milestones: %', SQLERRM;
END $$;
