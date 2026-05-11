// ══════════════════════════════════════════════════════════════════════════════
// Trajectory RI escalation tier (M51)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  buildInspectionBundle,
  persistInspectionBundle,
} from "@/lib/care-events/inspection-bundle";
import {
  detectTrajectoryAlerts,
  detectTrajectoryRiEscalations,
  recordTrajectoryAlertAck,
  ACK_OVERDUE_CRITICAL_HOURS,
  ACK_OVERDUE_RI_ESCALATION_HOURS,
} from "@/lib/care-events/inspection-trajectory";
import { loadNotifications } from "@/lib/care-events/notifications";

const HOME = "home_cedar";

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

function mutate(id: string, score: number, severity: string) {
  const row = db.inspectionBundles.findById(id)!;
  (row as unknown as { readiness_score: number }).readiness_score = score;
  (row as unknown as { readiness_severity: string }).readiness_severity = severity;
  type P = { headline: { readiness_score: number; readiness_severity: string } };
  (row.payload as P).headline.readiness_score = score;
  (row.payload as P).headline.readiness_severity = severity;
}

function backdateBundle(id: string, days: number) {
  const row = db.inspectionBundles.findById(id)!;
  (row as unknown as { generated_at: string }).generated_at = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString();
}

describe("trajectory RI escalation (M51)", () => {
  it("returns no escalations when no critical reminders are open", () => {
    expect(detectTrajectoryRiEscalations(HOME)).toEqual([]);
  });

  it("does not escalate while critical reminder is younger than 48h+72h", async () => {
    const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
    mutate(a.bundle_id, 80, "ready");
    mutate(b.bundle_id, 60, "needs-action");
    backdateBundle(a.bundle_id, 7);
    backdateBundle(b.bundle_id, 3); // 72h: reminder fires (>48h) but not RI (<120h)

    expect(detectTrajectoryRiEscalations(HOME)).toEqual([]);
  });

  it("escalates once a critical reminder ages past 48h+72h", async () => {
    const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
    mutate(a.bundle_id, 80, "ready");
    mutate(b.bundle_id, 60, "needs-action");
    backdateBundle(a.bundle_id, 10);
    backdateBundle(b.bundle_id, 6); // 144h ≥ 120h threshold

    const escalations = detectTrajectoryRiEscalations(HOME);
    expect(escalations.length).toBeGreaterThan(0);
    expect(escalations[0].id).toMatch(/^traj_ri_escalation_/);
    expect(escalations[0].age_hours).toBeGreaterThanOrEqual(
      ACK_OVERDUE_CRITICAL_HOURS + ACK_OVERDUE_RI_ESCALATION_HOURS,
    );
  });

  it("disappears once the underlying alert is acknowledged", async () => {
    const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
    mutate(a.bundle_id, 80, "ready");
    mutate(b.bundle_id, 60, "needs-action");
    backdateBundle(a.bundle_id, 10);
    backdateBundle(b.bundle_id, 6);

    const alerts = detectTrajectoryAlerts(HOME);
    const target = alerts[0];
    expect(detectTrajectoryRiEscalations(HOME).length).toBeGreaterThan(0);

    recordTrajectoryAlertAck({
      alert: target,
      acked_by_user: "user_manager_1",
      acked_by_role: "manager",
      note: "Ack with action plan.",
    });

    const after = detectTrajectoryRiEscalations(HOME);
    expect(after.find((e) => e.alert_id === target.id)).toBeUndefined();
  });

  it("promotes escalations into the responsible_individual audience", async () => {
    const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
    mutate(a.bundle_id, 80, "ready");
    mutate(b.bundle_id, 60, "needs-action");
    backdateBundle(a.bundle_id, 10);
    backdateBundle(b.bundle_id, 6);

    const summary = loadNotifications(HOME);
    const item = summary.items.find(
      (i) => i.source === "trajectory_ack_overdue_ri",
    );
    expect(item).toBeDefined();
    expect(item!.audience).toBe("responsible_individual");
    expect(item!.severity).toBe("critical");
    expect(summary.for_responsible_individual).toBeGreaterThanOrEqual(1);
  });
});
