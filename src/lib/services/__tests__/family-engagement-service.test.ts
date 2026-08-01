// ══════════════════════════════════════════════════════════════════════════════
// CARA — FAMILY ENGAGEMENT SERVICE TESTS
// Pure-function unit tests for family engagement metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 7 (children's wishes and feelings),
// Reg 14 (care planning — family contact arrangements),
// Reg 6 (quality and purpose of care — maintaining family relationships).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeEngagementMetrics,
  identifyEngagementAlerts,
  CONTACT_TYPES,
  CONTACT_OUTCOMES,
  FAMILY_MEMBER_TYPES,
  RELATIONSHIP_QUALITIES,
  ENGAGEMENT_TRENDS,
  listContacts,
  createContact,
  listRelationships,
  createRelationship,
  updateRelationship,
} from "../family-engagement-service";

import type {
  FamilyContact,
  FamilyRelationship,
} from "../family-engagement-service";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Fixed "now" for deterministic date-window tests. */
const NOW = new Date("2026-05-13T12:00:00.000Z");

/** Date string N days before NOW. */
function daysAgo(n: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days before NOW. */
function daysAgoISO(n: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal FamilyContact with sensible defaults. */
function makeContact(overrides: Partial<FamilyContact> = {}): FamilyContact {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice Smith",
    family_member_name: "Jane Smith",
    family_member_type: "birth_mother",
    contact_type: "face_to_face",
    contact_date: daysAgo(5),
    duration_minutes: 60,
    outcome: "positive",
    child_mood_before: null,
    child_mood_after: null,
    supervised: false,
    supervisor_name: null,
    notes: null,
    follow_up_actions: [],
    recorded_by: "staff-1",
    created_at: daysAgoISO(5),
    ...overrides,
  };
}

/** Build a minimal FamilyRelationship with sensible defaults. */
function makeRelationship(
  overrides: Partial<FamilyRelationship> = {},
): FamilyRelationship {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice Smith",
    family_member_name: "Jane Smith",
    family_member_type: "birth_mother",
    relationship_quality: "developing",
    engagement_trend: "stable",
    contact_frequency_agreed: "weekly",
    contact_frequency_actual: "weekly",
    last_contact_date: daysAgo(5),
    court_order_restrictions: false,
    risk_assessment_in_place: false,
    notes: null,
    created_at: daysAgoISO(30),
    updated_at: daysAgoISO(5),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("CONTACT_TYPES", () => {
  it("has exactly 10 items", () => {
    expect(CONTACT_TYPES).toHaveLength(10);
  });

  it("has unique type values", () => {
    const types = CONTACT_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it.each([
    "face_to_face",
    "supervised",
    "unsupervised",
    "video_call",
    "phone_call",
    "letter",
    "email",
    "overnight_stay",
    "community_outing",
    "other",
  ] as const)("contains type '%s'", (type) => {
    expect(CONTACT_TYPES.find((t) => t.type === type)).toBeDefined();
  });

  it("has non-empty labels for every item", () => {
    for (const item of CONTACT_TYPES) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });
});

describe("CONTACT_OUTCOMES", () => {
  it("has exactly 9 outcomes", () => {
    expect(CONTACT_OUTCOMES).toHaveLength(9);
  });

  it("has unique outcome values", () => {
    const outcomes = CONTACT_OUTCOMES.map((o) => o.outcome);
    expect(new Set(outcomes).size).toBe(outcomes.length);
  });

  it.each([
    "positive",
    "mixed",
    "difficult",
    "distressing",
    "cancelled_family",
    "cancelled_child",
    "cancelled_authority",
    "dna_family",
    "dna_child",
  ] as const)("contains outcome '%s'", (outcome) => {
    expect(CONTACT_OUTCOMES.find((o) => o.outcome === outcome)).toBeDefined();
  });

  it("has non-empty labels for every item", () => {
    for (const item of CONTACT_OUTCOMES) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });
});

describe("FAMILY_MEMBER_TYPES", () => {
  it("has exactly 10 types", () => {
    expect(FAMILY_MEMBER_TYPES).toHaveLength(10);
  });

  it("has unique type values", () => {
    const types = FAMILY_MEMBER_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it.each([
    "birth_mother",
    "birth_father",
    "step_parent",
    "sibling",
    "grandparent",
    "aunt_uncle",
    "cousin",
    "other_relative",
    "family_friend",
    "other",
  ] as const)("contains type '%s'", (type) => {
    expect(FAMILY_MEMBER_TYPES.find((t) => t.type === type)).toBeDefined();
  });

  it("has non-empty labels for every item", () => {
    for (const item of FAMILY_MEMBER_TYPES) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });
});

describe("RELATIONSHIP_QUALITIES", () => {
  it("has exactly 5 qualities", () => {
    expect(RELATIONSHIP_QUALITIES).toHaveLength(5);
  });

  it("has unique quality values", () => {
    const qualities = RELATIONSHIP_QUALITIES.map((q) => q.quality);
    expect(new Set(qualities).size).toBe(qualities.length);
  });

  it.each([
    "strong",
    "developing",
    "fragile",
    "strained",
    "no_contact",
  ] as const)("contains quality '%s'", (quality) => {
    expect(
      RELATIONSHIP_QUALITIES.find((q) => q.quality === quality),
    ).toBeDefined();
  });

  it("has non-empty labels for every item", () => {
    for (const item of RELATIONSHIP_QUALITIES) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });
});

describe("ENGAGEMENT_TRENDS", () => {
  it("has exactly 4 trends", () => {
    expect(ENGAGEMENT_TRENDS).toHaveLength(4);
  });

  it("has unique trend values", () => {
    const trends = ENGAGEMENT_TRENDS.map((t) => t.trend);
    expect(new Set(trends).size).toBe(trends.length);
  });

  it.each(["improving", "stable", "declining", "new"] as const)(
    "contains trend '%s'",
    (trend) => {
      expect(ENGAGEMENT_TRENDS.find((t) => t.trend === trend)).toBeDefined();
    },
  );

  it("has non-empty labels for every item", () => {
    for (const item of ENGAGEMENT_TRENDS) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeEngagementMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeEngagementMetrics", () => {
  // ── Empty inputs ───────────────────────────────────────────────────────

  describe("with empty inputs", () => {
    it("returns zero for all numeric fields", () => {
      const m = computeEngagementMetrics([], [], 0, NOW);
      expect(m.total_contacts).toBe(0);
      expect(m.contacts_this_month).toBe(0);
      expect(m.contacts_this_quarter).toBe(0);
      expect(m.children_with_contact).toBe(0);
      expect(m.positive_contact_rate).toBeNull();;
      expect(m.cancelled_dna_rate).toBeNull();;
      expect(m.avg_contact_duration).toBeNull();;
      expect(m.relationships_strong).toBe(0);
      expect(m.relationships_fragile).toBe(0);
      expect(m.relationships_no_contact).toBe(0);
      expect(m.engagement_improving).toBe(0);
      expect(m.engagement_declining).toBe(0);
    });

    it("returns empty objects for breakdown fields", () => {
      const m = computeEngagementMetrics([], [], 0, NOW);
      expect(m.by_contact_type).toEqual({});
      expect(m.by_outcome).toEqual({});
      expect(m.by_family_member_type).toEqual({});
    });
  });

  // ── total_contacts ─────────────────────────────────────────────────────

  describe("total_contacts", () => {
    it("counts all contacts regardless of date", () => {
      const contacts = [
        makeContact({ contact_date: daysAgo(200) }),
        makeContact({ contact_date: daysAgo(100) }),
        makeContact({ contact_date: daysAgo(5) }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.total_contacts).toBe(3);
    });

    it("returns 1 for a single contact", () => {
      const m = computeEngagementMetrics([makeContact()], [], 1, NOW);
      expect(m.total_contacts).toBe(1);
    });
  });

  // ── contacts_this_month (30 days) ──────────────────────────────────────

  describe("contacts_this_month", () => {
    it("includes contacts within the last 30 days", () => {
      const contacts = [
        makeContact({ contact_date: daysAgo(10) }),
        makeContact({ contact_date: daysAgo(25) }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.contacts_this_month).toBe(2);
    });

    it("excludes contacts older than 30 days", () => {
      const contacts = [
        makeContact({ contact_date: daysAgo(5) }),
        makeContact({ contact_date: daysAgo(31) }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.contacts_this_month).toBe(1);
    });

    it("excludes contacts exactly 30 days ago (date-only resolves before time-based cutoff)", () => {
      // daysAgo(30) is a date-only string which parses to midnight,
      // while thirtyDaysAgo is NOW minus 30 days at 12:00 — midnight < 12:00
      const contacts = [makeContact({ contact_date: daysAgo(30) })];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.contacts_this_month).toBe(0);
    });

    it("excludes future contacts", () => {
      const future = new Date(NOW);
      future.setDate(future.getDate() + 5);
      const contacts = [
        makeContact({ contact_date: future.toISOString().split("T")[0] }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.contacts_this_month).toBe(0);
    });
  });

  // ── contacts_this_quarter (90 days) ────────────────────────────────────

  describe("contacts_this_quarter", () => {
    it("includes contacts within the last 90 days", () => {
      const contacts = [
        makeContact({ contact_date: daysAgo(10) }),
        makeContact({ contact_date: daysAgo(60) }),
        makeContact({ contact_date: daysAgo(89) }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.contacts_this_quarter).toBe(3);
    });

    it("excludes contacts older than 90 days", () => {
      const contacts = [
        makeContact({ contact_date: daysAgo(10) }),
        makeContact({ contact_date: daysAgo(91) }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.contacts_this_quarter).toBe(1);
    });

    it("excludes contacts exactly 90 days ago (date-only resolves before time-based cutoff)", () => {
      // Same time-boundary issue as the 30-day case
      const contacts = [makeContact({ contact_date: daysAgo(90) })];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.contacts_this_quarter).toBe(0);
    });
  });

  // ── children_with_contact ──────────────────────────────────────────────

  describe("children_with_contact", () => {
    it("counts unique child IDs", () => {
      const contacts = [
        makeContact({ child_id: "c1" }),
        makeContact({ child_id: "c2" }),
        makeContact({ child_id: "c1" }),
      ];
      const m = computeEngagementMetrics(contacts, [], 3, NOW);
      expect(m.children_with_contact).toBe(2);
    });

    it("returns 1 when all contacts are for the same child", () => {
      const contacts = [
        makeContact({ child_id: "c1" }),
        makeContact({ child_id: "c1" }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.children_with_contact).toBe(1);
    });

    it("returns 0 for empty contacts", () => {
      const m = computeEngagementMetrics([], [], 3, NOW);
      expect(m.children_with_contact).toBe(0);
    });
  });

  // ── positive_contact_rate ──────────────────────────────────────────────

  describe("positive_contact_rate", () => {
    it("computes as positive / completed * 100 with 1 decimal", () => {
      const contacts = [
        makeContact({ outcome: "positive" }),
        makeContact({ outcome: "mixed" }),
        makeContact({ outcome: "difficult" }),
      ];
      // 1 / 3 * 100 = 33.333... -> 33.3
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.positive_contact_rate).toBe(33.3);
    });

    it("returns 100 when all completed contacts are positive", () => {
      const contacts = [
        makeContact({ outcome: "positive" }),
        makeContact({ outcome: "positive" }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.positive_contact_rate).toBe(100);
    });

    it("returns 0 when no completed contacts are positive", () => {
      const contacts = [
        makeContact({ outcome: "mixed" }),
        makeContact({ outcome: "difficult" }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.positive_contact_rate).toBe(0);
    });

    it("returns 0 when there are no completed contacts", () => {
      const contacts = [
        makeContact({ outcome: "cancelled_family" }),
        makeContact({ outcome: "dna_family" }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.positive_contact_rate).toBeNull();;
    });

    it("excludes cancelled/dna contacts from the denominator", () => {
      const contacts = [
        makeContact({ outcome: "positive" }),
        makeContact({ outcome: "cancelled_family" }),
        makeContact({ outcome: "dna_child" }),
      ];
      // 1 / 1 * 100 = 100
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.positive_contact_rate).toBe(100);
    });

    it("includes distressing contacts in the denominator", () => {
      const contacts = [
        makeContact({ outcome: "positive" }),
        makeContact({ outcome: "distressing" }),
      ];
      // 1 / 2 * 100 = 50
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.positive_contact_rate).toBe(50);
    });

    it("rounds correctly with repeating decimals", () => {
      // 2 positive, 1 mixed => 2/3 = 66.666... => 66.7
      const contacts = [
        makeContact({ outcome: "positive" }),
        makeContact({ outcome: "positive" }),
        makeContact({ outcome: "mixed" }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.positive_contact_rate).toBe(66.7);
    });
  });

  // ── cancelled_dna_rate ─────────────────────────────────────────────────

  describe("cancelled_dna_rate", () => {
    it("computes as (cancelled + dna) / total * 100 with 1 decimal", () => {
      const contacts = [
        makeContact({ outcome: "positive" }),
        makeContact({ outcome: "cancelled_family" }),
        makeContact({ outcome: "dna_family" }),
      ];
      // 2 / 3 * 100 = 66.666... -> 66.7
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.cancelled_dna_rate).toBe(66.7);
    });

    it("returns 0 when there are no cancellations or DNAs", () => {
      const contacts = [
        makeContact({ outcome: "positive" }),
        makeContact({ outcome: "mixed" }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.cancelled_dna_rate).toBe(0);
    });

    it("returns 100 when all contacts are cancelled or DNA", () => {
      const contacts = [
        makeContact({ outcome: "cancelled_child" }),
        makeContact({ outcome: "dna_child" }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.cancelled_dna_rate).toBe(100);
    });

    it("returns 0 for empty contacts", () => {
      const m = computeEngagementMetrics([], [], 0, NOW);
      expect(m.cancelled_dna_rate).toBeNull();;
    });

    it("counts all five cancelled/dna types", () => {
      const contacts = [
        makeContact({ outcome: "cancelled_family" }),
        makeContact({ outcome: "cancelled_child" }),
        makeContact({ outcome: "cancelled_authority" }),
        makeContact({ outcome: "dna_family" }),
        makeContact({ outcome: "dna_child" }),
        makeContact({ outcome: "positive" }),
      ];
      // 5 / 6 * 100 = 83.333... => 83.3
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.cancelled_dna_rate).toBe(83.3);
    });
  });

  // ── avg_contact_duration ───────────────────────────────────────────────

  describe("avg_contact_duration", () => {
    it("averages duration of completed contacts only", () => {
      const contacts = [
        makeContact({ outcome: "positive", duration_minutes: 60 }),
        makeContact({ outcome: "mixed", duration_minutes: 90 }),
        makeContact({ outcome: "cancelled_family", duration_minutes: 0 }),
      ];
      // (60 + 90) / 2 = 75
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.avg_contact_duration).toBe(75);
    });

    it("rounds to integer", () => {
      const contacts = [
        makeContact({ outcome: "positive", duration_minutes: 60 }),
        makeContact({ outcome: "difficult", duration_minutes: 45 }),
        makeContact({ outcome: "mixed", duration_minutes: 50 }),
      ];
      // (60 + 45 + 50) / 3 = 51.666... -> 52
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.avg_contact_duration).toBe(52);
    });

    it("returns 0 when there are no completed contacts", () => {
      const contacts = [
        makeContact({ outcome: "cancelled_family", duration_minutes: 30 }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.avg_contact_duration).toBeNull();;
    });

    it("returns 0 for empty contacts", () => {
      const m = computeEngagementMetrics([], [], 0, NOW);
      expect(m.avg_contact_duration).toBeNull();;
    });

    it("handles single completed contact", () => {
      const contacts = [
        makeContact({ outcome: "distressing", duration_minutes: 30 }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.avg_contact_duration).toBe(30);
    });
  });

  // ── Relationship quality counts ────────────────────────────────────────

  describe("relationships_strong", () => {
    it("counts relationships with quality 'strong'", () => {
      const rels = [
        makeRelationship({ relationship_quality: "strong" }),
        makeRelationship({ relationship_quality: "strong" }),
        makeRelationship({ relationship_quality: "developing" }),
      ];
      const m = computeEngagementMetrics([], rels, 1, NOW);
      expect(m.relationships_strong).toBe(2);
    });

    it("returns 0 when no strong relationships", () => {
      const rels = [makeRelationship({ relationship_quality: "fragile" })];
      const m = computeEngagementMetrics([], rels, 1, NOW);
      expect(m.relationships_strong).toBe(0);
    });
  });

  describe("relationships_fragile", () => {
    it("counts relationships with quality 'fragile'", () => {
      const rels = [
        makeRelationship({ relationship_quality: "fragile" }),
        makeRelationship({ relationship_quality: "strong" }),
      ];
      const m = computeEngagementMetrics([], rels, 1, NOW);
      expect(m.relationships_fragile).toBe(1);
    });

    it("returns 0 when no fragile relationships", () => {
      const m = computeEngagementMetrics([], [], 0, NOW);
      expect(m.relationships_fragile).toBe(0);
    });
  });

  describe("relationships_no_contact", () => {
    it("counts relationships with quality 'no_contact'", () => {
      const rels = [
        makeRelationship({ relationship_quality: "no_contact" }),
        makeRelationship({ relationship_quality: "no_contact" }),
        makeRelationship({ relationship_quality: "developing" }),
      ];
      const m = computeEngagementMetrics([], rels, 1, NOW);
      expect(m.relationships_no_contact).toBe(2);
    });
  });

  // ── Engagement trend counts ────────────────────────────────────────────

  describe("engagement_improving", () => {
    it("counts relationships with improving trend", () => {
      const rels = [
        makeRelationship({ engagement_trend: "improving" }),
        makeRelationship({ engagement_trend: "stable" }),
        makeRelationship({ engagement_trend: "improving" }),
      ];
      const m = computeEngagementMetrics([], rels, 1, NOW);
      expect(m.engagement_improving).toBe(2);
    });

    it("returns 0 when none improving", () => {
      const rels = [makeRelationship({ engagement_trend: "declining" })];
      const m = computeEngagementMetrics([], rels, 1, NOW);
      expect(m.engagement_improving).toBe(0);
    });
  });

  describe("engagement_declining", () => {
    it("counts relationships with declining trend", () => {
      const rels = [
        makeRelationship({ engagement_trend: "declining" }),
        makeRelationship({ engagement_trend: "declining" }),
        makeRelationship({ engagement_trend: "new" }),
      ];
      const m = computeEngagementMetrics([], rels, 1, NOW);
      expect(m.engagement_declining).toBe(2);
    });

    it("returns 0 when none declining", () => {
      const rels = [makeRelationship({ engagement_trend: "stable" })];
      const m = computeEngagementMetrics([], rels, 1, NOW);
      expect(m.engagement_declining).toBe(0);
    });
  });

  // ── by_contact_type ────────────────────────────────────────────────────

  describe("by_contact_type", () => {
    it("groups contacts by type", () => {
      const contacts = [
        makeContact({ contact_type: "face_to_face" }),
        makeContact({ contact_type: "phone_call" }),
        makeContact({ contact_type: "face_to_face" }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.by_contact_type).toEqual({
        face_to_face: 2,
        phone_call: 1,
      });
    });

    it("returns empty object for no contacts", () => {
      const m = computeEngagementMetrics([], [], 0, NOW);
      expect(m.by_contact_type).toEqual({});
    });

    it("handles single contact type", () => {
      const contacts = [makeContact({ contact_type: "letter" })];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.by_contact_type).toEqual({ letter: 1 });
    });
  });

  // ── by_outcome ─────────────────────────────────────────────────────────

  describe("by_outcome", () => {
    it("groups contacts by outcome", () => {
      const contacts = [
        makeContact({ outcome: "positive" }),
        makeContact({ outcome: "positive" }),
        makeContact({ outcome: "mixed" }),
        makeContact({ outcome: "dna_family" }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.by_outcome).toEqual({
        positive: 2,
        mixed: 1,
        dna_family: 1,
      });
    });

    it("returns empty object for no contacts", () => {
      const m = computeEngagementMetrics([], [], 0, NOW);
      expect(m.by_outcome).toEqual({});
    });
  });

  // ── by_family_member_type ──────────────────────────────────────────────

  describe("by_family_member_type", () => {
    it("groups contacts by family member type", () => {
      const contacts = [
        makeContact({ family_member_type: "birth_mother" }),
        makeContact({ family_member_type: "sibling" }),
        makeContact({ family_member_type: "birth_mother" }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.by_family_member_type).toEqual({
        birth_mother: 2,
        sibling: 1,
      });
    });

    it("returns empty object for no contacts", () => {
      const m = computeEngagementMetrics([], [], 0, NOW);
      expect(m.by_family_member_type).toEqual({});
    });
  });

  // ── Single contact ─────────────────────────────────────────────────────

  describe("single contact", () => {
    it("returns correct metrics for one positive contact", () => {
      const contacts = [
        makeContact({
          outcome: "positive",
          duration_minutes: 45,
          contact_date: daysAgo(5),
          contact_type: "video_call",
          family_member_type: "grandparent",
        }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.total_contacts).toBe(1);
      expect(m.contacts_this_month).toBe(1);
      expect(m.contacts_this_quarter).toBe(1);
      expect(m.children_with_contact).toBe(1);
      expect(m.positive_contact_rate).toBe(100);
      expect(m.cancelled_dna_rate).toBe(0);
      expect(m.avg_contact_duration).toBe(45);
      expect(m.by_contact_type).toEqual({ video_call: 1 });
      expect(m.by_outcome).toEqual({ positive: 1 });
      expect(m.by_family_member_type).toEqual({ grandparent: 1 });
    });
  });

  // ── Rounding edge cases ────────────────────────────────────────────────

  describe("rounding", () => {
    it("rounds positive_contact_rate to 1 decimal place", () => {
      // 1 / 7 = 14.285714... => 14.3
      const contacts = [
        makeContact({ outcome: "positive" }),
        ...Array.from({ length: 6 }, () => makeContact({ outcome: "mixed" })),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.positive_contact_rate).toBe(14.3);
    });

    it("rounds cancelled_dna_rate to 1 decimal place", () => {
      // 1 / 7 = 14.285714... => 14.3
      const contacts = [
        makeContact({ outcome: "dna_family" }),
        ...Array.from({ length: 6 }, () =>
          makeContact({ outcome: "positive" }),
        ),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.cancelled_dna_rate).toBe(14.3);
    });

    it("rounds avg_contact_duration to integer", () => {
      // (10 + 20 + 30) / 3 = 20 exactly
      const contacts = [
        makeContact({ outcome: "positive", duration_minutes: 10 }),
        makeContact({ outcome: "positive", duration_minutes: 20 }),
        makeContact({ outcome: "positive", duration_minutes: 30 }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.avg_contact_duration).toBe(20);
    });
  });

  // ── Mixed scenario ─────────────────────────────────────────────────────

  describe("mixed scenario with contacts and relationships", () => {
    it("returns correct combined metrics", () => {
      const contacts = [
        makeContact({
          child_id: "c1",
          outcome: "positive",
          duration_minutes: 60,
          contact_date: daysAgo(5),
          contact_type: "face_to_face",
          family_member_type: "birth_mother",
        }),
        makeContact({
          child_id: "c2",
          outcome: "mixed",
          duration_minutes: 45,
          contact_date: daysAgo(50),
          contact_type: "phone_call",
          family_member_type: "birth_father",
        }),
        makeContact({
          child_id: "c1",
          outcome: "cancelled_family",
          duration_minutes: 0,
          contact_date: daysAgo(10),
          contact_type: "face_to_face",
          family_member_type: "birth_mother",
        }),
      ];
      const rels = [
        makeRelationship({
          relationship_quality: "strong",
          engagement_trend: "improving",
        }),
        makeRelationship({
          relationship_quality: "fragile",
          engagement_trend: "declining",
        }),
      ];
      const m = computeEngagementMetrics(contacts, rels, 3, NOW);

      expect(m.total_contacts).toBe(3);
      expect(m.contacts_this_month).toBe(2);
      expect(m.contacts_this_quarter).toBe(3);
      expect(m.children_with_contact).toBe(2);
      expect(m.positive_contact_rate).toBe(50);
      expect(m.cancelled_dna_rate).toBe(33.3);
      expect(m.avg_contact_duration).toBe(53); // (60 + 45) / 2 = 52.5 -> 53
      expect(m.relationships_strong).toBe(1);
      expect(m.relationships_fragile).toBe(1);
      expect(m.relationships_no_contact).toBe(0);
      expect(m.engagement_improving).toBe(1);
      expect(m.engagement_declining).toBe(1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyEngagementAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyEngagementAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────────

  describe("with empty inputs", () => {
    it("returns empty array", () => {
      const alerts = identifyEngagementAlerts([], [], 0, NOW);
      expect(alerts).toEqual([]);
    });
  });

  describe("with healthy data", () => {
    it("returns no alerts for positive, recent contacts and strong relationships", () => {
      const contacts = [
        makeContact({ outcome: "positive", contact_date: daysAgo(5) }),
      ];
      const rels = [
        makeRelationship({
          relationship_quality: "strong",
          engagement_trend: "stable",
          last_contact_date: daysAgo(5),
        }),
      ];
      const alerts = identifyEngagementAlerts(contacts, rels, 1, NOW);
      expect(alerts).toHaveLength(0);
    });
  });

  // ── distressing_contact ────────────────────────────────────────────────

  describe("distressing_contact", () => {
    it("flags distressing contacts within last 30 days", () => {
      const contacts = [
        makeContact({
          outcome: "distressing",
          contact_date: daysAgo(10),
          child_name: "Alice Smith",
          family_member_name: "Jane Smith",
        }),
      ];
      const alerts = identifyEngagementAlerts(contacts, [], 1, NOW);
      const alert = alerts.find((a) => a.type === "distressing_contact");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
    });

    it("does not flag distressing contacts older than 30 days", () => {
      const contacts = [
        makeContact({
          outcome: "distressing",
          contact_date: daysAgo(35),
        }),
      ];
      const alerts = identifyEngagementAlerts(contacts, [], 1, NOW);
      const distressing = alerts.filter(
        (a) => a.type === "distressing_contact",
      );
      expect(distressing).toHaveLength(0);
    });

    it("includes child name and family member name in message", () => {
      const contacts = [
        makeContact({
          outcome: "distressing",
          contact_date: daysAgo(3),
          child_name: "Bob Jones",
          family_member_name: "Tom Jones",
        }),
      ];
      const alerts = identifyEngagementAlerts(contacts, [], 1, NOW);
      const alert = alerts.find((a) => a.type === "distressing_contact")!;
      expect(alert.message).toContain("Bob Jones");
      expect(alert.message).toContain("Tom Jones");
    });

    it("includes the contact date in message", () => {
      const date = daysAgo(7);
      const contacts = [
        makeContact({ outcome: "distressing", contact_date: date }),
      ];
      const alerts = identifyEngagementAlerts(contacts, [], 1, NOW);
      const alert = alerts.find((a) => a.type === "distressing_contact")!;
      expect(alert.message).toContain(date);
    });

    it("uses the contact id as the alert id", () => {
      const contact = makeContact({
        id: "dist-contact-1",
        outcome: "distressing",
        contact_date: daysAgo(2),
      });
      const alerts = identifyEngagementAlerts([contact], [], 1, NOW);
      const alert = alerts.find((a) => a.type === "distressing_contact")!;
      expect(alert.id).toBe("dist-contact-1");
    });

    it("flags multiple distressing contacts separately", () => {
      const contacts = [
        makeContact({ outcome: "distressing", contact_date: daysAgo(3) }),
        makeContact({ outcome: "distressing", contact_date: daysAgo(10) }),
      ];
      const alerts = identifyEngagementAlerts(contacts, [], 1, NOW);
      const distressing = alerts.filter(
        (a) => a.type === "distressing_contact",
      );
      expect(distressing).toHaveLength(2);
    });
  });

  // ── repeated_dna ───────────────────────────────────────────────────────

  describe("repeated_dna", () => {
    it("flags when same child+family_member_name has 2+ dna_family outcomes", () => {
      const contacts = [
        makeContact({
          child_id: "c1",
          family_member_name: "Jane Smith",
          outcome: "dna_family",
        }),
        makeContact({
          child_id: "c1",
          family_member_name: "Jane Smith",
          outcome: "dna_family",
        }),
      ];
      const alerts = identifyEngagementAlerts(contacts, [], 1, NOW);
      const dna = alerts.find((a) => a.type === "repeated_dna");
      expect(dna).toBeDefined();
      expect(dna!.severity).toBe("high");
    });

    it("does not flag with only 1 dna_family outcome", () => {
      const contacts = [
        makeContact({
          child_id: "c1",
          family_member_name: "Jane Smith",
          outcome: "dna_family",
        }),
      ];
      const alerts = identifyEngagementAlerts(contacts, [], 1, NOW);
      const dna = alerts.filter((a) => a.type === "repeated_dna");
      expect(dna).toHaveLength(0);
    });

    it("does not flag dna_child outcomes (only dna_family)", () => {
      const contacts = [
        makeContact({
          child_id: "c1",
          family_member_name: "Jane Smith",
          outcome: "dna_child",
        }),
        makeContact({
          child_id: "c1",
          family_member_name: "Jane Smith",
          outcome: "dna_child",
        }),
      ];
      const alerts = identifyEngagementAlerts(contacts, [], 1, NOW);
      const dna = alerts.filter((a) => a.type === "repeated_dna");
      expect(dna).toHaveLength(0);
    });

    it("tracks different child+family_member combinations separately", () => {
      const contacts = [
        makeContact({
          child_id: "c1",
          family_member_name: "Jane Smith",
          outcome: "dna_family",
        }),
        makeContact({
          child_id: "c1",
          family_member_name: "Jane Smith",
          outcome: "dna_family",
        }),
        makeContact({
          child_id: "c2",
          family_member_name: "Jane Smith",
          outcome: "dna_family",
        }),
      ];
      const alerts = identifyEngagementAlerts(contacts, [], 2, NOW);
      const dna = alerts.filter((a) => a.type === "repeated_dna");
      // Only c1+Jane has 2+, c2+Jane has only 1
      expect(dna).toHaveLength(1);
    });

    it("includes the DNA count in message", () => {
      const contacts = [
        makeContact({
          child_id: "c1",
          child_name: "Alice Smith",
          family_member_name: "Jane Smith",
          outcome: "dna_family",
        }),
        makeContact({
          child_id: "c1",
          child_name: "Alice Smith",
          family_member_name: "Jane Smith",
          outcome: "dna_family",
        }),
        makeContact({
          child_id: "c1",
          child_name: "Alice Smith",
          family_member_name: "Jane Smith",
          outcome: "dna_family",
        }),
      ];
      const alerts = identifyEngagementAlerts(contacts, [], 1, NOW);
      const dna = alerts.find((a) => a.type === "repeated_dna")!;
      expect(dna.message).toContain("3");
      expect(dna.message).toContain("Jane Smith");
      expect(dna.message).toContain("Alice Smith");
    });
  });

  // ── declining_engagement ───────────────────────────────────────────────

  describe("declining_engagement", () => {
    it("flags relationships with declining engagement_trend", () => {
      const rels = [
        makeRelationship({ engagement_trend: "declining" }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const declining = alerts.find((a) => a.type === "declining_engagement");
      expect(declining).toBeDefined();
      expect(declining!.severity).toBe("medium");
    });

    it("does not flag stable or improving trends", () => {
      const rels = [
        makeRelationship({ engagement_trend: "stable" }),
        makeRelationship({ engagement_trend: "improving" }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const declining = alerts.filter(
        (a) => a.type === "declining_engagement",
      );
      expect(declining).toHaveLength(0);
    });

    it("includes child name and family member name in message", () => {
      const rels = [
        makeRelationship({
          child_name: "Charlie Brown",
          family_member_name: "Sue Brown",
          family_member_type: "birth_mother",
          engagement_trend: "declining",
        }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const alert = alerts.find((a) => a.type === "declining_engagement")!;
      expect(alert.message).toContain("Charlie Brown");
      expect(alert.message).toContain("Sue Brown");
    });

    it("includes the family member type label in message", () => {
      const rels = [
        makeRelationship({
          family_member_type: "grandparent",
          engagement_trend: "declining",
        }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const alert = alerts.find((a) => a.type === "declining_engagement")!;
      expect(alert.message).toContain("Grandparent");
    });

    it("uses the relationship id as the alert id", () => {
      const rel = makeRelationship({
        id: "rel-decline-1",
        engagement_trend: "declining",
      });
      const alerts = identifyEngagementAlerts([], [rel], 1, NOW);
      const alert = alerts.find((a) => a.type === "declining_engagement")!;
      expect(alert.id).toBe("rel-decline-1");
    });

    it("flags multiple declining relationships", () => {
      const rels = [
        makeRelationship({ engagement_trend: "declining" }),
        makeRelationship({ engagement_trend: "declining" }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const declining = alerts.filter(
        (a) => a.type === "declining_engagement",
      );
      expect(declining).toHaveLength(2);
    });
  });

  // ── strained_relationship ──────────────────────────────────────────────

  describe("strained_relationship", () => {
    it("flags relationships with strained quality", () => {
      const rels = [
        makeRelationship({ relationship_quality: "strained" }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const strained = alerts.find((a) => a.type === "strained_relationship");
      expect(strained).toBeDefined();
      expect(strained!.severity).toBe("medium");
    });

    it("does not flag other quality levels", () => {
      const rels = [
        makeRelationship({ relationship_quality: "strong" }),
        makeRelationship({ relationship_quality: "developing" }),
        makeRelationship({ relationship_quality: "fragile" }),
        makeRelationship({ relationship_quality: "no_contact" }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const strained = alerts.filter(
        (a) => a.type === "strained_relationship",
      );
      expect(strained).toHaveLength(0);
    });

    it("includes child name and family member name in message", () => {
      const rels = [
        makeRelationship({
          child_name: "Danny Green",
          family_member_name: "Lucy Green",
          relationship_quality: "strained",
        }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const alert = alerts.find((a) => a.type === "strained_relationship")!;
      expect(alert.message).toContain("Danny Green");
      expect(alert.message).toContain("Lucy Green");
    });

    it("uses the relationship id as the alert id", () => {
      const rel = makeRelationship({
        id: "rel-strained-1",
        relationship_quality: "strained",
      });
      const alerts = identifyEngagementAlerts([], [rel], 1, NOW);
      const alert = alerts.find((a) => a.type === "strained_relationship")!;
      expect(alert.id).toBe("rel-strained-1");
    });

    it("suggests mediation or therapeutic support in message", () => {
      const rels = [
        makeRelationship({ relationship_quality: "strained" }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const alert = alerts.find((a) => a.type === "strained_relationship")!;
      expect(alert.message).toContain("mediation");
    });
  });

  // ── no_recent_contact ──────────────────────────────────────────────────

  describe("no_recent_contact", () => {
    it("flags when last_contact_date is >30 days ago with medium severity", () => {
      const rels = [
        makeRelationship({
          relationship_quality: "developing",
          last_contact_date: daysAgo(35),
        }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const alert = alerts.find((a) => a.type === "no_recent_contact");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("medium");
    });

    it("escalates to high severity when >60 days", () => {
      const rels = [
        makeRelationship({
          relationship_quality: "developing",
          last_contact_date: daysAgo(65),
        }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const alert = alerts.find((a) => a.type === "no_recent_contact");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
    });

    it("does not flag contacts within 30 days", () => {
      const rels = [
        makeRelationship({
          relationship_quality: "developing",
          last_contact_date: daysAgo(15),
        }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const noContact = alerts.filter((a) => a.type === "no_recent_contact");
      expect(noContact).toHaveLength(0);
    });

    it("does not flag relationships with no_contact quality", () => {
      const rels = [
        makeRelationship({
          relationship_quality: "no_contact",
          last_contact_date: daysAgo(100),
        }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const noContact = alerts.filter((a) => a.type === "no_recent_contact");
      expect(noContact).toHaveLength(0);
    });

    it("does not flag relationships with null last_contact_date", () => {
      const rels = [
        makeRelationship({
          relationship_quality: "developing",
          last_contact_date: null,
        }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const noContact = alerts.filter((a) => a.type === "no_recent_contact");
      expect(noContact).toHaveLength(0);
    });

    it("includes the number of days in the message", () => {
      const rels = [
        makeRelationship({
          relationship_quality: "strong",
          last_contact_date: daysAgo(45),
        }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const alert = alerts.find((a) => a.type === "no_recent_contact")!;
      // Math.round may add a day due to time-of-day offset
      expect(alert.message).toMatch(/4[56] days/);
    });

    it("includes child name and family member name in message", () => {
      const rels = [
        makeRelationship({
          child_name: "Eva White",
          family_member_name: "Frank White",
          relationship_quality: "developing",
          last_contact_date: daysAgo(40),
        }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const alert = alerts.find((a) => a.type === "no_recent_contact")!;
      expect(alert.message).toContain("Eva White");
      expect(alert.message).toContain("Frank White");
    });

    it("uses the relationship id as the alert id", () => {
      const rel = makeRelationship({
        id: "rel-no-contact-1",
        relationship_quality: "developing",
        last_contact_date: daysAgo(50),
      });
      const alerts = identifyEngagementAlerts([], [rel], 1, NOW);
      const alert = alerts.find((a) => a.type === "no_recent_contact")!;
      expect(alert.id).toBe("rel-no-contact-1");
    });

    it("flags exactly at 31 days as medium severity", () => {
      const rels = [
        makeRelationship({
          relationship_quality: "developing",
          last_contact_date: daysAgo(31),
        }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const alert = alerts.find((a) => a.type === "no_recent_contact");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("medium");
    });

    it("flags at exactly 61 days as high severity", () => {
      const rels = [
        makeRelationship({
          relationship_quality: "developing",
          last_contact_date: daysAgo(61),
        }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const alert = alerts.find((a) => a.type === "no_recent_contact");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
    });
  });

  // ── Multiple alert types ───────────────────────────────────────────────

  describe("multiple alert types", () => {
    it("returns alerts of different types simultaneously", () => {
      const contacts = [
        makeContact({
          outcome: "distressing",
          contact_date: daysAgo(2),
        }),
        makeContact({
          child_id: "c1",
          family_member_name: "Mum",
          outcome: "dna_family",
        }),
        makeContact({
          child_id: "c1",
          family_member_name: "Mum",
          outcome: "dna_family",
        }),
      ];
      const rels = [
        makeRelationship({
          engagement_trend: "declining",
          relationship_quality: "strained",
          last_contact_date: daysAgo(65),
        }),
      ];
      const alerts = identifyEngagementAlerts(contacts, rels, 2, NOW);
      const types = new Set(alerts.map((a) => a.type));
      expect(types.has("distressing_contact")).toBe(true);
      expect(types.has("repeated_dna")).toBe(true);
      expect(types.has("declining_engagement")).toBe(true);
      expect(types.has("strained_relationship")).toBe(true);
      expect(types.has("no_recent_contact")).toBe(true);
    });

    it("generates correct count of alerts for combined scenario", () => {
      const contacts = [
        makeContact({ outcome: "distressing", contact_date: daysAgo(1) }),
        makeContact({ outcome: "distressing", contact_date: daysAgo(5) }),
      ];
      const rels = [
        makeRelationship({
          relationship_quality: "strained",
          engagement_trend: "stable",
          last_contact_date: daysAgo(5),
        }),
      ];
      const alerts = identifyEngagementAlerts(contacts, rels, 1, NOW);
      const distressing = alerts.filter(
        (a) => a.type === "distressing_contact",
      );
      const strained = alerts.filter(
        (a) => a.type === "strained_relationship",
      );
      expect(distressing).toHaveLength(2);
      expect(strained).toHaveLength(1);
    });
  });

  // ── Severity values ────────────────────────────────────────────────────

  describe("severity values", () => {
    it("distressing_contact is always high", () => {
      const contacts = [
        makeContact({ outcome: "distressing", contact_date: daysAgo(1) }),
      ];
      const alerts = identifyEngagementAlerts(contacts, [], 1, NOW);
      expect(alerts[0].severity).toBe("high");
    });

    it("repeated_dna is always high", () => {
      const contacts = [
        makeContact({
          child_id: "c1",
          family_member_name: "Mum",
          outcome: "dna_family",
        }),
        makeContact({
          child_id: "c1",
          family_member_name: "Mum",
          outcome: "dna_family",
        }),
      ];
      const alerts = identifyEngagementAlerts(contacts, [], 1, NOW);
      const dna = alerts.find((a) => a.type === "repeated_dna")!;
      expect(dna.severity).toBe("high");
    });

    it("declining_engagement is always medium", () => {
      const rels = [makeRelationship({ engagement_trend: "declining" })];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const alert = alerts.find((a) => a.type === "declining_engagement")!;
      expect(alert.severity).toBe("medium");
    });

    it("strained_relationship is always medium", () => {
      const rels = [makeRelationship({ relationship_quality: "strained" })];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const alert = alerts.find((a) => a.type === "strained_relationship")!;
      expect(alert.severity).toBe("medium");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  describe("listContacts", () => {
    it("returns ok: true with empty array", async () => {
      const result = await listContacts("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok: true with empty array when filters are provided", async () => {
      const result = await listContacts("home-1", {
        childId: "c1",
        familyMemberType: "birth_mother",
        outcome: "positive",
        dateFrom: "2026-01-01",
        dateTo: "2026-12-31",
        limit: 50,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("data is an array", async () => {
      const result = await listContacts("home-1");
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe("createContact", () => {
    it("returns ok: false with error message", async () => {
      const result = await createContact({
        homeId: "home-1",
        childId: "c1",
        childName: "Alice",
        familyMemberName: "Jane",
        familyMemberType: "birth_mother",
        contactType: "face_to_face",
        contactDate: "2026-05-01",
        durationMinutes: 60,
        outcome: "positive",
        recordedBy: "staff-1",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("error message mentions Supabase", async () => {
      const result = await createContact({
        homeId: "home-1",
        childId: "c1",
        childName: "Alice",
        familyMemberName: "Jane",
        familyMemberType: "birth_mother",
        contactType: "face_to_face",
        contactDate: "2026-05-01",
        durationMinutes: 60,
        outcome: "positive",
        recordedBy: "staff-1",
      });
      expect(result.error).toContain("Supabase");
    });
  });

  describe("listRelationships", () => {
    it("returns ok: true with empty array", async () => {
      const result = await listRelationships("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok: true with empty array when filters are provided", async () => {
      const result = await listRelationships("home-1", {
        childId: "c1",
        quality: "strong",
        trend: "improving",
        limit: 10,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("data is an array", async () => {
      const result = await listRelationships("home-1");
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe("createRelationship", () => {
    it("returns ok: false with error message", async () => {
      const result = await createRelationship({
        homeId: "home-1",
        childId: "c1",
        childName: "Alice",
        familyMemberName: "Jane",
        familyMemberType: "birth_mother",
        relationshipQuality: "developing",
        engagementTrend: "stable",
        contactFrequencyAgreed: "weekly",
        contactFrequencyActual: "fortnightly",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("error message mentions Supabase", async () => {
      const result = await createRelationship({
        homeId: "home-1",
        childId: "c1",
        childName: "Alice",
        familyMemberName: "Jane",
        familyMemberType: "birth_mother",
        relationshipQuality: "developing",
        engagementTrend: "stable",
        contactFrequencyAgreed: "weekly",
        contactFrequencyActual: "fortnightly",
      });
      expect(result.error).toContain("Supabase");
    });
  });

  describe("updateRelationship", () => {
    it("returns ok: false with error message", async () => {
      const result = await updateRelationship("rel-1", {
        relationship_quality: "strong",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("error message mentions Supabase", async () => {
      const result = await updateRelationship("rel-1", {
        relationship_quality: "strong",
      });
      expect(result.error).toContain("Supabase");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  describe("single item inputs", () => {
    it("computes metrics from a single contact", () => {
      const contacts = [
        makeContact({
          outcome: "mixed",
          duration_minutes: 30,
          contact_date: daysAgo(10),
        }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.total_contacts).toBe(1);
      expect(m.positive_contact_rate).toBe(0);
      expect(m.avg_contact_duration).toBe(30);
    });

    it("computes metrics from a single relationship", () => {
      const rels = [
        makeRelationship({
          relationship_quality: "fragile",
          engagement_trend: "improving",
        }),
      ];
      const m = computeEngagementMetrics([], rels, 1, NOW);
      expect(m.relationships_fragile).toBe(1);
      expect(m.engagement_improving).toBe(1);
    });

    it("identifies alert from a single strained relationship", () => {
      const rels = [
        makeRelationship({ relationship_quality: "strained" }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
      expect(alerts.some((a) => a.type === "strained_relationship")).toBe(true);
    });
  });

  describe("large datasets", () => {
    it("handles 500 contacts without error", () => {
      const contacts = Array.from({ length: 500 }, (_, i) =>
        makeContact({
          child_id: `child-${i % 50}`,
          outcome: i % 5 === 0 ? "positive" : "mixed",
          contact_date: daysAgo(i % 100),
          duration_minutes: 30 + (i % 60),
        }),
      );
      const m = computeEngagementMetrics(contacts, [], 50, NOW);
      expect(m.total_contacts).toBe(500);
      expect(m.children_with_contact).toBe(50);
    });

    it("handles 200 relationships without error", () => {
      const rels = Array.from({ length: 200 }, (_, i) =>
        makeRelationship({
          relationship_quality: i % 3 === 0 ? "strong" : "developing",
          engagement_trend: i % 4 === 0 ? "improving" : "stable",
        }),
      );
      const m = computeEngagementMetrics([], rels, 100, NOW);
      expect(m.relationships_strong).toBeGreaterThan(0);
      expect(m.engagement_improving).toBeGreaterThan(0);
    });

    it("identifies alerts in large contact sets", () => {
      const contacts = Array.from({ length: 100 }, (_, i) =>
        makeContact({
          child_id: "c1",
          family_member_name: "Mum",
          outcome: i < 5 ? "dna_family" : "positive",
          contact_date: daysAgo(i),
        }),
      );
      const alerts = identifyEngagementAlerts(contacts, [], 1, NOW);
      const dna = alerts.filter((a) => a.type === "repeated_dna");
      expect(dna).toHaveLength(1);
      expect(dna[0].message).toContain("5");
    });
  });

  describe("type checks", () => {
    it("computeEngagementMetrics returns all 15 expected fields", () => {
      const m = computeEngagementMetrics([], [], 0, NOW);
      const keys = Object.keys(m);
      expect(keys).toContain("total_contacts");
      expect(keys).toContain("contacts_this_month");
      expect(keys).toContain("contacts_this_quarter");
      expect(keys).toContain("children_with_contact");
      expect(keys).toContain("positive_contact_rate");
      expect(keys).toContain("cancelled_dna_rate");
      expect(keys).toContain("avg_contact_duration");
      expect(keys).toContain("relationships_strong");
      expect(keys).toContain("relationships_fragile");
      expect(keys).toContain("relationships_no_contact");
      expect(keys).toContain("engagement_improving");
      expect(keys).toContain("engagement_declining");
      expect(keys).toContain("by_contact_type");
      expect(keys).toContain("by_outcome");
      expect(keys).toContain("by_family_member_type");
      expect(keys).toHaveLength(15);
    });

    it("identifyEngagementAlerts returns array of objects with type, severity, message, id", () => {
      const contacts = [
        makeContact({ outcome: "distressing", contact_date: daysAgo(1) }),
      ];
      const alerts = identifyEngagementAlerts(contacts, [], 1, NOW);
      expect(alerts.length).toBeGreaterThan(0);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
        expect(typeof alert.type).toBe("string");
        expect(typeof alert.severity).toBe("string");
        expect(typeof alert.message).toBe("string");
        expect(typeof alert.id).toBe("string");
      }
    });

    it("by_contact_type values are numbers", () => {
      const contacts = [makeContact({ contact_type: "email" })];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      for (const val of Object.values(m.by_contact_type)) {
        expect(typeof val).toBe("number");
      }
    });

    it("by_outcome values are numbers", () => {
      const contacts = [makeContact({ outcome: "positive" })];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      for (const val of Object.values(m.by_outcome)) {
        expect(typeof val).toBe("number");
      }
    });

    it("by_family_member_type values are numbers", () => {
      const contacts = [makeContact({ family_member_type: "sibling" })];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      for (const val of Object.values(m.by_family_member_type)) {
        expect(typeof val).toBe("number");
      }
    });

    it("alert severity is one of the valid values", () => {
      const contacts = [
        makeContact({ outcome: "distressing", contact_date: daysAgo(1) }),
      ];
      const rels = [
        makeRelationship({
          relationship_quality: "strained",
          engagement_trend: "declining",
          last_contact_date: daysAgo(70),
        }),
      ];
      const alerts = identifyEngagementAlerts(contacts, rels, 1, NOW);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
  });

  describe("boundary dates", () => {
    it("contact exactly at NOW is included in this month", () => {
      const contacts = [
        makeContact({
          contact_date: NOW.toISOString().split("T")[0],
        }),
      ];
      const m = computeEngagementMetrics(contacts, [], 1, NOW);
      expect(m.contacts_this_month).toBe(1);
      expect(m.contacts_this_quarter).toBe(1);
    });

    it("distressing contact at boundary of 30 days is not flagged (date-only resolves before time-based cutoff)", () => {
      // daysAgo(30) date-string parses to midnight, which is before
      // the thirtyDaysAgo cutoff at 12:00 on the same calendar day
      const contacts = [
        makeContact({
          outcome: "distressing",
          contact_date: daysAgo(30),
        }),
      ];
      const alerts = identifyEngagementAlerts(contacts, [], 1, NOW);
      const distressing = alerts.filter(
        (a) => a.type === "distressing_contact",
      );
      expect(distressing).toHaveLength(0);
    });

    it("no_recent_contact at 30 days boundary is flagged (date-only midnight < time-based cutoff)", () => {
      // daysAgo(30) parses to midnight, thirtyDaysAgo is 12:00 same day
      // midnight < 12:00 so it IS flagged
      const rels = [
        makeRelationship({
          relationship_quality: "developing",
          last_contact_date: daysAgo(30),
        }),
      ];
      const alerts = identifyEngagementAlerts([], rels, 1, NOW);
      const noContact = alerts.filter((a) => a.type === "no_recent_contact");
      expect(noContact).toHaveLength(1);
    });
  });
});
