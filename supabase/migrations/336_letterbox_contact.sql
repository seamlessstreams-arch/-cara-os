-- Migration: 336_letterbox_contact
-- Domain: Children's Services — Letterbox & Indirect Contact
-- Description: Tracks indirect contact arrangements between looked-after children
-- and birth families/significant others, including letterbox exchanges, content
-- screening, emotional impact assessment, child wishes, therapeutic input,
-- and letterbox agreement management.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 7 (contact arrangements),
-- Children Act 1989 s34,
-- Adoption and Children Act 2002 s46 (post-adoption contact),
-- SCCIF: Overall experiences — "Children maintain important relationships safely."
-- Indirect contact for safety-restricted relationships.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_letterbox_contact (
  id                              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                      text NOT NULL,
  contact_person_name             text NOT NULL,
  relationship                    text NOT NULL DEFAULT 'Other',
  contact_direction               text NOT NULL DEFAULT 'Two-Way Exchange',
  scheduled_date                  date NOT NULL,
  actual_date                     date NULL,
  contact_method                  text NOT NULL DEFAULT 'Letter',
  content_screened                boolean NOT NULL DEFAULT false,
  content_appropriate             boolean NOT NULL DEFAULT false,
  content_concerns                text NULL,
  child_supported_to_write        boolean NOT NULL DEFAULT false,
  child_wishes_considered         boolean NOT NULL DEFAULT false,
  emotional_impact_assessed       boolean NOT NULL DEFAULT false,
  child_mood_after                text NOT NULL DEFAULT 'Neutral',
  facilitator_name                text NOT NULL,
  social_worker_aware             boolean NOT NULL DEFAULT false,
  therapeutic_input               boolean NOT NULL DEFAULT false,
  letterbox_agreement_in_place    boolean NOT NULL DEFAULT false,
  frequency_agreed                text NOT NULL DEFAULT 'Quarterly',
  next_scheduled_date             date NULL,
  status                          text NOT NULL DEFAULT 'Pending Review',
  notes                           text NULL,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_letterbox_contact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_letterbox_contact
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_letterbox_contact_home
  ON cs_letterbox_contact(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_letterbox_contact_scheduled
  ON cs_letterbox_contact(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_cs_letterbox_contact_status
  ON cs_letterbox_contact(status);

CREATE INDEX IF NOT EXISTS idx_cs_letterbox_contact_child
  ON cs_letterbox_contact(child_name);

CREATE INDEX IF NOT EXISTS idx_cs_letterbox_contact_relationship
  ON cs_letterbox_contact(relationship);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
