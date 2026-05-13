-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ONLINE SAFETY
-- CHR 2015 Reg 12 (safeguarding — online risks),
-- Reg 5 (quality of care — digital wellbeing), KCSIE.
-- Tables: cs_online_safety_incidents, cs_device_agreements
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_online_safety_incidents ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_online_safety_incidents (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                 uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name              text NOT NULL,
  child_id                uuid NOT NULL,
  incident_date           date NOT NULL,
  risk_category           text NOT NULL,
  severity                text NOT NULL DEFAULT 'medium',
  description             text NOT NULL,
  platform_involved       text,
  device_type             text,
  action_taken            text NOT NULL,
  parent_carer_informed   boolean NOT NULL DEFAULT false,
  social_worker_informed  boolean NOT NULL DEFAULT false,
  police_involved         boolean NOT NULL DEFAULT false,
  safeguarding_referral   boolean NOT NULL DEFAULT false,
  outcome                 text,
  staff_recording         text NOT NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_online_safety_home       ON cs_online_safety_incidents(home_id);
CREATE INDEX IF NOT EXISTS idx_online_safety_child      ON cs_online_safety_incidents(child_id);
CREATE INDEX IF NOT EXISTS idx_online_safety_date       ON cs_online_safety_incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_online_safety_category   ON cs_online_safety_incidents(risk_category);
CREATE INDEX IF NOT EXISTS idx_online_safety_severity   ON cs_online_safety_incidents(severity);

ALTER TABLE cs_online_safety_incidents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own online safety incidents"
    ON cs_online_safety_incidents FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_device_agreements ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_device_agreements (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name            text NOT NULL,
  child_id              uuid NOT NULL,
  device_types          jsonb NOT NULL DEFAULT '[]',
  agreement_date        date NOT NULL,
  review_date           date NOT NULL,
  status                text NOT NULL DEFAULT 'active',
  filtering_enabled     boolean NOT NULL DEFAULT true,
  monitoring_enabled    boolean NOT NULL DEFAULT true,
  agreed_usage_hours    integer NOT NULL DEFAULT 2,
  restrictions          jsonb NOT NULL DEFAULT '[]',
  last_safety_check     date,
  last_check_result     text NOT NULL DEFAULT 'not_checked',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_agreements_home    ON cs_device_agreements(home_id);
CREATE INDEX IF NOT EXISTS idx_device_agreements_child   ON cs_device_agreements(child_id);
CREATE INDEX IF NOT EXISTS idx_device_agreements_status  ON cs_device_agreements(status);

ALTER TABLE cs_device_agreements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own device agreements"
    ON cs_device_agreements FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
