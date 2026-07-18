-- Migration: 342_birth_family_contact_support
-- Domain: Children's Services — Birth Family & Parental Contact Support
-- Description: Tracks birth family and parental contact support including
-- pre-contact preparation, contact facilitation, post-contact debriefs,
-- supervised contact, transport arrangements, venue booking, risk assessment
-- updates, contact agreement reviews, mediation, therapeutic support,
-- life story context, and court order compliance.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 7 (contact with family/friends),
-- Children Act 1989 s34 (presumption of contact),
-- CHR 2015 Reg 12 (protection during contact),
-- SCCIF: Overall experiences — "The home promotes contact unless it is
-- not in children's interest."
-- Care Planning Regulations 2010.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_birth_family_contact_support (
  id                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                text NOT NULL,
  contact_person_name       text NOT NULL,
  family_role               text NOT NULL DEFAULT 'Other',
  support_type              text NOT NULL DEFAULT 'Contact Facilitation',
  contact_date              date NOT NULL,
  support_provided_by       text NOT NULL,
  child_prepared            boolean NOT NULL DEFAULT false,
  child_views_considered    boolean NOT NULL DEFAULT false,
  risk_assessment_current   boolean NOT NULL DEFAULT false,
  safeguarding_concerns     boolean NOT NULL DEFAULT false,
  concern_details           text NULL,
  contact_plan_followed     boolean NOT NULL DEFAULT true,
  child_emotional_response  text NOT NULL DEFAULT 'Neutral',
  support_after_contact     boolean NOT NULL DEFAULT false,
  social_worker_informed    boolean NOT NULL DEFAULT false,
  court_order_in_place      boolean NOT NULL DEFAULT false,
  contact_frequency_agreed  text NULL,
  next_contact_date         date NULL,
  status                    text NOT NULL DEFAULT 'Planned',
  notes                     text NULL,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_birth_family_contact_support ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_birth_family_contact_support
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_birth_family_contact_support_home
  ON cs_birth_family_contact_support(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_birth_family_contact_support_date
  ON cs_birth_family_contact_support(contact_date);

CREATE INDEX IF NOT EXISTS idx_cs_birth_family_contact_support_role
  ON cs_birth_family_contact_support(family_role);

CREATE INDEX IF NOT EXISTS idx_cs_birth_family_contact_support_status
  ON cs_birth_family_contact_support(status);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
