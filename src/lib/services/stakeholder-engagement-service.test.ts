import { describe, it, expect } from "vitest";
import {
  computeEngagementMetrics,
  identifyEngagementAlerts,
} from "./stakeholder-engagement-service";
import type {
  StakeholderContact,
  StakeholderFeedback,
} from "./stakeholder-engagement-service";

// -- Factories ----------------------------------------------------------------

function makeContact(overrides: Partial<StakeholderContact> = {}): StakeholderContact {
  return {
    id: "sc-1",
    home_id: "home-1",
    stakeholder_type: "social_worker",
    stakeholder_name: "SW Smith",
    organisation: "LA East",
    child_id: null,
    child_name: null,
    contact_date: "2026-05-15",
    engagement_method: "phone",
    initiated_by: "home",
    purpose: "Review update",
    summary: "Discussed progress",
    outcomes: null,
    actions_agreed: [],
    follow_up_date: null,
    follow_up_completed: false,
    staff_member: "Staff A",
    notes: null,
    created_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<StakeholderFeedback> = {}): StakeholderFeedback {
  return {
    id: "sf-1",
    home_id: "home-1",
    stakeholder_type: "social_worker",
    stakeholder_name: "SW Smith",
    organisation: "LA East",
    feedback_date: "2026-05-10",
    rating: "satisfied",
    communication_rating: "satisfied",
    responsiveness_rating: "satisfied",
    information_sharing_rating: "satisfied",
    overall_relationship: "good",
    strengths: null,
    areas_for_improvement: null,
    comments: null,
    collected_by: "Manager",
    created_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

const NOW = new Date("2026-05-21T12:00:00Z");

// -- computeEngagementMetrics -------------------------------------------------

describe("computeEngagementMetrics", () => {
  it("returns zeroes for empty data", () => {
    const r = computeEngagementMetrics([], []);
    expect(r.total_contacts).toBe(0);
    expect(r.contacts_this_month).toBe(0);
    expect(r.unique_stakeholders).toBe(0);
    expect(r.home_initiated_rate).toBeNull();;
    expect(r.follow_up_completion_rate).toBeNull();;
    expect(r.overdue_follow_ups).toBe(0);
    expect(r.avg_satisfaction_score).toBeNull();;
    expect(r.feedback_count).toBe(0);
  });

  it("counts unique stakeholders", () => {
    const contacts = [
      makeContact({ id: "1", stakeholder_name: "SW Smith" }),
      makeContact({ id: "2", stakeholder_name: "Dr Jones" }),
      makeContact({ id: "3", stakeholder_name: "SW Smith" }),
    ];
    expect(computeEngagementMetrics(contacts, []).unique_stakeholders).toBe(2);
  });

  it("calculates home initiated rate", () => {
    const contacts = [
      makeContact({ id: "1", initiated_by: "home" }),
      makeContact({ id: "2", initiated_by: "stakeholder" }),
    ];
    expect(computeEngagementMetrics(contacts, []).home_initiated_rate).toBe(50);
  });

  it("calculates follow-up completion rate and overdue count", () => {
    const contacts = [
      makeContact({ id: "1", follow_up_date: "2026-05-10", follow_up_completed: true }),
      makeContact({ id: "2", follow_up_date: "2026-05-01", follow_up_completed: false }),
      makeContact({ id: "3", follow_up_date: null, follow_up_completed: false }),
    ];
    const r = computeEngagementMetrics(contacts, []);
    // 2 have follow_up_date, 1 completed => 50%
    expect(r.follow_up_completion_rate).toBe(50);
    expect(r.overdue_follow_ups).toBe(1);
  });

  it("calculates average satisfaction score (very_satisfied=5, satisfied=4, etc.)", () => {
    const feedback = [
      makeFeedback({ id: "1", rating: "very_satisfied" }),   // 5
      makeFeedback({ id: "2", rating: "dissatisfied" }),      // 2
    ];
    // (5+2)/2 = 3.5
    expect(computeEngagementMetrics([], feedback).avg_satisfaction_score).toBe(3.5);
  });

  it("populates by_stakeholder_type and by_engagement_method", () => {
    const contacts = [
      makeContact({ id: "1", stakeholder_type: "social_worker", engagement_method: "phone" }),
      makeContact({ id: "2", stakeholder_type: "school", engagement_method: "email" }),
    ];
    const r = computeEngagementMetrics(contacts, []);
    expect(r.by_stakeholder_type).toEqual({ social_worker: 1, school: 1 });
    expect(r.by_engagement_method).toEqual({ phone: 1, email: 1 });
  });

  it("populates relationship distribution from feedback", () => {
    const feedback = [
      makeFeedback({ id: "1", overall_relationship: "good" }),
      makeFeedback({ id: "2", overall_relationship: "poor" }),
    ];
    const r = computeEngagementMetrics([], feedback);
    expect(r.relationship_distribution).toEqual({ good: 1, poor: 1 });
    expect(r.feedback_count).toBe(2);
  });
});

// -- identifyEngagementAlerts -------------------------------------------------

describe("identifyEngagementAlerts", () => {
  it("returns empty for empty data", () => {
    expect(identifyEngagementAlerts([], [], NOW)).toEqual([]);
  });

  it("fires follow_up_overdue with severity based on days (>14 = high)", () => {
    const contacts = [
      makeContact({ follow_up_date: "2026-04-01", follow_up_completed: false }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], NOW);
    const a = alerts.filter((x) => x.type === "follow_up_overdue");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("high"); // >14 days overdue
  });

  it("fires follow_up_overdue with medium severity for <=14 days", () => {
    const contacts = [
      makeContact({ follow_up_date: "2026-05-10", follow_up_completed: false }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], NOW);
    const a = alerts.filter((x) => x.type === "follow_up_overdue");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("medium");
  });

  it("fires poor_relationship for 'poor' overall_relationship", () => {
    const feedback = [
      makeFeedback({ overall_relationship: "poor" }),
    ];
    const alerts = identifyEngagementAlerts([], feedback, NOW);
    const a = alerts.filter((x) => x.type === "poor_relationship");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("high");
  });

  it("fires strained_relationship for 'strained' overall_relationship", () => {
    const feedback = [
      makeFeedback({ overall_relationship: "strained" }),
    ];
    const alerts = identifyEngagementAlerts([], feedback, NOW);
    expect(alerts.filter((x) => x.type === "strained_relationship")).toHaveLength(1);
  });

  it("fires social_worker_no_contact when >30 days since last contact", () => {
    const contacts = [
      makeContact({ stakeholder_type: "social_worker", stakeholder_name: "SW Smith", contact_date: "2026-04-01" }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], NOW);
    expect(alerts.filter((x) => x.type === "social_worker_no_contact")).toHaveLength(1);
  });

  it("does NOT fire social_worker_no_contact within 30 days", () => {
    const contacts = [
      makeContact({ stakeholder_type: "social_worker", contact_date: "2026-05-15" }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], NOW);
    expect(alerts.filter((x) => x.type === "social_worker_no_contact")).toHaveLength(0);
  });

  it("fires stakeholder_very_dissatisfied for very_dissatisfied rating", () => {
    const feedback = [
      makeFeedback({ rating: "very_dissatisfied" }),
    ];
    const alerts = identifyEngagementAlerts([], feedback, NOW);
    const a = alerts.filter((x) => x.type === "stakeholder_very_dissatisfied");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("high");
  });
});
