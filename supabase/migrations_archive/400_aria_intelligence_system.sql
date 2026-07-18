-- ══════════════════════════════════════════════════════════════════════════════
-- Aria Intelligence — Database Schema
--
-- Production tables for AI governance, audit, approvals, evidence,
-- cost tracking, and safety events.
--
-- UK GDPR compliant. Row-level security applied.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Providers & Configuration ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  provider_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  api_key_set BOOLEAN DEFAULT false,  -- never store actual key here
  endpoint_url TEXT,
  deployment_name TEXT,
  governance_level TEXT DEFAULT 'standard' CHECK (governance_level IN ('standard', 'enterprise', 'sovereign')),
  data_residency TEXT[] DEFAULT '{}',
  max_sensitivity TEXT DEFAULT 'internal',
  cost_multiplier DECIMAL(4,2) DEFAULT 1.00,
  rate_limit_rpm INTEGER DEFAULT 60,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS aria_ai_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  provider_id UUID REFERENCES aria_ai_providers(id),
  model_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  max_context_tokens INTEGER DEFAULT 128000,
  max_output_tokens INTEGER DEFAULT 4096,
  cost_per_1k_input DECIMAL(8,6) DEFAULT 0.002,
  cost_per_1k_output DECIMAL(8,6) DEFAULT 0.008,
  supports_streaming BOOLEAN DEFAULT true,
  supports_json BOOLEAN DEFAULT true,
  supports_vision BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aria_ai_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  task_type TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  provider_name TEXT NOT NULL,
  model_id TEXT,
  min_risk_level TEXT DEFAULT 'low',
  max_risk_level TEXT DEFAULT 'critical',
  allowed_sensitivities TEXT[] DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI Requests & Outputs ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  home_id UUID,
  child_id UUID,
  staff_id UUID,
  user_id UUID NOT NULL,
  task_type TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  sensitivity_level TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,          -- SHA256 hash, never raw prompt
  redaction_applied BOOLEAN DEFAULT false,
  items_redacted INTEGER DEFAULT 0,
  approval_required BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'blocked')),
  error_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aria_ai_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES aria_ai_requests(id),
  organisation_id UUID NOT NULL,
  output_hash TEXT NOT NULL,
  output_text TEXT,                    -- stored only if admin-configured
  structured_output JSONB,
  token_usage_input INTEGER DEFAULT 0,
  token_usage_output INTEGER DEFAULT 0,
  token_usage_total INTEGER DEFAULT 0,
  estimated_cost_gbp DECIMAL(8,6) DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  finish_reason TEXT,
  model_version TEXT,
  approval_status TEXT DEFAULT 'draft_ai_generated',
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  limitations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Audit Logs ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  home_id UUID,
  child_id UUID,
  staff_id UUID,
  user_id UUID NOT NULL,
  task_type TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  sensitivity_level TEXT NOT NULL,
  redaction_applied BOOLEAN DEFAULT false,
  approval_required BOOLEAN DEFAULT false,
  prompt_hash TEXT NOT NULL,
  output_hash TEXT,
  token_usage_input INTEGER DEFAULT 0,
  token_usage_output INTEGER DEFAULT 0,
  token_usage_total INTEGER DEFAULT 0,
  estimated_cost_gbp DECIMAL(8,6) DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'blocked', 'timeout', 'rate_limited')),
  error_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aria_audit_org_date ON aria_ai_audit_logs(organisation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aria_audit_user ON aria_ai_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aria_audit_task ON aria_ai_audit_logs(task_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aria_audit_child ON aria_ai_audit_logs(child_id, created_at DESC) WHERE child_id IS NOT NULL;

-- ── Approvals ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_ai_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  home_id UUID,
  child_id UUID,
  request_id UUID REFERENCES aria_ai_requests(id),
  output_id UUID REFERENCES aria_ai_outputs(id),
  task_type TEXT NOT NULL,
  generated_by_model TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  sensitivity_level TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  redaction_applied BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft_ai_generated' CHECK (status IN (
    'draft_ai_generated', 'pending_review', 'approved', 'rejected', 'amended_by_human', 'archived'
  )),
  generated_at TIMESTAMPTZ NOT NULL,
  submitted_for_review_at TIMESTAMPTZ,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  approval_notes TEXT,
  finalised_by UUID,
  finalised_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aria_approvals_pending ON aria_ai_approvals(organisation_id, status) WHERE status IN ('draft_ai_generated', 'pending_review');
CREATE INDEX IF NOT EXISTS idx_aria_approvals_home ON aria_ai_approvals(home_id, status) WHERE home_id IS NOT NULL;

