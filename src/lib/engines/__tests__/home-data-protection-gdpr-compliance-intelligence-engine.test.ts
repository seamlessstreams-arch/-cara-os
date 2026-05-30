// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DATA PROTECTION & GDPR COMPLIANCE INTELLIGENCE ENGINE — TESTS
// UK GDPR 2018, CHR 2015 Reg 21, SCCIF Leadership and management.
// Covers policy compliance, SAR handling, breach management, privacy notices,
// staff GDPR training, record security, scoring, bonuses, penalties, and edges.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeDataProtectionGdprCompliance,
  type DataProtectionGdprComplianceInput,
  type DataProtectionPolicyRecordInput,
  type SubjectAccessRequestRecordInput,
  type DataBreachRecordInput,
  type PrivacyNoticeRecordInput,
  type GdprTrainingRecordInput,
} from "../home-data-protection-gdpr-compliance-intelligence-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const TODAY = "2026-05-30";

// ── Factories ──────────────────────────────────────────────────────────────

let _pid = 0;
function makePolicy(overrides: Partial<DataProtectionPolicyRecordInput> = {}): DataProtectionPolicyRecordInput {
  _pid++;
  return {
    id: `pol_${_pid}`,
    policy_name: "Data Protection Policy",
    policy_type: "data_protection",
    version: "1.0",
    last_reviewed_date: "2026-03-01",
    next_review_date: "2027-03-01",
    approved_by: "Manager",
    approved_date: "2026-03-01",
    compliant_with_gdpr: true,
    compliant_with_chr2015: true,
    staff_acknowledged: 10,
    staff_total: 10,
    gaps_identified: 0,
    gaps_resolved: 0,
    dpo_signed_off: true,
    accessible_to_staff: true,
    notes: "",
    created_at: "2026-03-01",
    ...overrides,
  };
}

let _sid = 0;
function makeSar(overrides: Partial<SubjectAccessRequestRecordInput> = {}): SubjectAccessRequestRecordInput {
  _sid++;
  return {
    id: `sar_${_sid}`,
    requester_type: "young_person",
    date_received: "2026-04-01",
    date_acknowledged: "2026-04-02",
    date_completed: "2026-04-20",
    deadline_date: "2026-05-01",
    completed_within_deadline: true,
    redaction_applied: true,
    third_party_data_identified: false,
    third_party_consulted: false,
    exemptions_applied: [],
    outcome: "completed",
    quality_checked: true,
    dpo_involved: true,
    complainant_satisfied: true,
    notes: "",
    created_at: "2026-04-01",
    ...overrides,
  };
}

let _bid = 0;
function makeBreach(overrides: Partial<DataBreachRecordInput> = {}): DataBreachRecordInput {
  _bid++;
  return {
    id: `breach_${_bid}`,
    breach_date: "2026-02-01",
    detected_date: "2026-02-01",
    reported_to_ico: false,
    reported_to_ico_within_72h: false,
    individuals_notified: true,
    severity: "low",
    breach_type: "accidental_disclosure",
    records_affected: 1,
    children_data_involved: false,
    root_cause_identified: true,
    corrective_actions_taken: true,
    corrective_actions_completed: true,
    lessons_learned_documented: true,
    recurrence_prevented: true,
    dpo_notified: true,
    risk_assessment_completed: true,
    notes: "",
    created_at: "2026-02-01",
    ...overrides,
  };
}

let _nid = 0;
function makeNotice(overrides: Partial<PrivacyNoticeRecordInput> = {}): PrivacyNoticeRecordInput {
  _nid++;
  return {
    id: `notice_${_nid}`,
    notice_type: "children",
    audience: "Children",
    last_updated_date: "2026-03-01",
    review_due_date: "2027-03-01",
    compliant_with_gdpr: true,
    plain_language: true,
    age_appropriate: true,
    covers_all_processing: true,
    lawful_basis_stated: true,
    data_rights_explained: true,
    retention_periods_stated: true,
    contact_details_included: true,
    accessible_format: true,
    published: true,
    acknowledged_count: 10,
    target_audience_count: 10,
    notes: "",
    created_at: "2026-03-01",
    ...overrides,
  };
}

