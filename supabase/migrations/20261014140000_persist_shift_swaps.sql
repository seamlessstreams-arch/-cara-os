-- ════════════════════════════════════════════════════════════════════════════
-- Persistence: shift_swaps (staff shift-swap requests).
--
-- /api/v1/rota/swaps read and created shift-swap requests via db.shiftSwaps
-- directly (no dal accessor, no table), so on a live tenant a request a member
-- of staff raised vanished with the serverless instance and the list was always
-- empty. Pure-new table (home_id added for tenant scoping; the record carries
-- none, so the dal injects the home uuid on create).
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists shift_swaps (
  id                   text primary key default gen_random_uuid()::text,
  home_id              uuid,
  requester_id         text not null,
  target_staff_id      text not null,
  requester_shift_id   text not null,
  target_shift_id      text,
  status               text not null default 'pending',
  reason               text not null default '',
  manager_notes        text,
  decided_by           text,
  decided_at           timestamptz,
  created_at           timestamptz not null default now()
);

alter table shift_swaps enable row level security;

create index if not exists idx_shift_swaps_home on shift_swaps(home_id);

drop policy if exists "Tenant isolation" on shift_swaps;
create policy "Tenant isolation" on shift_swaps
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

grant select, insert, update, delete on table shift_swaps to service_role;
notify pgrst, 'reload schema';
