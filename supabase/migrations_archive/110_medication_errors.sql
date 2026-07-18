-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — MEDICATION ERRORS
-- CHR 2015 Reg 23 (medication — safe administration),
-- Reg 40 (notifications — serious medication errors),
-- Duty of Candour (informing families of errors).
-- Tables: cs_medication_errors
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_medication_errors (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  child_id                    uuid NOT NULL,
  error_date                  date NOT NULL,
  error_time                  text NOT NULL,
  error_type                  text NOT NULL,
  error_severity              text NOT NULL DEFAULT 'no_harm',
  medication_name             text NOT NULL,
  reported_by                 text NOT NULL,
  root_cause                  text NOT NULL DEFAULT 'under_investigation',
  investigation_status        text NOT NULL DEFAULT 'reported',
  corrective_actions          jsonb NOT NULL DEFAULT '[]',
  actions_completed           boolean NOT NULL DEFAULT false,
  child_harmed                boolean NOT NULL DEFAULT false,
  medical_attention_required  boolean NOT NULL DEFAULT false,
  parent_informed             boolean NOT NULL DEFAULT false,
  social_worker_informed      boolean NOT NULL DEFAULT false,
  ofsted_notified             boolean NOT NULL DEFAULT false,
  duty_of_candour_applied     boolean NOT NULL DEFAULT false,
  staff_involved              text,
  lessons_learned             text,
  policy_reviewed             boolean NOT NULL DEFAULT false,
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_med_errors_home       ON cs_medication_errors(home_id);
CREATE INDEX IF NOT EXISTS idx_med_errors_child      ON cs_medication_errors(child_id);
CREATE INDEX IF NOT EXISTS idx_med_errors_type       ON cs_medication_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_med_errors_severity   ON cs_medication_errors(error_severity);
CREATE INDEX IF NOT EXISTS idx_med_errors_status     ON cs_medication_errors(investigation_status);
CREATE INDEX IF NOT EXISTS idx_med_errors_date       ON cs_medication_errors(error_date);

ALTER TABLE cs_medication_errors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own medication errors"
    ON cs_medication_errors FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
