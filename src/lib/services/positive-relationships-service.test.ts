import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validatePositiveRelationships,
} from "./positive-relationships-service";
import type { PositiveRelationshipsRow } from "./positive-relationships-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<PositiveRelationshipsRow> = {}): PositiveRelationshipsRow {
  return {
    id: "pr-1",
    home_id: "home-1",
    child_name: "Alex",
    session_date: "2026-05-01",
    facilitator_name: "Staff A",
    session_type: "Social Skills Group",
    delivery_method: "1-to-1 Session",
    attachment_style_considered: true,
    trauma_informed_approach: true,
    key_worker_involved: true,
    therapeutic_input: false,
    child_engaged: true,
    skill_demonstrated: true,
    generalised_to_other_settings: true,
    positive_peer_interaction_observed: true,
    staff_relationship_improved: true,
    confidence_improved: true,
    child_feedback: "It was good",
    care_plan_linked: true,
    social_worker_informed: true,
    next_session_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.engagement_rate).toBeNull();;
    expect(m.skill_demonstration_rate).toBeNull();;
    expect(m.generalisation_rate).toBeNull();;
    expect(m.average_sessions_per_child).toBeNull();;
    expect(m.emotional_session_count).toBe(0);
    expect(m.interpersonal_session_count).toBe(0);
    expect(m.group_dynamic_session_count).toBe(0);
    expect(m.safety_session_count).toBe(0);
  });

  it("counts unique children case-insensitively", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex" }),
      makeRow({ id: "2", child_name: "alex" }),
      makeRow({ id: "3", child_name: "Beth" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_children).toBe(2);
  });

  it("computes boolean rates correctly for 50% scenario", () => {
    const rows = [
      makeRow({ id: "1", child_engaged: true, skill_demonstrated: true }),
      makeRow({ id: "2", child_engaged: false, skill_demonstrated: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.engagement_rate).toBe(50);
    expect(m.skill_demonstration_rate).toBe(50);
  });

  it("counts emotional, interpersonal, group dynamic, and safety sessions", () => {
    const rows = [
      makeRow({ id: "1", session_type: "Emotional Regulation" }),
      makeRow({ id: "2", session_type: "Communication Skills" }),
      makeRow({ id: "3", session_type: "Team Building" }),
      makeRow({ id: "4", session_type: "Anti-Bullying" }),
    ];
    const m = computeMetrics(rows);
    expect(m.emotional_session_count).toBe(1);
    expect(m.interpersonal_session_count).toBe(1);
    expect(m.group_dynamic_session_count).toBe(2); // Team Building + Anti-Bullying
    expect(m.safety_session_count).toBe(1); // Anti-Bullying
  });

  it("computes average sessions per child", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex" }),
      makeRow({ id: "2", child_name: "Alex" }),
      makeRow({ id: "3", child_name: "Beth" }),
      makeRow({ id: "4", child_name: "Beth" }),
    ];
    const m = computeMetrics(rows);
    expect(m.average_sessions_per_child).toBe(2);
  });

  it("populates session type and delivery method breakdowns", () => {
    const rows = [
      makeRow({ id: "1", session_type: "Trust Building", delivery_method: "Small Group" }),
      makeRow({ id: "2", session_type: "Trust Building", delivery_method: "1-to-1 Session" }),
    ];
    const m = computeMetrics(rows);
    expect(m.by_session_type["Trust Building"]).toBe(2);
    expect(m.by_delivery_method["Small Group"]).toBe(1);
    expect(m.by_delivery_method["1-to-1 Session"]).toBe(1);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts", () => {
  it("returns empty alerts for empty rows", () => {
    expect(computeAlerts([])).toHaveLength(0);
  });

  it("returns empty alerts for fully compliant rows", () => {
    expect(computeAlerts([makeRow()])).toHaveLength(0);
  });

  it("fires critical alert for emotional session without attachment or trauma approach", () => {
    const rows = [
      makeRow({
        session_type: "Emotional Regulation",
        attachment_style_considered: false,
        trauma_informed_approach: false,
      }),
    ];
    const alerts = computeAlerts(rows);
    const critical = alerts.filter((a) => a.type === "emotional_no_attachment_or_trauma");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("fires critical alert for repeated non-engagement (4+ sessions same child)", () => {
    const rows = Array.from({ length: 4 }, (_, i) =>
      makeRow({ id: `r-${i}`, child_name: "Alex", child_engaged: false }),
    );
    const alerts = computeAlerts(rows);
    const repeated = alerts.filter((a) => a.type === "repeated_non_engagement");
    expect(repeated).toHaveLength(1);
    expect(repeated[0].severity).toBe("critical");
  });

  it("does NOT fire repeated non-engagement for only 3 non-engaged sessions", () => {
    const rows = Array.from({ length: 3 }, (_, i) =>
      makeRow({ id: `r-${i}`, child_name: "Alex", child_engaged: false }),
    );
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "repeated_non_engagement")).toHaveLength(0);
  });

  it("fires high alert for low trauma-informed rate (< 30% with >= 5 rows)", () => {
    // 1/5 = 20% trauma-informed
    const rows = [
      makeRow({ id: "1", trauma_informed_approach: true }),
      ...Array.from({ length: 4 }, (_, i) =>
        makeRow({ id: `f-${i}`, trauma_informed_approach: false }),
      ),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "low_trauma_informed_rate")).toHaveLength(1);
  });

  it("fires high alert for non-engagement in group session", () => {
    const rows = [
      makeRow({ delivery_method: "Small Group", child_engaged: false }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "non_engagement_group")).toHaveLength(1);
  });

  it("fires high alert for trust/boundary session without key worker", () => {
    const rows = [
      makeRow({ session_type: "Trust Building", key_worker_involved: false }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "no_key_worker_trust_sessions")).toHaveLength(1);
  });
});

// -- validatePositiveRelationships --------------------------------------------

describe("validatePositiveRelationships", () => {
  it("returns valid for correct input", () => {
    const result = validatePositiveRelationships({
      childName: "Alex",
      sessionDate: "2025-05-01",
      facilitatorName: "Staff A",
      sessionType: "Social Skills Group",
      deliveryMethod: "1-to-1 Session",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing child name", () => {
    const result = validatePositiveRelationships({
      childName: "",
      sessionDate: "2025-05-01",
      facilitatorName: "Staff A",
      sessionType: "Social Skills Group",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Child name is required");
  });

  it("rejects future session date", () => {
    const result = validatePositiveRelationships({
      childName: "Alex",
      sessionDate: "2099-01-01",
      facilitatorName: "Staff A",
      sessionType: "Social Skills Group",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("future"))).toBe(true);
  });

  it("rejects invalid session type", () => {
    const result = validatePositiveRelationships({
      childName: "Alex",
      sessionDate: "2025-05-01",
      facilitatorName: "Staff A",
      sessionType: "Invalid Type",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Session type"))).toBe(true);
  });

  it("rejects emotional session without both attachment and trauma consideration", () => {
    const result = validatePositiveRelationships({
      childName: "Alex",
      sessionDate: "2025-05-01",
      facilitatorName: "Staff A",
      sessionType: "Emotional Regulation",
      attachmentStyleConsidered: false,
      traumaInformedApproach: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("attachment style"))).toBe(true);
  });
});
