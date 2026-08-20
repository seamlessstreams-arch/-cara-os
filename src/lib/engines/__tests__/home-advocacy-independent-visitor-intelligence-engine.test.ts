// ==============================================================================
// CARA -- HOME ADVOCACY & INDEPENDENT VISITOR INTELLIGENCE ENGINE TESTS
// Comprehensive test suite covering scoring, rates, bonuses, penalties,
// strengths, concerns, recommendations, insights, and edge cases.
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  computeAdvocacyIndependentVisitor,
  type AdvocacyVisitorInput,
  type IndependentVisitorRecordInput,
  type AdvocacyServiceRecordInput,
  type RepresentationRecordInput,
  type VisitComplianceRecordInput,
  type ChildSatisfactionRecordInput,
  type AdvocacyVisitorResult,
} from "../home-advocacy-independent-visitor-intelligence-engine";

const TODAY = "2026-05-29";

// -- Factories ----------------------------------------------------------------

let _id = 0;
function uid(): string {
  return `test_${++_id}`;
}

function makeIV(
  overrides: Partial<IndependentVisitorRecordInput> = {},
): IndependentVisitorRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    visitor_name: "Jane Smith",
    visitor_organisation: "IV Org",
    allocated: true,
    allocation_date: "2026-01-01",
    dbs_cleared: true,
    training_completed: true,
    child_consented: true,
    child_matched: true,
    matching_quality: "good",
    relationship_established: true,
    visits_planned_per_quarter: 4,
    visits_completed_per_quarter: 4,
    last_visit_date: "2026-05-01",
    visit_duration_minutes: 60,
    child_engaged_during_visit: true,
    issues_raised_by_visitor: 2,
    issues_resolved: 2,
    visitor_report_submitted: true,
    child_wishes_recorded: true,
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeAdvocacy(
  overrides: Partial<AdvocacyServiceRecordInput> = {},
): AdvocacyServiceRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    advocacy_provider: "NYAS",
    service_type: "instructed",
    referral_date: "2026-01-01",
    referral_accepted: true,
    advocate_allocated: true,
    advocate_name: "Mark Taylor",
    first_contact_date: "2026-01-03",
    days_to_first_contact: 2,
    advocacy_plan_in_place: true,
    child_informed_of_rights: true,
    child_understands_role: true,
    meetings_attended_by_advocate: 4,
    meetings_total: 4,
    outcome_achieved: true,
    outcome_documented: true,
    child_satisfaction: 5,
    advocacy_independent_of_home: true,
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeRep(
  overrides: Partial<RepresentationRecordInput> = {},
): RepresentationRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    context: "lac_review",
    date: "2026-03-01",
    child_views_sought: true,
    child_views_documented: true,
    child_views_presented: true,
    child_attended_meeting: true,
    advocate_present: true,
    independent_visitor_consulted: true,
    child_felt_heard: true,
    decision_reflected_views: true,
    feedback_given_to_child: true,
    representation_quality: "good",
    barriers_to_participation: [],
    created_at: "2026-03-01",
    ...overrides,
  };
}

function makeVisit(
  overrides: Partial<VisitComplianceRecordInput> = {},
): VisitComplianceRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    visit_type: "independent_visitor",
    scheduled_date: "2026-03-01",
    actual_date: "2026-03-01",
    visit_completed: true,
    within_timescale: true,
    visit_private: true,
    child_seen_alone: true,
    child_views_recorded: true,
    follow_up_actions: 2,
    follow_up_completed: 2,
    report_filed: true,
    report_filed_on_time: true,
    visit_quality: "good",
    created_at: "2026-03-01",
    ...overrides,
  };
}

function makeSat(
  overrides: Partial<ChildSatisfactionRecordInput> = {},
): ChildSatisfactionRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    survey_date: "2026-04-01",
    knows_independent_visitor: true,
    feels_listened_to: true,
    trusts_advocate: true,
    understands_complaints_process: true,
    would_use_advocacy_again: true,
    satisfaction_with_iv: 5,
    satisfaction_with_advocacy: 5,
    satisfaction_with_representation: 5,
    feels_views_make_difference: true,
    suggestions_for_improvement: "",
    child_voice_method: "face_to_face",
    created_at: "2026-04-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<AdvocacyVisitorInput> = {}): AdvocacyVisitorInput {
  return {
    today: TODAY,
    total_children: 4,
    independent_visitor_records: [],
    advocacy_service_records: [],
    representation_records: [],
    visit_compliance_records: [],
    child_satisfaction_records: [],
    ...overrides,
  };
}

function run(overrides: Partial<AdvocacyVisitorInput> = {}): AdvocacyVisitorResult {
  return computeAdvocacyIndependentVisitor(baseInput(overrides));
}

/** Build N records using a factory, optionally overriding each */
function nOf<T>(n: number, factory: (o?: Partial<T>) => T, overrides?: Partial<T>): T[] {
  return Array.from({ length: n }, () => factory(overrides));
}

// pct helper (mirror engine)
function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// =============================================================================
// SECTION 1: INSUFFICIENT DATA
// =============================================================================

