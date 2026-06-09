// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONTEXTUAL SAFEGUARDING INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for exploitation screening coverage, child risk
// profiles, locality risk mapping, safety plans, referral tracking,
// screening currency, alerts, and ARIA contextual insights.
// Covers Reg 12, Reg 13, Reg 34, SCCIF Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeContextualSafeguardingIntelligence,
  daysBetween,
  type ExploitationScreeningInput,
  type LocalityRiskInput,
  type ChildRef,
  type StaffRef,
} from "../contextual-safeguarding-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

const CHILDREN: ChildRef[] = [
  { id: "yp_alex", name: "Alex" },
  { id: "yp_jordan", name: "Jordan" },
  { id: "yp_casey", name: "Casey" },
];

const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren" },
  { id: "staff_anna", name: "Anna" },
  { id: "staff_ryan", name: "Ryan" },
];

let _sid = 0;
function makeScreening(overrides: Partial<ExploitationScreeningInput> = {}): ExploitationScreeningInput {
  _sid++;
  return {
    id: `scr_test_${_sid}`,
    child_id: "yp_alex",
    screening_type: "cse",
    date: "2026-05-01",
    risk_level: "no_concern",
    screened_by: "staff_darren",
    referral_made: false,
    referral_to: "",
    safety_plan_in_place: false,
    next_screening_due: "2026-08-01",
    ...overrides,
  };
}

let _lid = 0;
function makeLocalityRisk(overrides: Partial<LocalityRiskInput> = {}): LocalityRiskInput {
  _lid++;
  return {
    id: `lr_test_${_lid}`,
    location_name: "Town Centre Park",
    location_type: "park",
    risk_type: "drug_dealing",
    risk_level: "high",
    last_reviewed: "2026-05-01",
    mitigations: ["Staff awareness briefing", "Route avoidance plan"],
    ...overrides,
  };
}

function run(
  screenings: ExploitationScreeningInput[],
  localityRisks: LocalityRiskInput[] = [],
  opts?: { children?: ChildRef[]; staff?: StaffRef[] }
) {
  return computeContextualSafeguardingIntelligence({
    screenings,
    localityRisks,
    children: opts?.children ?? CHILDREN,
    staff: opts?.staff ?? STAFF,
    today: TODAY,
  });
}

// ── Chamberlain House Dataset ───────────────────────────────────────────────────────

function oakHouseScreenings(): ExploitationScreeningInput[] {
  return [
    // Alex: all 5 types screened, all no_concern, no overdue
    makeScreening({ id: "scr_a1", child_id: "yp_alex", screening_type: "cse", risk_level: "no_concern", date: "2026-05-01", next_screening_due: "2026-08-01", screened_by: "staff_darren" }),
    makeScreening({ id: "scr_a2", child_id: "yp_alex", screening_type: "cce", risk_level: "no_concern", date: "2026-05-01", next_screening_due: "2026-08-01", screened_by: "staff_darren" }),
    makeScreening({ id: "scr_a3", child_id: "yp_alex", screening_type: "online", risk_level: "no_concern", date: "2026-05-01", next_screening_due: "2026-08-01", screened_by: "staff_anna" }),
    makeScreening({ id: "scr_a4", child_id: "yp_alex", screening_type: "radicalisation", risk_level: "no_concern", date: "2026-05-01", next_screening_due: "2026-08-01", screened_by: "staff_anna" }),
    makeScreening({ id: "scr_a5", child_id: "yp_alex", screening_type: "peer_on_peer", risk_level: "no_concern", date: "2026-05-01", next_screening_due: "2026-08-01", screened_by: "staff_ryan" }),

    // Jordan: 4 types (missing radicalisation), cse=moderate, cce=emerging, online=no_concern, peer_on_peer=no_concern
    // Safety plan for CSE, 1 referral (MASH)
    makeScreening({ id: "scr_j1", child_id: "yp_jordan", screening_type: "cse", risk_level: "moderate", date: "2026-05-05", next_screening_due: "2026-06-05", screened_by: "staff_darren", safety_plan_in_place: true, referral_made: true, referral_to: "MASH" }),
    makeScreening({ id: "scr_j2", child_id: "yp_jordan", screening_type: "cce", risk_level: "emerging", date: "2026-05-05", next_screening_due: "2026-06-05", screened_by: "staff_darren" }),
    makeScreening({ id: "scr_j3", child_id: "yp_jordan", screening_type: "online", risk_level: "no_concern", date: "2026-05-05", next_screening_due: "2026-08-05", screened_by: "staff_anna" }),
    makeScreening({ id: "scr_j4", child_id: "yp_jordan", screening_type: "peer_on_peer", risk_level: "no_concern", date: "2026-05-05", next_screening_due: "2026-08-05", screened_by: "staff_ryan" }),

    // Casey: 3 types (missing cce, radicalisation), all no_concern, 1 overdue (online, due 10 days ago)
    makeScreening({ id: "scr_c1", child_id: "yp_casey", screening_type: "cse", risk_level: "no_concern", date: "2026-04-15", next_screening_due: "2026-07-15", screened_by: "staff_anna" }),
    makeScreening({ id: "scr_c2", child_id: "yp_casey", screening_type: "online", risk_level: "no_concern", date: "2026-02-15", next_screening_due: "2026-05-15", screened_by: "staff_anna" }),
    makeScreening({ id: "scr_c3", child_id: "yp_casey", screening_type: "peer_on_peer", risk_level: "no_concern", date: "2026-04-15", next_screening_due: "2026-07-15", screened_by: "staff_ryan" }),
  ];
}

