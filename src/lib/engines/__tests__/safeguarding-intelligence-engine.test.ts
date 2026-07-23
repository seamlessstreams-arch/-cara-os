// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFEGUARDING INTELLIGENCE ENGINE TESTS
// Comprehensive test suite: unit + integration
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeSafeguardingIntelligence,
  daysBetween,
  isSafeguardingIncident,
  computeTrend,
  type SafeguardingIntelligenceInput,
  type IncidentInput,
  type MissingEpisodeInput,
  type RestraintInput,
  type RiskAssessmentInput,
  type NotifiableEventInput,
  type ChildRef,
} from "../safeguarding-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-24";

function makeIncident(overrides: Partial<IncidentInput> = {}): IncidentInput {
  return {
    id: "inc_1",
    child_id: "child_1",
    date: "2026-05-15",
    type: "behaviour",
    severity: "medium",
    status: "closed",
    requires_oversight: false,
    oversight_by: null,
    ...overrides,
  };
}

function makeMissing(overrides: Partial<MissingEpisodeInput> = {}): MissingEpisodeInput {
  return {
    id: "mfc_1",
    child_id: "child_1",
    date_missing: "2026-05-10",
    status: "closed",
    risk_level: "medium",
    return_interview_completed: true,
    contextual_safeguarding_risk: false,
    ...overrides,
  };
}

function makeRestraint(overrides: Partial<RestraintInput> = {}): RestraintInput {
  return {
    id: "rst_1",
    child_id: "child_1",
    date: "2026-05-15",
    duration: 3,
    reason: "imminent_harm_to_others",
    restraint_type: "planned_hold",
    injuries: [],
    child_debriefed: true,
    staff_debriefed: true,
    review_status: "reviewed",
    de_escalation_attempts: ["Verbal reassurance", "Offered quiet space"],
    ...overrides,
  };
}

function makeRiskAssessment(overrides: Partial<RiskAssessmentInput> = {}): RiskAssessmentInput {
  return {
    id: "ra_1",
    child_id: "child_1",
    domain: "aggression",
    current_level: "medium",
    previous_level: "high",
    trend: "decreasing",
    status: "current",
    review_date: "2026-06-15",
    assessed_date: "2026-05-01",
    ...overrides,
  };
}

function makeNotifiable(overrides: Partial<NotifiableEventInput> = {}): NotifiableEventInput {
  return {
    id: "ne_1",
    date: "2026-05-10",
    event_type: "restraint",
    child_id: "child_1",
    ofsted_status: "notified_within_24h",
    ...overrides,
  };
}

function makeChild(id: string, name: string): ChildRef {
  return { id, name };
}

function makeInput(overrides: Partial<SafeguardingIntelligenceInput> = {}): SafeguardingIntelligenceInput {
  return {
    incidents: [],
    missingEpisodes: [],
    restraints: [],
    riskAssessments: [],
    notifiableEvents: [],
    children: [makeChild("child_1", "Alex"), makeChild("child_2", "Jordan")],
    today: TODAY,
    ...overrides,
  };
}

// ── Unit Tests: daysBetween ─────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns 0 for same day", () => {
    expect(daysBetween("2026-05-24", "2026-05-24")).toBe(0);
  });

  it("returns positive for later date", () => {
    expect(daysBetween("2026-01-01", "2026-01-31")).toBe(30);
  });

  it("returns negative for earlier date", () => {
    expect(daysBetween("2026-05-24", "2026-05-20")).toBe(-4);
  });
});

// ── Unit Tests: isSafeguardingIncident ───────────────────────────────────────

describe("isSafeguardingIncident", () => {
  it("identifies safeguarding type", () => {
    expect(isSafeguardingIncident("safeguarding")).toBe(true);
  });

  it("identifies child_protection", () => {
    expect(isSafeguardingIncident("child_protection")).toBe(true);
  });

  it("identifies allegation", () => {
    expect(isSafeguardingIncident("allegation")).toBe(true);
  });

  it("identifies exploitation", () => {
    expect(isSafeguardingIncident("exploitation")).toBe(true);
    expect(isSafeguardingIncident("criminal_exploitation")).toBe(true);
    expect(isSafeguardingIncident("sexual_exploitation")).toBe(true);
  });

  it("identifies disclosure", () => {
    expect(isSafeguardingIncident("disclosure")).toBe(true);
  });

  it("identifies CSE and CCE", () => {
    expect(isSafeguardingIncident("cse")).toBe(true);
    expect(isSafeguardingIncident("cce")).toBe(true);
  });

  it("rejects non-safeguarding types", () => {
    expect(isSafeguardingIncident("behaviour")).toBe(false);
    expect(isSafeguardingIncident("medication")).toBe(false);
    expect(isSafeguardingIncident("complaint")).toBe(false);
    expect(isSafeguardingIncident("property_damage")).toBe(false);
  });

  it("handles case insensitivity", () => {
    expect(isSafeguardingIncident("SAFEGUARDING")).toBe(true);
    expect(isSafeguardingIncident("Child-Protection")).toBe(true);
  });
});

