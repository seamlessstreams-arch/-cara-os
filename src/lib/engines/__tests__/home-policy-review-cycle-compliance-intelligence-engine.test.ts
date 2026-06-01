// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME POLICY REVIEW CYCLE COMPLIANCE INTELLIGENCE ENGINE — TESTS
//
// 180 tests covering: insufficient_data, allEmpty+policies, scoring, rating
// boundaries, review schedule metrics, version control metrics, staff
// acknowledgement metrics, regulatory alignment metrics, accessibility metrics,
// update timeliness, strengths, concerns, recommendations, insights, headline,
// passthrough arrays, category analysis, safeguarding-specific tracking,
// consultation metrics, young-people metrics, edge cases.
// CHR 2015 Reg 36, SCCIF leadership and management.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computePolicyReviewCycleCompliance,
  type PolicyReviewCycleComplianceInput,
  type PolicyReviewScheduleRecordInput,
  type PolicyVersionControlRecordInput,
  type PolicyAcknowledgementRecordInput,
  type PolicyAlignmentRecordInput,
  type PolicyAccessibilityRecordInput,
} from "../home-policy-review-cycle-compliance-intelligence-engine";

// ── Constants ───────────────────────────────────────────────────────────────

const TODAY = "2026-06-01";

// ── Factory Helpers ─────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `rec_${++_id}`;
}

function baseInput(
  overrides: Partial<PolicyReviewCycleComplianceInput> = {},
): PolicyReviewCycleComplianceInput {
  return {
    today: TODAY,
    total_staff: 10,
    total_policies: 20,
    review_schedule_records: [],
    version_control_records: [],
    acknowledgement_records: [],
    alignment_records: [],
    accessibility_records: [],
    ...overrides,
  };
}

function makeReviewSchedule(
  overrides: Partial<PolicyReviewScheduleRecordInput> = {},
): PolicyReviewScheduleRecordInput {
  return {
    id: overrides.id ?? uid(),
    policy_id: "pol_1",
    policy_name: "Test Policy",
    category: "safeguarding",
    last_review_date: "2026-03-01",
    next_review_due: "2026-09-01",
    review_completed: true,
    review_completed_date: "2026-05-15",
    reviewer: "Darren Laville",
    review_outcome: "approved",
    days_overdue: 0,
    review_frequency_months: 6,
    responsible_person: "Darren Laville",
    consultation_undertaken: true,
    young_people_consulted: true,
    notes: null,
    created_at: "2026-03-01",
    ...overrides,
  };
}

function makeVersionControl(
  overrides: Partial<PolicyVersionControlRecordInput> = {},
): PolicyVersionControlRecordInput {
  return {
    id: overrides.id ?? uid(),
    policy_id: "pol_1",
    policy_name: "Test Policy",
    version_number: "2.0",
    previous_version: "1.0",
    change_date: "2026-05-01",
    change_type: "scheduled_review",
    change_summary: "Annual review update",
    approved_by: "Darren Laville",
    approval_date: "2026-05-05",
    superseded_version_archived: true,
    change_log_maintained: true,
    rationale_documented: true,
    effective_date: "2026-05-10",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeAcknowledgement(
  overrides: Partial<PolicyAcknowledgementRecordInput> = {},
): PolicyAcknowledgementRecordInput {
  return {
    id: overrides.id ?? uid(),
    policy_id: "pol_1",
    policy_name: "Test Policy",
    staff_id: "staff_1",
    staff_name: "Staff Member",
    acknowledgement_required_date: "2026-05-01",
    acknowledged: true,
    acknowledgement_date: "2026-05-03",
    comprehension_confirmed: true,
    assessment_passed: true,
    days_to_acknowledge: 2,
    reminder_sent: false,
    version_acknowledged: "2.0",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeAlignment(
  overrides: Partial<PolicyAlignmentRecordInput> = {},
): PolicyAlignmentRecordInput {
  return {
    id: overrides.id ?? uid(),
    policy_id: "pol_1",
    policy_name: "Test Policy",
    regulation_reference: "CHR 2015 Reg 36",
    regulation_description: "Policies for the protection of children",
    alignment_status: "fully_aligned",
    last_alignment_check_date: "2026-05-01",
    gaps_identified: [],
    remediation_actions: [],
    remediation_completed: false,
    legislative_change_tracked: true,
    ofsted_recommendation_addressed: true,
    next_alignment_review_due: "2026-11-01",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeAccessibility(
  overrides: Partial<PolicyAccessibilityRecordInput> = {},
): PolicyAccessibilityRecordInput {
  return {
    id: overrides.id ?? uid(),
    policy_id: "pol_1",
    policy_name: "Test Policy",
    digital_copy_available: true,
    physical_copy_available: true,
    staff_accessible: true,
    young_people_version_available: true,
    easy_read_version_available: true,
    translated_versions_available: true,
    location_documented: true,
    last_accessibility_check_date: "2026-05-01",
    accessibility_issues: [],
    issues_resolved: false,
    created_at: "2026-05-01",
    ...overrides,
  };
}

/** Generate N perfect review schedule records */
function manyReviews(
  n: number,
  overrides: Partial<PolicyReviewScheduleRecordInput> = {},
): PolicyReviewScheduleRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeReviewSchedule({ id: `rev_${i}`, policy_id: `pol_${i}`, ...overrides }),
  );
}

/** Generate N perfect version control records */
function manyVersions(
  n: number,
  overrides: Partial<PolicyVersionControlRecordInput> = {},
): PolicyVersionControlRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeVersionControl({ id: `ver_${i}`, policy_id: `pol_${i}`, ...overrides }),
  );
}

/** Generate N perfect acknowledgement records */
function manyAcks(
  n: number,
  overrides: Partial<PolicyAcknowledgementRecordInput> = {},
): PolicyAcknowledgementRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeAcknowledgement({ id: `ack_${i}`, staff_id: `staff_${i}`, ...overrides }),
  );
}

/** Generate N perfect alignment records */
function manyAlignments(
  n: number,
  overrides: Partial<PolicyAlignmentRecordInput> = {},
): PolicyAlignmentRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeAlignment({ id: `aln_${i}`, policy_id: `pol_${i}`, ...overrides }),
  );
}

/** Generate N perfect accessibility records */
function manyAccess(
  n: number,
  overrides: Partial<PolicyAccessibilityRecordInput> = {},
): PolicyAccessibilityRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeAccessibility({ id: `acc_${i}`, policy_id: `pol_${i}`, ...overrides }),
  );
}

// Helper to build an "outstanding" input — all 100% metrics
function outstandingInput(): PolicyReviewCycleComplianceInput {
  return baseInput({
    review_schedule_records: manyReviews(10),
    version_control_records: manyVersions(10),
    acknowledgement_records: manyAcks(10),
    alignment_records: manyAlignments(10),
    accessibility_records: manyAccess(10),
  });
}

// ═════════════════════════════════════════════════════════════════════════════

