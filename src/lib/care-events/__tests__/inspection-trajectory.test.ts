// ══════════════════════════════════════════════════════════════════════════════
// Inspection Readiness Trajectory — engine tests (Milestone 45)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  buildInspectionBundle,
  persistInspectionBundle,
} from "@/lib/care-events/inspection-bundle";
import { loadInspectionTrajectory } from "@/lib/care-events/inspection-trajectory";

const HOME = "home_oak";

beforeEach(() => {
  const arr = db.inspectionBundles.findAll() as { home_id: string }[];
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].home_id === HOME) arr.splice(i, 1);
  }
});

function mutate(id: string, score: number, severity: string) {
  const row = db.inspectionBundles.findById(id)!;
  // Mutate the row's headline copy + payload to simulate a different reading
  (row as unknown as { readiness_score: number }).readiness_score = score;
  (row as unknown as { readiness_severity: string }).readiness_severity = severity;
  type P = { headline: { readiness_score: number; readiness_severity: string } };
  (row.payload as P).headline.readiness_score = score;
  (row.payload as P).headline.readiness_severity = severity;
}

describe("inspection trajectory (M45)", () => {
  it("reports insufficient_data with no bundles", () => {
    const t = loadInspectionTrajectory(HOME);
    expect(t.bundles_total).toBe(0);
    expect(t.direction).toBe("insufficient_data");
    expect(t.points).toEqual([]);
    expect(t.net_score_delta).toBeNull();
  });

  it("returns chronological points with first delta = 0", async () => {
    const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
    const t = loadInspectionTrajectory(HOME);
    expect(t.bundles_total).toBe(2);
    expect(t.points[0].generated_at <= t.points[1].generated_at).toBe(true);
    expect(t.points[0].delta_readiness_score).toBe(0);
  });

  it("classifies improving when latest > earliest by more than the holding band", async () => {
    const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
    mutate(a.bundle_id, 50, "needs-action");
    mutate(b.bundle_id, 70, "ready");
    const t = loadInspectionTrajectory(HOME);
    expect(t.direction).toBe("improving");
    expect(t.net_score_delta).toBe(20);
    expect(t.severity_changes).toBe(1);
    expect(t.points[1].severity_changed).toBe(true);
  });

  it("classifies regressing when latest < earliest by more than the holding band", async () => {
    const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
    mutate(a.bundle_id, 80, "ready");
    mutate(b.bundle_id, 60, "ready");
    const t = loadInspectionTrajectory(HOME);
    expect(t.direction).toBe("regressing");
    expect(t.net_score_delta).toBe(-20);
    expect(t.severity_changes).toBe(0);
  });

  it("classifies holding when net delta is within the band", async () => {
    const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
    mutate(a.bundle_id, 70, "ready");
    mutate(b.bundle_id, 71, "ready");
    const t = loadInspectionTrajectory(HOME);
    expect(t.direction).toBe("holding");
  });
});