function oakHouseLocalityRisks(): LocalityRiskInput[] {
  return [
    makeLocalityRisk({ id: "lr_1", location_name: "Town Centre Park", location_type: "park", risk_type: "drug_dealing", risk_level: "high", last_reviewed: "2026-05-01", mitigations: ["Staff awareness briefing", "Route avoidance plan"] }),
    makeLocalityRisk({ id: "lr_2", location_name: "Bus Station", location_type: "transport_hub", risk_type: "grooming", risk_level: "high", last_reviewed: "2026-04-20", mitigations: ["Accompanied travel policy"] }),
    makeLocalityRisk({ id: "lr_3", location_name: "Shopping Centre", location_type: "venue", risk_type: "gang_activity", risk_level: "medium", last_reviewed: "2026-05-10", mitigations: ["CCTV monitoring", "Staff presence required", "Time restrictions"] }),
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

// ── daysBetween Helper ──────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns 0 for same date", () => {
    expect(daysBetween("2026-05-25", "2026-05-25")).toBe(0);
  });

  it("returns positive for future date", () => {
    expect(daysBetween("2026-05-01", "2026-05-25")).toBe(24);
  });

  it("returns negative for past date", () => {
    expect(daysBetween("2026-05-25", "2026-05-01")).toBe(-24);
  });

  it("handles month boundaries", () => {
    expect(daysBetween("2026-04-30", "2026-05-01")).toBe(1);
  });
});

// ── Empty Inputs ────────────────────────────────────────────────────────────

