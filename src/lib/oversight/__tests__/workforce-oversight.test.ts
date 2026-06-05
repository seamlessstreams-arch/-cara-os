import { describe, it, expect } from "vitest";
import { buildWorkforceOversight, type WorkforceOversightInput } from "../workforce-oversight";
import { buildWorkforceEvidencePack } from "../workforce-evidence";
import type { SignInVerification } from "@/lib/attendance/presence-verification";
import type { EmergencyAlert } from "@/lib/staffing/emergency-types";
import type { SafeStaffingAssessment } from "@/lib/staffing/safe-staffing";
import type { CommsMessageAction } from "@/types/comms";

const NOW = "2026-09-22T12:00:00.000Z";
const OLD = "2026-09-01T12:00:00.000Z"; // outside a 7-day window

const staffing: SafeStaffingAssessment = {
  period: "day", on_shift_count: 1, minimum_required: 2, shortfall: 1,
  is_understaffed: true, is_lone_working: true, has_waking_night: false, no_night_cover: false,
  severity: "critical", alerts: [{ type: "understaffed", severity: "critical", message: "x" }, { type: "lone_working", severity: "high", message: "y" }],
};

function input(): WorkforceOversightInput {
  return {
    homeId: "home_oak",
    nowIso: NOW,
    periodDays: 7,
    shifts: [
      { staff_id: "a", date: "2026-09-22", start_time: "08:00", clock_in_at: "2026-09-22T08:00:00.000Z", clock_out_at: null, status: "in_progress", home_id: "home_oak" },
      { staff_id: "b", date: "2026-09-22", start_time: "08:00", clock_in_at: "2026-09-22T08:30:00.000Z", clock_out_at: "2026-09-22T16:00:00.000Z", status: "completed", home_id: "home_oak" },
    ],
    verifications: [
      { id: "v1", staff_id: "a", shift_id: "s1", home_id: "home_oak", method: "kiosk", verified: true, band: "on_site", created_at: NOW },
      { id: "v2", staff_id: "b", shift_id: "s2", home_id: "home_oak", method: "manual", verified: false, band: null, created_at: NOW },
      { id: "v3", staff_id: "c", shift_id: "s3", home_id: "home_oak", method: "kiosk", verified: true, band: "on_site", created_at: OLD },
    ] as SignInVerification[],
    messageActions: [
      { id: "a1", message_id: "m1", action_type: "safeguarding_concern", target_record_id: "e1", created_by: "a", created_at: NOW },
      { id: "a2", message_id: "m2", action_type: "task", target_record_id: "t1", created_by: "a", created_at: NOW },
      { id: "a3", message_id: "m3", action_type: "safeguarding_concern", target_record_id: "e2", created_by: "b", created_at: NOW },
    ] as CommsMessageAction[],
    messages: [
      { id: "m1", home_id: "home_oak", investigation_hold: true, retention_category: "investigation", created_at: NOW, is_deleted: false },
      { id: "m2", home_id: "home_oak", investigation_hold: false, retention_category: "routine_messages", created_at: NOW, is_deleted: false },
    ],
    emergencies: [
      { id: "e1", home_id: "home_oak", status: "active", responders: [{ staff_id: "a", name: "A", at: NOW }], created_at: NOW },
      { id: "e2", home_id: "home_oak", status: "resolved", responders: [{ staff_id: "a", name: "A", at: NOW }, { staff_id: "b", name: "B", at: NOW }], created_at: NOW },
    ] as EmergencyAlert[],
    staffing,
  };
}

describe("buildWorkforceOversight", () => {
  const o = buildWorkforceOversight(input());

  it("aggregates today's attendance incl lateness", () => {
    expect(o.attendance.clock_ins_today).toBe(2);
    expect(o.attendance.currently_on_shift).toBe(1);
    expect(o.attendance.late_today).toBe(1);
  });

  it("aggregates presence within the period (excludes old)", () => {
    expect(o.presence.total).toBe(2);
    expect(o.presence.verified).toBe(1);
    expect(o.presence.unverified).toBe(1);
    expect(o.presence.by_method).toEqual({ kiosk: 1, manual: 1 });
  });

  it("aggregates message governance", () => {
    expect(o.governance.conversions_total).toBe(3);
    expect(o.governance.conversions_by_type.safeguarding_concern).toBe(2);
    expect(o.governance.conversions_by_type.task).toBe(1);
    expect(o.governance.active_investigation_holds).toBe(1);
    expect(o.governance.retained_non_routine).toBe(1);
  });

  it("aggregates emergencies", () => {
    expect(o.emergencies.raised).toBe(2);
    expect(o.emergencies.active).toBe(1);
    expect(o.emergencies.resolved).toBe(1);
    expect(o.emergencies.total_responders).toBe(3);
  });

  it("carries the current staffing severity", () => {
    expect(o.staffing.severity).toBe("critical");
    expect(o.staffing.open_alerts).toBe(2);
  });

  it("orders flags worst-first (critical before attention before info)", () => {
    expect(o.flags[0].severity).toBe("critical");
    expect(o.flags.some((f) => f.label.includes("emergency"))).toBe(true);
    const sevs = o.flags.map((f) => f.severity);
    const rank = { critical: 0, attention: 1, info: 2 };
    for (let i = 1; i < sevs.length; i++) expect(rank[sevs[i]]).toBeGreaterThanOrEqual(rank[sevs[i - 1]]);
  });
});

describe("buildWorkforceEvidencePack", () => {
  const pack = buildWorkforceEvidencePack(input());

  it("has the four engine sections with Reg alignment + record counts", () => {
    expect(pack.sections.map((s) => s.key)).toEqual([
      "attendance_presence", "message_governance", "emergency_response", "safe_staffing",
    ]);
    for (const s of pack.sections) {
      expect(s.reg_alignment.length).toBeGreaterThan(0);
      expect(typeof s.narrative).toBe("string");
    }
  });

  it("includes the engine's guarantees and the summary", () => {
    expect(pack.guarantees.length).toBeGreaterThanOrEqual(4);
    expect(pack.guarantees.join(" ")).toMatch(/never location|no continuous tracking/i);
    expect(pack.summary.attendance.clock_ins_today).toBe(2);
    expect(pack.title).toContain("home_oak");
  });
});
