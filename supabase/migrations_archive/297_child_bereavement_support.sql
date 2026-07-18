-- Child Bereavement Support
create table if not exists public.cs_child_bereavement_support (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  bereavement_date date not null,
  deceased_relationship text not null,
  grief_stage text not null,
  support_type text not null,
  specialist_referral_made boolean not null default false,
  specialist_service text,
  camhs_involvement boolean not null default false,
  school_notified boolean not null default true,
  social_worker_notified boolean not null default true,
  memorial_activity_planned boolean not null default false,
  ongoing_support_needed boolean not null default true,
  review_date date,
  key_worker_name text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_child_bereavement_support enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_child_bereavement_support
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