// ── Unit Tests: computeTrend ────────────────────────────────────────────────

describe("computeTrend", () => {
  it("returns stable when counts are equal", () => {
    expect(computeTrend(5, 5)).toBe("stable");
  });

  it("returns stable when difference is 1", () => {
    expect(computeTrend(6, 5)).toBe("stable");
    expect(computeTrend(4, 5)).toBe("stable");
  });

  it("returns increasing when recent > older by more than 1", () => {
    expect(computeTrend(7, 3)).toBe("increasing");
  });

  it("returns decreasing when recent < older by more than 1", () => {
    expect(computeTrend(2, 6)).toBe("decreasing");
  });

  it("handles zero counts", () => {
    expect(computeTrend(0, 0)).toBe("stable");
    expect(computeTrend(3, 0)).toBe("increasing");
    expect(computeTrend(0, 3)).toBe("decreasing");
  });
});

// ── Integration: Empty Input ────────────────────────────────────────────────

describe("computeSafeguardingIntelligence — empty input", () => {
  const result = computeSafeguardingIntelligence(makeInput());

  it("returns zero incident counts", () => {
    expect(result.profile.total_incidents_90d).toBe(0);
    expect(result.profile.open_incidents).toBe(0);
    expect(result.profile.incidents_needing_oversight).toBe(0);
    expect(result.profile.safeguarding_incidents_90d).toBe(0);
  });

  it("returns zero restraint counts", () => {
    expect(result.restraints.total_restraints_90d).toBe(0);
    expect(result.restraints.total_restraints_30d).toBe(0);
  });

  it("returns zero missing counts", () => {
    expect(result.missing.total_episodes_90d).toBe(0);
  });

  it("reports compliance rates as unmeasured, never as 100%", () => {
    expect(result.restraints.debrief_completion_rate).toBeNull();
    expect(result.restraints.review_completion_rate).toBeNull();
    expect(result.restraints.de_escalation_always_attempted).toBeNull();
    expect(result.missing.return_interview_rate).toBeNull();
    expect(result.notifiable_events.compliance_rate).toBeNull();
  });

  it("does not claim safeguarding assurance when nothing is recorded", () => {
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.insights.some((i) => i.severity === "positive")).toBe(false);
    expect(result.insights[0].text.toLowerCase()).toContain("no safeguarding records");
  });
});

// ── Integration: Incident Profile ───────────────────────────────────────────

describe("computeSafeguardingIntelligence — incident profile", () => {
  const incidents: IncidentInput[] = [
    makeIncident({ id: "inc_1", date: "2026-05-20", status: "open", requires_oversight: true, oversight_by: null }),
    makeIncident({ id: "inc_2", date: "2026-05-15", type: "safeguarding", status: "closed" }),
    makeIncident({ id: "inc_3", date: "2026-04-10", status: "under_review", requires_oversight: true, oversight_by: "staff_1" }),
    makeIncident({ id: "inc_4", date: "2026-03-01", type: "child_protection", status: "closed" }),
    makeIncident({ id: "inc_5", date: "2026-01-01", status: "closed" }), // outside 90 days
  ];

  const result = computeSafeguardingIntelligence(makeInput({ incidents }));

  it("counts incidents within 90 days", () => {
    expect(result.profile.total_incidents_90d).toBe(4); // inc_5 is outside 90 days
  });

  it("counts open/under_review incidents", () => {
    expect(result.profile.open_incidents).toBe(2); // inc_1 open, inc_3 under_review
  });

  it("counts incidents needing oversight", () => {
    expect(result.profile.incidents_needing_oversight).toBe(1); // inc_1 (inc_3 has oversight_by)
  });

  it("counts safeguarding incidents", () => {
    expect(result.profile.safeguarding_incidents_90d).toBe(2); // inc_2 + inc_4
  });

  it("generates oversight warning insight", () => {
    const oversightInsight = result.insights.find((i) =>
      i.text.includes("oversight")
    );
    expect(oversightInsight).toBeDefined();
    expect(oversightInsight!.severity).toBe("critical");
  });
});

