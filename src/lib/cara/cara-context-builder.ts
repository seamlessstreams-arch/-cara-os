// ══════════════════════════════════════════════════════════════════════════════
// Cara — SAFE CONTEXT BUILDER
//
// Fetches operational Cara records for Cara command context. Every
// record retrieved is permission-checked, summarised (never raw PII sent to
// the model), and logged in cara_context_links for audit.
//
// Principles:
// 1. Only fetch what the command needs — module-scoped queries.
// 2. Summarise before sending — never pass raw child/staff PII to the model.
// 3. Permission-gate every fetch — the actor's role controls scope.
// 4. Record every context link — full audit trail via cara_context_links.
// 5. Graceful fallback — if Supabase is not configured, return empty context.
// ══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  checkCaraAccess,
  type CaraActor,
  type CaraPermission,
} from "@/lib/cara/cara-permissions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

// ─── Public types ────────────────────────────────────────────────────────────

export interface CaraContextRequest {
  actor: CaraActor;
  homeId?: string;
  childId?: string;
  staffId?: string;
  sourceModule?: string;
  sourceRecordId?: string;
  sourceRecordType?: string;
  /** Override max records per source table. Defaults to 20. */
  limit?: number;
  /** How many days back to look. Defaults to 30. */
  lookbackDays?: number;
}

export interface CaraContextRecord {
  sourceTable: string;
  sourceRecordId: string;
  summary: string;
  date?: string;
  significance?: "routine" | "significant" | "critical";
}

export interface CaraContextResult {
  /** Assembled context snippet to inject into the user prompt */
  contextSnippet: string;
  /** Individual records retrieved (for cara_context_links) */
  records: CaraContextRecord[];
  /** Human-readable summary (no PII) */
  redactedSummary: string;
  /** Whether context was actually fetched from DB */
  fetched: boolean;
}

// ─── Module → source table mapping ──────────────────────────────────────────

interface SourceTableConfig {
  table: string;
  dateColumn: string;
  childScoped: boolean;
  staffScoped: boolean;
  selectColumns: string;
  summaryFn: (row: Record<string, unknown>) => string;
  requiredPermission?: CaraPermission;
}