describe("empty inputs", () => {
  it("returns zeroed overview with no data", () => {
    const r = run([], [], { children: [] });
    expect(r.overview.children_screened).toBe(0);
    expect(r.overview.total_children).toBe(0);
    expect(r.overview.screening_coverage_rate).toBe(100);
    expect(r.overview.overdue_screenings).toBe(0);
    expect(r.overview.referrals_made).toBe(0);
  });

  it("returns empty arrays with no data", () => {
    const r = run([], [], { children: [] });
    expect(r.screening_coverage).toHaveLength(5);
    expect(r.child_risk_profiles).toHaveLength(0);
    expect(r.locality_risks).toHaveLength(0);
    expect(r.alerts).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  it("returns children with no screenings as having no_concern", () => {
    const r = run([]);
    expect(r.child_risk_profiles).toHaveLength(3);
    r.child_risk_profiles.forEach((p) => {
      expect(p.highest_risk_level).toBe("no_concern");
      expect(p.screenings_completed).toBe(0);
    });
  });
});

// ── Chamberlain House Integration ───────────────────────────────────────────────────

describe("Chamberlain House integration dataset", () => {
  const screenings = oakHouseScreenings();
  const localities = oakHouseLocalityRisks();
  const result = run(screenings, localities);

  describe("overview", () => {
    it("counts all 3 children as screened", () => {
      expect(result.overview.children_screened).toBe(3);
    });

    it("has total_children = 3", () => {
      expect(result.overview.total_children).toBe(3);
    });

    it("has 100% screening coverage rate (all children have at least 1 screening)", () => {
      expect(result.overview.screening_coverage_rate).toBe(100);
    });

    it("has 0 high-risk children", () => {
      expect(result.overview.high_risk_children).toBe(0);
    });

    it("has 1 moderate-risk child (Jordan)", () => {
      expect(result.overview.moderate_risk_children).toBe(1);
    });

    it("has 0 emerging-risk children (Jordan is moderate, not emerging)", () => {
      expect(result.overview.emerging_risk_children).toBe(0);
    });

    it("has 1 overdue screening (Casey online)", () => {
      expect(result.overview.overdue_screenings).toBe(1);
    });

    it("has 1 active safety plan (Jordan CSE)", () => {
      expect(result.overview.active_safety_plans).toBe(1);
    });

    it("has 1 referral made (Jordan MASH)", () => {
      expect(result.overview.referrals_made).toBe(1);
    });

    it("has 3 locality risks total", () => {
      expect(result.overview.locality_risks_total).toBe(3);
    });

    it("has 2 high-risk locations", () => {
      expect(result.overview.high_risk_locations).toBe(2);
    });
  });

  describe("screening coverage", () => {
    it("returns 5 screening types", () => {
      expect(result.screening_coverage).toHaveLength(5);
    });

    it("CSE covers all 3 children", () => {
      const cse = result.screening_coverage.find((s) => s.screening_type === "cse");
      expect(cse!.children_screened).toBe(3);
      expect(cse!.high_risk_count).toBe(0);
      expect(cse!.overdue_count).toBe(0);
    });

    it("CCE covers 2 children (Alex, Jordan)", () => {
      const cce = result.screening_coverage.find((s) => s.screening_type === "cce");
      expect(cce!.children_screened).toBe(2);
    });

    it("online covers 3 children with 1 overdue", () => {
      const online = result.screening_coverage.find((s) => s.screening_type === "online");
      expect(online!.children_screened).toBe(3);
      expect(online!.overdue_count).toBe(1);
    });

    it("radicalisation covers 1 child (Alex only)", () => {
      const rad = result.screening_coverage.find((s) => s.screening_type === "radicalisation");
      expect(rad!.children_screened).toBe(1);
    });

    it("peer_on_peer covers all 3 children", () => {
      const pp = result.screening_coverage.find((s) => s.screening_type === "peer_on_peer");
      expect(pp!.children_screened).toBe(3);
    });
  });

  describe("child risk profiles", () => {
    it("returns 3 profiles", () => {
      expect(result.child_risk_profiles).toHaveLength(3);
    });

    it("Alex: no_concern, 5 screenings, 0 overdue, no safety plan, 0 referrals", () => {
      const alex = result.child_risk_profiles.find((p) => p.child_id === "yp_alex")!;
      expect(alex.highest_risk_level).toBe("no_concern");
      expect(alex.screenings_completed).toBe(5);
      expect(alex.screenings_overdue).toBe(0);
      expect(alex.has_safety_plan).toBe(false);
      expect(alex.referrals_count).toBe(0);
    });

    it("Jordan: moderate risk (highest of moderate, emerging, no_concern), 4 screenings, 0 overdue", () => {
      const jordan = result.child_risk_profiles.find((p) => p.child_id === "yp_jordan")!;
      expect(jordan.highest_risk_level).toBe("moderate");
      expect(jordan.screenings_completed).toBe(4);
      expect(jordan.screenings_overdue).toBe(0);
      expect(jordan.has_safety_plan).toBe(true);
      expect(jordan.referrals_count).toBe(1);
    });

    it("Casey: no_concern, 3 screenings, 1 overdue", () => {
      const casey = result.child_risk_profiles.find((p) => p.child_id === "yp_casey")!;
      expect(casey.highest_risk_level).toBe("no_concern");
      expect(casey.screenings_completed).toBe(3);
      expect(casey.screenings_overdue).toBe(1);
      expect(casey.has_safety_plan).toBe(false);
      expect(casey.referrals_count).toBe(0);
    });
  });

  describe("locality risks", () => {
    it("returns 3 locality risk summaries", () => {
      expect(result.locality_risks).toHaveLength(3);
    });

    it("Town Centre Park: park, drug_dealing, high, 2 mitigations", () => {
      const park = result.locality_risks.find((l) => l.location_name === "Town Centre Park")!;
      expect(park.location_type).toBe("park");
      expect(park.risk_type).toBe("drug_dealing");
      expect(park.risk_level).toBe("high");
      expect(park.mitigations_count).toBe(2);
    });

    it("Bus Station: transport_hub, grooming, high, 1 mitigation", () => {
      const bus = result.locality_risks.find((l) => l.location_name === "Bus Station")!;
      expect(bus.location_type).toBe("transport_hub");
      expect(bus.risk_type).toBe("grooming");
      expect(bus.risk_level).toBe("high");
      expect(bus.mitigations_count).toBe(1);
    });

    it("Shopping Centre: venue, gang_activity, medium, 3 mitigations", () => {
      const shop = result.locality_risks.find((l) => l.location_name === "Shopping Centre")!;
      expect(shop.location_type).toBe("venue");
      expect(shop.risk_type).toBe("gang_activity");
      expect(shop.risk_level).toBe("medium");
      expect(shop.mitigations_count).toBe(3);
    });
  });

  describe("alerts", () => {
    it("generates a high alert for Casey overdue online screening", () => {
      const overdueAlerts = result.alerts.filter((a) => a.severity === "high" && a.message.includes("Casey"));
      expect(overdueAlerts.length).toBeGreaterThanOrEqual(1);
      expect(overdueAlerts[0].message).toContain("overdue");
      expect(overdueAlerts[0].message).toContain("Online");
    });

    it("does not generate a medium alert at exactly 80% full screening coverage", () => {
      // Chamberlain House: 12 out of 15 possible screenings = 80%, threshold is < 80%
      const medAlerts = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("coverage"));
      expect(medAlerts).toHaveLength(0);
    });

    it("generates no critical alerts (no high-risk children)", () => {
      const critAlerts = result.alerts.filter((a) => a.severity === "critical");
      expect(critAlerts).toHaveLength(0);
    });
  });

  describe("insights", () => {
    it("generates warning for overdue screening", () => {
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("overdue"))).toBe(true);
    });

    it("generates warning for high-risk locations", () => {
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("high-risk location"))).toBe(true);
    });

    it("generates positive insight for 100% coverage (all children have at least 1 screening)", () => {
      const positives = result.insights.filter((i) => i.severity === "positive");
      expect(positives.some((p) => p.text.includes("100% screening coverage"))).toBe(true);
    });

    it("generates no critical insights (no high-risk children without plans)", () => {
      const criticals = result.insights.filter((i) => i.severity === "critical");
      expect(criticals).toHaveLength(0);
    });
  });
});

