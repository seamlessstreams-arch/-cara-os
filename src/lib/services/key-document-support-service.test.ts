import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateKeyDocumentSupport,
  generateCaraInsights,
  type KeyDocumentSupportRow,
} from "./key-document-support-service";

function makeRow(overrides: Partial<KeyDocumentSupportRow> = {}): KeyDocumentSupportRow {
  return {
    id: "kds-1",
    home_id: "home-1",
    young_person_name: "Alex Smith",
    record_date: "2026-05-10",
    supporting_staff: "Jane Doe",
    document_type: "Birth Certificate",
    support_stage: "Complete",
    document_held_by: "Young Person",
    cost: 12.5,
    funded_by: "Home",
    young_person_engaged: true,
    personal_adviser_involved: true,
    social_worker_informed: true,
    pathway_plan_linked: true,
    deadline_date: null,
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

describe("key-document-support-service", () => {
  // -- computeMetrics -----------------------------------------------------------

  describe("computeMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeMetrics([]);
      expect(m.total_records).toBe(0);
      expect(m.completion_rate).toBe(0);
      expect(m.lost_missing_count).toBe(0);
      expect(m.unique_young_people).toBe(0);
      expect(m.essential_documents_coverage).toBe(0);
      expect(m.total_cost).toBe(0);
    });

    it("computes completion rate and category counts", () => {
      const rows = [
        makeRow({ support_stage: "Complete", document_type: "Birth Certificate" }),
        makeRow({ id: "r2", support_stage: "Document Received", document_type: "Passport" }),
        makeRow({ id: "r3", support_stage: "Application Started", document_type: "National Insurance Number" }),
      ];
      const m = computeMetrics(rows);
      expect(m.total_records).toBe(3);
      // 2 of 3 are in COMPLETED_STAGES
      expect(m.completion_rate).toBe(66.7);
      expect(m.identity_document_count).toBe(2); // Birth Certificate + Passport
      expect(m.financial_document_count).toBe(1); // NI Number
      expect(m.active_applications_count).toBe(1);
    });

    it("computes essential document coverage per young person", () => {
      // 1 YP with 2 of 4 essentials complete
      const rows = [
        makeRow({ document_type: "Birth Certificate", support_stage: "Complete" }),
        makeRow({ id: "r2", document_type: "National Insurance Number", support_stage: "Complete" }),
        makeRow({ id: "r3", document_type: "GP Registration", support_stage: "Application Started" }),
      ];
      const m = computeMetrics(rows);
      // 2/4 = 50%
      expect(m.essential_documents_coverage).toBe(50);
    });

    it("computes lost/missing count and secure storage rate", () => {
      const rows = [
        makeRow({ document_held_by: "Lost/Missing" }),
        makeRow({ id: "r2", document_held_by: "Young Person" }),
        makeRow({ id: "r3", document_held_by: "Home Office" }),
      ];
      const m = computeMetrics(rows);
      expect(m.lost_missing_count).toBe(1);
      // Secure holders: Young Person + Home-Secure + SW + Solicitor. Only "Young Person" here
      expect(m.secure_storage_rate).toBe(33.3);
      expect(m.not_yet_obtained_count).toBe(0);
    });

    it("sums total cost", () => {
      const rows = [
        makeRow({ cost: 12.5 }),
        makeRow({ id: "r2", cost: 30 }),
        makeRow({ id: "r3", cost: null }),
      ];
      const m = computeMetrics(rows);
      expect(m.total_cost).toBe(42.5);
    });
  });

  // -- computeAlerts -----------------------------------------------------------

  describe("computeAlerts", () => {
    it("returns no alerts for empty data", () => {
      expect(computeAlerts([])).toHaveLength(0);
    });

    it("fires critical essential_document_lost when essential doc is Lost/Missing", () => {
      const rows = [makeRow({ document_type: "Birth Certificate", document_held_by: "Lost/Missing" })];
      const alerts = computeAlerts(rows);
      const lost = alerts.find((a) => a.type === "essential_document_lost");
      expect(lost).toBeDefined();
      expect(lost!.severity).toBe("critical");
    });

    it("fires critical multiple_essential_docs_missing when 2+ essentials missing for a YP", () => {
      const rows = [
        makeRow({ document_type: "Birth Certificate", document_held_by: "Not Yet Obtained", support_stage: "Identified as Needed" }),
        makeRow({ id: "r2", document_type: "National Insurance Number", document_held_by: "Not Yet Obtained", support_stage: "Identified as Needed" }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "multiple_essential_docs_missing")).toBeDefined();
    });

    it("fires critical deadline_passed when deadline passed without completion", () => {
      const rows = [
        makeRow({ deadline_date: "2026-01-01", support_stage: "Application Submitted" }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "deadline_passed")).toBeDefined();
    });

    it("fires high low_pa_essential_docs when PA rate < 30% for essentials with 3+ rows", () => {
      const rows = [
        makeRow({ document_type: "Birth Certificate", personal_adviser_involved: false }),
        makeRow({ id: "r2", document_type: "National Insurance Number", personal_adviser_involved: false }),
        makeRow({ id: "r3", document_type: "GP Registration", personal_adviser_involved: false }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "low_pa_essential_docs")).toBeDefined();
    });

    it("fires high low_pathway_plan_linkage when < 30% linked with 5+ rows", () => {
      const rows = Array.from({ length: 5 }, (_, i) =>
        makeRow({ id: `r${i}`, pathway_plan_linked: false }),
      );
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "low_pathway_plan_linkage")).toBeDefined();
    });

    it("fires medium low_engagement when < 50% engaged with 5+ rows", () => {
      const rows = Array.from({ length: 5 }, (_, i) =>
        makeRow({ id: `r${i}`, young_person_engaged: false }),
      );
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "low_engagement")).toBeDefined();
    });
  });

  // -- validateKeyDocumentSupport -----------------------------------------------

  describe("validateKeyDocumentSupport", () => {
    it("returns valid for correct input", () => {
      const result = validateKeyDocumentSupport({
        youngPersonName: "Alex",
        recordDate: "2026-05-10",
        supportingStaff: "Jane",
        documentType: "Birth Certificate",
        supportStage: "Complete",
        documentHeldBy: "Young Person",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects missing required fields", () => {
      const result = validateKeyDocumentSupport({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it("rejects Complete stage with Not Yet Obtained holder", () => {
      const result = validateKeyDocumentSupport({
        youngPersonName: "Alex",
        recordDate: "2026-05-10",
        supportingStaff: "Jane",
        documentType: "Birth Certificate",
        supportStage: "Complete",
        documentHeldBy: "Not Yet Obtained",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Complete"))).toBe(true);
    });

    it("rejects negative cost", () => {
      const result = validateKeyDocumentSupport({
        youngPersonName: "Alex",
        recordDate: "2026-05-10",
        supportingStaff: "Jane",
        documentType: "Passport",
        cost: -10,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Cost cannot be negative"))).toBe(true);
    });
  });

  // -- generateCaraInsights -----------------------------------------------------

  describe("generateCaraInsights", () => {
    it("returns 3 insights", () => {
      const rows = [makeRow()];
      const insights = generateCaraInsights(rows);
      expect(insights).toHaveLength(3);
      expect(insights[0]).toContain("[sky]");
      expect(insights[1]).toContain("[amber]");
      expect(insights[2]).toContain("[reflect]");
    });
  });
});
