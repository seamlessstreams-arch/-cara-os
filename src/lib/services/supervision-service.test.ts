import { describe, it, expect } from "vitest";
import {
  computeSupervisionCompliance,
  computeSupervisionQuality,
  isSupervisionOverdue,
  computeNextDueDate,
} from "./supervision-service";

// ── Factories ───────────────────────────────────────────────────────────

function makeRecord(
  overrides: Partial<{ staff_id: string; status: string; completed_date: string | null }> = {},
) {
  return {
    staff_id: "s1",
    status: "completed",
    completed_date: "2025-05-01",
    ...overrides,
  };
}

function makeStaff(overrides: Partial<{ id: string; role: string }> = {}) {
  return {
    id: "s1",
    role: "rsw",
    ...overrides,
  };
}

function makeQualityRecord(
  overrides: Partial<{
    staff_wellbeing_score: number | null;
    practice_quality_score: number | null;
    safeguarding_discussed: boolean;
  }> = {},
) {
  return {
    staff_wellbeing_score: 7,
    practice_quality_score: 7,
    safeguarding_discussed: true,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe("computeSupervisionCompliance", () => {
  it("returns zeroes for empty inputs", () => {
    const result = computeSupervisionCompliance([], [], new Date());
    expect(result.total_staff).toBe(0);
    expect(result.supervised_in_period).toBe(0);
    expect(result.overdue).toBe(0);
    expect(result.never_supervised).toBe(0);
    expect(result.compliance_percentage).toBeNull();;
    expect(result.overdue_staff).toEqual([]);
  });

  it("counts staff supervised within their role window", () => {
    const now = new Date("2025-05-15");
    const staff = [makeStaff({ id: "s1", role: "rsw" })]; // 4-week window
    const records = [makeRecord({ staff_id: "s1", completed_date: "2025-05-01" })];

    const result = computeSupervisionCompliance(records, staff, now);
    expect(result.total_staff).toBe(1);
    expect(result.supervised_in_period).toBe(1);
    expect(result.overdue).toBe(0);
    expect(result.compliance_percentage).toBe(100);
  });

  it("flags staff as overdue when outside role frequency window", () => {
    const now = new Date("2025-06-15");
    const staff = [makeStaff({ id: "s1", role: "rsw" })]; // 4 weeks = 28 days
    const records = [makeRecord({ staff_id: "s1", completed_date: "2025-04-01" })];

    const result = computeSupervisionCompliance(records, staff, now);
    expect(result.overdue).toBe(1);
    expect(result.overdue_staff).toHaveLength(1);
    expect(result.overdue_staff[0].staff_id).toBe("s1");
    expect(result.overdue_staff[0].days_overdue).toBeGreaterThan(0);
  });

  it("flags never-supervised staff", () => {
    const now = new Date("2025-05-15");
    const staff = [makeStaff({ id: "s2", role: "rsw" })];

    const result = computeSupervisionCompliance([], staff, now);
    expect(result.never_supervised).toBe(1);
    expect(result.overdue_staff).toHaveLength(1);
    expect(result.overdue_staff[0].last_supervised).toBeNull();
    expect(result.overdue_staff[0].days_overdue).toBe(28); // default 4 weeks
  });

  it("uses role-specific frequency for night_staff (6 weeks)", () => {
    const now = new Date("2025-06-01");
    const staff = [makeStaff({ id: "s1", role: "night_staff" })]; // 6-week window = 42 days
    const records = [makeRecord({ staff_id: "s1", completed_date: "2025-05-01" })];

    const result = computeSupervisionCompliance(records, staff, now);
    // 31 days gap, 42-day window => still in period
    expect(result.supervised_in_period).toBe(1);
    expect(result.overdue).toBe(0);
  });

  it("only counts completed records", () => {
    const now = new Date("2025-05-15");
    const staff = [makeStaff({ id: "s1" })];
    const records = [makeRecord({ staff_id: "s1", status: "scheduled", completed_date: null })];

    const result = computeSupervisionCompliance(records, staff, now);
    expect(result.never_supervised).toBe(1);
  });
});

describe("computeSupervisionQuality", () => {
  it("returns zeroes / inadequate for empty records", () => {
    const result = computeSupervisionQuality([]);
    expect(result.avg_wellbeing).toBe(0);
    expect(result.avg_practice).toBe(0);
    expect(result.safeguarding_coverage).toBe(0);
    expect(result.total_sessions).toBe(0);
    expect(result.quality_rating).toBe("inadequate");
  });

  it("computes averages correctly for populated records", () => {
    const records = [
      makeQualityRecord({ staff_wellbeing_score: 8, practice_quality_score: 9 }),
      makeQualityRecord({ staff_wellbeing_score: 6, practice_quality_score: 7 }),
    ];
    const result = computeSupervisionQuality(records);
    expect(result.avg_wellbeing).toBe(7);
    expect(result.avg_practice).toBe(8);
    expect(result.total_sessions).toBe(2);
  });

  it("rates excellent when combined average >= 8", () => {
    const records = [
      makeQualityRecord({ staff_wellbeing_score: 9, practice_quality_score: 9 }),
    ];
    const result = computeSupervisionQuality(records);
    expect(result.quality_rating).toBe("excellent");
  });

  it("rates good when combined average >= 6 and < 8", () => {
    const records = [
      makeQualityRecord({ staff_wellbeing_score: 7, practice_quality_score: 7 }),
    ];
    const result = computeSupervisionQuality(records);
    // combined avg = (7+7)/2 = 7 => good
    expect(result.quality_rating).toBe("good");
  });

  it("rates requires_improvement when combined average >= 4 and < 6", () => {
    const records = [
      makeQualityRecord({ staff_wellbeing_score: 5, practice_quality_score: 5 }),
    ];
    const result = computeSupervisionQuality(records);
    // combined avg = (5+5)/2 = 5 => requires_improvement
    expect(result.quality_rating).toBe("requires_improvement");
  });

  it("rates inadequate when combined average < 4", () => {
    const records = [
      makeQualityRecord({ staff_wellbeing_score: 2, practice_quality_score: 3 }),
    ];
    const result = computeSupervisionQuality(records);
    // combined avg = (2+3)/2 = 2.5 => inadequate
    expect(result.quality_rating).toBe("inadequate");
  });

  it("calculates safeguarding coverage percentage", () => {
    const records = [
      makeQualityRecord({ safeguarding_discussed: true }),
      makeQualityRecord({ safeguarding_discussed: false }),
    ];
    const result = computeSupervisionQuality(records);
    expect(result.safeguarding_coverage).toBe(50);
  });
});

describe("isSupervisionOverdue", () => {
  it("returns true when no last supervision date", () => {
    expect(isSupervisionOverdue(null, "rsw", new Date())).toBe(true);
  });

  it("returns false when within frequency window", () => {
    const now = new Date("2025-05-15");
    expect(isSupervisionOverdue("2025-05-01", "rsw", now)).toBe(false);
  });

  it("returns true when outside frequency window", () => {
    const now = new Date("2025-07-01");
    expect(isSupervisionOverdue("2025-05-01", "rsw", now)).toBe(true);
  });
});

describe("computeNextDueDate", () => {
  it("adds role frequency weeks to last supervision date", () => {
    // rsw = 4 weeks
    const result = computeNextDueDate("2025-05-01", "rsw");
    expect(result).toBe("2025-05-29");
  });

  it("uses longer window for bank_staff (8 weeks)", () => {
    const result = computeNextDueDate("2025-05-01", "bank_staff");
    expect(result).toBe("2025-06-26");
  });

  it("defaults to 4 weeks for unknown roles", () => {
    const result = computeNextDueDate("2025-01-01", "unknown_role");
    expect(result).toBe("2025-01-29");
  });
});