// ── Type Labels ─────────────────────────────────────────────────────────────

describe("type labels", () => {
  it("labels cse as CSE", () => {
    const r = run([makeScreening({ screening_type: "cse" })]);
    const cse = r.screening_coverage.find((s) => s.screening_type === "cse");
    expect(cse!.type_label).toBe("CSE");
  });

  it("labels cce as CCE / County Lines", () => {
    const r = run([makeScreening({ screening_type: "cce" })]);
    const cce = r.screening_coverage.find((s) => s.screening_type === "cce");
    expect(cce!.type_label).toBe("CCE / County Lines");
  });

  it("labels online as Online", () => {
    const r = run([makeScreening({ screening_type: "online" })]);
    const online = r.screening_coverage.find((s) => s.screening_type === "online");
    expect(online!.type_label).toBe("Online");
  });

  it("labels radicalisation as Radicalisation", () => {
    const r = run([makeScreening({ screening_type: "radicalisation" })]);
    const rad = r.screening_coverage.find((s) => s.screening_type === "radicalisation");
    expect(rad!.type_label).toBe("Radicalisation");
  });

  it("labels peer_on_peer as Peer-on-Peer", () => {
    const r = run([makeScreening({ screening_type: "peer_on_peer" })]);
    const pp = r.screening_coverage.find((s) => s.screening_type === "peer_on_peer");
    expect(pp!.type_label).toBe("Peer-on-Peer");
  });
});

// ── Risk Level Hierarchy ────────────────────────────────────────────────────

describe("risk level hierarchy", () => {
  it("high > moderate > emerging > no_concern", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", risk_level: "high" }),
      makeScreening({ child_id: "yp_alex", screening_type: "cce", risk_level: "moderate" }),
      makeScreening({ child_id: "yp_alex", screening_type: "online", risk_level: "emerging" }),
      makeScreening({ child_id: "yp_alex", screening_type: "radicalisation", risk_level: "no_concern" }),
    ];
    const r = run(screenings);
    const alex = r.child_risk_profiles.find((p) => p.child_id === "yp_alex")!;
    expect(alex.highest_risk_level).toBe("high");
  });

  it("moderate is highest when no high present", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", risk_level: "moderate" }),
      makeScreening({ child_id: "yp_alex", screening_type: "cce", risk_level: "emerging" }),
    ];
    const r = run(screenings);
    const alex = r.child_risk_profiles.find((p) => p.child_id === "yp_alex")!;
    expect(alex.highest_risk_level).toBe("moderate");
  });

  it("emerging is highest when only emerging and no_concern present", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", risk_level: "emerging" }),
      makeScreening({ child_id: "yp_alex", screening_type: "cce", risk_level: "no_concern" }),
    ];
    const r = run(screenings);
    const alex = r.child_risk_profiles.find((p) => p.child_id === "yp_alex")!;
    expect(alex.highest_risk_level).toBe("emerging");
  });
});

// ── Critical Alerts ─────────────────────────────────────────────────────────

describe("critical alerts", () => {
  it("fires when high-risk child has no safety plan", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", risk_level: "high", safety_plan_in_place: false }),
    ];
    const r = run(screenings);
    const critAlerts = r.alerts.filter((a) => a.severity === "critical");
    expect(critAlerts.length).toBeGreaterThanOrEqual(1);
    expect(critAlerts.some((a) => a.message.includes("Alex") && a.message.includes("high risk"))).toBe(true);
  });

  it("does not fire when high-risk child has a safety plan", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", risk_level: "high", safety_plan_in_place: true }),
    ];
    const r = run(screenings);
    const critAlerts = r.alerts.filter((a) => a.severity === "critical" && a.message.includes("safety plan"));
    expect(critAlerts).toHaveLength(0);
  });

  it("fires when high-risk child has screening overdue > 30 days", () => {
    const screenings = [
      makeScreening({
        child_id: "yp_alex",
        screening_type: "cse",
        risk_level: "high",
        safety_plan_in_place: true,
        next_screening_due: "2026-04-01", // 54 days overdue
      }),
    ];
    const r = run(screenings);
    const critAlerts = r.alerts.filter((a) => a.severity === "critical" && a.message.includes("overdue"));
    expect(critAlerts.length).toBeGreaterThanOrEqual(1);
    expect(critAlerts[0].message).toContain("54 days");
  });

  it("does not fire for high-risk child with screening overdue <= 30 days", () => {
    const screenings = [
      makeScreening({
        child_id: "yp_alex",
        screening_type: "cse",
        risk_level: "high",
        safety_plan_in_place: true,
        next_screening_due: "2026-05-10", // 15 days overdue
      }),
    ];
    const r = run(screenings);
    const critAlerts = r.alerts.filter((a) => a.severity === "critical" && a.message.includes("overdue"));
    expect(critAlerts).toHaveLength(0);
  });
});

