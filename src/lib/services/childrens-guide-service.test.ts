import { describe, it, expect } from "vitest";
import {
  computeGuideMetrics,
  identifyGuideAlerts,
  REQUIRED_SECTIONS,
} from "./childrens-guide-service";
import type {
  ChildrensGuide,
  GuideDistribution,
  GuideFeedback,
} from "./childrens-guide-service";

// -- Factory Functions --------------------------------------------------------

function makeGuide(overrides: Partial<ChildrensGuide> = {}): ChildrensGuide {
  return {
    id: "guide-1",
    home_id: "home-1",
    version: "1.0",
    title: "Children's Guide",
    effective_date: "2026-01-01",
    review_date: "2026-12-31",
    last_reviewed_date: null,
    reviewed_by: null,
    approved_by: "Manager A",
    approval_date: "2026-01-01",
    status: "active",
    sections_included: [...REQUIRED_SECTIONS],
    formats_available: ["standard_print", "easy_read"],
    languages_available: ["English"],
    age_range_minimum: 8,
    age_range_maximum: 18,
    key_contacts: [{ role: "Manager", name: "Jane", phone: "0123" }],
    ofsted_contact: "0300 123 1231",
    childrens_commissioner_contact: "020 7783 8330",
    advocacy_service_contact: "0800 111 111",
    complaints_summary: "You can complain to the manager.",
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeDistribution(overrides: Partial<GuideDistribution> = {}): GuideDistribution {
  return {
    id: "dist-1",
    home_id: "home-1",
    guide_id: "guide-1",
    child_id: "child-1",
    child_name: "Alex",
    distribution_date: "2026-01-15",
    format_provided: "standard_print",
    language_provided: "English",
    distributed_by: "staff-1",
    child_confirmed_receipt: true,
    child_confirmed_understanding: true,
    discussed_with_child: true,
    discussion_date: "2026-01-15",
    discussed_by: "staff-1",
    follow_up_needed: false,
    follow_up_notes: null,
    notes: null,
    created_at: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<GuideFeedback> = {}): GuideFeedback {
  return {
    id: "fb-1",
    home_id: "home-1",
    guide_id: "guide-1",
    child_id: "child-1",
    child_name: "Alex",
    feedback_date: "2026-02-01",
    rating: "helpful",
    what_was_helpful: "Contact info",
    what_could_improve: null,
    sections_found_confusing: [],
    suggestions: null,
    collected_by: "staff-1",
    action_taken: null,
    created_at: "2026-02-01T00:00:00Z",
    ...overrides,
  };
}

const NOW = new Date("2026-05-21T12:00:00Z");

// -- computeGuideMetrics ------------------------------------------------------

describe("computeGuideMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeGuideMetrics([], [], [], 4);
    expect(m.active_guides).toBe(0);
    expect(m.formats_available).toBe(0);
    expect(m.children_received).toBe(0);
    expect(m.children_total).toBe(4);
    expect(m.distribution_rate).toBe(0);
    expect(m.understanding_confirmed_rate).toBeNull(); // fab-0.;
    expect(m.avg_feedback_score).toBeNull(); // fab-0.;
    expect(m.overdue_reviews).toBe(0);
  });

  it("computes populated metrics correctly", () => {
    const guides = [
      makeGuide({ id: "g1", status: "active", formats_available: ["standard_print", "easy_read", "audio"] }),
      makeGuide({ id: "g2", status: "archived" }),
    ];
    const dists = [
      makeDistribution({ child_id: "c1", child_confirmed_understanding: true }),
      makeDistribution({ id: "dist-2", child_id: "c2", child_confirmed_understanding: false }),
      makeDistribution({ id: "dist-3", child_id: "c3", child_confirmed_understanding: true }),
    ];
    const fbs = [
      makeFeedback({ rating: "very_helpful" }),
      makeFeedback({ id: "fb-2", rating: "helpful" }),
      makeFeedback({ id: "fb-3", rating: "confusing" }),
    ];
    const m = computeGuideMetrics(guides, dists, fbs, 4);

    expect(m.active_guides).toBe(1);
    expect(m.formats_available).toBe(3);
    expect(m.children_received).toBe(3);
    expect(m.distribution_rate).toBe(75);
    // 2/3 confirmed understanding = 66.7%
    expect(m.understanding_confirmed_rate).toBe(66.7);
    // (5+4+1)/3 = 3.3
    expect(m.avg_feedback_score).toBe(3.3);
    expect(m.by_feedback_rating).toEqual({ very_helpful: 1, helpful: 1, confusing: 1 });
  });

  it("counts overdue reviews from active guides", () => {
    const guides = [
      makeGuide({ review_date: "2025-01-01", status: "active" }),
    ];
    const m = computeGuideMetrics(guides, [], [], 4);
    expect(m.overdue_reviews).toBe(1);
  });

  it("computes sections coverage from latest active guide", () => {
    const guides = [
      makeGuide({
        status: "active",
        effective_date: "2026-03-01",
        sections_included: ["about_the_home", "your_rights"],
      }),
    ];
    const m = computeGuideMetrics(guides, [], [], 4);
    expect(m.sections_coverage["about_the_home"]).toBe(true);
    expect(m.sections_coverage["your_rights"]).toBe(true);
    expect(m.sections_coverage["how_to_complain"]).toBe(false);
  });
});

