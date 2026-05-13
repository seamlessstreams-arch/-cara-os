-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — SIGNIFICANT EVENTS
-- CHR 2015 Reg 36 (daily log — significant events),
-- Reg 6 (quality and purpose of care — celebrating achievements),
-- Reg 7 (children's views — recording wishes and feelings).
-- Tables: cs_significant_events
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_significant_events (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                    uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                 text NOT NULL,
  child_id                   uuid NOT NULL,
  event_date                 date NOT NULL,
  category                   text NOT NULL,
  title                      text NOT NULL,
  description                text NOT NULL,
  sentiment                  text NOT NULL DEFAULT 'neutral',
  impact                     text NOT NULL DEFAULT 'medium',
  recorded_by                text NOT NULL,
  child_views                text,
  follow_up_actions          jsonb NOT NULL DEFAULT '[]',
  shared_with_family         boolean NOT NULL DEFAULT false,
  shared_with_social_worker  boolean NOT NULL DEFAULT false,
  added_to_life_story        boolean NOT NULL DEFAULT false,
  photos_attached            boolean NOT NULL DEFAULT false,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sig_events_home       ON cs_significant_events(home_id);
CREATE INDEX IF NOT EXISTS idx_sig_events_child      ON cs_significant_events(child_id);
CREATE INDEX IF NOT EXISTS idx_sig_events_date       ON cs_significant_events(event_date);
CREATE INDEX IF NOT EXISTS idx_sig_events_category   ON cs_significant_events(category);
CREATE INDEX IF NOT EXISTS idx_sig_events_sentiment  ON cs_significant_events(sentiment);
CREATE INDEX IF NOT EXISTS idx_sig_events_impact     ON cs_significant_events(impact);

ALTER TABLE cs_significant_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own significant events"
    ON cs_significant_events FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
