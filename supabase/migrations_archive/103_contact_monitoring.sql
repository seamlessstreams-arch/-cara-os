-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — CONTACT MONITORING
-- CHR 2015 Reg 7 (children's views on contact),
-- Reg 8 (parental responsibility — contact arrangements),
-- Care Planning Regs 2010 (contact provisions).
-- Tables: cs_contact_sessions
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_contact_sessions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name             text NOT NULL,
  child_id               uuid NOT NULL,
  contact_with           text NOT NULL,
  relationship           text NOT NULL,
  contact_type           text NOT NULL DEFAULT 'face_to_face',
  supervision_level      text NOT NULL DEFAULT 'none',
  scheduled_date         date NOT NULL,
  actual_date            date,
  duration_minutes       integer,
  outcome                text NOT NULL DEFAULT 'completed_positive',
  child_mood_before      text,
  child_mood_after       text,
  child_views            text,
  staff_observations     text,
  concerns_raised        boolean NOT NULL DEFAULT false,
  concern_details        text,
  social_worker_informed boolean NOT NULL DEFAULT false,
  court_ordered          boolean NOT NULL DEFAULT false,
  notes                  text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_home      ON cs_contact_sessions(home_id);
CREATE INDEX IF NOT EXISTS idx_contact_child     ON cs_contact_sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_contact_type      ON cs_contact_sessions(contact_type);
CREATE INDEX IF NOT EXISTS idx_contact_outcome   ON cs_contact_sessions(outcome);
CREATE INDEX IF NOT EXISTS idx_contact_date      ON cs_contact_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_contact_concern   ON cs_contact_sessions(concerns_raised);

ALTER TABLE cs_contact_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own contact sessions"
    ON cs_contact_sessions FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
