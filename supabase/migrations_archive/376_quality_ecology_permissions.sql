-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 376: Quality Ecology & Permissions System Tables
--
-- Core tables for:
--   1. Staff profiles with RBAC roles and home assignments
--   2. Task templates (scheduled form definitions)
--   3. Scheduled occurrences (lifecycle-tracked form instances)
--   4. Record amendments (immutable addendums to locked records)
--   5. QA samples and reviews
--   6. Audit log (immutable event trail)
--   7. Delegated scopes and temporary grants
--   8. Escalation events
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Staff Profiles (extends auth.users) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'rsw',
  organisation_id TEXT NOT NULL DEFAULT 'org-1',
  home_ids TEXT[] DEFAULT '{}',
  assigned_child_ids TEXT[] DEFAULT '{}',
  employment_status TEXT NOT NULL DEFAULT 'active',
  shift_active BOOLEAN DEFAULT true,
  safeguarding_need_to_know TEXT[] DEFAULT '{}',
  display_name TEXT,
  job_title TEXT,
  start_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id ON staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_role ON staff_profiles(role);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_home_ids ON staff_profiles USING GIN(home_ids);

-- ── Task Templates ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  version INTEGER DEFAULT 1,

  -- Schedule
  schedule_frequency TEXT NOT NULL,
  schedule_days INTEGER[] DEFAULT '{}',
  schedule_dates INTEGER[] DEFAULT '{}',
  schedule_time TEXT,
  event_triggers TEXT[] DEFAULT '{}',

  -- Roles
  completion_roles TEXT[] DEFAULT '{}',
  check_role TEXT,
  approval_role TEXT,
  approval_level INTEGER DEFAULT 0,

  -- Timing
  due_time_minutes INTEGER,
  grace_period_minutes INTEGER DEFAULT 30,
  reminder_minutes_before INTEGER DEFAULT 15,

  -- Escalation
  first_escalation_minutes INTEGER DEFAULT 60,
  first_escalation_to TEXT DEFAULT 'team_leader',
  second_escalation_minutes INTEGER,
  second_escalation_to TEXT,
  critical_escalation_after_missed INTEGER,

  -- Quality
  requires_evidence BOOLEAN DEFAULT false,
  requires_child_voice BOOLEAN DEFAULT false,
  requires_manager_review BOOLEAN DEFAULT false,
  qa_required BOOLEAN DEFAULT false,
  qa_sample_percentage INTEGER DEFAULT 10,
  aria_review_required BOOLEAN DEFAULT false,

  -- Filing
  filing_location TEXT,
  evidence_tags TEXT[] DEFAULT '{}',
  regulation_links TEXT[] DEFAULT '{}',
  quality_standard_links TEXT[] DEFAULT '{}',
  feeds_annex_a BOOLEAN DEFAULT false,
  feeds_reg44 BOOLEAN DEFAULT false,
  feeds_reg45 BOOLEAN DEFAULT false,
  ofsted_category TEXT,

  -- Configuration
  sensitivity TEXT DEFAULT 'internal',
  self_approval_allowed BOOLEAN DEFAULT false,
  locks_after_approval BOOLEAN DEFAULT true,
  retention_category TEXT DEFAULT '6_years',

  -- Status
  active BOOLEAN DEFAULT true,
  home_ids TEXT[] DEFAULT '{}',
  child_specific BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_templates_active ON task_templates(active);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);
CREATE INDEX IF NOT EXISTS idx_task_templates_frequency ON task_templates(schedule_frequency);

-- ── Scheduled Occurrences ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scheduled_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES task_templates(id),
  template_name TEXT NOT NULL,

  -- Assignment
  assigned_to TEXT,
  assigned_at TIMESTAMPTZ,
  home_id TEXT NOT NULL,
  child_id TEXT,

  -- Timing
  due_date DATE NOT NULL,
  due_time TEXT,
  grace_expires_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ DEFAULT now(),

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled',
  status_history JSONB DEFAULT '[]',

  -- Completion
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,

  -- Checking
  checked_by TEXT,
  checked_at TIMESTAMPTZ,
  check_outcome TEXT,
  check_notes TEXT,

  -- Return
  returned_at TIMESTAMPTZ,
  return_reason TEXT,
  returned_by TEXT,
  resubmitted_at TIMESTAMPTZ,
  resubmission_count INTEGER DEFAULT 0,

  -- Approval
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  approval_level INTEGER DEFAULT 0,

  -- QA
  qa_required BOOLEAN DEFAULT false,
  qa_sampled_by TEXT,
  qa_sampled_at TIMESTAMPTZ,
  qa_score INTEGER,
  qa_findings TEXT,

  -- Filing
  locked_at TIMESTAMPTZ,
  filed_at TIMESTAMPTZ,
  filing_location TEXT,
  evidence_tags TEXT[] DEFAULT '{}',

  -- Escalation
  escalation_level INTEGER DEFAULT 0,
  escalated_at TIMESTAMPTZ,
  escalated_to TEXT,
  escalation_reason TEXT,

  -- Aria
  aria_reviewed BOOLEAN DEFAULT false,
  aria_quality_score INTEGER,
  aria_suggestions JSONB DEFAULT '[]',

  -- Content (for locking)
  content_hash TEXT,
  form_data JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sched_occ_status ON scheduled_occurrences(status);
