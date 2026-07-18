-- Staff Payroll Compliance
create table if not exists public.cs_staff_payroll_compliance (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  staff_name text not null,
  check_date date not null,
  check_type text not null,
  compliance_status text not null,
  right_to_work_verified boolean not null default true,
  pension_enrolled boolean not null default false,
  pension_opt_out boolean not null default false,
  tax_code_verified boolean not null default true,
  ni_number_verified boolean not null default true,
  contract_on_file boolean not null default true,
  pay_rate_confirmed boolean not null default true,
  next_review_date date,
  reviewer_name text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_staff_payroll_compliance enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_staff_payroll_compliance
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