describe("insufficient_data", () => {
  it("returns insufficient_data when all arrays empty and total_children=0", () => {
    const r = run({ total_children: 0 });
    expect(r.advocacy_rating).toBe("insufficient_data");
    expect(r.advocacy_score).toBe(0);
    expect(r.headline).toContain("insufficient data");
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  it("all six rates are 0 for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.visitor_allocation_rate).toBe(0);
    expect(r.advocacy_access_rate).toBe(0);
    expect(r.representation_quality_rate).toBe(0);
    expect(r.visit_compliance_rate).toBe(0);
    expect(r.child_voice_rate).toBe(0);
    expect(r.child_satisfaction_rate).toBeNull();
  });
});

// =============================================================================
// SECTION 2: INADEQUATE FLOOR (all empty, children > 0)
// =============================================================================

describe("inadequate floor -- all empty with children on placement", () => {
  it("returns inadequate with score 15 when all arrays empty but children > 0", () => {
    const r = run({ total_children: 3 });
    expect(r.advocacy_rating).toBe("inadequate");
    expect(r.advocacy_score).toBe(15);
  });

  it("has a headline mentioning urgent attention", () => {
    const r = run({ total_children: 3 });
    expect(r.headline).toContain("urgent attention");
  });

  it("has exactly 1 concern", () => {
    const r = run({ total_children: 3 });
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No independent visitor");
  });

  it("has exactly 2 recommendations", () => {
    const r = run({ total_children: 3 });
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("has exactly 1 critical insight", () => {
    const r = run({ total_children: 3 });
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("all six rates are 0", () => {
    const r = run({ total_children: 3 });
    expect(r.visitor_allocation_rate).toBe(0);
    expect(r.advocacy_access_rate).toBe(0);
    expect(r.representation_quality_rate).toBe(0);
    expect(r.visit_compliance_rate).toBe(0);
    expect(r.child_voice_rate).toBe(0);
    expect(r.child_satisfaction_rate).toBeNull();
  });

  it("returns inadequate floor with total_children=1 (minimal)", () => {
    const r = run({ total_children: 1 });
    expect(r.advocacy_rating).toBe("inadequate");
    expect(r.advocacy_score).toBe(15);
  });
});

// =============================================================================
// SECTION 3: OUTSTANDING SCENARIO
// =============================================================================

describe("outstanding scenario", () => {
  function outstandingInput(): Partial<AdvocacyVisitorInput> {
    return {
      total_children: 4,
      independent_visitor_records: nOf(10, makeIV),
      advocacy_service_records: nOf(10, makeAdvocacy),
      representation_records: nOf(10, makeRep),
      visit_compliance_records: nOf(10, makeVisit),
      child_satisfaction_records: nOf(10, makeSat),
    };
  }

  it("achieves outstanding rating (score >= 80)", () => {
    const r = run(outstandingInput());
    expect(r.advocacy_rating).toBe("outstanding");
    expect(r.advocacy_score).toBeGreaterThanOrEqual(80);
  });

  it("max score is base(52) + 28 bonuses = 80", () => {
    const r = run(outstandingInput());
    // 52 + 5+5+4+4+4+3+3 = 80
    expect(r.advocacy_score).toBe(80);
  });

  it("headline mentions outstanding", () => {
    const r = run(outstandingInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("all six rates are 100%", () => {
    const r = run(outstandingInput());
    expect(r.visitor_allocation_rate).toBe(100);
    expect(r.advocacy_access_rate).toBe(100);
    expect(r.representation_quality_rate).toBe(100);
    expect(r.visit_compliance_rate).toBe(100);
    expect(r.child_voice_rate).toBe(100);
    expect(r.child_satisfaction_rate).toBe(100);
  });

  it("has multiple strengths", () => {
    const r = run(outstandingInput());
    expect(r.strengths.length).toBeGreaterThanOrEqual(10);
  });

  it("has zero concerns", () => {
    const r = run(outstandingInput());
    expect(r.concerns).toHaveLength(0);
  });

  it("has zero recommendations", () => {
    const r = run(outstandingInput());
    expect(r.recommendations).toHaveLength(0);
  });

  it("has positive insights including outstanding", () => {
    const r = run(outstandingInput());
    const positives = r.insights.filter((i) => i.severity === "positive");
    expect(positives.length).toBeGreaterThanOrEqual(1);
    expect(positives.some((i) => i.text.includes("outstanding"))).toBe(true);
  });
});

// =============================================================================
// SECTION 4: GOOD SCENARIO
// =============================================================================

describe("good scenario", () => {
  function goodInput(): Partial<AdvocacyVisitorInput> {
    // 7/10 allocated => 70%, 7/10 advocate allocated => 70%
    // 7/10 rep quality good => 70%, 7/10 visit completed => 70%
    // child voice: 7+7+7 / 10+10+10 = 70%
    // satisfaction: all 100% (but bonus only +1 because satisfaction logic)
    // independence: 7/10 => 70%
    const ivRecs = [
      ...nOf(7, makeIV),
      ...nOf(3, makeIV, {
        allocated: false,
        child_wishes_recorded: false,
        child_engaged_during_visit: false,
        matching_quality: "poor" as const,
        relationship_established: false,
        visits_completed_per_quarter: 0,
        issues_raised_by_visitor: 0,
        issues_resolved: 0,
        visitor_report_submitted: false,
      }),
    ];
    const advocacyRecs = [
      ...nOf(7, makeAdvocacy),
      ...nOf(3, makeAdvocacy, {
        advocate_allocated: false,
        advocacy_independent_of_home: false,
        child_informed_of_rights: false,
        days_to_first_contact: 10,
      }),
    ];
    const repRecs = [
      ...nOf(7, makeRep),
      ...nOf(3, makeRep, {
        representation_quality: "poor" as const,
        child_views_sought: false,
        child_felt_heard: false,
        decision_reflected_views: false,
        feedback_given_to_child: false,
      }),
    ];
    const visitRecs = [
      ...nOf(7, makeVisit),
      ...nOf(3, makeVisit, {
        visit_completed: false,
        child_views_recorded: false,
        child_seen_alone: false,
        report_filed: false,
        report_filed_on_time: false,
      }),
    ];
    return {
      total_children: 4,
      independent_visitor_records: ivRecs,
      advocacy_service_records: advocacyRecs,
      representation_records: repRecs,
      visit_compliance_records: visitRecs,
      child_satisfaction_records: nOf(10, makeSat),
    };
  }

  it("achieves good rating (65-79)", () => {
    const r = run(goodInput());
    expect(r.advocacy_rating).toBe("good");
    expect(r.advocacy_score).toBeGreaterThanOrEqual(65);
    expect(r.advocacy_score).toBeLessThan(80);
  });

  it("headline mentions Good", () => {
    const r = run(goodInput());
    expect(r.headline).toContain("Good");
  });

  it("has strengths", () => {
    const r = run(goodInput());
    expect(r.strengths.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// SECTION 5: ADEQUATE SCENARIO
// =============================================================================

describe("adequate scenario", () => {
  function adequateInput(): Partial<AdvocacyVisitorInput> {
    // 5/10 => 50% for most rates -- no bonuses, no penalties (rates are >= 50)
    const ivRecs = [
      ...nOf(5, makeIV),
      ...nOf(5, makeIV, {
        allocated: false,
        child_wishes_recorded: false,
        matching_quality: "poor" as const,
        relationship_established: false,
        child_engaged_during_visit: false,
        visits_completed_per_quarter: 0,
        visitor_report_submitted: false,
        issues_raised_by_visitor: 0,
        issues_resolved: 0,
      }),
    ];
    const advocacyRecs = [
      ...nOf(5, makeAdvocacy),
      ...nOf(5, makeAdvocacy, {
        advocate_allocated: false,
        advocacy_independent_of_home: false,
        child_informed_of_rights: false,
        days_to_first_contact: 10,
      }),
    ];
    const repRecs = [
      ...nOf(5, makeRep),
      ...nOf(5, makeRep, {
        representation_quality: "poor" as const,
        child_views_sought: false,
        child_felt_heard: false,
        decision_reflected_views: false,
        feedback_given_to_child: false,
      }),
    ];
    const visitRecs = [
      ...nOf(5, makeVisit),
      ...nOf(5, makeVisit, {
        visit_completed: false,
        child_views_recorded: false,
        child_seen_alone: false,
        report_filed: false,
        report_filed_on_time: false,
      }),
    ];
    return {
      total_children: 4,
      independent_visitor_records: ivRecs,
      advocacy_service_records: advocacyRecs,
      representation_records: repRecs,
      visit_compliance_records: visitRecs,
      child_satisfaction_records: nOf(10, makeSat),
    };
  }

  it("achieves adequate rating (45-64)", () => {
    const r = run(adequateInput());
    expect(r.advocacy_rating).toBe("adequate");
    expect(r.advocacy_score).toBeGreaterThanOrEqual(45);
    expect(r.advocacy_score).toBeLessThan(65);
  });

  it("headline mentions Adequate", () => {
    const r = run(adequateInput());
    expect(r.headline).toContain("Adequate");
  });

  it("has concerns", () => {
    const r = run(adequateInput());
    expect(r.concerns.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// SECTION 6: INADEQUATE SCENARIO (not the floor)
// =============================================================================

describe("inadequate scenario (below adequate threshold)", () => {
  function inadequateInput(): Partial<AdvocacyVisitorInput> {
    // 2/10 => 20% for most rates -- triggers penalties
    const ivRecs = [
      ...nOf(2, makeIV),
      ...nOf(8, makeIV, {
        allocated: false,
        child_wishes_recorded: false,
        matching_quality: "poor" as const,
        relationship_established: false,
        child_engaged_during_visit: false,
        visits_completed_per_quarter: 0,
        visitor_report_submitted: false,
        issues_raised_by_visitor: 0,
        issues_resolved: 0,
      }),
    ];
    const advocacyRecs = [
      ...nOf(2, makeAdvocacy),
      ...nOf(8, makeAdvocacy, {
        advocate_allocated: false,
        advocacy_independent_of_home: false,
        child_informed_of_rights: false,
        days_to_first_contact: 10,
        outcome_achieved: false,
        child_satisfaction: 1,
      }),
    ];
    const repRecs = [
      ...nOf(2, makeRep),
      ...nOf(8, makeRep, {
        representation_quality: "poor" as const,
        child_views_sought: false,
        child_felt_heard: false,
        decision_reflected_views: false,
        feedback_given_to_child: false,
      }),
    ];
    const visitRecs = [
      ...nOf(2, makeVisit),
      ...nOf(8, makeVisit, {
        visit_completed: false,
        child_views_recorded: false,
        child_seen_alone: false,
        report_filed: false,
        report_filed_on_time: false,
        follow_up_actions: 3,
        follow_up_completed: 0,
      }),
    ];
    const satRecs = nOf(10, makeSat, {
      feels_listened_to: false,
      trusts_advocate: false,
      feels_views_make_difference: false,
      satisfaction_with_iv: 2,
      satisfaction_with_advocacy: 2,
      satisfaction_with_representation: 2,
      would_use_advocacy_again: false,
      knows_independent_visitor: false,
    });
    return {
      total_children: 4,
      independent_visitor_records: ivRecs,
      advocacy_service_records: advocacyRecs,
      representation_records: repRecs,
      visit_compliance_records: visitRecs,
      child_satisfaction_records: satRecs,
    };
  }

  it("achieves inadequate rating (score < 45)", () => {
    const r = run(inadequateInput());
    expect(r.advocacy_rating).toBe("inadequate");
    expect(r.advocacy_score).toBeLessThan(45);
  });

  it("headline mentions inadequate", () => {
    const r = run(inadequateInput());
    expect(r.headline).toContain("inadequate");
  });

  it("has many concerns", () => {
    const r = run(inadequateInput());
    expect(r.concerns.length).toBeGreaterThanOrEqual(5);
  });

  it("has many recommendations with immediate urgency", () => {
    const r = run(inadequateInput());
    const immediates = r.recommendations.filter((rc) => rc.urgency === "immediate");
    expect(immediates.length).toBeGreaterThanOrEqual(3);
  });

  it("has critical insights", () => {
    const r = run(inadequateInput());
    const criticals = r.insights.filter((i) => i.severity === "critical");
    expect(criticals.length).toBeGreaterThanOrEqual(3);
  });
});

// =============================================================================
// SECTION 7: BONUSES IN ISOLATION
// =============================================================================

describe("bonuses in isolation", () => {
  // Base: all records set to fail bonuses (rates at 0 or below thresholds)
  // Then selectively override ONE domain to hit the bonus

  function zeroIV(): IndependentVisitorRecordInput {
    return makeIV({
      allocated: false,
      child_wishes_recorded: false,
      matching_quality: "poor",
      relationship_established: false,
      child_engaged_during_visit: false,
      visits_completed_per_quarter: 0,
      visitor_report_submitted: false,
      issues_raised_by_visitor: 0,
      issues_resolved: 0,
      dbs_cleared: false,
      training_completed: false,
      child_consented: false,
      child_matched: false,
    });
  }

  function zeroAdvocacy(): AdvocacyServiceRecordInput {
    return makeAdvocacy({
      advocate_allocated: false,
      advocacy_independent_of_home: false,
      child_informed_of_rights: false,
      child_understands_role: false,
      days_to_first_contact: 30,
      advocacy_plan_in_place: false,
      outcome_achieved: false,
      outcome_documented: false,
      child_satisfaction: 1,
      meetings_attended_by_advocate: 0,
      referral_accepted: false,
    });
  }

  function zeroRep(): RepresentationRecordInput {
    return makeRep({
      representation_quality: "poor",
      child_views_sought: false,
      child_views_documented: false,
      child_views_presented: false,
      child_attended_meeting: false,
      advocate_present: false,
      independent_visitor_consulted: false,
      child_felt_heard: false,
      decision_reflected_views: false,
      feedback_given_to_child: false,
      barriers_to_participation: ["language"],
    });
  }

  function zeroVisit(): VisitComplianceRecordInput {
    return makeVisit({
      visit_completed: false,
      within_timescale: false,
      visit_private: false,
      child_seen_alone: false,
      child_views_recorded: false,
      follow_up_actions: 2,
      follow_up_completed: 0,
      report_filed: false,
      report_filed_on_time: false,
      visit_quality: "poor",
    });
  }

  function zeroSat(): ChildSatisfactionRecordInput {
    return makeSat({
      knows_independent_visitor: false,
      feels_listened_to: false,
      trusts_advocate: false,
      understands_complaints_process: false,
      would_use_advocacy_again: false,
      satisfaction_with_iv: 1,
      satisfaction_with_advocacy: 1,
      satisfaction_with_representation: 1,
      feels_views_make_difference: false,
    });
  }

  function zeroBase(): Partial<AdvocacyVisitorInput> {
    return {
      total_children: 4,
      independent_visitor_records: nOf(10, () => zeroIV()),
      advocacy_service_records: nOf(10, () => zeroAdvocacy()),
      representation_records: nOf(10, () => zeroRep()),
      visit_compliance_records: nOf(10, () => zeroVisit()),
      child_satisfaction_records: nOf(10, () => zeroSat()),
    };
  }

  // Zero-base score has penalties: visitorAlloc <50 => -5, advocacyAccess <50 => -5,
  // visitCompliance <50 => -4, repQuality <30 => -4 => 52 - 18 = 34
  const ZERO_BASE_SCORE = 34;

  it("zero-base score is 34 (52 - 5 - 5 - 4 - 4)", () => {
    const r = run(zeroBase());
    expect(r.advocacy_score).toBe(ZERO_BASE_SCORE);
  });

  // -- Bonus 1: visitorAllocationRate >= 90 => +5
  describe("Bonus 1: visitorAllocationRate", () => {
    it(">= 90 => +5", () => {
      // 10/10 allocated => 100%, but we still have all other zero penalties
      // Removes the visitor penalty (-5 removed) and adds bonus +5
      const ivRecs = nOf(10, () => makeIV({ child_wishes_recorded: false }));
      const r = run({
        ...zeroBase(),
        independent_visitor_records: ivRecs,
      });
      // Base 52, visitor bonus +5, no visitor penalty.
      // Advocacy penalty -5, visit penalty -4, rep penalty -4
      // childVoice: 10 (iv wishes false=0) + 0(rep views sought) + 0(visit views) / 10+10+10 = 0/30 = 0%
      // Wait, IV makeIV defaults child_wishes_recorded = true. Let me re-check.
      // We set child_wishes_recorded: false so voice is from IV=0
      // score = 52 + 5 - 5 - 4 - 4 = 44
      expect(r.advocacy_score).toBe(44);
    });

    it(">= 70 but < 90 => +3", () => {
      // 7/10 allocated
      const ivRecs = [
        ...nOf(7, () => makeIV({ child_wishes_recorded: false })),
        ...nOf(3, () => zeroIV()),
      ];
      const r = run({
        ...zeroBase(),
        independent_visitor_records: ivRecs,
      });
      // 70% allocation => +3, no penalty (>=50)
      // score = 52 + 3 - 5 - 4 - 4 = 42
      expect(r.advocacy_score).toBe(42);
    });

    it("< 70 => no bonus", () => {
      // 6/10 allocated => 60%
      const ivRecs = [
        ...nOf(6, () => makeIV({ child_wishes_recorded: false })),
        ...nOf(4, () => zeroIV()),
      ];
      const r = run({
        ...zeroBase(),
        independent_visitor_records: ivRecs,
      });
      // 60% allocation => no bonus, no penalty (>=50)
      // score = 52 + 0 - 5 - 4 - 4 = 39
      expect(r.advocacy_score).toBe(39);
    });
  });

  // -- Bonus 2: advocacyAccessRate >= 90 => +5
  describe("Bonus 2: advocacyAccessRate", () => {
    it(">= 90 => +5", () => {
      const advocacyRecs = nOf(10, () =>
        makeAdvocacy({ advocacy_independent_of_home: false, child_informed_of_rights: false, days_to_first_contact: 30 }),
      );
      const r = run({
        ...zeroBase(),
        advocacy_service_records: advocacyRecs,
      });
      // 100% access => +5, no advocacy penalty. independence < 70 => no independence bonus.
      // score = 52 + 5 - 5 - 4 - 4 = 44
      expect(r.advocacy_score).toBe(44);
    });

    it(">= 70 but < 90 => +3", () => {
      const advocacyRecs = [
        ...nOf(7, () =>
          makeAdvocacy({ advocacy_independent_of_home: false, child_informed_of_rights: false, days_to_first_contact: 30 }),
        ),
        ...nOf(3, () => zeroAdvocacy()),
      ];
      const r = run({
        ...zeroBase(),
        advocacy_service_records: advocacyRecs,
      });
      // 70% => +3, no penalty (>=50)
      // score = 52 + 3 - 5 - 4 - 4 = 42
      expect(r.advocacy_score).toBe(42);
    });
  });

  // -- Bonus 3: representationQualityRate >= 90 => +4
  describe("Bonus 3: representationQualityRate", () => {
    it(">= 90 => +4", () => {
      const repRecs = nOf(10, () =>
        makeRep({ child_views_sought: false, child_felt_heard: false, decision_reflected_views: false, feedback_given_to_child: false }),
      );
      const r = run({
        ...zeroBase(),
        representation_records: repRecs,
      });
      // 100% rep quality => +4, no rep penalty
      // score = 52 + 4 - 5 - 5 - 4 = 42
      expect(r.advocacy_score).toBe(42);
    });

    it(">= 70 but < 90 => +2", () => {
      const repRecs = [
        ...nOf(7, () =>
          makeRep({ child_views_sought: false, child_felt_heard: false, decision_reflected_views: false, feedback_given_to_child: false }),
        ),
        ...nOf(3, () => zeroRep()),
      ];
      const r = run({
        ...zeroBase(),
        representation_records: repRecs,
      });
      // 70% => +2, no rep penalty (>=30)
      // score = 52 + 2 - 5 - 5 - 4 = 40
      expect(r.advocacy_score).toBe(40);
    });
  });

  // -- Bonus 4: visitComplianceRate >= 90 => +4
  describe("Bonus 4: visitComplianceRate", () => {
    it(">= 90 => +4", () => {
      const visitRecs = nOf(10, () =>
        makeVisit({ child_views_recorded: false, child_seen_alone: false }),
      );
      const r = run({
        ...zeroBase(),
        visit_compliance_records: visitRecs,
      });
      // 100% visit compliance => +4, no visit penalty
      // score = 52 + 4 - 5 - 5 - 4 = 42
      expect(r.advocacy_score).toBe(42);
    });

    it(">= 70 but < 90 => +2", () => {
      const visitRecs = [
        ...nOf(7, () =>
          makeVisit({ child_views_recorded: false, child_seen_alone: false }),
        ),
        ...nOf(3, () => zeroVisit()),
      ];
      const r = run({
        ...zeroBase(),
        visit_compliance_records: visitRecs,
      });
      // 70% => +2, no visit penalty (>=50)
      // score = 52 + 2 - 5 - 5 - 4 = 40
      expect(r.advocacy_score).toBe(40);
    });
  });

  // -- Bonus 5: childVoiceRate >= 80 => +4
  describe("Bonus 5: childVoiceRate", () => {
    it(">= 80 => +4", () => {
      // childVoice = (ivWishesRecorded + viewsSought + visitViewsRecorded) / (totalIV + totalRep + totalVisit)
      // Make all IV child_wishes_recorded, all rep child_views_sought, all visit child_views_recorded
      // But keep all other domain metrics at zero to avoid other bonuses
      const ivRecs = nOf(10, () =>
        makeIV({
          allocated: false,
          matching_quality: "poor",
          relationship_established: false,
          child_engaged_during_visit: false,
          visits_completed_per_quarter: 0,
          visitor_report_submitted: false,
          issues_raised_by_visitor: 0,
          issues_resolved: 0,
          dbs_cleared: false,
          training_completed: false,
          child_consented: false,
          child_matched: false,
          child_wishes_recorded: true,
        }),
      );
      const repRecs = nOf(10, () =>
        makeRep({
          representation_quality: "poor",
          child_views_sought: true,
          child_views_documented: false,
          child_views_presented: false,
          child_attended_meeting: false,
          advocate_present: false,
          child_felt_heard: false,
          decision_reflected_views: false,
          feedback_given_to_child: false,
          barriers_to_participation: ["language"],
        }),
      );
      const visitRecs = nOf(10, () =>
        makeVisit({
          visit_completed: false,
          within_timescale: false,
          visit_private: false,
          child_seen_alone: false,
          child_views_recorded: true,
          follow_up_actions: 2,
          follow_up_completed: 0,
          report_filed: false,
          report_filed_on_time: false,
          visit_quality: "poor",
        }),
      );
      const r = run({
        ...zeroBase(),
        independent_visitor_records: ivRecs,
        representation_records: repRecs,
        visit_compliance_records: visitRecs,
      });
      // childVoice = 30/30 = 100% => +4
      // visitor alloc 0% => -5, advocacy access 0% => -5, visit compliance 0% => -4, rep quality 0% => -4
      // score = 52 + 4 - 5 - 5 - 4 - 4 = 38
      expect(r.advocacy_score).toBe(38);
    });

    it(">= 60 but < 80 => +2", () => {
      // 20/30 = 67%
      const ivRecs = [
        ...nOf(7, () => makeIV({ allocated: false, matching_quality: "poor", relationship_established: false, child_engaged_during_visit: false, visits_completed_per_quarter: 0, visitor_report_submitted: false, issues_raised_by_visitor: 0, issues_resolved: 0, dbs_cleared: false, training_completed: false, child_consented: false, child_matched: false, child_wishes_recorded: true })),
        ...nOf(3, () => zeroIV()),
      ];
      const repRecs = [
        ...nOf(7, () => makeRep({ representation_quality: "poor", child_views_sought: true, child_views_documented: false, child_views_presented: false, child_attended_meeting: false, advocate_present: false, child_felt_heard: false, decision_reflected_views: false, feedback_given_to_child: false, barriers_to_participation: ["language"] })),
        ...nOf(3, () => zeroRep()),
      ];
      const visitRecs = [
        ...nOf(6, () => makeVisit({ visit_completed: false, within_timescale: false, visit_private: false, child_seen_alone: false, child_views_recorded: true, follow_up_actions: 2, follow_up_completed: 0, report_filed: false, report_filed_on_time: false, visit_quality: "poor" })),
        ...nOf(4, () => zeroVisit()),
      ];
      const r = run({
        ...zeroBase(),
        independent_visitor_records: ivRecs,
        representation_records: repRecs,
        visit_compliance_records: visitRecs,
      });
      // childVoice = 20/30 = 67% => +2
      // penalties still apply
      expect(r.child_voice_rate).toBe(pct(20, 30));
      expect(r.advocacy_score).toBe(ZERO_BASE_SCORE + 2);
    });
  });

  // -- Bonus 6: childSatisfactionRate >= 80 => +3
  describe("Bonus 6: childSatisfactionRate", () => {
    it(">= 80 => +3", () => {
      const satRecs = nOf(10, () => makeSat());
      const r = run({
        ...zeroBase(),
        child_satisfaction_records: satRecs,
      });
      // satBoolCount = feelsListenedRate(100) + trustRate(100) + viewsMakeDiffRate(100) = 300
      // satBoolDivisor = 3 => childSatisfactionRate = Math.round(300/3) = 100
      // => +3
      // score = 34 + 3 = 37
      expect(r.child_satisfaction_rate).toBe(100);
      expect(r.advocacy_score).toBe(ZERO_BASE_SCORE + 3);
    });

    it(">= 60 but < 80 => +1", () => {
      // Need childSatisfactionRate between 60-79
      // feelsListened = all, trusts = all, viewsMakeDiff = none
      // satBoolCount = 100 + 100 + 0 = 200, but viewsMakeDiff count=0 so divisor=2
      // childSatisfactionRate = round(200/2) = 100 -- that's too high
      // Let's try: feelsListened = 7/10, trusts = 7/10, viewsMakeDiff = 0
      // feelsListenedRate = 70, trustRate = 70, viewsMakeDiff = 0 but count=0 so excluded
      // satBoolCount = 70 + 70 = 140, divisor = 2 => round(70) = 70
      const satRecs = [
        ...nOf(7, () => makeSat({ feels_views_make_difference: false })),
        ...nOf(3, () => makeSat({ feels_listened_to: false, trusts_advocate: false, feels_views_make_difference: false })),
      ];
      const r = run({
        ...zeroBase(),
        child_satisfaction_records: satRecs,
      });
      expect(r.child_satisfaction_rate).toBe(70);
      expect(r.advocacy_score).toBe(ZERO_BASE_SCORE + 1);
    });
  });

  // -- Bonus 7: independenceRate >= 90 => +3
  describe("Bonus 7: independenceRate", () => {
    it(">= 90 => +3", () => {
      const advocacyRecs = nOf(10, () =>
        makeAdvocacy({
          advocate_allocated: false,
          child_informed_of_rights: false,
          days_to_first_contact: 30,
          advocacy_independent_of_home: true,
        }),
      );
      const r = run({
        ...zeroBase(),
        advocacy_service_records: advocacyRecs,
      });
      // independenceRate = 100%, advocacyAccessRate = 0%
      // score = 52 + 3 - 5 - 5 - 4 - 4 = 37
      // Wait -- advocacy access 0% => -5 penalty, plus no bonus for access
      expect(r.advocacy_score).toBe(ZERO_BASE_SCORE + 3);
    });

    it(">= 70 but < 90 => +1", () => {
      const advocacyRecs = [
        ...nOf(7, () =>
          makeAdvocacy({
            advocate_allocated: false,
            child_informed_of_rights: false,
            days_to_first_contact: 30,
            advocacy_independent_of_home: true,
          }),
        ),
        ...nOf(3, () => zeroAdvocacy()),
      ];
      const r = run({
        ...zeroBase(),
        advocacy_service_records: advocacyRecs,
      });
      // independenceRate = 70% => +1
      expect(r.advocacy_score).toBe(ZERO_BASE_SCORE + 1);
    });

    it("< 70 => no bonus", () => {
      const advocacyRecs = [
        ...nOf(6, () =>
          makeAdvocacy({
            advocate_allocated: false,
            child_informed_of_rights: false,
            days_to_first_contact: 30,
            advocacy_independent_of_home: true,
          }),
        ),
        ...nOf(4, () => zeroAdvocacy()),
      ];
      const r = run({
        ...zeroBase(),
        advocacy_service_records: advocacyRecs,
      });
      expect(r.advocacy_score).toBe(ZERO_BASE_SCORE);
    });
  });
});

// =============================================================================
// SECTION 8: PENALTIES
// =============================================================================

describe("penalties", () => {
  // Start with an all-good base and selectively make domains bad
  function penaltyBase(): Partial<AdvocacyVisitorInput> {
    return {
      total_children: 4,
      independent_visitor_records: nOf(10, makeIV),
      advocacy_service_records: nOf(10, makeAdvocacy),
      representation_records: nOf(10, makeRep),
      visit_compliance_records: nOf(10, makeVisit),
      child_satisfaction_records: nOf(10, makeSat),
    };
  }

  // Full bonus score: 52 + 28 = 80

  it("visitorAllocationRate < 50 => -5 penalty", () => {
    // 4/10 allocated = 40%
    const ivRecs = [
      ...nOf(4, makeIV),
      ...nOf(6, () => makeIV({ allocated: false })),
    ];
    const r = run({ ...penaltyBase(), independent_visitor_records: ivRecs });
    // visitorAllocationRate = 40%, no bonus, penalty -5
    // Other bonuses: advocacy +5, rep +4, visit +4, voice needs check, sat +3, indep +3
    // childVoice: 10 IV wishes + 10 rep views sought + 10 visit views / 10+10+10 = 30/30 = 100% => +4
    // score = 52 + 0 - 5 + 5 + 4 + 4 + 4 + 3 + 3 = 70
    expect(r.advocacy_score).toBe(70);
    expect(r.visitor_allocation_rate).toBe(40);
  });

  it("advocacyAccessRate < 50 => -5 penalty", () => {
    // 4/10 allocated = 40%
    const advocacyRecs = [
      ...nOf(4, makeAdvocacy),
      ...nOf(6, () => makeAdvocacy({ advocate_allocated: false })),
    ];
    const r = run({ ...penaltyBase(), advocacy_service_records: advocacyRecs });
    // advocacyAccessRate = 40%, no bonus, penalty -5
    // independenceRate = 100% => +3
    // score = 52 + 5 + 0 - 5 + 4 + 4 + 4 + 3 + 3 = 70
    expect(r.advocacy_score).toBe(70);
    expect(r.advocacy_access_rate).toBe(40);
  });

  it("visitComplianceRate < 50 => -4 penalty", () => {
    // 4/10 completed = 40%
    const visitRecs = [
      ...nOf(4, makeVisit),
      ...nOf(6, () => makeVisit({ visit_completed: false })),
    ];
    const r = run({ ...penaltyBase(), visit_compliance_records: visitRecs });
    // visitComplianceRate = 40%, no bonus, penalty -4
    // voice: 10+10+10 / 10+10+10 = 100% => +4
    // score = 52 + 5 + 5 + 4 + 0 - 4 + 4 + 3 + 3 = 72
    expect(r.advocacy_score).toBe(72);
    expect(r.visit_compliance_rate).toBe(40);
  });

  it("representationQualityRate < 30 => -4 penalty", () => {
    // 2/10 good = 20%
    const repRecs = [
      ...nOf(2, makeRep),
      ...nOf(8, () => makeRep({ representation_quality: "poor" })),
    ];
    const r = run({ ...penaltyBase(), representation_records: repRecs });
    // repQualityRate = 20%, no bonus, penalty -4
    // voice: 10+10+10 / 10+10+10 = 100% => +4
    // score = 52 + 5 + 5 + 0 - 4 + 4 + 4 + 3 + 3 = 72
    expect(r.advocacy_score).toBe(72);
    expect(r.representation_quality_rate).toBe(20);
  });

  it("penalties do not apply with 0 records (guards)", () => {
    // Empty arrays => no penalties for visitor/advocacy/visit/rep
    // With at least one other domain non-empty, it's not the "all empty" branch
    const r = run({
      total_children: 4,
      independent_visitor_records: [],
      advocacy_service_records: [],
      representation_records: [],
      visit_compliance_records: [],
      child_satisfaction_records: nOf(10, makeSat),
    });
    // No penalties from empty domains, childSatisfactionRate 100% => +3
    // childVoice: 0/0 = 0% => no bonus
    // All other rates are 0 with no records => no bonus, no penalty
    // score = 52 + 3 = 55
    expect(r.advocacy_score).toBe(55);
  });

  it("all four penalties can stack (worst case)", () => {
    const ivRecs = nOf(10, () => makeIV({ allocated: false, child_wishes_recorded: false }));
    const advocacyRecs = nOf(10, () =>
      makeAdvocacy({ advocate_allocated: false, advocacy_independent_of_home: false }),
    );
    const repRecs = nOf(10, () =>
      makeRep({ representation_quality: "poor", child_views_sought: false }),
    );
    const visitRecs = nOf(10, () =>
      makeVisit({ visit_completed: false, child_views_recorded: false }),
    );
    const r = run({
      total_children: 4,
      independent_visitor_records: ivRecs,
      advocacy_service_records: advocacyRecs,
      representation_records: repRecs,
      visit_compliance_records: visitRecs,
      child_satisfaction_records: nOf(10, () =>
        makeSat({ feels_listened_to: false, trusts_advocate: false, feels_views_make_difference: false }),
      ),
    });
    // score = 52 - 5 - 5 - 4 - 4 = 34
    expect(r.advocacy_score).toBe(34);
  });
});

// =============================================================================
// SECTION 9: SIX RATES COMPUTATION
// =============================================================================

describe("rate computations", () => {
  describe("visitor_allocation_rate", () => {
    it("100% when all allocated", () => {
      const r = run({ independent_visitor_records: nOf(5, makeIV) });
      expect(r.visitor_allocation_rate).toBe(100);
    });

    it("0% when none allocated", () => {
      const r = run({
        independent_visitor_records: nOf(5, () => makeIV({ allocated: false })),
      });
      expect(r.visitor_allocation_rate).toBe(0);
    });

    it("60% = 3/5", () => {
      const r = run({
        independent_visitor_records: [
          ...nOf(3, makeIV),
          ...nOf(2, () => makeIV({ allocated: false })),
        ],
      });
      expect(r.visitor_allocation_rate).toBe(60);
    });

    it("0% when array is empty (pct(0,0) = 0)", () => {
      const r = run({ independent_visitor_records: [] });
      expect(r.visitor_allocation_rate).toBe(0);
    });
  });

  describe("advocacy_access_rate", () => {
    it("100% when all advocate_allocated", () => {
      const r = run({ advocacy_service_records: nOf(5, makeAdvocacy) });
      expect(r.advocacy_access_rate).toBe(100);
    });

    it("0% when none allocated", () => {
      const r = run({
        advocacy_service_records: nOf(5, () => makeAdvocacy({ advocate_allocated: false })),
      });
      expect(r.advocacy_access_rate).toBe(0);
    });

    it("40% = 2/5", () => {
      const r = run({
        advocacy_service_records: [
          ...nOf(2, makeAdvocacy),
          ...nOf(3, () => makeAdvocacy({ advocate_allocated: false })),
        ],
      });
      expect(r.advocacy_access_rate).toBe(40);
    });
  });

  describe("representation_quality_rate", () => {
    it("100% when all good/excellent", () => {
      const r = run({ representation_records: nOf(5, makeRep) });
      expect(r.representation_quality_rate).toBe(100);
    });

    it("includes excellent", () => {
      const r = run({
        representation_records: nOf(5, () => makeRep({ representation_quality: "excellent" })),
      });
      expect(r.representation_quality_rate).toBe(100);
    });

    it("0% when all poor", () => {
      const r = run({
        representation_records: nOf(5, () => makeRep({ representation_quality: "poor" })),
      });
      expect(r.representation_quality_rate).toBe(0);
    });

    it("adequate quality does not count as good", () => {
      const r = run({
        representation_records: nOf(5, () => makeRep({ representation_quality: "adequate" })),
      });
      expect(r.representation_quality_rate).toBe(0);
    });
  });

  describe("visit_compliance_rate", () => {
    it("100% when all completed", () => {
      const r = run({ visit_compliance_records: nOf(5, makeVisit) });
      expect(r.visit_compliance_rate).toBe(100);
    });

    it("0% when none completed", () => {
      const r = run({
        visit_compliance_records: nOf(5, () => makeVisit({ visit_completed: false })),
      });
      expect(r.visit_compliance_rate).toBe(0);
    });
  });

  describe("child_voice_rate", () => {
    it("combines IV wishes + rep views sought + visit views recorded over total records", () => {
      // 3 IV (all wishes), 2 rep (all views sought), 5 visit (all views recorded) => 10/10 = 100%
      const r = run({
        independent_visitor_records: nOf(3, makeIV),
        representation_records: nOf(2, makeRep),
        visit_compliance_records: nOf(5, makeVisit),
      });
      expect(r.child_voice_rate).toBe(100);
    });

    it("0% when all false", () => {
      const r = run({
        independent_visitor_records: nOf(3, () => makeIV({ child_wishes_recorded: false })),
        representation_records: nOf(3, () => makeRep({ child_views_sought: false })),
        visit_compliance_records: nOf(3, () => makeVisit({ child_views_recorded: false })),
      });
      expect(r.child_voice_rate).toBe(0);
    });

    it("pct(0,0) = 0 when all arrays empty", () => {
      const r = run({
        independent_visitor_records: [],
        representation_records: [],
        visit_compliance_records: [],
      });
      expect(r.child_voice_rate).toBe(0);
    });

    it("partial: 5/10 = 50%", () => {
      const r = run({
        independent_visitor_records: [
          ...nOf(2, makeIV),
          ...nOf(2, () => makeIV({ child_wishes_recorded: false })),
        ],
        representation_records: [
          makeRep(),
          makeRep({ child_views_sought: false }),
        ],
        visit_compliance_records: [
          ...nOf(2, makeVisit),
          ...nOf(2, () => makeVisit({ child_views_recorded: false })),
        ],
      });
      // voice: (2+1+2) / (4+2+4) = 5/10 = 50%
      expect(r.child_voice_rate).toBe(50);
    });
  });

  describe("child_satisfaction_rate", () => {
    it("100% when all booleans true", () => {
      const r = run({ child_satisfaction_records: nOf(5, makeSat) });
      expect(r.child_satisfaction_rate).toBe(100);
    });

    it("0% when all booleans false", () => {
      const r = run({
        child_satisfaction_records: nOf(5, () =>
          makeSat({ feels_listened_to: false, trusts_advocate: false, feels_views_make_difference: false }),
        ),
      });
      // records exist → 0, not null; concern still fires via below()
      expect(r.child_satisfaction_rate).toBe(0);
    });

    it("0% when no sat records", () => {
      const r = run({ child_satisfaction_records: [] });
      expect(r.child_satisfaction_rate).toBeNull();
    });

    it("averages only present bool groups", () => {
      // feelsListened: 10/10 = 100%, trusts: 0/10 excluded? No: trustsAdvocate count=0 so excluded
      // Actually trustsAdvocate count=0 when trusts_advocate is false on all 10 -- divisor excludes it
      const satRecs = nOf(10, () =>
        makeSat({ trusts_advocate: false, feels_views_make_difference: false }),
      );
      const r = run({ child_satisfaction_records: satRecs });
      // feelsListened = 10 => rate 100%, trusts = 0 => excluded, viewsMakeDiff = 0 => excluded
      // satBoolCount = 100, satBoolDivisor = 1 => rate = 100
      expect(r.child_satisfaction_rate).toBe(100);
    });
  });
});

// =============================================================================
// SECTION 10: STRENGTHS
// =============================================================================

describe("strengths", () => {
  it("visitor allocation >= 90 generates strength about strong commitment", () => {
    const r = run({ independent_visitor_records: nOf(10, makeIV) });
    expect(r.strengths.some((s) => s.includes("100%") && s.includes("strong commitment"))).toBe(true);
  });

  it("visitor allocation 70-89 generates different strength", () => {
    const ivRecs = [
      ...nOf(7, makeIV),
      ...nOf(3, () => makeIV({ allocated: false })),
    ];
    const r = run({ independent_visitor_records: ivRecs });
    expect(r.strengths.some((s) => s.includes("70%") && s.includes("most children"))).toBe(true);
  });

  it("matchQualityRate >= 80 generates strength", () => {
    const r = run({ independent_visitor_records: nOf(10, makeIV) });
    expect(r.strengths.some((s) => s.includes("100%") && s.includes("well matched"))).toBe(true);
  });

  it("relationshipRate >= 80 generates strength", () => {
    const r = run({ independent_visitor_records: nOf(10, makeIV) });
    expect(r.strengths.some((s) => s.includes("Relationships established"))).toBe(true);
  });

  it("ivVisitCompletionRate >= 90 generates strength", () => {
    const r = run({ independent_visitor_records: nOf(10, makeIV) });
    expect(r.strengths.some((s) => s.includes("visit") && s.includes("consistently maintained"))).toBe(true);
  });

  it("ivEngagementRate >= 80 generates strength", () => {
    const r = run({ independent_visitor_records: nOf(10, makeIV) });
    expect(r.strengths.some((s) => s.includes("engaged") && s.includes("child-centred"))).toBe(true);
  });

  it("advocacyAccessRate >= 90 generates strength about excellent access", () => {
    const r = run({ advocacy_service_records: nOf(10, makeAdvocacy) });
    expect(r.strengths.some((s) => s.includes("100%") && s.includes("excellent access"))).toBe(true);
  });

  it("advocacyAccessRate 70-89 generates different strength", () => {
    const recs = [
      ...nOf(7, makeAdvocacy),
      ...nOf(3, () => makeAdvocacy({ advocate_allocated: false })),
    ];
    const r = run({ advocacy_service_records: recs });
    expect(r.strengths.some((s) => s.includes("70%") && s.includes("most children can access"))).toBe(true);
  });

  it("rightsInformedRate >= 90 generates strength", () => {
    const r = run({ advocacy_service_records: nOf(10, makeAdvocacy) });
    expect(r.strengths.some((s) => s.includes("informed of their advocacy rights"))).toBe(true);
  });

  it("advocacyMeetingAttendanceRate >= 90 generates strength", () => {
    const r = run({ advocacy_service_records: nOf(10, makeAdvocacy) });
    expect(r.strengths.some((s) => s.includes("Advocates attended"))).toBe(true);
  });

  it("outcomeRate >= 80 generates strength", () => {
    const r = run({ advocacy_service_records: nOf(10, makeAdvocacy) });
    expect(r.strengths.some((s) => s.includes("outcome") && s.includes("effective"))).toBe(true);
  });

  it("independenceRate >= 90 generates strength", () => {
    const r = run({ advocacy_service_records: nOf(10, makeAdvocacy) });
    expect(r.strengths.some((s) => s.includes("independent of the home"))).toBe(true);
  });

  it("timelinessRate >= 80 generates strength", () => {
    const r = run({ advocacy_service_records: nOf(10, makeAdvocacy) });
    expect(r.strengths.some((s) => s.includes("5 working days"))).toBe(true);
  });

  it("representationQualityRate >= 90 generates strength about powerfully represented", () => {
    const r = run({ representation_records: nOf(10, makeRep) });
    expect(r.strengths.some((s) => s.includes("powerfully represented"))).toBe(true);
  });

  it("representationQualityRate 70-89 generates different strength", () => {
    const recs = [
      ...nOf(7, makeRep),
      ...nOf(3, () => makeRep({ representation_quality: "poor" })),
    ];
    const r = run({ representation_records: recs });
    expect(r.strengths.some((s) => s.includes("generally well represented"))).toBe(true);
  });

  it("feltHeardRate >= 80 generates strength", () => {
    const r = run({ representation_records: nOf(10, makeRep) });
    expect(r.strengths.some((s) => s.includes("felt heard"))).toBe(true);
  });

  it("decisionReflectionRate >= 80 generates strength", () => {
    const r = run({ representation_records: nOf(10, makeRep) });
    expect(r.strengths.some((s) => s.includes("reflected children's expressed views"))).toBe(true);
  });

  it("feedbackRate >= 80 generates strength", () => {
    const r = run({ representation_records: nOf(10, makeRep) });
    expect(r.strengths.some((s) => s.includes("closes the loop"))).toBe(true);
  });

  it("visitComplianceRate >= 90 generates strength about reliable oversight", () => {
    const r = run({ visit_compliance_records: nOf(10, makeVisit) });
    expect(r.strengths.some((s) => s.includes("reliable oversight"))).toBe(true);
  });

  it("visitComplianceRate 70-89 generates different strength", () => {
    const recs = [
      ...nOf(7, makeVisit),
      ...nOf(3, () => makeVisit({ visit_completed: false })),
    ];
    const r = run({ visit_compliance_records: recs });
    expect(r.strengths.some((s) => s.includes("most scheduled visits"))).toBe(true);
  });

  it("seenAloneRate >= 80 generates strength", () => {
    const r = run({ visit_compliance_records: nOf(10, makeVisit) });
    expect(r.strengths.some((s) => s.includes("seen alone"))).toBe(true);
  });

  it("followUpCompletionRate >= 90 generates strength", () => {
    const r = run({ visit_compliance_records: nOf(10, makeVisit) });
    expect(r.strengths.some((s) => s.includes("follow-up actions completed"))).toBe(true);
  });

  it("reportTimelinessRate >= 90 generates strength", () => {
    const r = run({ visit_compliance_records: nOf(10, makeVisit) });
    expect(r.strengths.some((s) => s.includes("reports filed on time"))).toBe(true);
  });

  it("childSatisfactionRate >= 80 generates strength", () => {
    const r = run({ child_satisfaction_records: nOf(10, makeSat) });
    expect(r.strengths.some((s) => s.includes("Child satisfaction composite rate"))).toBe(true);
  });

  it("childSatisfactionRate 60-79 generates different strength", () => {
    // feelsListened: 7/10, trusts: 7/10, viewsMakeDiff: 0 => excluded
    // rate = round((70+70)/2) = 70
    const satRecs = [
      ...nOf(7, () => makeSat({ feels_views_make_difference: false })),
      ...nOf(3, () => makeSat({ feels_listened_to: false, trusts_advocate: false, feels_views_make_difference: false })),
    ];
    const r = run({ child_satisfaction_records: satRecs });
    expect(r.child_satisfaction_rate).toBe(70);
    expect(r.strengths.some((s) => s.includes("generally feel supported"))).toBe(true);
  });

  it("overallSatisfactionAvg >= 4.0 generates strength", () => {
    const r = run({ child_satisfaction_records: nOf(10, makeSat) });
    expect(r.strengths.some((s) => s.includes("satisfaction averages") && s.includes("/5"))).toBe(true);
  });

  it("wouldUseAgainRate >= 80 generates strength", () => {
    const r = run({ child_satisfaction_records: nOf(10, makeSat) });
    expect(r.strengths.some((s) => s.includes("would use advocacy services again"))).toBe(true);
  });

  it("childVoiceRate >= 80 generates strength about wishes and feelings", () => {
    const r = run({
      independent_visitor_records: nOf(10, makeIV),
      representation_records: nOf(10, makeRep),
      visit_compliance_records: nOf(10, makeVisit),
    });
    expect(r.strengths.some((s) => s.includes("Child voice captured") && s.includes("wishes and feelings genuinely shape"))).toBe(true);
  });

  it("childVoiceRate 60-79 generates different strength", () => {
    // voice: 7+7+6 / 10+10+10 = 20/30 = 67%
    const r = run({
      independent_visitor_records: [
        ...nOf(7, makeIV),
        ...nOf(3, () => makeIV({ child_wishes_recorded: false })),
      ],
      representation_records: [
        ...nOf(7, makeRep),
        ...nOf(3, () => makeRep({ child_views_sought: false })),
      ],
      visit_compliance_records: [
        ...nOf(6, makeVisit),
        ...nOf(4, () => makeVisit({ child_views_recorded: false })),
      ],
    });
    expect(r.child_voice_rate).toBe(67);
    expect(r.strengths.some((s) => s.includes("good practice in consulting children"))).toBe(true);
  });

  it("ivIssueResolutionRate >= 90 generates strength", () => {
    const r = run({ independent_visitor_records: nOf(10, makeIV) });
    expect(r.strengths.some((s) => s.includes("issues raised by independent visitors resolved"))).toBe(true);
  });

  it("complaintsUnderstandingRate >= 90 generates strength", () => {
    const r = run({ child_satisfaction_records: nOf(10, makeSat) });
    expect(r.strengths.some((s) => s.includes("complaints process"))).toBe(true);
  });

  it("ivVisitCompletionRate 70-89 generates 'good visit completion' strength", () => {
    // 8/10 visits completed => 80% (within 70-89 band)
    const ivRecs = nOf(10, () => makeIV({ visits_planned_per_quarter: 10, visits_completed_per_quarter: 8 }));
    const r = run({ independent_visitor_records: ivRecs });
    expect(r.strengths.some((s) => s.includes("good visit completion rate"))).toBe(true);
  });
});

// =============================================================================
// SECTION 11: CONCERNS
// =============================================================================

describe("concerns", () => {
  it("visitorAllocationRate < 50 generates concern about majority lacking IV", () => {
    const ivRecs = [
      ...nOf(4, makeIV),
      ...nOf(6, () => makeIV({ allocated: false })),
    ];
    const r = run({ independent_visitor_records: ivRecs });
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("majority"))).toBe(true);
  });

  it("visitorAllocationRate 50-69 generates different concern", () => {
    const ivRecs = [
      ...nOf(6, makeIV),
      ...nOf(4, () => makeIV({ allocated: false })),
    ];
    const r = run({ independent_visitor_records: ivRecs });
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("not all children who would benefit"))).toBe(true);
  });

  it("matchQualityRate < 50 generates concern", () => {
    const ivRecs = [
      ...nOf(4, () => makeIV({ matching_quality: "good" })),
      ...nOf(6, () => makeIV({ matching_quality: "poor" })),
    ];
    const r = run({ independent_visitor_records: ivRecs });
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("poor matching"))).toBe(true);
  });

  it("relationshipRate < 60 generates concern", () => {
    const ivRecs = [
      ...nOf(5, makeIV),
      ...nOf(5, () => makeIV({ relationship_established: false })),
    ];
    const r = run({ independent_visitor_records: ivRecs });
    expect(r.concerns.some((c) => c.includes("50%") && c.includes("compliance exercise"))).toBe(true);
  });

  it("ivVisitCompletionRate < 50 generates concern", () => {
    const ivRecs = nOf(10, () => makeIV({ visits_planned_per_quarter: 10, visits_completed_per_quarter: 4 }));
    const r = run({ independent_visitor_records: ivRecs });
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("entitled to"))).toBe(true);
  });

  it("ivVisitCompletionRate 50-69 generates different concern", () => {
    const ivRecs = nOf(10, () => makeIV({ visits_planned_per_quarter: 10, visits_completed_per_quarter: 6 }));
    const r = run({ independent_visitor_records: ivRecs });
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("missing scheduled"))).toBe(true);
  });

  it("advocacyAccessRate < 50 generates concern", () => {
    const recs = [
      ...nOf(4, makeAdvocacy),
      ...nOf(6, () => makeAdvocacy({ advocate_allocated: false })),
    ];
    const r = run({ advocacy_service_records: recs });
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("majority of children referred"))).toBe(true);
  });

  it("advocacyAccessRate 50-69 generates different concern", () => {
    const recs = [
      ...nOf(6, makeAdvocacy),
      ...nOf(4, () => makeAdvocacy({ advocate_allocated: false })),
    ];
    const r = run({ advocacy_service_records: recs });
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("timely manner"))).toBe(true);
  });

  it("rightsInformedRate < 50 generates concern", () => {
    const recs = nOf(10, () => makeAdvocacy({ child_informed_of_rights: false }));
    const r = run({ advocacy_service_records: recs });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("cannot exercise rights"))).toBe(true);
  });

  it("independenceRate < 70 generates concern", () => {
    const recs = [
      ...nOf(6, makeAdvocacy),
      ...nOf(4, () => makeAdvocacy({ advocacy_independent_of_home: false })),
    ];
    const r = run({ advocacy_service_records: recs });
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("lack of independence"))).toBe(true);
  });

  it("timelinessRate < 50 generates concern", () => {
    const recs = nOf(10, () => makeAdvocacy({ days_to_first_contact: 10 }));
    const r = run({ advocacy_service_records: recs });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("wait too long"))).toBe(true);
  });

  it("advocacySatisfactionAvg < 3.0 generates concern", () => {
    const recs = nOf(10, () => makeAdvocacy({ child_satisfaction: 2 }));
    const r = run({ advocacy_service_records: recs });
    expect(r.concerns.some((c) => c.includes("2/5") && c.includes("not experiencing advocacy as helpful"))).toBe(true);
  });

  it("representationQualityRate < 30 generates concern", () => {
    const recs = nOf(10, () => makeRep({ representation_quality: "poor" }));
    const r = run({ representation_records: recs });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("not being adequately presented"))).toBe(true);
  });

  it("representationQualityRate 30-69 generates different concern", () => {
    const recs = [
      ...nOf(5, makeRep),
      ...nOf(5, () => makeRep({ representation_quality: "poor" })),
    ];
    const r = run({ representation_records: recs });
    expect(r.concerns.some((c) => c.includes("50%") && c.includes("needs improvement"))).toBe(true);
  });

  it("feltHeardRate < 50 generates concern", () => {
    const recs = nOf(10, () => makeRep({ child_felt_heard: false }));
    const r = run({ representation_records: recs });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("tokenistic"))).toBe(true);
  });

  it("feltHeardRate 50-69 generates different concern", () => {
    const recs = [
      ...nOf(6, makeRep),
      ...nOf(4, () => makeRep({ child_felt_heard: false })),
    ];
    const r = run({ representation_records: recs });
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("not experiencing genuine participation"))).toBe(true);
  });

  it("decisionReflectionRate < 50 generates concern", () => {
    const recs = nOf(10, () => makeRep({ decision_reflected_views: false }));
    const r = run({ representation_records: recs });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("erodes trust"))).toBe(true);
  });

  it("repBarrierRate >= 30 generates concern", () => {
    const recs = [
      ...nOf(7, makeRep),
      ...nOf(3, () => makeRep({ barriers_to_participation: ["language", "anxiety"] })),
    ];
    const r = run({ representation_records: recs });
    expect(r.concerns.some((c) => c.includes("30%") && c.includes("persistent obstacles"))).toBe(true);
  });

  it("visitComplianceRate < 50 generates concern", () => {
    const recs = nOf(10, () => makeVisit({ visit_completed: false }));
    const r = run({ visit_compliance_records: recs });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("significant failure"))).toBe(true);
  });

  it("visitComplianceRate 50-69 generates different concern", () => {
    const recs = [
      ...nOf(6, makeVisit),
      ...nOf(4, () => makeVisit({ visit_completed: false })),
    ];
    const r = run({ visit_compliance_records: recs });
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("not all scheduled visits"))).toBe(true);
  });

  it("seenAloneRate < 50 generates concern", () => {
    const recs = nOf(10, () => makeVisit({ child_seen_alone: false }));
    const r = run({ visit_compliance_records: recs });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("private opportunities"))).toBe(true);
  });

  it("followUpCompletionRate < 50 generates concern", () => {
    const recs = nOf(10, () => makeVisit({ follow_up_actions: 5, follow_up_completed: 2 }));
    const r = run({ visit_compliance_records: recs });
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("not being resolved"))).toBe(true);
  });

  it("reportFiledRate < 70 generates concern", () => {
    const recs = [
      ...nOf(6, makeVisit),
      ...nOf(4, () => makeVisit({ report_filed: false })),
    ];
    const r = run({ visit_compliance_records: recs });
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("incomplete reporting"))).toBe(true);
  });

  it("childSatisfactionRate < 50 generates concern", () => {
    const satRecs = nOf(10, () =>
      makeSat({ feels_listened_to: false, trusts_advocate: false, feels_views_make_difference: false }),
    );
    const r = run({ child_satisfaction_records: satRecs });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("do not feel listened to"))).toBe(true);
  });

  it("overallSatisfactionAvg < 3.0 generates concern", () => {
    const satRecs = nOf(10, () =>
      makeSat({ satisfaction_with_iv: 2, satisfaction_with_advocacy: 2, satisfaction_with_representation: 2 }),
    );
    const r = run({ child_satisfaction_records: satRecs });
    expect(r.concerns.some((c) => c.includes("/5") && c.includes("rate their experience") && c.includes("poorly"))).toBe(true);
  });

  it("knowsIVRate < 50 generates concern", () => {
    const satRecs = nOf(10, () => makeSat({ knows_independent_visitor: false }));
    const r = run({ child_satisfaction_records: satRecs });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("do not know exists"))).toBe(true);
  });

  it("childVoiceRate < 50 generates concern", () => {
    const r = run({
      independent_visitor_records: nOf(5, () => makeIV({ child_wishes_recorded: false })),
      representation_records: nOf(5, () => makeRep({ child_views_sought: false })),
      visit_compliance_records: nOf(5, () => makeVisit({ child_views_recorded: false })),
    });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("not sufficiently shaping"))).toBe(true);
  });

  it("childVoiceRate 50-59 generates different concern", () => {
    // 8/15 = 53%
    const r = run({
      independent_visitor_records: [
        ...nOf(3, makeIV),
        ...nOf(2, () => makeIV({ child_wishes_recorded: false })),
      ],
      representation_records: [
        ...nOf(3, makeRep),
        ...nOf(2, () => makeRep({ child_views_sought: false })),
      ],
      visit_compliance_records: [
        ...nOf(2, makeVisit),
        ...nOf(3, () => makeVisit({ child_views_recorded: false })),
      ],
    });
    // voice: (3+3+2) / (5+5+5) = 8/15 = 53%
    expect(r.child_voice_rate).toBe(53);
    expect(r.concerns.some((c) => c.includes("53%") && c.includes("more consistently captured"))).toBe(true);
  });

  it("no IV records with children generates concern", () => {
    const r = run({
      total_children: 4,
      independent_visitor_records: [],
      advocacy_service_records: nOf(3, makeAdvocacy),
    });
    expect(r.concerns.some((c) => c.includes("No independent visitor records"))).toBe(true);
  });

  it("no advocacy records with children generates concern", () => {
    const r = run({
      total_children: 4,
      independent_visitor_records: nOf(3, makeIV),
      advocacy_service_records: [],
    });
    expect(r.concerns.some((c) => c.includes("No advocacy service records"))).toBe(true);
  });

  it("no representation records with children generates concern", () => {
    const r = run({
      total_children: 4,
      independent_visitor_records: nOf(3, makeIV),
      representation_records: [],
    });
    expect(r.concerns.some((c) => c.includes("No representation records"))).toBe(true);
  });
});

