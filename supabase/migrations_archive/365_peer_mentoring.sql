-- Migration: 365_peer_mentoring
-- Domain: Children's Services — Peer Mentoring & Buddy System
-- Description: Tracks peer mentoring sessions, buddy pairings, and peer support
-- arrangements between looked-after children. Covers mentor training, safeguarding,
-- relationship quality, and outcomes for both mentor and mentee.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 11 (positive relationships), Reg 34 (positive behaviour),
-- SCCIF: Behaviour — "Children support each other positively."
-- UNCRC Article 12 (participation).

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_peer_mentoring (
  id                              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                      text NOT NULL,
  mentor_name                     text NOT NULL,
  session_date                    date NOT NULL,
  facilitator_name                text NOT NULL,
  session_type                    text NOT NULL DEFAULT 'Social Integration',
  mentor_trained                  boolean NOT NULL DEFAULT false,
  mentor_supported                boolean NOT NULL DEFAULT false,
  mentor_experience_positive      boolean NOT NULL DEFAULT false,
  mentee_experience_positive      boolean NOT NULL DEFAULT false,
  safeguarding_considered         boolean NOT NULL DEFAULT false,
  adult_oversight                 boolean NOT NULL DEFAULT false,
  both_consented                  boolean NOT NULL DEFAULT false,
  matching_appropriate            boolean NOT NULL DEFAULT false,
  session_goals_set               boolean NOT NULL DEFAULT false,
  goals_achieved                  boolean NULL,
  relationship_quality            text NOT NULL DEFAULT 'Developing',
  notes                           text NULL,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_peer_mentoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_peer_mentoring
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_peer_mentoring_home
  ON cs_peer_mentoring(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_peer_mentoring_date
  ON cs_peer_mentoring(session_date);

CREATE INDEX IF NOT EXISTS idx_cs_peer_mentoring_type
  ON cs_peer_mentoring(session_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
