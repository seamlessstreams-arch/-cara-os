// ══════════════════════════════════════════════════════════════════════════════
// Export History — engine tests (Milestone 36)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  recordExport,
  loadExportHistory,
  listExportsForArtifact,
} from "@/lib/care-events/export-history";

const HOME = "home_exp_test";
const OTHER = "home_exp_other";

function clear() {
  const arr = db.exportHistory.findAll() as { home_id: string }[];
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].home_id === HOME || arr[i].home_id === OTHER) arr.splice(i, 1);
  }
}

beforeEach(() => clear());

describe("export history (M36)", () => {
  it("recordExport persists an entry with deterministic shape", () => {
    const e = recordExport({
      homeId: HOME,
      kind: "inspection_snapshot",
      artifactId: "snap_1",
      exportedBy: "user_a",
      exportedByRole: "registered_manager",
      byteSize: 123,
      reason: "Ofsted prep",
    });
    expect(e.id).toMatch(/^exp_inspection_snapshot_snap_1_/);
    expect(e.format).toBe("json");
    expect(e.is_safeguarding_sensitive).toBe(false);
    expect(e.byte_size).toBe(123);
    expect(e.reason).toBe("Ofsted prep");
    expect(db.exportHistory.findById(e.id)).not.toBeNull();
  });

  it("recordExport is idempotent on duplicate id collision", () => {
    const before = db.exportHistory.findAll(HOME).length;
    const e1 = recordExport({
      homeId: HOME, kind: "reg44_pack", artifactId: "pk1",
      exportedBy: "u", exportedByRole: "rm", byteSize: 1,
      isSafeguardingSensitive: true,
    });
    // forcibly create with same id — collection rejects duplicate
    db.exportHistory.create({ ...e1 });
    const after = db.exportHistory.findAll(HOME).length;
    expect(after - before).toBe(1);
  });

  it("loadExportHistory returns sorted newest-first with by-kind counts", async () => {
    recordExport({
      homeId: HOME, kind: "inspection_snapshot", artifactId: "s1",
      exportedBy: "u1", exportedByRole: "rm", byteSize: 100,
    });
    await new Promise((r) => setTimeout(r, 5));
    recordExport({
      homeId: HOME, kind: "reg44_pack", artifactId: "p1",
      exportedBy: "u2", exportedByRole: "rm", byteSize: 200,
      isSafeguardingSensitive: true,
    });
    await new Promise((r) => setTimeout(r, 5));
    recordExport({
      homeId: HOME, kind: "reg44_pack", artifactId: "p2",
      exportedBy: "u1", exportedByRole: "rm", byteSize: 300,
      isSafeguardingSensitive: true,
    });

    const s = loadExportHistory(HOME);
    expect(s.total).toBe(3);
    expect(s.by_kind.inspection_snapshot).toBe(1);
    expect(s.by_kind.reg44_pack).toBe(2);
    expect(s.safeguarding_sensitive).toBe(2);
    expect(s.by_user.u1).toBe(2);
    expect(s.by_user.u2).toBe(1);
    expect(s.entries.length).toBe(3);
    // newest first
    expect(s.entries[0].artifact_id).toBe("p2");
    expect(s.entries[2].artifact_id).toBe("s1");
  });

  it("loadExportHistory isolates by home", () => {
    recordExport({
      homeId: HOME, kind: "inspection_snapshot", artifactId: "x1",
      exportedBy: "a", exportedByRole: "rm", byteSize: 1,
    });
    recordExport({
      homeId: OTHER, kind: "inspection_snapshot", artifactId: "x2",
      exportedBy: "a", exportedByRole: "rm", byteSize: 1,
    });
    expect(loadExportHistory(HOME).total).toBe(1);
    expect(loadExportHistory(OTHER).total).toBe(1);
  });

  it("listExportsForArtifact returns every export of that artifact, newest first", async () => {
    recordExport({
      homeId: HOME, kind: "reg44_pack", artifactId: "pk_same",
      exportedBy: "a", exportedByRole: "rm", byteSize: 1,
      isSafeguardingSensitive: true,
    });
    await new Promise((r) => setTimeout(r, 5));
    recordExport({
      homeId: HOME, kind: "reg44_pack", artifactId: "pk_same",
      exportedBy: "b", exportedByRole: "rm", byteSize: 1,
      isSafeguardingSensitive: true,
    });
    const list = listExportsForArtifact("pk_same");
    expect(list.length).toBe(2);
    expect(list[0].exported_by).toBe("b"); // newest first
  });

  it("entries are immutable: mutating returned array does not affect store", () => {
    recordExport({
      homeId: HOME, kind: "inspection_snapshot", artifactId: "imm",
      exportedBy: "a", exportedByRole: "rm", byteSize: 1,
    });
    const s = loadExportHistory(HOME);
    s.entries.length = 0;
    const again = loadExportHistory(HOME);
    expect(again.total).toBe(1);
  });
});