// ── High Alerts ─────────────────────────────────────────────────────────────

describe("high alerts", () => {
  it("fires for any overdue screening", () => {
    const screenings = [
      makeScreening({ child_id: "yp_casey", screening_type: "online", next_screening_due: "2026-05-15" }),
    ];
    const r = run(screenings);
    const highAlerts = r.alerts.filter((a) => a.severity === "high" && a.message.includes("overdue"));
    expect(highAlerts.length).toBeGreaterThanOrEqual(1);
  });

  it("fires for high-risk locality with no mitigations", () => {
    const r = run([], [
      makeLocalityRisk({ risk_level: "high", mitigations: [] }),
    ]);
    const highAlerts = r.alerts.filter((a) => a.severity === "high" && a.message.includes("no mitigations"));
    expect(highAlerts).toHaveLength(1);
  });

  it("does not fire for high-risk locality with mitigations", () => {
    const r = run([], [
      makeLocalityRisk({ risk_level: "high", mitigations: ["Staff awareness"] }),
    ]);
    const highAlerts = r.alerts.filter((a) => a.severity === "high" && a.message.includes("no mitigations"));
    expect(highAlerts).toHaveLength(0);
  });

  it("does not fire for medium-risk locality with no mitigations", () => {
    const r = run([], [
      makeLocalityRisk({ risk_level: "medium", mitigations: [] }),
    ]);
    const highAlerts = r.alerts.filter((a) => a.severity === "high" && a.message.includes("no mitigations"));
    expect(highAlerts).toHaveLength(0);
  });
});

// ── Medium Alerts ───────────────────────────────────────────────────────────

describe("medium alerts", () => {
  it("fires when not all children are screened (coverage below 80%)", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse" }),
    ];
    // Only 1/3 children screened = 33%, and 1/15 type combos = 7%
    const r = run(screenings, [], {
      children: [
        { id: "yp_alex", name: "Alex" },
        { id: "yp_jordan", name: "Jordan" },
        { id: "yp_casey", name: "Casey" },
        { id: "yp_d", name: "D" },
        { id: "yp_e", name: "E" },
      ],
    });
    const medAlerts = r.alerts.filter((a) => a.severity === "medium");
    expect(medAlerts.length).toBeGreaterThanOrEqual(1);
  });

  it("does not fire coverage alert when all children have all screenings", () => {
    const children: ChildRef[] = [{ id: "yp_alex", name: "Alex" }];
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse" }),
      makeScreening({ child_id: "yp_alex", screening_type: "cce" }),
      makeScreening({ child_id: "yp_alex", screening_type: "online" }),
      makeScreening({ child_id: "yp_alex", screening_type: "radicalisation" }),
      makeScreening({ child_id: "yp_alex", screening_type: "peer_on_peer" }),
    ];
    const r = run(screenings, [], { children });
    const medAlerts = r.alerts.filter((a) => a.severity === "medium" && a.message.includes("coverage"));
    expect(medAlerts).toHaveLength(0);
  });
});

// ── Low Alerts ──────────────────────────────────────────────────────────────

describe("low alerts", () => {
  it("fires when locality risk not reviewed for > 90 days", () => {
    const r = run([], [
      makeLocalityRisk({ last_reviewed: "2026-02-01", location_name: "Old Park" }), // ~113 days ago
    ]);
    const lowAlerts = r.alerts.filter((a) => a.severity === "low");
    expect(lowAlerts.length).toBeGreaterThanOrEqual(1);
    expect(lowAlerts[0].message).toContain("Old Park");
  });

  it("does not fire when locality risk reviewed within 90 days", () => {
    const r = run([], [
      makeLocalityRisk({ last_reviewed: "2026-04-01" }), // 54 days ago
    ]);
    const lowAlerts = r.alerts.filter((a) => a.severity === "low");
    expect(lowAlerts).toHaveLength(0);
  });
});

// ── Insights ────────────────────────────────────────────────────────────────

