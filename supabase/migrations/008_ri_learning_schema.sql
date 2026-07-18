-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 008 — RI COMMAND CENTRE + LEARNING STUDIO
-- Responsible Individual governance, Regulation 45, Ofsted readiness,
-- challenge logs, alerts, and Aria Learning Studio with training needs loop.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── RI Challenge Logs ─────────────────────────────────────────────────────────

create table if not exists ri_challenge_logs (
  id                   text primary key,
  home_id              text not null,
  title                text not null,
  challenge_area       text not null, -- safeguarding|oversight|compliance|practice|staffing|outcomes|finance
  evidence_summary     text not null,
  challenge_text       text not null,
  escalation_level     text not null default 'standard', -- standard|elevated|critical|formal
  manager_response     text,
  manager_responded_at timestamp with time zone,
  manager_responded_by text,
  action_required      text,
  action_due_date      date,
  action_completed_at  timestamp with time zone,
  status               text not null default 'open' check (status in ('open','responded','action_pending','resolved','escalated')),
  linked_record_type   text,
  linked_record_id     text,
  aria_generated       boolean default false,
  created_by           text not null,
  created_at           timestamp with time zone default now(),
  updated_at           timestamp with time zone default now(),
  metadata             jsonb default '{}'
);

-- ── RI Governance Reports ─────────────────────────────────────────────────────

create table if not exists ri_governance_reports (
  id                text primary key,
  home_id           text not null,
  report_type       text not null check (report_type in ('strategic_summary','reg45_draft','ofsted_readiness','risk_analysis','monthly_overview')),
  report_period     text,
  generated_by_aria boolean default true,
  content           jsonb not null default '{}',
  status            text not null default 'draft' check (status in ('draft','reviewed','approved','published')),
  approved_by       text,
  approved_at       timestamp with time zone,
  created_by        text not null,
  created_at        timestamp with time zone default now(),
  updated_at        timestamp with time zone default now()
);

-- ── Regulation 45 Evidence ────────────────────────────────────────────────────

create table if not exists ri_reg45_evidence (
  id                    text primary key,
  home_id               text not null,
  report_period         text not null, -- e.g. "Q1 2026", "Jan-Mar 2026"
  period_start          date not null,
  period_end            date not null,
  evidence_items        jsonb not null default '[]', -- array of evidence objects
  aria_strengths        text,
  aria_weaknesses       text,
  aria_improvement_areas text,
  aria_child_impact     text,
  aria_action_plan      text,
  aria_ri_statement     text,
  aria_generated_at     timestamp with time zone,
  status                text not null default 'draft' check (status in ('draft','in_progress','reviewed','approved','submitted')),
  submitted_to_ofsted   boolean default false,
  submitted_at          timestamp with time zone,
  reviewed_by           text,
  reviewed_at           timestamp with time zone,
  created_by            text not null,
  created_at            timestamp with time zone default now(),
  updated_at            timestamp with time zone default now()
);

-- ── RI Alerts ─────────────────────────────────────────────────────────────────

create table if not exists ri_alerts (
  id              text primary key,
  home_id         text not null,
  alert_type      text not null, -- safeguarding_risk|repeated_incident|weak_oversight|missing_compliance|overdue_action|rising_risk|training_gap|supervision_gap
  severity        text not null check (severity in ('critical','high','medium','low')),
  title           text not null,
  description     text not null,
  data_evidence   jsonb default '{}',
  is_resolved     boolean default false,
  resolved_at     timestamp with time zone,
  resolved_by     text,
  resolution_note text,
  auto_generated  boolean default true,
  linked_challenge_id text,
  created_by      text not null,
  created_at      timestamp with time zone default now()
);

-- ── Learning Projects ─────────────────────────────────────────────────────────

create table if not exists learning_projects (
  id              text primary key,
  home_id         text not null,
  project_name    text not null,
  pathway         text not null check (pathway in ('child','staff','mixed')),
  topic           text not null,
  learning_objective text,
  target_audience text,
  context_notes   text,
  risk_level      text default 'low' check (risk_level in ('low','medium','high','critical')),
  reading_level   text default 'standard',
  tone            text default 'professional',
  session_length  text,
  status          text not null default 'active' check (status in ('active','completed','archived')),
  linked_training_need_id text,
  linked_ri_alert_id      text,
  created_by      text not null,
  created_at      timestamp with time zone default now(),
  updated_at      timestamp with time zone default now(),
  metadata        jsonb default '{}'
);

