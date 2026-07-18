-- ══════════════════════════════════════════════════════════════════════════════
-- 026: ARIA rota alerts table
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aria_rota_alerts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       UUID REFERENCES homes(id) ON DELETE CASCADE,

  week_start    DATE NOT NULL,
  type          TEXT NOT NULL
                  CHECK (type IN (
                    'lone_working', 'overtime_risk', 'ratio_breach',
                    'fatigue_risk', 'gap_detected', 'pattern_concern', 'positive'
                  )),

  severity      TEXT NOT NULL DEFAULT 'medium'
                  CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),

  title         TEXT NOT NULL,
  detail        TEXT NOT NULL,
  regulation    TEXT,
  staff_affected TEXT[],
  date_range    TEXT,
  suggestion    TEXT,

  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),

  acknowledged_by UUID REFERENCES staff(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by     UUID REFERENCES staff(id),
  resolved_at     TIMESTAMPTZ,

  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rota_alerts_home_week
  ON aria_rota_alerts (home_id, week_start);
CREATE INDEX IF NOT EXISTS idx_rota_alerts_severity
  ON aria_rota_alerts (severity);
CREATE INDEX IF NOT EXISTS idx_rota_alerts_status
  ON aria_rota_alerts (status);
CREATE INDEX IF NOT EXISTS idx_rota_alerts_created
  ON aria_rota_alerts (created_at DESC);
