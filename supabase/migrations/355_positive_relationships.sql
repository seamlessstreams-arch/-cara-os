-- Migration: 355_positive_relationships
-- Domain: Children's Services — Positive Relationships & Social Skills
-- Description: Tracks social skills groups, friendship skills, conflict resolution,
-- anger management, emotional regulation, empathy building, communication skills,
-- boundary setting, trust building, team building, peer support, anti-bullying,
-- self-esteem building, assertiveness training, healthy relationships, and online
-- relationship safety sessions for looked-after children.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 11 (positive relationships),
-- CHR 2015 Reg 19 (relationships between staff and children),
-- CHR 2015 Reg 34 (behaviour that is acceptable),
-- SCCIF: Behaviour and attitudes — "Children develop positive relationships and
-- social skills."
-- Attachment theory, trauma-informed care.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_positive_relationships (
  id                                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                             uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                          text NOT NULL,
  session_date                        date NOT NULL,
  facilitator_name                    text NOT NULL,
  session_type                        text NOT NULL DEFAULT 'Social Skills Group',
  delivery_method                     text NOT NULL DEFAULT '1-to-1 Session',
  attachment_style_considered         boolean NOT NULL DEFAULT false,
  trauma_informed_approach            boolean NOT NULL DEFAULT false,
  key_worker_involved                 boolean NOT NULL DEFAULT false,
  therapeutic_input                   boolean NOT NULL DEFAULT false,
  child_engaged                       boolean NOT NULL DEFAULT false,
  skill_demonstrated                  boolean NOT NULL DEFAULT false,
  generalised_to_other_settings       boolean NOT NULL DEFAULT false,
  positive_peer_interaction_observed  boolean NOT NULL DEFAULT false,
  staff_relationship_improved         boolean NOT NULL DEFAULT false,
  confidence_improved                 boolean NOT NULL DEFAULT false,
  child_feedback                      text NULL,
  care_plan_linked                    boolean NOT NULL DEFAULT false,
  social_worker_informed              boolean NOT NULL DEFAULT false,
  next_session_date                   date NULL,
  notes                               text NULL,
  created_at                          timestamptz NOT NULL DEFAULT now(),
  updated_at                          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_positive_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_positive_relationships
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_positive_relationships_home
  ON cs_positive_relationships(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_positive_relationships_date
  ON cs_positive_relationships(session_date);

CREATE INDEX IF NOT EXISTS idx_cs_positive_relationships_type
  ON cs_positive_relationships(session_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
