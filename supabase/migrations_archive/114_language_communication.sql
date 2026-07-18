-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — LANGUAGE & COMMUNICATION
-- CHR 2015 Reg 6 (quality of care),
-- Reg 7 (children's views — ensuring every child can communicate),
-- Equality Act 2010 (reasonable adjustments).
-- Tables: cs_language_communication
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_language_communication (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                      text NOT NULL,
  child_id                        uuid NOT NULL,
  first_language                  text NOT NULL,
  additional_languages            jsonb NOT NULL DEFAULT '[]',
  communication_need              text NOT NULL,
  support_type                    text NOT NULL,
  support_status                  text NOT NULL DEFAULT 'requested',
  progress_rating                 text NOT NULL DEFAULT 'not_assessed',
  communication_passport_in_place boolean NOT NULL DEFAULT false,
  interpreter_required            boolean NOT NULL DEFAULT false,
  interpreter_arranged            boolean NOT NULL DEFAULT false,
  specialist_involved             boolean NOT NULL DEFAULT false,
  specialist_name                 text,
  staff_aware                     boolean NOT NULL DEFAULT false,
  staff_trained                   boolean NOT NULL DEFAULT false,
  child_views_captured            boolean NOT NULL DEFAULT false,
  reasonable_adjustments          jsonb NOT NULL DEFAULT '[]',
  review_date                     date,
  last_assessment_date            date,
  notes                           text,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lang_comm_home       ON cs_language_communication(home_id);
CREATE INDEX IF NOT EXISTS idx_lang_comm_child      ON cs_language_communication(child_id);
CREATE INDEX IF NOT EXISTS idx_lang_comm_need       ON cs_language_communication(communication_need);
CREATE INDEX IF NOT EXISTS idx_lang_comm_type       ON cs_language_communication(support_type);
CREATE INDEX IF NOT EXISTS idx_lang_comm_status     ON cs_language_communication(support_status);

ALTER TABLE cs_language_communication ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own language communication"
    ON cs_language_communication FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
