-- ══════════════════════════════════════════════════════════════════════════════
-- smart_record_links: widen source_id / target_id from uuid to text
--
-- The restored schema (migrations/20260918120000_restore_direct_query_tables.sql,
-- originally archive 015_intelligence_layer_schema.sql) created these two columns
-- as `uuid NOT NULL`. But the Smart Links feature identifies records by free-form
-- string ids — Cara pattern ids (cara_pa_*, cara_va_*), reference codes and
-- composite keys — none of which are UUIDs. Any GET/POST carrying a non-uuid id
-- therefore fails with Postgres 22P02 (invalid input syntax for type uuid), and
-- /api/intelligence/smart-links returns a 503 "Linked records could not be
-- loaded" — which floods the Manager Control Centre's Community Links / linked-
-- record widgets (every cara_pattern lookup 503s).
--
-- Widen both columns to text to match how the application identifies records.
-- text accepts the existing uuid-shaped values unchanged, so this is backward
-- compatible with links already keyed by a real record uuid.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE smart_record_links ALTER COLUMN source_id TYPE text USING source_id::text;
ALTER TABLE smart_record_links ALTER COLUMN target_id TYPE text USING target_id::text;