-- ── Redaction Maps ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_ai_redaction_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES aria_ai_requests(id),
  organisation_id UUID NOT NULL,
  placeholder TEXT NOT NULL,
  category TEXT NOT NULL,
  original_length INTEGER NOT NULL,  -- never store actual values
  position_start INTEGER,
  position_end INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Safety Events ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_ai_safety_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  home_id UUID,
  child_id UUID,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'sensitive_data_detected', 'unsafe_routing_blocked', 'provider_blocked',
    'redaction_failure', 'approval_bypassed_attempt', 'role_permission_denied',
    'cost_limit_exceeded', 'critical_escalation', 'provider_error', 'data_residency_violation'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  task_type TEXT,
  provider_name TEXT,
  blocked BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aria_safety_org ON aria_ai_safety_events(organisation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aria_safety_severity ON aria_ai_safety_events(severity, created_at DESC) WHERE severity IN ('high', 'critical');

-- ── Cost Usage ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_ai_cost_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  home_id UUID,
  user_id UUID,
  provider_name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_gbp DECIMAL(8,6) DEFAULT 0,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aria_cost_org_date ON aria_ai_cost_usage(organisation_id, usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_aria_cost_home_date ON aria_ai_cost_usage(home_id, usage_date DESC) WHERE home_id IS NOT NULL;

-- ── Evidence Index ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_ai_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  home_id UUID,
  child_id UUID,
  staff_id UUID,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  title TEXT NOT NULL,
  content_summary TEXT,
  embedding vector(1024),            -- Voyage AI dimension
  source_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aria_embeddings_org ON aria_ai_embeddings(organisation_id, source_type);
CREATE INDEX IF NOT EXISTS idx_aria_embeddings_child ON aria_ai_embeddings(child_id, source_type) WHERE child_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS aria_ai_evidence_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  home_id UUID,
  child_id UUID,
  staff_id UUID,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  title TEXT NOT NULL,
  content_preview TEXT,
  source_date DATE,
  tags TEXT[] DEFAULT '{}',
  quality_standard_refs TEXT[] DEFAULT '{}',
  is_reportable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_aria_evidence_org_type ON aria_ai_evidence_index(organisation_id, source_type, source_date DESC);
CREATE INDEX IF NOT EXISTS idx_aria_evidence_child ON aria_ai_evidence_index(child_id, source_date DESC) WHERE child_id IS NOT NULL;

-- ── Studio Sessions & Resources ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_studio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  home_id UUID NOT NULL,
  child_id UUID NOT NULL,
  staff_id UUID,
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL,
  session_title TEXT NOT NULL,
  purpose TEXT,
  intended_outcome TEXT,
  materials_needed TEXT[] DEFAULT '{}',
  preparation_notes TEXT,
  opening_script TEXT,
  main_activity TEXT,
  reflective_questions TEXT[] DEFAULT '{}',
  closing_activity TEXT,
  risk_considerations TEXT[] DEFAULT '{}',
  staff_guidance TEXT,
  adaptations TEXT[] DEFAULT '{}',
  recording_prompts TEXT[] DEFAULT '{}',
  follow_up_actions TEXT[] DEFAULT '{}',
  care_plan_links TEXT[] DEFAULT '{}',
  quality_standards_mapping TEXT[] DEFAULT '{}',
  provider_name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  approval_status TEXT DEFAULT 'draft_ai_generated',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_aria_studio_child ON aria_studio_sessions(child_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aria_studio_home ON aria_studio_sessions(home_id, created_at DESC);

CREATE TABLE IF NOT EXISTS aria_studio_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  home_id UUID,
  child_id UUID,
  resource_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  structured_content JSONB,
  provider_name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  approval_status TEXT DEFAULT 'draft_ai_generated',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ── QA Reviews & Actions ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_qa_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  home_id UUID NOT NULL,
  child_id UUID,
  record_id UUID NOT NULL,
  record_type TEXT NOT NULL,
  qa_score INTEGER NOT NULL CHECK (qa_score >= 0 AND qa_score <= 100),
  strengths TEXT[] DEFAULT '{}',
  concerns TEXT[] DEFAULT '{}',
  required_actions TEXT[] DEFAULT '{}',
  suggested_oversight_note TEXT,
  suggested_staff_feedback TEXT,
  related_evidence TEXT[] DEFAULT '{}',
  escalation_level TEXT NOT NULL CHECK (escalation_level IN ('low', 'medium', 'high', 'critical')),
  escalation_recommendation TEXT,
  provider_name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  approval_status TEXT DEFAULT 'draft_ai_generated',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aria_qa_home ON aria_qa_reviews(home_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aria_qa_escalation ON aria_qa_reviews(escalation_level, created_at DESC) WHERE escalation_level IN ('high', 'critical');

CREATE TABLE IF NOT EXISTS aria_qa_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES aria_qa_reviews(id),
  organisation_id UUID NOT NULL,
  home_id UUID,
  action_text TEXT NOT NULL,
  assigned_to UUID,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  completed_by UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row-Level Security ────────────────────────────────────────────────────

ALTER TABLE aria_ai_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_ai_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_ai_safety_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_ai_cost_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_studio_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_qa_reviews ENABLE ROW LEVEL SECURITY;

-- Policies: users can only see records from their organisation
CREATE POLICY aria_audit_org_policy ON aria_ai_audit_logs
  FOR ALL USING (organisation_id = current_setting('app.organisation_id')::UUID);

CREATE POLICY aria_approvals_org_policy ON aria_ai_approvals
  FOR ALL USING (organisation_id = current_setting('app.organisation_id')::UUID);

CREATE POLICY aria_safety_org_policy ON aria_ai_safety_events
  FOR ALL USING (organisation_id = current_setting('app.organisation_id')::UUID);

CREATE POLICY aria_cost_org_policy ON aria_ai_cost_usage
  FOR ALL USING (organisation_id = current_setting('app.organisation_id')::UUID);

CREATE POLICY aria_studio_org_policy ON aria_studio_sessions
  FOR ALL USING (organisation_id = current_setting('app.organisation_id')::UUID);

CREATE POLICY aria_qa_org_policy ON aria_qa_reviews
  FOR ALL USING (organisation_id = current_setting('app.organisation_id')::UUID);