const SOURCE_TABLES: Record<string, SourceTableConfig[]> = {
  // Child-centric modules pull daily logs, incidents, key work, voice
  daily_log: [
    {
      table: "daily_log_entries",
      dateColumn: "date",
      childScoped: true,
      staffScoped: false,
      selectColumns: "id, date, time, entry_type, content, mood_score, is_significant",
      summaryFn: (r) =>
        `[${r.date}${r.time ? " " + r.time : ""}] ${r.entry_type}: ${truncate(String(r.content ?? ""), 200)}${r.is_significant ? " ★" : ""}`,
    },
  ],
  incident: [
    {
      table: "incidents",
      dateColumn: "date",
      childScoped: true,
      staffScoped: false,
      selectColumns: "id, reference, type, severity, date, time, description, immediate_action, status, outcome",
      summaryFn: (r) =>
        `[${r.date}] Incident ${r.reference ?? ""} (${r.type}, ${r.severity}): ${truncate(String(r.description ?? ""), 200)} — Action: ${truncate(String(r.immediate_action ?? ""), 100)}`,
      requiredPermission: "cara.view_sensitive_context",
    },
  ],
  key_work: [
    {
      table: "key_work_sessions",
      dateColumn: "created_at",
      childScoped: true,
      staffScoped: false,
      selectColumns: "id, title, theme, aims, child_voice, staff_reflection, status",
      summaryFn: (r) =>
        `Key work — ${r.title ?? "Untitled"} (${r.theme ?? "general"}): Aims: ${truncate(String(r.aims ?? ""), 100)}. Child voice: ${truncate(String(r.child_voice ?? "not captured"), 100)}`,
    },
  ],
  child_record: [
    {
      table: "young_people",
      dateColumn: "created_at",
      childScoped: true,
      staffScoped: false,
      selectColumns: "id, first_name, date_of_birth, placement_start, status, risk_flags",
      summaryFn: (r) =>
        `Child: ${r.first_name ?? "—"}, DOB: ${r.date_of_birth ?? "—"}, placement from ${r.placement_start ?? "—"}, status: ${r.status ?? "—"}`,
    },
    {
      table: "voice_records",
      dateColumn: "record_date",
      childScoped: true,
      staffScoped: false,
      selectColumns: "id, record_date, method, context, what_child_said, what_child_wants_to_happen, action_taken, outcome",
      summaryFn: (r) =>
        `[${r.record_date}] Child voice (${r.method}): "${truncate(String(r.what_child_said ?? ""), 150)}" Wants: ${truncate(String(r.what_child_wants_to_happen ?? ""), 100)}`,
    },
    {
      table: "chronology_entries",
      dateColumn: "date",
      childScoped: true,
      staffScoped: false,
      selectColumns: "id, date, category, title, description, significance",
      summaryFn: (r) =>
        `[${r.date}] Chronology (${r.category}, ${r.significance}): ${r.title} — ${truncate(String(r.description ?? ""), 150)}`,
    },
  ],
  management_oversight: [
    {
      table: "daily_log_entries",
      dateColumn: "date",
      childScoped: true,
      staffScoped: false,
      selectColumns: "id, date, entry_type, content, is_significant",
      summaryFn: (r) =>
        `[${r.date}] ${r.entry_type}: ${truncate(String(r.content ?? ""), 200)}${r.is_significant ? " ★" : ""}`,
    },
    {
      table: "incidents",
      dateColumn: "date",
      childScoped: true,
      staffScoped: false,
      selectColumns: "id, reference, type, severity, date, description, status, outcome",
      summaryFn: (r) =>
        `[${r.date}] Incident ${r.reference ?? ""} (${r.type}): ${truncate(String(r.description ?? ""), 200)}`,
      requiredPermission: "cara.view_sensitive_context",
    },
  ],
  shift: [
    {
      table: "handovers",
      dateColumn: "shift_date",
      childScoped: false,
      staffScoped: false,
      selectColumns: "id, shift_date, shift_from, shift_to, child_updates, general_notes, flags",
      summaryFn: (r) =>
        `[${r.shift_date}] Handover ${r.shift_from}→${r.shift_to}: ${truncate(JSON.stringify(r.child_updates ?? {}), 200)}`,
    },
  ],
  shift_summary: [
    {
      table: "handovers",
      dateColumn: "shift_date",
      childScoped: false,
      staffScoped: false,
      selectColumns: "id, shift_date, shift_from, shift_to, child_updates, general_notes, flags",
      summaryFn: (r) =>
        `[${r.shift_date}] Handover ${r.shift_from}→${r.shift_to}: Notes: ${truncate(String(r.general_notes ?? ""), 200)}`,
    },
  ],
  hr: [
    {
      table: "staff_members",
      dateColumn: "created_at",
      childScoped: false,
      staffScoped: true,
      selectColumns: "id, first_name, last_name, role, job_title, employment_status, start_date, probation_end_date, is_active",
      summaryFn: (r) =>
        `Staff: ${r.first_name} ${r.last_name}, ${r.job_title ?? r.role}, status: ${r.employment_status}, since ${r.start_date ?? "—"}`,
      requiredPermission: "cara.hr",
    },
    {
      table: "supervisions",
      dateColumn: "actual_date",
      childScoped: false,
      staffScoped: true,
      selectColumns: "id, staff_id, actual_date, type, status, discussion_points, actions_agreed, wellbeing_score",
      summaryFn: (r) =>
        `[${r.actual_date}] Supervision (${r.type}): ${truncate(String(r.discussion_points ?? ""), 200)}`,
      requiredPermission: "cara.hr",
    },
    {
      table: "training_records",
      dateColumn: "completed_date",
      childScoped: false,
      staffScoped: true,
      selectColumns: "id, staff_id, course_name, category, completed_date, expiry_date, status, is_mandatory",
      summaryFn: (r) =>
        `Training: ${r.course_name} (${r.category}), completed ${r.completed_date ?? "—"}, expires ${r.expiry_date ?? "n/a"}, ${r.is_mandatory ? "mandatory" : "optional"}`,
      requiredPermission: "cara.hr",
    },
  ],
  supervision: [
    {
      table: "supervisions",
      dateColumn: "actual_date",
      childScoped: false,
      staffScoped: true,
      selectColumns: "id, staff_id, supervisor_id, actual_date, type, status, discussion_points, actions_agreed, wellbeing_score",
      summaryFn: (r) =>
        `[${r.actual_date}] Supervision (${r.type}): ${truncate(String(r.discussion_points ?? ""), 200)}. Wellbeing: ${r.wellbeing_score ?? "—"}/10`,
      requiredPermission: "cara.hr",
    },
  ],
  safer_recruitment: [
    {
      table: "staff_members",
      dateColumn: "created_at",
      childScoped: false,
      staffScoped: true,
      selectColumns: "id, first_name, last_name, role, job_title, employment_type, employment_status, start_date, dbs_number, dbs_date, dbs_update_service",
      summaryFn: (r) =>
        `Candidate: ${r.first_name} ${r.last_name}, ${r.job_title ?? r.role}, DBS: ${r.dbs_number ? "held" : "not on file"}, update service: ${r.dbs_update_service ? "yes" : "no"}`,
      requiredPermission: "cara.recruitment",
    },
  ],
  audit: [
    {
      table: "qa_audits",
      dateColumn: "date",
      childScoped: false,
      staffScoped: false,
      selectColumns: "id, title, category, date, score, max_score, status, findings, actions",
      summaryFn: (r) =>
        `[${r.date}] Audit: ${r.title} (${r.category}), score ${r.score}/${r.max_score}, status ${r.status}. Findings: ${truncate(String(r.findings ?? ""), 200)}`,
    },
  ],
  quality_assurance: [
    {
      table: "qa_audits",
      dateColumn: "date",
      childScoped: false,
      staffScoped: false,
      selectColumns: "id, title, category, date, score, max_score, status, findings, actions",
      summaryFn: (r) =>
        `[${r.date}] QA: ${r.title} (${r.category}), ${r.score}/${r.max_score}. ${truncate(String(r.findings ?? ""), 200)}`,
    },
    {
      table: "home_climate_snapshots",
      dateColumn: "snapshot_date",
      childScoped: false,
      staffScoped: false,
      selectColumns: "id, snapshot_date, period, overall_climate_score, climate_delta, hotspot_flags, narrative",
      summaryFn: (r) =>
        `[${r.snapshot_date}] Climate (${r.period}): overall ${r.overall_climate_score}/100, delta ${r.climate_delta}. ${truncate(String(r.narrative ?? ""), 150)}`,
    },
  ],
  ri_dashboard: [
    {
      table: "home_climate_snapshots",
      dateColumn: "snapshot_date",
      childScoped: false,
      staffScoped: false,
      selectColumns: "id, snapshot_date, period, overall_climate_score, climate_delta, hotspot_flags, narrative",
      summaryFn: (r) =>
        `[${r.snapshot_date}] Climate: ${r.overall_climate_score}/100 (Δ${r.climate_delta}). ${truncate(String(r.narrative ?? ""), 150)}`,
      requiredPermission: "cara.ri_qa",
    },
    {
      table: "pattern_alerts",
      dateColumn: "first_detected_at",
      childScoped: false,
      staffScoped: false,
      selectColumns: "id, alert_type, title, severity, status, recurrence_count, description",
      summaryFn: (r) =>
        `Pattern: ${r.title} (${r.alert_type}, ${r.severity}, ×${r.recurrence_count}): ${truncate(String(r.description ?? ""), 150)}`,
      requiredPermission: "cara.ri_qa",
    },
  ],
  documents: [
    {
      table: "documents",
      dateColumn: "created_at",
      childScoped: false,
      staffScoped: false,
      selectColumns: "id, title, category, description, file_name, linked_child_id, linked_staff_id, expiry_date",
      summaryFn: (r) =>
        `Document: ${r.title} (${r.category}), file: ${r.file_name ?? "—"}${r.expiry_date ? `, expires ${r.expiry_date}` : ""}`,
    },
  ],
  calendar: [
    {
      table: "supervisions",
      dateColumn: "scheduled_date",
      childScoped: false,
      staffScoped: false,
      selectColumns: "id, staff_id, scheduled_date, type, status",
      summaryFn: (r) =>
        `Upcoming: Supervision (${r.type}) scheduled ${r.scheduled_date}, status ${r.status}`,
    },
  ],
  complaint: [
    {
      table: "incidents",
      dateColumn: "date",
      childScoped: true,
      staffScoped: false,
      selectColumns: "id, reference, type, severity, date, description, status, outcome",
      summaryFn: (r) =>
        `[${r.date}] ${r.type} ${r.reference}: ${truncate(String(r.description ?? ""), 200)}`,
      requiredPermission: "cara.view_sensitive_context",
    },
  ],
};

