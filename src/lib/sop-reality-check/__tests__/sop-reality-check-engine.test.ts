import { describe, it, expect } from "vitest";
import { buildSopRealityCheck, type SopInput } from "../sop-reality-check-engine";

const NOW = "2026-06-23T12:00:00.000Z";
const children = [{ id: "yp_alex", name: "Alex" }, { id: "yp_jordan", name: "Jordan" }];

function input(over: Partial<SopInput> = {}): SopInput {
  return {
    now: NOW,
    children,
    carePlans: children.map((c, i) => ({ id: `cp${i}`, child_id: c.id, status: "active" }) as never),
    dailyLog: [{ child_id: "yp_alex", date: "2026-06-20" }],
    keyWorkingSessions: [{ id: "k1", child_id: "yp_alex", date: "2026-06-19" }] as never,
    incidents: [],
    debriefRecords: [],
    riskAssessments: children.map((c, i) => ({ id: `ra${i}`, child_id: c.id, status: "current" }) as never),
    lacReviews: [{ id: "l1", child_id: "yp_alex", date: "2026-06-01" }] as never,
    positiveAchievements: children.map((c, i) => ({ id: `pa${i}`, child_id: c.id, date: "2026-06-10" }) as never),
    educationRecords: [{ id: "e1", child_id: "yp_alex", date: "2026-06-05" }] as never,
    trainingRecords: [{ id: "t1", staff_id: "s1", is_mandatory: true, status: "compliant" }] as never,
    supervisions: [{ id: "s1", status: "completed" }] as never,
    audits: [{ id: "a1", created_at: "2026-06-01" }],
    ...over,
  };
}

describe("buildSopRealityCheck", () => {
  it("returns the seven SOP areas and is deterministic", () => {
    const a = buildSopRealityCheck(input());
    const b = buildSopRealityCheck(input());
    expect(a).toEqual(b);
    expect(a.areas.map((x) => x.key)).toEqual(["clarity", "environment", "staff_skills", "care_delivery", "safeguarding", "outcomes", "leadership"]);
  });

  it("rates a well-evidenced home strongly with no inspection risks", () => {
    const r = buildSopRealityCheck(input());
    expect(r.inspectionRisks).toHaveLength(0);
    expect(r.areasLimited).toBe(0);
    expect(["strong", "developing"]).toContain(r.overallConfidence);
  });

  it("flags a care-plan gap as a high clarity + care-delivery risk", () => {
    const r = buildSopRealityCheck(input({ carePlans: [] }));
    const clarity = r.areas.find((a) => a.key === "clarity")!;
    expect(clarity.gaps.some((g) => g.severity === "high")).toBe(true);
    expect(clarity.inspectionRisk).toBe(true);
    expect(r.inspectionRisks.length).toBeGreaterThanOrEqual(1);
  });

  it("flags incidents without debriefs as a safeguarding risk", () => {
    const r = buildSopRealityCheck(input({
      incidents: [{ id: "i1", child_id: "yp_alex", date: "2026-06-15", severity: "high", type: "x", description: "" }] as never,
      debriefRecords: [],
    }));
    const sg = r.areas.find((a) => a.key === "safeguarding")!;
    expect(sg.gaps.some((g) => g.label.includes("no debrief"))).toBe(true);
    expect(sg.inspectionRisk).toBe(true);
  });

  it("flags non-compliant mandatory training in staff skills", () => {
    const r = buildSopRealityCheck(input({
      trainingRecords: [
        { id: "t1", staff_id: "s1", is_mandatory: true, status: "compliant" },
        { id: "t2", staff_id: "s1", is_mandatory: true, status: "expired" },
      ] as never,
    }));
    const ss = r.areas.find((a) => a.key === "staff_skills")!;
    expect(ss.gaps.some((g) => g.label.includes("training"))).toBe(true);
  });

  it("rolls high gaps into the inspection-risk gap report", () => {
    const r = buildSopRealityCheck(input({ carePlans: [], riskAssessments: [] }));
    expect(r.inspectionRisks.length).toBeGreaterThanOrEqual(2);
    expect(r.overallConfidence).toBe("limited");
  });
});
