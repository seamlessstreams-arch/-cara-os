import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Studio leg of the write-contract proofs (queue #91): the recording fake
// captures what indexSource sends to cara_studio_sources, and every key is
// checked against the columns the live promotion migration creates.
vi.mock("@/lib/supabase/server", async () => {
  const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
  return makeFakeSupabaseModule({ cara_studio_sources: [{ id: "src-1" }] });
});

import { recordedWrites, clearRecordedWrites } from "@/lib/test-utils/fake-supabase";
import { indexSource } from "../source.service";

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

describe("studio write contract", () => {
  beforeEach(() => clearRecordedWrites());

  it("indexSource writes only columns the promotion migration creates", async () => {
    await indexSource({ source_type: "daily_log", title: "Settled evening", content: "…" });
    const w = recordedWrites.find((x) => x.table === "cara_studio_sources" && x.op === "insert");
    expect(w).toBeDefined();
    const cols = columnsOf("cara_studio_sources");
    const bad = Object.keys(w!.payload as Record<string, unknown>).filter((k) => !cols.has(k));
    expect(bad).toEqual([]);
  });
});
