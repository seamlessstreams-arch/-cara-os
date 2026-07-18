-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — WORKFORCE PLANNING
-- CHR 2015 Reg 33 (sufficient, qualified staff),
-- Reg 34 (fitness of workers).
-- Tables: cs_staffing_snapshots, cs_vacancy_records, cs_succession_plans
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_staffing_snapshots ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_staffing_snapshots (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  snapshot_date          date NOT NULL,
  established_posts      integer NOT NULL,
  filled_posts           integer NOT NULL,
  vacancies              integer NOT NULL,
  agency_staff           integer NOT NULL DEFAULT 0,
  bank_staff             integer NOT NULL DEFAULT 0,
  staff_on_leave         integer NOT NULL DEFAULT 0,
  staff_on_sickness      integer NOT NULL DEFAULT 0,
  children_in_placement  integer NOT NULL,
  staff_child_ratio      numeric(4,2) NOT NULL,
  meets_minimum_ratio    boolean NOT NULL DEFAULT true,
  commentary             text,
  recorded_by            text NOT NULL,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staffing_snapshots_home  ON cs_staffing_snapshots(home_id);
CREATE INDEX IF NOT EXISTS idx_staffing_snapshots_date  ON cs_staffing_snapshots(snapshot_date);

ALTER TABLE cs_staffing_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own staffing snapshots"
    ON cs_staffing_snapshots FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_vacancy_records ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_vacancy_records (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  role                   text NOT NULL,
  title                  text NOT NULL,
  status                 text NOT NULL DEFAULT 'open',
  date_opened            date NOT NULL,
  date_filled            date,
  closing_date           date,
  applications_received  integer NOT NULL DEFAULT 0,
  interviews_scheduled   integer NOT NULL DEFAULT 0,
  offers_made            integer NOT NULL DEFAULT 0,
  agency_cover           boolean NOT NULL DEFAULT false,
  recruitment_notes      text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vacancy_records_home    ON cs_vacancy_records(home_id);
CREATE INDEX IF NOT EXISTS idx_vacancy_records_status  ON cs_vacancy_records(status);
CREATE INDEX IF NOT EXISTS idx_vacancy_records_role    ON cs_vacancy_records(role);

ALTER TABLE cs_vacancy_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own vacancy records"
    ON cs_vacancy_records FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_succession_plans ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_succession_plans (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  critical_role          text NOT NULL,
  role_title             text NOT NULL,
  current_holder         text NOT NULL,
  successor_name         text,
  readiness              text NOT NULL DEFAULT 'not_identified',
  development_actions    jsonb NOT NULL DEFAULT '[]',
  risk_if_vacant         text NOT NULL,
  last_reviewed          date NOT NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_succession_plans_home       ON cs_succession_plans(home_id);
CREATE INDEX IF NOT EXISTS idx_succession_plans_readiness  ON cs_succession_plans(readiness);

ALTER TABLE cs_succession_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own succession plans"
    ON cs_succession_plans FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
