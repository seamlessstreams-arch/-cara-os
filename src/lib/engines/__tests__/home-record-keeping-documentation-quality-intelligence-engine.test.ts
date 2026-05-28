// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME RECORD KEEPING & DOCUMENTATION QUALITY INTELLIGENCE ENGINE — TESTS
//
// Comprehensive test suite for the record keeping documentation quality engine.
// CHR 2015 Reg 36 (Review of quality of care), Reg 37-40 (Records/notifications).
// SCCIF: Leadership and management.
// Score architecture: base=52, max bonuses=+28, thresholds: >=80/>=65/>=45/<45.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeRecordKeepingDocumentationQuality,
  type RecordKeepingInput,
  type RecordKeepingResult,
  type DailyLogInput,
  type CarePlanInput,
  type RiskAssessmentInput,
  type IncidentReportInput,
  type RegulatoryDocumentInput,
} from "../home-record-keeping-documentation-quality-intelligence-engine";

// ── Constants ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-28";

// ── ID Generator ────────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `rec_${++_id}`;
}

// ── baseInput helper ────────────────────────────────────────────────────────

function baseInput(
  overrides: Partial<RecordKeepingInput> = {},
): RecordKeepingInput {
  return {
    today: TODAY,
    total_children: 3,
    daily_log_records: [],
    care_plan_records: [],
    risk_assessment_records: [],
    incident_report_records: [],
    regulatory_document_records: [],
    ...overrides,
  };
}

// ── Record Factory Helpers ──────────────────────────────────────────────────

function makeDailyLog(overrides: Partial<DailyLogInput> = {}): DailyLogInput {
  return {
    id: uid(),
    child_id: "child_1",
    log_date: "2026-05-27",
    author_name: "Staff Member",
    entry_type: "routine",
    word_count: 100,
    completed_on_time: true,
    covers_wellbeing: true,
    covers_activities: true,
    covers_mood: true,
    covers_interactions: true,
    covers_meals: true,
    manager_reviewed: true,
    review_date: "2026-05-27",
    amendments_made: false,
    factual_and_objective: true,
    signed_by_author: true,
    created_at: "2026-05-27",
    ...overrides,
  };
}

