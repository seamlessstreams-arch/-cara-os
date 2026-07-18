-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — COMMISSIONING & REFERRALS
-- CHR 2015 Reg 36 (assessment of prospective children),
-- Reg 12 (impact risk assessment — matching),
-- Reg 14 (care planning — placement suitability).
-- Tables: cs_placement_referrals, cs_occupancy_records
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_placement_referrals ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_placement_referrals (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name             text NOT NULL,
  child_age              integer NOT NULL,
  child_gender           text NOT NULL,
  referring_authority    text NOT NULL,
  social_worker_name     text NOT NULL,
  social_worker_email    text,
  referral_date          date NOT NULL,
  urgency                text NOT NULL DEFAULT 'standard',
  status                 text NOT NULL DEFAULT 'received',
  presenting_needs       jsonb NOT NULL DEFAULT '[]',
  risk_factors           jsonb NOT NULL DEFAULT '[]',
  decline_reason         text,
  decline_notes          text,
  decision_date          date,
  decision_by            text,
  matching_score         numeric(5,2),
  placement_start_date   date,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_placement_referrals_home      ON cs_placement_referrals(home_id);
CREATE INDEX IF NOT EXISTS idx_placement_referrals_status    ON cs_placement_referrals(status);
CREATE INDEX IF NOT EXISTS idx_placement_referrals_urgency   ON cs_placement_referrals(urgency);
CREATE INDEX IF NOT EXISTS idx_placement_referrals_date      ON cs_placement_referrals(referral_date);
CREATE INDEX IF NOT EXISTS idx_placement_referrals_authority ON cs_placement_referrals(referring_authority);

ALTER TABLE cs_placement_referrals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own placement referrals"
    ON cs_placement_referrals FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_occupancy_records ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_occupancy_records (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  record_date            date NOT NULL,
  registered_places      integer NOT NULL,
  children_in_placement  integer NOT NULL,
  occupancy_rate         numeric(5,2) NOT NULL,
  referrals_in_progress  integer NOT NULL DEFAULT 0,
  planned_admissions     integer NOT NULL DEFAULT 0,
  planned_departures     integer NOT NULL DEFAULT 0,
  commentary             text,
  recorded_by            text NOT NULL,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_occupancy_records_home  ON cs_occupancy_records(home_id);
CREATE INDEX IF NOT EXISTS idx_occupancy_records_date  ON cs_occupancy_records(record_date);

ALTER TABLE cs_occupancy_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own occupancy records"
    ON cs_occupancy_records FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
