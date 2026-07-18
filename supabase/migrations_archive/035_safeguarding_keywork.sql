-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — SAFEGUARDING REFERRALS & KEY WORK SESSIONS
-- Migration 035: Safeguarding referral tracking (Reg 34/35/40) and
-- structured key working sessions with therapeutic framework support.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Safeguarding referrals ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_safeguarding_referrals (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                   uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                  uuid NOT NULL,
  referral_type             text NOT NULL
                              CHECK (referral_type IN (
                                'mash','lado','police','child_protection','strategy_meeting',
                                'section_47','icpc','rcpc','professional_consultation',
                                'prevent','fgm','forced_marriage'
                              )),
  urgency                   text NOT NULL DEFAULT 'within_24h'
                              CHECK (urgency IN ('immediate','within_24h','within_72h','routine')),
  title                     text NOT NULL,
  description               text,
  referred_to               text NOT NULL,
  referred_by               uuid NOT NULL,
  referral_date             timestamptz NOT NULL DEFAULT now(),
  acknowledged_date         timestamptz,
  outcome                   text,
  outcome_date              timestamptz,
  status                    text NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','submitted','acknowledged','investigating','outcome_received','closed','escalated')),
  follow_up_actions         jsonb NOT NULL DEFAULT '[]'::jsonb,
  multi_agency_involved     jsonb NOT NULL DEFAULT '[]'::jsonb,
  ofsted_notified           boolean NOT NULL DEFAULT false,
  ofsted_notification_date  timestamptz,
  reg40_notification_sent   boolean NOT NULL DEFAULT false,
  linked_incident_id        uuid,
  linked_risk_assessment_id uuid,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_safeguarding_home    ON cs_safeguarding_referrals(home_id);
CREATE INDEX IF NOT EXISTS idx_safeguarding_child   ON cs_safeguarding_referrals(child_id);
CREATE INDEX IF NOT EXISTS idx_safeguarding_type    ON cs_safeguarding_referrals(referral_type);
CREATE INDEX IF NOT EXISTS idx_safeguarding_status  ON cs_safeguarding_referrals(status);
CREATE INDEX IF NOT EXISTS idx_safeguarding_urgency ON cs_safeguarding_referrals(urgency);

-- ── Key work sessions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_key_work_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id              uuid NOT NULL,
  key_worker_id         uuid NOT NULL,
  session_type          text NOT NULL DEFAULT 'one_to_one'
                          CHECK (session_type IN (
                            'one_to_one','group','informal','therapeutic',
                            'life_skills','care_plan_review'
                          )),
  therapeutic_framework text NOT NULL DEFAULT 'none'
                          CHECK (therapeutic_framework IN (
                            'pace','arc','dbt_skills','cbt','motivational_interviewing',
                            'solution_focused','trauma_narrative','relational','none'
                          )),
  status                text NOT NULL DEFAULT 'planned'
                          CHECK (status IN ('planned','completed','cancelled','rescheduled','child_declined')),
  planned_date          date NOT NULL,
  completed_date        date,
  duration_minutes      integer,
  location              text,
  topics_covered        jsonb NOT NULL DEFAULT '[]'::jsonb,
  child_voice           text,
  child_mood            smallint CHECK (child_mood BETWEEN 1 AND 5),
  child_engagement      smallint CHECK (child_engagement BETWEEN 1 AND 5),
  outcomes              jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions               jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_session_topics   jsonb NOT NULL DEFAULT '[]'::jsonb,
  safeguarding_concerns text,
  positive_observations jsonb NOT NULL DEFAULT '[]'::jsonb,
  attachments_count     integer NOT NULL DEFAULT 0,
  signed_off_by         uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_keywork_home     ON cs_key_work_sessions(home_id);
CREATE INDEX IF NOT EXISTS idx_keywork_child    ON cs_key_work_sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_keywork_worker   ON cs_key_work_sessions(key_worker_id);
CREATE INDEX IF NOT EXISTS idx_keywork_status   ON cs_key_work_sessions(status);
CREATE INDEX IF NOT EXISTS idx_keywork_planned  ON cs_key_work_sessions(planned_date);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE cs_safeguarding_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_key_work_sessions      ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY safeguarding_home_policy ON cs_safeguarding_referrals
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY keywork_home_policy ON cs_key_work_sessions
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
