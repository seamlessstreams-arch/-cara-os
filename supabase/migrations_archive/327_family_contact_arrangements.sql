-- Migration: 329_family_contact_arrangements
-- Domain: Sibling & Family Contact Arrangements
-- Tracks scheduled and completed contact between children and family members
-- CHR 2015 Reg 7 (contact arrangements), Children Act 1989 s34 (contact with parents/relatives),
-- Reg 12 (children's protection — risk assessment of contact)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_family_contact_arrangements (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  child_name              text        NOT NULL,
  contact_person_name     text        NOT NULL,
  relationship            text        NOT NULL CHECK (relationship IN ('Mother','Father','Sibling','Grandparent','Aunt/Uncle','Cousin','Step-parent','Foster Carer','Other Family Member','Friend','Other')),

  contact_type            text        NOT NULL CHECK (contact_type IN ('Face-to-Face Supervised','Face-to-Face Unsupervised','Phone Call','Video Call','Letter/Letterbox','Email/Message','Overnight Stay','Holiday Contact','Indirect — via Social Worker','Court Ordered')),

  scheduled_date          date        NOT NULL,
  actual_date             date        NULL,
  duration_minutes        integer     NULL,
  location                text        NULL,
  supervisor_name         text        NULL,

  child_wishes_considered boolean     NOT NULL DEFAULT false,
  child_mood_before       text        NOT NULL CHECK (child_mood_before IN ('Happy','Anxious','Reluctant','Distressed','Neutral','Excited')),
  child_mood_after        text        NOT NULL CHECK (child_mood_after IN ('Happy','Anxious','Upset','Distressed','Neutral','Unsettled','Positive')),

  contact_quality         text        NOT NULL CHECK (contact_quality IN ('Positive','Mixed','Difficult','Did Not Proceed')),
  risk_assessed           boolean     NOT NULL DEFAULT false,
  concerns_raised         boolean     NOT NULL DEFAULT false,
  concern_details         text        NULL,
  social_worker_notified  boolean     NOT NULL DEFAULT false,

  outcome_notes           text        NOT NULL,
  next_contact_date       date        NULL,

  status                  text        NOT NULL CHECK (status IN ('Confirmed','Completed','Cancelled','Rescheduled','Refused by Child','Refused by Contact','Suspended by Court')),

  notes             text    NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_family_contact_arrangements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_family_contact_arrangements;
CREATE POLICY "Tenant isolation" ON cs_family_contact_arrangements
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_family_contact_arrangements_home
  ON cs_family_contact_arrangements(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_family_contact_arrangements_date
  ON cs_family_contact_arrangements(scheduled_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
