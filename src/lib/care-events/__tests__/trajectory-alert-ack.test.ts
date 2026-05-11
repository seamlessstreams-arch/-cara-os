// ══════════════════════════════════════════════════════════════════════════════
// Trajectory alert acknowledgement (M48)
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
  listTrajectoryAlertAcks,
} from "@/lib/care-events/inspection-trajectory";
import { loadNotifications } from "@/lib/care-events/notifications";

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

async function buildRegressionPair() {
  const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
  await new Promise((r) => setTimeout(r, 5));
  const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
  mutateBundle(a.bundle_id, 80, "ready");
  mutateBundle(b.bundle_id, 60, "ready");
  return { a, b };
}

describe("trajectory alert acknowledgement (M48)", () => {
  it("removes acknowledged alerts from detectTrajectoryAlerts and the notification stream", async () => {
    await buildRegressionPair();
    const before = detectTrajectoryAlerts(HOME);
    const reg = before.find((a) => a.kind === "regressing");
    expect(reg).toBeTruthy();

    recordTrajectoryAlertAck({
      alert: reg!,
      acked_by_user: "user_manager_1",
      acked_by_role: "manager",
      note: "Pulled focused review for next bundle",
    });

    const after = detectTrajectoryAlerts(HOME);
    expect(after.find((a) => a.id === reg!.id)).toBeUndefined();

    const stream = loadNotifications(HOME);
    expect(stream.items.find((i) => i.source_id === reg!.id)).toBeUndefined();
  });

  it("ack is idempotent for the same (alert_id, user)", async () => {
    await buildRegressionPair();
    const reg = detectTrajectoryAlerts(HOME).find((a) => a.kind === "regressing")!;
    const a1 = recordTrajectoryAlertAck({ alert: reg, acked_by_user: "u1", acked_by_role: "manager", note: "n" });
    const a2 = recordTrajectoryAlertAck({ alert: reg, acked_by_user: "u1", acked_by_role: "manager", note: "n2" });
    expect(a1.id).toBe(a2.id);
    expect(listTrajectoryAlertAcks(HOME).filter((a) => a.alert_id === reg.id).length).toBe(1);
  });

  it("ack is bundle-scoped: a fresh bundle re-raises the alert with a new id", async () => {
    await buildRegressionPair();
    const reg = detectTrajectoryAlerts(HOME).find((a) => a.kind === "regressing")!;
    recordTrajectoryAlertAck({ alert: reg, acked_by_user: "u1", acked_by_role: "manager", note: "n" });
    expect(detectTrajectoryAlerts(HOME).find((a) => a.id === reg.id)).toBeUndefined();

    // Add a new (still-regressing) bundle — alert id changes, should re-raise.
    await new Promise((r) => setTimeout(r, 5));
    const c = buildInspectionBundle(HOME); persistInspectionBundle(c);
    mutateBundle(c.bundle_id, 55, "ready");

    const after = detectTrajectoryAlerts(HOME);
    const reraised = after.find((a) => a.kind === "regressing");
    expect(reraised).toBeTruthy();
    expect(reraised!.id).not.toBe(reg.id);
  });

  it("listTrajectoryAlertAcks returns newest first", async () => {
    await buildRegressionPair();
    const reg = detectTrajectoryAlerts(HOME).find((a) => a.kind === "regressing")!;
    const sev = detectTrajectoryAlerts(HOME).find((a) => a.kind === "severity_flip_latest");
    // Force a severity flip case
    mutateBundle((db.inspectionBundles.findAll(HOME).at(-1))!.id, 60, "needs-action");
    const flips = detectTrajectoryAlerts(HOME).filter((a) => a.kind === "severity_flip_latest");
    if (flips[0]) recordTrajectoryAlertAck({ alert: flips[0], acked_by_user: "u1", acked_by_role: "manager", note: "x" });
    await new Promise((r) => setTimeout(r, 5));
    recordTrajectoryAlertAck({ alert: reg, acked_by_user: "u1", acked_by_role: "manager", note: "y" });
    const list = listTrajectoryAlertAcks(HOME);
    expect(list.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1].acked_at >= list[i].acked_at).toBe(true);
    }
    void sev;
  });
});
