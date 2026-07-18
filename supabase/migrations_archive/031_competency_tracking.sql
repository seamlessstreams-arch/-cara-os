-- ══════════════════════════════════════════════════════════════════════════════
-- 031 — Staff Competency & Training Tracking
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_training_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id              uuid NOT NULL REFERENCES staff(id),
  home_id               uuid NOT NULL REFERENCES homes(id),
  category              text NOT NULL,
  course_name           text NOT NULL,
  provider              text,
  is_mandatory          boolean DEFAULT false,
  status                text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('current', 'expiring_soon', 'expired', 'not_started', 'booked')),
  completed_date        date,
  expiry_date           date,
  certificate_ref       text,
  renewal_period_months integer,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_competency_assessments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id          uuid NOT NULL REFERENCES staff(id),
  home_id           uuid NOT NULL REFERENCES homes(id),
  competency_area   text NOT NULL,
  level             text NOT NULL DEFAULT 'not_assessed'
    CHECK (level IN ('not_assessed', 'developing', 'competent', 'proficient', 'expert')),
  assessed_by       uuid NOT NULL REFERENCES staff(id),
  assessed_date     date NOT NULL DEFAULT CURRENT_DATE,
  evidence          text,
  development_notes text,
  next_review_date  date,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_training_staff ON cs_training_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_cs_training_home ON cs_training_records(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_training_status ON cs_training_records(status);
CREATE INDEX IF NOT EXISTS idx_cs_training_expiry ON cs_training_records(expiry_date);
CREATE INDEX IF NOT EXISTS idx_cs_competency_staff ON cs_competency_assessments(staff_id);
CREATE INDEX IF NOT EXISTS idx_cs_competency_home ON cs_competency_assessments(home_id);

ALTER TABLE cs_training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_competency_assessments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  EXECUTE format(
    'CREATE POLICY %I ON cs_training_records FOR ALL USING (home_id = get_my_home_id())',
    'cs_training_rls'
  );
  EXECUTE format(
    'CREATE POLICY %I ON cs_competency_assessments FOR ALL USING (home_id = get_my_home_id())',
    'cs_competency_rls'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
