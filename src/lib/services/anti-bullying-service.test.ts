import { describe, it, expect } from "vitest";
import { computeBullyingMetrics, identifyBullyingAlerts } from "./anti-bullying-service";
import type { BullyingIncident } from "./anti-bullying-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeIncident(overrides: Partial<BullyingIncident> = {}): BullyingIncident {
  return {
    id: "inc-1", home_id: "home-1", incident_date: "2026-05-15",
    reported_by: "staff-1", bullying_type: "verbal",
    severity: "medium", perpetrator_name: "Jordan",
    perpetrator_is_resident: true, victim_name: "Alex",
    victim_id: "child-1", description: "Verbal bullying at dinner",
    location: "Dining room", witnesses: ["staff-2"],
    intervention_type: "restorative_conversation",
    outcome: "resolved", parent_carer_informed: true,
    social_worker_informed: true, follow_up_date: null,
    follow_up_completed: false, impact_on_victim: null,
    created_at: "2026-05-15T00:00:00Z", updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

describe("computeBullyingMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeBullyingMetrics([], 4, NOW);
    expect(result.total_incidents).toBe(0);
    expect(result.incidents_this_month).toBe(0);
    expect(result.resolved_count).toBe(0);
    expect(result.unique_victims).toBe(0);
    expect(result.parent_informed_rate).toBeNull();;
  });

  it("counts total incidents and resolved/pending/escalated", () => {
    const incidents = [
      makeIncident({ id: "i1", outcome: "resolved" }),
      makeIncident({ id: "i2", outcome: "pending" }),
      makeIncident({ id: "i3", outcome: "escalated" }),
      makeIncident({ id: "i4", outcome: "safeguarding_referral" }),
    ];
    const result = computeBullyingMetrics(incidents, 4, NOW);
    expect(result.total_incidents).toBe(4);
    expect(result.resolved_count).toBe(1);
    expect(result.pending_count).toBe(1);
    expect(result.escalated_count).toBe(2); // escalated + safeguarding_referral
    expect(result.safeguarding_referrals).toBe(1);
  });

  it("counts incidents this month (within 30 days)", () => {
    const incidents = [
      makeIncident({ id: "i1", incident_date: "2026-05-15" }), // within 30 days
      makeIncident({ id: "i2", incident_date: "2026-04-01" }), // > 30 days ago
    ];
    const result = computeBullyingMetrics(incidents, 4, NOW);
    expect(result.incidents_this_month).toBe(1);
  });

  it("counts follow-ups pending", () => {
    const incidents = [
      makeIncident({ id: "i1", follow_up_date: "2026-05-25", follow_up_completed: false }),
      makeIncident({ id: "i2", follow_up_date: "2026-05-20", follow_up_completed: true }),
      makeIncident({ id: "i3", follow_up_date: null, follow_up_completed: false }),
    ];
    const result = computeBullyingMetrics(incidents, 4, NOW);
    expect(result.follow_ups_pending).toBe(1);
  });

  it("computes parent informed rate", () => {
    const incidents = [
      makeIncident({ id: "i1", parent_carer_informed: true }),
      makeIncident({ id: "i2", parent_carer_informed: false }),
    ];
    const result = computeBullyingMetrics(incidents, 4, NOW);
    expect(result.parent_informed_rate).toBe(50);
  });

  it("counts unique and repeat victims", () => {
    const incidents = [
      makeIncident({ id: "i1", victim_id: "c1", victim_name: "Alex" }),
      makeIncident({ id: "i2", victim_id: "c1", victim_name: "Alex" }),
      makeIncident({ id: "i3", victim_id: "c2", victim_name: "Jordan" }),
    ];
    const result = computeBullyingMetrics(incidents, 4, NOW);
    expect(result.unique_victims).toBe(2);
    expect(result.repeat_victims).toBe(1);
  });

  it("computes resident perpetrator rate and cyber count", () => {
    const incidents = [
      makeIncident({ id: "i1", perpetrator_is_resident: true, bullying_type: "cyber" }),
      makeIncident({ id: "i2", perpetrator_is_resident: false, bullying_type: "verbal" }),
    ];
    const result = computeBullyingMetrics(incidents, 4, NOW);
    expect(result.resident_perpetrator_rate).toBe(50);
    expect(result.cyber_incidents).toBe(1);
  });

  it("groups by type, severity, intervention, outcome", () => {
    const incidents = [
      makeIncident({ id: "i1", bullying_type: "verbal", severity: "high", intervention_type: "mediation", outcome: "resolved" }),
      makeIncident({ id: "i2", bullying_type: "physical", severity: "low", intervention_type: "safety_plan", outcome: "pending" }),
    ];
    const result = computeBullyingMetrics(incidents, 4, NOW);
    expect(result.by_type["verbal"]).toBe(1);
    expect(result.by_type["physical"]).toBe(1);
    expect(result.by_severity["high"]).toBe(1);
    expect(result.by_intervention["mediation"]).toBe(1);
    expect(result.by_outcome["resolved"]).toBe(1);
  });
});

describe("identifyBullyingAlerts", () => {
  it("returns empty array for empty data", () => {
    const result = identifyBullyingAlerts([], 4, NOW);
    expect(result).toEqual([]);
  });

  it("flags critical severity pending incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", severity: "critical", outcome: "pending" }),
    ];
    const result = identifyBullyingAlerts(incidents, 4, NOW);
    const alerts = result.filter((a) => a.type === "high_severity_pending");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("critical");
  });

  it("flags high severity pending incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", severity: "high", outcome: "pending" }),
    ];
    const result = identifyBullyingAlerts(incidents, 4, NOW);
    const alerts = result.filter((a) => a.type === "high_severity_pending");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("high");
  });

  it("flags follow-up overdue", () => {
    const incidents = [
      makeIncident({ id: "i1", follow_up_date: "2026-05-18", follow_up_completed: false }),
    ];
    const result = identifyBullyingAlerts(incidents, 4, NOW);
    const alerts = result.filter((a) => a.type === "follow_up_overdue");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("medium");
  });

  it("flags repeat victims (>= 2 incidents)", () => {
    const incidents = [
      makeIncident({ id: "i1", victim_id: "c1", victim_name: "Alex" }),
      makeIncident({ id: "i2", victim_id: "c1", victim_name: "Alex" }),
    ];
    const result = identifyBullyingAlerts(incidents, 4, NOW);
    const alerts = result.filter((a) => a.type === "repeat_victim");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("high");
  });

  it("flags parent not informed for critical/high incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", severity: "critical", parent_carer_informed: false }),
    ];
    const result = identifyBullyingAlerts(incidents, 4, NOW);
    const alerts = result.filter((a) => a.type === "parent_not_informed");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("high");
  });

  it("does not flag medium/low severity pending as critical alert", () => {
    const incidents = [
      makeIncident({ id: "i1", severity: "medium", outcome: "pending" }),
    ];
    const result = identifyBullyingAlerts(incidents, 4, NOW);
    const alerts = result.filter((a) => a.type === "high_severity_pending");
    expect(alerts.length).toBe(0);
  });
});
