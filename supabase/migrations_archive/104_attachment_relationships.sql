-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ATTACHMENT & RELATIONSHIPS
-- CHR 2015 Reg 6 (quality of care — attachment-aware),
-- Reg 10 (care planning — relational security),
-- Reg 12 (health and education — emotional wellbeing).
-- Tables: cs_attachment_records
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_attachment_records (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                text NOT NULL,
  child_id                  uuid NOT NULL,
  attachment_style          text NOT NULL DEFAULT 'not_yet_assessed',
  assessed_by               text NOT NULL,
  assessed_date             date NOT NULL,
  assessment_status         text NOT NULL DEFAULT 'initial',
  next_review_date          date,
  relationship_type         text NOT NULL,
  relationship_person       text NOT NULL,
  relationship_quality      text NOT NULL DEFAULT 'developing',
  therapeutic_approach      text,
  approach_start_date       date,
  progress_notes            text,
  child_views               text,
  staff_trained_attachment  boolean NOT NULL DEFAULT false,
  psychologist_involved     boolean NOT NULL DEFAULT false,
  key_triggers              jsonb NOT NULL DEFAULT '[]',
  calming_strategies        jsonb NOT NULL DEFAULT '[]',
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachment_home    ON cs_attachment_records(home_id);
CREATE INDEX IF NOT EXISTS idx_attachment_child   ON cs_attachment_records(child_id);
CREATE INDEX IF NOT EXISTS idx_attachment_style   ON cs_attachment_records(attachment_style);
CREATE INDEX IF NOT EXISTS idx_attachment_rel     ON cs_attachment_records(relationship_type);
CREATE INDEX IF NOT EXISTS idx_attachment_quality ON cs_attachment_records(relationship_quality);

ALTER TABLE cs_attachment_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own attachment records"
    ON cs_attachment_records FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
