-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 024: ARIA feedback table
--
-- Stores user feedback on ARIA outputs (thumbs up/down, optional tags and
-- free-text notes). Powers quality analytics and model improvement tracking.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aria_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  output_id   TEXT NOT NULL,
  command_id  TEXT NOT NULL,
  rating      TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  note        TEXT,
  tags        TEXT[] DEFAULT '{}',
  user_id     TEXT,
  home_id     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_aria_feedback_output ON aria_feedback (output_id);
CREATE INDEX IF NOT EXISTS idx_aria_feedback_command ON aria_feedback (command_id);
CREATE INDEX IF NOT EXISTS idx_aria_feedback_rating ON aria_feedback (rating);
CREATE INDEX IF NOT EXISTS idx_aria_feedback_created ON aria_feedback (created_at DESC);
