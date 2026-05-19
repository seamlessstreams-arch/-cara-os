// ══════════════════════════════════════════════════════════════════════════════
// Per-artifact export history — engine tests (Milestone 38)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  recordExport,
  listExportsForArtifact,
} from "@/lib/care-events/export-history";

const HOME_A = "home_artifact_test_a";
const HOME_B = "home_artifact_test_b";

function clear() {
  const arr = db.exportHistory.findAll() as { home_id: string }[];
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].home_id === HOME_A || arr[i].home_id === HOME_B) arr.splice(i, 1);
  }
}

beforeEach(() => clear());

describe("per-artifact export history (M38)", () => {
  it("returns only entries for the requested artifact", () => {
    recordExport({
      homeId: HOME_A, kind: "inspection_snapshot", artifactId: "snap_x",
      exportedBy: "u", exportedByRole: "rm", byteSize: 1,
    });
    recordExport({
      homeId: HOME_A, kind: "inspection_snapshot", artifactId: "snap_y",
      exportedBy: "u", exportedByRole: "rm", byteSize: 1,
    });
    const list = listExportsForArtifact("snap_x");
    expect(list.length).toBe(1);
    expect(list[0].artifact_id).toBe("snap_x");
  });

  it("returns multiple exports of the same artifact, newest first", async () => {
    recordExport({
      homeId: HOME_A, kind: "reg44_pack", artifactId: "pk",
      exportedBy: "u1", exportedByRole: "rm", byteSize: 1,
      isSafeguardingSensitive: true,
    });
    await new Promise((r) => setTimeout(r, 5));
    recordExport({
      homeId: HOME_A, kind: "reg44_pack", artifactId: "pk",
      exportedBy: "u2", exportedByRole: "rm", byteSize: 1,
      isSafeguardingSensitive: true,
    });
    const list = listExportsForArtifact("pk");
    expect(list.length).toBe(2);
    expect(list[0].exported_by).toBe("u2");
  });

  it("does not leak across artifacts that share a stem", () => {
    recordExport({
      homeId: HOME_A, kind: "inspection_snapshot", artifactId: "snap_oak_2026",
      exportedBy: "u", exportedByRole: "rm", byteSize: 1,
    });
    recordExport({
      homeId: HOME_A, kind: "inspection_snapshot", artifactId: "snap_oak_2026_v2",
      exportedBy: "u", exportedByRole: "rm", byteSize: 1,
    });
    const list = listExportsForArtifact("snap_oak_2026");
    expect(list.length).toBe(1);
    expect(list[0].artifact_id).toBe("snap_oak_2026");
  });

  it("returns an empty array when an artifact has never been exported", () => {
    expect(listExportsForArtifact("never_exported_xyz")).toEqual([]);
  });
});
