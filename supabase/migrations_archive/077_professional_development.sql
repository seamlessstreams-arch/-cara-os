-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — PROFESSIONAL DEVELOPMENT
-- CHR 2015 Reg 33 (qualifications, skills, competence),
-- Reg 34 (staff support, training, supervision).
-- Tables: cs_cpd_records, cs_qualification_records, cs_development_goals
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_cpd_records ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_cpd_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  staff_id              uuid NOT NULL,
  staff_name            text NOT NULL,
  category              text NOT NULL,
  method                text NOT NULL,
  title                 text NOT NULL,
  description           text NOT NULL,
  provider              text NOT NULL,
  date_completed        date NOT NULL,
  cpd_hours             numeric(6,2) NOT NULL,
  certificate_reference text,
  learning_outcomes     jsonb NOT NULL DEFAULT '[]',
  impact_on_practice    text,
  evidence_attached     boolean NOT NULL DEFAULT false,
  verified_by           text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cpd_records_home      ON cs_cpd_records(home_id);
CREATE INDEX IF NOT EXISTS idx_cpd_records_staff     ON cs_cpd_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_cpd_records_category  ON cs_cpd_records(category);
CREATE INDEX IF NOT EXISTS idx_cpd_records_date      ON cs_cpd_records(date_completed);

ALTER TABLE cs_cpd_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own CPD records"
    ON cs_cpd_records FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_qualification_records ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_qualification_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  staff_id              uuid NOT NULL,
  staff_name            text NOT NULL,
  qualification_name    text NOT NULL,
  awarding_body         text NOT NULL,
  level                 text NOT NULL,
  status                text NOT NULL,
  date_achieved         date,
  expiry_date           date,
  registration_number   text,
  registration_body     text,
  mandatory             boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qualifications_home    ON cs_qualification_records(home_id);
CREATE INDEX IF NOT EXISTS idx_qualifications_staff   ON cs_qualification_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_qualifications_status  ON cs_qualification_records(status);
CREATE INDEX IF NOT EXISTS idx_qualifications_expiry  ON cs_qualification_records(expiry_date);

ALTER TABLE cs_qualification_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own qualification records"
    ON cs_qualification_records FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_development_goals ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_development_goals (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  staff_id              uuid NOT NULL,
  staff_name            text NOT NULL,
  goal                  text NOT NULL,
  rationale             text NOT NULL,
  target_date           date NOT NULL,
  status                text NOT NULL DEFAULT 'not_started',
  progress_notes        jsonb NOT NULL DEFAULT '[]',
  linked_cpd_ids        jsonb NOT NULL DEFAULT '[]',
  date_completed        date,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dev_goals_home    ON cs_development_goals(home_id);
CREATE INDEX IF NOT EXISTS idx_dev_goals_staff   ON cs_development_goals(staff_id);
CREATE INDEX IF NOT EXISTS idx_dev_goals_status  ON cs_development_goals(status);
CREATE INDEX IF NOT EXISTS idx_dev_goals_target  ON cs_development_goals(target_date);

ALTER TABLE cs_development_goals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own development goals"
    ON cs_development_goals FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
