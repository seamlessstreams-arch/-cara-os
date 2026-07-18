-- ══════════════════════════════════════════════════════════════════════════════
-- 133 · STAFF ATTENDANCE & TIMEKEEPING
-- Tracks staff attendance records, punctuality, shift patterns,
-- overtime, and compliance with working time regulations.
-- CHR 2015 Reg 33, Reg 22; Working Time Regulations 1998.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_staff_attendance (
  id            uuid primary key default gen_random_uuid(),
  home_id       uuid not null references homes(id) on delete cascade,

  staff_name                    text    not null,
  staff_id                      text    not null,
  attendance_date               date    not null default now(),
  attendance_status             text    not null default 'present',
  shift_type                    text    not null default 'day_shift',
  scheduled_start               text    not null default '08:00',
  scheduled_end                 text    not null default '20:00',
  actual_start                  text,
  actual_end                    text,
  hours_worked                  numeric(5,2),
  overtime_hours                numeric(5,2) not null default 0,
  overtime_reason               text,
  late_minutes                  integer not null default 0,
  compliance_flag               text    not null default 'not_checked',
  agency_staff_used             boolean not null default false,
  minimum_staffing_met          boolean not null default true,
  handover_completed            boolean not null default false,
  notes                         text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index
create index if not exists idx_cs_staff_attendance_home
  on cs_staff_attendance(home_id);

-- RLS
alter table cs_staff_attendance enable row level security;

do $$ begin
  create policy "Tenant isolation" on cs_staff_attendance
    using (home_id = get_my_home_id());
exception when duplicate_object then null;
end $$;
