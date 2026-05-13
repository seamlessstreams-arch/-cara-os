-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — RECORDS MANAGEMENT
-- CHR 2015 Reg 39 (records — maintenance and availability),
-- Reg 40 (retention and destruction), Data Protection Act 2018.
-- Tables: cs_record_audits, cs_access_requests
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_record_audits ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_record_audits (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  audit_date                  date NOT NULL,
  audited_by                  text NOT NULL,
  child_id                    text NOT NULL,
  child_name                  text NOT NULL,
  records_reviewed            integer NOT NULL DEFAULT 0,
  records_complete            integer NOT NULL DEFAULT 0,
  records_incomplete          integer NOT NULL DEFAULT 0,
  missing_records             jsonb NOT NULL DEFAULT '[]',
  data_quality_rating         text NOT NULL DEFAULT 'not_assessed',
  chronology_up_to_date       boolean NOT NULL DEFAULT true,
  sensitive_data_secure       boolean NOT NULL DEFAULT true,
  third_party_data_redacted   boolean NOT NULL DEFAULT true,
  findings                    text,
  actions_required            text,
  next_audit_date             date,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_record_audits_home    ON cs_record_audits(home_id);
CREATE INDEX IF NOT EXISTS idx_record_audits_child   ON cs_record_audits(child_id);
CREATE INDEX IF NOT EXISTS idx_record_audits_quality ON cs_record_audits(data_quality_rating);

ALTER TABLE cs_record_audits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own record audits"
    ON cs_record_audits FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_access_requests ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_access_requests (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  request_date                date NOT NULL,
  requester_name              text NOT NULL,
  requester_relationship      text NOT NULL,
  child_id                    text NOT NULL,
  child_name                  text NOT NULL,
  request_type                text NOT NULL,
  status                      text NOT NULL DEFAULT 'received',
  records_requested           text NOT NULL,
  date_acknowledged           date,
  date_due                    date,
  date_completed              date,
  redaction_required          boolean NOT NULL DEFAULT false,
  redaction_notes             text,
  outcome                     text,
  handled_by                  text NOT NULL,
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_requests_home    ON cs_access_requests(home_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_child   ON cs_access_requests(child_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status  ON cs_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_type    ON cs_access_requests(request_type);

ALTER TABLE cs_access_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own access requests"
    ON cs_access_requests FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
