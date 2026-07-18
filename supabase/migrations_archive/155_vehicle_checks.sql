-- ═══════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — VEHICLE MANAGEMENT
-- CHR 2015 Reg 25 (premises — safety), Reg 36 (fitness of premises),
-- Reg 12 (protection — safeguarding during transport).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_vehicle_checks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,

  check_type              text NOT NULL DEFAULT 'daily_pre_use',
  check_date              date NOT NULL DEFAULT CURRENT_DATE,
  check_outcome           text NOT NULL DEFAULT 'pass',
  vehicle_condition       text NOT NULL DEFAULT 'good',
  driver_authorisation    text NOT NULL DEFAULT 'fully_authorised',

  vehicle_registration    text NOT NULL DEFAULT '',
  vehicle_make_model      text NOT NULL DEFAULT '',
  mileage_reading         integer NOT NULL DEFAULT 0,
  mot_expiry_date         date,
  insurance_expiry_date   date,

  tyres_adequate          boolean NOT NULL DEFAULT true,
  brakes_working          boolean NOT NULL DEFAULT true,
  lights_working          boolean NOT NULL DEFAULT true,
  mirrors_clean           boolean NOT NULL DEFAULT true,
  seatbelts_functional    boolean NOT NULL DEFAULT true,
  child_locks_working     boolean NOT NULL DEFAULT true,
  first_aid_kit_present   boolean NOT NULL DEFAULT true,
  fire_extinguisher_present boolean NOT NULL DEFAULT true,
  breakdown_cover_valid   boolean NOT NULL DEFAULT true,
  incident_during_journey boolean NOT NULL DEFAULT false,

  children_transported    integer NOT NULL DEFAULT 0,
  staff_driver            text NOT NULL DEFAULT '',

  defects_found           text[] NOT NULL DEFAULT '{}',
  actions_taken           text[] NOT NULL DEFAULT '{}',
  issues_found            text[] NOT NULL DEFAULT '{}',

  next_service_date       date,
  notes                   text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_vehicle_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vc_home_isolation ON cs_vehicle_checks;
CREATE POLICY vc_home_isolation ON cs_vehicle_checks
  USING  (home_id = get_my_home_id())
  WITH CHECK (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_vc_home_date ON cs_vehicle_checks(home_id, check_date DESC);

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Migration 155 (vehicle_checks) idempotent skip: %', SQLERRM;
END $$;
