DO $$ BEGIN
CREATE TABLE IF NOT EXISTS cs_meal_planning (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name text NOT NULL,
  record_date date NOT NULL,
  recorded_by text NOT NULL,
  record_type text NOT NULL,
  dietary_requirement text NULL,
  child_choice_offered boolean NOT NULL DEFAULT false,
  child_participated_cooking boolean NOT NULL DEFAULT false,
  age_appropriate_involvement boolean,
  nutritional_balance text NOT NULL DEFAULT 'Not Assessed',
  cultural_needs_met boolean NOT NULL DEFAULT false,
  allergy_information_current boolean,
  portion_appropriate boolean,
  mealtimes_social boolean,
  snacks_available boolean,
  hydration_monitored boolean NULL,
  eating_concern_identified boolean,
  concern_details text NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE cs_meal_planning ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON cs_meal_planning USING (home_id = get_my_home_id());
CREATE INDEX IF NOT EXISTS idx_cs_meal_planning_home ON cs_meal_planning(home_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
