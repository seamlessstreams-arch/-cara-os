import { describe, it, expect } from "vitest";
import {
  computeProfessionalNetworkMetrics,
  identifyProfessionalNetworkAlerts,
} from "./professional-network-directory-service";
import type { ProfessionalNetworkRecord } from "./professional-network-directory-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<ProfessionalNetworkRecord> = {}): ProfessionalNetworkRecord {
  return {
    id: "pn-1",
    home_id: "home-1",
    child_name: "Alex",
    child_id: "child-1",
    professional_role: "social_worker",
    contact_frequency: "monthly",
    engagement_quality: "good",
    relationship_status: "active",
    session_date: "2026-05-01",
    recorded_by: "Staff A",
    professional_name: "Jane Smith",
    organisation: "LA Services",
    contact_email: "jane@example.com",
    contact_phone: "0123456789",
    last_contact_date: "2026-05-01",
    next_planned_contact: "2026-06-01",
    relationship_notes: null,
    communication_preferences: null,
    escalation_contact: null,
    referral_source: null,
    approved_by: null,
    approved_at: null,
    next_review_date: null,
    notes: null,
    contact_details_current: true,
    consent_to_share: true,
    regular_communication: true,
    attends_reviews: true,
    responsive_to_contact: true,
    child_aware_of_professional: true,
    child_views_shared: true,
    information_sharing_agreed: true,
    emergency_contact_confirmed: true,
    statutory_requirements_met: true,
    relationship_quality_reviewed: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeProfessionalNetworkMetrics ----------------------------------------

describe("computeProfessionalNetworkMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeProfessionalNetworkMetrics([]);
    expect(m.total_contacts).toBe(0);
    expect(m.poor_engagement_count).toBe(0);
    expect(m.pending_allocation_count).toBe(0);
    expect(m.ended_count).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.contact_current_rate).toBe(0);
    expect(m.consent_rate).toBe(0);
    expect(m.unique_children).toBe(0);
  });

  it("counts poor and disengaged engagement", () => {
    const records = [
      makeRecord({ id: "1", engagement_quality: "poor" }),
      makeRecord({ id: "2", engagement_quality: "disengaged" }),
      makeRecord({ id: "3", engagement_quality: "good" }),
    ];
    const m = computeProfessionalNetworkMetrics(records);
    expect(m.poor_engagement_count).toBe(2);
  });

  it("counts relationship statuses", () => {
    const records = [
      makeRecord({ id: "1", relationship_status: "active" }),
      makeRecord({ id: "2", relationship_status: "pending_allocation" }),
      makeRecord({ id: "3", relationship_status: "ended" }),
    ];
    const m = computeProfessionalNetworkMetrics(records);
    expect(m.active_count).toBe(1);
    expect(m.pending_allocation_count).toBe(1);
    expect(m.ended_count).toBe(1);
  });

  it("computes boolean rates at 50%", () => {
    const records = [
      makeRecord({ id: "1", contact_details_current: true, consent_to_share: true }),
      makeRecord({ id: "2", contact_details_current: false, consent_to_share: false }),
    ];
    const m = computeProfessionalNetworkMetrics(records);
    expect(m.contact_current_rate).toBe(50);
    expect(m.consent_rate).toBe(50);
  });

  it("computes 100% rates when all booleans are true", () => {
    const records = [makeRecord(), makeRecord({ id: "2" })];
    const m = computeProfessionalNetworkMetrics(records);
    expect(m.communication_rate).toBe(100);
    expect(m.attends_reviews_rate).toBe(100);
    expect(m.responsive_rate).toBe(100);
    expect(m.child_aware_rate).toBe(100);
    expect(m.info_sharing_rate).toBe(100);
    expect(m.statutory_met_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex" }),
      makeRecord({ id: "2", child_name: "Alex" }),
      makeRecord({ id: "3", child_name: "Beth" }),
    ];
    const m = computeProfessionalNetworkMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("populates breakdown by role and frequency", () => {
    const records = [
      makeRecord({ id: "1", professional_role: "social_worker", contact_frequency: "monthly" }),
      makeRecord({ id: "2", professional_role: "independent_reviewing_officer", contact_frequency: "quarterly" }),
    ];
    const m = computeProfessionalNetworkMetrics(records);
    expect(m.by_professional_role).toEqual({ social_worker: 1, independent_reviewing_officer: 1 });
    expect(m.by_contact_frequency).toEqual({ monthly: 1, quarterly: 1 });
  });
});

// -- identifyProfessionalNetworkAlerts ----------------------------------------

describe("identifyProfessionalNetworkAlerts", () => {
  it("returns empty alerts for empty records", () => {
    expect(identifyProfessionalNetworkAlerts([])).toHaveLength(0);
  });

  it("returns empty alerts for fully compliant records", () => {
    expect(identifyProfessionalNetworkAlerts([makeRecord()])).toHaveLength(0);
  });

  it("fires critical alert for disengaged with statutory requirements not met", () => {
    const records = [
      makeRecord({ engagement_quality: "disengaged", statutory_requirements_met: false }),
    ];
    const alerts = identifyProfessionalNetworkAlerts(records);
    const critical = alerts.filter((a) => a.type === "disengaged_statutory");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("fires high alert for pending allocation (threshold >= 1)", () => {
    const records = [makeRecord({ relationship_status: "pending_allocation" })];
    const alerts = identifyProfessionalNetworkAlerts(records);
    expect(alerts.filter((a) => a.type === "pending_allocation")).toHaveLength(1);
    expect(alerts.find((a) => a.type === "pending_allocation")!.severity).toBe("high");
  });

  it("fires high alert for outdated contact details (threshold >= 1)", () => {
    const records = [makeRecord({ contact_details_current: false })];
    const alerts = identifyProfessionalNetworkAlerts(records);
    expect(alerts.filter((a) => a.type === "contact_details_outdated")).toHaveLength(1);
    expect(alerts.find((a) => a.type === "contact_details_outdated")!.severity).toBe("high");
  });

  it("fires medium alert for poor engagement at threshold of 2", () => {
    const alerts1 = identifyProfessionalNetworkAlerts([makeRecord({ engagement_quality: "poor" })]);
    expect(alerts1.filter((a) => a.type === "poor_engagement")).toHaveLength(0);

    const alerts2 = identifyProfessionalNetworkAlerts([
      makeRecord({ id: "1", engagement_quality: "poor" }),
      makeRecord({ id: "2", engagement_quality: "disengaged" }),
    ]);
    expect(alerts2.filter((a) => a.type === "poor_engagement")).toHaveLength(1);
    expect(alerts2.find((a) => a.type === "poor_engagement")!.severity).toBe("medium");
  });

  it("fires medium alert for no information sharing at threshold of 2", () => {
    const alerts1 = identifyProfessionalNetworkAlerts([makeRecord({ information_sharing_agreed: false })]);
    expect(alerts1.filter((a) => a.type === "no_information_sharing")).toHaveLength(0);

    const alerts2 = identifyProfessionalNetworkAlerts([
      makeRecord({ id: "1", information_sharing_agreed: false }),
      makeRecord({ id: "2", information_sharing_agreed: false }),
    ]);
    expect(alerts2.filter((a) => a.type === "no_information_sharing")).toHaveLength(1);
  });

  it("does NOT fire critical when disengaged but statutory requirements met", () => {
    const records = [
      makeRecord({ engagement_quality: "disengaged", statutory_requirements_met: true }),
    ];
    const alerts = identifyProfessionalNetworkAlerts(records);
    expect(alerts.filter((a) => a.type === "disengaged_statutory")).toHaveLength(0);
  });
});
