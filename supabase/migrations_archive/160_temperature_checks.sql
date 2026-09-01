-- ═══════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ROOM TEMPERATURE MONITORING
-- CHR 2015 Reg 25 (premises — adequate heating),
-- Reg 36 (fitness of premises), Reg 15 (quality standards).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_temperature_checks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,

  room_type               text NOT NULL DEFAULT 'lounge',
  temperature_status      text NOT NULL DEFAULT 'comfortable',
  heating_system          text NOT NULL DEFAULT 'central_heating',
  check_time              text NOT NULL DEFAULT 'morning',
  check_date              date NOT NULL DEFAULT CURRENT_DATE,

  temperature_celsius     numeric NOT NULL DEFAULT 20.0,
  target_temperature      numeric NOT NULL DEFAULT 21.0,
  room_name               text NOT NULL DEFAULT '',

  heating_working         boolean,
  thermostat_set_correctly boolean,
  windows_appropriate     boolean,
  draught_free            boolean,
  child_comfortable       boolean,
  child_consulted         boolean,
  bedding_appropriate     boolean,
  clothing_appropriate    boolean,
  cold_weather_protocol_active boolean NOT NULL DEFAULT false,
  hot_weather_protocol_active  boolean NOT NULL DEFAULT false,

  issues_found            text[] NOT NULL DEFAULT '{}',
  actions_taken           text[] NOT NULL DEFAULT '{}',

  checked_by              text NOT NULL DEFAULT '',
  notes                   text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_temperature_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tc_home_isolation ON cs_temperature_checks;
CREATE POLICY tc_home_isolation ON cs_temperature_checks
  USING  (home_id = get_my_home_id())
  WITH CHECK (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_tc_home_date ON cs_temperature_checks(home_id, check_date DESC);

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Migration 160 (temperature_checks) idempotent skip: %', SQLERRM;
END $$;
