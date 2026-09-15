import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Practice-intelligence leg of the write-contract proofs (queue #95): the
// recording fake captures what the scanner persists, and every payload key is
// checked against the columns the live promotion migration creates.
vi.mock("@/lib/supabase/server", async () => {
  const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
  return makeFakeSupabaseModule({
    practice_intelligence_scans: [{ id: "scan-1" }],
    cara_studio_sources: [],
  });
});

import { recordedWrites, clearRecordedWrites } from "@/lib/test-utils/fake-supabase";
import { runPracticeIntelligenceScan } from "../scanner.service";

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

describe("practice-intelligence write contract", () => {
  beforeEach(() => clearRecordedWrites());

  it("the scan persists only columns the promotion migration creates", async () => {
    const scan = await runPracticeIntelligenceScan();
    expect(scan).toBeTruthy();
    const w = recordedWrites.find((x) => x.table === "practice_intelligence_scans" && x.op === "insert");
    expect(w).toBeDefined();
    const cols = columnsOf("practice_intelligence_scans");
    const bad = Object.keys(w!.payload as Record<string, unknown>).filter((k) => !cols.has(k));
    expect(bad).toEqual([]);
    // scan_date is supplied by the service, not fabricated by a UTC DB default
    expect((w!.payload as Record<string, unknown>).scan_date).toBeTruthy();
  });
});
