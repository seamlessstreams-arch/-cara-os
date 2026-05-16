-- Migration: 346_restorative_practice
-- Domain: Children's Services — Restorative Practice & Conflict Resolution
-- Description: Tracks restorative practice and conflict resolution sessions
-- for looked-after children including restorative conferences, restorative
-- chats, community meetings, harm circles, peer mediation, staff-child
-- mediation, conflict resolution, reintegration meetings, check-in circles,
-- relationship repair, group problem-solving, and follow-up sessions.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 34 (positive behaviour management — must not use punishment),
-- CHR 2015 Reg 19 (positive relationships),
-- SCCIF: Behaviour and attitudes — "The home uses restorative approaches."
-- Restorative Justice Council standards.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_restorative_practice (
  id                              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                         uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                      text NOT NULL,
  session_date                    date NOT NULL,
  facilitator_name                text NOT NULL,
  session_type                    text NOT NULL DEFAULT 'Restorative Chat',
  trigger_incident                text NULL,
  participants                    text NOT NULL DEFAULT '',
  harm_acknowledged               boolean NOT NULL DEFAULT false,
  perspectives_shared             boolean NOT NULL DEFAULT false,
  agreement_reached               boolean NOT NULL DEFAULT false,
  agreement_details               text NULL,
  actions_agreed                  text NULL,
  follow_up_required              boolean NOT NULL DEFAULT false,
  follow_up_date                  date NULL,
  follow_up_completed             boolean NOT NULL DEFAULT false,
  child_satisfied_with_process    boolean NOT NULL DEFAULT false,
  outcome_rating                  text NOT NULL DEFAULT 'Neutral',
  relationship_improved           boolean NOT NULL DEFAULT false,
  young_person_voice_heard        boolean NOT NULL DEFAULT false,
  staff_reflective_practice       boolean NOT NULL DEFAULT false,
  notes                           text NULL,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_restorative_practice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_restorative_practice
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_restorative_practice_home
  ON cs_restorative_practice(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_restorative_practice_date
  ON cs_restorative_practice(session_date);

CREATE INDEX IF NOT EXISTS idx_cs_restorative_practice_type
  ON cs_restorative_practice(session_type);

CREATE INDEX IF NOT EXISTS idx_cs_restorative_practice_outcome
  ON cs_restorative_practice(outcome_rating);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
