-- Migration: 357_key_document_support
-- Domain: Children's Services — National Insurance & Key Document Support
-- Description: Tracks support for care leavers and looked-after young people to
-- obtain essential documents: birth certificates, passports, National Insurance
-- numbers, provisional driving licences, proof of address, bank account setup,
-- NHS/dental/GP registration, biometric residence permits, exam certificates,
-- electoral roll registration, and other key documents needed for adult life.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 5 (independence preparation),
-- Children (Leaving Care) Act 2000,
-- DfE statutory guidance — care leavers must be supported to obtain essential documents,
-- SCCIF: Experiences & progress — "Young people have the documents they need for
-- adult life."

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_key_document_support (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  young_person_name           text NOT NULL,
  record_date                 date NOT NULL,
  supporting_staff            text NOT NULL,
  document_type               text NOT NULL DEFAULT 'National Insurance Number',
  support_stage               text NOT NULL DEFAULT 'Identified as Needed',
  document_held_by            text NOT NULL DEFAULT 'Not Yet Obtained',
  cost                        numeric NULL,
  funded_by                   text NULL,
  young_person_engaged        boolean NOT NULL DEFAULT false,
  personal_adviser_involved   boolean NOT NULL DEFAULT false,
  social_worker_informed      boolean NOT NULL DEFAULT false,
  pathway_plan_linked         boolean NOT NULL DEFAULT false,
  deadline_date               date NULL,
  notes                       text NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_key_document_support ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_key_document_support
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_key_document_support_home
  ON cs_key_document_support(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_key_document_support_date
  ON cs_key_document_support(record_date);

CREATE INDEX IF NOT EXISTS idx_cs_key_document_support_doctype
  ON cs_key_document_support(document_type);

CREATE INDEX IF NOT EXISTS idx_cs_key_document_support_stage
  ON cs_key_document_support(support_stage);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
