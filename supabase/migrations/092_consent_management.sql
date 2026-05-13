-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — CONSENT MANAGEMENT
-- CHR 2015 Reg 7 (children's wishes and feelings),
-- Reg 8 (parental responsibility),
-- Reg 14 (healthcare — consent to treatment),
-- Reg 32 (provision of information — data sharing consent).
-- Tables: cs_consent_records
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_consent_records (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id           uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name        text NOT NULL,
  child_id          uuid NOT NULL,
  category          text NOT NULL,
  status            text NOT NULL DEFAULT 'pending',
  given_by          text NOT NULL,
  given_by_name     text NOT NULL,
  consent_date      date NOT NULL,
  expiry_date       date,
  conditions        text,
  evidence_on_file  boolean NOT NULL DEFAULT false,
  reviewed_date     date,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_home      ON cs_consent_records(home_id);
CREATE INDEX IF NOT EXISTS idx_consent_child     ON cs_consent_records(child_id);
CREATE INDEX IF NOT EXISTS idx_consent_category  ON cs_consent_records(category);
CREATE INDEX IF NOT EXISTS idx_consent_status    ON cs_consent_records(status);
CREATE INDEX IF NOT EXISTS idx_consent_expiry    ON cs_consent_records(expiry_date);

ALTER TABLE cs_consent_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own consent records"
    ON cs_consent_records FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
