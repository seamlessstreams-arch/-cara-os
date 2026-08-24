// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME COMPLAINTS INTELLIGENCE ENGINE TESTS
// Tests the pure deterministic engine for complaint response timeliness,
// resolution quality, learning culture, and child voice in complaints.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeComplaints,
  type ComplaintInput,
  type HomeComplaintsInput,
} from "../home-complaints-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function daysAgo(n: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function makeComplaint(overrides: Partial<ComplaintInput> = {}): ComplaintInput {
  return {
    id: `cmp_${Math.random().toString(36).slice(2, 8)}`,
    complaint_date: daysAgo(20),
    source: "child",
    theme: "food",
    outcome: "upheld",
    response_time_days: 8,
    has_findings: true,
    has_lessons_learned: true,
    practice_changes_count: 1,
    complainant_satisfied: true,
    escalated: false,
    ofsted_notified: false,
    child_id: "yp_alex",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeComplaintsInput> = {}): HomeComplaintsInput {
  return {
    today: TODAY,
    total_children: 3,
    complaints: [],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// INSUFFICIENT DATA
// ══════════════════════════════════════════════════════════════════════════════

describe("Insufficient data", () => {
  it("returns insufficient_data when no complaints", () => {
    const r = computeHomeComplaints(baseInput());
    expect(r.complaints_rating).toBe("insufficient_data");
    expect(r.complaints_score).toBe(0);
  });

  it("includes warning insight about no complaints", () => {
    const r = computeHomeComplaints(baseInput());
    expect(r.insights.length).toBeGreaterThan(0);
    expect(r.insights[0].severity).toBe("warning");
  });

  it("includes recommendation to promote complaints procedure", () => {
    const r = computeHomeComplaints(baseInput());
    expect(r.recommendations.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// OUTSTANDING SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Outstanding scenario", () => {
  function outstandingInput(): HomeComplaintsInput {
    return baseInput({
      complaints: [
        // 3 child complaints — satisfied, resolved within 10d
        makeComplaint({ id: "c1", source: "child", response_time_days: 8, complainant_satisfied: true }),
        makeComplaint({ id: "c2", source: "child", response_time_days: 7, complainant_satisfied: true }),
        makeComplaint({ id: "c3", source: "child", response_time_days: 5, outcome: "partially_upheld", complainant_satisfied: true }),
        // 1 parent, 1 professional, 1 staff — diversified sources
        makeComplaint({ id: "c4", source: "parent_carer", response_time_days: 10, complainant_satisfied: true }),
        makeComplaint({ id: "c5", source: "professional", response_time_days: 8, outcome: "not_upheld", complainant_satisfied: true }),
        makeComplaint({ id: "c6", source: "staff", response_time_days: 6, complainant_satisfied: true }),
      ],
    });
  }

  it("rates outstanding", () => {
    const r = computeHomeComplaints(outstandingInput());
    // Within 10d: 6/6 = 100% → +5
    // Satisfaction: 6/6 = 100% → +4
    // Findings: 6/6 = 100% → +4
    // Lessons: 6/6 = 100% → +3
    // Practice changes: 6/6 = 100% → +3
    // Child complaints: 3 → +3
    // Multi-source: 4 sources (child, parent_carer, professional, staff) → +3
    // Escalation: 0/6 = 0% → +3
    // Total: 52+5+4+4+3+3+3+3+3 = 52+28 = 80
    expect(r.complaints_score).toBe(80);
    expect(r.complaints_rating).toBe("outstanding");
  });

  it("has strengths in outstanding", () => {
    const r = computeHomeComplaints(outstandingInput());
    expect(r.strengths.length).toBeGreaterThanOrEqual(5);
  });

  it("has no concerns in outstanding", () => {
    const r = computeHomeComplaints(outstandingInput());
    expect(r.concerns.length).toBe(0);
  });

  it("has positive insights in outstanding", () => {
    const r = computeHomeComplaints(outstandingInput());
    expect(r.insights.some(i => i.severity === "positive")).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GOOD SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Good scenario", () => {
  it("rates good with moderate compliance", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", source: "child", response_time_days: 8, complainant_satisfied: true }),
        makeComplaint({ id: "c2", source: "child", response_time_days: 15, complainant_satisfied: false, has_lessons_learned: false }),
        makeComplaint({ id: "c3", source: "parent_carer", response_time_days: 10, complainant_satisfied: true }),
        makeComplaint({ id: "c4", source: "professional", response_time_days: 8, outcome: "not_upheld", complainant_satisfied: null }),
        makeComplaint({ id: "c5", source: "staff", response_time_days: 9, complainant_satisfied: true, escalated: true }),
      ],
    }));
    // Within 10d: c1(8),c3(10),c4(8),c5(9) = 4/5 = 80% → +5
    // Satisfaction: c1(true),c2(false),c3(true),c5(true) = 3/4 with non-null = 75% → +2
    // Findings: 5/5 = 100% → +4
    // Lessons: 4/5 = 80% → +3
    // Practice changes: 5/5 = 100% → +3 (≥60%)
    // Child: 2 → +3
    // Multi-source: 4 → +3
    // Escalation: 1/5 = 20% → ≤25% → +1
    // Total: 52+5+2+4+3+3+3+3+1 = 52+24 = 76
    expect(r.complaints_score).toBe(76);
    expect(r.complaints_rating).toBe("good");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Adequate scenario", () => {
  it("rates adequate with gaps", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", source: "parent_carer", response_time_days: 15, complainant_satisfied: false, has_findings: false, has_lessons_learned: false, practice_changes_count: 0 }),
        makeComplaint({ id: "c2", source: "professional", response_time_days: 12, complainant_satisfied: true, has_lessons_learned: false, practice_changes_count: 0 }),
        makeComplaint({ id: "c3", source: "child", response_time_days: 8, complainant_satisfied: true }),
        makeComplaint({ id: "c4", source: "anonymous", response_time_days: 20, complainant_satisfied: null, has_findings: false, has_lessons_learned: false, practice_changes_count: 0 }),
      ],
    }));
    // Within 10d: c3(8) = 1/4 = 25% → <60 → -3
    // Satisfaction: c1(false),c2(true),c3(true) = 2/3 = 67% → ≥60 → +2
    // Findings: c3,c2 = 2/4 = 50% → <60 → -3
    // Lessons: c3 = 1/4 = 25% → <60 → -2
    // Practice changes: c3 = 1/4 = 25% → <40 → -2
    // Child: 1 → +2
    // Multi-source: 4 (parent_carer, professional, child, anonymous) → +3
    // Escalation: 0/4 = 0% → +3
    // Total: 52-3+2-3-2-2+2+3+3 = 52+0 = 52
    expect(r.complaints_score).toBe(52);
    expect(r.complaints_rating).toBe("adequate");
  });

  it("has concerns in adequate", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", source: "professional", response_time_days: 15, has_findings: false, has_lessons_learned: false }),
      ],
    }));
    expect(r.concerns.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Inadequate scenario", () => {
  it("rates inadequate with critical failures", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", source: "anonymous", response_time_days: 25, complainant_satisfied: false, has_findings: false, has_lessons_learned: false, practice_changes_count: 0, escalated: true }),
        makeComplaint({ id: "c2", source: "professional", response_time_days: 20, complainant_satisfied: false, has_findings: false, has_lessons_learned: false, practice_changes_count: 0, escalated: true }),
      ],
    }));
    // Within 10d: 0/2 = 0% → -3
    // Satisfaction: 0/2 = 0% → -3
    // Findings: 0/2 = 0% → -3
    // Lessons: 0/2 = 0% → -2
    // Practice changes: 0/2 = 0% → -2
    // Child: 0 → -1
    // Multi-source: 2 (anonymous, professional) → +1
    // Escalation: 2/2 = 100% → -2
    // Total: 52-3-3-3-2-2-1+1-2 = 52-15 = 37
    expect(r.complaints_score).toBe(37);
    expect(r.complaints_rating).toBe("inadequate");
  });

  it("has concerns in inadequate", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", source: "anonymous", response_time_days: 25, complainant_satisfied: false, has_findings: false, has_lessons_learned: false, practice_changes_count: 0, escalated: true }),
      ],
    }));
    expect(r.concerns.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// RESPONSE PROFILE
// ══════════════════════════════════════════════════════════════════════════════

describe("Response profile", () => {
  it("counts total, resolved, and ongoing", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", outcome: "upheld" }),
        makeComplaint({ id: "c2", outcome: "not_upheld" }),
        makeComplaint({ id: "c3", outcome: "ongoing" }),
      ],
    }));
    expect(r.response_profile.total_complaints).toBe(3);
    expect(r.response_profile.resolved_count).toBe(2);
    expect(r.response_profile.ongoing_count).toBe(1);
  });

  it("calculates avg response time from resolved only", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", response_time_days: 8 }),
        makeComplaint({ id: "c2", response_time_days: 12 }),
        makeComplaint({ id: "c3", outcome: "ongoing", response_time_days: 0 }),
      ],
    }));
    expect(r.response_profile.avg_response_time_days).toBe(10);
  });

  it("calculates within 10 days rate", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", response_time_days: 8 }),
        makeComplaint({ id: "c2", response_time_days: 15 }),
        makeComplaint({ id: "c3", response_time_days: 5 }),
      ],
    }));
    expect(r.response_profile.within_10_days_rate).toBe(67);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// OUTCOME PROFILE
