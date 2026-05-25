// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — QUALITY ASSURANCE INTELLIGENCE ENGINE — TESTS
//
// Comprehensive test suite for the quality assurance intelligence engine.
// Reg 45 (quality of care review), SCCIF Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeQualityAssuranceIntelligence,
  daysBetween,
  type QAAuditInput,
  type QAAuditActionInput,
  type StaffRef,
} from "../quality-assurance-intelligence-engine";

// ── Constants ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren" },
  { id: "staff_ryan", name: "Ryan" },
];

// ── Factory Helpers ─────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `qa_${++_id}`;
}

function makeAction(overrides: Partial<QAAuditActionInput> = {}): QAAuditActionInput {
  return {
    action: "Complete training",
    owner: "Darren",
    deadline: "2026-05-01",
    status: "completed",
    ...overrides,
  };
}

function makeAudit(overrides: Partial<QAAuditInput> = {}): QAAuditInput {
  return {
    id: overrides.id ?? uid(),
    title: "Test Audit",
    date: "2026-05-20",
    auditor: "Darren",
    scope: "general",
    overall_rating: "good",
    score: 3,
    findings: ["Finding 1"],
    strengths: ["Strength 1", "Strength 2"],
    areas_for_improvement: ["Improvement 1"],
    actions: [makeAction(), makeAction()],
    ...overrides,
  };
}

