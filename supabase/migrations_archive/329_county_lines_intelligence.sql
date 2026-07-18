-- Migration: 329_county_lines_intelligence
-- Domain: County Lines & Criminal Exploitation Intelligence
-- Tracks intelligence records, risk assessments, NRM referrals, safety plans,
-- police liaison, peer mapping, and contextual safeguarding for children
-- at risk of county lines and criminal exploitation.
-- CHR 2015 Reg 12 (protection), Reg 34 (behaviour management),
-- Serious Violence Duty 2022, Home Office County Lines guidance 2023,
-- Modern Slavery Act 2015, NRM reporting requirements.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_county_lines_intelligence (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  child_name                  text        NOT NULL,
  assessment_date             date        NOT NULL,
  assessor_name               text        NOT NULL,

  intelligence_type           text        NOT NULL CHECK (intelligence_type IN ('Risk Assessment','Concern Report','Intelligence Log','NRM Referral','Strategy Meeting','Safety Plan','Police Liaison','Peer Mapping','Contextual Safeguarding','Review')),
  risk_level                  text        NOT NULL CHECK (risk_level IN ('Low','Medium','High','Critical')),

  indicators_present          text        NOT NULL,
  travel_patterns_noted       boolean     NOT NULL DEFAULT false,
  new_possessions_noted       boolean     NOT NULL DEFAULT false,
  phone_activity_concerns     boolean     NOT NULL DEFAULT false,
  missing_episodes_linked     boolean     NOT NULL DEFAULT false,
  peer_association_concerns   boolean     NOT NULL DEFAULT false,
  drug_related_concerns       boolean     NOT NULL DEFAULT false,
  debt_bondage_suspected      boolean     NOT NULL DEFAULT false,
  violence_intimidation_present boolean   NOT NULL DEFAULT false,

  nrm_referral_made           boolean     NOT NULL DEFAULT false,
  nrm_referral_date           date        NULL,
  police_notified             boolean     NOT NULL DEFAULT false,
  social_worker_informed      boolean     NOT NULL DEFAULT false,
  multi_agency_meeting_held   boolean     NOT NULL DEFAULT false,
  safety_plan_in_place        boolean     NOT NULL DEFAULT false,
  disruption_activity         text        NULL,
  child_views_obtained        boolean     NOT NULL DEFAULT false,

  outcome                     text        NOT NULL CHECK (outcome IN ('Ongoing Monitoring','Escalated','De-Escalated','NRM Accepted','NRM Rejected','Exited Exploitation','Relocated','Closed')),
  status                      text        NOT NULL CHECK (status IN ('Active','Under Review','Archived')),
  notes                       text        NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_county_lines_intelligence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_county_lines_intelligence;
CREATE POLICY "Tenant isolation" ON cs_county_lines_intelligence
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_county_lines_intelligence_home
  ON cs_county_lines_intelligence(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_county_lines_intelligence_date
  ON cs_county_lines_intelligence(assessment_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
