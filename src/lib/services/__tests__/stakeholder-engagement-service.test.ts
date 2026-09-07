// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAKEHOLDER ENGAGEMENT SERVICE TESTS
// Pure-function unit tests for stakeholder engagement metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 45 (independent person — collaboration),
// Reg 44 (visiting requirements), Reg 36 (notifications to stakeholders),
// Reg 14 (care planning — multi-agency working).
// SCCIF: Well-Led — "The home works effectively with external agencies."
// Helped & Protected — "Children benefit from effective multi-agency working."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import { todayStr } from "@/lib/utils";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  STAKEHOLDER_TYPES,
  ENGAGEMENT_METHODS,
  RELATIONSHIP_QUALITIES,
  FEEDBACK_RATINGS,
  listContacts,
  createContact,
  listFeedback,
  createFeedback,
} from "../stakeholder-engagement-service";

import type {
  StakeholderContact,
  StakeholderFeedback,
} from "../stakeholder-engagement-service";

const { computeEngagementMetrics, identifyEngagementAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  // UTC throughout: parsing todayStr() gives UTC midnight, so the day shift
  // must stay in UTC too — a local setDate lands an hour off across a DST
  // boundary and toISOString().slice(0,10) then names the wrong day.
  const [y, m, d] = todayStr().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  // UTC throughout: parsing todayStr() gives UTC midnight, so the day shift
  // must stay in UTC too — a local setDate lands an hour off across a DST
  // boundary and toISOString().slice(0,10) then names the wrong day.
  const [y, m, d] = todayStr().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal StakeholderContact with sensible defaults. */
function makeContact(overrides: Partial<StakeholderContact> = {}): StakeholderContact {
  return {
    id: "contact-1",
    home_id: "home-1",
    stakeholder_type: "social_worker",
    stakeholder_name: "Jane Smith",
    organisation: "Local Authority",
    child_id: null,
    child_name: null,
    contact_date: daysAgo(5),
    engagement_method: "phone",
    initiated_by: "home",
    purpose: "Placement review",
    summary: "Discussed child progress",
    outcomes: null,
    actions_agreed: [],
    follow_up_date: null,
    follow_up_completed: false,
    staff_member: "staff-1",
    notes: null,
    created_at: daysAgoISO(5),
    ...overrides,
  };
}

/** Build a minimal StakeholderFeedback with sensible defaults. */
function makeFeedback(overrides: Partial<StakeholderFeedback> = {}): StakeholderFeedback {
  return {
    id: "fb-1",
    home_id: "home-1",
    stakeholder_type: "social_worker",
    stakeholder_name: "Jane Smith",
    organisation: "Local Authority",
    feedback_date: daysAgo(3),
    rating: "satisfied",
    communication_rating: "satisfied",
    responsiveness_rating: "satisfied",
    information_sharing_rating: "satisfied",
    overall_relationship: "good",
    strengths: null,
    areas_for_improvement: null,
    comments: null,
    collected_by: "staff-1",
    created_at: daysAgoISO(3),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("STAKEHOLDER_TYPES", () => {
  it("has exactly 13 types", () => {
    expect(STAKEHOLDER_TYPES).toHaveLength(13);
  });

  it("contains unique type values", () => {
    const values = STAKEHOLDER_TYPES.map((s) => s.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = STAKEHOLDER_TYPES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes social_worker", () => {
    expect(STAKEHOLDER_TYPES.find((s) => s.type === "social_worker")).toBeTruthy();
  });

  it("includes placing_authority", () => {
    expect(STAKEHOLDER_TYPES.find((s) => s.type === "placing_authority")).toBeTruthy();
  });

  it("includes parent_carer", () => {
    expect(STAKEHOLDER_TYPES.find((s) => s.type === "parent_carer")).toBeTruthy();
  });

  it("includes iro", () => {
    expect(STAKEHOLDER_TYPES.find((s) => s.type === "iro")).toBeTruthy();
  });

  it("includes advocate", () => {
    expect(STAKEHOLDER_TYPES.find((s) => s.type === "advocate")).toBeTruthy();
  });

  it("includes camhs", () => {
    expect(STAKEHOLDER_TYPES.find((s) => s.type === "camhs")).toBeTruthy();
  });

  it("includes school", () => {
    expect(STAKEHOLDER_TYPES.find((s) => s.type === "school")).toBeTruthy();
  });

  it("includes health_professional", () => {
    expect(STAKEHOLDER_TYPES.find((s) => s.type === "health_professional")).toBeTruthy();
  });

  it("includes police", () => {
    expect(STAKEHOLDER_TYPES.find((s) => s.type === "police")).toBeTruthy();
  });

  it("includes ofsted", () => {
    expect(STAKEHOLDER_TYPES.find((s) => s.type === "ofsted")).toBeTruthy();
  });

  it("includes legal", () => {
    expect(STAKEHOLDER_TYPES.find((s) => s.type === "legal")).toBeTruthy();
  });

  it("includes voluntary_sector", () => {
    expect(STAKEHOLDER_TYPES.find((s) => s.type === "voluntary_sector")).toBeTruthy();
  });

  it("includes other", () => {
    expect(STAKEHOLDER_TYPES.find((s) => s.type === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of STAKEHOLDER_TYPES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("ENGAGEMENT_METHODS", () => {
  it("has exactly 9 methods", () => {
    expect(ENGAGEMENT_METHODS).toHaveLength(9);
  });

  it("contains unique method values", () => {
    const values = ENGAGEMENT_METHODS.map((m) => m.method);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = ENGAGEMENT_METHODS.map((m) => m.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes phone", () => {
    expect(ENGAGEMENT_METHODS.find((m) => m.method === "phone")).toBeTruthy();
  });

  it("includes email", () => {
    expect(ENGAGEMENT_METHODS.find((m) => m.method === "email")).toBeTruthy();
  });

  it("includes meeting", () => {
    expect(ENGAGEMENT_METHODS.find((m) => m.method === "meeting")).toBeTruthy();
  });

  it("includes video_call", () => {
    expect(ENGAGEMENT_METHODS.find((m) => m.method === "video_call")).toBeTruthy();
  });

  it("includes letter", () => {
    expect(ENGAGEMENT_METHODS.find((m) => m.method === "letter")).toBeTruthy();
  });

  it("includes visit", () => {
    expect(ENGAGEMENT_METHODS.find((m) => m.method === "visit")).toBeTruthy();
  });

  it("includes conference", () => {
    expect(ENGAGEMENT_METHODS.find((m) => m.method === "conference")).toBeTruthy();
  });

  it("includes report", () => {
    expect(ENGAGEMENT_METHODS.find((m) => m.method === "report")).toBeTruthy();
  });

  it("includes other", () => {
    expect(ENGAGEMENT_METHODS.find((m) => m.method === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const m of ENGAGEMENT_METHODS) {
      expect(m.label.length).toBeGreaterThan(0);
    }
  });
});

describe("RELATIONSHIP_QUALITIES", () => {
  it("has exactly 5 qualities", () => {
    expect(RELATIONSHIP_QUALITIES).toHaveLength(5);
  });

  it("contains unique quality values", () => {
    const values = RELATIONSHIP_QUALITIES.map((q) => q.quality);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = RELATIONSHIP_QUALITIES.map((q) => q.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes excellent", () => {
    expect(RELATIONSHIP_QUALITIES.find((q) => q.quality === "excellent")).toBeTruthy();
  });

  it("includes good", () => {
    expect(RELATIONSHIP_QUALITIES.find((q) => q.quality === "good")).toBeTruthy();
  });

  it("includes adequate", () => {
    expect(RELATIONSHIP_QUALITIES.find((q) => q.quality === "adequate")).toBeTruthy();
  });

  it("includes strained", () => {
    expect(RELATIONSHIP_QUALITIES.find((q) => q.quality === "strained")).toBeTruthy();
  });

  it("includes poor", () => {
    expect(RELATIONSHIP_QUALITIES.find((q) => q.quality === "poor")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const q of RELATIONSHIP_QUALITIES) {
      expect(q.label.length).toBeGreaterThan(0);
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

  it("includes very_satisfied", () => {
    expect(FEEDBACK_RATINGS.find((r) => r.rating === "very_satisfied")).toBeTruthy();
  });

  it("includes satisfied", () => {
    expect(FEEDBACK_RATINGS.find((r) => r.rating === "satisfied")).toBeTruthy();
  });

  it("includes neutral", () => {
    expect(FEEDBACK_RATINGS.find((r) => r.rating === "neutral")).toBeTruthy();
  });

  it("includes dissatisfied", () => {
    expect(FEEDBACK_RATINGS.find((r) => r.rating === "dissatisfied")).toBeTruthy();
  });

  it("includes very_dissatisfied", () => {
    expect(FEEDBACK_RATINGS.find((r) => r.rating === "very_dissatisfied")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const r of FEEDBACK_RATINGS) {
      expect(r.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeEngagementMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeEngagementMetrics", () => {
  // ── Zeroed baseline ──────────────────────────────────────────────────

  it("returns zeroed metrics for empty arrays", () => {
    const m = computeEngagementMetrics([], []);
    expect(m.total_contacts).toBe(0);
    expect(m.contacts_this_month).toBe(0);
    expect(m.unique_stakeholders).toBe(0);
    expect(m.home_initiated_rate).toBeNull();;
    expect(m.follow_up_completion_rate).toBeNull();;
    expect(m.overdue_follow_ups).toBe(0);
    expect(m.avg_satisfaction_score).toBeNull();;
    expect(m.feedback_count).toBe(0);
    expect(Object.keys(m.by_stakeholder_type)).toHaveLength(0);
    expect(Object.keys(m.by_engagement_method)).toHaveLength(0);
    expect(Object.keys(m.relationship_distribution)).toHaveLength(0);
  });

  // ── total_contacts ───────────────────────────────────────────────────

  it("counts total contacts", () => {
    const contacts = [
      makeContact({ id: "c1" }),
      makeContact({ id: "c2" }),
      makeContact({ id: "c3" }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.total_contacts).toBe(3);
  });

  it("counts total contacts with single entry", () => {
    const m = computeEngagementMetrics([makeContact()], []);
    expect(m.total_contacts).toBe(1);
  });

  // ── contacts_this_month ──────────────────────────────────────────────

  it("counts contacts within the last 30 days", () => {
    const contacts = [
      makeContact({ id: "c1", contact_date: daysAgo(5) }),
      makeContact({ id: "c2", contact_date: daysAgo(15) }),
      makeContact({ id: "c3", contact_date: daysAgo(25) }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.contacts_this_month).toBe(3);
  });

  it("excludes contacts older than 30 days", () => {
    const contacts = [
      makeContact({ id: "c1", contact_date: daysAgo(5) }),
      makeContact({ id: "c2", contact_date: daysAgo(60) }),
      makeContact({ id: "c3", contact_date: daysAgo(90) }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.contacts_this_month).toBe(1);
  });

  it("returns 0 contacts this month when all are old", () => {
    const contacts = [
      makeContact({ id: "c1", contact_date: daysAgo(45) }),
      makeContact({ id: "c2", contact_date: daysAgo(60) }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.contacts_this_month).toBe(0);
  });

  it("counts today's contact as this month", () => {
    const contacts = [makeContact({ id: "c1", contact_date: daysAgo(0) })];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.contacts_this_month).toBe(1);
  });

  // ── unique_stakeholders ──────────────────────────────────────────────

  it("counts unique stakeholder names", () => {
    const contacts = [
      makeContact({ id: "c1", stakeholder_name: "Jane Smith" }),
      makeContact({ id: "c2", stakeholder_name: "John Doe" }),
      makeContact({ id: "c3", stakeholder_name: "Jane Smith" }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.unique_stakeholders).toBe(2);
  });

  it("counts all as unique when names differ", () => {
    const contacts = [
      makeContact({ id: "c1", stakeholder_name: "Alice" }),
      makeContact({ id: "c2", stakeholder_name: "Bob" }),
      makeContact({ id: "c3", stakeholder_name: "Charlie" }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.unique_stakeholders).toBe(3);
  });

  it("returns 1 unique stakeholder when all same name", () => {
    const contacts = [
      makeContact({ id: "c1", stakeholder_name: "Same Person" }),
      makeContact({ id: "c2", stakeholder_name: "Same Person" }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.unique_stakeholders).toBe(1);
  });

  it("returns 0 unique stakeholders when no contacts", () => {
    const m = computeEngagementMetrics([], []);
    expect(m.unique_stakeholders).toBe(0);
  });

  // ── by_stakeholder_type ──────────────────────────────────────────────

  it("tallies contacts by stakeholder type", () => {
    const contacts = [
      makeContact({ id: "c1", stakeholder_type: "social_worker" }),
      makeContact({ id: "c2", stakeholder_type: "social_worker" }),
      makeContact({ id: "c3", stakeholder_type: "school" }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.by_stakeholder_type["social_worker"]).toBe(2);
    expect(m.by_stakeholder_type["school"]).toBe(1);
  });

  it("only includes types that exist in data", () => {
    const contacts = [makeContact({ id: "c1", stakeholder_type: "iro" })];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.by_stakeholder_type["iro"]).toBe(1);
    expect(m.by_stakeholder_type["social_worker"]).toBeUndefined();
  });

  it("is empty when no contacts", () => {
    const m = computeEngagementMetrics([], []);
    expect(Object.keys(m.by_stakeholder_type)).toHaveLength(0);
  });

  // ── by_engagement_method ─────────────────────────────────────────────

  it("tallies contacts by engagement method", () => {
    const contacts = [
      makeContact({ id: "c1", engagement_method: "phone" }),
      makeContact({ id: "c2", engagement_method: "email" }),
      makeContact({ id: "c3", engagement_method: "phone" }),
      makeContact({ id: "c4", engagement_method: "meeting" }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.by_engagement_method["phone"]).toBe(2);
    expect(m.by_engagement_method["email"]).toBe(1);
    expect(m.by_engagement_method["meeting"]).toBe(1);
  });

  it("only includes methods that exist in data", () => {
    const contacts = [makeContact({ id: "c1", engagement_method: "visit" })];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.by_engagement_method["visit"]).toBe(1);
    expect(m.by_engagement_method["phone"]).toBeUndefined();
  });

  it("is empty when no contacts", () => {
    const m = computeEngagementMetrics([], []);
    expect(Object.keys(m.by_engagement_method)).toHaveLength(0);
  });

  // ── home_initiated_rate ──────────────────────────────────────────────

  it("calculates 100% when all home-initiated", () => {
    const contacts = [
      makeContact({ id: "c1", initiated_by: "home" }),
      makeContact({ id: "c2", initiated_by: "home" }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.home_initiated_rate).toBe(100);
  });

  it("calculates 0% when all stakeholder-initiated", () => {
    const contacts = [
      makeContact({ id: "c1", initiated_by: "stakeholder" }),
      makeContact({ id: "c2", initiated_by: "stakeholder" }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.home_initiated_rate).toBe(0);
  });

  it("calculates 50% for even split", () => {
    const contacts = [
      makeContact({ id: "c1", initiated_by: "home" }),
      makeContact({ id: "c2", initiated_by: "stakeholder" }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.home_initiated_rate).toBe(50);
  });

  it("rounds to one decimal place", () => {
    const contacts = [
      makeContact({ id: "c1", initiated_by: "home" }),
      makeContact({ id: "c2", initiated_by: "stakeholder" }),
      makeContact({ id: "c3", initiated_by: "stakeholder" }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    // 1/3 = 33.3%
    expect(m.home_initiated_rate).toBe(33.3);
  });

  it("returns 0 when no contacts", () => {
    const m = computeEngagementMetrics([], []);
    expect(m.home_initiated_rate).toBeNull();;
  });

  // ── follow_up_completion_rate ────────────────────────────────────────

  it("calculates 100% when all follow-ups completed", () => {
    const contacts = [
      makeContact({ id: "c1", follow_up_date: daysAgo(10), follow_up_completed: true }),
      makeContact({ id: "c2", follow_up_date: daysAgo(5), follow_up_completed: true }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.follow_up_completion_rate).toBe(100);
  });

  it("calculates 0% when no follow-ups completed", () => {
    const contacts = [
      makeContact({ id: "c1", follow_up_date: daysAgo(10), follow_up_completed: false }),
      makeContact({ id: "c2", follow_up_date: daysAgo(5), follow_up_completed: false }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.follow_up_completion_rate).toBe(0);
  });

  it("calculates 50% for half completed", () => {
    const contacts = [
      makeContact({ id: "c1", follow_up_date: daysAgo(10), follow_up_completed: true }),
      makeContact({ id: "c2", follow_up_date: daysAgo(5), follow_up_completed: false }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.follow_up_completion_rate).toBe(50);
  });

  it("returns 0 when no follow-up dates exist", () => {
    const contacts = [
      makeContact({ id: "c1", follow_up_date: null }),
      makeContact({ id: "c2", follow_up_date: null }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.follow_up_completion_rate).toBeNull();;
  });

  it("excludes contacts without follow_up_date from rate", () => {
    const contacts = [
      makeContact({ id: "c1", follow_up_date: daysAgo(10), follow_up_completed: true }),
      makeContact({ id: "c2", follow_up_date: null }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    // Only 1 follow-up needed, 1 completed => 100%
    expect(m.follow_up_completion_rate).toBe(100);
  });

  it("rounds follow-up completion rate to one decimal", () => {
    const contacts = [
      makeContact({ id: "c1", follow_up_date: daysAgo(10), follow_up_completed: true }),
      makeContact({ id: "c2", follow_up_date: daysAgo(8), follow_up_completed: false }),
      makeContact({ id: "c3", follow_up_date: daysAgo(6), follow_up_completed: false }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    // 1/3 = 33.3%
    expect(m.follow_up_completion_rate).toBe(33.3);
  });

  // ── overdue_follow_ups ───────────────────────────────────────────────

  it("counts overdue follow-ups (past date, not completed)", () => {
    const contacts = [
      makeContact({ id: "c1", follow_up_date: daysAgo(5), follow_up_completed: false }),
      makeContact({ id: "c2", follow_up_date: daysAgo(10), follow_up_completed: false }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.overdue_follow_ups).toBe(2);
  });

  it("does not count completed follow-ups as overdue", () => {
    const contacts = [
      makeContact({ id: "c1", follow_up_date: daysAgo(5), follow_up_completed: true }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.overdue_follow_ups).toBe(0);
  });

  it("does not count future follow-ups as overdue", () => {
    const contacts = [
      makeContact({ id: "c1", follow_up_date: daysFromNow(5), follow_up_completed: false }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.overdue_follow_ups).toBe(0);
  });

  it("does not count contacts without follow_up_date as overdue", () => {
    const contacts = [
      makeContact({ id: "c1", follow_up_date: null, follow_up_completed: false }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.overdue_follow_ups).toBe(0);
  });

  it("returns 0 overdue follow-ups for empty contacts", () => {
    const m = computeEngagementMetrics([], []);
    expect(m.overdue_follow_ups).toBe(0);
  });

  // ── avg_satisfaction_score ───────────────────────────────────────────

  it("calculates score 5 for all very_satisfied", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "very_satisfied" }),
      makeFeedback({ id: "f2", rating: "very_satisfied" }),
    ];
    const m = computeEngagementMetrics([], fbs);
    expect(m.avg_satisfaction_score).toBe(5);
  });

  it("calculates score 4 for all satisfied", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "satisfied" }),
      makeFeedback({ id: "f2", rating: "satisfied" }),
    ];
    const m = computeEngagementMetrics([], fbs);
    expect(m.avg_satisfaction_score).toBe(4);
  });

  it("calculates score 3 for all neutral", () => {
    const fbs = [makeFeedback({ id: "f1", rating: "neutral" })];
    const m = computeEngagementMetrics([], fbs);
    expect(m.avg_satisfaction_score).toBe(3);
  });

  it("calculates score 2 for all dissatisfied", () => {
    const fbs = [makeFeedback({ id: "f1", rating: "dissatisfied" })];
    const m = computeEngagementMetrics([], fbs);
    expect(m.avg_satisfaction_score).toBe(2);
  });

  it("calculates score 1 for all very_dissatisfied", () => {
    const fbs = [makeFeedback({ id: "f1", rating: "very_dissatisfied" })];
    const m = computeEngagementMetrics([], fbs);
    expect(m.avg_satisfaction_score).toBe(1);
  });

  it("calculates mixed rating average (5+4+3+2+1)/5 = 3.0", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "very_satisfied" }),
      makeFeedback({ id: "f2", rating: "satisfied" }),
      makeFeedback({ id: "f3", rating: "neutral" }),
      makeFeedback({ id: "f4", rating: "dissatisfied" }),
      makeFeedback({ id: "f5", rating: "very_dissatisfied" }),
    ];
    const m = computeEngagementMetrics([], fbs);
    expect(m.avg_satisfaction_score).toBe(3);
  });

  it("rounds to one decimal place", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "very_satisfied" }),
      makeFeedback({ id: "f2", rating: "satisfied" }),
      makeFeedback({ id: "f3", rating: "neutral" }),
    ];
    const m = computeEngagementMetrics([], fbs);
    // (5+4+3)/3 = 4.0
    expect(m.avg_satisfaction_score).toBe(4);
  });

  it("rounds correctly for non-even division", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "very_satisfied" }),
      makeFeedback({ id: "f2", rating: "neutral" }),
      makeFeedback({ id: "f3", rating: "neutral" }),
    ];
    const m = computeEngagementMetrics([], fbs);
    // (5+3+3)/3 = 3.666... => 3.7
    expect(m.avg_satisfaction_score).toBe(3.7);
  });

  it("returns 0 when no feedback", () => {
    const m = computeEngagementMetrics([], []);
    expect(m.avg_satisfaction_score).toBeNull();;
  });

  // ── relationship_distribution ────────────────────────────────────────

  it("tallies relationship distribution", () => {
    const fbs = [
      makeFeedback({ id: "f1", overall_relationship: "excellent" }),
      makeFeedback({ id: "f2", overall_relationship: "good" }),
      makeFeedback({ id: "f3", overall_relationship: "good" }),
      makeFeedback({ id: "f4", overall_relationship: "poor" }),
    ];
    const m = computeEngagementMetrics([], fbs);
    expect(m.relationship_distribution["excellent"]).toBe(1);
    expect(m.relationship_distribution["good"]).toBe(2);
    expect(m.relationship_distribution["poor"]).toBe(1);
  });

  it("only includes relationship qualities that exist in data", () => {
    const fbs = [makeFeedback({ id: "f1", overall_relationship: "strained" })];
    const m = computeEngagementMetrics([], fbs);
    expect(m.relationship_distribution["strained"]).toBe(1);
    expect(m.relationship_distribution["excellent"]).toBeUndefined();
  });

  it("is empty when no feedback", () => {
    const m = computeEngagementMetrics([], []);
    expect(Object.keys(m.relationship_distribution)).toHaveLength(0);
  });

  it("counts all 5 quality types when present", () => {
    const fbs = [
      makeFeedback({ id: "f1", overall_relationship: "excellent" }),
      makeFeedback({ id: "f2", overall_relationship: "good" }),
      makeFeedback({ id: "f3", overall_relationship: "adequate" }),
      makeFeedback({ id: "f4", overall_relationship: "strained" }),
      makeFeedback({ id: "f5", overall_relationship: "poor" }),
    ];
    const m = computeEngagementMetrics([], fbs);
    expect(Object.keys(m.relationship_distribution)).toHaveLength(5);
  });

  // ── feedback_count ───────────────────────────────────────────────────

  it("counts feedback entries", () => {
    const fbs = [
      makeFeedback({ id: "f1" }),
      makeFeedback({ id: "f2" }),
      makeFeedback({ id: "f3" }),
    ];
    const m = computeEngagementMetrics([], fbs);
    expect(m.feedback_count).toBe(3);
  });

  it("returns 0 feedback count when no feedback", () => {
    const m = computeEngagementMetrics([], []);
    expect(m.feedback_count).toBe(0);
  });

  // ── Combined/integration scenarios ───────────────────────────────────

  it("handles a single contact with all data populated", () => {
    const contact = makeContact({
      id: "c1",
      stakeholder_type: "social_worker",
      engagement_method: "meeting",
      initiated_by: "home",
      contact_date: daysAgo(2),
      follow_up_date: daysAgo(1),
      follow_up_completed: true,
    });
    const fb = makeFeedback({
      id: "f1",
      rating: "very_satisfied",
      overall_relationship: "excellent",
    });
    const m = computeEngagementMetrics([contact], [fb]);
    expect(m.total_contacts).toBe(1);
    expect(m.contacts_this_month).toBe(1);
    expect(m.unique_stakeholders).toBe(1);
    expect(m.by_stakeholder_type["social_worker"]).toBe(1);
    expect(m.by_engagement_method["meeting"]).toBe(1);
    expect(m.home_initiated_rate).toBe(100);
    expect(m.follow_up_completion_rate).toBe(100);
    expect(m.overdue_follow_ups).toBe(0);
    expect(m.avg_satisfaction_score).toBe(5);
    expect(m.relationship_distribution["excellent"]).toBe(1);
    expect(m.feedback_count).toBe(1);
  });

  it("handles multiple stakeholder types and methods together", () => {
    const contacts = [
      makeContact({ id: "c1", stakeholder_type: "social_worker", engagement_method: "phone" }),
      makeContact({ id: "c2", stakeholder_type: "school", engagement_method: "email" }),
      makeContact({ id: "c3", stakeholder_type: "social_worker", engagement_method: "email" }),
      makeContact({ id: "c4", stakeholder_type: "camhs", engagement_method: "phone" }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.by_stakeholder_type["social_worker"]).toBe(2);
    expect(m.by_stakeholder_type["school"]).toBe(1);
    expect(m.by_stakeholder_type["camhs"]).toBe(1);
    expect(m.by_engagement_method["phone"]).toBe(2);
    expect(m.by_engagement_method["email"]).toBe(2);
  });

  it("home_initiated_rate with 2 of 3 home-initiated = 66.7", () => {
    const contacts = [
      makeContact({ id: "c1", initiated_by: "home" }),
      makeContact({ id: "c2", initiated_by: "home" }),
      makeContact({ id: "c3", initiated_by: "stakeholder" }),
    ];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.home_initiated_rate).toBe(66.7);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyEngagementAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyEngagementAlerts", () => {
  const now = new Date("2026-05-13T12:00:00.000Z");

  // ── No alerts ────────────────────────────────────────────────────────

  it("returns no alerts for empty arrays", () => {
    const alerts = identifyEngagementAlerts([], [], now);
    expect(alerts).toHaveLength(0);
  });

  it("returns no alerts for a fully compliant setup", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_type: "social_worker",
        contact_date: daysAgo(5),
        follow_up_date: daysAgo(3),
        follow_up_completed: true,
      }),
    ];
    const fbs = [
      makeFeedback({
        id: "f1",
        rating: "satisfied",
        overall_relationship: "good",
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, fbs, now);
    expect(alerts).toHaveLength(0);
  });

  // ── follow_up_overdue (medium, < 14 days) ────────────────────────────

  it("raises medium follow_up_overdue when overdue < 14 days", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_name: "Jane Smith",
        stakeholder_type: "social_worker",
        follow_up_date: "2026-05-05",
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeTruthy();
    expect(overdue!.severity).toBe("medium");
    expect(overdue!.id).toBe("c1");
  });

  it("follow_up_overdue medium alert message contains stakeholder name", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_name: "Dr Brown",
        stakeholder_type: "camhs",
        follow_up_date: "2026-05-10",
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue!.message).toContain("Dr Brown");
  });

  it("follow_up_overdue medium alert message contains days overdue", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_name: "Jane",
        follow_up_date: "2026-05-06",
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    // Date diff depends on rounding — just verify it contains a number of days
    expect(overdue!.message).toMatch(/\d+ days overdue/);
    expect(overdue!.message).toContain("Jane");
  });

  it("follow_up_overdue medium for exactly 1 day overdue", () => {
    const contacts = [
      makeContact({
        id: "c1",
        follow_up_date: "2026-05-12",
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeTruthy();
    expect(overdue!.severity).toBe("medium");
  });

  it("follow_up_overdue medium for exactly 13 days overdue", () => {
    const contacts = [
      makeContact({
        id: "c1",
        follow_up_date: "2026-04-30",
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeTruthy();
    expect(overdue!.severity).toBe("medium");
  });

  // ── follow_up_overdue (high, > 14 days) ──────────────────────────────

  it("raises high follow_up_overdue when overdue > 14 days", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_name: "SW Long",
        stakeholder_type: "social_worker",
        follow_up_date: "2026-04-20",
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeTruthy();
    expect(overdue!.severity).toBe("high");
  });

  it("follow_up_overdue high for 15 days overdue", () => {
    const contacts = [
      makeContact({
        id: "c1",
        follow_up_date: "2026-04-28",
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeTruthy();
    expect(overdue!.severity).toBe("high");
  });

  it("follow_up_overdue high for 30 days overdue", () => {
    const contacts = [
      makeContact({
        id: "c1",
        follow_up_date: "2026-04-13",
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue!.severity).toBe("high");
  });

  it("follow_up_overdue high alert message contains stakeholder name", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_name: "Lucy Chen",
        follow_up_date: "2026-04-15",
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue!.message).toContain("Lucy Chen");
  });

  // ── follow_up_overdue: no alert cases ────────────────────────────────

  it("no follow_up_overdue when follow-up is completed", () => {
    const contacts = [
      makeContact({
        id: "c1",
        follow_up_date: "2026-04-20",
        follow_up_completed: true,
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeUndefined();
  });

  it("no follow_up_overdue when follow-up date is in the future", () => {
    const contacts = [
      makeContact({
        id: "c1",
        follow_up_date: "2026-05-20",
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeUndefined();
  });

  it("no follow_up_overdue when follow_up_date is null", () => {
    const contacts = [
      makeContact({
        id: "c1",
        follow_up_date: null,
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeUndefined();
  });

  it("raises multiple follow_up_overdue alerts for multiple overdue contacts", () => {
    const contacts = [
      makeContact({ id: "c1", follow_up_date: "2026-05-05", follow_up_completed: false }),
      makeContact({ id: "c2", follow_up_date: "2026-04-20", follow_up_completed: false }),
      makeContact({ id: "c3", follow_up_date: "2026-05-10", follow_up_completed: false }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const overdue = alerts.filter((a) => a.type === "follow_up_overdue");
    expect(overdue).toHaveLength(3);
  });

  it("follow_up_overdue message contains stakeholder type", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_type: "placing_authority",
        follow_up_date: "2026-05-05",
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue!.message).toContain("placing authority");
  });

  // ── poor_relationship (high) ─────────────────────────────────────────

  it("raises high poor_relationship alert", () => {
    const fbs = [
      makeFeedback({
        id: "f1",
        stakeholder_name: "Officer Jones",
        stakeholder_type: "police",
        overall_relationship: "poor",
      }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const poor = alerts.find((a) => a.type === "poor_relationship");
    expect(poor).toBeTruthy();
    expect(poor!.severity).toBe("high");
    expect(poor!.id).toBe("f1");
  });

  it("poor_relationship message contains stakeholder name", () => {
    const fbs = [
      makeFeedback({
        id: "f1",
        stakeholder_name: "Ms Taylor",
        overall_relationship: "poor",
      }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const poor = alerts.find((a) => a.type === "poor_relationship");
    expect(poor!.message).toContain("Ms Taylor");
  });

  it("poor_relationship message contains stakeholder type", () => {
    const fbs = [
      makeFeedback({
        id: "f1",
        stakeholder_type: "health_professional",
        overall_relationship: "poor",
      }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const poor = alerts.find((a) => a.type === "poor_relationship");
    expect(poor!.message).toContain("health professional");
  });

  it("poor_relationship message mentions action plan", () => {
    const fbs = [
      makeFeedback({ id: "f1", overall_relationship: "poor" }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const poor = alerts.find((a) => a.type === "poor_relationship");
    expect(poor!.message).toContain("action plan");
  });

  it("raises multiple poor_relationship alerts for multiple poor feedbacks", () => {
    const fbs = [
      makeFeedback({ id: "f1", overall_relationship: "poor" }),
      makeFeedback({ id: "f2", overall_relationship: "poor" }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const poor = alerts.filter((a) => a.type === "poor_relationship");
    expect(poor).toHaveLength(2);
  });

  it("does not raise poor_relationship for adequate", () => {
    const fbs = [
      makeFeedback({ id: "f1", overall_relationship: "adequate" }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const poor = alerts.find((a) => a.type === "poor_relationship");
    expect(poor).toBeUndefined();
  });

  it("does not raise poor_relationship for good or excellent", () => {
    const fbs = [
      makeFeedback({ id: "f1", overall_relationship: "good" }),
      makeFeedback({ id: "f2", overall_relationship: "excellent" }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const poor = alerts.find((a) => a.type === "poor_relationship");
    expect(poor).toBeUndefined();
  });

  // ── strained_relationship (medium) ───────────────────────────────────

  it("raises medium strained_relationship alert", () => {
    const fbs = [
      makeFeedback({
        id: "f1",
        stakeholder_name: "Mrs Green",
        stakeholder_type: "parent_carer",
        overall_relationship: "strained",
      }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const strained = alerts.find((a) => a.type === "strained_relationship");
    expect(strained).toBeTruthy();
    expect(strained!.severity).toBe("medium");
    expect(strained!.id).toBe("f1");
  });

  it("strained_relationship message contains stakeholder name", () => {
    const fbs = [
      makeFeedback({
        id: "f1",
        stakeholder_name: "Mr Adams",
        overall_relationship: "strained",
      }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const strained = alerts.find((a) => a.type === "strained_relationship");
    expect(strained!.message).toContain("Mr Adams");
  });

  it("strained_relationship message contains stakeholder type", () => {
    const fbs = [
      makeFeedback({
        id: "f1",
        stakeholder_type: "iro",
        overall_relationship: "strained",
      }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const strained = alerts.find((a) => a.type === "strained_relationship");
    // iro has no underscores so stays "iro" after replace
    expect(strained!.message).toContain("iro");
  });

  it("strained_relationship message mentions proactive engagement", () => {
    const fbs = [
      makeFeedback({ id: "f1", overall_relationship: "strained" }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const strained = alerts.find((a) => a.type === "strained_relationship");
    expect(strained!.message).toContain("proactive engagement");
  });

  it("raises multiple strained_relationship alerts", () => {
    const fbs = [
      makeFeedback({ id: "f1", overall_relationship: "strained" }),
      makeFeedback({ id: "f2", overall_relationship: "strained" }),
      makeFeedback({ id: "f3", overall_relationship: "strained" }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const strained = alerts.filter((a) => a.type === "strained_relationship");
    expect(strained).toHaveLength(3);
  });

  it("does not raise strained_relationship for adequate", () => {
    const fbs = [
      makeFeedback({ id: "f1", overall_relationship: "adequate" }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const strained = alerts.find((a) => a.type === "strained_relationship");
    expect(strained).toBeUndefined();
  });

  // ── both poor and strained ───────────────────────────────────────────

  it("raises both poor_relationship and strained_relationship for different feedbacks", () => {
    const fbs = [
      makeFeedback({ id: "f1", overall_relationship: "poor" }),
      makeFeedback({ id: "f2", overall_relationship: "strained" }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    expect(alerts.find((a) => a.type === "poor_relationship")).toBeTruthy();
    expect(alerts.find((a) => a.type === "strained_relationship")).toBeTruthy();
  });

  // ── social_worker_no_contact (medium) ────────────────────────────────

  it("raises medium social_worker_no_contact when last contact > 30 days ago", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_type: "social_worker",
        stakeholder_name: "SW Old",
        contact_date: "2026-04-01",
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const noContact = alerts.find((a) => a.type === "social_worker_no_contact");
    expect(noContact).toBeTruthy();
    expect(noContact!.severity).toBe("medium");
    expect(noContact!.id).toBe("c1");
  });

  it("social_worker_no_contact message contains SW name", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_type: "social_worker",
        stakeholder_name: "Sarah Wilson",
        contact_date: "2026-03-15",
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const noContact = alerts.find((a) => a.type === "social_worker_no_contact");
    expect(noContact!.message).toContain("Sarah Wilson");
  });

  it("social_worker_no_contact message contains days since contact", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_type: "social_worker",
        stakeholder_name: "Test SW",
        contact_date: "2026-04-01",
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const noContact = alerts.find((a) => a.type === "social_worker_no_contact");
    // Apr 1 noon to May 13 noon = ~42-43 days depending on rounding
    expect(noContact!.message).toMatch(/4[23] days/);
  });

  it("social_worker_no_contact message mentions regular communication", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_type: "social_worker",
        contact_date: "2026-03-01",
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const noContact = alerts.find((a) => a.type === "social_worker_no_contact");
    expect(noContact!.message).toContain("regular communication");
  });

  it("no social_worker_no_contact when last contact is within 30 days", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_type: "social_worker",
        contact_date: "2026-05-01",
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const noContact = alerts.find((a) => a.type === "social_worker_no_contact");
    expect(noContact).toBeUndefined();
  });

  it("no social_worker_no_contact when contact is 25 days ago", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_type: "social_worker",
        contact_date: "2026-04-18",
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const noContact = alerts.find((a) => a.type === "social_worker_no_contact");
    expect(noContact).toBeUndefined();
  });

  it("no social_worker_no_contact for non-social-worker stakeholders", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_type: "school",
        contact_date: "2026-01-01",
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const noContact = alerts.find((a) => a.type === "social_worker_no_contact");
    expect(noContact).toBeUndefined();
  });

  it("uses most recent contact for each SW when determining gap", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_type: "social_worker",
        stakeholder_name: "SW One",
        contact_date: "2026-03-01",
      }),
      makeContact({
        id: "c2",
        stakeholder_type: "social_worker",
        stakeholder_name: "SW One",
        contact_date: "2026-05-10",
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const noContact = alerts.find((a) => a.type === "social_worker_no_contact");
    // Most recent is May 10 (3 days ago) — not overdue
    expect(noContact).toBeUndefined();
  });

  it("raises separate alerts for different social workers", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_type: "social_worker",
        stakeholder_name: "SW Alpha",
        contact_date: "2026-03-01",
      }),
      makeContact({
        id: "c2",
        stakeholder_type: "social_worker",
        stakeholder_name: "SW Beta",
        contact_date: "2026-03-15",
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const noContact = alerts.filter((a) => a.type === "social_worker_no_contact");
    expect(noContact).toHaveLength(2);
  });

  // ── stakeholder_very_dissatisfied (high) ─────────────────────────────

  it("raises high stakeholder_very_dissatisfied alert", () => {
    const fbs = [
      makeFeedback({
        id: "f1",
        stakeholder_name: "Mr Unhappy",
        rating: "very_dissatisfied",
      }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const vd = alerts.find((a) => a.type === "stakeholder_very_dissatisfied");
    expect(vd).toBeTruthy();
    expect(vd!.severity).toBe("high");
    expect(vd!.id).toBe("f1");
  });

  it("stakeholder_very_dissatisfied message contains stakeholder name", () => {
    const fbs = [
      makeFeedback({
        id: "f1",
        stakeholder_name: "Ms Cross",
        rating: "very_dissatisfied",
      }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const vd = alerts.find((a) => a.type === "stakeholder_very_dissatisfied");
    expect(vd!.message).toContain("Ms Cross");
  });

  it("stakeholder_very_dissatisfied message mentions immediate response", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "very_dissatisfied" }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const vd = alerts.find((a) => a.type === "stakeholder_very_dissatisfied");
    expect(vd!.message).toContain("immediate response");
  });

  it("raises multiple stakeholder_very_dissatisfied alerts", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "very_dissatisfied" }),
      makeFeedback({ id: "f2", rating: "very_dissatisfied" }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const vd = alerts.filter((a) => a.type === "stakeholder_very_dissatisfied");
    expect(vd).toHaveLength(2);
  });

  it("does not raise stakeholder_very_dissatisfied for dissatisfied", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "dissatisfied" }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const vd = alerts.find((a) => a.type === "stakeholder_very_dissatisfied");
    expect(vd).toBeUndefined();
  });

  it("does not raise stakeholder_very_dissatisfied for neutral", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "neutral" }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const vd = alerts.find((a) => a.type === "stakeholder_very_dissatisfied");
    expect(vd).toBeUndefined();
  });

  it("does not raise stakeholder_very_dissatisfied for satisfied", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "satisfied" }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    const vd = alerts.find((a) => a.type === "stakeholder_very_dissatisfied");
    expect(vd).toBeUndefined();
  });

  // ── now parameter override ──────────────────────────────────────────

  it("respects now parameter for follow_up_overdue detection", () => {
    const futureNow = new Date("2026-06-15T12:00:00.000Z");
    const contacts = [
      makeContact({
        id: "c1",
        follow_up_date: "2026-05-20",
        follow_up_completed: false,
      }),
    ];
    // With May 13 now: not overdue (May 20 is in the future)
    const alertsMay = identifyEngagementAlerts(contacts, [], now);
    expect(alertsMay.find((a) => a.type === "follow_up_overdue")).toBeUndefined();

    // With June 15 now: overdue (May 20 is in the past)
    const alertsJune = identifyEngagementAlerts(contacts, [], futureNow);
    expect(alertsJune.find((a) => a.type === "follow_up_overdue")).toBeTruthy();
  });

  it("respects now parameter for social_worker_no_contact detection", () => {
    const earlyNow = new Date("2026-04-20T12:00:00.000Z");
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_type: "social_worker",
        stakeholder_name: "SW Test",
        contact_date: "2026-04-01",
      }),
    ];
    // With Apr 20 now: 19 days since contact — not overdue
    const alertsEarly = identifyEngagementAlerts(contacts, [], earlyNow);
    expect(alertsEarly.find((a) => a.type === "social_worker_no_contact")).toBeUndefined();

    // With May 13 now: 42 days since contact — overdue
    const alertsLate = identifyEngagementAlerts(contacts, [], now);
    expect(alertsLate.find((a) => a.type === "social_worker_no_contact")).toBeTruthy();
  });

  it("now parameter defaults correctly (does not throw without it)", () => {
    const contacts = [
      makeContact({
        id: "c1",
        follow_up_date: daysAgo(20),
        follow_up_completed: false,
      }),
    ];
    // Call without the now parameter
    const alerts = identifyEngagementAlerts(contacts, []);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeTruthy();
  });

  // ── Combined alerts ──────────────────────────────────────────────────

  it("raises combined alerts from contacts and feedback", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_type: "social_worker",
        stakeholder_name: "SW Old",
        contact_date: "2026-03-01",
        follow_up_date: "2026-04-01",
        follow_up_completed: false,
      }),
    ];
    const fbs = [
      makeFeedback({
        id: "f1",
        overall_relationship: "poor",
        rating: "very_dissatisfied",
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, fbs, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("follow_up_overdue");
    expect(types).toContain("social_worker_no_contact");
    expect(types).toContain("poor_relationship");
    expect(types).toContain("stakeholder_very_dissatisfied");
  });

  it("each alert has required fields: type, severity, message, id", () => {
    const contacts = [
      makeContact({
        id: "c1",
        follow_up_date: "2026-04-01",
        follow_up_completed: false,
      }),
    ];
    const fbs = [
      makeFeedback({ id: "f1", overall_relationship: "poor" }),
    ];
    const alerts = identifyEngagementAlerts(contacts, fbs, now);
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

  it("does not raise strained_relationship when relationship is poor (only poor_relationship)", () => {
    const fbs = [
      makeFeedback({ id: "f1", overall_relationship: "poor" }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    expect(alerts.find((a) => a.type === "poor_relationship")).toBeTruthy();
    expect(alerts.find((a) => a.type === "strained_relationship")).toBeUndefined();
  });

  it("very_dissatisfied also triggers poor_relationship if overall_relationship is poor", () => {
    const fbs = [
      makeFeedback({
        id: "f1",
        rating: "very_dissatisfied",
        overall_relationship: "poor",
      }),
    ];
    const alerts = identifyEngagementAlerts([], fbs, now);
    expect(alerts.find((a) => a.type === "stakeholder_very_dissatisfied")).toBeTruthy();
    expect(alerts.find((a) => a.type === "poor_relationship")).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listContacts ─────────────────────────────────────────────────────

  it("listContacts returns ok: true with empty array", async () => {
    const result = await listContacts("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listContacts returns ok: true with filters", async () => {
    const result = await listContacts("home-1", {
      stakeholderType: "social_worker",
      childId: "child-1",
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      limit: 50,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createContact ────────────────────────────────────────────────────

  it("createContact returns ok: false with error message", async () => {
    const result = await createContact({
      homeId: "home-1",
      stakeholderType: "social_worker",
      stakeholderName: "Jane Smith",
      organisation: "Local Authority",
      contactDate: daysAgo(1),
      engagementMethod: "phone",
      initiatedBy: "home",
      purpose: "Placement review",
      summary: "Discussed child progress",
      staffMember: "staff-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createContact returns error even with full optional input", async () => {
    const result = await createContact({
      homeId: "home-1",
      stakeholderType: "camhs",
      stakeholderName: "Dr Brown",
      organisation: "NHS Trust",
      childId: "child-1",
      childName: "Alice Smith",
      contactDate: daysAgo(1),
      engagementMethod: "meeting",
      initiatedBy: "stakeholder",
      purpose: "Assessment",
      summary: "Completed assessment",
      outcomes: "Referral agreed",
      actionsAgreed: ["Refer to CAMHS tier 3"],
      followUpDate: daysFromNow(14),
      staffMember: "staff-2",
      notes: "Went well",
    });
    expect(result.ok).toBe(false);
  });

  // ── listFeedback ─────────────────────────────────────────────────────

  it("listFeedback returns ok: true with empty array", async () => {
    const result = await listFeedback("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listFeedback returns ok: true with filters", async () => {
    const result = await listFeedback("home-1", {
      stakeholderType: "iro",
      limit: 25,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createFeedback ───────────────────────────────────────────────────

  it("createFeedback returns ok: false with error message", async () => {
    const result = await createFeedback({
      homeId: "home-1",
      stakeholderType: "social_worker",
      stakeholderName: "Jane Smith",
      organisation: "Local Authority",
      feedbackDate: daysAgo(1),
      rating: "satisfied",
      communicationRating: "satisfied",
      responsivenessRating: "satisfied",
      informationSharingRating: "satisfied",
      overallRelationship: "good",
      collectedBy: "staff-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createFeedback returns error with full optional input", async () => {
    const result = await createFeedback({
      homeId: "home-1",
      stakeholderType: "school",
      stakeholderName: "Head Teacher",
      organisation: "Local Academy",
      feedbackDate: daysAgo(2),
      rating: "very_satisfied",
      communicationRating: "very_satisfied",
      responsivenessRating: "satisfied",
      informationSharingRating: "satisfied",
      overallRelationship: "excellent",
      strengths: "Excellent communication",
      areasForImprovement: "None identified",
      comments: "Very positive feedback",
      collectedBy: "staff-2",
    });
    expect(result.ok).toBe(false);
  });

  // ── Error message type checks ────────────────────────────────────────

  it("createContact error message is a string", async () => {
    const result = await createContact({
      homeId: "home-1",
      stakeholderType: "social_worker",
      stakeholderName: "Test",
      organisation: "Test",
      contactDate: daysAgo(1),
      engagementMethod: "phone",
      initiatedBy: "home",
      purpose: "Test",
      summary: "Test",
      staffMember: "staff-1",
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
  it("computeEngagementMetrics handles large dataset", () => {
    const contacts: StakeholderContact[] = [];
    for (let i = 0; i < 100; i++) {
      contacts.push(
        makeContact({
          id: `c-${i}`,
          stakeholder_name: `Stakeholder ${i % 10}`,
          stakeholder_type: i % 2 === 0 ? "social_worker" : "school",
          engagement_method: i % 3 === 0 ? "phone" : "email",
          initiated_by: i % 4 === 0 ? "stakeholder" : "home",
          contact_date: daysAgo(i),
        }),
      );
    }
    const m = computeEngagementMetrics(contacts, []);
    expect(m.total_contacts).toBe(100);
    expect(m.unique_stakeholders).toBe(10);
  });

  it("computeEngagementMetrics handles empty contacts with non-empty feedback", () => {
    const fbs = [
      makeFeedback({ id: "f1", rating: "very_satisfied", overall_relationship: "excellent" }),
    ];
    const m = computeEngagementMetrics([], fbs);
    expect(m.total_contacts).toBe(0);
    expect(m.feedback_count).toBe(1);
    expect(m.avg_satisfaction_score).toBe(5);
  });

  it("computeEngagementMetrics handles non-empty contacts with empty feedback", () => {
    const contacts = [makeContact({ id: "c1" })];
    const m = computeEngagementMetrics(contacts, []);
    expect(m.total_contacts).toBe(1);
    expect(m.feedback_count).toBe(0);
    expect(m.avg_satisfaction_score).toBeNull();;
  });

  it("identifyEngagementAlerts handles mixed alert types in single call", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_type: "social_worker",
        stakeholder_name: "SW Gone",
        contact_date: "2026-03-01",
        follow_up_date: "2026-04-01",
        follow_up_completed: false,
      }),
    ];
    const fbs = [
      makeFeedback({
        id: "f1",
        overall_relationship: "poor",
        rating: "very_dissatisfied",
      }),
      makeFeedback({
        id: "f2",
        overall_relationship: "strained",
      }),
    ];
    const now = new Date("2026-05-13T12:00:00.000Z");
    const alerts = identifyEngagementAlerts(contacts, fbs, now);
    const types = new Set(alerts.map((a) => a.type));
    expect(types.has("follow_up_overdue")).toBe(true);
    expect(types.has("social_worker_no_contact")).toBe(true);
    expect(types.has("poor_relationship")).toBe(true);
    expect(types.has("strained_relationship")).toBe(true);
    expect(types.has("stakeholder_very_dissatisfied")).toBe(true);
  });

  it("identifyEngagementAlerts returns empty for healthy data", () => {
    const contacts = [
      makeContact({
        id: "c1",
        stakeholder_type: "social_worker",
        contact_date: daysAgo(5),
        follow_up_date: null,
      }),
    ];
    const fbs = [
      makeFeedback({
        id: "f1",
        rating: "satisfied",
        overall_relationship: "good",
      }),
    ];
    const alerts = identifyEngagementAlerts(contacts, fbs);
    expect(alerts).toHaveLength(0);
  });

  it("computeEngagementMetrics by_stakeholder_type counts all 13 types when present", () => {
    const types = STAKEHOLDER_TYPES.map((t) => t.type);
    const contacts = types.map((t, i) =>
      makeContact({ id: `c-${i}`, stakeholder_type: t }),
    );
    const m = computeEngagementMetrics(contacts, []);
    expect(Object.keys(m.by_stakeholder_type)).toHaveLength(13);
    for (const t of types) {
      expect(m.by_stakeholder_type[t]).toBe(1);
    }
  });

  it("computeEngagementMetrics by_engagement_method counts all 9 methods when present", () => {
    const methods = ENGAGEMENT_METHODS.map((m) => m.method);
    const contacts = methods.map((method, i) =>
      makeContact({ id: `c-${i}`, engagement_method: method }),
    );
    const m = computeEngagementMetrics(contacts, []);
    expect(Object.keys(m.by_engagement_method)).toHaveLength(9);
    for (const method of methods) {
      expect(m.by_engagement_method[method]).toBe(1);
    }
  });

  it("identifyEngagementAlerts social_worker_no_contact uses last contact id", () => {
    const contacts = [
      makeContact({
        id: "older-contact",
        stakeholder_type: "social_worker",
        stakeholder_name: "SW X",
        contact_date: "2026-02-01",
      }),
      makeContact({
        id: "newer-contact",
        stakeholder_type: "social_worker",
        stakeholder_name: "SW X",
        contact_date: "2026-03-01",
      }),
    ];
    const now = new Date("2026-05-13T12:00:00.000Z");
    const alerts = identifyEngagementAlerts(contacts, [], now);
    const noContact = alerts.find((a) => a.type === "social_worker_no_contact");
    expect(noContact).toBeTruthy();
    // The most recent (sorted desc) is "newer-contact"
    expect(noContact!.id).toBe("newer-contact");
  });

  it("computeEngagementMetrics relationship_distribution handles single feedback", () => {
    const fbs = [makeFeedback({ id: "f1", overall_relationship: "adequate" })];
    const m = computeEngagementMetrics([], fbs);
    expect(m.relationship_distribution["adequate"]).toBe(1);
    expect(Object.keys(m.relationship_distribution)).toHaveLength(1);
  });
});
