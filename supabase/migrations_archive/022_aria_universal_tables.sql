-- ══════════════════════════════════════════════════════════════════════════════
-- ARIA UNIVERSAL TABLES
-- Migration 022 — 2026-05-12
--
-- Adds tables for the universal Aria command layer: request tracking, output
-- drafts, approval decisions, transcription records, context links, and
-- command usage metrics. These complement the earlier domain-specific ARIA
-- tables (007, 013, 014, 019, 021).
-- ══════════════════════════════════════════════════════════════════════════════

-- Reuse the updated_at trigger from 021 if available, otherwise create.
CREATE OR REPLACE FUNCTION aria_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. ARIA REQUESTS
-- Every Aria command invocation creates a request row.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aria_requests (
  id                  text PRIMARY KEY,
  organisation_id     uuid,
  home_id             uuid,
  child_id            uuid,
  staff_id            uuid,
  source_module       text,
  source_record_type  text,
  source_record_id    text,
  command_id          text NOT NULL,
  user_id             text NOT NULL,
  user_role           text NOT NULL,
  input_text          text,
  input_metadata      jsonb DEFAULT '{}',
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN (
                        'pending','context_built','complete','provider_failed','cancelled'
                      )),
  llm_used            boolean NOT NULL DEFAULT false,
  provider_id         text,
  model_id            text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. ARIA OUTPUTS
