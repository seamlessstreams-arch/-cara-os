import { describe, it, expect } from "vitest";
import {
  computeDocumentMetrics,
  identifyDocumentAlerts,
  type KeyDocument,
} from "./key-documents-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeDoc(overrides: Partial<KeyDocument> = {}): KeyDocument {
  return {
    id: "doc-1",
    home_id: "home-1",
    child_name: "Alex Smith",
    child_id: "child-1",
    document_type: "care_plan",
    document_name: "Alex's Care Plan",
    status: "current",
    created_date: "2026-01-01",
    last_reviewed: "2026-04-01",
    next_review_due: "2026-07-01",
    review_frequency: "quarterly",
    responsible_person: "Jane Doe",
    social_worker_approved: true,
    child_contributed: true,
    stored_location: "Office safe",
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

describe("key-documents-service", () => {
  // -- computeDocumentMetrics ---------------------------------------------------

  describe("computeDocumentMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeDocumentMetrics([], 4, NOW);
      expect(m.total_documents).toBe(0);
      expect(m.current_count).toBe(0);
      expect(m.document_coverage).toBe(0);
      expect(m.social_worker_approved_rate).toBeNull();;
      expect(m.child_contributed_rate).toBeNull();;
    });

    it("computes status counts and coverage", () => {
      const docs = [
        makeDoc({ child_id: "c1", status: "current" }),
        makeDoc({ id: "d2", child_id: "c2", status: "overdue" }),
        makeDoc({ id: "d3", child_id: "c3", status: "draft" }),
        makeDoc({ id: "d4", child_id: "c3", status: "not_yet_created" }),
      ];
      const m = computeDocumentMetrics(docs, 4, NOW);
      expect(m.total_documents).toBe(4);
      expect(m.current_count).toBe(1);
      expect(m.overdue_count).toBe(1);
      expect(m.draft_count).toBe(1);
      expect(m.not_created_count).toBe(1);
      expect(m.children_with_documents).toBe(3);
      expect(m.document_coverage).toBe(75);
    });

    it("counts due_review including documents overdue by date", () => {
      const docs = [
        makeDoc({ status: "due_review" }),
        makeDoc({
          id: "d2",
          status: "current",
          next_review_due: "2026-01-01", // past NOW
        }),
      ];
      const m = computeDocumentMetrics(docs, 4, NOW);
      // 1 explicit due_review + 1 overdue by date
      expect(m.due_review_count).toBe(2);
    });

    it("computes SW approved and child contributed rates", () => {
      const docs = [
        makeDoc({ social_worker_approved: true, child_contributed: false }),
        makeDoc({ id: "d2", social_worker_approved: false, child_contributed: true }),
      ];
      const m = computeDocumentMetrics(docs, 4, NOW);
      expect(m.social_worker_approved_rate).toBe(50);
      expect(m.child_contributed_rate).toBe(50);
    });

    it("counts specific document types when current", () => {
      const docs = [
        makeDoc({ document_type: "care_plan", status: "current" }),
        makeDoc({ id: "d2", document_type: "placement_plan", status: "current" }),
        makeDoc({ id: "d3", document_type: "risk_assessment", status: "current" }),
        makeDoc({ id: "d4", document_type: "care_plan", status: "overdue" }),
      ];
      const m = computeDocumentMetrics(docs, 4, NOW);
      expect(m.care_plans_current).toBe(1);
      expect(m.placement_plans_current).toBe(1);
      expect(m.risk_assessments_current).toBe(1);
    });
  });

  // -- identifyDocumentAlerts ---------------------------------------------------

  describe("identifyDocumentAlerts", () => {
    it("returns no alerts for empty data with 0 children", () => {
      expect(identifyDocumentAlerts([], 0, NOW)).toHaveLength(0);
    });

    it("fires critical missing_care_plan when children without current/due_review care plan", () => {
      const docs = [makeDoc({ child_id: "c1", document_type: "care_plan", status: "current" })];
      const alerts = identifyDocumentAlerts(docs, 4, NOW);
      const mcp = alerts.find((a) => a.type === "missing_care_plan");
      expect(mcp).toBeDefined();
      expect(mcp!.severity).toBe("critical");
      expect(mcp!.message).toContain("3"); // 4 - 1 = 3 children missing
    });

    it("fires critical missing_placement_plan", () => {
      const docs: KeyDocument[] = [];
      const alerts = identifyDocumentAlerts(docs, 2, NOW);
      expect(alerts.find((a) => a.type === "missing_placement_plan")).toBeDefined();
    });

    it("fires high document_overdue for documents with overdue status", () => {
      const docs = [makeDoc({ status: "overdue" })];
      const alerts = identifyDocumentAlerts(docs, 4, NOW);
      expect(alerts.find((a) => a.type === "document_overdue")).toBeDefined();
    });

    it("fires high review_overdue_by_date for current docs past review date", () => {
      const docs = [makeDoc({ status: "current", next_review_due: "2026-01-01" })];
      const alerts = identifyDocumentAlerts(docs, 0, NOW);
      expect(alerts.find((a) => a.type === "review_overdue_by_date")).toBeDefined();
    });

    it("fires critical document_not_created for statutory documents", () => {
      const docs = [makeDoc({ document_type: "care_plan", status: "not_yet_created" })];
      const alerts = identifyDocumentAlerts(docs, 4, NOW);
      const dnc = alerts.find((a) => a.type === "document_not_created");
      expect(dnc).toBeDefined();
      expect(dnc!.severity).toBe("critical");
    });

    it("fires medium document_not_created for non-statutory documents", () => {
      const docs = [makeDoc({ document_type: "therapy_plan", status: "not_yet_created" })];
      const alerts = identifyDocumentAlerts(docs, 4, NOW);
      const dnc = alerts.find((a) => a.type === "document_not_created");
      expect(dnc).toBeDefined();
      expect(dnc!.severity).toBe("medium");
    });
  });
});
