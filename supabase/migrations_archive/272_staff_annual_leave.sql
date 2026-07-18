-- Staff Annual Leave Tracking
create table if not exists public.cs_staff_annual_leave (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  staff_name text not null,
  staff_id uuid,
  start_date date not null,
  end_date date not null,
  leave_type text not null default 'annual_leave',
  approval_status text not null default 'requested',
  cover_arrangement text not null default 'no_cover_needed',
  staffing_impact text not null default 'no_impact',
  days_requested integer not null default 0,
  approved_by text,
  cover_confirmed boolean not null default false,
  handover_completed boolean not null default false,
  children_informed boolean not null default false,
  minimum_staffing_maintained boolean not null default true,
  entitlement_remaining numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_staff_annual_leave enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_staff_annual_leave
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
