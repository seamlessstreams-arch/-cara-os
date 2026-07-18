-- ═══════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — UTILITY MANAGEMENT
-- CHR 2015 Reg 25 (premises — adequate heating/utilities),
-- Reg 36 (fitness of premises), Reg 15 (quality standards).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_utility_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,

  utility_type            text NOT NULL DEFAULT 'electricity',
  reading_type            text NOT NULL DEFAULT 'meter_reading',
  reading_date            date NOT NULL DEFAULT CURRENT_DATE,
  cost_status             text NOT NULL DEFAULT 'within_budget',
  energy_rating           text NOT NULL DEFAULT 'not_assessed',

  meter_reading           numeric,
  previous_reading        numeric,
  cost_amount             numeric,
  budget_amount           numeric,

  supplier_name           text NOT NULL DEFAULT '',
  contract_end_date       date,

  smart_meter_installed   boolean NOT NULL DEFAULT false,
  heating_adequate        boolean NOT NULL DEFAULT true,
  hot_water_available     boolean NOT NULL DEFAULT true,
  children_comfortable    boolean NOT NULL DEFAULT true,
  energy_saving_measures  boolean NOT NULL DEFAULT false,
  renewable_energy_used   boolean NOT NULL DEFAULT false,
  carbon_offset           boolean NOT NULL DEFAULT false,

  issues_found            text[] NOT NULL DEFAULT '{}',
  actions_taken           text[] NOT NULL DEFAULT '{}',

  recorded_by             text NOT NULL DEFAULT '',
  notes                   text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_utility_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ur_home_isolation ON cs_utility_records;
CREATE POLICY ur_home_isolation ON cs_utility_records
  USING  (home_id = get_my_home_id())
  WITH CHECK (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_ur_home_date ON cs_utility_records(home_id, reading_date DESC);

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Migration 158 (utility_records) idempotent skip: %', SQLERRM;
END $$;
