-- ══════════════════════════════════════════════════════════════════════════════
-- 412 — CARA STUDIO UNIFIED OUTPUTS (write-through target)
--
-- The application persists every Cara Studio generation into ONE table that
-- mirrors the in-memory `caraStudioOutputs` collection, so the review centre
-- and child workspaces read identically in both modes. The per-type tables
-- from migration 411 remain for future normalisation.
--
-- NOTE: id is TEXT and uses the application id (cso_…) so manager-review
-- updates address the same row the create wrote. Additive only; RLS
-- home-scoped like everything else.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cara_studio_outputs (
  id text primary key,
  home_id uuid not null,
  module text not null,
  child_id text,
  title text not null,
  output jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  manager_review_status text not null default 'not_reviewed',
  manager_review_reasons jsonb not null default '[]'::jsonb,
  guardrail_severity text,
  guardrail_flags jsonb not null default '[]'::jsonb,
  llm_used boolean not null default false,
  created_by text not null,
  reviewed_by text,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- The application enforces this too: nobody approves their own output.
  constraint cara_outputs_no_self_review check (reviewed_by is null or reviewed_by <> created_by)
);

create index if not exists cara_studio_outputs_child_idx on cara_studio_outputs (child_id);
create index if not exists cara_studio_outputs_review_idx on cara_studio_outputs (manager_review_status) where manager_review_status = 'review_required';

alter table cara_studio_outputs enable row level security;
drop policy if exists "Tenant isolation" on cara_studio_outputs;
create policy "Tenant isolation" on cara_studio_outputs
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

comment on table cara_studio_outputs is
  'Unified write-through target for every Cara Studio generation (sessions, curriculum, materials, conversations, incident learning, adaptations, debriefs) with guardrail + manager-review state. Text PK = application id so updates address the created row.';
