-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 058 Night Monitoring
-- Waking night checks, overnight shift logs, premises security.
-- CHR 2015 Reg 12 (protection), Reg 25 (premises — night safety),
-- Reg 32/33 (fitness of workers — night staffing), Quality Standards Guide.
-- Tables: cs_night_checks, cs_night_logs
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_night_checks ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_night_checks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id         UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id        UUID NOT NULL,
  child_name      TEXT NOT NULL,
  check_time      TIMESTAMPTZ NOT NULL,
  checked_by      TEXT NOT NULL,
  check_type      TEXT NOT NULL,
  child_status    TEXT NOT NULL,
  response_action TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_night_checks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "night_checks_home" ON cs_night_checks
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_night_checks_home
  ON cs_night_checks(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_night_checks_time
  ON cs_night_checks(check_time, check_type);

-- ── cs_night_logs ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_night_logs (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                 UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  shift_date              DATE NOT NULL,
  shift_start             TIMESTAMPTZ NOT NULL,
  shift_end               TIMESTAMPTZ,
  staff_on_duty           JSONB NOT NULL DEFAULT '[]',
  lead_staff              TEXT NOT NULL,
  handover_received       BOOLEAN NOT NULL DEFAULT FALSE,
  handover_notes          TEXT,
  total_checks_completed  INT NOT NULL DEFAULT 0,
  all_children_checked    BOOLEAN NOT NULL DEFAULT FALSE,
  incidents_count         INT NOT NULL DEFAULT 0,
  disturbances_count      INT NOT NULL DEFAULT 0,
  premises_secure         BOOLEAN NOT NULL DEFAULT TRUE,
  fire_panel_checked      BOOLEAN NOT NULL DEFAULT TRUE,
  overnight_summary       TEXT NOT NULL DEFAULT '',
  handover_given          BOOLEAN NOT NULL DEFAULT FALSE,
  handover_given_notes    TEXT,
  status                  TEXT NOT NULL DEFAULT 'in_progress',
  reviewed_by             TEXT,
  reviewed_date           DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_night_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "night_logs_home" ON cs_night_logs
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_night_logs_home
  ON cs_night_logs(home_id, shift_date);

CREATE INDEX IF NOT EXISTS idx_night_logs_status
  ON cs_night_logs(status, shift_date);
