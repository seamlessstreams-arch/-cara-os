-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — RISK REGISTER
-- CHR 2015 Reg 13 (leadership and management — risk management),
-- Reg 40 (notifications — risk-related incidents),
-- Reg 45 (review of quality of care — risk oversight).
-- Tables: cs_risk_register
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_risk_register (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                 uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  risk_title              text NOT NULL,
  risk_description        text NOT NULL,
  risk_category           text NOT NULL,
  likelihood              integer NOT NULL DEFAULT 1,
  impact                  integer NOT NULL DEFAULT 1,
  risk_score              integer NOT NULL DEFAULT 1,
  risk_status             text NOT NULL DEFAULT 'open',
  mitigations             jsonb NOT NULL DEFAULT '[]',
  risk_owner              text NOT NULL,
  review_frequency        text NOT NULL DEFAULT 'monthly',
  last_review_date        date,
  next_review_date        date,
  child_id                uuid,
  child_name              text,
  linked_incident_ids     jsonb NOT NULL DEFAULT '[]',
  escalated_to            text,
  date_identified         date NOT NULL,
  date_closed             date,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_reg_home       ON cs_risk_register(home_id);
CREATE INDEX IF NOT EXISTS idx_risk_reg_category   ON cs_risk_register(risk_category);
CREATE INDEX IF NOT EXISTS idx_risk_reg_status     ON cs_risk_register(risk_status);
CREATE INDEX IF NOT EXISTS idx_risk_reg_score      ON cs_risk_register(risk_score);
CREATE INDEX IF NOT EXISTS idx_risk_reg_child      ON cs_risk_register(child_id);
CREATE INDEX IF NOT EXISTS idx_risk_reg_review     ON cs_risk_register(next_review_date);

ALTER TABLE cs_risk_register ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own risk register"
    ON cs_risk_register FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
