import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

// ══════════════════════════════════════════════════════════════════════════
// WRITE-CONTRACT PROOFS for the promoted schemas (queue #91/#93).
//
// The recording fake captures every payload a service sends; each key is
// checked against the columns the LIVE migration actually creates. This is
// the runtime guard against the phantom-column class: Postgres hard-rejects
// an INSERT naming an unknown column, so a payload key outside the migration
// is a write that will fail wholesale on the live tenant.
// ══════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", async () => {
  const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
  return makeFakeSupabaseModule({
    young_people: [{
      id: "11111111-1111-4111-8111-111111111111", home_id: "33333333-3333-4333-8333-333333333333",
      first_name: "Jayden", last_name: "Tester", date_of_birth: "2011-04-01",
      status: "current", placement_start: "2025-03-01", key_worker_id: "st-1",
    }],
    // A pending report for the approval-flow leg.
    child_reports: [{
      id: "rep-1", organisation_id: "org_default", home_id: "33333333-3333-4333-8333-333333333333",
      child_id: "11111111-1111-4111-8111-111111111111", report_type: "weekly_child_report", audience: "internal_manager",
      title: "Weekly summary", status: "pending_review", version: 1,
      requested_by: "st-1", created_at: "2026-09-01T10:00:00Z", updated_at: "2026-09-01T10:00:00Z",
    }],
    cara_agent_runs: [],
    child_report_sections: [],
    child_report_evidence: [],
    cara_audit_events: [],
  });
});

import { recordedWrites, clearRecordedWrites } from "@/lib/test-utils/fake-supabase";
import { generateChildReport } from "../report-generator";
import { approveReport } from "../approval-workflow";

// ── Parse the live migrations for real column sets ──────────────────────────
function columnsOf(table: string): Set<string> {
  const dir = path.join(process.cwd(), "supabase", "migrations");
  for (const f of fs.readdirSync(dir)) {
    const sql = fs.readFileSync(path.join(dir, f), "utf8");
    const m = sql.match(new RegExp(`create table if not exists ${table} \\(([^;]*?)\\n\\);`, "i"));
    if (!m) continue;
    const cols = new Set<string>();
    for (const line of m[1].split("\n")) {
      const cm = line.trim().match(/^"?([a-z0-9_]+)"?\s/);
      if (cm) cols.add(cm[1]);
    }
    return cols;
  }
  throw new Error(`no live migration creates ${table}`);
}

function phantomKeys(table: string, payload: unknown): string[] {
  const cols = columnsOf(table);
  const rows = Array.isArray(payload) ? payload : [payload];
  const bad = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row as Record<string, unknown>)) {
      if (!cols.has(k)) bad.add(k);
    }
  }
  return [...bad].sort();
}

describe("write contracts against the live migrations", () => {
  beforeEach(() => clearRecordedWrites());

  it("the checker itself can fail (non-vacuous)", () => {
    expect(phantomKeys("child_reports", { title: "x", not_a_column: 1 })).toEqual(["not_a_column"]);
    expect(phantomKeys("child_reports", { title: "x" })).toEqual([]);
  });

  it("generateChildReport writes only real columns across all four tables", async () => {
    const result = await generateChildReport({
      organisationId: "22222222-2222-4222-8222-222222222222", homeId: "33333333-3333-4333-8333-333333333333",
      childId: "11111111-1111-4111-8111-111111111111", reportType: "weekly_child_report", audience: "internal_manager",
      dateRangeStart: "2026-08-24", dateRangeEnd: "2026-08-31", requestedBy: "st-1",
    });
    expect(result.report).toBeTruthy();
    const writtenTables = new Set(recordedWrites.map((w) => w.table));
    expect(writtenTables).toContain("cara_agent_runs");
    expect(writtenTables).toContain("child_reports");
    for (const w of recordedWrites) {
      if (w.op === "delete" || w.payload === undefined) continue;
      expect(phantomKeys(w.table, w.payload), `${w.op} into ${w.table}`).toEqual([]);
    }
  });

  it("approveReport's update stays inside the schema and never touches created_at/id", async () => {
    const updated = await approveReport("rep-1", "manager-1", "looks right");
    expect(updated).toBeTruthy();
    const upd = recordedWrites.find((w) => w.table === "child_reports" && w.op === "update");
    expect(upd).toBeDefined();
    const keys = Object.keys(upd!.payload as Record<string, unknown>);
    expect(keys).not.toContain("created_at");
    expect(keys).not.toContain("id");
    expect(phantomKeys("child_reports", upd!.payload)).toEqual([]);
  });
});
