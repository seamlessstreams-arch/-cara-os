import { describe, it, expect } from "vitest";
import {
  computeDeploymentSuitability,
  deploymentReasonsFromCompliance,
  type Reg32Shift,
  type Reg32Staff,
  type ComplianceVerdictLite,
} from "../reg32-deployment-engine";

const FROM = "2026-07-13";
const TO = "2026-07-26";

const staff = (over: Partial<Reg32Staff> & { id: string }): Reg32Staff => ({
  full_name: over.id,
  role: "residential_care_worker",
  home_id: "home_oak",
  employment_status: "active",
  is_active: true,
  ...over,
});

const shift = (over: Partial<Reg32Shift> & { id: string; staff_id: string }): Reg32Shift => ({
  date: "2026-07-14",
  shift_type: "day",
  home_id: "home_oak",
  is_open_shift: false,
  status: "scheduled",
  ...over,
});

const compliant = (id: string): ComplianceVerdictLite => ({
  staff_id: id,
  level: "compliant",
  deployment_reasons: [],
});

describe("computeDeploymentSuitability — honest classification", () => {
  it("clean, active, compliant staff on a shift → suitable", () => {
    const b = computeDeploymentSuitability({
      shifts: [shift({ id: "s1", staff_id: "a" })],
      staff: [staff({ id: "a", full_name: "Ana" })],
      compliance: [compliant("a")],
      fromDate: FROM,
      toDate: TO,
    });
    expect(b.assessed).toBe(1);
    expect(b.shifts[0].suitability).toBe("suitable");
    expect(b.summary).toEqual({ unsuitable: 0, deploy_with_attention: 0, suitable: 1 });
  });

  it("suspended staff → unsuitable (hard bar), regardless of compliance", () => {
    const b = computeDeploymentSuitability({
      shifts: [shift({ id: "s1", staff_id: "a" })],
      staff: [staff({ id: "a", employment_status: "suspended" })],
      compliance: [compliant("a")],
      fromDate: FROM,
      toDate: TO,
    });
    expect(b.shifts[0].suitability).toBe("unsuitable");
    expect(b.shifts[0].reasons[0]).toMatch(/Suspended/i);
  });

  it("left / inactive staff on a future shift → unsuitable", () => {
    const b = computeDeploymentSuitability({
      shifts: [shift({ id: "s1", staff_id: "a" }), shift({ id: "s2", staff_id: "b" })],
      staff: [
        staff({ id: "a", employment_status: "left" }),
        staff({ id: "b", employment_status: "active", is_active: false }),
      ],
      compliance: [compliant("a"), compliant("b")],
      fromDate: FROM,
      toDate: TO,
    });
    expect(b.summary.unsuitable).toBe(2);
    expect(b.shifts.every((s) => s.suitability === "unsuitable")).toBe(true);
  });

  it("expired mandatory training (critical) → deploy_with_attention, courses named", () => {
    const b = computeDeploymentSuitability({
      shifts: [shift({ id: "s1", staff_id: "a" })],
      staff: [staff({ id: "a" })],
      compliance: [
        { staff_id: "a", level: "critical", deployment_reasons: ["Mandatory training expired: Safeguarding, First Aid"] },
      ],
      fromDate: FROM,
      toDate: TO,
    });
    expect(b.shifts[0].suitability).toBe("deploy_with_attention");
    expect(b.shifts[0].reasons.join(" ")).toMatch(/Safeguarding/);
  });

  it("DBS overdue → deploy_with_attention (Reg 32 gap, not a hard bar)", () => {
    const b = computeDeploymentSuitability({
      shifts: [shift({ id: "s1", staff_id: "a" })],
      staff: [staff({ id: "a" })],
      compliance: [{ staff_id: "a", level: "critical", deployment_reasons: ["Enhanced DBS overdue for renewal (Reg 32)"] }],
      fromDate: FROM,
      toDate: TO,
    });
    expect(b.shifts[0].suitability).toBe("deploy_with_attention");
  });

  it("overdue supervision only (attention, no deployment reasons) → SUITABLE — not a deployment bar", () => {
    const b = computeDeploymentSuitability({
      shifts: [shift({ id: "s1", staff_id: "a" })],
      staff: [staff({ id: "a" })],
      compliance: [{ staff_id: "a", level: "attention", deployment_reasons: [] }],
      fromDate: FROM,
      toDate: TO,
    });
    expect(b.shifts[0].suitability).toBe("suitable");
  });

  it("a hard bar outranks a compliance gap (suspended + expired training → unsuitable, not attention)", () => {
    const b = computeDeploymentSuitability({
      shifts: [shift({ id: "s1", staff_id: "a" })],
      staff: [staff({ id: "a", employment_status: "suspended" })],
      compliance: [{ staff_id: "a", level: "critical", deployment_reasons: ["Mandatory training expired: Safeguarding"] }],
      fromDate: FROM,
      toDate: TO,
    });
    expect(b.shifts[0].suitability).toBe("unsuitable");
  });

  it("assigned to a staff_id with no record → deploy_with_attention (data gap, not a clean bill)", () => {
    const b = computeDeploymentSuitability({
      shifts: [shift({ id: "s1", staff_id: "ghost" })],
      staff: [],
      compliance: [],
      fromDate: FROM,
      toDate: TO,
    });
    expect(b.shifts[0].suitability).toBe("deploy_with_attention");
    expect(b.shifts[0].reasons[0]).toMatch(/not found/i);
  });
});

