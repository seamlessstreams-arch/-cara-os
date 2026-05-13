// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — KEY DOCUMENTS SERVICE TESTS
// Pure-function unit tests for document metrics computation, alert
// identification, constant validation, and CRUD fallback behaviour.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";
import { _testing } from "../key-documents-service";
import {
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  REVIEW_FREQUENCIES,
} from "../key-documents-service";

import type {
  KeyDocument,
  DocumentType,
  DocumentStatus,
  ReviewFrequency,
} from "../key-documents-service";

const { computeDocumentMetrics, identifyDocumentAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Normalised "now" — avoids midnight-drift issues across test runs. */
const now = new Date(new Date().toISOString().split("T")[0]);

/** Return a date string N days before the reference date. */
function daysAgo(n: number, from: Date = now): string {
  const d = new Date(from.getTime() - n * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

/** Return a date string N days after the reference date. */
function daysFromNow(n: number, from: Date = now): string {
  const d = new Date(from.getTime() + n * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

let docCounter = 0;

/** Build a minimal KeyDocument with sensible defaults. */
function makeDoc(overrides: Partial<KeyDocument> = {}): KeyDocument {
  docCounter += 1;
  return {
    id: overrides.id ?? `doc-${docCounter}`,
    home_id: overrides.home_id ?? "home-1",
    child_name: overrides.child_name ?? "Child A",
    child_id: overrides.child_id ?? "child-1",
    document_type: overrides.document_type ?? "care_plan",
    document_name: overrides.document_name ?? "Care Plan — Child A",
    status: overrides.status ?? "current",
    created_date: overrides.created_date ?? daysAgo(90),
    last_reviewed: "last_reviewed" in overrides ? overrides.last_reviewed! : daysAgo(30),
    next_review_due: "next_review_due" in overrides ? overrides.next_review_due! : daysFromNow(60),
    review_frequency: overrides.review_frequency ?? "quarterly",
    responsible_person: overrides.responsible_person ?? "Staff A",
    social_worker_approved: overrides.social_worker_approved ?? true,
    child_contributed: overrides.child_contributed ?? true,
    stored_location: overrides.stored_location ?? "Filing Cabinet A",
    notes: overrides.notes ?? null,
    created_at: overrides.created_at ?? "2026-01-01T10:00:00Z",
    updated_at: overrides.updated_at ?? "2026-04-01T10:00:00Z",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── DOCUMENT_TYPES ──────────────────────────────────────────────────────

  describe("DOCUMENT_TYPES", () => {
    it("has exactly 15 items", () => {
      expect(DOCUMENT_TYPES).toHaveLength(15);
    });

    it("has unique type values", () => {
      const types = DOCUMENT_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique label values", () => {
      const labels = DOCUMENT_TYPES.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty type string", () => {
      for (const t of DOCUMENT_TYPES) {
        expect(t.type.length).toBeGreaterThan(0);
      }
    });

    it("every entry has a non-empty label string", () => {
      for (const t of DOCUMENT_TYPES) {
        expect(t.label.length).toBeGreaterThan(0);
      }
    });

    it("includes care_plan", () => {
      expect(DOCUMENT_TYPES.some((t) => t.type === "care_plan")).toBe(true);
    });

    it("includes placement_plan", () => {
      expect(DOCUMENT_TYPES.some((t) => t.type === "placement_plan")).toBe(true);
    });

    it("includes risk_assessment", () => {
      expect(DOCUMENT_TYPES.some((t) => t.type === "risk_assessment")).toBe(true);
    });

    it("includes pep", () => {
      expect(DOCUMENT_TYPES.some((t) => t.type === "pep")).toBe(true);
    });

    it("includes other as a catch-all", () => {
      expect(DOCUMENT_TYPES.some((t) => t.type === "other")).toBe(true);
    });
  });

  // ── DOCUMENT_STATUSES ───────────────────────────────────────────────────

  describe("DOCUMENT_STATUSES", () => {
    it("has exactly 6 items", () => {
      expect(DOCUMENT_STATUSES).toHaveLength(6);
    });

    it("has unique status values", () => {
      const statuses = DOCUMENT_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique label values", () => {
      const labels = DOCUMENT_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty status string", () => {
      for (const s of DOCUMENT_STATUSES) {
        expect(s.status.length).toBeGreaterThan(0);
      }
    });

    it("every entry has a non-empty label string", () => {
      for (const s of DOCUMENT_STATUSES) {
        expect(s.label.length).toBeGreaterThan(0);
      }
    });

    it("includes current", () => {
      expect(DOCUMENT_STATUSES.some((s) => s.status === "current")).toBe(true);
    });

    it("includes overdue", () => {
      expect(DOCUMENT_STATUSES.some((s) => s.status === "overdue")).toBe(true);
    });

    it("includes not_yet_created", () => {
      expect(DOCUMENT_STATUSES.some((s) => s.status === "not_yet_created")).toBe(true);
    });
  });

  // ── REVIEW_FREQUENCIES ──────────────────────────────────────────────────

  describe("REVIEW_FREQUENCIES", () => {
    it("has exactly 5 items", () => {
      expect(REVIEW_FREQUENCIES).toHaveLength(5);
    });

    it("has unique frequency values", () => {
      const freqs = REVIEW_FREQUENCIES.map((f) => f.frequency);
      expect(new Set(freqs).size).toBe(freqs.length);
    });

    it("has unique label values", () => {
      const labels = REVIEW_FREQUENCIES.map((f) => f.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty frequency string", () => {
      for (const f of REVIEW_FREQUENCIES) {
        expect(f.frequency.length).toBeGreaterThan(0);
      }
    });

    it("every entry has a non-empty label string", () => {
      for (const f of REVIEW_FREQUENCIES) {
        expect(f.label.length).toBeGreaterThan(0);
      }
    });

    it("includes monthly", () => {
      expect(REVIEW_FREQUENCIES.some((f) => f.frequency === "monthly")).toBe(true);
    });

    it("includes as_needed", () => {
      expect(REVIEW_FREQUENCIES.some((f) => f.frequency === "as_needed")).toBe(true);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeDocumentMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeDocumentMetrics", () => {
  // ── Empty / base cases ────────────────────────────────────────────────

  it("returns zero for all fields with empty documents array", () => {
    const r = computeDocumentMetrics([], 0, now);
    expect(r.total_documents).toBe(0);
    expect(r.current_count).toBe(0);
    expect(r.due_review_count).toBe(0);
    expect(r.overdue_count).toBe(0);
    expect(r.draft_count).toBe(0);
    expect(r.not_created_count).toBe(0);
    expect(r.children_with_documents).toBe(0);
    expect(r.document_coverage).toBe(0);
    expect(r.social_worker_approved_rate).toBe(0);
    expect(r.child_contributed_rate).toBe(0);
    expect(r.care_plans_current).toBe(0);
    expect(r.placement_plans_current).toBe(0);
    expect(r.risk_assessments_current).toBe(0);
  });

  it("returns empty breakdowns when no documents exist", () => {
    const r = computeDocumentMetrics([], 0, now);
    expect(Object.keys(r.by_document_type)).toHaveLength(0);
    expect(Object.keys(r.by_status)).toHaveLength(0);
    expect(Object.keys(r.by_review_frequency)).toHaveLength(0);
  });

  it("returns 0 coverage when totalChildren is 0 and documents exist", () => {
    const docs = [makeDoc()];
    const r = computeDocumentMetrics(docs, 0, now);
    expect(r.document_coverage).toBe(0);
  });

  // ── Single document ───────────────────────────────────────────────────

  it("counts one current document correctly", () => {
    const docs = [makeDoc({ status: "current" })];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.total_documents).toBe(1);
    expect(r.current_count).toBe(1);
  });

  it("returns 100% coverage for one child with one document", () => {
    const docs = [makeDoc({ child_id: "c1" })];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.document_coverage).toBe(100);
    expect(r.children_with_documents).toBe(1);
  });

  it("returns 50% coverage when one of two children has documents", () => {
    const docs = [makeDoc({ child_id: "c1" })];
    const r = computeDocumentMetrics(docs, 2, now);
    expect(r.document_coverage).toBe(50);
    expect(r.children_with_documents).toBe(1);
  });

  // ── Status counting ────────────────────────────────────────────────────

  it("counts due_review documents", () => {
    const docs = [makeDoc({ status: "due_review" })];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.due_review_count).toBe(1);
  });

  it("counts overdue documents", () => {
    const docs = [makeDoc({ status: "overdue" })];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.overdue_count).toBe(1);
  });

  it("counts draft documents", () => {
    const docs = [makeDoc({ status: "draft" })];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.draft_count).toBe(1);
  });

  it("counts not_yet_created documents", () => {
    const docs = [makeDoc({ status: "not_yet_created" })];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.not_created_count).toBe(1);
  });

  it("counts archived documents in total but not in current", () => {
    const docs = [makeDoc({ status: "archived" })];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.total_documents).toBe(1);
    expect(r.current_count).toBe(0);
  });

  it("counts multiple statuses correctly", () => {
    const docs = [
      makeDoc({ status: "current", child_id: "c1" }),
      makeDoc({ status: "current", child_id: "c1" }),
      makeDoc({ status: "due_review", child_id: "c2" }),
      makeDoc({ status: "overdue", child_id: "c3" }),
      makeDoc({ status: "draft", child_id: "c4" }),
      makeDoc({ status: "not_yet_created", child_id: "c5" }),
      makeDoc({ status: "archived", child_id: "c6" }),
    ];
    const r = computeDocumentMetrics(docs, 6, now);
    expect(r.total_documents).toBe(7);
    expect(r.current_count).toBe(2);
    expect(r.overdue_count).toBe(1);
    expect(r.draft_count).toBe(1);
    expect(r.not_created_count).toBe(1);
  });

  // ── Overdue by date detection ──────────────────────────────────────────

  it("adds to due_review_count when current doc has past next_review_due", () => {
    const docs = [
      makeDoc({
        status: "current",
        next_review_due: daysAgo(5),
      }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    // 0 explicit due_review + 1 overdue-by-date = 1
    expect(r.due_review_count).toBe(1);
  });

  it("does not double-count due_review with overdue-by-date", () => {
    const docs = [
      makeDoc({ status: "due_review" }),
      makeDoc({ status: "current", next_review_due: daysAgo(10) }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    // 1 explicit due_review + 1 overdue-by-date = 2
    expect(r.due_review_count).toBe(2);
  });

  it("does not flag current doc as overdue-by-date when review is in the future", () => {
    const docs = [
      makeDoc({ status: "current", next_review_due: daysFromNow(30) }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.due_review_count).toBe(0);
  });

  it("does not flag current doc as overdue-by-date when next_review_due is null", () => {
    const docs = [
      makeDoc({ status: "current", next_review_due: null }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.due_review_count).toBe(0);
  });

  it("does not flag non-current status as overdue-by-date", () => {
    const docs = [
      makeDoc({ status: "draft", next_review_due: daysAgo(10) }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.due_review_count).toBe(0);
    expect(r.draft_count).toBe(1);
  });

  // ── social_worker_approved_rate ────────────────────────────────────────

  it("returns 100% SW approved rate when all docs are approved", () => {
    const docs = [
      makeDoc({ social_worker_approved: true }),
      makeDoc({ social_worker_approved: true }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.social_worker_approved_rate).toBe(100);
  });

  it("returns 0% SW approved rate when none are approved", () => {
    const docs = [
      makeDoc({ social_worker_approved: false }),
      makeDoc({ social_worker_approved: false }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.social_worker_approved_rate).toBe(0);
  });

  it("returns 50% SW approved rate for half approved", () => {
    const docs = [
      makeDoc({ social_worker_approved: true }),
      makeDoc({ social_worker_approved: false }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.social_worker_approved_rate).toBe(50);
  });

  it("rounds SW approved rate to one decimal place", () => {
    const docs = [
      makeDoc({ social_worker_approved: true }),
      makeDoc({ social_worker_approved: true }),
      makeDoc({ social_worker_approved: false }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    // 2/3 = 66.666... => round(666.66) / 10 = 66.7
    expect(r.social_worker_approved_rate).toBe(66.7);
  });

  // ── child_contributed_rate ─────────────────────────────────────────────

  it("returns 100% child contributed rate when all docs contributed", () => {
    const docs = [
      makeDoc({ child_contributed: true }),
      makeDoc({ child_contributed: true }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.child_contributed_rate).toBe(100);
  });

  it("returns 0% child contributed rate when none contributed", () => {
    const docs = [
      makeDoc({ child_contributed: false }),
      makeDoc({ child_contributed: false }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.child_contributed_rate).toBe(0);
  });

  it("returns 50% child contributed rate for half contributed", () => {
    const docs = [
      makeDoc({ child_contributed: true }),
      makeDoc({ child_contributed: false }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.child_contributed_rate).toBe(50);
  });

  it("rounds child contributed rate to one decimal place", () => {
    const docs = [
      makeDoc({ child_contributed: true }),
      makeDoc({ child_contributed: false }),
      makeDoc({ child_contributed: false }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    // 1/3 = 33.333... => round(333.33) / 10 = 33.3
    expect(r.child_contributed_rate).toBe(33.3);
  });

  // ── care_plans_current / placement_plans_current / risk_assessments_current ──

  it("counts current care plans", () => {
    const docs = [
      makeDoc({ document_type: "care_plan", status: "current" }),
      makeDoc({ document_type: "care_plan", status: "overdue" }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.care_plans_current).toBe(1);
  });

  it("counts current placement plans", () => {
    const docs = [
      makeDoc({ document_type: "placement_plan", status: "current" }),
      makeDoc({ document_type: "placement_plan", status: "draft" }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.placement_plans_current).toBe(1);
  });

  it("counts current risk assessments", () => {
    const docs = [
      makeDoc({ document_type: "risk_assessment", status: "current" }),
      makeDoc({ document_type: "risk_assessment", status: "archived" }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.risk_assessments_current).toBe(1);
  });

  it("returns 0 care_plans_current when none are current", () => {
    const docs = [
      makeDoc({ document_type: "care_plan", status: "overdue" }),
      makeDoc({ document_type: "care_plan", status: "draft" }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.care_plans_current).toBe(0);
  });

  it("returns 0 placement_plans_current when none are current", () => {
    const docs = [
      makeDoc({ document_type: "placement_plan", status: "overdue" }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.placement_plans_current).toBe(0);
  });

  it("returns 0 risk_assessments_current when none are current", () => {
    const docs = [
      makeDoc({ document_type: "risk_assessment", status: "not_yet_created" }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.risk_assessments_current).toBe(0);
  });

  it("does not count non-matching document types in specific-plan counters", () => {
    const docs = [
      makeDoc({ document_type: "pep", status: "current" }),
      makeDoc({ document_type: "health_plan", status: "current" }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.care_plans_current).toBe(0);
    expect(r.placement_plans_current).toBe(0);
    expect(r.risk_assessments_current).toBe(0);
  });

  it("counts multiple current care plans across children", () => {
    const docs = [
      makeDoc({ document_type: "care_plan", status: "current", child_id: "c1" }),
      makeDoc({ document_type: "care_plan", status: "current", child_id: "c2" }),
      makeDoc({ document_type: "care_plan", status: "current", child_id: "c3" }),
    ];
    const r = computeDocumentMetrics(docs, 3, now);
    expect(r.care_plans_current).toBe(3);
  });

  // ── by_document_type breakdown ─────────────────────────────────────────

  it("groups documents by type", () => {
    const docs = [
      makeDoc({ document_type: "care_plan" }),
      makeDoc({ document_type: "care_plan" }),
      makeDoc({ document_type: "pep" }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.by_document_type).toEqual({ care_plan: 2, pep: 1 });
  });

  it("returns empty object for by_document_type with no docs", () => {
    const r = computeDocumentMetrics([], 0, now);
    expect(r.by_document_type).toEqual({});
  });

  it("includes all distinct document types in breakdown", () => {
    const docs = [
      makeDoc({ document_type: "care_plan" }),
      makeDoc({ document_type: "placement_plan" }),
      makeDoc({ document_type: "health_plan" }),
      makeDoc({ document_type: "pep" }),
      makeDoc({ document_type: "risk_assessment" }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(Object.keys(r.by_document_type).sort()).toEqual([
      "care_plan",
      "health_plan",
      "pep",
      "placement_plan",
      "risk_assessment",
    ]);
  });

  // ── by_status breakdown ────────────────────────────────────────────────

  it("groups documents by status", () => {
    const docs = [
      makeDoc({ status: "current" }),
      makeDoc({ status: "current" }),
      makeDoc({ status: "overdue" }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.by_status).toEqual({ current: 2, overdue: 1 });
  });

  it("returns empty object for by_status with no docs", () => {
    const r = computeDocumentMetrics([], 0, now);
    expect(r.by_status).toEqual({});
  });

  it("includes all six statuses when present", () => {
    const docs = [
      makeDoc({ status: "current" }),
      makeDoc({ status: "due_review" }),
      makeDoc({ status: "overdue" }),
      makeDoc({ status: "draft" }),
      makeDoc({ status: "not_yet_created" }),
      makeDoc({ status: "archived" }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(Object.keys(r.by_status).sort()).toEqual([
      "archived",
      "current",
      "draft",
      "due_review",
      "not_yet_created",
      "overdue",
    ]);
  });

  // ── by_review_frequency breakdown ──────────────────────────────────────

  it("groups documents by review frequency", () => {
    const docs = [
      makeDoc({ review_frequency: "monthly" }),
      makeDoc({ review_frequency: "monthly" }),
      makeDoc({ review_frequency: "quarterly" }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.by_review_frequency).toEqual({ monthly: 2, quarterly: 1 });
  });

  it("returns empty object for by_review_frequency with no docs", () => {
    const r = computeDocumentMetrics([], 0, now);
    expect(r.by_review_frequency).toEqual({});
  });

  it("includes all five frequencies when present", () => {
    const docs = [
      makeDoc({ review_frequency: "monthly" }),
      makeDoc({ review_frequency: "quarterly" }),
      makeDoc({ review_frequency: "six_monthly" }),
      makeDoc({ review_frequency: "annually" }),
      makeDoc({ review_frequency: "as_needed" }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(Object.keys(r.by_review_frequency).sort()).toEqual([
      "annually",
      "as_needed",
      "monthly",
      "quarterly",
      "six_monthly",
    ]);
  });

  // ── children_with_documents ────────────────────────────────────────────

  it("counts unique children correctly", () => {
    const docs = [
      makeDoc({ child_id: "c1" }),
      makeDoc({ child_id: "c1" }),
      makeDoc({ child_id: "c2" }),
      makeDoc({ child_id: "c3" }),
    ];
    const r = computeDocumentMetrics(docs, 5, now);
    expect(r.children_with_documents).toBe(3);
  });

  it("does not count duplicates in children_with_documents", () => {
    const docs = [
      makeDoc({ child_id: "c1" }),
      makeDoc({ child_id: "c1" }),
      makeDoc({ child_id: "c1" }),
    ];
    const r = computeDocumentMetrics(docs, 3, now);
    expect(r.children_with_documents).toBe(1);
  });

  // ── Coverage calculations ──────────────────────────────────────────────

  it("calculates coverage percentage accurately", () => {
    const docs = [
      makeDoc({ child_id: "c1" }),
      makeDoc({ child_id: "c2" }),
      makeDoc({ child_id: "c3" }),
    ];
    const r = computeDocumentMetrics(docs, 4, now);
    // 3/4 = 75%
    expect(r.document_coverage).toBe(75);
  });

  it("rounds coverage to one decimal place", () => {
    const docs = [
      makeDoc({ child_id: "c1" }),
      makeDoc({ child_id: "c2" }),
    ];
    const r = computeDocumentMetrics(docs, 3, now);
    // 2/3 = 66.666... => 66.7
    expect(r.document_coverage).toBe(66.7);
  });

  it("returns 100% coverage when all children have documents", () => {
    const docs = [
      makeDoc({ child_id: "c1" }),
      makeDoc({ child_id: "c2" }),
    ];
    const r = computeDocumentMetrics(docs, 2, now);
    expect(r.document_coverage).toBe(100);
  });

  // ── Complex scenario ───────────────────────────────────────────────────

  it("computes correct metrics for a realistic dataset", () => {
    const docs = [
      // Child 1 — 3 docs
      makeDoc({ child_id: "c1", document_type: "care_plan", status: "current", social_worker_approved: true, child_contributed: true, review_frequency: "quarterly" }),
      makeDoc({ child_id: "c1", document_type: "placement_plan", status: "current", social_worker_approved: true, child_contributed: false, review_frequency: "six_monthly" }),
      makeDoc({ child_id: "c1", document_type: "risk_assessment", status: "due_review", social_worker_approved: false, child_contributed: false, review_frequency: "monthly" }),
      // Child 2 — 2 docs
      makeDoc({ child_id: "c2", document_type: "care_plan", status: "overdue", social_worker_approved: false, child_contributed: true, review_frequency: "quarterly" }),
      makeDoc({ child_id: "c2", document_type: "pep", status: "draft", social_worker_approved: false, child_contributed: false, review_frequency: "annually" }),
      // Child 3 — 1 doc
      makeDoc({ child_id: "c3", document_type: "health_plan", status: "not_yet_created", social_worker_approved: false, child_contributed: false, review_frequency: "as_needed" }),
    ];
    const r = computeDocumentMetrics(docs, 4, now);
    expect(r.total_documents).toBe(6);
    expect(r.current_count).toBe(2);
    expect(r.overdue_count).toBe(1);
    expect(r.draft_count).toBe(1);
    expect(r.not_created_count).toBe(1);
    expect(r.children_with_documents).toBe(3);
    expect(r.document_coverage).toBe(75);
    // SW approved: 2/6 = 33.3
    expect(r.social_worker_approved_rate).toBe(33.3);
    // Child contributed: 2/6 = 33.3
    expect(r.child_contributed_rate).toBe(33.3);
    expect(r.care_plans_current).toBe(1);
    expect(r.placement_plans_current).toBe(1);
    expect(r.risk_assessments_current).toBe(0);
  });

  it("handles a large dataset without error", () => {
    const docs: KeyDocument[] = [];
    for (let i = 0; i < 200; i++) {
      docs.push(makeDoc({ child_id: `c${i % 50}`, status: "current" }));
    }
    const r = computeDocumentMetrics(docs, 50, now);
    expect(r.total_documents).toBe(200);
    expect(r.children_with_documents).toBe(50);
    expect(r.document_coverage).toBe(100);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────

  it("returns 0 rates when documents array is empty even with positive totalChildren", () => {
    const r = computeDocumentMetrics([], 5, now);
    expect(r.social_worker_approved_rate).toBe(0);
    expect(r.child_contributed_rate).toBe(0);
  });

  it("does not count overdue-by-date for due_review status", () => {
    const docs = [
      makeDoc({ status: "due_review", next_review_due: daysAgo(5) }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    // 1 explicit due_review + 0 overdue-by-date (only current triggers) = 1
    expect(r.due_review_count).toBe(1);
  });

  it("does not count overdue-by-date for archived status", () => {
    const docs = [
      makeDoc({ status: "archived", next_review_due: daysAgo(30) }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.due_review_count).toBe(0);
  });

  it("counts all overdue-by-date current docs", () => {
    const docs = [
      makeDoc({ status: "current", next_review_due: daysAgo(1), child_id: "c1" }),
      makeDoc({ status: "current", next_review_due: daysAgo(10), child_id: "c2" }),
      makeDoc({ status: "current", next_review_due: daysAgo(100), child_id: "c3" }),
    ];
    const r = computeDocumentMetrics(docs, 3, now);
    expect(r.due_review_count).toBe(3);
  });

  it("returns correct by_document_type count for single type", () => {
    const docs = [
      makeDoc({ document_type: "safety_plan" }),
      makeDoc({ document_type: "safety_plan" }),
      makeDoc({ document_type: "safety_plan" }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.by_document_type).toEqual({ safety_plan: 3 });
  });

  it("returns correct by_review_frequency for single frequency", () => {
    const docs = [
      makeDoc({ review_frequency: "annually" }),
      makeDoc({ review_frequency: "annually" }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.by_review_frequency).toEqual({ annually: 2 });
  });

  it("handles mix of null and non-null next_review_due correctly", () => {
    const docs = [
      makeDoc({ status: "current", next_review_due: null }),
      makeDoc({ status: "current", next_review_due: daysAgo(5) }),
      makeDoc({ status: "current", next_review_due: daysFromNow(30) }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    // Only the one with past date should be counted as overdue-by-date
    expect(r.due_review_count).toBe(1);
    expect(r.current_count).toBe(3);
  });

  it("counts multiple current placement plans and risk assessments", () => {
    const docs = [
      makeDoc({ document_type: "placement_plan", status: "current", child_id: "c1" }),
      makeDoc({ document_type: "placement_plan", status: "current", child_id: "c2" }),
      makeDoc({ document_type: "risk_assessment", status: "current", child_id: "c1" }),
      makeDoc({ document_type: "risk_assessment", status: "current", child_id: "c2" }),
      makeDoc({ document_type: "risk_assessment", status: "current", child_id: "c3" }),
    ];
    const r = computeDocumentMetrics(docs, 3, now);
    expect(r.placement_plans_current).toBe(2);
    expect(r.risk_assessments_current).toBe(3);
  });

  it("returns 0 SW approved rate with single non-approved doc", () => {
    const docs = [makeDoc({ social_worker_approved: false })];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.social_worker_approved_rate).toBe(0);
  });

  it("returns 100% child contributed rate with single contributed doc", () => {
    const docs = [makeDoc({ child_contributed: true })];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.child_contributed_rate).toBe(100);
  });

  it("does not count not_yet_created doc as overdue-by-date", () => {
    const docs = [
      makeDoc({ status: "not_yet_created", next_review_due: daysAgo(10) }),
    ];
    const r = computeDocumentMetrics(docs, 1, now);
    expect(r.due_review_count).toBe(0);
    expect(r.not_created_count).toBe(1);
  });

  it("calculates 33.3% coverage for 1 out of 3 children", () => {
    const docs = [makeDoc({ child_id: "c1" })];
    const r = computeDocumentMetrics(docs, 3, now);
    expect(r.document_coverage).toBe(33.3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyDocumentAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyDocumentAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────────

  it("returns no alerts when documents list is empty and totalChildren is 0", () => {
    const alerts = identifyDocumentAlerts([], 0, now);
    expect(alerts).toHaveLength(0);
  });

  it("returns no alerts when every child has current care and placement plans", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "care_plan", status: "current" }),
      makeDoc({ child_id: "c1", document_type: "placement_plan", status: "current" }),
      makeDoc({ child_id: "c2", document_type: "care_plan", status: "current" }),
      makeDoc({ child_id: "c2", document_type: "placement_plan", status: "current" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 2, now);
    expect(alerts).toHaveLength(0);
  });

  it("returns no alerts for all-clean scenario with future review dates", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "care_plan", status: "current", next_review_due: daysFromNow(30) }),
      makeDoc({ child_id: "c1", document_type: "placement_plan", status: "current", next_review_due: daysFromNow(60) }),
    ];
    const alerts = identifyDocumentAlerts(docs, 1, now);
    expect(alerts).toHaveLength(0);
  });

  // ── missing_care_plan ──────────────────────────────────────────────────

  it("raises critical alert when a child has no care plan", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "placement_plan", status: "current" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 2, now);
    const carePlanAlerts = alerts.filter((a) => a.type === "missing_care_plan");
    expect(carePlanAlerts).toHaveLength(1);
    expect(carePlanAlerts[0].severity).toBe("critical");
    expect(carePlanAlerts[0].id).toBe("care_plan_gap");
  });

  it("counts correct gap for missing_care_plan", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "care_plan", status: "current" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 3, now);
    const cpAlert = alerts.find((a) => a.type === "missing_care_plan");
    expect(cpAlert).toBeDefined();
    expect(cpAlert!.message).toContain("2");
    expect(cpAlert!.message).toContain("children do");
  });

  it("uses singular when only 1 child missing care plan", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "care_plan", status: "current" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 2, now);
    const cpAlert = alerts.find((a) => a.type === "missing_care_plan");
    expect(cpAlert).toBeDefined();
    expect(cpAlert!.message).toContain("1");
    expect(cpAlert!.message).toContain("child does");
  });

  it("does not raise missing_care_plan if all children have one", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "care_plan", status: "current" }),
      makeDoc({ child_id: "c2", document_type: "care_plan", status: "due_review" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 2, now);
    const cpAlerts = alerts.filter((a) => a.type === "missing_care_plan");
    expect(cpAlerts).toHaveLength(0);
  });

  it("counts due_review care plan as present (not missing)", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "care_plan", status: "due_review" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 1, now);
    const cpAlerts = alerts.filter((a) => a.type === "missing_care_plan");
    expect(cpAlerts).toHaveLength(0);
  });

  it("does not count overdue care plan as present", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "care_plan", status: "overdue" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 1, now);
    const cpAlerts = alerts.filter((a) => a.type === "missing_care_plan");
    expect(cpAlerts).toHaveLength(1);
  });

  it("does not count draft care plan as present", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "care_plan", status: "draft" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 1, now);
    const cpAlerts = alerts.filter((a) => a.type === "missing_care_plan");
    expect(cpAlerts).toHaveLength(1);
  });

  it("does not count not_yet_created care plan as present", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "care_plan", status: "not_yet_created" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 1, now);
    const cpAlerts = alerts.filter((a) => a.type === "missing_care_plan");
    expect(cpAlerts).toHaveLength(1);
  });

  it("does not count archived care plan as present", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "care_plan", status: "archived" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 1, now);
    const cpAlerts = alerts.filter((a) => a.type === "missing_care_plan");
    expect(cpAlerts).toHaveLength(1);
  });

  it("does not raise missing_care_plan when totalChildren is 0", () => {
    const alerts = identifyDocumentAlerts([], 0, now);
    const cpAlerts = alerts.filter((a) => a.type === "missing_care_plan");
    expect(cpAlerts).toHaveLength(0);
  });

  // ── missing_placement_plan ─────────────────────────────────────────────

  it("raises critical alert when a child has no placement plan", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "care_plan", status: "current" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 2, now);
    const ppAlerts = alerts.filter((a) => a.type === "missing_placement_plan");
    expect(ppAlerts).toHaveLength(1);
    expect(ppAlerts[0].severity).toBe("critical");
    expect(ppAlerts[0].id).toBe("placement_plan_gap");
  });

  it("counts correct gap for missing_placement_plan", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "placement_plan", status: "current" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 4, now);
    const ppAlert = alerts.find((a) => a.type === "missing_placement_plan");
    expect(ppAlert).toBeDefined();
    expect(ppAlert!.message).toContain("3");
    expect(ppAlert!.message).toContain("children do");
  });

  it("uses singular when only 1 child missing placement plan", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "placement_plan", status: "current" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 2, now);
    const ppAlert = alerts.find((a) => a.type === "missing_placement_plan");
    expect(ppAlert).toBeDefined();
    expect(ppAlert!.message).toContain("child does");
  });

  it("does not raise missing_placement_plan if all children have one", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "placement_plan", status: "current" }),
      makeDoc({ child_id: "c2", document_type: "placement_plan", status: "due_review" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 2, now);
    const ppAlerts = alerts.filter((a) => a.type === "missing_placement_plan");
    expect(ppAlerts).toHaveLength(0);
  });

  it("counts due_review placement plan as present", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "placement_plan", status: "due_review" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 1, now);
    const ppAlerts = alerts.filter((a) => a.type === "missing_placement_plan");
    expect(ppAlerts).toHaveLength(0);
  });

  it("does not count overdue placement plan as present", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "placement_plan", status: "overdue" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 1, now);
    const ppAlerts = alerts.filter((a) => a.type === "missing_placement_plan");
    expect(ppAlerts).toHaveLength(1);
  });

  it("includes Reg 8 reference in missing_placement_plan message", () => {
    const docs: KeyDocument[] = [];
    const alerts = identifyDocumentAlerts(docs, 1, now);
    const ppAlert = alerts.find((a) => a.type === "missing_placement_plan");
    expect(ppAlert).toBeDefined();
    expect(ppAlert!.message).toContain("Reg 8");
  });

  it("does not raise missing_placement_plan when totalChildren is 0", () => {
    const alerts = identifyDocumentAlerts([], 0, now);
    const ppAlerts = alerts.filter((a) => a.type === "missing_placement_plan");
    expect(ppAlerts).toHaveLength(0);
  });

  // ── document_overdue ───────────────────────────────────────────────────

  it("raises high alert for each overdue document", () => {
    const docs = [
      makeDoc({ id: "d1", status: "overdue", document_name: "Doc A", child_name: "Child A" }),
      makeDoc({ id: "d2", status: "overdue", document_name: "Doc B", child_name: "Child B" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const overdueAlerts = alerts.filter((a) => a.type === "document_overdue");
    expect(overdueAlerts).toHaveLength(2);
    expect(overdueAlerts[0].severity).toBe("high");
    expect(overdueAlerts[1].severity).toBe("high");
  });

  it("includes document name in overdue alert message", () => {
    const docs = [
      makeDoc({ id: "d1", status: "overdue", document_name: "Care Plan — Child A", child_name: "Child A" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const a = alerts.find((a) => a.type === "document_overdue");
    expect(a).toBeDefined();
    expect(a!.message).toContain("Care Plan — Child A");
  });

  it("includes child name in overdue alert message", () => {
    const docs = [
      makeDoc({ id: "d1", status: "overdue", document_name: "Doc A", child_name: "Alice" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const a = alerts.find((a) => a.type === "document_overdue");
    expect(a!.message).toContain("Alice");
  });

  it("includes next_review_due in overdue alert message when available", () => {
    const docs = [
      makeDoc({ id: "d1", status: "overdue", next_review_due: "2026-03-15" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const a = alerts.find((a) => a.type === "document_overdue");
    expect(a!.message).toContain("2026-03-15");
  });

  it("shows 'unknown' in overdue alert when next_review_due is null", () => {
    const docs = [
      makeDoc({ id: "d1", status: "overdue", next_review_due: null }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const a = alerts.find((a) => a.type === "document_overdue");
    expect(a!.message).toContain("unknown");
  });

  it("sets alert id to the document id for overdue alerts", () => {
    const docs = [makeDoc({ id: "over-doc-99", status: "overdue" })];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const a = alerts.find((a) => a.type === "document_overdue");
    expect(a!.id).toBe("over-doc-99");
  });

  it("does not raise document_overdue for current documents", () => {
    const docs = [makeDoc({ status: "current" })];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const overdueAlerts = alerts.filter((a) => a.type === "document_overdue");
    expect(overdueAlerts).toHaveLength(0);
  });

  // ── review_overdue_by_date ─────────────────────────────────────────────

  it("raises high alert when current doc is past next_review_due", () => {
    const docs = [
      makeDoc({
        id: "d1",
        status: "current",
        next_review_due: daysAgo(10),
        document_name: "PEP — Child B",
        child_name: "Child B",
      }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const rbdAlerts = alerts.filter((a) => a.type === "review_overdue_by_date");
    expect(rbdAlerts).toHaveLength(1);
    expect(rbdAlerts[0].severity).toBe("high");
  });

  it("includes document name in review_overdue_by_date alert", () => {
    const docs = [
      makeDoc({
        id: "d1",
        status: "current",
        next_review_due: daysAgo(5),
        document_name: "Health Plan — Child C",
        child_name: "Child C",
      }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const a = alerts.find((a) => a.type === "review_overdue_by_date");
    expect(a!.message).toContain("Health Plan — Child C");
  });

  it("includes child name in review_overdue_by_date alert", () => {
    const docs = [
      makeDoc({
        id: "d1",
        status: "current",
        next_review_due: daysAgo(5),
        child_name: "Bob",
      }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const a = alerts.find((a) => a.type === "review_overdue_by_date");
    expect(a!.message).toContain("Bob");
  });

  it("includes the past review date in review_overdue_by_date alert", () => {
    const pastDate = daysAgo(7);
    const docs = [
      makeDoc({ id: "d1", status: "current", next_review_due: pastDate }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const a = alerts.find((a) => a.type === "review_overdue_by_date");
    expect(a!.message).toContain(pastDate);
  });

  it("sets alert id to the document id for review_overdue_by_date", () => {
    const docs = [
      makeDoc({ id: "rbd-doc-42", status: "current", next_review_due: daysAgo(1) }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const a = alerts.find((a) => a.type === "review_overdue_by_date");
    expect(a!.id).toBe("rbd-doc-42");
  });

  it("does not raise review_overdue_by_date when review date is in the future", () => {
    const docs = [
      makeDoc({ status: "current", next_review_due: daysFromNow(30) }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const rbdAlerts = alerts.filter((a) => a.type === "review_overdue_by_date");
    expect(rbdAlerts).toHaveLength(0);
  });

  it("does not raise review_overdue_by_date when next_review_due is null", () => {
    const docs = [
      makeDoc({ status: "current", next_review_due: null }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const rbdAlerts = alerts.filter((a) => a.type === "review_overdue_by_date");
    expect(rbdAlerts).toHaveLength(0);
  });

  it("does not raise review_overdue_by_date for non-current status", () => {
    const docs = [
      makeDoc({ status: "overdue", next_review_due: daysAgo(10) }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const rbdAlerts = alerts.filter((a) => a.type === "review_overdue_by_date");
    expect(rbdAlerts).toHaveLength(0);
  });

  it("does not raise review_overdue_by_date for draft status even with past date", () => {
    const docs = [
      makeDoc({ status: "draft", next_review_due: daysAgo(10) }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const rbdAlerts = alerts.filter((a) => a.type === "review_overdue_by_date");
    expect(rbdAlerts).toHaveLength(0);
  });

  // ── document_not_created ───────────────────────────────────────────────

  it("raises critical alert for not_yet_created care_plan", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "care_plan", document_name: "Care Plan — Child A", child_name: "Child A" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts).toHaveLength(1);
    expect(ncAlerts[0].severity).toBe("critical");
  });

  it("raises critical alert for not_yet_created placement_plan", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "placement_plan" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts).toHaveLength(1);
    expect(ncAlerts[0].severity).toBe("critical");
  });

  it("raises critical alert for not_yet_created risk_assessment", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "risk_assessment" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts).toHaveLength(1);
    expect(ncAlerts[0].severity).toBe("critical");
  });

  it("raises medium alert for not_yet_created pep", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "pep" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts).toHaveLength(1);
    expect(ncAlerts[0].severity).toBe("medium");
  });

  it("raises medium alert for not_yet_created health_plan", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "health_plan" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts[0].severity).toBe("medium");
  });

  it("raises medium alert for not_yet_created behaviour_support_plan", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "behaviour_support_plan" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts[0].severity).toBe("medium");
  });

  it("raises medium alert for not_yet_created therapy_plan", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "therapy_plan" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts[0].severity).toBe("medium");
  });

  it("raises medium alert for not_yet_created contact_plan", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "contact_plan" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts[0].severity).toBe("medium");
  });

  it("raises medium alert for not_yet_created other document", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "other" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts[0].severity).toBe("medium");
  });

  it("includes document name in document_not_created alert message", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_name: "PEP — Child X", document_type: "pep" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const a = alerts.find((a) => a.type === "document_not_created");
    expect(a!.message).toContain("PEP — Child X");
  });

  it("includes child name in document_not_created alert message", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", child_name: "Eve", document_type: "pep" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const a = alerts.find((a) => a.type === "document_not_created");
    expect(a!.message).toContain("Eve");
  });

  it("sets alert id to the document id for document_not_created", () => {
    const docs = [
      makeDoc({ id: "nc-doc-77", status: "not_yet_created", document_type: "pep" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const a = alerts.find((a) => a.type === "document_not_created");
    expect(a!.id).toBe("nc-doc-77");
  });

  it("does not raise document_not_created for current documents", () => {
    const docs = [makeDoc({ status: "current" })];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts).toHaveLength(0);
  });

  it("does not raise document_not_created for draft documents", () => {
    const docs = [makeDoc({ status: "draft" })];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts).toHaveLength(0);
  });

  it("raises multiple document_not_created alerts for multiple missing docs", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "care_plan" }),
      makeDoc({ id: "d2", status: "not_yet_created", document_type: "pep" }),
      makeDoc({ id: "d3", status: "not_yet_created", document_type: "risk_assessment" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts).toHaveLength(3);
  });

  // ── Combined scenario ──────────────────────────────────────────────────

  it("returns multiple alert types for a problematic dataset", () => {
    const docs = [
      // Child 1 has care plan but overdue
      makeDoc({ child_id: "c1", id: "d1", document_type: "care_plan", status: "overdue", next_review_due: daysAgo(15) }),
      // Child 1 has no placement plan
      // Child 2 has nothing
      // Not-yet-created risk assessment
      makeDoc({ child_id: "c2", id: "d2", document_type: "risk_assessment", status: "not_yet_created" }),
      // A current doc with past review date
      makeDoc({ child_id: "c1", id: "d3", document_type: "health_plan", status: "current", next_review_due: daysAgo(5) }),
    ];
    const alerts = identifyDocumentAlerts(docs, 2, now);
    const types = alerts.map((a) => a.type);
    // Expect: missing_care_plan (c2 has no current/due_review care plan, c1 has overdue)
    expect(types).toContain("missing_care_plan");
    // Expect: missing_placement_plan (both children)
    expect(types).toContain("missing_placement_plan");
    // Expect: document_overdue (d1)
    expect(types).toContain("document_overdue");
    // Expect: review_overdue_by_date (d3)
    expect(types).toContain("review_overdue_by_date");
    // Expect: document_not_created (d2 risk_assessment — critical)
    expect(types).toContain("document_not_created");
  });

  it("returns no document_overdue alerts when all are current", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "care_plan", status: "current", next_review_due: daysFromNow(30) }),
      makeDoc({ child_id: "c1", document_type: "placement_plan", status: "current", next_review_due: daysFromNow(60) }),
    ];
    const alerts = identifyDocumentAlerts(docs, 1, now);
    const overdueAlerts = alerts.filter((a) => a.type === "document_overdue");
    expect(overdueAlerts).toHaveLength(0);
  });

  it("handles empty documents with positive totalChildren", () => {
    const alerts = identifyDocumentAlerts([], 3, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("missing_care_plan");
    expect(types).toContain("missing_placement_plan");
    expect(alerts.find((a) => a.type === "missing_care_plan")!.message).toContain("3");
    expect(alerts.find((a) => a.type === "missing_placement_plan")!.message).toContain("3");
  });

  it("only raises gap alerts, not per-doc alerts, when no documents exist", () => {
    const alerts = identifyDocumentAlerts([], 2, now);
    // Should only have missing_care_plan and missing_placement_plan — no overdue/not-created
    const docOverdue = alerts.filter((a) => a.type === "document_overdue");
    const reviewOverdue = alerts.filter((a) => a.type === "review_overdue_by_date");
    const notCreated = alerts.filter((a) => a.type === "document_not_created");
    expect(docOverdue).toHaveLength(0);
    expect(reviewOverdue).toHaveLength(0);
    expect(notCreated).toHaveLength(0);
  });

  it("raises separate alerts for separate overdue documents", () => {
    const docs = [
      makeDoc({ id: "od-1", status: "overdue", child_id: "c1", child_name: "Child A" }),
      makeDoc({ id: "od-2", status: "overdue", child_id: "c2", child_name: "Child B" }),
      makeDoc({ id: "od-3", status: "overdue", child_id: "c3", child_name: "Child C" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const overdueAlerts = alerts.filter((a) => a.type === "document_overdue");
    expect(overdueAlerts).toHaveLength(3);
    const ids = overdueAlerts.map((a) => a.id);
    expect(ids).toContain("od-1");
    expect(ids).toContain("od-2");
    expect(ids).toContain("od-3");
  });

  it("does not duplicate alerts for the same document", () => {
    // A document that is overdue (status) — should only get document_overdue, not review_overdue_by_date
    const docs = [
      makeDoc({
        id: "d1",
        status: "overdue",
        next_review_due: daysAgo(10),
        document_type: "pep",
      }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const rbdAlerts = alerts.filter((a) => a.type === "review_overdue_by_date");
    expect(rbdAlerts).toHaveLength(0); // Only current docs trigger this
    const overdueAlerts = alerts.filter((a) => a.type === "document_overdue");
    expect(overdueAlerts).toHaveLength(1);
  });

  it("raises both missing_care_plan and missing_placement_plan for 5 children with no docs", () => {
    const alerts = identifyDocumentAlerts([], 5, now);
    const cpAlert = alerts.find((a) => a.type === "missing_care_plan");
    const ppAlert = alerts.find((a) => a.type === "missing_placement_plan");
    expect(cpAlert).toBeDefined();
    expect(ppAlert).toBeDefined();
    expect(cpAlert!.message).toContain("5");
    expect(ppAlert!.message).toContain("5");
  });

  it("includes statutory requirement note in missing_care_plan message", () => {
    const alerts = identifyDocumentAlerts([], 1, now);
    const cpAlert = alerts.find((a) => a.type === "missing_care_plan");
    expect(cpAlert).toBeDefined();
    expect(cpAlert!.message).toContain("statutory requirement");
  });

  it("raises multiple review_overdue_by_date alerts for multiple past-due current docs", () => {
    const docs = [
      makeDoc({ id: "d1", status: "current", next_review_due: daysAgo(5), child_id: "c1" }),
      makeDoc({ id: "d2", status: "current", next_review_due: daysAgo(15), child_id: "c2" }),
      makeDoc({ id: "d3", status: "current", next_review_due: daysAgo(30), child_id: "c3" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const rbdAlerts = alerts.filter((a) => a.type === "review_overdue_by_date");
    expect(rbdAlerts).toHaveLength(3);
  });

  it("raises medium alert for not_yet_created missing_protocol", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "missing_protocol" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts[0].severity).toBe("medium");
  });

  it("raises medium alert for not_yet_created transition_plan", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "transition_plan" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts[0].severity).toBe("medium");
  });

  it("raises medium alert for not_yet_created safety_plan", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "safety_plan" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts[0].severity).toBe("medium");
  });

  it("raises medium alert for not_yet_created pathway_plan", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "pathway_plan" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts[0].severity).toBe("medium");
  });

  it("raises medium alert for not_yet_created delegated_authority", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "delegated_authority" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts[0].severity).toBe("medium");
  });

  it("raises medium alert for not_yet_created life_story_work", () => {
    const docs = [
      makeDoc({ id: "d1", status: "not_yet_created", document_type: "life_story_work" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 0, now);
    const ncAlerts = alerts.filter((a) => a.type === "document_not_created");
    expect(ncAlerts[0].severity).toBe("medium");
  });

  it("treats archived documents as not present for care plan gap detection", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "care_plan", status: "archived" }),
      makeDoc({ child_id: "c1", document_type: "placement_plan", status: "current" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 1, now);
    const cpAlerts = alerts.filter((a) => a.type === "missing_care_plan");
    expect(cpAlerts).toHaveLength(1);
  });

  it("treats archived documents as not present for placement plan gap detection", () => {
    const docs = [
      makeDoc({ child_id: "c1", document_type: "placement_plan", status: "archived" }),
      makeDoc({ child_id: "c1", document_type: "care_plan", status: "current" }),
    ];
    const alerts = identifyDocumentAlerts(docs, 1, now);
    const ppAlerts = alerts.filter((a) => a.type === "missing_placement_plan");
    expect(ppAlerts).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD fallback (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

describe("CRUD fallback (Supabase disabled)", () => {
  it("listDocuments returns ok:true with empty array", async () => {
    const { listDocuments } = await import("../key-documents-service");
    const result = await listDocuments("home-1");
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listDocuments returns ok:true with filters", async () => {
    const { listDocuments } = await import("../key-documents-service");
    const result = await listDocuments("home-1", {
      childId: "c1",
      documentType: "care_plan",
      status: "current",
      limit: 10,
    });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listDocuments returns ok:true with only childId filter", async () => {
    const { listDocuments } = await import("../key-documents-service");
    const result = await listDocuments("home-1", { childId: "c1" });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listDocuments returns ok:true with only documentType filter", async () => {
    const { listDocuments } = await import("../key-documents-service");
    const result = await listDocuments("home-1", { documentType: "pep" });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listDocuments returns ok:true with only status filter", async () => {
    const { listDocuments } = await import("../key-documents-service");
    const result = await listDocuments("home-1", { status: "overdue" });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listDocuments returns ok:true with only limit filter", async () => {
    const { listDocuments } = await import("../key-documents-service");
    const result = await listDocuments("home-1", { limit: 50 });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("createDocument returns ok:false with error message", async () => {
    const { createDocument } = await import("../key-documents-service");
    const result = await createDocument({
      homeId: "home-1",
      childName: "Child A",
      childId: "c1",
      documentType: "care_plan",
      documentName: "Care Plan — Child A",
      status: "draft",
      createdDate: "2026-05-01",
      reviewFrequency: "quarterly",
      responsiblePerson: "Staff A",
      socialWorkerApproved: false,
      childContributed: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createDocument returns ok:false with optional fields", async () => {
    const { createDocument } = await import("../key-documents-service");
    const result = await createDocument({
      homeId: "home-1",
      childName: "Child B",
      childId: "c2",
      documentType: "placement_plan",
      documentName: "Placement Plan — Child B",
      status: "current",
      createdDate: "2026-04-01",
      lastReviewed: "2026-05-01",
      nextReviewDue: "2026-07-01",
      reviewFrequency: "six_monthly",
      responsiblePerson: "Staff B",
      socialWorkerApproved: true,
      childContributed: true,
      storedLocation: "Filing Cabinet B",
      notes: "All in order",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateDocument returns ok:false with error message", async () => {
    const { updateDocument } = await import("../key-documents-service");
    const result = await updateDocument("doc-1", { status: "current" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateDocument returns ok:false with multiple fields", async () => {
    const { updateDocument } = await import("../key-documents-service");
    const result = await updateDocument("doc-1", {
      status: "due_review",
      last_reviewed: "2026-05-13",
      notes: "Reviewed and updated",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateDocument returns ok:false even with empty updates", async () => {
    const { updateDocument } = await import("../key-documents-service");
    const result = await updateDocument("doc-1", {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});
