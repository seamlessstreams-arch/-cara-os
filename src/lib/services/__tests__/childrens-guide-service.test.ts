// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILDREN'S GUIDE SERVICE TESTS
// Pure-function unit tests for children's guide metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 16(2)–(3) requires a children's guide
// covering statement of purpose, rights, contacts, and complaints procedure.
// SCCIF: Children's Experiences — child-friendly, accessible guide.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  GUIDE_STATUSES,
  ACCESSIBILITY_FORMATS,
  GUIDE_SECTIONS,
  FEEDBACK_RATINGS,
  REQUIRED_SECTIONS,
  listGuides,
  createGuide,
  updateGuide,
  listDistributions,
  createDistribution,
  listFeedback,
  createFeedback,
} from "../childrens-guide-service";

import type {
  ChildrensGuide,
  GuideDistribution,
  GuideFeedback,
} from "../childrens-guide-service";

const { computeGuideMetrics, identifyGuideAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal ChildrensGuide with sensible defaults. */
function makeGuide(overrides: Partial<ChildrensGuide> = {}): ChildrensGuide {
  return {
    id: "guide-1",
    home_id: "home-1",
    version: "1.0",
    title: "Welcome to Chamberlain House",
    effective_date: daysAgo(30),
    review_date: daysFromNow(335),
    last_reviewed_date: daysAgo(30),
    reviewed_by: "staff-1",
    approved_by: "manager-1",
    approval_date: daysAgo(30),
    status: "active",
    sections_included: [
      "welcome",
      "about_the_home",
      "your_rights",
      "daily_routines",
      "who_to_talk_to",
      "contact_ofsted",
      "contact_childrens_commissioner",
      "contact_iro",
      "contact_advocate",
      "contact_independent_visitor",
      "how_to_complain",
      "house_rules",
      "leaving_the_home",
    ],
    formats_available: ["standard_print", "easy_read", "pictorial"],
    languages_available: ["English"],
    age_range_minimum: 8,
    age_range_maximum: 17,
    key_contacts: [
      { role: "Registered Manager", name: "Darren L", phone: "01onal" },
    ],
    ofsted_contact: "0300 123 1231",
    childrens_commissioner_contact: "0800 528 0731",
    advocacy_service_contact: "0808 801 0366",
    complaints_summary: "You can complain to any member of staff...",
    notes: null,
    created_at: daysAgoISO(30),
    updated_at: daysAgoISO(30),
    ...overrides,
  };
}

/** Build a minimal GuideDistribution with sensible defaults. */
function makeDistribution(
  overrides: Partial<GuideDistribution> = {},
): GuideDistribution {
  return {
    id: "dist-1",
    home_id: "home-1",
    guide_id: "guide-1",
    child_id: "child-1",
    child_name: "Alice Smith",
    distribution_date: daysAgo(7),
    format_provided: "standard_print",
    language_provided: "English",
    distributed_by: "staff-1",
    child_confirmed_receipt: true,
    child_confirmed_understanding: true,
    discussed_with_child: true,
    discussion_date: daysAgo(7),
    discussed_by: "staff-1",
    follow_up_needed: false,
    follow_up_notes: null,
    notes: null,
    created_at: daysAgoISO(7),
    ...overrides,
  };
}

/** Build a minimal GuideFeedback with sensible defaults. */
function makeFeedback(overrides: Partial<GuideFeedback> = {}): GuideFeedback {
  return {
    id: "fb-1",
    home_id: "home-1",
    guide_id: "guide-1",
    child_id: "child-1",
    child_name: "Alice Smith",
    feedback_date: daysAgo(3),
    rating: "helpful",
    what_was_helpful: "It told me who to talk to",
    what_could_improve: null,
    sections_found_confusing: [],
    suggestions: null,
    collected_by: "staff-1",
    action_taken: null,
    created_at: daysAgoISO(3),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("GUIDE_STATUSES", () => {
  it("has exactly 5 statuses", () => {
    expect(GUIDE_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const values = GUIDE_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = GUIDE_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes draft", () => {
    expect(GUIDE_STATUSES.find((s) => s.status === "draft")).toBeTruthy();
  });

  it("includes active", () => {
    expect(GUIDE_STATUSES.find((s) => s.status === "active")).toBeTruthy();
  });

  it("includes under_review", () => {
    expect(
      GUIDE_STATUSES.find((s) => s.status === "under_review"),
    ).toBeTruthy();
  });

  it("includes archived", () => {
    expect(GUIDE_STATUSES.find((s) => s.status === "archived")).toBeTruthy();
  });

  it("includes superseded", () => {
    expect(GUIDE_STATUSES.find((s) => s.status === "superseded")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of GUIDE_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("ACCESSIBILITY_FORMATS", () => {
  it("has exactly 9 formats", () => {
    expect(ACCESSIBILITY_FORMATS).toHaveLength(9);
  });

  it("contains unique format values", () => {
    const values = ACCESSIBILITY_FORMATS.map((f) => f.format);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = ACCESSIBILITY_FORMATS.map((f) => f.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes standard_print", () => {
    expect(
      ACCESSIBILITY_FORMATS.find((f) => f.format === "standard_print"),
    ).toBeTruthy();
  });

  it("includes easy_read", () => {
    expect(
      ACCESSIBILITY_FORMATS.find((f) => f.format === "easy_read"),
    ).toBeTruthy();
  });

  it("includes braille", () => {
    expect(
      ACCESSIBILITY_FORMATS.find((f) => f.format === "braille"),
    ).toBeTruthy();
  });

  it("includes audio", () => {
    expect(
      ACCESSIBILITY_FORMATS.find((f) => f.format === "audio"),
    ).toBeTruthy();
  });

  it("includes video", () => {
    expect(
      ACCESSIBILITY_FORMATS.find((f) => f.format === "video"),
    ).toBeTruthy();
  });

  it("includes pictorial", () => {
    expect(
      ACCESSIBILITY_FORMATS.find((f) => f.format === "pictorial"),
    ).toBeTruthy();
  });

  it("includes translated", () => {
    expect(
      ACCESSIBILITY_FORMATS.find((f) => f.format === "translated"),
    ).toBeTruthy();
  });

  it("includes large_print", () => {
    expect(
      ACCESSIBILITY_FORMATS.find((f) => f.format === "large_print"),
    ).toBeTruthy();
  });

  it("includes digital", () => {
    expect(
      ACCESSIBILITY_FORMATS.find((f) => f.format === "digital"),
    ).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const f of ACCESSIBILITY_FORMATS) {
      expect(f.label.length).toBeGreaterThan(0);
    }
  });
});

describe("GUIDE_SECTIONS", () => {
  it("has exactly 13 sections", () => {
    expect(GUIDE_SECTIONS).toHaveLength(13);
  });

  it("contains unique section values", () => {
    const values = GUIDE_SECTIONS.map((s) => s.section);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = GUIDE_SECTIONS.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes welcome", () => {
    expect(
      GUIDE_SECTIONS.find((s) => s.section === "welcome"),
    ).toBeTruthy();
  });

  it("includes about_the_home", () => {
    expect(
      GUIDE_SECTIONS.find((s) => s.section === "about_the_home"),
    ).toBeTruthy();
  });

  it("includes your_rights", () => {
    expect(
      GUIDE_SECTIONS.find((s) => s.section === "your_rights"),
    ).toBeTruthy();
  });

  it("includes contact_ofsted", () => {
    expect(
      GUIDE_SECTIONS.find((s) => s.section === "contact_ofsted"),
    ).toBeTruthy();
  });

  it("includes contact_childrens_commissioner", () => {
    expect(
      GUIDE_SECTIONS.find(
        (s) => s.section === "contact_childrens_commissioner",
      ),
    ).toBeTruthy();
  });

  it("includes how_to_complain", () => {
    expect(
      GUIDE_SECTIONS.find((s) => s.section === "how_to_complain"),
    ).toBeTruthy();
  });

  it("includes contact_advocate", () => {
    expect(
      GUIDE_SECTIONS.find((s) => s.section === "contact_advocate"),
    ).toBeTruthy();
  });

  it("includes contact_iro", () => {
    expect(
      GUIDE_SECTIONS.find((s) => s.section === "contact_iro"),
    ).toBeTruthy();
  });

  it("includes contact_independent_visitor", () => {
    expect(
      GUIDE_SECTIONS.find(
        (s) => s.section === "contact_independent_visitor",
      ),
    ).toBeTruthy();
  });

  it("includes daily_routines", () => {
    expect(
      GUIDE_SECTIONS.find((s) => s.section === "daily_routines"),
    ).toBeTruthy();
  });

  it("includes who_to_talk_to", () => {
    expect(
      GUIDE_SECTIONS.find((s) => s.section === "who_to_talk_to"),
    ).toBeTruthy();
  });

  it("includes house_rules", () => {
    expect(
      GUIDE_SECTIONS.find((s) => s.section === "house_rules"),
    ).toBeTruthy();
  });

  it("includes leaving_the_home", () => {
    expect(
      GUIDE_SECTIONS.find((s) => s.section === "leaving_the_home"),
    ).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of GUIDE_SECTIONS) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("FEEDBACK_RATINGS", () => {
  it("has exactly 5 ratings", () => {
    expect(FEEDBACK_RATINGS).toHaveLength(5);
  });

  it("contains unique rating values", () => {
    const values = FEEDBACK_RATINGS.map((r) => r.rating);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = FEEDBACK_RATINGS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes very_helpful", () => {
    expect(
      FEEDBACK_RATINGS.find((r) => r.rating === "very_helpful"),
    ).toBeTruthy();
  });

  it("includes helpful", () => {
    expect(
      FEEDBACK_RATINGS.find((r) => r.rating === "helpful"),
    ).toBeTruthy();
  });

  it("includes okay", () => {
    expect(
      FEEDBACK_RATINGS.find((r) => r.rating === "okay"),
    ).toBeTruthy();
  });

  it("includes not_helpful", () => {
    expect(
      FEEDBACK_RATINGS.find((r) => r.rating === "not_helpful"),
    ).toBeTruthy();
  });

  it("includes confusing", () => {
    expect(
      FEEDBACK_RATINGS.find((r) => r.rating === "confusing"),
    ).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const r of FEEDBACK_RATINGS) {
      expect(r.label.length).toBeGreaterThan(0);
    }
  });
});

describe("REQUIRED_SECTIONS", () => {
  it("has exactly 7 required sections", () => {
    expect(REQUIRED_SECTIONS).toHaveLength(7);
  });

  it("contains unique values", () => {
    expect(new Set(REQUIRED_SECTIONS).size).toBe(REQUIRED_SECTIONS.length);
  });

  it("includes about_the_home", () => {
    expect(REQUIRED_SECTIONS).toContain("about_the_home");
  });

  it("includes your_rights", () => {
    expect(REQUIRED_SECTIONS).toContain("your_rights");
  });

  it("includes who_to_talk_to", () => {
    expect(REQUIRED_SECTIONS).toContain("who_to_talk_to");
  });

  it("includes contact_ofsted", () => {
    expect(REQUIRED_SECTIONS).toContain("contact_ofsted");
  });

  it("includes contact_childrens_commissioner", () => {
    expect(REQUIRED_SECTIONS).toContain("contact_childrens_commissioner");
  });

  it("includes contact_advocate", () => {
    expect(REQUIRED_SECTIONS).toContain("contact_advocate");
  });

  it("includes how_to_complain", () => {
    expect(REQUIRED_SECTIONS).toContain("how_to_complain");
  });

  it("does not include optional sections like welcome or house_rules", () => {
    expect(REQUIRED_SECTIONS).not.toContain("welcome");
    expect(REQUIRED_SECTIONS).not.toContain("house_rules");
    expect(REQUIRED_SECTIONS).not.toContain("daily_routines");
    expect(REQUIRED_SECTIONS).not.toContain("leaving_the_home");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeGuideMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeGuideMetrics", () => {
  it("returns zeroed metrics for empty arrays", () => {
    const m = computeGuideMetrics([], [], [], 0);
    expect(m.active_guides).toBe(0);
    expect(m.formats_available).toBe(0);
    expect(m.children_received).toBe(0);
    expect(m.children_total).toBe(0);
    expect(m.distribution_rate).toBe(0);
    expect(m.understanding_confirmed_rate).toBe(0);
    expect(m.avg_feedback_score).toBe(0);
    expect(m.overdue_reviews).toBe(0);
    expect(Object.keys(m.sections_coverage)).toHaveLength(7);
    expect(Object.keys(m.by_feedback_rating)).toHaveLength(0);
  });

  it("counts only active guides", () => {
    const guides = [
      makeGuide({ id: "g1", status: "active" }),
      makeGuide({ id: "g2", status: "draft" }),
      makeGuide({ id: "g3", status: "archived" }),
      makeGuide({ id: "g4", status: "active" }),
    ];
    const m = computeGuideMetrics(guides, [], [], 0);
    expect(m.active_guides).toBe(2);
  });

  it("counts unique formats across active guides", () => {
    const guides = [
      makeGuide({
        id: "g1",
        status: "active",
        formats_available: ["standard_print", "easy_read"],
      }),
      makeGuide({
        id: "g2",
        status: "active",
        formats_available: ["easy_read", "braille", "audio"],
      }),
    ];
    const m = computeGuideMetrics(guides, [], [], 0);
    // standard_print, easy_read, braille, audio = 4 unique
    expect(m.formats_available).toBe(4);
  });

  it("does not count formats from non-active guides", () => {
    const guides = [
      makeGuide({
        id: "g1",
        status: "draft",
        formats_available: ["standard_print", "braille", "audio", "video"],
      }),
    ];
    const m = computeGuideMetrics(guides, [], [], 0);
    expect(m.formats_available).toBe(0);
  });

  it("counts unique children who received the guide", () => {
    const dists = [
      makeDistribution({ id: "d1", child_id: "c1" }),
      makeDistribution({ id: "d2", child_id: "c2" }),
      makeDistribution({ id: "d3", child_id: "c1" }), // duplicate child
    ];
    const m = computeGuideMetrics([], dists, [], 5);
    expect(m.children_received).toBe(2);
  });

  it("sets children_total from the parameter", () => {
    const m = computeGuideMetrics([], [], [], 6);
    expect(m.children_total).toBe(6);
  });

  it("calculates distribution rate correctly", () => {
    const dists = [
      makeDistribution({ id: "d1", child_id: "c1" }),
      makeDistribution({ id: "d2", child_id: "c2" }),
    ];
    const m = computeGuideMetrics([], dists, [], 4);
    // 2/4 = 50%
    expect(m.distribution_rate).toBe(50);
  });

  it("returns 0 distribution rate when totalChildren is 0", () => {
    const dists = [makeDistribution({ id: "d1", child_id: "c1" })];
    const m = computeGuideMetrics([], dists, [], 0);
    expect(m.distribution_rate).toBe(0);
  });

  it("returns 100 distribution rate when all children have received", () => {
    const dists = [
      makeDistribution({ id: "d1", child_id: "c1" }),
      makeDistribution({ id: "d2", child_id: "c2" }),
      makeDistribution({ id: "d3", child_id: "c3" }),
    ];
    const m = computeGuideMetrics([], dists, [], 3);
    expect(m.distribution_rate).toBe(100);
  });

  it("calculates understanding confirmed rate correctly", () => {
    const dists = [
      makeDistribution({
        id: "d1",
        child_id: "c1",
        child_confirmed_understanding: true,
      }),
      makeDistribution({
        id: "d2",
        child_id: "c2",
        child_confirmed_understanding: false,
      }),
      makeDistribution({
        id: "d3",
        child_id: "c3",
        child_confirmed_understanding: true,
      }),
    ];
    const m = computeGuideMetrics([], dists, [], 3);
    // 2/3 = 66.7%
    expect(m.understanding_confirmed_rate).toBe(66.7);
  });

  it("returns 0 understanding rate when no distributions", () => {
    const m = computeGuideMetrics([], [], [], 5);
    expect(m.understanding_confirmed_rate).toBe(0);
  });

  it("returns 100 understanding rate when all confirmed", () => {
    const dists = [
      makeDistribution({
        id: "d1",
        child_id: "c1",
        child_confirmed_understanding: true,
      }),
      makeDistribution({
        id: "d2",
        child_id: "c2",
        child_confirmed_understanding: true,
      }),
    ];
    const m = computeGuideMetrics([], dists, [], 2);
    expect(m.understanding_confirmed_rate).toBe(100);
  });

  it("calculates avg feedback score for very_helpful (5)", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "very_helpful" }),
      makeFeedback({ id: "f2", rating: "very_helpful" }),
    ];
    const m = computeGuideMetrics([], [], fbs, 0);
    expect(m.avg_feedback_score).toBe(5);
  });

  it("calculates avg feedback score for mixed ratings", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "very_helpful" }), // 5
      makeFeedback({ id: "f2", rating: "helpful" }), // 4
      makeFeedback({ id: "f3", rating: "okay" }), // 3
      makeFeedback({ id: "f4", rating: "not_helpful" }), // 2
      makeFeedback({ id: "f5", rating: "confusing" }), // 1
    ];
    const m = computeGuideMetrics([], [], fbs, 0);
    // (5+4+3+2+1)/5 = 3.0
    expect(m.avg_feedback_score).toBe(3);
  });

  it("returns 0 avg feedback score when no feedback", () => {
    const m = computeGuideMetrics([], [], [], 0);
    expect(m.avg_feedback_score).toBe(0);
  });

  it("calculates avg feedback score with rounding", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "very_helpful" }), // 5
      makeFeedback({ id: "f2", rating: "helpful" }), // 4
      makeFeedback({ id: "f3", rating: "okay" }), // 3
    ];
    const m = computeGuideMetrics([], [], fbs, 0);
    // (5+4+3)/3 = 4.0
    expect(m.avg_feedback_score).toBe(4);
  });

  it("calculates avg feedback score for confusing only (1)", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "confusing" }),
    ];
    const m = computeGuideMetrics([], [], fbs, 0);
    expect(m.avg_feedback_score).toBe(1);
  });

  it("counts overdue reviews for active guides past review date", () => {
    const guides = [
      makeGuide({ id: "g1", status: "active", review_date: daysAgo(10) }),
      makeGuide({ id: "g2", status: "active", review_date: daysFromNow(30) }),
      makeGuide({ id: "g3", status: "active", review_date: daysAgo(5) }),
    ];
    const m = computeGuideMetrics(guides, [], [], 0);
    expect(m.overdue_reviews).toBe(2);
  });

  it("does not count overdue reviews for non-active guides", () => {
    const guides = [
      makeGuide({ id: "g1", status: "draft", review_date: daysAgo(10) }),
      makeGuide({ id: "g2", status: "archived", review_date: daysAgo(20) }),
    ];
    const m = computeGuideMetrics(guides, [], [], 0);
    expect(m.overdue_reviews).toBe(0);
  });

  it("returns 0 overdue reviews when none are past due", () => {
    const guides = [
      makeGuide({ id: "g1", status: "active", review_date: daysFromNow(60) }),
    ];
    const m = computeGuideMetrics(guides, [], [], 0);
    expect(m.overdue_reviews).toBe(0);
  });

  it("sections_coverage reflects the latest active guide by effective date", () => {
    const guides = [
      makeGuide({
        id: "g1",
        status: "active",
        effective_date: daysAgo(60),
        sections_included: ["about_the_home", "your_rights"],
      }),
      makeGuide({
        id: "g2",
        status: "active",
        effective_date: daysAgo(10),
        sections_included: [
          "about_the_home",
          "your_rights",
          "who_to_talk_to",
          "contact_ofsted",
          "contact_childrens_commissioner",
          "contact_advocate",
          "how_to_complain",
        ],
      }),
    ];
    const m = computeGuideMetrics(guides, [], [], 0);
    // g2 is latest — has all required sections
    for (const s of REQUIRED_SECTIONS) {
      expect(m.sections_coverage[s]).toBe(true);
    }
  });

  it("sections_coverage shows false for missing sections", () => {
    const guides = [
      makeGuide({
        id: "g1",
        status: "active",
        sections_included: ["about_the_home", "your_rights"],
      }),
    ];
    const m = computeGuideMetrics(guides, [], [], 0);
    expect(m.sections_coverage["about_the_home"]).toBe(true);
    expect(m.sections_coverage["your_rights"]).toBe(true);
    expect(m.sections_coverage["who_to_talk_to"]).toBe(false);
    expect(m.sections_coverage["contact_ofsted"]).toBe(false);
    expect(m.sections_coverage["contact_childrens_commissioner"]).toBe(false);
    expect(m.sections_coverage["contact_advocate"]).toBe(false);
    expect(m.sections_coverage["how_to_complain"]).toBe(false);
  });

  it("sections_coverage all false when no active guides", () => {
    const guides = [
      makeGuide({ id: "g1", status: "draft", sections_included: REQUIRED_SECTIONS as any }),
    ];
    const m = computeGuideMetrics(guides, [], [], 0);
    for (const s of REQUIRED_SECTIONS) {
      expect(m.sections_coverage[s]).toBe(false);
    }
  });

  it("by_feedback_rating tallies each rating", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "very_helpful" }),
      makeFeedback({ id: "f2", rating: "helpful" }),
      makeFeedback({ id: "f3", rating: "helpful" }),
      makeFeedback({ id: "f4", rating: "confusing" }),
    ];
    const m = computeGuideMetrics([], [], fbs, 0);
    expect(m.by_feedback_rating["very_helpful"]).toBe(1);
    expect(m.by_feedback_rating["helpful"]).toBe(2);
    expect(m.by_feedback_rating["confusing"]).toBe(1);
  });

  it("by_feedback_rating is empty when no feedback", () => {
    const m = computeGuideMetrics([], [], [], 0);
    expect(Object.keys(m.by_feedback_rating)).toHaveLength(0);
  });

  it("by_feedback_rating only includes ratings that exist in data", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "okay" }),
      makeFeedback({ id: "f2", rating: "okay" }),
    ];
    const m = computeGuideMetrics([], [], fbs, 0);
    expect(m.by_feedback_rating["okay"]).toBe(2);
    expect(m.by_feedback_rating["very_helpful"]).toBeUndefined();
    expect(m.by_feedback_rating["confusing"]).toBeUndefined();
  });

  it("handles distribution rate with fractional percentages", () => {
    const dists = [
      makeDistribution({ id: "d1", child_id: "c1" }),
    ];
    const m = computeGuideMetrics([], dists, [], 3);
    // 1/3 = 33.3%
    expect(m.distribution_rate).toBe(33.3);
  });

  it("handles a single active guide with all data populated", () => {
    const guide = makeGuide({ id: "g1", status: "active" });
    const dist = makeDistribution({ child_confirmed_understanding: true });
    const fb = makeFeedback({ rating: "very_helpful" });
    const m = computeGuideMetrics([guide], [dist], [fb], 2);
    expect(m.active_guides).toBe(1);
    expect(m.formats_available).toBe(3);
    expect(m.children_received).toBe(1);
    expect(m.children_total).toBe(2);
    expect(m.distribution_rate).toBe(50);
    expect(m.understanding_confirmed_rate).toBe(100);
    expect(m.avg_feedback_score).toBe(5);
  });

  it("returns sections_coverage keys matching REQUIRED_SECTIONS", () => {
    const m = computeGuideMetrics([], [], [], 0);
    const keys = Object.keys(m.sections_coverage);
    expect(keys).toHaveLength(REQUIRED_SECTIONS.length);
    for (const s of REQUIRED_SECTIONS) {
      expect(keys).toContain(s);
    }
  });

  it("does not double-count children with multiple distributions", () => {
    const dists = [
      makeDistribution({ id: "d1", child_id: "c1", format_provided: "standard_print" }),
      makeDistribution({ id: "d2", child_id: "c1", format_provided: "easy_read" }),
      makeDistribution({ id: "d3", child_id: "c1", format_provided: "audio" }),
    ];
    const m = computeGuideMetrics([], dists, [], 5);
    expect(m.children_received).toBe(1);
    expect(m.distribution_rate).toBe(20);
  });

  it("understanding_confirmed_rate counts every distribution row", () => {
    const dists = [
      makeDistribution({ id: "d1", child_id: "c1", child_confirmed_understanding: true }),
      makeDistribution({ id: "d2", child_id: "c1", child_confirmed_understanding: false }),
    ];
    const m = computeGuideMetrics([], dists, [], 1);
    // 1 out of 2 distributions = 50%
    expect(m.understanding_confirmed_rate).toBe(50);
  });

  it("avg_feedback_score: helpful=4, not_helpful=2 => 3.0", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "helpful" }),
      makeFeedback({ id: "f2", rating: "not_helpful" }),
    ];
    const m = computeGuideMetrics([], [], fbs, 0);
    expect(m.avg_feedback_score).toBe(3);
  });

  it("counts 0 active guides when all are superseded", () => {
    const guides = [
      makeGuide({ id: "g1", status: "superseded" }),
      makeGuide({ id: "g2", status: "superseded" }),
    ];
    const m = computeGuideMetrics(guides, [], [], 0);
    expect(m.active_guides).toBe(0);
  });

  it("formats_available deduplicates across active guides", () => {
    const guides = [
      makeGuide({ id: "g1", status: "active", formats_available: ["standard_print", "easy_read"] }),
      makeGuide({ id: "g2", status: "active", formats_available: ["standard_print", "easy_read"] }),
    ];
    const m = computeGuideMetrics(guides, [], [], 0);
    expect(m.formats_available).toBe(2);
  });

  it("by_feedback_rating counts all 5 rating types when present", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "very_helpful" }),
      makeFeedback({ id: "f2", rating: "helpful" }),
      makeFeedback({ id: "f3", rating: "okay" }),
      makeFeedback({ id: "f4", rating: "not_helpful" }),
      makeFeedback({ id: "f5", rating: "confusing" }),
    ];
    const m = computeGuideMetrics([], [], fbs, 0);
    expect(Object.keys(m.by_feedback_rating)).toHaveLength(5);
    expect(m.by_feedback_rating["very_helpful"]).toBe(1);
    expect(m.by_feedback_rating["helpful"]).toBe(1);
    expect(m.by_feedback_rating["okay"]).toBe(1);
    expect(m.by_feedback_rating["not_helpful"]).toBe(1);
    expect(m.by_feedback_rating["confusing"]).toBe(1);
  });

  it("overdue_reviews is 0 with no guides at all", () => {
    const m = computeGuideMetrics([], [], [], 0);
    expect(m.overdue_reviews).toBe(0);
  });

  it("sections_coverage picks latest by effective_date not by array order", () => {
    const guides = [
      makeGuide({
        id: "g2",
        status: "active",
        effective_date: daysAgo(5),
        sections_included: REQUIRED_SECTIONS.slice(0, 3) as any,
      }),
      makeGuide({
        id: "g1",
        status: "active",
        effective_date: daysAgo(60),
        sections_included: [...REQUIRED_SECTIONS] as any,
      }),
    ];
    const m = computeGuideMetrics(guides, [], [], 0);
    // g2 is latest (5 days ago vs 60), only has first 3 required sections
    expect(m.sections_coverage["about_the_home"]).toBe(true);
    expect(m.sections_coverage["your_rights"]).toBe(true);
    expect(m.sections_coverage["who_to_talk_to"]).toBe(true);
    expect(m.sections_coverage["contact_ofsted"]).toBe(false);
  });

  it("distribution_rate rounds to one decimal place", () => {
    const dists = [
      makeDistribution({ id: "d1", child_id: "c1" }),
      makeDistribution({ id: "d2", child_id: "c2" }),
    ];
    const m = computeGuideMetrics([], dists, [], 6);
    // 2/6 = 33.3%
    expect(m.distribution_rate).toBe(33.3);
  });

  it("understanding_confirmed_rate rounds to one decimal place", () => {
    const dists = [
      makeDistribution({ id: "d1", child_confirmed_understanding: true }),
      makeDistribution({ id: "d2", child_confirmed_understanding: true }),
      makeDistribution({ id: "d3", child_confirmed_understanding: false }),
    ];
    const m = computeGuideMetrics([], dists, [], 3);
    // 2/3 = 66.7%
    expect(m.understanding_confirmed_rate).toBe(66.7);
  });

  it("avg_feedback_score rounds to one decimal place", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "very_helpful" }),
      makeFeedback({ id: "f2", rating: "okay" }),
      makeFeedback({ id: "f3", rating: "helpful" }),
    ];
    const m = computeGuideMetrics([], [], fbs, 0);
    // (5+3+4)/3 = 4.0
    expect(m.avg_feedback_score).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyGuideAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyGuideAlerts", () => {
  const now = new Date(new Date().toISOString().split("T")[0]);

  it("returns no alerts for a fully compliant setup", () => {
    const guide = makeGuide({ status: "active" });
    const dists = [
      makeDistribution({
        id: "d1",
        child_id: "c1",
        child_confirmed_understanding: true,
      }),
      makeDistribution({
        id: "d2",
        child_id: "c2",
        child_confirmed_understanding: true,
      }),
    ];
    const alerts = identifyGuideAlerts([guide], dists, [], 2, now);
    expect(alerts).toHaveLength(0);
  });

  it("raises critical alert when no active guide exists", () => {
    const guides = [
      makeGuide({ id: "g1", status: "draft" }),
      makeGuide({ id: "g2", status: "archived" }),
    ];
    const alerts = identifyGuideAlerts(guides, [], [], 0, now);
    const noActive = alerts.find((a) => a.type === "no_active_guide");
    expect(noActive).toBeTruthy();
    expect(noActive!.severity).toBe("critical");
    expect(noActive!.id).toBe("g1");
  });

  it("does not raise no_active_guide when guides array is empty", () => {
    const alerts = identifyGuideAlerts([], [], [], 0, now);
    const noActive = alerts.find((a) => a.type === "no_active_guide");
    expect(noActive).toBeUndefined();
  });

  it("does not raise no_active_guide when an active guide exists", () => {
    const guide = makeGuide({ status: "active" });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const noActive = alerts.find((a) => a.type === "no_active_guide");
    expect(noActive).toBeUndefined();
  });

  it("raises high alert when guide review is overdue", () => {
    const guide = makeGuide({
      id: "g1",
      status: "active",
      review_date: daysAgo(15),
    });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeTruthy();
    expect(overdue!.severity).toBe("high");
    expect(overdue!.id).toBe("g1");
  });

  it("includes days overdue in review_overdue message", () => {
    const guide = makeGuide({
      id: "g1",
      status: "active",
      review_date: daysAgo(20),
    });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeTruthy();
    expect(overdue!.message).toContain("20");
  });

  it("does not raise review_overdue for future review dates", () => {
    const guide = makeGuide({
      status: "active",
      review_date: daysFromNow(90),
    });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeUndefined();
  });

  it("raises high alert for missing required sections", () => {
    const guide = makeGuide({
      id: "g1",
      status: "active",
      sections_included: ["welcome", "daily_routines"],
    });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const missing = alerts.find((a) => a.type === "missing_required_sections");
    expect(missing).toBeTruthy();
    expect(missing!.severity).toBe("high");
    expect(missing!.id).toBe("g1");
  });

  it("includes count of missing sections in alert message", () => {
    const guide = makeGuide({
      id: "g1",
      status: "active",
      sections_included: ["about_the_home", "your_rights"],
    });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const missing = alerts.find((a) => a.type === "missing_required_sections");
    expect(missing).toBeTruthy();
    // Missing: who_to_talk_to, contact_ofsted, contact_childrens_commissioner, contact_advocate, how_to_complain = 5
    expect(missing!.message).toContain("5");
  });

  it("does not raise missing sections when all required sections present", () => {
    const guide = makeGuide({
      status: "active",
      sections_included: [...REQUIRED_SECTIONS, "welcome"],
    });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const missing = alerts.find((a) => a.type === "missing_required_sections");
    expect(missing).toBeUndefined();
  });

  it("raises medium alert for limited accessibility (standard_print only)", () => {
    const guide = makeGuide({
      id: "g1",
      status: "active",
      formats_available: ["standard_print"],
    });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const limited = alerts.find((a) => a.type === "limited_accessibility");
    expect(limited).toBeTruthy();
    expect(limited!.severity).toBe("medium");
    expect(limited!.id).toBe("g1");
  });

  it("does not raise limited accessibility when multiple formats exist", () => {
    const guide = makeGuide({
      status: "active",
      formats_available: ["standard_print", "easy_read"],
    });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const limited = alerts.find((a) => a.type === "limited_accessibility");
    expect(limited).toBeUndefined();
  });

  it("does not raise limited accessibility when only easy_read is available", () => {
    const guide = makeGuide({
      status: "active",
      formats_available: ["easy_read"],
    });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const limited = alerts.find((a) => a.type === "limited_accessibility");
    expect(limited).toBeUndefined();
  });

  it("raises medium alert when guide is not approved", () => {
    const guide = makeGuide({
      id: "g1",
      status: "active",
      approved_by: null,
    });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const notApproved = alerts.find((a) => a.type === "not_approved");
    expect(notApproved).toBeTruthy();
    expect(notApproved!.severity).toBe("medium");
    expect(notApproved!.id).toBe("g1");
  });

  it("does not raise not_approved when guide has an approver", () => {
    const guide = makeGuide({
      status: "active",
      approved_by: "manager-1",
    });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const notApproved = alerts.find((a) => a.type === "not_approved");
    expect(notApproved).toBeUndefined();
  });

  it("raises high alert for distribution gap", () => {
    const guide = makeGuide({ id: "g1", status: "active" });
    const dists = [
      makeDistribution({ id: "d1", child_id: "c1" }),
    ];
    // totalChildren=3 but only 1 has received
    const alerts = identifyGuideAlerts([guide], dists, [], 3, now);
    const gap = alerts.find((a) => a.type === "distribution_gap");
    expect(gap).toBeTruthy();
    expect(gap!.severity).toBe("high");
    expect(gap!.message).toContain("2");
  });

  it("does not raise distribution gap when all children have received", () => {
    const guide = makeGuide({ status: "active" });
    const dists = [
      makeDistribution({ id: "d1", child_id: "c1" }),
      makeDistribution({ id: "d2", child_id: "c2" }),
    ];
    const alerts = identifyGuideAlerts([guide], dists, [], 2, now);
    const gap = alerts.find((a) => a.type === "distribution_gap");
    expect(gap).toBeUndefined();
  });

  it("does not raise distribution gap when totalChildren is 0", () => {
    const alerts = identifyGuideAlerts([], [], [], 0, now);
    const gap = alerts.find((a) => a.type === "distribution_gap");
    expect(gap).toBeUndefined();
  });

  it("distribution gap uses active guide id when available", () => {
    const guide = makeGuide({ id: "g1", status: "active" });
    const alerts = identifyGuideAlerts([guide], [], [], 4, now);
    const gap = alerts.find((a) => a.type === "distribution_gap");
    expect(gap).toBeTruthy();
    expect(gap!.id).toBe("g1");
  });

  it("distribution gap uses 'system' id when no active guide", () => {
    const guide = makeGuide({ id: "g1", status: "draft" });
    const alerts = identifyGuideAlerts([guide], [], [], 4, now);
    const gap = alerts.find((a) => a.type === "distribution_gap");
    expect(gap).toBeTruthy();
    expect(gap!.id).toBe("system");
  });

  it("raises medium alert for understanding not confirmed without follow-up", () => {
    const guide = makeGuide({ status: "active" });
    const dist = makeDistribution({
      id: "d1",
      child_id: "c1",
      child_name: "Bob Jones",
      child_confirmed_understanding: false,
      follow_up_needed: false,
    });
    const alerts = identifyGuideAlerts([guide], [dist], [], 1, now);
    const unconf = alerts.find(
      (a) => a.type === "understanding_not_confirmed",
    );
    expect(unconf).toBeTruthy();
    expect(unconf!.severity).toBe("medium");
    expect(unconf!.message).toContain("Bob Jones");
    expect(unconf!.id).toBe("d1");
  });

  it("does not raise understanding alert when child confirmed understanding", () => {
    const guide = makeGuide({ status: "active" });
    const dist = makeDistribution({
      id: "d1",
      child_confirmed_understanding: true,
      follow_up_needed: false,
    });
    const alerts = identifyGuideAlerts([guide], [dist], [], 1, now);
    const unconf = alerts.find(
      (a) => a.type === "understanding_not_confirmed",
    );
    expect(unconf).toBeUndefined();
  });

  it("does not raise understanding alert when follow-up is flagged", () => {
    const guide = makeGuide({ status: "active" });
    const dist = makeDistribution({
      id: "d1",
      child_confirmed_understanding: false,
      follow_up_needed: true,
    });
    const alerts = identifyGuideAlerts([guide], [dist], [], 1, now);
    const unconf = alerts.find(
      (a) => a.type === "understanding_not_confirmed",
    );
    expect(unconf).toBeUndefined();
  });

  it("raises medium alert for negative feedback pattern (>= 2 negative)", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "not_helpful" }),
      makeFeedback({ id: "f2", rating: "confusing" }),
    ];
    const alerts = identifyGuideAlerts([], [], fbs, 0, now);
    const neg = alerts.find((a) => a.type === "negative_feedback_pattern");
    expect(neg).toBeTruthy();
    expect(neg!.severity).toBe("medium");
    expect(neg!.message).toContain("2");
    expect(neg!.id).toBe("f1");
  });

  it("does not raise negative feedback alert for only 1 negative", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "not_helpful" }),
      makeFeedback({ id: "f2", rating: "very_helpful" }),
    ];
    const alerts = identifyGuideAlerts([], [], fbs, 0, now);
    const neg = alerts.find((a) => a.type === "negative_feedback_pattern");
    expect(neg).toBeUndefined();
  });

  it("counts both not_helpful and confusing as negative", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "not_helpful" }),
      makeFeedback({ id: "f2", rating: "confusing" }),
      makeFeedback({ id: "f3", rating: "confusing" }),
    ];
    const alerts = identifyGuideAlerts([], [], fbs, 0, now);
    const neg = alerts.find((a) => a.type === "negative_feedback_pattern");
    expect(neg).toBeTruthy();
    expect(neg!.message).toContain("3");
  });

  it("does not count okay/helpful/very_helpful as negative", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "okay" }),
      makeFeedback({ id: "f2", rating: "helpful" }),
      makeFeedback({ id: "f3", rating: "very_helpful" }),
    ];
    const alerts = identifyGuideAlerts([], [], fbs, 0, now);
    const neg = alerts.find((a) => a.type === "negative_feedback_pattern");
    expect(neg).toBeUndefined();
  });

  it("raises multiple alerts for a guide with many issues", () => {
    const guide = makeGuide({
      id: "g1",
      status: "active",
      review_date: daysAgo(30),
      sections_included: ["welcome"],
      formats_available: ["standard_print"],
      approved_by: null,
    });
    const alerts = identifyGuideAlerts([guide], [], [], 3, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("review_overdue");
    expect(types).toContain("missing_required_sections");
    expect(types).toContain("limited_accessibility");
    expect(types).toContain("not_approved");
    expect(types).toContain("distribution_gap");
  });

  it("raises combined alerts from guides, distributions, and feedback", () => {
    const guide = makeGuide({
      id: "g1",
      status: "active",
      review_date: daysAgo(5),
      approved_by: null,
    });
    const dist = makeDistribution({
      id: "d1",
      child_id: "c1",
      child_name: "Zoe",
      child_confirmed_understanding: false,
      follow_up_needed: false,
    });
    const fbs = [
      makeFeedback({ id: "f1", rating: "confusing" }),
      makeFeedback({ id: "f2", rating: "not_helpful" }),
    ];
    const alerts = identifyGuideAlerts([guide], [dist], fbs, 3, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("review_overdue");
    expect(types).toContain("not_approved");
    expect(types).toContain("distribution_gap");
    expect(types).toContain("understanding_not_confirmed");
    expect(types).toContain("negative_feedback_pattern");
  });

  it("raises alerts for multiple active guides independently", () => {
    const g1 = makeGuide({
      id: "g1",
      status: "active",
      review_date: daysAgo(10),
      approved_by: "mgr-1",
    });
    const g2 = makeGuide({
      id: "g2",
      status: "active",
      review_date: daysFromNow(30),
      approved_by: null,
    });
    const alerts = identifyGuideAlerts([g1, g2], [], [], 0, now);
    const overdue = alerts.filter((a) => a.type === "review_overdue");
    const notApproved = alerts.filter((a) => a.type === "not_approved");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].id).toBe("g1");
    expect(notApproved).toHaveLength(1);
    expect(notApproved[0].id).toBe("g2");
  });

  it("raises understanding_not_confirmed for multiple distributions", () => {
    const dists = [
      makeDistribution({
        id: "d1",
        child_id: "c1",
        child_name: "Alice",
        child_confirmed_understanding: false,
        follow_up_needed: false,
      }),
      makeDistribution({
        id: "d2",
        child_id: "c2",
        child_name: "Bob",
        child_confirmed_understanding: false,
        follow_up_needed: false,
      }),
    ];
    const guide = makeGuide({ status: "active" });
    const alerts = identifyGuideAlerts([guide], dists, [], 2, now);
    const unconfirmed = alerts.filter(
      (a) => a.type === "understanding_not_confirmed",
    );
    expect(unconfirmed).toHaveLength(2);
  });

  it("each alert has required fields: type, severity, message, id", () => {
    const guide = makeGuide({
      id: "g1",
      status: "active",
      review_date: daysAgo(5),
      approved_by: null,
      sections_included: [],
      formats_available: ["standard_print"],
    });
    const alerts = identifyGuideAlerts([guide], [], [], 2, now);
    for (const a of alerts) {
      expect(a).toHaveProperty("type");
      expect(a).toHaveProperty("severity");
      expect(a).toHaveProperty("message");
      expect(a).toHaveProperty("id");
      expect(typeof a.type).toBe("string");
      expect(["critical", "high", "medium"]).toContain(a.severity);
      expect(a.message.length).toBeGreaterThan(0);
    }
  });

  it("now parameter defaults correctly (does not throw without it)", () => {
    const guide = makeGuide({
      status: "active",
      review_date: daysAgo(5),
    });
    // Call without the now parameter
    const alerts = identifyGuideAlerts([guide], [], [], 0);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeTruthy();
  });

  it("no_active_guide uses first guide id as alert id", () => {
    const guides = [
      makeGuide({ id: "first-guide", status: "draft" }),
      makeGuide({ id: "second-guide", status: "archived" }),
    ];
    const alerts = identifyGuideAlerts(guides, [], [], 0, now);
    const noActive = alerts.find((a) => a.type === "no_active_guide");
    expect(noActive!.id).toBe("first-guide");
  });

  it("limited_accessibility not triggered when formats array has 2+ items including standard_print", () => {
    const guide = makeGuide({
      status: "active",
      formats_available: ["standard_print", "audio"],
    });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const limited = alerts.find((a) => a.type === "limited_accessibility");
    expect(limited).toBeUndefined();
  });

  it("limited_accessibility not triggered when format is empty array", () => {
    const guide = makeGuide({
      status: "active",
      formats_available: [],
    });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const limited = alerts.find((a) => a.type === "limited_accessibility");
    expect(limited).toBeUndefined();
  });

  it("distribution_gap message shows correct missing count", () => {
    const guide = makeGuide({ status: "active" });
    const dists = [
      makeDistribution({ child_id: "c1" }),
      makeDistribution({ child_id: "c2" }),
    ];
    const alerts = identifyGuideAlerts([guide], dists, [], 5, now);
    const gap = alerts.find((a) => a.type === "distribution_gap");
    expect(gap!.message).toContain("3");
  });

  it("review_overdue message references Reg 16(3)", () => {
    const guide = makeGuide({
      status: "active",
      review_date: daysAgo(10),
    });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue!.message).toContain("Reg 16(3)");
  });

  it("missing_required_sections message references Reg 16(2)", () => {
    const guide = makeGuide({
      status: "active",
      sections_included: [],
    });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const missing = alerts.find((a) => a.type === "missing_required_sections");
    expect(missing!.message).toContain("Reg 16(2)");
  });

  it("no_active_guide message references Reg 16(2)", () => {
    const guide = makeGuide({ status: "draft" });
    const alerts = identifyGuideAlerts([guide], [], [], 0, now);
    const noActive = alerts.find((a) => a.type === "no_active_guide");
    expect(noActive!.message).toContain("Reg 16(2)");
  });

  it("distribution_gap message references Reg 16(3)", () => {
    const guide = makeGuide({ status: "active" });
    const alerts = identifyGuideAlerts([guide], [], [], 2, now);
    const gap = alerts.find((a) => a.type === "distribution_gap");
    expect(gap!.message).toContain("Reg 16(3)");
  });

  it("negative_feedback_pattern with exactly 2 negative items triggers alert", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "not_helpful" }),
      makeFeedback({ id: "f2", rating: "not_helpful" }),
    ];
    const alerts = identifyGuideAlerts([], [], fbs, 0, now);
    const neg = alerts.find((a) => a.type === "negative_feedback_pattern");
    expect(neg).toBeTruthy();
  });

  it("negative_feedback_pattern uses first negative feedback id", () => {
    const fbs = [
      makeFeedback({ id: "first-neg", rating: "confusing" }),
      makeFeedback({ id: "second-neg", rating: "not_helpful" }),
    ];
    const alerts = identifyGuideAlerts([], [], fbs, 0, now);
    const neg = alerts.find((a) => a.type === "negative_feedback_pattern");
    expect(neg!.id).toBe("first-neg");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listGuides ────────────────────────────────────────────────────────

  it("listGuides returns ok: true with empty array", async () => {
    const result = await listGuides("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listGuides returns ok: true with status filter", async () => {
    const result = await listGuides("home-1", { status: "active" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listGuides returns ok: true with limit filter", async () => {
    const result = await listGuides("home-1", { limit: 10 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createGuide ───────────────────────────────────────────────────────

  it("createGuide returns ok: false with error message", async () => {
    const result = await createGuide({
      homeId: "home-1",
      version: "1.0",
      title: "Guide",
      effectiveDate: daysAgo(1),
      reviewDate: daysFromNow(365),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createGuide returns error even with full input", async () => {
    const result = await createGuide({
      homeId: "home-1",
      version: "2.0",
      title: "Full Guide",
      effectiveDate: daysAgo(1),
      reviewDate: daysFromNow(365),
      sectionsIncluded: ["welcome", "your_rights"],
      formatsAvailable: ["standard_print", "easy_read"],
      languagesAvailable: ["English", "Welsh"],
      ageRangeMinimum: 8,
      ageRangeMaximum: 17,
      keyContacts: [{ role: "Manager", name: "Test", phone: "0123" }],
      ofstedContact: "0300 123 1231",
      childrensCommissionerContact: "0800 528 0731",
      advocacyServiceContact: "0808 801 0366",
      complaintsSummary: "Complaints procedure...",
      notes: "Test notes",
    });
    expect(result.ok).toBe(false);
  });

  // ── updateGuide ───────────────────────────────────────────────────────

  it("updateGuide returns ok: false with error message", async () => {
    const result = await updateGuide("guide-1", { status: "active" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateGuide returns error for any update payload", async () => {
    const result = await updateGuide("guide-1", {
      title: "Updated Title",
      version: "2.1",
    });
    expect(result.ok).toBe(false);
  });

  // ── listDistributions ─────────────────────────────────────────────────

  it("listDistributions returns ok: true with empty array", async () => {
    const result = await listDistributions("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listDistributions returns ok: true with guideId filter", async () => {
    const result = await listDistributions("home-1", { guideId: "guide-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listDistributions returns ok: true with childId filter", async () => {
    const result = await listDistributions("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listDistributions returns ok: true with limit filter", async () => {
    const result = await listDistributions("home-1", { limit: 25 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createDistribution ────────────────────────────────────────────────

  it("createDistribution returns ok: false with error message", async () => {
    const result = await createDistribution({
      homeId: "home-1",
      guideId: "guide-1",
      childId: "child-1",
      childName: "Alice Smith",
      distributedBy: "staff-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createDistribution returns error with full input", async () => {
    const result = await createDistribution({
      homeId: "home-1",
      guideId: "guide-1",
      childId: "child-1",
      childName: "Alice Smith",
      distributionDate: daysAgo(1),
      formatProvided: "easy_read",
      languageProvided: "Welsh",
      distributedBy: "staff-1",
      childConfirmedReceipt: true,
      childConfirmedUnderstanding: true,
      discussedWithChild: true,
      discussionDate: daysAgo(1),
      discussedBy: "staff-1",
      followUpNeeded: false,
      followUpNotes: undefined,
      notes: "Provided at admission",
    });
    expect(result.ok).toBe(false);
  });

  // ── listFeedback ──────────────────────────────────────────────────────

  it("listFeedback returns ok: true with empty array", async () => {
    const result = await listFeedback("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listFeedback returns ok: true with guideId filter", async () => {
    const result = await listFeedback("home-1", { guideId: "guide-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listFeedback returns ok: true with childId filter", async () => {
    const result = await listFeedback("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listFeedback returns ok: true with rating filter", async () => {
    const result = await listFeedback("home-1", { rating: "helpful" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listFeedback returns ok: true with limit filter", async () => {
    const result = await listFeedback("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createFeedback ────────────────────────────────────────────────────

  it("createFeedback returns ok: false with error message", async () => {
    const result = await createFeedback({
      homeId: "home-1",
      guideId: "guide-1",
      childId: "child-1",
      childName: "Alice Smith",
      rating: "helpful",
      collectedBy: "staff-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createFeedback returns error with full input", async () => {
    const result = await createFeedback({
      homeId: "home-1",
      guideId: "guide-1",
      childId: "child-1",
      childName: "Alice Smith",
      feedbackDate: daysAgo(1),
      rating: "very_helpful",
      whatWasHelpful: "The contact numbers were clear",
      whatCouldImprove: "More pictures",
      sectionsFoundConfusing: ["leaving_the_home"],
      suggestions: "Add a video version",
      collectedBy: "staff-1",
      actionTaken: "Will create video version",
    });
    expect(result.ok).toBe(false);
  });

  // ── Additional CRUD edge cases ─────────────────────────────────────────

  it("listGuides result data is an array type", async () => {
    const result = await listGuides("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.data)).toBe(true);
    }
  });

  it("listDistributions result data is an array type", async () => {
    const result = await listDistributions("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.data)).toBe(true);
    }
  });

  it("listFeedback result data is an array type", async () => {
    const result = await listFeedback("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.data)).toBe(true);
    }
  });

  it("listGuides with combined filters returns empty array", async () => {
    const result = await listGuides("home-1", { status: "draft", limit: 5 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listDistributions with combined filters returns empty array", async () => {
    const result = await listDistributions("home-1", {
      guideId: "guide-1",
      childId: "child-1",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listFeedback with combined filters returns empty array", async () => {
    const result = await listFeedback("home-1", {
      guideId: "guide-1",
      childId: "child-1",
      rating: "confusing",
      limit: 5,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("createGuide error message is a string", async () => {
    const result = await createGuide({
      homeId: "home-1",
      version: "1.0",
      title: "Guide",
      effectiveDate: daysAgo(1),
      reviewDate: daysFromNow(365),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  it("createDistribution error message is a string", async () => {
    const result = await createDistribution({
      homeId: "home-1",
      guideId: "guide-1",
      childId: "child-1",
      childName: "Test",
      distributedBy: "staff-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  it("createFeedback error message is a string", async () => {
    const result = await createFeedback({
      homeId: "home-1",
      guideId: "guide-1",
      childId: "child-1",
      childName: "Test",
      rating: "okay",
      collectedBy: "staff-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  it("updateGuide error message is a string", async () => {
    const result = await updateGuide("guide-1", { status: "archived" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });
});
