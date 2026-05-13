-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — DAILY RECORDING & QUALITY ANALYTICS
-- Migration 034: Enhanced daily records with quality scoring, recording
-- analytics, and ARIA recording intelligence support.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Enhanced daily records ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_daily_records (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id           uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id          uuid,
  record_type       text NOT NULL DEFAULT 'daily_log'
                      CHECK (record_type IN (
                        'daily_log','shift_note','handover','night_log',
                        'activity_log','sleep_log','welfare_check','key_session'
                      )),
  shift_type        text CHECK (shift_type IN ('early','late','long_day','waking_night','sleep_in')),
  author_id         uuid NOT NULL,
  content           text NOT NULL,
  word_count        integer NOT NULL DEFAULT 0,
  mentions_children jsonb NOT NULL DEFAULT '[]'::jsonb,
  mentions_staff    jsonb NOT NULL DEFAULT '[]'::jsonb,
  mood_observations text,
  behaviour_notes   text,
  medication_notes  text,
  safeguarding_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  positive_highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  concerns          jsonb NOT NULL DEFAULT '[]'::jsonb,
  attachments_count integer NOT NULL DEFAULT 0,
  signed_off_by     uuid,
  signed_off_at     timestamptz,
  quality_score     text CHECK (quality_score IN ('excellent','good','adequate','poor','missing')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_records_home    ON cs_daily_records(home_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_child   ON cs_daily_records(child_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_author  ON cs_daily_records(author_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_type    ON cs_daily_records(record_type);
CREATE INDEX IF NOT EXISTS idx_daily_records_created ON cs_daily_records(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_records_quality ON cs_daily_records(quality_score);

-- ── Recording quality snapshots ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_recording_quality_snapshots (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id           uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  period_start      date NOT NULL,
  period_end        date NOT NULL,
  total_expected    integer NOT NULL DEFAULT 0,
  total_submitted   integer NOT NULL DEFAULT 0,
  missing           integer NOT NULL DEFAULT 0,
  late_submissions  integer NOT NULL DEFAULT 0,
  compliance_pct    numeric NOT NULL DEFAULT 0,
  avg_quality_score numeric NOT NULL DEFAULT 0,
  quality_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  staff_profiles    jsonb NOT NULL DEFAULT '[]'::jsonb,
  children_gaps     jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rec_quality_home   ON cs_recording_quality_snapshots(home_id);
CREATE INDEX IF NOT EXISTS idx_rec_quality_period ON cs_recording_quality_snapshots(period_start, period_end);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE cs_daily_records                ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_recording_quality_snapshots  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY daily_records_home_policy ON cs_daily_records
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY rec_quality_home_policy ON cs_recording_quality_snapshots
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
