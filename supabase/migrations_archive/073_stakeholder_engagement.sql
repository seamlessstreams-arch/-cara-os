-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — STAKEHOLDER ENGAGEMENT
-- CHR 2015 Reg 45 (independent person), Reg 44 (visiting requirements),
-- Reg 36 (notifications), Reg 14 (care planning — multi-agency).
-- Tables: cs_stakeholder_contacts, cs_stakeholder_feedback
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_stakeholder_contacts ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_stakeholder_contacts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  stakeholder_type      text NOT NULL,
  stakeholder_name      text NOT NULL,
  organisation          text NOT NULL,
  child_id              text,
  child_name            text,
  contact_date          date NOT NULL,
  engagement_method     text NOT NULL,
  initiated_by          text NOT NULL DEFAULT 'home',
  purpose               text NOT NULL,
  summary               text NOT NULL,
  outcomes              text,
  actions_agreed        jsonb NOT NULL DEFAULT '[]',
  follow_up_date        date,
  follow_up_completed   boolean NOT NULL DEFAULT false,
  staff_member          text NOT NULL,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stakeholder_contacts_home   ON cs_stakeholder_contacts(home_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_contacts_type   ON cs_stakeholder_contacts(stakeholder_type);
CREATE INDEX IF NOT EXISTS idx_stakeholder_contacts_date   ON cs_stakeholder_contacts(contact_date);
CREATE INDEX IF NOT EXISTS idx_stakeholder_contacts_child  ON cs_stakeholder_contacts(child_id);

ALTER TABLE cs_stakeholder_contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own stakeholder contacts"
    ON cs_stakeholder_contacts FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_stakeholder_feedback ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_stakeholder_feedback (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  stakeholder_type              text NOT NULL,
  stakeholder_name              text NOT NULL,
  organisation                  text NOT NULL,
  feedback_date                 date NOT NULL,
  rating                        text NOT NULL,
  communication_rating          text NOT NULL,
  responsiveness_rating         text NOT NULL,
  information_sharing_rating    text NOT NULL,
  overall_relationship          text NOT NULL,
  strengths                     text,
  areas_for_improvement         text,
  comments                      text,
  collected_by                  text NOT NULL,
  created_at                    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stakeholder_feedback_home   ON cs_stakeholder_feedback(home_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_feedback_type   ON cs_stakeholder_feedback(stakeholder_type);
CREATE INDEX IF NOT EXISTS idx_stakeholder_feedback_date   ON cs_stakeholder_feedback(feedback_date);

ALTER TABLE cs_stakeholder_feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own stakeholder feedback"
    ON cs_stakeholder_feedback FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
