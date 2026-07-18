-- Quality of Care Reviews (Reg 45)
create table if not exists public.cs_quality_of_care_reviews (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  review_date date not null,
  review_period_start date not null,
  review_period_end date not null,
  review_domain text not null,
  domain_rating text not null default 'good',
  review_frequency text not null default 'six_monthly',
  action_priority text not null default 'medium',
  reviewer_name text not null,
  children_consulted boolean not null default false,
  staff_consulted boolean not null default false,
  external_feedback_included boolean not null default false,
  reg44_reports_reviewed boolean not null default false,
  improvement_actions_identified boolean not null default false,
  actions_assigned boolean not null default false,
  shared_with_ofsted boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_quality_of_care_reviews enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_quality_of_care_reviews
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
