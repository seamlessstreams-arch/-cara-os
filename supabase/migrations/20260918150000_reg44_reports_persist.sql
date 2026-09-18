-- ══════════════════════════════════════════════════════════════════════════════
-- Regulation 44 monthly visit reports — durable storage for the A–Q engine.
--
-- WHY. src/lib/reg44-report-intelligence/ already assembles the A–Q report,
-- assesses the nine Quality Standards, gates sign-off, and locks a signed
-- report behind an audit trail. But /api/v1/reg44-report persisted it to the
-- in-memory store (db.reg44Reports). isLiveTenant() empties that store at
-- start-up and the container restarts on every deploy — so on a live tenant a
-- signed, locked Regulation 44 report survived until the next merge to main.
--
-- WHAT IS STORED. The report is a structured document with a lifecycle, so it
-- is stored as one: the gate-shaped draft, the assembled A–Q section text, the
-- sign-off snapshot and addenda live in jsonb, with the fields that need
-- querying (home, month, status, visit date, visitor) promoted to columns.
-- The audit trail is a separate APPEND-ONLY table: no update/delete policy, so
-- even a signed-in user cannot rewrite history through the API.
--
-- The section text is stored at creation and frozen in signed_snapshot. That
-- closes a gap in the engine as it stood: export regenerated the narrative
-- from live evidence on every call, so a "locked" report's words could drift
-- after signing. The words a visitor signed are now the words that persist.
--
-- One report per home per month (unique). Tenant-isolated through
-- get_my_home_id(), matching the live baseline's pattern.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists reg44_reports (
  id               text primary key,
  home_id          uuid not null references homes(id) on delete cascade,
  month            text not null check (month ~ '^\d{4}-\d{2}$'),
  status           text not null default 'draft' check (status in ('draft','signed','amended')),
  locked           boolean not null default false,
  -- promoted for listing/filtering; authoritative copies live inside `draft`
  visit_date       date,
  visitor_name     text,
  announced        boolean,
  -- the document
  draft            jsonb not null,
  sections         jsonb not null default '[]'::jsonb,
  signed_snapshot  jsonb,
  -- the A–Q sections exactly as they read when the report was signed;
  -- `sections` may not change after locking, but the frozen copy is kept
  -- explicitly so the export never has to reason about that
  signed_sections  jsonb,
  addenda          jsonb not null default '[]'::jsonb,
  -- provenance
  engine_version   text,
  created_by       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  signed_at        timestamptz,
  signed_by        text,
  constraint reg44_reports_home_month_unique unique (home_id, month)
);

create index if not exists idx_reg44_reports_home_month on reg44_reports (home_id, month desc);
create index if not exists idx_reg44_reports_status     on reg44_reports (home_id, status);

alter table reg44_reports enable row level security;
drop policy if exists "Tenant isolation" on reg44_reports;
create policy "Tenant isolation" on reg44_reports
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

-- ── Append-only audit trail ──────────────────────────────────────────────────
create table if not exists reg44_report_audit (
  seq        bigserial primary key,
  report_id  text not null references reg44_reports(id) on delete cascade,
  home_id    uuid not null references homes(id) on delete cascade,
  at         timestamptz not null,
  actor      text not null,
  action     text not null check (action in ('created','edited','validated','signed','addendum','edit_refused')),
  detail     text not null default ''
);

create index if not exists idx_reg44_report_audit_report on reg44_report_audit (report_id, seq);

alter table reg44_report_audit enable row level security;
drop policy if exists "Tenant read" on reg44_report_audit;
create policy "Tenant read" on reg44_report_audit
  for select using (home_id = get_my_home_id());
drop policy if exists "Tenant append" on reg44_report_audit;
create policy "Tenant append" on reg44_report_audit
  for insert with check (home_id = get_my_home_id());
-- deliberately no update / delete policy: the trail is append-only.
