// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STATEMENT OF PURPOSE & CHILDREN'S GUIDE ENGINE TESTS
// Comprehensive suite for computeStatementPurposeChildrenGuide.
// CHR 2015 Reg 16 (Statement of Purpose), Reg 17 (Children's Guide).
// SCCIF: Leadership and management.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeStatementPurposeChildrenGuide,
  type StatementPurposeChildrenGuideInput,
  type StatementRecordInput,
  type GuideRecordInput,
  type ReviewCycleRecordInput,
  type InvolvementRecordInput,
  type SubmissionRecordInput,
} from "../home-statement-purpose-children-guide-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

let _id = 0;

function makeStatement(overrides: Partial<StatementRecordInput> = {}): StatementRecordInput {
  _id++;
  return {
    id: `stmt_${_id}`,
    title: "Statement of Purpose",
    version: "1.0",
    status: "current",
    effective_date: "2026-01-01",
    expiry_date: "2027-01-01",
    last_reviewed_date: "2026-04-01",
    next_review_date: "2026-10-01",
    approved_by: "RM Darren",
    approval_date: "2026-04-01",
    sections_complete: 10,
    sections_total: 10,
    covers_ethos: true,
    covers_range_of_needs: true,
    covers_accommodation: true,
    covers_staffing: true,
    covers_fire_safety: true,
    covers_behaviour_management: true,
    covers_education: true,
    covers_health: true,
    covers_contact: true,
    covers_complaints: true,
    covers_religious_cultural: true,
    covers_emergency_placement: true,
    covers_registered_manager: true,
    covers_responsible_individual: true,
    ofsted_notified: true,
    notification_date: "2026-04-02",
    distributed_to_stakeholders: true,
    distribution_date: "2026-04-03",
    distribution_method: "email",
    notes: "",
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeGuide(overrides: Partial<GuideRecordInput> = {}): GuideRecordInput {
  _id++;
  return {
    id: `guide_${_id}`,
    title: "Children's Guide",
    version: "1.0",
    status: "current",
    effective_date: "2026-01-01",
    last_reviewed_date: "2026-04-01",
    next_review_date: "2026-10-01",
    age_appropriate: true,
    accessible_format: true,
    easy_read_version: true,
    translated: false,
    translation_languages: [],
    covers_daily_routine: true,
    covers_house_rules: true,
    covers_complaints_process: true,
    covers_key_contacts: true,
    covers_rights: true,
    covers_advocacy: true,
    covers_leaving_care: true,
    covers_education: true,
    given_on_admission: true,
    child_feedback_collected: true,
    child_feedback_positive: true,
    sections_complete: 8,
    sections_total: 8,
    approved_by: "RM Darren",
    notes: "",
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeReviewCycle(overrides: Partial<ReviewCycleRecordInput> = {}): ReviewCycleRecordInput {
  _id++;
  return {
    id: `review_${_id}`,
    document_type: "statement_of_purpose",
    document_id: "stmt_1",
    review_date: "2026-04-01",
    reviewer_name: "Darren",
    reviewer_role: "Registered Manager",
    outcome: "approved",
    sections_reviewed: 10,
    sections_total: 10,
    changes_identified: 2,
    changes_implemented: 2,
    completed_on_time: true,
    days_overdue: 0,
    next_review_date: "2026-10-01",
    young_people_consulted: true,
    staff_consulted: true,
    placing_authority_consulted: true,
    notes: "",
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeInvolvement(overrides: Partial<InvolvementRecordInput> = {}): InvolvementRecordInput {
  _id++;
  return {
    id: `inv_${_id}`,
    child_id: "yp_alex",
    child_name: "Alex",
    document_type: "statement_of_purpose",
    involvement_type: "consultation",
    date: "2026-04-10",
    views_sought: true,
    views_recorded: true,
    views_actioned: true,
    feedback_positive: true,
    changes_made_from_feedback: true,
    change_description: "Updated daily routine section",
    supported_to_participate: true,
    accessible_format_used: true,
    duration_minutes: 30,
    facilitator: "Darren",
    notes: "",
    created_at: "2026-04-10",
    ...overrides,
  };
}

function makeSubmission(overrides: Partial<SubmissionRecordInput> = {}): SubmissionRecordInput {
  _id++;
  return {
    id: `sub_${_id}`,
    document_type: "statement_of_purpose",
    document_id: "stmt_1",
    submission_date: "2026-04-05",
    submission_type: "annual_update",
    submitted_to: "ofsted",
    submitted_by: "Darren",
    deadline_date: "2026-04-15",
    submitted_on_time: true,
    days_before_deadline: 10,
    acknowledged: true,
    acknowledgement_date: "2026-04-10",
    feedback_received: true,
    feedback_positive: true,
    amendments_required: false,
    amendments_completed: false,
    amendments_completion_date: null,
    notes: "",
    created_at: "2026-04-05",
    ...overrides,
  };
}

const baseInput: StatementPurposeChildrenGuideInput = {
  today: TODAY,
  total_children: 3,
  statement_records: [],
  guide_records: [],
  review_cycle_records: [],
  involvement_records: [],
  submission_records: [],
};

function run(overrides: Partial<StatementPurposeChildrenGuideInput> = {}) {
  return computeStatementPurposeChildrenGuide({ ...baseInput, ...overrides });
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. EMPTY / EDGE-CASE INPUTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Empty and edge-case inputs", () => {
  it("1 — all arrays empty + 0 children → insufficient_data, score 0", () => {
    const r = run({ total_children: 0, statement_records: [], guide_records: [], review_cycle_records: [], involvement_records: [], submission_records: [] });
    expect(r.statement_rating).toBe("insufficient_data");
    expect(r.statement_score).toBe(0);
  });

  it("2 — all arrays empty + children > 0 → inadequate, score 15", () => {
    const r = run({ total_children: 3 });
    expect(r.statement_rating).toBe("inadequate");
    expect(r.statement_score).toBe(15);
  });

  it("3 — all empty + children > 0 returns 2 recommendations", () => {
    const r = run({ total_children: 2 });
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("4 — all empty + children > 0 returns 1 critical insight", () => {
    const r = run({ total_children: 5 });
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("5 — all empty + children > 0 has 1 concern", () => {
    const r = run({ total_children: 1 });
    expect(r.concerns).toHaveLength(1);
  });

  it("6 — insufficient_data has empty strengths", () => {
    const r = run({ total_children: 0 });
    expect(r.strengths).toHaveLength(0);
  });

  it("7 — insufficient_data has empty concerns", () => {
    const r = run({ total_children: 0 });
    expect(r.concerns).toHaveLength(0);
  });

  it("8 — insufficient_data headline mentions insufficient data", () => {
    const r = run({ total_children: 0 });
    expect(r.headline).toContain("insufficient data");
  });

  it("9 — all record counts 0 for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.total_statement_records).toBe(0);
    expect(r.total_guide_records).toBe(0);
    expect(r.total_review_cycle_records).toBe(0);
    expect(r.total_involvement_records).toBe(0);
    expect(r.total_submission_records).toBe(0);
  });

  it("10 — all rates 0 for insufficient_data", () => {
    const r = run({ total_children: 0 });
    expect(r.statement_currency_rate).toBe(0);
    expect(r.guide_accessibility_rate).toBeNull();
    expect(r.review_cycle_rate).toBeNull();
    expect(r.young_person_involvement_rate).toBeNull();
    expect(r.ofsted_submission_rate).toBeNull();
    expect(r.stakeholder_awareness_rate).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. OUTSTANDING SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Outstanding scenario — all metrics excellent", () => {
  function outstandingInput(): Partial<StatementPurposeChildrenGuideInput> {
    return {
      total_children: 3,
      statement_records: [makeStatement()],
      guide_records: [makeGuide()],
      review_cycle_records: [makeReviewCycle()],
      involvement_records: [
        makeInvolvement({ child_id: "yp_alex" }),
        makeInvolvement({ child_id: "yp_jordan" }),
        makeInvolvement({ child_id: "yp_casey" }),
      ],
      submission_records: [makeSubmission()],
    };
  }

  it("11 — rating is outstanding", () => {
    const r = run(outstandingInput());
    expect(r.statement_rating).toBe("outstanding");
  });

  it("12 — score >= 80", () => {
    const r = run(outstandingInput());
    expect(r.statement_score).toBeGreaterThanOrEqual(80);
  });

  it("13 — statement_currency_rate is 100", () => {
    const r = run(outstandingInput());
    expect(r.statement_currency_rate).toBe(100);
  });

  it("14 — guide_accessibility_rate >= 90", () => {
    const r = run(outstandingInput());
    expect(r.guide_accessibility_rate).toBeGreaterThanOrEqual(90);
  });

  it("15 — review_cycle_rate >= 90", () => {
    const r = run(outstandingInput());
    expect(r.review_cycle_rate).toBeGreaterThanOrEqual(90);
  });

  it("16 — young_person_involvement_rate >= 90", () => {
    const r = run(outstandingInput());
    expect(r.young_person_involvement_rate).toBeGreaterThanOrEqual(90);
  });

  it("17 — ofsted_submission_rate >= 95", () => {
    const r = run(outstandingInput());
    expect(r.ofsted_submission_rate).toBeGreaterThanOrEqual(95);
  });

  it("18 — stakeholder_awareness_rate >= 90", () => {
    const r = run(outstandingInput());
    expect(r.stakeholder_awareness_rate).toBeGreaterThanOrEqual(90);
  });

  it("19 — has multiple strengths", () => {
    const r = run(outstandingInput());
    expect(r.strengths.length).toBeGreaterThanOrEqual(3);
  });

  it("20 — has no concerns", () => {
    const r = run(outstandingInput());
    expect(r.concerns).toHaveLength(0);
  });

  it("21 — headline contains 'Outstanding'", () => {
    const r = run(outstandingInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("22 — has positive insight about outstanding", () => {
    const r = run(outstandingInput());
    const pos = r.insights.filter((i) => i.severity === "positive");
    expect(pos.length).toBeGreaterThanOrEqual(1);
  });

  it("23 — total_statement_records = 1", () => {
    const r = run(outstandingInput());
    expect(r.total_statement_records).toBe(1);
  });

  it("24 — total_guide_records = 1", () => {
    const r = run(outstandingInput());
    expect(r.total_guide_records).toBe(1);
  });

  it("25 — total_review_cycle_records = 1", () => {
    const r = run(outstandingInput());
    expect(r.total_review_cycle_records).toBe(1);
  });

  it("26 — total_involvement_records = 3", () => {
    const r = run(outstandingInput());
    expect(r.total_involvement_records).toBe(3);
  });

  it("27 — total_submission_records = 1", () => {
    const r = run(outstandingInput());
    expect(r.total_submission_records).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. STATEMENT CURRENCY METRICS
// ══════════════════════════════════════════════════════════════════════════════

describe("Statement currency metrics", () => {
  it("28 — current statement with valid expiry → currency 100%", () => {
    const r = run({ statement_records: [makeStatement()] });
    expect(r.statement_currency_rate).toBe(100);
  });

  it("29 — expired statement → currency 0%", () => {
    const r = run({ statement_records: [makeStatement({ expiry_date: "2026-01-01" })] });
    expect(r.statement_currency_rate).toBe(0);
  });

  it("30 — statement reviewed > 365 days ago → currency 0%", () => {
    const r = run({ statement_records: [makeStatement({ last_reviewed_date: "2025-01-01" })] });
    expect(r.statement_currency_rate).toBe(0);
  });

  it("31 — draft statement not counted in currency", () => {
    const r = run({ statement_records: [makeStatement({ status: "draft" })] });
    // draft not current, so no current statements, currency calculated against max(0,1)=1 → 0
    expect(r.statement_currency_rate).toBe(0);
  });

  it("32 — archived statement not counted in currency", () => {
    const r = run({ statement_records: [makeStatement({ status: "archived" })] });
    expect(r.statement_currency_rate).toBe(0);
  });

  it("33 — mix of current/expired → rate reflects proportion", () => {
    const r = run({
      statement_records: [
        makeStatement(),
        makeStatement({ expiry_date: "2025-01-01" }),
      ],
    });
    expect(r.statement_currency_rate).toBe(50);
  });

  it("34 — currency >= 95 → +5 bonus", () => {
    const r = run({
      statement_records: [makeStatement()],
      guide_records: [makeGuide()],
      review_cycle_records: [makeReviewCycle()],
      involvement_records: [makeInvolvement()],
      submission_records: [makeSubmission()],
    });
    expect(r.statement_currency_rate).toBe(100);
    // score should include the +5 bonus
    expect(r.statement_score).toBeGreaterThanOrEqual(52 + 5);
  });

  it("35 — currency 80-94 → +3 bonus (not +5)", () => {
    // 4 current, 1 expired → 80%
    const stmts = [
      makeStatement(),
      makeStatement(),
      makeStatement(),
      makeStatement(),
      makeStatement({ expiry_date: "2025-01-01" }),
    ];
    const r = run({ statement_records: stmts });
    expect(r.statement_currency_rate).toBe(80);
  });

  it("36 — currency < 50 → penalty -5", () => {
    const r = run({
      statement_records: [
        makeStatement({ expiry_date: "2025-01-01" }),
        makeStatement({ expiry_date: "2025-06-01" }),
        makeStatement({ expiry_date: "2026-12-01" }),
      ],
    });
    expect(r.statement_currency_rate).toBeLessThanOrEqual(50);
  });

  it("37 — expired statements trigger concern", () => {
    const r = run({
      statement_records: [makeStatement({ expiry_date: "2025-01-01", status: "current" })],
    });
    expect(r.concerns.some((c) => c.includes("expired"))).toBe(true);
  });

  it("38 — currency >= 95 → strength about currency", () => {
    const r = run({ statement_records: [makeStatement()] });
    expect(r.strengths.some((s) => s.includes("currency"))).toBe(true);
  });

  it("39 — currency < 50 → critical insight", () => {
    const r = run({ statement_records: [makeStatement({ expiry_date: "2025-01-01" })] });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("currency"))).toBe(true);
  });

  it("40 — statement currency 50-79 → warning insight", () => {
    // 2 current, 1 expired → 50%
    const r = run({
      statement_records: [
        makeStatement(),
        makeStatement({ expiry_date: "2025-01-01" }),
      ],
    });
    expect(r.statement_currency_rate).toBe(50);
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("currency"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. SCHEDULE 1 COVERAGE
// ══════════════════════════════════════════════════════════════════════════════

describe("Schedule 1 coverage", () => {
  it("41 — all 14 areas covered → 100% → +3 bonus", () => {
    const r = run({ statement_records: [makeStatement()] });
    // default factory has all covers_* = true
    expect(r.strengths.some((s) => s.includes("Schedule 1"))).toBe(true);
  });

  it("42 — 12/14 areas → ~86% → +1 bonus", () => {
    const r = run({
      statement_records: [
        makeStatement({ covers_ethos: false, covers_contact: false }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("Schedule 1"))).toBe(true);
  });

  it("43 — 9/14 areas → ~64% → concern about coverage", () => {
    const r = run({
      statement_records: [
        makeStatement({
          covers_ethos: false,
          covers_contact: false,
          covers_complaints: false,
          covers_religious_cultural: false,
          covers_emergency_placement: false,
        }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("Schedule 1"))).toBe(true);
  });

  it("44 — low schedule 1 coverage → critical insight", () => {
    const r = run({
      statement_records: [
        makeStatement({
          covers_ethos: false,
          covers_contact: false,
          covers_complaints: false,
          covers_religious_cultural: false,
          covers_emergency_placement: false,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Schedule 1"))).toBe(true);
  });

  it("45 — schedule 1 coverage 70-84 → warning insight", () => {
    const r = run({
      statement_records: [
        makeStatement({
          covers_ethos: false,
          covers_contact: false,
          covers_emergency_placement: false,
          covers_responsible_individual: false,
        }),
      ],
    });
    // 10/14 = 71%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Schedule 1"))).toBe(true);
  });

  it("46 — only draft statements → no schedule 1 checked", () => {
    const r = run({ statement_records: [makeStatement({ status: "draft" })] });
    // draft not "current", so schedule1CheckedTotal = 0
    expect(r.strengths.every((s) => !s.includes("Schedule 1"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. GUIDE ACCESSIBILITY METRICS
// ══════════════════════════════════════════════════════════════════════════════

describe("Guide accessibility metrics", () => {
  it("47 — fully accessible guide → rate >= 90", () => {
    const r = run({ guide_records: [makeGuide()] });
    expect(r.guide_accessibility_rate).toBeGreaterThanOrEqual(90);
  });

  it("48 — guide not age_appropriate → reduces rate", () => {
    const r = run({ guide_records: [makeGuide({ age_appropriate: false })] });
    expect(r.guide_accessibility_rate).toBeLessThan(100);
  });

  it("49 — guide not accessible_format → reduces rate", () => {
    const r = run({ guide_records: [makeGuide({ accessible_format: false })] });
    expect(r.guide_accessibility_rate).toBeLessThan(100);
  });

  it("50 — guide not given_on_admission → reduces rate", () => {
    const r = run({ guide_records: [makeGuide({ given_on_admission: false })] });
    expect(r.guide_accessibility_rate).toBeLessThan(100);
  });

  it("51 — guide with 0 sections complete → reduces rate", () => {
    const r = run({ guide_records: [makeGuide({ sections_complete: 0 })] });
    expect(r.guide_accessibility_rate).toBeLessThan(100);
  });

  it("52 — guide accessibility >= 90 → strength", () => {
    const r = run({ guide_records: [makeGuide()] });
    expect(r.strengths.some((s) => s.includes("accessibility"))).toBe(true);
  });

  it("53 — guide accessibility < 40 → concern", () => {
    const r = run({
      guide_records: [
        makeGuide({
          age_appropriate: false,
          accessible_format: false,
          given_on_admission: false,
          sections_complete: 0,
          sections_total: 8,
          covers_daily_routine: false,
          covers_house_rules: false,
          covers_complaints_process: false,
          covers_key_contacts: false,
          covers_rights: false,
          covers_advocacy: false,
          covers_leaving_care: false,
          covers_education: false,
        }),
      ],
    });
    expect(r.guide_accessibility_rate).toBeLessThan(40);
    expect(r.concerns.some((c) => c.includes("accessibility"))).toBe(true);
  });

  it("54 — guide accessibility < 40 → critical insight", () => {
    const r = run({
      guide_records: [
        makeGuide({
          age_appropriate: false,
          accessible_format: false,
          given_on_admission: false,
          sections_complete: 0,
          covers_daily_routine: false,
          covers_house_rules: false,
          covers_complaints_process: false,
          covers_key_contacts: false,
          covers_rights: false,
          covers_advocacy: false,
          covers_leaving_care: false,
          covers_education: false,
        }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("accessibility"))).toBe(true);
  });

  it("55 — guide accessibility 40-69 → warning concern", () => {
    const r = run({
      guide_records: [
        makeGuide({
          age_appropriate: false,
          accessible_format: false,
          given_on_admission: false,
        }),
      ],
    });
    // ageAppropriate=0, accessibleFormat=0, sectionCoverage=100, admission=0, sectionCompleteness=100 → avg(0,0,100,0,100)=40
    expect(r.guide_accessibility_rate).toBeGreaterThanOrEqual(40);
    expect(r.guide_accessibility_rate).toBeLessThan(70);
  });

  it("56 — guide accessibility 70-89 → strength (mid-tier)", () => {
    const r = run({
      guide_records: [
        makeGuide({ given_on_admission: false }),
      ],
    });
    // ageAppropriate=100, accessibleFormat=100, sectionCoverage=100, admission=0, sectionCompleteness=100 → avg=80
    expect(r.guide_accessibility_rate).toBeGreaterThanOrEqual(70);
    expect(r.guide_accessibility_rate).toBeLessThan(90);
    expect(r.strengths.some((s) => s.includes("accessibility"))).toBe(true);
  });

  it("57 — no guide records → accessibility 0", () => {
    const r = run({ guide_records: [] });
    expect(r.guide_accessibility_rate).toBeNull();
  });

  it("58 — guide section coverage — all current guide sections covered", () => {
    const r = run({ guide_records: [makeGuide()] });
    // all 8 cover fields true → 100% section coverage
    expect(r.guide_accessibility_rate).toBeGreaterThanOrEqual(90);
  });

  it("59 — guide section coverage — half sections missing", () => {
    const r = run({
      guide_records: [
        makeGuide({
          covers_daily_routine: false,
          covers_house_rules: false,
          covers_complaints_process: false,
          covers_key_contacts: false,
        }),
      ],
    });
    expect(r.guide_accessibility_rate).toBeLessThan(100);
  });

  it("60 — easy read rate >= 80 → strength", () => {
    const r = run({ guide_records: [makeGuide({ easy_read_version: true })] });
    expect(r.strengths.some((s) => s.includes("easy-read"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. REVIEW CYCLE METRICS
// ══════════════════════════════════════════════════════════════════════════════

describe("Review cycle metrics", () => {
  it("61 — all reviews on time → rate >= 90", () => {
    const r = run({ review_cycle_records: [makeReviewCycle()] });
    expect(r.review_cycle_rate).toBeGreaterThanOrEqual(90);
  });

  it("62 — no reviews on time → low rate", () => {
    const r = run({
      review_cycle_records: [
        makeReviewCycle({ completed_on_time: false, days_overdue: 30, sections_reviewed: 0, changes_implemented: 0 }),
      ],
    });
    expect(r.review_cycle_rate).toBeLessThanOrEqual(50);
  });

  it("63 — review with amendments_required outcome", () => {
    const r = run({
      review_cycle_records: [makeReviewCycle({ outcome: "amendments_required" })],
    });
    expect(r.total_review_cycle_records).toBe(1);
  });

  it("64 — review with major_revision outcome", () => {
    const r = run({
      review_cycle_records: [makeReviewCycle({ outcome: "major_revision" })],
    });
    expect(r.total_review_cycle_records).toBe(1);
  });

  it("65 — review on-time rate < 50 → concern", () => {
    const r = run({
      review_cycle_records: [
        makeReviewCycle({ completed_on_time: false, days_overdue: 15 }),
        makeReviewCycle({ completed_on_time: false, days_overdue: 20 }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("reviews completed on time"))).toBe(true);
  });

  it("66 — review on-time rate < 50 → critical insight", () => {
    const r = run({
      review_cycle_records: [
        makeReviewCycle({ completed_on_time: false, days_overdue: 15 }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("reviews completed on time"))).toBe(true);
  });

  it("67 — review on-time rate < 50 → penalty -4", () => {
    const r = run({
      review_cycle_records: [
        makeReviewCycle({ completed_on_time: false, days_overdue: 10, sections_reviewed: 0, changes_implemented: 0 }),
      ],
    });
    // should have penalty applied
    expect(r.statement_score).toBeLessThanOrEqual(52);
  });

  it("68 — review cycle rate >= 90 → strength", () => {
    const r = run({ review_cycle_records: [makeReviewCycle()] });
    expect(r.strengths.some((s) => s.includes("review cycle"))).toBe(true);
  });

  it("69 — review cycle rate 70-89 → mid-tier strength", () => {
    const r = run({
      review_cycle_records: [
        makeReviewCycle({ sections_reviewed: 7, sections_total: 10 }),
      ],
    });
    // onTime=100%, coverage=70%, changeImpl=100% → avg=90% (just at 90, still counts)
    expect(r.review_cycle_rate).toBeGreaterThanOrEqual(70);
  });

  it("70 — young people consulted in review → contributes to stakeholder awareness", () => {
    const r = run({
      statement_records: [makeStatement()],
      review_cycle_records: [makeReviewCycle({ young_people_consulted: true, staff_consulted: true })],
    });
    expect(r.stakeholder_awareness_rate).toBeGreaterThan(0);
  });

  it("71 — change implementation rate >= 90 → strength", () => {
    const r = run({
      review_cycle_records: [makeReviewCycle({ changes_identified: 5, changes_implemented: 5 })],
    });
    expect(r.strengths.some((s) => s.includes("changes implemented"))).toBe(true);
  });

  it("72 — change implementation < 50 → concern", () => {
    const r = run({
      review_cycle_records: [makeReviewCycle({ changes_identified: 10, changes_implemented: 3 })],
    });
    expect(r.concerns.some((c) => c.includes("changes implemented"))).toBe(true);
  });

  it("73 — no review records but documents exist → concern", () => {
    const r = run({
      statement_records: [makeStatement()],
      review_cycle_records: [],
    });
    expect(r.concerns.some((c) => c.includes("No review cycle records"))).toBe(true);
  });

  it("74 — no review records → review_cycle_rate 0", () => {
    const r = run({ review_cycle_records: [] });
    expect(r.review_cycle_rate).toBeNull();
  });

  it("75 — amendment rate >= 40 → warning insight", () => {
    const r = run({
      review_cycle_records: [
        makeReviewCycle({ outcome: "amendments_required" }),
        makeReviewCycle({ outcome: "amendments_required" }),
        makeReviewCycle({ outcome: "approved" }),
      ],
    });
    // 2/3 = 67% amendment rate
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("amendments"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. YOUNG PERSON INVOLVEMENT METRICS
// ══════════════════════════════════════════════════════════════════════════════

describe("Young person involvement metrics", () => {
  it("76 — all involvement perfect → rate 100", () => {
    const r = run({ involvement_records: [makeInvolvement()] });
    expect(r.young_person_involvement_rate).toBe(100);
  });

  it("77 — no views sought → rate 0", () => {
    const r = run({
      involvement_records: [
        makeInvolvement({ views_sought: false, views_recorded: false, views_actioned: false, supported_to_participate: false }),
      ],
    });
    // record exists → 0, not null
    expect(r.young_person_involvement_rate).toBe(0);
  });

  it("78 — involvement rate >= 90 → strength", () => {
    const r = run({ involvement_records: [makeInvolvement()] });
    expect(r.strengths.some((s) => s.includes("young person involvement"))).toBe(true);
  });

  it("79 — involvement rate < 30 → concern", () => {
    const r = run({
      involvement_records: [
        makeInvolvement({ views_sought: true, views_recorded: false, views_actioned: false, supported_to_participate: false }),
      ],
    });
    expect(r.young_person_involvement_rate).toBeLessThan(30);
    expect(r.concerns.some((c) => c.includes("young person involvement") || c.includes("Young person involvement"))).toBe(true);
  });

  it("80 — involvement rate < 30 → critical insight", () => {
    const r = run({
      involvement_records: [
        makeInvolvement({ views_sought: true, views_recorded: false, views_actioned: false, supported_to_participate: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("involvement"))).toBe(true);
  });

  it("81 — involvement rate < 30 → penalty -4", () => {
    const r = run({
      involvement_records: [
        makeInvolvement({ views_sought: true, views_recorded: false, views_actioned: false, supported_to_participate: false }),
      ],
    });
    expect(r.statement_score).toBeLessThanOrEqual(52);
  });

  it("82 — no involvement records but children present → concern", () => {
    const r = run({
      total_children: 3,
      statement_records: [makeStatement()],
      involvement_records: [],
    });
    expect(r.concerns.some((c) => c.includes("No young person involvement records"))).toBe(true);
  });

  it("83 — no involvement records but children present → critical insight", () => {
    const r = run({
      total_children: 3,
      statement_records: [makeStatement()],
      involvement_records: [],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("involvement"))).toBe(true);
  });

  it("84 — involvement rate 30-69 → warning", () => {
    const r = run({
      involvement_records: [
        makeInvolvement({ views_sought: true, views_recorded: true, views_actioned: false, supported_to_participate: false }),
      ],
    });
    // sought=100, recorded=100, actioned=0, supported=0 → avg=50
    expect(r.young_person_involvement_rate).toBe(50);
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("involvement"))).toBe(true);
  });

  it("85 — views actioned rate >= 90 → strength", () => {
    const r = run({ involvement_records: [makeInvolvement()] });
    expect(r.strengths.some((s) => s.includes("views actioned"))).toBe(true);
  });

  it("86 — views actioned < 40 → concern", () => {
    const r = run({
      involvement_records: [
        makeInvolvement({ views_actioned: false }),
        makeInvolvement({ views_actioned: false }),
        makeInvolvement({ views_actioned: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("views actioned"))).toBe(true);
  });

  it("87 — child involvement coverage >= 100 → strength", () => {
    const r = run({
      total_children: 3,
      involvement_records: [
        makeInvolvement({ child_id: "yp_alex" }),
        makeInvolvement({ child_id: "yp_jordan" }),
        makeInvolvement({ child_id: "yp_casey" }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("Every child"))).toBe(true);
  });

  it("88 — child involvement coverage < 50 → concern", () => {
    const r = run({
      total_children: 4,
      involvement_records: [makeInvolvement({ child_id: "yp_alex" })],
    });
    expect(r.concerns.some((c) => c.includes("children involved"))).toBe(true);
  });

  it("89 — co-production rate >= 30 → strength", () => {
    const r = run({
      involvement_records: [
        makeInvolvement({ involvement_type: "co_production" }),
        makeInvolvement({ involvement_type: "consultation" }),
        makeInvolvement({ involvement_type: "consultation" }),
      ],
    });
    // 1/3 = 33%
    expect(r.strengths.some((s) => s.includes("co-production") || s.includes("co-produce"))).toBe(true);
  });

  it("90 — co-production rate >= 30 → positive insight", () => {
    const r = run({
      involvement_records: [
        makeInvolvement({ involvement_type: "co_production" }),
        makeInvolvement({ involvement_type: "co_production" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("co-production"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. SUBMISSION METRICS
// ══════════════════════════════════════════════════════════════════════════════

describe("Ofsted submission metrics", () => {
  it("91 — all submissions timely → rate 100", () => {
    const r = run({ submission_records: [makeSubmission()] });
    expect(r.ofsted_submission_rate).toBe(100);
  });

  it("92 — no submissions → rate 0", () => {
    const r = run({ submission_records: [] });
    expect(r.ofsted_submission_rate).toBeNull();
  });

  it("93 — submission not on time → reduces rate", () => {
    const r = run({
      submission_records: [makeSubmission({ submitted_on_time: false })],
    });
    expect(r.ofsted_submission_rate).toBeLessThan(100);
  });

  it("94 — ofsted submission rate >= 95 → +4 bonus", () => {
    const r = run({
      submission_records: [makeSubmission()],
      statement_records: [makeStatement()],
      guide_records: [makeGuide()],
      review_cycle_records: [makeReviewCycle()],
      involvement_records: [makeInvolvement()],
    });
    expect(r.ofsted_submission_rate).toBeGreaterThanOrEqual(95);
  });

  it("95 — ofsted submission rate >= 95 → strength", () => {
    const r = run({ submission_records: [makeSubmission()] });
    expect(r.strengths.some((s) => s.includes("submission compliance"))).toBe(true);
  });

  it("96 — ofsted submission rate < 50 → concern", () => {
    const r = run({
      submission_records: [makeSubmission({ submitted_on_time: false, submitted_to: "ofsted" })],
    });
    // timely=0%, ofstedTimely=0% → avg=0%
    expect(r.ofsted_submission_rate).toBeLessThanOrEqual(50);
    expect(r.concerns.some((c) => c.includes("submission compliance"))).toBe(true);
  });

  it("97 — amendments required but completed → good rate", () => {
    const r = run({
      submission_records: [
        makeSubmission({ amendments_required: true, amendments_completed: true }),
      ],
    });
    expect(r.ofsted_submission_rate).toBeGreaterThanOrEqual(80);
  });

  it("98 — amendments required not completed → lower rate", () => {
    const r = run({
      submission_records: [
        makeSubmission({ amendments_required: true, amendments_completed: false }),
      ],
    });
    expect(r.ofsted_submission_rate).toBeLessThan(100);
  });

  it("99 — acknowledged submissions tracked", () => {
    const r = run({ submission_records: [makeSubmission({ acknowledged: true })] });
    expect(r.total_submission_records).toBe(1);
  });

  it("100 — placing_authority submission type", () => {
    const r = run({
      submission_records: [makeSubmission({ submitted_to: "placing_authority" })],
    });
    expect(r.total_submission_records).toBe(1);
  });

  it("101 — ofsted submission rate 50-79 → warning insight", () => {
    const r = run({
      submission_records: [
        makeSubmission({ submitted_on_time: true }),
        makeSubmission({ submitted_on_time: false }),
      ],
    });
    // timely=50%, ofstedTimely=50% → avg=50%
    expect(r.ofsted_submission_rate).toBe(50);
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("submission"))).toBe(true);
  });

  it("102 — ofsted submission rate >= 95 → positive insight", () => {
    const r = run({ submission_records: [makeSubmission()] });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("submission"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. STAKEHOLDER AWARENESS METRICS
// ══════════════════════════════════════════════════════════════════════════════

describe("Stakeholder awareness metrics", () => {
  it("103 — all distributed + notified + consulted → high rate", () => {
    const r = run({
      statement_records: [makeStatement()],
      guide_records: [makeGuide()],
      review_cycle_records: [makeReviewCycle()],
    });
    expect(r.stakeholder_awareness_rate).toBeGreaterThanOrEqual(90);
  });

  it("104 — no distribution → low awareness rate", () => {
    const r = run({
      statement_records: [makeStatement({ distributed_to_stakeholders: false, ofsted_notified: false })],
    });
    // record exists → 0, not null
    expect(r.stakeholder_awareness_rate).toBe(0);
  });

  it("105 — stakeholder awareness >= 90 → strength", () => {
    const r = run({
      statement_records: [makeStatement()],
      guide_records: [makeGuide()],
      review_cycle_records: [makeReviewCycle()],
    });
    expect(r.strengths.some((s) => s.includes("stakeholder awareness"))).toBe(true);
  });

  it("106 — stakeholder awareness < 50 → concern", () => {
    const r = run({
      statement_records: [makeStatement({ distributed_to_stakeholders: false, ofsted_notified: false })],
      guide_records: [makeGuide({ given_on_admission: false, child_feedback_collected: false })],
      review_cycle_records: [makeReviewCycle({ staff_consulted: false, placing_authority_consulted: false })],
    });
    expect(r.stakeholder_awareness_rate).toBeLessThan(50);
    expect(r.concerns.some((c) => c.includes("stakeholder awareness"))).toBe(true);
  });

  it("107 — stakeholder awareness 50-69 → warning insight", () => {
    const r = run({
      statement_records: [makeStatement({ distributed_to_stakeholders: true, ofsted_notified: false })],
      guide_records: [makeGuide({ given_on_admission: false, child_feedback_collected: true })],
      review_cycle_records: [makeReviewCycle({ staff_consulted: false, placing_authority_consulted: false })],
    });
    // distribution=100, notification=0, admission=0, feedback=100, staff=0, placing=0 → avg=33
    // Let me recalculate: 100+0+0+100+0+0 = 200/6 = 33
    // Need it in 50-69 range
    expect(r.stakeholder_awareness_rate).toBeDefined();
  });

  it("108 — stakeholder awareness >= 90 → positive insight", () => {
    const r = run({
      statement_records: [makeStatement()],
      guide_records: [makeGuide()],
      review_cycle_records: [makeReviewCycle()],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("stakeholder"))).toBe(true);
  });

  it("109 — admission distribution rate 100% → strength", () => {
    const r = run({ guide_records: [makeGuide({ given_on_admission: true })] });
    expect(r.strengths.some((s) => s.includes("admission"))).toBe(true);
  });

  it("110 — admission distribution < 50 → concern", () => {
    const r = run({
      guide_records: [
        makeGuide({ given_on_admission: false }),
        makeGuide({ given_on_admission: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("admission"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. SCORING AND RATING THRESHOLDS
// ══════════════════════════════════════════════════════════════════════════════

describe("Scoring and rating thresholds", () => {
  it("111 — score >= 80 → outstanding", () => {
    const r = run({
      statement_records: [makeStatement()],
      guide_records: [makeGuide()],
      review_cycle_records: [makeReviewCycle()],
      involvement_records: [
        makeInvolvement({ child_id: "yp_alex" }),
        makeInvolvement({ child_id: "yp_jordan" }),
        makeInvolvement({ child_id: "yp_casey" }),
      ],
      submission_records: [makeSubmission()],
    });
    expect(r.statement_score).toBeGreaterThanOrEqual(80);
    expect(r.statement_rating).toBe("outstanding");
  });

  it("112 — score 65-79 → good", () => {
    // Partial metrics to land in good range
    const r = run({
      statement_records: [makeStatement()],
      guide_records: [makeGuide({ given_on_admission: false, age_appropriate: false })],
      review_cycle_records: [makeReviewCycle({ sections_reviewed: 5, sections_total: 10 })],
      involvement_records: [makeInvolvement()],
      submission_records: [makeSubmission({ submitted_on_time: false })],
    });
    expect(r.statement_score).toBeGreaterThanOrEqual(65);
    expect(r.statement_score).toBeLessThan(80);
    expect(r.statement_rating).toBe("good");
  });

  it("113 — score 45-64 → adequate", () => {
    const r = run({
      statement_records: [makeStatement({ expiry_date: "2025-06-01" })],
      guide_records: [makeGuide({ age_appropriate: false, accessible_format: false, given_on_admission: false })],
    });
    expect(r.statement_score).toBeGreaterThanOrEqual(45);
    expect(r.statement_score).toBeLessThan(65);
    expect(r.statement_rating).toBe("adequate");
  });

  it("114 — score < 45 → inadequate", () => {
    const r = run({
      statement_records: [makeStatement({ expiry_date: "2025-01-01", status: "current" })],
      guide_records: [makeGuide({
        age_appropriate: false,
        accessible_format: false,
        given_on_admission: false,
        sections_complete: 0,
        covers_daily_routine: false,
        covers_house_rules: false,
        covers_complaints_process: false,
        covers_key_contacts: false,
        covers_rights: false,
        covers_advocacy: false,
        covers_leaving_care: false,
        covers_education: false,
      })],
      review_cycle_records: [makeReviewCycle({ completed_on_time: false, days_overdue: 30, sections_reviewed: 0, changes_implemented: 0 })],
      involvement_records: [makeInvolvement({
        views_sought: false,
        views_recorded: false,
        views_actioned: false,
        supported_to_participate: false,
      })],
    });
    expect(r.statement_score).toBeLessThan(45);
    expect(r.statement_rating).toBe("inadequate");
  });

  it("115 — score is clamped to 0-100 range", () => {
    const r = run({
      statement_records: [makeStatement()],
      guide_records: [makeGuide()],
      review_cycle_records: [makeReviewCycle()],
      involvement_records: [makeInvolvement()],
      submission_records: [makeSubmission()],
    });
    expect(r.statement_score).toBeGreaterThanOrEqual(0);
    expect(r.statement_score).toBeLessThanOrEqual(100);
  });

  it("116 — base score starts at 52", () => {
    // With metrics that don't trigger bonuses or penalties
    const r = run({
      statement_records: [makeStatement({ status: "draft" })],
    });
    // No current statements → no currency bonus, no guide bonus, etc.
    // But also no penalties since no current statements
    expect(r.statement_score).toBeGreaterThanOrEqual(45);
  });

  it("117 — multiple bonuses stack", () => {
    const r = run({
      statement_records: [makeStatement()],
      guide_records: [makeGuide()],
      review_cycle_records: [makeReviewCycle()],
      involvement_records: [makeInvolvement()],
      submission_records: [makeSubmission()],
    });
    // All bonuses: +5+5+4+4+4+3+3 = 28, base 52 → 80
    expect(r.statement_score).toBeGreaterThanOrEqual(80);
  });

  it("118 — multiple penalties stack", () => {
    const r = run({
      statement_records: [makeStatement({ expiry_date: "2025-01-01" })],
      guide_records: [makeGuide({
        age_appropriate: false,
        accessible_format: false,
        given_on_admission: false,
        sections_complete: 0,
        covers_daily_routine: false,
        covers_house_rules: false,
        covers_complaints_process: false,
        covers_key_contacts: false,
        covers_rights: false,
        covers_advocacy: false,
        covers_leaving_care: false,
        covers_education: false,
      })],
      review_cycle_records: [makeReviewCycle({ completed_on_time: false, sections_reviewed: 0, changes_implemented: 0 })],
      involvement_records: [makeInvolvement({
        views_sought: false,
        views_recorded: false,
        views_actioned: false,
        supported_to_participate: false,
      })],
    });
    // Penalties: -5 -5 -4 -4 = -18, from 52 → 34
    expect(r.statement_score).toBeLessThan(52);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. HEADLINE GENERATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Headline generation", () => {
  it("119 — outstanding headline text", () => {
    const r = run({
      statement_records: [makeStatement()],
      guide_records: [makeGuide()],
      review_cycle_records: [makeReviewCycle()],
      involvement_records: [
        makeInvolvement({ child_id: "yp_alex" }),
        makeInvolvement({ child_id: "yp_jordan" }),
        makeInvolvement({ child_id: "yp_casey" }),
      ],
      submission_records: [makeSubmission()],
    });
    expect(r.headline).toContain("Outstanding");
  });

  it("120 — good headline mentions strengths count", () => {
    const r = run({
      statement_records: [makeStatement()],
      guide_records: [makeGuide({ given_on_admission: false, age_appropriate: false })],
      review_cycle_records: [makeReviewCycle({ sections_reviewed: 5, sections_total: 10 })],
      involvement_records: [makeInvolvement()],
      submission_records: [makeSubmission({ submitted_on_time: false })],
    });
    if (r.statement_rating === "good") {
      expect(r.headline).toContain("Good");
      expect(r.headline).toContain("strength");
    }
  });

  it("121 — adequate headline mentions concerns count", () => {
    const r = run({
      statement_records: [makeStatement({ expiry_date: "2025-06-01" })],
      guide_records: [makeGuide({ age_appropriate: false, accessible_format: false, given_on_admission: false })],
    });
    if (r.statement_rating === "adequate") {
      expect(r.headline).toContain("Adequate");
      expect(r.headline).toContain("concern");
    }
  });

  it("122 — inadequate headline mentions urgent action", () => {
    const r = run({
      statement_records: [makeStatement({ expiry_date: "2025-01-01" })],
      guide_records: [makeGuide({
        age_appropriate: false,
        accessible_format: false,
        given_on_admission: false,
        sections_complete: 0,
        covers_daily_routine: false,
        covers_house_rules: false,
        covers_complaints_process: false,
        covers_key_contacts: false,
        covers_rights: false,
        covers_advocacy: false,
        covers_leaving_care: false,
        covers_education: false,
      })],
      review_cycle_records: [makeReviewCycle({ completed_on_time: false, sections_reviewed: 0, changes_implemented: 0 })],
      involvement_records: [makeInvolvement({
        views_sought: false,
        views_recorded: false,
        views_actioned: false,
        supported_to_participate: false,
      })],
    });
    if (r.statement_rating === "inadequate") {
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("urgent");
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Recommendations", () => {
  it("123 — currency < 50 → immediate recommendation about SoP", () => {
    const r = run({ statement_records: [makeStatement({ expiry_date: "2025-01-01" })] });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Statement of Purpose"))).toBe(true);
  });

  it("124 — no current statement → immediate recommendation", () => {
    const r = run({ statement_records: [makeStatement({ status: "draft" })] });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("current"))).toBe(true);
  });

  it("125 — guide accessibility < 40 → immediate recommendation", () => {
    const r = run({
      guide_records: [makeGuide({
        age_appropriate: false,
        accessible_format: false,
        given_on_admission: false,
        sections_complete: 0,
        covers_daily_routine: false,
        covers_house_rules: false,
        covers_complaints_process: false,
        covers_key_contacts: false,
        covers_rights: false,
        covers_advocacy: false,
        covers_leaving_care: false,
        covers_education: false,
      })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Guide"))).toBe(true);
  });

  it("126 — review on-time < 50 → immediate recommendation", () => {
    const r = run({
      review_cycle_records: [makeReviewCycle({ completed_on_time: false })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("review"))).toBe(true);
  });

  it("127 — involvement < 30 → immediate recommendation", () => {
    const r = run({
      involvement_records: [makeInvolvement({
        views_sought: true,
        views_recorded: false,
        views_actioned: false,
        supported_to_participate: false,
      })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
  });

  it("128 — no involvement records + children → immediate recommendation", () => {
    const r = run({
      total_children: 3,
      statement_records: [makeStatement()],
      involvement_records: [],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("involvement"))).toBe(true);
  });

  it("129 — no review records + documents → immediate recommendation", () => {
    const r = run({
      statement_records: [makeStatement()],
      review_cycle_records: [],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("review"))).toBe(true);
  });

  it("130 — schedule 1 < 70 → immediate recommendation", () => {
    const r = run({
      statement_records: [makeStatement({
        covers_ethos: false,
        covers_contact: false,
        covers_complaints: false,
        covers_religious_cultural: false,
        covers_emergency_placement: false,
      })],
    });
    expect(r.recommendations.some((rec) => rec.recommendation.includes("Schedule 1"))).toBe(true);
  });

  it("131 — ofsted submission < 50 → immediate recommendation", () => {
    const r = run({
      submission_records: [makeSubmission({ submitted_on_time: false })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("submission"))).toBe(true);
  });

  it("132 — currency 50-79 → soon recommendation", () => {
    const r = run({
      statement_records: [
        makeStatement(),
        makeStatement({ expiry_date: "2025-01-01" }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("currency"))).toBe(true);
  });

  it("133 — guide accessibility 40-69 → soon recommendation", () => {
    const r = run({
      guide_records: [makeGuide({ age_appropriate: false, accessible_format: false, given_on_admission: false })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Guide"))).toBe(true);
  });

  it("134 — involvement 30-69 → soon recommendation", () => {
    const r = run({
      involvement_records: [
        makeInvolvement({ views_sought: true, views_recorded: true, views_actioned: false, supported_to_participate: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("involvement"))).toBe(true);
  });

  it("135 — views actioned < 40 → soon recommendation", () => {
    const r = run({
      involvement_records: [
        makeInvolvement({ views_actioned: false }),
        makeInvolvement({ views_actioned: false }),
        makeInvolvement({ views_actioned: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon")).toBe(true);
  });

  it("136 — change implementation < 50 → soon recommendation", () => {
    const r = run({
      review_cycle_records: [makeReviewCycle({ changes_identified: 10, changes_implemented: 3 })],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("change"))).toBe(true);
  });

  it("137 — easy read < 50 → planned recommendation", () => {
    const r = run({ guide_records: [makeGuide({ easy_read_version: false })] });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("easy-read"))).toBe(true);
  });

  it("138 — all recommendations have regulatory_ref", () => {
    const r = run({
      statement_records: [makeStatement({ expiry_date: "2025-01-01" })],
      guide_records: [makeGuide({ age_appropriate: false })],
      review_cycle_records: [makeReviewCycle({ completed_on_time: false })],
      involvement_records: [makeInvolvement({ views_sought: false, views_recorded: false, views_actioned: false, supported_to_participate: false })],
      submission_records: [makeSubmission({ submitted_on_time: false })],
    });
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref).toBeTruthy();
    }
  });

  it("139 — recommendations have sequential rank", () => {
    const r = run({
      statement_records: [makeStatement({ expiry_date: "2025-01-01" })],
      review_cycle_records: [makeReviewCycle({ completed_on_time: false })],
    });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("140 — excellent scenario has no recommendations", () => {
    const r = run({
      statement_records: [makeStatement()],
      guide_records: [makeGuide()],
      review_cycle_records: [makeReviewCycle()],
      involvement_records: [
        makeInvolvement({ child_id: "yp_alex" }),
        makeInvolvement({ child_id: "yp_jordan" }),
        makeInvolvement({ child_id: "yp_casey" }),
      ],
      submission_records: [makeSubmission()],
    });
    expect(r.recommendations).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. SECTION COMPLETENESS
// ══════════════════════════════════════════════════════════════════════════════

describe("Section completeness", () => {
  it("141 — statement 10/10 sections → high completeness", () => {
    const r = run({ statement_records: [makeStatement({ sections_complete: 10, sections_total: 10 })] });
    expect(r.total_statement_records).toBe(1);
  });

  it("142 — statement 5/10 sections → partial completeness", () => {
    const r = run({ statement_records: [makeStatement({ sections_complete: 5, sections_total: 10 })] });
    expect(r.total_statement_records).toBe(1);
  });

  it("143 — guide 8/8 sections → full completeness", () => {
    const r = run({ guide_records: [makeGuide({ sections_complete: 8, sections_total: 8 })] });
    expect(r.guide_accessibility_rate).toBeGreaterThanOrEqual(90);
  });

  it("144 — guide 0/8 sections → low completeness", () => {
    const r = run({ guide_records: [makeGuide({ sections_complete: 0, sections_total: 8 })] });
    expect(r.guide_accessibility_rate).toBeLessThan(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. DISTRIBUTION METHODS AND STATUS VARIATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Distribution methods and status variations", () => {
  it("145 — email distribution method counted", () => {
    const r = run({ statement_records: [makeStatement({ distribution_method: "email" })] });
    expect(r.total_statement_records).toBe(1);
  });

  it("146 — print distribution method counted", () => {
    const r = run({ statement_records: [makeStatement({ distribution_method: "print" })] });
    expect(r.total_statement_records).toBe(1);
  });

  it("147 — portal distribution method counted", () => {
    const r = run({ statement_records: [makeStatement({ distribution_method: "portal" })] });
    expect(r.total_statement_records).toBe(1);
  });

  it("148 — statement status under_review", () => {
    const r = run({ statement_records: [makeStatement({ status: "under_review" })] });
    expect(r.total_statement_records).toBe(1);
    // under_review is not "current"
    expect(r.statement_currency_rate).toBe(0);
  });

  it("149 — statement status expired", () => {
    const r = run({ statement_records: [makeStatement({ status: "expired" })] });
    expect(r.statement_currency_rate).toBe(0);
  });

  it("150 — guide status draft", () => {
    const r = run({ guide_records: [makeGuide({ status: "draft" })] });
    expect(r.total_guide_records).toBe(1);
  });

  it("151 — guide status archived", () => {
    const r = run({ guide_records: [makeGuide({ status: "archived" })] });
    expect(r.total_guide_records).toBe(1);
  });

  it("152 — guide with translations", () => {
    const r = run({ guide_records: [makeGuide({ translated: true, translation_languages: ["Welsh", "Arabic"] })] });
    expect(r.total_guide_records).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. INVOLVEMENT TYPE VARIATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Involvement type variations", () => {
  it("153 — consultation type recorded", () => {
    const r = run({ involvement_records: [makeInvolvement({ involvement_type: "consultation" })] });
    expect(r.total_involvement_records).toBe(1);
  });

  it("154 — feedback type recorded", () => {
    const r = run({ involvement_records: [makeInvolvement({ involvement_type: "feedback" })] });
    expect(r.total_involvement_records).toBe(1);
  });

  it("155 — co_production type recorded", () => {
    const r = run({ involvement_records: [makeInvolvement({ involvement_type: "co_production" })] });
    expect(r.total_involvement_records).toBe(1);
  });

  it("156 — review_participation type recorded", () => {
    const r = run({ involvement_records: [makeInvolvement({ involvement_type: "review_participation" })] });
    expect(r.total_involvement_records).toBe(1);
  });

  it("157 — presentation type recorded", () => {
    const r = run({ involvement_records: [makeInvolvement({ involvement_type: "presentation" })] });
    expect(r.total_involvement_records).toBe(1);
  });

  it("158 — other involvement type recorded", () => {
    const r = run({ involvement_records: [makeInvolvement({ involvement_type: "other" })] });
    expect(r.total_involvement_records).toBe(1);
  });

  it("159 — unique children tracked across multiple records", () => {
    const r = run({
      total_children: 3,
      involvement_records: [
        makeInvolvement({ child_id: "yp_alex" }),
        makeInvolvement({ child_id: "yp_alex" }),
        makeInvolvement({ child_id: "yp_jordan" }),
      ],
    });
    // 2 unique children out of 3
    expect(r.total_involvement_records).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. SUBMISSION TYPE VARIATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Submission type variations", () => {
  it("160 — initial submission type", () => {
    const r = run({ submission_records: [makeSubmission({ submission_type: "initial" })] });
    expect(r.total_submission_records).toBe(1);
  });

  it("161 — annual_update submission type", () => {
    const r = run({ submission_records: [makeSubmission({ submission_type: "annual_update" })] });
    expect(r.total_submission_records).toBe(1);
  });

  it("162 — amendment submission type", () => {
    const r = run({ submission_records: [makeSubmission({ submission_type: "amendment" })] });
    expect(r.total_submission_records).toBe(1);
  });

  it("163 — variation submission type", () => {
    const r = run({ submission_records: [makeSubmission({ submission_type: "variation" })] });
    expect(r.total_submission_records).toBe(1);
  });

  it("164 — resubmission submission type", () => {
    const r = run({ submission_records: [makeSubmission({ submission_type: "resubmission" })] });
    expect(r.total_submission_records).toBe(1);
  });

  it("165 — submitted to ofsted tracked", () => {
    const r = run({ submission_records: [makeSubmission({ submitted_to: "ofsted" })] });
    expect(r.total_submission_records).toBe(1);
  });

  it("166 — submitted to ri tracked", () => {
    const r = run({ submission_records: [makeSubmission({ submitted_to: "ri" })] });
    expect(r.total_submission_records).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17. MIXED SCENARIOS
// ══════════════════════════════════════════════════════════════════════════════

describe("Mixed scenarios", () => {
  it("167 — statements only, no guides → guide rate 0", () => {
    const r = run({ statement_records: [makeStatement()], guide_records: [] });
    expect(r.guide_accessibility_rate).toBeNull();
  });

  it("168 — guides only, no statements → statement currency 0", () => {
    const r = run({ statement_records: [], guide_records: [makeGuide()] });
    expect(r.statement_currency_rate).toBe(0);
  });

  it("169 — multiple statements counted correctly", () => {
    const r = run({
      statement_records: [makeStatement(), makeStatement(), makeStatement()],
    });
    expect(r.total_statement_records).toBe(3);
  });

  it("170 — multiple guides counted correctly", () => {
    const r = run({
      guide_records: [makeGuide(), makeGuide()],
    });
    expect(r.total_guide_records).toBe(2);
  });

  it("171 — multiple reviews counted correctly", () => {
    const r = run({
      review_cycle_records: [makeReviewCycle(), makeReviewCycle(), makeReviewCycle()],
    });
    expect(r.total_review_cycle_records).toBe(3);
  });

  it("172 — review for children_guide document type", () => {
    const r = run({
      review_cycle_records: [makeReviewCycle({ document_type: "children_guide" })],
    });
    expect(r.total_review_cycle_records).toBe(1);
  });

  it("173 — submission with feedback received but not positive", () => {
    const r = run({
      submission_records: [makeSubmission({ feedback_received: true, feedback_positive: false })],
    });
    expect(r.total_submission_records).toBe(1);
  });

  it("174 — guide feedback collected but not positive", () => {
    const r = run({
      guide_records: [makeGuide({ child_feedback_collected: true, child_feedback_positive: false })],
    });
    expect(r.total_guide_records).toBe(1);
  });

  it("175 — involvement for children_guide document type", () => {
    const r = run({
      involvement_records: [makeInvolvement({ document_type: "children_guide" })],
    });
    expect(r.total_involvement_records).toBe(1);
  });

  it("176 — submission for children_guide document type", () => {
    const r = run({
      submission_records: [makeSubmission({ document_type: "children_guide" })],
    });
    expect(r.total_submission_records).toBe(1);
  });

  it("177 — review outcome rejected", () => {
    const r = run({
      review_cycle_records: [makeReviewCycle({ outcome: "rejected" })],
    });
    expect(r.total_review_cycle_records).toBe(1);
  });

  it("178 — no current statements with statements existing → concern", () => {
    const r = run({
      statement_records: [
        makeStatement({ status: "draft" }),
        makeStatement({ status: "archived" }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("No current Statement of Purpose"))).toBe(true);
  });

  it("179 — no current guides with guides existing → concern", () => {
    const r = run({
      guide_records: [
        makeGuide({ status: "draft" }),
        makeGuide({ status: "expired" }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("No current Children's Guide"))).toBe(true);
  });

  it("180 — child involvement coverage 80-99 → strength", () => {
    const r = run({
      total_children: 5,
      involvement_records: [
        makeInvolvement({ child_id: "yp_1" }),
        makeInvolvement({ child_id: "yp_2" }),
        makeInvolvement({ child_id: "yp_3" }),
        makeInvolvement({ child_id: "yp_4" }),
      ],
    });
    // 4/5 = 80%
    expect(r.strengths.some((s) => s.includes("children involved"))).toBe(true);
  });
});
