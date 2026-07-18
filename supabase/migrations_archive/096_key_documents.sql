-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — KEY DOCUMENTS
-- CHR 2015 Reg 36 (records — maintaining essential documents),
-- Reg 14 (healthcare plans), Reg 8 (placement plans),
-- Reg 16 (education — PEPs).
-- Tables: cs_key_documents
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_key_documents (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                  uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name               text NOT NULL,
  child_id                 uuid NOT NULL,
  document_type            text NOT NULL,
  document_name            text NOT NULL,
  status                   text NOT NULL DEFAULT 'not_yet_created',
  created_date             date NOT NULL,
  last_reviewed            date,
  next_review_due          date,
  review_frequency         text NOT NULL DEFAULT 'quarterly',
  responsible_person       text NOT NULL,
  social_worker_approved   boolean NOT NULL DEFAULT false,
  child_contributed        boolean NOT NULL DEFAULT false,
  stored_location          text,
  notes                    text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_key_docs_home       ON cs_key_documents(home_id);
CREATE INDEX IF NOT EXISTS idx_key_docs_child      ON cs_key_documents(child_id);
CREATE INDEX IF NOT EXISTS idx_key_docs_type       ON cs_key_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_key_docs_status     ON cs_key_documents(status);
CREATE INDEX IF NOT EXISTS idx_key_docs_review     ON cs_key_documents(next_review_due);

ALTER TABLE cs_key_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own key documents"
    ON cs_key_documents FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
