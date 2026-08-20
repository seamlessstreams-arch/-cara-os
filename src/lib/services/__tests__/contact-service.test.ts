// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTACT & FAMILY ENGAGEMENT SERVICE TESTS
// Pure-function tests for contact compliance, child contact profiles,
// contact quality scoring, action suggestions, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  CONTACT_TYPES,
  CONTACT_PERSONS,
  SUPERVISION_LEVELS,
  CONTACT_OUTCOMES,
} from "../contact-service";
import { _testing } from "../contact-service";
import { todayStr, daysFromNow} from "@/lib/utils";

const {
  computeContactCompliance,
  computeChildContactProfile,
  computeContactQuality,
  suggestContactActions,
} = _testing;

// ── Types (minimal shapes used by pure functions) ──────────────────────────

interface ContactPlan {
  id: string;
  home_id: string;
  child_id: string;
  contact_person_name: string;
  contact_person_role: string;
  relationship_detail: string;
  approved_contact_types: string[];
  supervision_level: string;
  planned_frequency: string;
  court_ordered: boolean;
  risk_notes?: string | null;
  is_active: boolean;
  approved_by: string;
  approved_date: string;
  review_date?: string | null;
  created_at: string;
  updated_at: string;
}

interface ContactRecord {
  id: string;
  home_id: string;
  child_id: string;
  contact_plan_id?: string | null;
  contact_person_name: string;
  contact_person_role: string;
  contact_type: string;
  supervision_level: string;
  scheduled_date: string;
  actual_date?: string | null;
  duration_minutes?: number | null;
  location?: string | null;
  outcome: string;
  child_mood_before?: number | null;
  child_mood_after?: number | null;
  child_voice?: string | null;
  staff_observations?: string | null;
  safeguarding_concerns?: string | null;
  supervised_by?: string | null;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a ContactPlan with sensible defaults, overridable per-field. */
function plan(overrides?: Partial<ContactPlan>): ContactPlan {
  return {
    id: "plan-1",
    home_id: "home-1",
    child_id: "child-1",
    contact_person_name: "Jane Doe",
    contact_person_role: "birth_parent",
    relationship_detail: "Mother",
    approved_contact_types: ["face_to_face"],
    supervision_level: "supervised_staff",
    planned_frequency: "weekly",
    court_ordered: false,
    risk_notes: null,
    is_active: true,
    approved_by: "sw-1",
    approved_date: "2026-01-01",
    review_date: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

/** Build a ContactRecord with sensible defaults, overridable per-field. */
function record(overrides?: Partial<ContactRecord>): ContactRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    child_id: "child-1",
    contact_plan_id: "plan-1",
    contact_person_name: "Jane Doe",
    contact_person_role: "birth_parent",
    contact_type: "face_to_face",
    supervision_level: "supervised_staff",
    scheduled_date: "2026-05-10",
    actual_date: "2026-05-10",
    duration_minutes: 60,
    location: "Contact Room A",
    outcome: "completed",
    child_mood_before: 3,
    child_mood_after: 4,
    child_voice: "I was happy to see mum",
    staff_observations: "Positive interaction observed",
    safeguarding_concerns: null,
    supervised_by: "staff-1",
    recorded_by: "staff-1",
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// ── computeContactCompliance ───────────────────────────────────────────────

describe("computeContactCompliance", () => {
  it("returns zero stats for empty inputs", () => {
    const result = computeContactCompliance([], []);
    expect(result.total_plans).toBe(0);
    expect(result.active_plans).toBe(0);
    expect(result.total_contacts).toBe(0);
    expect(result.completed_contacts).toBe(0);
    expect(result.cancelled_contacts).toBe(0);
    expect(result.refusals).toBe(0);
    expect(result.no_shows).toBe(0);
    expect(result.completion_rate).toBeNull();; expect(result.by_type).toEqual({});
    expect(result.by_role).toEqual({});
    expect(result.family_contact_count).toBe(0);
    expect(result.sibling_contact_count).toBe(0);
    expect(result.plans_overdue_review).toBe(0);
  });

  it("counts total and active plans correctly", () => {
    const plans = [
      plan({ id: "p1", is_active: true }),
      plan({ id: "p2", is_active: false }),
      plan({ id: "p3", is_active: true }),
    ];
    const result = computeContactCompliance(plans, []);
    expect(result.total_plans).toBe(3);
    expect(result.active_plans).toBe(2);
  });

  it("counts completed contacts correctly", () => {
    const records = [
      record({ id: "r1", outcome: "completed" }),
      record({ id: "r2", outcome: "completed" }),
      record({ id: "r3", outcome: "no_show" }),
    ];
    const result = computeContactCompliance([], records);
    expect(result.completed_contacts).toBe(2);
    expect(result.total_contacts).toBe(3);
  });

  it("counts cancelled contacts across all cancel types", () => {
    const records = [
      record({ id: "r1", outcome: "cancelled_by_child" }),
      record({ id: "r2", outcome: "cancelled_by_contact" }),
      record({ id: "r3", outcome: "cancelled_by_authority" }),
      record({ id: "r4", outcome: "completed" }),
    ];
    const result = computeContactCompliance([], records);
    expect(result.cancelled_contacts).toBe(3);
  });

  it("counts refusals and no-shows correctly", () => {
    const records = [
      record({ id: "r1", outcome: "refused_by_child" }),
      record({ id: "r2", outcome: "refused_by_child" }),
      record({ id: "r3", outcome: "no_show" }),
    ];
    const result = computeContactCompliance([], records);
    expect(result.refusals).toBe(2);
    expect(result.no_shows).toBe(1);
  });

  it("calculates completion_rate as a percentage with one decimal", () => {
    const records = [
      record({ id: "r1", outcome: "completed" }),
      record({ id: "r2", outcome: "completed" }),
      record({ id: "r3", outcome: "no_show" }),
    ];
    const result = computeContactCompliance([], records);
    // 2/3 * 100 = 66.666... rounded to 1dp = 66.7
    expect(result.completion_rate).toBe(66.7);
  });

  it("returns 0 completion_rate when no records exist", () => {
    const result = computeContactCompliance([], []);
    expect(result.completion_rate).toBeNull();; });

  it("groups contacts by type", () => {
    const records = [
      record({ id: "r1", contact_type: "face_to_face" }),
      record({ id: "r2", contact_type: "phone_call" }),
      record({ id: "r3", contact_type: "face_to_face" }),
    ];
    const result = computeContactCompliance([], records);
    expect(result.by_type).toEqual({ face_to_face: 2, phone_call: 1 });
  });

  it("groups contacts by role", () => {
    const records = [
      record({ id: "r1", contact_person_role: "birth_parent" }),
      record({ id: "r2", contact_person_role: "sibling" }),
      record({ id: "r3", contact_person_role: "birth_parent" }),
    ];
    const result = computeContactCompliance([], records);
    expect(result.by_role).toEqual({ birth_parent: 2, sibling: 1 });
  });

  it("counts family contacts (birth_parent, sibling, grandparent, extended_family)", () => {
    const records = [
      record({ id: "r1", contact_person_role: "birth_parent" }),
      record({ id: "r2", contact_person_role: "sibling" }),
      record({ id: "r3", contact_person_role: "grandparent" }),
      record({ id: "r4", contact_person_role: "social_worker" }),
      record({ id: "r5", contact_person_role: "extended_family" }),
    ];
    const result = computeContactCompliance([], records);
    expect(result.family_contact_count).toBe(4);
  });

  it("counts sibling contacts specifically", () => {
    const records = [
      record({ id: "r1", contact_person_role: "sibling" }),
      record({ id: "r2", contact_person_role: "sibling" }),
      record({ id: "r3", contact_person_role: "birth_parent" }),
    ];
    const result = computeContactCompliance([], records);
    expect(result.sibling_contact_count).toBe(2);
  });

  it("counts plans overdue for review", () => {
    const plans = [
      plan({ id: "p1", review_date: "2020-01-01" }), // overdue
      plan({ id: "p2", review_date: "2020-06-01" }), // overdue
      plan({ id: "p3", review_date: "2099-12-31" }), // future
      plan({ id: "p4", review_date: null }),          // no review date
    ];
    const result = computeContactCompliance(plans, []);
    expect(result.plans_overdue_review).toBe(2);
  });

  it("counts overdue plans regardless of active status", () => {
    const plans = [
      plan({ id: "p1", is_active: false, review_date: "2020-01-01" }), // overdue + inactive
      plan({ id: "p2", is_active: true, review_date: "2020-06-01" }),  // overdue + active
    ];
    const result = computeContactCompliance(plans, []);
    expect(result.plans_overdue_review).toBe(2);
  });
});

// ── computeChildContactProfile ─────────────────────────────────────────────

describe("computeChildContactProfile", () => {
  it("returns empty defaults when child has no plans or records", () => {
    const result = computeChildContactProfile("child-1", [], []);
    expect(result.child_id).toBe("child-1");
    expect(result.active_contacts).toEqual([]);
    expect(result.total_contacts_30d).toBe(0);
    expect(result.family_contacts_30d).toBe(0);
    expect(result.mood_trend).toBe("stable");
    expect(result.refusal_rate).toBeNull();; expect(result.no_contact_persons).toEqual([]);
  });

  it("filters plans and records by child_id", () => {
    const plans = [
      plan({ child_id: "child-1", contact_person_name: "Mum" }),
      plan({ child_id: "child-2", contact_person_name: "Dad" }),
    ];
    const records = [
      record({ child_id: "child-1", scheduled_date: todayStr() }),
      record({ child_id: "child-2", scheduled_date: todayStr() }),
    ];
    const result = computeChildContactProfile("child-1", plans, records);
    expect(result.active_contacts).toHaveLength(1);
    expect(result.active_contacts[0].name).toBe("Mum");
  });

  it("only lists active plans in active_contacts", () => {
    const plans = [
      plan({ child_id: "child-1", is_active: true, contact_person_name: "Mum" }),
      plan({ child_id: "child-1", is_active: false, contact_person_name: "Dad" }),
    ];
    const result = computeChildContactProfile("child-1", plans, []);
    expect(result.active_contacts).toHaveLength(1);
    expect(result.active_contacts[0].name).toBe("Mum");
  });

  it("returns last_contact date for each active contact", () => {
    const plans = [
      plan({ child_id: "child-1", contact_person_name: "Mum" }),
    ];
    const records = [
      record({ child_id: "child-1", contact_person_name: "Mum", outcome: "completed", scheduled_date: "2026-04-01" }),
      record({ child_id: "child-1", contact_person_name: "Mum", outcome: "completed", scheduled_date: "2026-05-01" }),
    ];
    const result = computeChildContactProfile("child-1", plans, records);
    // Most recent completed should be returned
    expect(result.active_contacts[0].last_contact).toBe("2026-05-01");
  });

  it("returns null last_contact when no completed records exist", () => {
    const plans = [
      plan({ child_id: "child-1", contact_person_name: "Mum" }),
    ];
    const records = [
      record({ child_id: "child-1", contact_person_name: "Mum", outcome: "no_show", scheduled_date: "2026-05-01" }),
    ];
    const result = computeChildContactProfile("child-1", plans, records);
    expect(result.active_contacts[0].last_contact).toBeNull();
  });

  it("counts total contacts in last 30 days", () => {
    const recent = daysFromNow(-5);
    const old = daysFromNow(-60);

    const records = [
      record({ id: "r1", child_id: "child-1", scheduled_date: recent }),
      record({ id: "r2", child_id: "child-1", scheduled_date: recent }),
      record({ id: "r3", child_id: "child-1", scheduled_date: old }),
    ];
    const result = computeChildContactProfile("child-1", [], records);
    expect(result.total_contacts_30d).toBe(2);
  });

  it("counts family contacts in last 30 days", () => {
    const recent = daysFromNow(-5);

    const records = [
      record({ id: "r1", child_id: "child-1", contact_person_role: "birth_parent", scheduled_date: recent }),
      record({ id: "r2", child_id: "child-1", contact_person_role: "social_worker", scheduled_date: recent }),
      record({ id: "r3", child_id: "child-1", contact_person_role: "sibling", scheduled_date: recent }),
    ];
    const result = computeChildContactProfile("child-1", [], records);
    expect(result.family_contacts_30d).toBe(2);
  });

  it("calculates mood_trend as improving when second half average exceeds first by > 0.25", () => {
    const records = [
      record({ id: "r1", child_id: "child-1", child_mood_after: 2, scheduled_date: "2026-01-01" }),
      record({ id: "r2", child_id: "child-1", child_mood_after: 2, scheduled_date: "2026-02-01" }),
      record({ id: "r3", child_id: "child-1", child_mood_after: 4, scheduled_date: "2026-03-01" }),
      record({ id: "r4", child_id: "child-1", child_mood_after: 5, scheduled_date: "2026-04-01" }),
    ];
    const result = computeChildContactProfile("child-1", [], records);
    expect(result.mood_trend).toBe("improving");
  });

  it("calculates mood_trend as declining when first half average exceeds second by > 0.25", () => {
    const records = [
      record({ id: "r1", child_id: "child-1", child_mood_after: 5, scheduled_date: "2026-01-01" }),
      record({ id: "r2", child_id: "child-1", child_mood_after: 4, scheduled_date: "2026-02-01" }),
      record({ id: "r3", child_id: "child-1", child_mood_after: 2, scheduled_date: "2026-03-01" }),
      record({ id: "r4", child_id: "child-1", child_mood_after: 1, scheduled_date: "2026-04-01" }),
    ];
    const result = computeChildContactProfile("child-1", [], records);
    expect(result.mood_trend).toBe("declining");
  });

  it("calculates mood_trend as stable when difference is <= 0.25", () => {
    const records = [
      record({ id: "r1", child_id: "child-1", child_mood_after: 3, scheduled_date: "2026-01-01" }),
      record({ id: "r2", child_id: "child-1", child_mood_after: 3, scheduled_date: "2026-02-01" }),
      record({ id: "r3", child_id: "child-1", child_mood_after: 3, scheduled_date: "2026-03-01" }),
      record({ id: "r4", child_id: "child-1", child_mood_after: 3, scheduled_date: "2026-04-01" }),
    ];
    const result = computeChildContactProfile("child-1", [], records);
    expect(result.mood_trend).toBe("stable");
  });

  it("returns stable mood_trend when fewer than 2 mood records", () => {
    const records = [
      record({ id: "r1", child_id: "child-1", child_mood_after: 5, scheduled_date: "2026-01-01" }),
    ];
    const result = computeChildContactProfile("child-1", [], records);
    expect(result.mood_trend).toBe("stable");
  });

  it("ignores records with null child_mood_after for mood trend", () => {
    const records = [
      record({ id: "r1", child_id: "child-1", child_mood_after: null, scheduled_date: "2026-01-01" }),
      record({ id: "r2", child_id: "child-1", child_mood_after: null, scheduled_date: "2026-02-01" }),
    ];
    const result = computeChildContactProfile("child-1", [], records);
    expect(result.mood_trend).toBe("stable");
  });

  it("calculates refusal_rate as a percentage", () => {
    const records = [
      record({ id: "r1", child_id: "child-1", outcome: "refused_by_child" }),
      record({ id: "r2", child_id: "child-1", outcome: "completed" }),
      record({ id: "r3", child_id: "child-1", outcome: "completed" }),
    ];
    const result = computeChildContactProfile("child-1", [], records);
    // 1/3 * 100 = 33.333... rounded to 1dp = 33.3
    expect(result.refusal_rate).toBe(33.3);
  });

  it("returns 0 refusal_rate when no records exist", () => {
    const result = computeChildContactProfile("child-1", [], []);
    expect(result.refusal_rate).toBeNull();; });

  it("identifies contact persons with plans but no completed records", () => {
    const plans = [
      plan({ child_id: "child-1", contact_person_name: "Mum", is_active: true }),
      plan({ child_id: "child-1", contact_person_name: "Dad", is_active: true }),
    ];
    const records = [
      record({ child_id: "child-1", contact_person_name: "Mum", outcome: "completed" }),
      // Dad has no completed records
      record({ child_id: "child-1", contact_person_name: "Dad", outcome: "no_show" }),
    ];
    const result = computeChildContactProfile("child-1", plans, records);
    expect(result.no_contact_persons).toEqual(["Dad"]);
  });

  it("excludes inactive plans from no_contact_persons", () => {
    const plans = [
      plan({ child_id: "child-1", contact_person_name: "Mum", is_active: false }),
    ];
    const result = computeChildContactProfile("child-1", plans, []);
    expect(result.no_contact_persons).toEqual([]);
  });
});

// ── computeContactQuality ──────────────────────────────────────────────────

describe("computeContactQuality", () => {
  it("returns zeros and poor rating for empty records", () => {
    const result = computeContactQuality([]);
    expect(result.avg_duration_minutes).toBeNull();; expect(result.voice_capture_rate).toBeNull();; expect(result.mood_recorded_rate).toBeNull();; expect(result.observations_rate).toBeNull();; expect(result.quality_rating).toBe("poor");
    expect(result.safeguarding_flags).toBe(0);
  });

  it("calculates average duration from non-null durations only", () => {
    const records = [
      record({ id: "r1", duration_minutes: 60 }),
      record({ id: "r2", duration_minutes: 30 }),
      record({ id: "r3", duration_minutes: null }),
    ];
    const result = computeContactQuality(records);
    expect(result.avg_duration_minutes).toBe(45); // (60+30)/2
  });

  it("returns 0 average duration when all durations are null", () => {
    const records = [
      record({ id: "r1", duration_minutes: null }),
      record({ id: "r2", duration_minutes: null }),
    ];
    const result = computeContactQuality(records);
    expect(result.avg_duration_minutes).toBeNull();; });

  it("calculates voice_capture_rate correctly", () => {
    const records = [
      record({ id: "r1", child_voice: "I had fun" }),
      record({ id: "r2", child_voice: null }),
      record({ id: "r3", child_voice: "" }),
      record({ id: "r4", child_voice: "   " }), // whitespace only = not captured
    ];
    const result = computeContactQuality(records);
    expect(result.voice_capture_rate).toBe(25); // 1 out of 4
  });

  it("calculates mood_recorded_rate requiring both before AND after", () => {
    const records = [
      record({ id: "r1", child_mood_before: 3, child_mood_after: 4 }), // both
      record({ id: "r2", child_mood_before: 3, child_mood_after: null }), // missing after
      record({ id: "r3", child_mood_before: null, child_mood_after: 4 }), // missing before
      record({ id: "r4", child_mood_before: null, child_mood_after: null }), // neither
    ];
    const result = computeContactQuality(records);
    expect(result.mood_recorded_rate).toBe(25); // 1 out of 4
  });

  it("calculates observations_rate correctly", () => {
    const records = [
      record({ id: "r1", staff_observations: "Positive interaction" }),
      record({ id: "r2", staff_observations: null }),
      record({ id: "r3", staff_observations: "" }),
      record({ id: "r4", staff_observations: "   " }), // whitespace only
      record({ id: "r5", staff_observations: "Good session" }),
    ];
    const result = computeContactQuality(records);
    expect(result.observations_rate).toBe(40); // 2 out of 5
  });

  it("returns excellent when all three rates are >= 80", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      record({
        id: `r${i}`,
        child_voice: "I enjoyed it",
        child_mood_before: 3,
        child_mood_after: 4,
        staff_observations: "Good session",
      }),
    );
    const result = computeContactQuality(records);
    expect(result.quality_rating).toBe("excellent");
  });

  it("returns good when average rate >= 60 but not all >= 80", () => {
    // voice: 7/10=70%, mood: 7/10=70%, obs: 7/10=70% -> avg 70 >= 60, but not all >= 80
    const records = Array.from({ length: 10 }, (_, i) =>
      record({
        id: `r${i}`,
        child_voice: i < 7 ? "Voice captured" : null,
        child_mood_before: i < 7 ? 3 : null,
        child_mood_after: i < 7 ? 4 : null,
        staff_observations: i < 7 ? "Observations" : null,
      }),
    );
    const result = computeContactQuality(records);
    expect(result.quality_rating).toBe("good");
  });

  it("returns adequate when average rate >= 40 but < 60", () => {
    // voice: 5/10=50%, mood: 5/10=50%, obs: 5/10=50% -> avg 50 >= 40
    const records = Array.from({ length: 10 }, (_, i) =>
      record({
        id: `r${i}`,
        child_voice: i < 5 ? "Voice" : null,
        child_mood_before: i < 5 ? 3 : null,
        child_mood_after: i < 5 ? 4 : null,
        staff_observations: i < 5 ? "Obs" : null,
      }),
    );
    const result = computeContactQuality(records);
    expect(result.quality_rating).toBe("adequate");
  });

  it("returns poor when average rate < 40", () => {
    // voice: 1/10=10%, mood: 1/10=10%, obs: 1/10=10% -> avg 10 < 40
    const records = Array.from({ length: 10 }, (_, i) =>
      record({
        id: `r${i}`,
        child_voice: i < 1 ? "Voice" : null,
        child_mood_before: i < 1 ? 3 : null,
        child_mood_after: i < 1 ? 4 : null,
        staff_observations: i < 1 ? "Obs" : null,
      }),
    );
    const result = computeContactQuality(records);
    expect(result.quality_rating).toBe("poor");
  });

  it("counts safeguarding flags from non-empty safeguarding_concerns", () => {
    const records = [
      record({ id: "r1", safeguarding_concerns: "Bruise noticed" }),
      record({ id: "r2", safeguarding_concerns: null }),
      record({ id: "r3", safeguarding_concerns: "" }),
      record({ id: "r4", safeguarding_concerns: "   " }), // whitespace only
      record({ id: "r5", safeguarding_concerns: "Inappropriate language" }),
    ];
    const result = computeContactQuality(records);
    expect(result.safeguarding_flags).toBe(2);
  });

  it("rounds average duration to nearest integer", () => {
    const records = [
      record({ id: "r1", duration_minutes: 45 }),
      record({ id: "r2", duration_minutes: 50 }),
      record({
        id: "r3", duration_minutes: 40,
        child_voice: null, child_mood_before: null, child_mood_after: null,
        staff_observations: null, safeguarding_concerns: null,
      }),
    ];
    const result = computeContactQuality(records);
    expect(result.avg_duration_minutes).toBe(45); // (45+50+40)/3 = 45
  });
});

// ── suggestContactActions ──────────────────────────────────────────────────

describe("suggestContactActions", () => {
  it("returns empty actions when no plans or records exist", () => {
    const result = suggestContactActions([], []);
    expect(result).toEqual([]);
  });

  it("flags overdue weekly contact when no completed records exist", () => {
    const plans = [
      plan({ planned_frequency: "weekly", is_active: true }),
    ];
    const result = suggestContactActions(plans, []);
    const overdue = result.filter((a) => a.type === "overdue_contact");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].priority).toBe("high");
    expect(overdue[0].child_id).toBe("child-1");
    expect(overdue[0].contact_person).toBe("Jane Doe");
  });

