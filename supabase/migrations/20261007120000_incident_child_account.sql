-- Incident child-voice: the child's own account of what happened.
--
-- The incidents table (lean_live_baseline) records the home's account of an
-- incident — description, immediate_action, outcome, lessons_learned — but has
-- nowhere to hold the CHILD's account, in their own words. Every other
-- safeguarding form in this programme now captures child voice (body map,
-- accident, restraint #1268); the structured incident record was the gap.
--
-- Nullable with NO default. Null means the child was not asked / did not give
-- an account (a fact worth being able to state) — never an empty-string
-- stand-in. Existing rows stay null; nothing is backfilled.
--
-- Unlike the generic_records forms, incidents is a typed Postgres table, so the
-- column must exist before the app sends it: apply this BEFORE the code that
-- writes child_account reaches live, or an incident create carrying the field
-- is rejected by PostgREST (unknown column) and surfaces as an honest 500.

alter table incidents
  add column if not exists child_account text;

comment on column incidents.child_account is
  'The child''s own account of the incident, in their words. Null means they were not asked or gave no account — never a stand-in value.';
