DO $$ BEGIN
CREATE TABLE IF NOT EXISTS cs_room_personalisation (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name text NOT NULL,
  record_date date NOT NULL,
  recorded_by text NOT NULL,
  record_type text NOT NULL,
  item_description text NOT NULL,
  child_chose boolean NOT NULL DEFAULT false,
  budget numeric NULL,
  amount_spent numeric NULL,
  within_budget boolean NULL,
  age_appropriate boolean NOT NULL DEFAULT true,
  safety_checked boolean NOT NULL DEFAULT false,
  health_safety_compliant boolean NOT NULL DEFAULT true,
  cultural_needs_considered boolean NOT NULL DEFAULT false,
  sensory_needs_considered boolean NOT NULL DEFAULT false,
  child_satisfied boolean NOT NULL DEFAULT false,
  photos_taken boolean NOT NULL DEFAULT false,
  privacy_maintained boolean NOT NULL DEFAULT true,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE cs_room_personalisation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON cs_room_personalisation USING (home_id = get_my_home_id());
CREATE INDEX IF NOT EXISTS idx_cs_room_personalisation_home ON cs_room_personalisation(home_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
