-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — MISSING FROM CARE & COMPLAINTS/NOTIFICATIONS
-- Migration 038: Missing episodes with return interviews, push/pull factor
-- analysis, complaints register, and Reg 40 Ofsted notifications.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Missing episodes ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_missing_episodes (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                       uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                      uuid NOT NULL,
  episode_type                  text NOT NULL
                                  CHECK (episode_type IN (
                                    'missing','absent','awol','failed_to_return'
                                  )),
  reported_missing_at           timestamptz NOT NULL DEFAULT now(),
  reported_by                   uuid NOT NULL,
  police_notified               boolean NOT NULL DEFAULT false,
  police_notified_at            timestamptz,
  police_reference              text,
  placing_authority_notified    boolean NOT NULL DEFAULT false,
  placing_authority_notified_at timestamptz,
  ofsted_notified               boolean NOT NULL DEFAULT false,
  risk_level                    text NOT NULL DEFAULT 'medium'
                                  CHECK (risk_level IN ('low','medium','high','very_high')),
  trigger_category              text,
  trigger_details               text,
  last_known_location           text,
  found_at                      timestamptz,
  found_location                text,
  found_by                      text,
  duration_minutes              integer,
  return_interview_status       text NOT NULL DEFAULT 'pending'
                                  CHECK (return_interview_status IN (
                                    'not_required','pending','scheduled','completed','refused'
                                  )),
  return_interview_date         timestamptz,
  return_interview_by           text,
  return_interview_notes        text,
  debrief_completed             boolean NOT NULL DEFAULT false,
  actions_taken                 jsonb NOT NULL DEFAULT '[]'::jsonb,
  status                        text NOT NULL DEFAULT 'active'
                                  CHECK (status IN ('active','resolved','closed')),
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_missing_home     ON cs_missing_episodes(home_id);
CREATE INDEX IF NOT EXISTS idx_missing_child    ON cs_missing_episodes(child_id);
CREATE INDEX IF NOT EXISTS idx_missing_status   ON cs_missing_episodes(status);
CREATE INDEX IF NOT EXISTS idx_missing_type     ON cs_missing_episodes(episode_type);
CREATE INDEX IF NOT EXISTS idx_missing_reported ON cs_missing_episodes(reported_missing_at);

-- ── Complaints ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_complaints (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  complaint_category    text NOT NULL
                          CHECK (complaint_category IN (
                            'care_quality','staff_conduct','food_nutrition',
                            'physical_environment','privacy_dignity','bullying',
                            'contact_arrangements','activities','education',
                            'health','medication','communication',
                            'decision_making','discrimination','other'
                          )),
  source                text NOT NULL
                          CHECK (source IN (
                            'child','parent','placing_authority','advocate',
                            'staff','visitor','professional','anonymous'
                          )),
  complainant_name      text NOT NULL,
  child_id              uuid,
  staff_id              uuid,
  date_received         date NOT NULL DEFAULT CURRENT_DATE,
  date_acknowledged     date,
  date_responded        date,
  stage                 text NOT NULL DEFAULT 'informal'
                          CHECK (stage IN (
                            'informal','formal_stage1','formal_stage2',
                            'independent_review','ombudsman'
                          )),
  description           text NOT NULL,
  desired_outcome       text,
  investigation_notes   text,
  outcome               text,
  actions_taken         jsonb NOT NULL DEFAULT '[]'::jsonb,
  lessons_learned       text,
  complainant_satisfied boolean,
  advocacy_offered      boolean NOT NULL DEFAULT false,
  status                text NOT NULL DEFAULT 'open'
                          CHECK (status IN (
                            'open','investigating','responded','closed','escalated'
                          )),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_complaint_home     ON cs_complaints(home_id);
CREATE INDEX IF NOT EXISTS idx_complaint_status   ON cs_complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaint_category ON cs_complaints(complaint_category);
CREATE INDEX IF NOT EXISTS idx_complaint_source   ON cs_complaints(source);
CREATE INDEX IF NOT EXISTS idx_complaint_child    ON cs_complaints(child_id);
CREATE INDEX IF NOT EXISTS idx_complaint_received ON cs_complaints(date_received);

-- ── Reg 40 notifications ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_reg40_notifications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  notification_type     text NOT NULL
                          CHECK (notification_type IN (
                            'death','serious_injury','serious_illness','missing',
                            'police_involvement','allegation_against_staff',
                            'physical_intervention','child_protection',
                            'serious_complaint','absconding','accommodation_issue'
                          )),
  child_id              uuid,
  staff_id              uuid,
  linked_incident_id    uuid,
  linked_complaint_id   uuid,
  event_date            timestamptz NOT NULL DEFAULT now(),
  notification_date     timestamptz,
  sent_by               uuid,
  ofsted_reference      text,
  description           text NOT NULL,
  status                text NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','sent','acknowledged','overdue')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reg40_home   ON cs_reg40_notifications(home_id);
CREATE INDEX IF NOT EXISTS idx_reg40_status ON cs_reg40_notifications(status);
CREATE INDEX IF NOT EXISTS idx_reg40_type   ON cs_reg40_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_reg40_event  ON cs_reg40_notifications(event_date);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE cs_missing_episodes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_complaints           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_reg40_notifications  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY missing_home_policy ON cs_missing_episodes
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY complaint_home_policy ON cs_complaints
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY reg40_home_policy ON cs_reg40_notifications
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
