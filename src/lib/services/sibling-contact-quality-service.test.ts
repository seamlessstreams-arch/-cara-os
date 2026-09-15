import { describe, it, expect } from "vitest";
import {
  computeSiblingContactMetrics,
  identifySiblingContactAlerts,
  type SiblingContactQualityRecord,
} from "./sibling-contact-quality-service";

function makeRecord(
  overrides: Partial<SiblingContactQualityRecord> = {},
): SiblingContactQualityRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    contact_type: "face_to_face",
    contact_quality: "good",
    sibling_relationship: "close",
    barrier_type: "none",
    contact_date: "2025-06-01",
    child_name: "Child A",
    child_id: null,
    sibling_name: "Sibling B",
    facilitated_by: "Staff",
    child_views_sought: true,
    sibling_views_sought: true,
    preparation_completed: true,
    debrief_completed: true,
    emotional_support_given: true,
    social_worker_informed: true,
    care_plan_reflects: true,
    frequency_appropriate: true,
    venue_suitable: true,
    safeguarding_considered: true,
    life_story_linked: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}

// ── Metrics ──────────────────────────────────────────────────────────────

describe("computeSiblingContactMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeSiblingContactMetrics([]);
    expect(m.total_contacts).toBe(0);
    expect(m.poor_quality_count).toBe(0);
    expect(m.harmful_count).toBe(0);
    expect(m.estranged_count).toBe(0);
    expect(m.barrier_count).toBe(0);
    expect(m.child_views_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts quality categories correctly", () => {
    const records = [
      makeRecord({ contact_quality: "poor" }),
      makeRecord({ contact_quality: "harmful" }),
      makeRecord({ contact_quality: "harmful" }),
      makeRecord({ contact_quality: "good" }),
    ];
    const m = computeSiblingContactMetrics(records);
    expect(m.total_contacts).toBe(4);
    expect(m.poor_quality_count).toBe(1);
    expect(m.harmful_count).toBe(2);
  });

  it("counts estranged and barriers", () => {
    const records = [
      makeRecord({ sibling_relationship: "estranged", barrier_type: "court_restriction" }),
      makeRecord({ barrier_type: "geographical_distance" }),
      makeRecord({ barrier_type: "none" }),
    ];
    const m = computeSiblingContactMetrics(records);
    expect(m.estranged_count).toBe(1);
    expect(m.barrier_count).toBe(2); // court_restriction + geographical_distance
  });

  it("computes boolean rates", () => {
    const records = [
      makeRecord({ child_views_sought: true, debrief_completed: false }),
      makeRecord({ child_views_sought: false, debrief_completed: false }),
    ];
    const m = computeSiblingContactMetrics(records);
    expect(m.child_views_rate).toBe(50);
    expect(m.debrief_rate).toBe(0);
  });

  it("counts unique children by child_name", () => {
    const records = [
      makeRecord({ child_name: "Alice" }),
      makeRecord({ child_name: "Alice" }),
      makeRecord({ child_name: "Bob" }),
    ];
    const m = computeSiblingContactMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("populates breakdown records", () => {
    const records = [
      makeRecord({ contact_type: "video_call" }),
      makeRecord({ contact_type: "video_call" }),
      makeRecord({ contact_type: "phone_call" }),
    ];
    const m = computeSiblingContactMetrics(records);
    expect(m.by_contact_type["video_call"]).toBe(2);
    expect(m.by_contact_type["phone_call"]).toBe(1);
  });
});

// ── Alerts ───────────────────────────────────────────────────────────────

describe("identifySiblingContactAlerts", () => {
  it("returns no alerts for empty array", () => {
    expect(identifySiblingContactAlerts([])).toEqual([]);
  });

  it("returns no alerts when all fields are compliant", () => {
    expect(identifySiblingContactAlerts([makeRecord()])).toEqual([]);
  });

  it("fires critical for harmful + estranged", () => {
    const rec = makeRecord({
      contact_quality: "harmful",
      sibling_relationship: "estranged",
    });
    const alerts = identifySiblingContactAlerts([rec]);
    expect(alerts.some((a) => a.type === "harmful_estranged" && a.severity === "critical")).toBe(true);
  });

  it("fires high alert for debrief not completed (>= 1)", () => {
    const alerts = identifySiblingContactAlerts([
      makeRecord({ debrief_completed: false }),
    ]);
    expect(alerts.some((a) => a.type === "debrief_not_completed" && a.severity === "high")).toBe(true);
  });

  it("fires high alert for preparation not completed (>= 1)", () => {
    const alerts = identifySiblingContactAlerts([
      makeRecord({ preparation_completed: false }),
    ]);
    expect(alerts.some((a) => a.type === "preparation_not_completed" && a.severity === "high")).toBe(true);
  });

  it("fires medium alert for no emotional support when count >= 2", () => {
    const records = [
      makeRecord({ id: "r1", emotional_support_given: false }),
      makeRecord({ id: "r2", emotional_support_given: false }),
    ];
    const alerts = identifySiblingContactAlerts(records);
    expect(alerts.some((a) => a.type === "no_emotional_support" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire no_emotional_support when count is 1", () => {
    const alerts = identifySiblingContactAlerts([
      makeRecord({ emotional_support_given: false }),
    ]);
    expect(alerts.some((a) => a.type === "no_emotional_support")).toBe(false);
  });

  it("fires medium alert for life story not linked when count >= 2", () => {
    const records = [
      makeRecord({ id: "r1", life_story_linked: false }),
      makeRecord({ id: "r2", life_story_linked: false }),
    ];
    const alerts = identifySiblingContactAlerts(records);
    expect(alerts.some((a) => a.type === "life_story_not_linked")).toBe(true);
  });
});
