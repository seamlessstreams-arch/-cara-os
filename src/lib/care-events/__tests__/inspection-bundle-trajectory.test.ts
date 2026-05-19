// ══════════════════════════════════════════════════════════════════════════════
// Inspection bundle includes trajectory alerts + acks (M49)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  buildInspectionBundle,
  persistInspectionBundle,
} from "@/lib/care-events/inspection-bundle";
import {
  detectTrajectoryAlerts,
  recordTrajectoryAlertAck,
} from "@/lib/care-events/inspection-trajectory";

const HOME = "home_oak";

beforeEach(() => {
  const bundles = db.inspectionBundles.findAll() as { home_id: string }[];
  for (let i = bundles.length - 1; i >= 0; i--) {
    if (bundles[i].home_id === HOME) bundles.splice(i, 1);
  }
  const acks = db.trajectoryAlertAcks.findAll() as { home_id: string }[];
  for (let i = acks.length - 1; i >= 0; i--) {
    if (acks[i].home_id === HOME) acks.splice(i, 1);
  }
});

function mutateBundle(id: string, score: number, severity: string) {
  const row = db.inspectionBundles.findById(id)!;
  (row as unknown as { readiness_score: number }).readiness_score = score;
  (row as unknown as { readiness_severity: string }).readiness_severity = severity;
  type P = { headline: { readiness_score: number; readiness_severity: string } };
  (row.payload as P).headline.readiness_score = score;
  (row.payload as P).headline.readiness_severity = severity;
}

describe("inspection bundle includes trajectory snapshot (M49)", () => {
  it("first-ever bundle has no trajectory alerts and no acks", () => {
    const b = buildInspectionBundle(HOME);
    expect(b.headline.trajectory_alerts_open).toBe(0);
    expect(b.headline.trajectory_acks_recent).toBe(0);
    expect(b.trajectory_alerts_open.length).toBe(0);
    expect(b.trajectory_acks_recent.length).toBe(0);
  });

  it("captures open alerts and acknowledgements at composition time", async () => {
    const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
    mutateBundle(a.bundle_id, 80, "ready");
    mutateBundle(b.bundle_id, 60, "needs-action"); // forces regressing + severity flip

    const alerts = detectTrajectoryAlerts(HOME);
    expect(alerts.length).toBeGreaterThan(0);

    // Ack one of them
    recordTrajectoryAlertAck({
      alert: alerts[0],
      acked_by_user: "user_manager_1",
      acked_by_role: "manager",
      note: "Action plan launched.",
    });

    // New bundle composed now should show one fewer open alert and at least one ack
    await new Promise((r) => setTimeout(r, 5));
    const c = buildInspectionBundle(HOME);
    expect(c.trajectory_alerts_open.length).toBeLessThan(alerts.length);
    expect(c.trajectory_acks_recent.length).toBeGreaterThanOrEqual(1);
    expect(c.headline.trajectory_alerts_open).toBe(c.trajectory_alerts_open.length);
    expect(c.headline.trajectory_acks_recent).toBe(c.trajectory_acks_recent.length);
  });

  it("persisted row carries the new trajectory headline counts", async () => {
    const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = buildInspectionBundle(HOME);
    mutateBundle(a.bundle_id, 80, "ready");
    const persisted = persistInspectionBundle(b);
    expect(persisted.trajectory_alerts_open).toBe(b.headline.trajectory_alerts_open);
    expect(persisted.trajectory_acks_recent).toBe(b.headline.trajectory_acks_recent);
  });
});
