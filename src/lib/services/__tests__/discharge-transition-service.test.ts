// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DISCHARGE & TRANSITION SERVICE TESTS
// Pure-function unit tests for discharge transition metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 36 (fitness of premises — move planning),
// Reg 37 (fitness of workers — discharge support),
// Children Act 1989 s23C/23CZA (continuing care/support).
//
// SCCIF: Overall Experiences — "Transitions are well planned."
// "Children are prepared for their next placement or independence."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  DISCHARGE_REASONS,
  READINESS_LEVELS,
  REVIEW_STATUSES,
  SUPPORT_PACKAGES,
  listReviews,
  createReview,
  updateReview,
} from "../discharge-transition-service";

import type {
  DischargeReview,
  DischargeReason,
  ReadinessLevel,
  ReviewStatus,
  SupportPackage,
} from "../discharge-transition-service";

const { computeDischargeMetrics, identifyDischargeAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal DischargeReview with sensible defaults. */
function makeReview(overrides: Partial<DischargeReview> = {}): DischargeReview {
  return {
    id: "dr-1",
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    discharge_reason: "planned_move",
    planned_date: "2025-09-01",
    actual_date: null,
    readiness_level: "fully_ready",
    review_status: "completed",
    review_date: "2025-08-15",
    reviewed_by: "Manager A",
    destination: "Foster Home B",
    support_packages: ["pathway_plan", "personal_adviser"],
    child_views_recorded: true,
    child_wants_to_leave: true,
    social_worker_involved: true,
    family_consulted: true,
    education_plan_in_place: true,
    health_needs_transferred: true,
    life_story_work_complete: true,
    goodbye_event_planned: true,
    notes: null,
    created_at: "2025-08-01T10:00:00.000Z",
    updated_at: "2025-08-01T10:00:00.000Z",
    ...overrides,
  } as DischargeReview;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("DISCHARGE_REASONS", () => {
  it("has exactly 11 entries", () => {
    expect(DISCHARGE_REASONS).toHaveLength(11);
  });

  it("contains unique reason values", () => {
    const values = DISCHARGE_REASONS.map((r) => r.reason);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = DISCHARGE_REASONS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes planned_move", () => {
    expect(DISCHARGE_REASONS.find((r) => r.reason === "planned_move")).toBeTruthy();
  });

  it("includes reunification", () => {
    expect(DISCHARGE_REASONS.find((r) => r.reason === "reunification")).toBeTruthy();
  });

  it("includes foster_care", () => {
    expect(DISCHARGE_REASONS.find((r) => r.reason === "foster_care")).toBeTruthy();
  });

  it("includes semi_independence", () => {
    expect(DISCHARGE_REASONS.find((r) => r.reason === "semi_independence")).toBeTruthy();
  });

  it("includes independence", () => {
    expect(DISCHARGE_REASONS.find((r) => r.reason === "independence")).toBeTruthy();
  });

  it("includes adoption", () => {
    expect(DISCHARGE_REASONS.find((r) => r.reason === "adoption")).toBeTruthy();
  });

  it("includes special_guardianship", () => {
    expect(DISCHARGE_REASONS.find((r) => r.reason === "special_guardianship")).toBeTruthy();
  });

  it("includes aged_out", () => {
    expect(DISCHARGE_REASONS.find((r) => r.reason === "aged_out")).toBeTruthy();
  });

  it("includes unplanned_breakdown", () => {
    expect(DISCHARGE_REASONS.find((r) => r.reason === "unplanned_breakdown")).toBeTruthy();
  });

  it("includes transfer", () => {
    expect(DISCHARGE_REASONS.find((r) => r.reason === "transfer")).toBeTruthy();
  });

  it("includes other", () => {
    expect(DISCHARGE_REASONS.find((r) => r.reason === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const r of DISCHARGE_REASONS) {
      expect(r.label.length).toBeGreaterThan(0);
    }
  });
});

describe("READINESS_LEVELS", () => {
  it("has exactly 5 entries", () => {
    expect(READINESS_LEVELS).toHaveLength(5);
  });

  it("contains unique level values", () => {
    const values = READINESS_LEVELS.map((l) => l.level);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = READINESS_LEVELS.map((l) => l.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes fully_ready", () => {
    expect(READINESS_LEVELS.find((l) => l.level === "fully_ready")).toBeTruthy();
  });

  it("includes mostly_ready", () => {
    expect(READINESS_LEVELS.find((l) => l.level === "mostly_ready")).toBeTruthy();
  });

  it("includes partially_ready", () => {
    expect(READINESS_LEVELS.find((l) => l.level === "partially_ready")).toBeTruthy();
  });

  it("includes not_ready", () => {
    expect(READINESS_LEVELS.find((l) => l.level === "not_ready")).toBeTruthy();
  });

  it("includes not_assessed", () => {
    expect(READINESS_LEVELS.find((l) => l.level === "not_assessed")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const l of READINESS_LEVELS) {
      expect(l.label.length).toBeGreaterThan(0);
    }
  });
});

describe("REVIEW_STATUSES", () => {
  it("has exactly 5 entries", () => {
    expect(REVIEW_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const values = REVIEW_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = REVIEW_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes scheduled", () => {
    expect(REVIEW_STATUSES.find((s) => s.status === "scheduled")).toBeTruthy();
  });

  it("includes completed", () => {
    expect(REVIEW_STATUSES.find((s) => s.status === "completed")).toBeTruthy();
  });

  it("includes overdue", () => {
    expect(REVIEW_STATUSES.find((s) => s.status === "overdue")).toBeTruthy();
  });

  it("includes not_required", () => {
    expect(REVIEW_STATUSES.find((s) => s.status === "not_required")).toBeTruthy();
  });

  it("includes cancelled", () => {
    expect(REVIEW_STATUSES.find((s) => s.status === "cancelled")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of REVIEW_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("SUPPORT_PACKAGES", () => {
  it("has exactly 12 entries", () => {
    expect(SUPPORT_PACKAGES).toHaveLength(12);
  });

  it("contains unique pkg values", () => {
    const values = SUPPORT_PACKAGES.map((p) => p.pkg);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = SUPPORT_PACKAGES.map((p) => p.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes pathway_plan", () => {
    expect(SUPPORT_PACKAGES.find((p) => p.pkg === "pathway_plan")).toBeTruthy();
  });

  it("includes personal_adviser", () => {
    expect(SUPPORT_PACKAGES.find((p) => p.pkg === "personal_adviser")).toBeTruthy();
  });

  it("includes supported_housing", () => {
    expect(SUPPORT_PACKAGES.find((p) => p.pkg === "supported_housing")).toBeTruthy();
  });

  it("includes financial_support", () => {
    expect(SUPPORT_PACKAGES.find((p) => p.pkg === "financial_support")).toBeTruthy();
  });

  it("includes education_support", () => {
    expect(SUPPORT_PACKAGES.find((p) => p.pkg === "education_support")).toBeTruthy();
  });

  it("includes health_plan", () => {
    expect(SUPPORT_PACKAGES.find((p) => p.pkg === "health_plan")).toBeTruthy();
  });

  it("includes mental_health", () => {
    expect(SUPPORT_PACKAGES.find((p) => p.pkg === "mental_health")).toBeTruthy();
  });

  it("includes employment_support", () => {
    expect(SUPPORT_PACKAGES.find((p) => p.pkg === "employment_support")).toBeTruthy();
  });

  it("includes family_mediation", () => {
    expect(SUPPORT_PACKAGES.find((p) => p.pkg === "family_mediation")).toBeTruthy();
  });

  it("includes peer_support", () => {
    expect(SUPPORT_PACKAGES.find((p) => p.pkg === "peer_support")).toBeTruthy();
  });

  it("includes none_identified", () => {
    expect(SUPPORT_PACKAGES.find((p) => p.pkg === "none_identified")).toBeTruthy();
  });

  it("includes other", () => {
    expect(SUPPORT_PACKAGES.find((p) => p.pkg === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const p of SUPPORT_PACKAGES) {
      expect(p.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeDischargeMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeDischargeMetrics", () => {
  it("returns zeroed metrics for empty reviews array", () => {
    const m = computeDischargeMetrics([]);
    expect(m.total_reviews).toBe(0);
    expect(m.fully_ready_count).toBe(0);
    expect(m.not_ready_count).toBe(0);
    expect(m.not_assessed_count).toBe(0);
    expect(m.completed_reviews).toBe(0);
    expect(m.overdue_reviews).toBe(0);
    expect(m.child_views_rate).toBe(0);
    expect(m.social_worker_involved_rate).toBe(0);
    expect(m.family_consulted_rate).toBe(0);
    expect(m.education_plan_rate).toBe(0);
    expect(m.health_transferred_rate).toBe(0);
    expect(m.life_story_rate).toBe(0);
    expect(m.goodbye_event_rate).toBe(0);
    expect(m.unplanned_breakdowns).toBe(0);
    expect(Object.keys(m.by_discharge_reason)).toHaveLength(0);
    expect(Object.keys(m.by_readiness_level)).toHaveLength(0);
    expect(Object.keys(m.by_review_status)).toHaveLength(0);
    expect(Object.keys(m.by_support_package)).toHaveLength(0);
  });

  // ── total_reviews ────────────────────────────────────────────────

  it("total_reviews equals the number of reviews", () => {
    const reviews = [
      makeReview({ id: "dr1" }),
      makeReview({ id: "dr2" }),
      makeReview({ id: "dr3" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.total_reviews).toBe(3);
  });

  it("total_reviews is 1 for single review", () => {
    const m = computeDischargeMetrics([makeReview()]);
    expect(m.total_reviews).toBe(1);
  });

  // ── fully_ready_count ────────────────────────────────────────────

  it("fully_ready_count counts fully_ready reviews", () => {
    const reviews = [
      makeReview({ id: "dr1", readiness_level: "fully_ready" }),
      makeReview({ id: "dr2", readiness_level: "fully_ready" }),
      makeReview({ id: "dr3", readiness_level: "not_ready" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.fully_ready_count).toBe(2);
  });

  it("fully_ready_count is 0 when none are fully ready", () => {
    const reviews = [
      makeReview({ id: "dr1", readiness_level: "not_ready" }),
      makeReview({ id: "dr2", readiness_level: "partially_ready" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.fully_ready_count).toBe(0);
  });

  // ── not_ready_count ──────────────────────────────────────────────

  it("not_ready_count counts not_ready reviews", () => {
    const reviews = [
      makeReview({ id: "dr1", readiness_level: "not_ready" }),
      makeReview({ id: "dr2", readiness_level: "not_ready" }),
      makeReview({ id: "dr3", readiness_level: "fully_ready" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.not_ready_count).toBe(2);
  });

  it("not_ready_count is 0 when none are not ready", () => {
    const reviews = [
      makeReview({ id: "dr1", readiness_level: "fully_ready" }),
      makeReview({ id: "dr2", readiness_level: "mostly_ready" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.not_ready_count).toBe(0);
  });

  // ── not_assessed_count ───────────────────────────────────────────

  it("not_assessed_count counts not_assessed reviews", () => {
    const reviews = [
      makeReview({ id: "dr1", readiness_level: "not_assessed" }),
      makeReview({ id: "dr2", readiness_level: "not_assessed" }),
      makeReview({ id: "dr3", readiness_level: "fully_ready" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.not_assessed_count).toBe(2);
  });

  it("not_assessed_count is 0 when all are assessed", () => {
    const reviews = [
      makeReview({ id: "dr1", readiness_level: "fully_ready" }),
      makeReview({ id: "dr2", readiness_level: "not_ready" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.not_assessed_count).toBe(0);
  });

  // ── completed_reviews ────────────────────────────────────────────

  it("completed_reviews counts completed status", () => {
    const reviews = [
      makeReview({ id: "dr1", review_status: "completed" }),
      makeReview({ id: "dr2", review_status: "completed" }),
      makeReview({ id: "dr3", review_status: "scheduled" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.completed_reviews).toBe(2);
  });

  it("completed_reviews is 0 when none completed", () => {
    const reviews = [
      makeReview({ id: "dr1", review_status: "overdue" }),
      makeReview({ id: "dr2", review_status: "scheduled" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.completed_reviews).toBe(0);
  });

  // ── overdue_reviews ──────────────────────────────────────────────

  it("overdue_reviews counts overdue status", () => {
    const reviews = [
      makeReview({ id: "dr1", review_status: "overdue" }),
      makeReview({ id: "dr2", review_status: "overdue" }),
      makeReview({ id: "dr3", review_status: "completed" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.overdue_reviews).toBe(2);
  });

  it("overdue_reviews is 0 when none overdue", () => {
    const reviews = [
      makeReview({ id: "dr1", review_status: "completed" }),
      makeReview({ id: "dr2", review_status: "scheduled" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.overdue_reviews).toBe(0);
  });

  // ── child_views_rate ─────────────────────────────────────────────

  it("child_views_rate is 100 when all have views recorded", () => {
    const reviews = [
      makeReview({ id: "dr1", child_views_recorded: true }),
      makeReview({ id: "dr2", child_views_recorded: true }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.child_views_rate).toBe(100);
  });

  it("child_views_rate is 0 when none have views recorded", () => {
    const reviews = [
      makeReview({ id: "dr1", child_views_recorded: false }),
      makeReview({ id: "dr2", child_views_recorded: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.child_views_rate).toBe(0);
  });

  it("child_views_rate is 50 when half have views recorded", () => {
    const reviews = [
      makeReview({ id: "dr1", child_views_recorded: true }),
      makeReview({ id: "dr2", child_views_recorded: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.child_views_rate).toBe(50);
  });

  it("child_views_rate rounds to one decimal place", () => {
    const reviews = [
      makeReview({ id: "dr1", child_views_recorded: true }),
      makeReview({ id: "dr2", child_views_recorded: false }),
      makeReview({ id: "dr3", child_views_recorded: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.child_views_rate).toBe(33.3);
  });

  // ── social_worker_involved_rate ──────────────────────────────────

  it("social_worker_involved_rate is 100 when all have social worker", () => {
    const reviews = [
      makeReview({ id: "dr1", social_worker_involved: true }),
      makeReview({ id: "dr2", social_worker_involved: true }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.social_worker_involved_rate).toBe(100);
  });

  it("social_worker_involved_rate is 0 when none have social worker", () => {
    const reviews = [
      makeReview({ id: "dr1", social_worker_involved: false }),
      makeReview({ id: "dr2", social_worker_involved: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.social_worker_involved_rate).toBe(0);
  });

  it("social_worker_involved_rate is 50 when half have social worker", () => {
    const reviews = [
      makeReview({ id: "dr1", social_worker_involved: true }),
      makeReview({ id: "dr2", social_worker_involved: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.social_worker_involved_rate).toBe(50);
  });

  it("social_worker_involved_rate rounds to one decimal place", () => {
    const reviews = [
      makeReview({ id: "dr1", social_worker_involved: true }),
      makeReview({ id: "dr2", social_worker_involved: false }),
      makeReview({ id: "dr3", social_worker_involved: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.social_worker_involved_rate).toBe(33.3);
  });

  // ── family_consulted_rate ────────────────────────────────────────

  it("family_consulted_rate is 100 when all have family consulted", () => {
    const reviews = [
      makeReview({ id: "dr1", family_consulted: true }),
      makeReview({ id: "dr2", family_consulted: true }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.family_consulted_rate).toBe(100);
  });

  it("family_consulted_rate is 0 when none have family consulted", () => {
    const reviews = [
      makeReview({ id: "dr1", family_consulted: false }),
      makeReview({ id: "dr2", family_consulted: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.family_consulted_rate).toBe(0);
  });

  it("family_consulted_rate is 50 when half have family consulted", () => {
    const reviews = [
      makeReview({ id: "dr1", family_consulted: true }),
      makeReview({ id: "dr2", family_consulted: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.family_consulted_rate).toBe(50);
  });

  it("family_consulted_rate rounds to one decimal place", () => {
    const reviews = [
      makeReview({ id: "dr1", family_consulted: true }),
      makeReview({ id: "dr2", family_consulted: false }),
      makeReview({ id: "dr3", family_consulted: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.family_consulted_rate).toBe(33.3);
  });

  // ── education_plan_rate ──────────────────────────────────────────

  it("education_plan_rate is 100 when all have education plan", () => {
    const reviews = [
      makeReview({ id: "dr1", education_plan_in_place: true }),
      makeReview({ id: "dr2", education_plan_in_place: true }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.education_plan_rate).toBe(100);
  });

  it("education_plan_rate is 0 when none have education plan", () => {
    const reviews = [
      makeReview({ id: "dr1", education_plan_in_place: false }),
      makeReview({ id: "dr2", education_plan_in_place: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.education_plan_rate).toBe(0);
  });

  it("education_plan_rate is 50 when half have education plan", () => {
    const reviews = [
      makeReview({ id: "dr1", education_plan_in_place: true }),
      makeReview({ id: "dr2", education_plan_in_place: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.education_plan_rate).toBe(50);
  });

  it("education_plan_rate rounds to one decimal place", () => {
    const reviews = [
      makeReview({ id: "dr1", education_plan_in_place: true }),
      makeReview({ id: "dr2", education_plan_in_place: false }),
      makeReview({ id: "dr3", education_plan_in_place: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.education_plan_rate).toBe(33.3);
  });

  // ── health_transferred_rate ──────────────────────────────────────

  it("health_transferred_rate is 100 when all have health transferred", () => {
    const reviews = [
      makeReview({ id: "dr1", health_needs_transferred: true }),
      makeReview({ id: "dr2", health_needs_transferred: true }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.health_transferred_rate).toBe(100);
  });

  it("health_transferred_rate is 0 when none have health transferred", () => {
    const reviews = [
      makeReview({ id: "dr1", health_needs_transferred: false }),
      makeReview({ id: "dr2", health_needs_transferred: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.health_transferred_rate).toBe(0);
  });

  it("health_transferred_rate is 50 when half have health transferred", () => {
    const reviews = [
      makeReview({ id: "dr1", health_needs_transferred: true }),
      makeReview({ id: "dr2", health_needs_transferred: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.health_transferred_rate).toBe(50);
  });

  it("health_transferred_rate rounds to one decimal place", () => {
    const reviews = [
      makeReview({ id: "dr1", health_needs_transferred: true }),
      makeReview({ id: "dr2", health_needs_transferred: false }),
      makeReview({ id: "dr3", health_needs_transferred: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.health_transferred_rate).toBe(33.3);
  });

  // ── life_story_rate ──────────────────────────────────────────────

  it("life_story_rate is 100 when all have life story complete", () => {
    const reviews = [
      makeReview({ id: "dr1", life_story_work_complete: true }),
      makeReview({ id: "dr2", life_story_work_complete: true }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.life_story_rate).toBe(100);
  });

  it("life_story_rate is 0 when none have life story complete", () => {
    const reviews = [
      makeReview({ id: "dr1", life_story_work_complete: false }),
      makeReview({ id: "dr2", life_story_work_complete: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.life_story_rate).toBe(0);
  });

  it("life_story_rate is 50 when half have life story complete", () => {
    const reviews = [
      makeReview({ id: "dr1", life_story_work_complete: true }),
      makeReview({ id: "dr2", life_story_work_complete: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.life_story_rate).toBe(50);
  });

  it("life_story_rate rounds to one decimal place", () => {
    const reviews = [
      makeReview({ id: "dr1", life_story_work_complete: true }),
      makeReview({ id: "dr2", life_story_work_complete: false }),
      makeReview({ id: "dr3", life_story_work_complete: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.life_story_rate).toBe(33.3);
  });

  // ── goodbye_event_rate ───────────────────────────────────────────

  it("goodbye_event_rate is 100 when all have goodbye event", () => {
    const reviews = [
      makeReview({ id: "dr1", goodbye_event_planned: true }),
      makeReview({ id: "dr2", goodbye_event_planned: true }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.goodbye_event_rate).toBe(100);
  });

  it("goodbye_event_rate is 0 when none have goodbye event", () => {
    const reviews = [
      makeReview({ id: "dr1", goodbye_event_planned: false }),
      makeReview({ id: "dr2", goodbye_event_planned: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.goodbye_event_rate).toBe(0);
  });

  it("goodbye_event_rate is 50 when half have goodbye event", () => {
    const reviews = [
      makeReview({ id: "dr1", goodbye_event_planned: true }),
      makeReview({ id: "dr2", goodbye_event_planned: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.goodbye_event_rate).toBe(50);
  });

  it("goodbye_event_rate rounds to one decimal place", () => {
    const reviews = [
      makeReview({ id: "dr1", goodbye_event_planned: true }),
      makeReview({ id: "dr2", goodbye_event_planned: false }),
      makeReview({ id: "dr3", goodbye_event_planned: false }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.goodbye_event_rate).toBe(33.3);
  });

  // ── unplanned_breakdowns ─────────────────────────────────────────

  it("unplanned_breakdowns counts unplanned_breakdown reason", () => {
    const reviews = [
      makeReview({ id: "dr1", discharge_reason: "unplanned_breakdown" }),
      makeReview({ id: "dr2", discharge_reason: "unplanned_breakdown" }),
      makeReview({ id: "dr3", discharge_reason: "planned_move" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.unplanned_breakdowns).toBe(2);
  });

  it("unplanned_breakdowns is 0 when no breakdowns", () => {
    const reviews = [
      makeReview({ id: "dr1", discharge_reason: "planned_move" }),
      makeReview({ id: "dr2", discharge_reason: "reunification" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.unplanned_breakdowns).toBe(0);
  });

  // ── by_discharge_reason ──────────────────────────────────────────

  it("by_discharge_reason groups by reason", () => {
    const reviews = [
      makeReview({ id: "dr1", discharge_reason: "planned_move" }),
      makeReview({ id: "dr2", discharge_reason: "planned_move" }),
      makeReview({ id: "dr3", discharge_reason: "reunification" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.by_discharge_reason["planned_move"]).toBe(2);
    expect(m.by_discharge_reason["reunification"]).toBe(1);
  });

  it("by_discharge_reason with single reason produces single entry", () => {
    const reviews = [
      makeReview({ id: "dr1", discharge_reason: "adoption" }),
      makeReview({ id: "dr2", discharge_reason: "adoption" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(Object.keys(m.by_discharge_reason)).toHaveLength(1);
    expect(m.by_discharge_reason["adoption"]).toBe(2);
  });

  it("by_discharge_reason includes all 11 reasons when all present", () => {
    const reasons: DischargeReason[] = [
      "planned_move", "reunification", "foster_care", "semi_independence",
      "independence", "adoption", "special_guardianship", "aged_out",
      "unplanned_breakdown", "transfer", "other",
    ];
    const reviews = reasons.map((reason, i) =>
      makeReview({ id: `dr${i}`, discharge_reason: reason }),
    );
    const m = computeDischargeMetrics(reviews);
    expect(Object.keys(m.by_discharge_reason)).toHaveLength(11);
    for (const reason of reasons) {
      expect(m.by_discharge_reason[reason]).toBe(1);
    }
  });

  // ── by_readiness_level ───────────────────────────────────────────

  it("by_readiness_level groups by level", () => {
    const reviews = [
      makeReview({ id: "dr1", readiness_level: "fully_ready" }),
      makeReview({ id: "dr2", readiness_level: "fully_ready" }),
      makeReview({ id: "dr3", readiness_level: "not_ready" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.by_readiness_level["fully_ready"]).toBe(2);
    expect(m.by_readiness_level["not_ready"]).toBe(1);
  });

  it("by_readiness_level includes all 5 levels when all present", () => {
    const levels: ReadinessLevel[] = [
      "fully_ready", "mostly_ready", "partially_ready", "not_ready", "not_assessed",
    ];
    const reviews = levels.map((level, i) =>
      makeReview({ id: `dr${i}`, readiness_level: level }),
    );
    const m = computeDischargeMetrics(reviews);
    expect(Object.keys(m.by_readiness_level)).toHaveLength(5);
    for (const level of levels) {
      expect(m.by_readiness_level[level]).toBe(1);
    }
  });

  // ── by_review_status ─────────────────────────────────────────────

  it("by_review_status groups by status", () => {
    const reviews = [
      makeReview({ id: "dr1", review_status: "completed" }),
      makeReview({ id: "dr2", review_status: "completed" }),
      makeReview({ id: "dr3", review_status: "overdue" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.by_review_status["completed"]).toBe(2);
    expect(m.by_review_status["overdue"]).toBe(1);
  });

  it("by_review_status includes all 5 statuses when all present", () => {
    const statuses: ReviewStatus[] = [
      "scheduled", "completed", "overdue", "not_required", "cancelled",
    ];
    const reviews = statuses.map((status, i) =>
      makeReview({ id: `dr${i}`, review_status: status }),
    );
    const m = computeDischargeMetrics(reviews);
    expect(Object.keys(m.by_review_status)).toHaveLength(5);
    for (const status of statuses) {
      expect(m.by_review_status[status]).toBe(1);
    }
  });

  // ── by_support_package ───────────────────────────────────────────

  it("by_support_package counts across all array items", () => {
    const reviews = [
      makeReview({ id: "dr1", support_packages: ["pathway_plan", "health_plan"] }),
      makeReview({ id: "dr2", support_packages: ["pathway_plan", "mental_health"] }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.by_support_package["pathway_plan"]).toBe(2);
    expect(m.by_support_package["health_plan"]).toBe(1);
    expect(m.by_support_package["mental_health"]).toBe(1);
  });

  it("by_support_package is empty when all reviews have empty arrays", () => {
    const reviews = [
      makeReview({ id: "dr1", support_packages: [] }),
      makeReview({ id: "dr2", support_packages: [] }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(Object.keys(m.by_support_package)).toHaveLength(0);
  });

  it("by_support_package counts multiple packages from single review", () => {
    const reviews = [
      makeReview({
        id: "dr1",
        support_packages: ["pathway_plan", "personal_adviser", "supported_housing"],
      }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(Object.keys(m.by_support_package)).toHaveLength(3);
    expect(m.by_support_package["pathway_plan"]).toBe(1);
    expect(m.by_support_package["personal_adviser"]).toBe(1);
    expect(m.by_support_package["supported_housing"]).toBe(1);
  });

  it("by_support_package counts same package across multiple reviews", () => {
    const reviews = [
      makeReview({ id: "dr1", support_packages: ["financial_support"] }),
      makeReview({ id: "dr2", support_packages: ["financial_support"] }),
      makeReview({ id: "dr3", support_packages: ["financial_support"] }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.by_support_package["financial_support"]).toBe(3);
  });

  it("by_support_package includes all 12 packages when all present across reviews", () => {
    const pkgs: SupportPackage[] = [
      "pathway_plan", "personal_adviser", "supported_housing", "financial_support",
      "education_support", "health_plan", "mental_health", "employment_support",
      "family_mediation", "peer_support", "none_identified", "other",
    ];
    const reviews = pkgs.map((pkg, i) =>
      makeReview({ id: `dr${i}`, support_packages: [pkg] }),
    );
    const m = computeDischargeMetrics(reviews);
    expect(Object.keys(m.by_support_package)).toHaveLength(12);
    for (const pkg of pkgs) {
      expect(m.by_support_package[pkg]).toBe(1);
    }
  });

  // ── rate rounding precision (66.7 case) ────────────────────────

  it("all rates round 2-in-3 to 66.7", () => {
    const reviews = [
      makeReview({
        id: "dr1",
        child_views_recorded: true, social_worker_involved: true,
        family_consulted: true, education_plan_in_place: true,
        health_needs_transferred: true, life_story_work_complete: true,
        goodbye_event_planned: true,
      }),
      makeReview({
        id: "dr2",
        child_views_recorded: true, social_worker_involved: true,
        family_consulted: true, education_plan_in_place: true,
        health_needs_transferred: true, life_story_work_complete: true,
        goodbye_event_planned: true,
      }),
      makeReview({
        id: "dr3",
        child_views_recorded: false, social_worker_involved: false,
        family_consulted: false, education_plan_in_place: false,
        health_needs_transferred: false, life_story_work_complete: false,
        goodbye_event_planned: false,
      }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.child_views_rate).toBe(66.7);
    expect(m.social_worker_involved_rate).toBe(66.7);
    expect(m.family_consulted_rate).toBe(66.7);
    expect(m.education_plan_rate).toBe(66.7);
    expect(m.health_transferred_rate).toBe(66.7);
    expect(m.life_story_rate).toBe(66.7);
    expect(m.goodbye_event_rate).toBe(66.7);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyDischargeAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyDischargeAlerts", () => {
  // ── empty reviews ────────────────────────────────────────────────

  it("returns no alerts for empty reviews", () => {
    const alerts = identifyDischargeAlerts([]);
    expect(alerts).toHaveLength(0);
  });

  // ── not_ready alert ──────────────────────────────────────────────

  it("generates not_ready alert for not_ready with actual_date null", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        readiness_level: "not_ready", actual_date: null,
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "not_ready");
    expect(alert).toBeTruthy();
  });

  it("not_ready alert has critical severity", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        readiness_level: "not_ready", actual_date: null,
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "not_ready");
    expect(alert!.severity).toBe("critical");
  });

  it("not_ready alert message contains child name", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        readiness_level: "not_ready", actual_date: null,
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "not_ready");
    expect(alert!.message).toContain("Alice");
  });

  it("not_ready alert message contains planned date", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        readiness_level: "not_ready", actual_date: null,
        planned_date: "2025-09-01",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "not_ready");
    expect(alert!.message).toContain("2025-09-01");
  });

  it("not_ready alert has correct id", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        readiness_level: "not_ready", actual_date: null,
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "not_ready");
    expect(alert!.id).toBe("dr1");
  });

  it("no not_ready alert when readiness is not_ready but actual_date is set", () => {
    const reviews = [
      makeReview({
        id: "dr1",
        readiness_level: "not_ready", actual_date: "2025-08-20",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "not_ready");
    expect(alert).toBeUndefined();
  });

  it("no not_ready alert when readiness is fully_ready and actual_date is null", () => {
    const reviews = [
      makeReview({
        id: "dr1",
        readiness_level: "fully_ready", actual_date: null,
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "not_ready");
    expect(alert).toBeUndefined();
  });

  it("no not_ready alert when readiness is mostly_ready", () => {
    const reviews = [
      makeReview({
        id: "dr1",
        readiness_level: "mostly_ready", actual_date: null,
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "not_ready");
    expect(alert).toBeUndefined();
  });

  it("multiple not_ready alerts for multiple not_ready reviews", () => {
    const reviews = [
      makeReview({ id: "dr1", child_name: "Alice", readiness_level: "not_ready", actual_date: null }),
      makeReview({ id: "dr2", child_name: "Bob", readiness_level: "not_ready", actual_date: null }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const notReadyAlerts = alerts.filter((a) => a.type === "not_ready");
    expect(notReadyAlerts).toHaveLength(2);
  });

  // ── review_overdue alert ─────────────────────────────────────────

  it("generates review_overdue alert for overdue review status", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        review_status: "overdue",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeTruthy();
  });

  it("review_overdue alert has high severity", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        review_status: "overdue",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert!.severity).toBe("high");
  });

  it("review_overdue alert message contains child name", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        review_status: "overdue",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert!.message).toContain("Alice");
  });

  it("review_overdue alert has correct id", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        review_status: "overdue",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert!.id).toBe("dr1");
  });

  it("no review_overdue alert when status is completed", () => {
    const reviews = [
      makeReview({ id: "dr1", review_status: "completed" }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeUndefined();
  });

  it("no review_overdue alert when status is scheduled", () => {
    const reviews = [
      makeReview({ id: "dr1", review_status: "scheduled" }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "review_overdue");
    expect(alert).toBeUndefined();
  });

  it("multiple review_overdue alerts for multiple overdue reviews", () => {
    const reviews = [
      makeReview({ id: "dr1", child_name: "Alice", review_status: "overdue" }),
      makeReview({ id: "dr2", child_name: "Bob", review_status: "overdue" }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const overdueAlerts = alerts.filter((a) => a.type === "review_overdue");
    expect(overdueAlerts).toHaveLength(2);
  });

  // ── health_not_transferred alert ─────────────────────────────────

  it("generates health_not_transferred alert when health not transferred and already left", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        health_needs_transferred: false, actual_date: "2025-08-20",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "health_not_transferred");
    expect(alert).toBeTruthy();
  });

  it("health_not_transferred alert has high severity", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        health_needs_transferred: false, actual_date: "2025-08-20",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "health_not_transferred");
    expect(alert!.severity).toBe("high");
  });

  it("health_not_transferred alert message contains child name", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        health_needs_transferred: false, actual_date: "2025-08-20",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "health_not_transferred");
    expect(alert!.message).toContain("Alice");
  });

  it("health_not_transferred alert has correct id", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        health_needs_transferred: false, actual_date: "2025-08-20",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "health_not_transferred");
    expect(alert!.id).toBe("dr1");
  });

  it("no health_not_transferred alert when health is transferred", () => {
    const reviews = [
      makeReview({
        id: "dr1",
        health_needs_transferred: true, actual_date: "2025-08-20",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "health_not_transferred");
    expect(alert).toBeUndefined();
  });

  it("no health_not_transferred alert when actual_date is null (still in placement)", () => {
    const reviews = [
      makeReview({
        id: "dr1",
        health_needs_transferred: false, actual_date: null,
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "health_not_transferred");
    expect(alert).toBeUndefined();
  });

  it("multiple health_not_transferred alerts for multiple reviews", () => {
    const reviews = [
      makeReview({ id: "dr1", child_name: "Alice", health_needs_transferred: false, actual_date: "2025-08-20" }),
      makeReview({ id: "dr2", child_name: "Bob", health_needs_transferred: false, actual_date: "2025-08-21" }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const healthAlerts = alerts.filter((a) => a.type === "health_not_transferred");
    expect(healthAlerts).toHaveLength(2);
  });

  // ── unplanned_breakdown alert ────────────────────────────────────

  it("generates unplanned_breakdown alert for unplanned_breakdown reason", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        discharge_reason: "unplanned_breakdown",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "unplanned_breakdown");
    expect(alert).toBeTruthy();
  });

  it("unplanned_breakdown alert has high severity", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        discharge_reason: "unplanned_breakdown",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "unplanned_breakdown");
    expect(alert!.severity).toBe("high");
  });

  it("unplanned_breakdown alert message contains child name", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        discharge_reason: "unplanned_breakdown",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "unplanned_breakdown");
    expect(alert!.message).toContain("Alice");
  });

  it("unplanned_breakdown alert has correct id", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        discharge_reason: "unplanned_breakdown",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "unplanned_breakdown");
    expect(alert!.id).toBe("dr1");
  });

  it("no unplanned_breakdown alert for all non-breakdown reasons", () => {
    const nonBreakdownReasons: DischargeReason[] = [
      "planned_move", "reunification", "foster_care", "semi_independence",
      "independence", "adoption", "special_guardianship", "aged_out",
      "transfer", "other",
    ];
    for (const reason of nonBreakdownReasons) {
      const reviews = [makeReview({ id: "dr1", discharge_reason: reason })];
      const alerts = identifyDischargeAlerts(reviews);
      const alert = alerts.find((a) => a.type === "unplanned_breakdown");
      expect(alert).toBeUndefined();
    }
  });

  it("multiple unplanned_breakdown alerts for multiple breakdowns", () => {
    const reviews = [
      makeReview({ id: "dr1", child_name: "Alice", discharge_reason: "unplanned_breakdown" }),
      makeReview({ id: "dr2", child_name: "Bob", discharge_reason: "unplanned_breakdown" }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const breakdownAlerts = alerts.filter((a) => a.type === "unplanned_breakdown");
    expect(breakdownAlerts).toHaveLength(2);
  });

  // ── child_views_missing alert ────────────────────────────────────

  it("generates child_views_missing alert when views not recorded and still in placement", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        child_views_recorded: false, actual_date: null,
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "child_views_missing");
    expect(alert).toBeTruthy();
  });

  it("child_views_missing alert has medium severity", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        child_views_recorded: false, actual_date: null,
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "child_views_missing");
    expect(alert!.severity).toBe("medium");
  });

  it("child_views_missing alert message contains child name", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        child_views_recorded: false, actual_date: null,
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "child_views_missing");
    expect(alert!.message).toContain("Alice");
  });

  it("child_views_missing alert has correct id", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        child_views_recorded: false, actual_date: null,
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "child_views_missing");
    expect(alert!.id).toBe("dr1");
  });

  it("no child_views_missing alert when views are recorded", () => {
    const reviews = [
      makeReview({
        id: "dr1",
        child_views_recorded: true, actual_date: null,
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "child_views_missing");
    expect(alert).toBeUndefined();
  });

  it("no child_views_missing alert when actual_date is set (already left)", () => {
    const reviews = [
      makeReview({
        id: "dr1",
        child_views_recorded: false, actual_date: "2025-08-20",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const alert = alerts.find((a) => a.type === "child_views_missing");
    expect(alert).toBeUndefined();
  });

  it("multiple child_views_missing alerts for multiple reviews", () => {
    const reviews = [
      makeReview({ id: "dr1", child_name: "Alice", child_views_recorded: false, actual_date: null }),
      makeReview({ id: "dr2", child_name: "Bob", child_views_recorded: false, actual_date: null }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const viewsAlerts = alerts.filter((a) => a.type === "child_views_missing");
    expect(viewsAlerts).toHaveLength(2);
  });

  // ── combined alerts ──────────────────────────────────────────────

  it("single review can trigger multiple alert types", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        readiness_level: "not_ready",
        actual_date: null,
        review_status: "overdue",
        discharge_reason: "unplanned_breakdown",
        child_views_recorded: false,
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const types = new Set(alerts.map((a) => a.type));
    expect(types.has("not_ready")).toBe(true);
    expect(types.has("review_overdue")).toBe(true);
    expect(types.has("unplanned_breakdown")).toBe(true);
    expect(types.has("child_views_missing")).toBe(true);
    expect(types.size).toBe(4);
  });

  it("all five alert types can trigger simultaneously across two reviews", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        readiness_level: "not_ready",
        actual_date: null,
        review_status: "overdue",
        discharge_reason: "unplanned_breakdown",
        child_views_recorded: false,
      }),
      makeReview({
        id: "dr2", child_name: "Bob",
        health_needs_transferred: false,
        actual_date: "2025-08-20",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const types = new Set(alerts.map((a) => a.type));
    expect(types.has("not_ready")).toBe(true);
    expect(types.has("review_overdue")).toBe(true);
    expect(types.has("unplanned_breakdown")).toBe(true);
    expect(types.has("child_views_missing")).toBe(true);
    expect(types.has("health_not_transferred")).toBe(true);
    expect(types.size).toBe(5);
  });

  it("no alerts for perfectly healthy review", () => {
    const reviews = [
      makeReview({
        id: "dr1",
        readiness_level: "fully_ready",
        review_status: "completed",
        discharge_reason: "planned_move",
        child_views_recorded: true,
        health_needs_transferred: true,
        actual_date: null,
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    expect(alerts).toHaveLength(0);
  });

  // ── alert structure validation ───────────────────────────────────

  it("alert severity values are correct types", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        readiness_level: "not_ready", actual_date: null,
        review_status: "overdue",
        health_needs_transferred: false,
        discharge_reason: "unplanned_breakdown",
        child_views_recorded: false,
      }),
      makeReview({
        id: "dr2", child_name: "Bob",
        health_needs_transferred: false,
        actual_date: "2025-08-20",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    for (const alert of alerts) {
      expect(["critical", "high", "medium"]).toContain(alert.severity);
    }
  });

  it("each alert has a non-empty message", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        readiness_level: "not_ready", actual_date: null,
        review_status: "overdue",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    for (const alert of alerts) {
      expect(alert.message.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty id", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        readiness_level: "not_ready", actual_date: null,
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    for (const alert of alerts) {
      expect(alert.id.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty type", () => {
    const reviews = [
      makeReview({
        id: "dr1", child_name: "Alice",
        review_status: "overdue",
      }),
    ];
    const alerts = identifyDischargeAlerts(reviews);
    for (const alert of alerts) {
      expect(alert.type.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listReviews ──────────────────────────────────────────────────

  it("listReviews returns ok: true with empty array", async () => {
    const result = await listReviews("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listReviews returns ok: true with childId filter", async () => {
    const result = await listReviews("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listReviews returns ok: true with dischargeReason filter", async () => {
    const result = await listReviews("home-1", { dischargeReason: "planned_move" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listReviews returns ok: true with readinessLevel filter", async () => {
    const result = await listReviews("home-1", { readinessLevel: "fully_ready" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listReviews returns ok: true with reviewStatus filter", async () => {
    const result = await listReviews("home-1", { reviewStatus: "completed" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listReviews returns ok: true with limit filter", async () => {
    const result = await listReviews("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listReviews returns ok: true with all filters combined", async () => {
    const result = await listReviews("home-1", {
      childId: "child-1",
      dischargeReason: "reunification",
      readinessLevel: "mostly_ready",
      reviewStatus: "scheduled",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createReview ─────────────────────────────────────────────────

  it("createReview returns ok: false with error message", async () => {
    const result = await createReview({
      homeId: "home-1",
      childName: "Alice Smith",
      childId: "child-1",
      dischargeReason: "planned_move",
      plannedDate: "2025-09-01",
      readinessLevel: "fully_ready",
      reviewStatus: "completed",
      supportPackages: ["pathway_plan"],
      childViewsRecorded: true,
      socialWorkerInvolved: true,
      familyConsulted: true,
      educationPlanInPlace: true,
      healthNeedsTransferred: true,
      lifeStoryWorkComplete: true,
      goodbyeEventPlanned: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createReview error message is a string", async () => {
    const result = await createReview({
      homeId: "home-1",
      childName: "Bob Jones",
      childId: "child-2",
      dischargeReason: "unplanned_breakdown",
      plannedDate: "2025-10-01",
      actualDate: "2025-09-15",
      readinessLevel: "not_ready",
      reviewStatus: "overdue",
      reviewDate: "2025-09-10",
      reviewedBy: "Manager B",
      destination: "Emergency Foster",
      supportPackages: ["mental_health", "financial_support"],
      childViewsRecorded: false,
      childWantsToLeave: false,
      socialWorkerInvolved: true,
      familyConsulted: false,
      educationPlanInPlace: false,
      healthNeedsTransferred: false,
      lifeStoryWorkComplete: false,
      goodbyeEventPlanned: false,
      notes: "Emergency discharge",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── updateReview ─────────────────────────────────────────────────

  it("updateReview returns ok: false with error message", async () => {
    const result = await updateReview("dr-1", { review_status: "completed" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateReview error message is a string for partial updates", async () => {
    const result = await updateReview("dr-1", {
      readiness_level: "fully_ready",
      health_needs_transferred: true,
      notes: "Health transferred",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("computeDischargeMetrics with all reviews fully_ready", () => {
    const reviews = [
      makeReview({ id: "dr1", readiness_level: "fully_ready" }),
      makeReview({ id: "dr2", readiness_level: "fully_ready" }),
      makeReview({ id: "dr3", readiness_level: "fully_ready" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.fully_ready_count).toBe(3);
    expect(m.not_ready_count).toBe(0);
    expect(m.not_assessed_count).toBe(0);
  });

  it("computeDischargeMetrics with all reviews not_ready", () => {
    const reviews = [
      makeReview({ id: "dr1", readiness_level: "not_ready" }),
      makeReview({ id: "dr2", readiness_level: "not_ready" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.fully_ready_count).toBe(0);
    expect(m.not_ready_count).toBe(2);
    expect(m.not_assessed_count).toBe(0);
  });

  it("computeDischargeMetrics with all boolean fields true", () => {
    const reviews = [
      makeReview({
        id: "dr1",
        child_views_recorded: true,
        social_worker_involved: true,
        family_consulted: true,
        education_plan_in_place: true,
        health_needs_transferred: true,
        life_story_work_complete: true,
        goodbye_event_planned: true,
      }),
      makeReview({
        id: "dr2",
        child_views_recorded: true,
        social_worker_involved: true,
        family_consulted: true,
        education_plan_in_place: true,
        health_needs_transferred: true,
        life_story_work_complete: true,
        goodbye_event_planned: true,
      }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.child_views_rate).toBe(100);
    expect(m.social_worker_involved_rate).toBe(100);
    expect(m.family_consulted_rate).toBe(100);
    expect(m.education_plan_rate).toBe(100);
    expect(m.health_transferred_rate).toBe(100);
    expect(m.life_story_rate).toBe(100);
    expect(m.goodbye_event_rate).toBe(100);
  });

  it("computeDischargeMetrics with all boolean fields false", () => {
    const reviews = [
      makeReview({
        id: "dr1",
        child_views_recorded: false,
        social_worker_involved: false,
        family_consulted: false,
        education_plan_in_place: false,
        health_needs_transferred: false,
        life_story_work_complete: false,
        goodbye_event_planned: false,
      }),
      makeReview({
        id: "dr2",
        child_views_recorded: false,
        social_worker_involved: false,
        family_consulted: false,
        education_plan_in_place: false,
        health_needs_transferred: false,
        life_story_work_complete: false,
        goodbye_event_planned: false,
      }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.child_views_rate).toBe(0);
    expect(m.social_worker_involved_rate).toBe(0);
    expect(m.family_consulted_rate).toBe(0);
    expect(m.education_plan_rate).toBe(0);
    expect(m.health_transferred_rate).toBe(0);
    expect(m.life_story_rate).toBe(0);
    expect(m.goodbye_event_rate).toBe(0);
  });

  it("computeDischargeMetrics with all unplanned breakdowns", () => {
    const reviews = [
      makeReview({ id: "dr1", discharge_reason: "unplanned_breakdown" }),
      makeReview({ id: "dr2", discharge_reason: "unplanned_breakdown" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.unplanned_breakdowns).toBe(2);
    expect(m.by_discharge_reason["unplanned_breakdown"]).toBe(2);
  });

  it("computeDischargeMetrics by_readiness_level matches individual counts", () => {
    const reviews = [
      makeReview({ id: "dr1", readiness_level: "fully_ready" }),
      makeReview({ id: "dr2", readiness_level: "fully_ready" }),
      makeReview({ id: "dr3", readiness_level: "not_ready" }),
      makeReview({ id: "dr4", readiness_level: "not_assessed" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.by_readiness_level["fully_ready"]).toBe(m.fully_ready_count);
    expect(m.by_readiness_level["not_ready"]).toBe(m.not_ready_count);
    expect(m.by_readiness_level["not_assessed"]).toBe(m.not_assessed_count);
  });

  it("computeDischargeMetrics by_review_status matches individual counts", () => {
    const reviews = [
      makeReview({ id: "dr1", review_status: "completed" }),
      makeReview({ id: "dr2", review_status: "completed" }),
      makeReview({ id: "dr3", review_status: "overdue" }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.by_review_status["completed"]).toBe(m.completed_reviews);
    expect(m.by_review_status["overdue"]).toBe(m.overdue_reviews);
  });

  it("computeDischargeMetrics with mixed support packages", () => {
    const reviews = [
      makeReview({ id: "dr1", support_packages: ["pathway_plan", "health_plan", "mental_health"] }),
      makeReview({ id: "dr2", support_packages: ["pathway_plan", "financial_support"] }),
      makeReview({ id: "dr3", support_packages: ["mental_health"] }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.by_support_package["pathway_plan"]).toBe(2);
    expect(m.by_support_package["health_plan"]).toBe(1);
    expect(m.by_support_package["mental_health"]).toBe(2);
    expect(m.by_support_package["financial_support"]).toBe(1);
    expect(Object.keys(m.by_support_package)).toHaveLength(4);
  });

  it("computeDischargeMetrics total is sum of by_discharge_reason values", () => {
    const reviews = [
      makeReview({ id: "dr1", discharge_reason: "planned_move" }),
      makeReview({ id: "dr2", discharge_reason: "reunification" }),
      makeReview({ id: "dr3", discharge_reason: "planned_move" }),
    ];
    const m = computeDischargeMetrics(reviews);
    const sumReasons = Object.values(m.by_discharge_reason).reduce((a, b) => a + b, 0);
    expect(sumReasons).toBe(m.total_reviews);
  });

  it("identifyDischargeAlerts not_ready only fires for reviews with actual_date null", () => {
    const levels: ReadinessLevel[] = [
      "fully_ready", "mostly_ready", "partially_ready", "not_ready", "not_assessed",
    ];
    const reviews = levels.map((level, i) =>
      makeReview({ id: `dr${i}`, readiness_level: level, actual_date: null }),
    );
    const alerts = identifyDischargeAlerts(reviews);
    const notReadyAlerts = alerts.filter((a) => a.type === "not_ready");
    expect(notReadyAlerts).toHaveLength(1);
    expect(notReadyAlerts[0].id).toBe("dr3"); // only not_ready
  });

  it("identifyDischargeAlerts review_overdue only fires for overdue status", () => {
    const statuses: ReviewStatus[] = [
      "scheduled", "completed", "overdue", "not_required", "cancelled",
    ];
    const reviews = statuses.map((status, i) =>
      makeReview({ id: `dr${i}`, review_status: status }),
    );
    const alerts = identifyDischargeAlerts(reviews);
    const overdueAlerts = alerts.filter((a) => a.type === "review_overdue");
    expect(overdueAlerts).toHaveLength(1);
    expect(overdueAlerts[0].id).toBe("dr2"); // only overdue
  });

  it("identifyDischargeAlerts health_not_transferred requires both conditions", () => {
    const reviews = [
      makeReview({ id: "dr1", health_needs_transferred: false, actual_date: "2025-08-20" }), // alert
      makeReview({ id: "dr2", health_needs_transferred: false, actual_date: null }),           // no alert (still in)
      makeReview({ id: "dr3", health_needs_transferred: true, actual_date: "2025-08-20" }),    // no alert (transferred)
      makeReview({ id: "dr4", health_needs_transferred: true, actual_date: null }),             // no alert
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const healthAlerts = alerts.filter((a) => a.type === "health_not_transferred");
    expect(healthAlerts).toHaveLength(1);
    expect(healthAlerts[0].id).toBe("dr1");
  });

  it("identifyDischargeAlerts child_views_missing requires both conditions", () => {
    const reviews = [
      makeReview({ id: "dr1", child_views_recorded: false, actual_date: null }),              // alert
      makeReview({ id: "dr2", child_views_recorded: false, actual_date: "2025-08-20" }),      // no alert (already left)
      makeReview({ id: "dr3", child_views_recorded: true, actual_date: null }),                // no alert (recorded)
      makeReview({ id: "dr4", child_views_recorded: true, actual_date: "2025-08-20" }),        // no alert
    ];
    const alerts = identifyDischargeAlerts(reviews);
    const viewsAlerts = alerts.filter((a) => a.type === "child_views_missing");
    expect(viewsAlerts).toHaveLength(1);
    expect(viewsAlerts[0].id).toBe("dr1");
  });

  it("computeDischargeMetrics returns correct 18 fields", () => {
    const m = computeDischargeMetrics([]);
    const keys = Object.keys(m);
    expect(keys).toHaveLength(18);
    expect(keys).toContain("total_reviews");
    expect(keys).toContain("fully_ready_count");
    expect(keys).toContain("not_ready_count");
    expect(keys).toContain("not_assessed_count");
    expect(keys).toContain("completed_reviews");
    expect(keys).toContain("overdue_reviews");
    expect(keys).toContain("child_views_rate");
    expect(keys).toContain("social_worker_involved_rate");
    expect(keys).toContain("family_consulted_rate");
    expect(keys).toContain("education_plan_rate");
    expect(keys).toContain("health_transferred_rate");
    expect(keys).toContain("life_story_rate");
    expect(keys).toContain("goodbye_event_rate");
    expect(keys).toContain("unplanned_breakdowns");
    expect(keys).toContain("by_discharge_reason");
    expect(keys).toContain("by_readiness_level");
    expect(keys).toContain("by_review_status");
    expect(keys).toContain("by_support_package");
  });

  it("computeDischargeMetrics with single review returns correct totals", () => {
    const reviews = [
      makeReview({
        id: "dr1",
        readiness_level: "mostly_ready",
        review_status: "scheduled",
        discharge_reason: "foster_care",
        child_views_recorded: true,
        social_worker_involved: false,
        family_consulted: true,
        education_plan_in_place: false,
        health_needs_transferred: true,
        life_story_work_complete: false,
        goodbye_event_planned: true,
        support_packages: ["personal_adviser", "education_support"],
      }),
    ];
    const m = computeDischargeMetrics(reviews);
    expect(m.total_reviews).toBe(1);
    expect(m.fully_ready_count).toBe(0);
    expect(m.not_ready_count).toBe(0);
    expect(m.not_assessed_count).toBe(0);
    expect(m.completed_reviews).toBe(0);
    expect(m.overdue_reviews).toBe(0);
    expect(m.child_views_rate).toBe(100);
    expect(m.social_worker_involved_rate).toBe(0);
    expect(m.family_consulted_rate).toBe(100);
    expect(m.education_plan_rate).toBe(0);
    expect(m.health_transferred_rate).toBe(100);
    expect(m.life_story_rate).toBe(0);
    expect(m.goodbye_event_rate).toBe(100);
    expect(m.unplanned_breakdowns).toBe(0);
    expect(m.by_discharge_reason["foster_care"]).toBe(1);
    expect(m.by_readiness_level["mostly_ready"]).toBe(1);
    expect(m.by_review_status["scheduled"]).toBe(1);
    expect(m.by_support_package["personal_adviser"]).toBe(1);
    expect(m.by_support_package["education_support"]).toBe(1);
  });
});
