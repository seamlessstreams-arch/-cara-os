-- ══════════════════════════════════════════════════════════════════
-- CORNERSTONE — Medication Storage
-- CHR 2015 Reg 23, 25, 36
-- ══════════════════════════════════════════════════════════════════

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_medication_storage (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  storage_type  text NOT NULL DEFAULT 'general_medication_cabinet',
  check_type    text NOT NULL DEFAULT 'daily_check',
  storage_condition text NOT NULL DEFAULT 'satisfactory',
  temperature_status text NOT NULL DEFAULT 'not_recorded',
  check_date    date NOT NULL DEFAULT CURRENT_DATE,
  storage_location text NOT NULL,
  temperature_reading numeric,
  min_temperature numeric,
  max_temperature numeric,
  cabinet_locked boolean NOT NULL DEFAULT true,
  keys_secure   boolean NOT NULL DEFAULT true,
  controlled_drugs_counted boolean NOT NULL DEFAULT false,
  all_drugs_accounted boolean NOT NULL DEFAULT true,
  expired_items_found boolean NOT NULL DEFAULT false,
  items_in_date boolean NOT NULL DEFAULT true,
  storage_clean boolean NOT NULL DEFAULT true,
  labels_legible boolean NOT NULL DEFAULT true,
  correct_storage_conditions boolean NOT NULL DEFAULT true,
  ventilation_adequate boolean NOT NULL DEFAULT true,
  access_restricted boolean NOT NULL DEFAULT true,
  disposal_needed boolean NOT NULL DEFAULT false,
  items_checked integer NOT NULL DEFAULT 0,
  discrepancies_found integer NOT NULL DEFAULT 0,
  issues_found  jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  checked_by    text NOT NULL,
  witnessed_by  text,
  next_check_date date,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_medication_storage_home
  ON cs_medication_storage(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_medication_storage_date
  ON cs_medication_storage(check_date);

ALTER TABLE cs_medication_storage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_medication_storage_tenant ON cs_medication_storage;
CREATE POLICY cs_medication_storage_tenant ON cs_medication_storage
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Migration 169 (medication_storage): %', SQLERRM;
END $$;
