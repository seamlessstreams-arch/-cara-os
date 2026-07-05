// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 44 BUILDING SAFETY CHECKLIST TESTS
//
// Pins: the checklist projects the existing building checks into the three Reg 44
// categories; in-date / overdue / failed / not-evidenced are read correctly from
// the latest relevant check; and items with no evidence are honestly flagged
// rather than assumed compliant.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { buildReg44BuildingSafety, type Reg44BuildingCheckInput } from "../building-safety";

const ASOF = "2026-07-05";

const chk = (o: Partial<Reg44BuildingCheckInput>): Reg44BuildingCheckInput => ({
  id: "c1", check_type: "fire_alarm_test", check_date: "2026-07-01", due_date: "2026-07-31", status: "completed", result: "pass", risk_level: "low",
  ...o,
});

describe("building safety checklist", () => {
  it("builds the three Reg 44 categories with items", () => {
    const b = buildReg44BuildingSafety([], ASOF);
    expect(b.categories.map((c) => c.name)).toEqual(["Fire safety", "Health and safety", "Premises condition and security"]);
    expect(b.categories.every((c) => c.items.length > 0)).toBe(true);
  });

  it("marks an item not_evidenced when no check exists — never assumes compliant", () => {
    const b = buildReg44BuildingSafety([], ASOF);
    const item = b.categories[0].items[0];
    expect(item.status).toBe("not_evidenced");
    expect(item.answer).toBe("not_evidenced");
    expect(b.summary.notEvidenced).toBeGreaterThan(0);
  });

  it("reads a recent passing check as in_date (Y)", () => {
    const b = buildReg44BuildingSafety([chk({ check_type: "gas_safety", check_date: "2026-06-01", due_date: "2027-05-31" })], ASOF);
    const gas = b.categories[1].items.find((i) => i.item.match(/Gas safety/))!;
    expect(gas.status).toBe("in_date");
    expect(gas.answer).toBe("yes");
    expect(gas.lastChecked).toBe("2026-06-01");
  });

  it("reads an overdue check (due date past) as overdue (N)", () => {
    const b = buildReg44BuildingSafety([chk({ check_type: "emergency_lighting", check_date: "2026-04-01", due_date: "2026-06-01", status: "completed" })], ASOF);
    const em = b.categories[0].items.find((i) => i.item.match(/Emergency lighting/))!;
    expect(em.status).toBe("overdue");
    expect(em.answer).toBe("no");
    expect(b.summary.overdue).toBe(1);
  });

  it("reads a failed check as failed with a risk flag", () => {
    const b = buildReg44BuildingSafety([chk({ check_type: "fire_extinguisher", result: "fail", status: "failed", risk_level: "high" })], ASOF);
    const ext = b.categories[0].items.find((i) => i.item.match(/extinguisher/i))!;
    expect(ext.status).toBe("failed");
    expect(ext.riskFlag).toBe(true);
    expect(b.summary.failed).toBe(1);
  });

  it("takes the LATEST check when several exist for a type", () => {
    const b = buildReg44BuildingSafety(
      [
        chk({ id: "old", check_type: "gas_safety", check_date: "2025-01-01", due_date: "2025-12-31", status: "overdue" }),
        chk({ id: "new", check_type: "gas_safety", check_date: "2026-06-01", due_date: "2027-05-31", status: "completed", result: "pass" }),
      ],
      ASOF,
    );
    const gas = b.categories[1].items.find((i) => i.item.match(/Gas safety/))!;
    expect(gas.status).toBe("in_date"); // latest wins
    expect(gas.lastChecked).toBe("2026-06-01");
  });

  it("summarises a ready section-H content string", () => {
    const b = buildReg44BuildingSafety([chk({ check_type: "fire_extinguisher", result: "fail", status: "failed" })], ASOF);
    expect(b.sectionContent).toMatch(/Fire safety:/);
    expect(b.sectionContent).toMatch(/FAILED|OVERDUE|not evidenced/);
  });
});
