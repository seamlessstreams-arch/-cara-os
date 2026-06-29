import { describe, it, expect } from "vitest";
import {
  loadInspectionTrajectory,
  detectTrajectoryAlerts,
  detectTrajectoryAckOverdueReminders,
  detectTrajectoryRiEscalations,
} from "../inspection-trajectory";

// Guards the seeded demo trajectory for home_oak (src/lib/db/store.ts).
// Without seeded inspection bundles the whole M49–M52 oversight chain renders
// empty; this asserts the seed lights it up end-to-end so the feature is visible.
describe("seeded demo inspection trajectory (home_oak)", () => {
  it("loads a regressing readiness trajectory from the seeded bundles", () => {
    const t = loadInspectionTrajectory("home_oak");
    expect(t.bundles_total).toBeGreaterThanOrEqual(3);
    expect(t.direction).toBe("regressing");
    expect(t.net_score_delta!).toBeLessThan(0);
  });

  it("raises critical trajectory alerts (large step drop + regression)", () => {
    const alerts = detectTrajectoryAlerts("home_oak");
    expect(alerts.some((a) => a.severity === "critical")).toBe(true);
    expect(alerts.some((a) => a.kind === "large_step_drop")).toBe(true);
  });

  it("surfaces ack-overdue reminders and escalates to the RI", () => {
    expect(detectTrajectoryAckOverdueReminders("home_oak").length).toBeGreaterThan(0);
    const escalations = detectTrajectoryRiEscalations("home_oak");
    expect(escalations.length).toBeGreaterThan(0);
    expect(escalations[0].message).toMatch(/RI escalation/i);
  });
});
