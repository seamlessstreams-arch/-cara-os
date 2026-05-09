-- ═════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — DUAL-BRANDING SCHEMA
-- Migration 021 — 2026-05-09
--
-- Two-tier branding:
--   1. system_branding        — Cornerstone master brand (super_admin only)
--   2. organisation_branding  — Client/provider brand (org admin)
--   3. home_branding          — Home-level overrides (registered manager)
--   4. document_branding_snapshots — Point-in-time snapshot for historical PDFs
--   5. branding_audit_log     — Every branding change is audited
-- ═════════════════════════════════════════════════════════════════════════════

-- ── System branding (Cornerstone product) ─────────────────────────────────────

create table if not exists system_branding (
  id                    text primary key default 'cornerstone_system',
  logo_url              text,
  icon_url              text,
  wordmark_url          text,
  primary_colour        text not null default '#1e3a5f',
  secondary_colour      text not null default '#2dd4bf',
  accent_colour         text not null default '#3b82f6',
  background_colour     text not null default '#f8fafc',
  default_footer_text   text not null default 'Generated securely through Cornerstone',
  support_email         text not null default 'support@cornerstone.care',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Ensure singleton
insert into system_branding (id) values ('cornerstone_system')
  on conflict (id) do nothing;

-- ── Organisation branding ─────────────────────────────────────────────────────

create table if not exists organisation_branding (
  id                          uuid primary key default gen_random_uuid(),
  organisation_id             text not null unique,
  company_name                text not null,
  trading_name                text,
  registered_provider_name    text,
  company_registration_number text,
  ofsted_provider_reference   text,
  logo_url                    text,
  document_logo_url           text,
  email_logo_url              text,
  primary_colour              text,
  secondary_colour            text,
  accent_colour               text,
  address                     text,
  phone                       text,
  email                       text,
  website                     text,
  responsible_individual_name text,
  default_footer_text         text,
  confidentiality_notice      text not null default
    'This document is confidential. It contains sensitive information about children in care and must not be shared without authorisation.',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists idx_org_branding_org_id on organisation_branding(organisation_id);

-- ── Home branding ─────────────────────────────────────────────────────────────

create table if not exists home_branding (
  id                          uuid primary key default gen_random_uuid(),
  home_id                     text not null unique,
  organisation_id             text not null,
  home_name                   text not null,
  home_address                text,
  ofsted_urn                  text,
  registered_manager_name     text,
  responsible_individual_name text,
  emergency_contact           text,
  safeguarding_contact        text,
  lado_contact                text,
  local_authority_contact     text,
  police_contact              text,
  logo_override_url           text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists idx_home_branding_home_id    on home_branding(home_id);
create index if not exists idx_home_branding_org_id     on home_branding(organisation_id);

-- ── Document branding snapshots ───────────────────────────────────────────────
-- Preserves the exact branding at the time a document was generated.
-- Ensures historical PDFs remain accurate even after client rebranding.

create table if not exists document_branding_snapshots (
  id              uuid primary key default gen_random_uuid(),
  document_id     text not null,
  document_type   text not null,
  organisation_id text,
  home_id         text,
  branding_json   jsonb not null,
  generated_by    text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_doc_brand_snap_doc_id  on document_branding_snapshots(document_id);
create index if not exists idx_doc_brand_snap_org_id  on document_branding_snapshots(organisation_id);
create index if not exists idx_doc_brand_snap_home_id on document_branding_snapshots(home_id);
create index if not exists idx_doc_brand_snap_type    on document_branding_snapshots(document_type);

-- ── Branding audit log ────────────────────────────────────────────────────────

create table if not exists branding_audit_log (
  id              uuid primary key default gen_random_uuid(),
  changed_by      text not null,
  changed_by_name text,
  target_type     text not null,   -- 'system' | 'organisation' | 'home'
  target_id       text not null,
  field_name      text not null,
  previous_value  text,
  new_value       text,
  session_info    text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_brand_audit_target on branding_audit_log(target_type, target_id);
create index if not exists idx_brand_audit_by     on branding_audit_log(changed_by);
create index if not exists idx_brand_audit_at     on branding_audit_log(created_at);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table system_branding              enable row level security;
alter table organisation_branding        enable row level security;
alter table home_branding                enable row level security;
alter table document_branding_snapshots  enable row level security;
alter table branding_audit_log           enable row level security;

-- System branding: super_admin write, all authenticated read
create policy "system_branding_read" on system_branding
  for select using (auth.role() = 'authenticated');

create policy "system_branding_write" on system_branding
  for all using (
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- Organisation branding: read by authenticated, write by super_admin and org admins
create policy "org_branding_read" on organisation_branding
  for select using (auth.role() = 'authenticated');

create policy "org_branding_write" on organisation_branding
  for all using (
    auth.jwt() ->> 'role' in ('super_admin', 'responsible_individual', 'registered_manager')
  );

-- Home branding: read by authenticated, write by managers+
create policy "home_branding_read" on home_branding
  for select using (auth.role() = 'authenticated');

create policy "home_branding_write" on home_branding
  for all using (
    auth.jwt() ->> 'role' in ('super_admin', 'responsible_individual', 'registered_manager', 'deputy_manager')
  );

-- Document snapshots: all authenticated can read, system creates them
create policy "doc_snap_read" on document_branding_snapshots
  for select using (auth.role() = 'authenticated');

create policy "doc_snap_insert" on document_branding_snapshots
  for insert with check (auth.role() = 'authenticated');

-- Branding audit log: read-only for authenticated, insert by system
create policy "brand_audit_read" on branding_audit_log
  for select using (auth.role() = 'authenticated');

create policy "brand_audit_insert" on branding_audit_log
  for insert with check (auth.role() = 'authenticated');

-- ── Updated-at triggers ───────────────────────────────────────────────────────

create or replace function update_branding_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_system_branding_updated_at
  before update on system_branding
  for each row execute function update_branding_updated_at();

create trigger trg_org_branding_updated_at
  before update on organisation_branding
  for each row execute function update_branding_updated_at();

create trigger trg_home_branding_updated_at
  before update on home_branding
  for each row execute function update_branding_updated_at();
