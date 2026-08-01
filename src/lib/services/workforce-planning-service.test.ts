import { describe, it, expect } from "vitest";
import {
  computeWorkforceMetrics,
  identifyWorkforceAlerts,
  type StaffingSnapshot,
  type VacancyRecord,
  type SuccessionPlan,
} from "./workforce-planning-service";

// ── Factories ──────────────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<StaffingSnapshot> = {}): StaffingSnapshot {
  return {
    id: "snap-1",
    home_id: "home-1",
    snapshot_date: "2025-05-01",
    established_posts: 10,
    filled_posts: 8,
    vacancies: 2,
    agency_staff: 1,
    bank_staff: 0,
    staff_on_leave: 0,
    staff_on_sickness: 0,
    children_in_placement: 3,
    staff_child_ratio: 2.67,
    meets_minimum_ratio: true,
    commentary: null,
    recorded_by: "user-1",
    created_at: "2025-05-01T00:00:00Z",
    ...overrides,
  };
}

function makeVacancy(overrides: Partial<VacancyRecord> = {}): VacancyRecord {
  return {
    id: "vac-1",
    home_id: "home-1",
    role: "residential_care_worker",
    title: "RCW Post",
    status: "open",
    date_opened: "2025-04-01",
    date_filled: null,
    closing_date: null,
    applications_received: 0,
    interviews_scheduled: 0,
    offers_made: 0,
    agency_cover: false,
    recruitment_notes: null,
    created_at: "2025-04-01T00:00:00Z",
    updated_at: "2025-04-01T00:00:00Z",
    ...overrides,
  };
}

function makeSuccession(overrides: Partial<SuccessionPlan> = {}): SuccessionPlan {
  return {
    id: "succ-1",
    home_id: "home-1",
    critical_role: "registered_manager",
    role_title: "Registered Manager",
    current_holder: "Jane Smith",
    successor_name: "John Doe",
    readiness: "ready_now",
    development_actions: ["shadowing"],
    risk_if_vacant: "No RM cover",
    last_reviewed: "2025-04-01",
    created_at: "2025-04-01T00:00:00Z",
    updated_at: "2025-04-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeWorkforceMetrics ────────────────────────────────────────────────

describe("computeWorkforceMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeWorkforceMetrics([], [], []);
    expect(m.latest_established).toBe(0);
    expect(m.latest_filled).toBe(0);
    expect(m.latest_vacancies).toBe(0);
    expect(m.vacancy_rate).toBeNull();;
    expect(m.agency_count).toBe(0);
    expect(m.agency_rate).toBeNull();;
    expect(m.open_vacancies).toBe(0);
    expect(m.avg_time_to_fill).toBe(0);
    expect(m.succession_coverage).toBeNull();;
    expect(m.roles_at_risk).toBe(0);
  });

  it("uses latest snapshot by date", () => {
    const snapshots = [
      makeSnapshot({ id: "old", snapshot_date: "2025-01-01", established_posts: 5 }),
      makeSnapshot({ id: "new", snapshot_date: "2025-05-01", established_posts: 12 }),
    ];
    const m = computeWorkforceMetrics(snapshots, [], []);
    expect(m.latest_established).toBe(12);
  });

  it("computes vacancy and agency rates", () => {
    const snapshots = [makeSnapshot({ established_posts: 10, filled_posts: 8, vacancies: 2, agency_staff: 2 })];
    const m = computeWorkforceMetrics(snapshots, [], []);
    expect(m.vacancy_rate).toBe(20); // 2/10 * 100
    expect(m.agency_rate).toBe(20); // 2/(8+2) * 100
  });

  it("counts open vacancies excluding filled and withdrawn", () => {
    const vacancies = [
      makeVacancy({ status: "open" }),
      makeVacancy({ id: "v2", status: "filled" }),
      makeVacancy({ id: "v3", status: "withdrawn" }),
      makeVacancy({ id: "v4", status: "interviewing" }),
    ];
    const m = computeWorkforceMetrics([makeSnapshot()], vacancies, []);
    expect(m.open_vacancies).toBe(2); // open + interviewing
  });

  it("computes avg time to fill for filled vacancies", () => {
    const vacancies = [
      makeVacancy({ status: "filled", date_opened: "2025-01-01", date_filled: "2025-01-31" }),
      makeVacancy({ id: "v2", status: "filled", date_opened: "2025-02-01", date_filled: "2025-02-11" }),
    ];
    const m = computeWorkforceMetrics([makeSnapshot()], vacancies, []);
    expect(m.avg_time_to_fill).toBe(20); // (30+10)/2
  });

  it("computes succession coverage and roles at risk", () => {
    const plans = [
      makeSuccession({ readiness: "ready_now" }),
      makeSuccession({ id: "s2", readiness: "not_identified" }),
      makeSuccession({ id: "s3", readiness: "development_needed" }),
    ];
    const m = computeWorkforceMetrics([makeSnapshot()], [], plans);
    expect(m.succession_coverage).toBe(33.3); // 1/3
    expect(m.roles_at_risk).toBe(2);
  });
});

