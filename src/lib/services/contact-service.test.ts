import { describe, it, expect } from "vitest";
import {
  computeContactCompliance,
  computeChildContactProfile,
  computeContactQuality,
  suggestContactActions,
  type ContactPlan,
  type ContactRecord,
} from "./contact-service";

function makePlan(overrides: Partial<ContactPlan> = {}): ContactPlan {
  return {
    id: "plan-1",
    home_id: "home-1",
    child_id: "child-1",
    contact_person_name: "Mum",
    contact_person_role: "birth_parent",
    relationship_detail: "Birth mother",
    approved_contact_types: ["face_to_face", "phone_call"],
    supervision_level: "supervised_staff",
    planned_frequency: "weekly",
    court_ordered: false,
    risk_notes: null,
    is_active: true,
    approved_by: "Social Worker A",
    approved_date: "2026-01-01",
    review_date: null,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
    ...overrides,
  };
}

function makeRecord(overrides: Partial<ContactRecord> = {}): ContactRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    child_id: "child-1",
    contact_plan_id: "plan-1",
    contact_person_name: "Mum",
    contact_person_role: "birth_parent",
    contact_type: "face_to_face",
    supervision_level: "supervised_staff",
    scheduled_date: "2026-05-01",
    actual_date: "2026-05-01",
    duration_minutes: 60,
    location: "Contact centre",
    outcome: "completed",
    child_mood_before: 3,
    child_mood_after: 4,
    child_voice: "It was nice",
    staff_observations: "Good contact",
    safeguarding_concerns: null,
    supervised_by: "Staff A",
    recorded_by: "Staff A",
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("contact-service", () => {
  // ── computeContactCompliance ──────────────────────────────────────────

  describe("computeContactCompliance", () => {
    it("returns zeroes for empty data", () => {
      const m = computeContactCompliance([], []);
      expect(m.total_plans).toBe(0);
      expect(m.active_plans).toBe(0);
      expect(m.total_contacts).toBe(0);
      expect(m.completed_contacts).toBe(0);
      expect(m.completion_rate).toBeNull(); // fab-0.;
      expect(m.family_contact_count).toBe(0);
      expect(m.sibling_contact_count).toBe(0);
    });

    it("computes populated compliance metrics", () => {
      const plans = [
        makePlan({ id: "p1", is_active: true }),
        makePlan({ id: "p2", is_active: false }),
      ];
      const records = [
        makeRecord({ id: "r1", outcome: "completed", contact_person_role: "birth_parent" }),
        makeRecord({ id: "r2", outcome: "cancelled_by_child", contact_person_role: "sibling" }),
        makeRecord({ id: "r3", outcome: "no_show", contact_person_role: "friend" }),
        makeRecord({ id: "r4", outcome: "refused_by_child", contact_person_role: "grandparent" }),
      ];
      const m = computeContactCompliance(plans, records);
      expect(m.total_plans).toBe(2);
      expect(m.active_plans).toBe(1);
      expect(m.total_contacts).toBe(4);
      expect(m.completed_contacts).toBe(1);
      expect(m.cancelled_contacts).toBe(1);
      expect(m.no_shows).toBe(1);
      expect(m.refusals).toBe(1);
      expect(m.completion_rate).toBe(25);
      // family = birth_parent + sibling + grandparent = 3
      expect(m.family_contact_count).toBe(3);
      expect(m.sibling_contact_count).toBe(1);
    });

    it("counts plans_overdue_review for past review dates", () => {
      const plans = [
        makePlan({ id: "p1", review_date: "2025-01-01" }),
        makePlan({ id: "p2", review_date: "2099-01-01" }),
        makePlan({ id: "p3", review_date: null }),
      ];
      const m = computeContactCompliance(plans, []);
      expect(m.plans_overdue_review).toBe(1);
    });
  });

  // ── computeChildContactProfile ────────────────────────────────────────

  describe("computeChildContactProfile", () => {
    it("returns profile for child with no records", () => {
      const plan = makePlan({ child_id: "c1", is_active: true });
      const profile = computeChildContactProfile("c1", [plan], []);
      expect(profile.child_id).toBe("c1");
      expect(profile.active_contacts).toHaveLength(1);
      expect(profile.active_contacts[0].last_contact).toBeNull();
      expect(profile.total_contacts_30d).toBe(0);
      expect(profile.mood_trend).toBe("stable");
      expect(profile.refusal_rate).toBeNull(); // fab-0.;
      expect(profile.no_contact_persons).toContain("Mum");
    });

    it("computes mood trend as improving", () => {
      const records = [
        makeRecord({ child_id: "c1", scheduled_date: "2026-05-01", child_mood_after: 2 }),
        makeRecord({ child_id: "c1", scheduled_date: "2026-05-10", child_mood_after: 2 }),
        makeRecord({ child_id: "c1", scheduled_date: "2026-05-15", child_mood_after: 4 }),
        makeRecord({ child_id: "c1", scheduled_date: "2026-05-20", child_mood_after: 5 }),
      ];
      const profile = computeChildContactProfile("c1", [], records);
      expect(profile.mood_trend).toBe("improving");
    });
  });

  // ── computeContactQuality ─────────────────────────────────────────────

  describe("computeContactQuality", () => {
    it("returns poor rating for empty records", () => {
      const q = computeContactQuality([]);
      expect(q.avg_duration_minutes).toBeNull(); // fab-0.;
      expect(q.quality_rating).toBe("poor");
      expect(q.safeguarding_flags).toBe(0);
    });

    it("computes quality rating excellent when all rates >= 80%", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        makeRecord({
          id: `r${i}`,
          duration_minutes: 60,
          child_voice: "My views",
          child_mood_before: 3,
          child_mood_after: 4,
          staff_observations: "Good session",
        }),
      );
      const q = computeContactQuality(records);
      expect(q.voice_capture_rate).toBe(100);
      expect(q.mood_recorded_rate).toBe(100);
      expect(q.observations_rate).toBe(100);
      expect(q.quality_rating).toBe("excellent");
      expect(q.avg_duration_minutes).toBe(60);
    });

    it("counts safeguarding flags", () => {
      const records = [
        makeRecord({ id: "r1", safeguarding_concerns: "Some concern" }),
        makeRecord({ id: "r2", safeguarding_concerns: null }),
        makeRecord({ id: "r3", safeguarding_concerns: "Another concern" }),
      ];
      const q = computeContactQuality(records);
      expect(q.safeguarding_flags).toBe(2);
    });
  });

  // ── suggestContactActions ─────────────────────────────────────────────

  describe("suggestContactActions", () => {
    it("returns empty for no plans or records", () => {
      expect(suggestContactActions([], [])).toEqual([]);
    });

    it("flags frequent_refusal when child refuses 3+ times with same person", () => {
      const records = [
        makeRecord({ id: "r1", child_id: "c1", contact_person_name: "Dad", outcome: "refused_by_child" }),
        makeRecord({ id: "r2", child_id: "c1", contact_person_name: "Dad", outcome: "refused_by_child" }),
        makeRecord({ id: "r3", child_id: "c1", contact_person_name: "Dad", outcome: "refused_by_child" }),
      ];
      const actions = suggestContactActions([], records);
      expect(actions.some((a) => a.type === "frequent_refusal" && a.priority === "high")).toBe(true);
    });

    it("flags plan_review_due for past review dates", () => {
      const plans = [
        makePlan({ review_date: "2025-01-01", child_id: "c1", contact_person_name: "Mum" }),
      ];
      const actions = suggestContactActions(plans, []);
      expect(actions.some((a) => a.type === "plan_review_due")).toBe(true);
    });
  });
});