-- The generated draft and its lifecycle through approval and commit.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aria_outputs (
  id                     text PRIMARY KEY,
  request_id             text REFERENCES aria_requests(id),
  generated_text         text NOT NULL,
  structured_output      jsonb DEFAULT '{}',
  edited_text            text,
  status                 text NOT NULL DEFAULT 'draft'
                         CHECK (status IN (
                           'draft','edited','submitted_for_approval','approved',
                           'committed','rejected','archived'
                         )),
  approval_required      boolean NOT NULL DEFAULT true,
  confidence             text NOT NULL DEFAULT 'medium'
                         CHECK (confidence IN ('low','medium','high')),
  redacted_context_summary text,
  context_record_ids     text[] DEFAULT '{}',
  approved_by            text,
  approved_at            timestamptz,
  rejected_by            text,
  rejected_at            timestamptz,
  rejection_reason       text,
  committed_record_type  text,
  committed_record_id    text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. ARIA APPROVALS
-- Every approval/rejection/commit decision on an output.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aria_approvals (
  id              text PRIMARY KEY,
  output_id       text REFERENCES aria_outputs(id),
  decision        text NOT NULL
                  CHECK (decision IN (
                    'approve','reject','request_changes','commit','withdraw'
                  )),
  decided_by      text NOT NULL,
  decided_role    text,
  decision_text   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. ARIA TRANSCRIPTIONS
-- Record of every voice transcription request.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aria_transcriptions (
  id              text PRIMARY KEY,
  organisation_id uuid,
  home_id         uuid,
  user_id         text NOT NULL,
  user_role       text NOT NULL,
  source_module   text,
  source_field    text,
  file_name       text,
  mime_type       text,
  file_size_bytes integer,
  duration_ms     integer,
  transcript      text,
  llm_used        boolean NOT NULL DEFAULT false,
  provider_id     text,
  model_id        text,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','complete','failed')),
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. ARIA CONTEXT LINKS
-- Records which source records were included in the context for a request.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aria_context_links (
  id              text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  request_id      text REFERENCES aria_requests(id),
  source_table    text NOT NULL,
  source_record_id text NOT NULL,
  summary         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. ARIA TASK LINKS
-- Links between ARIA outputs and created tasks.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aria_task_links (
  id              text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  output_id       text REFERENCES aria_outputs(id),
  task_id         text NOT NULL,
  task_title      text NOT NULL,
  task_source     text DEFAULT 'aria_suggested',
  created_by      text NOT NULL,
  confirmed_by    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_aria_requests_org       ON aria_requests(organisation_id);
CREATE INDEX IF NOT EXISTS idx_aria_requests_home      ON aria_requests(home_id);
CREATE INDEX IF NOT EXISTS idx_aria_requests_child     ON aria_requests(child_id);
CREATE INDEX IF NOT EXISTS idx_aria_requests_user      ON aria_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_aria_requests_command   ON aria_requests(command_id);
CREATE INDEX IF NOT EXISTS idx_aria_requests_module    ON aria_requests(source_module);
CREATE INDEX IF NOT EXISTS idx_aria_requests_status    ON aria_requests(status);
CREATE INDEX IF NOT EXISTS idx_aria_requests_created   ON aria_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_aria_outputs_request    ON aria_outputs(request_id);
CREATE INDEX IF NOT EXISTS idx_aria_outputs_status     ON aria_outputs(status);

CREATE INDEX IF NOT EXISTS idx_aria_approvals_output   ON aria_approvals(output_id);
CREATE INDEX IF NOT EXISTS idx_aria_transcriptions_user ON aria_transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_aria_context_links_req  ON aria_context_links(request_id);
CREATE INDEX IF NOT EXISTS idx_aria_task_links_output  ON aria_task_links(output_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_aria_requests_updated_at ON aria_requests;
CREATE TRIGGER trg_aria_requests_updated_at
  BEFORE UPDATE ON aria_requests
  FOR EACH ROW EXECUTE FUNCTION aria_set_updated_at();

DROP TRIGGER IF EXISTS trg_aria_outputs_updated_at ON aria_outputs;
CREATE TRIGGER trg_aria_outputs_updated_at
  BEFORE UPDATE ON aria_outputs
  FOR EACH ROW EXECUTE FUNCTION aria_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE aria_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_context_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_task_links ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can access rows within their home.
-- Service-role key bypasses RLS for server-side operations.

CREATE POLICY "Users can view own requests"
  ON aria_requests FOR SELECT
  USING (home_id IS NULL OR home_id = get_my_home_id());

CREATE POLICY "Users can insert own requests"
  ON aria_requests FOR INSERT
  WITH CHECK (home_id IS NULL OR home_id = get_my_home_id());

CREATE POLICY "Users can update own requests"
  ON aria_requests FOR UPDATE
  USING (home_id IS NULL OR home_id = get_my_home_id());

CREATE POLICY "Users can view own outputs"
  ON aria_outputs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM aria_requests r
      WHERE r.id = aria_outputs.request_id
        AND (r.home_id IS NULL OR r.home_id = get_my_home_id())
    )
  );

CREATE POLICY "Users can insert own outputs"
  ON aria_outputs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own outputs"
  ON aria_outputs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM aria_requests r
      WHERE r.id = aria_outputs.request_id
        AND (r.home_id IS NULL OR r.home_id = get_my_home_id())
    )
  );

CREATE POLICY "Users can view own approvals"
  ON aria_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM aria_outputs o
      JOIN aria_requests r ON r.id = o.request_id
      WHERE o.id = aria_approvals.output_id
        AND (r.home_id IS NULL OR r.home_id = get_my_home_id())
    )
  );

CREATE POLICY "Users can insert approvals"
  ON aria_approvals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own transcriptions"
  ON aria_transcriptions FOR SELECT
  USING (home_id IS NULL OR home_id = get_my_home_id());

CREATE POLICY "Users can insert own transcriptions"
  ON aria_transcriptions FOR INSERT
  WITH CHECK (home_id IS NULL OR home_id = get_my_home_id());

CREATE POLICY "Users can view context links"
  ON aria_context_links FOR SELECT
  USING (true);

CREATE POLICY "Users can insert context links"
  ON aria_context_links FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view task links"
  ON aria_task_links FOR SELECT
  USING (true);

CREATE POLICY "Users can insert task links"
  ON aria_task_links FOR INSERT
  WITH CHECK (true);
