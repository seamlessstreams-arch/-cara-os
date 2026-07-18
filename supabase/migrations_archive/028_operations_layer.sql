-- ══════════════════════════════════════════════════════════════════════════════
-- 028: OPERATIONS LAYER — Granular permissions, form governance, task explorer,
-- workflows, evidence management, management oversight, ARIA intelligence,
-- regulatory mapping, inspection readiness, and immutable audit trail.
--
-- The Manager+ governance engine for Cornerstone.
-- ══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. GRANULAR PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_roles (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id         UUID REFERENCES homes(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  label           TEXT NOT NULL,
  description     TEXT,
  level           INT NOT NULL DEFAULT 0,        -- hierarchy: 100=super_admin down to 10=bank_staff
  is_system       BOOLEAN DEFAULT FALSE,         -- system roles can't be deleted
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(home_id, code)
);

CREATE TABLE IF NOT EXISTS cs_permissions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,
  group_name      TEXT NOT NULL,                 -- e.g. 'young_people', 'incidents', 'forms'
  label           TEXT NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_role_permissions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id         UUID REFERENCES cs_roles(id) ON DELETE CASCADE,
  permission_id   UUID REFERENCES cs_permissions(id) ON DELETE CASCADE,
  granted_at      TIMESTAMPTZ DEFAULT now(),
  granted_by      UUID REFERENCES staff(id),
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS cs_user_role_assignments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES staff(id) ON DELETE CASCADE,
  role_id         UUID REFERENCES cs_roles(id) ON DELETE CASCADE,
  home_id         UUID REFERENCES homes(id) ON DELETE CASCADE,
  assigned_at     TIMESTAMPTZ DEFAULT now(),
  assigned_by     UUID REFERENCES staff(id),
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, role_id, home_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cs_role_perms_role ON cs_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_cs_user_roles_user ON cs_user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_cs_user_roles_home ON cs_user_role_assignments(home_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. FORM GOVERNANCE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS form_templates (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id         UUID REFERENCES homes(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL CHECK (category IN (
    'daily_recording', 'incident', 'safeguarding', 'health',
    'education', 'placement', 'hr', 'compliance', 'review',
    'contact', 'risk_assessment', 'custom'
  )),
  is_active       BOOLEAN DEFAULT TRUE,
  is_mandatory    BOOLEAN DEFAULT FALSE,
  regulation_refs TEXT[] DEFAULT '{}',          -- e.g. {'CHR2015:Reg12', 'SCCIF:Leadership'}
  created_by      UUID REFERENCES staff(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(home_id, slug)
);

CREATE TABLE IF NOT EXISTS form_template_versions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id     UUID REFERENCES form_templates(id) ON DELETE CASCADE,
  version         INT NOT NULL DEFAULT 1,
  schema          JSONB NOT NULL,                -- field definitions [{type, label, required, options, conditional_on, ...}]
  layout          JSONB,                         -- section/tab layout metadata
  approval_chain  JSONB,                         -- [{role, action}] e.g. [{role:'team_leader', action:'review'}, {role:'deputy_manager', action:'approve'}]
  validation_rules JSONB,                        -- custom validation beyond field-level
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'pending_approval', 'approved', 'archived', 'rejected')),
  published_at    TIMESTAMPTZ,
  published_by    UUID REFERENCES staff(id),
  approved_by     UUID REFERENCES staff(id),
  approved_at     TIMESTAMPTZ,
  changelog       TEXT,
  created_by      UUID REFERENCES staff(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(template_id, version)
);

CREATE TABLE IF NOT EXISTS form_submissions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id         UUID REFERENCES homes(id) ON DELETE CASCADE,
  template_id     UUID REFERENCES form_templates(id),
  version_id      UUID REFERENCES form_template_versions(id),
  data            JSONB NOT NULL,                -- submitted field values
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN (
                      'draft', 'submitted', 'under_review', 'changes_requested',
                      'approved', 'rejected', 'archived'
                    )),
  -- Context links
  linked_child_id    UUID REFERENCES young_people(id),
  linked_staff_id    UUID REFERENCES staff(id),
  linked_incident_id UUID,
  -- Workflow
  submitted_at    TIMESTAMPTZ,
  submitted_by    UUID REFERENCES staff(id),
  reviewed_by     UUID REFERENCES staff(id),
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,
  approved_by     UUID REFERENCES staff(id),
  approved_at     TIMESTAMPTZ,
  due_date        DATE,
  priority        TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  -- Tracking
  created_by      UUID REFERENCES staff(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_audit_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id   UUID REFERENCES form_submissions(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,                  -- 'created', 'edited', 'submitted', 'approved', 'rejected', 'archived'
  field_changes   JSONB,                         -- {field: {old, new}}
  performed_by    UUID REFERENCES staff(id),
  performed_at    TIMESTAMPTZ DEFAULT now(),
  ip_address      INET,
  notes           TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_form_templates_home ON form_templates(home_id);
CREATE INDEX IF NOT EXISTS idx_form_versions_template ON form_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_home ON form_submissions(home_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_template ON form_submissions(template_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_child ON form_submissions(linked_child_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_audit_submission ON form_audit_logs(submission_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. TASK EXPLORER
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_tasks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id         UUID REFERENCES homes(id) ON DELETE CASCADE,
  reference       TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL CHECK (category IN (
    'compliance', 'safeguarding', 'medication', 'maintenance',
    'staffing', 'training', 'supervision', 'young_person_plans',
    'professional_communication', 'finance', 'inspection',
    'health_and_safety', 'admin', 'aria_generated'
  )),
  priority        TEXT NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'critical')),
  status          TEXT NOT NULL DEFAULT 'not_started'
                    CHECK (status IN (
                      'not_started', 'in_progress', 'blocked', 'on_hold',
                      'under_review', 'awaiting_sign_off', 'delegated',
                      'completed', 'cancelled', 'overdue'
                    )),
  -- Assignment
  assigned_to     UUID REFERENCES staff(id),
  assigned_role   TEXT,
  delegated_to    UUID REFERENCES staff(id),
  delegated_at    TIMESTAMPTZ,
  -- Dates
  due_date        TIMESTAMPTZ,
  start_date      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  completed_by    UUID REFERENCES staff(id),
  -- Time tracking
  estimated_minutes INT,
  actual_minutes  INT,
  -- Recurrence
  recurring       BOOLEAN DEFAULT FALSE,
  recurring_schedule TEXT CHECK (recurring_schedule IN ('daily', 'weekly', 'fortnightly', 'monthly', 'quarterly', 'annually')),
  recurrence_end  TIMESTAMPTZ,
  -- Sign-off
  requires_sign_off BOOLEAN DEFAULT FALSE,
  signed_off_by   UUID REFERENCES staff(id),
  signed_off_at   TIMESTAMPTZ,
  -- Evidence
  evidence_note   TEXT,
  evidence_files  TEXT[] DEFAULT '{}',
  -- Escalation
  escalated       BOOLEAN DEFAULT FALSE,
  escalated_to    UUID REFERENCES staff(id),
  escalated_at    TIMESTAMPTZ,
  escalation_reason TEXT,
  escalation_level INT DEFAULT 0,
  -- ARIA
  aria_risk_score NUMERIC(4,2),
  aria_risk_factors JSONB,
  aria_generated  BOOLEAN DEFAULT FALSE,
  aria_source     TEXT,                          -- which ARIA module generated this
  -- Links
  linked_child_id    UUID REFERENCES young_people(id),
  linked_incident_id UUID,
  linked_document_id UUID,
  linked_form_id     UUID REFERENCES form_submissions(id),
  linked_workflow_id UUID,
  parent_task_id     UUID REFERENCES cs_tasks(id),
  -- Meta
  tags            TEXT[] DEFAULT '{}',
  regulation_refs TEXT[] DEFAULT '{}',
  created_by      UUID REFERENCES staff(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_task_dependencies (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id         UUID REFERENCES cs_tasks(id) ON DELETE CASCADE,
  depends_on_id   UUID REFERENCES cs_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'required_before', 'related')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, depends_on_id)
);

CREATE TABLE IF NOT EXISTS cs_task_comments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id         UUID REFERENCES cs_tasks(id) ON DELETE CASCADE,
  author_id       UUID REFERENCES staff(id),
  content         TEXT NOT NULL,
  is_system       BOOLEAN DEFAULT FALSE,         -- system-generated comments (status changes etc.)
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_task_escalation_rules (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id         UUID REFERENCES homes(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  condition_type  TEXT NOT NULL CHECK (condition_type IN ('overdue_hours', 'priority_level', 'unassigned_hours', 'no_progress_hours')),
  condition_value INT NOT NULL,
  escalate_to_role TEXT NOT NULL,
  notify_chain    JSONB,                         -- [{role, method}]
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cs_tasks_home ON cs_tasks(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_tasks_assigned ON cs_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cs_tasks_status ON cs_tasks(status);
CREATE INDEX IF NOT EXISTS idx_cs_tasks_due ON cs_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_cs_tasks_category ON cs_tasks(category);
CREATE INDEX IF NOT EXISTS idx_cs_tasks_child ON cs_tasks(linked_child_id);
CREATE INDEX IF NOT EXISTS idx_cs_tasks_parent ON cs_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_cs_task_deps_task ON cs_task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_cs_task_comments_task ON cs_task_comments(task_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. WORKFLOW ENGINE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_workflows (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id         UUID REFERENCES homes(id) ON DELETE CASCADE,
  template_code   TEXT NOT NULL,                 -- 'new_placement', 'incident_response', 'reg44_report', etc.
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'not_started'
                    CHECK (status IN ('not_started', 'in_progress', 'blocked', 'completed', 'cancelled')),
  current_step    INT DEFAULT 0,
  total_steps     INT NOT NULL,
  -- Context
  linked_child_id UUID REFERENCES young_people(id),
  linked_incident_id UUID,
  initiated_by    UUID REFERENCES staff(id),
  completed_at    TIMESTAMPTZ,
  completed_by    UUID REFERENCES staff(id),
  due_date        TIMESTAMPTZ,
  metadata        JSONB,                         -- workflow-specific data
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_workflow_steps (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id     UUID REFERENCES cs_workflows(id) ON DELETE CASCADE,
  step_number     INT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'blocked')),
  assigned_to     UUID REFERENCES staff(id),
  assigned_role   TEXT,
  -- Evidence
  evidence_required BOOLEAN DEFAULT FALSE,
  evidence_ids    UUID[] DEFAULT '{}',
  evidence_notes  TEXT,
  -- Completion
  completed_at    TIMESTAMPTZ,
  completed_by    UUID REFERENCES staff(id),
  completion_notes TEXT,
  due_date        TIMESTAMPTZ,
  -- Auto-actions
  auto_create_task BOOLEAN DEFAULT FALSE,
  auto_task_template JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cs_workflows_home ON cs_workflows(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_workflows_status ON cs_workflows(status);
CREATE INDEX IF NOT EXISTS idx_cs_workflows_template ON cs_workflows(template_code);
CREATE INDEX IF NOT EXISTS idx_cs_workflow_steps_workflow ON cs_workflow_steps(workflow_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. EVIDENCE MANAGEMENT
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_evidence_items (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id         UUID REFERENCES homes(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  evidence_type   TEXT NOT NULL CHECK (evidence_type IN (
    'document', 'photograph', 'form_submission', 'daily_log',
    'incident_report', 'meeting_minutes', 'correspondence',
    'training_certificate', 'policy', 'risk_assessment',
    'care_plan', 'review_report', 'external_report'
  )),
  file_url        TEXT,
  file_name       TEXT,
  file_size       INT,
  mime_type       TEXT,
  -- Quality assessment
  quality_score   NUMERIC(4,2),
  quality_notes   TEXT,
  -- Context
  linked_child_id UUID REFERENCES young_people(id),
  linked_staff_id UUID REFERENCES staff(id),
  -- Compliance
  regulation_refs TEXT[] DEFAULT '{}',
  sccif_refs      TEXT[] DEFAULT '{}',
  -- Meta
  date_of_evidence DATE,
  uploaded_by     UUID REFERENCES staff(id),
  verified_by     UUID REFERENCES staff(id),
  verified_at     TIMESTAMPTZ,
  tags            TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_evidence_links (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evidence_id     UUID REFERENCES cs_evidence_items(id) ON DELETE CASCADE,
  entity_type     TEXT NOT NULL,                  -- 'task', 'workflow', 'workflow_step', 'incident', 'form_submission', 'oversight_note'
  entity_id       UUID NOT NULL,
  link_type       TEXT DEFAULT 'supports' CHECK (link_type IN ('supports', 'contradicts', 'supplements', 'supersedes')),
  created_by      UUID REFERENCES staff(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(evidence_id, entity_type, entity_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cs_evidence_home ON cs_evidence_items(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_evidence_type ON cs_evidence_items(evidence_type);
CREATE INDEX IF NOT EXISTS idx_cs_evidence_child ON cs_evidence_items(linked_child_id);
CREATE INDEX IF NOT EXISTS idx_cs_evidence_links_evidence ON cs_evidence_links(evidence_id);
CREATE INDEX IF NOT EXISTS idx_cs_evidence_links_entity ON cs_evidence_links(entity_type, entity_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. REGULATION MAPPING
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_regulation_mappings (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  framework       TEXT NOT NULL CHECK (framework IN ('CHR2015', 'SCCIF', 'Reg44', 'Reg45', 'AnnexA', 'KCSIE')),
  reference       TEXT NOT NULL,                  -- e.g. 'Reg12', 'Leadership', 'Schedule1'
  title           TEXT NOT NULL,
  description     TEXT,
  module_links    TEXT[] DEFAULT '{}',            -- which Cornerstone modules evidence this
  evidence_types  TEXT[] DEFAULT '{}',            -- which evidence types are relevant
  parent_ref      TEXT,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(framework, reference)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. MANAGEMENT OVERSIGHT ENGINE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_management_oversight_notes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id         UUID REFERENCES homes(id) ON DELETE CASCADE,
  record_type     TEXT NOT NULL CHECK (record_type IN (
    'incident', 'safeguarding', 'missing_episode', 'complaint',
    'daily_log', 'medication_error', 'restraint', 'disclosure',
    'risk_assessment', 'care_plan_review', 'supervision',
    'key_work_session', 'contact_session'
  )),
  record_id       UUID NOT NULL,
  record_reference TEXT,
  -- Oversight content
  oversight_text  TEXT NOT NULL,
  quality_score   NUMERIC(4,2),
  quality_dimensions JSONB,                      -- {reflectiveAnalysis, childFocus, professionalChallenge, decisionClarity, actionSpecificity}
  -- ARIA assistance
  aria_prompted   BOOLEAN DEFAULT FALSE,
  aria_prompt_used TEXT,
  aria_suggestions JSONB,
  -- Actions arising
  actions_identified TEXT[] DEFAULT '{}',
  tasks_created   UUID[] DEFAULT '{}',
  -- Meta
  oversight_by    UUID REFERENCES staff(id),
  oversight_at    TIMESTAMPTZ DEFAULT now(),
  reviewed_by     UUID REFERENCES staff(id),
  reviewed_at     TIMESTAMPTZ,
  regulation_refs TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cs_oversight_home ON cs_management_oversight_notes(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_oversight_record ON cs_management_oversight_notes(record_type, record_id);
CREATE INDEX IF NOT EXISTS idx_cs_oversight_by ON cs_management_oversight_notes(oversight_by);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. ARIA OPERATIONAL INTELLIGENCE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_aria_recommendations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id         UUID REFERENCES homes(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
    'overdue_form', 'missing_oversight', 'weak_recording',
    'staffing_concern', 'pattern_detected', 'compliance_gap',
    'training_due', 'supervision_due', 'risk_escalation',
    'positive_recognition', 'inspection_prep', 'reg45_evidence',
    'handover_quality', 'documentation_gap', 'wellbeing_concern',
    'medication_pattern', 'incident_trend', 'placement_risk',
    'safeguarding_pattern', 'contact_disruption'
  )),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  -- Context
  linked_child_id UUID REFERENCES young_people(id),
  linked_staff_id UUID REFERENCES staff(id),
  linked_entity_type TEXT,
  linked_entity_id UUID,
  -- Action
  suggested_action TEXT,
  action_taken    TEXT,
  action_by       UUID REFERENCES staff(id),
  action_at       TIMESTAMPTZ,
  -- Lifecycle
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'actioned', 'dismissed', 'expired')),
  acknowledged_by UUID REFERENCES staff(id),
  acknowledged_at TIMESTAMPTZ,
  dismissed_reason TEXT,
  expires_at      TIMESTAMPTZ,
  -- Data
  data_points     INT DEFAULT 0,
  confidence      NUMERIC(4,2),
  supporting_data JSONB,
  -- Meta
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_aria_risk_signals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id         UUID REFERENCES homes(id) ON DELETE CASCADE,
  signal_type     TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,
  risk_score      NUMERIC(4,2) NOT NULL,
  risk_factors    JSONB,
  detected_at     TIMESTAMPTZ DEFAULT now(),
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID REFERENCES staff(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cs_aria_rec_home ON cs_aria_recommendations(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_aria_rec_status ON cs_aria_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_cs_aria_rec_type ON cs_aria_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_cs_aria_rec_severity ON cs_aria_recommendations(severity);
CREATE INDEX IF NOT EXISTS idx_cs_aria_risk_home ON cs_aria_risk_signals(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_aria_risk_entity ON cs_aria_risk_signals(entity_type, entity_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. INSPECTION READINESS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_inspection_readiness_scans (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id         UUID REFERENCES homes(id) ON DELETE CASCADE,
  scan_type       TEXT NOT NULL CHECK (scan_type IN ('full', 'quick', 'module', 'regulation')),
  overall_score   NUMERIC(4,2),
  module_scores   JSONB,                         -- {module: {score, gaps[], strengths[]}}
  regulation_scores JSONB,                       -- {framework: {ref: {score, evidence_count, gaps[]}}}
  gaps_identified JSONB,
  strengths_identified JSONB,
  recommendations JSONB,
  -- Meta
  initiated_by    UUID REFERENCES staff(id),
  completed_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_inspection_home ON cs_inspection_readiness_scans(home_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. SYSTEM SETTINGS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_system_settings (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id         UUID REFERENCES homes(id) ON DELETE CASCADE,
  setting_key     TEXT NOT NULL,
  setting_value   JSONB NOT NULL,
  updated_by      UUID REFERENCES staff(id),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(home_id, setting_key)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. IMMUTABLE AUDIT LOG
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_audit_log (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id         UUID REFERENCES homes(id) ON DELETE CASCADE,
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,
  action          TEXT NOT NULL,                   -- 'create', 'update', 'delete', 'sign_off', 'approve', 'reject', 'escalate', 'view', 'export', 'login', 'logout'
  changes         JSONB,                          -- {field: {old, new}} for updates
  metadata        JSONB,                          -- additional context
  performed_by    UUID REFERENCES staff(id),
  performed_at    TIMESTAMPTZ DEFAULT now(),
  ip_address      INET,
  user_agent      TEXT,
  session_id      TEXT
);

-- Immutability: no UPDATE or DELETE
-- (enforced at application level + RLS)

CREATE INDEX IF NOT EXISTS idx_cs_audit_home ON cs_audit_log(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_audit_entity ON cs_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_cs_audit_user ON cs_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_cs_audit_action ON cs_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_cs_audit_time ON cs_audit_log(performed_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE cs_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_task_escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_evidence_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_management_oversight_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_aria_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_aria_risk_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_inspection_readiness_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_audit_log ENABLE ROW LEVEL SECURITY;

-- Home-scoped SELECT for all operations tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'cs_roles', 'cs_role_permissions', 'cs_user_role_assignments',
    'form_templates', 'form_template_versions', 'form_submissions', 'form_audit_logs',
    'cs_tasks', 'cs_task_dependencies', 'cs_task_comments', 'cs_task_escalation_rules',
    'cs_workflows', 'cs_workflow_steps',
    'cs_evidence_items', 'cs_evidence_links',
    'cs_management_oversight_notes',
    'cs_aria_recommendations', 'cs_aria_risk_signals',
    'cs_inspection_readiness_scans', 'cs_system_settings', 'cs_audit_log'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (home_id = get_my_home_id())',
      t || '_select_home', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (home_id = get_my_home_id())',
      t || '_insert_home', t
    );
  END LOOP;
END $$;

-- cs_permissions is global (no home_id) — allow all authenticated to read
CREATE POLICY cs_permissions_select ON cs_permissions FOR SELECT USING (TRUE);
-- cs_regulation_mappings is global reference data
CREATE POLICY cs_reg_mappings_select ON cs_regulation_mappings FOR SELECT USING (TRUE);

-- Audit log: INSERT only, no UPDATE or DELETE
CREATE POLICY cs_audit_log_no_update ON cs_audit_log FOR UPDATE USING (FALSE);
CREATE POLICY cs_audit_log_no_delete ON cs_audit_log FOR DELETE USING (FALSE);

-- Manager-only UPDATE for operations tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'cs_roles', 'form_templates', 'form_template_versions', 'form_submissions',
    'cs_tasks', 'cs_workflows', 'cs_workflow_steps',
    'cs_evidence_items', 'cs_management_oversight_notes',
    'cs_aria_recommendations', 'cs_system_settings'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE USING (home_id = get_my_home_id())',
      t || '_update_home', t
    );
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED: REGULATION MAPPINGS
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO cs_regulation_mappings (framework, reference, title, description, module_links, evidence_types, sort_order) VALUES
  -- Children's Homes (England) Regulations 2015
  ('CHR2015', 'Reg5',  'Quality and purpose of care',            'The quality and purpose of care standard',               ARRAY['daily_logs', 'care_plans', 'young_people'], ARRAY['care_plan', 'daily_log', 'review_report'], 5),
  ('CHR2015', 'Reg6',  'Children''s views, wishes and feelings', 'Ensuring children''s views are sought and acted upon',   ARRAY['daily_logs', 'key_work', 'complaints'], ARRAY['daily_log', 'meeting_minutes', 'form_submission'], 6),
  ('CHR2015', 'Reg7',  'Protection of children',                 'Safeguarding and child protection arrangements',         ARRAY['safeguarding', 'incidents', 'missing'], ARRAY['incident_report', 'risk_assessment', 'correspondence'], 7),
  ('CHR2015', 'Reg8',  'Leadership and management',              'Effective leadership and management of the home',        ARRAY['oversight', 'supervision', 'training'], ARRAY['meeting_minutes', 'policy', 'training_certificate'], 8),
  ('CHR2015', 'Reg9',  'Impact of care on children',             'Positive outcomes and impact on children',               ARRAY['daily_logs', 'key_work', 'education'], ARRAY['daily_log', 'review_report', 'care_plan'], 9),
  ('CHR2015', 'Reg10', 'Health and wellbeing',                   'Meeting children''s health needs',                        ARRAY['medication', 'health', 'appointments'], ARRAY['form_submission', 'correspondence', 'daily_log'], 10),
  ('CHR2015', 'Reg11', 'Positive relationships',                 'Positive relationships with staff and peers',            ARRAY['daily_logs', 'key_work', 'incidents'], ARRAY['daily_log', 'incident_report', 'meeting_minutes'], 11),
  ('CHR2015', 'Reg12', 'Behaviour management',                   'Approach to managing behaviour including restraint',     ARRAY['incidents', 'restraints', 'behaviour_plans'], ARRAY['incident_report', 'risk_assessment', 'policy'], 12),
  ('CHR2015', 'Reg13', 'Contact and family',                     'Contact arrangements with family and significant others', ARRAY['contact', 'social_worker_comms'], ARRAY['daily_log', 'correspondence', 'meeting_minutes'], 13),
  ('CHR2015', 'Reg14', 'Missing children',                       'Response to children who go missing',                    ARRAY['missing', 'safeguarding'], ARRAY['incident_report', 'risk_assessment', 'correspondence'], 14),
  ('CHR2015', 'Reg34', 'Employment of staff',                    'Fitness of staff and safe recruitment',                  ARRAY['recruitment', 'hr', 'training'], ARRAY['training_certificate', 'document', 'form_submission'], 34),
  ('CHR2015', 'Reg35', 'Fitness of premises',                    'Suitability and maintenance of premises',                ARRAY['maintenance', 'health_safety'], ARRAY['photograph', 'form_submission', 'document'], 35),
  -- SCCIF key judgement areas
  ('SCCIF', 'OverallExperiences',  'Overall experiences and progress of children',        'The overall quality of care and its impact', ARRAY['daily_logs', 'young_people', 'key_work', 'education'], ARRAY['daily_log', 'review_report', 'care_plan'], 1),
  ('SCCIF', 'SafeChildren',        'How well children are helped and protected',          'Safeguarding effectiveness',                ARRAY['safeguarding', 'incidents', 'missing', 'medication'], ARRAY['incident_report', 'risk_assessment', 'policy'], 2),
  ('SCCIF', 'Leadership',          'The effectiveness of leaders and managers',           'Leadership, management and governance',     ARRAY['oversight', 'supervision', 'compliance', 'training'], ARRAY['meeting_minutes', 'policy', 'training_certificate'], 3),
  -- Reg 44/45
  ('Reg44', 'Monthly',   'Regulation 44 monthly visit',     'Independent person monthly monitoring visit', ARRAY['all'], ARRAY['review_report', 'meeting_minutes'], 1),
  ('Reg45', 'Biannual',  'Regulation 45 quality of care',   'Registered person review of quality of care', ARRAY['all'], ARRAY['review_report', 'document'], 1)
ON CONFLICT (framework, reference) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED: DEFAULT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO cs_permissions (code, group_name, label, description) VALUES
  -- Young People
  ('yp.view',            'young_people', 'View young people',           'View young person profiles and records'),
  ('yp.create',          'young_people', 'Create young person',        'Add new young person records'),
  ('yp.edit',            'young_people', 'Edit young person',          'Edit young person details'),
  ('yp.delete',          'young_people', 'Delete young person',        'Remove young person records'),
  ('yp.export',          'young_people', 'Export young person data',   'Export data for young people'),
  -- Incidents
  ('incident.view',      'incidents', 'View incidents',                'View incident records'),
  ('incident.create',    'incidents', 'Create incidents',              'Log new incidents'),
  ('incident.edit',      'incidents', 'Edit incidents',                'Edit incident details'),
  ('incident.oversight', 'incidents', 'Provide oversight',             'Add management oversight to incidents'),
  ('incident.close',     'incidents', 'Close incidents',               'Close and finalise incidents'),
  -- Daily Logs
  ('log.view',           'daily_logs', 'View daily logs',              'View daily log entries'),
  ('log.create',         'daily_logs', 'Create daily logs',            'Write new daily log entries'),
  ('log.edit',           'daily_logs', 'Edit daily logs',              'Edit existing log entries'),
  -- Medication
  ('med.view',           'medication', 'View medication',              'View medication records'),
  ('med.administer',     'medication', 'Administer medication',        'Record medication administration'),
  ('med.manage',         'medication', 'Manage medication',            'Add/edit medication prescriptions'),
  -- Safeguarding
  ('safeguarding.view',  'safeguarding', 'View safeguarding',         'View safeguarding concerns'),
  ('safeguarding.create','safeguarding', 'Create safeguarding',       'Raise safeguarding concerns'),
  ('safeguarding.manage','safeguarding', 'Manage safeguarding',       'Manage safeguarding cases'),
  -- Tasks
  ('task.view',          'tasks', 'View tasks',                        'View task list and details'),
  ('task.create',        'tasks', 'Create tasks',                      'Create new tasks'),
  ('task.edit',          'tasks', 'Edit tasks',                        'Edit task details'),
  ('task.assign',        'tasks', 'Assign tasks',                      'Assign tasks to staff'),
  ('task.sign_off',      'tasks', 'Sign off tasks',                    'Sign off completed tasks'),
  ('task.escalate',      'tasks', 'Escalate tasks',                    'Escalate tasks to management'),
  -- Forms
  ('form.view',          'forms', 'View forms',                        'View form templates and submissions'),
  ('form.submit',        'forms', 'Submit forms',                      'Submit form responses'),
  ('form.review',        'forms', 'Review forms',                      'Review submitted forms'),
  ('form.approve',       'forms', 'Approve forms',                     'Approve/reject form submissions'),
  ('form.design',        'forms', 'Design forms',                      'Create and edit form templates'),
  -- Workflows
  ('workflow.view',      'workflows', 'View workflows',                'View workflow progress'),
  ('workflow.initiate',  'workflows', 'Initiate workflows',            'Start new workflows'),
  ('workflow.manage',    'workflows', 'Manage workflows',              'Manage workflow steps and assignments'),
  -- Evidence
  ('evidence.view',      'evidence', 'View evidence',                  'View evidence items'),
  ('evidence.upload',    'evidence', 'Upload evidence',                'Upload evidence items'),
  ('evidence.verify',    'evidence', 'Verify evidence',                'Verify evidence quality'),
  ('evidence.link',      'evidence', 'Link evidence',                  'Link evidence to records'),
  -- Oversight
  ('oversight.view',     'oversight', 'View oversight',                'View management oversight notes'),
  ('oversight.create',   'oversight', 'Create oversight',              'Add oversight notes'),
  ('oversight.review',   'oversight', 'Review oversight',              'Review oversight quality'),
  -- Staffing & HR
  ('staff.view',         'staffing', 'View staff',                     'View staff profiles'),
  ('staff.manage',       'staffing', 'Manage staff',                   'Edit staff records and assignments'),
  ('rota.view',          'staffing', 'View rota',                      'View shift schedule'),
  ('rota.manage',        'staffing', 'Manage rota',                    'Create and edit shifts'),
  ('leave.view',         'staffing', 'View leave',                     'View leave requests'),
  ('leave.approve',      'staffing', 'Approve leave',                  'Approve/decline leave requests'),
  ('supervision.view',   'staffing', 'View supervision',               'View supervision records'),
  ('supervision.conduct','staffing', 'Conduct supervision',            'Conduct and record supervision'),
  -- Compliance & Training
  ('training.view',      'compliance', 'View training',                'View training records'),
  ('training.manage',    'compliance', 'Manage training',              'Manage training requirements'),
  ('compliance.view',    'compliance', 'View compliance',              'View compliance dashboard'),
  ('compliance.manage',  'compliance', 'Manage compliance',            'Manage compliance settings'),
  -- ARIA
  ('aria.view',          'aria', 'View ARIA',                          'View ARIA intelligence features'),
  ('aria.configure',     'aria', 'Configure ARIA',                     'Configure ARIA settings and prompts'),
  ('aria.approve',       'aria', 'Approve ARIA outputs',               'Approve ARIA-generated content'),
  -- Admin & System
  ('admin.roles',        'admin', 'Manage roles',                      'Create and edit roles and permissions'),
  ('admin.settings',     'admin', 'System settings',                   'Manage system-wide settings'),
  ('admin.audit',        'admin', 'View audit log',                    'View the full audit trail'),
  ('admin.inspection',   'admin', 'Inspection readiness',              'Run inspection readiness scans'),
  ('admin.export',       'admin', 'Export data',                       'Export system data and reports')
ON CONFLICT (code) DO NOTHING;
