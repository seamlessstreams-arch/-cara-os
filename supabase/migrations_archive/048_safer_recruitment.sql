-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 048 Safer Recruitment
-- DBS checks, staff references, pre-employment checklists.
-- Reg 32 (fitness of staff), Reg 33 (employment of staff),
-- Schedule 1 & 2 (information requirements), SCCIF Leadership & Management.
-- Tables: cs_dbs_checks, cs_staff_references, cs_pre_employment_checks
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_dbs_checks ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_dbs_checks (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                   UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  staff_id                  UUID NOT NULL,
  staff_name                TEXT NOT NULL,
  dbs_type                  TEXT NOT NULL DEFAULT 'enhanced_barred',
  certificate_number        TEXT,
  issue_date                DATE NOT NULL,
  expiry_date               DATE NOT NULL,
  update_service_registered BOOLEAN NOT NULL DEFAULT FALSE,
  update_service_id         TEXT,
  status                    TEXT NOT NULL DEFAULT 'valid',
  checked_by                TEXT NOT NULL,
  checked_date              DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_dbs_checks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "dbs_checks_home" ON cs_dbs_checks
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_dbs_checks_home
  ON cs_dbs_checks(home_id, staff_id);

CREATE INDEX IF NOT EXISTS idx_dbs_checks_expiry
  ON cs_dbs_checks(expiry_date, status);

-- ── cs_staff_references ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_staff_references (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id               UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  staff_id              UUID NOT NULL,
  staff_name            TEXT NOT NULL,
  reference_type        TEXT NOT NULL DEFAULT 'employer',
  referee_name          TEXT NOT NULL,
  referee_role          TEXT NOT NULL,
  referee_organisation  TEXT NOT NULL DEFAULT '',
  referee_email         TEXT,
  referee_phone         TEXT,
  date_requested        DATE NOT NULL DEFAULT CURRENT_DATE,
  date_received         DATE,
  satisfactory          BOOLEAN,
  concerns_noted        TEXT,
  verified_by           TEXT,
  verified_date         DATE,
  status                TEXT NOT NULL DEFAULT 'requested',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_staff_references ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "staff_references_home" ON cs_staff_references
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_staff_references_home
  ON cs_staff_references(home_id, staff_id);

-- ── cs_pre_employment_checks ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_pre_employment_checks (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id             UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  staff_id            UUID NOT NULL,
  staff_name          TEXT NOT NULL,
  check_type          TEXT NOT NULL,
  completed           BOOLEAN NOT NULL DEFAULT FALSE,
  completed_date      DATE,
  completed_by        TEXT,
  notes               TEXT,
  document_reference  TEXT,
  status              TEXT NOT NULL DEFAULT 'pending',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_pre_employment_checks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "pre_employment_checks_home" ON cs_pre_employment_checks
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_pre_employment_checks_home
  ON cs_pre_employment_checks(home_id, staff_id);

CREATE INDEX IF NOT EXISTS idx_pre_employment_checks_status
  ON cs_pre_employment_checks(staff_id, status);
