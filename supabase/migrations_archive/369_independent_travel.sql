DO $$ BEGIN
CREATE TABLE IF NOT EXISTS cs_independent_travel (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  young_person_name text NOT NULL,
  session_date date NOT NULL,
  supporting_staff text NOT NULL,
  skill_area text NOT NULL,
  delivery_method text NOT NULL,
  route_description text NULL,
  competency_level text NOT NULL DEFAULT 'Not Ready',
  risk_assessment_completed boolean NOT NULL DEFAULT false,
  young_person_engaged boolean NOT NULL DEFAULT false,
  gps_tracking_agreed boolean NULL,
  emergency_plan_in_place boolean NOT NULL DEFAULT false,
  phone_charged_checked boolean NOT NULL DEFAULT false,
  money_available boolean NOT NULL DEFAULT false,
  id_carried boolean NULL,
  confidence_level text NOT NULL DEFAULT 'Medium',
  incident_occurred boolean NOT NULL DEFAULT false,
  incident_details text NULL,
  next_session_date date NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE cs_independent_travel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON cs_independent_travel USING (home_id = get_my_home_id());
CREATE INDEX IF NOT EXISTS idx_cs_independent_travel_home ON cs_independent_travel(home_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
