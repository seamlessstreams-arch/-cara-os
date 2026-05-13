// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DUTY OF CANDOUR SERVICE TESTS
// Pure-function tests for candour metrics, alert identification, constant
// validation, and CRUD fallback behaviour when Supabase is disabled.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import { _testing } from "../duty-of-candour-service";
import {
  CANDOUR_TRIGGERS,
  CANDOUR_STATUSES,
  INVESTIGATION_OUTCOMES,
} from "../duty-of-candour-service";
import type {
  CandourRecord,
  CandourTrigger,
  CandourStatus,
  InvestigationOutcome,
} from "../duty-of-candour-service";

const { computeCandourMetrics, identifyCandourAlerts } = _testing;

// ── Fixed "now" for deterministic tests ──────────────────────────────────

const NOW = new Date("2026-05-13");

// ── Factory helper ───────────────────────────────────────────────────────

function makeCandourRecord(overrides: Partial<CandourRecord> = {}): CandourRecord {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    home_id: overrides.home_id ?? "home-1",
    child_name: overrides.child_name ?? "Test Child",
    child_id: overrides.child_id ?? "child-1",
    trigger: overrides.trigger ?? "serious_injury",
    incident_date: overrides.incident_date ?? "2026-05-01",
    identified_date: overrides.identified_date ?? "2026-05-01",
    status: overrides.status ?? "identified",
    description: overrides.description ?? "Test incident description",
    verbal_apology_date: overrides.verbal_apology_date ?? null,
    written_apology_date: overrides.written_apology_date ?? null,
    family_informed: overrides.family_informed ?? false,
    social_worker_informed: overrides.social_worker_informed ?? false,
    ofsted_notified: overrides.ofsted_notified ?? false,
    ofsted_notification_date: overrides.ofsted_notification_date ?? null,
    investigation_lead: overrides.investigation_lead ?? null,
    investigation_outcome: overrides.investigation_outcome ?? null,
    investigation_completed_date: overrides.investigation_completed_date ?? null,
    lessons_learned: overrides.lessons_learned ?? [],
    actions_taken: overrides.actions_taken ?? [],
    final_response_date: overrides.final_response_date ?? null,
    created_at: overrides.created_at ?? "2026-05-01T10:00:00Z",
    updated_at: overrides.updated_at ?? "2026-05-01T10:00:00Z",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("CANDOUR_TRIGGERS", () => {
  it("has exactly 11 entries", () => {
    expect(CANDOUR_TRIGGERS).toHaveLength(11);
  });

  it("contains unique trigger values", () => {
    const triggers = CANDOUR_TRIGGERS.map((t) => t.trigger);
    expect(new Set(triggers).size).toBe(triggers.length);
  });

  it("each entry has trigger and label properties", () => {
    for (const entry of CANDOUR_TRIGGERS) {
      expect(typeof entry.trigger).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("all labels are non-empty strings", () => {
    for (const entry of CANDOUR_TRIGGERS) {
      expect(entry.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("contains all expected trigger values", () => {
    const triggers = CANDOUR_TRIGGERS.map((t) => t.trigger);
    expect(triggers).toContain("serious_injury");
    expect(triggers).toContain("safeguarding_incident");
    expect(triggers).toContain("medication_error");
    expect(triggers).toContain("restraint_injury");
    expect(triggers).toContain("missing_child");
    expect(triggers).toContain("police_involvement");
    expect(triggers).toContain("hospitalisation");
    expect(triggers).toContain("death");
    expect(triggers).toContain("abuse_allegation");
    expect(triggers).toContain("near_miss_serious");
    expect(triggers).toContain("other");
  });

  it("maps serious_injury to Serious Injury", () => {
    const found = CANDOUR_TRIGGERS.find((t) => t.trigger === "serious_injury");
    expect(found?.label).toBe("Serious Injury");
  });

  it("maps death to Death", () => {
    const found = CANDOUR_TRIGGERS.find((t) => t.trigger === "death");
    expect(found?.label).toBe("Death");
  });

  it("maps near_miss_serious to Serious Near Miss", () => {
    const found = CANDOUR_TRIGGERS.find((t) => t.trigger === "near_miss_serious");
    expect(found?.label).toBe("Serious Near Miss");
  });

  it("maps hospitalisation to Hospitalisation", () => {
    const found = CANDOUR_TRIGGERS.find((t) => t.trigger === "hospitalisation");
    expect(found?.label).toBe("Hospitalisation");
  });

  it("maps abuse_allegation to Abuse Allegation", () => {
    const found = CANDOUR_TRIGGERS.find((t) => t.trigger === "abuse_allegation");
    expect(found?.label).toBe("Abuse Allegation");
  });
});

describe("CANDOUR_STATUSES", () => {
  it("has exactly 8 entries", () => {
    expect(CANDOUR_STATUSES).toHaveLength(8);
  });

  it("contains unique status values", () => {
    const statuses = CANDOUR_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("each entry has status and label properties", () => {
    for (const entry of CANDOUR_STATUSES) {
      expect(typeof entry.status).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("all labels are non-empty strings", () => {
    for (const entry of CANDOUR_STATUSES) {
      expect(entry.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("contains identified", () => {
    const statuses = CANDOUR_STATUSES.map((s) => s.status);
    expect(statuses).toContain("identified");
  });

  it("contains initial_notification", () => {
    const statuses = CANDOUR_STATUSES.map((s) => s.status);
    expect(statuses).toContain("initial_notification");
  });

  it("contains verbal_apology_given", () => {
    const statuses = CANDOUR_STATUSES.map((s) => s.status);
    expect(statuses).toContain("verbal_apology_given");
  });

  it("contains written_apology_sent", () => {
    const statuses = CANDOUR_STATUSES.map((s) => s.status);
    expect(statuses).toContain("written_apology_sent");
  });

  it("contains investigation_underway", () => {
    const statuses = CANDOUR_STATUSES.map((s) => s.status);
    expect(statuses).toContain("investigation_underway");
  });

  it("contains investigation_complete", () => {
    const statuses = CANDOUR_STATUSES.map((s) => s.status);
    expect(statuses).toContain("investigation_complete");
  });

  it("contains final_response_sent", () => {
    const statuses = CANDOUR_STATUSES.map((s) => s.status);
    expect(statuses).toContain("final_response_sent");
  });

  it("contains closed", () => {
    const statuses = CANDOUR_STATUSES.map((s) => s.status);
    expect(statuses).toContain("closed");
  });

  it("maps identified to Identified", () => {
    const found = CANDOUR_STATUSES.find((s) => s.status === "identified");
    expect(found?.label).toBe("Identified");
  });

  it("maps investigation_underway to Investigation Underway", () => {
    const found = CANDOUR_STATUSES.find((s) => s.status === "investigation_underway");
    expect(found?.label).toBe("Investigation Underway");
  });

  it("maps closed to Closed", () => {
    const found = CANDOUR_STATUSES.find((s) => s.status === "closed");
    expect(found?.label).toBe("Closed");
  });

  it("maps final_response_sent to Final Response Sent", () => {
    const found = CANDOUR_STATUSES.find((s) => s.status === "final_response_sent");
    expect(found?.label).toBe("Final Response Sent");
  });
});

describe("INVESTIGATION_OUTCOMES", () => {
  it("has exactly 5 entries", () => {
    expect(INVESTIGATION_OUTCOMES).toHaveLength(5);
  });

  it("contains unique outcome values", () => {
    const outcomes = INVESTIGATION_OUTCOMES.map((o) => o.outcome);
    expect(new Set(outcomes).size).toBe(outcomes.length);
  });

  it("each entry has outcome and label properties", () => {
    for (const entry of INVESTIGATION_OUTCOMES) {
      expect(typeof entry.outcome).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("all labels are non-empty strings", () => {
    for (const entry of INVESTIGATION_OUTCOMES) {
      expect(entry.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("contains upheld", () => {
    const outcomes = INVESTIGATION_OUTCOMES.map((o) => o.outcome);
    expect(outcomes).toContain("upheld");
  });

  it("contains partially_upheld", () => {
    const outcomes = INVESTIGATION_OUTCOMES.map((o) => o.outcome);
    expect(outcomes).toContain("partially_upheld");
  });

  it("contains not_upheld", () => {
    const outcomes = INVESTIGATION_OUTCOMES.map((o) => o.outcome);
    expect(outcomes).toContain("not_upheld");
  });

  it("contains inconclusive", () => {
    const outcomes = INVESTIGATION_OUTCOMES.map((o) => o.outcome);
    expect(outcomes).toContain("inconclusive");
  });

  it("contains ongoing", () => {
    const outcomes = INVESTIGATION_OUTCOMES.map((o) => o.outcome);
    expect(outcomes).toContain("ongoing");
  });

  it("maps upheld to Upheld", () => {
    const found = INVESTIGATION_OUTCOMES.find((o) => o.outcome === "upheld");
    expect(found?.label).toBe("Upheld");
  });

  it("maps partially_upheld to Partially Upheld", () => {
    const found = INVESTIGATION_OUTCOMES.find((o) => o.outcome === "partially_upheld");
    expect(found?.label).toBe("Partially Upheld");
  });

  it("maps not_upheld to Not Upheld", () => {
    const found = INVESTIGATION_OUTCOMES.find((o) => o.outcome === "not_upheld");
    expect(found?.label).toBe("Not Upheld");
  });

  it("maps inconclusive to Inconclusive", () => {
    const found = INVESTIGATION_OUTCOMES.find((o) => o.outcome === "inconclusive");
    expect(found?.label).toBe("Inconclusive");
  });

  it("maps ongoing to Ongoing", () => {
    const found = INVESTIGATION_OUTCOMES.find((o) => o.outcome === "ongoing");
    expect(found?.label).toBe("Ongoing");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeCandourMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeCandourMetrics", () => {
  describe("empty inputs", () => {
    it("returns zeroed metrics for empty array", () => {
      const result = computeCandourMetrics([], NOW);
      expect(result.total_records).toBe(0);
      expect(result.open_cases).toBe(0);
      expect(result.closed_cases).toBe(0);
      expect(result.verbal_apology_given).toBe(0);
      expect(result.written_apology_sent).toBe(0);
      expect(result.family_informed_rate).toBe(0);
      expect(result.ofsted_notified_rate).toBe(0);
      expect(result.investigation_complete).toBe(0);
      expect(result.investigation_upheld).toBe(0);
      expect(result.avg_days_to_verbal).toBe(0);
      expect(result.avg_days_to_written).toBe(0);
      expect(result.lessons_captured).toBe(0);
    });

    it("returns empty by_trigger for empty array", () => {
      const result = computeCandourMetrics([], NOW);
      expect(result.by_trigger).toEqual({});
    });

    it("returns empty by_status for empty array", () => {
      const result = computeCandourMetrics([], NOW);
      expect(result.by_status).toEqual({});
    });

    it("returns empty by_outcome for empty array", () => {
      const result = computeCandourMetrics([], NOW);
      expect(result.by_outcome).toEqual({});
    });
  });

  describe("total_records", () => {
    it("counts a single record", () => {
      const result = computeCandourMetrics([makeCandourRecord()], NOW);
      expect(result.total_records).toBe(1);
    });

    it("counts multiple records", () => {
      const records = [makeCandourRecord(), makeCandourRecord(), makeCandourRecord()];
      const result = computeCandourMetrics(records, NOW);
      expect(result.total_records).toBe(3);
    });
  });

  describe("open_cases", () => {
    it("counts identified as open", () => {
      const result = computeCandourMetrics(
        [makeCandourRecord({ status: "identified" })],
        NOW,
      );
      expect(result.open_cases).toBe(1);
    });

    it("counts investigation_underway as open", () => {
      const result = computeCandourMetrics(
        [makeCandourRecord({ status: "investigation_underway" })],
        NOW,
      );
      expect(result.open_cases).toBe(1);
    });

    it("counts verbal_apology_given as open", () => {
      const result = computeCandourMetrics(
        [makeCandourRecord({ status: "verbal_apology_given" })],
        NOW,
      );
      expect(result.open_cases).toBe(1);
    });

    it("does not count final_response_sent as open", () => {
      const result = computeCandourMetrics(
        [makeCandourRecord({ status: "final_response_sent" })],
        NOW,
      );
      expect(result.open_cases).toBe(0);
    });

    it("does not count closed as open", () => {
      const result = computeCandourMetrics(
        [makeCandourRecord({ status: "closed" })],
        NOW,
      );
      expect(result.open_cases).toBe(0);
    });

    it("counts mixed statuses correctly", () => {
      const records = [
        makeCandourRecord({ status: "identified" }),
        makeCandourRecord({ status: "closed" }),
        makeCandourRecord({ status: "investigation_underway" }),
        makeCandourRecord({ status: "final_response_sent" }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.open_cases).toBe(2);
    });
  });

  describe("closed_cases", () => {
    it("counts final_response_sent as closed", () => {
      const result = computeCandourMetrics(
        [makeCandourRecord({ status: "final_response_sent" })],
        NOW,
      );
      expect(result.closed_cases).toBe(1);
    });

    it("counts closed as closed", () => {
      const result = computeCandourMetrics(
        [makeCandourRecord({ status: "closed" })],
        NOW,
      );
      expect(result.closed_cases).toBe(1);
    });

    it("does not count identified as closed", () => {
      const result = computeCandourMetrics(
        [makeCandourRecord({ status: "identified" })],
        NOW,
      );
      expect(result.closed_cases).toBe(0);
    });

    it("open + closed equals total for valid statuses", () => {
      const records = [
        makeCandourRecord({ status: "identified" }),
        makeCandourRecord({ status: "closed" }),
        makeCandourRecord({ status: "final_response_sent" }),
        makeCandourRecord({ status: "investigation_underway" }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.open_cases + result.closed_cases).toBe(result.total_records);
    });
  });

  describe("verbal_apology_given", () => {
    it("counts records with non-null verbal_apology_date", () => {
      const records = [
        makeCandourRecord({ verbal_apology_date: "2026-05-03" }),
        makeCandourRecord({ verbal_apology_date: null }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.verbal_apology_given).toBe(1);
    });

    it("returns 0 when all verbal_apology_date are null", () => {
      const records = [
        makeCandourRecord({ verbal_apology_date: null }),
        makeCandourRecord({ verbal_apology_date: null }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.verbal_apology_given).toBe(0);
    });

    it("counts all when all have verbal apology dates", () => {
      const records = [
        makeCandourRecord({ verbal_apology_date: "2026-05-02" }),
        makeCandourRecord({ verbal_apology_date: "2026-05-03" }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.verbal_apology_given).toBe(2);
    });
  });

  describe("written_apology_sent", () => {
    it("counts records with non-null written_apology_date", () => {
      const records = [
        makeCandourRecord({ written_apology_date: "2026-05-05" }),
        makeCandourRecord({ written_apology_date: null }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.written_apology_sent).toBe(1);
    });

    it("returns 0 when none have written apology date", () => {
      const result = computeCandourMetrics(
        [makeCandourRecord({ written_apology_date: null })],
        NOW,
      );
      expect(result.written_apology_sent).toBe(0);
    });
  });

  describe("family_informed_rate", () => {
    it("returns 100 when all families are informed", () => {
      const records = [
        makeCandourRecord({ family_informed: true }),
        makeCandourRecord({ family_informed: true }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.family_informed_rate).toBe(100);
    });

    it("returns 0 when no families are informed", () => {
      const records = [
        makeCandourRecord({ family_informed: false }),
        makeCandourRecord({ family_informed: false }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.family_informed_rate).toBe(0);
    });

    it("computes rate with one decimal place", () => {
      const records = [
        makeCandourRecord({ family_informed: true }),
        makeCandourRecord({ family_informed: false }),
        makeCandourRecord({ family_informed: false }),
      ];
      const result = computeCandourMetrics(records, NOW);
      // 1/3 * 100 = 33.333... rounded to one decimal = 33.3
      expect(result.family_informed_rate).toBe(33.3);
    });

    it("returns 50 for half informed", () => {
      const records = [
        makeCandourRecord({ family_informed: true }),
        makeCandourRecord({ family_informed: false }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.family_informed_rate).toBe(50);
    });
  });

  describe("ofsted_notified_rate", () => {
    it("returns 100 when all are notified", () => {
      const records = [
        makeCandourRecord({ ofsted_notified: true }),
        makeCandourRecord({ ofsted_notified: true }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.ofsted_notified_rate).toBe(100);
    });

    it("returns 0 when none are notified", () => {
      const records = [
        makeCandourRecord({ ofsted_notified: false }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.ofsted_notified_rate).toBe(0);
    });

    it("computes rate with one decimal place", () => {
      const records = [
        makeCandourRecord({ ofsted_notified: true }),
        makeCandourRecord({ ofsted_notified: false }),
        makeCandourRecord({ ofsted_notified: false }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.ofsted_notified_rate).toBe(33.3);
    });
  });

  describe("investigation_complete", () => {
    it("counts records with non-null investigation_completed_date", () => {
      const records = [
        makeCandourRecord({ investigation_completed_date: "2026-05-10" }),
        makeCandourRecord({ investigation_completed_date: null }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.investigation_complete).toBe(1);
    });

    it("returns 0 when no investigations are completed", () => {
      const records = [
        makeCandourRecord({ investigation_completed_date: null }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.investigation_complete).toBe(0);
    });
  });

  describe("investigation_upheld", () => {
    it("counts records with outcome upheld", () => {
      const records = [
        makeCandourRecord({ investigation_outcome: "upheld" }),
        makeCandourRecord({ investigation_outcome: "not_upheld" }),
        makeCandourRecord({ investigation_outcome: "upheld" }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.investigation_upheld).toBe(2);
    });

    it("returns 0 when no outcome is upheld", () => {
      const records = [
        makeCandourRecord({ investigation_outcome: "not_upheld" }),
        makeCandourRecord({ investigation_outcome: null }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.investigation_upheld).toBe(0);
    });

    it("does not count partially_upheld as upheld", () => {
      const records = [
        makeCandourRecord({ investigation_outcome: "partially_upheld" }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.investigation_upheld).toBe(0);
    });
  });

  describe("avg_days_to_verbal", () => {
    it("computes average days from incident to verbal apology", () => {
      const records = [
        makeCandourRecord({
          incident_date: "2026-05-01",
          verbal_apology_date: "2026-05-04",
        }),
      ];
      const result = computeCandourMetrics(records, NOW);
      // 3 days
      expect(result.avg_days_to_verbal).toBe(3);
    });

    it("averages across multiple records", () => {
      const records = [
        makeCandourRecord({
          incident_date: "2026-05-01",
          verbal_apology_date: "2026-05-03",
        }),
        makeCandourRecord({
          incident_date: "2026-05-01",
          verbal_apology_date: "2026-05-06",
        }),
      ];
      const result = computeCandourMetrics(records, NOW);
      // (2 + 5) / 2 = 3.5
      expect(result.avg_days_to_verbal).toBe(3.5);
    });

    it("returns 0 when no records have verbal apology dates", () => {
      const records = [
        makeCandourRecord({ verbal_apology_date: null }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.avg_days_to_verbal).toBe(0);
    });

    it("rounds to one decimal place", () => {
      const records = [
        makeCandourRecord({
          incident_date: "2026-05-01",
          verbal_apology_date: "2026-05-02",
        }),
        makeCandourRecord({
          incident_date: "2026-05-01",
          verbal_apology_date: "2026-05-03",
        }),
        makeCandourRecord({
          incident_date: "2026-05-01",
          verbal_apology_date: "2026-05-04",
        }),
      ];
      const result = computeCandourMetrics(records, NOW);
      // (1 + 2 + 3) / 3 = 2.0
      expect(result.avg_days_to_verbal).toBe(2);
    });

    it("clamps negative day differences to zero", () => {
      // verbal_apology_date before incident_date should not produce negative
      const records = [
        makeCandourRecord({
          incident_date: "2026-05-10",
          verbal_apology_date: "2026-05-05",
        }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.avg_days_to_verbal).toBe(0);
    });

    it("excludes records without verbal apology date from average", () => {
      const records = [
        makeCandourRecord({
          incident_date: "2026-05-01",
          verbal_apology_date: "2026-05-05",
        }),
        makeCandourRecord({ verbal_apology_date: null }),
      ];
      const result = computeCandourMetrics(records, NOW);
      // Only first record counts: 4 days
      expect(result.avg_days_to_verbal).toBe(4);
    });
  });

  describe("avg_days_to_written", () => {
    it("computes average days from incident to written apology", () => {
      const records = [
        makeCandourRecord({
          incident_date: "2026-05-01",
          written_apology_date: "2026-05-08",
        }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.avg_days_to_written).toBe(7);
    });

    it("averages across multiple records", () => {
      const records = [
        makeCandourRecord({
          incident_date: "2026-05-01",
          written_apology_date: "2026-05-11",
        }),
        makeCandourRecord({
          incident_date: "2026-05-01",
          written_apology_date: "2026-05-06",
        }),
      ];
      const result = computeCandourMetrics(records, NOW);
      // (10 + 5) / 2 = 7.5
      expect(result.avg_days_to_written).toBe(7.5);
    });

    it("returns 0 when no records have written apology dates", () => {
      const records = [makeCandourRecord({ written_apology_date: null })];
      const result = computeCandourMetrics(records, NOW);
      expect(result.avg_days_to_written).toBe(0);
    });

    it("clamps negative day differences to zero", () => {
      const records = [
        makeCandourRecord({
          incident_date: "2026-05-10",
          written_apology_date: "2026-05-05",
        }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.avg_days_to_written).toBe(0);
    });
  });

  describe("lessons_captured", () => {
    it("counts records with non-empty lessons_learned arrays", () => {
      const records = [
        makeCandourRecord({ lessons_learned: ["Improve training"] }),
        makeCandourRecord({ lessons_learned: [] }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.lessons_captured).toBe(1);
    });

    it("returns 0 when all lessons_learned are empty", () => {
      const records = [
        makeCandourRecord({ lessons_learned: [] }),
        makeCandourRecord({ lessons_learned: [] }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.lessons_captured).toBe(0);
    });

    it("counts records with multiple lessons", () => {
      const records = [
        makeCandourRecord({ lessons_learned: ["Lesson 1", "Lesson 2"] }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.lessons_captured).toBe(1);
    });
  });

  describe("by_trigger", () => {
    it("groups records by trigger type", () => {
      const records = [
        makeCandourRecord({ trigger: "death" }),
        makeCandourRecord({ trigger: "death" }),
        makeCandourRecord({ trigger: "serious_injury" }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.by_trigger).toEqual({ death: 2, serious_injury: 1 });
    });

    it("returns empty object for empty input", () => {
      const result = computeCandourMetrics([], NOW);
      expect(result.by_trigger).toEqual({});
    });

    it("handles single trigger type", () => {
      const records = [
        makeCandourRecord({ trigger: "medication_error" }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.by_trigger).toEqual({ medication_error: 1 });
    });
  });

  describe("by_status", () => {
    it("groups records by status", () => {
      const records = [
        makeCandourRecord({ status: "identified" }),
        makeCandourRecord({ status: "identified" }),
        makeCandourRecord({ status: "closed" }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.by_status).toEqual({ identified: 2, closed: 1 });
    });

    it("returns empty object for empty input", () => {
      const result = computeCandourMetrics([], NOW);
      expect(result.by_status).toEqual({});
    });

    it("correctly groups all same status", () => {
      const records = [
        makeCandourRecord({ status: "closed" }),
        makeCandourRecord({ status: "closed" }),
        makeCandourRecord({ status: "closed" }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.by_status).toEqual({ closed: 3 });
    });
  });

  describe("by_outcome", () => {
    it("groups records by investigation_outcome (non-null only)", () => {
      const records = [
        makeCandourRecord({ investigation_outcome: "upheld" }),
        makeCandourRecord({ investigation_outcome: "upheld" }),
        makeCandourRecord({ investigation_outcome: "not_upheld" }),
        makeCandourRecord({ investigation_outcome: null }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.by_outcome).toEqual({ upheld: 2, not_upheld: 1 });
    });

    it("returns empty object when all outcomes are null", () => {
      const records = [
        makeCandourRecord({ investigation_outcome: null }),
        makeCandourRecord({ investigation_outcome: null }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.by_outcome).toEqual({});
    });

    it("returns empty object for empty input", () => {
      const result = computeCandourMetrics([], NOW);
      expect(result.by_outcome).toEqual({});
    });

    it("groups all five outcome types", () => {
      const records = [
        makeCandourRecord({ investigation_outcome: "upheld" }),
        makeCandourRecord({ investigation_outcome: "partially_upheld" }),
        makeCandourRecord({ investigation_outcome: "not_upheld" }),
        makeCandourRecord({ investigation_outcome: "inconclusive" }),
        makeCandourRecord({ investigation_outcome: "ongoing" }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.by_outcome).toEqual({
        upheld: 1,
        partially_upheld: 1,
        not_upheld: 1,
        inconclusive: 1,
        ongoing: 1,
      });
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyCandourAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyCandourAlerts", () => {
  it("returns empty array for empty input", () => {
    const result = identifyCandourAlerts([], NOW);
    expect(result).toEqual([]);
  });

  // ── no_verbal_apology ─────────────────────────────────────────────────

  describe("no_verbal_apology", () => {
    it("fires when identified + no verbal apology + >10 days since incident", () => {
      const record = makeCandourRecord({
        status: "identified",
        verbal_apology_date: null,
        incident_date: "2026-04-20",
        child_name: "Alice",
      });
      const result = identifyCandourAlerts([record], NOW);
      const alerts = result.filter((a) => a.type === "no_verbal_apology");
      expect(alerts).toHaveLength(1);
    });

    it("has severity critical", () => {
      const record = makeCandourRecord({
        status: "identified",
        verbal_apology_date: null,
        incident_date: "2026-04-20",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_verbal_apology",
      );
      expect(alerts[0].severity).toBe("critical");
    });

    it("includes days since incident in message", () => {
      const record = makeCandourRecord({
        status: "identified",
        verbal_apology_date: null,
        incident_date: "2026-04-20",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_verbal_apology",
      );
      expect(alerts[0].message).toContain("23 days");
    });

    it("uses death wording when trigger is death", () => {
      const record = makeCandourRecord({
        status: "identified",
        verbal_apology_date: null,
        incident_date: "2026-04-20",
        trigger: "death",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_verbal_apology",
      );
      expect(alerts[0].message).toContain("death");
    });

    it("uses incident wording when trigger is not death", () => {
      const record = makeCandourRecord({
        status: "identified",
        verbal_apology_date: null,
        incident_date: "2026-04-20",
        trigger: "serious_injury",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_verbal_apology",
      );
      expect(alerts[0].message).toContain("incident");
    });

    it("includes child_name in message", () => {
      const record = makeCandourRecord({
        status: "identified",
        verbal_apology_date: null,
        incident_date: "2026-04-20",
        child_name: "Emma Watson",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_verbal_apology",
      );
      expect(alerts[0].message).toContain("Emma Watson");
    });

    it("includes record id", () => {
      const record = makeCandourRecord({
        id: "rec-123",
        status: "identified",
        verbal_apology_date: null,
        incident_date: "2026-04-20",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_verbal_apology",
      );
      expect(alerts[0].id).toBe("rec-123");
    });

    it("does not fire when verbal apology already given", () => {
      const record = makeCandourRecord({
        status: "identified",
        verbal_apology_date: "2026-04-25",
        incident_date: "2026-04-20",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_verbal_apology",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire when within 10 days", () => {
      const record = makeCandourRecord({
        status: "identified",
        verbal_apology_date: null,
        incident_date: "2026-05-05",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_verbal_apology",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire when exactly 10 days (not >10)", () => {
      const record = makeCandourRecord({
        status: "identified",
        verbal_apology_date: null,
        incident_date: "2026-05-03",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_verbal_apology",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire when status is not identified", () => {
      const record = makeCandourRecord({
        status: "investigation_underway",
        verbal_apology_date: null,
        incident_date: "2026-04-20",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_verbal_apology",
      );
      expect(alerts).toHaveLength(0);
    });
  });

  // ── no_written_apology ────────────────────────────────────────────────

  describe("no_written_apology", () => {
    it("fires when has verbal + no written + >14 days since incident", () => {
      const record = makeCandourRecord({
        verbal_apology_date: "2026-04-22",
        written_apology_date: null,
        incident_date: "2026-04-20",
      });
      const result = identifyCandourAlerts([record], NOW);
      const alerts = result.filter((a) => a.type === "no_written_apology");
      expect(alerts).toHaveLength(1);
    });

    it("has severity high", () => {
      const record = makeCandourRecord({
        verbal_apology_date: "2026-04-22",
        written_apology_date: null,
        incident_date: "2026-04-20",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_written_apology",
      );
      expect(alerts[0].severity).toBe("high");
    });

    it("includes child_name in message", () => {
      const record = makeCandourRecord({
        verbal_apology_date: "2026-04-22",
        written_apology_date: null,
        incident_date: "2026-04-20",
        child_name: "Tom Jones",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_written_apology",
      );
      expect(alerts[0].message).toContain("Tom Jones");
    });

    it("includes verbal_apology_date in message", () => {
      const record = makeCandourRecord({
        verbal_apology_date: "2026-04-22",
        written_apology_date: null,
        incident_date: "2026-04-20",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_written_apology",
      );
      expect(alerts[0].message).toContain("2026-04-22");
    });

    it("does not fire when written apology already sent", () => {
      const record = makeCandourRecord({
        verbal_apology_date: "2026-04-22",
        written_apology_date: "2026-04-28",
        incident_date: "2026-04-20",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_written_apology",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire when no verbal apology given", () => {
      const record = makeCandourRecord({
        verbal_apology_date: null,
        written_apology_date: null,
        incident_date: "2026-04-20",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_written_apology",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire when within 14 days of incident", () => {
      const record = makeCandourRecord({
        verbal_apology_date: "2026-05-02",
        written_apology_date: null,
        incident_date: "2026-05-01",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_written_apology",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire at exactly 14 days (not >14)", () => {
      const record = makeCandourRecord({
        verbal_apology_date: "2026-04-30",
        written_apology_date: null,
        incident_date: "2026-04-29",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_written_apology",
      );
      expect(alerts).toHaveLength(0);
    });
  });

  // ── family_not_informed ───────────────────────────────────────────────

  describe("family_not_informed", () => {
    it("fires when family not informed and not closed", () => {
      const record = makeCandourRecord({
        family_informed: false,
        status: "identified",
      });
      const result = identifyCandourAlerts([record], NOW);
      const alerts = result.filter((a) => a.type === "family_not_informed");
      expect(alerts).toHaveLength(1);
    });

    it("has severity high", () => {
      const record = makeCandourRecord({
        family_informed: false,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "family_not_informed",
      );
      expect(alerts[0].severity).toBe("high");
    });

    it("includes child_name in message", () => {
      const record = makeCandourRecord({
        family_informed: false,
        status: "identified",
        child_name: "Sarah Smith",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "family_not_informed",
      );
      expect(alerts[0].message).toContain("Sarah Smith");
    });

    it("uses death wording when trigger is death", () => {
      const record = makeCandourRecord({
        family_informed: false,
        status: "identified",
        trigger: "death",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "family_not_informed",
      );
      expect(alerts[0].message).toContain("death");
    });

    it("uses incident wording for non-death triggers", () => {
      const record = makeCandourRecord({
        family_informed: false,
        status: "identified",
        trigger: "medication_error",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "family_not_informed",
      );
      expect(alerts[0].message).toContain("incident");
    });

    it("does not fire when family is informed", () => {
      const record = makeCandourRecord({
        family_informed: true,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "family_not_informed",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire when status is closed", () => {
      const record = makeCandourRecord({
        family_informed: false,
        status: "closed",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "family_not_informed",
      );
      expect(alerts).toHaveLength(0);
    });

    it("fires for investigation_underway status", () => {
      const record = makeCandourRecord({
        family_informed: false,
        status: "investigation_underway",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "family_not_informed",
      );
      expect(alerts).toHaveLength(1);
    });

    it("fires for final_response_sent status", () => {
      const record = makeCandourRecord({
        family_informed: false,
        status: "final_response_sent",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "family_not_informed",
      );
      expect(alerts).toHaveLength(1);
    });
  });

  // ── ofsted_not_notified ───────────────────────────────────────────────

  describe("ofsted_not_notified", () => {
    it("fires for death trigger when ofsted not notified and not closed", () => {
      const record = makeCandourRecord({
        trigger: "death",
        ofsted_notified: false,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts).toHaveLength(1);
    });

    it("fires for serious_injury trigger", () => {
      const record = makeCandourRecord({
        trigger: "serious_injury",
        ofsted_notified: false,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts).toHaveLength(1);
    });

    it("fires for hospitalisation trigger", () => {
      const record = makeCandourRecord({
        trigger: "hospitalisation",
        ofsted_notified: false,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts).toHaveLength(1);
    });

    it("fires for abuse_allegation trigger", () => {
      const record = makeCandourRecord({
        trigger: "abuse_allegation",
        ofsted_notified: false,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts).toHaveLength(1);
    });

    it("fires for police_involvement trigger", () => {
      const record = makeCandourRecord({
        trigger: "police_involvement",
        ofsted_notified: false,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts).toHaveLength(1);
    });

    it("has severity critical", () => {
      const record = makeCandourRecord({
        trigger: "death",
        ofsted_notified: false,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts[0].severity).toBe("critical");
    });

    it("includes trigger in message with underscores replaced by spaces", () => {
      const record = makeCandourRecord({
        trigger: "serious_injury",
        ofsted_notified: false,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts[0].message).toContain("serious injury");
    });

    it("includes child_name in message", () => {
      const record = makeCandourRecord({
        trigger: "death",
        ofsted_notified: false,
        status: "identified",
        child_name: "Liam Park",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts[0].message).toContain("Liam Park");
    });

    it("does not fire for medication_error trigger", () => {
      const record = makeCandourRecord({
        trigger: "medication_error",
        ofsted_notified: false,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire for restraint_injury trigger", () => {
      const record = makeCandourRecord({
        trigger: "restraint_injury",
        ofsted_notified: false,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire for missing_child trigger", () => {
      const record = makeCandourRecord({
        trigger: "missing_child",
        ofsted_notified: false,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire for safeguarding_incident trigger", () => {
      const record = makeCandourRecord({
        trigger: "safeguarding_incident",
        ofsted_notified: false,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire for near_miss_serious trigger", () => {
      const record = makeCandourRecord({
        trigger: "near_miss_serious",
        ofsted_notified: false,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire for other trigger", () => {
      const record = makeCandourRecord({
        trigger: "other",
        ofsted_notified: false,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire when ofsted already notified", () => {
      const record = makeCandourRecord({
        trigger: "death",
        ofsted_notified: true,
        status: "identified",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire when status is closed", () => {
      const record = makeCandourRecord({
        trigger: "death",
        ofsted_notified: false,
        status: "closed",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "ofsted_not_notified",
      );
      expect(alerts).toHaveLength(0);
    });
  });

  // ── investigation_prolonged ───────────────────────────────────────────

  describe("investigation_prolonged", () => {
    it("fires when investigation_underway + no completion + >28 days", () => {
      const record = makeCandourRecord({
        status: "investigation_underway",
        investigation_completed_date: null,
        incident_date: "2026-04-01",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "investigation_prolonged",
      );
      expect(alerts).toHaveLength(1);
    });

    it("has severity medium", () => {
      const record = makeCandourRecord({
        status: "investigation_underway",
        investigation_completed_date: null,
        incident_date: "2026-04-01",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "investigation_prolonged",
      );
      expect(alerts[0].severity).toBe("medium");
    });

    it("includes days count in message", () => {
      const record = makeCandourRecord({
        status: "investigation_underway",
        investigation_completed_date: null,
        incident_date: "2026-04-01",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "investigation_prolonged",
      );
      expect(alerts[0].message).toContain("42 days");
    });

    it("includes child_name in message", () => {
      const record = makeCandourRecord({
        status: "investigation_underway",
        investigation_completed_date: null,
        incident_date: "2026-04-01",
        child_name: "Jack Brown",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "investigation_prolonged",
      );
      expect(alerts[0].message).toContain("Jack Brown");
    });

    it("does not fire when investigation completed", () => {
      const record = makeCandourRecord({
        status: "investigation_underway",
        investigation_completed_date: "2026-04-15",
        incident_date: "2026-04-01",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "investigation_prolonged",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire when status is not investigation_underway", () => {
      const record = makeCandourRecord({
        status: "identified",
        investigation_completed_date: null,
        incident_date: "2026-04-01",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "investigation_prolonged",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire when within 28 days", () => {
      const record = makeCandourRecord({
        status: "investigation_underway",
        investigation_completed_date: null,
        incident_date: "2026-04-25",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "investigation_prolonged",
      );
      expect(alerts).toHaveLength(0);
    });

    it("does not fire at exactly 28 days (not >28)", () => {
      const record = makeCandourRecord({
        status: "investigation_underway",
        investigation_completed_date: null,
        incident_date: "2026-04-15",
      });
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "investigation_prolonged",
      );
      expect(alerts).toHaveLength(0);
    });
  });

  // ── Combined scenarios ────────────────────────────────────────────────

  describe("combined scenarios", () => {
    it("generates multiple alert types from a single record", () => {
      const record = makeCandourRecord({
        status: "identified",
        verbal_apology_date: null,
        written_apology_date: null,
        family_informed: false,
        ofsted_notified: false,
        trigger: "death",
        incident_date: "2026-04-20",
      });
      const alerts = identifyCandourAlerts([record], NOW);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("no_verbal_apology");
      expect(types).toContain("family_not_informed");
      expect(types).toContain("ofsted_not_notified");
    });

    it("generates alerts for multiple records independently", () => {
      const records = [
        makeCandourRecord({
          id: "rec-1",
          status: "identified",
          verbal_apology_date: null,
          incident_date: "2026-04-20",
          family_informed: true,
          ofsted_notified: true,
          trigger: "medication_error",
        }),
        makeCandourRecord({
          id: "rec-2",
          status: "investigation_underway",
          investigation_completed_date: null,
          incident_date: "2026-04-01",
          family_informed: true,
          ofsted_notified: true,
          trigger: "medication_error",
          verbal_apology_date: "2026-04-02",
          written_apology_date: "2026-04-10",
        }),
      ];
      const alerts = identifyCandourAlerts(records, NOW);
      const verbalAlerts = alerts.filter((a) => a.type === "no_verbal_apology");
      const prolongedAlerts = alerts.filter((a) => a.type === "investigation_prolonged");
      expect(verbalAlerts).toHaveLength(1);
      expect(verbalAlerts[0].id).toBe("rec-1");
      expect(prolongedAlerts).toHaveLength(1);
      expect(prolongedAlerts[0].id).toBe("rec-2");
    });

    it("does not generate any alerts for a fully-closed, compliant record", () => {
      const record = makeCandourRecord({
        status: "closed",
        verbal_apology_date: "2026-04-22",
        written_apology_date: "2026-04-28",
        family_informed: true,
        ofsted_notified: true,
        trigger: "serious_injury",
        incident_date: "2026-04-20",
        investigation_completed_date: "2026-05-05",
      });
      const alerts = identifyCandourAlerts([record], NOW);
      expect(alerts).toHaveLength(0);
    });

    it("generates no_written_apology alongside family_not_informed", () => {
      const record = makeCandourRecord({
        status: "verbal_apology_given",
        verbal_apology_date: "2026-04-22",
        written_apology_date: null,
        family_informed: false,
        ofsted_notified: true,
        trigger: "medication_error",
        incident_date: "2026-04-20",
      });
      const alerts = identifyCandourAlerts([record], NOW);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("no_written_apology");
      expect(types).toContain("family_not_informed");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD fallback (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

describe("CRUD fallback when Supabase is disabled", () => {
  it("listRecords returns ok true with empty array", async () => {
    const { listRecords } = await import("../duty-of-candour-service");
    const result = await listRecords("home-1");
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listRecords returns ok true with filters passed", async () => {
    const { listRecords } = await import("../duty-of-candour-service");
    const result = await listRecords("home-1", {
      childId: "child-1",
      trigger: "death",
      status: "identified",
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      limit: 50,
    });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("createRecord returns ok false with error message", async () => {
    const { createRecord } = await import("../duty-of-candour-service");
    const result = await createRecord({
      homeId: "home-1",
      childName: "Test Child",
      childId: "child-1",
      trigger: "serious_injury",
      incidentDate: "2026-05-01",
      description: "Test incident",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateRecord returns ok false with error message", async () => {
    const { updateRecord } = await import("../duty-of-candour-service");
    const result = await updateRecord("rec-1", { status: "closed" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Edge cases
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  describe("single record scenarios", () => {
    it("metrics for single open record", () => {
      const result = computeCandourMetrics(
        [makeCandourRecord({ status: "identified" })],
        NOW,
      );
      expect(result.total_records).toBe(1);
      expect(result.open_cases).toBe(1);
      expect(result.closed_cases).toBe(0);
    });

    it("metrics for single closed record", () => {
      const result = computeCandourMetrics(
        [makeCandourRecord({ status: "closed" })],
        NOW,
      );
      expect(result.total_records).toBe(1);
      expect(result.open_cases).toBe(0);
      expect(result.closed_cases).toBe(1);
    });
  });

  describe("large datasets", () => {
    it("computes metrics correctly for 100 records", () => {
      const records: CandourRecord[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeCandourRecord({
            status: i < 60 ? "identified" : "closed",
            family_informed: i < 75,
            trigger: i % 2 === 0 ? "death" : "serious_injury",
          }),
        );
      }
      const result = computeCandourMetrics(records, NOW);
      expect(result.total_records).toBe(100);
      expect(result.open_cases).toBe(60);
      expect(result.closed_cases).toBe(40);
      expect(result.family_informed_rate).toBe(75);
      expect(result.by_trigger).toEqual({ death: 50, serious_injury: 50 });
    });

    it("identifies alerts correctly for many records", () => {
      const records: CandourRecord[] = [];
      for (let i = 0; i < 50; i++) {
        records.push(
          makeCandourRecord({
            status: "identified",
            verbal_apology_date: null,
            incident_date: "2026-04-01",
            family_informed: true,
            ofsted_notified: true,
            trigger: "medication_error",
          }),
        );
      }
      const alerts = identifyCandourAlerts(records, NOW);
      const verbal = alerts.filter((a) => a.type === "no_verbal_apology");
      expect(verbal).toHaveLength(50);
    });
  });

  describe("empty arrays for lessons_learned and actions_taken", () => {
    it("record with empty lessons_learned does not count as lessons_captured", () => {
      const result = computeCandourMetrics(
        [makeCandourRecord({ lessons_learned: [] })],
        NOW,
      );
      expect(result.lessons_captured).toBe(0);
    });

    it("record with empty actions_taken is valid", () => {
      const result = computeCandourMetrics(
        [makeCandourRecord({ actions_taken: [] })],
        NOW,
      );
      expect(result.total_records).toBe(1);
    });
  });

  describe("default now parameter", () => {
    it("computeCandourMetrics works without explicit now parameter", () => {
      const result = computeCandourMetrics([makeCandourRecord()]);
      expect(result.total_records).toBe(1);
    });

    it("identifyCandourAlerts works without explicit now parameter", () => {
      const result = identifyCandourAlerts([makeCandourRecord()]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("type safety", () => {
    it("metrics return type has exactly 15 fields", () => {
      const result = computeCandourMetrics([], NOW);
      expect(Object.keys(result)).toHaveLength(15);
    });

    it("metrics return contains all expected keys", () => {
      const result = computeCandourMetrics([], NOW);
      const keys = Object.keys(result);
      expect(keys).toContain("total_records");
      expect(keys).toContain("open_cases");
      expect(keys).toContain("closed_cases");
      expect(keys).toContain("verbal_apology_given");
      expect(keys).toContain("written_apology_sent");
      expect(keys).toContain("family_informed_rate");
      expect(keys).toContain("ofsted_notified_rate");
      expect(keys).toContain("investigation_complete");
      expect(keys).toContain("investigation_upheld");
      expect(keys).toContain("avg_days_to_verbal");
      expect(keys).toContain("avg_days_to_written");
      expect(keys).toContain("lessons_captured");
      expect(keys).toContain("by_trigger");
      expect(keys).toContain("by_status");
      expect(keys).toContain("by_outcome");
    });

    it("alert objects have required fields", () => {
      const record = makeCandourRecord({
        status: "identified",
        verbal_apology_date: null,
        incident_date: "2026-04-20",
        family_informed: false,
      });
      const alerts = identifyCandourAlerts([record], NOW);
      for (const alert of alerts) {
        expect(typeof alert.type).toBe("string");
        expect(["critical", "high", "medium"]).toContain(alert.severity);
        expect(typeof alert.message).toBe("string");
        expect(typeof alert.id).toBe("string");
      }
    });
  });

  describe("date arithmetic precision", () => {
    it("computes exact day difference for verbal apology", () => {
      const records = [
        makeCandourRecord({
          incident_date: "2026-05-01",
          verbal_apology_date: "2026-05-02",
        }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.avg_days_to_verbal).toBe(1);
    });

    it("computes exact day difference for written apology", () => {
      const records = [
        makeCandourRecord({
          incident_date: "2026-05-01",
          written_apology_date: "2026-05-15",
        }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.avg_days_to_written).toBe(14);
    });

    it("same-day incident and apology yields 0 days", () => {
      const records = [
        makeCandourRecord({
          incident_date: "2026-05-01",
          verbal_apology_date: "2026-05-01",
        }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.avg_days_to_verbal).toBe(0);
    });

    it("daysSinceIncident for alerts uses floor division", () => {
      // incident 11.5 days ago should floor to 11
      const record = makeCandourRecord({
        status: "identified",
        verbal_apology_date: null,
        incident_date: "2026-05-01T12:00:00Z",
        family_informed: true,
        ofsted_notified: true,
        trigger: "medication_error",
      });
      // NOW = 2026-05-13T00:00:00 => difference = 11.5 days => floor = 11 => >10 fires
      const alerts = identifyCandourAlerts([record], NOW).filter(
        (a) => a.type === "no_verbal_apology",
      );
      expect(alerts).toHaveLength(1);
      expect(alerts[0].message).toContain("11 days");
    });
  });

  describe("all-same-status edge case", () => {
    it("all records identified", () => {
      const records = [
        makeCandourRecord({ status: "identified" }),
        makeCandourRecord({ status: "identified" }),
        makeCandourRecord({ status: "identified" }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.open_cases).toBe(3);
      expect(result.closed_cases).toBe(0);
      expect(result.by_status).toEqual({ identified: 3 });
    });

    it("all records closed", () => {
      const records = [
        makeCandourRecord({ status: "closed" }),
        makeCandourRecord({ status: "closed" }),
      ];
      const result = computeCandourMetrics(records, NOW);
      expect(result.open_cases).toBe(0);
      expect(result.closed_cases).toBe(2);
      expect(result.by_status).toEqual({ closed: 2 });
    });
  });
});