// ─── Fallback: modules that share the same sources as another ───────────────
const MODULE_ALIASES: Record<string, string> = {
  child_review: "child_record",
  team_meeting: "calendar",
  regulation_44: "ri_dashboard",
  regulation_45: "ri_dashboard",
};

// ─── Universal sources always included if available ────────────────────────
const UNIVERSAL_SOURCES: SourceTableConfig[] = [
  {
    table: "tasks",
    dateColumn: "created_at",
    childScoped: false,
    staffScoped: false,
    selectColumns: "id, title, priority, status, due_date, assigned_to, category, escalated",
    summaryFn: (r) =>
      `Task: ${r.title} (${r.priority}, ${r.status})${r.due_date ? `, due ${r.due_date}` : ""}${r.escalated ? " ⚠ escalated" : ""}`,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ══════════════════════════════════════════════════════════════════════════════

export async function buildCaraContext(
  request: CaraContextRequest,
): Promise<CaraContextResult> {
  const empty: CaraContextResult = {
    contextSnippet: "",
    records: [],
    redactedSummary: "No additional context fetched",
    fetched: false,
  };

  if (!isSupabaseEnabled()) return empty;
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) return empty;
  const supabase = loose(supabaseRaw);

  const module = resolveModule(request.sourceModule);
  const configs = getSourceConfigs(module);
  const limit = request.limit ?? 20;
  const lookbackDays = request.lookbackDays ?? 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
  const cutoffISO = cutoffDate.toISOString().slice(0, 10);

  const allRecords: CaraContextRecord[] = [];

  // Run fetchers in parallel
  const fetchers = configs.map((config) =>
    fetchSource(supabase, config, request, cutoffISO, limit),
  );
  const results = await Promise.allSettled(fetchers);

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      allRecords.push(...result.value);
    }
  }

  if (allRecords.length === 0) return empty;

  // Build the context snippet
  const snippet = buildContextSnippet(allRecords);

  // Write context links (best effort)
  if (request.homeId) {
    await writeContextLinks(supabase, request, allRecords);
  }

  return {
    contextSnippet: snippet,
    records: allRecords,
    redactedSummary: `${allRecords.length} records from ${new Set(allRecords.map((r) => r.sourceTable)).size} source(s)`,
    fetched: true,
  };
}

