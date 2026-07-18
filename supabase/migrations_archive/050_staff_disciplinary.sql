-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 050 Staff Disciplinary & Grievances
-- Disciplinary records, grievance tracking, investigations, outcomes.
-- Reg 33 (employment of staff), Reg 34 (fitness of workers),
-- Reg 40 (notifications), SCCIF Leadership & Management.
-- Tables: cs_disciplinary_records, cs_grievance_records
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_disciplinary_records ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_disciplinary_records (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  staff_id                    UUID NOT NULL,
  staff_name                  TEXT NOT NULL,
  category                    TEXT NOT NULL DEFAULT 'conduct',
  description                 TEXT NOT NULL DEFAULT '',
  date_of_incident            DATE NOT NULL DEFAULT CURRENT_DATE,
  reported_by                 TEXT NOT NULL,
  reported_date               DATE NOT NULL DEFAULT CURRENT_DATE,
  investigation_required      BOOLEAN NOT NULL DEFAULT FALSE,
  investigating_officer       TEXT,
  investigation_started_date  DATE,
  investigation_completed_date DATE,
  hearing_date                DATE,
  hearing_outcome             TEXT,
  outcome_type                TEXT,
  outcome_date                DATE,
  outcome_expiry_date         DATE,
  appeal_submitted            BOOLEAN NOT NULL DEFAULT FALSE,
  appeal_date                 DATE,
  appeal_outcome              TEXT,
  lado_referral_required      BOOLEAN NOT NULL DEFAULT FALSE,
  lado_referral_date          DATE,
  dbs_referral_required       BOOLEAN NOT NULL DEFAULT FALSE,
  dbs_referral_date           DATE,
  ofsted_notification_required BOOLEAN NOT NULL DEFAULT FALSE,
  ofsted_notification_date    DATE,
  status                      TEXT NOT NULL DEFAULT 'reported',
  notes                       TEXT,
  supporting_documents        JSONB NOT NULL DEFAULT '[]',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_disciplinary_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "disciplinary_records_home" ON cs_disciplinary_records
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_disciplinary_records_home
  ON cs_disciplinary_records(home_id, staff_id);

CREATE INDEX IF NOT EXISTS idx_disciplinary_records_status
  ON cs_disciplinary_records(status, category);

-- ── cs_grievance_records ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_grievance_records (
  id                            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                       UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  staff_id                      UUID NOT NULL,
  staff_name                    TEXT NOT NULL,
  grievance_type                TEXT NOT NULL DEFAULT 'working_conditions',
  description                   TEXT NOT NULL DEFAULT '',
  date_raised                   DATE NOT NULL DEFAULT CURRENT_DATE,
  informal_resolution_attempted BOOLEAN NOT NULL DEFAULT FALSE,
  informal_resolution_date      DATE,
  informal_outcome              TEXT,
  formal_stage                  TEXT,
  hearing_date                  DATE,
  hearing_officer               TEXT,
  outcome                       TEXT,
  outcome_date                  DATE,
  appeal_submitted              BOOLEAN NOT NULL DEFAULT FALSE,
  appeal_date                   DATE,
  appeal_outcome                TEXT,
  status                        TEXT NOT NULL DEFAULT 'raised',
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_grievance_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "grievance_records_home" ON cs_grievance_records
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_grievance_records_home
  ON cs_grievance_records(home_id, staff_id);

CREATE INDEX IF NOT EXISTS idx_grievance_records_status
  ON cs_grievance_records(status);