// ── Integration: Restraint Profile ──────────────────────────────────────────

describe("computeSafeguardingIntelligence — restraint profile", () => {
  const restraints: RestraintInput[] = [
    makeRestraint({
      id: "rst_1", date: "2026-05-20", duration: 3, child_id: "child_1",
      child_debriefed: true, staff_debriefed: true, review_status: "reviewed",
      injuries: [],
    }),
    makeRestraint({
      id: "rst_2", date: "2026-05-10", duration: 7, child_id: "child_1",
      child_debriefed: false, staff_debriefed: true, review_status: "pending",
      injuries: [{ person: "child_1", description: "Minor bruise" }],
    }),
    makeRestraint({
      id: "rst_3", date: "2026-04-15", duration: 2, child_id: "child_2",
      child_debriefed: true, staff_debriefed: true, review_status: "reviewed",
      injuries: [],
    }),
  ];

  const result = computeSafeguardingIntelligence(makeInput({ restraints }));

  it("counts restraints in 90 days", () => {
    expect(result.restraints.total_restraints_90d).toBe(3);
  });

  it("counts restraints in 30 days", () => {
    expect(result.restraints.total_restraints_30d).toBe(2); // rst_1 and rst_2
  });

  it("counts unique children restrained", () => {
    expect(result.restraints.children_restrained).toBe(2);
  });

  it("computes average duration", () => {
    // (3 + 7 + 2) / 3 = 4
    expect(result.restraints.average_duration_minutes).toBe(4);
  });

  it("counts injuries", () => {
    expect(result.restraints.injuries_during_restraint).toBe(1);
  });

  it("computes debrief completion rate", () => {
    // 6 possible debriefs (3 child + 3 staff), 5 completed (2 child + 3 staff)
    // = 5/6 * 100 = 83%
    expect(result.restraints.debrief_completion_rate).toBe(83);
  });

  it("computes review completion rate", () => {
    // 2 reviewed / 3 total = 67%
    expect(result.restraints.review_completion_rate).toBe(67);
  });

  it("de-escalation always attempted is true", () => {
    expect(result.restraints.de_escalation_always_attempted).toBe(true);
  });

  it("generates debrief warning", () => {
    const debriefInsight = result.insights.find((i) =>
      i.text.includes("debrief")
    );
    expect(debriefInsight).toBeDefined();
    expect(debriefInsight!.severity).toBe("warning");
  });

  it("generates injury warning", () => {
    const injuryInsight = result.insights.find((i) =>
      i.text.includes("injury")
    );
    expect(injuryInsight).toBeDefined();
    expect(injuryInsight!.severity).toBe("warning");
  });

  it("generates de-escalation positive insight", () => {
    const deescInsight = result.insights.find((i) =>
      i.text.includes("De-escalation")
    );
    expect(deescInsight).toBeDefined();
    expect(deescInsight!.severity).toBe("positive");
  });
});

// ── Integration: Restraint with missing de-escalation ───────────────────────

describe("computeSafeguardingIntelligence — de-escalation gap", () => {
  const result = computeSafeguardingIntelligence(makeInput({
    restraints: [
      makeRestraint({ id: "rst_1", de_escalation_attempts: [] }),
    ],
  }));

  it("flags de-escalation not always attempted", () => {
    expect(result.restraints.de_escalation_always_attempted).toBe(false);
  });
});

// ── Integration: Missing Profile ────────────────────────────────────────────

