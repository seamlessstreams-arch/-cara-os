-- Doc-version-workflow spine: persist document version history (was store-only → lost on live).
create table if not exists document_versions (
  id                  text primary key default gen_random_uuid()::text,
  home_id             uuid,
  doc_type            text not null,
  doc_id              text not null,
  version_label       text,
  content_snapshot    text,
  change_summary      text,
  changed_by          text,
  changed_at          text,
  previous_version_id text,
  is_current          boolean not null default true,
  created_at          timestamptz not null default now()
);

alter table document_versions enable row level security;
drop policy if exists "Tenant isolation" on document_versions;
create policy "Tenant isolation" on document_versions
  using (home_id = (select get_my_home_id())) with check (home_id = (select get_my_home_id()));

create index if not exists idx_document_versions_home on document_versions(home_id);
create index if not exists idx_document_versions_doc  on document_versions(doc_type, doc_id);

grant select, insert, update, delete on document_versions to service_role;
