-- Migration: cs_staff_handover_notes
-- Tracks detailed handover notes between shifts

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_handover_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  note_category text NOT NULL DEFAULT 'child_update',
  note_priority text NOT NULL DEFAULT 'medium',
  note_status text NOT NULL DEFAULT 'pending',
  shift_type text NOT NULL DEFAULT 'day_to_night',
  handover_date date NOT NULL DEFAULT now(),
  outgoing_staff text NOT NULL DEFAULT '',
  incoming_staff text NOT NULL DEFAULT '',
  child_specific boolean NOT NULL DEFAULT false,
  medication_related boolean NOT NULL DEFAULT false,
  safeguarding_related boolean NOT NULL DEFAULT false,
  task_completed boolean NOT NULL DEFAULT false,
  follow_up_required boolean NOT NULL DEFAULT false,
  follow_up_completed boolean NOT NULL DEFAULT false,
  acknowledged_by_incoming boolean NOT NULL DEFAULT false,
  manager_informed boolean NOT NULL DEFAULT false,
  time_sensitive boolean NOT NULL DEFAULT false,
  verbal_handover_given boolean NOT NULL DEFAULT true,
  written_record_complete boolean NOT NULL DEFAULT true,
  risk_related boolean NOT NULL DEFAULT false,
  social_worker_update boolean NOT NULL DEFAULT false,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  child_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_staff_handover_notes_home ON cs_staff_handover_notes(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_staff_handover_notes_date ON cs_staff_handover_notes(handover_date);

ALTER TABLE cs_staff_handover_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_staff_handover_notes_home_isolation ON cs_staff_handover_notes;
CREATE POLICY cs_staff_handover_notes_home_isolation ON cs_staff_handover_notes
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_staff_handover_notes migration: %', SQLERRM;
END $$;
