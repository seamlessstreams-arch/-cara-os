-- ══════════════════════════════════════════════════════════════════════════════
-- 132 · CHILDREN'S FUND TRANSACTIONS
-- Tracks personal funds held for children in care, pocket money,
-- savings, birthday/festival allowances, and financial accounting.
-- CHR 2015 Reg 34, Reg 9, Reg 45.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_fund_transactions (
  id            uuid primary key default gen_random_uuid(),
  home_id       uuid not null references homes(id) on delete cascade,

  child_name                    text    not null,
  child_id                      text    not null,
  transaction_date              date    not null default now(),
  transaction_type              text    not null default 'pocket_money',
  fund_category                 text    not null default 'pocket_money',
  amount                        numeric(10,2) not null default 0,
  is_credit                     boolean not null default true,
  running_balance               numeric(10,2) not null default 0,
  authorisation_status          text    not null default 'pending_authorisation',
  authorised_by                 text    not null default '',
  receipt_attached              boolean not null default false,
  child_signed                  boolean not null default false,
  staff_signed                  boolean not null default false,
  second_signatory              boolean not null default false,
  purpose                       text    not null default '',
  audit_result                  text    not null default 'not_audited',
  audit_date                    date,
  notes                         text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index
create index if not exists idx_cs_fund_transactions_home
  on cs_fund_transactions(home_id);

-- RLS
alter table cs_fund_transactions enable row level security;

do $$ begin
  create policy "Tenant isolation" on cs_fund_transactions
    using (home_id = get_my_home_id());
exception when duplicate_object then null;
end $$;
