-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — THERAPEUTIC INTERVENTIONS
-- CHR 2015 Reg 6 (quality of care — emotional needs),
-- Reg 10 (health — therapeutic services), Reg 14 (care planning).
-- Tables: cs_therapy_referrals, cs_therapy_sessions
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_therapy_referrals ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_therapy_referrals (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id              uuid NOT NULL,
  child_name            text NOT NULL,
  therapy_type          text NOT NULL,
  provider_name         text NOT NULL,
  therapist_name        text,
  referral_date         date NOT NULL,
  referral_reason       text NOT NULL,
  status                text NOT NULL DEFAULT 'referred',
  date_started          date,
  date_ended            date,
  frequency             text NOT NULL,
  session_count         integer NOT NULL DEFAULT 0,
  goals                 jsonb NOT NULL DEFAULT '[]',
  outcomes              jsonb NOT NULL DEFAULT '[]',
  waiting_time_days     integer,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_therapy_referrals_home    ON cs_therapy_referrals(home_id);
CREATE INDEX IF NOT EXISTS idx_therapy_referrals_child   ON cs_therapy_referrals(child_id);
CREATE INDEX IF NOT EXISTS idx_therapy_referrals_status  ON cs_therapy_referrals(status);
CREATE INDEX IF NOT EXISTS idx_therapy_referrals_type    ON cs_therapy_referrals(therapy_type);

ALTER TABLE cs_therapy_referrals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own therapy referrals"
    ON cs_therapy_referrals FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_therapy_sessions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_therapy_sessions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                  uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id                 uuid NOT NULL,
  child_name               text NOT NULL,
  referral_id              uuid NOT NULL REFERENCES cs_therapy_referrals(id) ON DELETE CASCADE,
  therapy_type             text NOT NULL,
  session_date             date NOT NULL,
  session_number           integer NOT NULL,
  status                   text NOT NULL,
  engagement_level         text NOT NULL,
  progress_rating          text NOT NULL,
  session_notes            text,
  goals_addressed          jsonb NOT NULL DEFAULT '[]',
  home_actions             jsonb NOT NULL DEFAULT '[]',
  therapist_recommendations text,
  staff_attended           text,
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_therapy_sessions_home      ON cs_therapy_sessions(home_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_child     ON cs_therapy_sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_referral  ON cs_therapy_sessions(referral_id);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_date      ON cs_therapy_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_status    ON cs_therapy_sessions(status);

ALTER TABLE cs_therapy_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own therapy sessions"
    ON cs_therapy_sessions FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
