-- ══════════════════════════════════════════════════════════════════════════════
-- Reflective Supervision records — durable persistence (workforce MVP slice 3)
--
-- Backs the in-memory `reflectiveSupervisions` collection. A richer, reflective
-- supervision record (wellbeing, workload, safeguarding, relationships, reflective
-- & PACE practice, boundaries, training needs, confidence, manager feedback,
-- actions, follow-up). Distinct from the existing cs_supervision_sessions table —
-- additive, not a replacement. Home-scoped RLS; service-role bypasses.
--
-- Wellbeing/confidence scores are SUPPORT indicators, never a clinical or
-- performance judgement (enforced in the application layer & UI wording).
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reflective_supervisions (
  id                           TEXT PRIMARY KEY,
  home_id                      TEXT NOT NULL DEFAULT 'home_oak',
  staff_id                     TEXT NOT NULL,
  staff_name                   TEXT,
  supervisor_id                TEXT NOT NULL,
  supervisor_name              TEXT,
  date                         DATE NOT NULL,
  type                         TEXT NOT NULL DEFAULT '1:1',
  emotional_wellbeing          TEXT NOT NULL DEFAULT '',
  wellbeing_score              INTEGER NOT NULL DEFAULT 3,   -- 1–5 support indicator
  workload                     TEXT NOT NULL DEFAULT '',
  safeguarding_concerns        TEXT NOT NULL DEFAULT '',
  relationships_with_children  TEXT NOT NULL DEFAULT '',
  reflective_practice          TEXT NOT NULL DEFAULT '',
  pace_examples                TEXT NOT NULL DEFAULT '',
  professional_boundaries      TEXT NOT NULL DEFAULT '',
  training_needs               JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence_level             INTEGER NOT NULL DEFAULT 3,   -- 1–5 support indicator
  manager_feedback             TEXT NOT NULL DEFAULT '',
  actions                      JSONB NOT NULL DEFAULT '[]'::jsonb,
  follow_up_date               DATE,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reflective_sup_home ON reflective_supervisions (home_id, date);
CREATE INDEX IF NOT EXISTS idx_reflective_sup_staff ON reflective_supervisions (staff_id, date);

ALTER TABLE reflective_supervisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reflective_sup_select ON reflective_supervisions;
CREATE POLICY reflective_sup_select ON reflective_supervisions FOR SELECT USING (home_id = get_my_home_id());
DROP POLICY IF EXISTS reflective_sup_insert ON reflective_supervisions;
CREATE POLICY reflective_sup_insert ON reflective_supervisions FOR INSERT WITH CHECK (home_id = get_my_home_id());
DROP POLICY IF EXISTS reflective_sup_update ON reflective_supervisions;
CREATE POLICY reflective_sup_update ON reflective_supervisions FOR UPDATE USING (home_id = get_my_home_id());

COMMENT ON TABLE reflective_supervisions IS 'Reflective supervision records (slice 3). Wellbeing/confidence are support indicators, not diagnoses.';
