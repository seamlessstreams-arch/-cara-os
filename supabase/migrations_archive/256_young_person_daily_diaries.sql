-- 256: Young Person Daily Diaries
-- Structured diary entries from young people — their voice, feelings, experiences, reflections
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_young_person_daily_diaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  child_name text NOT NULL,
  child_id uuid,
  mood_rating text NOT NULL CHECK (mood_rating IN ('very_happy','happy','okay','sad','very_sad','angry','anxious','mixed','numb','other')),
  day_rating text NOT NULL CHECK (day_rating IN ('amazing','good','okay','difficult','terrible')),
  entry_type text NOT NULL DEFAULT 'daily_reflection' CHECK (entry_type IN ('daily_reflection','morning_check_in','evening_check_in','weekly_reflection','special_event','concern_raised','achievement','wish_feeling','complaint','other')),
  privacy_level text NOT NULL DEFAULT 'share_with_keyworker' CHECK (privacy_level IN ('private_to_me','share_with_keyworker','share_with_staff','share_with_social_worker','share_with_everyone')),
  session_date date NOT NULL,
  recorded_by text NOT NULL,
  diary_entry text NOT NULL,
  best_part_of_day text NOT NULL,
  worst_part_of_day text,
  what_i_wish text,
  what_helped_me text,
  what_i_need text,
  who_i_spoke_to text,
  staff_response text,
  keyworker_notes text,
  approved_by text,
  approved_at timestamptz,
  child_wrote_themselves boolean NOT NULL DEFAULT false,
  child_chose_to_share boolean NOT NULL DEFAULT false,
  staff_supported_writing boolean NOT NULL DEFAULT false,
  feelings_explored boolean NOT NULL DEFAULT false,
  wishes_recorded boolean NOT NULL DEFAULT false,
  concerns_addressed boolean NOT NULL DEFAULT false,
  keyworker_read boolean NOT NULL DEFAULT false,
  responded_to boolean NOT NULL DEFAULT false,
  linked_to_care_plan boolean NOT NULL DEFAULT false,
  safeguarding_checked boolean NOT NULL DEFAULT false,
  privacy_respected boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_yp_daily_diaries_home ON cs_young_person_daily_diaries(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_yp_daily_diaries_child ON cs_young_person_daily_diaries(child_name);
CREATE INDEX IF NOT EXISTS idx_cs_yp_daily_diaries_date ON cs_young_person_daily_diaries(session_date);

ALTER TABLE cs_young_person_daily_diaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "yp_daily_diaries_home" ON cs_young_person_daily_diaries;
CREATE POLICY "yp_daily_diaries_home" ON cs_young_person_daily_diaries
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 256 (young person daily diaries): %', SQLERRM;
END $$;
