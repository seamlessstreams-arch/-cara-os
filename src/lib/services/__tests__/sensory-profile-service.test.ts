// ══════════════════════════════════════════════════════════════════════════════
// CARA — SENSORY PROFILE SERVICE TESTS
// Pure-function unit tests for sensory metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 6 (quality and purpose of care),
// Reg 14 (healthcare — sensory and therapeutic needs),
// Reg 15 (staffing — understanding sensory needs).
// SCCIF: Overall Experiences — "The environment meets the individual
// needs of each child." "Staff understand children's sensory needs."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  SENSORY_DOMAINS,
  SENSITIVITY_LEVELS,
  ADAPTATION_TYPES,
  PROFILE_STATUSES,
  listProfiles,
  createProfile,
  updateProfile,
} from "../sensory-profile-service";

import type {
  SensoryProfile,
  SensoryDomain,
  SensitivityLevel,
  AdaptationType,
  ProfileStatus,
} from "../sensory-profile-service";

const { computeSensoryMetrics, identifySensoryAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

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

/** Build a minimal SensoryProfile with sensible defaults. */
function makeProfile(overrides: Partial<SensoryProfile> = {}): SensoryProfile {
  return {
    id: "sp-1",
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    sensory_domain: "auditory",
    sensitivity_level: "typical",
    triggers: ["loud noises"],
    calming_strategies: ["quiet room"],
    adaptations: ["noise_reduction"] as AdaptationType[],
    adaptation_details: null,
    profile_status: "current",
    assessed_by: "staff-1",
    assessed_date: daysAgo(7),
    next_review_date: daysFromNow(90),
    occupational_therapist_input: false,
    staff_trained: true,
    child_views: null,
    notes: null,
    created_at: daysAgoISO(30),
    updated_at: daysAgoISO(7),
    ...overrides,
  } as SensoryProfile;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("SENSORY_DOMAINS", () => {
  it("has exactly 8 entries", () => {
    expect(SENSORY_DOMAINS).toHaveLength(8);
  });

  it("contains unique domain values", () => {
    const values = SENSORY_DOMAINS.map((d) => d.domain);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = SENSORY_DOMAINS.map((d) => d.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes visual", () => {
    expect(SENSORY_DOMAINS.find((d) => d.domain === "visual")).toBeTruthy();
  });

  it("includes auditory", () => {
    expect(SENSORY_DOMAINS.find((d) => d.domain === "auditory")).toBeTruthy();
  });

  it("includes tactile", () => {
    expect(SENSORY_DOMAINS.find((d) => d.domain === "tactile")).toBeTruthy();
  });

  it("includes olfactory", () => {
    expect(SENSORY_DOMAINS.find((d) => d.domain === "olfactory")).toBeTruthy();
  });

  it("includes gustatory", () => {
    expect(SENSORY_DOMAINS.find((d) => d.domain === "gustatory")).toBeTruthy();
  });

  it("includes vestibular", () => {
    expect(SENSORY_DOMAINS.find((d) => d.domain === "vestibular")).toBeTruthy();
  });

  it("includes proprioceptive", () => {
    expect(SENSORY_DOMAINS.find((d) => d.domain === "proprioceptive")).toBeTruthy();
  });

  it("includes interoceptive", () => {
    expect(SENSORY_DOMAINS.find((d) => d.domain === "interoceptive")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const d of SENSORY_DOMAINS) {
      expect(d.label.length).toBeGreaterThan(0);
    }
  });
});

describe("SENSITIVITY_LEVELS", () => {
  it("has exactly 5 entries", () => {
    expect(SENSITIVITY_LEVELS).toHaveLength(5);
  });

  it("contains unique level values", () => {
    const values = SENSITIVITY_LEVELS.map((l) => l.level);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = SENSITIVITY_LEVELS.map((l) => l.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes hyper_sensitive", () => {
    expect(SENSITIVITY_LEVELS.find((l) => l.level === "hyper_sensitive")).toBeTruthy();
  });

  it("includes sensitive", () => {
    expect(SENSITIVITY_LEVELS.find((l) => l.level === "sensitive")).toBeTruthy();
  });

  it("includes typical", () => {
    expect(SENSITIVITY_LEVELS.find((l) => l.level === "typical")).toBeTruthy();
  });

  it("includes seeking", () => {
    expect(SENSITIVITY_LEVELS.find((l) => l.level === "seeking")).toBeTruthy();
  });

  it("includes hypo_sensitive", () => {
    expect(SENSITIVITY_LEVELS.find((l) => l.level === "hypo_sensitive")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const l of SENSITIVITY_LEVELS) {
      expect(l.label.length).toBeGreaterThan(0);
    }
  });
});

describe("ADAPTATION_TYPES", () => {
  it("has exactly 12 entries", () => {
    expect(ADAPTATION_TYPES).toHaveLength(12);
  });

  it("contains unique type values", () => {
    const values = ADAPTATION_TYPES.map((a) => a.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = ADAPTATION_TYPES.map((a) => a.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected adaptation types", () => {
    const expected: AdaptationType[] = [
      "lighting", "noise_reduction", "texture_modification", "temperature_control",
      "space_layout", "colour_scheme", "sensory_equipment", "routine_adjustment",
      "diet_modification", "clothing_adaptation", "transition_support", "other",
    ];
    for (const type of expected) {
      expect(ADAPTATION_TYPES.find((a) => a.type === type)).toBeTruthy();
    }
  });

  it("each entry has a non-empty label", () => {
    for (const a of ADAPTATION_TYPES) {
      expect(a.label.length).toBeGreaterThan(0);
    }
  });
});

describe("PROFILE_STATUSES", () => {
  it("has exactly 4 entries", () => {
    expect(PROFILE_STATUSES).toHaveLength(4);
  });

  it("contains unique status values", () => {
    const values = PROFILE_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = PROFILE_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes current", () => {
    expect(PROFILE_STATUSES.find((s) => s.status === "current")).toBeTruthy();
  });

  it("includes under_review", () => {
    expect(PROFILE_STATUSES.find((s) => s.status === "under_review")).toBeTruthy();
  });

  it("includes outdated", () => {
    expect(PROFILE_STATUSES.find((s) => s.status === "outdated")).toBeTruthy();
  });

  it("includes initial_assessment", () => {
    expect(PROFILE_STATUSES.find((s) => s.status === "initial_assessment")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of PROFILE_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeSensoryMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeSensoryMetrics", () => {
  it("returns zeroed metrics for empty profiles array", () => {
    const m = computeSensoryMetrics([], 0);
    expect(m.total_profiles).toBe(0);
    expect(m.children_assessed).toBe(0);
    expect(m.assessment_coverage).toBeNull();;
    expect(m.current_profiles).toBe(0);
    expect(m.outdated_profiles).toBe(0);
    expect(m.under_review_count).toBe(0);
    expect(m.hyper_sensitive_count).toBe(0);
    expect(m.hypo_sensitive_count).toBe(0);
    expect(m.seeking_count).toBe(0);
    expect(m.staff_trained_rate).toBeNull();;
    expect(m.ot_input_rate).toBeNull();;
    expect(m.child_views_rate).toBeNull();;
    expect(m.adaptations_in_place).toBe(0);
    expect(Object.keys(m.by_sensory_domain)).toHaveLength(0);
    expect(Object.keys(m.by_sensitivity_level)).toHaveLength(0);
    expect(Object.keys(m.by_adaptation_type)).toHaveLength(0);
  });

  // ── total_profiles ──────────────────────────────────────────────────

  it("total_profiles equals the number of profiles", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_id: "c1" }),
      makeProfile({ id: "sp2", child_id: "c2" }),
      makeProfile({ id: "sp3", child_id: "c3" }),
    ];
    const m = computeSensoryMetrics(profiles, 5);
    expect(m.total_profiles).toBe(3);
  });

  it("total_profiles is 1 for single profile", () => {
    const m = computeSensoryMetrics([makeProfile()], 1);
    expect(m.total_profiles).toBe(1);
  });

  // ── children_assessed ───────────────────────────────────────────────

  it("children_assessed counts unique child IDs", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_id: "c1", sensory_domain: "visual" }),
      makeProfile({ id: "sp2", child_id: "c1", sensory_domain: "auditory" }),
      makeProfile({ id: "sp3", child_id: "c2", sensory_domain: "tactile" }),
    ];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.children_assessed).toBe(2);
  });

  it("children_assessed is 1 when all profiles belong to same child", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_id: "c1", sensory_domain: "visual" }),
      makeProfile({ id: "sp2", child_id: "c1", sensory_domain: "auditory" }),
      makeProfile({ id: "sp3", child_id: "c1", sensory_domain: "tactile" }),
    ];
    const m = computeSensoryMetrics(profiles, 5);
    expect(m.children_assessed).toBe(1);
  });

  it("children_assessed equals total when each profile is a different child", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_id: "c1" }),
      makeProfile({ id: "sp2", child_id: "c2" }),
      makeProfile({ id: "sp3", child_id: "c3" }),
      makeProfile({ id: "sp4", child_id: "c4" }),
    ];
    const m = computeSensoryMetrics(profiles, 4);
    expect(m.children_assessed).toBe(4);
  });

  // ── assessment_coverage ─────────────────────────────────────────────

  it("assessment_coverage is 100 when all children assessed", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_id: "c1" }),
      makeProfile({ id: "sp2", child_id: "c2" }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.assessment_coverage).toBe(100);
  });

  it("assessment_coverage is 50 when half the children assessed", () => {
    const profiles = [makeProfile({ id: "sp1", child_id: "c1" })];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.assessment_coverage).toBe(50);
  });

  it("assessment_coverage is 0 when totalChildren is 0", () => {
    const m = computeSensoryMetrics([], 0);
    expect(m.assessment_coverage).toBeNull();;
  });

  it("assessment_coverage rounds to one decimal place", () => {
    const profiles = [makeProfile({ id: "sp1", child_id: "c1" })];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.assessment_coverage).toBe(33.3);
  });

  it("assessment_coverage is 0 with empty profiles and positive totalChildren", () => {
    const m = computeSensoryMetrics([], 5);
    expect(m.assessment_coverage).toBe(0);
  });

  it("assessment_coverage with 2 children in 3 totalChildren", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_id: "c1" }),
      makeProfile({ id: "sp2", child_id: "c2" }),
    ];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.assessment_coverage).toBe(66.7);
  });

  // ── profile status counts ───────────────────────────────────────────

  it("current_profiles counts profiles with status current", () => {
    const profiles = [
      makeProfile({ id: "sp1", profile_status: "current" }),
      makeProfile({ id: "sp2", profile_status: "current" }),
      makeProfile({ id: "sp3", profile_status: "outdated" }),
    ];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.current_profiles).toBe(2);
  });

  it("outdated_profiles counts profiles with status outdated", () => {
    const profiles = [
      makeProfile({ id: "sp1", profile_status: "outdated" }),
      makeProfile({ id: "sp2", profile_status: "outdated" }),
      makeProfile({ id: "sp3", profile_status: "current" }),
    ];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.outdated_profiles).toBe(2);
  });

  it("under_review_count counts profiles with status under_review", () => {
    const profiles = [
      makeProfile({ id: "sp1", profile_status: "under_review" }),
      makeProfile({ id: "sp2", profile_status: "under_review" }),
      makeProfile({ id: "sp3", profile_status: "under_review" }),
    ];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.under_review_count).toBe(3);
  });

  it("initial_assessment status is not counted as current, outdated, or under_review", () => {
    const profiles = [
      makeProfile({ id: "sp1", profile_status: "initial_assessment" }),
    ];
    const m = computeSensoryMetrics(profiles, 1);
    expect(m.current_profiles).toBe(0);
    expect(m.outdated_profiles).toBe(0);
    expect(m.under_review_count).toBe(0);
  });

  it("all status counts are 0 for empty profiles", () => {
    const m = computeSensoryMetrics([], 0);
    expect(m.current_profiles).toBe(0);
    expect(m.outdated_profiles).toBe(0);
    expect(m.under_review_count).toBe(0);
  });

  // ── sensitivity level counts ────────────────────────────────────────

  it("hyper_sensitive_count counts hyper_sensitive profiles", () => {
    const profiles = [
      makeProfile({ id: "sp1", sensitivity_level: "hyper_sensitive" }),
      makeProfile({ id: "sp2", sensitivity_level: "hyper_sensitive" }),
      makeProfile({ id: "sp3", sensitivity_level: "typical" }),
    ];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.hyper_sensitive_count).toBe(2);
  });

  it("hypo_sensitive_count counts hypo_sensitive profiles", () => {
    const profiles = [
      makeProfile({ id: "sp1", sensitivity_level: "hypo_sensitive" }),
      makeProfile({ id: "sp2", sensitivity_level: "sensitive" }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.hypo_sensitive_count).toBe(1);
  });

  it("seeking_count counts seeking profiles", () => {
    const profiles = [
      makeProfile({ id: "sp1", sensitivity_level: "seeking" }),
      makeProfile({ id: "sp2", sensitivity_level: "seeking" }),
      makeProfile({ id: "sp3", sensitivity_level: "seeking" }),
    ];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.seeking_count).toBe(3);
  });

  it("sensitive level is not counted in hyper, hypo, or seeking", () => {
    const profiles = [
      makeProfile({ id: "sp1", sensitivity_level: "sensitive" }),
    ];
    const m = computeSensoryMetrics(profiles, 1);
    expect(m.hyper_sensitive_count).toBe(0);
    expect(m.hypo_sensitive_count).toBe(0);
    expect(m.seeking_count).toBe(0);
  });

  it("typical level is not counted in hyper, hypo, or seeking", () => {
    const profiles = [
      makeProfile({ id: "sp1", sensitivity_level: "typical" }),
    ];
    const m = computeSensoryMetrics(profiles, 1);
    expect(m.hyper_sensitive_count).toBe(0);
    expect(m.hypo_sensitive_count).toBe(0);
    expect(m.seeking_count).toBe(0);
  });

  it("all sensitivity counts are 0 for empty profiles", () => {
    const m = computeSensoryMetrics([], 0);
    expect(m.hyper_sensitive_count).toBe(0);
    expect(m.hypo_sensitive_count).toBe(0);
    expect(m.seeking_count).toBe(0);
  });

  // ── staff_trained_rate ──────────────────────────────────────────────

  it("staff_trained_rate is 100 when all profiles have staff trained", () => {
    const profiles = [
      makeProfile({ id: "sp1", staff_trained: true }),
      makeProfile({ id: "sp2", staff_trained: true }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.staff_trained_rate).toBe(100);
  });

  it("staff_trained_rate is 0 when no profiles have staff trained", () => {
    const profiles = [
      makeProfile({ id: "sp1", staff_trained: false }),
      makeProfile({ id: "sp2", staff_trained: false }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.staff_trained_rate).toBe(0);
  });

  it("staff_trained_rate is 50 when half have staff trained", () => {
    const profiles = [
      makeProfile({ id: "sp1", staff_trained: true }),
      makeProfile({ id: "sp2", staff_trained: false }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.staff_trained_rate).toBe(50);
  });

  it("staff_trained_rate rounds to one decimal place", () => {
    const profiles = [
      makeProfile({ id: "sp1", staff_trained: true }),
      makeProfile({ id: "sp2", staff_trained: false }),
      makeProfile({ id: "sp3", staff_trained: false }),
    ];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.staff_trained_rate).toBe(33.3);
  });

  it("staff_trained_rate is 0 for empty profiles", () => {
    const m = computeSensoryMetrics([], 0);
    expect(m.staff_trained_rate).toBeNull();;
  });

  // ── ot_input_rate ───────────────────────────────────────────────────

  it("ot_input_rate is 100 when all profiles have OT input", () => {
    const profiles = [
      makeProfile({ id: "sp1", occupational_therapist_input: true }),
      makeProfile({ id: "sp2", occupational_therapist_input: true }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.ot_input_rate).toBe(100);
  });

  it("ot_input_rate is 0 when no profiles have OT input", () => {
    const profiles = [
      makeProfile({ id: "sp1", occupational_therapist_input: false }),
      makeProfile({ id: "sp2", occupational_therapist_input: false }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.ot_input_rate).toBe(0);
  });

  it("ot_input_rate is 50 when half have OT input", () => {
    const profiles = [
      makeProfile({ id: "sp1", occupational_therapist_input: true }),
      makeProfile({ id: "sp2", occupational_therapist_input: false }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.ot_input_rate).toBe(50);
  });

  it("ot_input_rate rounds to one decimal place", () => {
    const profiles = [
      makeProfile({ id: "sp1", occupational_therapist_input: true }),
      makeProfile({ id: "sp2", occupational_therapist_input: true }),
      makeProfile({ id: "sp3", occupational_therapist_input: false }),
    ];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.ot_input_rate).toBe(66.7);
  });

  it("ot_input_rate is 0 for empty profiles", () => {
    const m = computeSensoryMetrics([], 0);
    expect(m.ot_input_rate).toBeNull();;
  });

  // ── child_views_rate ────────────────────────────────────────────────

  it("child_views_rate is 100 when all profiles have child views", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_views: "I like quiet" }),
      makeProfile({ id: "sp2", child_views: "I prefer dim lights" }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.child_views_rate).toBe(100);
  });

  it("child_views_rate is 0 when no profiles have child views", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_views: null }),
      makeProfile({ id: "sp2", child_views: null }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.child_views_rate).toBe(0);
  });

  it("child_views_rate is 50 when half have child views", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_views: "Views here" }),
      makeProfile({ id: "sp2", child_views: null }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.child_views_rate).toBe(50);
  });

  it("child_views_rate rounds to one decimal place", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_views: "Yes" }),
      makeProfile({ id: "sp2", child_views: "Yes" }),
      makeProfile({ id: "sp3", child_views: null }),
    ];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.child_views_rate).toBe(66.7);
  });

  it("child_views_rate is 0 for empty profiles", () => {
    const m = computeSensoryMetrics([], 0);
    expect(m.child_views_rate).toBeNull();;
  });

  it("child_views_rate counts non-null values including empty string", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_views: "" }),
      makeProfile({ id: "sp2", child_views: null }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    // empty string is not null, so it counts
    expect(m.child_views_rate).toBe(50);
  });

  // ── adaptations_in_place ────────────────────────────────────────────

  it("adaptations_in_place counts profiles with at least one adaptation", () => {
    const profiles = [
      makeProfile({ id: "sp1", adaptations: ["lighting"] as AdaptationType[] }),
      makeProfile({ id: "sp2", adaptations: ["noise_reduction", "space_layout"] as AdaptationType[] }),
      makeProfile({ id: "sp3", adaptations: [] as AdaptationType[] }),
    ];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.adaptations_in_place).toBe(2);
  });

  it("adaptations_in_place is 0 when all profiles have empty adaptations", () => {
    const profiles = [
      makeProfile({ id: "sp1", adaptations: [] as AdaptationType[] }),
      makeProfile({ id: "sp2", adaptations: [] as AdaptationType[] }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.adaptations_in_place).toBe(0);
  });

  it("adaptations_in_place equals total when all profiles have adaptations", () => {
    const profiles = [
      makeProfile({ id: "sp1", adaptations: ["lighting"] as AdaptationType[] }),
      makeProfile({ id: "sp2", adaptations: ["noise_reduction"] as AdaptationType[] }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.adaptations_in_place).toBe(2);
  });

  it("adaptations_in_place is 0 for empty profiles", () => {
    const m = computeSensoryMetrics([], 0);
    expect(m.adaptations_in_place).toBe(0);
  });

  // ── by_sensory_domain ───────────────────────────────────────────────

  it("by_sensory_domain groups counts by domain", () => {
    const profiles = [
      makeProfile({ id: "sp1", sensory_domain: "visual" }),
      makeProfile({ id: "sp2", sensory_domain: "visual" }),
      makeProfile({ id: "sp3", sensory_domain: "auditory" }),
    ];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.by_sensory_domain["visual"]).toBe(2);
    expect(m.by_sensory_domain["auditory"]).toBe(1);
  });

  it("by_sensory_domain is empty for no profiles", () => {
    const m = computeSensoryMetrics([], 0);
    expect(Object.keys(m.by_sensory_domain)).toHaveLength(0);
  });

  it("by_sensory_domain has one entry per unique domain", () => {
    const profiles = [
      makeProfile({ id: "sp1", sensory_domain: "visual" }),
      makeProfile({ id: "sp2", sensory_domain: "tactile" }),
      makeProfile({ id: "sp3", sensory_domain: "vestibular" }),
      makeProfile({ id: "sp4", sensory_domain: "tactile" }),
    ];
    const m = computeSensoryMetrics(profiles, 4);
    expect(Object.keys(m.by_sensory_domain)).toHaveLength(3);
  });

  it("by_sensory_domain values sum to total_profiles", () => {
    const profiles = [
      makeProfile({ id: "sp1", sensory_domain: "visual" }),
      makeProfile({ id: "sp2", sensory_domain: "auditory" }),
      makeProfile({ id: "sp3", sensory_domain: "visual" }),
      makeProfile({ id: "sp4", sensory_domain: "olfactory" }),
    ];
    const m = computeSensoryMetrics(profiles, 4);
    const sum = Object.values(m.by_sensory_domain).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_profiles);
  });

  it("by_sensory_domain has 8 entries when all domains represented", () => {
    const domains: SensoryDomain[] = [
      "visual", "auditory", "tactile", "olfactory",
      "gustatory", "vestibular", "proprioceptive", "interoceptive",
    ];
    const profiles = domains.map((d, i) =>
      makeProfile({ id: `sp${i}`, sensory_domain: d }),
    );
    const m = computeSensoryMetrics(profiles, 8);
    expect(Object.keys(m.by_sensory_domain)).toHaveLength(8);
  });

  // ── by_sensitivity_level ────────────────────────────────────────────

  it("by_sensitivity_level groups counts by sensitivity level", () => {
    const profiles = [
      makeProfile({ id: "sp1", sensitivity_level: "hyper_sensitive" }),
      makeProfile({ id: "sp2", sensitivity_level: "hyper_sensitive" }),
      makeProfile({ id: "sp3", sensitivity_level: "typical" }),
    ];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.by_sensitivity_level["hyper_sensitive"]).toBe(2);
    expect(m.by_sensitivity_level["typical"]).toBe(1);
  });

  it("by_sensitivity_level is empty for no profiles", () => {
    const m = computeSensoryMetrics([], 0);
    expect(Object.keys(m.by_sensitivity_level)).toHaveLength(0);
  });

  it("by_sensitivity_level values sum to total_profiles", () => {
    const profiles = [
      makeProfile({ id: "sp1", sensitivity_level: "hyper_sensitive" }),
      makeProfile({ id: "sp2", sensitivity_level: "sensitive" }),
      makeProfile({ id: "sp3", sensitivity_level: "typical" }),
      makeProfile({ id: "sp4", sensitivity_level: "seeking" }),
      makeProfile({ id: "sp5", sensitivity_level: "hypo_sensitive" }),
    ];
    const m = computeSensoryMetrics(profiles, 5);
    const sum = Object.values(m.by_sensitivity_level).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_profiles);
  });

  it("by_sensitivity_level has 5 entries when all levels represented", () => {
    const levels: SensitivityLevel[] = [
      "hyper_sensitive", "sensitive", "typical", "seeking", "hypo_sensitive",
    ];
    const profiles = levels.map((l, i) =>
      makeProfile({ id: `sp${i}`, sensitivity_level: l }),
    );
    const m = computeSensoryMetrics(profiles, 5);
    expect(Object.keys(m.by_sensitivity_level)).toHaveLength(5);
  });

  // ── by_adaptation_type ──────────────────────────────────────────────

  it("by_adaptation_type tallies each adaptation across profiles", () => {
    const profiles = [
      makeProfile({ id: "sp1", adaptations: ["lighting", "noise_reduction"] as AdaptationType[] }),
      makeProfile({ id: "sp2", adaptations: ["lighting", "space_layout"] as AdaptationType[] }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.by_adaptation_type["lighting"]).toBe(2);
    expect(m.by_adaptation_type["noise_reduction"]).toBe(1);
    expect(m.by_adaptation_type["space_layout"]).toBe(1);
  });

  it("by_adaptation_type is empty for no profiles", () => {
    const m = computeSensoryMetrics([], 0);
    expect(Object.keys(m.by_adaptation_type)).toHaveLength(0);
  });

  it("by_adaptation_type is empty when all profiles have empty adaptations", () => {
    const profiles = [
      makeProfile({ id: "sp1", adaptations: [] as AdaptationType[] }),
      makeProfile({ id: "sp2", adaptations: [] as AdaptationType[] }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(Object.keys(m.by_adaptation_type)).toHaveLength(0);
  });

  it("by_adaptation_type counts multiple adaptations per profile", () => {
    const profiles = [
      makeProfile({
        id: "sp1",
        adaptations: ["lighting", "noise_reduction", "temperature_control", "sensory_equipment"] as AdaptationType[],
      }),
    ];
    const m = computeSensoryMetrics(profiles, 1);
    expect(Object.keys(m.by_adaptation_type)).toHaveLength(4);
    expect(m.by_adaptation_type["lighting"]).toBe(1);
    expect(m.by_adaptation_type["noise_reduction"]).toBe(1);
    expect(m.by_adaptation_type["temperature_control"]).toBe(1);
    expect(m.by_adaptation_type["sensory_equipment"]).toBe(1);
  });

  // ── single profile ──────────────────────────────────────────────────

  it("single hyper_sensitive profile with adaptations", () => {
    const profiles = [
      makeProfile({
        id: "sp1",
        sensitivity_level: "hyper_sensitive",
        adaptations: ["lighting", "noise_reduction"] as AdaptationType[],
        staff_trained: true,
        occupational_therapist_input: true,
        child_views: "I need quiet spaces",
      }),
    ];
    const m = computeSensoryMetrics(profiles, 1);
    expect(m.hyper_sensitive_count).toBe(1);
    expect(m.adaptations_in_place).toBe(1);
    expect(m.staff_trained_rate).toBe(100);
    expect(m.ot_input_rate).toBe(100);
    expect(m.child_views_rate).toBe(100);
  });

  // ── mixed multi-child scenario ──────────────────────────────────────

  it("correctly computes metrics for multi-child mixed scenario", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_id: "c1", child_name: "Alice",
        sensory_domain: "visual", sensitivity_level: "hyper_sensitive",
        profile_status: "current", staff_trained: true,
        occupational_therapist_input: true, child_views: "I need dim lights",
        adaptations: ["lighting", "colour_scheme"] as AdaptationType[],
      }),
      makeProfile({
        id: "sp2", child_id: "c1", child_name: "Alice",
        sensory_domain: "auditory", sensitivity_level: "sensitive",
        profile_status: "current", staff_trained: true,
        occupational_therapist_input: false, child_views: null,
        adaptations: ["noise_reduction"] as AdaptationType[],
      }),
      makeProfile({
        id: "sp3", child_id: "c2", child_name: "Bob",
        sensory_domain: "tactile", sensitivity_level: "hypo_sensitive",
        profile_status: "outdated", staff_trained: false,
        occupational_therapist_input: false, child_views: null,
        adaptations: [] as AdaptationType[],
      }),
      makeProfile({
        id: "sp4", child_id: "c3", child_name: "Carol",
        sensory_domain: "vestibular", sensitivity_level: "seeking",
        profile_status: "under_review", staff_trained: false,
        occupational_therapist_input: true, child_views: "I like spinning",
        adaptations: ["sensory_equipment"] as AdaptationType[],
      }),
    ];
    const m = computeSensoryMetrics(profiles, 5);
    expect(m.total_profiles).toBe(4);
    expect(m.children_assessed).toBe(3);
    expect(m.assessment_coverage).toBe(60);
    expect(m.current_profiles).toBe(2);
    expect(m.outdated_profiles).toBe(1);
    expect(m.under_review_count).toBe(1);
    expect(m.hyper_sensitive_count).toBe(1);
    expect(m.hypo_sensitive_count).toBe(1);
    expect(m.seeking_count).toBe(1);
    expect(m.staff_trained_rate).toBe(50);
    expect(m.ot_input_rate).toBe(50);
    expect(m.child_views_rate).toBe(50);
    expect(m.adaptations_in_place).toBe(3);
    expect(m.by_sensory_domain["visual"]).toBe(1);
    expect(m.by_sensory_domain["auditory"]).toBe(1);
    expect(m.by_sensory_domain["tactile"]).toBe(1);
    expect(m.by_sensory_domain["vestibular"]).toBe(1);
    expect(m.by_adaptation_type["lighting"]).toBe(1);
    expect(m.by_adaptation_type["colour_scheme"]).toBe(1);
    expect(m.by_adaptation_type["noise_reduction"]).toBe(1);
    expect(m.by_adaptation_type["sensory_equipment"]).toBe(1);
  });

  // ── large dataset ───────────────────────────────────────────────────

  it("handles large profiles array efficiently", () => {
    const profiles: SensoryProfile[] = [];
    const domains: SensoryDomain[] = ["visual", "auditory", "tactile", "olfactory", "gustatory", "vestibular", "proprioceptive", "interoceptive"];
    const levels: SensitivityLevel[] = ["hyper_sensitive", "sensitive", "typical", "seeking", "hypo_sensitive"];
    for (let i = 0; i < 100; i++) {
      profiles.push(
        makeProfile({
          id: `sp-${i}`,
          child_id: `c-${i % 20}`,
          child_name: `Child ${i % 20}`,
          sensory_domain: domains[i % 8],
          sensitivity_level: levels[i % 5],
          profile_status: i % 4 === 0 ? "current" : i % 4 === 1 ? "outdated" : i % 4 === 2 ? "under_review" : "initial_assessment",
          staff_trained: i % 3 === 0,
          occupational_therapist_input: i % 4 === 0,
          child_views: i % 2 === 0 ? "views" : null,
          adaptations: i % 2 === 0 ? (["lighting"] as AdaptationType[]) : ([] as AdaptationType[]),
        }),
      );
    }
    const m = computeSensoryMetrics(profiles, 25);
    expect(m.total_profiles).toBe(100);
    expect(m.children_assessed).toBe(20);
    expect(m.assessment_coverage).toBe(80);
  });

  it("totalChildren parameter does not affect per-profile metrics", () => {
    const profiles = [makeProfile({ id: "sp1", child_id: "c1" })];
    const m1 = computeSensoryMetrics(profiles, 1);
    const m2 = computeSensoryMetrics(profiles, 100);
    expect(m1.total_profiles).toBe(m2.total_profiles);
    expect(m1.hyper_sensitive_count).toBe(m2.hyper_sensitive_count);
    expect(m1.staff_trained_rate).toBe(m2.staff_trained_rate);
    expect(m1.adaptations_in_place).toBe(m2.adaptations_in_place);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifySensoryAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifySensoryAlerts", () => {
  // ── no alerts when clean ────────────────────────────────────────────

  it("returns empty array for empty profiles and zero children", () => {
    const alerts = identifySensoryAlerts([], 0, now);
    expect(alerts).toEqual([]);
  });

  it("returns empty array when all data is clean", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_id: "c1", profile_status: "current",
        sensitivity_level: "typical", staff_trained: true,
        next_review_date: daysFromNow(30),
        adaptations: ["noise_reduction"] as AdaptationType[],
      }),
      makeProfile({
        id: "sp2", child_id: "c2", profile_status: "current",
        sensitivity_level: "sensitive", staff_trained: true,
        next_review_date: daysFromNow(60),
        adaptations: ["lighting"] as AdaptationType[],
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 2, now);
    expect(alerts).toEqual([]);
  });

  // ── no_profile alert (children without profiles) ────────────────────

  it("generates no_profile alert when children lack profiles", () => {
    const alerts = identifySensoryAlerts([], 3, now);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe("no_profile");
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].id).toBe("profile_gap");
  });

  it("no_profile alert includes correct gap count for 1 child", () => {
    const alerts = identifySensoryAlerts([], 1, now);
    expect(alerts[0].message).toContain("1");
    expect(alerts[0].message).toContain("child has");
  });

  it("no_profile alert uses plural for multiple children", () => {
    const alerts = identifySensoryAlerts([], 5, now);
    expect(alerts[0].message).toContain("5");
    expect(alerts[0].message).toContain("children have");
  });

  it("no_profile alert counts only unassessed children", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_id: "c1" }),
    ];
    const alerts = identifySensoryAlerts(profiles, 4, now);
    const gap = alerts.find((a) => a.type === "no_profile");
    expect(gap).toBeTruthy();
    expect(gap!.message).toContain("3");
  });

  it("no no_profile alert when all children have profiles", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_id: "c1" }),
      makeProfile({ id: "sp2", child_id: "c2" }),
    ];
    const alerts = identifySensoryAlerts(profiles, 2, now);
    const gap = alerts.find((a) => a.type === "no_profile");
    expect(gap).toBeUndefined();
  });

  it("no no_profile alert when totalChildren is 0", () => {
    const alerts = identifySensoryAlerts([], 0, now);
    const gap = alerts.find((a) => a.type === "no_profile");
    expect(gap).toBeUndefined();
  });

  it("no_profile alert gap is exact difference between total and assessed", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_id: "c1" }),
      makeProfile({ id: "sp2", child_id: "c2" }),
    ];
    const alerts = identifySensoryAlerts(profiles, 7, now);
    const gap = alerts.find((a) => a.type === "no_profile");
    expect(gap!.message).toContain("5");
    expect(gap!.message).toContain("children have");
  });

  it("no_profile alert counts unique children, not profiles", () => {
    // Two profiles for same child should count as 1 assessed child
    const profiles = [
      makeProfile({ id: "sp1", child_id: "c1", sensory_domain: "visual" }),
      makeProfile({ id: "sp2", child_id: "c1", sensory_domain: "auditory" }),
    ];
    const alerts = identifySensoryAlerts(profiles, 3, now);
    const gap = alerts.find((a) => a.type === "no_profile");
    expect(gap).toBeTruthy();
    expect(gap!.message).toContain("2");
  });

  // ── profile_outdated alert ──────────────────────────────────────────

  it("generates profile_outdated alert for outdated profile", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_name: "Alice", sensory_domain: "visual", profile_status: "outdated" }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const outdated = alerts.find((a) => a.type === "profile_outdated");
    expect(outdated).toBeTruthy();
    expect(outdated!.severity).toBe("medium");
    expect(outdated!.id).toBe("sp1");
  });

  it("profile_outdated alert includes child name and domain", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_name: "Bob Jones", sensory_domain: "tactile", profile_status: "outdated" }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const outdated = alerts.find((a) => a.type === "profile_outdated");
    expect(outdated!.message).toContain("Bob Jones");
    expect(outdated!.message).toContain("tactile");
  });

  it("no profile_outdated alert when profile is current", () => {
    const profiles = [
      makeProfile({ id: "sp1", profile_status: "current" }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const outdated = alerts.find((a) => a.type === "profile_outdated");
    expect(outdated).toBeUndefined();
  });

  it("no profile_outdated alert when profile is under_review", () => {
    const profiles = [
      makeProfile({ id: "sp1", profile_status: "under_review" }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const outdated = alerts.find((a) => a.type === "profile_outdated");
    expect(outdated).toBeUndefined();
  });

  it("no profile_outdated alert when profile is initial_assessment", () => {
    const profiles = [
      makeProfile({ id: "sp1", profile_status: "initial_assessment" }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const outdated = alerts.find((a) => a.type === "profile_outdated");
    expect(outdated).toBeUndefined();
  });

  it("generates multiple profile_outdated alerts for different outdated profiles", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_name: "Alice", sensory_domain: "visual", profile_status: "outdated" }),
      makeProfile({ id: "sp2", child_name: "Bob", sensory_domain: "auditory", profile_status: "outdated" }),
      makeProfile({ id: "sp3", child_name: "Carol", sensory_domain: "tactile", profile_status: "current" }),
    ];
    const alerts = identifySensoryAlerts(profiles, 3, now);
    const outdated = alerts.filter((a) => a.type === "profile_outdated");
    expect(outdated).toHaveLength(2);
  });

  // ── staff_not_trained alert ─────────────────────────────────────────

  it("generates staff_not_trained alert for hyper_sensitive with untrained staff", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_name: "Alice", sensory_domain: "visual",
        sensitivity_level: "hyper_sensitive", staff_trained: false,
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained).toBeTruthy();
    expect(untrained!.severity).toBe("high");
    expect(untrained!.id).toBe("sp1");
  });

  it("generates staff_not_trained alert for hypo_sensitive with untrained staff", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_name: "Bob", sensory_domain: "tactile",
        sensitivity_level: "hypo_sensitive", staff_trained: false,
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained).toBeTruthy();
    expect(untrained!.severity).toBe("high");
  });

  it("staff_not_trained alert includes child name and domain", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_name: "Carol Davies", sensory_domain: "auditory",
        sensitivity_level: "hyper_sensitive", staff_trained: false,
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained!.message).toContain("Carol Davies");
    expect(untrained!.message).toContain("auditory");
  });

  it("staff_not_trained alert includes sensitivity level in message", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_name: "Alice",
        sensitivity_level: "hyper_sensitive", staff_trained: false,
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained!.message).toContain("hyper sensitive");
  });

  it("no staff_not_trained alert when staff is trained on hyper_sensitive", () => {
    const profiles = [
      makeProfile({
        id: "sp1", sensitivity_level: "hyper_sensitive", staff_trained: true,
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained).toBeUndefined();
  });

  it("no staff_not_trained alert when staff is trained on hypo_sensitive", () => {
    const profiles = [
      makeProfile({
        id: "sp1", sensitivity_level: "hypo_sensitive", staff_trained: true,
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained).toBeUndefined();
  });

  it("no staff_not_trained alert for typical sensitivity even when untrained", () => {
    const profiles = [
      makeProfile({
        id: "sp1", sensitivity_level: "typical", staff_trained: false,
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained).toBeUndefined();
  });

  it("no staff_not_trained alert for sensitive level even when untrained", () => {
    const profiles = [
      makeProfile({
        id: "sp1", sensitivity_level: "sensitive", staff_trained: false,
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained).toBeUndefined();
  });

  it("no staff_not_trained alert for seeking level even when untrained", () => {
    const profiles = [
      makeProfile({
        id: "sp1", sensitivity_level: "seeking", staff_trained: false,
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained).toBeUndefined();
  });

  it("generates multiple staff_not_trained alerts for different profiles", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_name: "Alice", sensitivity_level: "hyper_sensitive", staff_trained: false }),
      makeProfile({ id: "sp2", child_name: "Bob", sensitivity_level: "hypo_sensitive", staff_trained: false }),
    ];
    const alerts = identifySensoryAlerts(profiles, 2, now);
    const untrained = alerts.filter((a) => a.type === "staff_not_trained");
    expect(untrained).toHaveLength(2);
  });

  // ── review_overdue alert ────────────────────────────────────────────

  it("generates review_overdue alert when next_review_date is in the past", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_name: "Alice", sensory_domain: "visual",
        next_review_date: daysAgo(10),
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeTruthy();
    expect(overdue!.severity).toBe("medium");
    expect(overdue!.id).toBe("sp1");
  });

  it("review_overdue alert includes child name and domain", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_name: "Bob Jones", sensory_domain: "proprioceptive",
        next_review_date: daysAgo(5),
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue!.message).toContain("Bob Jones");
    expect(overdue!.message).toContain("proprioceptive");
  });

  it("review_overdue alert includes the overdue date in message", () => {
    const pastDate = daysAgo(15);
    const profiles = [
      makeProfile({ id: "sp1", next_review_date: pastDate }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue!.message).toContain(pastDate);
  });

  it("no review_overdue alert when next_review_date is in the future", () => {
    const profiles = [
      makeProfile({ id: "sp1", next_review_date: daysFromNow(30) }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeUndefined();
  });

  it("no review_overdue alert when next_review_date is null", () => {
    const profiles = [
      makeProfile({ id: "sp1", next_review_date: null }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeUndefined();
  });

  it("generates multiple review_overdue alerts for different profiles", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_name: "Alice", next_review_date: daysAgo(5) }),
      makeProfile({ id: "sp2", child_name: "Bob", next_review_date: daysAgo(20) }),
      makeProfile({ id: "sp3", child_name: "Carol", next_review_date: daysFromNow(10) }),
    ];
    const alerts = identifySensoryAlerts(profiles, 3, now);
    const overdue = alerts.filter((a) => a.type === "review_overdue");
    expect(overdue).toHaveLength(2);
  });

  it("review_overdue uses the now parameter for comparison", () => {
    const futureNow = new Date(daysFromNow(60));
    const profiles = [
      makeProfile({ id: "sp1", next_review_date: daysFromNow(30) }),
    ];
    // With the default now, this should NOT be overdue
    const alertsDefault = identifySensoryAlerts(profiles, 1, now);
    expect(alertsDefault.find((a) => a.type === "review_overdue")).toBeUndefined();
    // With a future now, this SHOULD be overdue
    const alertsFuture = identifySensoryAlerts(profiles, 1, futureNow);
    expect(alertsFuture.find((a) => a.type === "review_overdue")).toBeTruthy();
  });

  // ── no_adaptations alert (hyper-sensitive without adaptations) ──────

  it("generates no_adaptations alert for hyper_sensitive without adaptations", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_name: "Alice", sensory_domain: "auditory",
        sensitivity_level: "hyper_sensitive",
        adaptations: [] as AdaptationType[],
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const noAdapt = alerts.find((a) => a.type === "no_adaptations");
    expect(noAdapt).toBeTruthy();
    expect(noAdapt!.severity).toBe("high");
    expect(noAdapt!.id).toBe("sp1");
  });

  it("no_adaptations alert includes child name and domain", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_name: "Carol Davies", sensory_domain: "tactile",
        sensitivity_level: "hyper_sensitive",
        adaptations: [] as AdaptationType[],
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const noAdapt = alerts.find((a) => a.type === "no_adaptations");
    expect(noAdapt!.message).toContain("Carol Davies");
    expect(noAdapt!.message).toContain("tactile");
  });

  it("no no_adaptations alert when hyper_sensitive has adaptations", () => {
    const profiles = [
      makeProfile({
        id: "sp1", sensitivity_level: "hyper_sensitive",
        adaptations: ["lighting"] as AdaptationType[],
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const noAdapt = alerts.find((a) => a.type === "no_adaptations");
    expect(noAdapt).toBeUndefined();
  });

  it("no no_adaptations alert for hypo_sensitive without adaptations", () => {
    const profiles = [
      makeProfile({
        id: "sp1", sensitivity_level: "hypo_sensitive",
        adaptations: [] as AdaptationType[],
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const noAdapt = alerts.find((a) => a.type === "no_adaptations");
    expect(noAdapt).toBeUndefined();
  });

  it("no no_adaptations alert for typical without adaptations", () => {
    const profiles = [
      makeProfile({
        id: "sp1", sensitivity_level: "typical",
        adaptations: [] as AdaptationType[],
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const noAdapt = alerts.find((a) => a.type === "no_adaptations");
    expect(noAdapt).toBeUndefined();
  });

  it("no no_adaptations alert for sensitive without adaptations", () => {
    const profiles = [
      makeProfile({
        id: "sp1", sensitivity_level: "sensitive",
        adaptations: [] as AdaptationType[],
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const noAdapt = alerts.find((a) => a.type === "no_adaptations");
    expect(noAdapt).toBeUndefined();
  });

  it("no no_adaptations alert for seeking without adaptations", () => {
    const profiles = [
      makeProfile({
        id: "sp1", sensitivity_level: "seeking",
        adaptations: [] as AdaptationType[],
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const noAdapt = alerts.find((a) => a.type === "no_adaptations");
    expect(noAdapt).toBeUndefined();
  });

  it("generates multiple no_adaptations alerts for different hyper_sensitive profiles", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_name: "Alice", sensory_domain: "visual", sensitivity_level: "hyper_sensitive", adaptations: [] as AdaptationType[] }),
      makeProfile({ id: "sp2", child_name: "Bob", sensory_domain: "auditory", sensitivity_level: "hyper_sensitive", adaptations: [] as AdaptationType[] }),
    ];
    const alerts = identifySensoryAlerts(profiles, 2, now);
    const noAdapt = alerts.filter((a) => a.type === "no_adaptations");
    expect(noAdapt).toHaveLength(2);
  });

  // ── combined alerts ─────────────────────────────────────────────────

  it("generates all alert types together when conditions are met", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_id: "c1", child_name: "Alice",
        sensory_domain: "visual", sensitivity_level: "hyper_sensitive",
        profile_status: "outdated", staff_trained: false,
        next_review_date: daysAgo(10),
        adaptations: [] as AdaptationType[],
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 3, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("no_profile");
    expect(types).toContain("profile_outdated");
    expect(types).toContain("staff_not_trained");
    expect(types).toContain("review_overdue");
    expect(types).toContain("no_adaptations");
  });

  it("alert severity values are correct types", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_id: "c1", child_name: "Alice",
        sensitivity_level: "hyper_sensitive", profile_status: "outdated",
        staff_trained: false, next_review_date: daysAgo(5),
        adaptations: [] as AdaptationType[],
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 2, now);
    for (const alert of alerts) {
      expect(["critical", "high", "medium"]).toContain(alert.severity);
    }
  });

  it("each alert has a non-empty message", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_id: "c1", child_name: "Alice",
        sensitivity_level: "hyper_sensitive", profile_status: "outdated",
        staff_trained: false, next_review_date: daysAgo(5),
        adaptations: [] as AdaptationType[],
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 2, now);
    for (const alert of alerts) {
      expect(alert.message.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty id", () => {
    const profiles = [
      makeProfile({
        id: "sp1", sensitivity_level: "hyper_sensitive",
        staff_trained: false, adaptations: [] as AdaptationType[],
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 2, now);
    for (const alert of alerts) {
      expect(alert.id.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty type", () => {
    const profiles = [
      makeProfile({
        id: "sp1", sensitivity_level: "hyper_sensitive",
        staff_trained: false, adaptations: [] as AdaptationType[],
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 2, now);
    for (const alert of alerts) {
      expect(alert.type.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listProfiles ────────────────────────────────────────────────────

  it("listProfiles returns ok: true with empty array", async () => {
    const result = await listProfiles("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listProfiles returns ok: true with childId filter", async () => {
    const result = await listProfiles("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listProfiles returns ok: true with sensoryDomain filter", async () => {
    const result = await listProfiles("home-1", { sensoryDomain: "visual" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listProfiles returns ok: true with sensitivityLevel filter", async () => {
    const result = await listProfiles("home-1", { sensitivityLevel: "hyper_sensitive" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listProfiles returns ok: true with profileStatus filter", async () => {
    const result = await listProfiles("home-1", { profileStatus: "current" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listProfiles returns ok: true with limit filter", async () => {
    const result = await listProfiles("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listProfiles returns ok: true with all filters combined", async () => {
    const result = await listProfiles("home-1", {
      childId: "child-1",
      sensoryDomain: "auditory",
      sensitivityLevel: "sensitive",
      profileStatus: "under_review",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createProfile ───────────────────────────────────────────────────

  it("createProfile returns ok: false with error message", async () => {
    const result = await createProfile({
      homeId: "home-1",
      childName: "Alice Smith",
      childId: "child-1",
      sensoryDomain: "auditory",
      sensitivityLevel: "hyper_sensitive",
      triggers: ["loud noises"],
      calmingStrategies: ["quiet room"],
      adaptations: ["noise_reduction"],
      profileStatus: "current",
      assessedBy: "staff-1",
      assessedDate: daysAgo(1),
      occupationalTherapistInput: false,
      staffTrained: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createProfile error message is a string", async () => {
    const result = await createProfile({
      homeId: "home-1",
      childName: "Bob Jones",
      childId: "child-2",
      sensoryDomain: "tactile",
      sensitivityLevel: "seeking",
      triggers: ["certain fabrics"],
      calmingStrategies: ["deep pressure"],
      adaptations: ["texture_modification", "clothing_adaptation"],
      adaptationDetails: "Soft cotton only",
      profileStatus: "current",
      assessedBy: "staff-2",
      assessedDate: daysAgo(3),
      nextReviewDate: daysFromNow(90),
      occupationalTherapistInput: true,
      staffTrained: true,
      childViews: "I like soft things",
      notes: "Good progress",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── updateProfile ───────────────────────────────────────────────────

  it("updateProfile returns ok: false with error message", async () => {
    const result = await updateProfile("sp-1", { profile_status: "current" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateProfile error message is a string for partial updates", async () => {
    const result = await updateProfile("sp-1", {
      sensitivity_level: "typical",
      notes: "Reassessed",
      staff_trained: true,
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
  it("computeSensoryMetrics with profiles from a single child across all 8 sensory domains", () => {
    const domains: SensoryDomain[] = [
      "visual", "auditory", "tactile", "olfactory",
      "gustatory", "vestibular", "proprioceptive", "interoceptive",
    ];
    const profiles = domains.map((domain, i) =>
      makeProfile({
        id: `sp-${i}`,
        child_id: "c1",
        child_name: "Alice",
        sensory_domain: domain,
        sensitivity_level: "typical",
      }),
    );
    const m = computeSensoryMetrics(profiles, 1);
    expect(m.total_profiles).toBe(8);
    expect(m.children_assessed).toBe(1);
    expect(Object.keys(m.by_sensory_domain)).toHaveLength(8);
  });

  it("computeSensoryMetrics with all profiles at hyper_sensitive", () => {
    const profiles = [
      makeProfile({ id: "sp1", sensitivity_level: "hyper_sensitive" }),
      makeProfile({ id: "sp2", sensitivity_level: "hyper_sensitive", child_id: "c2" }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.hyper_sensitive_count).toBe(2);
    expect(m.hypo_sensitive_count).toBe(0);
    expect(m.seeking_count).toBe(0);
  });

  it("computeSensoryMetrics with all profiles at hypo_sensitive", () => {
    const profiles = [
      makeProfile({ id: "sp1", sensitivity_level: "hypo_sensitive" }),
      makeProfile({ id: "sp2", sensitivity_level: "hypo_sensitive", child_id: "c2" }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.hypo_sensitive_count).toBe(2);
    expect(m.hyper_sensitive_count).toBe(0);
    expect(m.seeking_count).toBe(0);
  });

  it("computeSensoryMetrics with all profiles at seeking", () => {
    const profiles = [
      makeProfile({ id: "sp1", sensitivity_level: "seeking" }),
      makeProfile({ id: "sp2", sensitivity_level: "seeking", child_id: "c2" }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.seeking_count).toBe(2);
    expect(m.hyper_sensitive_count).toBe(0);
    expect(m.hypo_sensitive_count).toBe(0);
  });

  it("computeSensoryMetrics all profiles outdated", () => {
    const profiles = [
      makeProfile({ id: "sp1", profile_status: "outdated" }),
      makeProfile({ id: "sp2", profile_status: "outdated", child_id: "c2" }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.outdated_profiles).toBe(2);
    expect(m.current_profiles).toBe(0);
  });

  it("computeSensoryMetrics all profiles under_review", () => {
    const profiles = [
      makeProfile({ id: "sp1", profile_status: "under_review" }),
      makeProfile({ id: "sp2", profile_status: "under_review", child_id: "c2" }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(m.under_review_count).toBe(2);
    expect(m.current_profiles).toBe(0);
    expect(m.outdated_profiles).toBe(0);
  });

  it("computeSensoryMetrics by_sensitivity_level matches individual counts", () => {
    const profiles = [
      makeProfile({ id: "sp1", sensitivity_level: "hyper_sensitive" }),
      makeProfile({ id: "sp2", sensitivity_level: "hypo_sensitive" }),
      makeProfile({ id: "sp3", sensitivity_level: "seeking" }),
      makeProfile({ id: "sp4", sensitivity_level: "typical" }),
      makeProfile({ id: "sp5", sensitivity_level: "sensitive" }),
    ];
    const m = computeSensoryMetrics(profiles, 5);
    expect(m.by_sensitivity_level["hyper_sensitive"]).toBe(m.hyper_sensitive_count);
    expect(m.by_sensitivity_level["hypo_sensitive"]).toBe(m.hypo_sensitive_count);
    expect(m.by_sensitivity_level["seeking"]).toBe(m.seeking_count);
  });

  it("computeSensoryMetrics with mixed staff_trained and ot_input combinations", () => {
    const profiles = [
      makeProfile({ id: "sp1", staff_trained: true, occupational_therapist_input: true, child_views: "Yes" }),
      makeProfile({ id: "sp2", staff_trained: false, occupational_therapist_input: true, child_views: "Yes" }),
      makeProfile({ id: "sp3", staff_trained: true, occupational_therapist_input: false, child_views: null }),
      makeProfile({ id: "sp4", staff_trained: false, occupational_therapist_input: false, child_views: null }),
    ];
    const m = computeSensoryMetrics(profiles, 4);
    expect(m.staff_trained_rate).toBe(50);
    expect(m.ot_input_rate).toBe(50);
    expect(m.child_views_rate).toBe(50);
  });

  it("identifySensoryAlerts with all five alert types triggered simultaneously", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_id: "c1", child_name: "Alice",
        sensory_domain: "visual", sensitivity_level: "hyper_sensitive",
        profile_status: "outdated", staff_trained: false,
        next_review_date: daysAgo(30),
        adaptations: [] as AdaptationType[],
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 3, now);
    const types = new Set(alerts.map((a) => a.type));
    expect(types.has("no_profile")).toBe(true);
    expect(types.has("profile_outdated")).toBe(true);
    expect(types.has("staff_not_trained")).toBe(true);
    expect(types.has("review_overdue")).toBe(true);
    expect(types.has("no_adaptations")).toBe(true);
    expect(types.size).toBe(5);
  });

  it("identifySensoryAlerts empty profiles with 0 totalChildren produces no alerts", () => {
    const alerts = identifySensoryAlerts([], 0, now);
    expect(alerts).toHaveLength(0);
  });

  it("identifySensoryAlerts review_overdue with date exactly yesterday", () => {
    const profiles = [
      makeProfile({ id: "sp1", next_review_date: daysAgo(1) }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeTruthy();
  });

  it("identifySensoryAlerts review_overdue with date far in the future", () => {
    const profiles = [
      makeProfile({ id: "sp1", next_review_date: daysFromNow(365) }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeUndefined();
  });

  it("identifySensoryAlerts staff_not_trained only for hyper and hypo, not other levels", () => {
    const levels: SensitivityLevel[] = ["hyper_sensitive", "sensitive", "typical", "seeking", "hypo_sensitive"];
    const profiles = levels.map((level, i) =>
      makeProfile({ id: `sp${i}`, sensitivity_level: level, staff_trained: false }),
    );
    const alerts = identifySensoryAlerts(profiles, 5, now);
    const untrained = alerts.filter((a) => a.type === "staff_not_trained");
    expect(untrained).toHaveLength(2);
    const ids = untrained.map((a) => a.id);
    expect(ids).toContain("sp0"); // hyper_sensitive
    expect(ids).toContain("sp4"); // hypo_sensitive
  });

  it("identifySensoryAlerts no_adaptations only for hyper_sensitive, not other levels", () => {
    const levels: SensitivityLevel[] = ["hyper_sensitive", "sensitive", "typical", "seeking", "hypo_sensitive"];
    const profiles = levels.map((level, i) =>
      makeProfile({ id: `sp${i}`, sensitivity_level: level, adaptations: [] as AdaptationType[] }),
    );
    const alerts = identifySensoryAlerts(profiles, 5, now);
    const noAdapt = alerts.filter((a) => a.type === "no_adaptations");
    expect(noAdapt).toHaveLength(1);
    expect(noAdapt[0].id).toBe("sp0"); // hyper_sensitive
  });

  it("computeSensoryMetrics with all 12 adaptation types present across profiles", () => {
    const adaptTypes: AdaptationType[] = [
      "lighting", "noise_reduction", "texture_modification", "temperature_control",
      "space_layout", "colour_scheme", "sensory_equipment", "routine_adjustment",
      "diet_modification", "clothing_adaptation", "transition_support", "other",
    ];
    const profiles = adaptTypes.map((type, i) =>
      makeProfile({ id: `sp${i}`, adaptations: [type] }),
    );
    const m = computeSensoryMetrics(profiles, 12);
    expect(Object.keys(m.by_adaptation_type)).toHaveLength(12);
    for (const type of adaptTypes) {
      expect(m.by_adaptation_type[type]).toBe(1);
    }
  });

  it("computeSensoryMetrics by_sensory_domain with single domain", () => {
    const profiles = [
      makeProfile({ id: "sp1", sensory_domain: "interoceptive" }),
      makeProfile({ id: "sp2", sensory_domain: "interoceptive", child_id: "c2" }),
    ];
    const m = computeSensoryMetrics(profiles, 2);
    expect(Object.keys(m.by_sensory_domain)).toHaveLength(1);
    expect(m.by_sensory_domain["interoceptive"]).toBe(2);
  });

  it("identifySensoryAlerts profile_outdated alert mentions reassessment", () => {
    const profiles = [
      makeProfile({ id: "sp1", child_name: "Alice", sensory_domain: "visual", profile_status: "outdated" }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const outdated = alerts.find((a) => a.type === "profile_outdated");
    expect(outdated!.message).toContain("reassessment");
  });

  it("identifySensoryAlerts staff_not_trained alert mentions training required", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_name: "Alice",
        sensitivity_level: "hyper_sensitive", staff_trained: false,
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const untrained = alerts.find((a) => a.type === "staff_not_trained");
    expect(untrained!.message).toContain("training required");
  });

  it("identifySensoryAlerts no_adaptations alert mentions implement adaptations", () => {
    const profiles = [
      makeProfile({
        id: "sp1", child_name: "Alice", sensory_domain: "visual",
        sensitivity_level: "hyper_sensitive",
        adaptations: [] as AdaptationType[],
      }),
    ];
    const alerts = identifySensoryAlerts(profiles, 1, now);
    const noAdapt = alerts.find((a) => a.type === "no_adaptations");
    expect(noAdapt!.message).toContain("implement adaptations");
  });

  it("identifySensoryAlerts no_profile alert mentions assess sensory needs", () => {
    const alerts = identifySensoryAlerts([], 2, now);
    const gap = alerts.find((a) => a.type === "no_profile");
    expect(gap!.message).toContain("assess sensory needs");
  });

  it("computeSensoryMetrics staff_trained_rate 100 with single trained profile", () => {
    const profiles = [makeProfile({ id: "sp1", staff_trained: true })];
    const m = computeSensoryMetrics(profiles, 1);
    expect(m.staff_trained_rate).toBe(100);
  });

  it("computeSensoryMetrics ot_input_rate 100 with single profile having OT input", () => {
    const profiles = [makeProfile({ id: "sp1", occupational_therapist_input: true })];
    const m = computeSensoryMetrics(profiles, 1);
    expect(m.ot_input_rate).toBe(100);
  });

  it("computeSensoryMetrics child_views_rate 100 with single profile having views", () => {
    const profiles = [makeProfile({ id: "sp1", child_views: "My views" })];
    const m = computeSensoryMetrics(profiles, 1);
    expect(m.child_views_rate).toBe(100);
  });

  it("computeSensoryMetrics assessment_coverage with 1 child in 3 totalChildren", () => {
    const profiles = [makeProfile({ id: "sp1", child_id: "c1" })];
    const m = computeSensoryMetrics(profiles, 3);
    expect(m.assessment_coverage).toBe(33.3);
  });
});