describe("insights", () => {
  describe("critical insights", () => {
    it("fires when high-risk children lack safety plans", () => {
      const screenings = [
        makeScreening({ child_id: "yp_alex", screening_type: "cse", risk_level: "high", safety_plan_in_place: false }),
      ];
      const r = run(screenings);
      const critInsights = r.insights.filter((i) => i.severity === "critical");
      expect(critInsights.length).toBeGreaterThanOrEqual(1);
      expect(critInsights[0].text).toContain("immediate action");
    });

    it("uses singular 'child' for 1 high-risk child without plan", () => {
      const screenings = [
        makeScreening({ child_id: "yp_alex", screening_type: "cse", risk_level: "high", safety_plan_in_place: false }),
      ];
      const r = run(screenings);
      const critInsights = r.insights.filter((i) => i.severity === "critical");
      expect(critInsights[0].text).toContain("1 child");
    });

    it("uses plural 'children' for multiple high-risk children without plans", () => {
      const screenings = [
        makeScreening({ child_id: "yp_alex", screening_type: "cse", risk_level: "high", safety_plan_in_place: false }),
        makeScreening({ child_id: "yp_jordan", screening_type: "cse", risk_level: "high", safety_plan_in_place: false }),
      ];
      const r = run(screenings);
      const critInsights = r.insights.filter((i) => i.severity === "critical");
      expect(critInsights[0].text).toContain("2 children");
    });
  });

  describe("warning insights", () => {
    it("fires for multiple overdue screenings", () => {
      const screenings = [
        makeScreening({ child_id: "yp_alex", screening_type: "cse", next_screening_due: "2026-05-01" }),
        makeScreening({ child_id: "yp_jordan", screening_type: "cce", next_screening_due: "2026-05-10" }),
      ];
      const r = run(screenings);
      const warnings = r.insights.filter((i) => i.severity === "warning" && i.text.includes("overdue"));
      expect(warnings.length).toBeGreaterThanOrEqual(1);
      expect(warnings[0].text).toContain("2 exploitation screenings");
    });

    it("fires for single overdue screening", () => {
      const screenings = [
        makeScreening({ child_id: "yp_alex", screening_type: "cse", next_screening_due: "2026-05-20" }),
      ];
      const r = run(screenings);
      const warnings = r.insights.filter((i) => i.severity === "warning" && i.text.includes("overdue"));
      expect(warnings.length).toBeGreaterThanOrEqual(1);
      expect(warnings[0].text).toContain("1 exploitation screening");
    });

    it("fires for high-risk locations", () => {
      const r = run([], [
        makeLocalityRisk({ risk_level: "high" }),
      ]);
      const warnings = r.insights.filter((i) => i.severity === "warning" && i.text.includes("high-risk location"));
      expect(warnings.length).toBeGreaterThanOrEqual(1);
    });

    it("uses singular for 1 high-risk location", () => {
      const r = run([], [
        makeLocalityRisk({ risk_level: "high" }),
      ]);
      const warnings = r.insights.filter((i) => i.severity === "warning" && i.text.includes("high-risk location"));
      expect(warnings[0].text).toContain("1 high-risk location");
      expect(warnings[0].text).not.toContain("locations");
    });

    it("uses plural for multiple high-risk locations", () => {
      const r = run([], [
        makeLocalityRisk({ risk_level: "high", location_name: "A" }),
        makeLocalityRisk({ risk_level: "high", location_name: "B" }),
      ]);
      const warnings = r.insights.filter((i) => i.severity === "warning" && i.text.includes("high-risk location"));
      expect(warnings[0].text).toContain("2 high-risk locations");
    });
  });

  describe("positive insights", () => {
    it("fires when 100% screening coverage achieved", () => {
      const children: ChildRef[] = [{ id: "yp_alex", name: "Alex" }];
      const screenings = [
        makeScreening({ child_id: "yp_alex", screening_type: "cse" }),
      ];
      const r = run(screenings, [], { children });
      const positives = r.insights.filter((i) => i.severity === "positive" && i.text.includes("100%"));
      expect(positives).toHaveLength(1);
    });

    it("does not fire 100% coverage when children are unscreened", () => {
      const screenings = [
        makeScreening({ child_id: "yp_alex", screening_type: "cse" }),
      ];
      // 3 children, only 1 screened
      const r = run(screenings);
      const positives = r.insights.filter((i) => i.severity === "positive" && i.text.includes("100%"));
      expect(positives).toHaveLength(0);
    });

    it("fires when all high-risk children have safety plans and referrals", () => {
      const screenings = [
        makeScreening({ child_id: "yp_alex", screening_type: "cse", risk_level: "high", safety_plan_in_place: true, referral_made: true }),
      ];
      const r = run(screenings);
      const positives = r.insights.filter((i) => i.severity === "positive" && i.text.includes("safety plans and referrals"));
      expect(positives).toHaveLength(1);
    });

    it("does not fire safety-plans-and-referrals insight when no high-risk children", () => {
      const screenings = [
        makeScreening({ child_id: "yp_alex", screening_type: "cse", risk_level: "no_concern" }),
      ];
      const r = run(screenings);
      const positives = r.insights.filter((i) => i.severity === "positive" && i.text.includes("safety plans and referrals"));
      expect(positives).toHaveLength(0);
    });

    it("fires no-overdue-screenings insight when all screenings current", () => {
      const screenings = [
        makeScreening({ child_id: "yp_alex", screening_type: "cse", next_screening_due: "2026-08-01" }),
      ];
      const r = run(screenings);
      const positives = r.insights.filter((i) => i.severity === "positive" && i.text.includes("No overdue"));
      expect(positives).toHaveLength(1);
    });

    it("does not fire no-overdue when there are no screenings at all", () => {
      const r = run([]);
      const positives = r.insights.filter((i) => i.severity === "positive" && i.text.includes("No overdue"));
      expect(positives).toHaveLength(0);
    });
  });
});

