-- Children's Pocket Money Audit
create table if not exists public.cs_childrens_pocket_money_audits (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  child_id uuid,
  audit_date date not null,
  transaction_type text not null,
  audit_outcome text not null default 'compliant',
  reconciliation_status text not null default 'pending',
  spending_category text not null,
  amount numeric not null default 0,
  running_balance numeric not null default 0,
  receipt_obtained boolean not null default false,
  child_signed boolean not null default false,
  staff_witnessed boolean not null default false,
  two_signatures_present boolean not null default false,
  balance_matches_record boolean not null default true,
  child_consulted_on_spending boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_childrens_pocket_money_audits enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_childrens_pocket_money_audits
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
