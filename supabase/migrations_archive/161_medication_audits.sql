-- Migration: 161_medication_audits
-- Medication audit tracking for controlled drug counts, storage audits, fridge checks

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_medication_audits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  audit_type    text NOT NULL DEFAULT 'storage_audit',
  audit_date    date NOT NULL DEFAULT CURRENT_DATE,
  audit_outcome text NOT NULL DEFAULT 'satisfactory',
  storage_condition text NOT NULL DEFAULT 'appropriate',
  discrepancy_level text NOT NULL DEFAULT 'none',

  controlled_drugs_checked   boolean NOT NULL DEFAULT false,
  all_drugs_accounted        boolean NOT NULL DEFAULT true,
  fridge_temperature_in_range boolean NOT NULL DEFAULT true,
  cabinet_locked             boolean NOT NULL DEFAULT true,
  keys_secure                boolean NOT NULL DEFAULT true,
  mar_charts_accurate        boolean NOT NULL DEFAULT true,
  expiry_dates_checked       boolean NOT NULL DEFAULT false,
  expired_items_found        boolean NOT NULL DEFAULT false,
  disposal_witnessed         boolean NOT NULL DEFAULT false,
  pharmacy_contacted         boolean NOT NULL DEFAULT false,
  gp_informed                boolean NOT NULL DEFAULT false,
  stock_count_accurate       boolean NOT NULL DEFAULT true,

  items_checked       int NOT NULL DEFAULT 0,
  discrepancies_found int NOT NULL DEFAULT 0,
  fridge_temperature  numeric(4,1),

  audited_by     text NOT NULL DEFAULT '',
  witnessed_by   text,
  issues_found   jsonb NOT NULL DEFAULT '[]',
  actions_taken  jsonb NOT NULL DEFAULT '[]',
  next_audit_date date,
  notes          text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_medication_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_medication_audits_home" ON cs_medication_audits;
CREATE POLICY "cs_medication_audits_home" ON cs_medication_audits
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_medication_audits_home
  ON cs_medication_audits(home_id);

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 161 idempotent: %', SQLERRM;
END $$;
