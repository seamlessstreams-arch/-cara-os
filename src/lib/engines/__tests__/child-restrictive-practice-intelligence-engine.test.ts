// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Child Restrictive Practice Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeChildRestrictivePractice,
  type ChildRestrictivePracticeInput,
  type RestraintInput,
} from "../child-restrictive-practice-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function daysAgo(n: number): string {
  const d = new Date("2026-05-26");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

let _id = 0;
function makeRestraint(overrides: Partial<RestraintInput> = {}): RestraintInput {
  return {
    id: `rst_${++_id}`,
    date: daysAgo(10),
    start_time: "14:30",
    end_time: "14:33",
    duration_minutes: 3,
    reason: "imminent_harm_to_others",
    restraint_type: "planned_hold",
    staff_involved: [
      { staff_id: "staff_edward", role: "lead", team_teach_trained: true },
      { staff_id: "staff_anna", role: "support", team_teach_trained: true },
    ],
    de_escalation_attempts: ["Verbal reassurance", "Offered quiet space"],
    injuries: [],
    child_debriefed: true,
    staff_debriefed: true,
    body_map_completed: true,
    medical_check_completed: false,
    review_status: "reviewed",
    reviewed_by: "staff_darren",
    linked_incident_id: "inc_001",
    notifications_sent: 2,
    has_antecedent: true,
    has_justification: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<ChildRestrictivePracticeInput> = {}): ChildRestrictivePracticeInput {
  return {
    today: TODAY,
    child_id: "yp_alex",
    child_name: "Alex",
    restraints: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Child Restrictive Practice Intelligence Engine", () => {

  // ── Output Shape ────────────────────────────────────────────────────────

  it("returns correct output shape", () => {
    const r = computeChildRestrictivePractice(baseInput());
    expect(r).toHaveProperty("generated_at");
    expect(r).toHaveProperty("child_id");
    expect(r).toHaveProperty("child_name");
    expect(r).toHaveProperty("restrictive_practice_rating");
    expect(r).toHaveProperty("restrictive_practice_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("frequency");
    expect(r).toHaveProperty("duration");
    expect(r).toHaveProperty("compliance");
    expect(r).toHaveProperty("patterns");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("sets generated_at and child details", () => {
    const r = computeChildRestrictivePractice(baseInput());
    expect(r.generated_at).toBe(TODAY);
    expect(r.child_id).toBe("yp_alex");
    expect(r.child_name).toBe("Alex");
  });

  // ── Rating ────────────────────────────────────────────────────────────

  it("rates no_restraints when no episodes exist", () => {
    const r = computeChildRestrictivePractice(baseInput());
    expect(r.restrictive_practice_rating).toBe("no_restraints");
    expect(r.restrictive_practice_score).toBe(0);
  });

  it("rates good/outstanding with few well-managed episodes", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [makeRestraint({ date: daysAgo(60), duration_minutes: 2 })],
    }));
    expect(["good", "outstanding"]).toContain(r.restrictive_practice_rating);
  });

  it("rates lower with high frequency", () => {
    const restraints = Array.from({ length: 6 }, (_, i) =>
      makeRestraint({ date: daysAgo(i + 1), review_status: "pending" })
    );
    const r = computeChildRestrictivePractice(baseInput({ restraints }));
    expect(["inadequate", "adequate"]).toContain(r.restrictive_practice_rating);
  });

  // ── Frequency ─────────────────────────────────────────────────────────

  it("counts episodes in time windows", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({ date: daysAgo(2) }),
        makeRestraint({ date: daysAgo(5) }),
        makeRestraint({ date: daysAgo(20) }),
        makeRestraint({ date: daysAgo(60) }),
        makeRestraint({ date: daysAgo(100) }), // outside 90d
      ],
    }));
    expect(r.frequency.restraints_7d).toBe(2);
    expect(r.frequency.restraints_30d).toBe(3);
    expect(r.frequency.restraints_90d).toBe(4);
    expect(r.frequency.total_restraints).toBe(5);
  });

  it("calculates days since last restraint", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [makeRestraint({ date: daysAgo(15) })],
    }));
    expect(r.frequency.days_since_last).toBe(15);
  });

  it("detects increasing frequency trend", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        // Prior 30d: 1 episode
        makeRestraint({ date: daysAgo(40) }),
        // Current 30d: 3 episodes
        makeRestraint({ date: daysAgo(5) }),
        makeRestraint({ date: daysAgo(10) }),
        makeRestraint({ date: daysAgo(15) }),
      ],
    }));
    expect(r.frequency.frequency_trend).toBe("increasing");
  });

  it("detects decreasing frequency trend", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        // Prior 30d: 3 episodes
        makeRestraint({ date: daysAgo(35) }),
        makeRestraint({ date: daysAgo(40) }),
        makeRestraint({ date: daysAgo(45) }),
        // Current 30d: 1 episode
        makeRestraint({ date: daysAgo(5) }),
      ],
    }));
    expect(r.frequency.frequency_trend).toBe("decreasing");
  });

  // ── Duration ──────────────────────────────────────────────────────────

  it("calculates duration metrics", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({ date: daysAgo(5), duration_minutes: 3 }),
        makeRestraint({ date: daysAgo(10), duration_minutes: 7 }),
        makeRestraint({ date: daysAgo(15), duration_minutes: 2 }),
      ],
    }));
    expect(r.duration.avg_duration_minutes).toBe(4);
    expect(r.duration.max_duration_minutes).toBe(7);
    expect(r.duration.min_duration_minutes).toBe(2);
  });

  it("counts long restraints (>10 min)", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({ date: daysAgo(5), duration_minutes: 12 }),
        makeRestraint({ date: daysAgo(10), duration_minutes: 3 }),
        makeRestraint({ date: daysAgo(15), duration_minutes: 15 }),
      ],
    }));
    expect(r.duration.long_restraints_count).toBe(2);
  });

  it("returns null duration metrics with no episodes", () => {
    const r = computeChildRestrictivePractice(baseInput());
    expect(r.duration.avg_duration_minutes).toBeNull();
    expect(r.duration.max_duration_minutes).toBeNull();
  });

  // ── Compliance ────────────────────────────────────────────────────────

  it("calculates debrief rates", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({ date: daysAgo(5), child_debriefed: true, staff_debriefed: true }),
        makeRestraint({ date: daysAgo(10), child_debriefed: false, staff_debriefed: true }),
        makeRestraint({ date: daysAgo(15), child_debriefed: true, staff_debriefed: false }),
      ],
    }));
    expect(r.compliance.child_debrief_rate).toBe(67); // 2/3
    expect(r.compliance.staff_debrief_rate).toBe(67);
  });

  it("calculates review completion rate", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({ date: daysAgo(5), review_status: "reviewed" }),
        makeRestraint({ date: daysAgo(10), review_status: "pending" }),
        makeRestraint({ date: daysAgo(15), review_status: "reviewed" }),
      ],
    }));
    expect(r.compliance.review_completion_rate).toBe(67);
    expect(r.compliance.pending_reviews).toBe(1);
  });

  it("calculates body map and notification rates", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({ date: daysAgo(5), body_map_completed: true, notifications_sent: 2 }),
        makeRestraint({ date: daysAgo(10), body_map_completed: false, notifications_sent: 0 }),
      ],
    }));
    expect(r.compliance.body_map_rate).toBe(50);
    expect(r.compliance.notification_rate).toBe(50);
  });

  it("calculates de-escalation documentation rate", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({ date: daysAgo(5), de_escalation_attempts: ["Verbal", "Redirect"] }),
        makeRestraint({ date: daysAgo(10), de_escalation_attempts: [] }),
      ],
    }));
    expect(r.compliance.de_escalation_documented_rate).toBe(50);
  });

  // ── Patterns ──────────────────────────────────────────────────────────

  it("builds reason breakdown", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({ date: daysAgo(5), reason: "imminent_harm_to_self" }),
        makeRestraint({ date: daysAgo(10), reason: "imminent_harm_to_others" }),
        makeRestraint({ date: daysAgo(15), reason: "imminent_harm_to_self" }),
      ],
    }));
    expect(r.patterns.by_reason.length).toBe(2);
    expect(r.patterns.by_reason[0].reason).toBe("imminent_harm_to_self");
    expect(r.patterns.by_reason[0].count).toBe(2);
  });

  it("categorises by time of day", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({ date: daysAgo(5), start_time: "09:00" }),  // morning
        makeRestraint({ date: daysAgo(10), start_time: "14:30" }), // afternoon
        makeRestraint({ date: daysAgo(15), start_time: "20:00" }), // evening
      ],
    }));
    expect(r.patterns.by_time_of_day.length).toBe(3);
  });

  it("counts unique staff involved", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({
          date: daysAgo(5),
          staff_involved: [
            { staff_id: "staff_a", role: "lead" },
            { staff_id: "staff_b", role: "support" },
          ],
        }),
        makeRestraint({
          date: daysAgo(10),
          staff_involved: [
            { staff_id: "staff_a", role: "lead" },
            { staff_id: "staff_c", role: "support" },
          ],
        }),
      ],
    }));
    expect(r.patterns.unique_staff_involved).toBe(3);
  });

  it("tracks injuries", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({
          date: daysAgo(5),
          injuries: [
            { person: "yp_alex", description: "Minor bruise" },
            { person: "staff_edward", description: "Scratch" },
          ],
        }),
      ],
    }));
    expect(r.patterns.injury_count).toBe(2);
    expect(r.patterns.child_injury_count).toBe(1);
  });

  // ── Scoring ───────────────────────────────────────────────────────────

  it("scores higher with fewer episodes", () => {
    const few = computeChildRestrictivePractice(baseInput({
      restraints: [makeRestraint({ date: daysAgo(60) })],
    }));
    const many = computeChildRestrictivePractice(baseInput({
      restraints: Array.from({ length: 5 }, (_, i) =>
        makeRestraint({ date: daysAgo(i + 1), review_status: "pending" })
      ),
    }));
    expect(few.restrictive_practice_score).toBeGreaterThan(many.restrictive_practice_score!);
  });

  it("penalises child injuries heavily", () => {
    const noInjury = computeChildRestrictivePractice(baseInput({
      restraints: [makeRestraint({ date: daysAgo(5) })],
    }));
    const withInjury = computeChildRestrictivePractice(baseInput({
      restraints: [makeRestraint({
        date: daysAgo(5),
        injuries: [{ person: "yp_alex", description: "Bruise" }],
      })],
    }));
    expect(noInjury.restrictive_practice_score).toBeGreaterThan(withInjury.restrictive_practice_score!);
  });

  it("clamps score to 0-100", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [makeRestraint({ date: daysAgo(60) })],
    }));
    expect(r.restrictive_practice_score).toBeGreaterThanOrEqual(0);
    expect(r.restrictive_practice_score).toBeLessThanOrEqual(100);
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  it("generates strength for no restraints", () => {
    const r = computeChildRestrictivePractice(baseInput());
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.strengths[0]).toContain("No restraint episodes");
  });

  it("generates strength for decreasing trend", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({ date: daysAgo(35) }),
        makeRestraint({ date: daysAgo(40) }),
        makeRestraint({ date: daysAgo(45) }),
        makeRestraint({ date: daysAgo(5) }),
      ],
    }));
    if (r.frequency.frequency_trend === "decreasing") {
      expect(r.strengths.some((s) => s.includes("decreasing"))).toBe(true);
    }
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  it("generates concern for high frequency", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: Array.from({ length: 4 }, (_, i) => makeRestraint({ date: daysAgo(i + 1) })),
    }));
    expect(r.concerns.some((c) => c.includes("frequency"))).toBe(true);
  });

  it("generates concern for child injury", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [makeRestraint({
        date: daysAgo(5),
        injuries: [{ person: "yp_alex", description: "Bruise" }],
      })],
    }));
    expect(r.concerns.some((c) => c.includes("injury"))).toBe(true);
  });

  it("generates concern for long restraints", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [makeRestraint({ date: daysAgo(5), duration_minutes: 15 })],
    }));
    expect(r.concerns.some((c) => c.includes("10 minutes"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────

  it("recommends immediate action for child injury", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [makeRestraint({
        date: daysAgo(5),
        injuries: [{ person: "yp_alex", description: "Bruise" }],
      })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("injury"))).toBe(true);
  });

  it("recommends review when pending", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({ date: daysAgo(5), review_status: "pending" }),
        makeRestraint({ date: daysAgo(10), review_status: "pending_rm" }),
      ],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("review"))).toBe(true);
  });

  // ── Insights ──────────────────────────────────────────────────────────

  it("generates critical insight for high frequency", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: Array.from({ length: 4 }, (_, i) => makeRestraint({ date: daysAgo(i + 1) })),
    }));
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
  });

  it("generates positive insight for no restraints", () => {
    const r = computeChildRestrictivePractice(baseInput());
    expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
  });

  it("generates positive insight for decreasing trend", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [
        makeRestraint({ date: daysAgo(35) }),
        makeRestraint({ date: daysAgo(40) }),
        makeRestraint({ date: daysAgo(50) }),
        makeRestraint({ date: daysAgo(5) }),
      ],
    }));
    if (r.frequency.frequency_trend === "decreasing") {
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("decreasing"))).toBe(true);
    }
  });

  // ── Headline ──────────────────────────────────────────────────────────

  it("includes rating in headline", () => {
    const r = computeChildRestrictivePractice(baseInput());
    expect(r.headline).toContain("no_restraints");
  });

  it("includes episode count in headline", () => {
    const r = computeChildRestrictivePractice(baseInput({
      restraints: [makeRestraint({ date: daysAgo(10) })],
    }));
    expect(r.headline).toContain("episode");
  });
});
