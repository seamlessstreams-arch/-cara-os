-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — CHILDREN'S WISHES & FEELINGS
-- CHR 2015 Reg 7 (children's views, wishes, and feelings),
-- Reg 14 (care planning — incorporating child's wishes),
-- Children Act 1989 s1(3)(a) (welfare checklist).
-- Tables: cs_wishes_feelings
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_wishes_feelings (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                      text NOT NULL,
  child_id                        uuid NOT NULL,
  recorded_date                   date NOT NULL,
  wishes_category                 text NOT NULL,
  feeling_rating                  text NOT NULL DEFAULT 'not_expressed',
  capture_method                  text NOT NULL,
  what_child_said                 text NOT NULL,
  what_child_wants                text,
  response_outcome                text NOT NULL DEFAULT 'awaiting_response',
  response_details                text,
  responded_by                    text,
  response_date                   date,
  child_informed_of_outcome       boolean NOT NULL DEFAULT false,
  child_satisfied_with_response   boolean,
  influenced_care_plan            boolean NOT NULL DEFAULT false,
  recorded_by                     text NOT NULL,
  notes                           text,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wishes_home       ON cs_wishes_feelings(home_id);
CREATE INDEX IF NOT EXISTS idx_wishes_child      ON cs_wishes_feelings(child_id);
CREATE INDEX IF NOT EXISTS idx_wishes_category   ON cs_wishes_feelings(wishes_category);
CREATE INDEX IF NOT EXISTS idx_wishes_feeling    ON cs_wishes_feelings(feeling_rating);
CREATE INDEX IF NOT EXISTS idx_wishes_outcome    ON cs_wishes_feelings(response_outcome);
CREATE INDEX IF NOT EXISTS idx_wishes_date       ON cs_wishes_feelings(recorded_date);

ALTER TABLE cs_wishes_feelings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own wishes feelings"
    ON cs_wishes_feelings FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
