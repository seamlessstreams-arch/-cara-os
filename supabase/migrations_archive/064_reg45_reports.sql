-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — REG 45 RESPONSIBLE INDIVIDUAL QUALITY REPORTS
-- CHR 2015 Reg 45 — quality of care review by responsible individual
-- Tables: cs_reg45_reports, cs_reg45_actions
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_reg45_reports ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_reg45_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  report_period_start  date    NOT NULL,
  report_period_end    date    NOT NULL,
  responsible_individual text  NOT NULL,
  visit_dates     jsonb   NOT NULL DEFAULT '[]',
  visit_types     jsonb   NOT NULL DEFAULT '[]',
  children_interviewed jsonb NOT NULL DEFAULT '[]',
  staff_interviewed    jsonb NOT NULL DEFAULT '[]',
  overall_quality_rating text NOT NULL DEFAULT 'good',
  evaluations     jsonb   NOT NULL DEFAULT '[]',
  reg44_reports_reviewed integer NOT NULL DEFAULT 0,
  reg44_actions_outstanding integer NOT NULL DEFAULT 0,
  statement_of_purpose_compliant boolean NOT NULL DEFAULT true,
  key_strengths   jsonb   NOT NULL DEFAULT '[]',
  areas_for_improvement jsonb NOT NULL DEFAULT '[]',
  status          text    NOT NULL DEFAULT 'draft',
  approved_by     text,
  approval_date   date,
  distribution_date date,
  ofsted_sent     boolean NOT NULL DEFAULT false,
  placing_authority_sent boolean NOT NULL DEFAULT false,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reg45_reports_home   ON cs_reg45_reports(home_id);
CREATE INDEX IF NOT EXISTS idx_reg45_reports_status ON cs_reg45_reports(status);
CREATE INDEX IF NOT EXISTS idx_reg45_reports_period ON cs_reg45_reports(report_period_end);

ALTER TABLE cs_reg45_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own reg45 reports"
    ON cs_reg45_reports FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_reg45_actions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_reg45_actions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id           uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  report_id         uuid NOT NULL REFERENCES cs_reg45_reports(id) ON DELETE CASCADE,
  action_description text NOT NULL,
  evaluation_area   text NOT NULL,
  priority          text NOT NULL DEFAULT 'medium',
  assigned_to       text NOT NULL,
  due_date          date NOT NULL,
  status            text NOT NULL DEFAULT 'open',
  completion_date   date,
  completion_notes  text,
  evidence_reference text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reg45_actions_home     ON cs_reg45_actions(home_id);
CREATE INDEX IF NOT EXISTS idx_reg45_actions_report   ON cs_reg45_actions(report_id);
CREATE INDEX IF NOT EXISTS idx_reg45_actions_status   ON cs_reg45_actions(status);
CREATE INDEX IF NOT EXISTS idx_reg45_actions_due_date ON cs_reg45_actions(due_date);

ALTER TABLE cs_reg45_actions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own reg45 actions"
    ON cs_reg45_actions FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
