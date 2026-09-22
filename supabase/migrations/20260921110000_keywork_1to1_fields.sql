-- The 1:1 Sessions page joins cs_key_work_sessions.
--
-- #1139 gave the table a writer and moved /key-working onto it. The other
-- key-work page, /child-keyworker-1to1-sessions ("1:1 Sessions" in the nav,
-- linked from the chronology, the calendar and plan-my-day), still wrote to
-- generic_records under record_type 'keyworkerSessions', where the Reg 45
-- evidence pack, the handover generator, the regulatory pulse and Cara's
-- today-briefing never look.
--
-- It captures a richer 1:1 record than /key-working does, and most of it has
-- a home already: themes -> topics_covered, what the child brought up ->
-- child_voice, the staff actions -> actions, the mood pair -> child_mood_before
-- and child_mood (added in #1139), and duration, child, key worker and dates
-- to their existing columns. These eight are what the table could not hold.
--
-- child_satisfaction is deliberately nullable with NO default. The page's
-- create dialog used to send a hardcoded 4 for it on every save and then
-- average that into a "child satisfaction" tile, so the tile read 4.0 by
-- construction while presenting itself as the child's own rating of their
-- session. Null means nobody asked, which is a fact worth being able to state.
--
-- Nothing is backfilled: generic_records holds no rows under either keywork
-- record type, and cs_key_work_sessions was empty until #1139 shipped.

alter table cs_key_work_sessions
  add column if not exists session_format      text,
  add column if not exists child_chose_format  boolean,
  add column if not exists staff_agenda        text,
  add column if not exists child_actions       jsonb default '[]'::jsonb,
  add column if not exists child_satisfaction  smallint,
  add column if not exists follow_up_date      date,
  add column if not exists flags_raised        jsonb default '[]'::jsonb,
  add column if not exists notes               text;

-- Same 1-5 scale as the mood pair, and the same refusal to clamp: a reading
-- outside the scale is not evidence of a 1 or a 5.
alter table cs_key_work_sessions drop constraint if exists cs_key_work_sessions_child_satisfaction_check;
alter table cs_key_work_sessions
  add constraint cs_key_work_sessions_child_satisfaction_check
  check (child_satisfaction is null or child_satisfaction between 1 and 5);

-- The vocabulary the 1:1 page offers. Constrained so a typo in a payload
-- cannot quietly become a format nobody can filter on; null is allowed
-- because a session recorded through /key-working has no 1:1 format and
-- should say so rather than borrow one.
alter table cs_key_work_sessions drop constraint if exists cs_key_work_sessions_session_format_check;
alter table cs_key_work_sessions
  add constraint cs_key_work_sessions_session_format_check
  check (session_format is null or session_format in (
    'one_to_one_at_home', 'one_to_one_walk', 'one_to_one_cafe',
    'one_to_one_driving', 'one_to_one_cooking_together',
    'one_to_one_boxing_sport', 'brief_check_in', 'crisis_check_in'));

comment on column cs_key_work_sessions.session_format is
  'How the 1:1 happened (walk, cafe, driving...). Null for sessions recorded through /key-working, which does not ask.';
comment on column cs_key_work_sessions.child_chose_format is
  'Whether the child chose how the session happened. Null when not asked.';
comment on column cs_key_work_sessions.staff_agenda is
  'What staff brought to the session. The counterpart of child_voice, which holds what the child brought.';
comment on column cs_key_work_sessions.child_actions is
  'Actions the child agreed to. Separate from actions, which are the ones staff agreed to.';
comment on column cs_key_work_sessions.child_satisfaction is
  'The child''s own 1-5 rating of the session. Null means they were not asked - never a stand-in value.';
comment on column cs_key_work_sessions.flags_raised is
  'Concerns raised during the session that need following up elsewhere.';

create index if not exists idx_cskws_follow_up on cs_key_work_sessions(follow_up_date)
  where follow_up_date is not null;