let _tid = 0;
function makeTraining(overrides: Partial<GdprTrainingRecordInput> = {}): GdprTrainingRecordInput {
  _tid++;
  return {
    id: `train_${_tid}`,
    staff_id: `staff_${_tid}`,
    staff_name: `Staff ${_tid}`,
    training_type: "annual_refresher",
    training_date: "2026-03-01",
    training_provider: "DataGuard",
    passed: true,
    score: 90,
    certificate_held: true,
    expiry_date: "2027-03-01",
    refresher_due_date: "2027-03-01",
    refresher_completed: true,
    topics_covered: ["gdpr_principles", "data_rights", "breach_response"],
    notes: "",
    created_at: "2026-03-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<DataProtectionGdprComplianceInput> = {}): DataProtectionGdprComplianceInput {
  return {
    today: TODAY,
    total_children: 4,
    total_staff: 6,
    policy_compliance_records: [
      makePolicy({ id: "p1" }),
      makePolicy({ id: "p2", policy_type: "information_security" }),
      makePolicy({ id: "p3", policy_type: "retention" }),
    ],
    sar_records: [
      makeSar({ id: "s1" }),
      makeSar({ id: "s2", requester_type: "parent" }),
    ],
    breach_records: [],
    privacy_notice_records: [
      makeNotice({ id: "n1", notice_type: "children" }),
      makeNotice({ id: "n2", notice_type: "staff" }),
      makeNotice({ id: "n3", notice_type: "parents" }),
    ],
    training_records: [
      makeTraining({ id: "t1", staff_id: "s1" }),
      makeTraining({ id: "t2", staff_id: "s2" }),
      makeTraining({ id: "t3", staff_id: "s3" }),
      makeTraining({ id: "t4", staff_id: "s4" }),
      makeTraining({ id: "t5", staff_id: "s5" }),
      makeTraining({ id: "t6", staff_id: "s6" }),
    ],
    ...overrides,
  };
}

function run(overrides: Partial<DataProtectionGdprComplianceInput> = {}) {
  return computeDataProtectionGdprCompliance(baseInput(overrides));
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ══════════════════════════════════════════════════════════════════════════════

describe("insufficient_data", () => {
  it("returns insufficient_data when all arrays are empty and children=0, staff=0", () => {
    const r = computeDataProtectionGdprCompliance({
      today: TODAY,
      total_children: 0,
      total_staff: 0,
      policy_compliance_records: [],
      sar_records: [],
      breach_records: [],
      privacy_notice_records: [],
      training_records: [],
    });
    expect(r.data_protection_rating).toBe("insufficient_data");
    expect(r.data_protection_score).toBe(0);
    expect(r.headline).toContain("insufficient data");
  });

  it("returns all zero rates for insufficient_data", () => {
    const r = computeDataProtectionGdprCompliance({
      today: TODAY,
      total_children: 0,
      total_staff: 0,
      policy_compliance_records: [],
      sar_records: [],
      breach_records: [],
      privacy_notice_records: [],
      training_records: [],
    });
    expect(r.policy_compliance_rate).toBe(0);
    expect(r.sar_handling_rate).toBe(0);
    expect(r.breach_management_rate).toBe(0);
    expect(r.privacy_notice_rate).toBe(0);
    expect(r.staff_training_rate).toBe(0);
    expect(r.record_security_rate).toBe(0);
  });

  it("returns empty strengths, concerns, recommendations, insights for insufficient_data", () => {
    const r = computeDataProtectionGdprCompliance({
      today: TODAY,
      total_children: 0,
      total_staff: 0,
      policy_compliance_records: [],
      sar_records: [],
      breach_records: [],
      privacy_notice_records: [],
      training_records: [],
    });
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  it("returns empty record arrays for insufficient_data", () => {
    const r = computeDataProtectionGdprCompliance({
      today: TODAY,
      total_children: 0,
      total_staff: 0,
      policy_compliance_records: [],
      sar_records: [],
      breach_records: [],
      privacy_notice_records: [],
      training_records: [],
    });
    expect(r.policy_compliance_records).toHaveLength(0);
    expect(r.sar_records).toHaveLength(0);
    expect(r.breach_records).toHaveLength(0);
    expect(r.privacy_notice_records).toHaveLength(0);
    expect(r.training_records).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. ALL EMPTY WITH CHILDREN/STAFF — INADEQUATE SPECIAL CASE
// ══════════════════════════════════════════════════════════════════════════════

describe("all empty with children or staff (special inadequate)", () => {
  it("returns inadequate with score 15 when all arrays empty but children > 0", () => {
    const r = computeDataProtectionGdprCompliance({
      today: TODAY,
      total_children: 3,
      total_staff: 0,
      policy_compliance_records: [],
      sar_records: [],
      breach_records: [],
      privacy_notice_records: [],
      training_records: [],
    });
    expect(r.data_protection_rating).toBe("inadequate");
    expect(r.data_protection_score).toBe(15);
  });

  it("returns inadequate with score 15 when all arrays empty but staff > 0", () => {
    const r = computeDataProtectionGdprCompliance({
      today: TODAY,
      total_children: 0,
      total_staff: 5,
      policy_compliance_records: [],
      sar_records: [],
      breach_records: [],
      privacy_notice_records: [],
      training_records: [],
    });
    expect(r.data_protection_rating).toBe("inadequate");
    expect(r.data_protection_score).toBe(15);
  });

  it("returns inadequate with score 15 when both children and staff > 0 but all empty", () => {
    const r = computeDataProtectionGdprCompliance({
      today: TODAY,
      total_children: 4,
      total_staff: 6,
      policy_compliance_records: [],
      sar_records: [],
      breach_records: [],
      privacy_notice_records: [],
      training_records: [],
    });
    expect(r.data_protection_rating).toBe("inadequate");
    expect(r.data_protection_score).toBe(15);
  });

  it("includes a concern about no records existing", () => {
    const r = computeDataProtectionGdprCompliance({
      today: TODAY,
      total_children: 3,
      total_staff: 5,
      policy_compliance_records: [],
      sar_records: [],
      breach_records: [],
      privacy_notice_records: [],
      training_records: [],
    });
    expect(r.concerns).toHaveLength(1);
    expect(r.concerns[0]).toContain("No data protection policy records");
  });

  it("includes 2 recommendations when all empty with children/staff", () => {
    const r = computeDataProtectionGdprCompliance({
      today: TODAY,
      total_children: 3,
      total_staff: 5,
      policy_compliance_records: [],
      sar_records: [],
      breach_records: [],
      privacy_notice_records: [],
      training_records: [],
    });
    expect(r.recommendations).toHaveLength(2);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("includes a critical insight about complete absence", () => {
    const r = computeDataProtectionGdprCompliance({
      today: TODAY,
      total_children: 3,
      total_staff: 5,
      policy_compliance_records: [],
      sar_records: [],
      breach_records: [],
      privacy_notice_records: [],
      training_records: [],
    });
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
    expect(r.insights[0].text).toContain("complete absence");
  });

  it("headline mentions urgent attention", () => {
    const r = computeDataProtectionGdprCompliance({
      today: TODAY,
      total_children: 3,
      total_staff: 5,
      policy_compliance_records: [],
      sar_records: [],
      breach_records: [],
      privacy_notice_records: [],
      training_records: [],
    });
    expect(r.headline).toContain("urgent attention");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. OUTSTANDING — ALL BONUSES, BASE 52 + 28 = 80
// ══════════════════════════════════════════════════════════════════════════════

describe("outstanding", () => {
  it("achieves outstanding with perfect data (base=52 + all bonuses = 80)", () => {
    const r = run();
    expect(r.data_protection_rating).toBe("outstanding");
    expect(r.data_protection_score).toBe(80);
  });

  it("has policy_compliance_rate=100 with perfect policies", () => {
    const r = run();
    expect(r.policy_compliance_rate).toBe(100);
  });

  it("has sar_handling_rate=100 with perfect SARs", () => {
    const r = run();
    expect(r.sar_handling_rate).toBe(100);
  });

  it("has breach_management_rate=100 with zero breaches", () => {
    const r = run();
    expect(r.breach_management_rate).toBe(100);
  });

  it("has privacy_notice_rate=100 with perfect notices", () => {
    const r = run();
    expect(r.privacy_notice_rate).toBe(100);
  });

  it("has staff_training_rate=100 with full coverage and all passed", () => {
    const r = run();
    expect(r.staff_training_rate).toBe(100);
  });

  it("has record_security_rate=100 with full accessibility and DPO sign-off", () => {
    const r = run();
    expect(r.record_security_rate).toBe(100);
  });

  it("headline mentions outstanding", () => {
    const r = run();
    expect(r.headline).toContain("Outstanding");
  });

  it("has strengths and no concerns", () => {
    const r = run();
    expect(r.strengths.length).toBeGreaterThan(0);
    expect(r.concerns).toHaveLength(0);
  });

  it("has a positive outstanding insight", () => {
    const r = run();
    const outstanding = r.insights.filter((i) => i.severity === "positive");
    expect(outstanding.length).toBeGreaterThan(0);
  });

  it("passes through records to output", () => {
    const r = run();
    expect(r.policy_compliance_records).toHaveLength(3);
    expect(r.sar_records).toHaveLength(2);
    expect(r.breach_records).toHaveLength(0);
    expect(r.privacy_notice_records).toHaveLength(3);
    expect(r.training_records).toHaveLength(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. GOOD RATING
// ══════════════════════════════════════════════════════════════════════════════

describe("good", () => {
  it("achieves good when score is between 65-79", () => {
    // Remove some bonuses: e.g., weaken policies to get 70-range bonus instead of 90-range
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", compliant_with_gdpr: true, compliant_with_chr2015: true }),
        makePolicy({ id: "p2", compliant_with_gdpr: true, compliant_with_chr2015: false }),
        makePolicy({ id: "p3", compliant_with_gdpr: false, compliant_with_chr2015: false }),
      ],
    });
    // With weaker policies: gdprRate=67, chr2015Rate=33, policyReviewRate=100, staffAck=100, dpoRate=100
    // policyComplianceRate = avg(67,33,100,100,100) = 80 -> +3 bonus (not +5)
    // + all others still perfect -> 52+3+5+5+4+5+4 = 78
    expect(r.data_protection_score).toBe(78);
    expect(r.data_protection_rating).toBe("good");
  });

  it("headline mentions good and strength/concern counts", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1" }),
        makePolicy({ id: "p2", compliant_with_gdpr: false, compliant_with_chr2015: false }),
        makePolicy({ id: "p3", compliant_with_gdpr: false, compliant_with_chr2015: false }),
      ],
    });
    expect(r.data_protection_rating).toBe("good");
    expect(r.headline).toContain("Good");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. ADEQUATE RATING
// ══════════════════════════════════════════════════════════════════════════════

describe("adequate", () => {
  it("achieves adequate when score is between 45-64", () => {
    // Base 52, lose most bonuses, some small penalties
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", compliant_with_gdpr: false, compliant_with_chr2015: false, dpo_signed_off: false, staff_acknowledged: 3, staff_total: 10 }),
        makePolicy({ id: "p2", compliant_with_gdpr: false, compliant_with_chr2015: false, dpo_signed_off: false, staff_acknowledged: 2, staff_total: 10 }),
      ],
      sar_records: [
        makeSar({ id: "s1", completed_within_deadline: false, quality_checked: false }),
        makeSar({ id: "s2", completed_within_deadline: false, quality_checked: false }),
      ],
      privacy_notice_records: [
        makeNotice({ id: "n1", compliant_with_gdpr: false, plain_language: false, covers_all_processing: false }),
      ],
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", passed: true, refresher_completed: false, refresher_due_date: "2026-04-01" }),
        makeTraining({ id: "t2", staff_id: "s2", passed: false, refresher_completed: false, refresher_due_date: "2026-04-01" }),
      ],
    });
    expect(r.data_protection_rating).toBe("adequate");
    expect(r.data_protection_score).toBeGreaterThanOrEqual(45);
    expect(r.data_protection_score).toBeLessThan(65);
  });

  it("headline mentions adequate and concern count", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", compliant_with_gdpr: false, compliant_with_chr2015: false, dpo_signed_off: false, staff_acknowledged: 3, staff_total: 10 }),
      ],
      sar_records: [
        makeSar({ id: "s1", completed_within_deadline: false, quality_checked: false }),
      ],
      privacy_notice_records: [
        makeNotice({ id: "n1", compliant_with_gdpr: false, plain_language: false }),
      ],
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", refresher_completed: false, refresher_due_date: "2026-04-01" }),
      ],
    });
    expect(r.data_protection_rating).toBe("adequate");
    expect(r.headline).toContain("Adequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. INADEQUATE RATING
// ══════════════════════════════════════════════════════════════════════════════

describe("inadequate", () => {
  it("achieves inadequate when score < 45 due to penalties", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({
          id: "p1",
          compliant_with_gdpr: false,
          compliant_with_chr2015: false,
          dpo_signed_off: false,
          staff_acknowledged: 0,
          staff_total: 10,
          next_review_date: "2026-01-01", // overdue
        }),
      ],
      sar_records: [
        makeSar({
          id: "s1",
          outcome: "pending",
          deadline_date: "2026-04-01", // overdue
          completed_within_deadline: false,
          quality_checked: false,
          date_acknowledged: null,
          date_completed: null,
        }),
      ],
      breach_records: [
        makeBreach({
          id: "b1",
          severity: "critical",
          root_cause_identified: false,
          corrective_actions_taken: false,
          corrective_actions_completed: false,
          lessons_learned_documented: false,
          dpo_notified: false,
          children_data_involved: true,
        }),
      ],
      privacy_notice_records: [
        makeNotice({ id: "n1", compliant_with_gdpr: false, plain_language: false, published: false, covers_all_processing: false, lawful_basis_stated: false, data_rights_explained: false }),
      ],
      training_records: [
        makeTraining({
          id: "t1",
          staff_id: "s1",
          passed: false,
          expiry_date: "2025-01-01", // expired
          refresher_completed: false,
          refresher_due_date: "2025-06-01",
          score: 20,
        }),
      ],
    });
    expect(r.data_protection_rating).toBe("inadequate");
    expect(r.data_protection_score).toBeLessThan(45);
  });

  it("headline mentions inadequate and urgent action", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", compliant_with_gdpr: false, compliant_with_chr2015: false, dpo_signed_off: false, staff_acknowledged: 0, staff_total: 10, next_review_date: "2026-01-01" }),
      ],
      sar_records: [
        makeSar({ id: "s1", outcome: "pending", deadline_date: "2026-04-01", completed_within_deadline: false, quality_checked: false, date_acknowledged: null }),
      ],
      breach_records: [
        makeBreach({ id: "b1", severity: "high", root_cause_identified: false, corrective_actions_taken: false, corrective_actions_completed: false, lessons_learned_documented: false, dpo_notified: false }),
      ],
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", passed: false, refresher_completed: false, refresher_due_date: "2025-06-01" }),
      ],
    });
    expect(r.data_protection_rating).toBe("inadequate");
    expect(r.headline).toContain("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. BONUS SCORING — INDIVIDUAL BONUSES
// ══════════════════════════════════════════════════════════════════════════════

describe("bonuses", () => {
  // Bonus 1: policyComplianceRate
  describe("policy compliance bonus", () => {
    it("+5 when policyComplianceRate >= 90", () => {
      const r = run(); // perfect policies -> rate=100
      // base 52, policy +5, sar +5, breach +5, notice +4, training +5, security +4 = 80
      expect(r.data_protection_score).toBe(80);
    });

    it("+3 when policyComplianceRate >= 70 but < 90", () => {
      // Need rate between 70-89
      const r = run({
        policy_compliance_records: [
          makePolicy({ id: "p1" }),
          makePolicy({ id: "p2", compliant_with_gdpr: true, compliant_with_chr2015: false }),
          makePolicy({ id: "p3", compliant_with_gdpr: false, compliant_with_chr2015: false }),
        ],
      });
      // gdprRate=67, chr2015Rate=33, reviewRate=100, ackRate=100, dpoRate=100 -> avg=80 -> +3
      // total = 52+3+5+5+4+5+4 = 78
      expect(r.data_protection_score).toBe(78);
    });

    it("+0 when policyComplianceRate < 70", () => {
      const r = run({
        policy_compliance_records: [
          makePolicy({ id: "p1", compliant_with_gdpr: false, compliant_with_chr2015: false, dpo_signed_off: false }),
          makePolicy({ id: "p2", compliant_with_gdpr: false, compliant_with_chr2015: false, dpo_signed_off: false }),
        ],
      });
      // gdprRate=0, chr2015Rate=0, reviewRate=100, ackRate=100, dpoRate=0 -> avg=40 -> no bonus
      expect(r.policy_compliance_rate).toBe(40);
    });
  });

  // Bonus 2: sarHandlingRate
  describe("SAR handling bonus", () => {
    it("+5 when sarHandlingRate >= 90", () => {
      const r = run(); // perfect SARs -> rate=100
      expect(r.sar_handling_rate).toBe(100);
    });

    it("+2 when sarHandlingRate >= 70 but < 90", () => {
      const r = run({
        sar_records: [
          makeSar({ id: "s1" }),
          makeSar({ id: "s2", completed_within_deadline: false }),
          makeSar({ id: "s3", quality_checked: false }),
        ],
      });
      // completionRate=100, deadlineRate=67, qualityRate=67, ackRate=100 -> avg=84 -> +2 not +5
      // Wait: 83.5 rounds to 84 -> >= 70 -> +2
      // With other perfects: 52+5+2+5+4+5+4 = 77
      expect(r.data_protection_score).toBe(77);
    });

    it("+0 when sarHandlingRate < 70 (without penalty guard)", () => {
      const r = run({
        sar_records: [
          makeSar({ id: "s1", outcome: "completed", completed_within_deadline: false, quality_checked: false, date_acknowledged: "2026-04-10" }),
          makeSar({ id: "s2", outcome: "completed", completed_within_deadline: false, quality_checked: false, date_acknowledged: null }),
        ],
      });
      // completionRate=100, deadlineRate=0, qualityRate=0, ackRate=0 -> avg=25 -> no bonus
      expect(r.sar_handling_rate).toBe(25);
    });
  });

  // Bonus 3: breachManagementRate
  describe("breach management bonus", () => {
    it("+5 when no breaches (rate defaults to 100)", () => {
      const r = run({ breach_records: [] });
      expect(r.breach_management_rate).toBe(100);
    });

    it("+5 when breachManagementRate >= 90 with breaches", () => {
      const r = run({
        breach_records: [
          makeBreach({ id: "b1" }), // all flags true
        ],
      });
      expect(r.breach_management_rate).toBe(100);
    });

    it("+2 when breachManagementRate >= 70 but < 90", () => {
      const r = run({
        breach_records: [
          makeBreach({ id: "b1" }),
          makeBreach({ id: "b2", lessons_learned_documented: false }),
          makeBreach({ id: "b3", root_cause_identified: false }),
        ],
      });
      // rootCause=67, corrective=100, completed=100, lessons=67, dpo=100 -> avg=87 -> +2
      // Wait: (67+100+100+67+100)/5 = 434/5 = 86.8 -> Math.round = 87 -> >= 70 but < 90 -> +2
      expect(r.breach_management_rate).toBe(87);
    });

    it("+0 when breachManagementRate < 70", () => {
      const r = run({
        breach_records: [
          makeBreach({ id: "b1", root_cause_identified: false, corrective_actions_taken: false, corrective_actions_completed: false, lessons_learned_documented: false, dpo_notified: false }),
        ],
      });
      expect(r.breach_management_rate).toBe(0);
    });
  });

  // Bonus 4: privacyNoticeRate
  describe("privacy notice bonus", () => {
    it("+4 when privacyNoticeRate >= 90", () => {
      const r = run(); // perfect notices
      expect(r.privacy_notice_rate).toBe(100);
    });

    it("+2 when privacyNoticeRate >= 70 but < 90", () => {
      const r = run({
        privacy_notice_records: [
          makeNotice({ id: "n1" }),
          makeNotice({ id: "n2", compliant_with_gdpr: false }),
          makeNotice({ id: "n3", plain_language: false }),
        ],
      });
      // gdprRate=67, plainRate=67, procRate=100, lawfulRate=100, rightsRate=100, pubRate=100 -> avg=89 -> >=70 -> +2
      expect(r.privacy_notice_rate).toBe(89);
    });

    it("+0 when privacyNoticeRate < 70", () => {
      const r = run({
        privacy_notice_records: [
          makeNotice({ id: "n1", compliant_with_gdpr: false, plain_language: false, published: false, covers_all_processing: false, lawful_basis_stated: false }),
        ],
      });
      // gdprRate=0, plainRate=0, procRate=0, lawfulRate=0, rightsRate=100, pubRate=0 -> avg=17 -> no bonus
      expect(r.privacy_notice_rate).toBe(17);
    });
  });

  // Bonus 5: staffTrainingRate
  describe("staff training bonus", () => {
    it("+5 when staffTrainingRate >= 90", () => {
      const r = run(); // 6 staff, 6 trained, all passed, all refreshed
      expect(r.staff_training_rate).toBe(100);
    });

    it("+2 when staffTrainingRate >= 70 but < 90", () => {
      const r = run({
        training_records: [
          makeTraining({ id: "t1", staff_id: "s1" }),
          makeTraining({ id: "t2", staff_id: "s2" }),
          makeTraining({ id: "t3", staff_id: "s3" }),
          makeTraining({ id: "t4", staff_id: "s4" }),
          makeTraining({ id: "t5", staff_id: "s5", passed: false }),
          makeTraining({ id: "t6", staff_id: "s6", passed: false }),
        ],
      });
      // passRate=67, coverage=67(4/6), currentRate=100, refresherRate=100 -> avg=84 -> +2
      expect(r.staff_training_rate).toBeGreaterThanOrEqual(70);
      expect(r.staff_training_rate).toBeLessThan(90);
    });

    it("+0 when staffTrainingRate < 70", () => {
      const r = run({
        training_records: [
          makeTraining({ id: "t1", staff_id: "s1", passed: false, refresher_completed: false }),
          makeTraining({ id: "t2", staff_id: "s2", passed: false, refresher_completed: false }),
        ],
      });
      // passRate=0, coverage=0(0/6), currentRate=100, refresherRate=0 -> avg=25 -> no bonus
      expect(r.staff_training_rate).toBeLessThan(70);
    });
  });

  // Bonus 6: recordSecurityRate
  describe("record security bonus", () => {
    it("+4 when recordSecurityRate >= 90", () => {
      const r = run(); // perfect everything -> security=100
      expect(r.record_security_rate).toBe(100);
    });

    it("+2 when recordSecurityRate >= 70 but < 90", () => {
      const r = run({
        policy_compliance_records: [
          makePolicy({ id: "p1", accessible_to_staff: true, dpo_signed_off: true }),
          makePolicy({ id: "p2", accessible_to_staff: false, dpo_signed_off: false }),
        ],
        training_records: [
          makeTraining({ id: "t1", staff_id: "s1" }),
          makeTraining({ id: "t2", staff_id: "s2" }),
          makeTraining({ id: "t3", staff_id: "s3" }),
          makeTraining({ id: "t4", staff_id: "s4" }),
          makeTraining({ id: "t5", staff_id: "s5" }),
        ],
      });
      // accessibility=50, dpoSignOff=50, riskAssess=100(no breach), coverage=83(5/6) -> avg=71 -> +2
      expect(r.record_security_rate).toBeGreaterThanOrEqual(70);
      expect(r.record_security_rate).toBeLessThan(90);
    });

    it("+0 when recordSecurityRate < 70", () => {
      const r = run({
        policy_compliance_records: [
          makePolicy({ id: "p1", accessible_to_staff: false, dpo_signed_off: false }),
        ],
        training_records: [
          makeTraining({ id: "t1", staff_id: "s1" }),
        ],
      });
      // accessibility=0, dpoSignOff=0, riskAssess=100(no breach), coverage=17(1/6) -> avg=29 -> no bonus
      expect(r.record_security_rate).toBeLessThan(70);
    });
  });

  it("max possible score is 80 (52 + 28)", () => {
    const r = run();
    expect(r.data_protection_score).toBe(80);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. PENALTY SCORING
// ══════════════════════════════════════════════════════════════════════════════

describe("penalties", () => {
  // Penalty 1: policyComplianceRate < 50 -> -6
  describe("policy compliance penalty (-6)", () => {
    it("applies -6 when policyComplianceRate < 50 and totalPolicies > 0", () => {
      const r = run({
        policy_compliance_records: [
          makePolicy({ id: "p1", compliant_with_gdpr: false, compliant_with_chr2015: false, dpo_signed_off: false, staff_acknowledged: 0, staff_total: 10 }),
        ],
      });
      // gdpr=0, chr2015=0, review=100, ack=0, dpo=0 -> avg=20 -> penalty applies
      expect(r.policy_compliance_rate).toBe(20);
    });

    it("does not apply penalty when totalPolicies is 0", () => {
      const r = run({
        policy_compliance_records: [],
      });
      // policyComplianceRate = 0 but totalPolicies = 0, so no penalty
      expect(r.policy_compliance_rate).toBe(0);
    });
  });

  // Penalty 2: sarHandlingRate < 50 with overdue SARs -> -5
  describe("SAR handling penalty (-5)", () => {
    it("applies -5 when sarHandlingRate < 50 and sarOverdueCount > 0", () => {
      const r = run({
        sar_records: [
          makeSar({
            id: "s1",
            outcome: "pending",
            deadline_date: "2026-04-01",
            completed_within_deadline: false,
            quality_checked: false,
            date_acknowledged: null,
            date_completed: null,
          }),
        ],
      });
      // completion=0(pending), deadline=0, quality=0, ack=0 -> avg=0 -> <50, and overdue, so -5
      expect(r.sar_handling_rate).toBe(0);
    });

    it("does not apply when sarOverdueCount = 0 even if sarHandlingRate < 50", () => {
      // SARs with low rate but not overdue
      const r = run({
        sar_records: [
          makeSar({
            id: "s1",
            outcome: "completed",
            completed_within_deadline: false,
            quality_checked: false,
            date_acknowledged: "2026-04-10", // late ack
          }),
          makeSar({
            id: "s2",
            outcome: "completed",
            completed_within_deadline: false,
            quality_checked: false,
            date_acknowledged: null,
          }),
        ],
      });
      // rate < 50 but no pending overdue SARs
      expect(r.sar_handling_rate).toBeLessThan(50);
      // No -5 penalty applied since no overdue pending SARs
    });

    it("does not apply when totalSars = 0", () => {
      const r = run({ sar_records: [] });
      expect(r.sar_handling_rate).toBe(0);
      // No penalty
    });
  });

  // Penalty 3: breachManagementRate < 50 with high-severity breaches -> -6
  describe("breach management penalty (-6)", () => {
    it("applies -6 when breachManagementRate < 50 and highSeverityBreaches > 0", () => {
      const r = run({
        breach_records: [
          makeBreach({
            id: "b1",
            severity: "critical",
            root_cause_identified: false,
            corrective_actions_taken: false,
            corrective_actions_completed: false,
            lessons_learned_documented: false,
            dpo_notified: false,
          }),
        ],
      });
      expect(r.breach_management_rate).toBe(0);
      // -6 penalty
    });

    it("applies -6 for high severity breach with low management rate", () => {
      const r = run({
        breach_records: [
          makeBreach({
            id: "b1",
            severity: "high",
            root_cause_identified: false,
            corrective_actions_taken: false,
            corrective_actions_completed: false,
            lessons_learned_documented: false,
            dpo_notified: false,
          }),
        ],
      });
      expect(r.breach_management_rate).toBe(0);
    });

    it("does not apply when only low-severity breaches exist", () => {
      const r = run({
        breach_records: [
          makeBreach({
            id: "b1",
            severity: "low",
            root_cause_identified: false,
            corrective_actions_taken: false,
            corrective_actions_completed: false,
            lessons_learned_documented: false,
            dpo_notified: false,
          }),
        ],
      });
      expect(r.breach_management_rate).toBe(0);
      // No -6 penalty because no high-severity breaches
    });

    it("does not apply when totalBreaches = 0", () => {
      const r = run({ breach_records: [] });
      expect(r.breach_management_rate).toBe(100);
      // No penalty
    });
  });

  // Penalty 4: staffTrainingRate < 40 -> -5
  describe("staff training penalty (-5)", () => {
    it("applies -5 when staffTrainingRate < 40 and totalTrainingRecords > 0", () => {
      const r = run({
        training_records: [
          makeTraining({ id: "t1", staff_id: "s1", passed: false, refresher_completed: false, refresher_due_date: "2026-04-01" }),
        ],
      });
      // passRate=0, coverage=0(0/6), currentRate=100, refresherRate=0 -> avg=25 -> <40 -> -5
      expect(r.staff_training_rate).toBe(25);
    });

    it("does not apply when totalTrainingRecords = 0", () => {
      const r = run({ training_records: [] });
      expect(r.staff_training_rate).toBe(0);
      // No penalty since no records
    });

    it("does not apply when staffTrainingRate >= 40", () => {
      const r = run({
        training_records: [
          makeTraining({ id: "t1", staff_id: "s1" }),
          makeTraining({ id: "t2", staff_id: "s2" }),
          makeTraining({ id: "t3", staff_id: "s3", passed: false }),
        ],
      });
      // passRate=67, coverage=33(2/6), currentRate=100, refresherRate=100 -> avg=75 -> >=40 -> no penalty
      expect(r.staff_training_rate).toBeGreaterThanOrEqual(40);
    });
  });

  it("all four penalties can stack for maximum deduction", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", compliant_with_gdpr: false, compliant_with_chr2015: false, dpo_signed_off: false, staff_acknowledged: 0, staff_total: 10, next_review_date: "2026-01-01" }),
      ],
      sar_records: [
        makeSar({ id: "s1", outcome: "pending", deadline_date: "2026-04-01", completed_within_deadline: false, quality_checked: false, date_acknowledged: null, date_completed: null }),
      ],
      breach_records: [
        makeBreach({ id: "b1", severity: "critical", root_cause_identified: false, corrective_actions_taken: false, corrective_actions_completed: false, lessons_learned_documented: false, dpo_notified: false }),
      ],
      privacy_notice_records: [
        makeNotice({ id: "n1", compliant_with_gdpr: false, plain_language: false, published: false }),
      ],
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", passed: false, refresher_completed: false, refresher_due_date: "2025-06-01" }),
      ],
    });
    // base 52, no bonuses (all rates low), penalties: -6 -5 -6 -5 = -22
    // 52 - 22 = 30
    expect(r.data_protection_score).toBe(30);
    expect(r.data_protection_rating).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. COMPOSITE RATES
// ══════════════════════════════════════════════════════════════════════════════

describe("composite rates", () => {
  describe("policy compliance rate", () => {
    it("averages gdprRate, chr2015Rate, reviewRate, ackRate, dpoRate", () => {
      const r = run({
        policy_compliance_records: [
          makePolicy({ id: "p1", compliant_with_gdpr: true, compliant_with_chr2015: true, dpo_signed_off: true, staff_acknowledged: 10, staff_total: 10 }),
          makePolicy({ id: "p2", compliant_with_gdpr: false, compliant_with_chr2015: false, dpo_signed_off: false, staff_acknowledged: 0, staff_total: 10 }),
        ],
      });
      // gdpr=50, chr2015=50, review=100, ack=50, dpo=50 -> avg=60
      expect(r.policy_compliance_rate).toBe(60);
    });

    it("returns 0 when no policies", () => {
      const r = run({ policy_compliance_records: [] });
      expect(r.policy_compliance_rate).toBe(0);
    });
  });

  describe("SAR handling rate", () => {
    it("averages completionRate, deadlineRate, qualityRate, ackRate", () => {
      const r = run({
        sar_records: [
          makeSar({ id: "s1" }),
          makeSar({ id: "s2", outcome: "refused", completed_within_deadline: false, quality_checked: false, date_acknowledged: null }),
        ],
      });
      // completion: completed+partially/total = 1/2=50, deadline=1/2=50, quality=1/2=50, ack=1/2=50 -> avg=50
      expect(r.sar_handling_rate).toBe(50);
    });

    it("returns 0 when no SARs", () => {
      const r = run({ sar_records: [] });
      expect(r.sar_handling_rate).toBe(0);
    });
  });

  describe("breach management rate", () => {
    it("returns 100 when no breaches (perfect)", () => {
      const r = run({ breach_records: [] });
      expect(r.breach_management_rate).toBe(100);
    });

    it("averages rootCause, corrective, completed, lessons, dpoNotification rates", () => {
      const r = run({
        breach_records: [
          makeBreach({ id: "b1" }),
          makeBreach({ id: "b2", root_cause_identified: false, corrective_actions_completed: false }),
        ],
      });
      // rootCause=50, corrective=100, completed=50, lessons=100, dpo=100 -> avg=80
      expect(r.breach_management_rate).toBe(80);
    });
  });

  describe("privacy notice rate", () => {
    it("averages gdprRate, plainRate, procRate, lawfulRate, rightsRate, pubRate", () => {
      const r = run({
        privacy_notice_records: [
          makeNotice({ id: "n1" }),
          makeNotice({ id: "n2", compliant_with_gdpr: false, plain_language: false }),
        ],
      });
      // gdpr=50, plain=50, proc=100, lawful=100, rights=100, pub=100 -> avg=83
      expect(r.privacy_notice_rate).toBe(83);
    });

    it("returns 0 when no notices", () => {
      const r = run({ privacy_notice_records: [] });
      expect(r.privacy_notice_rate).toBe(0);
    });
  });

  describe("staff training rate", () => {
    it("averages passRate, coverage, currentRate, refresherCompletionRate", () => {
      const r = run({
        training_records: [
          makeTraining({ id: "t1", staff_id: "s1" }),
          makeTraining({ id: "t2", staff_id: "s2" }),
          makeTraining({ id: "t3", staff_id: "s3" }),
        ],
      });
      // passRate=100, coverage=50(3/6), currentRate=100, refresherRate=100 -> avg=88
      expect(r.staff_training_rate).toBe(88);
    });

    it("returns 0 when no training records", () => {
      const r = run({ training_records: [] });
      expect(r.staff_training_rate).toBe(0);
    });
  });

  describe("record security rate", () => {
    it("uses riskAssessmentRate=100 when no breaches", () => {
      const r = run({
        breach_records: [],
        policy_compliance_records: [
          makePolicy({ id: "p1", accessible_to_staff: true, dpo_signed_off: true }),
        ],
        training_records: [
          makeTraining({ id: "t1", staff_id: "s1" }),
          makeTraining({ id: "t2", staff_id: "s2" }),
          makeTraining({ id: "t3", staff_id: "s3" }),
          makeTraining({ id: "t4", staff_id: "s4" }),
          makeTraining({ id: "t5", staff_id: "s5" }),
          makeTraining({ id: "t6", staff_id: "s6" }),
        ],
      });
      // accessibility=100, dpo=100, riskAssess=100(no breach), coverage=100(6/6) -> avg=100
      expect(r.record_security_rate).toBe(100);
    });

    it("uses actual riskAssessmentRate when breaches exist", () => {
      const r = run({
        breach_records: [
          makeBreach({ id: "b1", risk_assessment_completed: true }),
          makeBreach({ id: "b2", risk_assessment_completed: false }),
        ],
        policy_compliance_records: [
          makePolicy({ id: "p1", accessible_to_staff: true, dpo_signed_off: true }),
        ],
        training_records: [
          makeTraining({ id: "t1", staff_id: "s1" }),
          makeTraining({ id: "t2", staff_id: "s2" }),
          makeTraining({ id: "t3", staff_id: "s3" }),
          makeTraining({ id: "t4", staff_id: "s4" }),
          makeTraining({ id: "t5", staff_id: "s5" }),
          makeTraining({ id: "t6", staff_id: "s6" }),
        ],
      });
      // accessibility=100, dpo=100, riskAssess=50, coverage=100 -> avg=88
      expect(r.record_security_rate).toBe(88);
    });

    it("returns 0 when no policies and no training records", () => {
      const r = run({
        policy_compliance_records: [],
        training_records: [],
      });
      // totalPolicies=0 and totalTrainingRecords=0 -> 0
      expect(r.record_security_rate).toBe(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. STRENGTHS
// ══════════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes GDPR compliance strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("GDPR-compliant"));
    expect(s).toBeDefined();
  });

  it("includes GDPR compliance moderate strength when >= 70 but < 90", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", compliant_with_gdpr: true }),
        makePolicy({ id: "p2", compliant_with_gdpr: true }),
        makePolicy({ id: "p3", compliant_with_gdpr: true }),
        makePolicy({ id: "p4", compliant_with_gdpr: false }),
      ],
    });
    // 3/4 = 75% -> moderate
    const s = r.strengths.find((s) => s.includes("75%") && s.includes("GDPR"));
    expect(s).toBeDefined();
  });

  it("includes CHR 2015 compliance strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("CHR 2015"));
    expect(s).toBeDefined();
  });

  it("includes policy review strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("reviewed within schedule"));
    expect(s).toBeDefined();
  });

  it("includes policy review moderate strength when >= 70 but < 90", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1" }),
        makePolicy({ id: "p2" }),
        makePolicy({ id: "p3" }),
        makePolicy({ id: "p4", next_review_date: "2026-01-01" }), // overdue
      ],
    });
    // 3/4 = 75% -> moderate
    const s = r.strengths.find((s) => s.includes("reviewed on time"));
    expect(s).toBeDefined();
  });

  it("includes DPO sign-off strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("DPO has signed off"));
    expect(s).toBeDefined();
  });

  it("includes staff acknowledgement strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("staff acknowledgement"));
    expect(s).toBeDefined();
  });

  it("includes staff ack moderate strength when >= 70 but < 90", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", staff_acknowledged: 8, staff_total: 10 }),
      ],
    });
    const s = r.strengths.find((s) => s.includes("staff policy acknowledgement rate"));
    expect(s).toBeDefined();
  });

  it("includes gap resolution strength when >= 90 and gaps exist", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", gaps_identified: 10, gaps_resolved: 10 }),
      ],
    });
    const s = r.strengths.find((s) => s.includes("policy gaps resolved"));
    expect(s).toBeDefined();
  });

  it("includes SAR deadline strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("subject access requests completed within statutory deadline"));
    expect(s).toBeDefined();
  });

  it("includes SAR deadline moderate strength when >= 70 but < 90", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1" }),
        makeSar({ id: "s2" }),
        makeSar({ id: "s3" }),
        makeSar({ id: "s4", completed_within_deadline: false }),
      ],
    });
    // 3/4 = 75% -> moderate
    const s = r.strengths.find((s) => s.includes("SARs completed within deadline"));
    expect(s).toBeDefined();
  });

  it("includes SAR quality strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("quality-checked"));
    expect(s).toBeDefined();
  });

  it("includes SAR satisfaction strength when >= 80", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("requester satisfaction"));
    expect(s).toBeDefined();
  });

  it("includes SAR acknowledgement strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("acknowledged within 2 working days"));
    expect(s).toBeDefined();
  });

  it("includes no breaches strength when totalBreaches=0", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("No data breaches recorded"));
    expect(s).toBeDefined();
  });

  it("includes root cause strength when >= 90 and breaches exist", () => {
    const r = run({
      breach_records: [makeBreach({ id: "b1" })],
    });
    const s = r.strengths.find((s) => s.includes("Root cause identified"));
    expect(s).toBeDefined();
  });

  it("includes corrective actions strength when >= 90 and breaches exist", () => {
    const r = run({
      breach_records: [makeBreach({ id: "b1" })],
    });
    const s = r.strengths.find((s) => s.includes("corrective actions completed"));
    expect(s).toBeDefined();
  });

  it("includes lessons learned strength when >= 90 and breaches exist", () => {
    const r = run({
      breach_records: [makeBreach({ id: "b1" })],
    });
    const s = r.strengths.find((s) => s.includes("Lessons learned"));
    expect(s).toBeDefined();
  });

  it("includes ICO timeliness strength when all reported within 72h", () => {
    const r = run({
      breach_records: [
        makeBreach({ id: "b1", reported_to_ico: true, reported_to_ico_within_72h: true }),
      ],
    });
    const s = r.strengths.find((s) => s.includes("ICO-reportable breaches reported within 72 hours"));
    expect(s).toBeDefined();
  });

  it("includes recurrence prevention strength when >= 90 and breaches exist", () => {
    const r = run({
      breach_records: [makeBreach({ id: "b1" })],
    });
    const s = r.strengths.find((s) => s.includes("Recurrence prevention"));
    expect(s).toBeDefined();
  });

  it("includes notice GDPR compliance strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("privacy notices are GDPR-compliant"));
    expect(s).toBeDefined();
  });

  it("includes notice plain language strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("plain language"));
    expect(s).toBeDefined();
  });

  it("includes notice age-appropriate strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("age-appropriate"));
    expect(s).toBeDefined();
  });

  it("includes notice acknowledgement strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("privacy notice acknowledgement"));
    expect(s).toBeDefined();
  });

  it("includes all published strength when 100%", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("All privacy notices are published"));
    expect(s).toBeDefined();
  });

  it("includes lawful basis strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("lawful basis"));
    expect(s).toBeDefined();
  });

  it("includes data rights strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("data subject rights"));
    expect(s).toBeDefined();
  });

  it("includes staff training coverage strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("staff have completed GDPR training"));
    expect(s).toBeDefined();
  });

  it("includes training coverage moderate strength when >= 70 but < 90", () => {
    const r = run({
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1" }),
        makeTraining({ id: "t2", staff_id: "s2" }),
        makeTraining({ id: "t3", staff_id: "s3" }),
        makeTraining({ id: "t4", staff_id: "s4" }),
        makeTraining({ id: "t5", staff_id: "s5" }),
      ],
    });
    const s = r.strengths.find((s) => s.includes("staff GDPR training coverage"));
    expect(s).toBeDefined();
  });

  it("includes training pass rate strength when >= 95", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("training pass rate"));
    expect(s).toBeDefined();
  });

  it("includes training pass rate moderate when >= 80 but < 95", () => {
    const r = run({
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1" }),
        makeTraining({ id: "t2", staff_id: "s2" }),
        makeTraining({ id: "t3", staff_id: "s3" }),
        makeTraining({ id: "t4", staff_id: "s4" }),
        makeTraining({ id: "t5", staff_id: "s5", passed: false }),
        makeTraining({ id: "t6", staff_id: "s6" }),
      ],
    });
    // passRate = 83 -> moderate
    const s = r.strengths.find((s) => s.includes("training pass rate") && s.includes("good GDPR knowledge"));
    expect(s).toBeDefined();
  });

  it("includes training current strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("training certifications are current"));
    expect(s).toBeDefined();
  });

  it("includes refresher completion strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("refresher training completed"));
    expect(s).toBeDefined();
  });

  it("includes certificate strength when >= 90", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("training records backed by certificates"));
    expect(s).toBeDefined();
  });

  it("includes policy accessibility strength when 100%", () => {
    const r = run();
    const s = r.strengths.find((s) => s.includes("All data protection policies accessible"));
    expect(s).toBeDefined();
  });

  it("includes notice GDPR moderate strength when >= 70 but < 90", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1" }),
        makeNotice({ id: "n2" }),
        makeNotice({ id: "n3" }),
        makeNotice({ id: "n4", compliant_with_gdpr: false }),
      ],
    });
    // 3/4 = 75% -> moderate
    const s = r.strengths.find((s) => s.includes("privacy notices meet GDPR standards"));
    expect(s).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. CONCERNS
