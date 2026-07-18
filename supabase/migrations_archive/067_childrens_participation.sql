-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — CHILDREN'S PARTICIPATION
-- CHR 2015 Reg 7 (children's views, wishes and feelings),
-- UNCRC Article 12 (right to be heard)
-- Tables: cs_participation_meetings, cs_child_consultations
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_participation_meetings ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_participation_meetings (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  meeting_type              text NOT NULL,
  meeting_date              date NOT NULL,
  scheduled_time            text,
  duration_minutes          integer,
  facilitator               text NOT NULL,
  children_invited          jsonb NOT NULL DEFAULT '[]',
  children_attended         jsonb NOT NULL DEFAULT '[]',
  staff_present             jsonb NOT NULL DEFAULT '[]',
  topics                    jsonb NOT NULL DEFAULT '[]',
  decisions_made            jsonb NOT NULL DEFAULT '[]',
  actions                   jsonb NOT NULL DEFAULT '[]',
  child_satisfaction_collected boolean NOT NULL DEFAULT false,
  overall_engagement        text,
  status                    text NOT NULL DEFAULT 'scheduled',
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_participation_meetings_home   ON cs_participation_meetings(home_id);
CREATE INDEX IF NOT EXISTS idx_participation_meetings_type   ON cs_participation_meetings(meeting_type);
CREATE INDEX IF NOT EXISTS idx_participation_meetings_date   ON cs_participation_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_participation_meetings_status ON cs_participation_meetings(status);

ALTER TABLE cs_participation_meetings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own participation meetings"
    ON cs_participation_meetings FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_child_consultations ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_child_consultations (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id                    text NOT NULL,
  child_name                  text NOT NULL,
  consultation_date           date NOT NULL,
  consulted_by                text NOT NULL,
  topic                       text NOT NULL,
  context                     text NOT NULL DEFAULT '',
  child_views                 text NOT NULL DEFAULT '',
  child_preferences           text,
  outcome                     text,
  action_taken                text,
  child_informed_of_outcome   boolean NOT NULL DEFAULT false,
  child_satisfied_with_response boolean,
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_child_consultations_home  ON cs_child_consultations(home_id);
CREATE INDEX IF NOT EXISTS idx_child_consultations_child ON cs_child_consultations(child_id);
CREATE INDEX IF NOT EXISTS idx_child_consultations_topic ON cs_child_consultations(topic);

ALTER TABLE cs_child_consultations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own child consultations"
    ON cs_child_consultations FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
