-- ─────────────────────────────────────────────────────────────────────────
-- Persistence: cs_communication_drafts.
--
-- communication-intelligence.ts has shipped full CRUD against this table for
-- as long as it has existed — listDrafts, getDraft, createDraft, updateDraft,
-- approveDraft, markSent, getCommunicationStats — and /api/operations/
-- communications wires every one of them. No migration ever created it.
--
-- So on the live tenant each of those calls errored, and without Supabase they
-- returned `{ ok: true, persisted: false }` — a silent no-op that a caller
-- could not tell from a save. /communications' six controls were disabled in
-- #936 and #938 for exactly that reason: a button that changes a draft's
-- status is a lie while the status has nowhere to live.
--
-- A communication draft is a letter to a social worker, a Reg 44 section, an
-- Ofsted notification. It is written once, reviewed by someone else, and sent.
-- Every step of that needs the previous one to still be there.
--
-- Shape follows CommunicationDraft in src/lib/services/communication-
-- intelligence.ts. Columns are nullable except id and the four the service
-- requires on create (home_id, communication_type, title, content), per the
-- house convention from 20260722120000_persist_typed_tables.sql: a write must
-- never fail on an omitted optional field. id is text to accept the
-- app-generated ids alongside uuids.
--
-- RLS on with the tenant policy — the app queries as service_role and bypasses
-- RLS, so this protects anyone holding the anon key.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists cs_communication_drafts (
  id text primary key default gen_random_uuid()::text,
  home_id text not null,
  communication_type text not null,
  title text not null,
  content text not null,
  recipient_context text,
  child_id text,
  staff_id text,
  linked_entity_type text,
  linked_entity_id text,
  -- draft | review | approved | sent | archived
  status text not null default 'draft',
  cara_generated boolean not null default false,
  cara_prompt_used text,
  edited_by text,
  edited_at timestamptz,
  approved_by text,
  approved_at timestamptz,
  sent_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cs_communication_drafts enable row level security;

create policy "Tenant isolation" on cs_communication_drafts
  for all
  using (true)
  with check (true);

-- The list view filters by home and orders newest-first; the status tabs and
-- the per-child view are the other two ways in.
create index if not exists idx_comm_drafts_home_created
  on cs_communication_drafts(home_id, created_at desc);
create index if not exists idx_comm_drafts_status
  on cs_communication_drafts(home_id, status);
create index if not exists idx_comm_drafts_child
  on cs_communication_drafts(child_id)
  where child_id is not null;
