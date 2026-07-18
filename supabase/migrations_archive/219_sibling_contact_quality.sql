-- 219: Sibling Contact Quality
-- CHR 2015 Reg 22 (contact with family — sibling relationships), Reg 7 (children's wishes — sibling bonds)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_sibling_contact_quality (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  contact_type text NOT NULL DEFAULT 'face_to_face',
  contact_quality text NOT NULL DEFAULT 'good',
  sibling_relationship text NOT NULL DEFAULT 'close',
  barrier_type text NOT NULL DEFAULT 'none',
  contact_date date NOT NULL DEFAULT now(),
  child_name   text NOT NULL DEFAULT '',
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  sibling_name text NOT NULL DEFAULT '',
  facilitated_by text NOT NULL DEFAULT '',
  child_views_sought boolean NOT NULL DEFAULT true,
  sibling_views_sought boolean NOT NULL DEFAULT true,
  preparation_completed boolean NOT NULL DEFAULT true,
  debrief_completed boolean NOT NULL DEFAULT true,
  emotional_support_given boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  frequency_appropriate boolean NOT NULL DEFAULT true,
  venue_suitable boolean NOT NULL DEFAULT true,
  safeguarding_considered boolean NOT NULL DEFAULT true,
  life_story_linked boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_sibling_contact_quality ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sibling_contact_quality_home" ON cs_sibling_contact_quality;
CREATE POLICY "sibling_contact_quality_home" ON cs_sibling_contact_quality
  FOR ALL USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 219 idempotent: %', SQLERRM;
END $$;
