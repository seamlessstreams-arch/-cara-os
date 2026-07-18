-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — PARENTAL RESPONSIBILITY
-- CHR 2015 Reg 14 (care planning — PR arrangements),
-- Reg 21 (privacy and access — parental involvement),
-- Children Act 1989 s33 (effect of care order on PR).
-- Tables: cs_parental_responsibility
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_parental_responsibility (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                      text NOT NULL,
  child_id                        uuid NOT NULL,
  care_order_type                 text NOT NULL,
  care_order_date                 date NOT NULL,
  care_order_expiry               date,
  pr_holder                       text NOT NULL,
  pr_holder_name                  text NOT NULL,
  pr_status                       text NOT NULL DEFAULT 'active',
  consent_arrangement             text NOT NULL DEFAULT 'la_consent_required',
  contact_with_pr_holder          boolean NOT NULL DEFAULT false,
  pr_holder_involved_in_decisions boolean NOT NULL DEFAULT false,
  pr_holder_informed_of_placement boolean NOT NULL DEFAULT false,
  conflict_between_pr_holders     boolean NOT NULL DEFAULT false,
  conflict_details                text,
  legal_representation            boolean NOT NULL DEFAULT false,
  social_worker_name              text NOT NULL,
  review_date                     date,
  notes                           text,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pr_home       ON cs_parental_responsibility(home_id);
CREATE INDEX IF NOT EXISTS idx_pr_child      ON cs_parental_responsibility(child_id);
CREATE INDEX IF NOT EXISTS idx_pr_order_type ON cs_parental_responsibility(care_order_type);
CREATE INDEX IF NOT EXISTS idx_pr_status     ON cs_parental_responsibility(pr_status);
CREATE INDEX IF NOT EXISTS idx_pr_holder     ON cs_parental_responsibility(pr_holder);

ALTER TABLE cs_parental_responsibility ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own parental responsibility"
    ON cs_parental_responsibility FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
