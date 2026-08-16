-- ═══════════════════════════════════════════════════════════════════════════
-- Safer recruitment: the pre-employment checks a home has to be able to record
--
-- /workforce/qualifications displayed "Barred list" and "RTW" confirmations for
-- every staff member. It had to invent them, because no field existed: the card
-- hardcoded `barred_list_checked: true` and `prohibition_checked: true` and
-- drew the badge unconditionally (#939 removed that). Right-to-work was worse
-- than invented — the card read `right_to_work_checked`, which is not a column
-- and not on the StaffMember type either, so it was always undefined.
--
-- These are Schedule 2 / KCSIE checks. Recording them is not optional for a
-- children's home, and until now the schema had nowhere to put them.
--
-- ── Why dates and names, not booleans ──────────────────────────────────────
--
-- `barred_list_checked boolean` invites `default false` and, worse, invites the
-- next `?? true`. A date and a person are EVIDENCE: "checked on 12 March by the
-- registered manager" is what an inspector asks for, and it cannot be defaulted
-- into existence. "Checked" is then derived — the date is present or it is not.
-- Null means not recorded, and reads as not recorded everywhere.
--
-- No RLS changes: staff_members already has RLS enabled with its policies from
-- the lean baseline, and adding columns to an existing table inherits them.
-- ═══════════════════════════════════════════════════════════════════════════

alter table staff_members
  add column if not exists right_to_work_checked_date date,
  add column if not exists right_to_work_checked_by   text,
  add column if not exists barred_list_checked_date   date,
  add column if not exists barred_list_checked_by     text,
  add column if not exists prohibition_checked_date   date,
  add column if not exists prohibition_checked_by     text;

comment on column staff_members.right_to_work_checked_date is
  'Date the right-to-work document was verified. NULL = not recorded, never "not done".';
comment on column staff_members.barred_list_checked_date is
  'Date the children''s barred list was checked (Schedule 2). NULL = not recorded.';
comment on column staff_members.prohibition_checked_date is
  'Date the prohibition/s.128 direction check was made. NULL = not recorded.';

-- Finding an incomplete pre-employment record is the point of the screen, so
-- make the incomplete ones cheap to find.
create index if not exists idx_staff_barred_list_unchecked
  on staff_members(home_id)
  where barred_list_checked_date is null;