// ── identifyWorkforceAlerts ────────────────────────────────────────────────

describe("identifyWorkforceAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifyWorkforceAlerts([], [], []);
    expect(alerts).toEqual([]);
  });

  it("flags critical alert when ratio not met", () => {
    const snapshots = [makeSnapshot({ meets_minimum_ratio: false })];
    const alerts = identifyWorkforceAlerts(snapshots, [], []);
    const ratio = alerts.filter((a) => a.type === "ratio_not_met");
    expect(ratio.length).toBe(1);
    expect(ratio[0].severity).toBe("critical");
  });

  it("flags high alert for agency usage above 15%", () => {
    // filled=8, agency=2 => rate = 2/10 = 20% > 15
    const snapshots = [makeSnapshot({ filled_posts: 8, agency_staff: 2 })];
    const alerts = identifyWorkforceAlerts(snapshots, [], []);
    const agency = alerts.filter((a) => a.type === "high_agency_usage");
    expect(agency.length).toBe(1);
    expect(agency[0].severity).toBe("high");
  });

  it("does NOT flag agency usage at exactly 15% or below", () => {
    // filled=85, agency=15 => rate = 15/100 = 15% (not > 15)
    const snapshots = [makeSnapshot({ filled_posts: 85, agency_staff: 15 })];
    const alerts = identifyWorkforceAlerts(snapshots, [], []);
    const agency = alerts.filter((a) => a.type === "high_agency_usage");
    expect(agency.length).toBe(0);
  });

  it("flags critical for vacancies open >60 days", () => {
    const now = new Date("2025-06-15");
    const vacancies = [makeVacancy({ date_opened: "2025-04-01" })]; // 75 days
    const alerts = identifyWorkforceAlerts([makeSnapshot()], vacancies, [], now);
    const longVac = alerts.filter((a) => a.type === "long_vacancy" && a.severity === "critical");
    expect(longVac.length).toBe(1);
  });

  it("flags high for vacancies open >30 but <=60 days", () => {
    const now = new Date("2025-05-10");
    const vacancies = [makeVacancy({ date_opened: "2025-04-01" })]; // 39 days
    const alerts = identifyWorkforceAlerts([makeSnapshot()], vacancies, [], now);
    const longVac = alerts.filter((a) => a.type === "long_vacancy" && a.severity === "high");
    expect(longVac.length).toBe(1);
  });

  it("flags high for succession gaps (not_identified)", () => {
    const plans = [makeSuccession({ readiness: "not_identified" })];
    const alerts = identifyWorkforceAlerts([makeSnapshot()], [], plans);
    const gaps = alerts.filter((a) => a.type === "succession_gap");
    expect(gaps.length).toBe(1);
    expect(gaps[0].severity).toBe("high");
  });

  it("flags high sickness when rate > 15%", () => {
    // established=10, on_sickness=2 => 20% > 15
    const snapshots = [makeSnapshot({ established_posts: 10, staff_on_sickness: 2 })];
    const alerts = identifyWorkforceAlerts(snapshots, [], []);
    const sick = alerts.filter((a) => a.type === "high_sickness");
    expect(sick.length).toBe(1);
    expect(sick[0].severity).toBe("high");
  });
});
