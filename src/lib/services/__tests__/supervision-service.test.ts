// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SUPERVISION SERVICE TESTS
// Pure-function unit tests for supervision compliance, quality scoring,
// overdue detection, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../supervision-service";

const {
  computeSupervisionCompliance,
  computeSupervisionQuality,
  isSupervisionOverdue,
  computeNextDueDate,
  SUPERVISION_FREQUENCIES,
  SUPERVISION_AGENDA_TEMPLATE,
} = _testing;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Fixed "now" for deterministic date tests. */
const NOW = new Date("2026-06-01T00:00:00Z");

/** Build a minimal supervision record for compliance tests. */
function rec(staff_id: string, status: string, completed_date: string | null) {
  return { staff_id, status, completed_date };
}

/** Build a minimal staff list entry. */
function staff(id: string, role: string) {
  return { id, role };
}

/** Build a quality record. */
function quality(
  wellbeing: number | null,
  practice: number | null,
  safeguarding: boolean,
) {
  return {
    staff_wellbeing_score: wellbeing,
    practice_quality_score: practice,
    safeguarding_discussed: safeguarding,
  };
}

// ── computeSupervisionCompliance ─────────────────────────────────────────────

describe("computeSupervisionCompliance", () => {
  it("returns zero stats for empty inputs", () => {
    const result = computeSupervisionCompliance([], [], NOW);
    expect(result.total_staff).toBe(0);
    expect(result.supervised_in_period).toBe(0);
    expect(result.overdue).toBe(0);
    expect(result.never_supervised).toBe(0);
    expect(result.compliance_percentage).toBe(0);
  });

  it("marks staff as never_supervised when no records exist", () => {
    const staffList = [staff("s1", "rsw"), staff("s2", "rsw")];
    const result = computeSupervisionCompliance([], staffList, NOW);
    expect(result.never_supervised).toBe(2);
    expect(result.overdue).toBe(2);
    expect(result.supervised_in_period).toBe(0);
  });

  it("counts staff as supervised when completed within frequency window", () => {
    // rsw = 4 weeks. 2026-06-01 - 14 days = 2026-05-18 (within 4 weeks)
    const records = [rec("s1", "completed", "2026-05-18")];
    const staffList = [staff("s1", "rsw")];
    const result = computeSupervisionCompliance(records, staffList, NOW);
    expect(result.supervised_in_period).toBe(1);
    expect(result.overdue).toBe(0);
    expect(result.compliance_percentage).toBe(100);
  });

  it("marks staff as overdue when last supervision exceeds frequency", () => {
    // rsw = 4 weeks (28 days). 2026-06-01 - 60 days = 2026-04-02 (overdue by ~32 days)
    const records = [rec("s1", "completed", "2026-04-02")];
    const staffList = [staff("s1", "rsw")];
    const result = computeSupervisionCompliance(records, staffList, NOW);
    expect(result.supervised_in_period).toBe(0);
    expect(result.overdue).toBe(1);
    expect(result.overdue_staff[0].staff_id).toBe("s1");
    expect(result.overdue_staff[0].days_overdue).toBeGreaterThan(0);
  });

  it("uses role-specific frequency for different roles", () => {
    // night_staff = 6 weeks. 5 weeks ago = within window
    const fiveWeeksAgo = new Date(NOW.getTime() - 5 * 7 * 86400000);
    const records = [rec("s1", "completed", fiveWeeksAgo.toISOString().split("T")[0])];
    const staffList = [staff("s1", "night_staff")];
    const result = computeSupervisionCompliance(records, staffList, NOW);
    expect(result.supervised_in_period).toBe(1);
  });

  it("defaults to 4 weeks for unknown roles", () => {
    // 3 weeks ago = within default 4-week window
    const threeWeeksAgo = new Date(NOW.getTime() - 3 * 7 * 86400000);
    const records = [rec("s1", "completed", threeWeeksAgo.toISOString().split("T")[0])];
    const staffList = [staff("s1", "unknown_role")];
    const result = computeSupervisionCompliance(records, staffList, NOW);
    expect(result.supervised_in_period).toBe(1);
  });

  it("calculates compliance_percentage across mixed staff", () => {
    const records = [
      rec("s1", "completed", "2026-05-20"), // recent — compliant
      rec("s2", "completed", "2026-03-01"), // old — overdue
    ];
    const staffList = [staff("s1", "rsw"), staff("s2", "rsw")];
    const result = computeSupervisionCompliance(records, staffList, NOW);
    expect(result.total_staff).toBe(2);
    expect(result.supervised_in_period).toBe(1);
    expect(result.overdue).toBe(1);
    expect(result.compliance_percentage).toBe(50);
  });

  it("ignores non-completed records", () => {
    const records = [
      rec("s1", "scheduled", "2026-05-20"),
      rec("s1", "cancelled", "2026-05-15"),
    ];
    const staffList = [staff("s1", "rsw")];
    const result = computeSupervisionCompliance(records, staffList, NOW);
    expect(result.never_supervised).toBe(1);
  });

  it("uses the most recent completed record for each staff member", () => {
    const records = [
      rec("s1", "completed", "2026-03-01"), // old
      rec("s1", "completed", "2026-05-25"), // recent — within window
    ];
    const staffList = [staff("s1", "rsw")];
    const result = computeSupervisionCompliance(records, staffList, NOW);
    expect(result.supervised_in_period).toBe(1);
  });
});

// ── computeSupervisionQuality ────────────────────────────────────────────────

