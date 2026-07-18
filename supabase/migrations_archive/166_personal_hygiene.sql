-- Migration: 166_personal_hygiene
-- Personal hygiene support tracking for children's self-care development

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_personal_hygiene (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  hygiene_area      text NOT NULL DEFAULT 'bathing_showering',
  support_level     text NOT NULL DEFAULT 'independent',
  progress_rating   text NOT NULL DEFAULT 'good',
  sensitivity_level text NOT NULL DEFAULT 'standard',

  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name      text NOT NULL DEFAULT '',
  child_id        text,

  child_consulted          boolean NOT NULL DEFAULT true,
  child_comfortable        boolean NOT NULL DEFAULT true,
  dignity_maintained       boolean NOT NULL DEFAULT true,
  age_appropriate          boolean NOT NULL DEFAULT true,
  culturally_sensitive     boolean NOT NULL DEFAULT true,
  products_available       boolean NOT NULL DEFAULT true,
  products_preferred       boolean NOT NULL DEFAULT true,
  independence_encouraged  boolean NOT NULL DEFAULT true,
  routine_established      boolean NOT NULL DEFAULT false,
  care_plan_updated        boolean NOT NULL DEFAULT false,
  training_provided        boolean NOT NULL DEFAULT false,

  issues_found   jsonb NOT NULL DEFAULT '[]',
  actions_taken  jsonb NOT NULL DEFAULT '[]',
  assessed_by    text NOT NULL DEFAULT '',
  notes          text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_personal_hygiene ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_personal_hygiene_home" ON cs_personal_hygiene;
CREATE POLICY "cs_personal_hygiene_home" ON cs_personal_hygiene
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_personal_hygiene_home
  ON cs_personal_hygiene(home_id);

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 166 idempotent: %', SQLERRM;
END $$;