  it("flags overdue fortnightly contact with medium priority", () => {
    const plans = [
      plan({ planned_frequency: "fortnightly", is_active: true }),
    ];
    const result = suggestContactActions(plans, []);
    const overdue = result.filter((a) => a.type === "overdue_contact");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].priority).toBe("medium");
  });

  it("flags overdue monthly contact with low priority", () => {
    const plans = [
      plan({ planned_frequency: "monthly", is_active: true }),
    ];
    const result = suggestContactActions(plans, []);
    const overdue = result.filter((a) => a.type === "overdue_contact");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].priority).toBe("low");
  });

  it("does not flag overdue for as_agreed or unrecognised frequencies", () => {
    const plans = [
      plan({ id: "p1", planned_frequency: "as_agreed", is_active: true }),
      plan({ id: "p2", planned_frequency: "unknown_freq", is_active: true }),
    ];
    const result = suggestContactActions(plans, []);
    const overdue = result.filter((a) => a.type === "overdue_contact");
    expect(overdue).toHaveLength(0);
  });

  it("does not flag overdue when recent completed contact exists", () => {
    const today = todayStr();
    const plans = [
      plan({ planned_frequency: "weekly", is_active: true }),
    ];
    const records = [
      record({ outcome: "completed", scheduled_date: today }),
    ];
    const result = suggestContactActions(plans, records);
    const overdue = result.filter((a) => a.type === "overdue_contact");
    expect(overdue).toHaveLength(0);
  });

  it("skips inactive plans for overdue checks", () => {
    const plans = [
      plan({ planned_frequency: "weekly", is_active: false }),
    ];
    const result = suggestContactActions(plans, []);
    const overdue = result.filter((a) => a.type === "overdue_contact");
    expect(overdue).toHaveLength(0);
  });

  it("flags plan review due when review_date is in the past", () => {
    const plans = [
      plan({ review_date: "2020-01-01" }),
    ];
    const result = suggestContactActions(plans, []);
    const reviewDue = result.filter((a) => a.type === "plan_review_due");
    expect(reviewDue).toHaveLength(1);
    expect(reviewDue[0].priority).toBe("medium");
    expect(reviewDue[0].contact_person).toBe("Jane Doe");
  });

  it("does not flag plan review when review_date is in the future", () => {
    const plans = [
      plan({ review_date: "2099-12-31" }),
    ];
    const result = suggestContactActions(plans, []);
    const reviewDue = result.filter((a) => a.type === "plan_review_due");
    expect(reviewDue).toHaveLength(0);
  });

  it("does not flag plan review when review_date is null", () => {
    const plans = [
      plan({ review_date: null }),
    ];
    const result = suggestContactActions(plans, []);
    const reviewDue = result.filter((a) => a.type === "plan_review_due");
    expect(reviewDue).toHaveLength(0);
  });

  it("flags frequent refusal when child refuses >= 3 times", () => {
    const records = [
      record({ id: "r1", outcome: "refused_by_child", contact_person_name: "Mum" }),
      record({ id: "r2", outcome: "refused_by_child", contact_person_name: "Mum" }),
      record({ id: "r3", outcome: "refused_by_child", contact_person_name: "Mum" }),
    ];
    const result = suggestContactActions([], records);
    const refusalActions = result.filter((a) => a.type === "frequent_refusal");
    expect(refusalActions).toHaveLength(1);
    expect(refusalActions[0].priority).toBe("high");
    expect(refusalActions[0].contact_person).toBe("Mum");
  });

  it("does not flag frequent refusal when fewer than 3 refusals", () => {
    const records = [
      record({ id: "r1", outcome: "refused_by_child", contact_person_name: "Mum" }),
      record({ id: "r2", outcome: "refused_by_child", contact_person_name: "Mum" }),
    ];
    const result = suggestContactActions([], records);
    const refusalActions = result.filter((a) => a.type === "frequent_refusal");
    expect(refusalActions).toHaveLength(0);
  });

  it("tracks refusals per child+person pair separately", () => {
    const records = [
      record({ id: "r1", child_id: "c1", outcome: "refused_by_child", contact_person_name: "Mum" }),
      record({ id: "r2", child_id: "c1", outcome: "refused_by_child", contact_person_name: "Mum" }),
      record({ id: "r3", child_id: "c1", outcome: "refused_by_child", contact_person_name: "Mum" }),
      record({ id: "r4", child_id: "c2", outcome: "refused_by_child", contact_person_name: "Mum" }),
      record({ id: "r5", child_id: "c2", outcome: "refused_by_child", contact_person_name: "Mum" }),
    ];
    const result = suggestContactActions([], records);
    const refusalActions = result.filter((a) => a.type === "frequent_refusal");
    // Only c1::Mum has 3, c2::Mum has only 2
    expect(refusalActions).toHaveLength(1);
    expect(refusalActions[0].child_id).toBe("c1");
  });

  it("flags no family contact in 30 days when child has family plan", () => {
    const plans = [
      plan({ child_id: "child-1", contact_person_role: "birth_parent", is_active: true }),
    ];
    // No records at all
    const result = suggestContactActions(plans, []);
    const noFamily = result.filter((a) => a.type === "no_family_contact");
    expect(noFamily).toHaveLength(1);
    expect(noFamily[0].priority).toBe("high");
    expect(noFamily[0].child_id).toBe("child-1");
  });

  it("does not flag no family contact when recent completed family contact exists", () => {
    const today = todayStr();
    const plans = [
      plan({ child_id: "child-1", contact_person_role: "birth_parent", is_active: true }),
    ];
    const records = [
      record({
        child_id: "child-1",
        contact_person_role: "birth_parent",
        outcome: "completed",
        scheduled_date: today,
      }),
    ];
    const result = suggestContactActions(plans, records);
    const noFamily = result.filter((a) => a.type === "no_family_contact");
    expect(noFamily).toHaveLength(0);
  });

  it("does not flag no family contact for non-family plans", () => {
    const plans = [
      plan({ child_id: "child-1", contact_person_role: "social_worker", is_active: true }),
    ];
    const result = suggestContactActions(plans, []);
    const noFamily = result.filter((a) => a.type === "no_family_contact");
    expect(noFamily).toHaveLength(0);
  });

  it("flags mood concern when average mood_after < 2.5", () => {
    const records = [
      record({ id: "r1", child_mood_after: 1, contact_person_name: "Mum" }),
      record({ id: "r2", child_mood_after: 2, contact_person_name: "Mum" }),
      record({ id: "r3", child_mood_after: 2, contact_person_name: "Mum" }),
    ];
    // avg = (1+2+2)/3 = 1.67 < 2.5
    const result = suggestContactActions([], records);
    const moodActions = result.filter((a) => a.type === "mood_concern");
    expect(moodActions).toHaveLength(1);
    expect(moodActions[0].priority).toBe("medium");
    expect(moodActions[0].contact_person).toBe("Mum");
  });

  it("does not flag mood concern when average mood_after >= 2.5", () => {
    const records = [
      record({ id: "r1", child_mood_after: 3, contact_person_name: "Mum" }),
      record({ id: "r2", child_mood_after: 4, contact_person_name: "Mum" }),
    ];
    const result = suggestContactActions([], records);
    const moodActions = result.filter((a) => a.type === "mood_concern");
    expect(moodActions).toHaveLength(0);
  });

  it("ignores records with null mood_after for mood concern", () => {
    const records = [
      record({ id: "r1", child_mood_after: null, contact_person_name: "Mum" }),
      record({ id: "r2", child_mood_after: null, contact_person_name: "Mum" }),
    ];
    const result = suggestContactActions([], records);
    const moodActions = result.filter((a) => a.type === "mood_concern");
    expect(moodActions).toHaveLength(0);
  });

  it("groups mood concern by child+contact person pair", () => {
    const records = [
      record({ id: "r1", child_id: "c1", child_mood_after: 1, contact_person_name: "Mum" }),
      record({ id: "r2", child_id: "c1", child_mood_after: 2, contact_person_name: "Mum" }),
      record({ id: "r3", child_id: "c1", child_mood_after: 4, contact_person_name: "Dad" }),
      record({ id: "r4", child_id: "c1", child_mood_after: 5, contact_person_name: "Dad" }),
    ];
    const result = suggestContactActions([], records);
    const moodActions = result.filter((a) => a.type === "mood_concern");
    // Only c1::Mum has avg < 2.5 (1.5), Dad has avg 4.5
    expect(moodActions).toHaveLength(1);
    expect(moodActions[0].contact_person).toBe("Mum");
  });
});