// ── Screening Coverage Edge Cases ───────────────────────────────────────────

describe("screening coverage edge cases", () => {
  it("child with multiple screenings of same type counts once per type", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", date: "2026-04-01" }),
      makeScreening({ child_id: "yp_alex", screening_type: "cse", date: "2026-05-01" }),
    ];
    const r = run(screenings);
    const cse = r.screening_coverage.find((s) => s.screening_type === "cse")!;
    expect(cse.children_screened).toBe(1);
  });

  it("high_risk_count counts unique children per type, not total screenings", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", risk_level: "high", date: "2026-04-01" }),
      makeScreening({ child_id: "yp_alex", screening_type: "cse", risk_level: "high", date: "2026-05-01" }),
    ];
    const r = run(screenings);
    const cse = r.screening_coverage.find((s) => s.screening_type === "cse")!;
    expect(cse.high_risk_count).toBe(1);
  });

  it("overdue_count counts all overdue screenings not just unique children", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", next_screening_due: "2026-05-01" }),
      makeScreening({ child_id: "yp_alex", screening_type: "cse", next_screening_due: "2026-05-10" }),
    ];
    const r = run(screenings);
    const cse = r.screening_coverage.find((s) => s.screening_type === "cse")!;
    expect(cse.overdue_count).toBe(2);
  });
});

// ── Overview Calculations ───────────────────────────────────────────────────

describe("overview calculations", () => {
  it("screening_coverage_rate is 100 when no children", () => {
    const r = run([], [], { children: [] });
    expect(r.overview.screening_coverage_rate).toBe(100);
  });

  it("screening_coverage_rate rounds to nearest integer", () => {
    const children: ChildRef[] = [
      { id: "yp_alex", name: "Alex" },
      { id: "yp_jordan", name: "Jordan" },
      { id: "yp_casey", name: "Casey" },
    ];
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse" }),
    ];
    const r = run(screenings, [], { children });
    expect(r.overview.screening_coverage_rate).toBe(33); // 1/3 = 33.33 -> 33
  });

  it("active_safety_plans counts all screenings with plans, not unique children", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", safety_plan_in_place: true }),
      makeScreening({ child_id: "yp_alex", screening_type: "cce", safety_plan_in_place: true }),
    ];
    const r = run(screenings);
    expect(r.overview.active_safety_plans).toBe(2);
  });

  it("referrals_made counts total referrals across all screenings", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", referral_made: true }),
      makeScreening({ child_id: "yp_jordan", referral_made: true }),
      makeScreening({ child_id: "yp_casey", referral_made: false }),
    ];
    const r = run(screenings);
    expect(r.overview.referrals_made).toBe(2);
  });
});

// ── Referral Tracking ───────────────────────────────────────────────────────

describe("referral tracking", () => {
  it("counts referrals per child correctly", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", referral_made: true, referral_to: "MASH" }),
      makeScreening({ child_id: "yp_alex", screening_type: "cce", referral_made: true, referral_to: "Police" }),
      makeScreening({ child_id: "yp_alex", screening_type: "online", referral_made: false }),
    ];
    const r = run(screenings);
    const alex = r.child_risk_profiles.find((p) => p.child_id === "yp_alex")!;
    expect(alex.referrals_count).toBe(2);
  });

  it("child with no referrals has referrals_count = 0", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", referral_made: false }),
    ];
    const r = run(screenings);
    const alex = r.child_risk_profiles.find((p) => p.child_id === "yp_alex")!;
    expect(alex.referrals_count).toBe(0);
  });
});

// ── Safety Plan Detection ───────────────────────────────────────────────────

