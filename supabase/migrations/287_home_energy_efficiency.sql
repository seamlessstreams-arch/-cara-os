-- Home Energy Efficiency
create table if not exists public.cs_home_energy_efficiency (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  assessor_name text not null,
  assessor_id uuid,
  assessment_date date not null,
  energy_area text not null default 'heating',
  efficiency_rating text not null default 'not_assessed',
  improvement_status text not null default 'identified',
  assessment_type text not null default 'annual_review',
  current_epc_valid boolean not null default false,
  smart_meter_installed boolean not null default false,
  led_lighting_throughout boolean not null default false,
  insulation_adequate boolean not null default false,
  draught_proofing_done boolean not null default false,
  renewable_energy_installed boolean not null default false,
  energy_saving_measures_active boolean not null default false,
  children_involved_in_saving boolean not null default false,
  monthly_cost_estimate numeric,
  carbon_footprint_tonnes numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_home_energy_efficiency enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_home_energy_efficiency
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
