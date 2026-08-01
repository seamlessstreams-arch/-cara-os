import { describe, it, expect } from "vitest";
import {
  computeEngagementMetrics,
  identifyEngagementAlerts,
  type FamilyContact,
  type FamilyRelationship,
} from "./family-engagement-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeContact(overrides: Partial<FamilyContact> = {}): FamilyContact {
  return {
    id: "fc-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Child A",
    family_member_name: "Parent A",
    family_member_type: "birth_mother",
    contact_type: "face_to_face",
    contact_date: "2026-05-10",
    duration_minutes: 60,
    outcome: "positive",
    child_mood_before: null,
    child_mood_after: null,
    supervised: false,
    supervisor_name: null,
    notes: null,
    follow_up_actions: [],
    recorded_by: "Staff A",
    created_at: "2026-05-10T10:00:00Z",
    ...overrides,
  };
}

function makeRelationship(overrides: Partial<FamilyRelationship> = {}): FamilyRelationship {
  return {
    id: "fr-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Child A",
    family_member_name: "Parent A",
    family_member_type: "birth_mother",
    relationship_quality: "strong",
    engagement_trend: "stable",
    contact_frequency_agreed: "weekly",
    contact_frequency_actual: "weekly",
    last_contact_date: "2026-05-10",
    court_order_restrictions: false,
    risk_assessment_in_place: false,
    notes: null,
    created_at: "2026-05-10T10:00:00Z",
    updated_at: "2026-05-10T10:00:00Z",
    ...overrides,
  };
}

describe("computeEngagementMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeEngagementMetrics([], [], 4, NOW);
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

  it("computes correct counts and rates for populated data", () => {
    const contacts: FamilyContact[] = [
      makeContact({ id: "c1", outcome: "positive", contact_date: "2026-05-10", duration_minutes: 60, child_id: "child-1" }),
      makeContact({ id: "c2", outcome: "mixed", contact_date: "2026-05-05", duration_minutes: 30, child_id: "child-2", child_name: "Child B" }),
      makeContact({ id: "c3", outcome: "cancelled_family", contact_date: "2026-05-01", child_id: "child-1" }),
      makeContact({ id: "c4", outcome: "dna_family", contact_date: "2026-04-01", child_id: "child-1" }),
    ];
    const relationships: FamilyRelationship[] = [
      makeRelationship({ id: "r1", relationship_quality: "strong", engagement_trend: "improving" }),
      makeRelationship({ id: "r2", relationship_quality: "fragile", engagement_trend: "declining" }),
      makeRelationship({ id: "r3", relationship_quality: "no_contact", engagement_trend: "stable" }),
    ];
    const m = computeEngagementMetrics(contacts, relationships, 4, NOW);
    expect(m.total_contacts).toBe(4);
    // contacts_this_month: c1, c2, c3 are within 30 days of NOW
    expect(m.contacts_this_month).toBe(3);
    // contacts_this_quarter: all 4 within 90 days
    expect(m.contacts_this_quarter).toBe(4);
    // children_with_contact: child-1, child-2 = 2
    expect(m.children_with_contact).toBe(2);
    // positive_contact_rate: 1 positive / 2 completed (positive+mixed) = 50%
    expect(m.positive_contact_rate).toBe(50);
    // cancelled_dna_rate: 2 / 4 = 50%
    expect(m.cancelled_dna_rate).toBe(50);
    // avg_contact_duration: (60+30)/2 = 45
    expect(m.avg_contact_duration).toBe(45);
    // relationships
    expect(m.relationships_strong).toBe(1);
    expect(m.relationships_fragile).toBe(1);
    expect(m.relationships_no_contact).toBe(1);
    expect(m.engagement_improving).toBe(1);
    expect(m.engagement_declining).toBe(1);
  });
});

describe("identifyEngagementAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyEngagementAlerts([], [], 4, NOW)).toEqual([]);
  });

  it("generates high alert for distressing contact within 30 days", () => {
    const contacts = [makeContact({ outcome: "distressing", contact_date: "2026-05-15" })];
    const alerts = identifyEngagementAlerts(contacts, [], 4, NOW);
    const distressing = alerts.filter((a) => a.type === "distressing_contact");
    expect(distressing).toHaveLength(1);
    expect(distressing[0].severity).toBe("high");
  });

  it("generates high alert for repeated DNA by family (>= 2)", () => {
    const contacts = [
      makeContact({ id: "c1", outcome: "dna_family", child_id: "child-1", family_member_name: "Mum" }),
      makeContact({ id: "c2", outcome: "dna_family", child_id: "child-1", family_member_name: "Mum" }),
    ];
    const alerts = identifyEngagementAlerts(contacts, [], 4, NOW);
    const dna = alerts.filter((a) => a.type === "repeated_dna");
    expect(dna).toHaveLength(1);
    expect(dna[0].severity).toBe("high");
  });

  it("generates medium alert for declining engagement", () => {
    const relationships = [makeRelationship({ engagement_trend: "declining" })];
    const alerts = identifyEngagementAlerts([], relationships, 4, NOW);
    const declining = alerts.filter((a) => a.type === "declining_engagement");
    expect(declining).toHaveLength(1);
    expect(declining[0].severity).toBe("medium");
  });

  it("generates medium alert for strained relationship", () => {
    const relationships = [makeRelationship({ relationship_quality: "strained" })];
    const alerts = identifyEngagementAlerts([], relationships, 4, NOW);
    const strained = alerts.filter((a) => a.type === "strained_relationship");
    expect(strained).toHaveLength(1);
    expect(strained[0].severity).toBe("medium");
  });

  it("generates alert for no recent contact (> 30 days)", () => {
    const relationships = [makeRelationship({ last_contact_date: "2026-03-01", relationship_quality: "developing" })];
    const alerts = identifyEngagementAlerts([], relationships, 4, NOW);
    const noContact = alerts.filter((a) => a.type === "no_recent_contact");
    expect(noContact).toHaveLength(1);
    // 81 days > 60 => high
    expect(noContact[0].severity).toBe("high");
  });

  it("generates medium severity for no contact between 30-60 days", () => {
    const relationships = [makeRelationship({ last_contact_date: "2026-04-15", relationship_quality: "developing" })];
    const alerts = identifyEngagementAlerts([], relationships, 4, NOW);
    const noContact = alerts.filter((a) => a.type === "no_recent_contact");
    expect(noContact).toHaveLength(1);
    expect(noContact[0].severity).toBe("medium");
  });
});
