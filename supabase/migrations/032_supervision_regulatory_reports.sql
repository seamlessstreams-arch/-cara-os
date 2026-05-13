-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — SUPERVISION & REGULATORY REPORTING TABLES
-- Migration 032: Staff supervision records and statutory report management
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Staff supervision records ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_supervision_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  staff_id        uuid NOT NULL,
  supervisor_id   uuid NOT NULL,
  type            text NOT NULL DEFAULT 'formal'
                    CHECK (type IN ('formal','informal','group','peer','management','safeguarding')),
  status          text NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled','completed','cancelled','overdue','rescheduled')),
  scheduled_date  date NOT NULL,
  completed_date  date,
  duration_minutes integer,
  location        text,
  agenda_items    jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_discussions text,
  actions_agreed  text,
  staff_wellbeing_score   smallint CHECK (staff_wellbeing_score BETWEEN 1 AND 10),
  practice_quality_score  smallint CHECK (practice_quality_score BETWEEN 1 AND 10),
  safeguarding_discussed  boolean NOT NULL DEFAULT false,
  training_needs_identified text,
  next_supervision_date   date,
  staff_signature         boolean NOT NULL DEFAULT false,
  supervisor_signature    boolean NOT NULL DEFAULT false,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supervision_home     ON cs_supervision_records(home_id);
CREATE INDEX IF NOT EXISTS idx_supervision_staff    ON cs_supervision_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_supervision_super    ON cs_supervision_records(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervision_status   ON cs_supervision_records(status);
CREATE INDEX IF NOT EXISTS idx_supervision_sched    ON cs_supervision_records(scheduled_date);

-- ── Regulatory reports ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_regulatory_reports (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                 uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  report_type             text NOT NULL
                            CHECK (report_type IN ('reg44','reg45','annual_review','ofsted_notification','serious_incident','schedule_5','schedule_6')),
  title                   text NOT NULL,
  reporting_period_start  date,
  reporting_period_end    date,
  author_id               uuid NOT NULL,
  reviewer_id             uuid,
  status                  text NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','in_progress','review','approved','submitted','archived')),
  sections                jsonb NOT NULL DEFAULT '[]'::jsonb,
  findings                jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations         jsonb NOT NULL DEFAULT '[]'::jsonb,
  overall_rating          text CHECK (overall_rating IN ('outstanding','good','requires_improvement','inadequate')),
  submitted_to            text,
  submitted_date          timestamptz,
  next_due_date           date,
  version                 integer NOT NULL DEFAULT 1,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reg_reports_home     ON cs_regulatory_reports(home_id);
CREATE INDEX IF NOT EXISTS idx_reg_reports_type     ON cs_regulatory_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reg_reports_status   ON cs_regulatory_reports(status);
CREATE INDEX IF NOT EXISTS idx_reg_reports_author   ON cs_regulatory_reports(author_id);
CREATE INDEX IF NOT EXISTS idx_reg_reports_due      ON cs_regulatory_reports(next_due_date);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE cs_supervision_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_regulatory_reports  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY supervision_home_policy ON cs_supervision_records
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY reg_reports_home_policy ON cs_regulatory_reports
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
