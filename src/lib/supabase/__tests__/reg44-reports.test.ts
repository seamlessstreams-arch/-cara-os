// ══════════════════════════════════════════════════════════════════════════════
// sbReg44Reports — the Supabase adapter behind /api/v1/reg44-report.
//
// Runs against a fake query builder so it can pin two things without a
// database: (1) the exact columns written, which are checked against the
// migration by scripts in the PR (a column named here that the table lacks is
// a 42703 on live, i.e. a 503 "storage is not set up"); (2) that the audit
// trail is APPEND-ONLY on update — only entries beyond what is stored are
// inserted, never the whole array.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest";

type Call = { table: string; op: "insert" | "update" | "select"; payload?: unknown; filters: Array<[string, unknown]> };
const calls: Call[] = [];
let storedAudit: Array<Record<string, unknown>> = [];

function builder(table: string) {
  const call: Call = { table, op: "select", filters: [] };
  const b: Record<string, unknown> = {};
  const chain = () => b;
  b.select = () => { if (call.op === "select") calls.push(call); return b; };
  b.insert = (p: unknown) => { call.op = "insert"; call.payload = p; calls.push(call); return Promise.resolve({ data: null, error: null }); };
  b.update = (p: unknown) => { call.op = "update"; call.payload = p; calls.push(call); return b; };
  b.eq = (k: string, v: unknown) => { call.filters.push([k, v]); return b; };
  b.order = chain;
  b.maybeSingle = () => Promise.resolve({ data: call.op === "update" ? { id: "r44_t" } : null, error: null });
  // awaiting the builder itself = a list query
  b.then = (res: (v: unknown) => void) => res({ data: table === "reg44_report_audit" ? storedAudit : [], error: null });
  return b;
}

vi.mock("../server", () => ({
  createServerClient: () => ({ from: (t: string) => builder(t) }),
  isSupabaseEnabled: () => true,
}));

import { sbReg44Reports } from "../reg44-reports";
import type { PersistedReg44Report } from "@/lib/reg44-report-intelligence/report-lifecycle";

export const REPORT_COLUMNS_WRITTEN = [
  "id", "home_id", "month", "engine_version", "created_by", "created_at",
  "status", "locked", "visit_date", "visitor_name", "announced",
  "draft", "sections", "signed_snapshot", "signed_sections", "addenda",
  "signed_at", "signed_by", "updated_at",
].sort();
export const AUDIT_COLUMNS_WRITTEN = ["report_id", "home_id", "at", "actor", "action", "detail"].sort();

const report = (): PersistedReg44Report => ({
  id: "r44_t", homeId: "11111111-1111-1111-1111-111111111111", month: "2026-09", status: "draft", locked: false,
  draft: { meta: { visitDate: "2026-09-10", visitorName: "J. Okafor", visitorIndependent: true, announced: false }, signOff: { signedBy: null, signedAt: null, decision: null, overrideReason: null } } as never,
  sections: [{ key: "A", label: "A", content: "x", status: "drafted_from_evidence", visitorMustComplete: false } as never],
  signedSnapshot: null, signedSections: null, addenda: [], engineVersion: "v-test",
  auditTrail: [{ at: "2026-09-10T09:00:00Z", actor: "staff_1", action: "created", detail: "Report created" }],
  createdAt: "2026-09-10T09:00:00Z", updatedAt: "2026-09-10T09:00:00Z",
});

beforeEach(() => { calls.length = 0; storedAudit = []; });

describe("sbReg44Reports.create", () => {
  it("writes exactly the migration's columns and the whole initial trail", async () => {
    await sbReg44Reports.create(report());
    const ins = calls.filter((c) => c.op === "insert");
    expect(ins.map((c) => c.table)).toEqual(["reg44_reports", "reg44_report_audit"]);
    expect(Object.keys(ins[0].payload as object).sort()).toEqual(REPORT_COLUMNS_WRITTEN);
    const audit = ins[1].payload as Array<Record<string, unknown>>;
    expect(audit).toHaveLength(1);
    expect(Object.keys(audit[0]).sort()).toEqual(AUDIT_COLUMNS_WRITTEN);
    expect(audit[0].report_id).toBe("r44_t");
  });

  it("promotes visit date, visitor and announced from the draft meta", async () => {
    await sbReg44Reports.create(report());
    const row = calls.find((c) => c.op === "insert" && c.table === "reg44_reports")!.payload as Record<string, unknown>;
    expect(row.visit_date).toBe("2026-09-10");
    expect(row.visitor_name).toBe("J. Okafor");
    expect(row.announced).toBe(false);
    expect(row.created_by).toBe("staff_1");
    expect(row.engine_version).toBe("v-test");
  });
});

describe("sbReg44Reports.update keeps the trail append-only", () => {
  it("inserts only the entries beyond those already stored", async () => {
    storedAudit = [{ seq: 1, report_id: "r44_t", at: "a", actor: "staff_1", action: "created", detail: "" }];
    const r = report();
    r.auditTrail = [...r.auditTrail, { at: "2026-09-11T09:00:00Z", actor: "staff_1", action: "edited", detail: "Sections edited: A" }];
    await sbReg44Reports.update("r44_t", r);
    const auditIns = calls.filter((c) => c.op === "insert" && c.table === "reg44_report_audit");
    expect(auditIns).toHaveLength(1);
    const rows = auditIns[0].payload as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(1);
    expect(rows[0].action).toBe("edited");
    const upd = calls.find((c) => c.op === "update")!;
    expect(upd.filters).toEqual([["id", "r44_t"]]);
    expect(Object.keys(upd.payload as object)).not.toContain("id");
    expect(Object.keys(upd.payload as object)).not.toContain("home_id");
  });

  it("inserts nothing when the caller's trail has not grown", async () => {
    storedAudit = [{ seq: 1, report_id: "r44_t", at: "a", actor: "staff_1", action: "created", detail: "" }];
    await sbReg44Reports.update("r44_t", report());
    expect(calls.filter((c) => c.op === "insert" && c.table === "reg44_report_audit")).toHaveLength(0);
  });
});

describe("sbReg44Reports reads scope by home", () => {
  it("findByHomeMonth filters on home_id AND month", async () => {
    await sbReg44Reports.findByHomeMonth("h", "2026-09");
    const sel = calls.find((c) => c.table === "reg44_reports")!;
    expect(sel.filters).toEqual([["home_id", "h"], ["month", "2026-09"]]);
  });
});
