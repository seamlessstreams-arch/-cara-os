-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — SLEEP & WAKING NIGHT PATTERNS
-- CHR 2015 Reg 6 (quality of care — rest and sleep),
-- Reg 9 (promoting good health), Reg 10 (dignity — bedtime routines).
-- Tables: cs_night_checks, cs_sleep_records
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_night_checks ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_night_checks (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id             uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  check_date          date NOT NULL,
  check_time          text NOT NULL,
  checked_by          text NOT NULL,
  child_checks        jsonb NOT NULL DEFAULT '[]',
  environment_ok      boolean NOT NULL DEFAULT true,
  security_checked    boolean NOT NULL DEFAULT true,
  temperature_ok      boolean NOT NULL DEFAULT true,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_night_checks_home   ON cs_night_checks(home_id);
CREATE INDEX IF NOT EXISTS idx_night_checks_date   ON cs_night_checks(check_date);

ALTER TABLE cs_night_checks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own night checks"
    ON cs_night_checks FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_sleep_records ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_sleep_records (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                 uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id                text NOT NULL,
  child_name              text NOT NULL,
  record_date             date NOT NULL,
  bedtime                 text NOT NULL,
  settled_time            text,
  wake_time               text,
  sleep_quality           text NOT NULL,
  disturbances            jsonb NOT NULL DEFAULT '[]',
  total_sleep_hours       numeric(4,1),
  sleep_concern_flagged   boolean NOT NULL DEFAULT false,
  concern_severity        text,
  concern_details         text,
  support_provided        text,
  notes                   text,
  recorded_by             text NOT NULL,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sleep_records_home     ON cs_sleep_records(home_id);
CREATE INDEX IF NOT EXISTS idx_sleep_records_child    ON cs_sleep_records(child_id);
CREATE INDEX IF NOT EXISTS idx_sleep_records_date     ON cs_sleep_records(record_date);
CREATE INDEX IF NOT EXISTS idx_sleep_records_quality  ON cs_sleep_records(sleep_quality);

ALTER TABLE cs_sleep_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own sleep records"
    ON cs_sleep_records FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
