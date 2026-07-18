-- Migration: 164_cleaning_schedule
-- Cleaning schedule and hygiene audit tracking

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_cleaning_schedule (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  cleaning_type     text NOT NULL DEFAULT 'daily_routine',
  cleaning_standard text NOT NULL DEFAULT 'good',
  area_cleaned      text NOT NULL DEFAULT 'kitchen',
  hygiene_risk      text NOT NULL DEFAULT 'none',

  cleaning_date  date NOT NULL DEFAULT CURRENT_DATE,
  area_name      text NOT NULL DEFAULT '',

  cleaning_products_safe  boolean NOT NULL DEFAULT true,
  products_stored_safely  boolean NOT NULL DEFAULT true,
  coshh_compliant         boolean NOT NULL DEFAULT true,
  children_involved       boolean NOT NULL DEFAULT false,
  gloves_worn             boolean NOT NULL DEFAULT true,
  ventilation_adequate    boolean NOT NULL DEFAULT true,
  surfaces_sanitised      boolean NOT NULL DEFAULT true,
  waste_disposed_correctly boolean NOT NULL DEFAULT true,
  sharps_disposed_safely  boolean NOT NULL DEFAULT true,
  hand_washing_available  boolean NOT NULL DEFAULT true,

  issues_found   jsonb NOT NULL DEFAULT '[]',
  actions_taken  jsonb NOT NULL DEFAULT '[]',
  cleaned_by     text NOT NULL DEFAULT '',
  inspected_by   text,
  next_clean_date date,
  notes          text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_cleaning_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_cleaning_schedule_home" ON cs_cleaning_schedule;
CREATE POLICY "cs_cleaning_schedule_home" ON cs_cleaning_schedule
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_cleaning_schedule_home
  ON cs_cleaning_schedule(home_id);

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 164 idempotent: %', SQLERRM;
END $$;