describe("computeSafeguardingIntelligence — missing profile", () => {
  const missingEpisodes: MissingEpisodeInput[] = [
    makeMissing({ id: "mfc_1", child_id: "child_1", date_missing: "2026-05-15", risk_level: "high", contextual_safeguarding_risk: true }),
    makeMissing({ id: "mfc_2", child_id: "child_1", date_missing: "2026-04-20", risk_level: "high" }),
    makeMissing({ id: "mfc_3", child_id: "child_1", date_missing: "2026-03-15", risk_level: "medium" }),
    makeMissing({ id: "mfc_4", child_id: "child_2", date_missing: "2026-05-10", risk_level: "low", return_interview_completed: false }),
  ];

  const result = computeSafeguardingIntelligence(makeInput({ missingEpisodes }));

  it("counts episodes in 90 days", () => {
    expect(result.missing.total_episodes_90d).toBe(4);
  });

  it("counts episodes in 30 days", () => {
    expect(result.missing.total_episodes_30d).toBe(2); // mfc_1 and mfc_4
  });

  it("counts children with episodes", () => {
    expect(result.missing.children_with_episodes).toBe(2);
  });

  it("detects repeat missing children (3+ in 90 days)", () => {
    expect(result.missing.repeat_missing_children).toBe(1); // child_1 has 3
  });

  it("computes return interview rate", () => {
    // 4 closed episodes, 3 completed interviews = 75%
    expect(result.missing.return_interview_rate).toBe(75);
  });

  it("counts contextual safeguarding flags", () => {
    expect(result.missing.contextual_safeguarding_flagged).toBe(1);
  });

  it("counts high risk episodes", () => {
    expect(result.missing.high_risk_episodes).toBe(2);
  });

  it("generates repeat missing critical insight", () => {
    const repeatInsight = result.insights.find((i) =>
      i.text.includes("repeat missing")
    );
    expect(repeatInsight).toBeDefined();
    expect(repeatInsight!.severity).toBe("critical");
    expect(repeatInsight!.text).toContain("Alex");
  });

  it("generates contextual safeguarding warning", () => {
    const csInsight = result.insights.find((i) =>
      i.text.includes("contextual safeguarding")
    );
    expect(csInsight).toBeDefined();
    expect(csInsight!.severity).toBe("warning");
  });

  it("generates return interview warning", () => {
    const riInsight = result.insights.find((i) =>
      i.text.includes("Return interview")
    );
    expect(riInsight).toBeDefined();
    expect(riInsight!.severity).toBe("warning");
  });
});

// ── Integration: Risk Assessment Profile ────────────────────────────────────

describe("computeSafeguardingIntelligence — risk assessment profile", () => {
  const riskAssessments: RiskAssessmentInput[] = [
    makeRiskAssessment({ id: "ra_1", child_id: "child_1", domain: "aggression", current_level: "high", trend: "decreasing" }),
    makeRiskAssessment({ id: "ra_2", child_id: "child_1", domain: "exploitation", current_level: "medium", trend: "decreasing" }),
    makeRiskAssessment({ id: "ra_3", child_id: "child_2", domain: "self_harm", current_level: "medium", trend: "stable" }),
    makeRiskAssessment({ id: "ra_4", child_id: "child_2", domain: "absconding", current_level: "high", trend: "increasing", review_date: "2026-05-01" }), // overdue
    makeRiskAssessment({ id: "ra_5", status: "archived" }), // should be excluded
  ];

  const result = computeSafeguardingIntelligence(makeInput({ riskAssessments }));

  it("counts current assessments only", () => {
    expect(result.risk_assessments.total_current).toBe(4);
  });

  it("counts high or very_high", () => {
    expect(result.risk_assessments.high_or_very_high).toBe(2);
  });

  it("counts overdue reviews", () => {
    expect(result.risk_assessments.overdue_reviews).toBe(1);
  });

  it("counts trend directions", () => {
    expect(result.risk_assessments.improving_trend).toBe(2);
    expect(result.risk_assessments.stable_trend).toBe(1);
    expect(result.risk_assessments.worsening_trend).toBe(1);
  });

  it("groups by domain with highest level", () => {
    expect(result.risk_assessments.by_domain.length).toBe(4);
    const aggDomain = result.risk_assessments.by_domain.find((d) => d.domain === "aggression");
    expect(aggDomain).toBeDefined();
    expect(aggDomain!.highest_level).toBe("high");
  });

  it("sorts domains by highest level descending", () => {
    const levels = result.risk_assessments.by_domain.map((d) => d.highest_level);
    const order: Record<string, number> = { very_high: 4, high: 3, medium: 2, low: 1 };
    for (let i = 1; i < levels.length; i++) {
      expect(order[levels[i - 1]]).toBeGreaterThanOrEqual(order[levels[i]]);
    }
  });

  it("generates overdue review warning", () => {
    const overdueInsight = result.insights.find((i) =>
      i.text.includes("overdue for review")
    );
    expect(overdueInsight).toBeDefined();
    expect(overdueInsight!.severity).toBe("warning");
  });

  it("generates worsening trend warning", () => {
    const worseningInsight = result.insights.find((i) =>
      i.text.includes("increasing trend")
    );
    expect(worseningInsight).toBeDefined();
    expect(worseningInsight!.severity).toBe("warning");
  });
});