// ══════════════════════════════════════════════════════════════════════════════

describe("Outcome profile", () => {
  it("counts outcomes correctly", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", outcome: "upheld" }),
        makeComplaint({ id: "c2", outcome: "upheld" }),
        makeComplaint({ id: "c3", outcome: "partially_upheld" }),
        makeComplaint({ id: "c4", outcome: "not_upheld" }),
      ],
    }));
    expect(r.outcome_profile.upheld_count).toBe(2);
    expect(r.outcome_profile.partially_upheld_count).toBe(1);
    expect(r.outcome_profile.not_upheld_count).toBe(1);
  });

  it("calculates satisfaction from non-null only", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", complainant_satisfied: true }),
        makeComplaint({ id: "c2", complainant_satisfied: false }),
        makeComplaint({ id: "c3", complainant_satisfied: null }),
      ],
    }));
    expect(r.outcome_profile.satisfaction_rate).toBe(50);
  });

  it("counts escalations", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", escalated: true }),
        makeComplaint({ id: "c2", escalated: false }),
        makeComplaint({ id: "c3", escalated: true }),
      ],
    }));
    expect(r.outcome_profile.escalation_count).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// LEARNING PROFILE
// ══════════════════════════════════════════════════════════════════════════════

describe("Learning profile", () => {
  it("calculates findings rate from resolved", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", has_findings: true }),
        makeComplaint({ id: "c2", has_findings: false }),
        makeComplaint({ id: "c3", outcome: "ongoing", has_findings: false }), // excluded from resolved
      ],
    }));
    expect(r.learning_profile.findings_documented_rate).toBe(50);
  });

  it("calculates practice change rate", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", practice_changes_count: 2 }),
        makeComplaint({ id: "c2", practice_changes_count: 0 }),
        makeComplaint({ id: "c3", practice_changes_count: 1 }),
      ],
    }));
    expect(r.learning_profile.practice_change_rate).toBe(67);
    expect(r.learning_profile.total_practice_changes).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SOURCE BREAKDOWN