describe("computeSupervisionQuality", () => {
  it("returns inadequate with zeros for empty records", () => {
    const result = computeSupervisionQuality([]);
    expect(result.avg_wellbeing).toBe(0);
    expect(result.avg_practice).toBe(0);
    expect(result.safeguarding_coverage).toBe(0);
    expect(result.total_sessions).toBe(0);
    expect(result.quality_rating).toBe("inadequate");
  });

  it("returns excellent when averages >= 8", () => {
    const records = [
      quality(9, 8, true),
      quality(8, 9, true),
    ];
    const result = computeSupervisionQuality(records);
    expect(result.quality_rating).toBe("excellent");
    expect(result.safeguarding_coverage).toBe(100);
  });

  it("returns good when averages >= 6 but < 8", () => {
    const records = [
      quality(7, 6, true),
      quality(6, 7, false),
    ];
    const result = computeSupervisionQuality(records);
    expect(result.quality_rating).toBe("good");
  });

  it("returns requires_improvement when averages >= 4 but < 6", () => {
    const records = [
      quality(5, 4, false),
      quality(4, 5, false),
    ];
    const result = computeSupervisionQuality(records);
    expect(result.quality_rating).toBe("requires_improvement");
  });

  it("returns inadequate when averages < 4", () => {
    const records = [
      quality(2, 3, false),
      quality(3, 2, false),
    ];
    const result = computeSupervisionQuality(records);
    expect(result.quality_rating).toBe("inadequate");
  });

  it("calculates safeguarding_coverage correctly", () => {
    const records = [
      quality(7, 7, true),
      quality(7, 7, false),
      quality(7, 7, true),
      quality(7, 7, false),
    ];
    const result = computeSupervisionQuality(records);
    expect(result.safeguarding_coverage).toBe(50);
    expect(result.total_sessions).toBe(4);
  });

  it("handles null scores gracefully", () => {
    const records = [
      quality(null, 8, true),
      quality(7, null, false),
    ];
    const result = computeSupervisionQuality(records);
    expect(result.avg_wellbeing).toBe(7);
    expect(result.avg_practice).toBe(8);
  });

  it("rounds averages to 1 decimal place", () => {
    const records = [
      quality(7, 8, true),
      quality(8, 7, true),
      quality(6, 9, true),
    ];
    const result = computeSupervisionQuality(records);
    expect(result.avg_wellbeing).toBe(7);
    expect(result.avg_practice).toBe(8);
  });
});

// ── isSupervisionOverdue ─────────────────────────────────────────────────────

describe("isSupervisionOverdue", () => {
  it("returns true when lastSupervisionDate is null", () => {
    expect(isSupervisionOverdue(null, "rsw", NOW)).toBe(true);
  });

  it("returns false when within frequency window", () => {
    // rsw = 4 weeks; 2 weeks ago = not overdue
    expect(isSupervisionOverdue("2026-05-18", "rsw", NOW)).toBe(false);
  });

  it("returns true when beyond frequency window", () => {
    // rsw = 4 weeks; 5 weeks ago = overdue
    const fiveWeeksAgo = new Date(NOW.getTime() - 5 * 7 * 86400000).toISOString().split("T")[0];
    expect(isSupervisionOverdue(fiveWeeksAgo, "rsw", NOW)).toBe(true);
  });

  it("respects role-specific frequency", () => {
    // bank_staff = 8 weeks; 7 weeks ago = not overdue
    const sevenWeeksAgo = new Date(NOW.getTime() - 7 * 7 * 86400000).toISOString().split("T")[0];
    expect(isSupervisionOverdue(sevenWeeksAgo, "bank_staff", NOW)).toBe(false);
  });
});

// ── computeNextDueDate ───────────────────────────────────────────────────────

describe("computeNextDueDate", () => {
  it("computes next date based on role frequency", () => {
    // rsw = 4 weeks from 2026-05-01 → 2026-05-29
    const result = computeNextDueDate("2026-05-01", "rsw");
    expect(result).toBe("2026-05-29");
  });

  it("uses role-specific weeks for night_staff", () => {
    // night_staff = 6 weeks from 2026-05-01 → 2026-06-12
    const result = computeNextDueDate("2026-05-01", "night_staff");
    expect(result).toBe("2026-06-12");
  });

  it("defaults to 4 weeks for unknown roles", () => {
    const result = computeNextDueDate("2026-05-01", "unknown");
    expect(result).toBe("2026-05-29");
  });
});

// ── Constants ────────────────────────────────────────────────────────────────

describe("SUPERVISION_FREQUENCIES", () => {
  it("has 7 role entries", () => {
    expect(Object.keys(SUPERVISION_FREQUENCIES)).toHaveLength(7);
  });

  it("all values are positive numbers in weeks", () => {
    for (const weeks of Object.values(SUPERVISION_FREQUENCIES)) {
      expect(typeof weeks).toBe("number");
      expect(weeks).toBeGreaterThan(0);
      expect(weeks).toBeLessThanOrEqual(12);
    }
  });

  it("rsw has 4-week frequency per Reg 33", () => {
    expect(SUPERVISION_FREQUENCIES["rsw"]).toBe(4);
  });
});

describe("SUPERVISION_AGENDA_TEMPLATE", () => {
  it("has exactly 10 items", () => {
    expect(SUPERVISION_AGENDA_TEMPLATE).toHaveLength(10);
  });

  it("all items are non-empty strings", () => {
    for (const item of SUPERVISION_AGENDA_TEMPLATE) {
      expect(typeof item).toBe("string");
      expect(item.length).toBeGreaterThan(0);
    }
  });

  it("includes safeguarding as first item", () => {
    expect(SUPERVISION_AGENDA_TEMPLATE[0]).toContain("Safeguarding");
  });
});
