import { describe, it, expect } from "vitest";
import { aggregateActionItems, type ActionCenterInput } from "../action-center";
import type { EmergencyAlert } from "@/lib/staffing/emergency-types";
import type { SafeStaffingAssessment } from "@/lib/staffing/safe-staffing";

const okStaffing: SafeStaffingAssessment = {
  period: "day", on_shift_count: 3, minimum_required: 2, shortfall: 0, is_understaffed: false,
  is_lone_working: false, has_waking_night: false, no_night_cover: false, severity: "ok", alerts: [],
};
const criticalStaffing: SafeStaffingAssessment = {
  ...okStaffing, severity: "critical", on_shift_count: 0,
  alerts: [{ type: "no_cover", severity: "critical", message: "No staff are currently clocked in." }],
};
const emergency = (id: string): EmergencyAlert => ({
  id, home_id: "home_oak", type: "fire", raised_by: "s", raised_by_name: "S", location: "kitchen",
  status: "active", note: null, responders: [], broadcast_message_id: null, created_at: "2026-09-22T12:00:00Z",
  resolved_at: null, resolved_by: null,
});
const base: ActionCenterInput = { emergencies: [], staffing: okStaffing, unacknowledgedComms: 0, tasksAwaitingSignOff: 0 };

describe("aggregateActionItems", () => {
  it("empty when nothing needs attention", () => {
    const r = aggregateActionItems(base);
    expect(r.total).toBe(0);
    expect(r.critical).toBe(0);
    expect(r.items).toHaveLength(0);
  });

  it("creates a critical item per active emergency", () => {
    const r = aggregateActionItems({ ...base, emergencies: [emergency("e1"), emergency("e2")] });
    const em = r.items.filter((i) => i.category === "emergency");
    expect(em).toHaveLength(2);
    expect(em[0].severity).toBe("critical");
    expect(em[0].href).toBe("/safe-staffing");
    expect(em[0].detail).toContain("kitchen");
  });

  it("flags critical staffing but not ok staffing", () => {
    expect(aggregateActionItems({ ...base, staffing: criticalStaffing }).items.some((i) => i.category === "staffing")).toBe(true);
    expect(aggregateActionItems(base).items.some((i) => i.category === "staffing")).toBe(false);
  });

  it("flags comms acknowledgements and approvals with counts", () => {
    const r = aggregateActionItems({ ...base, unacknowledgedComms: 3, tasksAwaitingSignOff: 1 });
    const comms = r.items.find((i) => i.category === "comms");
    const appr = r.items.find((i) => i.category === "approval");
    expect(comms?.title).toContain("3 messages");
    expect(comms?.href).toBe("/comms");
    expect(appr?.title).toContain("1 item");
    expect(appr?.href).toBe("/tasks");
  });

  it("singular/plural wording", () => {
    expect(aggregateActionItems({ ...base, unacknowledgedComms: 1 }).items[0].title).toContain("1 message need"); // "1 message needs"
  });

  it("orders critical before attention", () => {
    const r = aggregateActionItems({ emergencies: [emergency("e1")], staffing: criticalStaffing, unacknowledgedComms: 2, tasksAwaitingSignOff: 2 });
    const sevs = r.items.map((i) => i.severity);
    const rank = { critical: 0, attention: 1, info: 2 };
    for (let i = 1; i < sevs.length; i++) expect(rank[sevs[i]]).toBeGreaterThanOrEqual(rank[sevs[i - 1]]);
    expect(r.critical).toBe(2); // emergency + staffing
  });

  it("PRIVACY: titles/details carry no record contents — only counts/categories", () => {
    const r = aggregateActionItems({ ...base, unacknowledgedComms: 5, tasksAwaitingSignOff: 3 });
    const text = JSON.stringify(r.items);
    expect(text).not.toMatch(/child|medication|allegation|diagnos|safeguarding concern/i);
  });
});