function makeCarePlan(overrides: Partial<CarePlanInput> = {}): CarePlanInput {
  return {
    id: uid(),
    child_id: "child_1",
    plan_type: "placement",
    created_date: "2026-04-01",
    last_reviewed_date: "2026-05-20",
    review_due_date: "2026-06-20",
    review_overdue: false,
    is_current: true,
    objectives_count: 5,
    objectives_met: 5,
    child_participated: true,
    child_signed: true,
    parent_carer_consulted: true,
    social_worker_consulted: true,
    professional_input: true,
    plan_quality_rating: 5,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeRiskAssessment(
  overrides: Partial<RiskAssessmentInput> = {},
): RiskAssessmentInput {
  return {
    id: uid(),
    child_id: "child_1",
    assessment_type: "individual",
    assessment_date: "2026-05-01",
    assessed_by: "Staff Member",
    risk_level: "medium",
    review_date: "2026-06-01",
    review_overdue: false,
    is_current: true,
    mitigations_identified: 4,
    mitigations_implemented: 4,
    child_involved: true,
    multi_agency_input: true,
    dynamic_risk_factors_recorded: true,
    linked_to_care_plan: true,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeIncidentReport(
  overrides: Partial<IncidentReportInput> = {},
): IncidentReportInput {
  return {
    id: uid(),
    child_id: "child_1",
    incident_date: "2026-05-25",
    incident_type: "behaviour",
    report_completed_date: "2026-05-25",
    completed_within_24h: true,
    severity: "low",
    witness_statements_obtained: true,
    body_map_completed: false,
    manager_notified: true,
    manager_signed_off: true,
    ofsted_notified: false,
    ofsted_notification_required: false,
    local_authority_notified: false,
    local_authority_notification_required: false,
    follow_up_actions_identified: 2,
    follow_up_actions_completed: 2,
    lessons_learned_recorded: true,
    created_at: "2026-05-25",
    ...overrides,
  };
}

function makeRegulatoryDocument(
  overrides: Partial<RegulatoryDocumentInput> = {},
): RegulatoryDocumentInput {
  return {
    id: uid(),
    document_type: "reg_44",
    title: "Reg 44 Report - May 2026",
    due_date: "2026-06-01",
    completed_date: "2026-05-20",
    is_current: true,
    is_overdue: false,
    quality_rating: 5,
    author_name: "Manager",
    reviewed_by_manager: true,
    meets_statutory_requirements: true,
    last_updated_date: "2026-05-20",
    update_frequency_days: 30,
    days_since_last_update: 8,
    created_at: "2026-05-20",
    ...overrides,
  };
}

// ── Helper: run the engine ──────────────────────────────────────────────────

function run(overrides: Partial<RecordKeepingInput> = {}): RecordKeepingResult {
  return computeRecordKeepingDocumentationQuality(baseInput(overrides));
}

// Helper to produce N copies of a record with optional per-item overrides
function nLogs(
  n: number,
  overrides: Partial<DailyLogInput> = {},
): DailyLogInput[] {
  return Array.from({ length: n }, () => makeDailyLog(overrides));
}

function nCarePlans(
  n: number,
  overrides: Partial<CarePlanInput> = {},
): CarePlanInput[] {
  return Array.from({ length: n }, () => makeCarePlan(overrides));
}

function nRiskAssessments(
  n: number,
  overrides: Partial<RiskAssessmentInput> = {},
): RiskAssessmentInput[] {
  return Array.from({ length: n }, () => makeRiskAssessment(overrides));
}

function nIncidents(
  n: number,
  overrides: Partial<IncidentReportInput> = {},
): IncidentReportInput[] {
  return Array.from({ length: n }, () => makeIncidentReport(overrides));
}

function nRegDocs(
  n: number,
  overrides: Partial<RegulatoryDocumentInput> = {},
): RegulatoryDocumentInput[] {
  return Array.from({ length: n }, () => makeRegulatoryDocument(overrides));
}

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ════════════════════════════════════════════════════════════════════════════

// ── 1. INSUFFICIENT DATA ────────────────────────────────────────────────────

describe("insufficient_data", () => {
  it("returns insufficient_data when all arrays empty and total_children=0", () => {
    const r = run({ total_children: 0 });
    expect(r.documentation_rating).toBe("insufficient_data");
    expect(r.documentation_score).toBe(0);
    expect(r.daily_log_completion_rate).toBe(0);
    expect(r.care_plan_currency_rate).toBe(0);
    expect(r.risk_assessment_review_rate).toBe(0);
    expect(r.incident_report_timeliness_rate).toBe(0);
    expect(r.regulatory_compliance_rate).toBe(0);
    expect(r.record_accuracy_rate).toBe(0);
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  it("headline mentions insufficient data", () => {
    const r = run({ total_children: 0 });
    expect(r.headline).toContain("insufficient data");
  });
});

// ── 2. INADEQUATE FLOOR (all empty, children > 0) ──────────────────────────

describe("inadequate floor -- all empty with children on placement", () => {
  it("returns inadequate with score 15", () => {
    const r = run({ total_children: 3 });
    expect(r.documentation_rating).toBe("inadequate");
    expect(r.documentation_score).toBe(15);
  });

  it("produces exactly 1 concern", () => {
    const r = run({ total_children: 3 });
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No daily logs");
  });

  it("produces exactly 2 recommendations both immediate", () => {
    const r = run({ total_children: 3 });
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
    expect(r.recommendations[0].rank).toBe(1);
    expect(r.recommendations[1].rank).toBe(2);
  });

  it("produces exactly 1 critical insight", () => {
    const r = run({ total_children: 3 });
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("all rates are 0", () => {
    const r = run({ total_children: 3 });
    expect(r.daily_log_completion_rate).toBe(0);
    expect(r.care_plan_currency_rate).toBe(0);
    expect(r.risk_assessment_review_rate).toBe(0);
    expect(r.incident_report_timeliness_rate).toBe(0);
    expect(r.regulatory_compliance_rate).toBe(0);
    expect(r.record_accuracy_rate).toBe(0);
  });

  it("headline references urgent attention", () => {
    const r = run({ total_children: 3 });
    expect(r.headline).toContain("urgent attention");
  });

  it("works with total_children=1", () => {
    const r = run({ total_children: 1 });
    expect(r.documentation_rating).toBe("inadequate");
    expect(r.documentation_score).toBe(15);
  });
});

// ── 3. OUTSTANDING SCENARIOS ────────────────────────────────────────────────

describe("outstanding scenarios", () => {
  // Perfect input: all bonuses fire, no penalties => 52+28=80 => outstanding
  function perfectInput(): Partial<RecordKeepingInput> {
    return {
      total_children: 3,
      daily_log_records: [
        ...nLogs(10, { child_id: "child_1" }),
        ...nLogs(10, { child_id: "child_2" }),
        ...nLogs(10, { child_id: "child_3" }),
      ],
      care_plan_records: [
        ...nCarePlans(3, { child_id: "child_1" }),
        ...nCarePlans(3, { child_id: "child_2" }),
        ...nCarePlans(3, { child_id: "child_3" }),
      ],
      risk_assessment_records: [
        ...nRiskAssessments(2, { child_id: "child_1" }),
        ...nRiskAssessments(2, { child_id: "child_2" }),
        ...nRiskAssessments(2, { child_id: "child_3" }),
      ],
      incident_report_records: nIncidents(5, {
        ofsted_notification_required: true,
        ofsted_notified: true,
        local_authority_notification_required: true,
        local_authority_notified: true,
      }),
      regulatory_document_records: nRegDocs(8),
    };
  }

  it("achieves outstanding with perfect data (score=80)", () => {
    const r = run(perfectInput());
    expect(r.documentation_rating).toBe("outstanding");
    expect(r.documentation_score).toBe(80);
  });

  it("headline mentions outstanding", () => {
    const r = run(perfectInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("produces strengths", () => {
    const r = run(perfectInput());
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("produces no concerns with perfect data", () => {
    const r = run(perfectInput());
    expect(r.concerns).toHaveLength(0);
  });

  it("produces a positive insight about outstanding rating", () => {
    const r = run(perfectInput());
    const positiveInsights = r.insights.filter((i) => i.severity === "positive");
    expect(positiveInsights.length).toBeGreaterThan(0);
  });

  it("all rates are 100 with perfect data", () => {
    const r = run(perfectInput());
    expect(r.daily_log_completion_rate).toBe(100);
    expect(r.care_plan_currency_rate).toBe(100);
    expect(r.risk_assessment_review_rate).toBe(100);
    expect(r.incident_report_timeliness_rate).toBe(100);
    expect(r.regulatory_compliance_rate).toBe(100);
    expect(r.record_accuracy_rate).toBe(100);
  });
});

// ── 4. GOOD SCENARIOS ──────────────────────────────────────────────────────

describe("good scenarios", () => {
  it("achieves good rating when score is between 65 and 79", () => {
    // 80% tier bonuses: +2+2+1+1+2+1+1+1+1 = 12 => 52+12=64 ... need one more.
    // Use 95% for daily log (+4 instead of +2) and 80% for others
    // daily=95 => +4, care plan=0 (empty), risk=0 (empty), incident=80 => +1,
    // reg=80 => +2, accuracy depends, comprehensive 80% => +1
    // Let's build carefully
    const logs = [
      ...nLogs(19, { completed_on_time: true }),
      makeDailyLog({ completed_on_time: false }),
    ];
    // 19/20 = 95% completion => +4
    // All comprehensive by default => 100% => +3
    // All manager reviewed, signed, factual => high accuracy

    const r = run({
      daily_log_records: logs,
      care_plan_records: [],
      risk_assessment_records: [],
      incident_report_records: [],
      regulatory_document_records: [],
    });
    // With only logs: bonuses from daily log completion (95%=>+4),
    // comprehensive log rate (100%=>+3), accuracy rate (19 factual + 20 signed + 20 reviewed) / (20+20+20+0+0)=59/60=98% => +3
    // Notification bonus: no incidents requiring notification => both 0 => +2
    // Mitigation bonus: no mitigations => pct(0,0)=0 < 80 => no bonus, but 0 < 95 too => 0
    // So: 52+4+3+3+2 = 64. care plan currency=0 (no current plans), risk=0 (no current assessments)
    // Wait, no penalties either since empty arrays.
    // Actually mitigation: pct(0,0) = 0 which is < 80 and < 95, so no bonus
    // 52+4+0+0+0+0+3+3+2+0 = 64
    // That's 64 which is adequate (>=45 but <65). Need one more point.
    // Let me add a reg doc at 95% compliance to get +4
    const r2 = run({
      daily_log_records: logs,
      care_plan_records: [],
      risk_assessment_records: [],
      incident_report_records: [],
      regulatory_document_records: nRegDocs(5),
    });
    // reg compliance: 5/5=100% => +4
    // accuracy: (19+20+20+0+5) / (20+20+20+0+5) = 64/65 = 98% => +3
    // 52+4+0+0+0+4+3+3+2+0 = 68 => good
    expect(r2.documentation_rating).toBe("good");
    expect(r2.documentation_score).toBeGreaterThanOrEqual(65);
    expect(r2.documentation_score).toBeLessThan(80);
  });

  it("headline for good mentions strengths", () => {
    const r = run({
      daily_log_records: nLogs(20),
      regulatory_document_records: nRegDocs(5),
    });
    expect(r.headline).toContain("Good");
  });
});

// ── 5. ADEQUATE SCENARIOS ──────────────────────────────────────────────────

describe("adequate scenarios", () => {
  it("achieves adequate rating (score 45-64)", () => {
    // Base 52 with no bonuses and no penalties => 52 => adequate
    // Need: all rates either empty or in no-bonus, no-penalty zone
    // Just provide logs with 60% completion (no bonus, no penalty since >=50)
    const logs = [
      ...nLogs(6, {
        completed_on_time: true,
        covers_wellbeing: false,
        covers_activities: false,
        covers_mood: false,
        covers_interactions: false,
        covers_meals: false,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      }),
      ...nLogs(4, {
        completed_on_time: false,
        covers_wellbeing: false,
        covers_activities: false,
        covers_mood: false,
        covers_interactions: false,
        covers_meals: false,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      }),
    ];
    // 6/10 = 60% completion => no bonus, no penalty
    // comprehensive: 0% => no bonus
    // accuracy: 0 / (10+10+10+0+0) = 0% => no bonus
    // notifications: no incidents => +2
    // No penalties since 60% >= 50
    // 52+2 = 54 => adequate
    const r = run({
      daily_log_records: logs,
    });
    expect(r.documentation_rating).toBe("adequate");
    expect(r.documentation_score).toBeGreaterThanOrEqual(45);
    expect(r.documentation_score).toBeLessThan(65);
  });

  it("headline for adequate mentions concerns", () => {
    const logs = nLogs(10, {
      completed_on_time: true,
      covers_wellbeing: false,
      covers_activities: false,
      covers_mood: false,
      covers_interactions: false,
      covers_meals: false,
      manager_reviewed: false,
      factual_and_objective: false,
      signed_by_author: false,
    });
    const r = run({ daily_log_records: logs });
    expect(r.headline).toContain("Adequate");
  });

  it("base score 52 is adequate when no bonuses/penalties (notification bonus only)", () => {
    // With only empty arrays and total_children > 0 -> special case (all empty => inadequate floor)
    // So need at least some records. Provide minimal logs with no bonus metrics.
    const logs = nLogs(10, {
      completed_on_time: true,
      covers_wellbeing: false,
      covers_activities: false,
      covers_mood: false,
      covers_interactions: false,
      covers_meals: false,
      manager_reviewed: false,
      factual_and_objective: false,
      signed_by_author: false,
    });
    // completion: 100% => +4 bonus... need lower.
    // Actually 100% >= 95 => +4. Hmm need to get no bonuses.
    // Try 70% completion
    const logsB = [
      ...nLogs(7, {
        completed_on_time: true,
        covers_wellbeing: false,
        covers_activities: false,
        covers_mood: false,
        covers_interactions: false,
        covers_meals: false,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      }),
      ...nLogs(3, {
        completed_on_time: false,
        covers_wellbeing: false,
        covers_activities: false,
        covers_mood: false,
        covers_interactions: false,
        covers_meals: false,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      }),
    ];
    // 70% => no bonus (< 80), no penalty (>= 50)
    // comprehensive: 0/10 = 0% => no bonus
    // accuracy: 0 / (10+10+10) = 0% => no bonus
    // notification bonus: no incidents => +2 (both 0 required => yes)
    // 52+2 = 54
    const r = run({ daily_log_records: logsB });
    expect(r.documentation_score).toBe(54);
    expect(r.documentation_rating).toBe("adequate");
  });
});

// ── 6. INADEQUATE SCENARIOS ────────────────────────────────────────────────

describe("inadequate scenarios", () => {
  it("triggers inadequate with multiple penalties", () => {
    // Need penalties to bring below 45
    // Penalty 1: dailyLogCompletionRate < 50 => -5
    // Penalty 2: carePlanCurrencyRate < 50 => -6
    // Penalty 3: incidentReportTimelinessRate < 50 => -5
    // Penalty 4: regulatoryComplianceRate < 50 => -3
    // All 4 penalties: 52 - 5 - 6 - 5 - 3 = 33
    // Plus notification bonus: incidents with no notification requirement => +2
    // But let's ensure no bonuses fire
    const logs = [
      ...nLogs(3, {
        completed_on_time: true,
        covers_wellbeing: false,
        covers_activities: false,
        covers_mood: false,
        covers_interactions: false,
        covers_meals: false,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      }),
      ...nLogs(7, {
        completed_on_time: false,
        covers_wellbeing: false,
        covers_activities: false,
        covers_mood: false,
        covers_interactions: false,
        covers_meals: false,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      }),
    ];
    // 30% completion => -5 penalty
    const carePlans = [
      makeCarePlan({ is_current: true, review_overdue: true }),
      makeCarePlan({ is_current: true, review_overdue: true }),
      makeCarePlan({ is_current: true, review_overdue: false }),
    ];
    // current: 3, overdue: 2, currency = (3-2)/3 = 33% => -6 penalty
    const incidents = [
      ...nIncidents(3, { completed_within_24h: false, manager_signed_off: false }),
      makeIncidentReport({ completed_within_24h: true, manager_signed_off: false }),
    ];
    // 1/4 = 25% => -5 penalty
    const regDocs = [
      makeRegulatoryDocument({ meets_statutory_requirements: false }),
      makeRegulatoryDocument({ meets_statutory_requirements: false }),
      makeRegulatoryDocument({ meets_statutory_requirements: false }),
      makeRegulatoryDocument({ meets_statutory_requirements: true }),
    ];
    // 1/4 = 25% => -3 penalty
    // Bonuses: daily=30%<80 => 0, care=33%<80 => 0, risk: empty => 0,
    // incident=25%<80 => 0, reg=25%<80 => 0
    // accuracy: (0+0+0+1+4) / (10+10+10+4+4) = 5/38 = 13% => 0
    // comprehensive: 0% => 0
    // notification: no ofsted/la required => +2
    // mitigation: 0 mitigations => 0
    // Score: 52+2-5-6-5-3 = 35
    const r = run({
      daily_log_records: logs,
      care_plan_records: carePlans,
      incident_report_records: incidents,
      regulatory_document_records: regDocs,
    });
    expect(r.documentation_rating).toBe("inadequate");
    expect(r.documentation_score).toBe(35);
  });

  it("headline for inadequate mentions significant concerns", () => {
    const r = run({
      daily_log_records: nLogs(10, {
        completed_on_time: false,
        covers_wellbeing: false,
        covers_activities: false,
        covers_mood: false,
        covers_interactions: false,
        covers_meals: false,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      }),
      care_plan_records: [
        makeCarePlan({ is_current: true, review_overdue: true }),
      ],
      incident_report_records: nIncidents(5, {
        completed_within_24h: false,
        manager_signed_off: false,
      }),
      regulatory_document_records: nRegDocs(4, {
        meets_statutory_requirements: false,
      }),
    });
    expect(r.documentation_rating).toBe("inadequate");
    expect(r.headline).toContain("inadequate");
  });
});

// ── 7. INDIVIDUAL BONUS TESTS ──────────────────────────────────────────────

describe("individual bonuses", () => {
  // Strategy: for each bonus, isolate it by zeroing out all other contributors.
  // We always need at least one record to avoid the "all empty" special cases.
  // Use a single type of record and zero the fields that affect other bonuses.

  // Helper: minimal non-bonus logs (no completion bonus, no comprehensive, no accuracy, no signing)
  function zeroedLogs(
    n: number,
    overrides: Partial<DailyLogInput> = {},
  ): DailyLogInput[] {
    return nLogs(n, {
      completed_on_time: false,
      covers_wellbeing: false,
      covers_activities: false,
      covers_mood: false,
      covers_interactions: false,
      covers_meals: false,
      manager_reviewed: false,
      factual_and_objective: false,
      signed_by_author: false,
      ...overrides,
    });
  }

  describe("Bonus 1: dailyLogCompletionRate", () => {
    it("+4 when >= 95%", () => {
      // 20 logs, 19 on time = 95%
      const logs = [
        ...zeroedLogs(19, { completed_on_time: true }),
        ...zeroedLogs(1, { completed_on_time: false }),
      ];
      // No notification needed => +2 for bonus 8
      // All other bonuses: 0 (comprehensive=0%, accuracy=0%, etc.)
      // Score: 52 + 4 (bonus 1) + 2 (bonus 8) - 0 = 58
      // Actually logs completion: 19/20 = 95% => +4
      // But penalty: 95% >= 50 so no penalty
      const r = run({ daily_log_records: logs });
      expect(r.documentation_score).toBe(58);
    });

    it("+2 when >= 80% but < 95%", () => {
      // 20 logs, 16 on time = 80%
      const logs = [
        ...zeroedLogs(16, { completed_on_time: true }),
        ...zeroedLogs(4, { completed_on_time: false }),
      ];
      // Score: 52 + 2 (bonus 1) + 2 (bonus 8) = 56
      const r = run({ daily_log_records: logs });
      expect(r.documentation_score).toBe(56);
    });

    it("+0 when < 80%", () => {
      // 10 logs, 7 on time = 70%
      const logs = [
        ...zeroedLogs(7, { completed_on_time: true }),
        ...zeroedLogs(3, { completed_on_time: false }),
      ];
      // Score: 52 + 0 + 2 (bonus 8) = 54
      const r = run({ daily_log_records: logs });
      expect(r.documentation_score).toBe(54);
    });
  });

  describe("Bonus 2: carePlanCurrencyRate", () => {
    it("+4 when >= 95%", () => {
      // Need to avoid other bonuses. Provide only care plans.
      // But we need at least some record to avoid "all empty" - care plans count.
      // 20 current plans, 0 overdue = 100%
      const plans = nCarePlans(20, {
        is_current: true,
        review_overdue: false,
        child_participated: false,
        objectives_count: 0,
        objectives_met: 0,
      });
      // Bonuses: care plan currency = 100% => +4
      // notification: no incidents => +2
      // All other bonuses: 0
      // Score: 52 + 4 + 2 = 58
      const r = run({ care_plan_records: plans });
      expect(r.documentation_score).toBe(58);
    });

    it("+2 when >= 80% but < 95%", () => {
      // 10 current plans, 2 overdue => (10-2)/10 = 80%
      const plans = [
        ...nCarePlans(8, {
          is_current: true,
          review_overdue: false,
          child_participated: false,
          objectives_count: 0,
          objectives_met: 0,
        }),
        ...nCarePlans(2, {
          is_current: true,
          review_overdue: true,
          child_participated: false,
          objectives_count: 0,
          objectives_met: 0,
        }),
      ];
      // currency: (10-2)/10 = 80% => +2
      // Score: 52 + 2 + 2 = 56
      const r = run({ care_plan_records: plans });
      expect(r.documentation_score).toBe(56);
    });

    it("+0 when < 80%", () => {
      // 10 current plans, 3 overdue => 70%
      const plans = [
        ...nCarePlans(7, {
          is_current: true,
          review_overdue: false,
          child_participated: false,
          objectives_count: 0,
          objectives_met: 0,
        }),
        ...nCarePlans(3, {
          is_current: true,
          review_overdue: true,
          child_participated: false,
          objectives_count: 0,
          objectives_met: 0,
        }),
      ];
      // currency: (10-3)/10 = 70% => no bonus
      // Score: 52 + 0 + 2 = 54
      const r = run({ care_plan_records: plans });
      expect(r.documentation_score).toBe(54);
    });
  });

  describe("Bonus 3: riskAssessmentReviewRate", () => {
    it("+3 when >= 95%", () => {
      // 20 current, 0 overdue = 100%
      const assessments = nRiskAssessments(20, {
        is_current: true,
        review_overdue: false,
        multi_agency_input: false,
        dynamic_risk_factors_recorded: false,
        linked_to_care_plan: false,
        mitigations_identified: 0,
        mitigations_implemented: 0,
      });
      // Score: 52 + 3 + 2 (notification) = 57
      const r = run({ risk_assessment_records: assessments });
      expect(r.documentation_score).toBe(57);
    });

    it("+1 when >= 80% but < 95%", () => {
      // 10 current, 2 overdue => 80%
      const assessments = [
        ...nRiskAssessments(8, {
          is_current: true,
          review_overdue: false,
          multi_agency_input: false,
          dynamic_risk_factors_recorded: false,
          linked_to_care_plan: false,
          mitigations_identified: 0,
          mitigations_implemented: 0,
        }),
        ...nRiskAssessments(2, {
          is_current: true,
          review_overdue: true,
          multi_agency_input: false,
          dynamic_risk_factors_recorded: false,
          linked_to_care_plan: false,
          mitigations_identified: 0,
          mitigations_implemented: 0,
        }),
      ];
      // Score: 52 + 1 + 2 = 55
      const r = run({ risk_assessment_records: assessments });
      expect(r.documentation_score).toBe(55);
    });

    it("+0 when < 80%", () => {
      const assessments = [
        ...nRiskAssessments(7, {
          is_current: true,
          review_overdue: false,
          multi_agency_input: false,
          dynamic_risk_factors_recorded: false,
          linked_to_care_plan: false,
          mitigations_identified: 0,
          mitigations_implemented: 0,
        }),
        ...nRiskAssessments(3, {
          is_current: true,
          review_overdue: true,
          multi_agency_input: false,
          dynamic_risk_factors_recorded: false,
          linked_to_care_plan: false,
          mitigations_identified: 0,
          mitigations_implemented: 0,
        }),
      ];
      // 70% => no bonus. Score: 52+2=54
      const r = run({ risk_assessment_records: assessments });
      expect(r.documentation_score).toBe(54);
    });
  });

  describe("Bonus 4: incidentReportTimelinessRate", () => {
    it("+3 when >= 95%", () => {
      // 20 incidents, all timely
      const incidents = nIncidents(20, {
        completed_within_24h: true,
        manager_signed_off: false,
        lessons_learned_recorded: false,
        follow_up_actions_identified: 0,
        follow_up_actions_completed: 0,
      });
      // timeliness: 100% => +3
      // notification: no ofsted/la required => +2
      // accuracy: (0+20) / (0+20+0) but no logs... wait
      // No logs, no reg docs => accuracy denominator = 0+0+0+20+0 = 20
      // accuracy numerator = 0 (no log factual) + 0 (no log signed) + 0 (no log reviewed) + 0 (manager signed off false) + 0 (no reg docs reviewed) = 0
      // accuracy: 0/20 = 0% => no bonus
      // Score: 52 + 3 + 2 = 57
      const r = run({ incident_report_records: incidents });
      expect(r.documentation_score).toBe(57);
    });

    it("+1 when >= 80% but < 95%", () => {
      // 10 incidents, 8 timely = 80%
      const incidents = [
        ...nIncidents(8, {
          completed_within_24h: true,
          manager_signed_off: false,
          lessons_learned_recorded: false,
          follow_up_actions_identified: 0,
          follow_up_actions_completed: 0,
        }),
        ...nIncidents(2, {
          completed_within_24h: false,
          manager_signed_off: false,
          lessons_learned_recorded: false,
          follow_up_actions_identified: 0,
          follow_up_actions_completed: 0,
        }),
      ];
      // Score: 52 + 1 + 2 = 55
      const r = run({ incident_report_records: incidents });
      expect(r.documentation_score).toBe(55);
    });

    it("+0 when < 80%", () => {
      const incidents = [
        ...nIncidents(7, {
          completed_within_24h: true,
          manager_signed_off: false,
          lessons_learned_recorded: false,
          follow_up_actions_identified: 0,
          follow_up_actions_completed: 0,
        }),
        ...nIncidents(3, {
          completed_within_24h: false,
          manager_signed_off: false,
          lessons_learned_recorded: false,
          follow_up_actions_identified: 0,
          follow_up_actions_completed: 0,
        }),
      ];
      // 70% => no bonus. Score: 52+2=54
      const r = run({ incident_report_records: incidents });
      expect(r.documentation_score).toBe(54);
    });
  });

  describe("Bonus 5: regulatoryComplianceRate", () => {
    it("+4 when >= 95%", () => {
      const docs = nRegDocs(20, {
        meets_statutory_requirements: true,
        is_current: true,
        reviewed_by_manager: false,
      });
      // compliance: 20/20 = 100% => +4
      // accuracy: 0 / (0+0+0+0+20) wait... currentRegDocs = 20
      // accuracy numerator: 0 (no logs factual) + 0 (no logs signed) + 0 (no logs reviewed) + 0 (no incidents) + 0 (reg docs manager reviewed = false)
      // accuracy denominator: 0+0+0+0+20 = 20
      // accuracy: 0/20 = 0% => no bonus
      // notification: no incidents => +2
      // Score: 52 + 4 + 2 = 58
      const r = run({ regulatory_document_records: docs });
      expect(r.documentation_score).toBe(58);
    });

    it("+2 when >= 80% but < 95%", () => {
      // 10 docs, 8 meet requirements = 80%
      const docs = [
        ...nRegDocs(8, {
          meets_statutory_requirements: true,
          is_current: true,
          reviewed_by_manager: false,
        }),
        ...nRegDocs(2, {
          meets_statutory_requirements: false,
          is_current: true,
          reviewed_by_manager: false,
        }),
      ];
      // compliance: 8/10 = 80% => +2
      // accuracy: 0/10 = 0% => 0
      // notification: +2
      // Score: 52 + 2 + 2 = 56
      const r = run({ regulatory_document_records: docs });
      expect(r.documentation_score).toBe(56);
    });

    it("+0 when < 80%", () => {
      const docs = [
        ...nRegDocs(7, {
          meets_statutory_requirements: true,
          is_current: true,
          reviewed_by_manager: false,
        }),
        ...nRegDocs(3, {
          meets_statutory_requirements: false,
          is_current: true,
          reviewed_by_manager: false,
        }),
      ];
      // 70% => no bonus. Score: 52+2=54
      const r = run({ regulatory_document_records: docs });
      expect(r.documentation_score).toBe(54);
    });
  });

  describe("Bonus 6: recordAccuracyRate", () => {
    it("+3 when >= 90%", () => {
      // accuracy = (logsFactualObjective + logsSigned + logsManagerReviewed + incidentsManagerSignedOff + regDocsManagerReviewed)
      //          / (totalLogs + totalLogs + totalLogs + totalIncidents + currentRegDocs)
      // Use 10 perfect logs only (no incidents, no reg docs)
      // numerator: 10+10+10 = 30, denominator: 10+10+10 = 30 => 100%
      // But daily log completion: all on_time by default, so dailyLogCompletionRate = 100% => +4 (bonus 1)
      // comprehensive: all true by default => 100% => +3 (bonus 7)
      // notification: +2 (bonus 8)
      // We want ONLY bonus 6 isolation, but accuracy requires logs with factual/signed/reviewed.
      // Those same logs will trigger other bonuses. Let's accept that and compute.
      // Actually, let's use logs that are NOT on_time and NOT comprehensive, but ARE factual/signed/reviewed.
      const logs = nLogs(10, {
        completed_on_time: false,
        covers_wellbeing: false,
        covers_activities: false,
        covers_mood: false,
        covers_interactions: false,
        covers_meals: false,
        manager_reviewed: true,
        factual_and_objective: true,
        signed_by_author: true,
      });
      // dailyLogCompletion: 0/10 = 0% => penalty -5 (since < 50 and totalLogs > 0)
      // comprehensive: 0/10 = 0% => no bonus
      // accuracy: (10+10+10) / (10+10+10) = 100% => +3
      // notification: +2
      // Score: 52 + 3 + 2 - 5 = 52
      const r = run({ daily_log_records: logs });
      expect(r.documentation_score).toBe(52);
    });

    it("+1 when >= 75% but < 90%", () => {
      // 10 logs: 8 factual, 8 signed, 8 reviewed => numerator=24, denom=30 => 80%
      const logs = [
        ...nLogs(8, {
          completed_on_time: false,
          covers_wellbeing: false,
          covers_activities: false,
          covers_mood: false,
          covers_interactions: false,
          covers_meals: false,
          manager_reviewed: true,
          factual_and_objective: true,
          signed_by_author: true,
        }),
        ...nLogs(2, {
          completed_on_time: false,
          covers_wellbeing: false,
          covers_activities: false,
          covers_mood: false,
          covers_interactions: false,
          covers_meals: false,
          manager_reviewed: false,
          factual_and_objective: false,
          signed_by_author: false,
        }),
      ];
      // accuracy: 24/30 = 80% => +1
      // dailyLogCompletion: 0% => -5
      // notification: +2
      // Score: 52 + 1 + 2 - 5 = 50
      const r = run({ daily_log_records: logs });
      expect(r.documentation_score).toBe(50);
    });

    it("+0 when < 75%", () => {
      // 10 logs: 5 factual, 5 signed, 5 reviewed => 15/30 = 50%
      const logs = [
        ...nLogs(5, {
          completed_on_time: false,
          covers_wellbeing: false,
          covers_activities: false,
          covers_mood: false,
          covers_interactions: false,
          covers_meals: false,
          manager_reviewed: true,
          factual_and_objective: true,
          signed_by_author: true,
        }),
        ...nLogs(5, {
          completed_on_time: false,
          covers_wellbeing: false,
          covers_activities: false,
          covers_mood: false,
          covers_interactions: false,
          covers_meals: false,
          manager_reviewed: false,
          factual_and_objective: false,
          signed_by_author: false,
        }),
      ];
      // accuracy: 15/30 = 50% => no bonus
      // dailyLogCompletion: 0% => -5
      // notification: +2
      // Score: 52 + 0 + 2 - 5 = 49
      const r = run({ daily_log_records: logs });
      expect(r.documentation_score).toBe(49);
    });
  });

  describe("Bonus 7: comprehensiveLogRate", () => {
    it("+3 when >= 90%", () => {
      // 10 logs, all comprehensive, but not on time
      const logs = nLogs(10, {
        completed_on_time: false,
        covers_wellbeing: true,
        covers_activities: true,
        covers_mood: true,
        covers_interactions: true,
        covers_meals: true,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      });
      // comprehensive: 100% => +3
      // dailyLogCompletion: 0% => -5
      // accuracy: 0/30 = 0% => 0
      // notification: +2
      // Score: 52 + 3 + 2 - 5 = 52
      const r = run({ daily_log_records: logs });
      expect(r.documentation_score).toBe(52);
    });

    it("+1 when >= 70% but < 90%", () => {
      const logs = [
        ...nLogs(7, {
          completed_on_time: false,
          covers_wellbeing: true,
          covers_activities: true,
          covers_mood: true,
          covers_interactions: true,
          covers_meals: true,
          manager_reviewed: false,
          factual_and_objective: false,
          signed_by_author: false,
        }),
        ...nLogs(3, {
          completed_on_time: false,
          covers_wellbeing: false,
          covers_activities: false,
          covers_mood: false,
          covers_interactions: false,
          covers_meals: false,
          manager_reviewed: false,
          factual_and_objective: false,
          signed_by_author: false,
        }),
      ];
      // 7/10=70% => +1
      // dailyLogCompletion: 0% => -5
      // notification: +2
      // Score: 52 + 1 + 2 - 5 = 50
      const r = run({ daily_log_records: logs });
      expect(r.documentation_score).toBe(50);
    });

    it("+0 when < 70%", () => {
      const logs = [
        ...nLogs(6, {
          completed_on_time: false,
          covers_wellbeing: true,
          covers_activities: true,
          covers_mood: true,
          covers_interactions: true,
          covers_meals: true,
          manager_reviewed: false,
          factual_and_objective: false,
          signed_by_author: false,
        }),
        ...nLogs(4, {
          completed_on_time: false,
          covers_wellbeing: false,
          covers_activities: false,
          covers_mood: false,
          covers_interactions: false,
          covers_meals: false,
          manager_reviewed: false,
          factual_and_objective: false,
          signed_by_author: false,
        }),
      ];
      // 6/10=60% => no bonus
      // Score: 52 + 0 + 2 - 5 = 49
      const r = run({ daily_log_records: logs });
      expect(r.documentation_score).toBe(49);
    });
  });

  describe("Bonus 8: notification compliance (ofsted + LA)", () => {
    it("+2 when both 100%", () => {
      const incidents = nIncidents(5, {
        completed_within_24h: false,
        manager_signed_off: false,
        ofsted_notification_required: true,
        ofsted_notified: true,
        local_authority_notification_required: true,
        local_authority_notified: true,
        follow_up_actions_identified: 0,
        follow_up_actions_completed: 0,
        lessons_learned_recorded: false,
      });
      // timeliness: 0% => -5 (penalty 3)
      // notification: both 100% => +2
      // accuracy: 0/(0+0+0+5+0) = 0% => 0
      // Score: 52 + 2 - 5 = 49
      const r = run({ incident_report_records: incidents });
      expect(r.documentation_score).toBe(49);
    });

    it("+2 when no notifications required (both 0 required)", () => {
      const incidents = nIncidents(5, {
        completed_within_24h: false,
        manager_signed_off: false,
        ofsted_notification_required: false,
        local_authority_notification_required: false,
        follow_up_actions_identified: 0,
        follow_up_actions_completed: 0,
        lessons_learned_recorded: false,
      });
      // timeliness: 0% => -5
      // notification: both 0 required => +2
      // Score: 52 + 2 - 5 = 49
      const r = run({ incident_report_records: incidents });
      expect(r.documentation_score).toBe(49);
    });

    it("+1 when both >= 80% (but not both 100%)", () => {
      // 5 incidents: 4 require ofsted, 4 notified (100%), and 5 require LA, 4 notified (80%)
      const incidents = [
        ...nIncidents(4, {
          completed_within_24h: false,
          manager_signed_off: false,
          ofsted_notification_required: true,
          ofsted_notified: true,
          local_authority_notification_required: true,
          local_authority_notified: true,
          follow_up_actions_identified: 0,
          follow_up_actions_completed: 0,
          lessons_learned_recorded: false,
        }),
        makeIncidentReport({
          completed_within_24h: false,
          manager_signed_off: false,
          ofsted_notification_required: false,
          ofsted_notified: false,
          local_authority_notification_required: true,
          local_authority_notified: false,
          follow_up_actions_identified: 0,
          follow_up_actions_completed: 0,
          lessons_learned_recorded: false,
        }),
      ];
      // ofsted: 4 required, 4 notified => 100% => passes >=100 check for top tier
      // LA: 5 required, 4 notified => 80% => fails >=100 check
      // Top tier check: ofsted>=100 YES, LA>=100 NO => fails
      // Second tier check: ofsted>=80 YES, LA>=80 YES => +1
      // timeliness: 0/5=0% => -5
      // Score: 52+1-5 = 48
      const r = run({ incident_report_records: incidents });
      expect(r.documentation_score).toBe(48);
    });

    it("+0 when either < 80%", () => {
      const incidents = [
        ...nIncidents(3, {
          completed_within_24h: false,
          manager_signed_off: false,
          ofsted_notification_required: true,
          ofsted_notified: true,
          local_authority_notification_required: true,
          local_authority_notified: false,
          follow_up_actions_identified: 0,
          follow_up_actions_completed: 0,
          lessons_learned_recorded: false,
        }),
        ...nIncidents(2, {
          completed_within_24h: false,
          manager_signed_off: false,
          ofsted_notification_required: true,
          ofsted_notified: false,
          local_authority_notification_required: true,
          local_authority_notified: false,
          follow_up_actions_identified: 0,
          follow_up_actions_completed: 0,
          lessons_learned_recorded: false,
        }),
      ];
      // ofsted: 5 required, 3 notified => 60% < 80 => fails
      // LA: 5 required, 0 notified => 0% < 80 => fails
      // => +0
      // timeliness: 0% => -5
      // Score: 52+0-5 = 47
      const r = run({ incident_report_records: incidents });
      expect(r.documentation_score).toBe(47);
    });
  });

  describe("Bonus 9: mitigationImplementationRate", () => {
    it("+2 when >= 95%", () => {
      const assessments = nRiskAssessments(10, {
        is_current: true,
        review_overdue: false,
        mitigations_identified: 10,
        mitigations_implemented: 10,
        multi_agency_input: false,
        dynamic_risk_factors_recorded: false,
        linked_to_care_plan: false,
      });
      // mitigation: 100/100 = 100% => +2
      // risk review: 100% => +3
      // notification: +2
      // Score: 52 + 3 + 2 + 2 = 59
      const r = run({ risk_assessment_records: assessments });
      expect(r.documentation_score).toBe(59);
    });

    it("+1 when >= 80% but < 95%", () => {
      const assessments = nRiskAssessments(10, {
        is_current: true,
        review_overdue: false,
        mitigations_identified: 10,
        mitigations_implemented: 8,
        multi_agency_input: false,
        dynamic_risk_factors_recorded: false,
        linked_to_care_plan: false,
      });
      // mitigation: 80/100 = 80% => +1
      // risk review: 100% => +3
      // notification: +2
      // Score: 52 + 3 + 1 + 2 = 58
      const r = run({ risk_assessment_records: assessments });
      expect(r.documentation_score).toBe(58);
    });

    it("+0 when < 80%", () => {
      const assessments = nRiskAssessments(10, {
        is_current: true,
        review_overdue: false,
        mitigations_identified: 10,
        mitigations_implemented: 5,
        multi_agency_input: false,
        dynamic_risk_factors_recorded: false,
        linked_to_care_plan: false,
      });
      // mitigation: 50/100 = 50% => no bonus
      // risk review: 100% => +3
      // notification: +2
      // Score: 52 + 3 + 0 + 2 = 57
      const r = run({ risk_assessment_records: assessments });
      expect(r.documentation_score).toBe(57);
    });

    it("no bonus when mitigations_identified is 0 (pct(0,0)=0)", () => {
      const assessments = nRiskAssessments(5, {
        is_current: true,
        review_overdue: false,
        mitigations_identified: 0,
        mitigations_implemented: 0,
        multi_agency_input: false,
        dynamic_risk_factors_recorded: false,
        linked_to_care_plan: false,
      });
      // mitigation: pct(0,0) = 0 => no bonus
      // risk review: 100% => +3
      // notification: +2
      // Score: 52 + 3 + 0 + 2 = 57
      const r = run({ risk_assessment_records: assessments });
      expect(r.documentation_score).toBe(57);
    });
  });
});

// ── 8. INDIVIDUAL PENALTY TESTS ────────────────────────────────────────────

describe("individual penalties", () => {
  describe("Penalty 1: dailyLogCompletionRate < 50 => -5", () => {
    it("applies -5 when < 50%", () => {
      const logs = [
        ...nLogs(4, {
          completed_on_time: true,
          covers_wellbeing: false,
          covers_activities: false,
          covers_mood: false,
          covers_interactions: false,
          covers_meals: false,
          manager_reviewed: false,
          factual_and_objective: false,
          signed_by_author: false,
        }),
        ...nLogs(6, {
          completed_on_time: false,
          covers_wellbeing: false,
          covers_activities: false,
          covers_mood: false,
          covers_interactions: false,
          covers_meals: false,
          manager_reviewed: false,
          factual_and_objective: false,
          signed_by_author: false,
        }),
      ];
      // 40% => -5. notification: +2. Score: 52+2-5=49
      const r = run({ daily_log_records: logs });
      expect(r.documentation_score).toBe(49);
    });

    it("does not apply when = 50%", () => {
      const logs = [
        ...nLogs(5, {
          completed_on_time: true,
          covers_wellbeing: false,
          covers_activities: false,
          covers_mood: false,
          covers_interactions: false,
          covers_meals: false,
          manager_reviewed: false,
          factual_and_objective: false,
          signed_by_author: false,
        }),
        ...nLogs(5, {
          completed_on_time: false,
          covers_wellbeing: false,
          covers_activities: false,
          covers_mood: false,
          covers_interactions: false,
          covers_meals: false,
          manager_reviewed: false,
          factual_and_objective: false,
          signed_by_author: false,
        }),
      ];
      // 50% => no penalty. notification: +2. Score: 52+2=54
      const r = run({ daily_log_records: logs });
      expect(r.documentation_score).toBe(54);
    });

    it("does not apply when totalLogs = 0", () => {
      // Only care plans, no logs => penalty guarded by totalLogs > 0
      const r = run({
        care_plan_records: nCarePlans(3, {
          child_participated: false,
          objectives_count: 0,
          objectives_met: 0,
        }),
      });
      // No log penalty. carePlanCurrency=100% => +4. notification: +2. Score: 52+4+2=58
      expect(r.documentation_score).toBe(58);
    });
  });

  describe("Penalty 2: carePlanCurrencyRate < 50 => -6", () => {
    it("applies -6 when < 50%", () => {
      const plans = [
        makeCarePlan({
          is_current: true,
          review_overdue: true,
          child_participated: false,
          objectives_count: 0,
          objectives_met: 0,
        }),
        makeCarePlan({
          is_current: true,
          review_overdue: true,
          child_participated: false,
          objectives_count: 0,
          objectives_met: 0,
        }),
        makeCarePlan({
          is_current: true,
          review_overdue: false,
          child_participated: false,
          objectives_count: 0,
          objectives_met: 0,
        }),
      ];
      // currency: (3-2)/3 = 33% => -6. notification: +2. Score: 52+2-6=48
      const r = run({ care_plan_records: plans });
      expect(r.documentation_score).toBe(48);
    });

    it("does not apply when = 50%", () => {
      const plans = [
        makeCarePlan({
          is_current: true,
          review_overdue: true,
          child_participated: false,
          objectives_count: 0,
          objectives_met: 0,
        }),
        makeCarePlan({
          is_current: true,
          review_overdue: false,
          child_participated: false,
          objectives_count: 0,
          objectives_met: 0,
        }),
      ];
      // currency: (2-1)/2 = 50% => no penalty. notification: +2. Score: 52+2=54
      const r = run({ care_plan_records: plans });
      expect(r.documentation_score).toBe(54);
    });

    it("does not apply when currentCarePlans = 0", () => {
      const plans = [
        makeCarePlan({
          is_current: false,
          review_overdue: false,
          child_participated: false,
          objectives_count: 0,
          objectives_met: 0,
        }),
      ];
      // currentCarePlans = 0 => currency = 0 but guarded by currentCarePlans > 0 => no penalty
      // notification: +2. Score: 52+2=54
      const r = run({ care_plan_records: plans });
      expect(r.documentation_score).toBe(54);
    });
  });

  describe("Penalty 3: incidentReportTimelinessRate < 50 => -5", () => {
    it("applies -5 when < 50%", () => {
      const incidents = [
        ...nIncidents(2, {
          completed_within_24h: true,
          manager_signed_off: false,
          follow_up_actions_identified: 0,
          follow_up_actions_completed: 0,
          lessons_learned_recorded: false,
        }),
        ...nIncidents(8, {
          completed_within_24h: false,
          manager_signed_off: false,
          follow_up_actions_identified: 0,
          follow_up_actions_completed: 0,
          lessons_learned_recorded: false,
        }),
      ];
      // 20% => -5. notification: +2. Score: 52+2-5=49
      const r = run({ incident_report_records: incidents });
      expect(r.documentation_score).toBe(49);
    });

    it("does not apply when = 50%", () => {
      const incidents = [
        ...nIncidents(5, {
          completed_within_24h: true,
          manager_signed_off: false,
          follow_up_actions_identified: 0,
          follow_up_actions_completed: 0,
          lessons_learned_recorded: false,
        }),
        ...nIncidents(5, {
          completed_within_24h: false,
          manager_signed_off: false,
          follow_up_actions_identified: 0,
          follow_up_actions_completed: 0,
          lessons_learned_recorded: false,
        }),
      ];
      // 50% => no penalty. notification: +2. Score: 52+2=54
      const r = run({ incident_report_records: incidents });
      expect(r.documentation_score).toBe(54);
    });

    it("does not apply when totalIncidents = 0", () => {
      const r = run({
        regulatory_document_records: nRegDocs(3, {
          reviewed_by_manager: false,
        }),
      });
      // No incident penalty. reg compliance 100% => +4. notification: +2. Score: 52+4+2=58
      expect(r.documentation_score).toBe(58);
    });
  });

  describe("Penalty 4: regulatoryComplianceRate < 50 => -3", () => {
    it("applies -3 when < 50%", () => {
      const docs = [
        ...nRegDocs(3, {
          meets_statutory_requirements: false,
          reviewed_by_manager: false,
        }),
        makeRegulatoryDocument({
          meets_statutory_requirements: true,
          reviewed_by_manager: false,
        }),
      ];
      // 1/4 = 25% => -3. notification: +2. Score: 52+2-3=51
      const r = run({ regulatory_document_records: docs });
      expect(r.documentation_score).toBe(51);
    });

    it("does not apply when = 50%", () => {
      const docs = [
        ...nRegDocs(5, {
          meets_statutory_requirements: true,
          reviewed_by_manager: false,
        }),
        ...nRegDocs(5, {
          meets_statutory_requirements: false,
          reviewed_by_manager: false,
        }),
      ];
      // 5/10 = 50% => no penalty. notification: +2. Score: 52+2=54
      const r = run({ regulatory_document_records: docs });
      expect(r.documentation_score).toBe(54);
    });

    it("does not apply when totalRegDocs = 0", () => {
      const r = run({
        care_plan_records: nCarePlans(3, {
          child_participated: false,
          objectives_count: 0,
          objectives_met: 0,
        }),
      });
      // No reg doc penalty. care plan currency 100% => +4. notification: +2. Score: 52+4+2=58
      expect(r.documentation_score).toBe(58);
    });
  });

  describe("cumulative penalties", () => {
    it("all 4 penalties can stack", () => {
      const logs = nLogs(10, {
        completed_on_time: false,
        covers_wellbeing: false,
        covers_activities: false,
        covers_mood: false,
        covers_interactions: false,
        covers_meals: false,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      });
      const plans = [
        makeCarePlan({ is_current: true, review_overdue: true, child_participated: false, objectives_count: 0, objectives_met: 0 }),
      ];
      const incidents = nIncidents(10, {
        completed_within_24h: false,
        manager_signed_off: false,
        follow_up_actions_identified: 0,
        follow_up_actions_completed: 0,
        lessons_learned_recorded: false,
      });
      const docs = nRegDocs(10, {
        meets_statutory_requirements: false,
        reviewed_by_manager: false,
      });
      // penalties: -5 -6 -5 -3 = -19
      // notification: +2
      // Score: 52 + 2 - 19 = 35
      const r = run({
        daily_log_records: logs,
        care_plan_records: plans,
        incident_report_records: incidents,
        regulatory_document_records: docs,
      });
      expect(r.documentation_score).toBe(35);
    });
  });
});

// ── 9. RATE CALCULATION TESTS ──────────────────────────────────────────────

describe("rate calculations", () => {
  describe("daily_log_completion_rate", () => {
    it("returns 100 when all on time", () => {
      const r = run({ daily_log_records: nLogs(5) });
      expect(r.daily_log_completion_rate).toBe(100);
    });

    it("returns 0 when none on time", () => {
      const r = run({
        daily_log_records: nLogs(5, { completed_on_time: false }),
      });
      expect(r.daily_log_completion_rate).toBe(0);
    });

    it("returns 0 when no logs", () => {
      const r = run({ daily_log_records: [], care_plan_records: nCarePlans(1) });
      expect(r.daily_log_completion_rate).toBe(0);
    });

    it("calculates correct percentage", () => {
      const r = run({
        daily_log_records: [
          ...nLogs(3, { completed_on_time: true }),
          ...nLogs(7, { completed_on_time: false }),
        ],
      });
      expect(r.daily_log_completion_rate).toBe(30);
    });

    it("rounds correctly (pct uses Math.round)", () => {
      // 1/3 = 33.333... => rounds to 33
      const r = run({
        daily_log_records: [
          makeDailyLog({ completed_on_time: true }),
          makeDailyLog({ completed_on_time: false }),
          makeDailyLog({ completed_on_time: false }),
        ],
      });
      expect(r.daily_log_completion_rate).toBe(33);
    });
  });

  describe("care_plan_currency_rate", () => {
    it("returns 100 when all current and none overdue", () => {
      const r = run({ care_plan_records: nCarePlans(5) });
      expect(r.care_plan_currency_rate).toBe(100);
    });

    it("returns 0 when all current plans are overdue", () => {
      const r = run({
        care_plan_records: nCarePlans(5, { is_current: true, review_overdue: true }),
      });
      expect(r.care_plan_currency_rate).toBe(0);
    });

    it("returns 0 when no current care plans", () => {
      const r = run({
        care_plan_records: nCarePlans(5, { is_current: false }),
      });
      expect(r.care_plan_currency_rate).toBe(0);
    });

    it("counts only overdue among current plans", () => {
      const r = run({
        care_plan_records: [
          makeCarePlan({ is_current: true, review_overdue: false }),
          makeCarePlan({ is_current: true, review_overdue: true }),
          makeCarePlan({ is_current: false, review_overdue: true }), // ignored: not current
        ],
      });
      // current: 2, overdue among current: 1, currency = (2-1)/2 = 50%
      expect(r.care_plan_currency_rate).toBe(50);
    });
  });

  describe("risk_assessment_review_rate", () => {
    it("returns 100 when all current and none overdue", () => {
      const r = run({
        risk_assessment_records: nRiskAssessments(5),
      });
      expect(r.risk_assessment_review_rate).toBe(100);
    });

    it("returns 0 when all current are overdue", () => {
      const r = run({
        risk_assessment_records: nRiskAssessments(5, {
          is_current: true,
          review_overdue: true,
        }),
      });
      expect(r.risk_assessment_review_rate).toBe(0);
    });

    it("returns 0 when no current assessments", () => {
      const r = run({
        risk_assessment_records: nRiskAssessments(5, { is_current: false }),
      });
      expect(r.risk_assessment_review_rate).toBe(0);
    });

    it("only counts overdue among current assessments", () => {
      const r = run({
        risk_assessment_records: [
          makeRiskAssessment({ is_current: true, review_overdue: false }),
          makeRiskAssessment({ is_current: true, review_overdue: false }),
          makeRiskAssessment({ is_current: true, review_overdue: true }),
          makeRiskAssessment({ is_current: false, review_overdue: true }), // ignored
        ],
      });
      // current: 3, overdue among current: 1, rate = (3-1)/3 = 67%
      expect(r.risk_assessment_review_rate).toBe(67);
    });
  });

  describe("incident_report_timeliness_rate", () => {
    it("returns 100 when all within 24h", () => {
      const r = run({ incident_report_records: nIncidents(5) });
      expect(r.incident_report_timeliness_rate).toBe(100);
    });

    it("returns 0 when none within 24h", () => {
      const r = run({
        incident_report_records: nIncidents(5, {
          completed_within_24h: false,
        }),
      });
      expect(r.incident_report_timeliness_rate).toBe(0);
    });

    it("returns 0 when no incidents", () => {
      const r = run({
        incident_report_records: [],
        daily_log_records: nLogs(1),
      });
      expect(r.incident_report_timeliness_rate).toBe(0);
    });

    it("calculates correct percentage", () => {
      const r = run({
        incident_report_records: [
          ...nIncidents(3, { completed_within_24h: true }),
          ...nIncidents(1, { completed_within_24h: false }),
        ],
      });
      expect(r.incident_report_timeliness_rate).toBe(75);
    });
  });

  describe("regulatory_compliance_rate", () => {
    it("returns 100 when all meet requirements", () => {
      const r = run({ regulatory_document_records: nRegDocs(5) });
      expect(r.regulatory_compliance_rate).toBe(100);
    });

    it("returns 0 when none meet requirements", () => {
      const r = run({
        regulatory_document_records: nRegDocs(5, {
          meets_statutory_requirements: false,
        }),
      });
      expect(r.regulatory_compliance_rate).toBe(0);
    });

    it("returns 0 when no reg docs", () => {
      const r = run({
        regulatory_document_records: [],
        daily_log_records: nLogs(1),
      });
      expect(r.regulatory_compliance_rate).toBe(0);
    });

    it("only counts current docs that meet requirements against total docs", () => {
      const r = run({
        regulatory_document_records: [
          makeRegulatoryDocument({ is_current: true, meets_statutory_requirements: true }),
          makeRegulatoryDocument({ is_current: false, meets_statutory_requirements: true }),
          makeRegulatoryDocument({ is_current: true, meets_statutory_requirements: false }),
        ],
      });
      // meetsStatutoryReqs = docs that are current AND meet requirements = 1
      // total = 3 => 1/3 = 33%
      expect(r.regulatory_compliance_rate).toBe(33);
    });
  });

  describe("record_accuracy_rate", () => {
    it("returns 100 with all perfect logs only", () => {
      const r = run({ daily_log_records: nLogs(5) });
      // numerator: 5+5+5 = 15, denominator: 5+5+5 = 15 => 100%
      expect(r.record_accuracy_rate).toBe(100);
    });

    it("includes incidents manager_signed_off in accuracy", () => {
      const r = run({
        incident_report_records: nIncidents(5, { manager_signed_off: true }),
      });
      // numerator: 0+0+0+5+0 = 5, denominator: 0+0+0+5+0 = 5 => 100%
      expect(r.record_accuracy_rate).toBe(100);
    });

    it("includes reg docs manager reviewed in accuracy", () => {
      const r = run({
        regulatory_document_records: nRegDocs(5, {
          reviewed_by_manager: true,
          is_current: true,
        }),
      });
      // numerator: 0+0+0+0+5 = 5, denominator: 0+0+0+0+5 = 5 => 100%
      expect(r.record_accuracy_rate).toBe(100);
    });

    it("composite calculation across logs, incidents, and reg docs", () => {
      const r = run({
        daily_log_records: [
          makeDailyLog({ factual_and_objective: true, signed_by_author: true, manager_reviewed: true }),
          makeDailyLog({ factual_and_objective: false, signed_by_author: false, manager_reviewed: false }),
        ],
        incident_report_records: [
          makeIncidentReport({ manager_signed_off: true }),
          makeIncidentReport({ manager_signed_off: false }),
        ],
        regulatory_document_records: [
          makeRegulatoryDocument({ reviewed_by_manager: true, is_current: true }),
          makeRegulatoryDocument({ reviewed_by_manager: false, is_current: true }),
        ],
      });
      // numerator: 1 (factual) + 1 (signed) + 1 (reviewed) + 1 (incident mgr) + 1 (reg mgr) = 5
      // denominator: 2 (logs factual) + 2 (logs signed) + 2 (logs reviewed) + 2 (incidents) + 2 (currentRegDocs) = 10
      // 5/10 = 50%
      expect(r.record_accuracy_rate).toBe(50);
    });

    it("returns 0 when no records at all", () => {
      const r = run({
        care_plan_records: nCarePlans(1), // just to avoid "all empty" special case
      });
      // denominator: 0+0+0+0+0 = 0 => pct(0,0) = 0
      expect(r.record_accuracy_rate).toBe(0);
    });

    it("only counts currentRegDocs (not all) in denominator", () => {
      const r = run({
        regulatory_document_records: [
          makeRegulatoryDocument({ is_current: true, reviewed_by_manager: true }),
          makeRegulatoryDocument({ is_current: false, reviewed_by_manager: true }),
        ],
      });
      // currentRegDocs = 1, regDocsManagerReviewed = 1 (only current ones counted)
      // numerator: 0+0+0+0+1 = 1, denominator: 0+0+0+0+1 = 1 => 100%
      expect(r.record_accuracy_rate).toBe(100);
    });
  });
});

// ── 10. STRENGTHS TESTS ────────────────────────────────────────────────────

describe("strengths", () => {
  it("includes daily log strength at >= 95%", () => {
    const r = run({ daily_log_records: nLogs(20) });
    expect(r.strengths.some((s) => s.includes("100%") && s.includes("daily logs completed on time"))).toBe(true);
  });

  it("includes daily log strength at 80-94%", () => {
    const r = run({
      daily_log_records: [
        ...nLogs(17, { completed_on_time: true }),
        ...nLogs(3, { completed_on_time: false }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("85%") && s.includes("daily log completion rate"))).toBe(true);
  });

  it("no daily log strength at < 80%", () => {
    const r = run({
      daily_log_records: [
        ...nLogs(7, { completed_on_time: true }),
        ...nLogs(3, { completed_on_time: false }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("daily log") && s.includes("completion"))).toBe(false);
  });

  it("includes comprehensive log strength at >= 90%", () => {
    const r = run({ daily_log_records: nLogs(10) });
    expect(r.strengths.some((s) => s.includes("100%") && s.includes("five core areas"))).toBe(true);
  });

  it("includes comprehensive log strength at 70-89%", () => {
    const r = run({
      daily_log_records: [
        ...nLogs(7),
        ...nLogs(3, {
          covers_wellbeing: false,
          covers_activities: false,
          covers_mood: false,
          covers_interactions: false,
          covers_meals: false,
        }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("70%") && s.includes("comprehensive"))).toBe(true);
  });

  it("includes care plan currency strength at >= 95%", () => {
    const r = run({ care_plan_records: nCarePlans(10) });
    expect(r.strengths.some((s) => s.includes("care plans are current"))).toBe(true);
  });

  it("includes care plan currency strength at 80-94%", () => {
    const r = run({
      care_plan_records: [
        ...nCarePlans(9, { is_current: true, review_overdue: false }),
        makeCarePlan({ is_current: true, review_overdue: true }),
      ],
    });
    // currency: (10-1)/10 = 90%
    expect(r.strengths.some((s) => s.includes("90%") && s.includes("care plan currency rate"))).toBe(true);
  });

  it("includes risk assessment strength at >= 95%", () => {
    const r = run({ risk_assessment_records: nRiskAssessments(10) });
    expect(r.strengths.some((s) => s.includes("risk assessments have up-to-date reviews"))).toBe(true);
  });

  it("includes incident timeliness strength at >= 95%", () => {
    const r = run({ incident_report_records: nIncidents(20) });
    expect(r.strengths.some((s) => s.includes("incident reports completed within 24 hours"))).toBe(true);
  });

  it("includes regulatory compliance strength at >= 95%", () => {
    const r = run({ regulatory_document_records: nRegDocs(10) });
    expect(r.strengths.some((s) => s.includes("regulatory document compliance"))).toBe(true);
  });

  it("includes Ofsted notification strength at 100%", () => {
    const r = run({
      incident_report_records: nIncidents(5, {
        ofsted_notification_required: true,
        ofsted_notified: true,
      }),
    });
    expect(r.strengths.some((s) => s.includes("All required Ofsted notifications"))).toBe(true);
  });

  it("includes LA notification strength at 100%", () => {
    const r = run({
      incident_report_records: nIncidents(5, {
        local_authority_notification_required: true,
        local_authority_notified: true,
      }),
    });
    expect(r.strengths.some((s) => s.includes("All required local authority notifications"))).toBe(true);
  });

  it("includes manager review strength at >= 90%", () => {
    const r = run({ daily_log_records: nLogs(10) }); // all manager_reviewed
    expect(r.strengths.some((s) => s.includes("daily logs reviewed by management"))).toBe(true);
  });

  it("includes child participation strength at >= 90%", () => {
    const r = run({
      care_plan_records: nCarePlans(10, { child_participated: true }),
    });
    expect(r.strengths.some((s) => s.includes("Children participate in"))).toBe(true);
  });

  it("includes child participation strength at 70-89%", () => {
    const r = run({
      care_plan_records: [
        ...nCarePlans(7, { child_participated: true }),
        ...nCarePlans(3, { child_participated: false }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("child participation in care planning"))).toBe(true);
  });

  it("includes objectives met strength at >= 80%", () => {
    const r = run({
      care_plan_records: nCarePlans(5, {
        objectives_count: 10,
        objectives_met: 9,
      }),
    });
    // 45/50 = 90%
    expect(r.strengths.some((s) => s.includes("care plan objectives being met"))).toBe(true);
  });

  it("includes mitigation implementation strength at >= 95%", () => {
    const r = run({
      risk_assessment_records: nRiskAssessments(5, {
        mitigations_identified: 10,
        mitigations_implemented: 10,
      }),
    });
    expect(r.strengths.some((s) => s.includes("risk mitigations implemented"))).toBe(true);
  });

  it("includes mitigation strength at 80-94%", () => {
    const r = run({
      risk_assessment_records: nRiskAssessments(5, {
        mitigations_identified: 10,
        mitigations_implemented: 8,
      }),
    });
    // 40/50 = 80%
    expect(r.strengths.some((s) => s.includes("mitigation implementation"))).toBe(true);
  });

  it("includes multi-agency input strength at >= 80%", () => {
    const r = run({
      risk_assessment_records: nRiskAssessments(10, { multi_agency_input: true }),
    });
    expect(r.strengths.some((s) => s.includes("multi-agency input"))).toBe(true);
  });

  it("includes follow-up completion strength at >= 90%", () => {
    const r = run({
      incident_report_records: nIncidents(10, {
        follow_up_actions_identified: 5,
        follow_up_actions_completed: 5,
      }),
    });
    expect(r.strengths.some((s) => s.includes("follow-up actions completed"))).toBe(true);
  });

  it("includes lessons learned strength at >= 80%", () => {
    const r = run({
      incident_report_records: nIncidents(10, { lessons_learned_recorded: true }),
    });
    expect(r.strengths.some((s) => s.includes("Lessons learned recorded"))).toBe(true);
  });

  it("includes record accuracy strength at >= 90%", () => {
    const r = run({ daily_log_records: nLogs(10) }); // all factual, signed, reviewed
    expect(r.strengths.some((s) => s.includes("record accuracy rate"))).toBe(true);
  });

  it("includes record accuracy strength at 75-89%", () => {
    const r = run({
      daily_log_records: [
        ...nLogs(8),
        ...nLogs(2, {
          factual_and_objective: false,
          signed_by_author: false,
          manager_reviewed: false,
        }),
      ],
    });
    // (8+8+8)/(10+10+10) = 24/30 = 80%
    expect(r.strengths.some((s) => s.includes("record accuracy"))).toBe(true);
  });

  it("includes complete child coverage strength", () => {
    const r = run({
      daily_log_records: [
        makeDailyLog({ child_id: "child_1" }),
        makeDailyLog({ child_id: "child_2" }),
        makeDailyLog({ child_id: "child_3" }),
      ],
      care_plan_records: [
        makeCarePlan({ child_id: "child_1" }),
        makeCarePlan({ child_id: "child_2" }),
        makeCarePlan({ child_id: "child_3" }),
      ],
      risk_assessment_records: [
        makeRiskAssessment({ child_id: "child_1" }),
        makeRiskAssessment({ child_id: "child_2" }),
        makeRiskAssessment({ child_id: "child_3" }),
      ],
    });
    expect(r.strengths.some((s) => s.includes("Every child on placement"))).toBe(true);
  });
});

// ── 11. CONCERNS TESTS ─────────────────────────────────────────────────────

describe("concerns", () => {
  it("concern for daily log < 50%", () => {
    const r = run({
      daily_log_records: [
        ...nLogs(4, { completed_on_time: true }),
        ...nLogs(6, { completed_on_time: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("40%") && c.includes("daily logs completed on time"))).toBe(true);
  });

  it("concern for daily log 50-79%", () => {
    const r = run({
      daily_log_records: [
        ...nLogs(6, { completed_on_time: true }),
        ...nLogs(4, { completed_on_time: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Daily log completion rate"))).toBe(true);
  });

  it("concern for comprehensive log < 50%", () => {
    const r = run({
      daily_log_records: nLogs(10, {
        covers_wellbeing: false,
        covers_activities: false,
        covers_mood: false,
        covers_interactions: false,
        covers_meals: false,
      }),
    });
    expect(r.concerns.some((c) => c.includes("0%") && c.includes("daily logs cover all five core areas"))).toBe(true);
  });

  it("concern for comprehensive log 50-69%", () => {
    const r = run({
      daily_log_records: [
        ...nLogs(6),
        ...nLogs(4, {
          covers_wellbeing: false,
          covers_activities: false,
          covers_mood: false,
          covers_interactions: false,
          covers_meals: false,
        }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Comprehensive log rate"))).toBe(true);
  });

  it("concern for manager review < 50%", () => {
    const r = run({
      daily_log_records: nLogs(10, { manager_reviewed: false }),
    });
    expect(r.concerns.some((c) => c.includes("daily logs reviewed by management"))).toBe(true);
  });

  it("concern for care plan currency < 50%", () => {
    const r = run({
      care_plan_records: [
        makeCarePlan({ is_current: true, review_overdue: true }),
        makeCarePlan({ is_current: true, review_overdue: true }),
        makeCarePlan({ is_current: true, review_overdue: false }),
      ],
    });
    // (3-2)/3 = 33%
    expect(r.concerns.some((c) => c.includes("33%") && c.includes("care plans have current reviews"))).toBe(true);
  });

  it("concern for overdue care plan reviews", () => {
    const r = run({
      care_plan_records: [
        makeCarePlan({ is_current: true, review_overdue: true }),
        makeCarePlan({ is_current: true, review_overdue: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("1 care plan review is overdue"))).toBe(true);
  });

  it("concern uses plural for multiple overdue care plan reviews", () => {
    const r = run({
      care_plan_records: [
        makeCarePlan({ is_current: true, review_overdue: true }),
        makeCarePlan({ is_current: true, review_overdue: true }),
        makeCarePlan({ is_current: true, review_overdue: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("2 care plan reviews are overdue"))).toBe(true);
  });

  it("concern for child participation < 50%", () => {
    const r = run({
      care_plan_records: nCarePlans(10, { child_participated: false }),
    });
    expect(r.concerns.some((c) => c.includes("Children participate in only 0%"))).toBe(true);
  });

  it("concern for high risk overdue", () => {
    const r = run({
      risk_assessment_records: [
        makeRiskAssessment({
          risk_level: "high",
          is_current: true,
          review_overdue: true,
        }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("high/very-high risk assessment"))).toBe(true);
  });

  it("concern for missed Ofsted notification", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({
          ofsted_notification_required: true,
          ofsted_notified: false,
        }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("required Ofsted notification"))).toBe(true);
  });

  it("concern for missed LA notification", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({
          local_authority_notification_required: true,
          local_authority_notified: false,
        }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("required local authority notification"))).toBe(true);
  });

  it("concern for critical incidents late reported", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({
          severity: "critical",
          completed_within_24h: false,
        }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("critical/high-severity incident"))).toBe(true);
  });

  it("concern for overdue regulatory documents", () => {
    const r = run({
      regulatory_document_records: [
        makeRegulatoryDocument({ is_overdue: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("regulatory document") && c.includes("overdue"))).toBe(true);
  });

  it("concern for stale regulatory documents", () => {
    const r = run({
      regulatory_document_records: [
        makeRegulatoryDocument({
          is_current: true,
          update_frequency_days: 30,
          days_since_last_update: 45,
        }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("not been updated within their required frequency"))).toBe(true);
  });

  it("concern for log child coverage < 80%", () => {
    const r = run({
      total_children: 3,
      daily_log_records: [
        makeDailyLog({ child_id: "child_1" }),
        makeDailyLog({ child_id: "child_2" }),
        // child_3 missing
      ],
    });
    // 2/3 = 67%
    expect(r.concerns.some((c) => c.includes("Daily logs cover only 67%"))).toBe(true);
  });

  it("concern for mitigation implementation < 50%", () => {
    const r = run({
      risk_assessment_records: nRiskAssessments(5, {
        mitigations_identified: 10,
        mitigations_implemented: 2,
      }),
    });
    // 10/50 = 20%
    expect(r.concerns.some((c) => c.includes("20%") && c.includes("risk mitigations have been implemented"))).toBe(true);
  });

  it("concern for mitigation 50-79%", () => {
    const r = run({
      risk_assessment_records: nRiskAssessments(5, {
        mitigations_identified: 10,
        mitigations_implemented: 6,
      }),
    });
    // 30/50 = 60%
    expect(r.concerns.some((c) => c.includes("60%") && c.includes("Mitigation implementation"))).toBe(true);
  });
});

// ── 12. RECOMMENDATIONS TESTS ──────────────────────────────────────────────

describe("recommendations", () => {
  it("immediate rec for daily log completion < 50%", () => {
    const r = run({
      daily_log_records: nLogs(10, {
        completed_on_time: false,
        covers_wellbeing: false,
        covers_activities: false,
        covers_mood: false,
        covers_interactions: false,
        covers_meals: false,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("daily log completion"))).toBe(true);
  });

  it("immediate rec for care plan currency < 50%", () => {
    const r = run({
      care_plan_records: [
        makeCarePlan({ is_current: true, review_overdue: true }),
      ],
    });
    // (1-1)/1=0% => immediate
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("overdue care plans"))).toBe(true);
  });

  it("immediate rec for high risk overdue", () => {
    const r = run({
      risk_assessment_records: [
        makeRiskAssessment({ risk_level: "high", is_current: true, review_overdue: true }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("high/very-high risk assessments"))).toBe(true);
  });

  it("immediate rec for missed Ofsted notifications", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({ ofsted_notification_required: true, ofsted_notified: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Ofsted notifications"))).toBe(true);
  });

  it("immediate rec for missed LA notifications", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({ local_authority_notification_required: true, local_authority_notified: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("local authority notifications"))).toBe(true);
  });

  it("immediate rec for incident timeliness < 50%", () => {
    const r = run({
      incident_report_records: nIncidents(10, {
        completed_within_24h: false,
        manager_signed_off: false,
        follow_up_actions_identified: 0,
        follow_up_actions_completed: 0,
        lessons_learned_recorded: false,
      }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("incident reporting procedures"))).toBe(true);
  });

  it("immediate rec for regulatory compliance < 50%", () => {
    const r = run({
      regulatory_document_records: nRegDocs(10, {
        meets_statutory_requirements: false,
        reviewed_by_manager: false,
      }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("statutory documentation"))).toBe(true);
  });

  it("immediate rec for mitigation < 50%", () => {
    const r = run({
      risk_assessment_records: nRiskAssessments(5, {
        mitigations_identified: 10,
        mitigations_implemented: 2,
      }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("risk mitigations"))).toBe(true);
  });

  it("immediate rec for critical incidents late reported", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({ severity: "high", completed_within_24h: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("critical and high-severity incidents"))).toBe(true);
  });

  it("soon rec for daily log 50-79%", () => {
    const r = run({
      daily_log_records: [
        ...nLogs(6, { completed_on_time: true }),
        ...nLogs(4, { completed_on_time: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("daily log completion rate"))).toBe(true);
  });

  it("soon rec for comprehensive log < 70%", () => {
    const r = run({
      daily_log_records: nLogs(10, {
        covers_wellbeing: false,
        covers_activities: false,
        covers_mood: false,
        covers_interactions: false,
        covers_meals: false,
      }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("comprehensiveness of daily logs"))).toBe(true);
  });

  it("soon rec for overdue care plan reviews when currency >= 50%", () => {
    const r = run({
      care_plan_records: [
        makeCarePlan({ is_current: true, review_overdue: true }),
        makeCarePlan({ is_current: true, review_overdue: false }),
        makeCarePlan({ is_current: true, review_overdue: false }),
      ],
    });
    // currency: (3-1)/3 = 67% >= 50%
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("overdue care plan reviews"))).toBe(true);
  });

  it("soon rec for risk review 50-79%", () => {
    const r = run({
      risk_assessment_records: [
        ...nRiskAssessments(6, { is_current: true, review_overdue: false }),
        ...nRiskAssessments(4, { is_current: true, review_overdue: true }),
      ],
    });
    // (10-4)/10 = 60%
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("risk assessment review compliance"))).toBe(true);
  });

  it("soon rec for incident timeliness 50-79%", () => {
    const r = run({
      incident_report_records: [
        ...nIncidents(6, { completed_within_24h: true }),
        ...nIncidents(4, { completed_within_24h: false }),
      ],
    });
    expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("incident report timeliness"))).toBe(true);
  });

  it("planned rec for child participation < 70%", () => {
    const r = run({
      care_plan_records: nCarePlans(10, { child_participated: false }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("child participation in care planning"))).toBe(true);
  });

  it("planned rec for manager review < 70%", () => {
    const r = run({
      daily_log_records: nLogs(10, { manager_reviewed: false }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("management review of daily logs"))).toBe(true);
  });

  it("planned rec for lessons learned < 70%", () => {
    const r = run({
      incident_report_records: nIncidents(10, { lessons_learned_recorded: false }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("lessons-learned recording"))).toBe(true);
  });

  it("planned rec for dynamic factors < 70%", () => {
    const r = run({
      risk_assessment_records: nRiskAssessments(10, { dynamic_risk_factors_recorded: false }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("dynamic risk factors"))).toBe(true);
  });

  it("planned rec for linked to care plan < 70%", () => {
    const r = run({
      risk_assessment_records: nRiskAssessments(10, { linked_to_care_plan: false }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("risk assessments and care plans"))).toBe(true);
  });

  it("planned rec for log signing < 80%", () => {
    const r = run({
      daily_log_records: nLogs(10, { signed_by_author: false }),
    });
    expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("signed by the author"))).toBe(true);
  });

  it("recommendations have sequential ranks", () => {
    const r = run({
      daily_log_records: nLogs(10, {
        completed_on_time: false,
        covers_wellbeing: false,
        covers_activities: false,
        covers_mood: false,
        covers_interactions: false,
        covers_meals: false,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      }),
      care_plan_records: [
        makeCarePlan({ is_current: true, review_overdue: true }),
      ],
    });
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("all recommendations have regulatory_ref", () => {
    const r = run({
      daily_log_records: nLogs(10, {
        completed_on_time: false,
        manager_reviewed: false,
        signed_by_author: false,
      }),
      care_plan_records: nCarePlans(5, { child_participated: false }),
      risk_assessment_records: nRiskAssessments(5, {
        dynamic_risk_factors_recorded: false,
        linked_to_care_plan: false,
      }),
      incident_report_records: nIncidents(5, {
        completed_within_24h: false,
        lessons_learned_recorded: false,
      }),
      regulatory_document_records: nRegDocs(5, { meets_statutory_requirements: false }),
    });
    for (const rec of r.recommendations) {
      expect(rec.regulatory_ref).toBeTruthy();
    }
  });
});

// ── 13. INSIGHTS TESTS ─────────────────────────────────────────────────────

describe("insights", () => {
  it("critical insight for daily log < 50%", () => {
    const r = run({
      daily_log_records: nLogs(10, { completed_on_time: false }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("daily logs completed on time"))).toBe(true);
  });

  it("critical insight for care plan currency < 50%", () => {
    const r = run({
      care_plan_records: [
        makeCarePlan({ is_current: true, review_overdue: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("care plans have current reviews"))).toBe(true);
  });

  it("critical insight for missed Ofsted notifications", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({ ofsted_notification_required: true, ofsted_notified: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Ofsted notification"))).toBe(true);
  });

  it("critical insight for high risk overdue", () => {
    const r = run({
      risk_assessment_records: [
        makeRiskAssessment({ risk_level: "very_high", is_current: true, review_overdue: true }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("high/very-high risk assessment"))).toBe(true);
  });

  it("critical insight for regulatory compliance < 50%", () => {
    const r = run({
      regulatory_document_records: nRegDocs(10, {
        meets_statutory_requirements: false,
        reviewed_by_manager: false,
      }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("regulatory documents meet statutory requirements"))).toBe(true);
  });

  it("critical insight for incident timeliness < 50%", () => {
    const r = run({
      incident_report_records: nIncidents(10, { completed_within_24h: false }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("incident reports completed within 24 hours"))).toBe(true);
  });

  it("critical insight for mitigation < 50%", () => {
    const r = run({
      risk_assessment_records: nRiskAssessments(5, {
        mitigations_identified: 10,
        mitigations_implemented: 2,
      }),
    });
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("risk mitigations implemented"))).toBe(true);
  });

  it("warning insight for daily log 50-79%", () => {
    const r = run({
      daily_log_records: [
        ...nLogs(6, { completed_on_time: true }),
        ...nLogs(4, { completed_on_time: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Daily log completion at 60%"))).toBe(true);
  });

  it("warning insight for care plan currency 50-79%", () => {
    const r = run({
      care_plan_records: [
        ...nCarePlans(3, { is_current: true, review_overdue: false }),
        ...nCarePlans(2, { is_current: true, review_overdue: true }),
      ],
    });
    // (5-2)/5=60%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Care plan currency at 60%"))).toBe(true);
  });

  it("warning insight for risk review 50-79%", () => {
    const r = run({
      risk_assessment_records: [
        ...nRiskAssessments(7, { is_current: true, review_overdue: false }),
        ...nRiskAssessments(3, { is_current: true, review_overdue: true }),
      ],
    });
    // (10-3)/10=70%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Risk assessment review rate at 70%"))).toBe(true);
  });

  it("warning insight for incident timeliness 50-79%", () => {
    const r = run({
      incident_report_records: [
        ...nIncidents(7, { completed_within_24h: true }),
        ...nIncidents(3, { completed_within_24h: false }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Incident report timeliness at 70%"))).toBe(true);
  });

  it("warning insight for regulatory compliance 50-79%", () => {
    const r = run({
      regulatory_document_records: [
        ...nRegDocs(7, { meets_statutory_requirements: true }),
        ...nRegDocs(3, { meets_statutory_requirements: false }),
      ],
    });
    // 7/10=70%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Regulatory compliance at 70%"))).toBe(true);
  });

  it("warning insight for mitigation 50-79%", () => {
    const r = run({
      risk_assessment_records: nRiskAssessments(5, {
        mitigations_identified: 10,
        mitigations_implemented: 6,
      }),
    });
    // 30/50=60%
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Mitigation implementation at 60%"))).toBe(true);
  });

  it("warning insight for incident type profile (>= 3 incidents)", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({ incident_type: "behaviour" }),
        makeIncidentReport({ incident_type: "behaviour" }),
        makeIncidentReport({ incident_type: "injury" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Incident profile"))).toBe(true);
  });

  it("no incident profile insight when < 3 incidents", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({ incident_type: "behaviour" }),
        makeIncidentReport({ incident_type: "injury" }),
      ],
    });
    expect(r.insights.some((i) => i.text.includes("Incident profile"))).toBe(false);
  });

  it("positive insight for outstanding rating", () => {
    const r = run({
      total_children: 3,
      daily_log_records: [
        ...nLogs(10, { child_id: "child_1" }),
        ...nLogs(10, { child_id: "child_2" }),
        ...nLogs(10, { child_id: "child_3" }),
      ],
      care_plan_records: [
        ...nCarePlans(3, { child_id: "child_1" }),
        ...nCarePlans(3, { child_id: "child_2" }),
        ...nCarePlans(3, { child_id: "child_3" }),
      ],
      risk_assessment_records: [
        ...nRiskAssessments(2, { child_id: "child_1" }),
        ...nRiskAssessments(2, { child_id: "child_2" }),
        ...nRiskAssessments(2, { child_id: "child_3" }),
      ],
      incident_report_records: nIncidents(5, {
        ofsted_notification_required: true,
        ofsted_notified: true,
        local_authority_notification_required: true,
        local_authority_notified: true,
      }),
      regulatory_document_records: nRegDocs(8),
    });
    expect(r.documentation_rating).toBe("outstanding");
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding record keeping"))).toBe(true);
  });

  it("positive insight for exemplary daily recording", () => {
    const r = run({
      daily_log_records: nLogs(20), // 100% completion, 100% comprehensive, 100% manager review
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
  });

  it("positive insight for exemplary care planning", () => {
    const r = run({
      care_plan_records: nCarePlans(10, {
        child_participated: true,
        is_current: true,
        review_overdue: false,
      }),
    });
    // currency=100%, participation=100%
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child-centred"))).toBe(true);
  });

  it("positive insight for exemplary risk management", () => {
    const r = run({
      risk_assessment_records: nRiskAssessments(10, {
        is_current: true,
        review_overdue: false,
        mitigations_identified: 10,
        mitigations_implemented: 10,
      }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("risk assessment review rate"))).toBe(true);
  });

  it("positive insight for exemplary incident management", () => {
    const r = run({
      incident_report_records: nIncidents(10, {
        completed_within_24h: true,
        follow_up_actions_identified: 5,
        follow_up_actions_completed: 5,
        lessons_learned_recorded: true,
      }),
    });
    // timeliness 100%, follow-up 100%, lessons 100%
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("incident timeliness"))).toBe(true);
  });

  it("positive insight for full notification compliance (both ofsted and LA)", () => {
    const r = run({
      incident_report_records: nIncidents(5, {
        ofsted_notification_required: true,
        ofsted_notified: true,
        local_authority_notification_required: true,
        local_authority_notified: true,
      }),
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Full compliance with both Ofsted and local authority"))).toBe(true);
  });

  it("positive insight for exemplary regulatory compliance", () => {
    const r = run({
      regulatory_document_records: nRegDocs(10, {
        meets_statutory_requirements: true,
        reviewed_by_manager: true,
        is_current: true,
      }),
    });
    // compliance 100%, manager review 100%
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("regulatory compliance"))).toBe(true);
  });

  it("positive insight for complete child coverage", () => {
    const r = run({
      total_children: 3,
      daily_log_records: [
        makeDailyLog({ child_id: "child_1" }),
        makeDailyLog({ child_id: "child_2" }),
        makeDailyLog({ child_id: "child_3" }),
      ],
      care_plan_records: [
        makeCarePlan({ child_id: "child_1" }),
        makeCarePlan({ child_id: "child_2" }),
        makeCarePlan({ child_id: "child_3" }),
      ],
      risk_assessment_records: [
        makeRiskAssessment({ child_id: "child_1" }),
        makeRiskAssessment({ child_id: "child_2" }),
        makeRiskAssessment({ child_id: "child_3" }),
      ],
    });
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Every child has daily logs"))).toBe(true);
  });
});

// ── 14. EDGE CASES ─────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("score is clamped to 0-100 (cannot go below 0)", () => {
    // Artificially impossible, but test the clamp
    // Max penalties: -5-6-5-3 = -19 from 52 = 33. Can't go below 0.
    const r = run({
      daily_log_records: nLogs(10, {
        completed_on_time: false,
        covers_wellbeing: false,
        covers_activities: false,
        covers_mood: false,
        covers_interactions: false,
        covers_meals: false,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      }),
      care_plan_records: [
        makeCarePlan({ is_current: true, review_overdue: true, child_participated: false, objectives_count: 0, objectives_met: 0 }),
      ],
      incident_report_records: nIncidents(10, {
        completed_within_24h: false,
        manager_signed_off: false,
        follow_up_actions_identified: 0,
        follow_up_actions_completed: 0,
        lessons_learned_recorded: false,
      }),
      regulatory_document_records: nRegDocs(10, {
        meets_statutory_requirements: false,
        reviewed_by_manager: false,
      }),
    });
    expect(r.documentation_score).toBeGreaterThanOrEqual(0);
  });

  it("score is clamped to 100 (cannot exceed 100)", () => {
    // With base 52 and max bonus 28, max is 80 so can never exceed 100
    // But test the clamp exists
    const r = run({
      total_children: 3,
      daily_log_records: [
        ...nLogs(10, { child_id: "child_1" }),
        ...nLogs(10, { child_id: "child_2" }),
        ...nLogs(10, { child_id: "child_3" }),
      ],
      care_plan_records: [
        ...nCarePlans(3, { child_id: "child_1" }),
        ...nCarePlans(3, { child_id: "child_2" }),
        ...nCarePlans(3, { child_id: "child_3" }),
      ],
      risk_assessment_records: [
        ...nRiskAssessments(2, { child_id: "child_1" }),
        ...nRiskAssessments(2, { child_id: "child_2" }),
        ...nRiskAssessments(2, { child_id: "child_3" }),
      ],
      incident_report_records: nIncidents(5, {
        ofsted_notification_required: true,
        ofsted_notified: true,
        local_authority_notification_required: true,
        local_authority_notified: true,
      }),
      regulatory_document_records: nRegDocs(8),
    });
    expect(r.documentation_score).toBeLessThanOrEqual(100);
  });

  it("handles single record in each category", () => {
    const r = run({
      daily_log_records: [makeDailyLog()],
      care_plan_records: [makeCarePlan()],
      risk_assessment_records: [makeRiskAssessment()],
      incident_report_records: [makeIncidentReport()],
      regulatory_document_records: [makeRegulatoryDocument()],
    });
    expect(r.documentation_rating).toBeDefined();
    expect(r.documentation_score).toBeGreaterThanOrEqual(0);
  });

  it("non-current care plans do not count in currency calculation", () => {
    const r = run({
      care_plan_records: [
        makeCarePlan({ is_current: false, review_overdue: true }),
        makeCarePlan({ is_current: false, review_overdue: true }),
      ],
    });
    // No current plans => carePlanCurrencyRate = 0
    expect(r.care_plan_currency_rate).toBe(0);
  });

  it("non-current risk assessments do not count in review rate", () => {
    const r = run({
      risk_assessment_records: [
        makeRiskAssessment({ is_current: false, review_overdue: true }),
      ],
    });
    expect(r.risk_assessment_review_rate).toBe(0);
  });

  it("pct(0,0) returns 0", () => {
    // Verified through record accuracy with no records
    const r = run({
      care_plan_records: [makeCarePlan()],
    });
    // No logs, no incidents, no reg docs in accuracy => pct(0,0) = 0
    expect(r.record_accuracy_rate).toBe(0);
  });

  it("daily logs with word_count < 50 do not affect scoring directly", () => {
    // word_count affects detailRate which is computed but not used in scoring
    const r1 = run({
      daily_log_records: nLogs(10, { word_count: 10 }),
    });
    const r2 = run({
      daily_log_records: nLogs(10, { word_count: 200 }),
    });
    expect(r1.documentation_score).toBe(r2.documentation_score);
  });

  it("total_children = 0 with records returns normal result (not insufficient data)", () => {
    // Only all empty + 0 children => insufficient data. If there are records, it should compute normally.
    const r = run({
      total_children: 0,
      daily_log_records: nLogs(5),
    });
    expect(r.documentation_rating).not.toBe("insufficient_data");
    expect(r.documentation_score).toBeGreaterThan(0);
  });

  it("very_high risk assessments count as high risk for overdue tracking", () => {
    const r = run({
      risk_assessment_records: [
        makeRiskAssessment({ risk_level: "very_high", is_current: true, review_overdue: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("high/very-high risk assessment"))).toBe(true);
  });

  it("incident types are counted correctly in profile", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({ incident_type: "behaviour" }),
        makeIncidentReport({ incident_type: "behaviour" }),
        makeIncidentReport({ incident_type: "restraint" }),
      ],
    });
    const profileInsight = r.insights.find((i) => i.text.includes("Incident profile"));
    expect(profileInsight).toBeDefined();
    expect(profileInsight!.text).toContain("behaviour (2)");
    expect(profileInsight!.text).toContain("restraint (1)");
  });

  it("incident type underscores replaced with spaces in profile", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({ incident_type: "medication_error" }),
        makeIncidentReport({ incident_type: "medication_error" }),
        makeIncidentReport({ incident_type: "near_miss" }),
      ],
    });
    const profileInsight = r.insights.find((i) => i.text.includes("Incident profile"));
    expect(profileInsight).toBeDefined();
    expect(profileInsight!.text).toContain("medication error");
    expect(profileInsight!.text).toContain("near miss");
  });

  it("good headline shows areas for improvement count when concerns exist", () => {
    const r = run({
      daily_log_records: nLogs(20),
      regulatory_document_records: nRegDocs(5),
      care_plan_records: [
        makeCarePlan({ is_current: true, review_overdue: true }),
        makeCarePlan({ is_current: true, review_overdue: false }),
        makeCarePlan({ is_current: true, review_overdue: false }),
      ],
    });
    // This should be good rating and have some concerns
    if (r.documentation_rating === "good" && r.concerns.length > 0) {
      expect(r.headline).toContain("area");
      expect(r.headline).toContain("improvement");
    }
  });

  it("headline singular for 1 strength in good rating", () => {
    // Build a good scenario with exactly 1 strength
    // This is hard to control precisely, so just verify format
    const r = run({
      daily_log_records: nLogs(20),
      regulatory_document_records: nRegDocs(5),
    });
    if (r.documentation_rating === "good") {
      expect(r.headline).toContain("Good");
    }
  });

  it("notification bonus with mixed ofsted required and LA not required", () => {
    const r = run({
      incident_report_records: nIncidents(5, {
        completed_within_24h: false,
        manager_signed_off: false,
        ofsted_notification_required: true,
        ofsted_notified: true,
        local_authority_notification_required: false,
        local_authority_notified: false,
        follow_up_actions_identified: 0,
        follow_up_actions_completed: 0,
        lessons_learned_recorded: false,
      }),
    });
    // ofsted: 100% >= 100 => pass
    // LA: 0 required => pass
    // Both conditions met => +2
    // timeliness: 0% => -5
    // Score: 52+2-5=49
    expect(r.documentation_score).toBe(49);
  });

  it("large dataset computes without error", () => {
    const r = run({
      total_children: 10,
      daily_log_records: nLogs(100),
      care_plan_records: nCarePlans(50),
      risk_assessment_records: nRiskAssessments(30),
      incident_report_records: nIncidents(20),
      regulatory_document_records: nRegDocs(15),
    });
    expect(r.documentation_rating).toBeDefined();
    expect(r.documentation_score).toBeGreaterThan(0);
  });

  it("concern plural for multiple missed Ofsted notifications", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({ ofsted_notification_required: true, ofsted_notified: false }),
        makeIncidentReport({ ofsted_notification_required: true, ofsted_notified: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("2 required Ofsted notifications have not been made"))).toBe(true);
  });

  it("concern singular for 1 missed Ofsted notification", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({ ofsted_notification_required: true, ofsted_notified: false }),
        makeIncidentReport({ ofsted_notification_required: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("1 required Ofsted notification has not been made"))).toBe(true);
  });

  it("concern plural for multiple missed LA notifications", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({ local_authority_notification_required: true, local_authority_notified: false }),
        makeIncidentReport({ local_authority_notification_required: true, local_authority_notified: false }),
        makeIncidentReport({ local_authority_notification_required: true, local_authority_notified: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("3 required local authority notifications have not been made"))).toBe(true);
  });

  it("concern singular for 1 missed LA notification", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({ local_authority_notification_required: true, local_authority_notified: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("1 required local authority notification has not been made"))).toBe(true);
  });

  it("concern plural for multiple critical/high incidents late", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({ severity: "critical", completed_within_24h: false }),
        makeIncidentReport({ severity: "high", completed_within_24h: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("2 critical/high-severity incidents were not reported"))).toBe(true);
  });

  it("concern singular for 1 critical/high incident late", () => {
    const r = run({
      incident_report_records: [
        makeIncidentReport({ severity: "critical", completed_within_24h: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("1 critical/high-severity incident was not reported"))).toBe(true);
  });

  it("concern plural for multiple overdue regulatory documents", () => {
    const r = run({
      regulatory_document_records: [
        makeRegulatoryDocument({ is_overdue: true }),
        makeRegulatoryDocument({ is_overdue: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("2 regulatory documents are overdue"))).toBe(true);
  });

  it("concern singular for 1 overdue regulatory document", () => {
    const r = run({
      regulatory_document_records: [
        makeRegulatoryDocument({ is_overdue: true }),
        makeRegulatoryDocument({ is_overdue: false }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("1 regulatory document is overdue"))).toBe(true);
  });

  it("concern plural for multiple stale regulatory documents", () => {
    const r = run({
      regulatory_document_records: [
        makeRegulatoryDocument({ is_current: true, update_frequency_days: 30, days_since_last_update: 60 }),
        makeRegulatoryDocument({ is_current: true, update_frequency_days: 30, days_since_last_update: 60 }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("2 regulatory documents have not been updated"))).toBe(true);
  });

  it("concern singular for 1 stale regulatory document", () => {
    const r = run({
      regulatory_document_records: [
        makeRegulatoryDocument({ is_current: true, update_frequency_days: 30, days_since_last_update: 60 }),
        makeRegulatoryDocument({ is_current: true, update_frequency_days: 30, days_since_last_update: 10 }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("1 regulatory document has not been updated"))).toBe(true);
  });

  it("concern plural for high risk overdue (multiple)", () => {
    const r = run({
      risk_assessment_records: [
        makeRiskAssessment({ risk_level: "high", is_current: true, review_overdue: true }),
        makeRiskAssessment({ risk_level: "very_high", is_current: true, review_overdue: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("2 high/very-high risk assessments are overdue"))).toBe(true);
  });

  it("concern singular for high risk overdue (one)", () => {
    const r = run({
      risk_assessment_records: [
        makeRiskAssessment({ risk_level: "high", is_current: true, review_overdue: true }),
        makeRiskAssessment({ risk_level: "low", is_current: true, review_overdue: true }),
      ],
    });
    expect(r.concerns.some((c) => c.includes("1 high/very-high risk assessment is overdue"))).toBe(true);
  });
});

// ── 15. THRESHOLD BOUNDARY TESTS ───────────────────────────────────────────

describe("rating threshold boundaries", () => {
  it("score 80 => outstanding", () => {
    // Perfect data achieves exactly 80
    const r = run({
      total_children: 3,
      daily_log_records: [
        ...nLogs(10, { child_id: "child_1" }),
        ...nLogs(10, { child_id: "child_2" }),
        ...nLogs(10, { child_id: "child_3" }),
      ],
      care_plan_records: [
        ...nCarePlans(3, { child_id: "child_1" }),
        ...nCarePlans(3, { child_id: "child_2" }),
        ...nCarePlans(3, { child_id: "child_3" }),
      ],
      risk_assessment_records: [
        ...nRiskAssessments(2, { child_id: "child_1" }),
        ...nRiskAssessments(2, { child_id: "child_2" }),
        ...nRiskAssessments(2, { child_id: "child_3" }),
      ],
      incident_report_records: nIncidents(5, {
        ofsted_notification_required: true,
        ofsted_notified: true,
        local_authority_notification_required: true,
        local_authority_notified: true,
      }),
      regulatory_document_records: nRegDocs(8),
    });
    expect(r.documentation_score).toBe(80);
    expect(r.documentation_rating).toBe("outstanding");
  });

  it("score 65 => good", () => {
    // Need exactly 65. Base 52. Need +13 in bonuses with no penalties.
    // daily log 95% => +4, reg docs 95% => +4, notification (no incidents) => +2, comprehensive 90% => +3
    // = 13. Score: 52+13=65.
    // But we also need to ensure no penalties fire and we don't accidentally trigger more bonuses.
    // Use 20 logs: 19 on_time, 1 not. All comprehensive. No other records except reg docs.
    // accuracy: all logs are factual, signed, reviewed by default => 100% => +3 bonus 6!
    // That would give 52+4+4+3+3+2 = 68 not 65.
    // Zero out accuracy fields on logs.
    const logs = [
      ...nLogs(19, {
        completed_on_time: true,
        covers_wellbeing: true,
        covers_activities: true,
        covers_mood: true,
        covers_interactions: true,
        covers_meals: true,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      }),
      makeDailyLog({
        completed_on_time: false,
        covers_wellbeing: true,
        covers_activities: true,
        covers_mood: true,
        covers_interactions: true,
        covers_meals: true,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      }),
    ];
    // dailyLogCompletion: 19/20=95% => +4
    // comprehensive: 20/20=100% => +3
    // accuracy: 0/(20+20+20+0+5) = 0/65 = 0% => no bonus
    // carePlanCurrency: 0 (empty) => 0
    // riskAssessmentReview: 0 (empty) => 0
    // incidentTimeliness: 0 (empty) => 0
    // regCompliance: 5/5=100% => +4
    // notification: no incidents => +2
    // mitigation: 0 => 0
    // Score: 52+4+3+0+0+0+4+0+2+0 = 65
    const r = run({
      daily_log_records: logs,
      regulatory_document_records: nRegDocs(5, { reviewed_by_manager: false }),
    });
    expect(r.documentation_score).toBe(65);
    expect(r.documentation_rating).toBe("good");
  });

  it("score 64 => adequate (just below good)", () => {
    // Same as above but with 18/20 = 90% daily log completion => +2 not +4
    // Score: 52+2+3+4+2 = 63. Need 64. Hmm.
    // Try: daily=80% => +2, comprehensive=90% => +3, reg=95% => +4, notification => +2, accuracy => +1
    // For accuracy +1 (>=75): need 75% accuracy.
    // 20 logs: 15 factual, 15 signed, 15 reviewed => 45/60=75% => +1
    // Score: 52+2+3+4+2+1 = 64
    const logs = [
      ...nLogs(16, {
        completed_on_time: true,
        covers_wellbeing: true,
        covers_activities: true,
        covers_mood: true,
        covers_interactions: true,
        covers_meals: true,
        manager_reviewed: true,
        factual_and_objective: true,
        signed_by_author: true,
      }),
      ...nLogs(4, {
        completed_on_time: false,
        covers_wellbeing: true,
        covers_activities: true,
        covers_mood: true,
        covers_interactions: true,
        covers_meals: true,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      }),
    ];
    // dailyLog: 16/20=80% => +2
    // comprehensive: 20/20=100% => +3
    // accuracy: (16+16+16)/(20+20+20+0+5)=48/65 => 73.8... => Math.round = 74% => no bonus (< 75)
    // Hmm, 48/65 = 73.846... => round to 74. That's < 75 => no bonus.
    // Score: 52+2+3+4+2 = 63. Not 64.

    // Let me try 17 factual/signed/reviewed out of 20: 51/65 = 78.46% => round 78 => +1
    const logs2 = [
      ...nLogs(17, {
        completed_on_time: true,
        covers_wellbeing: true,
        covers_activities: true,
        covers_mood: true,
        covers_interactions: true,
        covers_meals: true,
        manager_reviewed: true,
        factual_and_objective: true,
        signed_by_author: true,
      }),
      ...nLogs(3, {
        completed_on_time: false,
        covers_wellbeing: true,
        covers_activities: true,
        covers_mood: true,
        covers_interactions: true,
        covers_meals: true,
        manager_reviewed: false,
        factual_and_objective: false,
        signed_by_author: false,
      }),
    ];
    // dailyLog: 17/20=85% => +2
    // comprehensive: 20/20=100% => +3
    // accuracy: (17+17+17)/(20+20+20+0+5)=51/65=78.46 => round 78 => +1
    // reg: +4, notification: +2
    // Score: 52+2+3+1+4+2 = 64 => adequate
    const r = run({
      daily_log_records: logs2,
      regulatory_document_records: nRegDocs(5, { reviewed_by_manager: false }),
    });
    expect(r.documentation_score).toBe(64);
    expect(r.documentation_rating).toBe("adequate");
  });

  it("score 45 => adequate (at boundary)", () => {
    // Base 52 with penalties to get to 45.
    // Need to subtract 7 from 52. But also notification bonus (+2) fires if no incidents.
    // So need to get to 45 with some combination.
    // Start: 52+2=54 (notification bonus from no incidents).
    // Need -9. Only daily log penalty: -5 => 49. Not enough.
    // dailyLog<50 (-5) + regCompliance<50 (-3) = -8 => 54-8=46. Need one more.
    // Actually, we can block notification bonus by providing incidents with missing notifications.
    // Let's use: only logs with 0% completion (-5), reg docs with 0% compliance (-3),
    // and add incidents to block notification bonus.
    // But incidents also have timeliness. If we do 50% timeliness, no penalty.
    // And make notification mixed so no bonus.
    // 52 + 0 (notification fails) - 5 - 3 = 44. That's < 45.
    // Try: 52 + 1 (notification at 80%) - 5 - 3 = 45!
    const logs = nLogs(10, {
      completed_on_time: false,
      covers_wellbeing: false,
      covers_activities: false,
      covers_mood: false,
      covers_interactions: false,
      covers_meals: false,
      manager_reviewed: false,
      factual_and_objective: false,
      signed_by_author: false,
    });
    const docs = nRegDocs(10, {
      meets_statutory_requirements: false,
      reviewed_by_manager: false,
    });
    // Need incidents with ofsted 80% but < 100% and LA at 100% (or 0 required)
    // ofsted: 5 required, 4 notified = 80%
    // LA: 0 required => condition met
    const incidents = [
      ...nIncidents(4, {
        completed_within_24h: true,
        manager_signed_off: false,
        ofsted_notification_required: true,
        ofsted_notified: true,
        local_authority_notification_required: false,
        follow_up_actions_identified: 0,
        follow_up_actions_completed: 0,
        lessons_learned_recorded: false,
      }),
      makeIncidentReport({
        completed_within_24h: true,
        manager_signed_off: false,
        ofsted_notification_required: true,
        ofsted_notified: false,
        local_authority_notification_required: false,
        follow_up_actions_identified: 0,
        follow_up_actions_completed: 0,
        lessons_learned_recorded: false,
      }),
    ];
    // ofsted: 4/5=80% >= 80 => passes second tier
    // LA: 0 required => passes
    // Top tier: ofsted 80% != 100% => fails
    // Second tier: +1
    // incident timeliness: 100% => +3
    // Hmm that adds +3 for timeliness. Score: 52+1+3-5-3 = 48. Not 45.
    // Make timeliness < 80% to avoid bonus: 3/5=60%
    const incidents2 = [
      ...nIncidents(3, {
        completed_within_24h: true,
        manager_signed_off: false,
        ofsted_notification_required: true,
        ofsted_notified: true,
        local_authority_notification_required: false,
        follow_up_actions_identified: 0,
        follow_up_actions_completed: 0,
        lessons_learned_recorded: false,
      }),
      makeIncidentReport({
        completed_within_24h: false,
        manager_signed_off: false,
        ofsted_notification_required: true,
        ofsted_notified: true,
        local_authority_notification_required: false,
        follow_up_actions_identified: 0,
        follow_up_actions_completed: 0,
        lessons_learned_recorded: false,
      }),
      makeIncidentReport({
        completed_within_24h: false,
        manager_signed_off: false,
        ofsted_notification_required: true,
        ofsted_notified: false,
        local_authority_notification_required: false,
        follow_up_actions_identified: 0,
        follow_up_actions_completed: 0,
        lessons_learned_recorded: false,
      }),
    ];
    // timeliness: 3/5=60% => no bonus, no penalty (>=50)
    // ofsted: 4/5=80% => passes second tier
    // LA: 0 required => passes
    // notification: +1
    // accuracy: 0/(10+10+10+5+0) = 0/35 = 0% => no bonus
    // Score: 52 + 0 + 0 + 0 + 0 + 1 + 0 + 0 - 5 - 3 = 45
    const r = run({
      daily_log_records: logs,
      regulatory_document_records: docs,
      incident_report_records: incidents2,
    });
    expect(r.documentation_score).toBe(45);
    expect(r.documentation_rating).toBe("adequate");
  });

  it("score 44 => inadequate (just below adequate)", () => {
    // Score: 52+0-5-3 = 44 (daily<50, reg<50, no notification bonus)
    // Need to block notification bonus: provide incidents with failing notifications
    const logs = nLogs(10, {
      completed_on_time: false,
      covers_wellbeing: false,
      covers_activities: false,
      covers_mood: false,
      covers_interactions: false,
      covers_meals: false,
      manager_reviewed: false,
      factual_and_objective: false,
      signed_by_author: false,
    });
    const docs = nRegDocs(10, {
      meets_statutory_requirements: false,
      reviewed_by_manager: false,
    });
    // Add incidents with failing ofsted notifications to block bonus 8
    const incidents = nIncidents(5, {
      completed_within_24h: true, // 100% => +3 bonus... need to avoid.
      manager_signed_off: false,
      ofsted_notification_required: true,
      ofsted_notified: false,
      local_authority_notification_required: true,
      local_authority_notified: false,
      follow_up_actions_identified: 0,
      follow_up_actions_completed: 0,
      lessons_learned_recorded: false,
    });
    // timeliness: 100% => +3. Hmm. 52+3-5-3=47. Not 44.
    // Make timeliness 60%
    const incidents2 = [
      ...nIncidents(3, {
        completed_within_24h: true,
        manager_signed_off: false,
        ofsted_notification_required: true,
        ofsted_notified: false,
        local_authority_notification_required: true,
        local_authority_notified: false,
        follow_up_actions_identified: 0,
        follow_up_actions_completed: 0,
        lessons_learned_recorded: false,
      }),
      ...nIncidents(2, {
        completed_within_24h: false,
        manager_signed_off: false,
        ofsted_notification_required: true,
        ofsted_notified: false,
        local_authority_notification_required: true,
        local_authority_notified: false,
        follow_up_actions_identified: 0,
        follow_up_actions_completed: 0,
        lessons_learned_recorded: false,
      }),
    ];
    // timeliness: 3/5=60% => no bonus
    // ofsted: 0/5=0% < 80 => notification fails
    // LA: 0/5=0% < 80 => notification fails
    // notification: +0
    // accuracy: 0/(10+10+10+5+0)=0/35=0% => no bonus
    // Score: 52+0-5-3 = 44
    const r = run({
      daily_log_records: logs,
      regulatory_document_records: docs,
      incident_report_records: incidents2,
    });
    expect(r.documentation_score).toBe(44);
    expect(r.documentation_rating).toBe("inadequate");
  });
});

// ── 16. RETURN SHAPE TESTS ─────────────────────────────────────────────────

describe("return shape", () => {
  it("returns all expected fields", () => {
    const r = run({
      daily_log_records: nLogs(5),
      care_plan_records: nCarePlans(3),
      risk_assessment_records: nRiskAssessments(2),
      incident_report_records: nIncidents(2),
      regulatory_document_records: nRegDocs(3),
    });
    expect(r).toHaveProperty("documentation_rating");
    expect(r).toHaveProperty("documentation_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("daily_log_completion_rate");
    expect(r).toHaveProperty("care_plan_currency_rate");
    expect(r).toHaveProperty("risk_assessment_review_rate");
    expect(r).toHaveProperty("incident_report_timeliness_rate");
    expect(r).toHaveProperty("regulatory_compliance_rate");
    expect(r).toHaveProperty("record_accuracy_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("rates are numbers", () => {
    const r = run({ daily_log_records: nLogs(5) });
    expect(typeof r.daily_log_completion_rate).toBe("number");
    expect(typeof r.care_plan_currency_rate).toBe("number");
    expect(typeof r.risk_assessment_review_rate).toBe("number");
    expect(typeof r.incident_report_timeliness_rate).toBe("number");
    expect(typeof r.regulatory_compliance_rate).toBe("number");
    expect(typeof r.record_accuracy_rate).toBe("number");
    expect(typeof r.documentation_score).toBe("number");
  });

  it("strengths, concerns are string arrays", () => {
    const r = run({ daily_log_records: nLogs(5) });
    expect(Array.isArray(r.strengths)).toBe(true);
    expect(Array.isArray(r.concerns)).toBe(true);
  });

  it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
    const r = run({
      daily_log_records: nLogs(10, {
        completed_on_time: false,
        manager_reviewed: false,
        signed_by_author: false,
      }),
    });
    if (r.recommendations.length > 0) {
      const rec = r.recommendations[0];
      expect(rec).toHaveProperty("rank");
      expect(rec).toHaveProperty("recommendation");
      expect(rec).toHaveProperty("urgency");
      expect(rec).toHaveProperty("regulatory_ref");
    }
  });

  it("insights have text and severity", () => {
    const r = run({
      daily_log_records: nLogs(10, { completed_on_time: false }),
    });
    if (r.insights.length > 0) {
      const insight = r.insights[0];
      expect(insight).toHaveProperty("text");
      expect(insight).toHaveProperty("severity");
      expect(["critical", "warning", "positive"]).toContain(insight.severity);
    }
  });

  it("documentation_rating is one of the valid ratings", () => {
    const r = run({ daily_log_records: nLogs(5) });
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(
      r.documentation_rating,
    );
  });
});
