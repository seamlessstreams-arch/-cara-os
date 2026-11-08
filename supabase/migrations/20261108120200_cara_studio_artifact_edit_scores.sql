-- Phase 1.3 — section-level change scores between an artefact's original AI draft
-- and the committed (human-edited) version. SCORES ONLY — no full text is
-- duplicated here (the content lives in cara_studio_artifact_versions). Records
-- how much a human changed per section, so draft quality can be assessed later.
--
-- artifact_id is text (matches cara_studio_artifacts.id). RLS "Tenant isolation"
-- via get_my_home_id() is defence in depth (service_role reads bypass it).

create table if not exists cara_studio_artifact_edit_scores (
  id            uuid primary key default gen_random_uuid(),
  home_id       uuid,
  artifact_id   text not null,
  version_id    text,
  section_key   text not null,
  change_score  integer not null,
  ai_len        integer,
  committed_len integer,
  created_at    timestamptz not null default now()
);

alter table cara_studio_artifact_edit_scores enable row level security;
drop policy if exists "Tenant isolation" on cara_studio_artifact_edit_scores;
create policy "Tenant isolation" on cara_studio_artifact_edit_scores
  using (home_id = (select get_my_home_id())) with check (home_id = (select get_my_home_id()));
create index if not exists idx_cara_studio_edit_scores_artifact on cara_studio_artifact_edit_scores(artifact_id);
grant select, insert, update, delete on cara_studio_artifact_edit_scores to service_role;
