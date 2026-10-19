-- ══════════════════════════════════════════════════════════════════════════════
-- 415 — RECRUITMENT CANDIDATES PERSISTENCE (write-through targets)
--
-- Completes the safer-recruitment durable surface started in 413: the three
-- collections that actually mutate in production use — candidate profiles
-- (create + stage moves), Schedule-2 checks (verification updates) and
-- conditional offers (status updates). Hot columns for querying; the full
-- application record travels in `data` jsonb so the schema never drifts from
-- the store types. TEXT primary keys carry the application ids (cand_…,
-- chk_…, off_…) so updates address the rows that inserts created.
-- Additive only; home-scoped RLS (413 pattern).
--
-- Interviews / vacancies / employment history / gap explanations are seeded,
-- read-only collections today — no live mutation path, so deliberately no
-- dead tables for them. They join this migration's pattern when a write
-- path ships.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists recruitment_candidates (
  id text primary key,
  home_id uuid not null,
  vacancy_id text,
  full_name text,
  current_stage text,
  risk_level text,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recruitment_candidates_stage_idx on recruitment_candidates (current_stage);

create table if not exists recruitment_candidate_checks (
  id text primary key,
  home_id uuid not null,
  candidate_id text not null,
  check_type text,
  status text,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recruitment_checks_candidate_idx on recruitment_candidate_checks (candidate_id);

create table if not exists recruitment_conditional_offers (
  id text primary key,
  home_id uuid not null,
  candidate_id text not null,
  status text,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recruitment_offers_candidate_idx on recruitment_conditional_offers (candidate_id);

do $$
declare t text;
begin
  foreach t in array array['recruitment_candidates','recruitment_candidate_checks','recruitment_conditional_offers'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "Tenant isolation" on %I', t);
    execute format('create policy "Tenant isolation" on %I using (home_id = get_my_home_id()) with check (home_id = get_my_home_id())', t);
  end loop;
end $$;

comment on table recruitment_candidates is
  'Write-through target for safer-recruitment candidate profiles. Hot columns + full record in data jsonb. TEXT PK = application id (cand_…).';
comment on table recruitment_candidate_checks is
  'Write-through target for Schedule-2 / vetting checks — verification lifecycle lands on one row per check. TEXT PK = application id (chk_…).';
comment on table recruitment_conditional_offers is
  'Write-through target for conditional offers and their status moves. TEXT PK = application id (off_…).';
