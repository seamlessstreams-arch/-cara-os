-- ══════════════════════════════════════════════════════════════════
-- CORNERSTONE — Safeguarding Referrals
-- CHR 2015 Reg 12, 13, 34
-- ══════════════════════════════════════════════════════════════════

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_safeguarding_referrals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  referral_type text NOT NULL DEFAULT 'other',
  referral_outcome text NOT NULL DEFAULT 'pending',
  referral_urgency text NOT NULL DEFAULT 'routine',
  concern_category text NOT NULL DEFAULT 'other',
  referral_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name    text NOT NULL,
  child_id      text,
  referred_to_agency text NOT NULL,
  referral_reference text,
  referral_timely boolean NOT NULL DEFAULT true,
  consent_obtained boolean NOT NULL DEFAULT false,
  consent_not_required_reason text,
  information_shared_appropriately boolean NOT NULL DEFAULT true,
  manager_informed boolean NOT NULL DEFAULT true,
  ofsted_notified boolean NOT NULL DEFAULT false,
  lado_consulted boolean NOT NULL DEFAULT false,
  strategy_meeting_held boolean NOT NULL DEFAULT false,
  child_informed boolean NOT NULL DEFAULT false,
  parents_informed boolean NOT NULL DEFAULT false,
  outcome_communicated boolean NOT NULL DEFAULT false,
  follow_up_required boolean NOT NULL DEFAULT false,
  issues_found  jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  referred_by   text NOT NULL,
  response_date date,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_safeguarding_referrals_home
  ON cs_safeguarding_referrals(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_safeguarding_referrals_date
  ON cs_safeguarding_referrals(referral_date);

ALTER TABLE cs_safeguarding_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_safeguarding_referrals_tenant ON cs_safeguarding_referrals;
CREATE POLICY cs_safeguarding_referrals_tenant ON cs_safeguarding_referrals
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Migration 168 (safeguarding_referrals): %', SQLERRM;
END $$;
