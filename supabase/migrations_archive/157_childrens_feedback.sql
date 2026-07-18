-- ═══════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — CHILDREN'S FEEDBACK
-- CHR 2015 Reg 7 (quality of care — responsive to views),
-- Reg 10 (children's views), Reg 45 (review of quality).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_childrens_feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,

  feedback_type           text NOT NULL DEFAULT 'satisfaction_survey',
  feedback_date           date NOT NULL DEFAULT CURRENT_DATE,
  satisfaction_rating     text NOT NULL DEFAULT 'happy',
  response_status         text NOT NULL DEFAULT 'pending',
  feedback_category       text NOT NULL DEFAULT 'general',

  child_name              text NOT NULL DEFAULT '',
  child_id                uuid,

  child_chose_method          boolean NOT NULL DEFAULT true,
  child_comfortable_sharing   boolean NOT NULL DEFAULT true,
  anonymous_option_offered    boolean NOT NULL DEFAULT true,
  feedback_discussed_with_child boolean NOT NULL DEFAULT true,
  changes_implemented         boolean NOT NULL DEFAULT false,
  child_informed_of_outcome   boolean NOT NULL DEFAULT false,
  child_satisfied_with_response boolean NOT NULL DEFAULT false,
  staff_responsive            boolean NOT NULL DEFAULT true,

  themes_identified       text[] NOT NULL DEFAULT '{}',
  improvements_suggested  text[] NOT NULL DEFAULT '{}',
  actions_taken           text[] NOT NULL DEFAULT '{}',
  issues_found            text[] NOT NULL DEFAULT '{}',

  collected_by            text NOT NULL DEFAULT '',
  response_date           date,
  notes                   text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_childrens_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cf_home_isolation ON cs_childrens_feedback;
CREATE POLICY cf_home_isolation ON cs_childrens_feedback
  USING  (home_id = get_my_home_id())
  WITH CHECK (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cf_home_date ON cs_childrens_feedback(home_id, feedback_date DESC);

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Migration 157 (childrens_feedback) idempotent skip: %', SQLERRM;
END $$;
