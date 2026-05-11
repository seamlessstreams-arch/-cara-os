// ══════════════════════════════════════════════════════════════════════════════
// RI escalation acknowledgement (M52)
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
  recordTrajectoryRiEscalationAck,
  recordTrajectoryAlertAck,
  listTrajectoryRiEscalationAcks,
} from "@/lib/care-events/inspection-trajectory";
import { loadNotifications } from "@/lib/care-events/notifications";

const HOME = "home_pine";

beforeEach(() => {
  const bundles = db.inspectionBundles.findAll() as { home_id: string }[];
  for (let i = bundles.length - 1; i >= 0; i--) {
    if (bundles[i].home_id === HOME) bundles.splice(i, 1);
  }
  const macks = db.trajectoryAlertAcks.findAll() as { home_id: string }[];
  for (let i = macks.length - 1; i >= 0; i--) {
    if (macks[i].home_id === HOME) macks.splice(i, 1);
  }
  const racks = db.trajectoryRiEscalationAcks.findAll() as { home_id: string }[];
  for (let i = racks.length - 1; i >= 0; i--) {
    if (racks[i].home_id === HOME) racks.splice(i, 1);
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

function backdate(id: string, days: number) {
  const row = db.inspectionBundles.findById(id)!;
  (row as unknown as { generated_at: string }).generated_at = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString();
}

async function seedEscalation() {
  const a = buildInspectionBundle(HOME); persistInspectionBundle(a);
  await new Promise((r) => setTimeout(r, 5));
  const b = buildInspectionBundle(HOME); persistInspectionBundle(b);
  mutate(a.bundle_id, 80, "ready");
  mutate(b.bundle_id, 60, "needs-action");
  backdate(a.bundle_id, 10);
  backdate(b.bundle_id, 6); // 144h, escalation fires
}

describe("RI escalation acknowledgement (M52)", () => {
  it("RI ack closes the escalation and disappears from RI audience", async () => {
    await seedEscalation();
    const before = detectTrajectoryRiEscalations(HOME);
    expect(before.length).toBeGreaterThan(0);

    recordTrajectoryRiEscalationAck({
      escalation: before[0],
      acked_by_user: "ri_user_1",
      acked_by_role: "responsible_individual",
      note: "Spoken to manager; action plan filed; reviewing in 48h.",
    });

    const after = detectTrajectoryRiEscalations(HOME);
    expect(after.find((e) => e.id === before[0].id)).toBeUndefined();
  });

  it("RI ack does NOT silence the underlying manager-facing alert", async () => {
    await seedEscalation();
    const escalation = detectTrajectoryRiEscalations(HOME)[0];
    const alertsBefore = detectTrajectoryAlerts(HOME);
    const targetAlert = alertsBefore.find((a) => a.id === escalation.alert_id);
    expect(targetAlert).toBeDefined();

    recordTrajectoryRiEscalationAck({
      escalation,
      acked_by_user: "ri_user_1",
      acked_by_role: "responsible_individual",
      note: "RI sign-off only.",
    });

    const alertsAfter = detectTrajectoryAlerts(HOME);
    expect(alertsAfter.find((a) => a.id === targetAlert!.id)).toBeDefined();
  });

  it("RI ack is idempotent on (escalation_id, user)", async () => {
    await seedEscalation();
    const e = detectTrajectoryRiEscalations(HOME)[0];
    const a1 = recordTrajectoryRiEscalationAck({
      escalation: e,
      acked_by_user: "ri_user_1",
      acked_by_role: "responsible_individual",
      note: "First.",
    });
    const a2 = recordTrajectoryRiEscalationAck({
      escalation: e,
      acked_by_user: "ri_user_1",
      acked_by_role: "responsible_individual",
      note: "Second.",
    });
    expect(a2.id).toBe(a1.id);
    expect(a2.note).toBe("First."); // first write wins
    expect(listTrajectoryRiEscalationAcks(HOME).length).toBe(1);
  });

  it("manager ack of underlying alert removes both manager + RI signals", async () => {
    await seedEscalation();
    const alert = detectTrajectoryAlerts(HOME).find((a) =>
      detectTrajectoryRiEscalations(HOME).some((e) => e.alert_id === a.id),
    )!;
    expect(alert).toBeDefined();

    recordTrajectoryAlertAck({
      alert,
      acked_by_user: "user_manager_1",
      acked_by_role: "manager",
      note: "Manager investigating.",
    });

    expect(
      detectTrajectoryAlerts(HOME).find((a) => a.id === alert.id),
    ).toBeUndefined();
    expect(
      detectTrajectoryRiEscalations(HOME).find((e) => e.alert_id === alert.id),
    ).toBeUndefined();
  });

  it("removes escalation from RI notification stream after RI ack", async () => {
    await seedEscalation();
    const before = loadNotifications(HOME);
    expect(before.for_responsible_individual).toBeGreaterThanOrEqual(1);

    const escalation = detectTrajectoryRiEscalations(HOME)[0];
    recordTrajectoryRiEscalationAck({
      escalation,
      acked_by_user: "ri_user_1",
      acked_by_role: "responsible_individual",
      note: "RI ack.",
    });

    const after = loadNotifications(HOME);
    expect(
      after.items.find((i) => i.source === "trajectory_ack_overdue_ri" && i.source_id === escalation.id),
    ).toBeUndefined();
  });
});