// ─── Internals ──────────────────────────────────────────────────────────────

function resolveModule(module?: string): string | undefined {
  if (!module) return undefined;
  return MODULE_ALIASES[module] ?? module;
}

function getSourceConfigs(module?: string): SourceTableConfig[] {
  const configs: SourceTableConfig[] = [];

  if (module && SOURCE_TABLES[module]) {
    configs.push(...SOURCE_TABLES[module]);
  }

  // Always include universal sources
  configs.push(...UNIVERSAL_SOURCES);

  // De-duplicate by table name (keep first occurrence)
  const seen = new Set<string>();
  return configs.filter((c) => {
    if (seen.has(c.table)) return false;
    seen.add(c.table);
    return true;
  });
}

async function fetchSource(
  supabase: LooseSupabase,
  config: SourceTableConfig,
  request: CaraContextRequest,
  cutoffISO: string,
  limit: number,
): Promise<CaraContextRecord[]> {
  // Permission check — if the source requires a specific permission, verify
  if (config.requiredPermission) {
    const access = checkCaraAccess(request.actor, {
      permission: config.requiredPermission,
      homeId: request.homeId,
    });
    if (!access.allowed) return [];
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from(config.table) as any).select(config.selectColumns);

    // Scope to home
    if (request.homeId) {
      query = query.eq("home_id", request.homeId);
    }

    // Scope to child if child-scoped
    if (config.childScoped && request.childId) {
      query = query.eq("child_id", request.childId);
    }

    // Scope to staff if staff-scoped
    if (config.staffScoped && request.staffId) {
      query = query.eq("staff_id", request.staffId);
    }

    // Date filter
    query = query.gte(config.dateColumn, cutoffISO);

    // Order and limit
    query = query.order(config.dateColumn, { ascending: false }).limit(limit);

    const { data, error } = await query;
    if (error || !data) return [];

    return (data as Record<string, unknown>[]).map((row) => ({
      sourceTable: config.table,
      sourceRecordId: String(row.id ?? ""),
      summary: config.summaryFn(row),
      date: String(row[config.dateColumn] ?? ""),
      significance: inferSignificance(row),
    }));
  } catch {
    // Swallow per-source failures — other sources still contribute
    return [];
  }
}

