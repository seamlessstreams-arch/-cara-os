-- Key-work sessions: give cs_key_work_sessions a writer.
--
-- Every inspection-facing read of key-work -- the Reg 45 evidence pack, the
-- handover generator, the regulatory pulse, Cara's today-briefing and
-- dal.keyWorkingSessions -- reads cs_key_work_sessions. Nothing wrote to it.
-- dal.keyWorkingSessions.create() wrote to the in-memory store, which on a
-- live tenant is gated empty at module load and lost on the next cold start,
-- and the /key-working page's catch-all writes landed in generic_records under
-- record_type 'keyWorkingSessions', where none of those readers look. So the
-- table has 0 rows on production and had no code path that would ever add one.
--
-- The dal now writes here. Two columns are added so that write is lossless:
-- the /key-working form captures a mood pair and free-text worker
-- observations, and the table had a home for neither.
--
--   child_mood        (existing) = the mood at the END of the session
--   child_mood_before (new)      = the mood at the start
--
-- The read mapper deliberately left mood_before null rather than setting both
-- from the single column, because the page averages (after - before) as "mood
-- improvement" and populating both equal would peg that KPI at 0 for every
-- live session. With a real column the pair round-trips; rows written by
-- key-working-service, which records one mood, still read back with
-- mood_before null and stay out of the average.
--
--   worker_observations (new) = the practitioner's account of the session
--
-- positive_observations is a jsonb list of positives and is not the same
-- field; the mapper had been joining it with "; " to stand in for
-- worker_observations, which lost the distinction in both directions. The read
-- now prefers the new column and falls back to that join, so rows already
-- written by key-working-service keep reading as they did.
--
-- Nothing is backfilled and nothing needs to be: cs_key_work_sessions is empty
-- on production and generic_records holds no keywork rows under either record
-- type, so there is no prior recording to migrate.

alter table cs_key_work_sessions
  add column if not exists child_mood_before   smallint,
  add column if not exists worker_observations text;

alter table cs_key_work_sessions drop constraint if exists cs_key_work_sessions_child_mood_before_check;
alter table cs_key_work_sessions
  add constraint cs_key_work_sessions_child_mood_before_check
  check (child_mood_before is null or child_mood_before between 1 and 5);

-- child_mood carried no bound either. The reader already discards anything
-- outside 1..5, so this only makes the table agree with the reader.
alter table cs_key_work_sessions drop constraint if exists cs_key_work_sessions_child_mood_check;
alter table cs_key_work_sessions
  add constraint cs_key_work_sessions_child_mood_check
  check (child_mood is null or child_mood between 1 and 5);

comment on column cs_key_work_sessions.child_mood_before is
  'Mood 1-5 at the start of the session. Null when the recorder captured only one reading, which keeps the row out of the mood-improvement average.';
comment on column cs_key_work_sessions.worker_observations is
  'The practitioner''s account of the session. Distinct from positive_observations, which lists positives only.';

-- The reads filter and order by these, on a table that is about to start
-- receiving rows for the first time.
create index if not exists idx_cskws_home_planned on cs_key_work_sessions(home_id, planned_date desc);
create index if not exists idx_cskws_child        on cs_key_work_sessions(child_id);
create index if not exists idx_cskws_key_worker   on cs_key_work_sessions(key_worker_id);
