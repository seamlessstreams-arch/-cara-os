-- Compliance Certificate Tracking
create table if not exists public.cs_compliance_certificates (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  certificate_type text not null,
  certificate_reference text not null,
  issuing_body text not null,
  compliance_status text not null default 'valid',
  renewal_urgency text not null default 'routine',
  issue_date date not null,
  expiry_date date not null,
  last_inspection_date date,
  next_inspection_due date,
  inspector_name text,
  remedial_actions_required boolean not null default false,
  remedial_actions_completed boolean not null default false,
  digital_copy_stored boolean not null default false,
  ofsted_notified boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_compliance_certificates enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_compliance_certificates
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
