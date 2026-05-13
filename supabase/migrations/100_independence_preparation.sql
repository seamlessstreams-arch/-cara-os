-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — INDEPENDENCE PREPARATION
-- CHR 2015 Reg 5 (engaging with the wider community),
-- Reg 6 (quality and purpose of care — preparing for independence),
-- Reg 7 (children's views — independence goals).
-- Tables: cs_independence_skills
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_independence_skills (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name            text NOT NULL,
  child_id              uuid NOT NULL,
  skill_area            text NOT NULL,
  competency_level      text NOT NULL DEFAULT 'not_started',
  assessed_date         date NOT NULL,
  assessed_by           text NOT NULL,
  target_level          text NOT NULL DEFAULT 'competent',
  target_date           date,
  activities_completed  jsonb NOT NULL DEFAULT '[]',
  young_person_views    text,
  next_steps            jsonb NOT NULL DEFAULT '[]',
  support_needed        text,
  mentor_assigned       text,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_indep_skills_home    ON cs_independence_skills(home_id);
CREATE INDEX IF NOT EXISTS idx_indep_skills_child   ON cs_independence_skills(child_id);
CREATE INDEX IF NOT EXISTS idx_indep_skills_area    ON cs_independence_skills(skill_area);
CREATE INDEX IF NOT EXISTS idx_indep_skills_level   ON cs_independence_skills(competency_level);

ALTER TABLE cs_independence_skills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own independence skills"
    ON cs_independence_skills FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
