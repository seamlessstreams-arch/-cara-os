-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — BODY MAPS
-- CHR 2015 Reg 12 (safeguarding — recording injuries),
-- Reg 36 (records — body map documentation),
-- Reg 34 (staff — awareness of safeguarding recording).
-- Tables: cs_body_maps
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_body_maps (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  child_id                    uuid NOT NULL,
  observation_date            date NOT NULL,
  observed_by                 text NOT NULL,
  mark_type                   text NOT NULL,
  body_location               text NOT NULL,
  description                 text NOT NULL,
  size_cm                     text,
  colour                      text,
  explanation                 text,
  explanation_source          text NOT NULL,
  explanation_consistent      boolean,
  actions_taken               jsonb NOT NULL DEFAULT '[]',
  safeguarding_referral_made  boolean NOT NULL DEFAULT false,
  photograph_taken            boolean NOT NULL DEFAULT false,
  manager_informed            boolean NOT NULL DEFAULT false,
  social_worker_informed      boolean NOT NULL DEFAULT false,
  follow_up_required          boolean NOT NULL DEFAULT false,
  follow_up_date              date,
  follow_up_completed         boolean NOT NULL DEFAULT false,
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_body_maps_home          ON cs_body_maps(home_id);
CREATE INDEX IF NOT EXISTS idx_body_maps_child         ON cs_body_maps(child_id);
CREATE INDEX IF NOT EXISTS idx_body_maps_date          ON cs_body_maps(observation_date);
CREATE INDEX IF NOT EXISTS idx_body_maps_mark_type     ON cs_body_maps(mark_type);
CREATE INDEX IF NOT EXISTS idx_body_maps_location      ON cs_body_maps(body_location);
CREATE INDEX IF NOT EXISTS idx_body_maps_safeguarding  ON cs_body_maps(safeguarding_referral_made);

ALTER TABLE cs_body_maps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own body maps"
    ON cs_body_maps FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
