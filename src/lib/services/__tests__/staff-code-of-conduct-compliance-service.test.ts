// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF CODE OF CONDUCT COMPLIANCE SERVICE TESTS
// Pure-function tests for code of conduct metrics, alert identification,
// Cara insight generation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  COMPLIANCE_AREAS,
  COMPLIANCE_STATUSES,
  REVIEW_TYPES,
  ACTION_OUTCOMES,
  _testing,
} from "../staff-code-of-conduct-compliance-service";

import type {
  StaffCodeOfConductComplianceRow,
  ComplianceArea,
  ComplianceStatus,
  ReviewType,
  ActionOutcome,
} from "../staff-code-of-conduct-compliance-service";

const {
  computeCodeOfConductMetrics,
  computeCodeOfConductAlerts,
  generateCodeOfConductCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<StaffCodeOfConductComplianceRow>,
): StaffCodeOfConductComplianceRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Jane Smith",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    review_date: "review_date" in (overrides ?? {}) ? overrides!.review_date! : "2026-03-15",
    compliance_area: "compliance_area" in (overrides ?? {}) ? overrides!.compliance_area! : "professional_conduct",
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "fully_compliant",
    review_type: "review_type" in (overrides ?? {}) ? overrides!.review_type! : "annual_acknowledgement",
    action_outcome: "action_outcome" in (overrides ?? {}) ? overrides!.action_outcome! : "no_action_needed",
    code_acknowledged: "code_acknowledged" in (overrides ?? {}) ? overrides!.code_acknowledged! : true,
    training_completed: "training_completed" in (overrides ?? {}) ? overrides!.training_completed! : true,
    supervision_discussed: "supervision_discussed" in (overrides ?? {}) ? overrides!.supervision_discussed! : true,
    self_assessment_done: "self_assessment_done" in (overrides ?? {}) ? overrides!.self_assessment_done! : true,
    breach_reported: "breach_reported" in (overrides ?? {}) ? overrides!.breach_reported! : false,
    investigation_completed: "investigation_completed" in (overrides ?? {}) ? overrides!.investigation_completed! : false,
    improvement_plan_agreed: "improvement_plan_agreed" in (overrides ?? {}) ? overrides!.improvement_plan_agreed! : false,
    improvement_demonstrated: "improvement_demonstrated" in (overrides ?? {}) ? overrides!.improvement_demonstrated! : false,
    reviewer_name: "reviewer_name" in (overrides ?? {}) ? (overrides!.reviewer_name ?? null) : null,
    breach_details: "breach_details" in (overrides ?? {}) ? (overrides!.breach_details ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-03-15T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-03-15T08:00:00Z",
  };
}

// ── computeCodeOfConductMetrics ─────────────────────────────────────────