describe("safety plan detection", () => {
  it("has_safety_plan is true if any screening for child has plan", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", safety_plan_in_place: false }),
      makeScreening({ child_id: "yp_alex", screening_type: "cce", safety_plan_in_place: true }),
    ];
    const r = run(screenings);
    const alex = r.child_risk_profiles.find((p) => p.child_id === "yp_alex")!;
    expect(alex.has_safety_plan).toBe(true);
  });

  it("has_safety_plan is false if no screening for child has plan", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", safety_plan_in_place: false }),
      makeScreening({ child_id: "yp_alex", screening_type: "cce", safety_plan_in_place: false }),
    ];
    const r = run(screenings);
    const alex = r.child_risk_profiles.find((p) => p.child_id === "yp_alex")!;
    expect(alex.has_safety_plan).toBe(false);
  });
});

// ── Locality Risk Summaries ─────────────────────────────────────────────────

describe("locality risk summaries", () => {
  it("maps all fields correctly", () => {
    const r = run([], [
      makeLocalityRisk({
        location_name: "Test Park",
        location_type: "park",
        risk_type: "drug_dealing",
        risk_level: "high",
        mitigations: ["A", "B", "C"],
      }),
    ]);
    expect(r.locality_risks).toHaveLength(1);
    expect(r.locality_risks[0]).toEqual({
      location_name: "Test Park",
      location_type: "park",
      risk_type: "drug_dealing",
      risk_level: "high",
      mitigations_count: 3,
    });
  });

  it("handles empty mitigations", () => {
    const r = run([], [
      makeLocalityRisk({ mitigations: [] }),
    ]);
    expect(r.locality_risks[0].mitigations_count).toBe(0);
  });
});

// ── Mixed Scenarios ─────────────────────────────────────────────────────────

describe("mixed scenarios", () => {
  it("handles all-high-risk children with plans and referrals correctly", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", risk_level: "high", safety_plan_in_place: true, referral_made: true }),
      makeScreening({ child_id: "yp_jordan", screening_type: "cse", risk_level: "high", safety_plan_in_place: true, referral_made: true }),
      makeScreening({ child_id: "yp_casey", screening_type: "cse", risk_level: "high", safety_plan_in_place: true, referral_made: true }),
    ];
    const r = run(screenings);
    expect(r.overview.high_risk_children).toBe(3);
    // Positive insight about all high-risk having plans
    const positives = r.insights.filter((i) => i.severity === "positive" && i.text.includes("safety plans and referrals"));
    expect(positives).toHaveLength(1);
    // No critical alerts
    const critAlerts = r.alerts.filter((a) => a.severity === "critical");
    expect(critAlerts).toHaveLength(0);
  });

  it("handles mixed risk levels across children", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", risk_level: "high", safety_plan_in_place: true }),
      makeScreening({ child_id: "yp_jordan", screening_type: "cse", risk_level: "moderate" }),
      makeScreening({ child_id: "yp_casey", screening_type: "cse", risk_level: "no_concern" }),
    ];
    const r = run(screenings);
    expect(r.overview.high_risk_children).toBe(1);
    expect(r.overview.moderate_risk_children).toBe(1);
    expect(r.overview.emerging_risk_children).toBe(0);
  });

  it("child with screenings not in children list is still processed", () => {
    const screenings = [
      makeScreening({ child_id: "yp_unknown", screening_type: "cse", risk_level: "high" }),
    ];
    const r = run(screenings);
    // yp_unknown is counted in overview (children_screened)
    // but not in child_risk_profiles (only children in the children array get profiles)
    expect(r.overview.children_screened).toBe(1);
    expect(r.child_risk_profiles.find((p) => p.child_id === "yp_unknown")).toBeUndefined();
  });

  it("all five screening types always returned even with no data", () => {
    const r = run([]);
    expect(r.screening_coverage).toHaveLength(5);
    expect(r.screening_coverage.map((s) => s.screening_type)).toEqual([
      "cse", "cce", "online", "radicalisation", "peer_on_peer",
    ]);
  });
});

// ── today parameter ─────────────────────────────────────────────────────────

describe("today parameter", () => {
  it("uses provided today for overdue calculations", () => {
    const screenings = [
      makeScreening({ child_id: "yp_alex", screening_type: "cse", next_screening_due: "2026-06-01" }),
    ];
    // With today = 2026-05-25, not overdue
    const r1 = run(screenings);
    expect(r1.overview.overdue_screenings).toBe(0);

    // With today = 2026-06-15, overdue
    const r2 = computeContextualSafeguardingIntelligence({
      screenings,
      localityRisks: [],
      children: CHILDREN,
      staff: STAFF,
      today: "2026-06-15",
    });
    expect(r2.overview.overdue_screenings).toBe(1);
  });

  it("defaults today when not provided", () => {
    const r = computeContextualSafeguardingIntelligence({
      screenings: [],
      localityRisks: [],
      children: [],
      staff: [],
    });
    // Should not throw, result should be valid
    expect(r.overview).toBeDefined();
  });
});