// -- identifyGuideAlerts ------------------------------------------------------

describe("identifyGuideAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifyGuideAlerts([], [], [], 0, NOW);
    expect(alerts).toHaveLength(0);
  });

  it("fires no_active_guide when all guides are non-active", () => {
    const guides = [makeGuide({ status: "archived" })];
    const alerts = identifyGuideAlerts(guides, [], [], 4, NOW);
    expect(alerts.some((a) => a.type === "no_active_guide")).toBe(true);
  });

  it("fires review_overdue for past review date", () => {
    const guides = [makeGuide({ review_date: "2026-01-01", status: "active" })];
    const alerts = identifyGuideAlerts(guides, [], [], 0, NOW);
    expect(alerts.some((a) => a.type === "review_overdue")).toBe(true);
  });

  it("fires missing_required_sections when sections are absent", () => {
    const guides = [makeGuide({ status: "active", sections_included: ["welcome"] })];
    const alerts = identifyGuideAlerts(guides, [], [], 0, NOW);
    expect(alerts.some((a) => a.type === "missing_required_sections")).toBe(true);
  });

  it("fires limited_accessibility when only standard_print", () => {
    const guides = [makeGuide({ status: "active", formats_available: ["standard_print"] })];
    const alerts = identifyGuideAlerts(guides, [], [], 0, NOW);
    expect(alerts.some((a) => a.type === "limited_accessibility")).toBe(true);
  });

  it("fires not_approved when approved_by is null", () => {
    const guides = [makeGuide({ status: "active", approved_by: null })];
    const alerts = identifyGuideAlerts(guides, [], [], 0, NOW);
    expect(alerts.some((a) => a.type === "not_approved")).toBe(true);
  });

  it("fires distribution_gap when children missing guide", () => {
    const guides = [makeGuide({ status: "active" })];
    const dists = [makeDistribution({ child_id: "c1" })];
    const alerts = identifyGuideAlerts(guides, dists, [], 4, NOW);
    expect(alerts.some((a) => a.type === "distribution_gap")).toBe(true);
  });

  it("fires understanding_not_confirmed when no understanding and no follow-up", () => {
    const dists = [
      makeDistribution({ child_confirmed_understanding: false, follow_up_needed: false }),
    ];
    const alerts = identifyGuideAlerts([], dists, [], 0, NOW);
    expect(alerts.some((a) => a.type === "understanding_not_confirmed")).toBe(true);
  });

  it("fires negative_feedback_pattern when >= 2 negative feedbacks", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "not_helpful" }),
      makeFeedback({ id: "f2", rating: "confusing" }),
    ];
    const alerts = identifyGuideAlerts([], [], fbs, 0, NOW);
    expect(alerts.some((a) => a.type === "negative_feedback_pattern")).toBe(true);
  });
});
