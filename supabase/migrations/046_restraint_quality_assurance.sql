

-- ── cs_quality_audits ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_quality_audits (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  audit_type                  TEXT NOT NULL,
  audit_date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  auditor                     TEXT NOT NULL,
  areas_audited               JSONB NOT NULL DEFAULT '[]',
  overall_rating              TEXT NOT NULL DEFAULT 'good',
  strengths                   JSONB NOT NULL DEFAULT '[]',
  areas_for_improvement       JSONB NOT NULL DEFAULT '[]',
  recommendations             JSONB NOT NULL DEFAULT '[]',
  previous_actions_reviewed   BOOLEAN NOT NULL DEFAULT FALSE,
  previous_actions_status     TEXT NOT NULL DEFAULT '',
  next_audit_date             DATE,
  status                      TEXT NOT NULL DEFAULT 'planned',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_quality_audits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "quality_audits_home" ON cs_quality_audits
    USING (home_id = (select get_my_home_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_quality_audits_home
  ON cs_quality_audits(home_id, audit_date);

CREATE INDEX IF NOT EXISTS idx_quality_audits_status
  ON cs_quality_audits(status);

-- ── cs_improvement_plans ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_improvement_plans (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id               UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  source                TEXT NOT NULL,
  created_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  target_completion     DATE NOT NULL,
  actions               JSONB NOT NULL DEFAULT '[]',
  status                TEXT NOT NULL DEFAULT 'active',
  progress_percentage   INTEGER NOT NULL DEFAULT 0,
  review_date           DATE,
  reviewed_by           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_improvement_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "improvement_plans_home" ON cs_improvement_plans
    USING (home_id = (select get_my_home_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_improvement_plans_home
  ON cs_improvement_plans(home_id);

CREATE INDEX IF NOT EXISTS idx_improvement_plans_status
  ON cs_improvement_plans(status);