// ── Integration: Notifiable Events Profile ──────────────────────────────────

describe("computeSafeguardingIntelligence — notifiable events profile", () => {
  const notifiableEvents: NotifiableEventInput[] = [
    makeNotifiable({ id: "ne_1", event_type: "restraint", ofsted_status: "notified_within_24h" }),
    makeNotifiable({ id: "ne_2", event_type: "restraint", ofsted_status: "notified_within_24h" }),
    makeNotifiable({ id: "ne_3", event_type: "serious_incident", ofsted_status: "notified_late" }),
    makeNotifiable({ id: "ne_4", event_type: "police_involvement", ofsted_status: "pending" }),
    makeNotifiable({ id: "ne_5", event_type: "absconding", ofsted_status: "not_required" }),
  ];

  const result = computeSafeguardingIntelligence(makeInput({ notifiableEvents }));

  it("counts total events", () => {
    expect(result.notifiable_events.total_events).toBe(5);
  });

  it("counts on-time notifications", () => {
    expect(result.notifiable_events.notified_on_time).toBe(2);
  });

  it("counts late notifications", () => {
    expect(result.notifiable_events.notified_late).toBe(1);
  });

  it("counts pending notifications", () => {
    expect(result.notifiable_events.pending_notification).toBe(1);
  });

  it("computes compliance rate excluding not_required", () => {
    // 4 require notification, 2 on time = 50%
    expect(result.notifiable_events.compliance_rate).toBe(50);
  });

  it("provides type breakdown", () => {
    expect(result.notifiable_events.by_type.length).toBe(4);
    const restraintType = result.notifiable_events.by_type.find((t) => t.type === "restraint");
    expect(restraintType!.count).toBe(2);
  });

  it("generates pending notification critical insight", () => {
    const pendingInsight = result.insights.find((i) =>
      i.text.includes("Reg 40 notification")
    );
    expect(pendingInsight).toBeDefined();
    expect(pendingInsight!.severity).toBe("critical");
  });

  it("generates late notification warning", () => {
    const lateInsight = result.insights.find((i) =>
      i.text.includes("sent late")
    );
    expect(lateInsight).toBeDefined();
    expect(lateInsight!.severity).toBe("warning");
  });
});

// ── Integration: Incident Trend ─────────────────────────────────────────────

describe("computeSafeguardingIntelligence — incident trend", () => {
  it("detects increasing trend", () => {
    // 5 incidents in last 45 days, 1 in prior 45 days
    const incidents = [
      makeIncident({ id: "1", date: "2026-05-20" }),
      makeIncident({ id: "2", date: "2026-05-15" }),
      makeIncident({ id: "3", date: "2026-05-10" }),
      makeIncident({ id: "4", date: "2026-04-25" }),
      makeIncident({ id: "5", date: "2026-04-15" }),
      makeIncident({ id: "6", date: "2026-03-20" }), // older period
    ];
    const result = computeSafeguardingIntelligence(makeInput({ incidents }));
    expect(result.profile.incident_trend).toBe("increasing");
  });

  it("detects stable trend", () => {
    const incidents = [
      makeIncident({ id: "1", date: "2026-05-15" }),
      makeIncident({ id: "2", date: "2026-03-20" }),
    ];
    const result = computeSafeguardingIntelligence(makeInput({ incidents }));
    expect(result.profile.incident_trend).toBe("stable");
  });

  it("detects decreasing trend", () => {
    const incidents = [
      makeIncident({ id: "1", date: "2026-05-15" }),
      makeIncident({ id: "2", date: "2026-03-20" }),
      makeIncident({ id: "3", date: "2026-03-15" }),
      makeIncident({ id: "4", date: "2026-03-10" }),
      makeIncident({ id: "5", date: "2026-03-05" }),
    ];
    const result = computeSafeguardingIntelligence(makeInput({ incidents }));
    expect(result.profile.incident_trend).toBe("decreasing");
  });
});

