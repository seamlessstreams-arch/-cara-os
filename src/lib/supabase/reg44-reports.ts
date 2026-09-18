// ══════════════════════════════════════════════════════════════════════════════
// Supabase data layer for persisted Regulation 44 reports.
//
// Mirrors db.reg44Reports (the in-memory accessor) so /api/v1/reg44-report can
// swap backends behind one flag — the same shape care-events.ts uses. Backed by
// the `reg44_reports` + `reg44_report_audit` tables (migration
// 20260918150000_reg44_reports_persist).
//
// The report is a structured document with a lifecycle, and is stored as one:
// draft / sections / signed_snapshot / addenda in jsonb, the queryable fields
// promoted to columns. The audit trail is a separate APPEND-ONLY table; on
// update, only entries beyond what is already stored are inserted, so history
// is never rewritten even if a caller hands back a mutated array.
//
// ONLY import this from server-side code. Never expose the service-role client.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "./server";
import type { SB } from "./loose-client";
import type { PersistedReg44Report, Reg44AuditEntry, Reg44Response } from "@/lib/reg44-report-intelligence/report-lifecycle";

// These two tables are newer than the generated Database type; the loose
// client is the codebase's one declared escape hatch for exactly that.
function supabase(): SB {
  const client = createServerClient();
  if (!client) throw new Error("Supabase not configured — check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  return client as unknown as SB;
}

type ReportRow = {
  id: string;
  home_id: string;
  month: string;
  status: PersistedReg44Report["status"];
  locked: boolean;
  visit_date: string | null;
  visitor_name: string | null;
  announced: boolean | null;
  draft: PersistedReg44Report["draft"];
  sections: NonNullable<PersistedReg44Report["sections"]>;
  signed_snapshot: PersistedReg44Report["signedSnapshot"];
  signed_sections: NonNullable<PersistedReg44Report["sections"]> | null;
  addenda: PersistedReg44Report["addenda"];
  engine_version: string | null;
  manager_response: string | null;
  manager_responded_at: string | null;
  manager_responded_by: string | null;
  ri_response: string | null;
  ri_responded_at: string | null;
  ri_responded_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  signed_at: string | null;
  signed_by: string | null;
};

type AuditRow = { seq: number; report_id: string; at: string; actor: string; action: Reg44AuditEntry["action"]; detail: string };

function responseFrom(text: string | null, at: string | null, by: string | null): Reg44Response | null {
  if (!text) return null;
  return { text, at: at ?? "", by: by ?? "" };
}

function toReport(row: ReportRow, audit: AuditRow[]): PersistedReg44Report {
  return {
    id: row.id,
    homeId: row.home_id,
    month: row.month,
    status: row.status,
    locked: row.locked,
    draft: row.draft,
    sections: row.sections ?? [],
    signedSnapshot: row.signed_snapshot ?? null,
    signedSections: row.signed_sections ?? null,
    addenda: row.addenda ?? [],
    engineVersion: row.engine_version ?? undefined,
    managerResponse: responseFrom(row.manager_response, row.manager_responded_at, row.manager_responded_by),
    riResponse: responseFrom(row.ri_response, row.ri_responded_at, row.ri_responded_by),
    auditTrail: audit.map((a) => ({ at: a.at, actor: a.actor, action: a.action, detail: a.detail })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Columns derived from the document, kept in step on every write. */
function promoted(r: PersistedReg44Report) {
  const meta = r.draft?.meta;
  return {
    status: r.status,
    locked: r.locked,
    visit_date: meta?.visitDate ? meta.visitDate.slice(0, 10) : null,
    visitor_name: meta?.visitorName || null,
    announced: typeof meta?.announced === "boolean" ? meta.announced : null,
    draft: r.draft,
    sections: r.sections ?? [],
    signed_snapshot: r.signedSnapshot,
    signed_sections: r.signedSections ?? null,
    addenda: r.addenda ?? [],
    signed_at: r.draft?.signOff?.signedAt ?? null,
    signed_by: r.draft?.signOff?.signedBy ?? null,
    manager_response: r.managerResponse?.text ?? null,
    manager_responded_at: r.managerResponse?.at || null,
    manager_responded_by: r.managerResponse?.by || null,
    ri_response: r.riResponse?.text ?? null,
    ri_responded_at: r.riResponse?.at || null,
    ri_responded_by: r.riResponse?.by || null,
    updated_at: r.updatedAt,
  };
}

async function auditFor(sb: SB, reportId: string): Promise<AuditRow[]> {
  const { data, error } = await sb.from("reg44_report_audit").select("*").eq("report_id", reportId).order("seq", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AuditRow[];
}

async function appendAudit(sb: SB, r: PersistedReg44Report, alreadyStored: number): Promise<void> {
  const fresh = (r.auditTrail ?? []).slice(alreadyStored);
  if (!fresh.length) return;
  const { error } = await sb.from("reg44_report_audit").insert(
    fresh.map((e) => ({ report_id: r.id, home_id: r.homeId, at: e.at, actor: e.actor, action: e.action, detail: e.detail ?? "" })),
  );
  if (error) throw error;
}

export const sbReg44Reports = {
  async findAll(homeId?: string): Promise<PersistedReg44Report[]> {
    const sb = supabase();
    let q = sb.from("reg44_reports").select("*").order("month", { ascending: false });
    if (homeId) q = q.eq("home_id", homeId);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data ?? []) as ReportRow[];
    // Listing views don't need the trail; findById supplies it.
    return rows.map((row) => toReport(row, []));
  },

  async findById(id: string): Promise<PersistedReg44Report | null> {
    const sb = supabase();
    const { data, error } = await sb.from("reg44_reports").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return toReport(data as ReportRow, await auditFor(sb, id));
  },

  async findByHomeMonth(homeId: string, month: string): Promise<PersistedReg44Report | null> {
    const sb = supabase();
    const { data, error } = await sb.from("reg44_reports").select("*").eq("home_id", homeId).eq("month", month).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as ReportRow;
    return toReport(row, await auditFor(sb, row.id));
  },

  async create(r: PersistedReg44Report): Promise<PersistedReg44Report> {
    const sb = supabase();
    const { error } = await sb.from("reg44_reports").insert({
      id: r.id,
      home_id: r.homeId,
      month: r.month,
      engine_version: r.engineVersion ?? null,
      created_by: r.auditTrail?.[0]?.actor ?? null,
      created_at: r.createdAt,
      ...promoted(r),
    });
    if (error) throw error;
    await appendAudit(sb, r, 0);
    return r;
  },

  async update(id: string, r: PersistedReg44Report): Promise<PersistedReg44Report | null> {
    const sb = supabase();
    const existing = await auditFor(sb, id);
    const { data, error } = await sb.from("reg44_reports").update(promoted(r)).eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return null;
    await appendAudit(sb, r, existing.length);
    return r;
  },
};
