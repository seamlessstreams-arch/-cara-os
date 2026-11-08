-- Phase 1.2 — record the outcome (accepted / dismissed / escalated) of an
-- AI/deterministic suggestion (smart link, early warning, pattern alert), keyed
-- to the suggestion type + ref. Signal for tuning which suggestions actually land.
--
-- Write-only capture. home_id uuid; RLS "Tenant isolation" via get_my_home_id()
-- is defence in depth (the app queries as service_role, covered by the grant).

create table if not exists cara_suggestion_outcomes (
  id              uuid primary key default gen_random_uuid(),
  home_id         uuid not null,
  user_id         uuid,
  suggestion_type text not null check (suggestion_type in ('smart_link', 'early_warning', 'pattern_alert')),
  suggestion_ref  text not null,
  outcome         text not null check (outcome in ('accepted', 'dismissed', 'escalated')),
  note            text,
  created_at      timestamptz not null default now()
);

alter table cara_suggestion_outcomes enable row level security;
drop policy if exists "Tenant isolation" on cara_suggestion_outcomes;
create policy "Tenant isolation" on cara_suggestion_outcomes
  using (home_id = (select get_my_home_id())) with check (home_id = (select get_my_home_id()));
create index if not exists idx_cara_suggestion_outcomes_home on cara_suggestion_outcomes(home_id);
create index if not exists idx_cara_suggestion_outcomes_type on cara_suggestion_outcomes(suggestion_type);
grant select, insert, update, delete on cara_suggestion_outcomes to service_role;
