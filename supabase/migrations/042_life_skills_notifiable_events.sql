-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 042 Life Skills & Independence + Notifiable Events
-- Reg 8 (enjoyment & achievement), Reg 9 (quality of care),
-- Reg 14 (care planning / pathway), Reg 40 (notifiable events)
-- Tables: cs_skill_assessments, cs_pathway_plans,
--         cs_notifiable_events, cs_event_notifications
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_skill_assessments ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_skill_assessments (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id          UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id         UUID NOT NULL,
  child_name       TEXT NOT NULL,
  domain           TEXT NOT NULL,
  skill            TEXT NOT NULL,
  competency_level TEXT NOT NULL DEFAULT 'not_assessed',
  assessed_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  assessed_by      TEXT NOT NULL,
  notes            TEXT,
  evidence         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_skill_assessments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "skill_assessments_home" ON cs_skill_assessments
    USING (home_id = (select get_my_home_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_skill_assessments_home
  ON cs_skill_assessments(home_id);

CREATE INDEX IF NOT EXISTS idx_skill_assessments_child
  ON cs_skill_assessments(child_id, domain);
