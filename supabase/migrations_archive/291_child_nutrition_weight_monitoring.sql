-- Child Nutrition & Weight Monitoring
create table if not exists public.cs_child_nutrition_weight_monitoring (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  child_id uuid,
  assessment_date date not null,
  bmi_category text not null default 'not_assessed',
  dietary_need text not null default 'none',
  monitoring_status text not null default 'routine',
  assessment_type text not null default 'initial',
  weight_recorded boolean not null default false,
  height_recorded boolean not null default false,
  bmi_calculated boolean not null default false,
  dietary_needs_met boolean not null default false,
  portion_sizes_appropriate boolean not null default false,
  hydration_adequate boolean not null default false,
  clinical_referral_made boolean not null default false,
  weight_management_plan boolean not null default false,
  assessor_name text,
  bmi_value numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_child_nutrition_weight_monitoring enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_child_nutrition_weight_monitoring
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
