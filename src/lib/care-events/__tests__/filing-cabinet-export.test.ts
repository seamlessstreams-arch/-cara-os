// ══════════════════════════════════════════════════════════════════════════════
// Filing-cabinet export — additional tests (Milestone 37)
//
// Verifies the filing_cabinet_index export kind plumbs through the export
// history correctly and is counted in by_kind.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  recordExport,
  loadExportHistory,
} from "@/lib/care-events/export-history";

const HOME = "home_filing_export_test";

function clear() {
  const arr = db.exportHistory.findAll() as { home_id: string }[];
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].home_id === HOME) arr.splice(i, 1);
  }
}

beforeEach(() => clear());

describe("filing cabinet export (M37)", () => {
  it("recordExport accepts filing_cabinet_index kind", () => {
    const e = recordExport({
      homeId: HOME,
      kind: "filing_cabinet_index",
      artifactId: "filing_index_home_x_all_2026",
      exportedBy: "u",
      exportedByRole: "registered_manager",
      byteSize: 42,
    });
    expect(e.kind).toBe("filing_cabinet_index");
    expect(e.id).toMatch(/^exp_filing_cabinet_index_/);
  });

  it("by_kind summary counts filing_cabinet_index separately", () => {
    recordExport({
      homeId: HOME, kind: "filing_cabinet_index", artifactId: "a1",
      exportedBy: "u", exportedByRole: "rm", byteSize: 1,
    });
    recordExport({
      homeId: HOME, kind: "filing_cabinet_index", artifactId: "a2",
      exportedBy: "u", exportedByRole: "rm", byteSize: 1,
    });
    recordExport({
      homeId: HOME, kind: "inspection_snapshot", artifactId: "s1",
      exportedBy: "u", exportedByRole: "rm", byteSize: 1,
    });
    const s = loadExportHistory(HOME);
    expect(s.by_kind.filing_cabinet_index).toBe(2);
    expect(s.by_kind.inspection_snapshot).toBe(1);
    expect(s.by_kind.reg44_pack).toBe(0);
    expect(s.total).toBe(3);
  });

  it("safeguarding category filing export counts as sensitive", () => {
    recordExport({
      homeId: HOME, kind: "filing_cabinet_index", artifactId: "filing_index_home_x_safeguarding_t",
      exportedBy: "u", exportedByRole: "rm", byteSize: 1,
      isSafeguardingSensitive: true,
    });
    expect(loadExportHistory(HOME).safeguarding_sensitive).toBe(1);
  });
});
