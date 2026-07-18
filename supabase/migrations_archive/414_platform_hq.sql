-- ══════════════════════════════════════════════════════════════════════════════
-- Cara — Migration 414 — Platform owner ("Cara HQ")
-- Pain Point Resolutions Ltd (trading as Cara)
--
-- 🔴 SAFEGUARDING BOUNDARY: platform admins operate on METADATA only (counts,
-- usage, billing, health). NO policy in this migration grants access to
-- children's record content (young_people, incidents, daily_log_entries, …).
-- break_glass_grants records intent; it does NOT itself open data — record-level
-- support access requires the separate DPO-approved process.
--
-- Conventions (matching 412/413): application ids are TEXT ("org_…", "bg_…")
-- so demo-mode write-through rows can be addressed by the same id later.
-- Adapted to this schema: tenancy anchor is `homes` (001); there is no
-- profiles/current_org() here — platform policies are ADDITIVE on top of the
-- existing home-scoped policies in 003 and remove nothing.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Customers (organisations) ────────────────────────────────────────────────
create table if not exists organisations (
  id                    text primary key,
  name                  text not null,
  plan                  text not null default 'pilot'
                          check (plan in ('pilot','essentials','professional','group')),
  status                text not null default 'active'
                          check (status in ('active','suspended','churned')),
  primary_contact_name  text,
  primary_contact_email text,
  first_home_name       text,
  created_by            uuid references auth.users(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists organisations_updated_at on organisations;
create trigger organisations_updated_at
  before update on organisations
  for each row execute function set_updated_at();

-- Existing single-org deployments keep working: nullable link only.
alter table homes add column if not exists org_id text references organisations(id);

-- ── Platform admins (Cara company staff) ─────────────────────────────────────
create table if not exists platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  created_at timestamptz not null default now()
);

create or replace function is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

-- ── Usage metering (append-only activity log) ────────────────────────────────
create table if not exists usage_events (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  org_id     text references organisations(id) on delete set null,
  user_label text,
  kind       text not null,
  meta       jsonb not null default '{}'
);
create index if not exists idx_usage_org_at on usage_events(org_id, at);
create index if not exists idx_usage_kind_at on usage_events(kind, at);

-- ── AI usage & cost metering (margin watching, not billing) ──────────────────
create table if not exists ai_usage (
  id            bigint generated always as identity primary key,
  at            timestamptz not null default now(),
  org_id        text references organisations(id) on delete set null,
  feature       text not null,
  model         text,
  tokens_input  integer not null default 0,
  tokens_output integer not null default 0,
  cost_gbp      numeric(10,4) not null default 0,
  estimated     boolean not null default true
);
create index if not exists idx_ai_org_at on ai_usage(org_id, at);
create index if not exists idx_ai_feature_at on ai_usage(feature, at);

-- ── Break-glass grants (auditable intent; never opens data by itself) ────────
create table if not exists break_glass_grants (
  id          text primary key,
  admin_label text not null,
  admin_id    uuid references auth.users(id),
  org_id      text not null references organisations(id) on delete cascade,
  reason      text not null,
  granted_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  revoked_at  timestamptz
);
create index if not exists idx_bg_org on break_glass_grants(org_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table organisations      enable row level security;
alter table platform_admins    enable row level security;
alter table usage_events       enable row level security;
alter table ai_usage           enable row level security;
alter table break_glass_grants enable row level security;

drop policy if exists hq_admins_select on platform_admins;
create policy hq_admins_select on platform_admins
  for select using ( is_platform_admin() );

drop policy if exists hq_orgs_select on organisations;
create policy hq_orgs_select on organisations
  for select using ( is_platform_admin() );
drop policy if exists hq_orgs_write on organisations;
create policy hq_orgs_write on organisations
  for all using ( is_platform_admin() ) with check ( is_platform_admin() );

drop policy if exists hq_usage_select on usage_events;
create policy hq_usage_select on usage_events
  for select using ( is_platform_admin() or is_manager() );
drop policy if exists hq_usage_insert on usage_events;
create policy hq_usage_insert on usage_events
  for insert with check ( is_platform_admin() );

drop policy if exists hq_ai_select on ai_usage;
create policy hq_ai_select on ai_usage
  for select using ( is_platform_admin() );

drop policy if exists hq_bg_all on break_glass_grants;
create policy hq_bg_all on break_glass_grants
  for all using ( is_platform_admin() ) with check ( is_platform_admin() );

-- ADDITIVE metadata read on homes for platform admins (policies are OR'd —
-- this adds visibility of home names/counts and removes nothing from staff).
drop policy if exists homes_platform_admin_read on homes;
create policy homes_platform_admin_read on homes
  for select using ( is_platform_admin() );

-- ══════════════════════════════════════════════════════════════════════════════
-- Bootstrap — make yourself the first platform admin AFTER creating your own
-- auth user (Supabase Dashboard → Authentication → Add user), then run:
--
--   insert into platform_admins (user_id, full_name)
--   values ('<YOUR_AUTH_USER_UUID>', 'Owner — Pain Point Resolutions Ltd');
--
-- (Also documented in docs/ACTIVATION.md.)
-- ══════════════════════════════════════════════════════════════════════════════
