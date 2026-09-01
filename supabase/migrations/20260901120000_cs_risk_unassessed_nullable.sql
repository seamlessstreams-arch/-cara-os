-- ── contextual_safeguarding_risk: unassessed is not "no risk" ────────────────
--
-- The column was `boolean not null default false`, so a missing episode whose
-- contextual-safeguarding question was never asked was recorded as assessed-
-- no-risk at the database — below every route and service check. Every reader
-- counts positives only (`filter(e => e.contextual_safeguarding_risk)`), so an
-- unassessed episode under-counted the EFH signals the contextual-safeguarding
-- engine feeds on, and the stored record claimed an assessment nobody made.
--
-- Nullable with no default: null = not assessed, false = assessed and no risk
-- identified, true = risk identified. Existing rows keep their false — that
-- history cannot be un-claimed retroactively, and rewriting it would fabricate
-- in the other direction. Readers are already null-safe (positives-only).
--
-- Flagged by check-migration-defaults on its first run, 2026-09-01.
alter table missing_episodes
  alter column contextual_safeguarding_risk drop default;
alter table missing_episodes
  alter column contextual_safeguarding_risk drop not null;

comment on column missing_episodes.contextual_safeguarding_risk is
  'null = not assessed; false = assessed, no risk identified; true = risk identified. Never read null as "no risk".';
