-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — MATCHING & REFERRALS
-- CHR 2015 Reg 8 (placement plans — matching considerations),
-- Reg 9 (quality of care — matching),
-- Reg 14 (healthcare — matching health needs).
-- Tables: cs_referrals
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_referrals (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                    text NOT NULL,
  child_age                     integer NOT NULL,
  placing_authority             text NOT NULL,
  social_worker_name            text NOT NULL,
  referral_date                 date NOT NULL,
  status                        text NOT NULL DEFAULT 'received',
  decline_reason                text,
  matching_criteria_met         jsonb NOT NULL DEFAULT '[]',
  matching_criteria_concerns    jsonb NOT NULL DEFAULT '[]',
  impact_on_existing            text NOT NULL DEFAULT 'not_assessed',
  impact_assessment_completed   boolean NOT NULL DEFAULT false,
  existing_children_consulted   boolean NOT NULL DEFAULT false,
  staff_views_sought            boolean NOT NULL DEFAULT false,
  trial_visit_completed         boolean NOT NULL DEFAULT false,
  decision_date                 date,
  decision_by                   text,
  admission_date                date,
  notes                         text,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_home      ON cs_referrals(home_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status    ON cs_referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_date      ON cs_referrals(referral_date);
CREATE INDEX IF NOT EXISTS idx_referrals_authority ON cs_referrals(placing_authority);

ALTER TABLE cs_referrals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own referrals"
    ON cs_referrals FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
