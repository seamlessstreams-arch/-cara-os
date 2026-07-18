-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 044 Young Person Outcomes + Shift Handovers
-- Outcomes: Reg 8/9/10/11/12/14/23 (Every Child Matters framework)
-- Handovers: Reg 13 (leadership), Reg 36 (records)
-- Tables: cs_outcome_targets, cs_outcome_reviews, cs_handovers
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_outcome_targets ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_outcome_targets (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id             UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id            UUID NOT NULL,
  child_name          TEXT NOT NULL,
  domain              TEXT NOT NULL,
  target_description  TEXT NOT NULL DEFAULT '',
  baseline_rating     TEXT NOT NULL DEFAULT 'no_change',
  current_rating      TEXT NOT NULL DEFAULT 'no_change',
  target_rating       TEXT NOT NULL DEFAULT 'good_progress',
  set_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  review_date         DATE,
  reviewed_by         TEXT,
  status              TEXT NOT NULL DEFAULT 'active',
  evidence            TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_outcome_targets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "outcome_targets_home" ON cs_outcome_targets
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_outcome_targets_home
  ON cs_outcome_targets(home_id);

CREATE INDEX IF NOT EXISTS idx_outcome_targets_child
  ON cs_outcome_targets(child_id, domain);

-- ── cs_outcome_reviews ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_outcome_reviews (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id           UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id          UUID NOT NULL,
  child_name        TEXT NOT NULL,
  review_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  reviewer          TEXT NOT NULL,
  domain_ratings    JSONB NOT NULL DEFAULT '[]',
  overall_progress  TEXT NOT NULL DEFAULT 'some_progress',
  key_achievements  JSONB NOT NULL DEFAULT '[]',
  areas_of_concern  JSONB NOT NULL DEFAULT '[]',
  actions           JSONB NOT NULL DEFAULT '[]',
  next_review_date  DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_outcome_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "outcome_reviews_home" ON cs_outcome_reviews
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_outcome_reviews_home
  ON cs_outcome_reviews(home_id);

CREATE INDEX IF NOT EXISTS idx_outcome_reviews_child
  ON cs_outcome_reviews(child_id, review_date);

-- ── cs_handovers ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_handovers (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                 UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  handover_type           TEXT NOT NULL DEFAULT 'shift_change',
  shift_date              DATE NOT NULL DEFAULT CURRENT_DATE,
  outgoing_staff          JSONB NOT NULL DEFAULT '[]',
  incoming_staff          JSONB NOT NULL DEFAULT '[]',
  child_updates           JSONB NOT NULL DEFAULT '[]',
  incidents_summary       JSONB NOT NULL DEFAULT '[]',
  tasks_carried_forward   JSONB NOT NULL DEFAULT '[]',
  safeguarding_flags      JSONB NOT NULL DEFAULT '[]',
  general_notes           TEXT,
  priority                TEXT NOT NULL DEFAULT 'routine',
  completed               BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at            TIMESTAMPTZ,
  created_by              TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_handovers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "handovers_home" ON cs_handovers
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_handovers_home_date
  ON cs_handovers(home_id, shift_date);

CREATE INDEX IF NOT EXISTS idx_handovers_completed
  ON cs_handovers(completed);
