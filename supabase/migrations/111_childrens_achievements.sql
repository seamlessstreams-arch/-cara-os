-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — CHILDREN'S ACHIEVEMENTS
-- CHR 2015 Reg 6 (quality and purpose of care — celebrating success),
-- Reg 7 (children's views — recognising what matters to them),
-- Reg 12 (promoting educational achievement).
-- Tables: cs_achievements
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_achievements (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  child_id                    uuid NOT NULL,
  achievement_date            date NOT NULL,
  category                    text NOT NULL,
  title                       text NOT NULL,
  description                 text NOT NULL,
  significance                text NOT NULL DEFAULT 'notable',
  celebrations                jsonb NOT NULL DEFAULT '[]',
  recorded_by                 text NOT NULL,
  child_views                 text,
  child_proud                 boolean NOT NULL DEFAULT false,
  shared_with_family          boolean NOT NULL DEFAULT false,
  shared_with_social_worker   boolean NOT NULL DEFAULT false,
  added_to_life_story         boolean NOT NULL DEFAULT false,
  photograph_taken            boolean NOT NULL DEFAULT false,
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_achievements_home         ON cs_achievements(home_id);
CREATE INDEX IF NOT EXISTS idx_achievements_child        ON cs_achievements(child_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category     ON cs_achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_significance ON cs_achievements(significance);
CREATE INDEX IF NOT EXISTS idx_achievements_date         ON cs_achievements(achievement_date);

ALTER TABLE cs_achievements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own achievements"
    ON cs_achievements FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
