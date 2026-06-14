import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateLetterboxContact,
  generateCaraInsights,
  type LetterboxContactRow,
} from "./letterbox-contact-service";

function makeRow(
  overrides: Partial<LetterboxContactRow> = {},
): LetterboxContactRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Child A",
    contact_person_name: "Parent A",
    relationship: "Birth Mother",
    contact_direction: "Contact to Child",
    scheduled_date: "2026-05-15",
    actual_date: "2026-05-15",
    contact_method: "Letter",
    content_screened: true,
    content_appropriate: true,
    content_concerns: null,
    child_supported_to_write: true,
    child_wishes_considered: true,
    emotional_impact_assessed: true,
    child_mood_after: "Happy",
    facilitator_name: "Staff A",
    social_worker_aware: true,
    therapeutic_input: false,
    letterbox_agreement_in_place: true,
    frequency_agreed: "Quarterly",
    next_scheduled_date: null,
    status: "Sent",
    notes: null,
    created_at: "2026-05-15T10:00:00Z",
    updated_at: "2026-05-15T10:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_contacts).toBe(0);
    expect(m.content_screening_rate).toBe(0);
    expect(m.completion_rate).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.unique_contacts).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const rows = [
      makeRow({ id: "1", status: "Sent", child_name: "Child A", contact_person_name: "Parent A" }),
      makeRow({ id: "2", status: "Received", child_name: "Child B", contact_person_name: "Parent B", content_screened: false }),
      makeRow({ id: "3", status: "Screened — Withheld", child_name: "Child A", contact_person_name: "Parent C" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_contacts).toBe(3);
    expect(m.unique_children).toBe(2);
    expect(m.unique_contacts).toBe(3);
    expect(m.withheld_count).toBe(1);
    // completion_rate: 2 completed (Sent+Received) out of 3
    expect(m.completion_rate).toBe(66.7);
    // content_screening_rate: 2 screened out of 3
    expect(m.content_screening_rate).toBe(66.7);
    expect(m.by_relationship["Birth Mother"]).toBe(3);
  });
});

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toHaveLength(0);
  });

  it("triggers unscreened_content_completed (critical) when Sent/Received but content_screened=false", () => {
    const rows = [
      makeRow({ id: "a1", status: "Sent", content_screened: false }),
    ];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "unscreened_content_completed");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("triggers inappropriate_not_withheld (critical) when content not appropriate but not withheld/returned/cancelled", () => {
    const rows = [
      makeRow({ id: "a2", content_appropriate: false, content_screened: true, status: "Sent" }),
    ];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "inappropriate_not_withheld");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("triggers wishes_not_considered (high) when child_wishes_considered=false and completed", () => {
    const rows = [
      makeRow({ id: "a3", child_wishes_considered: false, status: "Sent" }),
    ];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "wishes_not_considered");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers no_agreement (high) when no agreement for non-Ad Hoc non-cancelled", () => {
    const rows = [
      makeRow({ id: "a4", letterbox_agreement_in_place: false, frequency_agreed: "Quarterly", status: "Sent" }),
    ];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "no_agreement");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers repeated_negative_mood (high) when >= 2 negative moods without therapeutic input", () => {
    const rows = [
      makeRow({ id: "a5", child_mood_after: "Sad", therapeutic_input: false, child_name: "Child X", contact_person_name: "Parent X" }),
      makeRow({ id: "a6", child_mood_after: "Anxious", therapeutic_input: false, child_name: "Child X", contact_person_name: "Parent X" }),
    ];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "repeated_negative_mood");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers sw_not_aware (high) when social_worker_aware=false and completed", () => {
    const rows = [
      makeRow({ id: "a7", social_worker_aware: false, status: "Received" }),
    ];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "sw_not_aware");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers no_emotional_assessment (medium) when emotional_impact_assessed=false and completed", () => {
    const rows = [
      makeRow({ id: "a8", emotional_impact_assessed: false, status: "Sent" }),
    ];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "no_emotional_assessment");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("triggers child_not_supported (medium) when outgoing contact but child not supported", () => {
    const rows = [
      makeRow({ id: "a9", contact_direction: "Child to Contact", child_supported_to_write: false, status: "Sent" }),
    ];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "child_not_supported");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });
});

describe("validateLetterboxContact", () => {
  it("returns valid for a well-formed input", () => {
    const result = validateLetterboxContact({
      childName: "Child A",
      contactPersonName: "Parent A",
      relationship: "Birth Mother",
      contactDirection: "Contact to Child",
      scheduledDate: "2026-05-15",
      contactMethod: "Letter",
      facilitatorName: "Staff A",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns errors for missing required fields", () => {
    const result = validateLetterboxContact({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it("returns error when content must be screened for Sent status", () => {
    const result = validateLetterboxContact({
      childName: "Child A",
      contactPersonName: "Parent A",
      relationship: "Birth Mother",
      contactDirection: "Contact to Child",
      scheduledDate: "2026-05-15",
      contactMethod: "Letter",
      facilitatorName: "Staff A",
      status: "Sent",
      contentScreened: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Content must be screened"))).toBe(true);
  });
});

describe("generateCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const rows = [
      makeRow({ id: "1" }),
      makeRow({ id: "2", child_name: "Child B" }),
    ];
    const insights = generateCaraInsights(rows);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[sky]");
  });
});
