-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 374: Cross-home Intelligence
--
-- Tables for multi-home oversight dashboard supporting RI/Operations-level
-- aggregated views across all homes in an organisation.
-- ══════════════════════════════════════════════════════════════════════════════

-- Cross-home intelligence snapshots (computed periodically)
CREATE TABLE IF NOT EXISTS cs_cross_home_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  home_id UUID NOT NULL,
  home_name TEXT NOT NULL,
  -- Metrics
  total_children INT DEFAULT 0,
  total_incidents_7d INT DEFAULT 0,
  total_incidents_30d INT DEFAULT 0,
  safeguarding_concerns_open INT DEFAULT 0,
  risk_level_overall TEXT DEFAULT 'low',
  recording_compliance_pct NUMERIC(5,2) DEFAULT 0,
  avg_daily_log_quality NUMERIC(3,1) DEFAULT 0,
  key_work_sessions_due INT DEFAULT 0,
  key_work_sessions_overdue INT DEFAULT 0,
  staff_supervision_compliance_pct NUMERIC(5,2) DEFAULT 0,
  management_oversight_current BOOLEAN DEFAULT false,
  ofsted_readiness_score NUMERIC(5,2) DEFAULT 0,
  reg45_due_date DATE,
  reg44_due_date DATE,
  -- ARIA signals
  aria_alerts JSONB DEFAULT '[]',
  aria_risk_factors JSONB DEFAULT '[]',
  aria_recommendations JSONB DEFAULT '[]',
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organisation_id, snapshot_date, home_id)
);

-- Cross-home trends
CREATE TABLE IF NOT EXISTS cs_cross_home_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  home_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cross_home_snapshots_org ON cs_cross_home_snapshots(organisation_id, snapshot_date DESC);
CREATE INDEX idx_cross_home_snapshots_home ON cs_cross_home_snapshots(home_id, snapshot_date DESC);
CREATE INDEX idx_cross_home_trends_org ON cs_cross_home_trends(organisation_id, metric_name, period_end DESC);

ALTER TABLE cs_cross_home_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_cross_home_trends ENABLE ROW LEVEL SECURITY;
