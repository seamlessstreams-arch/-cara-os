-- ══════════════════════════════════════════════════════════════════════════════
-- Early Access / Contact form submissions — durable persistence
--
-- Backs the public website's early-access / "book a conversation" form
-- (POST /api/v1/early-access). The API route writes via the service-role client
-- (which bypasses RLS); submissions are also held in the in-memory store so the
-- demo never loses one. RLS is enabled so the anon key cannot read submissions.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS early_access_requests (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  organisation     TEXT,
  role             TEXT,
  email            TEXT NOT NULL,
  number_of_homes  TEXT,
  looking_for      TEXT,
  source           TEXT NOT NULL DEFAULT 'website',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_early_access_created ON early_access_requests (created_at);

-- RLS on: no public policies, so only the service-role key (used by the API
-- route) can read or write. Submissions are never exposed to the anon client.
ALTER TABLE early_access_requests ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE early_access_requests IS 'Public website early-access / contact form submissions. Written by the service role; not readable via the anon key.';