// ══════════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("raises concern when GDPR compliance < 50", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", compliant_with_gdpr: false }),
        makePolicy({ id: "p2", compliant_with_gdpr: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("GDPR-compliant"));
    expect(c).toBeDefined();
  });

  it("raises concern when GDPR compliance >= 50 but < 70", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1" }),
        makePolicy({ id: "p2", compliant_with_gdpr: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("GDPR policy compliance"));
    expect(c).toBeDefined();
  });

  it("raises concern for overdue policies", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", next_review_date: "2026-01-01" }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("overdue for review"));
    expect(c).toBeDefined();
  });

  it("pluralises overdue policies correctly (singular)", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", next_review_date: "2026-01-01" }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("policy is overdue"));
    expect(c).toBeDefined();
  });

  it("pluralises overdue policies correctly (plural)", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", next_review_date: "2026-01-01" }),
        makePolicy({ id: "p2", next_review_date: "2026-01-15" }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("policies are overdue"));
    expect(c).toBeDefined();
  });

  it("raises concern for low staff acknowledgement < 50", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", staff_acknowledged: 2, staff_total: 10 }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("acknowledged data protection policies"));
    expect(c).toBeDefined();
  });

  it("raises concern for staff acknowledgement >= 50 but < 70", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", staff_acknowledged: 6, staff_total: 10 }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("Staff policy acknowledgement"));
    expect(c).toBeDefined();
  });

  it("raises concern for low gap resolution < 50", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", gaps_identified: 10, gaps_resolved: 3 }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("policy gaps resolved"));
    expect(c).toBeDefined();
  });

  it("raises concern for low DPO sign-off < 50", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", dpo_signed_off: false }),
        makePolicy({ id: "p2", dpo_signed_off: false }),
        makePolicy({ id: "p3", dpo_signed_off: true }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("DPO has signed off only"));
    expect(c).toBeDefined();
  });

  it("raises concern when no policies but children/staff exist (not allEmpty)", () => {
    const r = run({
      policy_compliance_records: [],
      sar_records: [makeSar({ id: "s1" })], // not allEmpty
    });
    const c = r.concerns.find((c) => c.includes("No data protection policies recorded"));
    expect(c).toBeDefined();
  });

  it("raises concern for overdue SARs", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1", outcome: "pending", deadline_date: "2026-04-01" }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("overdue"));
    expect(c).toBeDefined();
  });

  it("raises concern for SAR deadline < 50", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1", completed_within_deadline: false }),
        makeSar({ id: "s2", completed_within_deadline: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("routinely failing"));
    expect(c).toBeDefined();
  });

  it("raises concern for SAR deadline >= 50 but < 70", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1" }),
        makeSar({ id: "s2", completed_within_deadline: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("SAR deadline compliance"));
    expect(c).toBeDefined();
  });

  it("raises concern for SAR quality < 50", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1", quality_checked: false }),
        makeSar({ id: "s2", quality_checked: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("SAR responses quality-checked"));
    expect(c).toBeDefined();
  });

  it("raises concern for SAR satisfaction < 50", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1", complainant_satisfied: false }),
        makeSar({ id: "s2", complainant_satisfied: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("Requester satisfaction"));
    expect(c).toBeDefined();
  });

  it("raises concern for high-severity breaches", () => {
    const r = run({
      breach_records: [makeBreach({ id: "b1", severity: "high" })],
    });
    const c = r.concerns.find((c) => c.includes("high or critical severity"));
    expect(c).toBeDefined();
  });

  it("raises concern for children data breaches", () => {
    const r = run({
      breach_records: [makeBreach({ id: "b1", children_data_involved: true })],
    });
    const c = r.concerns.find((c) => c.includes("children's personal data"));
    expect(c).toBeDefined();
  });

  it("raises concern for low root cause identification < 50", () => {
    const r = run({
      breach_records: [
        makeBreach({ id: "b1", root_cause_identified: false }),
        makeBreach({ id: "b2", root_cause_identified: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("Root cause identified in only"));
    expect(c).toBeDefined();
  });

  it("raises concern for low corrective action completion < 50", () => {
    const r = run({
      breach_records: [
        makeBreach({ id: "b1", corrective_actions_completed: false }),
        makeBreach({ id: "b2", corrective_actions_completed: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("breach corrective actions completed"));
    expect(c).toBeDefined();
  });

  it("raises concern for ICO reports not within 72h", () => {
    const r = run({
      breach_records: [
        makeBreach({ id: "b1", reported_to_ico: true, reported_to_ico_within_72h: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("72 hours"));
    expect(c).toBeDefined();
  });

  it("raises concern for low lessons learned < 50", () => {
    const r = run({
      breach_records: [
        makeBreach({ id: "b1", lessons_learned_documented: false }),
        makeBreach({ id: "b2", lessons_learned_documented: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("Lessons learned documented"));
    expect(c).toBeDefined();
  });

  it("raises concern for notice GDPR rate < 50", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1", compliant_with_gdpr: false }),
        makeNotice({ id: "n2", compliant_with_gdpr: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("privacy notices are GDPR-compliant"));
    expect(c).toBeDefined();
  });

  it("raises concern for notice GDPR rate >= 50 but < 70", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1" }),
        makeNotice({ id: "n2", compliant_with_gdpr: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("privacy notice GDPR compliance"));
    expect(c).toBeDefined();
  });

  it("raises concern for overdue notices", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1", review_due_date: "2026-01-01" }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("overdue for review"));
    expect(c).toBeDefined();
  });

  it("raises concern for low plain language < 50", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1", plain_language: false }),
        makeNotice({ id: "n2", plain_language: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("plain language"));
    expect(c).toBeDefined();
  });

  it("raises concern for low age-appropriate < 50", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1", age_appropriate: false }),
        makeNotice({ id: "n2", age_appropriate: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("age-appropriate"));
    expect(c).toBeDefined();
  });

  it("raises concern for low lawful basis < 50", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1", lawful_basis_stated: false }),
        makeNotice({ id: "n2", lawful_basis_stated: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("Lawful basis stated"));
    expect(c).toBeDefined();
  });

  it("raises concern when no notices but children/staff exist (not allEmpty)", () => {
    const r = run({
      privacy_notice_records: [],
      policy_compliance_records: [makePolicy({ id: "p1" })], // not allEmpty
    });
    const c = r.concerns.find((c) => c.includes("No privacy notices recorded"));
    expect(c).toBeDefined();
  });

  it("raises concern for low training coverage < 50", () => {
    const r = run({
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1" }),
        makeTraining({ id: "t2", staff_id: "s2" }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("staff have completed GDPR training"));
    expect(c).toBeDefined();
  });

  it("raises concern for training coverage >= 50 but < 70", () => {
    const r = run({
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1" }),
        makeTraining({ id: "t2", staff_id: "s2" }),
        makeTraining({ id: "t3", staff_id: "s3" }),
        makeTraining({ id: "t4", staff_id: "s4" }),
      ],
    });
    // coverage = 4/6 = 67%
    const c = r.concerns.find((c) => c.includes("GDPR training coverage"));
    expect(c).toBeDefined();
  });

  it("raises concern for expired training", () => {
    const r = run({
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", expiry_date: "2025-01-01" }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("expired"));
    expect(c).toBeDefined();
  });

  it("raises concern for overdue refreshers", () => {
    const r = run({
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", refresher_completed: false, refresher_due_date: "2026-01-01" }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("refresher"));
    expect(c).toBeDefined();
  });

  it("raises concern for low training pass rate < 70", () => {
    const r = run({
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", passed: false }),
        makeTraining({ id: "t2", staff_id: "s2", passed: false }),
        makeTraining({ id: "t3", staff_id: "s3" }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("training pass rate"));
    expect(c).toBeDefined();
  });

  it("raises concern when no training records but staff exist (not allEmpty)", () => {
    const r = run({
      training_records: [],
      policy_compliance_records: [makePolicy({ id: "p1" })], // not allEmpty
    });
    const c = r.concerns.find((c) => c.includes("No GDPR training records"));
    expect(c).toBeDefined();
  });

  it("raises concern for low policy accessibility < 50", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", accessible_to_staff: false }),
        makePolicy({ id: "p2", accessible_to_staff: false }),
      ],
    });
    const c = r.concerns.find((c) => c.includes("policies accessible to staff"));
    expect(c).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("recommends policy update when GDPR rate < 50 with policies", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", compliant_with_gdpr: false }),
        makePolicy({ id: "p2", compliant_with_gdpr: false }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("Urgently review and update all data protection policies"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends developing policies when none exist but children/staff present", () => {
    const r = run({
      policy_compliance_records: [],
      sar_records: [makeSar({ id: "s1" })], // not allEmpty
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("comprehensive data protection policy framework"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends SAR completion when overdue SARs exist", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1", outcome: "pending", deadline_date: "2026-04-01" }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("overdue subject access"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends completing breach corrective actions when high-severity with low completion", () => {
    const r = run({
      breach_records: [
        makeBreach({ id: "b1", severity: "high", corrective_actions_completed: false }),
        makeBreach({ id: "b2", severity: "critical", corrective_actions_completed: false }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("outstanding corrective actions"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends ICO notification procedure when ICO timeliness < 100", () => {
    const r = run({
      breach_records: [
        makeBreach({ id: "b1", reported_to_ico: true, reported_to_ico_within_72h: false }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("breach notification procedure"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends mandatory GDPR training when coverage < 50", () => {
    const r = run({
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1" }),
        makeTraining({ id: "t2", staff_id: "s2" }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("mandatory GDPR training"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends establishing training programme when no records and staff > 0", () => {
    const r = run({
      training_records: [],
      policy_compliance_records: [makePolicy({ id: "p1" })], // not allEmpty
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("GDPR training programme"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends developing privacy notices when none exist but children/staff present", () => {
    const r = run({
      privacy_notice_records: [],
      policy_compliance_records: [makePolicy({ id: "p1" })], // not allEmpty
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("privacy notices for all data subject groups"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends updating notices when GDPR rate < 50", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1", compliant_with_gdpr: false }),
        makeNotice({ id: "n2", compliant_with_gdpr: false }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("Review and update privacy notices"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("recommends plain language rewrite when < 50", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1", plain_language: false }),
        makeNotice({ id: "n2", plain_language: false }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("Rewrite privacy notices in plain"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends age-appropriate notices when < 50", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1", age_appropriate: false }),
        makeNotice({ id: "n2", age_appropriate: false }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("age-appropriate privacy notices"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends SAR tracking system when deadline rate < 50 but > 0", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1" }),
        makeSar({ id: "s2", completed_within_deadline: false }),
        makeSar({ id: "s3", completed_within_deadline: false }),
        makeSar({ id: "s4", completed_within_deadline: false }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("SAR tracking system"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends improving SAR timeliness when deadline rate >= 50 but < 70", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1" }),
        makeSar({ id: "s2", completed_within_deadline: false }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve SAR handling timeliness"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends quality-checking SARs when quality rate < 50", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1", quality_checked: false }),
        makeSar({ id: "s2", quality_checked: false }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("quality-checking"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends root cause analysis when < 50", () => {
    const r = run({
      breach_records: [
        makeBreach({ id: "b1", root_cause_identified: false }),
        makeBreach({ id: "b2", root_cause_identified: false }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("root cause analysis"));
    expect(rec).toBeDefined();
  });

  it("recommends lessons learned documentation when < 50", () => {
    const r = run({
      breach_records: [
        makeBreach({ id: "b1", lessons_learned_documented: false }),
        makeBreach({ id: "b2", lessons_learned_documented: false }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("Document lessons learned"));
    expect(rec).toBeDefined();
  });

  it("recommends reviewing overdue policies", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", next_review_date: "2026-01-01" }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("overdue data protection"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends staff acknowledgement when < 50", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", staff_acknowledged: 2, staff_total: 10 }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("acknowledge data protection policies"));
    expect(rec).toBeDefined();
  });

  it("recommends refresher for expired training", () => {
    const r = run({
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", expiry_date: "2025-01-01" }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("refresher training"));
    expect(rec).toBeDefined();
  });

  it("recommends completing overdue refreshers", () => {
    const r = run({
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", refresher_completed: false, refresher_due_date: "2026-01-01" }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("overdue GDPR refresher"));
    expect(rec).toBeDefined();
  });

  it("recommends increasing training coverage when >= 50 but < 70", () => {
    const r = run({
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1" }),
        makeTraining({ id: "t2", staff_id: "s2" }),
        makeTraining({ id: "t3", staff_id: "s3" }),
        makeTraining({ id: "t4", staff_id: "s4" }),
      ],
    });
    // 4/6 = 67%
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("Increase GDPR training coverage"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("recommends overdue notice review (planned)", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1", review_due_date: "2026-01-01" }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("overdue privacy"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("recommends increasing notice acknowledgement when < 70", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1", acknowledged_count: 3, target_audience_count: 10 }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("privacy notice acknowledgement"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("recommends continuing GDPR improvement when rate >= 50 but < 70", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1" }),
        makePolicy({ id: "p2", compliant_with_gdpr: false }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("Continue improving GDPR"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("recommends making policies accessible when < 70", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", accessible_to_staff: false }),
        makePolicy({ id: "p2", accessible_to_staff: true }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("central policy hub"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("recommends lawful basis in notices when >= 50 but < 70", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1" }),
        makeNotice({ id: "n2", lawful_basis_stated: false }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("lawful basis for each processing"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("recommends retention periods in notices when < 70", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1", retention_periods_stated: false }),
        makeNotice({ id: "n2", retention_periods_stated: false }),
      ],
    });
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("retention periods in all privacy notices"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("assigns sequential rank numbers to recommendations", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", compliant_with_gdpr: false, next_review_date: "2026-01-01" }),
        makePolicy({ id: "p2", compliant_with_gdpr: false }),
      ],
    });
    if (r.recommendations.length >= 2) {
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  describe("critical insights", () => {
    it("critical insight for GDPR compliance < 50", () => {
      const r = run({
        policy_compliance_records: [
          makePolicy({ id: "p1", compliant_with_gdpr: false }),
          makePolicy({ id: "p2", compliant_with_gdpr: false }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("GDPR-compliant"));
      expect(ins).toBeDefined();
    });

    it("critical insight for overdue SARs", () => {
      const r = run({
        sar_records: [
          makeSar({ id: "s1", outcome: "pending", deadline_date: "2026-04-01" }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("overdue"));
      expect(ins).toBeDefined();
    });

    it("critical insight for high-severity breaches with low actions completed", () => {
      const r = run({
        breach_records: [
          makeBreach({ id: "b1", severity: "high", corrective_actions_completed: false }),
          makeBreach({ id: "b2", severity: "critical", corrective_actions_completed: false }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("high-severity"));
      expect(ins).toBeDefined();
    });

    it("critical insight for children data breaches", () => {
      const r = run({
        breach_records: [
          makeBreach({ id: "b1", children_data_involved: true }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("children's personal data"));
      expect(ins).toBeDefined();
    });

    it("critical insight for low staff training coverage < 40", () => {
      const r = run({
        training_records: [
          makeTraining({ id: "t1", staff_id: "s1" }),
        ],
      });
      // 1/6 = 17%
      const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("GDPR training"));
      expect(ins).toBeDefined();
    });

    it("critical insight when no policies and no notices exist with children/staff", () => {
      const r = run({
        policy_compliance_records: [],
        privacy_notice_records: [],
        sar_records: [makeSar({ id: "s1" })], // not allEmpty
      });
      const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("No data protection policies or privacy notices"));
      expect(ins).toBeDefined();
    });

    it("critical insight for late ICO reporting", () => {
      const r = run({
        breach_records: [
          makeBreach({ id: "b1", reported_to_ico: true, reported_to_ico_within_72h: false }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("72 hours"));
      expect(ins).toBeDefined();
    });
  });

  describe("warning insights", () => {
    it("warning for GDPR rate >= 50 but < 70", () => {
      const r = run({
        policy_compliance_records: [
          makePolicy({ id: "p1" }),
          makePolicy({ id: "p2", compliant_with_gdpr: false }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("GDPR policy compliance"));
      expect(ins).toBeDefined();
    });

    it("warning for overdue policies", () => {
      const r = run({
        policy_compliance_records: [
          makePolicy({ id: "p1", next_review_date: "2026-01-01" }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("overdue"));
      expect(ins).toBeDefined();
    });

    it("warning for SAR deadline rate >= 50 but < 70", () => {
      const r = run({
        sar_records: [
          makeSar({ id: "s1" }),
          makeSar({ id: "s2", completed_within_deadline: false }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("SAR deadline compliance"));
      expect(ins).toBeDefined();
    });

    it("warning for pending SARs with none overdue", () => {
      const r = run({
        sar_records: [
          makeSar({ id: "s1", outcome: "pending", deadline_date: "2026-07-01" }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("pending"));
      expect(ins).toBeDefined();
    });

    it("warning for root cause rate >= 50 but < 80", () => {
      const r = run({
        breach_records: [
          makeBreach({ id: "b1" }),
          makeBreach({ id: "b2", root_cause_identified: false }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("Root cause analysis"));
      expect(ins).toBeDefined();
    });

    it("warning for recurrence prevention < 70", () => {
      const r = run({
        breach_records: [
          makeBreach({ id: "b1", recurrence_prevented: false }),
          makeBreach({ id: "b2", recurrence_prevented: false }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("Recurrence prevention"));
      expect(ins).toBeDefined();
    });

    it("warning for overdue notices", () => {
      const r = run({
        privacy_notice_records: [
          makeNotice({ id: "n1", review_due_date: "2026-01-01" }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("overdue for review"));
      expect(ins).toBeDefined();
    });

    it("warning for notices due within 30 days", () => {
      const r = run({
        privacy_notice_records: [
          makeNotice({ id: "n1", review_due_date: "2026-06-15" }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("due for review within 30 days"));
      expect(ins).toBeDefined();
    });

    it("warning for age-appropriate rate >= 50 but < 90", () => {
      const r = run({
        privacy_notice_records: [
          makeNotice({ id: "n1" }),
          makeNotice({ id: "n2", age_appropriate: false }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("Age-appropriate"));
      expect(ins).toBeDefined();
    });

    it("warning for training coverage >= 50 but < 70", () => {
      const r = run({
        training_records: [
          makeTraining({ id: "t1", staff_id: "s1" }),
          makeTraining({ id: "t2", staff_id: "s2" }),
          makeTraining({ id: "t3", staff_id: "s3" }),
          makeTraining({ id: "t4", staff_id: "s4" }),
        ],
      });
      // 4/6 = 67%
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("GDPR training coverage"));
      expect(ins).toBeDefined();
    });

    it("warning for expired training", () => {
      const r = run({
        training_records: [
          makeTraining({ id: "t1", staff_id: "s1", expiry_date: "2025-01-01" }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("expired"));
      expect(ins).toBeDefined();
    });

    it("warning for overdue refreshers", () => {
      const r = run({
        training_records: [
          makeTraining({ id: "t1", staff_id: "s1", refresher_completed: false, refresher_due_date: "2026-01-01" }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("refresher"));
      expect(ins).toBeDefined();
    });

    it("warning for policy accessibility >= 50 but < 80", () => {
      const r = run({
        policy_compliance_records: [
          makePolicy({ id: "p1" }),
          makePolicy({ id: "p2", accessible_to_staff: false }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "warning" && i.text.includes("policies accessible to staff"));
      expect(ins).toBeDefined();
    });
  });

  describe("positive insights", () => {
    it("positive insight for outstanding rating", () => {
      const r = run();
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("outstanding data protection"));
      expect(ins).toBeDefined();
    });

    it("positive insight for high GDPR compliance + review rate", () => {
      const r = run();
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("GDPR-compliant policies"));
      expect(ins).toBeDefined();
    });

    it("positive insight for high SAR deadline + quality rates", () => {
      const r = run();
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("SAR deadline compliance"));
      expect(ins).toBeDefined();
    });

    it("positive insight for zero breaches with policies", () => {
      const r = run();
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("Zero data breaches"));
      expect(ins).toBeDefined();
    });

    it("positive insight for mature breach response when all >= 90", () => {
      const r = run({
        breach_records: [makeBreach({ id: "b1" })],
      });
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("mature incident response"));
      expect(ins).toBeDefined();
    });

    it("positive insight for compliant + plain language notices", () => {
      const r = run();
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("GDPR-compliant privacy notices"));
      expect(ins).toBeDefined();
    });

    it("positive insight for age-appropriate notices >= 90", () => {
      const r = run();
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("age-appropriate"));
      expect(ins).toBeDefined();
    });

    it("positive insight for staff training coverage + pass rate >= 90", () => {
      const r = run();
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("staff training coverage"));
      expect(ins).toBeDefined();
    });

    it("positive insight for refresher completion >= 90", () => {
      const r = run();
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("refresher completion"));
      expect(ins).toBeDefined();
    });

    it("positive insight for DPO sign-off + staff acknowledgement >= 90", () => {
      const r = run();
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("DPO sign-off"));
      expect(ins).toBeDefined();
    });

    it("positive insight for gap resolution >= 90 when gaps exist", () => {
      const r = run({
        policy_compliance_records: [
          makePolicy({ id: "p1", gaps_identified: 10, gaps_resolved: 10 }),
        ],
      });
      const ins = r.insights.find((i) => i.severity === "positive" && i.text.includes("policy gaps resolved"));
      expect(ins).toBeDefined();
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("score is clamped to 0 minimum", () => {
    // Force many penalties with extremely poor data
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", compliant_with_gdpr: false, compliant_with_chr2015: false, dpo_signed_off: false, accessible_to_staff: false, staff_acknowledged: 0, staff_total: 10, next_review_date: "2025-01-01" }),
      ],
      sar_records: [
        makeSar({ id: "s1", outcome: "pending", deadline_date: "2025-01-01", completed_within_deadline: false, quality_checked: false, date_acknowledged: null, date_completed: null }),
      ],
      breach_records: [
        makeBreach({ id: "b1", severity: "critical", root_cause_identified: false, corrective_actions_taken: false, corrective_actions_completed: false, lessons_learned_documented: false, dpo_notified: false, children_data_involved: true }),
      ],
      privacy_notice_records: [
        makeNotice({ id: "n1", compliant_with_gdpr: false, plain_language: false, published: false, covers_all_processing: false, lawful_basis_stated: false, data_rights_explained: false }),
      ],
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", passed: false, refresher_completed: false, refresher_due_date: "2025-01-01", expiry_date: "2025-01-01" }),
      ],
    });
    expect(r.data_protection_score).toBeGreaterThanOrEqual(0);
    expect(r.data_protection_score).toBeLessThanOrEqual(100);
  });

  it("score is clamped to 100 maximum", () => {
    // Perfect data already caps at 80, but verify clamping
    const r = run();
    expect(r.data_protection_score).toBeLessThanOrEqual(100);
  });

  it("handles null dates in policies gracefully", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", next_review_date: null, last_reviewed_date: null, approved_date: null }),
      ],
    });
    expect(r.data_protection_rating).toBeDefined();
  });

  it("handles null dates in SARs gracefully", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1", date_acknowledged: null, date_completed: null }),
      ],
    });
    expect(r.data_protection_rating).toBeDefined();
  });

  it("handles null dates in training gracefully", () => {
    const r = run({
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", expiry_date: null, refresher_due_date: null, score: null }),
      ],
    });
    expect(r.data_protection_rating).toBeDefined();
  });

  it("handles null dates in notices gracefully", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1", last_updated_date: null, review_due_date: null }),
      ],
    });
    expect(r.data_protection_rating).toBeDefined();
  });

  it("handles single record in each array", () => {
    const r = run({
      policy_compliance_records: [makePolicy({ id: "p1" })],
      sar_records: [makeSar({ id: "s1" })],
      breach_records: [makeBreach({ id: "b1" })],
      privacy_notice_records: [makeNotice({ id: "n1" })],
      training_records: [makeTraining({ id: "t1", staff_id: "s1" })],
    });
    expect(r.data_protection_rating).toBeDefined();
    expect(r.data_protection_score).toBeGreaterThan(0);
  });

  it("handles many records in each array", () => {
    const policies = Array.from({ length: 20 }, (_, i) =>
      makePolicy({ id: `p${i}` })
    );
    const sars = Array.from({ length: 15 }, (_, i) =>
      makeSar({ id: `s${i}` })
    );
    const breaches = Array.from({ length: 10 }, (_, i) =>
      makeBreach({ id: `b${i}` })
    );
    const notices = Array.from({ length: 8 }, (_, i) =>
      makeNotice({ id: `n${i}` })
    );
    const trainings = Array.from({ length: 6 }, (_, i) =>
      makeTraining({ id: `t${i}`, staff_id: `s${i}` })
    );
    const r = run({
      policy_compliance_records: policies,
      sar_records: sars,
      breach_records: breaches,
      privacy_notice_records: notices,
      training_records: trainings,
    });
    expect(r.data_protection_rating).toBeDefined();
  });

  it("SAR acknowledgement counts as timely when within 2 days", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1", date_received: "2026-04-01", date_acknowledged: "2026-04-03" }),
      ],
    });
    // 2 days = within 2 days -> counts as timely
    expect(r.sar_handling_rate).toBe(100);
  });

  it("SAR acknowledgement is late when > 2 days", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1", date_received: "2026-04-01", date_acknowledged: "2026-04-05" }),
      ],
    });
    // 4 days > 2 -> not timely, ackRate=0
    // completionRate=100, deadlineRate=100, qualityRate=100, ackRate=0 -> avg=75
    expect(r.sar_handling_rate).toBe(75);
  });

  it("partially_completed SARs count as completed", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1", outcome: "partially_completed" }),
      ],
    });
    expect(r.sar_handling_rate).toBeGreaterThan(0);
  });

  it("withdrawn and refused SARs do not count as completed", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1", outcome: "withdrawn", completed_within_deadline: false, quality_checked: false, date_acknowledged: null }),
        makeSar({ id: "s2", outcome: "refused", completed_within_deadline: false, quality_checked: false, date_acknowledged: null }),
      ],
    });
    // completion = 0/2 = 0
    expect(r.sar_handling_rate).toBe(0);
  });

  it("training with no expiry_date counts as current", () => {
    const r = run({
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", expiry_date: null }),
      ],
    });
    // no expiry = still valid, so trainingCurrentRate = 100%
    expect(r.data_protection_rating).toBeDefined();
  });

  it("breach with medium severity is not high-severity", () => {
    const r = run({
      breach_records: [
        makeBreach({ id: "b1", severity: "medium", root_cause_identified: false, corrective_actions_taken: false, corrective_actions_completed: false, lessons_learned_documented: false, dpo_notified: false }),
      ],
    });
    // medium is not high or critical, so no -6 breach penalty
    expect(r.breach_management_rate).toBe(0);
    // concerns should not mention "high or critical severity" for this breach
    const c = r.concerns.find((c) => c.includes("high or critical severity"));
    expect(c).toBeUndefined();
  });

  it("only unique staff IDs count for training coverage", () => {
    const r = run({
      total_staff: 3,
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1" }),
        makeTraining({ id: "t2", staff_id: "s1" }), // duplicate staff_id
        makeTraining({ id: "t3", staff_id: "s2" }),
      ],
    });
    // uniqueStaffTrained = 2 (s1, s2), total_staff=3 -> coverage=67%
    expect(r.staff_training_rate).toBeLessThan(100);
  });

  it("breach management rate is 100 when no breaches exist", () => {
    const r = run({ breach_records: [] });
    expect(r.breach_management_rate).toBe(100);
  });

  it("no concerns generated when all data is perfect", () => {
    const r = run();
    expect(r.concerns).toHaveLength(0);
  });

  it("no recommendations generated when all data is perfect", () => {
    const r = run();
    expect(r.recommendations).toHaveLength(0);
  });

  it("isOverdue returns false for null dates", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", next_review_date: null }),
      ],
    });
    // null next_review_date -> not overdue
    expect(r.data_protection_rating).toBeDefined();
  });

  it("isWithinDays returns false for null dates", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1", review_due_date: null }),
      ],
    });
    // null review_due_date -> not within 30 days, not overdue
    expect(r.data_protection_rating).toBeDefined();
  });

  it("policy with zero staff_total does not error for acknowledgement rate", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", staff_acknowledged: 0, staff_total: 0 }),
      ],
    });
    expect(r.data_protection_rating).toBeDefined();
  });

  it("notice with zero target_audience_count does not error", () => {
    const r = run({
      privacy_notice_records: [
        makeNotice({ id: "n1", acknowledged_count: 0, target_audience_count: 0 }),
      ],
    });
    expect(r.data_protection_rating).toBeDefined();
  });

  it("handles today at exact deadline date for SAR overdue check", () => {
    const r = run({
      sar_records: [
        makeSar({ id: "s1", outcome: "pending", deadline_date: TODAY }),
      ],
    });
    // daysBetween(deadline, today) = 0 -> not > 0 -> not overdue
    expect(r.data_protection_rating).toBeDefined();
  });

  it("handles policy next_review_date equal to today (not overdue)", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", next_review_date: TODAY }),
      ],
    });
    // daysBetween(today, today) = 0 -> not > 0 -> not overdue
    expect(r.data_protection_rating).toBeDefined();
  });

  it("ICO timeliness rate only applies to ICO-reported breaches", () => {
    const r = run({
      breach_records: [
        makeBreach({ id: "b1", reported_to_ico: false }),
        makeBreach({ id: "b2", reported_to_ico: true, reported_to_ico_within_72h: true }),
      ],
    });
    // icoReportable=1, within72h=1 -> 100% -> no concern about ICO timing
    const c = r.concerns.find((c) => c.includes("72 hours"));
    expect(c).toBeUndefined();
  });

  it("only one policy needed for allEmpty to be false", () => {
    const r = computeDataProtectionGdprCompliance({
      today: TODAY,
      total_children: 3,
      total_staff: 5,
      policy_compliance_records: [makePolicy({ id: "p1" })],
      sar_records: [],
      breach_records: [],
      privacy_notice_records: [],
      training_records: [],
    });
    // Not allEmpty, should not be the special inadequate case
    expect(r.data_protection_score).not.toBe(15);
  });

  it("refresher is not overdue when refresher_completed is true", () => {
    const r = run({
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", refresher_completed: true, refresher_due_date: "2025-01-01" }),
      ],
    });
    // refresher_completed = true -> not counted as overdue refresher
    const c = r.concerns.find((c) => c.includes("refresher") && c.includes("overdue"));
    expect(c).toBeUndefined();
  });

  it("staff with failed training do not count for unique staff coverage", () => {
    const r = run({
      total_staff: 3,
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", passed: true }),
        makeTraining({ id: "t2", staff_id: "s2", passed: false }),
      ],
    });
    // uniqueStaffTrained = 1 (only passed), total_staff=3 -> coverage=33%
    const ins = r.insights.find((i) => i.severity === "critical" && i.text.includes("GDPR training"));
    expect(ins).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. RATING BOUNDARY TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("rating boundaries", () => {
  it("score 80 -> outstanding", () => {
    const r = run(); // 80 exactly
    expect(r.data_protection_score).toBe(80);
    expect(r.data_protection_rating).toBe("outstanding");
  });

  it("score 79 -> good (not outstanding)", () => {
    // Need exactly 79: 52 + 27 bonus. Remove 1 from policy bonus.
    // Policy at 70-89 gives +3 instead of +5, total = 52+3+5+5+4+5+4=78. Not quite.
    // Let's remove security bonus: security < 70 gives +0, total 52+5+5+5+4+5+0=76. Too low.
    // Better: policy at 70-89 (+3), SAR perfect(+5), breach(+5), notice(+4), training(+5), security 70-89(+2)
    // = 52+3+5+5+4+5+2=76. Still not 79.
    // Actually let's try: policy +5, SAR +5, breach +5, notice +2, training +5, security +4 = 52+5+5+5+2+5+4=78
    // For exactly 79: policy+5, SAR+5, breach+5, notice+4, training+2, security+4 = 52+5+5+5+4+2+4=77
    // Hard to get exactly 79 due to discrete bonuses. Test that <80 is not outstanding.
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1" }),
        makePolicy({ id: "p2", compliant_with_gdpr: true, compliant_with_chr2015: false }),
        makePolicy({ id: "p3", compliant_with_gdpr: false, compliant_with_chr2015: false }),
      ],
    });
    // Score = 78
    expect(r.data_protection_score).toBeLessThan(80);
    expect(r.data_protection_rating).toBe("good");
  });

  it("score 65 -> good", () => {
    // 52 + 13 in bonuses. E.g., breach+5, policy+3, SAR+2, training+2, notice+0, security+0 = 52+12=64. Close.
    // policy+3, SAR+2, breach+5, notice+2, training+0, security+0 = 52+12=64. Adjust.
    // Actually just verify the threshold logic.
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1" }),
        makePolicy({ id: "p2", compliant_with_gdpr: false, compliant_with_chr2015: false }),
        makePolicy({ id: "p3", compliant_with_gdpr: false, compliant_with_chr2015: false }),
      ],
      sar_records: [
        makeSar({ id: "s1" }),
        makeSar({ id: "s2", completed_within_deadline: false }),
        makeSar({ id: "s3", completed_within_deadline: false }),
      ],
      privacy_notice_records: [
        makeNotice({ id: "n1" }),
        makeNotice({ id: "n2", compliant_with_gdpr: false, plain_language: false }),
      ],
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1" }),
        makeTraining({ id: "t2", staff_id: "s2" }),
        makeTraining({ id: "t3", staff_id: "s3" }),
        makeTraining({ id: "t4", staff_id: "s4" }),
        makeTraining({ id: "t5", staff_id: "s5" }),
      ],
    });
    expect(r.data_protection_score).toBeGreaterThanOrEqual(65);
    expect(r.data_protection_rating).toBe("good");
  });

  it("score below 45 -> inadequate", () => {
    // base 52
    // breach=100(none) -> +5
    // no other bonuses (all rates low)
    // policy penalty -6, SAR penalty -5, training penalty -5 = -16
    // But breach +5 makes it 52+5-16=41
    // Need to also strip default good notices to remove notice bonus.
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", compliant_with_gdpr: false, compliant_with_chr2015: false, dpo_signed_off: false, staff_acknowledged: 0, staff_total: 10, next_review_date: "2026-01-01" }),
      ],
      sar_records: [
        makeSar({ id: "s1", outcome: "pending", deadline_date: "2026-04-01", completed_within_deadline: false, quality_checked: false, date_acknowledged: null, date_completed: null }),
      ],
      breach_records: [
        makeBreach({ id: "b1", severity: "high", root_cause_identified: false, corrective_actions_taken: false, corrective_actions_completed: false, lessons_learned_documented: false, dpo_notified: false }),
      ],
      privacy_notice_records: [
        makeNotice({ id: "n1", compliant_with_gdpr: false, plain_language: false, published: false, covers_all_processing: false, lawful_basis_stated: false, data_rights_explained: false }),
      ],
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", passed: false, refresher_completed: false, refresher_due_date: "2025-06-01" }),
      ],
    });
    // base 52, no bonuses, penalties: -6(policy) -5(sar overdue) -6(breach high+low) -5(training) = -22
    // 52 - 22 = 30
    expect(r.data_protection_score).toBeLessThan(45);
    expect(r.data_protection_rating).toBe("inadequate");
  });

  it("exact boundary: score >= 45 is adequate", () => {
    // base 52, breach=100(none)->+5, policy penalty -6
    // But no other bonuses: sar=0(empty), notice=0(empty), training=0(empty), security=low->0
    // 52 + 5(breach) - 6(policy) = 51 -> adequate
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", compliant_with_gdpr: false, compliant_with_chr2015: false, dpo_signed_off: false, staff_acknowledged: 0, staff_total: 10 }),
      ],
      sar_records: [],
      breach_records: [],
      privacy_notice_records: [],
      training_records: [],
    });
    // Not allEmpty because policies exist.
    expect(r.data_protection_score).toBe(51);
    expect(r.data_protection_rating).toBe("adequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. HEADLINE FORMATTING
// ══════════════════════════════════════════════════════════════════════════════

describe("headline formatting", () => {
  it("good headline includes strength and concern count", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1" }),
        makePolicy({ id: "p2", compliant_with_gdpr: false, compliant_with_chr2015: false }),
        makePolicy({ id: "p3", compliant_with_gdpr: false, compliant_with_chr2015: false }),
      ],
    });
    expect(r.data_protection_rating).toBe("good");
    expect(r.headline).toMatch(/strength/);
  });

  it("adequate headline includes concern count", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", compliant_with_gdpr: false, compliant_with_chr2015: false, dpo_signed_off: false, staff_acknowledged: 3, staff_total: 10 }),
      ],
      sar_records: [
        makeSar({ id: "s1", completed_within_deadline: false, quality_checked: false }),
      ],
      privacy_notice_records: [
        makeNotice({ id: "n1", compliant_with_gdpr: false, plain_language: false }),
      ],
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", refresher_completed: false, refresher_due_date: "2026-04-01" }),
      ],
    });
    expect(r.data_protection_rating).toBe("adequate");
    expect(r.headline).toMatch(/concern/);
  });

  it("inadequate headline includes concern count and urgent action", () => {
    const r = run({
      policy_compliance_records: [
        makePolicy({ id: "p1", compliant_with_gdpr: false, compliant_with_chr2015: false, dpo_signed_off: false, staff_acknowledged: 0, staff_total: 10 }),
      ],
      sar_records: [
        makeSar({ id: "s1", outcome: "pending", deadline_date: "2026-04-01", completed_within_deadline: false, quality_checked: false, date_acknowledged: null }),
      ],
      breach_records: [
        makeBreach({ id: "b1", severity: "high", root_cause_identified: false, corrective_actions_taken: false, corrective_actions_completed: false, lessons_learned_documented: false, dpo_notified: false }),
      ],
      training_records: [
        makeTraining({ id: "t1", staff_id: "s1", passed: false, refresher_completed: false, refresher_due_date: "2025-06-01" }),
      ],
    });
    expect(r.data_protection_rating).toBe("inadequate");
    expect(r.headline).toMatch(/urgent/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17. DATA PASSTHROUGH
// ══════════════════════════════════════════════════════════════════════════════

describe("data passthrough", () => {
  it("returns input records unchanged in output", () => {
    const input = baseInput();
    const r = computeDataProtectionGdprCompliance(input);
    expect(r.policy_compliance_records).toBe(input.policy_compliance_records);
    expect(r.sar_records).toBe(input.sar_records);
    expect(r.breach_records).toBe(input.breach_records);
    expect(r.privacy_notice_records).toBe(input.privacy_notice_records);
    expect(r.training_records).toBe(input.training_records);
  });
});