function daysAgo(days: number): string {
  const d = new Date("2026-05-25T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function run(
  audits: QAAuditInput[] = [],
  staff: StaffRef[] = STAFF,
  today: string = TODAY
) {
  return computeQualityAssuranceIntelligence({ audits, staff, today });
}

// ── Oak House Test Data ─────────────────────────────────────────────────────

function oakHouseAudits(): QAAuditInput[] {
  return [
    makeAudit({
      id: "qa_001",
      title: "Medication Management",
      scope: "medication",
      overall_rating: "excellent",
      score: 4,
      date: daysAgo(60),
      strengths: ["Excellent MAR records", "Good stock control", "Timely admin"],
      areas_for_improvement: ["Update protocols"],
      findings: ["All meds administered on time"],
      actions: [
        makeAction({ action: "Update medication protocols", owner: "Darren", deadline: daysAgo(30), status: "completed" }),
        makeAction({ action: "Train new staff on MAR", owner: "Ryan", deadline: daysAgo(30), status: "completed" }),
      ],
    }),
    makeAudit({
      id: "qa_002",
      title: "Safeguarding Practice",
      scope: "safeguarding",
      overall_rating: "good",
      score: 3,
      date: daysAgo(45),
      strengths: ["Strong whistleblowing culture", "Good multi-agency links"],
      areas_for_improvement: ["Recording timeliness", "Update safeguarding policy"],
      findings: ["One delayed referral noted", "Training up to date"],
      actions: [
        makeAction({ action: "Improve referral speed", owner: "Darren", deadline: daysAgo(20), status: "completed" }),
        makeAction({ action: "Update safeguarding policy", owner: "Ryan", deadline: daysAgo(15), status: "completed" }),
        makeAction({ action: "Train agency staff", owner: "Ryan", deadline: daysAgo(10), status: "overdue" }),
      ],
    }),
    makeAudit({
      id: "qa_003",
      title: "Daily Recording Quality",
      scope: "recording",
      overall_rating: "requires_improvement",
      score: 2,
      date: daysAgo(30),
      strengths: ["Consistent daily entries"],
      areas_for_improvement: ["Lack of analysis", "Poor child voice", "Repetitive language"],
      findings: ["50% of records lack depth", "Child voice missing in 30%"],
      actions: [
        makeAction({ action: "Recording quality training", owner: "Darren", deadline: daysAgo(15), status: "completed" }),
        makeAction({ action: "Implement recording templates", owner: "Ryan", deadline: daysAgo(5), status: "in_progress" }),
        makeAction({ action: "Monthly recording audits", owner: "Darren", deadline: daysAgo(10), status: "in_progress" }),
        makeAction({ action: "Peer review recordings", owner: "Ryan", deadline: daysAgo(7), status: "overdue" }),
      ],
    }),
    makeAudit({
      id: "qa_004",
      title: "Health & Safety",
      scope: "health_safety",
      overall_rating: "excellent",
      score: 4,
      date: daysAgo(20),
      strengths: ["Excellent fire safety", "Good risk awareness", "Clean environment"],
      areas_for_improvement: ["Garden maintenance"],
      findings: ["All checks up to date"],
      actions: [
        makeAction({ action: "Schedule garden maintenance", owner: "Darren", deadline: daysAgo(5), status: "completed" }),
        makeAction({ action: "Update H&S policy", owner: "Ryan", deadline: daysAgo(5), status: "completed" }),
      ],
    }),
    makeAudit({
      id: "qa_005",
      title: "Care Planning",
      scope: "care_planning",
      overall_rating: "good",
      score: 3,
      date: daysAgo(10),
      strengths: ["Person-centred plans", "Good multi-agency input"],
      areas_for_improvement: ["Review frequency"],
      findings: ["Plans reviewed within timeframe", "One plan overdue"],
      actions: [
        makeAction({ action: "Update care plan review schedule", owner: "Darren", deadline: daysAgo(3), status: "completed" }),
        makeAction({ action: "Train staff on SMART targets", owner: "Ryan", deadline: daysAgo(1), status: "completed" }),
        makeAction({ action: "Review all care plans", owner: "Darren", deadline: "2026-06-01", status: "pending" }),
      ],
    }),
    makeAudit({
      id: "qa_006",
      title: "Fire Safety",
      scope: "fire_safety",
      overall_rating: "good",
      score: 3,
      date: daysAgo(5),
      strengths: ["Regular drills", "Good documentation"],
      areas_for_improvement: ["Night drill coverage"],
      findings: ["All equipment serviced"],
      actions: [
        makeAction({ action: "Schedule night drill", owner: "Ryan", deadline: "2026-06-15", status: "completed" }),
      ],
    }),
  ];
}

// ── Helper Tests ────────────────────────────────────────────────────────────

describe("helpers", () => {
  it("daysBetween calculates correctly", () => {
    expect(daysBetween("2026-05-01", "2026-05-10")).toBe(9);
  });

  it("daysBetween returns 0 for same date", () => {
    expect(daysBetween("2026-05-25", "2026-05-25")).toBe(0);
  });

  it("daysBetween handles negative (future to past)", () => {
    expect(daysBetween("2026-05-30", "2026-05-25")).toBe(-5);
  });
});

// ── Empty State ─────────────────────────────────────────────────────────────

describe("empty state", () => {
  it("returns zeroed overview with no audits", () => {
    const r = run([]);
    expect(r.overview.total_audits).toBe(0);
    expect(r.overview.avg_rating_score).toBe(0);
    expect(r.overview.avg_rating_label).toBe("Inadequate");
    expect(r.overview.total_actions).toBe(0);
    expect(r.overview.actions_completed).toBe(0);
    expect(r.overview.actions_overdue).toBe(0);
    expect(r.overview.recommendation_completion_rate).toBe(100);
    expect(r.overview.audits_last_90_days).toBe(0);
    expect(r.overview.strengths_count).toBe(0);
    expect(r.overview.improvements_count).toBe(0);
  });

  it("returns empty arrays", () => {
    const r = run([]);
    expect(r.audit_areas).toEqual([]);
    expect(r.overdue_actions).toEqual([]);
    expect(r.alerts).toEqual([]);
    expect(r.insights).toEqual([]);
  });
});

// ── Overview ────────────────────────────────────────────────────────────────

describe("overview", () => {
  it("counts total audits", () => {
    const r = run(oakHouseAudits());
    expect(r.overview.total_audits).toBe(6);
  });

  it("calculates avg_rating_score correctly", () => {
    const r = run(oakHouseAudits());
    // excellent=4, good=3, requires_improvement=2, excellent=4, good=3, good=3
    // (4+3+2+4+3+3)/6 = 19/6 = 3.17
    expect(r.overview.avg_rating_score).toBeCloseTo(3.17, 1);
  });

  it("assigns avg_rating_label Good for Oak House avg", () => {
    const r = run(oakHouseAudits());
    expect(r.overview.avg_rating_label).toBe("Good");
  });

  it("counts total actions across all audits", () => {
    const r = run(oakHouseAudits());
    // 2 + 3 + 4 + 2 + 3 + 1 = 15
    expect(r.overview.total_actions).toBe(15);
  });

  it("counts completed actions", () => {
    const r = run(oakHouseAudits());
    // qa_001: 2, qa_002: 2, qa_003: 1, qa_004: 2, qa_005: 2, qa_006: 1 = 10
    expect(r.overview.actions_completed).toBe(10);
  });

  it("counts overdue actions", () => {
    const r = run(oakHouseAudits());
    // qa_002: 1 overdue, qa_003: 1 overdue = 2
    expect(r.overview.actions_overdue).toBe(2);
  });

  it("calculates recommendation_completion_rate", () => {
    const r = run(oakHouseAudits());
    // 10/15 * 100 = 66.67 -> rounded = 67
    expect(r.overview.recommendation_completion_rate).toBe(67);
  });

  it("counts audits in last 90 days", () => {
    const r = run(oakHouseAudits());
    // All 6 audits are within 90 days (max is 60 days ago)
    expect(r.overview.audits_last_90_days).toBe(6);
  });

  it("counts total strengths", () => {
    const r = run(oakHouseAudits());
    // 3 + 2 + 1 + 3 + 2 + 2 = 13
    expect(r.overview.strengths_count).toBe(13);
  });

  it("counts total improvements", () => {
    const r = run(oakHouseAudits());
    // 1 + 2 + 3 + 1 + 1 + 1 = 9
    expect(r.overview.improvements_count).toBe(9);
  });

  it("assigns Excellent label for avg >= 3.5", () => {
    const audits = [
      makeAudit({ overall_rating: "excellent", score: 4 }),
      makeAudit({ overall_rating: "excellent", score: 4 }),
    ];
    const r = run(audits);
    expect(r.overview.avg_rating_label).toBe("Excellent");
  });

  it("assigns Requires Improvement label for avg >= 1.5 and < 2.5", () => {
    const audits = [
      makeAudit({ overall_rating: "requires_improvement", score: 2 }),
      makeAudit({ overall_rating: "requires_improvement", score: 2 }),
    ];
    const r = run(audits);
    expect(r.overview.avg_rating_label).toBe("Requires Improvement");
  });

  it("assigns Inadequate label for avg < 1.5", () => {
    const audits = [
      makeAudit({ overall_rating: "inadequate", score: 1 }),
    ];
    const r = run(audits);
    expect(r.overview.avg_rating_label).toBe("Inadequate");
  });

  it("returns 100% completion rate when no actions", () => {
    const audits = [makeAudit({ actions: [] })];
    const r = run(audits);
    expect(r.overview.recommendation_completion_rate).toBe(100);
  });

  it("excludes audits outside 90-day window", () => {
    const audits = [
      makeAudit({ date: daysAgo(100) }),
      makeAudit({ date: daysAgo(50) }),
    ];
    const r = run(audits);
    expect(r.overview.audits_last_90_days).toBe(1);
  });
});

// ── Audit Areas ─────────────────────────────────────────────────────────────

describe("audit areas", () => {
  it("groups audits by scope", () => {
    const r = run(oakHouseAudits());
    expect(r.audit_areas.length).toBe(6);
  });

  it("calculates correct audit_count per scope", () => {
    const audits = [
      makeAudit({ scope: "medication" }),
      makeAudit({ scope: "medication" }),
      makeAudit({ scope: "safety" }),
    ];
    const r = run(audits);
    const med = r.audit_areas.find((a) => a.scope === "medication");
    expect(med?.audit_count).toBe(2);
  });

  it("calculates avg_rating per scope", () => {
    const audits = [
      makeAudit({ scope: "medication", overall_rating: "excellent" }),
      makeAudit({ scope: "medication", overall_rating: "good" }),
    ];
    const r = run(audits);
    const med = r.audit_areas.find((a) => a.scope === "medication");
    // (4+3)/2 = 3.5 => Excellent
    expect(med?.avg_rating).toBe("Excellent");
  });

  it("identifies latest_date per scope", () => {
    const audits = [
      makeAudit({ scope: "medication", date: "2026-05-01" }),
      makeAudit({ scope: "medication", date: "2026-05-15" }),
    ];
    const r = run(audits);
    const med = r.audit_areas.find((a) => a.scope === "medication");
    expect(med?.latest_date).toBe("2026-05-15");
  });

  it("sorts areas alphabetically by scope", () => {
    const audits = [
      makeAudit({ scope: "zebra" }),
      makeAudit({ scope: "alpha" }),
      makeAudit({ scope: "middle" }),
    ];
    const r = run(audits);
    expect(r.audit_areas[0].scope).toBe("alpha");
    expect(r.audit_areas[1].scope).toBe("middle");
    expect(r.audit_areas[2].scope).toBe("zebra");
  });

  it("handles single audit per scope", () => {
    const audits = [makeAudit({ scope: "unique_scope", overall_rating: "good" })];
    const r = run(audits);
    const area = r.audit_areas.find((a) => a.scope === "unique_scope");
    expect(area?.audit_count).toBe(1);
    expect(area?.avg_rating).toBe("Good");
  });
});

// ── Overdue Actions ─────────────────────────────────────────────────────────

describe("overdue actions", () => {
  it("identifies overdue actions in Oak House data", () => {
    const r = run(oakHouseAudits());
    expect(r.overdue_actions.length).toBe(2);
  });

  it("calculates days_overdue correctly", () => {
    const audits = [
      makeAudit({
        title: "Test",
        actions: [
          makeAction({ action: "Fix it", deadline: daysAgo(10), status: "overdue" }),
        ],
      }),
    ];
    const r = run(audits);
    expect(r.overdue_actions[0].days_overdue).toBe(10);
  });

  it("includes audit title for context", () => {
    const audits = [
      makeAudit({
        title: "Medication Audit",
        actions: [makeAction({ status: "overdue", deadline: daysAgo(5) })],
      }),
    ];
    const r = run(audits);
    expect(r.overdue_actions[0].audit_title).toBe("Medication Audit");
  });

  it("includes owner information", () => {
    const audits = [
      makeAudit({
        actions: [makeAction({ owner: "Darren", status: "overdue", deadline: daysAgo(3) })],
      }),
    ];
    const r = run(audits);
    expect(r.overdue_actions[0].owner).toBe("Darren");
  });

  it("sorts by most overdue first", () => {
    const audits = [
      makeAudit({
        actions: [
          makeAction({ action: "Recent", deadline: daysAgo(3), status: "overdue" }),
          makeAction({ action: "Old", deadline: daysAgo(20), status: "overdue" }),
        ],
      }),
    ];
    const r = run(audits);
    expect(r.overdue_actions[0].action).toBe("Old");
    expect(r.overdue_actions[1].action).toBe("Recent");
  });

  it("does not include non-overdue actions", () => {
    const audits = [
      makeAudit({
        actions: [
          makeAction({ status: "completed" }),
          makeAction({ status: "in_progress" }),
          makeAction({ status: "pending" }),
        ],
      }),
    ];
    const r = run(audits);
    expect(r.overdue_actions.length).toBe(0);
  });

  it("handles zero days_overdue for deadline = today", () => {
    const audits = [
      makeAudit({
        actions: [makeAction({ deadline: TODAY, status: "overdue" })],
      }),
    ];
    const r = run(audits);
    expect(r.overdue_actions[0].days_overdue).toBe(0);
  });
});

// ── Alerts ──────────────────────────────────────────────────────────────────

describe("alerts", () => {
  it("generates critical alert for inadequate rating", () => {
    const audits = [makeAudit({ title: "Bad Audit", overall_rating: "inadequate" })];
    const r = run(audits);
    const critical = r.alerts.filter((a) => a.severity === "critical");
    expect(critical.length).toBe(1);
    expect(critical[0].message).toContain("Bad Audit");
    expect(critical[0].message).toContain("Inadequate");
  });

  it("generates high alert for actions overdue > 14 days", () => {
    const audits = [
      makeAudit({
        title: "Old Issues",
        actions: [makeAction({ action: "Long overdue task", deadline: daysAgo(20), status: "overdue" })],
      }),
    ];
    const r = run(audits);
    const high = r.alerts.filter((a) => a.severity === "high");
    expect(high.some((a) => a.message.includes("20 days overdue"))).toBe(true);
  });

  it("generates high alert for scope not audited in >90 days", () => {
    const audits = [makeAudit({ scope: "old_scope", date: daysAgo(95) })];
    const r = run(audits);
    const high = r.alerts.filter((a) => a.severity === "high");
    expect(high.some((a) => a.message.includes("old_scope"))).toBe(true);
  });

  it("generates medium alert for completion rate < 70%", () => {
    const audits = [
      makeAudit({
        actions: [
          makeAction({ status: "completed" }),
          makeAction({ status: "pending" }),
          makeAction({ status: "pending" }),
          makeAction({ status: "pending" }),
        ],
      }),
    ];
    const r = run(audits);
    const medium = r.alerts.filter((a) => a.severity === "medium");
    expect(medium.some((a) => a.message.includes("below 70%"))).toBe(true);
  });

  it("generates medium alert for actions overdue <= 14 days", () => {
    const audits = [
      makeAudit({
        title: "Recent Issue",
        actions: [makeAction({ action: "Short overdue", deadline: daysAgo(7), status: "overdue" })],
      }),
    ];
    const r = run(audits);
    const medium = r.alerts.filter((a) => a.severity === "medium");
    expect(medium.some((a) => a.message.includes("7 days overdue"))).toBe(true);
  });

  it("generates low alert when latest audit has more improvements than strengths", () => {
    const audits = [
      makeAudit({
        title: "Weak Audit",
        date: daysAgo(5),
        strengths: ["One strength"],
        areas_for_improvement: ["Issue 1", "Issue 2", "Issue 3"],
      }),
    ];
    const r = run(audits);
    const low = r.alerts.filter((a) => a.severity === "low");
    expect(low.some((a) => a.message.includes("Weak Audit"))).toBe(true);
  });

  it("does not generate low alert when strengths >= improvements in latest", () => {
    const audits = [
      makeAudit({
        date: daysAgo(5),
        strengths: ["S1", "S2"],
        areas_for_improvement: ["I1"],
      }),
    ];
    const r = run(audits);
    const low = r.alerts.filter((a) => a.severity === "low");
    expect(low.length).toBe(0);
  });

  it("sorts alerts by severity (critical first)", () => {
    const audits = [
      makeAudit({
        title: "Inadequate One",
        overall_rating: "inadequate",
        date: daysAgo(5),
        strengths: [],
        areas_for_improvement: ["I1", "I2"],
        actions: [makeAction({ deadline: daysAgo(7), status: "overdue" })],
      }),
    ];
    const r = run(audits);
    if (r.alerts.length >= 2) {
      expect(r.alerts[0].severity).toBe("critical");
    }
  });

  it("Oak House generates medium alert for 67% completion rate", () => {
    const r = run(oakHouseAudits());
    const medium = r.alerts.filter((a) => a.severity === "medium");
    expect(medium.some((a) => a.message.includes("below 70%"))).toBe(true);
  });

  it("Oak House does not generate critical alerts", () => {
    const r = run(oakHouseAudits());
    const critical = r.alerts.filter((a) => a.severity === "critical");
    expect(critical.length).toBe(0);
  });
});

// ── Insights ────────────────────────────────────────────────────────────────

describe("insights", () => {
  it("generates critical insight for inadequate rating", () => {
    const audits = [makeAudit({ title: "Bad Audit", overall_rating: "inadequate" })];
    const r = run(audits);
    const critical = r.insights.filter((i) => i.severity === "critical");
    expect(critical.length).toBe(1);
    expect(critical[0].text).toContain("Bad Audit");
  });

  it("generates warning for overdue actions", () => {
    const audits = [
      makeAudit({
        actions: [makeAction({ status: "overdue", deadline: daysAgo(5) })],
      }),
    ];
    const r = run(audits);
    const warnings = r.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((i) => i.text.includes("overdue"))).toBe(true);
  });

  it("generates warning for low completion rate", () => {
    const audits = [
      makeAudit({
        actions: [
          makeAction({ status: "completed" }),
          makeAction({ status: "pending" }),
          makeAction({ status: "pending" }),
          makeAction({ status: "pending" }),
        ],
      }),
    ];
    const r = run(audits);
    const warnings = r.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((i) => i.text.includes("below acceptable threshold"))).toBe(true);
  });

  it("generates warning for requires_improvement ratings", () => {
    const audits = [makeAudit({ overall_rating: "requires_improvement" })];
    const r = run(audits);
    const warnings = r.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((i) => i.text.includes("Requires Improvement"))).toBe(true);
  });

  it("generates positive insight when all actions completed", () => {
    const audits = [
      makeAudit({
        actions: [makeAction({ status: "completed" }), makeAction({ status: "completed" })],
      }),
    ];
    const r = run(audits);
    const positives = r.insights.filter((i) => i.severity === "positive");
    expect(positives.some((i) => i.text.includes("All audit actions are completed"))).toBe(true);
  });

  it("generates positive insight for high avg rating >= 3", () => {
    const audits = [
      makeAudit({ overall_rating: "excellent" }),
      makeAudit({ overall_rating: "good" }),
    ];
    const r = run(audits);
    const positives = r.insights.filter((i) => i.severity === "positive");
    expect(positives.some((i) => i.text.includes("strong quality assurance posture"))).toBe(true);
  });

  it("generates positive insight when all scopes audited in 90 days", () => {
    const audits = [
      makeAudit({ scope: "a", date: daysAgo(30) }),
      makeAudit({ scope: "b", date: daysAgo(60) }),
    ];
    const r = run(audits);
    const positives = r.insights.filter((i) => i.severity === "positive");
    expect(positives.some((i) => i.text.includes("comprehensive coverage"))).toBe(true);
  });

  it("generates positive insight when strengths > improvements", () => {
    const audits = [
      makeAudit({
        strengths: ["S1", "S2", "S3"],
        areas_for_improvement: ["I1"],
      }),
    ];
    const r = run(audits);
    const positives = r.insights.filter((i) => i.severity === "positive");
    expect(positives.some((i) => i.text.includes("positive quality trajectory"))).toBe(true);
  });

  it("does not generate positive all-completed when some are pending", () => {
    const audits = [
      makeAudit({
        actions: [makeAction({ status: "completed" }), makeAction({ status: "pending" })],
      }),
    ];
    const r = run(audits);
    const positives = r.insights.filter((i) => i.severity === "positive");
    expect(positives.some((i) => i.text.includes("All audit actions are completed"))).toBe(false);
  });

  it("does not generate positive avg rating insight below 3", () => {
    const audits = [
      makeAudit({ overall_rating: "requires_improvement" }),
      makeAudit({ overall_rating: "requires_improvement" }),
    ];
    const r = run(audits);
    const positives = r.insights.filter((i) => i.severity === "positive");
    expect(positives.some((i) => i.text.includes("strong quality assurance posture"))).toBe(false);
  });

  it("Oak House generates warning insights for overdue actions", () => {
    const r = run(oakHouseAudits());
    const warnings = r.insights.filter((i) => i.severity === "warning");
    expect(warnings.some((i) => i.text.includes("overdue"))).toBe(true);
  });

  it("Oak House generates positive insight for avg rating >= 3", () => {
    const r = run(oakHouseAudits());
    const positives = r.insights.filter((i) => i.severity === "positive");
    expect(positives.some((i) => i.text.includes("strong quality assurance posture"))).toBe(true);
  });

  it("Oak House generates positive insight for strengths > improvements", () => {
    const r = run(oakHouseAudits());
    const positives = r.insights.filter((i) => i.severity === "positive");
    expect(positives.some((i) => i.text.includes("positive quality trajectory"))).toBe(true);
  });
});

