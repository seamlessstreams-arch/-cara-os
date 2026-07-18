-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — MEDICATION MANAGEMENT & CONTACT/FAMILY ENGAGEMENT
-- Migration 036: Medication prescriptions, MAR entries, medication errors,
-- contact plans, and contact records for Reg 23/7/8/10 compliance.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Medication prescriptions ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_medication_prescriptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id             uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id            uuid NOT NULL,
  medication_name     text NOT NULL,
  dosage              text NOT NULL,
  frequency           text NOT NULL,
  route               text NOT NULL
                        CHECK (route IN (
                          'oral','topical','inhaled','injection','sublingual',
                          'rectal','nasal','eye_drops','ear_drops','patch'
                        )),
  medication_type     text NOT NULL
                        CHECK (medication_type IN (
                          'regular','prn','controlled','otc','topical','homely_remedy'
                        )),
  prescriber          text NOT NULL,
  pharmacy            text NOT NULL DEFAULT '',
  start_date          date NOT NULL,
  end_date            date,
  special_instructions text,
  is_active           boolean NOT NULL DEFAULT true,
  requires_witness    boolean NOT NULL DEFAULT false,
  stock_count         integer,
  last_stock_check    timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_med_rx_home      ON cs_medication_prescriptions(home_id);
CREATE INDEX IF NOT EXISTS idx_med_rx_child     ON cs_medication_prescriptions(child_id);
CREATE INDEX IF NOT EXISTS idx_med_rx_type      ON cs_medication_prescriptions(medication_type);
CREATE INDEX IF NOT EXISTS idx_med_rx_active    ON cs_medication_prescriptions(is_active);

-- ── MAR (Medication Administration Record) entries ──────────────────────────

CREATE TABLE IF NOT EXISTS cs_mar_entries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id   uuid NOT NULL REFERENCES cs_medication_prescriptions(id) ON DELETE CASCADE,
  child_id          uuid NOT NULL,
  home_id           uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  scheduled_time    timestamptz NOT NULL,
  administered_at   timestamptz,
  administered_by   uuid NOT NULL,
  witnessed_by      uuid,
  outcome           text NOT NULL
                      CHECK (outcome IN (
                        'given','refused','withheld','not_available',
                        'self_administered','absent'
                      )),
  dosage_given      text NOT NULL,
  stock_before      integer,
  stock_after       integer,
  prn_rationale     text,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mar_home         ON cs_mar_entries(home_id);
CREATE INDEX IF NOT EXISTS idx_mar_child        ON cs_mar_entries(child_id);
CREATE INDEX IF NOT EXISTS idx_mar_rx           ON cs_mar_entries(prescription_id);
CREATE INDEX IF NOT EXISTS idx_mar_scheduled    ON cs_mar_entries(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_mar_outcome      ON cs_mar_entries(outcome);

-- ── Medication errors ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_medication_errors (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id              uuid NOT NULL,
  prescription_id       uuid,
  error_category        text NOT NULL
                          CHECK (error_category IN (
                            'wrong_dose','wrong_time','wrong_medication','wrong_child',
                            'omission','double_dose','expired_medication',
                            'documentation_error','storage_error','disposal_error'
                          )),
  severity              text NOT NULL
                          CHECK (severity IN ('critical','high','medium','low')),
  description           text NOT NULL,
  action_taken          text NOT NULL DEFAULT '',
  reported_by           uuid NOT NULL,
  reported_to_manager   boolean NOT NULL DEFAULT false,
  ofsted_notified       boolean NOT NULL DEFAULT false,
  parent_notified       boolean NOT NULL DEFAULT false,
  prescriber_notified   boolean NOT NULL DEFAULT false,
  outcome               text NOT NULL DEFAULT '',
  date_occurred         timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_med_err_home     ON cs_medication_errors(home_id);
CREATE INDEX IF NOT EXISTS idx_med_err_child    ON cs_medication_errors(child_id);
CREATE INDEX IF NOT EXISTS idx_med_err_severity ON cs_medication_errors(severity);
CREATE INDEX IF NOT EXISTS idx_med_err_category ON cs_medication_errors(error_category);

-- ── Contact plans ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_contact_plans (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id              uuid NOT NULL,
  contact_person_name   text NOT NULL,
  contact_person_role   text NOT NULL
                          CHECK (contact_person_role IN (
                            'birth_parent','sibling','grandparent','extended_family',
                            'foster_carer','friend','social_worker','advocate',
                            'mentor','other'
                          )),
  relationship_detail   text NOT NULL DEFAULT '',
  approved_contact_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  supervision_level     text NOT NULL DEFAULT 'unsupervised'
                          CHECK (supervision_level IN (
                            'unsupervised','supervised_staff','supervised_social_worker',
                            'supervised_contact_centre','no_contact'
                          )),
  planned_frequency     text NOT NULL DEFAULT 'as_agreed',
  court_ordered         boolean NOT NULL DEFAULT false,
  risk_notes            text,
  is_active             boolean NOT NULL DEFAULT true,
  approved_by           uuid NOT NULL,
  approved_date         date NOT NULL DEFAULT CURRENT_DATE,
  review_date           date,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_plan_home   ON cs_contact_plans(home_id);
CREATE INDEX IF NOT EXISTS idx_contact_plan_child  ON cs_contact_plans(child_id);
CREATE INDEX IF NOT EXISTS idx_contact_plan_active ON cs_contact_plans(is_active);

-- ── Contact records ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_contact_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id              uuid NOT NULL,
  contact_plan_id       uuid REFERENCES cs_contact_plans(id),
  contact_person_name   text NOT NULL,
  contact_person_role   text NOT NULL,
  contact_type          text NOT NULL
                          CHECK (contact_type IN (
                            'face_to_face','phone_call','video_call','letter',
                            'social_media','outing','overnight_stay'
                          )),
  supervision_level     text NOT NULL DEFAULT 'unsupervised',
  scheduled_date        date NOT NULL,
  actual_date           date,
  duration_minutes      integer,
  location              text,
  outcome               text NOT NULL DEFAULT 'completed'
                          CHECK (outcome IN (
                            'completed','cancelled_by_child','cancelled_by_contact',
                            'cancelled_by_authority','no_show','partial','refused_by_child'
                          )),
  child_mood_before     smallint CHECK (child_mood_before BETWEEN 1 AND 5),
  child_mood_after      smallint CHECK (child_mood_after BETWEEN 1 AND 5),
  child_voice           text,
  staff_observations    text,
  safeguarding_concerns text,
  supervised_by         uuid,
  recorded_by           uuid NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_rec_home    ON cs_contact_records(home_id);
CREATE INDEX IF NOT EXISTS idx_contact_rec_child   ON cs_contact_records(child_id);
CREATE INDEX IF NOT EXISTS idx_contact_rec_plan    ON cs_contact_records(contact_plan_id);
CREATE INDEX IF NOT EXISTS idx_contact_rec_date    ON cs_contact_records(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_contact_rec_outcome ON cs_contact_records(outcome);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE cs_medication_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_mar_entries              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_medication_errors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_contact_plans            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_contact_records          ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY med_rx_home_policy ON cs_medication_prescriptions
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY mar_home_policy ON cs_mar_entries
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY med_err_home_policy ON cs_medication_errors
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY contact_plan_home_policy ON cs_contact_plans
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY contact_rec_home_policy ON cs_contact_records
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