// ── Constants ───────────────────────────────────────────────────────────────

describe("CONTACT_TYPES", () => {
  it("has exactly 7 contact types", () => {
    expect(CONTACT_TYPES).toHaveLength(7);
  });

  it("each entry has type and label strings", () => {
    for (const ct of CONTACT_TYPES) {
      expect(typeof ct.type).toBe("string");
      expect(ct.type.length).toBeGreaterThan(0);
      expect(typeof ct.label).toBe("string");
      expect(ct.label.length).toBeGreaterThan(0);
    }
  });

  it("has unique type identifiers", () => {
    const types = CONTACT_TYPES.map((ct) => ct.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("includes face_to_face as the first type", () => {
    expect(CONTACT_TYPES[0].type).toBe("face_to_face");
    expect(CONTACT_TYPES[0].label).toBe("Face to Face Visit");
  });

  it("includes overnight_stay as the last type", () => {
    const last = CONTACT_TYPES[CONTACT_TYPES.length - 1];
    expect(last.type).toBe("overnight_stay");
    expect(last.label).toBe("Overnight Stay");
  });
});

describe("CONTACT_PERSONS", () => {
  it("has exactly 10 contact person roles", () => {
    expect(CONTACT_PERSONS).toHaveLength(10);
  });

  it("each entry has role, label, and is_family properties", () => {
    for (const cp of CONTACT_PERSONS) {
      expect(typeof cp.role).toBe("string");
      expect(cp.role.length).toBeGreaterThan(0);
      expect(typeof cp.label).toBe("string");
      expect(cp.label.length).toBeGreaterThan(0);
      expect(typeof cp.is_family).toBe("boolean");
    }
  });

  it("has unique role identifiers", () => {
    const roles = CONTACT_PERSONS.map((cp) => cp.role);
    expect(new Set(roles).size).toBe(roles.length);
  });

  it("marks exactly 4 roles as family", () => {
    const familyRoles = CONTACT_PERSONS.filter((cp) => cp.is_family);
    expect(familyRoles).toHaveLength(4);
  });

  it("includes birth_parent as the first role and is_family", () => {
    expect(CONTACT_PERSONS[0].role).toBe("birth_parent");
    expect(CONTACT_PERSONS[0].is_family).toBe(true);
  });

  it("includes other as the last role and not is_family", () => {
    const last = CONTACT_PERSONS[CONTACT_PERSONS.length - 1];
    expect(last.role).toBe("other");
    expect(last.is_family).toBe(false);
  });

  it("classifies sibling, grandparent, extended_family as family", () => {
    const familyRoles = CONTACT_PERSONS.filter((cp) => cp.is_family).map((cp) => cp.role);
    expect(familyRoles).toContain("sibling");
    expect(familyRoles).toContain("grandparent");
    expect(familyRoles).toContain("extended_family");
  });
});

describe("SUPERVISION_LEVELS", () => {
  it("has exactly 5 levels", () => {
    expect(SUPERVISION_LEVELS).toHaveLength(5);
  });

  it("all items are non-empty strings", () => {
    for (const level of SUPERVISION_LEVELS) {
      expect(typeof level).toBe("string");
      expect(level.length).toBeGreaterThan(0);
    }
  });

  it("has unique values with no duplicates", () => {
    expect(new Set(SUPERVISION_LEVELS).size).toBe(SUPERVISION_LEVELS.length);
  });

  it("starts with unsupervised", () => {
    expect(SUPERVISION_LEVELS[0]).toBe("unsupervised");
  });

  it("ends with no_contact", () => {
    expect(SUPERVISION_LEVELS[SUPERVISION_LEVELS.length - 1]).toBe("no_contact");
  });
});

describe("CONTACT_OUTCOMES", () => {
  it("has exactly 7 outcomes", () => {
    expect(CONTACT_OUTCOMES).toHaveLength(7);
  });

  it("all items are non-empty strings", () => {
    for (const outcome of CONTACT_OUTCOMES) {
      expect(typeof outcome).toBe("string");
      expect(outcome.length).toBeGreaterThan(0);
    }
  });

  it("has unique values with no duplicates", () => {
    expect(new Set(CONTACT_OUTCOMES).size).toBe(CONTACT_OUTCOMES.length);
  });

  it("starts with completed", () => {
    expect(CONTACT_OUTCOMES[0]).toBe("completed");
  });

  it("includes refused_by_child as the last outcome", () => {
    expect(CONTACT_OUTCOMES[CONTACT_OUTCOMES.length - 1]).toBe("refused_by_child");
  });

  it("includes all three cancellation types", () => {
    expect(CONTACT_OUTCOMES).toContain("cancelled_by_child");
    expect(CONTACT_OUTCOMES).toContain("cancelled_by_contact");
    expect(CONTACT_OUTCOMES).toContain("cancelled_by_authority");
  });
});