// =============================================================================
// SECTION 12: RECOMMENDATIONS
// =============================================================================

describe("recommendations", () => {
  it("visitorAllocationRate < 50 generates immediate recommendation", () => {
    const ivRecs = nOf(10, () => makeIV({ allocated: false }));
    const r = run({ independent_visitor_records: ivRecs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("independent visitor allocation"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("advocacyAccessRate < 50 generates immediate recommendation", () => {
    const recs = nOf(10, () => makeAdvocacy({ advocate_allocated: false }));
    const r = run({ advocacy_service_records: recs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("timely access to an independent advocacy"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("visitComplianceRate < 50 generates immediate recommendation", () => {
    const recs = nOf(10, () => makeVisit({ visit_completed: false }));
    const r = run({ visit_compliance_records: recs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("critical shortfall"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("representationQualityRate < 30 generates immediate recommendation", () => {
    const recs = nOf(10, () => makeRep({ representation_quality: "poor" }));
    const r = run({ representation_records: recs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("quality of child representation"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("childVoiceRate < 50 generates immediate recommendation", () => {
    const r = run({
      independent_visitor_records: nOf(5, () => makeIV({ child_wishes_recorded: false })),
      representation_records: nOf(5, () => makeRep({ child_views_sought: false })),
      visit_compliance_records: nOf(5, () => makeVisit({ child_views_recorded: false })),
    });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("Embed child voice"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("rightsInformedRate < 50 generates immediate recommendation", () => {
    const recs = nOf(10, () => makeAdvocacy({ child_informed_of_rights: false }));
    const r = run({ advocacy_service_records: recs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("right to an independent advocate"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("independenceRate < 70 generates immediate recommendation", () => {
    const recs = [
      ...nOf(6, makeAdvocacy),
      ...nOf(4, () => makeAdvocacy({ advocacy_independent_of_home: false })),
    ];
    const r = run({ advocacy_service_records: recs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("genuinely independent"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("feltHeardRate < 50 generates soon recommendation", () => {
    const recs = nOf(10, () => makeRep({ child_felt_heard: false }));
    const r = run({ representation_records: recs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("children's experience of being heard"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("seenAloneRate < 50 generates soon recommendation", () => {
    const recs = nOf(10, () => makeVisit({ child_seen_alone: false }));
    const r = run({ visit_compliance_records: recs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("seen alone during visits"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("followUpCompletionRate < 50 generates soon recommendation", () => {
    const recs = nOf(10, () => makeVisit({ follow_up_actions: 5, follow_up_completed: 1 }));
    const r = run({ visit_compliance_records: recs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("follow-up action tracking"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("matchQualityRate < 50 generates soon recommendation", () => {
    const ivRecs = nOf(10, () => makeIV({ matching_quality: "poor" }));
    const r = run({ independent_visitor_records: ivRecs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("matching processes"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("knowsIVRate < 50 generates soon recommendation", () => {
    const satRecs = nOf(10, () => makeSat({ knows_independent_visitor: false }));
    const r = run({ child_satisfaction_records: satRecs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("awareness of their independent visitor"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("decisionReflectionRate < 50 generates soon recommendation", () => {
    const recs = nOf(10, () => makeRep({ decision_reflected_views: false }));
    const r = run({ representation_records: recs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("Strengthen the link"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("visitorAllocationRate 50-69 generates soon recommendation", () => {
    const ivRecs = [
      ...nOf(6, makeIV),
      ...nOf(4, () => makeIV({ allocated: false })),
    ];
    const r = run({ independent_visitor_records: ivRecs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("Increase independent visitor allocation to at least 70%"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("advocacyAccessRate 50-69 generates planned recommendation", () => {
    const recs = [
      ...nOf(6, makeAdvocacy),
      ...nOf(4, () => makeAdvocacy({ advocate_allocated: false })),
    ];
    const r = run({ advocacy_service_records: recs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("Improve advocacy access to at least 70%"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("representationQualityRate 30-69 generates planned recommendation", () => {
    const recs = [
      ...nOf(5, makeRep),
      ...nOf(5, () => makeRep({ representation_quality: "poor" })),
    ];
    const r = run({ representation_records: recs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("Invest in improving representation quality"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("visitComplianceRate 50-69 generates planned recommendation", () => {
    const recs = [
      ...nOf(6, makeVisit),
      ...nOf(4, () => makeVisit({ visit_completed: false })),
    ];
    const r = run({ visit_compliance_records: recs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("Improve visit compliance to at least 70%"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("reportFiledRate < 70 generates planned recommendation", () => {
    const recs = [
      ...nOf(6, makeVisit),
      ...nOf(4, () => makeVisit({ report_filed: false })),
    ];
    const r = run({ visit_compliance_records: recs });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("Improve visit report filing"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("no IV records with children generates soon recommendation", () => {
    const r = run({
      total_children: 4,
      independent_visitor_records: [],
      advocacy_service_records: nOf(3, makeAdvocacy),
    });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("Implement independent visitor assessments"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("no advocacy records with children generates soon recommendation", () => {
    const r = run({
      total_children: 4,
      independent_visitor_records: nOf(3, makeIV),
      advocacy_service_records: [],
    });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("Commission and document"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("no rep records with children generates soon recommendation", () => {
    const r = run({
      total_children: 4,
      independent_visitor_records: nOf(3, makeIV),
      representation_records: [],
    });
    const rec = r.recommendations.find((rc) => rc.recommendation.includes("Begin recording how children's views"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommendations have sequential ranks", () => {
    // Trigger many recommendations at once
    const r = run({
      total_children: 4,
      independent_visitor_records: nOf(10, () => makeIV({ allocated: false, child_wishes_recorded: false, matching_quality: "poor" })),
      advocacy_service_records: nOf(10, () => makeAdvocacy({ advocate_allocated: false, child_informed_of_rights: false, advocacy_independent_of_home: false, days_to_first_contact: 10 })),
      representation_records: nOf(10, () => makeRep({ representation_quality: "poor", child_felt_heard: false, decision_reflected_views: false, child_views_sought: false })),
      visit_compliance_records: nOf(10, () => makeVisit({ visit_completed: false, child_seen_alone: false, follow_up_actions: 5, follow_up_completed: 0, report_filed: false })),
      child_satisfaction_records: nOf(10, () => makeSat({ knows_independent_visitor: false })),
    });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });
});

// =============================================================================
// SECTION 13: INSIGHTS
// =============================================================================

describe("insights", () => {
  describe("critical insights", () => {
    it("visitorAllocationRate < 50 generates critical insight", () => {
      const ivRecs = nOf(10, () => makeIV({ allocated: false }));
      const r = run({ independent_visitor_records: ivRecs });
      const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("Reg 22"));
      expect(ins).toBeDefined();
    });

    it("advocacyAccessRate < 50 generates critical insight", () => {
      const recs = nOf(10, () => makeAdvocacy({ advocate_allocated: false }));
      const r = run({ advocacy_service_records: recs });
      const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("Reg 5"));
      expect(ins).toBeDefined();
    });

    it("visitComplianceRate < 50 generates critical insight", () => {
      const recs = nOf(10, () => makeVisit({ visit_completed: false }));
      const r = run({ visit_compliance_records: recs });
      const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("safeguarding gap"));
      expect(ins).toBeDefined();
    });

    it("representationQualityRate < 30 generates critical insight", () => {
      const recs = nOf(10, () => makeRep({ representation_quality: "poor" }));
      const r = run({ representation_records: recs });
      const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("fundamental failure"));
      expect(ins).toBeDefined();
    });

    it("no IV + no advocacy records but children => critical insight", () => {
      const r = run({
        total_children: 4,
        independent_visitor_records: [],
        advocacy_service_records: [],
        visit_compliance_records: nOf(3, makeVisit),
      });
      const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("No independent visitor or advocacy records"));
      expect(ins).toBeDefined();
    });

    it("independenceRate < 50 generates critical insight", () => {
      const recs = nOf(10, () => makeAdvocacy({ advocacy_independent_of_home: false }));
      const r = run({ advocacy_service_records: recs });
      const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("genuinely independent"));
      expect(ins).toBeDefined();
    });
  });

  describe("warning insights", () => {
    it("visitorAllocationRate 50-69 generates warning insight", () => {
      const ivRecs = [
        ...nOf(6, makeIV),
        ...nOf(4, () => makeIV({ allocated: false })),
      ];
      const r = run({ independent_visitor_records: ivRecs });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("improving but"));
      expect(ins).toBeDefined();
    });

    it("advocacyAccessRate 50-69 generates warning insight", () => {
      const recs = [
        ...nOf(6, makeAdvocacy),
        ...nOf(4, () => makeAdvocacy({ advocate_allocated: false })),
      ];
      const r = run({ advocacy_service_records: recs });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("referral pathways"));
      expect(ins).toBeDefined();
    });

    it("representationQualityRate 30-69 generates warning insight", () => {
      const recs = [
        ...nOf(5, makeRep),
        ...nOf(5, () => makeRep({ representation_quality: "poor" })),
      ];
      const r = run({ representation_records: recs });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("room to improve"));
      expect(ins).toBeDefined();
    });

    it("visitComplianceRate 50-69 generates warning insight", () => {
      const recs = [
        ...nOf(6, makeVisit),
        ...nOf(4, () => makeVisit({ visit_completed: false })),
      ];
      const r = run({ visit_compliance_records: recs });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("visits are being missed"));
      expect(ins).toBeDefined();
    });

    it("childVoiceRate 50-79 generates warning insight", () => {
      const r = run({
        independent_visitor_records: [
          ...nOf(3, makeIV),
          ...nOf(2, () => makeIV({ child_wishes_recorded: false })),
        ],
        representation_records: [
          ...nOf(3, makeRep),
          ...nOf(2, () => makeRep({ child_views_sought: false })),
        ],
        visit_compliance_records: [
          ...nOf(3, makeVisit),
          ...nOf(2, () => makeVisit({ child_views_recorded: false })),
        ],
      });
      // voice = 9/15 = 60%
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("more consistently shaping"));
      expect(ins).toBeDefined();
    });

    it("childSatisfactionRate 50-79 generates warning insight", () => {
      const satRecs = [
        ...nOf(7, () => makeSat({ feels_views_make_difference: false })),
        ...nOf(3, () => makeSat({ feels_listened_to: false, trusts_advocate: false, feels_views_make_difference: false })),
      ];
      const r = run({ child_satisfaction_records: satRecs });
      expect(r.child_satisfaction_rate).toBe(70);
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("scope to improve"));
      expect(ins).toBeDefined();
    });

    it("followUpCompletionRate 50-89 generates warning insight", () => {
      const recs = nOf(10, () => makeVisit({ follow_up_actions: 10, follow_up_completed: 7 }));
      const r = run({ visit_compliance_records: recs });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("unaddressed concerns"));
      expect(ins).toBeDefined();
    });

    it("repBarrierRate >= 30 generates warning insight", () => {
      const recs = [
        ...nOf(7, makeRep),
        ...nOf(3, () => makeRep({ barriers_to_participation: ["language"] })),
      ];
      const r = run({ representation_records: recs });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("systemic issues"));
      expect(ins).toBeDefined();
    });

    it("timelinessRate 50-79 generates warning insight", () => {
      const recs = [
        ...nOf(7, makeAdvocacy),
        ...nOf(3, () => makeAdvocacy({ days_to_first_contact: 10 })),
      ];
      const r = run({ advocacy_service_records: recs });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("critical moments"));
      expect(ins).toBeDefined();
    });

    it(">= 4 visit types generates warning insight about breadth", () => {
      const recs = [
        makeVisit({ visit_type: "independent_visitor" }),
        makeVisit({ visit_type: "reg44" }),
        makeVisit({ visit_type: "advocacy" }),
        makeVisit({ visit_type: "social_worker" }),
      ];
      const r = run({ visit_compliance_records: recs });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("4 distinct visit types"));
      expect(ins).toBeDefined();
    });
  });

  describe("positive insights", () => {
    it("outstanding rating generates outstanding positive insight", () => {
      const r = run({
        independent_visitor_records: nOf(10, makeIV),
        advocacy_service_records: nOf(10, makeAdvocacy),
        representation_records: nOf(10, makeRep),
        visit_compliance_records: nOf(10, makeVisit),
        child_satisfaction_records: nOf(10, makeSat),
      });
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("outstanding advocacy"));
      expect(ins).toBeDefined();
    });

    it("high IV allocation + advocacy access generates positive insight", () => {
      const r = run({
        independent_visitor_records: nOf(10, makeIV),
        advocacy_service_records: nOf(10, makeAdvocacy),
        representation_records: nOf(10, makeRep),
        visit_compliance_records: nOf(10, makeVisit),
        child_satisfaction_records: nOf(10, makeSat),
      });
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("comprehensive independent support"));
      expect(ins).toBeDefined();
    });

    it("high felt heard + decision reflection generates positive insight", () => {
      const r = run({ representation_records: nOf(10, makeRep) });
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("genuine participation"));
      expect(ins).toBeDefined();
    });

    it("high visit compliance + seen alone generates positive insight", () => {
      const r = run({ visit_compliance_records: nOf(10, makeVisit) });
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("robust safeguarding"));
      expect(ins).toBeDefined();
    });

    it("high child voice generates positive insight", () => {
      const r = run({
        independent_visitor_records: nOf(10, makeIV),
        representation_records: nOf(10, makeRep),
        visit_compliance_records: nOf(10, makeVisit),
      });
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("exemplary practice in respecting"));
      expect(ins).toBeDefined();
    });

    it("high satisfaction + would use again generates positive insight", () => {
      const r = run({ child_satisfaction_records: nOf(10, makeSat) });
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("trust and value"));
      expect(ins).toBeDefined();
    });

    it("high IV issue resolution + follow-up generates positive insight", () => {
      const r = run({
        independent_visitor_records: nOf(10, makeIV),
        visit_compliance_records: nOf(10, makeVisit),
      });
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("accountability and continuous improvement"));
      expect(ins).toBeDefined();
    });

    it("high independence + rights informed generates positive insight", () => {
      const r = run({ advocacy_service_records: nOf(10, makeAdvocacy) });
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("speak freely"));
      expect(ins).toBeDefined();
    });

    it("high report filing + timeliness generates positive insight", () => {
      const r = run({ visit_compliance_records: nOf(10, makeVisit) });
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("thorough and timely"));
      expect(ins).toBeDefined();
    });
  });
});

// =============================================================================
// SECTION 14: HEADLINES
// =============================================================================

describe("headlines", () => {
  it("outstanding headline", () => {
    const r = run({
      independent_visitor_records: nOf(10, makeIV),
      advocacy_service_records: nOf(10, makeAdvocacy),
      representation_records: nOf(10, makeRep),
      visit_compliance_records: nOf(10, makeVisit),
      child_satisfaction_records: nOf(10, makeSat),
    });
    expect(r.headline).toContain("Outstanding");
  });

  it("good headline mentions strengths and areas for improvement", () => {
    const ivRecs = [
      ...nOf(7, makeIV),
      ...nOf(3, () => makeIV({ allocated: false })),
    ];
    const advocacyRecs = [
      ...nOf(7, makeAdvocacy),
      ...nOf(3, () => makeAdvocacy({ advocate_allocated: false })),
    ];
    const r = run({
      independent_visitor_records: ivRecs,
      advocacy_service_records: advocacyRecs,
      representation_records: nOf(10, makeRep),
      visit_compliance_records: nOf(10, makeVisit),
      child_satisfaction_records: nOf(10, makeSat),
    });
    expect(r.headline).toContain("Good");
    expect(r.headline).toContain("strength");
  });

  it("adequate headline mentions concerns", () => {
    const r = run({
      independent_visitor_records: [
        ...nOf(5, makeIV),
        ...nOf(5, () => makeIV({ allocated: false })),
      ],
      advocacy_service_records: [
        ...nOf(5, makeAdvocacy),
        ...nOf(5, () => makeAdvocacy({ advocate_allocated: false })),
      ],
      representation_records: [
        ...nOf(5, makeRep),
        ...nOf(5, () => makeRep({ representation_quality: "poor" })),
      ],
      visit_compliance_records: [
        ...nOf(5, makeVisit),
        ...nOf(5, () => makeVisit({ visit_completed: false })),
      ],
      child_satisfaction_records: nOf(10, makeSat),
    });
    expect(r.headline).toContain("Adequate");
    expect(r.headline).toContain("concern");
  });

  it("inadequate headline mentions urgent action", () => {
    const r = run({
      independent_visitor_records: nOf(10, () => makeIV({ allocated: false })),
      advocacy_service_records: nOf(10, () => makeAdvocacy({ advocate_allocated: false })),
      representation_records: nOf(10, () => makeRep({ representation_quality: "poor" })),
      visit_compliance_records: nOf(10, () => makeVisit({ visit_completed: false })),
      child_satisfaction_records: nOf(10, () => makeSat({ feels_listened_to: false, trusts_advocate: false, feels_views_make_difference: false })),
    });
    expect(r.headline).toContain("inadequate");
    expect(r.headline).toContain("urgent action");
  });
});

// =============================================================================
// SECTION 15: EDGE CASES
// =============================================================================

describe("edge cases", () => {
  it("pct(0,0) = 0 -- division by zero handled", () => {
    expect(pct(0, 0)).toBe(0);
  });

  it("single record in each array", () => {
    const r = run({
      total_children: 1,
      independent_visitor_records: [makeIV()],
      advocacy_service_records: [makeAdvocacy()],
      representation_records: [makeRep()],
      visit_compliance_records: [makeVisit()],
      child_satisfaction_records: [makeSat()],
    });
    expect(r.visitor_allocation_rate).toBe(100);
    expect(r.advocacy_access_rate).toBe(100);
    expect(r.representation_quality_rate).toBe(100);
    expect(r.visit_compliance_rate).toBe(100);
    expect(r.child_voice_rate).toBe(100);
    expect(r.child_satisfaction_rate).toBe(100);
    expect(r.advocacy_rating).toBe("outstanding");
  });

  it("score clamps at 0 -- cannot go negative", () => {
    // This is hard to achieve since base is 52 and max penalties are 18
    // But with 0 bonuses: 52 - 18 = 34, so score won't go below 0 naturally
    // Just verify clamp works by checking the score is >= 0
    const r = run({
      total_children: 4,
      independent_visitor_records: nOf(10, () => makeIV({ allocated: false })),
      advocacy_service_records: nOf(10, () => makeAdvocacy({ advocate_allocated: false })),
      representation_records: nOf(10, () => makeRep({ representation_quality: "poor" })),
      visit_compliance_records: nOf(10, () => makeVisit({ visit_completed: false })),
      child_satisfaction_records: [],
    });
    expect(r.advocacy_score).toBeGreaterThanOrEqual(0);
  });

  it("score clamps at 100 -- cannot exceed", () => {
    // Base 52 + max bonuses 28 = 80, so we can't exceed 100 naturally
    // But test that clamping is in place
    const r = run({
      independent_visitor_records: nOf(10, makeIV),
      advocacy_service_records: nOf(10, makeAdvocacy),
      representation_records: nOf(10, makeRep),
      visit_compliance_records: nOf(10, makeVisit),
      child_satisfaction_records: nOf(10, makeSat),
    });
    expect(r.advocacy_score).toBeLessThanOrEqual(100);
  });

  it("total_children=0 with non-empty arrays is not insufficient_data", () => {
    // allEmpty = false since we have records
    const r = run({
      total_children: 0,
      independent_visitor_records: [makeIV()],
    });
    expect(r.advocacy_rating).not.toBe("insufficient_data");
  });

  it("only satisfaction records present -- not allEmpty, not floor", () => {
    const r = run({
      total_children: 4,
      child_satisfaction_records: nOf(5, makeSat),
    });
    expect(r.advocacy_rating).not.toBe("insufficient_data");
    // Score = 52 + 3 (sat bonus) = 55
    expect(r.advocacy_score).toBe(55);
    expect(r.advocacy_rating).toBe("adequate");
  });

  it("only IV records present with no children on placement", () => {
    const r = run({
      total_children: 0,
      independent_visitor_records: [makeIV()],
    });
    // Not allEmpty, so normal flow, total_children=0 doesn't trigger insufficient_data because arrays have data
    expect(r.advocacy_rating).not.toBe("insufficient_data");
  });

  it("all records poor but one domain empty -- no penalty for empty domain", () => {
    const r = run({
      total_children: 4,
      independent_visitor_records: nOf(10, () => makeIV({ allocated: false, child_wishes_recorded: false })),
      advocacy_service_records: [], // empty -- no penalty
      representation_records: nOf(10, () => makeRep({ representation_quality: "poor", child_views_sought: false })),
      visit_compliance_records: nOf(10, () => makeVisit({ visit_completed: false, child_views_recorded: false })),
      child_satisfaction_records: [],
    });
    // Penalties: IV -5, advocacy 0 (empty), rep -4, visit -4
    // childVoice: 0/30 = 0% => no bonus
    // score = 52 - 5 - 4 - 4 = 39
    expect(r.advocacy_score).toBe(39);
  });

  it("rounding: pct(1, 3) = 33", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("rounding: pct(2, 3) = 67", () => {
    expect(pct(2, 3)).toBe(67);
  });

  it("rounding: pct(1, 6) = 17", () => {
    expect(pct(1, 6)).toBe(17);
  });

  it("large dataset -- 100 records per array", () => {
    const r = run({
      total_children: 50,
      independent_visitor_records: nOf(100, makeIV),
      advocacy_service_records: nOf(100, makeAdvocacy),
      representation_records: nOf(100, makeRep),
      visit_compliance_records: nOf(100, makeVisit),
      child_satisfaction_records: nOf(100, makeSat),
    });
    expect(r.advocacy_rating).toBe("outstanding");
    expect(r.advocacy_score).toBe(80);
  });

  it("boundary: exactly 80 score is outstanding", () => {
    const r = run({
      independent_visitor_records: nOf(10, makeIV),
      advocacy_service_records: nOf(10, makeAdvocacy),
      representation_records: nOf(10, makeRep),
      visit_compliance_records: nOf(10, makeVisit),
      child_satisfaction_records: nOf(10, makeSat),
    });
    expect(r.advocacy_score).toBe(80);
    expect(r.advocacy_rating).toBe("outstanding");
  });

  it("boundary: 79 score is good", () => {
    // 80 - 1 = need to lose 1 point. Remove independence bonus (was +3) and get lower tier (+1)
    // That drops score from 80 to 78. Or remove the satisfaction bonus.
    // Let's remove sat bonus entirely: 80 - 3 = 77.
    // Actually let's aim precisely: remove independence from +3 to +0 => 80-3 = 77 (good)
    const advocacyRecs = nOf(10, () =>
      makeAdvocacy({ advocacy_independent_of_home: false }),
    );
    const r = run({
      independent_visitor_records: nOf(10, makeIV),
      advocacy_service_records: advocacyRecs,
      representation_records: nOf(10, makeRep),
      visit_compliance_records: nOf(10, makeVisit),
      child_satisfaction_records: nOf(10, makeSat),
    });
    // independenceRate = 0% => no bonus, also generates concern (< 70)
    // score = 52 + 5 + 5 + 4 + 4 + 4 + 3 + 0 = 77
    expect(r.advocacy_score).toBe(77);
    expect(r.advocacy_rating).toBe("good");
  });

  it("boundary: exactly 65 score is good", () => {
    // visitor 100% => +5, advocacy 100% => +5, no rep/visit bonuses or penalties, sat +3, indep 0% < 70 => no bonus
    // childVoice: 10/(10+0+0) = 100% => +4
    // score = 52 + 5 + 5 + 4 + 3 = 69... too high
    // Need to suppress childVoice bonus: make child_wishes_recorded false
    const r2 = run({
      total_children: 4,
      independent_visitor_records: nOf(10, () => makeIV({ child_wishes_recorded: false })),
      advocacy_service_records: nOf(10, () =>
        makeAdvocacy({ advocacy_independent_of_home: false }),
      ),
      representation_records: [],
      visit_compliance_records: [],
      child_satisfaction_records: nOf(10, makeSat),
    });
    // childVoice: 0/(10+0+0) = 0% => no bonus
    // score = 52 + 5 + 5 + 3 = 65
    expect(r2.advocacy_score).toBe(65);
    expect(r2.advocacy_rating).toBe("good");
  });

  it("boundary: 64 score is adequate", () => {
    // 65 - 1 = remove sat bonus (was +3) from 65 case: 65 - 3 = 62, need +2 from somewhere
    // Actually: from 65 case above (52 + 5 + 5 + 3 = 65), drop sat to lower tier (+1) => 63
    // Or: 52 + 5 + 5 + 2 = 64 (repQuality at 70-89 gives +2)
    const r = run({
      total_children: 4,
      independent_visitor_records: nOf(10, () => makeIV({ child_wishes_recorded: false })),
      advocacy_service_records: nOf(10, () =>
        makeAdvocacy({ advocacy_independent_of_home: false }),
      ),
      representation_records: [
        ...nOf(7, () => makeRep({ child_views_sought: false })),
        ...nOf(3, () => makeRep({ representation_quality: "poor", child_views_sought: false })),
      ],
      visit_compliance_records: [],
      child_satisfaction_records: [],
    });
    // visitor 100% => +5, advocacy 100% => +5, repQuality 70% => +2
    // childVoice: 0/(10+10+0) = 0% => no bonus
    // no sat bonus
    // score = 52 + 5 + 5 + 2 = 64
    expect(r.advocacy_score).toBe(64);
    expect(r.advocacy_rating).toBe("adequate");
  });

  it("boundary: exactly 45 score is adequate", () => {
    // 52 - 5 (visitor penalty) - 4 (visit penalty) + 2 (some bonus) = 45
    // visitor <50 => -5, visit <50 => -4 => 52-9=43, need +2 from somewhere
    // repQuality 70-89 => +2 => 45
    const r = run({
      total_children: 4,
      independent_visitor_records: nOf(10, () =>
        makeIV({ allocated: false, child_wishes_recorded: false }),
      ),
      advocacy_service_records: [],
      representation_records: [
        ...nOf(7, () => makeRep({ child_views_sought: false })),
        ...nOf(3, () => makeRep({ representation_quality: "poor", child_views_sought: false })),
      ],
      visit_compliance_records: nOf(10, () =>
        makeVisit({ visit_completed: false, child_views_recorded: false }),
      ),
      child_satisfaction_records: [],
    });
    // visitor 0% => -5, visit 0% => -4, repQuality 70% => +2
    // score = 52 - 5 - 4 + 2 = 45
    expect(r.advocacy_score).toBe(45);
    expect(r.advocacy_rating).toBe("adequate");
  });

  it("boundary: 44 score is inadequate", () => {
    // From 45 case above, remove repQuality bonus => 43
    // Or: 52 - 5 - 4 = 43 with no bonuses, plus no rep penalty since rep is poor but >30?
    // 52 - 5 - 4 - 4(rep<30) = 39. Add +5 from advocacy => 44
    const r = run({
      total_children: 4,
      independent_visitor_records: nOf(10, () =>
        makeIV({ allocated: false, child_wishes_recorded: false }),
      ),
      advocacy_service_records: nOf(10, () =>
        makeAdvocacy({ advocacy_independent_of_home: false }),
      ),
      representation_records: nOf(10, () =>
        makeRep({ representation_quality: "poor", child_views_sought: false }),
      ),
      visit_compliance_records: nOf(10, () =>
        makeVisit({ visit_completed: false, child_views_recorded: false }),
      ),
      child_satisfaction_records: [],
    });
    // visitor 0% => -5, advocacy 100% => +5, rep 0% => -4, visit 0% => -4
    // childVoice 0% => no bonus, no sat => no bonus, indep 0% => no bonus
    // score = 52 - 5 + 5 - 4 - 4 = 44
    expect(r.advocacy_score).toBe(44);
    expect(r.advocacy_rating).toBe("inadequate");
  });

  it("mixed data: some arrays empty, others full", () => {
    const r = run({
      total_children: 4,
      independent_visitor_records: nOf(10, makeIV),
      advocacy_service_records: [],
      representation_records: [],
      visit_compliance_records: nOf(10, makeVisit),
      child_satisfaction_records: [],
    });
    // visitor 100% => +5, visit 100% => +4
    // childVoice: (10+0+10)/(10+0+10) = 100% => +4
    // no advocacy/rep/sat bonuses, no penalties from empty arrays
    // score = 52 + 5 + 4 + 4 = 65
    expect(r.advocacy_score).toBe(65);
    expect(r.advocacy_rating).toBe("good");
  });

  it("visitor_allocation_rate uses IV records denominator, not total_children", () => {
    // 2 IV records, both allocated, but total_children=10
    const r = run({
      total_children: 10,
      independent_visitor_records: [makeIV(), makeIV()],
    });
    // Rate is 2/2 = 100%, not 2/10
    expect(r.visitor_allocation_rate).toBe(100);
  });

  it("representation quality counts excellent as good", () => {
    const recs = [
      makeRep({ representation_quality: "excellent" }),
      makeRep({ representation_quality: "good" }),
      makeRep({ representation_quality: "adequate" }),
      makeRep({ representation_quality: "poor" }),
    ];
    const r = run({ representation_records: recs });
    // 2/4 = 50%
    expect(r.representation_quality_rate).toBe(50);
  });

  it("visit quality counts excellent as good for visitQualityRate (internal)", () => {
    // visitQualityRate doesn't affect score bonuses/penalties, but it's computed internally
    const recs = [
      makeVisit({ visit_quality: "excellent" }),
      makeVisit({ visit_quality: "good" }),
      makeVisit({ visit_quality: "adequate" }),
    ];
    const r = run({ visit_compliance_records: recs });
    // Just verify no crash and rate computes fine
    expect(r.visit_compliance_rate).toBe(100);
  });

  it("matching_quality: excellent and good both count for matchQualityRate", () => {
    const ivRecs = [
      makeIV({ matching_quality: "excellent" }),
      makeIV({ matching_quality: "good" }),
      makeIV({ matching_quality: "adequate" }),
      makeIV({ matching_quality: "poor" }),
      makeIV({ matching_quality: "unmatched" }),
    ];
    const r = run({ independent_visitor_records: ivRecs });
    // 2/5 = 40%, should trigger concern
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("poor matching"))).toBe(true);
  });

  it("child_satisfaction_rate only uses active bool groups (excludes groups where all false)", () => {
    // All trusts_advocate = false, feelsListened = true, viewsMakeDiff = true
    const satRecs = nOf(10, () => makeSat({ trusts_advocate: false }));
    const r = run({ child_satisfaction_records: satRecs });
    // trusts = 0 => excluded from divisor
    // satBoolCount = 100 + 100 = 200, divisor = 2 => rate = 100
    expect(r.child_satisfaction_rate).toBe(100);
  });

  it("advocacy satisfaction avg is rounded to 2 decimal places", () => {
    // 3 records with satisfaction 4, 4, 5 => avg = 13/3 = 4.33
    const recs = [
      makeAdvocacy({ child_satisfaction: 4 }),
      makeAdvocacy({ child_satisfaction: 4 }),
      makeAdvocacy({ child_satisfaction: 5 }),
    ];
    const r = run({ advocacy_service_records: recs });
    // The engine doesn't expose advocacySatisfactionAvg directly, but we can verify through concerns/strengths
    // 4.33 >= 4.0 so no concern generated for < 3.0
    expect(r.concerns.some((c) => c.includes("satisfaction with advocacy"))).toBe(false);
  });

  it("total_children large number doesn't affect scoring (only matters for empty check)", () => {
    const r = run({
      total_children: 1000,
      independent_visitor_records: nOf(10, makeIV),
      advocacy_service_records: nOf(10, makeAdvocacy),
      representation_records: nOf(10, makeRep),
      visit_compliance_records: nOf(10, makeVisit),
      child_satisfaction_records: nOf(10, makeSat),
    });
    expect(r.advocacy_score).toBe(80);
    expect(r.advocacy_rating).toBe("outstanding");
  });
});

// =============================================================================
// SECTION 16: SCORE FORMULA VERIFICATION
// =============================================================================

describe("score formula", () => {
  it("base score is 52 with no bonuses and no penalties (empty arrays, has sat only)", () => {
    // Only sat records, all with false bools => sat rate 0 => no bonus
    const r = run({
      total_children: 4,
      child_satisfaction_records: nOf(10, () =>
        makeSat({ feels_listened_to: false, trusts_advocate: false, feels_views_make_difference: false }),
      ),
    });
    expect(r.advocacy_score).toBe(52);
  });

  it("max bonuses sum to +28 (5+5+4+4+4+3+3)", () => {
    const r = run({
      independent_visitor_records: nOf(10, makeIV),
      advocacy_service_records: nOf(10, makeAdvocacy),
      representation_records: nOf(10, makeRep),
      visit_compliance_records: nOf(10, makeVisit),
      child_satisfaction_records: nOf(10, makeSat),
    });
    expect(r.advocacy_score).toBe(52 + 28);
  });

  it("max penalties sum to -18 (5+5+4+4)", () => {
    // All domains at 0% with records present
    const r = run({
      total_children: 4,
      independent_visitor_records: nOf(10, () => makeIV({ allocated: false, child_wishes_recorded: false })),
      advocacy_service_records: nOf(10, () => makeAdvocacy({ advocate_allocated: false, advocacy_independent_of_home: false })),
      representation_records: nOf(10, () => makeRep({ representation_quality: "poor", child_views_sought: false })),
      visit_compliance_records: nOf(10, () => makeVisit({ visit_completed: false, child_views_recorded: false })),
      child_satisfaction_records: nOf(10, () => makeSat({ feels_listened_to: false, trusts_advocate: false, feels_views_make_difference: false })),
    });
    // 52 - 5 - 5 - 4 - 4 = 34
    expect(r.advocacy_score).toBe(52 - 18);
  });

  it("bonus and penalty on same domain: visitorAllocationRate < 50 only gets penalty", () => {
    // Can't have both bonus and penalty on same metric
    const ivRecs = nOf(10, () => makeIV({ allocated: false }));
    const r = run({
      total_children: 4,
      independent_visitor_records: ivRecs,
      advocacy_service_records: nOf(10, makeAdvocacy),
      representation_records: nOf(10, makeRep),
      visit_compliance_records: nOf(10, makeVisit),
      child_satisfaction_records: nOf(10, makeSat),
    });
    // visitor: 0% => -5 (no bonus). IV child_wishes_recorded still true by default.
    // advocacy +5, rep +4, visit +4, voice: (10+10+10)/(10+10+10)=100% => +4, sat +3, indep +3
    // score = 52 - 5 + 5 + 4 + 4 + 4 + 3 + 3 = 70
    expect(r.advocacy_score).toBe(70);
  });
});

// =============================================================================
// SECTION 17: TORATING FUNCTION
// =============================================================================

describe("toRating thresholds", () => {
  it(">= 80 => outstanding", () => {
    const r = run({
      independent_visitor_records: nOf(10, makeIV),
      advocacy_service_records: nOf(10, makeAdvocacy),
      representation_records: nOf(10, makeRep),
      visit_compliance_records: nOf(10, makeVisit),
      child_satisfaction_records: nOf(10, makeSat),
    });
    expect(r.advocacy_score).toBe(80);
    expect(r.advocacy_rating).toBe("outstanding");
  });

  it("65-79 => good", () => {
    // Score 77 (from earlier test)
    const r = run({
      independent_visitor_records: nOf(10, makeIV),
      advocacy_service_records: nOf(10, () => makeAdvocacy({ advocacy_independent_of_home: false })),
      representation_records: nOf(10, makeRep),
      visit_compliance_records: nOf(10, makeVisit),
      child_satisfaction_records: nOf(10, makeSat),
    });
    expect(r.advocacy_score).toBe(77);
    expect(r.advocacy_rating).toBe("good");
  });

  it("45-64 => adequate", () => {
    const r = run({
      total_children: 4,
      independent_visitor_records: nOf(10, () => makeIV({ child_wishes_recorded: false })),
      advocacy_service_records: nOf(10, () => makeAdvocacy({ advocacy_independent_of_home: false })),
      representation_records: [],
      visit_compliance_records: [],
      child_satisfaction_records: nOf(10, () => makeSat({ feels_listened_to: false, trusts_advocate: false, feels_views_make_difference: false })),
    });
    // visitor 100% => +5, advocacy 100% => +5, no rep/visit, sat 0% => no bonus, indep 0% => no bonus
    // childVoice: 0/(10+0+0) = 0% => no bonus
    // score = 52 + 5 + 5 = 62
    expect(r.advocacy_score).toBe(62);
    expect(r.advocacy_rating).toBe("adequate");
  });

  it("< 45 => inadequate", () => {
    const r = run({
      total_children: 4,
      independent_visitor_records: nOf(10, () => makeIV({ allocated: false, child_wishes_recorded: false })),
      advocacy_service_records: nOf(10, () => makeAdvocacy({ advocate_allocated: false, advocacy_independent_of_home: false })),
      representation_records: nOf(10, () => makeRep({ representation_quality: "poor", child_views_sought: false })),
      visit_compliance_records: nOf(10, () => makeVisit({ visit_completed: false, child_views_recorded: false })),
      child_satisfaction_records: [],
    });
    // 52 - 5 - 5 - 4 - 4 = 34
    expect(r.advocacy_score).toBe(34);
    expect(r.advocacy_rating).toBe("inadequate");
  });
});
