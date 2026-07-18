-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — KPI TRACKING
-- CHR 2015 Reg 45 (quality of care review), Reg 35 (leadership).
-- Tables: cs_kpi_definitions, cs_kpi_measurements
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_kpi_definitions ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_kpi_definitions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  description           text NOT NULL,
  domain                text NOT NULL,
  unit                  text NOT NULL,
  target_value          numeric(10,2) NOT NULL,
  threshold_amber       numeric(10,2) NOT NULL,
  threshold_red         numeric(10,2) NOT NULL,
  higher_is_better      boolean NOT NULL DEFAULT true,
  frequency             text NOT NULL,
  data_source           text NOT NULL,
  responsible_person    text NOT NULL,
  active                boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kpi_definitions_home     ON cs_kpi_definitions(home_id);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_domain   ON cs_kpi_definitions(domain);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_active   ON cs_kpi_definitions(active);

ALTER TABLE cs_kpi_definitions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own KPI definitions"
    ON cs_kpi_definitions FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_kpi_measurements ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_kpi_measurements (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  kpi_id                uuid NOT NULL REFERENCES cs_kpi_definitions(id) ON DELETE CASCADE,
  kpi_name              text NOT NULL,
  measurement_date      date NOT NULL,
  period                text NOT NULL,
  value                 numeric(10,2) NOT NULL,
  target                numeric(10,2) NOT NULL,
  status                text NOT NULL,
  trend                 text NOT NULL DEFAULT 'new',
  commentary            text,
  actions_if_below      text,
  measured_by           text NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kpi_measurements_home   ON cs_kpi_measurements(home_id);
CREATE INDEX IF NOT EXISTS idx_kpi_measurements_kpi    ON cs_kpi_measurements(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_measurements_date   ON cs_kpi_measurements(measurement_date);
CREATE INDEX IF NOT EXISTS idx_kpi_measurements_status ON cs_kpi_measurements(status);

ALTER TABLE cs_kpi_measurements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own KPI measurements"
    ON cs_kpi_measurements FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