CREATE INDEX IF NOT EXISTS idx_sched_occ_home ON scheduled_occurrences(home_id);
CREATE INDEX IF NOT EXISTS idx_sched_occ_template ON scheduled_occurrences(template_id);
CREATE INDEX IF NOT EXISTS idx_sched_occ_due ON scheduled_occurrences(due_date);
CREATE INDEX IF NOT EXISTS idx_sched_occ_assigned ON scheduled_occurrences(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sched_occ_completed_by ON scheduled_occurrences(completed_by);

-- ── Record Amendments ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS record_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES scheduled_occurrences(id),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  content TEXT NOT NULL,
  reason TEXT NOT NULL,
  field_path TEXT,
  original_value TEXT,

  -- Workflow
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejected_by TEXT,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_amendments_record ON record_amendments(record_id);
CREATE INDEX IF NOT EXISTS idx_amendments_status ON record_amendments(status);
CREATE INDEX IF NOT EXISTS idx_amendments_created_by ON record_amendments(created_by);

-- ── QA Reviews ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS qa_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id UUID NOT NULL REFERENCES scheduled_occurrences(id),
  reviewer_id TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ DEFAULT now(),
  quality_score INTEGER NOT NULL CHECK (quality_score BETWEEN 1 AND 5),
  quality_band TEXT NOT NULL,
  findings TEXT NOT NULL,
  actions_required TEXT[] DEFAULT '{}',
  learning_identified TEXT[] DEFAULT '{}',
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_due DATE,
  outcome TEXT NOT NULL,
  filed_location TEXT
);

CREATE INDEX IF NOT EXISTS idx_qa_reviews_occurrence ON qa_reviews(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_qa_reviews_reviewer ON qa_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_qa_reviews_band ON qa_reviews(quality_band);

-- ── Audit Log ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  user_id TEXT NOT NULL,
  user_role TEXT,
  home_id TEXT,
  child_id TEXT,
  resource_type TEXT,
  resource_id TEXT,
  resource_name TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log is append-only — no UPDATE or DELETE policies
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_home ON audit_log(home_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log(resource_type, resource_id);

-- ── Delegated Scopes ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS delegated_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  actions TEXT[] DEFAULT '{}',
  resource_id TEXT,
  granted_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delegations_user ON delegated_scopes(user_id);
CREATE INDEX IF NOT EXISTS idx_delegations_expires ON delegated_scopes(expires_at);

-- ── Temporary Grants ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS temporary_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  actions TEXT[] DEFAULT '{}',
  resource_id TEXT,
  granted_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_temp_grants_user ON temporary_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_grants_status ON temporary_grants(status);
CREATE INDEX IF NOT EXISTS idx_temp_grants_expires ON temporary_grants(expires_at);

-- ── Escalation Events ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS escalation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id UUID NOT NULL REFERENCES scheduled_occurrences(id),
  template_id UUID REFERENCES task_templates(id),
  level INTEGER NOT NULL,
  severity TEXT NOT NULL,
  reason TEXT NOT NULL,
  escalated_to TEXT NOT NULL,
  escalated_at TIMESTAMPTZ DEFAULT now(),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_escalations_occurrence ON escalation_events(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_escalations_unresolved ON escalation_events(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_escalations_severity ON escalation_events(severity);

-- ── RLS Policies ───────────────────────────────────────────────────────────

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegated_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE temporary_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_events ENABLE ROW LEVEL SECURITY;

-- Staff can view their own profile
CREATE POLICY staff_profiles_own ON staff_profiles
  FOR SELECT USING (user_id = auth.uid()::text);

-- Managers can view all profiles in their homes (handled at app level)
CREATE POLICY staff_profiles_managers ON staff_profiles
  FOR ALL USING (true);

-- Task templates visible to all authenticated users
CREATE POLICY task_templates_read ON task_templates
  FOR SELECT USING (true);

-- Scheduled occurrences — access controlled at application layer
CREATE POLICY sched_occ_all ON scheduled_occurrences
  FOR ALL USING (true);

-- Amendments — visible to authenticated users
CREATE POLICY amendments_all ON record_amendments
  FOR ALL USING (true);

-- QA reviews — visible to authenticated users
CREATE POLICY qa_reviews_all ON qa_reviews
  FOR ALL USING (true);

-- Audit log — append-only for authenticated, read for managers (handled at app level)
CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY audit_log_read ON audit_log
  FOR SELECT USING (true);

-- Delegations and grants
CREATE POLICY delegations_all ON delegated_scopes
  FOR ALL USING (true);

CREATE POLICY grants_all ON temporary_grants
  FOR ALL USING (true);

-- Escalations
CREATE POLICY escalations_all ON escalation_events
  FOR ALL USING (true);
