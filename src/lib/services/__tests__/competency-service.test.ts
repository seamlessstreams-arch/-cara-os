// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COMPETENCY & TRAINING SERVICE TESTS
// Pure-function unit tests for training status computation, training matrix
// aggregation, competency profile scoring, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../competency-service";

const {
  computeTrainingStatus,
  computeTrainingMatrix,
  computeCompetencyProfile,
  MANDATORY_TRAINING,
  COMPETENCY_AREAS,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Fixed "now" for deterministic date tests. */
const NOW = new Date("2026-06-01T00:00:00Z");

/** Build a minimal training record for matrix tests. */
function rec(
  staff_id: string,
  category: string,
  status: string,
  is_mandatory = true,
): { staff_id: string; category: string; status: string; is_mandatory: boolean } {
  return { staff_id, category, status, is_mandatory };
}

/** Build a minimal competency assessment. */
function assessment(
  competency_area: string,
  level: "not_assessed" | "developing" | "competent" | "proficient" | "expert",
) {
  return { competency_area, level };
}

// ── computeTrainingStatus ────────────────────────────────────────────────

describe("computeTrainingStatus", () => {
  it("returns not_started when completedDate is null", () => {
    expect(computeTrainingStatus(null, null, NOW)).toBe("not_started");
  });

  it("returns current when completedDate is set but expiryDate is null", () => {
    expect(computeTrainingStatus("2026-01-01", null, NOW)).toBe("current");
  });

  it("returns expired when expiryDate is in the past", () => {
    expect(computeTrainingStatus("2025-01-01", "2026-05-01", NOW)).toBe("expired");
  });

  it("returns expiring_soon when expiryDate is within 30 days", () => {
    // 15 days from NOW (2026-06-01 → 2026-06-16)
    expect(computeTrainingStatus("2025-06-16", "2026-06-16", NOW)).toBe("expiring_soon");
  });

  it("returns expiring_soon on exactly 30 days", () => {
    // Exactly 30 days: 2026-07-01
    expect(computeTrainingStatus("2025-07-01", "2026-07-01", NOW)).toBe("expiring_soon");
  });

  it("returns current when expiryDate is more than 30 days away", () => {
    expect(computeTrainingStatus("2025-01-01", "2027-01-01", NOW)).toBe("current");
  });

});

// ── computeTrainingMatrix ────────────────────────────────────────────────

describe("computeTrainingMatrix", () => {
  const mandatoryCategories = MANDATORY_TRAINING.map((t) => t.category);

  it("returns empty matrix and zero stats for no staff", () => {
    const { matrix, stats } = computeTrainingMatrix([], []);
    expect(matrix).toEqual({});
    expect(stats.total_staff).toBe(0);
    expect(stats.fully_compliant).toBe(0);
    expect(stats.compliance_percentage).toBe(0);
  });

  it("marks all categories as not_started when staff has no records", () => {
    const { matrix } = computeTrainingMatrix([], ["staff-1"]);
    for (const cat of mandatoryCategories) {
      expect(matrix["staff-1"][cat]).toBe("not_started");
    }
  });

  it("counts fully compliant staff when all mandatory categories are current", () => {
    const records = mandatoryCategories.map((cat) => rec("staff-1", cat, "current"));
    const { stats } = computeTrainingMatrix(records, ["staff-1"]);
    expect(stats.fully_compliant).toBe(1);
    expect(stats.compliance_percentage).toBe(100);
  });

  it("does not count staff as compliant when any mandatory category is expired", () => {
    const records = mandatoryCategories.map((cat) =>
      rec("staff-1", cat, cat === "safeguarding" ? "expired" : "current"),
    );
    const { stats } = computeTrainingMatrix(records, ["staff-1"]);
    expect(stats.fully_compliant).toBe(0);
    expect(stats.has_expired).toBe(1);
  });

  it("does not count staff as compliant when any mandatory category is not_started", () => {
    // Provide records for all categories except "recording_standards" (the last unique one)
    const records = mandatoryCategories
      .filter((cat) => cat !== "recording_standards")
      .map((cat) => rec("staff-1", cat, "current"));
    const { stats } = computeTrainingMatrix(records, ["staff-1"]);
    expect(stats.fully_compliant).toBe(0);
  });

  it("tracks has_expiring for staff with expiring_soon status", () => {
    const records = mandatoryCategories.map((cat) =>
      rec("staff-1", cat, cat === "first_aid" ? "expiring_soon" : "current"),
    );
    const { stats } = computeTrainingMatrix(records, ["staff-1"]);
    expect(stats.has_expiring).toBe(1);
    // expiring_soon alone does not block compliance (only expired / not_started do)
    expect(stats.fully_compliant).toBe(1);
  });

  it("calculates compliance_percentage across multiple staff", () => {
    const compliantRecords = mandatoryCategories.map((cat) => rec("s1", cat, "current"));
    const nonCompliantRecords = mandatoryCategories.map((cat) =>
      rec("s2", cat, cat === "fire_safety" ? "expired" : "current"),
    );
    const { stats } = computeTrainingMatrix(
      [...compliantRecords, ...nonCompliantRecords],
      ["s1", "s2"],
    );
    expect(stats.total_staff).toBe(2);
    expect(stats.fully_compliant).toBe(1);
    expect(stats.compliance_percentage).toBe(50);
  });


});

// ── computeCompetencyProfile ─────────────────────────────────────────────

describe("computeCompetencyProfile", () => {
  it("returns not_assessed with zero counts for empty assessments", () => {
    const result = computeCompetencyProfile([]);
    expect(result.overallLevel).toBe("not_assessed");
    expect(result.assessed).toBe(0);
    expect(result.areaCount).toBe(10);
  });

  it("returns not_assessed when all assessments are not_assessed", () => {
    const assessments = COMPETENCY_AREAS.map((a) => assessment(a.area, "not_assessed"));
    const result = computeCompetencyProfile(assessments);
    expect(result.overallLevel).toBe("not_assessed");
    expect(result.assessed).toBe(0);
    expect(result.not_assessed).toBe(10);
  });

  it("returns developing when average score is below 1.5", () => {
    const assessments = [assessment("relationship_building", "developing")];
    const result = computeCompetencyProfile(assessments);
    expect(result.overallLevel).toBe("developing");
    expect(result.assessed).toBe(1);
    expect(result.developing).toBe(1);
  });

  it("returns competent when average score is between 1.5 and 2.5", () => {
    const assessments = [
      assessment("relationship_building", "developing"),
      assessment("de_escalation", "competent"),
    ];
    const result = computeCompetencyProfile(assessments);
    // average = (1 + 2) / 2 = 1.5 → competent
    expect(result.overallLevel).toBe("competent");
  });

  it("returns proficient when average score is between 2.5 and 3.5", () => {
    const assessments = [
      assessment("relationship_building", "proficient"),
      assessment("de_escalation", "competent"),
    ];
    const result = computeCompetencyProfile(assessments);
    // average = (3 + 2) / 2 = 2.5 → proficient
    expect(result.overallLevel).toBe("proficient");
  });

  it("returns expert when average score is 3.5 or higher", () => {
    const assessments = [
      assessment("relationship_building", "expert"),
      assessment("de_escalation", "proficient"),
    ];
    const result = computeCompetencyProfile(assessments);
    // average = (4 + 3) / 2 = 3.5 → expert
    expect(result.overallLevel).toBe("expert");
  });

  it("ignores not_assessed entries when computing average", () => {
    const assessments = [
      assessment("relationship_building", "expert"),
      assessment("de_escalation", "not_assessed"),
    ];
    const result = computeCompetencyProfile(assessments);
    // Only the expert (4) is counted, average = 4 → expert
    expect(result.overallLevel).toBe("expert");
    expect(result.assessed).toBe(1);
    expect(result.not_assessed).toBe(1);
  });

  it("counts each level bucket correctly", () => {
    const assessments = [
      assessment("a1", "developing"),
      assessment("a2", "developing"),
      assessment("a3", "competent"),
      assessment("a4", "proficient"),
      assessment("a5", "expert"),
      assessment("a6", "not_assessed"),
    ];
    const result = computeCompetencyProfile(assessments);
    expect(result.developing).toBe(2);
    expect(result.competent).toBe(1);
    expect(result.proficient).toBe(1);
    expect(result.expert).toBe(1);
    expect(result.not_assessed).toBe(1);
    expect(result.assessed).toBe(5);
  });
});

// ── Constants ────────────────────────────────────────────────────────────

describe("MANDATORY_TRAINING", () => {
  it("has exactly 15 entries", () => {
    expect(MANDATORY_TRAINING).toHaveLength(15);
  });

  it("each entry has the required shape", () => {
    for (const entry of MANDATORY_TRAINING) {
      expect(entry).toHaveProperty("category");
      expect(entry).toHaveProperty("courseName");
      expect(typeof entry.renewalMonths).toBe("number");
      expect(typeof entry.regulationRef).toBe("string");
    }
  });
});

describe("COMPETENCY_AREAS", () => {
  it("has exactly 10 entries", () => {
    expect(COMPETENCY_AREAS).toHaveLength(10);
  });

  it("each entry has area, label, and description strings", () => {
    for (const entry of COMPETENCY_AREAS) {
      expect(typeof entry.area).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.description).toBe("string");
    }
  });
});
