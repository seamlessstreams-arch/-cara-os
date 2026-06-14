-- ════════════════════════════════════════════════════════════════════════════
-- CARA — migration 420: practice analysis history (metadata only)
--
-- Durable, cross-session history of practice analyses so leaders can see whether
-- recording quality is improving over time. METADATA ONLY — scores, bands and
-- flag counts; NO record content is stored here. Additive + guarded; mirrors the
-- 418 pattern (TEXT app ids per 412/413, home-scoped RLS via get_my_home_id()).
-- The app writes these best-effort from the analyse routes; until Supabase is
-- active the in-memory store holds them. Safe to run repeatedly.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists pace_analysis_results (
  id text primary key,
  at timestamptz not null default now(),
  home_id text,
  child_id text,
  staff_id text,
  context text not null,
  score integer not null check (score between 0 and 100),
  band text not null,
  flag_count integer not null default 0,
  manager_review_required boolean not null default false
);

create table if not exists writing_reviews (
  id text primary key,
  at timestamptz not null default now(),
  home_id text,
  staff_id text,
  record_type text not null,
  overall_score integer not null check (overall_score between 0 and 100),
  flag_count integer not null default 0
);

create index if not exists idx_pace_analysis_results_at on pace_analysis_results (at);
create index if not exists idx_pace_analysis_results_home on pace_analysis_results (home_id);
create index if not exists idx_writing_reviews_at on writing_reviews (at);
create index if not exists idx_writing_reviews_home on writing_reviews (home_id);

-- Home-scoped RLS (additive; mirrors the 413 tenant-isolation pattern).
do $$
declare t text;
begin
  foreach t in array array['pace_analysis_results','writing_reviews']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "Tenant isolation" on %I', t);
    execute format(
      'create policy "Tenant isolation" on %I for all using (home_id = get_my_home_id()) with check (home_id = get_my_home_id())',
      t
    );
  end loop;
end $$;
