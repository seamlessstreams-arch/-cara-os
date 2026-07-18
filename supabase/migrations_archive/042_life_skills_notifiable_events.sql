-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 042 Life Skills & Independence + Notifiable Events
-- Reg 8 (enjoyment & achievement), Reg 9 (quality of care),
-- Reg 14 (care planning / pathway), Reg 40 (notifiable events)
-- Tables: cs_skill_assessments, cs_pathway_plans,
--         cs_notifiable_events, cs_event_notifications
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_skill_assessments ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_skill_assessments (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id          UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id         UUID NOT NULL,
  child_name       TEXT NOT NULL,
  domain           TEXT NOT NULL,
  skill            TEXT NOT NULL,
  competency_level TEXT NOT NULL DEFAULT 'not_assessed',
  assessed_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  assessed_by      TEXT NOT NULL,
  notes            TEXT,
  evidence         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_skill_assessments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "skill_assessments_home" ON cs_skill_assessments
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_skill_assessments_home
  ON cs_skill_assessments(home_id);

CREATE INDEX IF NOT EXISTS idx_skill_assessments_child
  ON cs_skill_assessments(child_id, domain);

-- ── cs_pathway_plans ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_pathway_plans (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                   UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                  UUID NOT NULL,
  child_name                TEXT NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'not_started',
  start_date                DATE NOT NULL DEFAULT CURRENT_DATE,
  target_move_date          DATE,
  accommodation_plan        TEXT,
  education_employment_plan TEXT,
  support_network           TEXT,
  personal_adviser_name     TEXT,
  last_reviewed             DATE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_pathway_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "pathway_plans_home" ON cs_pathway_plans
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_pathway_plans_home
  ON cs_pathway_plans(home_id);

CREATE INDEX IF NOT EXISTS idx_pathway_plans_child
  ON cs_pathway_plans(child_id);

-- ── cs_notifiable_events ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_notifiable_events (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                  UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  event_type               TEXT NOT NULL,
  event_date               DATE NOT NULL DEFAULT CURRENT_DATE,
  event_time               TIME,
  child_id                 UUID,
  child_name               TEXT,
  staff_involved           JSONB NOT NULL DEFAULT '[]',
  description              TEXT NOT NULL DEFAULT '',
  immediate_actions_taken  TEXT NOT NULL DEFAULT '',
  outcome                  TEXT,
  reported_by              TEXT NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_notifiable_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "notifiable_events_home" ON cs_notifiable_events
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifiable_events_home
  ON cs_notifiable_events(home_id);

CREATE INDEX IF NOT EXISTS idx_notifiable_events_type
  ON cs_notifiable_events(event_type, event_date);

CREATE INDEX IF NOT EXISTS idx_notifiable_events_child
  ON cs_notifiable_events(child_id);

-- ── cs_event_notifications ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_event_notifications (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id           UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  event_id          UUID NOT NULL REFERENCES cs_notifiable_events(id) ON DELETE CASCADE,
  recipient_type    TEXT NOT NULL,
  recipient_name    TEXT,
  sent_date         TIMESTAMPTZ,
  sent_by           TEXT,
  method            TEXT NOT NULL DEFAULT 'email',
  reference_number  TEXT,
  status            TEXT NOT NULL DEFAULT 'draft',
  deadline          TIMESTAMPTZ NOT NULL,
  acknowledged_date TIMESTAMPTZ,
  acknowledged_by   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_event_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "event_notifications_home" ON cs_event_notifications
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_notifications_home
  ON cs_event_notifications(home_id);

CREATE INDEX IF NOT EXISTS idx_event_notifications_event
  ON cs_event_notifications(event_id);

CREATE INDEX IF NOT EXISTS idx_event_notifications_status
  ON cs_event_notifications(status);
