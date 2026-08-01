import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateYouthAward,
  type YouthAwardsRow,
} from "./youth-awards-service";

// ── Factory ────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<YouthAwardsRow> = {}): YouthAwardsRow {
  return {
    id: "ya-1",
    home_id: "home-1",
    young_person_name: "Taylor Jones",
    record_date: "2025-05-01",
    supporting_staff: "Staff A",
    award_scheme: "Duke of Edinburgh (Bronze)",
    section: "Volunteering",
    activity_description: "Community volunteering at food bank",
    hours_completed: 10,
    hours_required: 20,
    assessor_name: "Assessor A",
    evidence_recorded: true,
    young_person_engaged: true,
    barriers_identified: null,
    support_provided: null,
    milestone_achieved: false,
    completion_date: null,
    certificate_received: false,
    celebrated_achievement: false,
    linked_to_pathway_plan: true,
    social_worker_informed: true,
    notes: null,
    created_at: "2025-05-01T00:00:00Z",
    updated_at: "2025-05-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeMetrics ─────────────────────────────────────────────────────────

describe("computeMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.unique_young_people).toBe(0);
    expect(m.milestones_achieved).toBe(0);
    expect(m.certificates_received).toBe(0);
    expect(m.achievements_celebrated).toBe(0);
    expect(m.engagement_rate).toBeNull();;
    expect(m.total_hours_completed).toBe(0);
    expect(m.dofe_participants).toBe(0);
    expect(m.completion_rate).toBeNull();;
  });

  it("counts unique young people case-insensitively", () => {
    const rows = [
      makeRow({ young_person_name: "Taylor Jones" }),
      makeRow({ id: "ya-2", young_person_name: "taylor jones" }),
      makeRow({ id: "ya-3", young_person_name: "Jordan Smith" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_young_people).toBe(2);
  });

  it("builds award scheme breakdown with all schemes initialized", () => {
    const rows = [makeRow({ award_scheme: "ASDAN" })];
    const m = computeMetrics(rows);
    expect(m.by_award_scheme["ASDAN"]).toBe(1);
    expect(m.by_award_scheme["Duke of Edinburgh (Bronze)"]).toBe(0);
  });

  it("counts milestones, certificates, and celebrations", () => {
    const rows = [
      makeRow({ milestone_achieved: true, certificate_received: true, celebrated_achievement: true }),
      makeRow({ id: "ya-2", milestone_achieved: true, certificate_received: false, celebrated_achievement: false }),
      makeRow({ id: "ya-3", milestone_achieved: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.milestones_achieved).toBe(2);
    expect(m.certificates_received).toBe(1);
    expect(m.achievements_celebrated).toBe(1);
  });

  it("computes engagement rate correctly", () => {
    const rows = [
      makeRow({ young_person_engaged: true }),
      makeRow({ id: "ya-2", young_person_engaged: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.engagement_rate).toBe(50);
  });

  it("sums total hours completed", () => {
    const rows = [
      makeRow({ hours_completed: 10 }),
      makeRow({ id: "ya-2", hours_completed: 15 }),
      makeRow({ id: "ya-3", hours_completed: null }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_hours_completed).toBe(25);
  });

  it("counts DofE participants as unique names", () => {
    const rows = [
      makeRow({ award_scheme: "Duke of Edinburgh (Bronze)", young_person_name: "Taylor" }),
      makeRow({ id: "ya-2", award_scheme: "Duke of Edinburgh (Silver)", young_person_name: "Taylor" }),
      makeRow({ id: "ya-3", award_scheme: "ASDAN", young_person_name: "Jordan" }),
    ];
    const m = computeMetrics(rows);
    expect(m.dofe_participants).toBe(1);
  });

  it("computes completion rate from completion_date", () => {
    const rows = [
      makeRow({ completion_date: "2025-04-30" }),
      makeRow({ id: "ya-2", completion_date: null }),
    ];
    const m = computeMetrics(rows);
    expect(m.completion_rate).toBe(50);
  });
});

// ── computeAlerts ──────────────────────────────────────────────────────────

describe("computeAlerts", () => {
  it("returns no alerts for empty rows", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("flags high for milestone achieved but not celebrated", () => {
    const rows = [makeRow({ milestone_achieved: true, celebrated_achievement: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "milestone_not_celebrated");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags high for completion without certificate", () => {
    const rows = [makeRow({ completion_date: "2025-04-30", certificate_received: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "certificate_outstanding");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags high when not linked to pathway plan", () => {
    const rows = [makeRow({ linked_to_pathway_plan: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "not_linked_to_pathway_plan");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags high when milestone achieved but social worker not informed", () => {
    const rows = [makeRow({ milestone_achieved: true, social_worker_informed: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "social_worker_not_informed");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags medium when evidence not recorded but hours > 0", () => {
    const rows = [makeRow({ evidence_recorded: false, hours_completed: 5 })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "evidence_not_recorded");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("medium");
  });

  it("flags medium for young person not engaged", () => {
    const rows = [makeRow({ young_person_engaged: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.filter((a) => a.type === "young_person_disengaged");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("medium");
  });
});

// ── validateYouthAward ─────────────────────────────────────────────────────

describe("validateYouthAward", () => {
  it("passes for valid input", () => {
    const result = validateYouthAward({
      youngPersonName: "Taylor Jones",
      recordDate: "2025-05-01",
      supportingStaff: "Staff A",
      awardScheme: "ASDAN",
      activityDescription: "Module 1 completion",
      linkedToPathwayPlan: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects missing young person name", () => {
    const result = validateYouthAward({
      youngPersonName: "",
      recordDate: "2025-05-01",
      supportingStaff: "Staff A",
      awardScheme: "ASDAN",
      activityDescription: "Activity",
      linkedToPathwayPlan: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("name is required"))).toBe(true);
  });

  it("rejects future record date", () => {
    const result = validateYouthAward({
      youngPersonName: "Taylor",
      recordDate: "2099-01-01",
      supportingStaff: "Staff A",
      awardScheme: "ASDAN",
      activityDescription: "Activity",
      linkedToPathwayPlan: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("future"))).toBe(true);
  });

  it("rejects Residential section for non-Gold DofE", () => {
    const result = validateYouthAward({
      youngPersonName: "Taylor",
      recordDate: "2025-05-01",
      supportingStaff: "Staff A",
      awardScheme: "Duke of Edinburgh (Bronze)",
      section: "Residential",
      activityDescription: "Activity",
      linkedToPathwayPlan: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Residential section is only available"))).toBe(true);
  });

  it("allows Residential section for DofE Gold", () => {
    const result = validateYouthAward({
      youngPersonName: "Taylor",
      recordDate: "2025-05-01",
      supportingStaff: "Staff A",
      awardScheme: "Duke of Edinburgh (Gold)",
      section: "Residential",
      activityDescription: "Residential week",
      hoursRequired: 50,
      linkedToPathwayPlan: true,
    });
    // should not have the residential error
    expect(result.errors.some((e) => e.includes("Residential section is only available"))).toBe(false);
  });

  it("flags hours_completed exceeding hours_required", () => {
    const result = validateYouthAward({
      youngPersonName: "Taylor",
      recordDate: "2025-05-01",
      supportingStaff: "Staff A",
      awardScheme: "ASDAN",
      activityDescription: "Activity",
      hoursCompleted: 30,
      hoursRequired: 20,
      linkedToPathwayPlan: true,
    });
    expect(result.errors.some((e) => e.includes("Hours completed cannot exceed"))).toBe(true);
  });

  it("flags milestone achieved but not celebrated", () => {
    const result = validateYouthAward({
      youngPersonName: "Taylor",
      recordDate: "2025-05-01",
      supportingStaff: "Staff A",
      awardScheme: "ASDAN",
      activityDescription: "Activity",
      milestoneAchieved: true,
      celebratedAchievement: false,
      linkedToPathwayPlan: true,
    });
    expect(result.errors.some((e) => e.includes("celebrated"))).toBe(true);
  });

  it("flags not linked to pathway plan", () => {
    const result = validateYouthAward({
      youngPersonName: "Taylor",
      recordDate: "2025-05-01",
      supportingStaff: "Staff A",
      awardScheme: "ASDAN",
      activityDescription: "Activity",
      linkedToPathwayPlan: false,
    });
    expect(result.errors.some((e) => e.includes("pathway plan"))).toBe(true);
  });
});
