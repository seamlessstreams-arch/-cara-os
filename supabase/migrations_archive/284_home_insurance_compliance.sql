-- Home Insurance Compliance
create table if not exists public.cs_home_insurance_compliance (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  policy_name text not null,
  policy_number text,
  insurance_type text not null default 'public_liability',
  compliance_status text not null default 'compliant',
  coverage_level text not null default 'full',
  review_outcome text not null default 'pending',
  renewal_date date not null,
  last_review_date date not null,
  premium_amount numeric,
  policy_document_held boolean not null default false,
  certificate_displayed boolean not null default false,
  cover_adequate boolean not null default false,
  excess_acceptable boolean not null default false,
  broker_reviewed boolean not null default false,
  claims_history_clear boolean not null default false,
  regulatory_requirement_met boolean not null default false,
  management_reviewed boolean not null default false,
  reviewer_name text,
  insurer_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_home_insurance_compliance enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_home_insurance_compliance
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