describe("computePolicyReviewCycleCompliance", () => {
  // ── 1. Insufficient Data (allEmpty + 0 policies) ──────────────────────

  describe("insufficient data — allEmpty + 0 policies", () => {
    it("returns insufficient_data rating", () => {
      const r = computePolicyReviewCycleCompliance(
        baseInput({ total_policies: 0, review_schedule_records: [], version_control_records: [], acknowledgement_records: [], alignment_records: [], accessibility_records: [] }),
      );
      expect(r.policy_rating).toBe("insufficient_data");
    });

    it("returns score 0", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ total_policies: 0, review_schedule_records: [], version_control_records: [], acknowledgement_records: [], alignment_records: [], accessibility_records: [] }));
      expect(r.policy_score).toBe(0);
    });

    it("returns appropriate headline", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ total_policies: 0, review_schedule_records: [], version_control_records: [], acknowledgement_records: [], alignment_records: [], accessibility_records: [] }));
      expect(r.headline).toContain("insufficient data");
    });

    it("returns all zero totals", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ total_policies: 0, review_schedule_records: [], version_control_records: [], acknowledgement_records: [], alignment_records: [], accessibility_records: [] }));
      expect(r.total_review_records).toBe(0);
      expect(r.total_version_records).toBe(0);
      expect(r.total_acknowledgement_records).toBe(0);
      expect(r.total_alignment_records).toBe(0);
      expect(r.total_accessibility_records).toBe(0);
    });

    it("returns all zero rates", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ total_policies: 0, review_schedule_records: [], version_control_records: [], acknowledgement_records: [], alignment_records: [], accessibility_records: [] }));
      expect(r.review_schedule_rate).toBe(0);
      expect(r.version_control_rate).toBe(0);
      expect(r.staff_acknowledgement_rate).toBe(0);
      expect(r.regulatory_alignment_rate).toBe(0);
      expect(r.accessibility_rate).toBe(0);
      expect(r.update_timeliness_rate).toBe(0);
    });

    it("returns empty arrays", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ total_policies: 0, review_schedule_records: [], version_control_records: [], acknowledgement_records: [], alignment_records: [], accessibility_records: [] }));
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });
  });

  // ── 2. All empty + policies > 0 → inadequate ─────────────────────────

  describe("allEmpty + policies > 0 → inadequate", () => {
    it("returns inadequate rating", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ total_policies: 10 }));
      expect(r.policy_rating).toBe("inadequate");
    });

    it("returns score 15", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ total_policies: 10 }));
      expect(r.policy_score).toBe(15);
    });

    it("headline mentions urgent attention", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ total_policies: 10 }));
      expect(r.headline).toContain("urgent attention");
    });

    it("has one concern about absent data", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ total_policies: 10 }));
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No policy review schedule records");
    });

    it("has two recommendations", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ total_policies: 10 }));
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("has one critical insight", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ total_policies: 10 }));
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("recommendations have correct rank ordering", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ total_policies: 10 }));
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("recommendations reference Reg 36 and SCCIF", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ total_policies: 10 }));
      expect(r.recommendations[0].regulatory_ref).toContain("Reg 36");
      expect(r.recommendations[1].regulatory_ref).toContain("SCCIF");
    });
  });

  // ── 3. Scoring — Base Score ───────────────────────────────────────────

  describe("scoring — base score", () => {
    it("starts at 52 with no bonuses or penalties", () => {
      // All rates at 0 but records exist → no bonus, penalty guards may fire
      // Use 1 record with 0% completion to isolate
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: [makeReviewSchedule({ review_completed: false, days_overdue: 0 })],
        version_control_records: [makeVersionControl({ approval_date: null, superseded_version_archived: false, change_log_maintained: false, rationale_documented: false })],
        acknowledgement_records: [makeAcknowledgement({ acknowledged: false, comprehension_confirmed: false, assessment_passed: null, days_to_acknowledge: 20 })],
        alignment_records: [makeAlignment({ alignment_status: "under_review", legislative_change_tracked: false, ofsted_recommendation_addressed: false })],
        accessibility_records: [makeAccessibility({ digital_copy_available: false, physical_copy_available: false, staff_accessible: false, young_people_version_available: false, easy_read_version_available: false, translated_versions_available: false, location_documented: false })],
      }));
      // base=52, reviewScheduleRate=0<50 → -6, staffAck=0<50 → -5, regAlign=0<40 → -5
      // = 52 - 6 - 5 - 5 = 36
      expect(r.policy_score).toBe(36);
    });
  });

  // ── 4. Scoring — Bonuses ──────────────────────────────────────────────

  describe("scoring — bonuses", () => {
    it("reviewScheduleRate >= 90 adds +5", () => {
      const r = computePolicyReviewCycleCompliance(outstandingInput());
      // All rates >=90 → +5+5+5+5+4+4 = 28 → total 80
      expect(r.policy_score).toBe(80);
    });

    it("reviewScheduleRate 70-89 adds +3", () => {
      // 8 completed, 2 not completed (no overdue) = 80%
      const reviews = [
        ...manyReviews(8),
        ...manyReviews(2, { review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 0, consultation_undertaken: false, young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: reviews,
        version_control_records: manyVersions(10),
        acknowledgement_records: manyAcks(10),
        alignment_records: manyAlignments(10),
        accessibility_records: manyAccess(10),
      }));
      // reviewSchedule=80% → +3, rest >=90 → +5+5+5+4+4 = 23 → total 52+3+23 = 78
      expect(r.policy_score).toBe(78);
    });

    it("versionControlRate >= 90 adds +5", () => {
      // Already covered in outstanding; test lower to verify
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: manyReviews(10),
        version_control_records: manyVersions(10, {
          approval_date: null,
          superseded_version_archived: false,
          change_log_maintained: false,
          rationale_documented: false,
        }),
        acknowledgement_records: manyAcks(10),
        alignment_records: manyAlignments(10),
        accessibility_records: manyAccess(10),
      }));
      // versionControlRate=0 → no bonus, updateTimeliness=0 → no bonus, penalties: vcRate<50 not a penalty directly
      // base=52 +5(review) +0(vc) +5(ack) +5(align) +4(access) +0(timeliness) = 71
      // updateTimelinessRate=0 < 50 concern but no penalty; no vc penalty either
      expect(r.policy_score).toBe(71);
    });

    it("staffAcknowledgementRate 70-89 adds +2", () => {
      const acks = [
        ...manyAcks(8),
        ...manyAcks(2, { acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false, assessment_passed: null, days_to_acknowledge: 20 }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: manyReviews(10),
        version_control_records: manyVersions(10),
        acknowledgement_records: acks,
        alignment_records: manyAlignments(10),
        accessibility_records: manyAccess(10),
      }));
      // ack=80% → +2, rest >=90 → 5+5+5+4+4 = 23, total = 52+23+2 = 77
      expect(r.policy_score).toBe(77);
    });

    it("regulatoryAlignmentRate 70-89 adds +2", () => {
      const alns = [
        ...manyAlignments(8),
        ...manyAlignments(2, { alignment_status: "partially_aligned" }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: manyReviews(10),
        version_control_records: manyVersions(10),
        acknowledgement_records: manyAcks(10),
        alignment_records: alns,
        accessibility_records: manyAccess(10),
      }));
      // align=80% → +2, rest >=90 → 5+5+5+4+4 = 23, total = 52+23+2 = 77
      expect(r.policy_score).toBe(77);
    });

    it("accessibilityRate 70-89 adds +2", () => {
      // 10 records all perfect = 60/60 = 100%. To get 70-89, reduce some checks.
      // Set 3 records with 3/6 checks = 9/60 + 7*6/60 = 9+42=51/60 = 85%
      const acc = [
        ...manyAccess(7),
        ...manyAccess(3, {
          digital_copy_available: true,
          physical_copy_available: true,
          staff_accessible: true,
          young_people_version_available: false,
          easy_read_version_available: false,
          translated_versions_available: false,
          location_documented: false,
        }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: manyReviews(10),
        version_control_records: manyVersions(10),
        acknowledgement_records: manyAcks(10),
        alignment_records: manyAlignments(10),
        accessibility_records: acc,
      }));
      // access = (42+9)/60 = 51/60 = 85% → +2 (not +4)
      // rest >=90 → 5+5+5+5+4 = 24, total = 52+24+2 = 78
      expect(r.policy_score).toBe(78);
    });

    it("updateTimelinessRate >= 90 adds +4", () => {
      // Covered in outstanding; verified through subtraction tests
      const r = computePolicyReviewCycleCompliance(outstandingInput());
      expect(r.policy_score).toBe(80);
    });

    it("updateTimelinessRate 70-89 adds +2", () => {
      // 8 timely (approval within 14 days), 2 slow (approval > 14 days)
      const vcs = [
        ...manyVersions(8),
        ...manyVersions(2, { change_date: "2026-01-01", approval_date: "2026-02-01" }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: manyReviews(10),
        version_control_records: vcs,
        acknowledgement_records: manyAcks(10),
        alignment_records: manyAlignments(10),
        accessibility_records: manyAccess(10),
      }));
      // timeliness=80% → +2. vc composite: all 10 have archived+changeLog+rationale, 10 have approval_date. So 4*10 = 40/40 = 100% → +5.
      // review=100→+5, vc=100→+5, ack=100→+5, align=100→+5, acc=100→+4, timeliness=80→+2 = 52+26=78
      expect(r.policy_score).toBe(78);
    });
  });

  // ── 5. Scoring — Penalties ────────────────────────────────────────────

  describe("scoring — penalties", () => {
    it("reviewScheduleRate < 50 deducts -6", () => {
      const reviews = [
        ...manyReviews(4),
        ...manyReviews(6, { review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10, consultation_undertaken: false, young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: reviews,
        version_control_records: manyVersions(10),
        acknowledgement_records: manyAcks(10),
        alignment_records: manyAlignments(10),
        accessibility_records: manyAccess(10),
      }));
      // reviewRate=40% → no bonus, penalty -6
      // base=52, vc+5, ack+5, align+5, acc+4, timeliness+4 = 75 - 6 = 69
      expect(r.policy_score).toBe(69);
    });

    it("staffAcknowledgementRate < 50 deducts -5", () => {
      const acks = [
        ...manyAcks(4),
        ...manyAcks(6, { acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false, assessment_passed: null, days_to_acknowledge: 20 }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: manyReviews(10),
        version_control_records: manyVersions(10),
        acknowledgement_records: acks,
        alignment_records: manyAlignments(10),
        accessibility_records: manyAccess(10),
      }));
      // ackRate=40% → no bonus, penalty -5
      // base=52, review+5, vc+5, align+5, acc+4, timeliness+4 = 75 - 5 = 70
      expect(r.policy_score).toBe(70);
    });

    it("regulatoryAlignmentRate < 40 deducts -5", () => {
      const alns = [
        ...manyAlignments(3),
        ...manyAlignments(7, { alignment_status: "not_aligned" }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: manyReviews(10),
        version_control_records: manyVersions(10),
        acknowledgement_records: manyAcks(10),
        alignment_records: alns,
        accessibility_records: manyAccess(10),
      }));
      // alignRate=30% → no bonus, penalty -5
      // base=52, review+5, vc+5, ack+5, acc+4, timeliness+4 = 75 - 5 = 70
      expect(r.policy_score).toBe(70);
    });

    it("severelyOverdueRate > 30 deducts -4", () => {
      // 7 completed + 3 severely overdue → reviewScheduleRate=70% → +3, severelyOverdueRate=30% → NOT > 30
      // Use 6 completed + 4 severely overdue → reviewScheduleRate=60% → NO bonus (< 70), severelyOverdueRate=40% → -4
      // Also reviewScheduleRate < 50? No, 60% >=50 → no penalty from that rule
      const reviews = [
        ...manyReviews(6),
        ...manyReviews(4, { review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 100, consultation_undertaken: false, young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: reviews,
        version_control_records: manyVersions(10),
        acknowledgement_records: manyAcks(10),
        alignment_records: manyAlignments(10),
        accessibility_records: manyAccess(10),
      }));
      // reviewRate=60% → no bonus (< 70), severelyOverdueRate=40% > 30 → -4
      // base=52 + 0(review) + 5(vc) + 5(ack) + 5(align) + 4(acc) + 4(timeliness) = 75 - 4 = 71
      expect(r.policy_score).toBe(71);
    });

    it("multiple penalties stack", () => {
      const reviews = manyReviews(10, {
        review_completed: false, review_completed_date: null, review_outcome: "pending",
        days_overdue: 100, consultation_undertaken: false, young_people_consulted: false,
      });
      const acks = manyAcks(10, {
        acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false,
        assessment_passed: null, days_to_acknowledge: 20,
      });
      const alns = manyAlignments(10, { alignment_status: "not_aligned" });
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: reviews,
        version_control_records: manyVersions(10),
        acknowledgement_records: acks,
        alignment_records: alns,
        accessibility_records: manyAccess(10),
      }));
      // reviewRate=0→-6, ack=0→-5, align=0→-5, sevOverdue=100%→-4
      // base=52 +5(vc) +4(acc) +4(timeliness) = 65, -6-5-5-4 = 45
      expect(r.policy_score).toBe(45);
    });

    it("penalty guards: no penalty when 0 records", () => {
      // No review records, no ack records, no alignment records → no penalties even though rates are 0
      // But total_policies>0 and allEmpty=false because we have version + accessibility records
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: [],
        version_control_records: manyVersions(10),
        acknowledgement_records: [],
        alignment_records: [],
        accessibility_records: manyAccess(10),
      }));
      // base=52, vc=100→+5, acc=100→+4, timeliness=100→+4 = 65, no penalties
      expect(r.policy_score).toBe(65);
    });
  });

  // ── 6. Scoring — Clamp ────────────────────────────────────────────────

  describe("scoring — clamp", () => {
    it("score cannot exceed 100", () => {
      const r = computePolicyReviewCycleCompliance(outstandingInput());
      expect(r.policy_score).toBeLessThanOrEqual(100);
    });

    it("score cannot go below 0", () => {
      // Even with all penalties, clamp prevents negative
      const reviews = manyReviews(10, {
        review_completed: false, review_completed_date: null, review_outcome: "pending",
        days_overdue: 100, consultation_undertaken: false, young_people_consulted: false,
      });
      const acks = manyAcks(10, {
        acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false,
        assessment_passed: null, days_to_acknowledge: 20,
      });
      const alns = manyAlignments(10, { alignment_status: "not_aligned" });
      const vcs = manyVersions(10, {
        approval_date: null, superseded_version_archived: false,
        change_log_maintained: false, rationale_documented: false,
      });
      const accs = manyAccess(10, {
        digital_copy_available: false, physical_copy_available: false, staff_accessible: false,
        young_people_version_available: false, easy_read_version_available: false,
        translated_versions_available: false, location_documented: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: reviews,
        version_control_records: vcs,
        acknowledgement_records: acks,
        alignment_records: alns,
        accessibility_records: accs,
      }));
      expect(r.policy_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── 7. Rating Boundaries ──────────────────────────────────────────────

  describe("rating boundaries", () => {
    it("score >= 80 → outstanding", () => {
      const r = computePolicyReviewCycleCompliance(outstandingInput());
      expect(r.policy_score).toBeGreaterThanOrEqual(80);
      expect(r.policy_rating).toBe("outstanding");
    });

    it("score 65-79 → good", () => {
      // Remove some bonuses to land in good range
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: manyReviews(10),
        version_control_records: manyVersions(10),
        acknowledgement_records: manyAcks(10),
        alignment_records: manyAlignments(10),
        accessibility_records: [],
      }));
      // base=52 + review+5 + vc+5 + ack+5 + align+5 + timeliness+4 = 76. no accessibility data
      expect(r.policy_score).toBeGreaterThanOrEqual(65);
      expect(r.policy_score).toBeLessThan(80);
      expect(r.policy_rating).toBe("good");
    });

    it("score 45-64 → adequate", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: [],
        version_control_records: manyVersions(10),
        acknowledgement_records: [],
        alignment_records: [],
        accessibility_records: [],
      }));
      // base=52, vc=100→+5, timeliness=100→+4 = 61. No penalties (no review/ack/align records).
      expect(r.policy_score).toBeGreaterThanOrEqual(45);
      expect(r.policy_score).toBeLessThan(65);
      expect(r.policy_rating).toBe("adequate");
    });

    it("score < 45 → inadequate", () => {
      const reviews = manyReviews(10, {
        review_completed: false, review_completed_date: null, review_outcome: "pending",
        days_overdue: 100, consultation_undertaken: false, young_people_consulted: false,
      });
      const acks = manyAcks(10, {
        acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false,
        assessment_passed: null, days_to_acknowledge: 20,
      });
      const alns = manyAlignments(10, { alignment_status: "not_aligned" });
      const vcs = manyVersions(10, {
        approval_date: null, superseded_version_archived: false,
        change_log_maintained: false, rationale_documented: false,
      });
      const accs = manyAccess(10, {
        digital_copy_available: false, physical_copy_available: false, staff_accessible: false,
        young_people_version_available: false, easy_read_version_available: false,
        translated_versions_available: false, location_documented: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: reviews,
        version_control_records: vcs,
        acknowledgement_records: acks,
        alignment_records: alns,
        accessibility_records: accs,
      }));
      expect(r.policy_score).toBeLessThan(45);
      expect(r.policy_rating).toBe("inadequate");
    });
  });

  // ── 8. Review Schedule Metrics ────────────────────────────────────────

  describe("review schedule metrics", () => {
    it("reviewScheduleRate = pct(completed, total)", () => {
      const reviews = [
        ...manyReviews(7),
        ...manyReviews(3, { review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 0, consultation_undertaken: false, young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.review_schedule_rate).toBe(70);
    });

    it("total_review_records passthrough", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: manyReviews(5) }));
      expect(r.total_review_records).toBe(5);
    });

    it("0 review records → review_schedule_rate = 0", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: [] }));
      expect(r.review_schedule_rate).toBe(0);
    });

    it("100% review completion → rate 100", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: manyReviews(10) }));
      expect(r.review_schedule_rate).toBe(100);
    });
  });

  // ── 9. Version Control Metrics ────────────────────────────────────────

  describe("version control metrics", () => {
    it("perfect version control → 100%", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: manyVersions(10) }));
      expect(r.version_control_rate).toBe(100);
    });

    it("0 version records → 0%", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: [] }));
      expect(r.version_control_rate).toBe(0);
    });

    it("composite considers approved, archived, changeLog, rationale", () => {
      // Only approved_date set, rest false → 10/(10*4) = 25%
      const vcs = manyVersions(10, {
        superseded_version_archived: false,
        change_log_maintained: false,
        rationale_documented: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.version_control_rate).toBe(25);
    });

    it("half of each metric → 50%", () => {
      // 5 approved, 5 archived, 5 changeLog, 5 rationale out of 10 each
      const vcs = [
        ...manyVersions(5),
        ...manyVersions(5, {
          approval_date: null,
          superseded_version_archived: false,
          change_log_maintained: false,
          rationale_documented: false,
        }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.version_control_rate).toBe(50);
    });

    it("total_version_records passthrough", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: manyVersions(7) }));
      expect(r.total_version_records).toBe(7);
    });
  });

  // ── 10. Staff Acknowledgement Metrics ─────────────────────────────────

  describe("staff acknowledgement metrics", () => {
    it("100% acknowledged → 100%", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: manyAcks(10) }));
      expect(r.staff_acknowledgement_rate).toBe(100);
    });

    it("0% acknowledged → 0%", () => {
      const acks = manyAcks(10, { acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false, days_to_acknowledge: 20 });
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.staff_acknowledgement_rate).toBe(0);
    });

    it("partial acknowledgement rate", () => {
      const acks = [
        ...manyAcks(6),
        ...manyAcks(4, { acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false, days_to_acknowledge: 20 }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.staff_acknowledgement_rate).toBe(60);
    });

    it("total_acknowledgement_records passthrough", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: manyAcks(8) }));
      expect(r.total_acknowledgement_records).toBe(8);
    });

    it("0 acknowledgement records → 0% rate", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: [] }));
      expect(r.staff_acknowledgement_rate).toBe(0);
    });
  });

  // ── 11. Regulatory Alignment Metrics ──────────────────────────────────

  describe("regulatory alignment metrics", () => {
    it("100% fully_aligned → 100%", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: manyAlignments(10) }));
      expect(r.regulatory_alignment_rate).toBe(100);
    });

    it("0% aligned → 0%", () => {
      const alns = manyAlignments(10, { alignment_status: "not_aligned" });
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.regulatory_alignment_rate).toBe(0);
    });

    it("partially_aligned not counted as fully_aligned", () => {
      const alns = manyAlignments(10, { alignment_status: "partially_aligned" });
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.regulatory_alignment_rate).toBe(0);
    });

    it("mixed alignment status", () => {
      const alns = [
        ...manyAlignments(5),
        ...manyAlignments(3, { alignment_status: "partially_aligned" }),
        ...manyAlignments(2, { alignment_status: "not_aligned" }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.regulatory_alignment_rate).toBe(50);
    });

    it("total_alignment_records passthrough", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: manyAlignments(12) }));
      expect(r.total_alignment_records).toBe(12);
    });
  });

  // ── 12. Accessibility Metrics ─────────────────────────────────────────

  describe("accessibility metrics", () => {
    it("all 6 checks true → 100%", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: manyAccess(10) }));
      expect(r.accessibility_rate).toBe(100);
    });

    it("all 6 checks false → 0%", () => {
      const accs = manyAccess(10, {
        digital_copy_available: false, physical_copy_available: false,
        staff_accessible: false, young_people_version_available: false,
        easy_read_version_available: false, location_documented: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: accs }));
      expect(r.accessibility_rate).toBe(0);
    });

    it("3/6 checks → 50%", () => {
      const accs = manyAccess(10, {
        digital_copy_available: true, physical_copy_available: true,
        staff_accessible: true, young_people_version_available: false,
        easy_read_version_available: false, location_documented: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: accs }));
      expect(r.accessibility_rate).toBe(50);
    });

    it("translated_versions_available not in accessibility composite", () => {
      // translated_versions_available is NOT one of the 6 checks
      const accs = manyAccess(10, { translated_versions_available: false });
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: accs }));
      expect(r.accessibility_rate).toBe(100); // still 100 because translated isn't in the 6 checks
    });

    it("total_accessibility_records passthrough", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: manyAccess(4) }));
      expect(r.total_accessibility_records).toBe(4);
    });

    it("0 accessibility records → 0%", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: [] }));
      expect(r.accessibility_rate).toBe(0);
    });
  });

  // ── 13. Update Timeliness ─────────────────────────────────────────────

  describe("update timeliness", () => {
    it("approval within 14 days → timely", () => {
      const vcs = manyVersions(10, { change_date: "2026-05-01", approval_date: "2026-05-10" });
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.update_timeliness_rate).toBe(100);
    });

    it("approval exactly on day 14 → timely", () => {
      const vcs = manyVersions(10, { change_date: "2026-05-01", approval_date: "2026-05-15" });
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.update_timeliness_rate).toBe(100);
    });

    it("approval on day 15 → not timely", () => {
      const vcs = manyVersions(10, { change_date: "2026-05-01", approval_date: "2026-05-16" });
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.update_timeliness_rate).toBe(0);
    });

    it("null approval_date → not timely", () => {
      const vcs = manyVersions(10, { approval_date: null });
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.update_timeliness_rate).toBe(0);
    });

    it("empty string approval_date → not timely", () => {
      const vcs = manyVersions(10, { approval_date: "" });
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.update_timeliness_rate).toBe(0);
    });

    it("mixed timeliness", () => {
      const vcs = [
        ...manyVersions(7, { change_date: "2026-05-01", approval_date: "2026-05-05" }),
        ...manyVersions(3, { change_date: "2026-01-01", approval_date: "2026-03-01" }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.update_timeliness_rate).toBe(70);
    });

    it("approval before change_date → negative days → not timely", () => {
      const vcs = manyVersions(10, { change_date: "2026-05-10", approval_date: "2026-05-01" });
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.update_timeliness_rate).toBe(0);
    });
  });

  // ── 14. Strengths ─────────────────────────────────────────────────────

  describe("strengths", () => {
    it("reviewScheduleRate >= 90 → exemplary review cycle strength", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: manyReviews(10),
      }));
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("policy review completion"))).toBe(true);
    });

    it("reviewScheduleRate 70-89 → generally effective strength", () => {
      const reviews = [
        ...manyReviews(8),
        ...manyReviews(2, { review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 0, consultation_undertaken: false, young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("generally effective"))).toBe(true);
    });

    it("versionControlRate >= 90 → comprehensive audit trail strength", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: manyVersions(10) }));
      expect(r.strengths.some((s) => s.includes("version control compliance"))).toBe(true);
    });

    it("versionControlRate 70-89 → good version control strength", () => {
      const vcs = [
        ...manyVersions(8),
        ...manyVersions(2, { approval_date: null, superseded_version_archived: false, change_log_maintained: false, rationale_documented: false }),
      ];
      // 8*4 + 2*0 = 32/40 = 80% → not quite. Need ratio between 70-89.
      // (8*4) / (10*4) = 32/40 = 80%
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.strengths.some((s) => s.includes("version control compliance") && s.includes("generally maintains"))).toBe(true);
    });

    it("staffAcknowledgementRate >= 90 → consistent practice strength", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: manyAcks(10) }));
      expect(r.strengths.some((s) => s.includes("staff policy acknowledgement"))).toBe(true);
    });

    it("regulatoryAlignmentRate >= 90 → proactive compliance strength", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: manyAlignments(10) }));
      expect(r.strengths.some((s) => s.includes("regulatory alignment"))).toBe(true);
    });

    it("accessibilityRate >= 90 → exceptional accessibility strength", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: manyAccess(10) }));
      expect(r.strengths.some((s) => s.includes("policy accessibility"))).toBe(true);
    });

    it("updateTimelinessRate >= 90 → prompt implementation strength", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: manyVersions(10) }));
      expect(r.strengths.some((s) => s.includes("update timeliness"))).toBe(true);
    });

    it("onTimeReviewRate >= 90 → schedule discipline strength", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: manyReviews(10) }));
      expect(r.strengths.some((s) => s.includes("reviews completed on time"))).toBe(true);
    });

    it("comprehensionRate >= 90 → knowledge embedded strength", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: manyAcks(10) }));
      expect(r.strengths.some((s) => s.includes("comprehension confirmation"))).toBe(true);
    });

    it("consultationRate >= 90 → diverse perspectives strength", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: manyReviews(10) }));
      expect(r.strengths.some((s) => s.includes("consultation during reviews"))).toBe(true);
    });

    it("youngPeopleConsultationRate >= 80 → child-centred governance strength", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: manyReviews(10) }));
      expect(r.strengths.some((s) => s.includes("young people's consultation"))).toBe(true);
    });

    it("legislativeTrackingRate >= 90 → proactive monitoring strength", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: manyAlignments(10) }));
      expect(r.strengths.some((s) => s.includes("legislative change tracking"))).toBe(true);
    });

    it("remediationCompletionRate >= 90 → responsive governance strength", () => {
      const alns = manyAlignments(10, {
        remediation_actions: ["Fix gap"],
        remediation_completed: true,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.strengths.some((s) => s.includes("remediation completion"))).toBe(true);
    });

    it("safeguardingReviewRate >= 95 → highest standard strength", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: manyReviews(10, { category: "safeguarding" }),
      }));
      expect(r.strengths.some((s) => s.includes("safeguarding policy review completion"))).toBe(true);
    });

    it("youngPeopleAccessRate >= 80 → young people engagement strength", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: manyAccess(10) }));
      expect(r.strengths.some((s) => s.includes("young-people-friendly versions"))).toBe(true);
    });

    it("changeLogRate >= 90 → thorough audit trail strength", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: manyVersions(10) }));
      expect(r.strengths.some((s) => s.includes("change log maintenance"))).toBe(true);
    });

    it("accessIssueResolutionRate >= 90 → barriers addressed strength", () => {
      const accs = manyAccess(10, {
        accessibility_issues: ["Issue 1"],
        issues_resolved: true,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: accs }));
      expect(r.strengths.some((s) => s.includes("accessibility issues resolved"))).toBe(true);
    });

    it("no strengths when all rates low", () => {
      const reviews = manyReviews(10, {
        review_completed: false, review_completed_date: null, review_outcome: "pending",
        days_overdue: 10, consultation_undertaken: false, young_people_consulted: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.strengths.filter((s) => s.includes("policy review completion"))).toHaveLength(0);
    });
  });

  // ── 15. Concerns ──────────────────────────────────────────────────────

  describe("concerns", () => {
    it("reviewScheduleRate < 50 → majority not reviewed concern", () => {
      const reviews = [
        ...manyReviews(4),
        ...manyReviews(6, { review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10, consultation_undertaken: false, young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("policy reviews completed"))).toBe(true);
    });

    it("reviewScheduleRate 50-69 → compliance risk concern", () => {
      const reviews = [
        ...manyReviews(6),
        ...manyReviews(4, { review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 0, consultation_undertaken: false, young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("compliance risk"))).toBe(true);
    });

    it("versionControlRate < 50 → audit trail concern", () => {
      const vcs = manyVersions(10, {
        approval_date: null, superseded_version_archived: false,
        change_log_maintained: false, rationale_documented: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.concerns.some((c) => c.includes("version control compliance"))).toBe(true);
    });

    it("versionControlRate 50-69 → weakened audit trail concern", () => {
      const vcs = [
        ...manyVersions(6),
        ...manyVersions(4, { approval_date: null, superseded_version_archived: false, change_log_maintained: false, rationale_documented: false }),
      ];
      // (6*4)/(10*4)= 24/40 = 60%
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("weakening the audit trail"))).toBe(true);
    });

    it("staffAcknowledgementRate < 50 → majority not acknowledged concern", () => {
      const acks = [
        ...manyAcks(4),
        ...manyAcks(6, { acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false, days_to_acknowledge: 20 }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("staff policy acknowledgement"))).toBe(true);
    });

    it("staffAcknowledgementRate 50-69 → significant number concern", () => {
      const acks = [
        ...manyAcks(6),
        ...manyAcks(4, { acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false, days_to_acknowledge: 20 }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("significant number"))).toBe(true);
    });

    it("regulatoryAlignmentRate < 40 → substantial compliance risk concern", () => {
      const alns = [
        ...manyAlignments(3),
        ...manyAlignments(7, { alignment_status: "not_aligned" }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.concerns.some((c) => c.includes("30%") && c.includes("regulatory alignment"))).toBe(true);
    });

    it("regulatoryAlignmentRate 40-69 → requires attention concern", () => {
      const alns = [
        ...manyAlignments(5),
        ...manyAlignments(5, { alignment_status: "partially_aligned" }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("requiring attention"))).toBe(true);
    });

    it("accessibilityRate < 50 → not consistently available concern", () => {
      const accs = manyAccess(10, {
        digital_copy_available: true, physical_copy_available: false,
        staff_accessible: false, young_people_version_available: false,
        easy_read_version_available: false, location_documented: false,
      });
      // 10*1/60 = 17%
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: accs }));
      expect(r.concerns.some((c) => c.includes("policy accessibility"))).toBe(true);
    });

    it("accessibilityRate 50-69 → not all required formats concern", () => {
      const accs = manyAccess(10, {
        digital_copy_available: true, physical_copy_available: true,
        staff_accessible: true, young_people_version_available: false,
        easy_read_version_available: false, location_documented: false,
      });
      // 30/60 = 50%
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: accs }));
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("accessibility"))).toBe(true);
    });

    it("severelyOverdueRate > 30 → governance failure concern", () => {
      const reviews = [
        ...manyReviews(6),
        ...manyReviews(4, { review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 100, consultation_undertaken: false, young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.concerns.some((c) => c.includes("90 days overdue"))).toBe(true);
    });

    it("overdueRate > 30 (but not severely) → cumulative risk concern", () => {
      const reviews = [
        ...manyReviews(6),
        ...manyReviews(4, { review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 30, consultation_undertaken: false, young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.concerns.some((c) => c.includes("overdue for review") && c.includes("cumulative compliance risk"))).toBe(true);
    });

    it("safeguarding overdue → must never lapse concern", () => {
      const reviews = [
        ...manyReviews(8),
        makeReviewSchedule({ category: "safeguarding", review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10 }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.concerns.some((c) => c.includes("safeguarding") && c.includes("must never be allowed to lapse"))).toBe(true);
    });

    it("comprehensionRate < 50 → procedural exercise concern", () => {
      const acks = manyAcks(10, { comprehension_confirmed: false });
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.concerns.some((c) => c.includes("comprehension confirmation") && c.includes("procedural exercise"))).toBe(true);
    });

    it("comprehensionRate 50-69 → not all confirm understanding concern", () => {
      const acks = [
        ...manyAcks(6),
        ...manyAcks(4, { comprehension_confirmed: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("Comprehension confirmation"))).toBe(true);
    });

    it("outstandingAckRate > 30 → practising without awareness concern", () => {
      const acks = [
        ...manyAcks(6),
        ...manyAcks(4, { acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false, days_to_acknowledge: 20 }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.concerns.some((c) => c.includes("acknowledgements remain outstanding"))).toBe(true);
    });

    it("nonAlignmentRate > 20 → direct non-compliance risk concern", () => {
      const alns = [
        ...manyAlignments(7),
        ...manyAlignments(3, { alignment_status: "not_aligned" }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.concerns.some((c) => c.includes("not aligned with current regulations"))).toBe(true);
    });

    it("remediationCompletionRate < 50 → persist without resolution concern", () => {
      const alns = manyAlignments(10, {
        remediation_actions: ["Fix gap"],
        remediation_completed: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.concerns.some((c) => c.includes("alignment remediation actions completed"))).toBe(true);
    });

    it("youngPeopleAccessRate < 40 → cannot access concern", () => {
      const accs = manyAccess(10, { young_people_version_available: false });
      // only ypv is false but the engine checks pct(youngPeopleVersions, totalAccessRecords)
      // all 10 have ypv=false → youngPeopleAccessRate=0%
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: accs }));
      expect(r.concerns.some((c) => c.includes("young-people-friendly versions"))).toBe(true);
    });

    it("updateTimelinessRate < 50 → outdated guidance concern", () => {
      const vcs = manyVersions(10, { change_date: "2026-01-01", approval_date: "2026-03-01" });
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.concerns.some((c) => c.includes("update timeliness"))).toBe(true);
    });

    it("updateTimelinessRate 50-69 → some take longer concern", () => {
      const vcs = [
        ...manyVersions(6, { change_date: "2026-05-01", approval_date: "2026-05-05" }),
        ...manyVersions(4, { change_date: "2026-01-01", approval_date: "2026-03-01" }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("timeliness"))).toBe(true);
    });

    it("no review records but policies exist → cannot evidence concern", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: [],
        version_control_records: manyVersions(5),
      }));
      expect(r.concerns.some((c) => c.includes("No policy review schedule records"))).toBe(true);
    });

    it("no acknowledgement records but staff exist → cannot evidence concern", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        acknowledgement_records: [],
        version_control_records: manyVersions(5),
        total_staff: 10,
      }));
      expect(r.concerns.some((c) => c.includes("No staff policy acknowledgement records"))).toBe(true);
    });

    it("no alignment records but policies exist → cannot evidence concern", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        alignment_records: [],
        version_control_records: manyVersions(5),
        total_policies: 20,
      }));
      expect(r.concerns.some((c) => c.includes("No regulatory alignment records"))).toBe(true);
    });
  });

  // ── 16. Recommendations ───────────────────────────────────────────────

  describe("recommendations", () => {
    it("reviewScheduleRate < 50 → immediate review recommendation", () => {
      const reviews = manyReviews(10, {
        review_completed: false, review_completed_date: null, review_outcome: "pending",
        days_overdue: 10, consultation_undertaken: false, young_people_consulted: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("overdue policies"))).toBe(true);
    });

    it("safeguarding overdue → immediate safeguarding recommendation", () => {
      const reviews = [
        ...manyReviews(8),
        makeReviewSchedule({ category: "safeguarding", review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10 }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("safeguarding policies"))).toBe(true);
    });

    it("staffAckRate < 50 → immediate ack programme recommendation", () => {
      const acks = manyAcks(10, { acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false, days_to_acknowledge: 20 });
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("staff policy acknowledgement programme"))).toBe(true);
    });

    it("regulatoryAlignmentRate < 40 → immediate alignment audit recommendation", () => {
      const alns = manyAlignments(10, { alignment_status: "not_aligned" });
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("regulatory alignment audit"))).toBe(true);
    });

    it("severelyOverdueRate > 30 → immediate severely overdue recommendation", () => {
      const reviews = manyReviews(10, {
        review_completed: false, review_completed_date: null, review_outcome: "pending",
        days_overdue: 100, consultation_undertaken: false, young_people_consulted: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("severely overdue policies"))).toBe(true);
    });

    it("no review records + policies > 0 → immediate schedule recommendation", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: [],
        version_control_records: manyVersions(5),
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("formal policy review schedule"))).toBe(true);
    });

    it("no ack records + staff > 0 → immediate tracking recommendation", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        acknowledgement_records: [],
        version_control_records: manyVersions(5),
        total_staff: 10,
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("policy acknowledgement and tracking system"))).toBe(true);
    });

    it("no alignment records + policies > 0 → immediate alignment recommendation", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        alignment_records: [],
        version_control_records: manyVersions(5),
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("regulatory alignment review"))).toBe(true);
    });

    it("versionControlRate < 50 → soon vc recommendation", () => {
      const vcs = manyVersions(10, {
        approval_date: null, superseded_version_archived: false,
        change_log_maintained: false, rationale_documented: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("version control processes"))).toBe(true);
    });

    it("accessibilityRate < 50 → soon accessibility recommendation", () => {
      const accs = manyAccess(10, {
        digital_copy_available: false, physical_copy_available: false,
        staff_accessible: false, young_people_version_available: false,
        easy_read_version_available: false, location_documented: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: accs }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("policy accessibility"))).toBe(true);
    });

    it("comprehensionRate < 50 → soon comprehension recommendation", () => {
      const acks = manyAcks(10, { comprehension_confirmed: false });
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("comprehension"))).toBe(true);
    });

    it("remediationCompletionRate < 50 → soon remediation recommendation", () => {
      const alns = manyAlignments(10, { remediation_actions: ["Fix gap"], remediation_completed: false });
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("remediation"))).toBe(true);
    });

    it("reviewScheduleRate 50-69 → soon improve recommendation", () => {
      const reviews = [
        ...manyReviews(6),
        ...manyReviews(4, { review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 0, consultation_undertaken: false, young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("review completion rate"))).toBe(true);
    });

    it("staffAckRate 50-69 → soon increase recommendation", () => {
      const acks = [
        ...manyAcks(6),
        ...manyAcks(4, { acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false, days_to_acknowledge: 20 }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("acknowledgement rate above 70%"))).toBe(true);
    });

    it("youngPeopleAccessRate < 40 → soon young people versions recommendation", () => {
      const accs = manyAccess(10, { young_people_version_available: false });
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: accs }));
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("young-people-friendly versions"))).toBe(true);
    });

    it("regulatoryAlignmentRate 40-69 → planned improve recommendation", () => {
      const alns = [
        ...manyAlignments(5),
        ...manyAlignments(5, { alignment_status: "partially_aligned" }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("regulatory alignment to at least 70%"))).toBe(true);
    });

    it("accessibilityRate 50-69 → planned enhance recommendation", () => {
      const accs = manyAccess(10, {
        digital_copy_available: true, physical_copy_available: true,
        staff_accessible: true, young_people_version_available: false,
        easy_read_version_available: false, location_documented: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: accs }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Enhance policy accessibility"))).toBe(true);
    });

    it("versionControlRate 50-69 → planned strengthen recommendation", () => {
      const vcs = [
        ...manyVersions(6),
        ...manyVersions(4, { approval_date: null, superseded_version_archived: false, change_log_maintained: false, rationale_documented: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Strengthen version control"))).toBe(true);
    });

    it("consultationRate < 70 → planned consultation recommendation", () => {
      const reviews = [
        ...manyReviews(6, { consultation_undertaken: false }),
        ...manyReviews(4),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("stakeholder consultation"))).toBe(true);
    });

    it("youngPeopleConsultationRate < 50 → planned involve yp recommendation", () => {
      // Need ypConsultationRate = pct(ypConsulted, reviewsCompleted) < 50
      // 3 completed with yp consulted, 7 completed without → 3/10 = 30%
      const reviews = [
        ...manyReviews(3),
        ...manyReviews(7, { young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Involve young people"))).toBe(true);
    });

    it("updateTimelinessRate 50-69 → planned improve timeliness recommendation", () => {
      const vcs = [
        ...manyVersions(6, { change_date: "2026-05-01", approval_date: "2026-05-05" }),
        ...manyVersions(4, { change_date: "2026-01-01", approval_date: "2026-03-01" }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("timeliness of policy change approvals"))).toBe(true);
    });

    it("easyReadRate < 50 → planned easy-read recommendation", () => {
      const accs = manyAccess(10, { easy_read_version_available: false });
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: accs }));
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("easy-read versions"))).toBe(true);
    });

    it("recommendations have sequential ranks", () => {
      const reviews = manyReviews(10, {
        review_completed: false, review_completed_date: null, review_outcome: "pending",
        days_overdue: 100, consultation_undertaken: false, young_people_consulted: false,
        category: "safeguarding",
      });
      const acks = manyAcks(10, { acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false, days_to_acknowledge: 20 });
      const alns = manyAlignments(10, { alignment_status: "not_aligned" });
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: reviews,
        acknowledgement_records: acks,
        alignment_records: alns,
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("all recommendations have regulatory_ref", () => {
      const reviews = manyReviews(10, {
        review_completed: false, review_completed_date: null, review_outcome: "pending",
        days_overdue: 100, consultation_undertaken: false, young_people_consulted: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });

    it("outstanding scenario has no recommendations", () => {
      const r = computePolicyReviewCycleCompliance(outstandingInput());
      expect(r.recommendations).toHaveLength(0);
    });
  });

  // ── 17. Insights ──────────────────────────────────────────────────────

  describe("insights", () => {
    it("reviewScheduleRate < 50 → critical insight", () => {
      const reviews = manyReviews(10, {
        review_completed: false, review_completed_date: null, review_outcome: "pending",
        days_overdue: 10, consultation_undertaken: false, young_people_consulted: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("reviewed on schedule"))).toBe(true);
    });

    it("staffAckRate < 50 → critical insight", () => {
      const acks = manyAcks(10, { acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false, days_to_acknowledge: 20 });
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("staff policy acknowledgement"))).toBe(true);
    });

    it("regulatoryAlignmentRate < 40 → critical insight", () => {
      const alns = manyAlignments(10, { alignment_status: "not_aligned" });
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("regulatory alignment"))).toBe(true);
    });

    it("severelyOverdueRate > 30 → critical insight", () => {
      const reviews = manyReviews(10, {
        review_completed: false, review_completed_date: null, review_outcome: "pending",
        days_overdue: 100, consultation_undertaken: false, young_people_consulted: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("90 days overdue"))).toBe(true);
    });

    it("safeguarding overdue → critical insight", () => {
      const reviews = [
        ...manyReviews(8),
        makeReviewSchedule({ category: "safeguarding", review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10 }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("safeguarding"))).toBe(true);
    });

    it("no review records + policies > 0 → critical insight", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: [],
        version_control_records: manyVersions(5),
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No policy review schedule records"))).toBe(true);
    });

    it("no ack records + staff > 0 → critical insight", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        acknowledgement_records: [],
        version_control_records: manyVersions(5),
        total_staff: 10,
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No staff policy acknowledgement records"))).toBe(true);
    });

    it("no alignment records + policies > 0 → critical insight", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        alignment_records: [],
        version_control_records: manyVersions(5),
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No regulatory alignment records"))).toBe(true);
    });

    it("nonAlignmentRate > 20 → critical insight", () => {
      const alns = [
        ...manyAlignments(7),
        ...manyAlignments(3, { alignment_status: "not_aligned" }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("not aligned with current regulations"))).toBe(true);
    });

    it("reviewScheduleRate 50-69 → warning insight", () => {
      const reviews = [
        ...manyReviews(6),
        ...manyReviews(4, { review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 0, consultation_undertaken: false, young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("improving but inconsistent"))).toBe(true);
    });

    it("versionControlRate 50-69 → warning insight", () => {
      const vcs = [
        ...manyVersions(6),
        ...manyVersions(4, { approval_date: null, superseded_version_archived: false, change_log_maintained: false, rationale_documented: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Version control compliance"))).toBe(true);
    });

    it("staffAckRate 50-69 → warning insight", () => {
      const acks = [
        ...manyAcks(6),
        ...manyAcks(4, { acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false, days_to_acknowledge: 20 }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Staff acknowledgement"))).toBe(true);
    });

    it("regulatoryAlignmentRate 40-69 → warning insight", () => {
      const alns = [
        ...manyAlignments(5),
        ...manyAlignments(5, { alignment_status: "partially_aligned" }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Regulatory alignment"))).toBe(true);
    });

    it("accessibilityRate 50-69 → warning insight", () => {
      const accs = manyAccess(10, {
        digital_copy_available: true, physical_copy_available: true,
        staff_accessible: true, young_people_version_available: false,
        easy_read_version_available: false, location_documented: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: accs }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Policy accessibility"))).toBe(true);
    });

    it("updateTimelinessRate 50-69 → warning insight", () => {
      const vcs = [
        ...manyVersions(6, { change_date: "2026-05-01", approval_date: "2026-05-05" }),
        ...manyVersions(4, { change_date: "2026-01-01", approval_date: "2026-03-01" }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Update timeliness"))).toBe(true);
    });

    it("comprehensionRate 50-69 → warning insight", () => {
      const acks = [
        ...manyAcks(6),
        ...manyAcks(4, { comprehension_confirmed: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Comprehension confirmation"))).toBe(true);
    });

    it("overdueRate 21-30 → warning insight", () => {
      // 3 out of 10 overdue (but not severely) = 30%, exactly at boundary
      const reviews = [
        ...manyReviews(7),
        ...manyReviews(3, { review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 30, consultation_undertaken: false, young_people_consulted: false }),
      ];
      // overdueRate = 30, severelyOverdueRate = 0 → the 20<overdueRate<=30 check
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("overdue for review"))).toBe(true);
    });

    it("remediationCompletionRate 50-69 → warning insight", () => {
      const alns = [
        ...manyAlignments(6, { remediation_actions: ["Fix gap"], remediation_completed: true }),
        ...manyAlignments(4, { remediation_actions: ["Fix gap"], remediation_completed: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Alignment remediation completion"))).toBe(true);
    });

    it("consultationRate < 50 → warning insight", () => {
      const reviews = manyReviews(10, { consultation_undertaken: false });
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("stakeholder consultation"))).toBe(true);
    });

    it("worstCategories → warning insight", () => {
      const reviews = [
        ...manyReviews(2, { category: "safeguarding", review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10, consultation_undertaken: false, young_people_consulted: false }),
        ...manyReviews(2, { category: "health_safety", review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10, consultation_undertaken: false, young_people_consulted: false }),
        ...manyReviews(6),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Weakest policy categories"))).toBe(true);
    });

    it("totalGaps > 5 → warning insight", () => {
      const alns = manyAlignments(3, { gaps_identified: ["Gap1", "Gap2", "Gap3"] });
      // totalGaps = 9 > 5
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("regulatory alignment gaps"))).toBe(true);
    });

    it("outstanding rating → positive insight", () => {
      const r = computePolicyReviewCycleCompliance(outstandingInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding policy governance"))).toBe(true);
    });

    it("reviewScheduleRate >=90 + onTimeRate >=90 → positive insight", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: manyReviews(10) }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("review completion"))).toBe(true);
    });

    it("staffAckRate >= 90 + comprehensionRate >= 90 → positive insight", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: manyAcks(10) }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("acknowledgement"))).toBe(true);
    });

    it("regulatoryAlignmentRate >= 90 + legislativeTracking >= 90 → positive insight", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: manyAlignments(10) }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("regulatory alignment"))).toBe(true);
    });

    it("versionControlRate >= 90 → positive insight", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: manyVersions(10) }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("version control compliance"))).toBe(true);
    });

    it("accessibilityRate >= 90 → positive insight", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: manyAccess(10) }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("policy accessibility"))).toBe(true);
    });

    it("updateTimelinessRate >= 90 → positive insight", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: manyVersions(10) }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("update timeliness"))).toBe(true);
    });

    it("youngPeopleConsultation >= 80 + youngPeopleAccess >= 80 → positive insight", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: manyReviews(10),
        accessibility_records: manyAccess(10),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("young people consultation"))).toBe(true);
    });

    it("safeguardingReviewRate >= 95 → positive insight", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: manyReviews(10, { category: "safeguarding" }),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("safeguarding policy review"))).toBe(true);
    });

    it("consultationRate >= 90 → positive insight", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: manyReviews(10) }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("consultation rate"))).toBe(true);
    });
  });

  // ── 18. Headlines ─────────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding → outstanding headline", () => {
      const r = computePolicyReviewCycleCompliance(outstandingInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("good → good headline with strength/concern counts", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: manyReviews(10),
        version_control_records: manyVersions(10),
        acknowledgement_records: manyAcks(10),
        alignment_records: manyAlignments(10),
        accessibility_records: [],
      }));
      expect(r.headline).toContain("Good");
      expect(r.headline).toContain("strength");
    });

    it("adequate → adequate headline with concern count", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: [],
        version_control_records: manyVersions(10),
        acknowledgement_records: [],
        alignment_records: [],
        accessibility_records: [],
      }));
      expect(r.headline).toContain("Adequate");
      expect(r.headline).toContain("concern");
    });

    it("inadequate → inadequate headline with urgent action", () => {
      const reviews = manyReviews(10, {
        review_completed: false, review_completed_date: null, review_outcome: "pending",
        days_overdue: 100, consultation_undertaken: false, young_people_consulted: false,
      });
      const acks = manyAcks(10, { acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false, days_to_acknowledge: 20 });
      const alns = manyAlignments(10, { alignment_status: "not_aligned" });
      const vcs = manyVersions(10, { approval_date: null, superseded_version_archived: false, change_log_maintained: false, rationale_documented: false });
      const accs = manyAccess(10, {
        digital_copy_available: false, physical_copy_available: false, staff_accessible: false,
        young_people_version_available: false, easy_read_version_available: false, location_documented: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: reviews,
        version_control_records: vcs,
        acknowledgement_records: acks,
        alignment_records: alns,
        accessibility_records: accs,
      }));
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("urgent action");
    });
  });

  // ── 19. Passthrough Arrays ────────────────────────────────────────────

  describe("passthrough arrays", () => {
    it("review_schedule_records passed through unchanged", () => {
      const reviews = manyReviews(3);
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.review_schedule_records).toBe(reviews);
    });

    it("version_control_records passed through unchanged", () => {
      const vcs = manyVersions(3);
      const r = computePolicyReviewCycleCompliance(baseInput({ version_control_records: vcs }));
      expect(r.version_control_records).toBe(vcs);
    });

    it("acknowledgement_records passed through unchanged", () => {
      const acks = manyAcks(3);
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.acknowledgement_records).toBe(acks);
    });

    it("alignment_records passed through unchanged", () => {
      const alns = manyAlignments(3);
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.alignment_records).toBe(alns);
    });

    it("accessibility_records passed through unchanged", () => {
      const accs = manyAccess(3);
      const r = computePolicyReviewCycleCompliance(baseInput({ accessibility_records: accs }));
      expect(r.accessibility_records).toBe(accs);
    });
  });

  // ── 20. Safeguarding-Specific Tracking ────────────────────────────────

  describe("safeguarding-specific tracking", () => {
    it("only safeguarding category counted in safeguarding metrics", () => {
      const reviews = [
        makeReviewSchedule({ category: "safeguarding", review_completed: true }),
        makeReviewSchedule({ category: "health_safety", review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10 }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      // safeguarding 100% reviewed → strength
      expect(r.strengths.some((s) => s.includes("safeguarding policy review completion"))).toBe(true);
      // health_safety overdue but not safeguarding → no safeguarding overdue concern
      expect(r.concerns.some((c) => c.includes("safeguarding") && c.includes("overdue"))).toBe(false);
    });

    it("single safeguarding overdue uses singular grammar", () => {
      const reviews = [
        ...manyReviews(8, { category: "care_practice" }),
        makeReviewSchedule({ category: "safeguarding", review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10 }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.concerns.some((c) => c.includes("1 safeguarding policy is overdue"))).toBe(true);
    });

    it("multiple safeguarding overdue uses plural grammar", () => {
      const reviews = [
        ...manyReviews(6, { category: "care_practice" }),
        makeReviewSchedule({ category: "safeguarding", review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10 }),
        makeReviewSchedule({ category: "safeguarding", review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 20 }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.concerns.some((c) => c.includes("2 safeguarding policies are overdue"))).toBe(true);
    });
  });

  // ── 21. Category Analysis (worst categories insight) ──────────────────

  describe("category analysis", () => {
    it("categories with <60% completion appear in worst categories insight", () => {
      const reviews = [
        ...manyReviews(3, { category: "safeguarding" }),
        ...manyReviews(3, { category: "health_safety", review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10, consultation_undertaken: false, young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.insights.some((i) => i.text.includes("health safety") && i.text.includes("Weakest"))).toBe(true);
    });

    it("categories with 60%+ completion do NOT appear in worst categories", () => {
      const reviews = manyReviews(10, { category: "safeguarding" });
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      expect(r.insights.some((i) => i.text.includes("Weakest policy categories"))).toBe(false);
    });

    it("worst categories limited to 3", () => {
      const reviews = [
        ...manyReviews(2, { category: "safeguarding", review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10, consultation_undertaken: false, young_people_consulted: false }),
        ...manyReviews(2, { category: "health_safety", review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10, consultation_undertaken: false, young_people_consulted: false }),
        ...manyReviews(2, { category: "care_practice", review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10, consultation_undertaken: false, young_people_consulted: false }),
        ...manyReviews(2, { category: "staffing", review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10, consultation_undertaken: false, young_people_consulted: false }),
        ...manyReviews(2, { category: "complaints", review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 10, consultation_undertaken: false, young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      const weakestInsight = r.insights.find((i) => i.text.includes("Weakest policy categories"));
      expect(weakestInsight).toBeDefined();
      // Count comma-separated entries (max 3)
      const entries = weakestInsight!.text.split("completed,").length;
      expect(entries).toBeLessThanOrEqual(4); // 3 entries + remainder
    });
  });

  // ── 22. Edge Cases ────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("single record per category produces valid result", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: [makeReviewSchedule()],
        version_control_records: [makeVersionControl()],
        acknowledgement_records: [makeAcknowledgement()],
        alignment_records: [makeAlignment()],
        accessibility_records: [makeAccessibility()],
      }));
      expect(r.policy_rating).toBeDefined();
      expect(typeof r.policy_score).toBe("number");
    });

    it("total_staff = 0 with ack records still computes", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        total_staff: 0,
        acknowledgement_records: manyAcks(5),
      }));
      expect(r.staff_acknowledgement_rate).toBe(100);
    });

    it("total_policies = 0 with records still computes normally", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        total_policies: 0,
        review_schedule_records: manyReviews(5),
        version_control_records: manyVersions(5),
        acknowledgement_records: manyAcks(5),
        alignment_records: manyAlignments(5),
        accessibility_records: manyAccess(5),
      }));
      expect(r.policy_rating).toBeDefined();
    });

    it("very large record counts still produce valid score", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        review_schedule_records: manyReviews(100),
        version_control_records: manyVersions(100),
        acknowledgement_records: manyAcks(100),
        alignment_records: manyAlignments(100),
        accessibility_records: manyAccess(100),
      }));
      expect(r.policy_score).toBeGreaterThanOrEqual(0);
      expect(r.policy_score).toBeLessThanOrEqual(100);
    });

    it("nonAlignmentRate with singular policy grammar", () => {
      const alns = [
        ...manyAlignments(3),
        manyAlignments(1, { alignment_status: "not_aligned" })[0],
      ];
      // 1/4 = 25% > 20
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.concerns.some((c) => c.includes("policy does not meet"))).toBe(true);
    });

    it("nonAlignmentRate with plural policies grammar", () => {
      const alns = [
        ...manyAlignments(5),
        ...manyAlignments(3, { alignment_status: "not_aligned" }),
      ];
      // 3/8 = 38% > 20
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      expect(r.concerns.some((c) => c.includes("policies do not meet"))).toBe(true);
    });

    it("outstandingAck with singular grammar", () => {
      const acks = [
        ...manyAcks(2),
        makeAcknowledgement({ acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false, days_to_acknowledge: 20 }),
      ];
      // 1/3 = 33% > 30
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.concerns.some((c) => c.includes("acknowledgement has not been completed"))).toBe(true);
    });

    it("outstandingAck with plural grammar", () => {
      const acks = [
        ...manyAcks(6),
        ...manyAcks(4, { acknowledged: false, acknowledgement_date: null, comprehension_confirmed: false, days_to_acknowledge: 20 }),
      ];
      // 4/10 = 40% > 30
      const r = computePolicyReviewCycleCompliance(baseInput({ acknowledgement_records: acks }));
      expect(r.concerns.some((c) => c.includes("acknowledgements have not been completed"))).toBe(true);
    });

    it("allEmpty guard prevents false inadequate with 0 policies and 0 staff", () => {
      const r = computePolicyReviewCycleCompliance(baseInput({
        total_policies: 0,
        total_staff: 0,
      }));
      expect(r.policy_rating).toBe("insufficient_data");
    });

    it("exactly on boundary: reviewScheduleRate = 50", () => {
      const reviews = [
        ...manyReviews(5),
        ...manyReviews(5, { review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 0, consultation_undertaken: false, young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      // 50% is NOT < 50, so no penalty and no "majority not reviewed" concern
      expect(r.concerns.some((c) => c.includes("majority of policies have not been reviewed"))).toBe(false);
    });

    it("exactly on boundary: regulatoryAlignmentRate = 40", () => {
      const alns = [
        ...manyAlignments(4),
        ...manyAlignments(6, { alignment_status: "partially_aligned" }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ alignment_records: alns }));
      // 40% is NOT < 40, so no penalty
      expect(r.concerns.some((c) => c.includes("substantial compliance risk"))).toBe(false);
    });

    it("exactly on boundary: severelyOverdueRate = 30", () => {
      const reviews = [
        ...manyReviews(7),
        ...manyReviews(3, { review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 100, consultation_undertaken: false, young_people_consulted: false }),
      ];
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      // 30% is NOT > 30, so no penalty
      expect(r.policy_score).not.toBeLessThan(
        computePolicyReviewCycleCompliance(baseInput({
          review_schedule_records: [
            ...manyReviews(6),
            ...manyReviews(4, { review_completed: false, review_completed_date: null, review_outcome: "pending", days_overdue: 100, consultation_undertaken: false, young_people_consulted: false }),
          ],
          version_control_records: [],
          acknowledgement_records: [],
          alignment_records: [],
          accessibility_records: [],
        })).policy_score,
      );
    });

    it("result shape has all expected keys", () => {
      const r = computePolicyReviewCycleCompliance(outstandingInput());
      const keys = [
        "policy_rating", "policy_score", "headline",
        "total_review_records", "total_version_records", "total_acknowledgement_records",
        "total_alignment_records", "total_accessibility_records",
        "review_schedule_rate", "version_control_rate", "staff_acknowledgement_rate",
        "regulatory_alignment_rate", "accessibility_rate", "update_timeliness_rate",
        "review_schedule_records", "version_control_records", "acknowledgement_records",
        "alignment_records", "accessibility_records",
        "strengths", "concerns", "recommendations", "insights",
      ];
      for (const key of keys) {
        expect(r).toHaveProperty(key);
      }
    });

    it("all insights have valid severity", () => {
      const reviews = manyReviews(10, {
        review_completed: false, review_completed_date: null, review_outcome: "pending",
        days_overdue: 100, consultation_undertaken: false, young_people_consulted: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      for (const insight of r.insights) {
        expect(["critical", "warning", "positive"]).toContain(insight.severity);
      }
    });

    it("all recommendations have valid urgency", () => {
      const reviews = manyReviews(10, {
        review_completed: false, review_completed_date: null, review_outcome: "pending",
        days_overdue: 100, consultation_undertaken: false, young_people_consulted: false,
      });
      const r = computePolicyReviewCycleCompliance(baseInput({ review_schedule_records: reviews }));
      for (const rec of r.recommendations) {
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      }
    });
  });
});