-- ── Generated Resources ───────────────────────────────────────────────────────

create table if not exists generated_resources (
  id              text primary key,
  home_id         text not null,
  project_id      text references learning_projects(id),
  resource_type   text not null, -- workshop|flashcard_set|quiz|guidance_note|infographic|curriculum|micro_learning|session_plan|worksheet|safety_plan
  title           text not null,
  topic           text,
  pathway         text check (pathway in ('child','staff','mixed')),
  content         jsonb not null default '{}',
  raw_text        text,
  status          text not null default 'draft' check (status in ('draft','reviewed','approved','published','archived')),
  approved_by     text,
  approved_at     timestamp with time zone,
  assigned_to     text[],
  tags            text[],
  aria_generated  boolean default true,
  created_by      text not null,
  created_at      timestamp with time zone default now(),
  updated_at      timestamp with time zone default now()
);

-- ── Training Needs ────────────────────────────────────────────────────────────

create table if not exists training_needs (
  id                   text primary key,
  home_id              text not null,
  identified_by        text not null check (identified_by in ('manual','aria','supervision','incident','audit','ri_challenge','reg45')),
  need_type            text not null, -- safeguarding|de_escalation|recording_quality|medication|first_aid|mca|pace|trauma_informed|care_planning|risk_assessment|leadership|recruitment
  title                text not null,
  description          text not null,
  priority             text not null check (priority in ('urgent','high','medium','low')),
  affected_staff       text[],
  affected_roles       text[],
  status               text not null default 'identified' check (status in ('identified','learning_studio_sent','resource_generated','assigned','in_progress','completed','no_action')),
  linked_ri_alert_id   text references ri_alerts(id),
  linked_ri_challenge_id text references ri_challenge_logs(id),
  linked_learning_project_id text references learning_projects(id),
  linked_incident_id   text,
  linked_audit_id      text,
  aria_evidence        text,
  deadline             date,
  completed_at         timestamp with time zone,
  created_by           text not null,
  created_at           timestamp with time zone default now(),
  updated_at           timestamp with time zone default now()
);

-- ── Knowledge Gaps ────────────────────────────────────────────────────────────

create table if not exists knowledge_gaps (
  id                text primary key,
  home_id           text not null,
  staff_id          text,
  staff_role        text,
  gap_area          text not null,
  severity          text not null check (severity in ('critical','significant','moderate','minor')),
  identified_from   text not null, -- supervision|incident|training_assessment|observation|audit|self_reported
  evidence_notes    text,
  linked_training_need_id text references training_needs(id),
  status            text not null default 'open' check (status in ('open','in_progress','addressed','monitoring')),
  resolved_at       timestamp with time zone,
  created_by        text not null,
  created_at        timestamp with time zone default now()
);

-- ── Resource Library ──────────────────────────────────────────────────────────

create table if not exists resource_library (
  id              text primary key,
  home_id         text not null,
  resource_id     text not null,
  resource_type   text not null,
  title           text not null,
  topic           text,
  pathway         text,
  tags            text[],
  is_approved     boolean default false,
  is_pinned       boolean default false,
  usage_count     integer default 0,
  created_by      text not null,
  created_at      timestamp with time zone default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table ri_challenge_logs        enable row level security;
alter table ri_governance_reports    enable row level security;
alter table ri_reg45_evidence        enable row level security;
alter table ri_alerts                enable row level security;
alter table learning_projects        enable row level security;
alter table generated_resources      enable row level security;
alter table training_needs           enable row level security;
alter table knowledge_gaps           enable row level security;
alter table resource_library         enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'ri_challenge_logs','ri_governance_reports','ri_reg45_evidence','ri_alerts',
    'learning_projects','generated_resources','training_needs','knowledge_gaps','resource_library'
  ]
  loop
    execute format('drop policy if exists "%s_service_role_all" on %s', t, t);
    execute format(
      'create policy "%s_service_role_all" on %s for all to service_role using (true) with check (true)',
      t, t
    );
  end loop;
end $$;
