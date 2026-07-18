-- 258: Menu Planning & Dietary Requirements
-- Meal planning, allergen tracking, dietary preferences, cultural dietary needs, nutritional monitoring
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_menu_planning_dietary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  child_name text NOT NULL,
  child_id uuid,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast','morning_snack','lunch','afternoon_snack','dinner','supper','special_occasion','packed_lunch','takeaway','other')),
  dietary_category text NOT NULL CHECK (dietary_category IN ('standard','vegetarian','vegan','halal','kosher','gluten_free','dairy_free','nut_free','medical_diet','other')),
  nutritional_rating text NOT NULL CHECK (nutritional_rating IN ('excellent','good','adequate','poor','inadequate')),
  child_satisfaction text NOT NULL CHECK (child_satisfaction IN ('loved_it','enjoyed_it','okay','didnt_like','refused')),
  session_date date NOT NULL,
  recorded_by text NOT NULL,
  meal_description text NOT NULL,
  ingredients_listed text NOT NULL,
  allergens_present text,
  allergens_avoided text,
  cultural_considerations text,
  child_involvement text,
  portion_size_notes text,
  hydration_notes text,
  child_feedback text,
  staff_observations text,
  approved_by text,
  approved_at timestamptz,
  allergens_checked boolean NOT NULL DEFAULT false,
  dietary_needs_met boolean NOT NULL DEFAULT false,
  cultural_needs_met boolean NOT NULL DEFAULT false,
  child_chose_meal boolean NOT NULL DEFAULT false,
  child_helped_prepare boolean NOT NULL DEFAULT false,
  nutritionally_balanced boolean NOT NULL DEFAULT false,
  portion_appropriate boolean NOT NULL DEFAULT false,
  hydration_monitored boolean NOT NULL DEFAULT false,
  mealtime_positive boolean NOT NULL DEFAULT false,
  leftovers_noted boolean NOT NULL DEFAULT false,
  medical_diet_followed boolean NOT NULL DEFAULT false,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_menu_planning_home ON cs_menu_planning_dietary(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_menu_planning_child ON cs_menu_planning_dietary(child_name);
CREATE INDEX IF NOT EXISTS idx_cs_menu_planning_date ON cs_menu_planning_dietary(session_date);

ALTER TABLE cs_menu_planning_dietary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "menu_planning_home" ON cs_menu_planning_dietary;
CREATE POLICY "menu_planning_home" ON cs_menu_planning_dietary
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 258 (menu planning dietary): %', SQLERRM;
END $$;
