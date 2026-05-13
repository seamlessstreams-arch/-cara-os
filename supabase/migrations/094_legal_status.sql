-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — LEGAL STATUS
-- CHR 2015 Reg 8 (parental responsibility — legal framework),
-- Reg 36 (records — legal status documentation),
-- Children Act 1989 (s.20, s.31, s.38, s.44).
-- Tables: cs_legal_records
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_legal_records (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                  uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name               text NOT NULL,
  child_id                 uuid NOT NULL,
  legal_status             text NOT NULL,
  order_type               text,
  order_date               date,
  order_expiry             date,
  court_type               text,
  court_name               text,
  conditions               jsonb NOT NULL DEFAULT '[]',
  solicitor_name           text,
  solicitor_contact        text,
  guardian_name            text,
  parental_responsibility  jsonb NOT NULL DEFAULT '[]',
  contact_conditions       text,
  next_hearing_date        date,
  last_hearing_outcome     text,
  staff_briefed            boolean NOT NULL DEFAULT false,
  notes                    text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_home          ON cs_legal_records(home_id);
CREATE INDEX IF NOT EXISTS idx_legal_child         ON cs_legal_records(child_id);
CREATE INDEX IF NOT EXISTS idx_legal_status        ON cs_legal_records(legal_status);
CREATE INDEX IF NOT EXISTS idx_legal_order_type    ON cs_legal_records(order_type);
CREATE INDEX IF NOT EXISTS idx_legal_order_expiry  ON cs_legal_records(order_expiry);
CREATE INDEX IF NOT EXISTS idx_legal_hearing       ON cs_legal_records(next_hearing_date);

ALTER TABLE cs_legal_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own legal records"
    ON cs_legal_records FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
