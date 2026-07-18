-- ══════════════════════════════════════════════════════════════════════════════
-- 417 — CALENDAR RECURRENCE (additive columns)
--
-- Adds repeat rules to calendar_events (migration 416). The recurrence rule
-- lives in jsonb ({freq, interval, until, count}); occurrences are expanded
-- live by the projection engine and never materialised as rows.
-- last_reminded_occurrence dedupes per-occurrence reminders. Additive only.
-- ══════════════════════════════════════════════════════════════════════════════

alter table calendar_events add column if not exists recurrence jsonb;
alter table calendar_events add column if not exists last_reminded_occurrence text;

comment on column calendar_events.recurrence is
  'Repeat rule {freq: daily|weekly|fortnightly|monthly, interval, until, count}; null = one-off. Occurrences are expanded live, never stored as rows.';
comment on column calendar_events.last_reminded_occurrence is
  'YYYY-MM-DD of the most recent occurrence a reminder fired for (recurring dedupe).';