// ── Integration: Positive State Insights ────────────────────────────────────

describe("computeSafeguardingIntelligence — positive insights", () => {
  it("generates zero restraints insight", () => {
    const result = computeSafeguardingIntelligence(makeInput({
      incidents: [makeIncident({ id: "1" })], // at least one incident
    }));
    const zeroRestraints = result.insights.find((i) =>
      i.text.includes("Zero restraints")
    );
    expect(zeroRestraints).toBeDefined();
    expect(zeroRestraints!.severity).toBe("positive");
  });

  it("generates zero missing insight when the home is recording", () => {
    const result = computeSafeguardingIntelligence(makeInput({
      incidents: [makeIncident({ id: "1" })], // the home is demonstrably recording
    }));
    const zeroMissing = result.insights.find((i) =>
      i.text.includes("No missing from care")
    );
    expect(zeroMissing).toBeDefined();
    expect(zeroMissing!.severity).toBe("positive");
  });

  it("does not claim zero restraints or zero missing episodes on an empty register", () => {
    const result = computeSafeguardingIntelligence(makeInput());
    expect(result.insights.some((i) => i.text.includes("Zero restraints"))).toBe(false);
    expect(result.insights.some((i) => i.text.includes("No missing from care"))).toBe(false);
  });

  it("generates improving risk assessment insight", () => {
    const result = computeSafeguardingIntelligence(makeInput({
      riskAssessments: [
        makeRiskAssessment({ id: "ra_1", trend: "decreasing" }),
        makeRiskAssessment({ id: "ra_2", trend: "decreasing" }),
      ],
    }));
    const improvingInsight = result.insights.find((i) =>
      i.text.includes("decreasing risk trend")
    );
    expect(improvingInsight).toBeDefined();
    expect(improvingInsight!.severity).toBe("positive");
  });

  it("generates compliance strong insight when every strand is evidenced and clear", () => {
    const result = computeSafeguardingIntelligence(makeInput({
      incidents: [makeIncident({ id: "1" })],
      riskAssessments: [makeRiskAssessment({ id: "ra_1" })],
      notifiableEvents: [makeNotifiable({ id: "ne_1" })],
    }));
    const complianceInsight = result.insights.find((i) =>
      i.text.includes("Safeguarding compliance strong")
    );
    expect(complianceInsight).toBeDefined();
    expect(complianceInsight!.severity).toBe("positive");
  });

  it("does not claim strong compliance when nothing has been recorded", () => {
    const result = computeSafeguardingIntelligence(makeInput());
    expect(result.insights.some((i) => i.text.includes("Safeguarding compliance strong"))).toBe(false);
  });
});

// ── Integration: Full Chamberlain House Scenario ────────────────────────────────────

