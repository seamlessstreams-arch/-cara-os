import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateCareerGuidance,
  type CareerGuidanceRow,
} from "./career-guidance-service";

function makeRow(overrides: Partial<CareerGuidanceRow> = {}): CareerGuidanceRow {
  return {
    id: "cg-1",
    home_id: "home-1",
    young_person_name: "Jordan Lee",
    session_date: "2026-04-10",
    facilitator_name: "Sarah Connor",
    activity_type: "Careers Interview",
    gatsby_benchmark: "8 — Personal Guidance",
    employer_name: null,
    placement_sector: null,
    duration_hours: 1,
    young_person_engaged: true,
    practical_component: false,
    cv_created_updated: false,
    interview_skills_practised: false,
    pathway_plan_linked: true,
    personal_adviser_involved: false,
    social_worker_informed: true,
    confidence_before: "Medium",
    confidence_after: "High",
    next_session_date: null,
    notes: null,
    created_at: "2026-04-10T00:00:00Z",
    updated_at: "2026-04-10T00:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.unique_young_people).toBe(0);
    expect(m.engagement_rate).toBeNull(); // fab-0.;
    expect(m.confidence_improvement_rate).toBeNull(); // fab-0.;
    expect(m.employer_encounter_count).toBe(0);
    expect(m.gatsby_coverage).toBe(0);
  });

  it("counts sessions and unique people correctly", () => {
    const rows = [
      makeRow({ id: "1", young_person_name: "Jordan Lee" }),
      makeRow({ id: "2", young_person_name: "Jordan Lee" }),
      makeRow({ id: "3", young_person_name: "Sam Taylor" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_sessions).toBe(3);
    expect(m.unique_young_people).toBe(2);
    expect(m.average_sessions_per_person).toBe(1.5);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", young_person_engaged: true, pathway_plan_linked: true }),
      makeRow({ id: "2", young_person_engaged: false, pathway_plan_linked: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.engagement_rate).toBe(50);
    expect(m.pathway_plan_rate).toBe(50);
  });

  it("counts employer encounters and work experience", () => {
    const rows = [
      makeRow({ id: "1", activity_type: "Employer Encounter" }),
      makeRow({ id: "2", activity_type: "Workplace Visit" }),
      makeRow({ id: "3", activity_type: "Work Experience Placement" }),
      makeRow({ id: "4", activity_type: "Careers Interview" }),
    ];
    const m = computeMetrics(rows);
    expect(m.employer_encounter_count).toBe(3);
    expect(m.work_experience_count).toBe(1);
  });

  it("calculates confidence improvement rate", () => {
    const rows = [
      makeRow({ id: "1", confidence_before: "Low", confidence_after: "High" }),
      makeRow({ id: "2", confidence_before: "Medium", confidence_after: "Medium" }),
    ];
    const m = computeMetrics(rows);
    expect(m.confidence_improvement_rate).toBe(50);
  });

  it("tracks gatsby coverage count", () => {
    const rows = [
      makeRow({ id: "1", gatsby_benchmark: "8 — Personal Guidance" }),
      makeRow({ id: "2", gatsby_benchmark: "5 — Employer Encounters" }),
      makeRow({ id: "3", gatsby_benchmark: "8 — Personal Guidance" }), // duplicate
    ];
    const m = computeMetrics(rows);
    expect(m.gatsby_coverage).toBe(2);
  });
});

describe("computeAlerts", () => {
  it("returns no alerts for empty rows", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical alert for no employer encounters when >= 5 sessions", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({ id: `cg-${i}`, activity_type: "Careers Interview" }),
    );
    const alerts = computeAlerts(rows);
    const noEmp = alerts.filter((a) => a.type === "no_employer_encounters");
    expect(noEmp.length).toBe(1);
    expect(noEmp[0].severity).toBe("critical");
  });

  it("fires critical alert for no personal guidance when >= 5 sessions", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({ id: `cg-${i}`, activity_type: "CV Writing", gatsby_benchmark: "4 — Linking Curriculum" }),
    );
    const alerts = computeAlerts(rows);
    const noPG = alerts.filter((a) => a.type === "no_personal_guidance");
    expect(noPG.length).toBe(1);
    expect(noPG[0].severity).toBe("critical");
  });

  it("fires high alert for disengaged young person", () => {
    const rows = [makeRow({ young_person_engaged: false })];
    const alerts = computeAlerts(rows);
    const disengaged = alerts.filter((a) => a.type === "young_person_disengaged");
    expect(disengaged.length).toBe(1);
    expect(disengaged[0].severity).toBe("high");
  });

  it("fires high alert for confidence decrease", () => {
    const rows = [makeRow({ confidence_before: "High", confidence_after: "Low" })];
    const alerts = computeAlerts(rows);
    const decreased = alerts.filter((a) => a.type === "confidence_decreased");
    expect(decreased.length).toBe(1);
    expect(decreased[0].severity).toBe("high");
  });

  it("fires high alert for pathway plan not linked >= 3", () => {
    const rows = Array.from({ length: 3 }, (_, i) =>
      makeRow({ id: `cg-${i}`, pathway_plan_linked: false }),
    );
    const alerts = computeAlerts(rows);
    const notLinked = alerts.filter((a) => a.type === "pathway_plan_not_linked");
    expect(notLinked.length).toBe(1);
    expect(notLinked[0].severity).toBe("high");
  });

  it("fires high alert for social worker not informed >= 3", () => {
    const rows = Array.from({ length: 3 }, (_, i) =>
      makeRow({ id: `cg-${i}`, social_worker_informed: false }),
    );
    const alerts = computeAlerts(rows);
    const swNot = alerts.filter((a) => a.type === "sw_not_informed_pattern");
    expect(swNot.length).toBe(1);
    expect(swNot[0].severity).toBe("high");
  });
});

describe("validateCareerGuidance", () => {
  it("passes with valid input", () => {
    const result = validateCareerGuidance({
      youngPersonName: "Jordan",
      sessionDate: "2026-04-01",
      facilitatorName: "Sarah",
      activityType: "Careers Interview",
      confidenceBefore: "Medium",
      confidenceAfter: "High",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects missing required fields", () => {
    const result = validateCareerGuidance({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("requires employer name for employer encounter activities", () => {
    const result = validateCareerGuidance({
      youngPersonName: "Jordan",
      sessionDate: "2026-04-01",
      facilitatorName: "Sarah",
      activityType: "Employer Encounter",
      employerName: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("employer name"))).toBe(true);
  });

  it("requires duration for work experience placements", () => {
    const result = validateCareerGuidance({
      youngPersonName: "Jordan",
      sessionDate: "2026-04-01",
      facilitatorName: "Sarah",
      activityType: "Work Experience Placement",
      employerName: "ACME Corp",
      durationHours: null,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("duration hours"))).toBe(true);
  });

  it("rejects negative and excessive duration", () => {
    const r1 = validateCareerGuidance({
      youngPersonName: "Jordan",
      sessionDate: "2026-04-01",
      facilitatorName: "Sarah",
      activityType: "Careers Interview",
      durationHours: -1,
    });
    expect(r1.errors.some((e) => e.includes("positive"))).toBe(true);

    const r2 = validateCareerGuidance({
      youngPersonName: "Jordan",
      sessionDate: "2026-04-01",
      facilitatorName: "Sarah",
      activityType: "Careers Interview",
      durationHours: 50,
    });
    expect(r2.errors.some((e) => e.includes("40"))).toBe(true);
  });
});
