import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";

// HR leg of the write-contract proofs (queue #96): the recording fake captures
// what the letters route persists (guardian review + letter + audit rows) and
// every payload key is checked against the promotion migration's columns.
vi.mock("@/lib/supabase/server", async () => {
  const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
  return {
    ...makeFakeSupabaseModule({
      hr_process_guardian_reviews: [{ id: "rev-1" }],
      hr_letters: [{ id: "let-1" }],
      hr_audit_log: [],
      hr_cases: [],
    }),
  };
});

import { recordedWrites, clearRecordedWrites } from "@/lib/test-utils/fake-supabase";
import { POST } from "../letters/route";

function columnsOf(table: string): Set<string> {
  const dir = path.join(process.cwd(), "supabase", "migrations");
  for (const f of fs.readdirSync(dir)) {
    const m = fs.readFileSync(path.join(dir, f), "utf8")
      .match(new RegExp(`create table if not exists ${table} \\(([^;]*?)\\n\\);`, "i"));
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

describe("HR letters write contract", () => {
  beforeEach(() => clearRecordedWrites());

  it("drafting a letter writes only columns the promotion migration creates", async () => {
    const res = await POST(new NextRequest("http://localhost/api/hr/letters", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actorUserId: "mgr-1", actorRole: "rm",
        staffId: "st-1", letterType: "probation_review",
        context: { concern: "attendance pattern" },
      }),
    }));
    expect(res.status).toBeLessThan(500);
    expect(recordedWrites.length).toBeGreaterThan(0);
    for (const w of recordedWrites) {
      if (w.payload === undefined) continue;
      const cols = columnsOf(w.table);
      const rows = Array.isArray(w.payload) ? w.payload : [w.payload];
      for (const row of rows) {
        const bad = Object.keys(row as Record<string, unknown>).filter((k) => !cols.has(k));
        expect(bad, `${w.op} into ${w.table}`).toEqual([]);
      }
    }
  });
});