describe("computeSafeguardingIntelligence — Chamberlain House integration", () => {
  const children: ChildRef[] = [
    { id: "yp_alex", name: "Alex" },
    { id: "yp_jordan", name: "Jordan" },
    { id: "yp_casey", name: "Casey" },
  ];

  const incidents: IncidentInput[] = [
    makeIncident({ id: "inc_1", child_id: "yp_alex", date: "2026-05-20", type: "behaviour", status: "open", requires_oversight: true }),
    makeIncident({ id: "inc_2", child_id: "yp_alex", date: "2026-05-10", type: "behaviour", status: "closed" }),
    makeIncident({ id: "inc_3", child_id: "yp_jordan", date: "2026-05-14", type: "complaint", status: "closed" }),
    makeIncident({ id: "inc_4", child_id: "yp_alex", date: "2026-04-14", type: "safeguarding", status: "closed", requires_oversight: true, oversight_by: "staff_darren" }),
    makeIncident({ id: "inc_5", child_id: "yp_alex", date: "2026-04-01", type: "behaviour", status: "closed" }),
  ];

  const missingEpisodes: MissingEpisodeInput[] = [
    makeMissing({ id: "mfc_1", child_id: "yp_alex", date_missing: "2026-05-15", risk_level: "high", contextual_safeguarding_risk: true }),
    makeMissing({ id: "mfc_2", child_id: "yp_alex", date_missing: "2026-04-01", risk_level: "high", contextual_safeguarding_risk: true }),
    makeMissing({ id: "mfc_3", child_id: "yp_alex", date_missing: "2026-03-15", risk_level: "medium" }),
  ];

  const restraints: RestraintInput[] = [
    makeRestraint({ id: "rst_1", child_id: "yp_alex", date: "2026-04-19", duration: 3, review_status: "reviewed" }),
    makeRestraint({ id: "rst_2", child_id: "yp_alex", date: "2026-05-02", duration: 2, review_status: "pending" }),
    makeRestraint({
      id: "rst_3", child_id: "yp_alex", date: "2026-05-14", duration: 7,
      child_debriefed: false, review_status: "pending",
      injuries: [{ person: "yp_alex", description: "Minor bruise" }],
    }),
  ];

  const riskAssessments: RiskAssessmentInput[] = [
    makeRiskAssessment({ id: "ra_1", child_id: "yp_alex", domain: "aggression", current_level: "high", trend: "decreasing" }),
    makeRiskAssessment({ id: "ra_2", child_id: "yp_jordan", domain: "absconding", current_level: "medium", trend: "decreasing" }),
    makeRiskAssessment({ id: "ra_3", child_id: "yp_casey", domain: "self_harm", current_level: "medium", trend: "stable" }),
    makeRiskAssessment({ id: "ra_4", child_id: "yp_alex", domain: "exploitation", current_level: "low", trend: "decreasing", review_date: "2026-05-20" }), // overdue
  ];

  const notifiableEvents: NotifiableEventInput[] = [
    makeNotifiable({ id: "ne_1", event_type: "restraint", child_id: "yp_alex", ofsted_status: "notified_within_24h" }),
    makeNotifiable({ id: "ne_2", event_type: "restraint", child_id: "yp_alex", ofsted_status: "notified_within_24h" }),
    makeNotifiable({ id: "ne_3", event_type: "absconding", child_id: "yp_alex", ofsted_status: "notified_within_24h" }),
  ];

  const result = computeSafeguardingIntelligence(makeInput({
    incidents,
    missingEpisodes,
    restraints,
    riskAssessments,
    notifiableEvents,
    children,
  }));

  it("computes correct incident profile", () => {
    expect(result.profile.total_incidents_90d).toBe(5);
    expect(result.profile.open_incidents).toBe(1);
    expect(result.profile.incidents_needing_oversight).toBe(1);
    expect(result.profile.safeguarding_incidents_90d).toBe(1);
  });

  it("computes correct restraint profile", () => {
    expect(result.restraints.total_restraints_90d).toBe(3);
    expect(result.restraints.children_restrained).toBe(1); // only Alex
    expect(result.restraints.injuries_during_restraint).toBe(1);
  });

  it("computes correct missing profile", () => {
    expect(result.missing.total_episodes_90d).toBe(3);
    expect(result.missing.children_with_episodes).toBe(1); // only Alex
    expect(result.missing.repeat_missing_children).toBe(1);
    expect(result.missing.contextual_safeguarding_flagged).toBe(2);
  });

  it("computes correct risk assessment profile", () => {
    expect(result.risk_assessments.total_current).toBe(4);
    expect(result.risk_assessments.high_or_very_high).toBe(1);
    expect(result.risk_assessments.overdue_reviews).toBe(1);
    expect(result.risk_assessments.improving_trend).toBe(3);
  });

  it("computes 100% notifiable event compliance", () => {
    expect(result.notifiable_events.compliance_rate).toBe(100);
  });

  it("generates multiple insight severities", () => {
    const severities = new Set(result.insights.map((i) => i.severity));
    expect(severities.size).toBeGreaterThanOrEqual(2);
  });

  it("generates oversight critical insight for open incident", () => {
    expect(result.insights.some((i) =>
      i.severity === "critical" && i.text.includes("oversight")
    )).toBe(true);
  });

  it("generates repeat missing critical insight for Alex", () => {
    expect(result.insights.some((i) =>
      i.severity === "critical" && i.text.includes("Alex")
    )).toBe(true);
  });

  it("generates de-escalation positive insight", () => {
    expect(result.insights.some((i) =>
      i.severity === "positive" && i.text.includes("De-escalation")
    )).toBe(true);
  });

  it("includes at least one positive insight", () => {
    expect(result.insights.some((i) => i.severity === "positive")).toBe(true);
  });
});