describe("computeDeploymentSuitability — roster hygiene", () => {
  it("open and cancelled shifts are skipped (counted as unassigned, not assessed)", () => {
    const b = computeDeploymentSuitability({
      shifts: [
        shift({ id: "open1", staff_id: "", is_open_shift: true }),
        shift({ id: "cxl1", staff_id: "a", status: "cancelled" }),
        shift({ id: "s1", staff_id: "a" }),
      ],
      staff: [staff({ id: "a" })],
      compliance: [compliant("a")],
      fromDate: FROM,
      toDate: TO,
    });
    expect(b.assessed).toBe(1);
    expect(b.unassigned).toBe(2);
    expect(b.shifts.map((s) => s.shift_id)).toEqual(["s1"]);
  });

  it("shifts outside the window are excluded", () => {
    const b = computeDeploymentSuitability({
      shifts: [
        shift({ id: "before", staff_id: "a", date: "2026-07-01" }),
        shift({ id: "in", staff_id: "a", date: "2026-07-20" }),
        shift({ id: "after", staff_id: "a", date: "2026-08-10" }),
      ],
      staff: [staff({ id: "a" })],
      compliance: [compliant("a")],
      fromDate: FROM,
      toDate: TO,
    });
    expect(b.assessed).toBe(1);
    expect(b.shifts[0].shift_id).toBe("in");
  });

  it("worst-first ordering: unsuitable before attention before suitable, then by date", () => {
    const b = computeDeploymentSuitability({
      shifts: [
        shift({ id: "ok", staff_id: "ok", date: "2026-07-14" }),
        shift({ id: "bad", staff_id: "bad", date: "2026-07-25" }),
        shift({ id: "warn", staff_id: "warn", date: "2026-07-15" }),
      ],
      staff: [
        staff({ id: "ok" }),
        staff({ id: "bad", employment_status: "suspended" }),
        staff({ id: "warn" }),
      ],
      compliance: [
        compliant("ok"),
        compliant("bad"),
        { staff_id: "warn", level: "critical", deployment_reasons: ["Enhanced DBS overdue for renewal (Reg 32)"] },
      ],
      fromDate: FROM,
      toDate: TO,
    });
    expect(b.shifts.map((s) => s.shift_id)).toEqual(["bad", "warn", "ok"]);
  });
});

describe("deploymentReasonsFromCompliance — excludes developmental items", () => {
  it("expired mandatory training names the courses", () => {
    expect(
      deploymentReasonsFromCompliance({ training: { expired: 2, expired_courses: ["Safeguarding", "Medication"] } }),
    ).toEqual(["Mandatory training expired: Safeguarding, Medication"]);
  });

  it("DBS due for renewal counts only when NOT on the update service", () => {
    expect(deploymentReasonsFromCompliance({ dbs: { due_for_renewal: true, on_update_service: false } })).toEqual([
      "Enhanced DBS overdue for renewal (Reg 32)",
    ]);
    expect(deploymentReasonsFromCompliance({ dbs: { due_for_renewal: true, on_update_service: true } })).toEqual([]);
  });

  it("a clean compliance row yields no deployment reasons", () => {
    expect(deploymentReasonsFromCompliance({ training: { expired: 0 }, dbs: { due_for_renewal: false } })).toEqual([]);
  });
});
