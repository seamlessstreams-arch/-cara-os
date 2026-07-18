-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — DELEGATED AUTHORITY
-- CHR 2015 Reg 21 (privacy and access — respecting autonomy),
-- Reg 14 (care planning — delegated authority agreements),
-- Children Act 1989 s33(3)(b) (parental responsibility delegation).
-- Tables: cs_delegated_authority
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_delegated_authority (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  child_id                    uuid NOT NULL,
  decision_area               text NOT NULL,
  authority_level             text NOT NULL DEFAULT 'not_delegated',
  agreement_status            text NOT NULL DEFAULT 'pending',
  agreed_by                   text,
  agreed_date                 date,
  review_date                 date,
  specific_conditions         text,
  child_views_sought          boolean NOT NULL DEFAULT false,
  child_agrees                boolean,
  social_worker_approved      boolean NOT NULL DEFAULT false,
  documented_in_care_plan     boolean NOT NULL DEFAULT false,
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deleg_auth_home       ON cs_delegated_authority(home_id);
CREATE INDEX IF NOT EXISTS idx_deleg_auth_child      ON cs_delegated_authority(child_id);
CREATE INDEX IF NOT EXISTS idx_deleg_auth_area       ON cs_delegated_authority(decision_area);
CREATE INDEX IF NOT EXISTS idx_deleg_auth_level      ON cs_delegated_authority(authority_level);
CREATE INDEX IF NOT EXISTS idx_deleg_auth_status     ON cs_delegated_authority(agreement_status);

ALTER TABLE cs_delegated_authority ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own delegated authority"
    ON cs_delegated_authority FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
