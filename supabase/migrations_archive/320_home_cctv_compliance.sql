-- Migration: 320_home_cctv_compliance
-- Domain: Home CCTV Compliance
-- Tracks ICO guidance, DPIA, signage, retention policies, subject access requests

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_home_cctv_compliance (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  review_date       date        NOT NULL,
  reviewer_name     text        NOT NULL,

  camera_location   text        NOT NULL,
  camera_purpose    text        NOT NULL CHECK (camera_purpose IN ('Security','Safeguarding','Health & Safety','Monitoring','Entrance','Car Park','Other')),

  dpia_completed        boolean NOT NULL DEFAULT false,
  signage_in_place      boolean NOT NULL DEFAULT true,
  retention_period_days integer NOT NULL DEFAULT 30,
  retention_compliant   boolean NOT NULL DEFAULT true,
  data_protection_registered boolean NOT NULL DEFAULT true,

  footage_accessible    boolean NOT NULL DEFAULT true,
  footage_encrypted     boolean NOT NULL DEFAULT false,
  access_log_maintained boolean NOT NULL DEFAULT true,

  sar_received          boolean NOT NULL DEFAULT false,
  sar_responded_in_time boolean NULL,

  children_informed     boolean NOT NULL DEFAULT true,
  staff_informed        boolean NOT NULL DEFAULT true,
  privacy_zones_set     boolean NOT NULL DEFAULT true,

  compliance_status    text    NOT NULL CHECK (compliance_status IN ('Compliant','Non-Compliant','Action Required','Under Review')),
  notes                text    NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_home_cctv_compliance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_home_cctv_compliance;
CREATE POLICY "Tenant isolation" ON cs_home_cctv_compliance
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_home_cctv_compliance_home
  ON cs_home_cctv_compliance(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_home_cctv_compliance_date
  ON cs_home_cctv_compliance(review_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
