import { describe, it, expect } from "vitest";
import {
  computeTrainingStatus,
  computeTrainingMatrix,
  computeCompetencyProfile,
  MANDATORY_TRAINING,
  type CompetencyLevel,
} from "./competency-service";

const NOW = new Date("2026-05-21T12:00:00Z");

describe("computeTrainingStatus", () => {
  it("returns not_started when no completed date", () => {
    expect(computeTrainingStatus(null, null, NOW)).toBe("not_started");
  });

  it("returns current when completed but no expiry", () => {
    expect(computeTrainingStatus("2026-01-01", null, NOW)).toBe("current");
  });

  it("returns expired when expiry date is in the past", () => {
    expect(computeTrainingStatus("2025-01-01", "2026-01-01", NOW)).toBe("expired");
  });

  it("returns expiring_soon when expiry within 30 days", () => {
    expect(computeTrainingStatus("2025-06-01", "2026-06-10", NOW)).toBe("expiring_soon");
  });

  it("returns current when expiry more than 30 days away", () => {
    expect(computeTrainingStatus("2025-06-01", "2027-01-01", NOW)).toBe("current");
  });
});

describe("computeTrainingMatrix", () => {
  it("returns empty matrix and zero stats for no staff", () => {
    const result = computeTrainingMatrix([], []);
    expect(result.stats.total_staff).toBe(0);
    expect(result.stats.fully_compliant).toBe(0);
    expect(result.stats.compliance_percentage).toBeNull();;
    expect(Object.keys(result.matrix)).toHaveLength(0);
  });

  it("marks staff not_started for missing mandatory training", () => {
    const result = computeTrainingMatrix([], ["staff-1"]);
    expect(result.stats.total_staff).toBe(1);
    expect(result.stats.fully_compliant).toBe(0);
    // All mandatory categories should be not_started
    const mandatoryCategories = MANDATORY_TRAINING.map((t) => t.category);
    for (const cat of mandatoryCategories) {
      expect(result.matrix["staff-1"][cat]).toBe("not_started");
    }
  });

  it("correctly identifies fully compliant staff", () => {
    const mandatoryCategories = MANDATORY_TRAINING.map((t) => t.category);
    const records = mandatoryCategories.map((cat) => ({
      staff_id: "staff-1",
      category: cat,
      status: "current",
      is_mandatory: true,
    }));
    const result = computeTrainingMatrix(records, ["staff-1"]);
    expect(result.stats.fully_compliant).toBe(1);
    expect(result.stats.compliance_percentage).toBe(100);
  });

  it("counts expired and expiring_soon staff", () => {
    // Use unique categories to avoid duplicates in MANDATORY_TRAINING
    const uniqueCategories = [...new Set(MANDATORY_TRAINING.map((t) => t.category))];
    const records = uniqueCategories.map((cat, i) => ({
      staff_id: "staff-1",
      category: cat,
      // first unique category => expired, second => expiring_soon, rest => current
      status: i === 0 ? "expired" : i === 1 ? "expiring_soon" : "current",
      is_mandatory: true,
    }));
    const result = computeTrainingMatrix(records, ["staff-1"]);
    expect(result.stats.has_expired).toBe(1);
    expect(result.stats.has_expiring).toBe(1);
    expect(result.stats.fully_compliant).toBe(0);
  });
});

describe("computeCompetencyProfile", () => {
  it("returns not_assessed for no assessments", () => {
    const result = computeCompetencyProfile([]);
    expect(result.overallLevel).toBe("not_assessed");
    expect(result.assessed).toBe(0);
  });

  it("calculates overall level from average score", () => {
    const assessments: { competency_area: string; level: CompetencyLevel }[] = [
      { competency_area: "relationship_building", level: "expert" },
      { competency_area: "de_escalation", level: "proficient" },
      { competency_area: "safeguarding_practice", level: "proficient" },
    ];
    // scores: 4+3+3 = 10/3 = 3.33 => proficient (>=2.5, <3.5)
    const result = computeCompetencyProfile(assessments);
    expect(result.overallLevel).toBe("proficient");
    expect(result.assessed).toBe(3);
    expect(result.expert).toBe(1);
    expect(result.proficient).toBe(2);
  });

  it("excludes not_assessed from average calculation", () => {
    const assessments: { competency_area: string; level: CompetencyLevel }[] = [
      { competency_area: "relationship_building", level: "competent" },
      { competency_area: "de_escalation", level: "not_assessed" },
    ];
    // only competent counted: 2/1 = 2.0 => competent (>=1.5, <2.5)
    const result = computeCompetencyProfile(assessments);
    expect(result.overallLevel).toBe("competent");
    expect(result.assessed).toBe(1);
    expect(result.not_assessed).toBe(1);
  });

  it("returns developing for low average", () => {
    const assessments: { competency_area: string; level: CompetencyLevel }[] = [
      { competency_area: "a", level: "developing" },
      { competency_area: "b", level: "developing" },
    ];
    // avg = 1.0 => developing (>0, <1.5)
    const result = computeCompetencyProfile(assessments);
    expect(result.overallLevel).toBe("developing");
  });

  it("returns expert for high average (>=3.5)", () => {
    const assessments: { competency_area: string; level: CompetencyLevel }[] = [
      { competency_area: "a", level: "expert" },
      { competency_area: "b", level: "expert" },
    ];
    // avg = 4.0 => expert
    const result = computeCompetencyProfile(assessments);
    expect(result.overallLevel).toBe("expert");
  });
});
