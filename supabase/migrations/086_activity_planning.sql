

-- ── cs_activity_participations ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_activity_participations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  activity_id           uuid NOT NULL,
  child_name            text NOT NULL,
  child_id              uuid NOT NULL,
  participation_level   text NOT NULL,
  enjoyment_rating      text,
  staff_observations    text,
  skills_developed      jsonb NOT NULL DEFAULT '[]',
  follow_up_needed      boolean NOT NULL DEFAULT false,
  follow_up_notes       text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_parts_home       ON cs_activity_participations(home_id);
CREATE INDEX IF NOT EXISTS idx_activity_parts_activity   ON cs_activity_participations(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_parts_child      ON cs_activity_participations(child_id);

ALTER TABLE cs_activity_participations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own activity participations"
    ON cs_activity_participations FOR ALL
    USING  (home_id = (select get_my_home_id()))
    WITH CHECK (home_id = (select get_my_home_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
