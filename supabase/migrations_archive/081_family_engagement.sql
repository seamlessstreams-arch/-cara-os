-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — FAMILY ENGAGEMENT
-- CHR 2015 Reg 7 (children's wishes — contact with family),
-- Reg 14 (care planning — contact arrangements),
-- Reg 6 (quality of care — family relationships).
-- Tables: cs_family_contacts, cs_family_relationships
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_family_contacts ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_family_contacts (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id               uuid NOT NULL,
  child_name             text NOT NULL,
  family_member_name     text NOT NULL,
  family_member_type     text NOT NULL,
  contact_type           text NOT NULL,
  contact_date           date NOT NULL,
  duration_minutes       integer NOT NULL DEFAULT 0,
  outcome                text NOT NULL,
  child_mood_before      text,
  child_mood_after       text,
  supervised             boolean NOT NULL DEFAULT false,
  supervisor_name        text,
  notes                  text,
  follow_up_actions      jsonb NOT NULL DEFAULT '[]',
  recorded_by            text NOT NULL,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_contacts_home     ON cs_family_contacts(home_id);
CREATE INDEX IF NOT EXISTS idx_family_contacts_child    ON cs_family_contacts(child_id);
CREATE INDEX IF NOT EXISTS idx_family_contacts_date     ON cs_family_contacts(contact_date);
CREATE INDEX IF NOT EXISTS idx_family_contacts_outcome  ON cs_family_contacts(outcome);
CREATE INDEX IF NOT EXISTS idx_family_contacts_type     ON cs_family_contacts(family_member_type);

ALTER TABLE cs_family_contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own family contacts"
    ON cs_family_contacts FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_family_relationships ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_family_relationships (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id                  uuid NOT NULL,
  child_name                text NOT NULL,
  family_member_name        text NOT NULL,
  family_member_type        text NOT NULL,
  relationship_quality      text NOT NULL,
  engagement_trend          text NOT NULL DEFAULT 'new',
  contact_frequency_agreed  text NOT NULL,
  contact_frequency_actual  text NOT NULL,
  last_contact_date         date,
  court_order_restrictions  boolean NOT NULL DEFAULT false,
  risk_assessment_in_place  boolean NOT NULL DEFAULT false,
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_relationships_home     ON cs_family_relationships(home_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_child    ON cs_family_relationships(child_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_quality  ON cs_family_relationships(relationship_quality);

ALTER TABLE cs_family_relationships ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own family relationships"
    ON cs_family_relationships FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
