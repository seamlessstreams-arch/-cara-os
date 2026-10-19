-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — PEER MENTORING
-- CHR 2015 Reg 5 (engaging with the wider community — peer support),
-- Reg 7 (children's views — peer relationships),
-- Reg 6 (quality and purpose of care — positive peer culture).
-- Tables: cs_peer_pairings
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_peer_pairings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  mentor_name           text NOT NULL,
  mentor_id             uuid NOT NULL,
  mentee_name           text NOT NULL,
  mentee_id             uuid NOT NULL,
  pairing_type          text NOT NULL DEFAULT 'buddy_system',
  pairing_status        text NOT NULL DEFAULT 'active',
  start_date            date NOT NULL,
  end_date              date,
  goals                 jsonb NOT NULL DEFAULT '[]',
  sessions_completed    integer NOT NULL DEFAULT 0,
  last_session_date     date,
  last_session_outcome  text,
  safeguarding_flag     text NOT NULL DEFAULT 'none',
  mentor_feedback       text,
  mentee_feedback       text,
  staff_observations    text,
  reviewed_by           text,
  review_date           date,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_peer_home      ON cs_peer_pairings(home_id);
CREATE INDEX IF NOT EXISTS idx_peer_mentor    ON cs_peer_pairings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_peer_mentee    ON cs_peer_pairings(mentee_id);
CREATE INDEX IF NOT EXISTS idx_peer_type      ON cs_peer_pairings(pairing_type);
CREATE INDEX IF NOT EXISTS idx_peer_status    ON cs_peer_pairings(pairing_status);
CREATE INDEX IF NOT EXISTS idx_peer_flag      ON cs_peer_pairings(safeguarding_flag);

ALTER TABLE cs_peer_pairings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own peer pairings"
    ON cs_peer_pairings FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
