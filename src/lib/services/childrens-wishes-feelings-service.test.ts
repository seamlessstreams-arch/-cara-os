import { describe, it, expect } from "vitest";
import {
  computeWishesMetrics,
  identifyWishesAlerts,
} from "./childrens-wishes-feelings-service";
import type { WishesFeelingsRecord } from "./childrens-wishes-feelings-service";

// -- Factory Function ---------------------------------------------------------

function makeRecord(overrides: Partial<WishesFeelingsRecord> = {}): WishesFeelingsRecord {
  return {
    id: "wf-1",
    home_id: "home-1",
    child_name: "Alex",
    child_id: "c1",
    recorded_date: "2026-05-10",
    wishes_category: "daily_life",
    feeling_rating: "happy",
    capture_method: "key_worker_session",
    what_child_said: "I want a later bedtime",
    what_child_wants: "10pm bedtime",
    response_outcome: "wish_granted",
    response_details: "Agreed to trial",
    responded_by: "staff-1",
    response_date: "2026-05-11",
    child_informed_of_outcome: true,
    child_satisfied_with_response: true,
    influenced_care_plan: true,
    recorded_by: "staff-1",
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeWishesMetrics -----------------------------------------------------

describe("computeWishesMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeWishesMetrics([], 4);
    expect(m.total_records).toBe(0);
    expect(m.children_with_records).toBe(0);
    // totalChildren=4 → 0/4 = real 0 for participation_rate.
    expect(m.participation_rate).toBe(0);
    expect(m.wish_granted_count).toBe(0);
    // records=[] → null for all rate/mean fields.
    expect(m.child_informed_rate).toBeNull();
    expect(m.child_satisfied_rate).toBeNull();
    expect(m.positive_feeling_rate).toBeNull();
    expect(m.negative_feeling_rate).toBeNull();
    expect(m.average_per_child).toBeNull();
  });

  it("computes populated metrics correctly", () => {
    const records = [
      makeRecord({ child_id: "c1", feeling_rating: "happy", response_outcome: "wish_granted", child_informed_of_outcome: true, child_satisfied_with_response: true, influenced_care_plan: true }),
      makeRecord({ id: "wf-2", child_id: "c2", child_name: "Beth", feeling_rating: "very_unhappy", response_outcome: "wish_not_possible", child_informed_of_outcome: false, child_satisfied_with_response: false, influenced_care_plan: false }),
      makeRecord({ id: "wf-3", child_id: "c1", feeling_rating: "very_happy", response_outcome: "awaiting_response", child_informed_of_outcome: true, child_satisfied_with_response: null, influenced_care_plan: false }),
    ];
    const m = computeWishesMetrics(records, 4);

    expect(m.total_records).toBe(3);
    expect(m.children_with_records).toBe(2);
    expect(m.participation_rate).toBe(50);
    expect(m.wish_granted_count).toBe(1);
    expect(m.wish_not_possible_count).toBe(1);
    expect(m.awaiting_response_count).toBe(1);
    // 2/3 informed
    expect(m.child_informed_rate).toBe(66.7);
    // satisfied: 1 true, 1 false out of 2 non-null = 50%
    expect(m.child_satisfied_rate).toBe(50);
    // 1/3 influenced care plan
    expect(m.influenced_care_plan_rate).toBe(33.3);
    // happy + very_happy = 2/3 positive
    expect(m.positive_feeling_rate).toBe(66.7);
    // very_unhappy = 1/3 negative
    expect(m.negative_feeling_rate).toBe(33.3);
    // 3 records / 2 children = 1.5
    expect(m.average_per_child).toBe(1.5);
  });

  it("computes by_child breakdown", () => {
    const records = [
      makeRecord({ child_name: "Alex" }),
      makeRecord({ id: "wf-2", child_name: "Alex" }),
      makeRecord({ id: "wf-3", child_name: "Beth", child_id: "c2" }),
    ];
    const m = computeWishesMetrics(records, 4);
    expect(m.by_child).toEqual({ Alex: 2, Beth: 1 });
  });
});

// -- identifyWishesAlerts -----------------------------------------------------

describe("identifyWishesAlerts", () => {
  it("returns no alerts for empty data with 0 totalChildren", () => {
    const alerts = identifyWishesAlerts([], 0);
    expect(alerts).toHaveLength(0);
  });

  it("fires no_wishes_captured when totalChildren > children with records", () => {
    const records = [makeRecord({ child_id: "c1" })];
    const alerts = identifyWishesAlerts(records, 4);
    expect(alerts.some((a) => a.type === "no_wishes_captured" && a.severity === "high")).toBe(true);
  });

  it("fires wishes_awaiting when >= 2 records awaiting response", () => {
    const records = [
      makeRecord({ id: "wf-1", response_outcome: "awaiting_response" }),
      makeRecord({ id: "wf-2", response_outcome: "awaiting_response" }),
    ];
    const alerts = identifyWishesAlerts(records, 0);
    expect(alerts.some((a) => a.type === "wishes_awaiting" && a.severity === "high")).toBe(true);
  });

  it("does NOT fire wishes_awaiting when only 1 awaiting", () => {
    const records = [makeRecord({ response_outcome: "awaiting_response" })];
    const alerts = identifyWishesAlerts(records, 0);
    expect(alerts.some((a) => a.type === "wishes_awaiting")).toBe(false);
  });

  it("fires child_not_informed when >= 2 resolved records not informed", () => {
    const records = [
      makeRecord({ id: "wf-1", response_outcome: "wish_granted", child_informed_of_outcome: false }),
      makeRecord({ id: "wf-2", response_outcome: "wish_not_possible", child_informed_of_outcome: false }),
    ];
    const alerts = identifyWishesAlerts(records, 0);
    expect(alerts.some((a) => a.type === "child_not_informed" && a.severity === "medium")).toBe(true);
  });

  it("fires very_unhappy for each very_unhappy feeling record", () => {
    const records = [
      makeRecord({ id: "wf-1", feeling_rating: "very_unhappy", child_name: "Alex", wishes_category: "contact" }),
      makeRecord({ id: "wf-2", feeling_rating: "very_unhappy", child_name: "Beth", child_id: "c2", wishes_category: "placement" }),
    ];
    const alerts = identifyWishesAlerts(records, 0);
    const veryUnhappyAlerts = alerts.filter((a) => a.type === "very_unhappy");
    expect(veryUnhappyAlerts).toHaveLength(2);
    expect(veryUnhappyAlerts[0].severity).toBe("high");
  });

  it("fires not_influencing_plans when >= 3 significant wishes not influencing care plan", () => {
    const records = [
      makeRecord({ id: "wf-1", wishes_category: "placement", influenced_care_plan: false }),
      makeRecord({ id: "wf-2", wishes_category: "contact", influenced_care_plan: false, child_id: "c2" }),
      makeRecord({ id: "wf-3", wishes_category: "education", influenced_care_plan: false, child_id: "c3" }),
    ];
    const alerts = identifyWishesAlerts(records, 0);
    expect(alerts.some((a) => a.type === "not_influencing_plans" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire not_influencing_plans when category is not placement/contact/education", () => {
    const records = [
      makeRecord({ id: "wf-1", wishes_category: "daily_life", influenced_care_plan: false }),
      makeRecord({ id: "wf-2", wishes_category: "activities", influenced_care_plan: false, child_id: "c2" }),
      makeRecord({ id: "wf-3", wishes_category: "friendships", influenced_care_plan: false, child_id: "c3" }),
    ];
    const alerts = identifyWishesAlerts(records, 0);
    expect(alerts.some((a) => a.type === "not_influencing_plans")).toBe(false);
  });
});
