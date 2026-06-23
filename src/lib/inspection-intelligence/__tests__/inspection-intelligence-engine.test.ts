import { describe, it, expect } from "vitest";
import {
  buildInspectionReadiness,
  type InspectionReadinessInput,
} from "../inspection-intelligence-engine";

const NOW = "2026-06-23T12:00:00.000Z";
const RECENT = "2026-06-15"; // within 30 days
const OVERDUE = "2026-05-01"; // in the past

function input(over: Partial<InspectionReadinessInput> = {}): InspectionReadinessInput {
  return {
    now: NOW,
    children: [],
    incidents: [],
    debriefRecords: [],
    missingEpisodes: [],
    returnInterviews: [],
    keyWorkingSessions: [],
    lacReviews: [],
    positiveAchievements: [],
    educationRecords: [],
    riskAssessments: [],
    welfareChecks: [],
    carePlans: [],
    supervisions: [],
    trainingRecords: [],
    ...over,
  };
}

describe("buildInspectionReadiness", () => {
  it("returns the three SCCIF areas and is deterministic", () => {
    const a = buildInspectionReadiness(input());
    const b = buildInspectionReadiness(input());
    expect(a).toEqual(b);
    expect(a.generatedAt).toBe(NOW);
    expect(a.areas.map((x) => x.key)).toEqual(["experiences_progress", "protection", "leadership"]);
  });

  it("does not produce false-red on an empty home (no children, no records)", () => {
    const out = buildInspectionReadiness(input());
    // No evidence and no gaps → developing, never limited.
    expect(out.areasLimited).toBe(0);
    expect(out.priorities).toHaveLength(0);
  });

  it("flags an incident without a debrief as a high-severity protection gap", () => {
    const out = buildInspectionReadiness(
      input({
        children: [{ id: "yp_a", name: "Alex" }],
        incidents: [{ id: "i1", child_id: "yp_a", date: RECENT, severity: "high", type: "physical", description: "x" } as never],
      }),
    );
    const protection = out.areas.find((a) => a.key === "protection")!;
    const gap = protection.gaps.find((g) => g.label.includes("no debrief"));
    expect(gap).toBeDefined();
    expect(gap!.severity).toBe("high");
    expect(out.priorities.some((p) => p.label.includes("no debrief"))).toBe(true);
  });

  it("flags a child with no recorded voice as a high experiences gap", () => {
    const out = buildInspectionReadiness(
      input({
        children: [{ id: "yp_a", name: "Alex" }],
        // key-work exists but without child_voice, and no LAC views
        keyWorkingSessions: [{ id: "k1", child_id: "yp_a", date: RECENT, staff_id: "s1" } as never],
      }),
    );
    const exp = out.areas.find((a) => a.key === "experiences_progress")!;
    expect(exp.gaps.some((g) => g.label.includes("no recorded voice"))).toBe(true);
  });

  it("reads experiences as strong when key-work, voice and achievements are present", () => {
    const out = buildInspectionReadiness(
      input({
        children: [{ id: "yp_a", name: "Alex" }],
        keyWorkingSessions: [
          { id: "k1", child_id: "yp_a", date: RECENT, staff_id: "s1", child_voice: "I feel safe" } as never,
        ],
        positiveAchievements: [{ id: "a1", child_id: "yp_a", date: RECENT, title: "Medal" } as never],
        lacReviews: [{ id: "l1", child_id: "yp_a", date: RECENT, child_views: "happy" } as never],
      }),
    );
    const exp = out.areas.find((a) => a.key === "experiences_progress")!;
    expect(exp.gaps).toHaveLength(0);
    expect(exp.strength).toBe("strong");
  });

  it("flags an overdue supervision as a leadership gap", () => {
    const out = buildInspectionReadiness(
      input({
        supervisions: [
          { id: "s1", staff_id: "st1", supervisor_id: "st2", scheduled_date: OVERDUE, actual_date: null, status: "scheduled" } as never,
        ],
      }),
    );
    const lead = out.areas.find((a) => a.key === "leadership")!;
    expect(lead.gaps.some((g) => g.label.includes("overdue supervision"))).toBe(true);
  });

  it("counts mandatory training compliance into leadership evidence", () => {
    const out = buildInspectionReadiness(
      input({
        trainingRecords: [
          { id: "t1", staff_id: "st1", course_name: "Safeguarding", status: "compliant", is_mandatory: true } as never,
          { id: "t2", staff_id: "st1", course_name: "First Aid", status: "expired", is_mandatory: true } as never,
        ],
      }),
    );
    const lead = out.areas.find((a) => a.key === "leadership")!;
    const ev = lead.evidence.find((e) => e.label.includes("Mandatory training"));
    expect(ev!.count).toBe(1);
    expect(lead.gaps.some((g) => g.label.includes("training"))).toBe(true);
  });

  it("attaches the specific children behind a gap (drill-down)", () => {
    const out = buildInspectionReadiness(
      input({
        children: [
          { id: "yp_a", name: "Alex" },
          { id: "yp_b", name: "Bea" },
        ],
        incidents: [{ id: "i1", child_id: "yp_a", date: RECENT, severity: "high", type: "physical", description: "x" } as never],
      }),
    );
    const protection = out.areas.find((a) => a.key === "protection")!;
    const gap = protection.gaps.find((g) => g.label.includes("no debrief"))!;
    expect(gap.childRefs).toEqual([{ id: "yp_a", name: "Alex" }]);
    // and it flows into the priority list with the child attached
    const prio = out.priorities.find((p) => p.label.includes("no debrief"))!;
    expect(prio.childRefs).toEqual([{ id: "yp_a", name: "Alex" }]);
  });

  it("collects high-severity gaps into the priority list and a headline", () => {
    const out = buildInspectionReadiness(
      input({
        children: [{ id: "yp_a", name: "Alex" }],
        incidents: [{ id: "i1", child_id: "yp_a", date: RECENT, severity: "high", type: "physical", description: "x" } as never],
        missingEpisodes: [{ id: "m1", child_id: "yp_a", date_missing: RECENT } as never],
      }),
    );
    expect(out.priorities.length).toBeGreaterThanOrEqual(1);
    expect(typeof out.headline).toBe("string");
    expect(out.headline.length).toBeGreaterThan(0);
  });
});
