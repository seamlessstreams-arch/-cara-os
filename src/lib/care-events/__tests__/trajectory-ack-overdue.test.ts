// ══════════════════════════════════════════════════════════════════════════════
// Trajectory ack-overdue reminders (M50)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  buildInspectionBundle,
  persistInspectionBundle,
} from "@/lib/care-events/inspection-bundle";
import {
  detectTrajectoryAlerts,
  detectTrajectoryAckOverdueReminders,
  recordTrajectoryAlertAck,
  ACK_OVERDUE_CRITICAL_HOURS,
  ACK_OVERDUE_WARNING_DAYS,
} from "@/lib/care-events/inspection-trajectory";
import { loadNotifications } from "@/lib/care-events/notifications";

const HOME = "home_birch";

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

afterEach(() => {
  vi.useRealTimers();
});

function mutate(id: string, score: number, severity: string) {
  const row = db.inspectionBundles.findById(id)!;
  (row as unknown as { readiness_score: number }).readiness_score = score;
  (row as unknown as { readiness_severity: string }).readiness_severity = severity;
  type P = { headline: { readiness_score: number; readiness_severity: string } };
  (row.payload as P).headline.readiness_score = score;
  (row.payload as P).headline.readiness_severity = severity;
}

function backdateBundle(id: string, isoDays: number) {
  const row = db.inspectionBundles.findById(id)!;
  const ts = new Date(Date.now() - isoDays * 24 * 60 * 60 * 1000).toISOString();
  (row as unknown as { generated_at: string }).generated_at = ts;
}

describe("trajectory ack-overdue reminders (M50)", () => {
  it("returns no reminders when no alerts are open", () => {
    const out = detectTrajectoryAckOverdueReminders(HOME);
    expect(out).toEqual([]);
  });

  it("does not fire while a critical alert is younger than the 48h threshold", async () => {
    const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
    mutate(a.bundle_id, 80, "ready");
    mutate(b.bundle_id, 60, "needs-action");
    backdateBundle(a.bundle_id, 5);  // a is 5 days old
    backdateBundle(b.bundle_id, 1);  // b (latest) is 1 day old → alert age 24h

    const alerts = detectTrajectoryAlerts(HOME);
    expect(alerts.length).toBeGreaterThan(0);
    const reminders = detectTrajectoryAckOverdueReminders(HOME);
    expect(reminders.find((r) => r.severity === "critical")).toBeUndefined();
  });

  it("fires a critical reminder once the alert is older than 48h", async () => {
    const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
    mutate(a.bundle_id, 80, "ready");
    mutate(b.bundle_id, 60, "needs-action");
    backdateBundle(a.bundle_id, 7);  // a is 7 days old
    backdateBundle(b.bundle_id, 3);  // b (latest) is 3 days old → alert age 72h

    const reminders = detectTrajectoryAckOverdueReminders(HOME);
    const critical = reminders.find((r) => r.severity === "critical");
    expect(critical).toBeDefined();
    expect(critical!.age_hours).toBeGreaterThanOrEqual(ACK_OVERDUE_CRITICAL_HOURS);
    expect(critical!.id).toMatch(/^traj_ack_overdue_/);
  });

  it("fires a warning reminder only after 7 days for severity-flip warnings", async () => {
    const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
    // small severity flip but no regression and no large drop → warning only
    mutate(a.bundle_id, 70, "ready");
    mutate(b.bundle_id, 70, "monitor");
    backdateBundle(a.bundle_id, 5);
    backdateBundle(b.bundle_id, 3);
    let reminders = detectTrajectoryAckOverdueReminders(HOME);
    expect(reminders.find((r) => r.severity === "warning")).toBeUndefined();

    backdateBundle(a.bundle_id, ACK_OVERDUE_WARNING_DAYS + 3);
    backdateBundle(b.bundle_id, ACK_OVERDUE_WARNING_DAYS + 1);
    reminders = detectTrajectoryAckOverdueReminders(HOME);
    expect(reminders.find((r) => r.severity === "warning")).toBeDefined();
  });

  it("disappears once the underlying alert is acknowledged", async () => {
    const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
    mutate(a.bundle_id, 80, "ready");
    mutate(b.bundle_id, 60, "needs-action");
    backdateBundle(a.bundle_id, 7);
    backdateBundle(b.bundle_id, 3);

    const alerts = detectTrajectoryAlerts(HOME);
    const target = alerts[0];
    expect(detectTrajectoryAckOverdueReminders(HOME).length).toBeGreaterThan(0);

    recordTrajectoryAlertAck({
      alert: target,
      acked_by_user: "user_manager_1",
      acked_by_role: "manager",
      note: "Investigating with deputy.",
    });

    const after = detectTrajectoryAckOverdueReminders(HOME);
    expect(after.find((r) => r.alert_id === target.id)).toBeUndefined();
  });

  it("promotes overdue reminders into the manager notification stream", async () => {
    const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
    mutate(a.bundle_id, 80, "ready");
    mutate(b.bundle_id, 60, "needs-action");
    backdateBundle(a.bundle_id, 7);
    backdateBundle(b.bundle_id, 3);

    const summary = loadNotifications(HOME);
    const reminderItem = summary.items.find(
      (i) => i.source === "trajectory_ack_overdue",
    );
    expect(reminderItem).toBeDefined();
    expect(reminderItem!.audience).toBe("manager");
    expect(reminderItem!.link_href).toContain("/inspection-bundle/trajectory");
  });
});
