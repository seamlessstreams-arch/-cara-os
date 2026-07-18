-- Migration: 373_aria_orchestration
-- Aria Intelligence Orchestration — sessions, messages, routes, approvals, safety, costs, feedback

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS aria_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  child_id text NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NULL,
  page_context text NULL,
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','escalated','archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aria_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES aria_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  agent_used text NULL,
  model_used text NULL,
  risk_level text NOT NULL DEFAULT 'low',
  tokens_in integer NULL,
  tokens_out integer NULL,
  latency_ms integer NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aria_routes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES aria_sessions(id) ON DELETE CASCADE,
  query text NOT NULL,
  task_type text NOT NULL,
  selected_agent text NOT NULL,
  selected_model_profile text NOT NULL,
  risk_level text NOT NULL,
  requires_rag boolean NOT NULL DEFAULT false,
  requires_approval boolean NOT NULL DEFAULT false,
  route_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aria_orchestration_evidence (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES aria_sessions(id) ON DELETE CASCADE,
  message_id uuid NULL REFERENCES aria_messages(id) ON DELETE SET NULL,
  evidence_type text NOT NULL,
  evidence_id text NOT NULL,
  title text NULL,
  excerpt text NULL,
  confidence numeric NOT NULL DEFAULT 0.5,
  source_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aria_orchestration_approvals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES aria_sessions(id) ON DELETE CASCADE,
  draft_content text NOT NULL,
  requested_by text NOT NULL,
  approved_by text NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected','amended')),
  approval_notes text NULL,
  committed_record_type text NULL,
  committed_record_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz NULL
);

CREATE TABLE IF NOT EXISTS aria_safety_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES aria_sessions(id) ON DELETE CASCADE,
  message_id uuid NULL REFERENCES aria_messages(id) ON DELETE SET NULL,
  risk_flags jsonb NOT NULL DEFAULT '[]',
  blocked boolean NOT NULL DEFAULT false,
  block_reason text NULL,
  escalation_recommended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aria_cost_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES aria_sessions(id) ON DELETE CASCADE,
  agent text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  estimated_cost numeric NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aria_user_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES aria_sessions(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback_text text NULL,
  issue_type text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aria_sessions_home ON aria_sessions(home_id);
CREATE INDEX IF NOT EXISTS idx_aria_sessions_user ON aria_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_aria_messages_session ON aria_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_aria_routes_session ON aria_routes(session_id);
CREATE INDEX IF NOT EXISTS idx_aria_orch_evidence_session ON aria_orchestration_evidence(session_id);
CREATE INDEX IF NOT EXISTS idx_aria_orch_approvals_session ON aria_orchestration_approvals(session_id);
CREATE INDEX IF NOT EXISTS idx_aria_safety_reviews_session ON aria_safety_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_aria_cost_logs_session ON aria_cost_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_aria_feedback_session ON aria_user_feedback(session_id);

-- RLS
ALTER TABLE aria_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_orchestration_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_orchestration_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_safety_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_cost_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON aria_sessions USING (home_id = get_my_home_id());
CREATE POLICY "Tenant isolation" ON aria_messages USING (session_id IN (SELECT id FROM aria_sessions WHERE home_id = get_my_home_id()));
CREATE POLICY "Tenant isolation" ON aria_routes USING (session_id IN (SELECT id FROM aria_sessions WHERE home_id = get_my_home_id()));
CREATE POLICY "Tenant isolation" ON aria_orchestration_evidence USING (session_id IN (SELECT id FROM aria_sessions WHERE home_id = get_my_home_id()));
CREATE POLICY "Tenant isolation" ON aria_orchestration_approvals USING (session_id IN (SELECT id FROM aria_sessions WHERE home_id = get_my_home_id()));
CREATE POLICY "Tenant isolation" ON aria_safety_reviews USING (session_id IN (SELECT id FROM aria_sessions WHERE home_id = get_my_home_id()));
CREATE POLICY "Tenant isolation" ON aria_cost_logs USING (session_id IN (SELECT id FROM aria_sessions WHERE home_id = get_my_home_id()));
CREATE POLICY "Tenant isolation" ON aria_user_feedback USING (session_id IN (SELECT id FROM aria_sessions WHERE home_id = get_my_home_id()));

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
