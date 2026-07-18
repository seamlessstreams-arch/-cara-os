-- ══════════════════════════════════════════════════════════════════════════════
-- 030 — Communication Intelligence
-- Professional draft management: handover summaries, social worker updates,
-- Reg 44/45 sections, incident notifications, shift briefings.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_communication_drafts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id              uuid NOT NULL REFERENCES homes(id),
  communication_type   text NOT NULL
    CHECK (communication_type IN (
      'handover_summary', 'social_worker_update', 'reg44_section',
      'reg45_section', 'incident_notification', 'missing_notification',
      'placement_update', 'multi_agency_brief', 'shift_briefing',
      'professional_update', 'management_summary', 'ofsted_notification'
    )),
  title                text NOT NULL,
  content              text NOT NULL,
  recipient_context    text,
  child_id             uuid,
  staff_id             uuid REFERENCES staff(id),
  linked_entity_type   text,
  linked_entity_id     uuid,
  status               text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'approved', 'sent', 'archived')),
  aria_generated       boolean DEFAULT false,
  aria_prompt_used     text,
  edited_by            uuid REFERENCES staff(id),
  edited_at            timestamptz,
  approved_by          uuid REFERENCES staff(id),
  approved_at          timestamptz,
  sent_at              timestamptz,
  created_by           uuid NOT NULL REFERENCES staff(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_comm_drafts_home ON cs_communication_drafts(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_comm_drafts_type ON cs_communication_drafts(communication_type);
CREATE INDEX IF NOT EXISTS idx_cs_comm_drafts_child ON cs_communication_drafts(child_id);
CREATE INDEX IF NOT EXISTS idx_cs_comm_drafts_status ON cs_communication_drafts(status);

ALTER TABLE cs_communication_drafts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  EXECUTE format(
    'CREATE POLICY %I ON cs_communication_drafts FOR ALL USING (home_id = get_my_home_id())',
    'cs_comm_drafts_rls'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
