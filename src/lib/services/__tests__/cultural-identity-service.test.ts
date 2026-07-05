// ══════════════════════════════════════════════════════════════════════════════
// CARA — CULTURAL IDENTITY & DIVERSITY SERVICE TESTS
// Pure-function unit tests for identity metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 7 (quality of care — promoting identity),
// Reg 11 (positive relationships), Equality Act 2010,
// SCCIF Well-Led quality standard.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  IDENTITY_ACTION_TYPES,
  CHILD_SATISFACTION_LEVELS,
  PROTECTED_CHARACTERISTICS,
  COMMON_DIETARY_REQUIREMENTS,
  listProfiles,
  createProfile,
  updateProfile,
  listActions,
  createAction,
} from "../cultural-identity-service";

import type {
  IdentityProfile,
  IdentityAction,
} from "../cultural-identity-service";

const {
  computeIdentityMetrics,
  identifyIdentityAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Like daysAgo but clamped to no earlier than the start of the current calendar
 *  quarter — keeps "current quarter" fixtures in-quarter at a quarter boundary. */
function daysAgoInQuarter(n: number): string {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const target = new Date();
  target.setDate(target.getDate() - n);
  const sameQuarter = target.getFullYear() === now.getFullYear() && Math.floor(target.getMonth() / 3) === q;
  return (sameQuarter ? target : now).toISOString().split("T")[0];
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

/** Build a minimal IdentityProfile with sensible defaults. */
function makeProfile(
  overrides: Partial<IdentityProfile> = {},
): IdentityProfile {
  return {
    id: "prof-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Test Child",
    ethnicity: null,
    religion: null,
    first_language: null,
    additional_languages: [],
    cultural_needs: "",
    dietary_requirements: "",
    religious_practices: "",
    identity_needs: "",
    hair_skin_care_needs: "",
    clothing_preferences: "",
    festivals_celebrated: [],
    community_links: [],
    child_views_on_identity: null,
    support_plan: "",
    last_reviewed_date: daysAgo(30),
    reviewed_by: "staff-1",
    next_review_date: daysFromNow(150),
    status: "active",
    created_at: daysAgoISO(60),
    updated_at: daysAgoISO(30),
    ...overrides,
  };
}

/** Build a minimal IdentityAction with sensible defaults. */
function makeAction(
  overrides: Partial<IdentityAction> = {},
): IdentityAction {
  return {
    id: "act-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Test Child",
    action_date: daysAgo(5),
    recorded_by: "staff-1",
    action_type: "cultural_activity",
    description: "Cultural activity session",
    outcome: null,
    child_feedback: null,
    child_satisfaction: null,
    created_at: daysAgoISO(5),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("IDENTITY_ACTION_TYPES", () => {
  it("has exactly 12 action types", () => {
    expect(IDENTITY_ACTION_TYPES).toHaveLength(12);
  });

  it("contains unique type values", () => {
    const types = IDENTITY_ACTION_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains unique label values", () => {
    const labels = IDENTITY_ACTION_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes cultural_activity", () => {
    expect(IDENTITY_ACTION_TYPES.find((t) => t.type === "cultural_activity")).toBeDefined();
  });

  it("includes religious_practice", () => {
    expect(IDENTITY_ACTION_TYPES.find((t) => t.type === "religious_practice")).toBeDefined();
  });

  it("includes language_support", () => {
    expect(IDENTITY_ACTION_TYPES.find((t) => t.type === "language_support")).toBeDefined();
  });

  it("includes dietary_provision", () => {
    expect(IDENTITY_ACTION_TYPES.find((t) => t.type === "dietary_provision")).toBeDefined();
  });

  it("includes community_engagement", () => {
    expect(IDENTITY_ACTION_TYPES.find((t) => t.type === "community_engagement")).toBeDefined();
  });

  it("includes festival_celebration", () => {
    expect(IDENTITY_ACTION_TYPES.find((t) => t.type === "festival_celebration")).toBeDefined();
  });

  it("includes identity_discussion", () => {
    expect(IDENTITY_ACTION_TYPES.find((t) => t.type === "identity_discussion")).toBeDefined();
  });

  it("includes hair_skin_care", () => {
    expect(IDENTITY_ACTION_TYPES.find((t) => t.type === "hair_skin_care")).toBeDefined();
  });

  it("includes clothing_provision", () => {
    expect(IDENTITY_ACTION_TYPES.find((t) => t.type === "clothing_provision")).toBeDefined();
  });

  it("includes mentor_connection", () => {
    expect(IDENTITY_ACTION_TYPES.find((t) => t.type === "mentor_connection")).toBeDefined();
  });

  it("includes heritage_exploration", () => {
    expect(IDENTITY_ACTION_TYPES.find((t) => t.type === "heritage_exploration")).toBeDefined();
  });

  it("includes other", () => {
    expect(IDENTITY_ACTION_TYPES.find((t) => t.type === "other")).toBeDefined();
  });

  it("every entry has both type and label", () => {
    for (const entry of IDENTITY_ACTION_TYPES) {
      expect(entry.type).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("CHILD_SATISFACTION_LEVELS", () => {
  it("has exactly 4 satisfaction levels", () => {
    expect(CHILD_SATISFACTION_LEVELS).toHaveLength(4);
  });

  it("contains unique level values", () => {
    const levels = CHILD_SATISFACTION_LEVELS.map((l) => l.level);
    expect(new Set(levels).size).toBe(levels.length);
  });

  it("contains unique label values", () => {
    const labels = CHILD_SATISFACTION_LEVELS.map((l) => l.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes very_positive", () => {
    expect(CHILD_SATISFACTION_LEVELS.find((l) => l.level === "very_positive")).toBeDefined();
  });

  it("includes positive", () => {
    expect(CHILD_SATISFACTION_LEVELS.find((l) => l.level === "positive")).toBeDefined();
  });

  it("includes neutral", () => {
    expect(CHILD_SATISFACTION_LEVELS.find((l) => l.level === "neutral")).toBeDefined();
  });

  it("includes negative", () => {
    expect(CHILD_SATISFACTION_LEVELS.find((l) => l.level === "negative")).toBeDefined();
  });

  it("every entry has both level and label", () => {
    for (const entry of CHILD_SATISFACTION_LEVELS) {
      expect(entry.level).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("PROTECTED_CHARACTERISTICS", () => {
  it("has exactly 7 characteristics", () => {
    expect(PROTECTED_CHARACTERISTICS).toHaveLength(7);
  });

  it("contains unique characteristic values", () => {
    const chars = PROTECTED_CHARACTERISTICS.map((c) => c.characteristic);
    expect(new Set(chars).size).toBe(chars.length);
  });

  it("contains unique label values", () => {
    const labels = PROTECTED_CHARACTERISTICS.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes age", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "age")).toBeDefined();
  });

  it("includes disability", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "disability")).toBeDefined();
  });

  it("includes gender_reassignment", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "gender_reassignment")).toBeDefined();
  });

  it("includes race", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "race")).toBeDefined();
  });

  it("includes religion_belief", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "religion_belief")).toBeDefined();
  });

  it("includes sex", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "sex")).toBeDefined();
  });

  it("includes sexual_orientation", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "sexual_orientation")).toBeDefined();
  });

  it("every entry has both characteristic and label", () => {
    for (const entry of PROTECTED_CHARACTERISTICS) {
      expect(entry.characteristic).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("COMMON_DIETARY_REQUIREMENTS", () => {
  it("has exactly 10 dietary requirements", () => {
    expect(COMMON_DIETARY_REQUIREMENTS).toHaveLength(10);
  });

  it("contains unique requirement values", () => {
    const reqs = COMMON_DIETARY_REQUIREMENTS.map((r) => r.requirement);
    expect(new Set(reqs).size).toBe(reqs.length);
  });

  it("contains unique label values", () => {
    const labels = COMMON_DIETARY_REQUIREMENTS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes halal", () => {
    expect(COMMON_DIETARY_REQUIREMENTS.find((r) => r.requirement === "halal")).toBeDefined();
  });

  it("includes kosher", () => {
    expect(COMMON_DIETARY_REQUIREMENTS.find((r) => r.requirement === "kosher")).toBeDefined();
  });

  it("includes vegetarian", () => {
    expect(COMMON_DIETARY_REQUIREMENTS.find((r) => r.requirement === "vegetarian")).toBeDefined();
  });

  it("includes vegan", () => {
    expect(COMMON_DIETARY_REQUIREMENTS.find((r) => r.requirement === "vegan")).toBeDefined();
  });

  it("includes no_pork", () => {
    expect(COMMON_DIETARY_REQUIREMENTS.find((r) => r.requirement === "no_pork")).toBeDefined();
  });

  it("includes no_beef", () => {
    expect(COMMON_DIETARY_REQUIREMENTS.find((r) => r.requirement === "no_beef")).toBeDefined();
  });

  it("includes gluten_free", () => {
    expect(COMMON_DIETARY_REQUIREMENTS.find((r) => r.requirement === "gluten_free")).toBeDefined();
  });

  it("includes dairy_free", () => {
    expect(COMMON_DIETARY_REQUIREMENTS.find((r) => r.requirement === "dairy_free")).toBeDefined();
  });

  it("includes nut_free", () => {
    expect(COMMON_DIETARY_REQUIREMENTS.find((r) => r.requirement === "nut_free")).toBeDefined();
  });

  it("includes other", () => {
    expect(COMMON_DIETARY_REQUIREMENTS.find((r) => r.requirement === "other")).toBeDefined();
  });

  it("every entry has both requirement and label", () => {
    for (const entry of COMMON_DIETARY_REQUIREMENTS) {
      expect(entry.requirement).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeIdentityMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeIdentityMetrics", () => {
  it("returns zeroed metrics for empty inputs", () => {
    const result = computeIdentityMetrics([], []);
    expect(result.children_with_profiles).toBe(0);
    expect(result.total_children).toBe(0);
    expect(result.profile_review_rate).toBe(0);
    expect(result.actions_this_quarter).toBe(0);
    expect(result.by_action_type).toEqual({});
    expect(result.satisfaction_rate).toBe(0);
    expect(result.children_with_community_links).toBe(0);
    expect(result.children_with_language_support).toBe(0);
    expect(result.avg_actions_per_child).toBe(0);
  });

  // ── children_with_profiles ──────────────────────────────────────────

  it("counts unique children with active profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "active" }),
      makeProfile({ id: "p2", child_id: "c2", status: "active" }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.children_with_profiles).toBe(2);
  });

  it("does not count archived profiles in children_with_profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "active" }),
      makeProfile({ id: "p2", child_id: "c2", status: "archived" }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.children_with_profiles).toBe(1);
  });

  it("deduplicates children with multiple active profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "active" }),
      makeProfile({ id: "p2", child_id: "c1", status: "active" }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.children_with_profiles).toBe(1);
  });

  it("returns 0 children_with_profiles when all profiles are archived", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "archived" }),
      makeProfile({ id: "p2", child_id: "c2", status: "archived" }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.children_with_profiles).toBe(0);
  });

  // ── total_children ──────────────────────────────────────────────────

  it("counts total_children as total number of profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1" }),
      makeProfile({ id: "p2", child_id: "c2" }),
      makeProfile({ id: "p3", child_id: "c3" }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.total_children).toBe(3);
  });

  it("includes archived profiles in total_children", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "active" }),
      makeProfile({ id: "p2", child_id: "c2", status: "archived" }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.total_children).toBe(2);
  });

  // ── profile_review_rate ─────────────────────────────────────────────

  it("computes 100% profile review rate when all active profiles reviewed within 6 months", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "active", last_reviewed_date: daysAgo(30) }),
      makeProfile({ id: "p2", child_id: "c2", status: "active", last_reviewed_date: daysAgo(60) }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.profile_review_rate).toBe(100);
  });

  it("computes 0% review rate when no active profiles have been reviewed within 6 months", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "active", last_reviewed_date: daysAgo(200) }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.profile_review_rate).toBe(0);
  });

  it("computes 50% review rate for mixed reviewed/not-reviewed profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "active", last_reviewed_date: daysAgo(30) }),
      makeProfile({ id: "p2", child_id: "c2", status: "active", last_reviewed_date: daysAgo(200) }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.profile_review_rate).toBe(50);
  });

  it("treats null last_reviewed_date as not reviewed", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "active", last_reviewed_date: null }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.profile_review_rate).toBe(0);
  });

  it("excludes archived profiles from review rate calculation", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "active", last_reviewed_date: daysAgo(30) }),
      makeProfile({ id: "p2", child_id: "c2", status: "archived", last_reviewed_date: daysAgo(200) }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.profile_review_rate).toBe(100);
  });

  it("returns 0 profile_review_rate when there are no active profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "archived" }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.profile_review_rate).toBe(0);
  });

  // ── actions_this_quarter ────────────────────────────────────────────

  it("counts actions within the current quarter", () => {
    const actions = [
      makeAction({ id: "a1", action_date: daysAgoInQuarter(5) }),
      makeAction({ id: "a2", action_date: daysAgoInQuarter(10) }),
    ];
    const result = computeIdentityMetrics([], actions);
    expect(result.actions_this_quarter).toBeGreaterThanOrEqual(2);
  });

  it("excludes actions from previous quarters", () => {
    const actions = [
      makeAction({ id: "a1", action_date: "2024-01-15" }),
    ];
    const result = computeIdentityMetrics([], actions);
    expect(result.actions_this_quarter).toBe(0);
  });

  it("returns 0 actions_this_quarter for empty actions", () => {
    const result = computeIdentityMetrics([], []);
    expect(result.actions_this_quarter).toBe(0);
  });

  // ── by_action_type ──────────────────────────────────────────────────

  it("groups actions by type correctly", () => {
    const actions = [
      makeAction({ id: "a1", action_type: "cultural_activity" }),
      makeAction({ id: "a2", action_type: "cultural_activity" }),
      makeAction({ id: "a3", action_type: "religious_practice" }),
      makeAction({ id: "a4", action_type: "language_support" }),
    ];
    const result = computeIdentityMetrics([], actions);
    expect(result.by_action_type).toEqual({
      cultural_activity: 2,
      religious_practice: 1,
      language_support: 1,
    });
  });

  it("returns empty by_action_type for no actions", () => {
    const result = computeIdentityMetrics([], []);
    expect(result.by_action_type).toEqual({});
  });

  it("handles single action type across all actions", () => {
    const actions = [
      makeAction({ id: "a1", action_type: "dietary_provision" }),
      makeAction({ id: "a2", action_type: "dietary_provision" }),
    ];
    const result = computeIdentityMetrics([], actions);
    expect(result.by_action_type).toEqual({ dietary_provision: 2 });
  });

  it("counts all 12 action types when present", () => {
    const types = IDENTITY_ACTION_TYPES.map((t) => t.type);
    const actions = types.map((type, i) =>
      makeAction({ id: `a${i}`, action_type: type }),
    );
    const result = computeIdentityMetrics([], actions);
    expect(Object.keys(result.by_action_type)).toHaveLength(12);
    for (const type of types) {
      expect(result.by_action_type[type]).toBe(1);
    }
  });

  // ── satisfaction_rate ───────────────────────────────────────────────

  it("computes 100% satisfaction rate when all feedback is positive", () => {
    const actions = [
      makeAction({ id: "a1", child_satisfaction: "positive" }),
      makeAction({ id: "a2", child_satisfaction: "very_positive" }),
    ];
    const result = computeIdentityMetrics([], actions);
    expect(result.satisfaction_rate).toBe(100);
  });

  it("computes 0% satisfaction rate when all feedback is negative or neutral", () => {
    const actions = [
      makeAction({ id: "a1", child_satisfaction: "negative" }),
      makeAction({ id: "a2", child_satisfaction: "neutral" }),
    ];
    const result = computeIdentityMetrics([], actions);
    expect(result.satisfaction_rate).toBe(0);
  });

  it("computes 50% satisfaction rate for mixed feedback", () => {
    const actions = [
      makeAction({ id: "a1", child_satisfaction: "positive" }),
      makeAction({ id: "a2", child_satisfaction: "negative" }),
    ];
    const result = computeIdentityMetrics([], actions);
    expect(result.satisfaction_rate).toBe(50);
  });

  it("excludes actions without satisfaction from satisfaction rate", () => {
    const actions = [
      makeAction({ id: "a1", child_satisfaction: "positive" }),
      makeAction({ id: "a2", child_satisfaction: null }),
    ];
    const result = computeIdentityMetrics([], actions);
    expect(result.satisfaction_rate).toBe(100);
  });

  it("returns 0 satisfaction rate when no actions have feedback", () => {
    const actions = [
      makeAction({ id: "a1", child_satisfaction: null }),
      makeAction({ id: "a2", child_satisfaction: null }),
    ];
    const result = computeIdentityMetrics([], actions);
    expect(result.satisfaction_rate).toBe(0);
  });

  it("counts very_positive as positive for satisfaction rate", () => {
    const actions = [
      makeAction({ id: "a1", child_satisfaction: "very_positive" }),
    ];
    const result = computeIdentityMetrics([], actions);
    expect(result.satisfaction_rate).toBe(100);
  });

  it("does not count neutral as positive for satisfaction rate", () => {
    const actions = [
      makeAction({ id: "a1", child_satisfaction: "neutral" }),
    ];
    const result = computeIdentityMetrics([], actions);
    expect(result.satisfaction_rate).toBe(0);
  });

  it("rounds satisfaction rate to one decimal place", () => {
    const actions = [
      makeAction({ id: "a1", child_satisfaction: "positive" }),
      makeAction({ id: "a2", child_satisfaction: "positive" }),
      makeAction({ id: "a3", child_satisfaction: "negative" }),
    ];
    const result = computeIdentityMetrics([], actions);
    // 2/3 = 66.666... -> 66.7
    expect(result.satisfaction_rate).toBe(66.7);
  });

  // ── children_with_community_links ──────────────────────────────────

  it("counts active profiles with community links", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "active", community_links: ["local mosque"] }),
      makeProfile({ id: "p2", child_id: "c2", status: "active", community_links: [] }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.children_with_community_links).toBe(1);
  });

  it("returns 0 when no profiles have community links", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "active", community_links: [] }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.children_with_community_links).toBe(0);
  });

  it("excludes archived profiles from community links count", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "archived", community_links: ["community centre"] }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.children_with_community_links).toBe(0);
  });

  it("counts profiles with multiple community links as 1", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "active", community_links: ["link1", "link2", "link3"] }),
    ];
    const result = computeIdentityMetrics(profiles, []);
    expect(result.children_with_community_links).toBe(1);
  });

  // ── children_with_language_support ─────────────────────────────────

  it("counts unique children with language support actions", () => {
    const actions = [
      makeAction({ id: "a1", child_id: "c1", action_type: "language_support" }),
      makeAction({ id: "a2", child_id: "c2", action_type: "language_support" }),
    ];
    const result = computeIdentityMetrics([], actions);
    expect(result.children_with_language_support).toBe(2);
  });

  it("deduplicates children with multiple language support actions", () => {
    const actions = [
      makeAction({ id: "a1", child_id: "c1", action_type: "language_support" }),
      makeAction({ id: "a2", child_id: "c1", action_type: "language_support" }),
    ];
    const result = computeIdentityMetrics([], actions);
    expect(result.children_with_language_support).toBe(1);
  });

  it("does not count non-language_support actions", () => {
    const actions = [
      makeAction({ id: "a1", child_id: "c1", action_type: "cultural_activity" }),
      makeAction({ id: "a2", child_id: "c2", action_type: "religious_practice" }),
    ];
    const result = computeIdentityMetrics([], actions);
    expect(result.children_with_language_support).toBe(0);
  });

  it("returns 0 when no actions exist", () => {
    const result = computeIdentityMetrics([], []);
    expect(result.children_with_language_support).toBe(0);
  });

  // ── avg_actions_per_child ──────────────────────────────────────────

  it("computes average actions per child correctly", () => {
    const actions = [
      makeAction({ id: "a1", child_id: "c1" }),
      makeAction({ id: "a2", child_id: "c1" }),
      makeAction({ id: "a3", child_id: "c2" }),
    ];
    const result = computeIdentityMetrics([], actions);
    // 3 actions / 2 children = 1.5
    expect(result.avg_actions_per_child).toBe(1.5);
  });

  it("returns 0 avg_actions_per_child for no actions", () => {
    const result = computeIdentityMetrics([], []);
    expect(result.avg_actions_per_child).toBe(0);
  });

  it("returns correct avg for single child with one action", () => {
    const actions = [
      makeAction({ id: "a1", child_id: "c1" }),
    ];
    const result = computeIdentityMetrics([], actions);
    expect(result.avg_actions_per_child).toBe(1);
  });

  it("rounds avg_actions_per_child to one decimal place", () => {
    const actions = [
      makeAction({ id: "a1", child_id: "c1" }),
      makeAction({ id: "a2", child_id: "c1" }),
      makeAction({ id: "a3", child_id: "c1" }),
      makeAction({ id: "a4", child_id: "c2" }),
      makeAction({ id: "a5", child_id: "c2" }),
      makeAction({ id: "a6", child_id: "c3" }),
    ];
    const result = computeIdentityMetrics([], actions);
    // 6 actions / 3 children = 2.0
    expect(result.avg_actions_per_child).toBe(2);
  });

  it("handles uneven distribution of actions across children", () => {
    const actions = [
      makeAction({ id: "a1", child_id: "c1" }),
      makeAction({ id: "a2", child_id: "c1" }),
      makeAction({ id: "a3", child_id: "c1" }),
      makeAction({ id: "a4", child_id: "c2" }),
    ];
    const result = computeIdentityMetrics([], actions);
    // 4 actions / 2 children = 2.0
    expect(result.avg_actions_per_child).toBe(2);
  });

  // ── Combined scenarios ─────────────────────────────────────────────

  it("handles mixed profiles and actions together", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", status: "active", last_reviewed_date: daysAgo(30), community_links: ["community centre"] }),
      makeProfile({ id: "p2", child_id: "c2", status: "active", last_reviewed_date: daysAgo(200), community_links: [] }),
      makeProfile({ id: "p3", child_id: "c3", status: "archived", community_links: ["link1"] }),
    ];
    const actions = [
      makeAction({ id: "a1", child_id: "c1", action_type: "cultural_activity", child_satisfaction: "positive" }),
      makeAction({ id: "a2", child_id: "c1", action_type: "language_support", child_satisfaction: "very_positive" }),
      makeAction({ id: "a3", child_id: "c2", action_type: "religious_practice", child_satisfaction: "negative" }),
    ];
    const result = computeIdentityMetrics(profiles, actions);
    expect(result.children_with_profiles).toBe(2);
    expect(result.total_children).toBe(3);
    expect(result.profile_review_rate).toBe(50);
    expect(result.by_action_type).toEqual({
      cultural_activity: 1,
      language_support: 1,
      religious_practice: 1,
    });
    expect(result.satisfaction_rate).toBe(66.7);
    expect(result.children_with_community_links).toBe(1);
    expect(result.children_with_language_support).toBe(1);
    expect(result.avg_actions_per_child).toBe(1.5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifyIdentityAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyIdentityAlerts", () => {
  const now = new Date();

  it("returns empty array for empty inputs", () => {
    const alerts = identifyIdentityAlerts([], [], now);
    expect(alerts).toHaveLength(0);
  });

  // ── no_identity_profile alerts ──────────────────────────────────────

  describe("no identity profile alerts", () => {
    it("generates critical alert for child with actions but no profile", () => {
      const actions = [
        makeAction({ id: "a1", child_id: "c1", child_name: "Alex" }),
      ];
      const alerts = identifyIdentityAlerts([], actions, now);
      const noProfile = alerts.filter((a) => a.category === "no_identity_profile");
      expect(noProfile).toHaveLength(1);
      expect(noProfile[0].severity).toBe("critical");
      expect(noProfile[0].related_type).toBe("action");
    });

    it("does not flag child who has a profile", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1" }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1" }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const noProfile = alerts.filter((a) => a.category === "no_identity_profile");
      expect(noProfile).toHaveLength(0);
    });

    it("generates only one alert per child without profile", () => {
      const actions = [
        makeAction({ id: "a1", child_id: "c1", child_name: "Alex" }),
        makeAction({ id: "a2", child_id: "c1", child_name: "Alex" }),
        makeAction({ id: "a3", child_id: "c1", child_name: "Alex" }),
      ];
      const alerts = identifyIdentityAlerts([], actions, now);
      const noProfile = alerts.filter((a) => a.category === "no_identity_profile");
      expect(noProfile).toHaveLength(1);
    });

    it("generates separate alerts for multiple children without profiles", () => {
      const actions = [
        makeAction({ id: "a1", child_id: "c1", child_name: "Alex" }),
        makeAction({ id: "a2", child_id: "c2", child_name: "Beth" }),
      ];
      const alerts = identifyIdentityAlerts([], actions, now);
      const noProfile = alerts.filter((a) => a.category === "no_identity_profile");
      expect(noProfile).toHaveLength(2);
    });

    it("includes child name and Reg 7 reference in message", () => {
      const actions = [
        makeAction({ id: "a1", child_id: "c1", child_name: "Alex" }),
      ];
      const alerts = identifyIdentityAlerts([], actions, now);
      const noProfile = alerts.find((a) => a.category === "no_identity_profile");
      expect(noProfile?.message).toContain("Alex");
      expect(noProfile?.message).toContain("Reg 7");
    });
  });

  // ── profile_review_overdue alerts ───────────────────────────────────

  describe("profile review overdue alerts", () => {
    it("generates high alert for profile not reviewed in 6+ months", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", last_reviewed_date: daysAgo(200) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const overdue = alerts.filter((a) => a.category === "profile_review_overdue");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].severity).toBe("high");
      expect(overdue[0].related_type).toBe("profile");
    });

    it("does not flag profile reviewed within 6 months", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", last_reviewed_date: daysAgo(30) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const overdue = alerts.filter((a) => a.category === "profile_review_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("generates high alert for profile never reviewed", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", last_reviewed_date: null }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const overdue = alerts.filter((a) => a.category === "profile_review_overdue");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].severity).toBe("high");
    });

    it("mentions never been reviewed in message for null review date", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", last_reviewed_date: null }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const overdue = alerts.find((a) => a.category === "profile_review_overdue");
      expect(overdue?.message).toContain("never been reviewed");
    });

    it("does not flag archived profiles for review", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "archived", last_reviewed_date: daysAgo(200) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const overdue = alerts.filter((a) => a.category === "profile_review_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("includes child name in overdue review message", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Beth", status: "active", last_reviewed_date: daysAgo(200) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const overdue = alerts.find((a) => a.category === "profile_review_overdue");
      expect(overdue?.message).toContain("Beth");
    });

    it("includes last reviewed date in overdue message", () => {
      const reviewDate = daysAgo(200);
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", last_reviewed_date: reviewDate }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const overdue = alerts.find((a) => a.category === "profile_review_overdue");
      expect(overdue?.message).toContain(reviewDate);
    });
  });

  // ── no_recent_actions alerts ────────────────────────────────────────

  describe("no recent actions alerts", () => {
    it("generates medium alert when no actions recorded for child in 3+ months", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", last_reviewed_date: daysAgo(30) }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(100) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const noRecent = alerts.filter((a) => a.category === "no_recent_actions");
      expect(noRecent).toHaveLength(1);
      expect(noRecent[0].severity).toBe("medium");
      expect(noRecent[0].related_type).toBe("profile");
    });

    it("generates medium alert when no actions recorded at all for child", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", last_reviewed_date: daysAgo(30) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const noRecent = alerts.filter((a) => a.category === "no_recent_actions");
      expect(noRecent).toHaveLength(1);
      expect(noRecent[0].message).toContain("no cultural actions recorded");
    });

    it("does not flag child with recent action within 3 months", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", last_reviewed_date: daysAgo(30) }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const noRecent = alerts.filter((a) => a.category === "no_recent_actions");
      expect(noRecent).toHaveLength(0);
    });

    it("does not flag archived profiles for recent actions", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "archived", last_reviewed_date: daysAgo(30) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const noRecent = alerts.filter((a) => a.category === "no_recent_actions");
      expect(noRecent).toHaveLength(0);
    });

    it("includes child name in no recent actions message", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", last_reviewed_date: daysAgo(30) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const noRecent = alerts.find((a) => a.category === "no_recent_actions");
      expect(noRecent?.message).toContain("Alex");
    });

    it("mentions Reg 7 in no recent actions message", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", last_reviewed_date: daysAgo(30) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const noRecent = alerts.find((a) => a.category === "no_recent_actions");
      expect(noRecent?.message).toContain("Reg 7");
    });

    it("says last action over 3 months ago when old action exists", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", last_reviewed_date: daysAgo(30) }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(100) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const noRecent = alerts.find((a) => a.category === "no_recent_actions");
      expect(noRecent?.message).toContain("last action over 3 months ago");
    });
  });

  // ── no_community_links alerts ───────────────────────────────────────

  describe("no community links alerts", () => {
    it("generates medium alert for active profile without community links", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", community_links: [], last_reviewed_date: daysAgo(30) }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const noCommunity = alerts.filter((a) => a.category === "no_community_links");
      expect(noCommunity).toHaveLength(1);
      expect(noCommunity[0].severity).toBe("medium");
      expect(noCommunity[0].related_type).toBe("profile");
    });

    it("does not flag active profile with community links", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", community_links: ["local mosque"], last_reviewed_date: daysAgo(30) }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const noCommunity = alerts.filter((a) => a.category === "no_community_links");
      expect(noCommunity).toHaveLength(0);
    });

    it("does not flag archived profile without community links", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "archived", community_links: [] }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const noCommunity = alerts.filter((a) => a.category === "no_community_links");
      expect(noCommunity).toHaveLength(0);
    });

    it("includes Reg 11 in community links message", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", community_links: [], last_reviewed_date: daysAgo(30) }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const noCommunity = alerts.find((a) => a.category === "no_community_links");
      expect(noCommunity?.message).toContain("Reg 11");
    });

    it("includes child name in community links message", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Beth", status: "active", community_links: [], last_reviewed_date: daysAgo(30) }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const noCommunity = alerts.find((a) => a.category === "no_community_links");
      expect(noCommunity?.message).toContain("Beth");
    });
  });

  // ── dietary_not_documented alerts ───────────────────────────────────

  describe("dietary not documented alerts", () => {
    it("generates low alert when ethnicity set but dietary requirements empty", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", ethnicity: "South Asian", dietary_requirements: "", last_reviewed_date: daysAgo(30), community_links: ["link1"] }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const dietaryAlerts = alerts.filter((a) => a.category === "dietary_not_documented");
      expect(dietaryAlerts).toHaveLength(1);
      expect(dietaryAlerts[0].severity).toBe("low");
      expect(dietaryAlerts[0].related_type).toBe("profile");
    });

    it("does not flag when ethnicity is null", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", ethnicity: null, dietary_requirements: "", last_reviewed_date: daysAgo(30) }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const dietaryAlerts = alerts.filter((a) => a.category === "dietary_not_documented");
      expect(dietaryAlerts).toHaveLength(0);
    });

    it("does not flag when ethnicity is empty string", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", ethnicity: "", dietary_requirements: "", last_reviewed_date: daysAgo(30) }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const dietaryAlerts = alerts.filter((a) => a.category === "dietary_not_documented");
      expect(dietaryAlerts).toHaveLength(0);
    });

    it("does not flag when ethnicity is whitespace-only", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", ethnicity: "   ", dietary_requirements: "", last_reviewed_date: daysAgo(30) }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const dietaryAlerts = alerts.filter((a) => a.category === "dietary_not_documented");
      expect(dietaryAlerts).toHaveLength(0);
    });

    it("does not flag when dietary requirements are documented", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", ethnicity: "South Asian", dietary_requirements: "Halal", last_reviewed_date: daysAgo(30) }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const dietaryAlerts = alerts.filter((a) => a.category === "dietary_not_documented");
      expect(dietaryAlerts).toHaveLength(0);
    });

    it("does not flag archived profiles for dietary requirements", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "archived", ethnicity: "South Asian", dietary_requirements: "" }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const dietaryAlerts = alerts.filter((a) => a.category === "dietary_not_documented");
      expect(dietaryAlerts).toHaveLength(0);
    });

    it("includes child name in dietary alert message", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", ethnicity: "South Asian", dietary_requirements: "", last_reviewed_date: daysAgo(30), community_links: ["link1"] }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const dietaryAlert = alerts.find((a) => a.category === "dietary_not_documented");
      expect(dietaryAlert?.message).toContain("Alex");
    });
  });

  // ── language_support_needed alerts ──────────────────────────────────

  describe("language support needed alerts", () => {
    it("generates medium alert when first language is not English and no language support actions", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", first_language: "Polish", last_reviewed_date: daysAgo(30), community_links: ["link1"] }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_type: "cultural_activity", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const langAlerts = alerts.filter((a) => a.category === "language_support_needed");
      expect(langAlerts).toHaveLength(1);
      expect(langAlerts[0].severity).toBe("medium");
      expect(langAlerts[0].related_type).toBe("profile");
    });

    it("does not flag when first language is English", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", first_language: "English", last_reviewed_date: daysAgo(30) }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const langAlerts = alerts.filter((a) => a.category === "language_support_needed");
      expect(langAlerts).toHaveLength(0);
    });

    it("does not flag when first language is english (case insensitive)", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", first_language: "english", last_reviewed_date: daysAgo(30) }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const langAlerts = alerts.filter((a) => a.category === "language_support_needed");
      expect(langAlerts).toHaveLength(0);
    });

    it("does not flag when first language is null", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", first_language: null, last_reviewed_date: daysAgo(30) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const langAlerts = alerts.filter((a) => a.category === "language_support_needed");
      expect(langAlerts).toHaveLength(0);
    });

    it("does not flag when child has language support actions", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", first_language: "Polish", last_reviewed_date: daysAgo(30) }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_type: "language_support", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const langAlerts = alerts.filter((a) => a.category === "language_support_needed");
      expect(langAlerts).toHaveLength(0);
    });

    it("does not flag archived profiles for language support", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "archived", first_language: "Polish" }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const langAlerts = alerts.filter((a) => a.category === "language_support_needed");
      expect(langAlerts).toHaveLength(0);
    });

    it("includes child name and first language in message", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", first_language: "Polish", last_reviewed_date: daysAgo(30), community_links: ["link1"] }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_type: "cultural_activity", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const langAlert = alerts.find((a) => a.category === "language_support_needed");
      expect(langAlert?.message).toContain("Alex");
      expect(langAlert?.message).toContain("Polish");
    });
  });

  // ── negative_feedback alerts ────────────────────────────────────────

  describe("negative feedback alerts", () => {
    it("generates high alert for action with negative satisfaction", () => {
      const actions = [
        makeAction({ id: "a1", child_id: "c1", child_name: "Alex", action_type: "cultural_activity", child_satisfaction: "negative", action_date: daysAgo(5) }),
      ];
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", last_reviewed_date: daysAgo(30), community_links: ["link1"] }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const negFeedback = alerts.filter((a) => a.category === "negative_feedback");
      expect(negFeedback).toHaveLength(1);
      expect(negFeedback[0].severity).toBe("high");
      expect(negFeedback[0].related_type).toBe("action");
    });

    it("does not flag positive satisfaction", () => {
      const actions = [
        makeAction({ id: "a1", child_id: "c1", child_satisfaction: "positive" }),
      ];
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", last_reviewed_date: daysAgo(30) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const negFeedback = alerts.filter((a) => a.category === "negative_feedback");
      expect(negFeedback).toHaveLength(0);
    });

    it("does not flag very_positive satisfaction", () => {
      const actions = [
        makeAction({ id: "a1", child_id: "c1", child_satisfaction: "very_positive" }),
      ];
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", last_reviewed_date: daysAgo(30) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const negFeedback = alerts.filter((a) => a.category === "negative_feedback");
      expect(negFeedback).toHaveLength(0);
    });

    it("does not flag neutral satisfaction", () => {
      const actions = [
        makeAction({ id: "a1", child_id: "c1", child_satisfaction: "neutral" }),
      ];
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", last_reviewed_date: daysAgo(30) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const negFeedback = alerts.filter((a) => a.category === "negative_feedback");
      expect(negFeedback).toHaveLength(0);
    });

    it("does not flag null satisfaction", () => {
      const actions = [
        makeAction({ id: "a1", child_id: "c1", child_satisfaction: null }),
      ];
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", status: "active", last_reviewed_date: daysAgo(30) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const negFeedback = alerts.filter((a) => a.category === "negative_feedback");
      expect(negFeedback).toHaveLength(0);
    });

    it("flags multiple negative feedback actions", () => {
      const actions = [
        makeAction({ id: "a1", child_id: "c1", child_name: "Alex", child_satisfaction: "negative", action_date: daysAgo(5) }),
        makeAction({ id: "a2", child_id: "c2", child_name: "Beth", child_satisfaction: "negative", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts([], actions, now);
      const negFeedback = alerts.filter((a) => a.category === "negative_feedback");
      expect(negFeedback).toHaveLength(2);
    });

    it("includes child name and action type in negative feedback message", () => {
      const actions = [
        makeAction({ id: "a1", child_id: "c1", child_name: "Alex", action_type: "cultural_activity", child_satisfaction: "negative", action_date: daysAgo(5) }),
      ];
      const alerts = identifyIdentityAlerts([], actions, now);
      const negFeedback = alerts.find((a) => a.category === "negative_feedback");
      expect(negFeedback?.message).toContain("Alex");
      expect(negFeedback?.message).toContain("cultural activity");
    });

    it("mentions Reg 7 in negative feedback message", () => {
      const actions = [
        makeAction({ id: "a1", child_id: "c1", child_name: "Alex", action_type: "dietary_provision", child_satisfaction: "negative", action_date: daysAgo(5) }),
      ];
      const alerts = identifyIdentityAlerts([], actions, now);
      const negFeedback = alerts.find((a) => a.category === "negative_feedback");
      expect(negFeedback?.message).toContain("Reg 7");
    });

    it("includes action date in negative feedback message", () => {
      const actionDate = daysAgo(5);
      const actions = [
        makeAction({ id: "a1", child_id: "c1", child_name: "Alex", action_type: "cultural_activity", child_satisfaction: "negative", action_date: actionDate }),
      ];
      const alerts = identifyIdentityAlerts([], actions, now);
      const negFeedback = alerts.find((a) => a.category === "negative_feedback");
      expect(negFeedback?.message).toContain(actionDate);
    });
  });

  // ── Alert sorting ───────────────────────────────────────────────────

  describe("alert sorting", () => {
    it("sorts alerts by severity: critical, high, medium, low", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", last_reviewed_date: null, community_links: [], ethnicity: "South Asian", dietary_requirements: "", first_language: "Polish" }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c99", child_name: "Unknown" }),
        makeAction({ id: "a2", child_id: "c1", action_type: "cultural_activity", child_satisfaction: "negative", action_date: daysAgo(5) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      // Verify sorting order
      for (let i = 0; i < alerts.length - 1; i++) {
        const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        expect(severityOrder[alerts[i].severity]).toBeLessThanOrEqual(
          severityOrder[alerts[i + 1].severity],
        );
      }
    });

    it("critical alerts appear before high alerts", () => {
      const actions = [
        makeAction({ id: "a1", child_id: "c99", child_name: "Unknown", child_satisfaction: "negative", action_date: daysAgo(5) }),
      ];
      const alerts = identifyIdentityAlerts([], actions, now);
      // no_identity_profile is critical, negative_feedback is high
      const critIdx = alerts.findIndex((a) => a.severity === "critical");
      const highIdx = alerts.findIndex((a) => a.severity === "high");
      if (critIdx >= 0 && highIdx >= 0) {
        expect(critIdx).toBeLessThan(highIdx);
      }
    });
  });

  // ── Combined / complex scenarios ───────────────────────────────────

  describe("combined alert scenarios", () => {
    it("generates multiple alert types for a child with multiple issues", () => {
      const profiles = [
        makeProfile({
          id: "p1",
          child_id: "c1",
          child_name: "Alex",
          status: "active",
          last_reviewed_date: null,
          community_links: [],
          ethnicity: "South Asian",
          dietary_requirements: "",
          first_language: "Urdu",
        }),
      ];
      const alerts = identifyIdentityAlerts(profiles, [], now);
      const categories = alerts.map((a) => a.category);
      expect(categories).toContain("profile_review_overdue");
      expect(categories).toContain("no_recent_actions");
      expect(categories).toContain("no_community_links");
      expect(categories).toContain("dietary_not_documented");
      expect(categories).toContain("language_support_needed");
    });

    it("generates both profile and action alerts simultaneously", () => {
      const profiles = [
        makeProfile({
          id: "p1",
          child_id: "c1",
          child_name: "Alex",
          status: "active",
          last_reviewed_date: daysAgo(200),
          community_links: [],
        }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_type: "cultural_activity", child_satisfaction: "negative", action_date: daysAgo(10) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const categories = alerts.map((a) => a.category);
      expect(categories).toContain("profile_review_overdue");
      expect(categories).toContain("no_community_links");
      expect(categories).toContain("negative_feedback");
    });

    it("returns no alerts for healthy state", () => {
      const profiles = [
        makeProfile({
          id: "p1",
          child_id: "c1",
          status: "active",
          last_reviewed_date: daysAgo(30),
          community_links: ["community centre"],
          first_language: "English",
          ethnicity: null,
        }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(10), child_satisfaction: "positive" }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      expect(alerts).toHaveLength(0);
    });

    it("handles large mixed dataset correctly", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", last_reviewed_date: daysAgo(200), community_links: [], ethnicity: "South Asian", dietary_requirements: "", first_language: "Urdu" }),
        makeProfile({ id: "p2", child_id: "c2", child_name: "Beth", status: "active", last_reviewed_date: daysAgo(30), community_links: ["link1"], first_language: "English" }),
        makeProfile({ id: "p3", child_id: "c3", child_name: "Carl", status: "archived" }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c1", action_date: daysAgo(100), action_type: "cultural_activity", child_satisfaction: "negative" }),
        makeAction({ id: "a2", child_id: "c2", action_date: daysAgo(5), action_type: "language_support", child_satisfaction: "positive" }),
        makeAction({ id: "a3", child_id: "c4", child_name: "Dana", action_type: "community_engagement" }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const categories = alerts.map((a) => a.category);
      // c1: profile_review_overdue, no_recent_actions, no_community_links, dietary_not_documented, language_support_needed, negative_feedback
      // c4 (no profile): no_identity_profile
      expect(categories).toContain("no_identity_profile");
      expect(categories).toContain("profile_review_overdue");
      expect(categories).toContain("no_recent_actions");
      expect(categories).toContain("no_community_links");
      expect(categories).toContain("dietary_not_documented");
      expect(categories).toContain("language_support_needed");
      expect(categories).toContain("negative_feedback");
    });

    it("all alerts have required fields: severity, category, message, related_id, related_type", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", last_reviewed_date: null, community_links: [], ethnicity: "South Asian", dietary_requirements: "", first_language: "Polish" }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c99", child_name: "Unknown", child_satisfaction: "negative", action_date: daysAgo(5) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      for (const alert of alerts) {
        expect(alert.severity).toBeTruthy();
        expect(alert.category).toBeTruthy();
        expect(alert.message).toBeTruthy();
        expect(alert.related_id).toBeTruthy();
        expect(alert.related_type).toBeTruthy();
      }
    });

    it("all alert severities are valid values", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", last_reviewed_date: null, community_links: [], ethnicity: "South Asian", dietary_requirements: "", first_language: "Polish" }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c99", child_name: "Unknown", child_satisfaction: "negative", action_date: daysAgo(5) }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const validSeverities = ["critical", "high", "medium", "low"];
      for (const alert of alerts) {
        expect(validSeverities).toContain(alert.severity);
      }
    });

    it("all alert related_types are valid values", () => {
      const profiles = [
        makeProfile({ id: "p1", child_id: "c1", child_name: "Alex", status: "active", last_reviewed_date: null, community_links: [] }),
      ];
      const actions = [
        makeAction({ id: "a1", child_id: "c99", child_name: "Unknown" }),
      ];
      const alerts = identifyIdentityAlerts(profiles, actions, now);
      const validTypes = ["profile", "action"];
      for (const alert of alerts) {
        expect(validTypes).toContain(alert.related_type);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Identity Profiles (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listProfiles", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listProfiles("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of childId filter", async () => {
    const result = await listProfiles("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of status filter", async () => {
    const result = await listProfiles("home-1", { status: "active" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of limit filter", async () => {
    const result = await listProfiles("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of combined filters", async () => {
    const result = await listProfiles("home-1", {
      childId: "child-1",
      status: "active",
      limit: 25,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createProfile", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createProfile({
      homeId: "home-1",
      childId: "child-1",
      childName: "Test Child",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error even with all fields", async () => {
    const result = await createProfile({
      homeId: "home-1",
      childId: "child-1",
      childName: "Test Child",
      ethnicity: "British",
      religion: "None",
      firstLanguage: "English",
      additionalLanguages: ["French"],
      culturalNeeds: "None identified",
      dietaryRequirements: "None",
      religiousPractices: "None",
      identityNeeds: "None",
      hairSkinCareNeeds: "Standard",
      clothingPreferences: "No preference",
      festivalsCelebrated: ["Christmas"],
      communityLinks: ["Local youth club"],
      childViewsOnIdentity: "Happy with identity",
      supportPlan: "Standard support",
      lastReviewedDate: "2026-01-01",
      reviewedBy: "staff-1",
      nextReviewDate: "2026-07-01",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updateProfile", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updateProfile("prof-1", { status: "archived" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error for any updates", async () => {
    const result = await updateProfile("prof-1", {
      ethnicity: "British",
      dietary_requirements: "Halal",
      community_links: ["local mosque"],
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Identity Actions (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listActions", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listActions("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of childId filter", async () => {
    const result = await listActions("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of actionType filter", async () => {
    const result = await listActions("home-1", { actionType: "cultural_activity" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of limit filter", async () => {
    const result = await listActions("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of combined filters", async () => {
    const result = await listActions("home-1", {
      childId: "child-1",
      actionType: "language_support",
      limit: 25,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createAction", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createAction({
      homeId: "home-1",
      childId: "child-1",
      childName: "Test Child",
      recordedBy: "staff-1",
      actionType: "cultural_activity",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error even with all fields", async () => {
    const result = await createAction({
      homeId: "home-1",
      childId: "child-1",
      childName: "Test Child",
      actionDate: "2026-05-01",
      recordedBy: "staff-1",
      actionType: "religious_practice",
      description: "Attended Friday prayers",
      outcome: "Child participated fully",
      childFeedback: "Really enjoyed it",
      childSatisfaction: "very_positive",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});