describe("computeCodeOfConductMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_reviews", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.total_reviews).toBe(0);
    });

    it("returns zero breach_count", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.breach_count).toBe(0);
    });

    it("returns zero non_compliant_count", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns zero investigation_count", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.investigation_count).toBe(0);
    });

    it("returns zero significant_concern_count", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.significant_concern_count).toBe(0);
    });

    it("returns zero code_acknowledged_rate", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.code_acknowledged_rate).toBe(0);
    });

    it("returns zero training_completed_rate", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.training_completed_rate).toBe(0);
    });

    it("returns zero supervision_discussed_rate", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.supervision_discussed_rate).toBe(0);
    });

    it("returns zero self_assessment_rate", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.self_assessment_rate).toBe(0);
    });

    it("returns zero breach_reported_rate", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.breach_reported_rate).toBe(0);
    });

    it("returns zero investigation_completed_rate", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.investigation_completed_rate).toBe(0);
    });

    it("returns zero improvement_plan_rate", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.improvement_plan_rate).toBe(0);
    });

    it("returns zero improvement_demonstrated_rate", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.improvement_demonstrated_rate).toBe(0);
    });

    it("returns empty compliance_area_breakdown", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.compliance_area_breakdown).toEqual({});
    });

    it("returns empty status_breakdown", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.status_breakdown).toEqual({});
    });

    it("returns zero unique_staff", () => {
      const m = computeCodeOfConductMetrics([]);
      expect(m.unique_staff).toBe(0);
    });
  });

  describe("single fully compliant row", () => {
    const row = makeRow({
      compliance_status: "fully_compliant",
      code_acknowledged: true,
      training_completed: true,
      supervision_discussed: true,
      self_assessment_done: true,
      breach_reported: false,
      investigation_completed: false,
      improvement_plan_agreed: false,
      improvement_demonstrated: false,
    });

    it("returns total_reviews = 1", () => {
      const m = computeCodeOfConductMetrics([row]);
      expect(m.total_reviews).toBe(1);
    });

    it("returns code_acknowledged_rate = 100", () => {
      const m = computeCodeOfConductMetrics([row]);
      expect(m.code_acknowledged_rate).toBe(100);
    });

    it("returns training_completed_rate = 100", () => {
      const m = computeCodeOfConductMetrics([row]);
      expect(m.training_completed_rate).toBe(100);
    });

    it("returns supervision_discussed_rate = 100", () => {
      const m = computeCodeOfConductMetrics([row]);
      expect(m.supervision_discussed_rate).toBe(100);
    });

    it("returns self_assessment_rate = 100", () => {
      const m = computeCodeOfConductMetrics([row]);
      expect(m.self_assessment_rate).toBe(100);
    });

    it("returns breach_count = 0", () => {
      const m = computeCodeOfConductMetrics([row]);
      expect(m.breach_count).toBe(0);
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeCodeOfConductMetrics([row]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns investigation_count = 0", () => {
      const m = computeCodeOfConductMetrics([row]);
      expect(m.investigation_count).toBe(0);
    });

    it("returns breach_reported_rate = 0", () => {
      const m = computeCodeOfConductMetrics([row]);
      expect(m.breach_reported_rate).toBe(0);
    });

    it("returns unique_staff = 1", () => {
      const m = computeCodeOfConductMetrics([row]);
      expect(m.unique_staff).toBe(1);
    });
  });

  describe("multiple rows with mixed statuses", () => {
    const rows = [
      makeRow({ staff_name: "Alice", compliance_status: "fully_compliant", compliance_area: "professional_conduct", code_acknowledged: true, training_completed: true, supervision_discussed: true, self_assessment_done: true, breach_reported: false, investigation_completed: false, improvement_plan_agreed: false, improvement_demonstrated: false }),
      makeRow({ staff_name: "Bob", compliance_status: "breach_identified", compliance_area: "safeguarding_practice", code_acknowledged: true, training_completed: false, supervision_discussed: true, self_assessment_done: false, breach_reported: true, investigation_completed: false, improvement_plan_agreed: false, improvement_demonstrated: false }),
      makeRow({ staff_name: "Charlie", compliance_status: "non_compliant", compliance_area: "confidentiality", code_acknowledged: false, training_completed: false, supervision_discussed: false, self_assessment_done: false, breach_reported: true, investigation_completed: true, improvement_plan_agreed: true, improvement_demonstrated: false }),
      makeRow({ staff_name: "Dana", compliance_status: "under_investigation", compliance_area: "social_media_use", code_acknowledged: true, training_completed: true, supervision_discussed: false, self_assessment_done: true, breach_reported: false, investigation_completed: false, improvement_plan_agreed: false, improvement_demonstrated: false }),
      makeRow({ staff_name: "Eve", compliance_status: "significant_concern", compliance_area: "relationships_with_children", code_acknowledged: false, training_completed: true, supervision_discussed: true, self_assessment_done: false, breach_reported: false, investigation_completed: false, improvement_plan_agreed: true, improvement_demonstrated: true }),
    ];

    it("returns total_reviews = 5", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.total_reviews).toBe(5);
    });

    it("returns breach_count = 1", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.breach_count).toBe(1);
    });

    it("returns non_compliant_count = 1", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.non_compliant_count).toBe(1);
    });

    it("returns investigation_count = 1", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.investigation_count).toBe(1);
    });

    it("returns significant_concern_count = 1", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.significant_concern_count).toBe(1);
    });

    it("calculates code_acknowledged_rate correctly (3/5 = 60%)", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.code_acknowledged_rate).toBe(60);
    });

    it("calculates training_completed_rate correctly (3/5 = 60%)", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.training_completed_rate).toBe(60);
    });

    it("calculates supervision_discussed_rate correctly (3/5 = 60%)", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.supervision_discussed_rate).toBe(60);
    });

    it("calculates self_assessment_rate correctly (2/5 = 40%)", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.self_assessment_rate).toBe(40);
    });

    it("calculates breach_reported_rate correctly (2/5 = 40%)", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.breach_reported_rate).toBe(40);
    });

    it("calculates investigation_completed_rate correctly (1/5 = 20%)", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.investigation_completed_rate).toBe(20);
    });

    it("calculates improvement_plan_rate correctly (2/5 = 40%)", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.improvement_plan_rate).toBe(40);
    });

    it("calculates improvement_demonstrated_rate correctly (1/5 = 20%)", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.improvement_demonstrated_rate).toBe(20);
    });

    it("groups compliance_area_breakdown correctly", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.compliance_area_breakdown).toEqual({
        professional_conduct: 1,
        safeguarding_practice: 1,
        confidentiality: 1,
        social_media_use: 1,
        relationships_with_children: 1,
      });
    });

    it("groups status_breakdown correctly", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.status_breakdown).toEqual({
        fully_compliant: 1,
        breach_identified: 1,
        non_compliant: 1,
        under_investigation: 1,
        significant_concern: 1,
      });
    });

    it("returns unique_staff = 5", () => {
      const m = computeCodeOfConductMetrics(rows);
      expect(m.unique_staff).toBe(5);
    });
  });

  describe("compliance_area_breakdown", () => {
    it("counts duplicate compliance areas", () => {
      const rows = [
        makeRow({ compliance_area: "professional_conduct" }),
        makeRow({ compliance_area: "professional_conduct" }),
        makeRow({ compliance_area: "safeguarding_practice" }),
      ];
      const m = computeCodeOfConductMetrics(rows);
      expect(m.compliance_area_breakdown).toEqual({ professional_conduct: 2, safeguarding_practice: 1 });
    });

    it("handles all 10 compliance areas", () => {
      const rows = COMPLIANCE_AREAS.map((a) => makeRow({ compliance_area: a }));
      const m = computeCodeOfConductMetrics(rows);
      for (const a of COMPLIANCE_AREAS) {
        expect(m.compliance_area_breakdown[a]).toBe(1);
      }
    });
  });

  describe("status_breakdown", () => {
    it("counts duplicate statuses", () => {
      const rows = [
        makeRow({ compliance_status: "fully_compliant" }),
        makeRow({ compliance_status: "fully_compliant" }),
        makeRow({ compliance_status: "breach_identified" }),
      ];
      const m = computeCodeOfConductMetrics(rows);
      expect(m.status_breakdown).toEqual({ fully_compliant: 2, breach_identified: 1 });
    });

    it("handles all 6 compliance statuses", () => {
      const rows = COMPLIANCE_STATUSES.map((s) => makeRow({ compliance_status: s }));
      const m = computeCodeOfConductMetrics(rows);
      for (const s of COMPLIANCE_STATUSES) {
        expect(m.status_breakdown[s]).toBe(1);
      }
    });
  });

  describe("unique_staff", () => {
    it("counts distinct staff names", () => {
      const rows = [
        makeRow({ staff_name: "Alice" }),
        makeRow({ staff_name: "Alice" }),
        makeRow({ staff_name: "Bob" }),
      ];
      const m = computeCodeOfConductMetrics(rows);
      expect(m.unique_staff).toBe(2);
    });

    it("returns 1 when all rows have the same staff name", () => {
      const rows = [
        makeRow({ staff_name: "Alice" }),
        makeRow({ staff_name: "Alice" }),
        makeRow({ staff_name: "Alice" }),
      ];
      const m = computeCodeOfConductMetrics(rows);
      expect(m.unique_staff).toBe(1);
    });
  });

  describe("percentage calculations with known values", () => {
    it("calculates code_acknowledged_rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ code_acknowledged: true }),
        makeRow({ code_acknowledged: false }),
        makeRow({ code_acknowledged: false }),
      ];
      const m = computeCodeOfConductMetrics(rows);
      expect(m.code_acknowledged_rate).toBe(33.3);
    });

    it("calculates training_completed_rate (2/3 = 66.7%)", () => {
      const rows = [
        makeRow({ training_completed: true }),
        makeRow({ training_completed: true }),
        makeRow({ training_completed: false }),
      ];
      const m = computeCodeOfConductMetrics(rows);
      expect(m.training_completed_rate).toBe(66.7);
    });

    it("calculates supervision_discussed_rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ supervision_discussed: true }),
        makeRow({ supervision_discussed: false }),
        makeRow({ supervision_discussed: false }),
      ];
      const m = computeCodeOfConductMetrics(rows);
      expect(m.supervision_discussed_rate).toBe(33.3);
    });

    it("returns 100 for all boolean rates when single row has all flags true", () => {
      const rows = [
        makeRow({ code_acknowledged: true, training_completed: true, supervision_discussed: true, self_assessment_done: true, breach_reported: true, investigation_completed: true, improvement_plan_agreed: true, improvement_demonstrated: true }),
      ];
      const m = computeCodeOfConductMetrics(rows);
      expect(m.code_acknowledged_rate).toBe(100);
      expect(m.training_completed_rate).toBe(100);
      expect(m.supervision_discussed_rate).toBe(100);
      expect(m.self_assessment_rate).toBe(100);
      expect(m.breach_reported_rate).toBe(100);
      expect(m.investigation_completed_rate).toBe(100);
      expect(m.improvement_plan_rate).toBe(100);
      expect(m.improvement_demonstrated_rate).toBe(100);
    });

    it("returns 0 for all boolean rates when single row has all flags false", () => {
      const rows = [
        makeRow({ code_acknowledged: false, training_completed: false, supervision_discussed: false, self_assessment_done: false, breach_reported: false, investigation_completed: false, improvement_plan_agreed: false, improvement_demonstrated: false }),
      ];
      const m = computeCodeOfConductMetrics(rows);
      expect(m.code_acknowledged_rate).toBe(0);
      expect(m.training_completed_rate).toBe(0);
      expect(m.supervision_discussed_rate).toBe(0);
      expect(m.self_assessment_rate).toBe(0);
      expect(m.breach_reported_rate).toBe(0);
      expect(m.investigation_completed_rate).toBe(0);
      expect(m.improvement_plan_rate).toBe(0);
      expect(m.improvement_demonstrated_rate).toBe(0);
    });
  });

  describe("breach and non-compliance counting", () => {
    it("counts only breach_identified for breach_count", () => {
      const rows = [
        makeRow({ compliance_status: "breach_identified" }),
        makeRow({ compliance_status: "non_compliant" }),
        makeRow({ compliance_status: "under_investigation" }),
      ];
      const m = computeCodeOfConductMetrics(rows);
      expect(m.breach_count).toBe(1);
    });

    it("counts only non_compliant for non_compliant_count", () => {
      const rows = [
        makeRow({ compliance_status: "breach_identified" }),
        makeRow({ compliance_status: "non_compliant" }),
        makeRow({ compliance_status: "non_compliant" }),
      ];
      const m = computeCodeOfConductMetrics(rows);
      expect(m.non_compliant_count).toBe(2);
    });

    it("counts only under_investigation for investigation_count", () => {
      const rows = [
        makeRow({ compliance_status: "under_investigation" }),
        makeRow({ compliance_status: "under_investigation" }),
        makeRow({ compliance_status: "breach_identified" }),
      ];
      const m = computeCodeOfConductMetrics(rows);
      expect(m.investigation_count).toBe(2);
    });

    it("counts only significant_concern for significant_concern_count", () => {
      const rows = [
        makeRow({ compliance_status: "significant_concern" }),
        makeRow({ compliance_status: "minor_concern" }),
        makeRow({ compliance_status: "significant_concern" }),
      ];
      const m = computeCodeOfConductMetrics(rows);
      expect(m.significant_concern_count).toBe(2);
    });
  });
});

