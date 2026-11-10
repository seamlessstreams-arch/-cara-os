-- D6 — restore intelligence_audit_log.
--
-- writeIntelligenceAudit (src/lib/intelligence/audit.ts) and the
-- /api/intelligence/* routes write here, but the table was never carried into the
-- lean live baseline (it existed only in migrations_archive/015). supabase-js
-- resolves rather than throws on a missing table, so on live every intelligence
-- audit write was lost without a trace (#1394 now logs any failed write).
--
-- Applied BY HAND on live on 2026-11-09; the hand-applied script recorded this
-- version in supabase_migrations.schema_migrations. This file is the repo's copy,
-- so the migration history matches live and fresh environments get the table.
-- Idempotent. Rollback: drop table intelligence_audit_log;
--
-- Deliberate deviation from the archive schema: entity_id and actor_user_id are
-- TEXT, not uuid. The app passes entity ids that are not all uuids, and a uuid
-- column would reject them (the same class as the guardrail child_id fix).
-- cara_audit_logs uses text for these too. Column types checked against live,
-- 2026-11-09. RLS "Tenant isolation" via get_my_home_id() is defence in depth
-- (the app queries as service_role, which bypasses it).

create table if not exists intelligence_audit_log (
  id              uuid primary key default gen_random_uuid(),
  home_id         uuid,
  entity_type     text not null,
  entity_id       text,            -- text, not uuid (see header)
  action          text not null,
  actor_user_id   text,            -- text, not uuid (see header)
  actor_role      text,
  detail          jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

alter table intelligence_audit_log enable row level security;

-- Tenant isolation. The app queries as service_role (which bypasses RLS); this
-- guards anon/authenticated, matching the other home-scoped tables.
drop policy if exists "Tenant isolation" on intelligence_audit_log;
create policy "Tenant isolation" on intelligence_audit_log
  for all
  using (home_id = (select get_my_home_id()))
  with check (home_id = (select get_my_home_id()));

grant select, insert on intelligence_audit_log to service_role;

create index if not exists idx_ial_home_entity on intelligence_audit_log(home_id, entity_type, entity_id);
create index if not exists idx_ial_created     on intelligence_audit_log(created_at);

-- Smoke test (read-only), after any /api/intelligence/* write:
--   select action, count(*) from intelligence_audit_log group by 1 order by 2 desc;
