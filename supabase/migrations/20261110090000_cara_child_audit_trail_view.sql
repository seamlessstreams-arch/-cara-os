-- D2b — cara_child_audit_trail: a read-only view of "everything that touched
-- child X" across the audit logs that carry a child.
--
-- Applied BY HAND in the Supabase SQL editor (migrations do not run in CI or in
-- the deploy). The hand-applied script records this version in
-- supabase_migrations.schema_migrations itself; this file is the repo's copy, so
-- the migration history matches live. Additive. Rollback: drop view cara_child_audit_trail;
--
-- Sources (column types checked against live, 2026-11-09):
--   cara_guardrail_events   child_id uuid, populated by the writer fixed in #1393
--   cara_audit_logs         child_id text
--   cara_studio_outputs     child_id text (content touch-point)
--   cara_studio_audit_log   no child column, resolved via artifact_id -> cara_studio_outputs
-- Excluded: intelligence_audit_log and cara_audit_events have no child column.
-- Mapping cara_audit_events.target_type to a child would be a guess until its
-- value set is confirmed.
--
-- Guardrail rows written before #1393 hold the child id only in flagged_text and
-- are not surfaced here; history is never rewritten. home_id is uuid on every
-- source; child_id is normalised to text. security_invoker keeps each source's RLS.

create or replace view cara_child_audit_trail
with (security_invoker = true) as

  -- 1) Guardrail flags raised on generated content
  select
    'cara_guardrail_events'::text                                   as source_log,
    g.home_id                                                       as home_id,
    g.child_id::text                                                as child_id,
    g.user_id::text                                                 as actor_id,
    g.action_taken                                                  as action,
    g.module || ' / ' || g.risk_type || ' (' || g.severity || ')'   as detail,
    g.created_at                                                    as occurred_at,
    g.id::text                                                      as source_row_id
  from cara_guardrail_events g
  where g.child_id is not null

  union all

  -- 2) Generic org audit log (direct child_id)
  select
    'cara_audit_logs'::text,
    a.home_id,
    a.child_id,
    a.user_id,
    a.action_type,
    coalesce(a.entity_type, '')
      || case when a.entity_id is not null then ' #' || a.entity_id else '' end,
    a.created_at,
    a.id
  from cara_audit_logs a
  where a.child_id is not null

  union all

  -- 3) Studio outputs created for a child (content touch-point)
  select
    'cara_studio_outputs'::text,
    o.home_id,
    o.child_id,
    o.created_by,
    'output_' || o.status,
    o.module || ': ' || o.title,
    o.created_at,
    o.id
  from cara_studio_outputs o
  where o.child_id is not null

  union all

  -- 4) Studio audit log — no child column; resolve via artifact_id -> studio_outputs.child_id
  select
    'cara_studio_audit_log'::text,
    s.home_id,
    o.child_id,
    s.actor_id,
    s.action_type,
    coalesce(s.prompt_summary, s.artifact_id),
    s.created_at,
    s.id
  from cara_studio_audit_log s
  join cara_studio_outputs o on o.id = s.artifact_id
  where o.child_id is not null;

-- Match the per-table grant pattern (service_role only; app queries as service_role).
grant select on cara_child_audit_trail to service_role;

-- Smoke test (read-only):
--   select source_log, count(*) from cara_child_audit_trail group by 1 order by 1;