// ══════════════════════════════════════════════════════════════════════════════

describe("Source breakdown", () => {
  it("counts sources correctly", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", source: "child" }),
        makeComplaint({ id: "c2", source: "child" }),
        makeComplaint({ id: "c3", source: "parent_carer" }),
        makeComplaint({ id: "c4", source: "staff" }),
        makeComplaint({ id: "c5", source: "anonymous" }),
      ],
    }));
    expect(r.source_breakdown.child).toBe(2);
    expect(r.source_breakdown.parent_carer).toBe(1);
    expect(r.source_breakdown.staff).toBe(1);
    expect(r.source_breakdown.anonymous).toBe(1);
    expect(r.source_breakdown.social_worker).toBe(0);
    expect(r.source_breakdown.professional).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// STRENGTHS, CONCERNS, RECOMMENDATIONS, INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Strengths", () => {
  it("highlights fast resolution", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: Array.from({ length: 5 }, (_, i) =>
        makeComplaint({ id: `c${i}`, response_time_days: 7 }),
      ),
    }));
    expect(r.strengths.some(s => s.includes("10 days") || s.includes("resolved"))).toBe(true);
  });

  it("highlights child complaints as empowerment", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", source: "child" }),
        makeComplaint({ id: "c2", source: "child" }),
      ],
    }));
    expect(r.strengths.some(s => s.includes("children") || s.includes("child"))).toBe(true);
  });
});

describe("Concerns", () => {
  it("flags slow resolution", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", response_time_days: 15 }),
        makeComplaint({ id: "c2", response_time_days: 20 }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("10 days") || c.includes("timely"))).toBe(true);
  });

  it("flags no child complaints", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", source: "professional" }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("child") || c.includes("children"))).toBe(true);
  });

  it("flags multiple escalations", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", escalated: true }),
        makeComplaint({ id: "c2", escalated: true }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("escalat"))).toBe(true);
  });
});

describe("Recommendations", () => {
  it("recommends faster resolution when slow", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", response_time_days: 20 }),
        makeComplaint({ id: "c2", response_time_days: 25 }),
      ],
    }));
    expect(r.recommendations.some(rc => rc.regulatory_ref === "Reg 39")).toBe(true);
  });
});

describe("Insights", () => {
  it("generates warning when no child complaints", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", source: "professional" }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "warning")).toBe(true);
  });

  it("generates positive insight for comprehensive complaints culture", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: Array.from({ length: 5 }, (_, i) =>
        makeComplaint({ id: `c${i}`, response_time_days: 7 }),
      ),
    }));
    expect(r.insights.some(i => i.severity === "positive")).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles single complaint", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [makeComplaint()],
    }));
    expect(r.complaints_rating).not.toBe("insufficient_data");
  });

  it("handles all ongoing complaints", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", outcome: "ongoing", response_time_days: 0 }),
        makeComplaint({ id: "c2", outcome: "ongoing", response_time_days: 0 }),
      ],
    }));
    expect(r.response_profile.resolved_count).toBe(0);
    expect(r.response_profile.ongoing_count).toBe(2);
  });

  it("score is clamped to 0-100", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: Array.from({ length: 10 }, (_, i) =>
        makeComplaint({ id: `c${i}`, source: i < 3 ? "child" : i < 5 ? "parent_carer" : "professional" }),
      ),
    }));
    expect(r.complaints_score).toBeLessThanOrEqual(100);
    expect(r.complaints_score).toBeGreaterThanOrEqual(0);
  });

  it("handles null satisfaction correctly", () => {
    const r = computeHomeComplaints(baseInput({
      complaints: [
        makeComplaint({ id: "c1", complainant_satisfied: null }),
        makeComplaint({ id: "c2", complainant_satisfied: null }),
      ],
    }));
    // No non-null satisfaction → +1 bonus instead
    expect(r.outcome_profile.satisfaction_rate).toBeNull();
  });
});
