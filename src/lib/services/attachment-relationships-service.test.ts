import { describe, it, expect } from "vitest";
import { computeAttachmentMetrics, identifyAttachmentAlerts } from "./attachment-relationships-service";
import type { AttachmentRecord } from "./attachment-relationships-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeRecord(overrides: Partial<AttachmentRecord> = {}): AttachmentRecord {
  return {
    id: "rec-1", home_id: "home-1", child_name: "Alex", child_id: "child-1",
    attachment_style: "secure", assessed_by: "Dr Smith",
    assessed_date: "2026-04-01", assessment_status: "current",
    next_review_date: "2026-10-01", relationship_type: "key_worker",
    relationship_person: "Sarah", relationship_quality: "positive",
    therapeutic_approach: "pace", approach_start_date: "2026-03-01",
    progress_notes: "Good progress", child_views: "Feels safe",
    staff_trained_attachment: true, psychologist_involved: true,
    key_triggers: ["loud noises"], calming_strategies: ["deep breathing"],
    notes: null, created_at: "2026-04-01T00:00:00Z", updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeAttachmentMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeAttachmentMetrics([], 4);
    expect(result.total_records).toBe(0);
    expect(result.children_assessed).toBe(0);
    expect(result.assessment_coverage).toBe(0);
    expect(result.secure_count).toBe(0);
    expect(result.therapeutic_approach_rate).toBeNull();;
  });

  it("counts attachment styles", () => {
    const records = [
      makeRecord({ id: "r1", attachment_style: "secure" }),
      makeRecord({ id: "r2", attachment_style: "anxious_ambivalent" }),
      makeRecord({ id: "r3", attachment_style: "anxious_avoidant" }),
      makeRecord({ id: "r4", attachment_style: "disorganised" }),
      makeRecord({ id: "r5", attachment_style: "not_yet_assessed" }),
    ];
    const result = computeAttachmentMetrics(records, 5);
    expect(result.secure_count).toBe(1);
    expect(result.anxious_ambivalent_count).toBe(1);
    expect(result.anxious_avoidant_count).toBe(1);
    expect(result.disorganised_count).toBe(1);
    expect(result.not_assessed_count).toBe(1);
  });

  it("computes assessment coverage", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1" }),
      makeRecord({ id: "r2", child_id: "c2" }),
    ];
    const result = computeAttachmentMetrics(records, 4);
    expect(result.children_assessed).toBe(2);
    expect(result.assessment_coverage).toBe(50);
  });

  it("counts current and outdated assessments", () => {
    const records = [
      makeRecord({ id: "r1", assessment_status: "current" }),
      makeRecord({ id: "r2", assessment_status: "outdated" }),
      makeRecord({ id: "r3", assessment_status: "outdated" }),
    ];
    const result = computeAttachmentMetrics(records, 4);
    expect(result.current_assessments).toBe(1);
    expect(result.outdated_assessments).toBe(2);
  });

  it("counts relationship quality", () => {
    const records = [
      makeRecord({ id: "r1", relationship_quality: "strong_positive" }),
      makeRecord({ id: "r2", relationship_quality: "strained" }),
      makeRecord({ id: "r3", relationship_quality: "broken" }),
    ];
    const result = computeAttachmentMetrics(records, 4);
    expect(result.strong_positive_relationships).toBe(1);
    expect(result.strained_or_broken_count).toBe(2);
  });

  it("computes rates: therapeutic, psychologist, staff trained, child views", () => {
    const records = [
      makeRecord({ id: "r1", therapeutic_approach: "pace", psychologist_involved: true, staff_trained_attachment: true, child_views: "Likes it" }),
      makeRecord({ id: "r2", therapeutic_approach: null, psychologist_involved: false, staff_trained_attachment: false, child_views: null }),
    ];
    const result = computeAttachmentMetrics(records, 4);
    expect(result.therapeutic_approach_rate).toBe(50);
    expect(result.psychologist_involved_rate).toBe(50);
    expect(result.staff_trained_rate).toBe(50);
    expect(result.child_views_rate).toBe(50);
  });

  it("groups by style, relationship type, quality, therapeutic approach", () => {
    const records = [
      makeRecord({ id: "r1", attachment_style: "secure", relationship_type: "key_worker", therapeutic_approach: "pace" }),
      makeRecord({ id: "r2", attachment_style: "disorganised", relationship_type: "therapist", therapeutic_approach: "emdr" }),
    ];
    const result = computeAttachmentMetrics(records, 4);
    expect(result.by_attachment_style["secure"]).toBe(1);
    expect(result.by_attachment_style["disorganised"]).toBe(1);
    expect(result.by_relationship_type["key_worker"]).toBe(1);
    expect(result.by_therapeutic_approach["pace"]).toBe(1);
    expect(result.by_therapeutic_approach["emdr"]).toBe(1);
  });
});

describe("identifyAttachmentAlerts", () => {
  it("returns empty array for empty data with zero children", () => {
    const result = identifyAttachmentAlerts([], 0, NOW);
    expect(result).toEqual([]);
  });

  it("flags children without assessment", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1" }),
    ];
    const result = identifyAttachmentAlerts(records, 4, NOW);
    const alerts = result.filter((a) => a.type === "no_assessment");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("high");
  });

  it("flags disorganised attachment without therapy as critical", () => {
    const records = [
      makeRecord({ id: "r1", attachment_style: "disorganised", therapeutic_approach: null }),
    ];
    const result = identifyAttachmentAlerts(records, 1, NOW);
    const alerts = result.filter((a) => a.type === "disorganised_no_therapy");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("critical");
  });

  it("flags strained/broken key worker relationship", () => {
    const records = [
      makeRecord({ id: "r1", relationship_type: "key_worker", relationship_quality: "strained" }),
    ];
    const result = identifyAttachmentAlerts(records, 1, NOW);
    const alerts = result.filter((a) => a.type === "key_worker_strained");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("high");
  });

  it("flags staff not trained for non-secure attachment", () => {
    const records = [
      makeRecord({ id: "r1", attachment_style: "anxious_avoidant", staff_trained_attachment: false }),
    ];
    const result = identifyAttachmentAlerts(records, 1, NOW);
    const alerts = result.filter((a) => a.type === "staff_not_trained");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("high");
  });

  it("flags review overdue", () => {
    const records = [
      makeRecord({ id: "r1", next_review_date: "2026-04-01" }), // past
    ];
    const result = identifyAttachmentAlerts(records, 1, NOW);
    const alerts = result.filter((a) => a.type === "review_overdue");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("medium");
  });

  it("does not flag secure attachment for staff training", () => {
    const records = [
      makeRecord({ id: "r1", attachment_style: "secure", staff_trained_attachment: false }),
    ];
    const result = identifyAttachmentAlerts(records, 1, NOW);
    const trainAlerts = result.filter((a) => a.type === "staff_not_trained");
    expect(trainAlerts.length).toBe(0);
  });
});