// ── computeCodeOfConductAlerts ──────────────────────────────────────────

describe("computeCodeOfConductAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeCodeOfConductAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are fully compliant with annual acknowledgement", () => {
      const rows = [
        makeRow({ compliance_status: "fully_compliant", code_acknowledged: true, training_completed: true, supervision_discussed: true, review_type: "annual_acknowledgement" }),
      ];
      const alerts = computeCodeOfConductAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("breach_without_investigation alert", () => {
    it("fires when breach identified without investigation completed", () => {
      const rows = [makeRow({ compliance_status: "breach_identified", investigation_completed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "breach_without_investigation");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ compliance_status: "breach_identified", investigation_completed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "breach_without_investigation")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "breach-1", compliance_status: "breach_identified", investigation_completed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "breach_without_investigation")!;
      expect(alert.record_id).toBe("breach-1");
    });

    it("includes staff name in message", () => {
      const rows = [makeRow({ staff_name: "Bob Jones", compliance_status: "breach_identified", investigation_completed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "breach_without_investigation")!;
      expect(alert.message).toContain("Bob Jones");
    });

    it("replaces underscores in compliance_area in message", () => {
      const rows = [makeRow({ compliance_status: "breach_identified", investigation_completed: false, compliance_area: "social_media_use" })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "breach_without_investigation")!;
      expect(alert.message).toContain("social media use");
    });

    it("does not fire when breach identified and investigation completed", () => {
      const rows = [makeRow({ compliance_status: "breach_identified", investigation_completed: true })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "breach_without_investigation");
      expect(alert).toBeUndefined();
    });

    it("does not fire for non-breach statuses", () => {
      const rows = [makeRow({ compliance_status: "minor_concern", investigation_completed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "breach_without_investigation");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple uninvestigated breaches", () => {
      const rows = [
        makeRow({ compliance_status: "breach_identified", investigation_completed: false }),
        makeRow({ compliance_status: "breach_identified", investigation_completed: false }),
      ];
      const alerts = computeCodeOfConductAlerts(rows);
      const breaches = alerts.filter((a) => a.type === "breach_without_investigation");
      expect(breaches).toHaveLength(2);
    });
  });

  describe("non_compliant_safeguarding alert", () => {
    it("fires when non_compliant in safeguarding_practice", () => {
      const rows = [makeRow({ compliance_status: "non_compliant", compliance_area: "safeguarding_practice" })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_safeguarding");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ compliance_status: "non_compliant", compliance_area: "safeguarding_practice" })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_safeguarding")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "nc-sg-1", compliance_status: "non_compliant", compliance_area: "safeguarding_practice" })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_safeguarding")!;
      expect(alert.record_id).toBe("nc-sg-1");
    });

    it("includes staff name in message", () => {
      const rows = [makeRow({ staff_name: "Alice Brown", compliance_status: "non_compliant", compliance_area: "safeguarding_practice" })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_safeguarding")!;
      expect(alert.message).toContain("Alice Brown");
    });

    it("does not fire for non_compliant in other areas", () => {
      const rows = [makeRow({ compliance_status: "non_compliant", compliance_area: "dress_code" })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_safeguarding");
      expect(alert).toBeUndefined();
    });

    it("does not fire for fully_compliant in safeguarding_practice", () => {
      const rows = [makeRow({ compliance_status: "fully_compliant", compliance_area: "safeguarding_practice" })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_safeguarding");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple non-compliant safeguarding rows", () => {
      const rows = [
        makeRow({ compliance_status: "non_compliant", compliance_area: "safeguarding_practice" }),
        makeRow({ compliance_status: "non_compliant", compliance_area: "safeguarding_practice" }),
      ];
      const alerts = computeCodeOfConductAlerts(rows);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant_safeguarding");
      expect(ncAlerts).toHaveLength(2);
    });
  });

  describe("no_acknowledgement_no_training alert", () => {
    it("fires when code not acknowledged and training not completed", () => {
      const rows = [makeRow({ code_acknowledged: false, training_completed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_acknowledgement_no_training");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ code_acknowledged: false, training_completed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_acknowledgement_no_training")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "no-ack-1", code_acknowledged: false, training_completed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_acknowledgement_no_training")!;
      expect(alert.record_id).toBe("no-ack-1");
    });

    it("includes staff name in message", () => {
      const rows = [makeRow({ staff_name: "Charlie Day", code_acknowledged: false, training_completed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_acknowledgement_no_training")!;
      expect(alert.message).toContain("Charlie Day");
    });

    it("does not fire when code acknowledged but training not completed", () => {
      const rows = [makeRow({ code_acknowledged: true, training_completed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_acknowledgement_no_training");
      expect(alert).toBeUndefined();
    });

    it("does not fire when code not acknowledged but training completed", () => {
      const rows = [makeRow({ code_acknowledged: false, training_completed: true })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_acknowledgement_no_training");
      expect(alert).toBeUndefined();
    });

    it("does not fire when both acknowledged and trained", () => {
      const rows = [makeRow({ code_acknowledged: true, training_completed: true })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_acknowledgement_no_training");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple staff without acknowledgement or training", () => {
      const rows = [
        makeRow({ code_acknowledged: false, training_completed: false }),
        makeRow({ code_acknowledged: false, training_completed: false }),
        makeRow({ code_acknowledged: false, training_completed: false }),
      ];
      const alerts = computeCodeOfConductAlerts(rows);
      const noAck = alerts.filter((a) => a.type === "no_acknowledgement_no_training");
      expect(noAck).toHaveLength(3);
    });
  });

  describe("significant_concern_no_plan alert", () => {
    it("fires when significant concern without improvement plan", () => {
      const rows = [makeRow({ compliance_status: "significant_concern", improvement_plan_agreed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "significant_concern_no_plan");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ compliance_status: "significant_concern", improvement_plan_agreed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "significant_concern_no_plan")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "sc-1", compliance_status: "significant_concern", improvement_plan_agreed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "significant_concern_no_plan")!;
      expect(alert.record_id).toBe("sc-1");
    });

    it("includes staff name and compliance area in message", () => {
      const rows = [makeRow({ staff_name: "Dana Fox", compliance_status: "significant_concern", compliance_area: "confidentiality", improvement_plan_agreed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "significant_concern_no_plan")!;
      expect(alert.message).toContain("Dana Fox");
      expect(alert.message).toContain("confidentiality");
    });

    it("does not fire when significant concern with improvement plan agreed", () => {
      const rows = [makeRow({ compliance_status: "significant_concern", improvement_plan_agreed: true })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "significant_concern_no_plan");
      expect(alert).toBeUndefined();
    });

    it("does not fire for minor concern without improvement plan", () => {
      const rows = [makeRow({ compliance_status: "minor_concern", improvement_plan_agreed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "significant_concern_no_plan");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple significant concerns without plans", () => {
      const rows = [
        makeRow({ compliance_status: "significant_concern", improvement_plan_agreed: false }),
        makeRow({ compliance_status: "significant_concern", improvement_plan_agreed: false }),
      ];
      const alerts = computeCodeOfConductAlerts(rows);
      const scAlerts = alerts.filter((a) => a.type === "significant_concern_no_plan");
      expect(scAlerts).toHaveLength(2);
    });
  });

  describe("concern_not_in_supervision alert", () => {
    it("fires when minor concern not discussed in supervision", () => {
      const rows = [makeRow({ compliance_status: "minor_concern", supervision_discussed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "concern_not_in_supervision");
      expect(alert).toBeDefined();
    });

    it("fires when significant concern not discussed in supervision", () => {
      const rows = [makeRow({ compliance_status: "significant_concern", supervision_discussed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "concern_not_in_supervision");
      expect(alert).toBeDefined();
    });

    it("fires when breach_identified not discussed in supervision", () => {
      const rows = [makeRow({ compliance_status: "breach_identified", supervision_discussed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "concern_not_in_supervision");
      expect(alert).toBeDefined();
    });

    it("fires when under_investigation not discussed in supervision", () => {
      const rows = [makeRow({ compliance_status: "under_investigation", supervision_discussed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "concern_not_in_supervision");
      expect(alert).toBeDefined();
    });

    it("fires when non_compliant not discussed in supervision", () => {
      const rows = [makeRow({ compliance_status: "non_compliant", supervision_discussed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "concern_not_in_supervision");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ compliance_status: "minor_concern", supervision_discussed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "concern_not_in_supervision")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "cns-1", compliance_status: "minor_concern", supervision_discussed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "concern_not_in_supervision")!;
      expect(alert.record_id).toBe("cns-1");
    });

    it("includes staff name in message", () => {
      const rows = [makeRow({ staff_name: "Eve Green", compliance_status: "minor_concern", supervision_discussed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "concern_not_in_supervision")!;
      expect(alert.message).toContain("Eve Green");
    });

    it("does not fire for fully_compliant even without supervision", () => {
      const rows = [makeRow({ compliance_status: "fully_compliant", supervision_discussed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "concern_not_in_supervision");
      expect(alert).toBeUndefined();
    });

    it("does not fire when concern discussed in supervision", () => {
      const rows = [makeRow({ compliance_status: "minor_concern", supervision_discussed: true })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "concern_not_in_supervision");
      expect(alert).toBeUndefined();
    });
  });

  describe("annual_acknowledgement_overdue alert", () => {
    it("fires when staff has no annual_acknowledgement review type", () => {
      const rows = [makeRow({ staff_name: "Frank Hill", review_type: "spot_check" })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "annual_acknowledgement_overdue");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ staff_name: "Frank Hill", review_type: "spot_check" })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "annual_acknowledgement_overdue")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes staff name in message", () => {
      const rows = [makeRow({ staff_name: "Frank Hill", review_type: "spot_check" })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "annual_acknowledgement_overdue")!;
      expect(alert.message).toContain("Frank Hill");
    });

    it("does not fire when staff has an annual_acknowledgement review", () => {
      const rows = [makeRow({ staff_name: "Grace Hall", review_type: "annual_acknowledgement" })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "annual_acknowledgement_overdue");
      expect(alert).toBeUndefined();
    });

    it("does not fire when staff has at least one annual_acknowledgement among multiple reviews", () => {
      const rows = [
        makeRow({ staff_name: "Grace Hall", review_type: "spot_check" }),
        makeRow({ staff_name: "Grace Hall", review_type: "annual_acknowledgement" }),
      ];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "annual_acknowledgement_overdue");
      expect(alert).toBeUndefined();
    });

    it("fires once per staff member without annual acknowledgement", () => {
      const rows = [
        makeRow({ staff_name: "Henry Ives", review_type: "spot_check" }),
        makeRow({ staff_name: "Henry Ives", review_type: "incident_review" }),
      ];
      const alerts = computeCodeOfConductAlerts(rows);
      const overdue = alerts.filter((a) => a.type === "annual_acknowledgement_overdue");
      expect(overdue).toHaveLength(1);
    });

    it("fires for each staff member without annual acknowledgement", () => {
      const rows = [
        makeRow({ staff_name: "Iris Jay", review_type: "spot_check" }),
        makeRow({ staff_name: "Jack King", review_type: "incident_review" }),
      ];
      const alerts = computeCodeOfConductAlerts(rows);
      const overdue = alerts.filter((a) => a.type === "annual_acknowledgement_overdue");
      expect(overdue).toHaveLength(2);
    });

    it("does not have record_id since it is an aggregate alert", () => {
      const rows = [makeRow({ staff_name: "Frank Hill", review_type: "spot_check" })];
      const alerts = computeCodeOfConductAlerts(rows);
      const alert = alerts.find((a) => a.type === "annual_acknowledgement_overdue")!;
      expect(alert.record_id).toBeUndefined();
    });
  });

  describe("combined alerts", () => {
    it("can fire all six alert types simultaneously", () => {
      const rows = [
        // breach without investigation (critical) + concern not in supervision (medium)
        makeRow({ staff_name: "A", compliance_status: "breach_identified", investigation_completed: false, code_acknowledged: true, training_completed: true, supervision_discussed: false, review_type: "incident_review" }),
        // non-compliant safeguarding (critical) + no ack/no training (high) + concern not in supervision (medium)
        makeRow({ staff_name: "B", compliance_status: "non_compliant", compliance_area: "safeguarding_practice", code_acknowledged: false, training_completed: false, supervision_discussed: false, review_type: "formal_review" }),
        // significant concern without plan (high)
        makeRow({ staff_name: "C", compliance_status: "significant_concern", improvement_plan_agreed: false, code_acknowledged: true, training_completed: true, supervision_discussed: true, review_type: "supervision_discussion" }),
      ];
      // All three staff have no annual_acknowledgement review_type (medium)
      const alerts = computeCodeOfConductAlerts(rows);
      const types = new Set(alerts.map((a) => a.type));
      expect(types).toContain("breach_without_investigation");
      expect(types).toContain("non_compliant_safeguarding");
      expect(types).toContain("no_acknowledgement_no_training");
      expect(types).toContain("significant_concern_no_plan");
      expect(types).toContain("concern_not_in_supervision");
      expect(types).toContain("annual_acknowledgement_overdue");
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ compliance_status: "breach_identified", investigation_completed: false, code_acknowledged: false, training_completed: false }),
      ];
      const alerts = computeCodeOfConductAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({ compliance_status: "breach_identified", investigation_completed: false, compliance_area: "safeguarding_practice", code_acknowledged: false, training_completed: false, supervision_discussed: false, review_type: "spot_check" }),
      ];
      const alerts = computeCodeOfConductAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ compliance_status: "breach_identified", investigation_completed: false })];
      const alerts = computeCodeOfConductAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── generateCodeOfConductCaraInsights ───────────────────────────────────

describe("generateCodeOfConductCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const insights = generateCodeOfConductCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [emerald]", () => {
    const insights = generateCodeOfConductCaraInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[emerald\]/);
  });

  it("first insight includes total reviews count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = generateCodeOfConductCaraInsights(rows);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes code_acknowledged_rate", () => {
    const rows = [makeRow({ code_acknowledged: true }), makeRow({ code_acknowledged: false })];
    const insights = generateCodeOfConductCaraInsights(rows);
    expect(insights[0]).toContain("50%");
  });

  it("first insight includes training_completed_rate", () => {
    const rows = [makeRow({ training_completed: true }), makeRow({ training_completed: false })];
    const insights = generateCodeOfConductCaraInsights(rows);
    expect(insights[0]).toContain("50%");
  });

  it("uses singular member wording when unique_staff is 1", () => {
    const rows = [makeRow({ staff_name: "Alice" })];
    const insights = generateCodeOfConductCaraInsights(rows);
    expect(insights[0]).toContain("1 staff member");
  });

  it("uses plural members wording when unique_staff > 1", () => {
    const rows = [makeRow({ staff_name: "Alice" }), makeRow({ staff_name: "Bob" })];
    const insights = generateCodeOfConductCaraInsights(rows);
    expect(insights[0]).toContain("2 staff members");
  });

  it("second insight starts with [amber]", () => {
    const insights = generateCodeOfConductCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [
      makeRow({ compliance_status: "breach_identified", investigation_completed: false, code_acknowledged: false, training_completed: false }),
    ];
    const insights = generateCodeOfConductCaraInsights(rows);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow({ compliance_status: "fully_compliant", code_acknowledged: true, training_completed: true, supervision_discussed: true, review_type: "annual_acknowledgement" })];
    const insights = generateCodeOfConductCaraInsights(rows);
    expect(insights[1]).toContain("No critical or high-priority alerts");
  });

  it("second insight includes breach count", () => {
    const rows = [
      makeRow({ compliance_status: "breach_identified", investigation_completed: true, code_acknowledged: true, training_completed: true, supervision_discussed: true, review_type: "annual_acknowledgement" }),
    ];
    const insights = generateCodeOfConductCaraInsights(rows);
    expect(insights[1]).toContain("1 breach");
  });

  it("third insight starts with [reflect]", () => {
    const insights = generateCodeOfConductCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions breaches when some are identified", () => {
    const rows = [makeRow({ compliance_status: "breach_identified" })];
    const insights = generateCodeOfConductCaraInsights(rows);
    expect(insights[2]).toContain("breach");
  });

  it("third insight asks about acknowledgement gaps when no breaches but not all acknowledged", () => {
    const rows = [
      makeRow({ compliance_status: "fully_compliant", code_acknowledged: false }),
      makeRow({ compliance_status: "fully_compliant", code_acknowledged: true }),
    ];
    const insights = generateCodeOfConductCaraInsights(rows);
    expect(insights[2]).toContain("acknowledged the code of conduct");
  });

  it("third insight celebrates strong compliance when all acknowledged and no breaches", () => {
    const rows = [
      makeRow({ compliance_status: "fully_compliant", code_acknowledged: true }),
      makeRow({ compliance_status: "fully_compliant", code_acknowledged: true }),
    ];
    const insights = generateCodeOfConductCaraInsights(rows);
    expect(insights[2]).toContain("acknowledged the code of conduct and no breaches");
  });

  it("uses singular breach wording when 1 breach", () => {
    const rows = [makeRow({ compliance_status: "breach_identified" })];
    const insights = generateCodeOfConductCaraInsights(rows);
    expect(insights[2]).toContain("breach has");
  });

  it("uses plural breaches wording when multiple breaches", () => {
    const rows = [
      makeRow({ compliance_status: "breach_identified" }),
      makeRow({ compliance_status: "breach_identified" }),
    ];
    const insights = generateCodeOfConductCaraInsights(rows);
    expect(insights[2]).toContain("breaches have");
  });

  it("all insights are non-empty strings", () => {
    const insights = generateCodeOfConductCaraInsights([makeRow()]);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("returns 3 insights even with empty array", () => {
    const insights = generateCodeOfConductCaraInsights([]);
    expect(insights).toHaveLength(3);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });
});

// ── Enum constants ───────────────────────────────────────────────────────

describe("Enum constants", () => {
  it("COMPLIANCE_AREAS has exactly 10 items", () => {
    expect(COMPLIANCE_AREAS).toHaveLength(10);
  });

  it("COMPLIANCE_STATUSES has exactly 6 items", () => {
    expect(COMPLIANCE_STATUSES).toHaveLength(6);
  });

  it("REVIEW_TYPES has exactly 6 items", () => {
    expect(REVIEW_TYPES).toHaveLength(6);
  });

  it("ACTION_OUTCOMES has exactly 6 items", () => {
    expect(ACTION_OUTCOMES).toHaveLength(6);
  });

  it("COMPLIANCE_AREAS values are unique", () => {
    expect(new Set(COMPLIANCE_AREAS).size).toBe(COMPLIANCE_AREAS.length);
  });

  it("COMPLIANCE_STATUSES values are unique", () => {
    expect(new Set(COMPLIANCE_STATUSES).size).toBe(COMPLIANCE_STATUSES.length);
  });

  it("REVIEW_TYPES values are unique", () => {
    expect(new Set(REVIEW_TYPES).size).toBe(REVIEW_TYPES.length);
  });

  it("ACTION_OUTCOMES values are unique", () => {
    expect(new Set(ACTION_OUTCOMES).size).toBe(ACTION_OUTCOMES.length);
  });

  it("COMPLIANCE_AREAS contains professional_conduct", () => {
    expect(COMPLIANCE_AREAS).toContain("professional_conduct");
  });

  it("COMPLIANCE_AREAS contains safeguarding_practice", () => {
    expect(COMPLIANCE_AREAS).toContain("safeguarding_practice");
  });

  it("COMPLIANCE_STATUSES contains fully_compliant", () => {
    expect(COMPLIANCE_STATUSES).toContain("fully_compliant");
  });

  it("COMPLIANCE_STATUSES contains breach_identified", () => {
    expect(COMPLIANCE_STATUSES).toContain("breach_identified");
  });

  it("REVIEW_TYPES contains annual_acknowledgement", () => {
    expect(REVIEW_TYPES).toContain("annual_acknowledgement");
  });

  it("REVIEW_TYPES contains spot_check", () => {
    expect(REVIEW_TYPES).toContain("spot_check");
  });

  it("ACTION_OUTCOMES contains no_action_needed", () => {
    expect(ACTION_OUTCOMES).toContain("no_action_needed");
  });

  it("ACTION_OUTCOMES contains dismissal_considered", () => {
    expect(ACTION_OUTCOMES).toContain("dismissal_considered");
  });
});

// ── Factory helper validation ────────────────────────────────────────────

describe("makeRow factory helper", () => {
  it("creates a row with sensible defaults", () => {
    const r = makeRow();
    expect(r.home_id).toBe("home-1");
    expect(r.staff_name).toBe("Jane Smith");
    expect(r.staff_id).toBeNull();
    expect(r.review_date).toBe("2026-03-15");
    expect(r.compliance_area).toBe("professional_conduct");
    expect(r.compliance_status).toBe("fully_compliant");
    expect(r.review_type).toBe("annual_acknowledgement");
    expect(r.action_outcome).toBe("no_action_needed");
    expect(r.code_acknowledged).toBe(true);
    expect(r.training_completed).toBe(true);
    expect(r.supervision_discussed).toBe(true);
    expect(r.self_assessment_done).toBe(true);
    expect(r.breach_reported).toBe(false);
    expect(r.investigation_completed).toBe(false);
    expect(r.improvement_plan_agreed).toBe(false);
    expect(r.improvement_demonstrated).toBe(false);
    expect(r.reviewer_name).toBeNull();
    expect(r.breach_details).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRow({ compliance_area: "safeguarding_practice", compliance_status: "breach_identified" });
    expect(r.compliance_area).toBe("safeguarding_practice");
    expect(r.compliance_status).toBe("breach_identified");
    // defaults still apply
    expect(r.staff_name).toBe("Jane Smith");
  });

  it("generates unique ids by default", () => {
    const r1 = makeRow();
    const r2 = makeRow();
    expect(r1.id).not.toBe(r2.id);
  });

  it("allows overriding id", () => {
    const r = makeRow({ id: "custom-id" });
    expect(r.id).toBe("custom-id");
  });

  it("allows setting nullable fields to null", () => {
    const r = makeRow({ staff_id: null, reviewer_name: null, breach_details: null, notes: null });
    expect(r.staff_id).toBeNull();
    expect(r.reviewer_name).toBeNull();
    expect(r.breach_details).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting nullable fields to values", () => {
    const r = makeRow({ staff_id: "staff-123", reviewer_name: "Manager A", breach_details: "Late arrival", notes: "Discussed in supervision" });
    expect(r.staff_id).toBe("staff-123");
    expect(r.reviewer_name).toBe("Manager A");
    expect(r.breach_details).toBe("Late arrival");
    expect(r.notes).toBe("Discussed in supervision");
  });
});
