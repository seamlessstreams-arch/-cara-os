-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — OPERATIONS LAYER (promoted: 17 queried tables)
-- Tasks/workflows, forms, evidence, oversight, inspection-readiness, settings,
-- audit log, regulation mappings. The 6 non-queried RBAC/aria tables are not
-- promoted. RLS redesigned: home-scoped tenant policies for owner tables,
-- parent-scoped EXISTS policies for child/link tables (no home_id column),
-- append-only audit log, global-read regulation reference. All idempotent.
-- ═══════════════════════════════════════════════════════════════════════════════

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
  created_by      UUID REFERENCES staff_members(id),
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
  published_by    UUID REFERENCES staff_members(id),
  approved_by     UUID REFERENCES staff_members(id),
  approved_at     TIMESTAMPTZ,
  changelog       TEXT,
  created_by      UUID REFERENCES staff_members(id),
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
  linked_staff_id    UUID REFERENCES staff_members(id),
  linked_incident_id UUID,
  -- Workflow
  submitted_at    TIMESTAMPTZ,
  submitted_by    UUID REFERENCES staff_members(id),
  reviewed_by     UUID REFERENCES staff_members(id),
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,
  approved_by     UUID REFERENCES staff_members(id),
  approved_at     TIMESTAMPTZ,
  due_date        DATE,
  priority        TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  -- Tracking
  created_by      UUID REFERENCES staff_members(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_audit_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id   UUID REFERENCES form_submissions(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,                  -- 'created', 'edited', 'submitted', 'approved', 'rejected', 'archived'
  field_changes   JSONB,                         -- {field: {old, new}}
  performed_by    UUID REFERENCES staff_members(id),
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
  assigned_to     UUID REFERENCES staff_members(id),
  assigned_role   TEXT,
  delegated_to    UUID REFERENCES staff_members(id),
  delegated_at    TIMESTAMPTZ,
  -- Dates
  due_date        TIMESTAMPTZ,
  start_date      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  completed_by    UUID REFERENCES staff_members(id),
  -- Time tracking
  estimated_minutes INT,
  actual_minutes  INT,
  -- Recurrence
  recurring       BOOLEAN DEFAULT FALSE,
  recurring_schedule TEXT CHECK (recurring_schedule IN ('daily', 'weekly', 'fortnightly', 'monthly', 'quarterly', 'annually')),
  recurrence_end  TIMESTAMPTZ,
  -- Sign-off
  requires_sign_off BOOLEAN DEFAULT FALSE,
  signed_off_by   UUID REFERENCES staff_members(id),
  signed_off_at   TIMESTAMPTZ,
  -- Evidence
  evidence_note   TEXT,
  evidence_files  TEXT[] DEFAULT '{}',
  -- Escalation
  escalated       BOOLEAN DEFAULT FALSE,
  escalated_to    UUID REFERENCES staff_members(id),
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
  created_by      UUID REFERENCES staff_members(id),
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
  author_id       UUID REFERENCES staff_members(id),
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
  initiated_by    UUID REFERENCES staff_members(id),
  completed_at    TIMESTAMPTZ,
  completed_by    UUID REFERENCES staff_members(id),
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
  assigned_to     UUID REFERENCES staff_members(id),
  assigned_role   TEXT,
  -- Evidence
  evidence_required BOOLEAN DEFAULT FALSE,
  evidence_ids    UUID[] DEFAULT '{}',
  evidence_notes  TEXT,
  -- Completion
  completed_at    TIMESTAMPTZ,
  completed_by    UUID REFERENCES staff_members(id),
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
  linked_staff_id UUID REFERENCES staff_members(id),
  -- Compliance
  regulation_refs TEXT[] DEFAULT '{}',
  sccif_refs      TEXT[] DEFAULT '{}',
  -- Meta
  date_of_evidence DATE,
  uploaded_by     UUID REFERENCES staff_members(id),
  verified_by     UUID REFERENCES staff_members(id),
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
  created_by      UUID REFERENCES staff_members(id),
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
  oversight_by    UUID REFERENCES staff_members(id),
  oversight_at    TIMESTAMPTZ DEFAULT now(),
  reviewed_by     UUID REFERENCES staff_members(id),
  reviewed_at     TIMESTAMPTZ,
  regulation_refs TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cs_oversight_home ON cs_management_oversight_notes(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_oversight_record ON cs_management_oversight_notes(record_type, record_id);

CREATE INDEX IF NOT EXISTS idx_cs_oversight_by ON cs_management_oversight_notes(oversight_by);

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
  initiated_by    UUID REFERENCES staff_members(id),
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
  updated_by      UUID REFERENCES staff_members(id),
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
  performed_by    UUID REFERENCES staff_members(id),
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

-- ── RLS: tenant isolation (home-scoped for owner tables, parent-scoped for child/link tables) ──
ALTER TABLE cs_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cs_tasks_tenant ON cs_tasks;
CREATE POLICY cs_tasks_tenant ON cs_tasks FOR ALL USING (home_id = (select get_my_home_id())) WITH CHECK (home_id = (select get_my_home_id()));
ALTER TABLE cs_task_escalation_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cs_task_escalation_rules_tenant ON cs_task_escalation_rules;
CREATE POLICY cs_task_escalation_rules_tenant ON cs_task_escalation_rules FOR ALL USING (home_id = (select get_my_home_id())) WITH CHECK (home_id = (select get_my_home_id()));
ALTER TABLE cs_workflows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cs_workflows_tenant ON cs_workflows;
CREATE POLICY cs_workflows_tenant ON cs_workflows FOR ALL USING (home_id = (select get_my_home_id())) WITH CHECK (home_id = (select get_my_home_id()));
ALTER TABLE cs_evidence_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cs_evidence_items_tenant ON cs_evidence_items;
CREATE POLICY cs_evidence_items_tenant ON cs_evidence_items FOR ALL USING (home_id = (select get_my_home_id())) WITH CHECK (home_id = (select get_my_home_id()));
ALTER TABLE cs_management_oversight_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cs_management_oversight_notes_tenant ON cs_management_oversight_notes;
CREATE POLICY cs_management_oversight_notes_tenant ON cs_management_oversight_notes FOR ALL USING (home_id = (select get_my_home_id())) WITH CHECK (home_id = (select get_my_home_id()));
ALTER TABLE cs_inspection_readiness_scans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cs_inspection_readiness_scans_tenant ON cs_inspection_readiness_scans;
CREATE POLICY cs_inspection_readiness_scans_tenant ON cs_inspection_readiness_scans FOR ALL USING (home_id = (select get_my_home_id())) WITH CHECK (home_id = (select get_my_home_id()));
ALTER TABLE cs_system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cs_system_settings_tenant ON cs_system_settings;
CREATE POLICY cs_system_settings_tenant ON cs_system_settings FOR ALL USING (home_id = (select get_my_home_id())) WITH CHECK (home_id = (select get_my_home_id()));
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS form_templates_tenant ON form_templates;
CREATE POLICY form_templates_tenant ON form_templates FOR ALL USING (home_id = (select get_my_home_id())) WITH CHECK (home_id = (select get_my_home_id()));
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS form_submissions_tenant ON form_submissions;
CREATE POLICY form_submissions_tenant ON form_submissions FOR ALL USING (home_id = (select get_my_home_id())) WITH CHECK (home_id = (select get_my_home_id()));
ALTER TABLE cs_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cs_audit_log_select ON cs_audit_log;
CREATE POLICY cs_audit_log_select ON cs_audit_log FOR SELECT USING (home_id = (select get_my_home_id()));
DROP POLICY IF EXISTS cs_audit_log_insert ON cs_audit_log;
CREATE POLICY cs_audit_log_insert ON cs_audit_log FOR INSERT WITH CHECK (home_id = (select get_my_home_id()));
ALTER TABLE cs_task_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cs_task_comments_tenant ON cs_task_comments;
CREATE POLICY cs_task_comments_tenant ON cs_task_comments FOR ALL USING (EXISTS (SELECT 1 FROM cs_tasks par WHERE par.id = cs_task_comments.task_id AND par.home_id = (select get_my_home_id()))) WITH CHECK (EXISTS (SELECT 1 FROM cs_tasks par WHERE par.id = cs_task_comments.task_id AND par.home_id = (select get_my_home_id())));
ALTER TABLE cs_task_dependencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cs_task_dependencies_tenant ON cs_task_dependencies;
CREATE POLICY cs_task_dependencies_tenant ON cs_task_dependencies FOR ALL USING (EXISTS (SELECT 1 FROM cs_tasks par WHERE par.id = cs_task_dependencies.task_id AND par.home_id = (select get_my_home_id()))) WITH CHECK (EXISTS (SELECT 1 FROM cs_tasks par WHERE par.id = cs_task_dependencies.task_id AND par.home_id = (select get_my_home_id())));
ALTER TABLE cs_workflow_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cs_workflow_steps_tenant ON cs_workflow_steps;
CREATE POLICY cs_workflow_steps_tenant ON cs_workflow_steps FOR ALL USING (EXISTS (SELECT 1 FROM cs_workflows par WHERE par.id = cs_workflow_steps.workflow_id AND par.home_id = (select get_my_home_id()))) WITH CHECK (EXISTS (SELECT 1 FROM cs_workflows par WHERE par.id = cs_workflow_steps.workflow_id AND par.home_id = (select get_my_home_id())));
ALTER TABLE cs_evidence_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cs_evidence_links_tenant ON cs_evidence_links;
CREATE POLICY cs_evidence_links_tenant ON cs_evidence_links FOR ALL USING (EXISTS (SELECT 1 FROM cs_evidence_items par WHERE par.id = cs_evidence_links.evidence_id AND par.home_id = (select get_my_home_id()))) WITH CHECK (EXISTS (SELECT 1 FROM cs_evidence_items par WHERE par.id = cs_evidence_links.evidence_id AND par.home_id = (select get_my_home_id())));
ALTER TABLE form_template_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS form_template_versions_tenant ON form_template_versions;
CREATE POLICY form_template_versions_tenant ON form_template_versions FOR ALL USING (EXISTS (SELECT 1 FROM form_templates par WHERE par.id = form_template_versions.template_id AND par.home_id = (select get_my_home_id()))) WITH CHECK (EXISTS (SELECT 1 FROM form_templates par WHERE par.id = form_template_versions.template_id AND par.home_id = (select get_my_home_id())));
ALTER TABLE form_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS form_audit_logs_tenant ON form_audit_logs;
CREATE POLICY form_audit_logs_tenant ON form_audit_logs FOR ALL USING (EXISTS (SELECT 1 FROM form_submissions par WHERE par.id = form_audit_logs.submission_id AND par.home_id = (select get_my_home_id()))) WITH CHECK (EXISTS (SELECT 1 FROM form_submissions par WHERE par.id = form_audit_logs.submission_id AND par.home_id = (select get_my_home_id())));
ALTER TABLE cs_regulation_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cs_reg_mappings_read ON cs_regulation_mappings;
CREATE POLICY cs_reg_mappings_read ON cs_regulation_mappings FOR SELECT USING (true);

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
