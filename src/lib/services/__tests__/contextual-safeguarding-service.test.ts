// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONTEXTUAL SAFEGUARDING & EXPLOITATION SERVICE TESTS
// Pure-function unit tests for exploitation screening metrics computation,
// contextual safeguarding alert identification, constant validation, and
// CRUD fallback behaviour (Supabase disabled). CHR 2015 Reg 12 (protection
// from harm), Reg 13 (leadership & management re safeguarding), Reg 34
// (safeguarding), SCCIF Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  SCREENING_TYPES,
  RISK_LEVELS,
  EXPLOITATION_INDICATORS,
  LOCALITY_RISK_TYPES,
  LOCATION_TYPES,
  listScreenings,
  createScreening,
  updateScreening,
  listLocalityRisks,
  createLocalityRisk,
  updateLocalityRisk,
} from "../contextual-safeguarding-service";

import type {
  ExploitationScreening,
  LocalityRiskAssessment,
} from "../contextual-safeguarding-service";

const {
  computeContextualSafeguardingMetrics,
  identifyContextualSafeguardingAlerts,
  getLabelForScreeningType,
  getLabelForLocalityRiskType,
  SCREENING_RISK_RANK,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal ExploitationScreening with sensible defaults. */
function makeScreening(
  overrides: Partial<ExploitationScreening> = {},
): ExploitationScreening {
  return {
    id: "scr-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex",
    screening_date: daysAgo(5),
    screened_by: "staff-1",
    screening_type: "cse",
    risk_level: "no_concern",
    indicators_identified: [],
    protective_factors: [],
    location_risks: [],
    peer_associations: [],
    online_risks_identified: false,
    referral_made: false,
    referral_to: null,
    referral_date: null,
    safety_plan_in_place: false,
    safety_plan_review_date: null,
    next_screening_date: null,
    status: "completed",
    notes: null,
    created_at: daysAgoISO(5),
    updated_at: daysAgoISO(5),
    ...overrides,
  };
}

/** Build a minimal LocalityRiskAssessment with sensible defaults. */
function makeLocalityRisk(
  overrides: Partial<LocalityRiskAssessment> = {},
): LocalityRiskAssessment {
  return {
    id: "lr-1",
    home_id: "home-1",
    location_name: "Town Centre",
    location_type: "area",
    risk_type: "drug_dealing",
    risk_level: "medium",
    description: "Reports of drug dealing in the area",
    mitigation_measures: [],
    last_reviewed_date: null,
    reviewed_by: null,
    next_review_date: null,
    status: "active",
    created_at: daysAgoISO(10),
    updated_at: daysAgoISO(10),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("SCREENING_TYPES", () => {
  it("has exactly 9 screening types", () => {
    expect(SCREENING_TYPES).toHaveLength(9);
  });

  it("contains unique type values", () => {
    const types = SCREENING_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains unique label values", () => {
    const labels = SCREENING_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes cse", () => {
    expect(SCREENING_TYPES.find((t) => t.type === "cse")).toBeDefined();
  });

  it("includes cce", () => {
    expect(SCREENING_TYPES.find((t) => t.type === "cce")).toBeDefined();
  });

  it("includes county_lines", () => {
    expect(SCREENING_TYPES.find((t) => t.type === "county_lines")).toBeDefined();
  });

  it("includes radicalisation", () => {
    expect(SCREENING_TYPES.find((t) => t.type === "radicalisation")).toBeDefined();
  });

  it("includes online", () => {
    expect(SCREENING_TYPES.find((t) => t.type === "online")).toBeDefined();
  });

  it("includes trafficking", () => {
    expect(SCREENING_TYPES.find((t) => t.type === "trafficking")).toBeDefined();
  });

  it("includes modern_slavery", () => {
    expect(SCREENING_TYPES.find((t) => t.type === "modern_slavery")).toBeDefined();
  });

  it("includes gang_affiliation", () => {
    expect(SCREENING_TYPES.find((t) => t.type === "gang_affiliation")).toBeDefined();
  });

  it("includes peer_on_peer", () => {
    expect(SCREENING_TYPES.find((t) => t.type === "peer_on_peer")).toBeDefined();
  });

  it("every entry has both type and label", () => {
    for (const entry of SCREENING_TYPES) {
      expect(entry.type).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("RISK_LEVELS", () => {
  it("has exactly 5 risk levels", () => {
    expect(RISK_LEVELS).toHaveLength(5);
  });

  it("contains unique level values", () => {
    const levels = RISK_LEVELS.map((r) => r.level);
    expect(new Set(levels).size).toBe(levels.length);
  });

  it("contains unique label values", () => {
    const labels = RISK_LEVELS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes no_concern", () => {
    expect(RISK_LEVELS.find((r) => r.level === "no_concern")).toBeDefined();
  });

  it("includes emerging", () => {
    expect(RISK_LEVELS.find((r) => r.level === "emerging")).toBeDefined();
  });

  it("includes moderate", () => {
    expect(RISK_LEVELS.find((r) => r.level === "moderate")).toBeDefined();
  });

  it("includes significant", () => {
    expect(RISK_LEVELS.find((r) => r.level === "significant")).toBeDefined();
  });

  it("includes serious", () => {
    expect(RISK_LEVELS.find((r) => r.level === "serious")).toBeDefined();
  });

  it("every entry has both level and label", () => {
    for (const entry of RISK_LEVELS) {
      expect(entry.level).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("EXPLOITATION_INDICATORS", () => {
  it("has exactly 18 indicators", () => {
    expect(EXPLOITATION_INDICATORS).toHaveLength(18);
  });

  it("contains unique indicator values", () => {
    const indicators = EXPLOITATION_INDICATORS.map((i) => i.indicator);
    expect(new Set(indicators).size).toBe(indicators.length);
  });

  it("contains unique label values", () => {
    const labels = EXPLOITATION_INDICATORS.map((i) => i.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes unexplained_gifts", () => {
    expect(EXPLOITATION_INDICATORS.find((i) => i.indicator === "unexplained_gifts")).toBeDefined();
  });

  it("includes going_missing", () => {
    expect(EXPLOITATION_INDICATORS.find((i) => i.indicator === "going_missing")).toBeDefined();
  });

  it("includes county_lines_terminology", () => {
    expect(EXPLOITATION_INDICATORS.find((i) => i.indicator === "county_lines_terminology")).toBeDefined();
  });

  it("includes carrying_weapons", () => {
    expect(EXPLOITATION_INDICATORS.find((i) => i.indicator === "carrying_weapons")).toBeDefined();
  });

  it("includes multiple_phones", () => {
    expect(EXPLOITATION_INDICATORS.find((i) => i.indicator === "multiple_phones")).toBeDefined();
  });

  it("includes controlling_relationship", () => {
    expect(EXPLOITATION_INDICATORS.find((i) => i.indicator === "controlling_relationship")).toBeDefined();
  });

  it("every entry has both indicator and label", () => {
    for (const entry of EXPLOITATION_INDICATORS) {
      expect(entry.indicator).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("LOCALITY_RISK_TYPES", () => {
  it("has exactly 8 locality risk types", () => {
    expect(LOCALITY_RISK_TYPES).toHaveLength(8);
  });

  it("contains unique type values", () => {
    const types = LOCALITY_RISK_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains unique label values", () => {
    const labels = LOCALITY_RISK_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes drug_dealing", () => {
    expect(LOCALITY_RISK_TYPES.find((t) => t.type === "drug_dealing")).toBeDefined();
  });

  it("includes gang_activity", () => {
    expect(LOCALITY_RISK_TYPES.find((t) => t.type === "gang_activity")).toBeDefined();
  });

  it("includes sexual_exploitation", () => {
    expect(LOCALITY_RISK_TYPES.find((t) => t.type === "sexual_exploitation")).toBeDefined();
  });

  it("includes trafficking_route", () => {
    expect(LOCALITY_RISK_TYPES.find((t) => t.type === "trafficking_route")).toBeDefined();
  });

  it("includes antisocial_behaviour", () => {
    expect(LOCALITY_RISK_TYPES.find((t) => t.type === "antisocial_behaviour")).toBeDefined();
  });

  it("includes online_grooming", () => {
    expect(LOCALITY_RISK_TYPES.find((t) => t.type === "online_grooming")).toBeDefined();
  });

  it("includes radicalisation_hub", () => {
    expect(LOCALITY_RISK_TYPES.find((t) => t.type === "radicalisation_hub")).toBeDefined();
  });

  it("includes county_lines_cuckooing", () => {
    expect(LOCALITY_RISK_TYPES.find((t) => t.type === "county_lines_cuckooing")).toBeDefined();
  });

  it("every entry has both type and label", () => {
    for (const entry of LOCALITY_RISK_TYPES) {
      expect(entry.type).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("LOCATION_TYPES", () => {
  it("has exactly 8 location types", () => {
    expect(LOCATION_TYPES).toHaveLength(8);
  });

  it("contains unique type values", () => {
    const types = LOCATION_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains unique label values", () => {
    const labels = LOCATION_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes area", () => {
    expect(LOCATION_TYPES.find((t) => t.type === "area")).toBeDefined();
  });

  it("includes venue", () => {
    expect(LOCATION_TYPES.find((t) => t.type === "venue")).toBeDefined();
  });

  it("includes route", () => {
    expect(LOCATION_TYPES.find((t) => t.type === "route")).toBeDefined();
  });

  it("includes online_platform", () => {
    expect(LOCATION_TYPES.find((t) => t.type === "online_platform")).toBeDefined();
  });

  it("includes school", () => {
    expect(LOCATION_TYPES.find((t) => t.type === "school")).toBeDefined();
  });

  it("includes park", () => {
    expect(LOCATION_TYPES.find((t) => t.type === "park")).toBeDefined();
  });

  it("includes shop", () => {
    expect(LOCATION_TYPES.find((t) => t.type === "shop")).toBeDefined();
  });

  it("includes transport_hub", () => {
    expect(LOCATION_TYPES.find((t) => t.type === "transport_hub")).toBeDefined();
  });

  it("every entry has both type and label", () => {
    for (const entry of LOCATION_TYPES) {
      expect(entry.type).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("SCREENING_RISK_RANK", () => {
  it("has exactly 5 entries", () => {
    expect(Object.keys(SCREENING_RISK_RANK)).toHaveLength(5);
  });

  it("ranks no_concern as lowest (0)", () => {
    expect(SCREENING_RISK_RANK.no_concern).toBe(0);
  });

  it("ranks emerging as 1", () => {
    expect(SCREENING_RISK_RANK.emerging).toBe(1);
  });

  it("ranks moderate as 2", () => {
    expect(SCREENING_RISK_RANK.moderate).toBe(2);
  });

  it("ranks significant as 3", () => {
    expect(SCREENING_RISK_RANK.significant).toBe(3);
  });

  it("ranks serious as highest (4)", () => {
    expect(SCREENING_RISK_RANK.serious).toBe(4);
  });

  it("has strictly ascending order from no_concern to serious", () => {
    expect(SCREENING_RISK_RANK.no_concern).toBeLessThan(SCREENING_RISK_RANK.emerging);
    expect(SCREENING_RISK_RANK.emerging).toBeLessThan(SCREENING_RISK_RANK.moderate);
    expect(SCREENING_RISK_RANK.moderate).toBeLessThan(SCREENING_RISK_RANK.significant);
    expect(SCREENING_RISK_RANK.significant).toBeLessThan(SCREENING_RISK_RANK.serious);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// getLabelForScreeningType
// ═══════════════════════════════════════════════════════════════════════════

describe("getLabelForScreeningType", () => {
  it("returns label for known screening type cse", () => {
    expect(getLabelForScreeningType("cse")).toBe("Child Sexual Exploitation");
  });

  it("returns label for known screening type cce", () => {
    expect(getLabelForScreeningType("cce")).toBe("Child Criminal Exploitation");
  });

  it("returns label for known screening type county_lines", () => {
    expect(getLabelForScreeningType("county_lines")).toBe("County Lines");
  });

  it("returns the raw type string for unknown types", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getLabelForScreeningType("unknown_type" as any)).toBe("unknown_type");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// getLabelForLocalityRiskType
// ═══════════════════════════════════════════════════════════════════════════

describe("getLabelForLocalityRiskType", () => {
  it("returns label for known locality risk type drug_dealing", () => {
    expect(getLabelForLocalityRiskType("drug_dealing")).toBe("Drug Dealing");
  });

  it("returns label for known locality risk type gang_activity", () => {
    expect(getLabelForLocalityRiskType("gang_activity")).toBe("Gang Activity");
  });

  it("returns label for known locality risk type county_lines_cuckooing", () => {
    expect(getLabelForLocalityRiskType("county_lines_cuckooing")).toBe("County Lines / Cuckooing");
  });

  it("returns the raw type string for unknown types", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getLabelForLocalityRiskType("unknown_risk" as any)).toBe("unknown_risk");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeContextualSafeguardingMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeContextualSafeguardingMetrics", () => {
  it("returns zeroed metrics for empty inputs", () => {
    const result = computeContextualSafeguardingMetrics([], []);
    expect(result.children_screened).toBe(0);
    expect(result.total_screenings).toBe(0);
    expect(result.overdue_screenings).toBe(0);
    expect(result.referral_rate_percentage).toBe(0);
    expect(result.screenings_with_safety_plan).toBe(0);
    expect(result.high_risk_locations).toBe(0);
    expect(result.active_locality_risks).toBe(0);
    expect(result.by_risk_level).toEqual({
      no_concern: 0,
      emerging: 0,
      moderate: 0,
      significant: 0,
      serious: 0,
    });
    expect(result.by_screening_type).toEqual({});
  });

  it("counts total screenings correctly", () => {
    const screenings = [
      makeScreening({ id: "s1" }),
      makeScreening({ id: "s2" }),
      makeScreening({ id: "s3" }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, []);
    expect(result.total_screenings).toBe(3);
  });

  it("counts unique children screened", () => {
    const screenings = [
      makeScreening({ id: "s1", child_id: "c1" }),
      makeScreening({ id: "s2", child_id: "c1" }),
      makeScreening({ id: "s3", child_id: "c2" }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, []);
    expect(result.children_screened).toBe(2);
  });

  it("counts single child screened multiple times as 1", () => {
    const screenings = [
      makeScreening({ id: "s1", child_id: "c1" }),
      makeScreening({ id: "s2", child_id: "c1" }),
      makeScreening({ id: "s3", child_id: "c1" }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, []);
    expect(result.children_screened).toBe(1);
  });

  it("groups screenings by risk level", () => {
    const screenings = [
      makeScreening({ id: "s1", risk_level: "no_concern" }),
      makeScreening({ id: "s2", risk_level: "emerging" }),
      makeScreening({ id: "s3", risk_level: "emerging" }),
      makeScreening({ id: "s4", risk_level: "serious" }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, []);
    expect(result.by_risk_level.no_concern).toBe(1);
    expect(result.by_risk_level.emerging).toBe(2);
    expect(result.by_risk_level.moderate).toBe(0);
    expect(result.by_risk_level.significant).toBe(0);
    expect(result.by_risk_level.serious).toBe(1);
  });

  it("groups screenings by screening type", () => {
    const screenings = [
      makeScreening({ id: "s1", screening_type: "cse" }),
      makeScreening({ id: "s2", screening_type: "cse" }),
      makeScreening({ id: "s3", screening_type: "cce" }),
      makeScreening({ id: "s4", screening_type: "county_lines" }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, []);
    expect(result.by_screening_type).toEqual({
      cse: 2,
      cce: 1,
      county_lines: 1,
    });
  });

  it("counts overdue screenings when next_screening_date has passed", () => {
    const now = new Date("2026-05-10");
    const screenings = [
      makeScreening({ id: "s1", next_screening_date: "2026-05-01" }),
      makeScreening({ id: "s2", next_screening_date: "2026-05-09" }),
      makeScreening({ id: "s3", next_screening_date: "2026-05-15" }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, [], now);
    expect(result.overdue_screenings).toBe(2);
  });

  it("does not count screenings without next_screening_date as overdue", () => {
    const screenings = [
      makeScreening({ id: "s1", next_screening_date: null }),
      makeScreening({ id: "s2", next_screening_date: null }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, []);
    expect(result.overdue_screenings).toBe(0);
  });

  it("does not count future next_screening_date as overdue", () => {
    const screenings = [
      makeScreening({ id: "s1", next_screening_date: daysFromNow(10) }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, []);
    expect(result.overdue_screenings).toBe(0);
  });

  it("computes referral rate percentage correctly", () => {
    const screenings = [
      makeScreening({ id: "s1", referral_made: true }),
      makeScreening({ id: "s2", referral_made: true }),
      makeScreening({ id: "s3", referral_made: false }),
      makeScreening({ id: "s4", referral_made: false }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, []);
    expect(result.referral_rate_percentage).toBe(50);
  });

  it("returns 0 referral rate for empty screenings", () => {
    const result = computeContextualSafeguardingMetrics([], []);
    expect(result.referral_rate_percentage).toBe(0);
  });

  it("returns 100 referral rate when all screenings have referrals", () => {
    const screenings = [
      makeScreening({ id: "s1", referral_made: true }),
      makeScreening({ id: "s2", referral_made: true }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, []);
    expect(result.referral_rate_percentage).toBe(100);
  });

  it("rounds referral rate to nearest integer", () => {
    const screenings = [
      makeScreening({ id: "s1", referral_made: true }),
      makeScreening({ id: "s2", referral_made: false }),
      makeScreening({ id: "s3", referral_made: false }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, []);
    expect(result.referral_rate_percentage).toBe(33);
  });

  it("counts screenings with safety plan", () => {
    const screenings = [
      makeScreening({ id: "s1", safety_plan_in_place: true }),
      makeScreening({ id: "s2", safety_plan_in_place: true }),
      makeScreening({ id: "s3", safety_plan_in_place: false }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, []);
    expect(result.screenings_with_safety_plan).toBe(2);
  });

  it("returns 0 safety plans when none present", () => {
    const screenings = [
      makeScreening({ id: "s1", safety_plan_in_place: false }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, []);
    expect(result.screenings_with_safety_plan).toBe(0);
  });

  it("counts high risk locations from active locality risks", () => {
    const localityRisks = [
      makeLocalityRisk({ id: "lr-1", risk_level: "high", status: "active" }),
      makeLocalityRisk({ id: "lr-2", risk_level: "very_high", status: "active" }),
      makeLocalityRisk({ id: "lr-3", risk_level: "medium", status: "active" }),
      makeLocalityRisk({ id: "lr-4", risk_level: "low", status: "active" }),
    ];
    const result = computeContextualSafeguardingMetrics([], localityRisks);
    expect(result.high_risk_locations).toBe(2);
  });

  it("does not count archived locality risks as high risk locations", () => {
    const localityRisks = [
      makeLocalityRisk({ id: "lr-1", risk_level: "high", status: "archived" }),
      makeLocalityRisk({ id: "lr-2", risk_level: "very_high", status: "archived" }),
    ];
    const result = computeContextualSafeguardingMetrics([], localityRisks);
    expect(result.high_risk_locations).toBe(0);
  });

  it("counts active locality risks", () => {
    const localityRisks = [
      makeLocalityRisk({ id: "lr-1", status: "active" }),
      makeLocalityRisk({ id: "lr-2", status: "active" }),
      makeLocalityRisk({ id: "lr-3", status: "archived" }),
    ];
    const result = computeContextualSafeguardingMetrics([], localityRisks);
    expect(result.active_locality_risks).toBe(2);
  });

  it("returns 0 active locality risks when all archived", () => {
    const localityRisks = [
      makeLocalityRisk({ id: "lr-1", status: "archived" }),
    ];
    const result = computeContextualSafeguardingMetrics([], localityRisks);
    expect(result.active_locality_risks).toBe(0);
  });

  it("handles mixed screenings and locality risks together", () => {
    const screenings = [
      makeScreening({ id: "s1", child_id: "c1", risk_level: "serious", referral_made: true, safety_plan_in_place: true }),
      makeScreening({ id: "s2", child_id: "c2", risk_level: "moderate", referral_made: false, safety_plan_in_place: false }),
    ];
    const localityRisks = [
      makeLocalityRisk({ id: "lr-1", risk_level: "high", status: "active" }),
      makeLocalityRisk({ id: "lr-2", risk_level: "low", status: "active" }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, localityRisks);
    expect(result.children_screened).toBe(2);
    expect(result.total_screenings).toBe(2);
    expect(result.by_risk_level.serious).toBe(1);
    expect(result.by_risk_level.moderate).toBe(1);
    expect(result.referral_rate_percentage).toBe(50);
    expect(result.screenings_with_safety_plan).toBe(1);
    expect(result.high_risk_locations).toBe(1);
    expect(result.active_locality_risks).toBe(2);
  });

  it("accumulates all screening types across multiple records", () => {
    const screenings = [
      makeScreening({ id: "s1", screening_type: "online" }),
      makeScreening({ id: "s2", screening_type: "online" }),
      makeScreening({ id: "s3", screening_type: "radicalisation" }),
      makeScreening({ id: "s4", screening_type: "trafficking" }),
      makeScreening({ id: "s5", screening_type: "trafficking" }),
      makeScreening({ id: "s6", screening_type: "trafficking" }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, []);
    expect(result.by_screening_type.online).toBe(2);
    expect(result.by_screening_type.radicalisation).toBe(1);
    expect(result.by_screening_type.trafficking).toBe(3);
  });

  it("handles single screening with all features", () => {
    const now = new Date("2026-06-01");
    const screenings = [
      makeScreening({
        id: "s1",
        child_id: "c1",
        risk_level: "significant",
        screening_type: "gang_affiliation",
        referral_made: true,
        safety_plan_in_place: true,
        next_screening_date: "2026-05-15",
      }),
    ];
    const result = computeContextualSafeguardingMetrics(screenings, [], now);
    expect(result.children_screened).toBe(1);
    expect(result.total_screenings).toBe(1);
    expect(result.by_risk_level.significant).toBe(1);
    expect(result.by_screening_type.gang_affiliation).toBe(1);
    expect(result.referral_rate_percentage).toBe(100);
    expect(result.screenings_with_safety_plan).toBe(1);
    expect(result.overdue_screenings).toBe(1);
  });

  it("only counts medium and low locality risks as not high risk", () => {
    const localityRisks = [
      makeLocalityRisk({ id: "lr-1", risk_level: "low", status: "active" }),
      makeLocalityRisk({ id: "lr-2", risk_level: "medium", status: "active" }),
    ];
    const result = computeContextualSafeguardingMetrics([], localityRisks);
    expect(result.high_risk_locations).toBe(0);
    expect(result.active_locality_risks).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifyContextualSafeguardingAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyContextualSafeguardingAlerts", () => {
  it("returns empty array for empty inputs", () => {
    const alerts = identifyContextualSafeguardingAlerts([], []);
    expect(alerts).toEqual([]);
  });

  it("returns empty array when all screenings are no_concern with no issues", () => {
    const screenings = [
      makeScreening({ risk_level: "no_concern", safety_plan_in_place: false, next_screening_date: null }),
    ];
    const alerts = identifyContextualSafeguardingAlerts(screenings, []);
    expect(alerts).toEqual([]);
  });

  // ── Serious risk alerts ───────────────────────────────────────────────

  describe("serious risk alerts", () => {
    it("generates critical alert for serious risk screening", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "serious", screening_type: "cse", child_name: "Alex" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const serious = alerts.filter((a) => a.category === "serious_risk");
      expect(serious).toHaveLength(1);
      expect(serious[0].severity).toBe("critical");
      expect(serious[0].related_id).toBe("s1");
      expect(serious[0].related_type).toBe("screening");
    });

    it("includes child name in serious risk message", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "serious", child_name: "Beth" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const serious = alerts.find((a) => a.category === "serious_risk");
      expect(serious?.message).toContain("Beth");
    });

    it("includes screening type label in serious risk message", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "serious", screening_type: "county_lines" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const serious = alerts.find((a) => a.category === "serious_risk");
      expect(serious?.message).toContain("County Lines");
    });

    it("generates multiple serious risk alerts for multiple children", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "c1", risk_level: "serious" }),
        makeScreening({ id: "s2", child_id: "c2", risk_level: "serious" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const serious = alerts.filter((a) => a.category === "serious_risk");
      expect(serious).toHaveLength(2);
    });
  });

  // ── Significant risk alerts ───────────────────────────────────────────

  describe("significant risk alerts", () => {
    it("generates high alert for significant risk screening", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "significant", screening_type: "online", child_name: "Charlie" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const significant = alerts.filter((a) => a.category === "significant_risk");
      expect(significant).toHaveLength(1);
      expect(significant[0].severity).toBe("high");
      expect(significant[0].related_id).toBe("s1");
      expect(significant[0].related_type).toBe("screening");
    });

    it("includes child name in significant risk message", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "significant", child_name: "Diana" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const significant = alerts.find((a) => a.category === "significant_risk");
      expect(significant?.message).toContain("Diana");
    });

    it("does not generate significant risk alert for moderate level", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "moderate" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const significant = alerts.filter((a) => a.category === "significant_risk");
      expect(significant).toHaveLength(0);
    });

    it("does not generate significant risk alert for emerging level", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "emerging" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const significant = alerts.filter((a) => a.category === "significant_risk");
      expect(significant).toHaveLength(0);
    });
  });

  // ── Overdue screening alerts ──────────────────────────────────────────

  describe("overdue screening alerts", () => {
    it("generates high alert for overdue screening", () => {
      const now = new Date("2026-06-01");
      const screenings = [
        makeScreening({ id: "s1", next_screening_date: "2026-05-15", child_name: "Eve", screening_type: "cce" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, [], now);
      const overdue = alerts.filter((a) => a.category === "overdue_screening");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].severity).toBe("high");
      expect(overdue[0].related_id).toBe("s1");
      expect(overdue[0].related_type).toBe("screening");
    });

    it("includes child name in overdue screening message", () => {
      const now = new Date("2026-06-01");
      const screenings = [
        makeScreening({ id: "s1", next_screening_date: "2026-05-15", child_name: "Frank" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, [], now);
      const overdue = alerts.find((a) => a.category === "overdue_screening");
      expect(overdue?.message).toContain("Frank");
    });

    it("includes overdue date in message", () => {
      const now = new Date("2026-06-01");
      const screenings = [
        makeScreening({ id: "s1", next_screening_date: "2026-05-15" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, [], now);
      const overdue = alerts.find((a) => a.category === "overdue_screening");
      expect(overdue?.message).toContain("2026-05-15");
    });

    it("does not flag future screenings as overdue", () => {
      const now = new Date("2026-05-01");
      const screenings = [
        makeScreening({ id: "s1", next_screening_date: "2026-06-15" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, [], now);
      const overdue = alerts.filter((a) => a.category === "overdue_screening");
      expect(overdue).toHaveLength(0);
    });

    it("does not flag screenings without next_screening_date", () => {
      const screenings = [
        makeScreening({ id: "s1", next_screening_date: null }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const overdue = alerts.filter((a) => a.category === "overdue_screening");
      expect(overdue).toHaveLength(0);
    });

    it("flags multiple overdue screenings", () => {
      const now = new Date("2026-06-01");
      const screenings = [
        makeScreening({ id: "s1", next_screening_date: "2026-05-01" }),
        makeScreening({ id: "s2", next_screening_date: "2026-05-10" }),
        makeScreening({ id: "s3", next_screening_date: "2026-06-15" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, [], now);
      const overdue = alerts.filter((a) => a.category === "overdue_screening");
      expect(overdue).toHaveLength(2);
    });
  });

  // ── Missing safety plan alerts ────────────────────────────────────────

  describe("missing safety plan alerts", () => {
    it("generates critical alert for serious risk without safety plan", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "serious", safety_plan_in_place: false, child_name: "Grace" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const missing = alerts.filter((a) => a.category === "missing_safety_plan");
      expect(missing).toHaveLength(1);
      expect(missing[0].severity).toBe("critical");
    });

    it("generates high alert for significant risk without safety plan", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "significant", safety_plan_in_place: false }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const missing = alerts.filter((a) => a.category === "missing_safety_plan");
      expect(missing).toHaveLength(1);
      expect(missing[0].severity).toBe("high");
    });

    it("generates high alert for moderate risk without safety plan", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "moderate", safety_plan_in_place: false }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const missing = alerts.filter((a) => a.category === "missing_safety_plan");
      expect(missing).toHaveLength(1);
      expect(missing[0].severity).toBe("high");
    });

    it("does not flag no_concern risk without safety plan", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "no_concern", safety_plan_in_place: false }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const missing = alerts.filter((a) => a.category === "missing_safety_plan");
      expect(missing).toHaveLength(0);
    });

    it("does not flag emerging risk without safety plan", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "emerging", safety_plan_in_place: false }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const missing = alerts.filter((a) => a.category === "missing_safety_plan");
      expect(missing).toHaveLength(0);
    });

    it("does not flag elevated risk when safety plan is in place", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "serious", safety_plan_in_place: true }),
        makeScreening({ id: "s2", risk_level: "significant", safety_plan_in_place: true }),
        makeScreening({ id: "s3", risk_level: "moderate", safety_plan_in_place: true }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const missing = alerts.filter((a) => a.category === "missing_safety_plan");
      expect(missing).toHaveLength(0);
    });

    it("includes child name in missing safety plan message", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "moderate", safety_plan_in_place: false, child_name: "Henry" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const missing = alerts.find((a) => a.category === "missing_safety_plan");
      expect(missing?.message).toContain("Henry");
    });

    it("includes risk level in missing safety plan message", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "significant", safety_plan_in_place: false }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const missing = alerts.find((a) => a.category === "missing_safety_plan");
      expect(missing?.message).toContain("significant");
    });
  });

  // ── Locality risk alerts — unreviewed ─────────────────────────────────

  describe("unreviewed locality risk alerts", () => {
    it("generates medium alert for overdue locality risk review", () => {
      const now = new Date("2026-06-01");
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", next_review_date: "2026-05-15", status: "active", risk_level: "medium" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts([], localityRisks, now);
      const unreviewed = alerts.filter((a) => a.category === "unreviewed_locality_risk");
      expect(unreviewed).toHaveLength(1);
      expect(unreviewed[0].severity).toBe("medium");
      expect(unreviewed[0].related_id).toBe("lr-1");
      expect(unreviewed[0].related_type).toBe("locality_risk");
    });

    it("generates critical alert for overdue very_high locality risk review", () => {
      const now = new Date("2026-06-01");
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", next_review_date: "2026-05-15", status: "active", risk_level: "very_high" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts([], localityRisks, now);
      const unreviewed = alerts.filter((a) => a.category === "unreviewed_locality_risk");
      expect(unreviewed).toHaveLength(1);
      expect(unreviewed[0].severity).toBe("critical");
    });

    it("does not flag archived locality risks as overdue", () => {
      const now = new Date("2026-06-01");
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", next_review_date: "2026-05-01", status: "archived" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts([], localityRisks, now);
      const unreviewed = alerts.filter((a) => a.category === "unreviewed_locality_risk");
      expect(unreviewed).toHaveLength(0);
    });

    it("does not flag future review dates as overdue", () => {
      const now = new Date("2026-05-01");
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", next_review_date: "2026-06-15", status: "active" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts([], localityRisks, now);
      const unreviewed = alerts.filter((a) => a.category === "unreviewed_locality_risk");
      expect(unreviewed).toHaveLength(0);
    });

    it("does not flag locality risks without next_review_date", () => {
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", next_review_date: null, status: "active" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts([], localityRisks);
      const unreviewed = alerts.filter((a) => a.category === "unreviewed_locality_risk");
      expect(unreviewed).toHaveLength(0);
    });

    it("includes location name in unreviewed message", () => {
      const now = new Date("2026-06-01");
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", location_name: "High Street", next_review_date: "2026-05-01", status: "active" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts([], localityRisks, now);
      const unreviewed = alerts.find((a) => a.category === "unreviewed_locality_risk");
      expect(unreviewed?.message).toContain("High Street");
    });

    it("includes overdue date in unreviewed message", () => {
      const now = new Date("2026-06-01");
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", next_review_date: "2026-05-10", status: "active" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts([], localityRisks, now);
      const unreviewed = alerts.find((a) => a.category === "unreviewed_locality_risk");
      expect(unreviewed?.message).toContain("2026-05-10");
    });
  });

  // ── Very high locality risk alerts ────────────────────────────────────

  describe("very high locality risk alerts", () => {
    it("generates critical alert for active very_high locality risk", () => {
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", risk_level: "very_high", status: "active", location_name: "Danger Zone" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts([], localityRisks);
      const veryHigh = alerts.filter((a) => a.category === "very_high_locality_risk");
      expect(veryHigh).toHaveLength(1);
      expect(veryHigh[0].severity).toBe("critical");
      expect(veryHigh[0].related_id).toBe("lr-1");
      expect(veryHigh[0].related_type).toBe("locality_risk");
    });

    it("includes location name in very high risk message", () => {
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", risk_level: "very_high", status: "active", location_name: "Park Lane" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts([], localityRisks);
      const veryHigh = alerts.find((a) => a.category === "very_high_locality_risk");
      expect(veryHigh?.message).toContain("Park Lane");
    });

    it("includes risk type label in very high risk message", () => {
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", risk_level: "very_high", status: "active", risk_type: "gang_activity" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts([], localityRisks);
      const veryHigh = alerts.find((a) => a.category === "very_high_locality_risk");
      expect(veryHigh?.message).toContain("Gang Activity");
    });

    it("does not flag archived very_high locality risks", () => {
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", risk_level: "very_high", status: "archived" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts([], localityRisks);
      const veryHigh = alerts.filter((a) => a.category === "very_high_locality_risk");
      expect(veryHigh).toHaveLength(0);
    });

    it("does not flag active high risk as very_high", () => {
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", risk_level: "high", status: "active" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts([], localityRisks);
      const veryHigh = alerts.filter((a) => a.category === "very_high_locality_risk");
      expect(veryHigh).toHaveLength(0);
    });

    it("flags multiple very_high locality risks", () => {
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", risk_level: "very_high", status: "active" }),
        makeLocalityRisk({ id: "lr-2", risk_level: "very_high", status: "active" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts([], localityRisks);
      const veryHigh = alerts.filter((a) => a.category === "very_high_locality_risk");
      expect(veryHigh).toHaveLength(2);
    });
  });

  // ── Sorting ───────────────────────────────────────────────────────────

  describe("alert sorting", () => {
    it("sorts alerts by severity: critical first, then high, medium, low", () => {
      const now = new Date("2026-06-01");
      const screenings = [
        makeScreening({ id: "s1", risk_level: "serious", safety_plan_in_place: false }),
        makeScreening({ id: "s2", risk_level: "significant", safety_plan_in_place: true }),
      ];
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", risk_level: "medium", status: "active", next_review_date: "2026-05-01" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, localityRisks, now);
      expect(alerts.length).toBeGreaterThanOrEqual(2);
      const severities = alerts.map((a) => a.severity);
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      for (let i = 1; i < severities.length; i++) {
        expect(order[severities[i]]).toBeGreaterThanOrEqual(order[severities[i - 1]]);
      }
    });

    it("critical alerts appear before high alerts", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "significant", safety_plan_in_place: true }),
        makeScreening({ id: "s2", risk_level: "serious", safety_plan_in_place: true }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const seriousIdx = alerts.findIndex((a) => a.category === "serious_risk");
      const significantIdx = alerts.findIndex((a) => a.category === "significant_risk");
      expect(seriousIdx).toBeLessThan(significantIdx);
    });
  });

  // ── Combined / complex scenarios ──────────────────────────────────────

  describe("combined alert scenarios", () => {
    it("generates multiple alert types for a serious risk screening without safety plan", () => {
      const screenings = [
        makeScreening({
          id: "s1",
          risk_level: "serious",
          safety_plan_in_place: false,
          screening_type: "cse",
          child_name: "Iris",
        }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, []);
      const categories = alerts.map((a) => a.category);
      expect(categories).toContain("serious_risk");
      expect(categories).toContain("missing_safety_plan");
    });

    it("generates both screening and locality risk alerts", () => {
      const now = new Date("2026-06-01");
      const screenings = [
        makeScreening({ id: "s1", risk_level: "serious" }),
      ];
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", risk_level: "very_high", status: "active" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, localityRisks, now);
      const screeningAlerts = alerts.filter((a) => a.related_type === "screening");
      const localityAlerts = alerts.filter((a) => a.related_type === "locality_risk");
      expect(screeningAlerts.length).toBeGreaterThanOrEqual(1);
      expect(localityAlerts.length).toBeGreaterThanOrEqual(1);
    });

    it("generates overdue and risk alerts simultaneously", () => {
      const now = new Date("2026-06-01");
      const screenings = [
        makeScreening({
          id: "s1",
          risk_level: "significant",
          safety_plan_in_place: false,
          next_screening_date: "2026-05-01",
        }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, [], now);
      const categories = alerts.map((a) => a.category);
      expect(categories).toContain("significant_risk");
      expect(categories).toContain("overdue_screening");
      expect(categories).toContain("missing_safety_plan");
    });

    it("handles locality risk with both unreviewed and very_high alerts", () => {
      const now = new Date("2026-06-01");
      const localityRisks = [
        makeLocalityRisk({
          id: "lr-1",
          risk_level: "very_high",
          status: "active",
          next_review_date: "2026-05-01",
        }),
      ];
      const alerts = identifyContextualSafeguardingAlerts([], localityRisks, now);
      const categories = alerts.map((a) => a.category);
      expect(categories).toContain("unreviewed_locality_risk");
      expect(categories).toContain("very_high_locality_risk");
    });

    it("does not generate alerts for no_concern screenings with no issues", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "no_concern", safety_plan_in_place: false, next_screening_date: null }),
        makeScreening({ id: "s2", risk_level: "no_concern", safety_plan_in_place: true, next_screening_date: null }),
      ];
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", risk_level: "low", status: "active", next_review_date: null }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, localityRisks);
      expect(alerts).toEqual([]);
    });

    it("handles large mixed dataset correctly", () => {
      const now = new Date("2026-06-01");
      const screenings = [
        makeScreening({ id: "s1", risk_level: "serious", safety_plan_in_place: false, next_screening_date: "2026-05-01", child_id: "c1" }),
        makeScreening({ id: "s2", risk_level: "significant", safety_plan_in_place: true, child_id: "c2" }),
        makeScreening({ id: "s3", risk_level: "moderate", safety_plan_in_place: false, child_id: "c3" }),
        makeScreening({ id: "s4", risk_level: "emerging", safety_plan_in_place: false, child_id: "c4" }),
        makeScreening({ id: "s5", risk_level: "no_concern", safety_plan_in_place: false, child_id: "c5" }),
      ];
      const localityRisks = [
        makeLocalityRisk({ id: "lr-1", risk_level: "very_high", status: "active", next_review_date: "2026-05-01" }),
        makeLocalityRisk({ id: "lr-2", risk_level: "high", status: "active" }),
        makeLocalityRisk({ id: "lr-3", risk_level: "medium", status: "archived" }),
      ];
      const alerts = identifyContextualSafeguardingAlerts(screenings, localityRisks, now);

      // serious_risk for s1, significant_risk for s2, missing_safety_plan for s1 + s3
      // overdue_screening for s1, very_high_locality_risk for lr-1, unreviewed_locality_risk for lr-1
      expect(alerts.length).toBeGreaterThanOrEqual(6);

      const categories = alerts.map((a) => a.category);
      expect(categories).toContain("serious_risk");
      expect(categories).toContain("significant_risk");
      expect(categories).toContain("missing_safety_plan");
      expect(categories).toContain("overdue_screening");
      expect(categories).toContain("very_high_locality_risk");
      expect(categories).toContain("unreviewed_locality_risk");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Exploitation Screenings (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listScreenings", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listScreenings("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of filters", async () => {
    const result = await listScreenings("home-1", {
      childId: "child-1",
      screeningType: "cse",
      riskLevel: "serious",
      status: "completed",
      limit: 50,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createScreening", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createScreening({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alex",
      screenedBy: "staff-1",
      screeningType: "cse",
      riskLevel: "no_concern",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updateScreening", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updateScreening("scr-1", { risk_level: "serious" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Locality Risk Assessments (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listLocalityRisks", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listLocalityRisks("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of filters", async () => {
    const result = await listLocalityRisks("home-1", {
      locationType: "area",
      riskType: "drug_dealing",
      riskLevel: "high",
      status: "active",
      limit: 25,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createLocalityRisk", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createLocalityRisk({
      homeId: "home-1",
      locationName: "Town Centre",
      locationType: "area",
      riskType: "drug_dealing",
      riskLevel: "high",
      description: "Persistent drug dealing",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updateLocalityRisk", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updateLocalityRisk("lr-1", { risk_level: "very_high" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});
