-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ACTIVITY PLANNING
-- CHR 2015 Reg 9 (enjoyment and achievement),
-- Reg 6 (quality and purpose of care — hobbies, interests, leisure),
-- Reg 7 (children's views — activity preferences).
-- Tables: cs_activities, cs_activity_participations
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_activities ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_activities (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id             uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  title               text NOT NULL,
  description         text NOT NULL,
  category            text NOT NULL,
  activity_date       date NOT NULL,
  start_time          text NOT NULL,
  end_time            text NOT NULL,
  location            text NOT NULL,
  led_by              text NOT NULL,
  status              text NOT NULL DEFAULT 'planned',
  max_participants    integer NOT NULL DEFAULT 10,
  risk_assessed       boolean NOT NULL DEFAULT false,
  cost                numeric(10,2) NOT NULL DEFAULT 0,
  external_provider   boolean NOT NULL DEFAULT false,
  provider_name       text,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_home       ON cs_activities(home_id);
CREATE INDEX IF NOT EXISTS idx_activities_category   ON cs_activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_date       ON cs_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_status     ON cs_activities(status);

ALTER TABLE cs_activities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own activities"
    ON cs_activities FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_activity_participations ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_activity_participations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  activity_id           uuid NOT NULL REFERENCES cs_activities(id) ON DELETE CASCADE,
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
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
