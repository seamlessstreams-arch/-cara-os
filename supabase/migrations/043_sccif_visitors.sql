-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 043 SCCIF Self-Evaluation + Visitors Log
-- SCCIF (Social Care Common Inspection Framework) self-evaluation,
-- Reg 44 (independent person visits), visitor tracking
-- Tables: cs_self_evaluations, cs_evaluation_evidence,
--         cs_visitor_entries
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_self_evaluations ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_self_evaluations (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                 UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  period_from             DATE NOT NULL,
  period_to               DATE NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'draft',
  overall_grade           TEXT,
  helped_protected_grade  TEXT,
  leadership_grade        TEXT,
  strengths               JSONB NOT NULL DEFAULT '[]',
  areas_for_improvement   JSONB NOT NULL DEFAULT '[]',
  created_by              TEXT NOT NULL,
  approved_by             TEXT,
  approved_date           DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_self_evaluations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "self_evaluations_home" ON cs_self_evaluations
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_self_evaluations_home
  ON cs_self_evaluations(home_id);

-- ── cs_evaluation_evidence ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_evaluation_evidence (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id               UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  evaluation_id         UUID NOT NULL REFERENCES cs_self_evaluations(id) ON DELETE CASCADE,
  evidence_area         TEXT NOT NULL,
  description           TEXT NOT NULL DEFAULT '',
  data_source           TEXT,
  metric_value          TEXT,
  metric_label          TEXT,
  grade_indicator       TEXT NOT NULL DEFAULT 'neutral',
  regulation_reference  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_evaluation_evidence ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "evaluation_evidence_home" ON cs_evaluation_evidence
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_evaluation_evidence_home
  ON cs_evaluation_evidence(home_id);

CREATE INDEX IF NOT EXISTS idx_evaluation_evidence_eval
  ON cs_evaluation_evidence(evaluation_id);

CREATE INDEX IF NOT EXISTS idx_evaluation_evidence_area
  ON cs_evaluation_evidence(evidence_area);

-- ── cs_visitor_entries ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_visitor_entries (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id           UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  visitor_name      TEXT NOT NULL,
  visitor_type      TEXT NOT NULL,
  organisation      TEXT,
  purpose           TEXT NOT NULL,
  child_visited     UUID,
  child_name        TEXT,
  arrival_time      TIMESTAMPTZ NOT NULL DEFAULT now(),
  departure_time    TIMESTAMPTZ,
  duration_minutes  INTEGER,
  dbs_checked       BOOLEAN NOT NULL DEFAULT FALSE,
  id_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  notes             TEXT,
  recorded_by       TEXT NOT NULL,
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_visitor_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "visitor_entries_home" ON cs_visitor_entries
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_visitor_entries_home_date
  ON cs_visitor_entries(home_id, date);

CREATE INDEX IF NOT EXISTS idx_visitor_entries_type
  ON cs_visitor_entries(visitor_type);
