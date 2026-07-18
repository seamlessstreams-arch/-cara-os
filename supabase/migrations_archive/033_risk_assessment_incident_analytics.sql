-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — RISK ASSESSMENT & INCIDENT ANALYTICS TABLES
-- Migration 033: Risk assessment lifecycle + incident analytics aggregation
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Risk assessments ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_risk_assessments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id              uuid,
  category              text NOT NULL
                          CHECK (category IN (
                            'self_harm','violence_aggression','absconding','exploitation',
                            'substance_misuse','online_safety','fire_setting','bullying',
                            'sexual_behaviour','environmental','health_medical','transport',
                            'activities','emotional_wellbeing','radicalisation'
                          )),
  title                 text NOT NULL,
  description           text,
  likelihood            smallint NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
  impact                smallint NOT NULL CHECK (impact BETWEEN 1 AND 5),
  inherent_risk_score   smallint NOT NULL GENERATED ALWAYS AS (likelihood * impact) STORED,
  current_risk_level    text NOT NULL
                          CHECK (current_risk_level IN ('very_high','high','medium','low','very_low')),
  residual_risk_level   text
                          CHECK (residual_risk_level IN ('very_high','high','medium','low','very_low')),
  mitigations           jsonb NOT NULL DEFAULT '[]'::jsonb,
  triggers              jsonb NOT NULL DEFAULT '[]'::jsonb,
  protective_factors    jsonb NOT NULL DEFAULT '[]'::jsonb,
  status                text NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','under_review','mitigated','closed','escalated')),
  assessor_id           uuid NOT NULL,
  reviewer_id           uuid,
  review_date           date,
  next_review_date      date,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_assess_home     ON cs_risk_assessments(home_id);
CREATE INDEX IF NOT EXISTS idx_risk_assess_child    ON cs_risk_assessments(child_id);
CREATE INDEX IF NOT EXISTS idx_risk_assess_cat      ON cs_risk_assessments(category);
CREATE INDEX IF NOT EXISTS idx_risk_assess_status   ON cs_risk_assessments(status);
CREATE INDEX IF NOT EXISTS idx_risk_assess_level    ON cs_risk_assessments(current_risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_assess_review   ON cs_risk_assessments(next_review_date);

-- ── Incident analytics snapshots ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_incident_analytics (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id           uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  period_start      date NOT NULL,
  period_end        date NOT NULL,
  total_incidents   integer NOT NULL DEFAULT 0,
  by_category       jsonb NOT NULL DEFAULT '{}'::jsonb,
  by_severity       jsonb NOT NULL DEFAULT '{}'::jsonb,
  by_child          jsonb NOT NULL DEFAULT '{}'::jsonb,
  by_day_of_week    jsonb NOT NULL DEFAULT '[]'::jsonb,
  by_hour           jsonb NOT NULL DEFAULT '[]'::jsonb,
  pi_count          integer NOT NULL DEFAULT 0,
  pi_avg_duration   numeric,
  pi_injury_rate    numeric,
  pi_debrief_rate   numeric,
  notification_required   integer NOT NULL DEFAULT 0,
  notification_sent       integer NOT NULL DEFAULT 0,
  high_frequency_children jsonb NOT NULL DEFAULT '[]'::jsonb,
  clustering_events       jsonb NOT NULL DEFAULT '[]'::jsonb,
  trend_direction         text CHECK (trend_direction IN ('increasing','stable','decreasing')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incident_analytics_home   ON cs_incident_analytics(home_id);
CREATE INDEX IF NOT EXISTS idx_incident_analytics_period ON cs_incident_analytics(period_start, period_end);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE cs_risk_assessments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_incident_analytics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY risk_assess_home_policy ON cs_risk_assessments
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY incident_analytics_home_policy ON cs_incident_analytics
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
