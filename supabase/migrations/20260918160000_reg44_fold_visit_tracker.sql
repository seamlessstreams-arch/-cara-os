-- ══════════════════════════════════════════════════════════════════════════════
-- Regulation 44 — fold the visit tracker into the persisted report
--
-- Until now Cara held two Regulation 44 records for the same visit: the A–Q
-- report (reg44_reports, 20260918150000) and a separate "visit" row
-- (reg44_visits) that the Quality → Reg 44 page listed and hung its action
-- tracker off. One visit, one record: the tracker now reads a projection of
-- reg44_reports, and the two things it stored that the report did not —
-- the registered person's response and the RI's response — move onto the
-- report. reg44_actions re-points at the report. reg44_visits is retired.
--
-- Both reg44_visits and reg44_actions were EMPTY on the live tenant when this
-- was written (restored 18 Sep; the route that wrote them had drifted from the
-- schema and could not insert). The type change and the drop are therefore
-- lossless; they are still written to fail loudly rather than silently if that
-- ever stops being true.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Responses live on the report ──────────────────────────────────────────
-- Reg 44(7): the report goes to the registered person; the response is how the
-- home evidences what it did with it. A response is NOT an edit to the
-- visitor's report, so it is allowed after signing and never touches the
-- signed snapshot.
alter table reg44_reports
  add column if not exists manager_response     text,
  add column if not exists manager_responded_at timestamptz,
  add column if not exists manager_responded_by text,
  add column if not exists ri_response          text,
  add column if not exists ri_responded_at      timestamptz,
  add column if not exists ri_responded_by      text;

-- Audit vocabulary gains 'responded'.
alter table reg44_report_audit drop constraint if exists reg44_report_audit_action_check;
alter table reg44_report_audit
  add constraint reg44_report_audit_action_check
  check (action in ('created','edited','validated','signed','addendum','edit_refused','responded'));

-- ── 2. Actions hang off the report ───────────────────────────────────────────
do $$
begin
  if (select count(*) from reg44_actions) > 0 then
    raise exception 'reg44_actions is not empty (% rows); re-pointing visit_id needs a data migration first', (select count(*) from reg44_actions);
  end if;
end $$;

alter table reg44_actions drop constraint if exists reg44_actions_visit_id_fkey;
alter table reg44_actions alter column visit_id type text using visit_id::text;
alter table reg44_actions
  add constraint reg44_actions_visit_id_fkey
  foreign key (visit_id) references reg44_reports(id) on delete cascade;
-- The page assigns actions to a named person (free text); the column was uuid,
-- so every insert from the page failed with 22P02 on live.
alter table reg44_actions alter column assigned_to type text using assigned_to::text;
create index if not exists idx_r44a_home on reg44_actions(home_id);

-- ── 3. Retire reg44_visits ───────────────────────────────────────────────────
do $$
declare n bigint;
begin
  if to_regclass('public.reg44_visits') is not null then
    execute 'select count(*) from reg44_visits' into n;
    if n > 0 then
      raise exception 'reg44_visits is not empty (% rows); refusing to drop', n;
    end if;
  end if;
end $$;
drop table if exists reg44_visits;
