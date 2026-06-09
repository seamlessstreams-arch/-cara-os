import { describe, it, expect } from "vitest";
import { computePremisesCompliance, type ComplianceItemInput } from "../premises-compliance-engine";

const TODAY = "2026-06-09";
function at(days: number): string {
  const d = new Date(TODAY + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function run(items: ComplianceItemInput[], due_soon_days = 30) {
  return computePremisesCompliance({ today: TODAY, items, due_soon_days });
}

describe("computePremisesCompliance", () => {
  it("empty → zero summary + headline", () => {
    const r = run([]);
    expect(r.summary.total).toBe(0);
    expect(r.summary.compliance_rate).toBeNull();
    expect(r.headline).toMatch(/No premises safety records/);
  });

  it("classifies expiry dates: overdue (expired) vs current vs due-soon", () => {
    const r = run([
      { key: "gas", label: "Gas Safety", category: "Certificates", due_date: at(180) },   // current
      { key: "eicr", label: "EICR", category: "Certificates", due_date: at(-5) },          // expired → overdue
      { key: "fra", label: "Fire Risk Assessment", category: "Certificates", due_date: at(20) }, // due soon (<=30)
    ]);
    const by = Object.fromEntries(r.items.map((i) => [i.key, i.status]));
    expect(by.gas).toBe("current");
    expect(by.eicr).toBe("overdue");
    expect(by.fra).toBe("due_soon");
    expect(r.summary.overdue).toBe(1);
    expect(r.summary.due_soon).toBe(1);
    expect(r.summary.current).toBe(1);
  });

  it("a completed recurring check is current even if its due date has passed", () => {
    const r = run([
      { key: "alarm", label: "Fire alarm test", category: "Routine safety checks", due_date: at(-2), completed: true },
    ]);
    expect(r.items[0].status).toBe("current");
  });

  it("a failed check is 'action' regardless of date", () => {
    const r = run([
      { key: "sec", label: "External security", category: "Routine safety checks", due_date: at(5), failed: true },
    ]);
    expect(r.items[0].status).toBe("action");
    expect(r.summary.action).toBe(1);
  });

  it("a check with no due date and not completed is 'no_record' and excluded from compliance rate", () => {
    const r = run([
      { key: "water", label: "Water hygiene / legionella", category: "Routine safety checks", due_date: null },
      { key: "gas", label: "Gas Safety", category: "Certificates", due_date: at(100) }, // current
    ]);
    const water = r.items.find((i) => i.key === "water")!;
    expect(water.status).toBe("no_record");
    expect(r.summary.no_record).toBe(1);
    // compliance rate = current / recorded = 1/1 = 100 (no_record excluded from denominator)
    expect(r.summary.compliance_rate).toBe(100);
    expect(r.no_record_items.map((i) => i.key)).toEqual(["water"]);
  });

  it("sorts worst-first and builds the attention list", () => {
    const r = run([
      { key: "ok", label: "Gas", category: "Certificates", due_date: at(200) },               // current
      { key: "soon", label: "Boiler service", category: "Servicing & maintenance", due_date: at(10) }, // due_soon
      { key: "fail", label: "Emergency lighting", category: "Routine safety checks", failed: true },   // action
      { key: "late", label: "Fire drill", category: "Drills", due_date: at(-30) },             // overdue
      { key: "none", label: "Fire equipment", category: "Routine safety checks", due_date: null }, // no_record
    ]);
    // overdue < action < due_soon < no_record < current
    expect(r.items.map((i) => i.key)).toEqual(["late", "fail", "soon", "none", "ok"]);
    expect(r.attention.map((i) => i.key)).toEqual(["late", "fail", "soon"]);
  });

  it("rolls up by category with a worst status per category", () => {
    const r = run([
      { key: "gas", label: "Gas", category: "Certificates", due_date: at(100) },
      { key: "eicr", label: "EICR", category: "Certificates", due_date: at(-3) }, // overdue → category worst
      { key: "drill", label: "Fire drill", category: "Drills", due_date: at(40) }, // current (beyond 30d window)
    ]);
    const certs = r.by_category.find((c) => c.category === "Certificates")!;
    expect(certs.total).toBe(2);
    expect(certs.overdue).toBe(1);
    expect(certs.worst).toBe("overdue");
    const drills = r.by_category.find((c) => c.category === "Drills")!;
    expect(drills.worst).toBe("current");
  });

  it("headline reports all-in-date with a no-record tail", () => {
    const r = run([
      { key: "gas", label: "Gas", category: "Certificates", due_date: at(100) },
      { key: "water", label: "Water hygiene", category: "Routine safety checks", due_date: null },
    ]);
    expect(r.headline).toMatch(/All recorded safety checks are in date/);
    expect(r.headline).toMatch(/1 statutory check has no record/);
  });

  it("is deterministic for a fixed today", () => {
    const items: ComplianceItemInput[] = [
      { key: "a", label: "A", category: "Certificates", due_date: at(-1) },
      { key: "b", label: "B", category: "Drills", due_date: at(10) },
    ];
    expect(run(items)).toEqual(run(items));
  });
});
