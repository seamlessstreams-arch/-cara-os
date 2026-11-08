-- Phase 1.1 — one-tap feedback (useful / not_useful / wrong) on attention items,
-- keyed to the RULE that surfaced the item plus the specific entity. Accumulates
-- signal so alerting can be tuned later (which rules are useful vs noise).
--
-- Write-only capture. home_id is uuid (matches the ~100 uuid home_id tables).
-- RLS "Tenant isolation" via get_my_home_id() is defence in depth — the app
-- queries as service_role (covered by the grant, bypasses RLS).

create table if not exists cara_alert_feedback (
  id          uuid primary key default gen_random_uuid(),
  home_id     uuid not null,
  user_id     uuid,
  rule_id     text not null,
  entity_type text,
  entity_id   text,
  verdict     text not null check (verdict in ('useful', 'not_useful', 'wrong')),
  note        text,
  created_at  timestamptz not null default now()
);

alter table cara_alert_feedback enable row level security;
drop policy if exists "Tenant isolation" on cara_alert_feedback;
create policy "Tenant isolation" on cara_alert_feedback
  using (home_id = (select get_my_home_id())) with check (home_id = (select get_my_home_id()));
create index if not exists idx_cara_alert_feedback_home on cara_alert_feedback(home_id);
create index if not exists idx_cara_alert_feedback_rule on cara_alert_feedback(rule_id);
grant select, insert, update, delete on cara_alert_feedback to service_role;
