import { describe, it, expect } from "vitest";
import {
  computeWorkExperienceMetrics,
  identifyWorkExperienceAlerts,
  type WorkExperienceEmploymentRecord,
} from "./work-experience-employment-service";

// ── Factory ────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<WorkExperienceEmploymentRecord> = {}): WorkExperienceEmploymentRecord {
  return {
    id: overrides.id ?? "rec-1",
    home_id: overrides.home_id ?? "home-1",
    placement_type: overrides.placement_type ?? "work_experience",
    readiness_level: overrides.readiness_level ?? "developing",
    employer_feedback: overrides.employer_feedback ?? "good",
    skill_acquisition: overrides.skill_acquisition ?? "good_gain",
    session_date: overrides.session_date ?? "2025-01-15",
    child_name: overrides.child_name ?? "Child A",
    child_id: overrides.child_id ?? null,
    supported_by: overrides.supported_by ?? "Staff A",
    child_consented: overrides.child_consented ?? true,
    age_appropriate: overrides.age_appropriate ?? true,
    risk_assessed: overrides.risk_assessed ?? true,
    safeguarding_checked: overrides.safeguarding_checked ?? true,
    dbs_verified: overrides.dbs_verified ?? true,
    insurance_confirmed: overrides.insurance_confirmed ?? true,
    care_plan_reflects: overrides.care_plan_reflects ?? true,
    social_worker_informed: overrides.social_worker_informed ?? true,
    parent_informed: overrides.parent_informed ?? true,
    pathway_plan_updated: overrides.pathway_plan_updated ?? true,
    transport_arranged: overrides.transport_arranged ?? true,
    recorded_promptly: overrides.recorded_promptly ?? true,
    issues_found: overrides.issues_found ?? [],
    actions_taken: overrides.actions_taken ?? [],
    next_review_date: overrides.next_review_date ?? null,
    notes: overrides.notes ?? null,
    created_at: overrides.created_at ?? "2025-01-15T00:00:00Z",
    updated_at: overrides.updated_at ?? "2025-01-15T00:00:00Z",
  };
}

// ── computeWorkExperienceMetrics ───────────────────────────────────────

describe("computeWorkExperienceMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeWorkExperienceMetrics([]);
    expect(m.total_placements).toBe(0);
    expect(m.not_ready_count).toBe(0);
    expect(m.not_suitable_count).toBe(0);
    expect(m.no_gain_count).toBe(0);
    expect(m.decline_count).toBe(0);
    expect(m.child_consented_rate).toBeNull();;
    expect(m.safeguarding_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts problem categories", () => {
    const records = [
      makeRecord({ readiness_level: "not_ready" }),
      makeRecord({ employer_feedback: "not_suitable" }),
      makeRecord({ skill_acquisition: "no_gain" }),
      makeRecord({ skill_acquisition: "decline" }),
      makeRecord({}),
    ];
    const m = computeWorkExperienceMetrics(records);
    expect(m.not_ready_count).toBe(1);
    expect(m.not_suitable_count).toBe(1);
    expect(m.no_gain_count).toBe(1);
    expect(m.decline_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({
        child_consented: true,
        safeguarding_checked: true,
        dbs_verified: true,
        risk_assessed: true,
        pathway_plan_updated: true,
      }),
      makeRecord({
        child_consented: false,
        safeguarding_checked: false,
        dbs_verified: false,
        risk_assessed: false,
        pathway_plan_updated: false,
      }),
    ];
    const m = computeWorkExperienceMetrics(records);
    expect(m.child_consented_rate).toBe(50);
    expect(m.safeguarding_rate).toBe(50);
    expect(m.dbs_verified_rate).toBe(50);
    expect(m.risk_assessed_rate).toBe(50);
    expect(m.pathway_plan_rate).toBe(50);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ child_name: "Alice" }),
      makeRecord({ child_name: "Alice" }),
      makeRecord({ child_name: "Bob" }),
    ];
    const m = computeWorkExperienceMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("computes breakdown maps", () => {
    const records = [
      makeRecord({ placement_type: "apprenticeship", readiness_level: "work_ready", employer_feedback: "excellent", skill_acquisition: "significant_gain" }),
      makeRecord({ placement_type: "apprenticeship" }),
    ];
    const m = computeWorkExperienceMetrics(records);
    expect(m.by_placement_type["apprenticeship"]).toBe(2);
    expect(m.by_readiness_level["work_ready"]).toBe(1);
    expect(m.by_employer_feedback["excellent"]).toBe(1);
    expect(m.by_skill_acquisition["significant_gain"]).toBe(1);
  });
});

// ── identifyWorkExperienceAlerts ───────────────────────────────────────

describe("identifyWorkExperienceAlerts", () => {
  it("returns empty array for empty input", () => {
    expect(identifyWorkExperienceAlerts([])).toEqual([]);
  });

  it("fires critical alert for not suitable AND declining", () => {
    const records = [
      makeRecord({ employer_feedback: "not_suitable", skill_acquisition: "decline", child_name: "Alice" }),
    ];
    const alerts = identifyWorkExperienceAlerts(records);
    const match = alerts.find((a) => a.type === "not_suitable_declining");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("does NOT fire critical alert when only not_suitable (no decline)", () => {
    const records = [
      makeRecord({ employer_feedback: "not_suitable", skill_acquisition: "some_gain" }),
    ];
    const alerts = identifyWorkExperienceAlerts(records);
    expect(alerts.find((a) => a.type === "not_suitable_declining")).toBeUndefined();
  });

  it("fires high alert for no safeguarding check (>= 1)", () => {
    const records = [makeRecord({ safeguarding_checked: false })];
    const alerts = identifyWorkExperienceAlerts(records);
    const match = alerts.find((a) => a.type === "no_safeguarding_check");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for DBS not verified (>= 1)", () => {
    const records = [makeRecord({ dbs_verified: false })];
    const alerts = identifyWorkExperienceAlerts(records);
    const match = alerts.find((a) => a.type === "no_dbs_verified");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for no risk assessment (>= 2)", () => {
    const records = [
      makeRecord({ risk_assessed: false }),
      makeRecord({ risk_assessed: false }),
    ];
    const alerts = identifyWorkExperienceAlerts(records);
    const match = alerts.find((a) => a.type === "no_risk_assessment");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("does NOT fire no_risk_assessment for only 1 record", () => {
    const records = [makeRecord({ risk_assessed: false })];
    const alerts = identifyWorkExperienceAlerts(records);
    expect(alerts.find((a) => a.type === "no_risk_assessment")).toBeUndefined();
  });

  it("fires medium alert for pathway plan not updated (>= 2)", () => {
    const records = [
      makeRecord({ pathway_plan_updated: false }),
      makeRecord({ pathway_plan_updated: false }),
    ];
    const alerts = identifyWorkExperienceAlerts(records);
    const match = alerts.find((a) => a.type === "no_pathway_plan");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});