// ── Edge Cases ──────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("handles single audit", () => {
    const r = run([makeAudit()]);
    expect(r.overview.total_audits).toBe(1);
    expect(r.audit_areas.length).toBe(1);
  });

  it("handles audit with no actions", () => {
    const audits = [makeAudit({ actions: [] })];
    const r = run(audits);
    expect(r.overview.total_actions).toBe(0);
    expect(r.overview.recommendation_completion_rate).toBe(100);
  });

  it("handles audit with empty strengths and improvements", () => {
    const audits = [
      makeAudit({ strengths: [], areas_for_improvement: [] }),
    ];
    const r = run(audits);
    expect(r.overview.strengths_count).toBe(0);
    expect(r.overview.improvements_count).toBe(0);
  });

  it("handles future audit dates", () => {
    const audits = [makeAudit({ date: "2026-06-30" })];
    const r = run(audits);
    // Future date is not within 90 days in the past, but daysBetween(date, today) would be negative
    expect(r.overview.audits_last_90_days).toBe(0);
  });

  it("handles audit dated exactly 90 days ago", () => {
    const audits = [makeAudit({ date: daysAgo(90) })];
    const r = run(audits);
    expect(r.overview.audits_last_90_days).toBe(1);
  });

  it("handles audit dated exactly 91 days ago", () => {
    const audits = [makeAudit({ date: daysAgo(91) })];
    const r = run(audits);
    expect(r.overview.audits_last_90_days).toBe(0);
  });

  it("handles multiple audits in same scope", () => {
    const audits = [
      makeAudit({ scope: "medication", overall_rating: "excellent", date: "2026-05-01" }),
      makeAudit({ scope: "medication", overall_rating: "good", date: "2026-05-10" }),
      makeAudit({ scope: "medication", overall_rating: "requires_improvement", date: "2026-05-20" }),
    ];
    const r = run(audits);
    const med = r.audit_areas.find((a) => a.scope === "medication");
    expect(med?.audit_count).toBe(3);
    // (4+3+2)/3 = 3.0 => Good
    expect(med?.avg_rating).toBe("Good");
    expect(med?.latest_date).toBe("2026-05-20");
  });

  it("rounds avg_rating_score to 2 decimal places", () => {
    const audits = [
      makeAudit({ overall_rating: "excellent" }),
      makeAudit({ overall_rating: "good" }),
      makeAudit({ overall_rating: "good" }),
    ];
    const r = run(audits);
    // (4+3+3)/3 = 3.333... => 3.33
    expect(r.overview.avg_rating_score).toBe(3.33);
  });

  it("uses today parameter when provided", () => {
    const audits = [
      makeAudit({
        date: "2026-01-01",
        actions: [makeAction({ deadline: "2026-01-10", status: "overdue" })],
      }),
    ];
    const r = run(audits, STAFF, "2026-01-20");
    expect(r.overdue_actions[0].days_overdue).toBe(10);
  });

  it("handles all actions being overdue", () => {
    const audits = [
      makeAudit({
        actions: [
          makeAction({ status: "overdue", deadline: daysAgo(5) }),
          makeAction({ status: "overdue", deadline: daysAgo(10) }),
        ],
      }),
    ];
    const r = run(audits);
    expect(r.overview.actions_overdue).toBe(2);
    expect(r.overview.actions_completed).toBe(0);
    expect(r.overview.recommendation_completion_rate).toBe(0);
  });

  it("handles mixed ratings correctly", () => {
    const audits = [
      makeAudit({ overall_rating: "excellent" }),
      makeAudit({ overall_rating: "inadequate" }),
    ];
    const r = run(audits);
    // (4+1)/2 = 2.5 => Good
    expect(r.overview.avg_rating_score).toBe(2.5);
    expect(r.overview.avg_rating_label).toBe("Good");
  });
});