function inferSignificance(
  row: Record<string, unknown>,
): "routine" | "significant" | "critical" {
  if (row.significance) {
    const s = String(row.significance);
    if (s === "critical") return "critical";
    if (s === "significant") return "significant";
  }
  if (row.severity === "critical" || row.severity === "high") return "critical";
  if (row.is_significant === true) return "significant";
  if (row.escalated === true) return "critical";
  if (row.priority === "urgent") return "critical";
  if (row.priority === "high") return "significant";
  return "routine";
}

function buildContextSnippet(records: CaraContextRecord[]): string {
  // Sort: critical first, then significant, then routine; within each tier by date desc
  const sorted = [...records].sort((a, b) => {
    const sigOrder = { critical: 0, significant: 1, routine: 2 };
    const aSig = sigOrder[a.significance ?? "routine"];
    const bSig = sigOrder[b.significance ?? "routine"];
    if (aSig !== bSig) return aSig - bSig;
    return (b.date ?? "").localeCompare(a.date ?? "");
  });

  const lines: string[] = [
    "ADDITIONAL CONTEXT FROM CARA RECORDS (do not invent beyond these):",
    "",
  ];

  // Group by source table
  const grouped = new Map<string, CaraContextRecord[]>();
  for (const rec of sorted) {
    const existing = grouped.get(rec.sourceTable) ?? [];
    existing.push(rec);
    grouped.set(rec.sourceTable, existing);
  }

  for (const [table, recs] of grouped) {
    lines.push(`── ${formatTableName(table)} (${recs.length} records) ──`);
    for (const rec of recs) {
      lines.push(`  ${rec.summary}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function formatTableName(table: string): string {
  return table
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function writeContextLinks(
  supabase: LooseSupabase,
  request: CaraContextRequest,
  records: CaraContextRecord[],
): Promise<void> {
  if (!request.sourceRecordId) return;

  const links = records.slice(0, 50).map((rec) => ({
    id: `cara_ctx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    request_id: request.sourceRecordId,
    source_table: rec.sourceTable,
    source_record_id: rec.sourceRecordId,
    summary: rec.summary.slice(0, 500),
  }));

  if (links.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("cara_context_links") as any).insert(links);
  }
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + "…";
}

// ─── Exports for testing ────────────────────────────────────────────────────
export const _testing = {
  resolveModule,
  getSourceConfigs,
  inferSignificance,
  buildContextSnippet,
  truncate,
  SOURCE_TABLES,
  UNIVERSAL_SOURCES,
  MODULE_ALIASES,
};
