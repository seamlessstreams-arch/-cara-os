-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — FOOD & NUTRITION
-- CHR 2015 Reg 9 (promoting good health — nutritional needs),
-- Reg 6 (quality of care — nourishing food), Reg 7 (children's views on menus),
-- Reg 10 (dignity — dietary/cultural preferences).
-- Tables: cs_dietary_profiles, cs_meal_records, cs_hygiene_checks
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_dietary_profiles ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_dietary_profiles (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id                  text NOT NULL,
  child_name                text NOT NULL,
  dietary_requirements      jsonb NOT NULL DEFAULT '["none"]',
  allergies                 jsonb NOT NULL DEFAULT '[]',
  intolerances              jsonb NOT NULL DEFAULT '[]',
  cultural_dietary_needs    text,
  religious_dietary_needs   text,
  food_preferences          jsonb NOT NULL DEFAULT '[]',
  food_dislikes             jsonb NOT NULL DEFAULT '[]',
  nutritional_concerns      text,
  eating_support_needed     text,
  medical_dietary_plan      boolean NOT NULL DEFAULT false,
  medical_plan_details      text,
  last_reviewed_date        date,
  reviewed_by               text,
  next_review_date          date,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dietary_profiles_home    ON cs_dietary_profiles(home_id);
CREATE INDEX IF NOT EXISTS idx_dietary_profiles_child   ON cs_dietary_profiles(child_id);

ALTER TABLE cs_dietary_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own dietary profiles"
    ON cs_dietary_profiles FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_meal_records ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_meal_records (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  meal_date                   date NOT NULL,
  meal_type                   text NOT NULL,
  menu_description            text NOT NULL,
  prepared_by                 text NOT NULL,
  children_present            jsonb NOT NULL DEFAULT '[]',
  satisfaction_ratings        jsonb NOT NULL DEFAULT '[]',
  alternative_meals_provided  boolean NOT NULL DEFAULT false,
  alternative_details         text,
  food_waste_level            text,
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_records_home      ON cs_meal_records(home_id);
CREATE INDEX IF NOT EXISTS idx_meal_records_date      ON cs_meal_records(meal_date);
CREATE INDEX IF NOT EXISTS idx_meal_records_type      ON cs_meal_records(meal_type);

ALTER TABLE cs_meal_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own meal records"
    ON cs_meal_records FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_hygiene_checks ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_hygiene_checks (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  check_date                date NOT NULL,
  checked_by                text NOT NULL,
  fridge_temp_ok            boolean NOT NULL DEFAULT true,
  freezer_temp_ok           boolean NOT NULL DEFAULT true,
  food_storage_ok           boolean NOT NULL DEFAULT true,
  kitchen_cleanliness       text NOT NULL DEFAULT 'pass',
  food_prep_areas           text NOT NULL DEFAULT 'pass',
  hand_washing_facilities   text NOT NULL DEFAULT 'pass',
  overall_result            text NOT NULL DEFAULT 'pass',
  issues_found              text,
  corrective_action         text,
  follow_up_date            date,
  follow_up_completed       boolean NOT NULL DEFAULT false,
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hygiene_checks_home    ON cs_hygiene_checks(home_id);
CREATE INDEX IF NOT EXISTS idx_hygiene_checks_date    ON cs_hygiene_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_hygiene_checks_result  ON cs_hygiene_checks(overall_result);

ALTER TABLE cs_hygiene_checks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own hygiene checks"
    ON cs_hygiene_checks FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
