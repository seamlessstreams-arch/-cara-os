import { describe, it, expect } from "vitest";
import {
  computeRightsMetrics,
  identifyRightsAlerts,
} from "./childrens-rights-service";
import type {
  RightsAudit,
  ChildRightsProfile,
} from "./childrens-rights-service";

// -- Factory Functions --------------------------------------------------------

function makeAudit(overrides: Partial<RightsAudit> = {}): RightsAudit {
  return {
    id: "ra-1",
    home_id: "home-1",
    audit_date: "2026-05-01",
    auditor: "staff-1",
    rights_checks: [
      { category: "right_to_be_heard", outcome: "fully_met", evidence: "Regular meetings", action_required: null },
      { category: "right_to_complain", outcome: "fully_met", evidence: "Complaints procedure visible", action_required: null },
    ],
    children_consulted: 4,
    overall_rating: "good",
    key_findings: ["Good practice"],
    actions: [],
    created_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

function makeProfile(overrides: Partial<ChildRightsProfile> = {}): ChildRightsProfile {
  return {
    id: "rp-1",
    home_id: "home-1",
    child_id: "c1",
    child_name: "Alex",
    knows_rights: true,
    knows_how_to_complain: true,
    has_advocate: true,
    advocate_name: "Jane Advocate",
    views_sought_regularly: true,
    empowerment_level: "fully_empowered",
    preferred_communication: "verbal",
    last_rights_discussion: "2026-04-01",
    barriers_to_participation: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

const NOW = new Date("2026-05-21T12:00:00Z");

// -- computeRightsMetrics -----------------------------------------------------

describe("computeRightsMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeRightsMetrics([], [], 4);
    expect(m.total_audits).toBe(0);
    expect(m.children_with_profiles).toBe(0);
    expect(m.profile_coverage_rate).toBe(0);
    expect(m.knows_rights_rate).toBeNull();;
    expect(m.rights_fully_met).toBe(0);
  });

  it("computes populated metrics correctly", () => {
    const audits = [
      makeAudit({
        rights_checks: [
          { category: "right_to_be_heard", outcome: "fully_met", evidence: "Yes", action_required: null },
          { category: "right_to_privacy", outcome: "partially_met", evidence: "Doors", action_required: "Locks" },
          { category: "right_to_safety", outcome: "not_met", evidence: "N/A", action_required: "Review" },
          { category: "right_to_religion", outcome: "not_applicable", evidence: "N/A", action_required: null },
        ],
      }),
    ];
    const profiles = [
      makeProfile({ child_id: "c1", knows_rights: true, knows_how_to_complain: true, has_advocate: true, views_sought_regularly: true, empowerment_level: "fully_empowered" }),
      makeProfile({ id: "rp-2", child_id: "c2", child_name: "Beth", knows_rights: false, knows_how_to_complain: false, has_advocate: false, views_sought_regularly: false, empowerment_level: "not_empowered" }),
    ];
    const m = computeRightsMetrics(audits, profiles, 4);

    expect(m.total_audits).toBe(1);
    expect(m.children_with_profiles).toBe(2);
    expect(m.profile_coverage_rate).toBe(50);
    expect(m.knows_rights_rate).toBe(50);
    expect(m.knows_complaints_rate).toBe(50);
    expect(m.has_advocate_rate).toBe(50);
    expect(m.views_sought_rate).toBe(50);
    expect(m.fully_empowered_count).toBe(1);
    expect(m.not_empowered_count).toBe(1);
    // not_applicable is skipped
    expect(m.rights_fully_met).toBe(1);
    expect(m.rights_partially_met).toBe(1);
    expect(m.rights_not_met).toBe(1);
  });
});

// -- identifyRightsAlerts -----------------------------------------------------

describe("identifyRightsAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifyRightsAlerts([], [], 0, NOW);
    expect(alerts).toHaveLength(0);
  });

  it("fires rights_not_known for child who does not know rights", () => {
    const profiles = [makeProfile({ knows_rights: false })];
    const alerts = identifyRightsAlerts([], profiles, 0, NOW);
    expect(alerts.some((a) => a.type === "rights_not_known" && a.severity === "high")).toBe(true);
  });

  it("fires complaints_not_known for child who does not know complaints procedure", () => {
    const profiles = [makeProfile({ knows_how_to_complain: false })];
    const alerts = identifyRightsAlerts([], profiles, 0, NOW);
    expect(alerts.some((a) => a.type === "complaints_not_known" && a.severity === "high")).toBe(true);
  });

  it("fires no_advocate for child without advocate", () => {
    const profiles = [makeProfile({ has_advocate: false })];
    const alerts = identifyRightsAlerts([], profiles, 0, NOW);
    expect(alerts.some((a) => a.type === "no_advocate" && a.severity === "medium")).toBe(true);
  });

  it("fires not_empowered for child assessed as not empowered", () => {
    const profiles = [makeProfile({ empowerment_level: "not_empowered" })];
    const alerts = identifyRightsAlerts([], profiles, 0, NOW);
    expect(alerts.some((a) => a.type === "not_empowered" && a.severity === "high")).toBe(true);
  });

  it("fires right_not_met for not_met outcome in latest audit", () => {
    const audits = [
      makeAudit({
        audit_date: "2026-05-01",
        rights_checks: [
          { category: "right_to_safety", outcome: "not_met", evidence: "N/A", action_required: "Review safeguarding" },
        ],
      }),
    ];
    const alerts = identifyRightsAlerts(audits, [], 0, NOW);
    expect(alerts.some((a) => a.type === "right_not_met" && a.severity === "critical")).toBe(true);
  });

  it("fires coverage_gap when totalChildren > profiles count", () => {
    const profiles = [makeProfile({ child_id: "c1" })];
    const alerts = identifyRightsAlerts([], profiles, 4, NOW);
    expect(alerts.some((a) => a.type === "coverage_gap" && a.severity === "high")).toBe(true);
  });

  it("does NOT fire coverage_gap when all children have profiles", () => {
    const profiles = [
      makeProfile({ child_id: "c1" }),
      makeProfile({ id: "rp-2", child_id: "c2" }),
      makeProfile({ id: "rp-3", child_id: "c3" }),
      makeProfile({ id: "rp-4", child_id: "c4" }),
    ];
    const alerts = identifyRightsAlerts([], profiles, 4, NOW);
    expect(alerts.some((a) => a.type === "coverage_gap")).toBe(false);
  });
});
