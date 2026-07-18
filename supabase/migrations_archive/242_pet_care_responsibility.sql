-- Pet Care Responsibility
-- CHR 2015 Reg 6 (quality of care), Reg 9 (enjoyment), Reg 12 (health)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_pet_care_responsibility (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  pet_type     text NOT NULL DEFAULT 'other',
  care_quality text NOT NULL DEFAULT 'adequate',
  responsibility_level text NOT NULL DEFAULT 'shared_responsibility',
  therapeutic_impact   text NOT NULL DEFAULT 'neutral',
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name   text NOT NULL,
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  supported_by text NOT NULL,
  animal_welfare_met       boolean NOT NULL DEFAULT true,
  veterinary_care_current  boolean NOT NULL DEFAULT true,
  child_chose_interaction  boolean NOT NULL DEFAULT true,
  supervision_adequate     boolean NOT NULL DEFAULT true,
  hygiene_maintained       boolean NOT NULL DEFAULT true,
  allergy_checked          boolean NOT NULL DEFAULT true,
  care_plan_reflects       boolean NOT NULL DEFAULT true,
  social_worker_informed   boolean NOT NULL DEFAULT true,
  parent_informed          boolean NOT NULL DEFAULT true,
  risk_assessment_done     boolean NOT NULL DEFAULT true,
  empathy_development_noted boolean NOT NULL DEFAULT true,
  recorded_promptly        boolean NOT NULL DEFAULT true,
  issues_found  jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_pet_care_responsibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pet_care_responsibility_home" ON cs_pet_care_responsibility;
CREATE POLICY "pet_care_responsibility_home" ON cs_pet_care_responsibility
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_pet_care_responsibility_home ON cs_pet_care_responsibility(home_id);

EXCEPTION WHEN others THEN RAISE NOTICE 'pet_care_responsibility migration: %', SQLERRM;
END $$;
