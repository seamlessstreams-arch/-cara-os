-- ══════════════════════════════════════════════════════════════════════════════
-- 025: ARIA context links & proactive insights tables
-- ══════════════════════════════════════════════════════════════════════════════

-- ── aria_context_links ───────────────────────────────────────────────────────
-- Bidirectional links between records that ARIA has identified (e.g. an
-- incident that should trigger a risk assessment review).

CREATE TABLE IF NOT EXISTS aria_context_links (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       UUID REFERENCES homes(id) ON DELETE CASCADE,

  source_table  TEXT NOT NULL,
  source_id     UUID NOT NULL,
  target_table  TEXT NOT NULL,
  target_id     UUID NOT NULL,

  relationship_type TEXT NOT NULL,   -- triggered_by, relates_to, informs, etc.
  description       TEXT,
  confidence        SMALLINT NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),

  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'verified', 'dismissed', 'expired')),

  created_by    TEXT NOT NULL DEFAULT 'aria',  -- 'aria' or user UUID
  verified_by   UUID REFERENCES staff(id),
  verified_at   TIMESTAMPTZ,

  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast bidirectional lookup
CREATE INDEX IF NOT EXISTS idx_context_links_source
  ON aria_context_links (source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_context_links_target
  ON aria_context_links (target_table, target_id);
CREATE INDEX IF NOT EXISTS idx_context_links_status
  ON aria_context_links (status);
CREATE INDEX IF NOT EXISTS idx_context_links_home
  ON aria_context_links (home_id);

-- ── aria_insights ────────────────────────────────────────────────────────────
-- Proactive insights detected by ARIA — patterns, risk escalations,
-- compliance gaps, positive trends, and staffing concerns.

CREATE TABLE IF NOT EXISTS aria_insights (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       UUID REFERENCES homes(id) ON DELETE CASCADE,

  type          TEXT NOT NULL
                  CHECK (type IN (
                    'behaviour_pattern', 'risk_escalation', 'compliance_gap',
                    'positive_trend', 'staffing_concern', 'oversight_gap',
                    'evidence_gap', 'wellbeing_alert'
                  )),

  severity      TEXT NOT NULL DEFAULT 'medium'
                  CHECK (severity IN ('critical', 'high', 'medium', 'low', 'positive')),

  title         TEXT NOT NULL,
  summary       TEXT NOT NULL,
  recommendation TEXT,
  confidence    SMALLINT NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),

  related_child_id  UUID REFERENCES young_people(id),
  related_child_name TEXT,
  related_module     TEXT,

  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'acknowledged', 'actioned', 'dismissed', 'expired')),

  acknowledged_by UUID REFERENCES staff(id),
  acknowledged_at TIMESTAMPTZ,
  actioned_by     UUID REFERENCES staff(id),
  actioned_at     TIMESTAMPTZ,
  action_notes    TEXT,

  detected_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common access patterns
CREATE INDEX IF NOT EXISTS idx_insights_home_type
  ON aria_insights (home_id, type);
CREATE INDEX IF NOT EXISTS idx_insights_severity
  ON aria_insights (severity);
CREATE INDEX IF NOT EXISTS idx_insights_status
  ON aria_insights (status);
CREATE INDEX IF NOT EXISTS idx_insights_detected
  ON aria_insights (detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_child
  ON aria_insights (related_child_id) WHERE related_child_id IS NOT NULL;
