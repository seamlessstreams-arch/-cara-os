-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 040 Staff Rota & Premises
-- Reg 16 (staffing), Reg 25 (premises), Reg 33 (employment of staff)
-- Tables: cs_rota_entries, cs_absence_records, cs_premises_checks,
--         cs_maintenance_requests
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_rota_entries ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_rota_entries (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  staff_id      UUID NOT NULL,
  staff_name    TEXT NOT NULL,
  role          TEXT NOT NULL,
  date          DATE NOT NULL,
  shift_type    TEXT NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  hours         NUMERIC(4,1) NOT NULL DEFAULT 0,
  is_agency     BOOLEAN NOT NULL DEFAULT FALSE,
  is_overtime   BOOLEAN NOT NULL DEFAULT FALSE,
  notes         TEXT,
  status        TEXT NOT NULL DEFAULT 'planned',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_rota_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "rota_home" ON cs_rota_entries
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_rota_entries_home_date
  ON cs_rota_entries(home_id, date);

CREATE INDEX IF NOT EXISTS idx_rota_entries_staff
  ON cs_rota_entries(staff_id, date);

-- ── cs_absence_records ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_absence_records (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                   UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  staff_id                  UUID NOT NULL,
  staff_name                TEXT NOT NULL,
  absence_type              TEXT NOT NULL,
  start_date                DATE NOT NULL,
  end_date                  DATE NOT NULL,
  days                      NUMERIC(5,1) NOT NULL DEFAULT 0,
  reason                    TEXT,
  approved_by               TEXT,
  status                    TEXT NOT NULL DEFAULT 'requested',
  return_to_work_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_absence_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "absence_home" ON cs_absence_records
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_absence_records_home
  ON cs_absence_records(home_id);

CREATE INDEX IF NOT EXISTS idx_absence_records_staff
  ON cs_absence_records(staff_id);

-- ── cs_premises_checks ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_premises_checks (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id               UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  check_type            TEXT NOT NULL,
  check_date            DATE NOT NULL,
  completed_by          TEXT NOT NULL,
  result                TEXT NOT NULL DEFAULT 'pass',
  notes                 TEXT,
  issues_found          JSONB NOT NULL DEFAULT '[]',
  follow_up_required    BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_date        DATE,
  certificate_reference TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_premises_checks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "premises_checks_home" ON cs_premises_checks
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_premises_checks_home_type
  ON cs_premises_checks(home_id, check_type);

CREATE INDEX IF NOT EXISTS idx_premises_checks_date
  ON cs_premises_checks(check_date);

-- ── cs_maintenance_requests ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_maintenance_requests (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id           UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  category          TEXT NOT NULL,
  priority          TEXT NOT NULL DEFAULT 'medium',
  location          TEXT NOT NULL DEFAULT '',
  reported_by       TEXT NOT NULL,
  reported_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  assigned_to       TEXT,
  estimated_cost    NUMERIC(10,2),
  actual_cost       NUMERIC(10,2),
  completion_date   TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'open',
  child_safety_risk BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_maintenance_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "maintenance_home" ON cs_maintenance_requests
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_maintenance_home_status
  ON cs_maintenance_requests(home_id, status);

CREATE INDEX IF NOT EXISTS idx_maintenance_priority
  ON cs_maintenance_requests(priority);
