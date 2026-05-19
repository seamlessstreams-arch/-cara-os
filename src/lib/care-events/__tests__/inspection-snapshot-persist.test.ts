// ══════════════════════════════════════════════════════════════════════════════
// Inspection Snapshot — persistence tests (Milestone 31)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  generateInspectionSnapshot,
  persistInspectionSnapshot,
  listPersistedSnapshots,
  getPersistedSnapshot,
} from "@/lib/care-events/inspection-snapshot";

const HOME_ID = "home_snap_persist";
const OTHER_HOME = "home_snap_persist_other";

function clear() {
  const all = db.inspectionSnapshots.findAll();
  for (const s of [...all]) {
    if (s.home_id === HOME_ID || s.home_id === OTHER_HOME) {
      const i = all.indexOf(s); if (i >= 0) all.splice(i, 1);
    }
  }
}

describe("Inspection Snapshot persistence (M31)", () => {
  beforeEach(() => clear());

  it("persistInspectionSnapshot stores the snapshot in the db", () => {
    const snap = generateInspectionSnapshot(HOME_ID, { generatedBy: "user_1" });
    const row = persistInspectionSnapshot(snap);

    expect(row.id).toBe(snap.id);
    expect(row.home_id).toBe(HOME_ID);
    expect(row.generated_by).toBe("user_1");
    expect(row.schema_version).toBe(1);
    expect(row.readiness_score).toBe(snap.headline.readiness_score);
    expect(row.readiness_severity).toBe(snap.headline.readiness_severity);
    expect(row.payload).toBeTruthy();

    expect(db.inspectionSnapshots.findById(snap.id)).not.toBeNull();
  });

  it("getPersistedSnapshot returns the full payload", () => {
    const snap = generateInspectionSnapshot(HOME_ID, { generatedBy: "user_2" });
    persistInspectionSnapshot(snap);

    const fetched = getPersistedSnapshot(snap.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.payload).toEqual(snap);
  });

  it("getPersistedSnapshot returns null for unknown id", () => {
    expect(getPersistedSnapshot("snap_does_not_exist")).toBeNull();
  });

  it("listPersistedSnapshots returns rows newest-first", async () => {
    const a = generateInspectionSnapshot(HOME_ID);
    persistInspectionSnapshot(a);
    // Force a distinct generated_at for the second snapshot
    await new Promise((r) => setTimeout(r, 5));
    const b = generateInspectionSnapshot(HOME_ID);
    if (b.id === a.id) return; // same-ms collision; dedupe path covered separately
    persistInspectionSnapshot(b);

    const rows = listPersistedSnapshots(HOME_ID);
    expect(rows.length).toBe(2);
    expect(rows[0].generated_at >= rows[1].generated_at).toBe(true);
    // payload field is intentionally stripped from the list view
    expect((rows[0] as unknown as { payload?: unknown }).payload).toBeUndefined();
  });

  it("listPersistedSnapshots is filtered by home_id", () => {
    const mine  = generateInspectionSnapshot(HOME_ID);
    const other = generateInspectionSnapshot(OTHER_HOME);
    persistInspectionSnapshot(mine);
    persistInspectionSnapshot(other);

    const rows = listPersistedSnapshots(HOME_ID);
    expect(rows.every((r) => r.home_id === HOME_ID)).toBe(true);
    expect(rows.find((r) => r.id === other.id)).toBeUndefined();
    expect(rows.find((r) => r.id === mine.id)).toBeTruthy();
  });

  it("persistInspectionSnapshot is idempotent for the same id", () => {
    const snap = generateInspectionSnapshot(HOME_ID);
    persistInspectionSnapshot(snap);
    persistInspectionSnapshot(snap);
    persistInspectionSnapshot(snap);

    const rows = listPersistedSnapshots(HOME_ID).filter((r) => r.id === snap.id);
    expect(rows.length).toBe(1);
  });
});
