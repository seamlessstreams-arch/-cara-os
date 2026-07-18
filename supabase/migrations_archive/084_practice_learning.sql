-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — PRACTICE LEARNING
-- CHR 2015 Reg 45 (review of quality of care — learning from events),
-- Reg 13 (leadership — learning culture),
-- Reg 40 (notifications — learning from notifiable events).
-- Tables: cs_learning_events, cs_learning_actions
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_learning_events ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_learning_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id           uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  title             text NOT NULL,
  source            text NOT NULL,
  event_date        date NOT NULL,
  identified_by     text NOT NULL,
  description       text NOT NULL,
  root_cause        text,
  learning_points   jsonb NOT NULL DEFAULT '[]',
  priority          text NOT NULL DEFAULT 'medium',
  linked_event_id   uuid,
  children_affected integer NOT NULL DEFAULT 0,
  staff_involved    jsonb NOT NULL DEFAULT '[]',
  shared_with_team  boolean NOT NULL DEFAULT false,
  date_shared       date,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_events_home     ON cs_learning_events(home_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_source   ON cs_learning_events(source);
CREATE INDEX IF NOT EXISTS idx_learning_events_date     ON cs_learning_events(event_date);
CREATE INDEX IF NOT EXISTS idx_learning_events_priority ON cs_learning_events(priority);

ALTER TABLE cs_learning_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own learning events"
    ON cs_learning_events FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_learning_actions ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_learning_actions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                 uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  learning_event_id       uuid NOT NULL REFERENCES cs_learning_events(id) ON DELETE CASCADE,
  action                  text NOT NULL,
  responsible_person      text NOT NULL,
  target_date             date NOT NULL,
  status                  text NOT NULL DEFAULT 'not_started',
  evidence_of_completion  text,
  impact_assessment       text NOT NULL DEFAULT 'not_yet_assessed',
  impact_notes            text,
  date_completed          date,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_actions_home    ON cs_learning_actions(home_id);
CREATE INDEX IF NOT EXISTS idx_learning_actions_event   ON cs_learning_actions(learning_event_id);
CREATE INDEX IF NOT EXISTS idx_learning_actions_status  ON cs_learning_actions(status);
CREATE INDEX IF NOT EXISTS idx_learning_actions_target  ON cs_learning_actions(target_date);

ALTER TABLE cs_learning_actions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own learning actions"
    ON cs_learning_actions FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
