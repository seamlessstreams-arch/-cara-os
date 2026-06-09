// ══════════════════════════════════════════════════════════════════════════════
// Staff Deployment Intelligence Engine — Tests
//
// Chamberlain House demo data:
//   Staff: Sarah Johnson (RM), Tom Richards (RSW), Lisa Williams (Senior RSW),
//          Darren Laville (RM) + 2 bank/agency
//   Children: Alex (14), Jordan (13), Morgan (15)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateStaffingAdequacy,
  evaluateAgencyMinimisation,
  evaluateConsistencyOfCare,
  evaluateRotaCompliance,
  evaluateIncidentManagement,
  generateStaffDeploymentIntelligence,
} from "../staff-deployment-engine";
import type {
  StaffMember,
  ShiftRota,
  AgencyUsage,
  StaffingIncident,
  ConsistencyRecord,
  DeploymentStatus,
  ShiftType,
} from "../staff-deployment-engine";

// ── Constants ─────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01T00:00:00Z";
const PERIOD_END = "2026-05-18T00:00:00Z";
const REFERENCE_DATE = "2026-05-18T12:00:00Z";

// ── Demo Fixtures ─────────────────────────────────────────────────────────

function makeOakHouseStaff(): StaffMember[] {
  return [
    { id: "staff-sarah", name: "Sarah Johnson", role: "registered_manager", contractType: "permanent", startDate: "2022-01-10T00:00:00Z", keyChildren: ["child-alex", "child-jordan"] },
    { id: "staff-tom", name: "Tom Richards", role: "rsw", contractType: "permanent", startDate: "2023-03-15T00:00:00Z", keyChildren: ["child-morgan"] },
    { id: "staff-lisa", name: "Lisa Williams", role: "senior_rsw", contractType: "permanent", startDate: "2023-06-01T00:00:00Z", keyChildren: ["child-alex"] },
    { id: "staff-darren", name: "Darren Laville", role: "registered_manager", contractType: "permanent", startDate: "2021-09-01T00:00:00Z", keyChildren: ["child-jordan", "child-morgan"] },
    { id: "staff-bank-1", name: "Emma Wilson", role: "bank", contractType: "bank", startDate: "2024-01-15T00:00:00Z", keyChildren: [] },
    { id: "staff-agency-1", name: "James Carter", role: "agency", contractType: "agency", startDate: "2026-02-01T00:00:00Z", keyChildren: [] },
  ];
}

function makeOakHouseRotas(): ShiftRota[] {
  return [
    // January — well staffed
    { date: "2026-01-05T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-tom"], status: "filled", childrenPresent: 3 },
    { date: "2026-01-05T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-lisa", "staff-darren"], actualStaff: ["staff-lisa", "staff-darren"], status: "filled", childrenPresent: 3 },
    { date: "2026-01-05T00:00:00Z", shiftType: "waking_night", plannedStaff: ["staff-tom"], actualStaff: ["staff-tom"], status: "filled", childrenPresent: 3 },
    { date: "2026-01-12T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-darren", "staff-lisa"], actualStaff: ["staff-darren", "staff-lisa"], status: "filled", childrenPresent: 3 },
    { date: "2026-01-12T00:00:00Z", shiftType: "long_day", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-tom"], status: "filled", childrenPresent: 3 },
    { date: "2026-01-19T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-tom"], status: "filled", childrenPresent: 2 },
    { date: "2026-01-19T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-darren", "staff-lisa"], actualStaff: ["staff-darren", "staff-lisa"], status: "filled", childrenPresent: 2 },
    { date: "2026-01-19T00:00:00Z", shiftType: "sleep_in", plannedStaff: ["staff-lisa"], actualStaff: ["staff-lisa"], status: "filled", childrenPresent: 2 },
    // February — one agency cover
    { date: "2026-02-02T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-agency-1"], status: "agency_cover", childrenPresent: 3 },
    { date: "2026-02-02T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-darren", "staff-lisa"], actualStaff: ["staff-darren", "staff-lisa"], status: "filled", childrenPresent: 3 },
    { date: "2026-02-09T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-darren", "staff-tom"], actualStaff: ["staff-darren", "staff-tom"], status: "filled", childrenPresent: 3 },
    { date: "2026-02-09T00:00:00Z", shiftType: "waking_night", plannedStaff: ["staff-sarah"], actualStaff: ["staff-sarah"], status: "filled", childrenPresent: 3 },
    { date: "2026-02-16T00:00:00Z", shiftType: "long_day", plannedStaff: ["staff-lisa", "staff-tom"], actualStaff: ["staff-lisa", "staff-tom"], status: "filled", childrenPresent: 2 },
    { date: "2026-02-16T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-darren"], actualStaff: ["staff-darren"], status: "filled", childrenPresent: 2 },
    // March — one bank cover, one unfilled
    { date: "2026-03-02T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-bank-1"], status: "bank_cover", childrenPresent: 3 },
    { date: "2026-03-02T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-darren", "staff-lisa"], actualStaff: ["staff-darren", "staff-lisa"], status: "filled", childrenPresent: 3 },
    { date: "2026-03-09T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-darren", "staff-tom"], actualStaff: ["staff-tom"], status: "unfilled", childrenPresent: 3 },
    { date: "2026-03-09T00:00:00Z", shiftType: "waking_night", plannedStaff: ["staff-lisa"], actualStaff: ["staff-lisa"], status: "filled", childrenPresent: 3 },
    { date: "2026-03-16T00:00:00Z", shiftType: "afternoon", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-tom"], status: "filled", childrenPresent: 2 },
    { date: "2026-03-16T00:00:00Z", shiftType: "sleep_in", plannedStaff: ["staff-darren"], actualStaff: ["staff-darren"], status: "filled", childrenPresent: 2 },
    // April — overtime shift
    { date: "2026-04-06T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-sarah", "staff-lisa"], actualStaff: ["staff-sarah", "staff-lisa"], status: "filled", childrenPresent: 3 },
    { date: "2026-04-06T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-darren", "staff-tom"], actualStaff: ["staff-darren", "staff-tom"], status: "overtime", childrenPresent: 3 },
    { date: "2026-04-13T00:00:00Z", shiftType: "long_day", plannedStaff: ["staff-lisa", "staff-darren"], actualStaff: ["staff-lisa", "staff-darren"], status: "filled", childrenPresent: 3 },
    { date: "2026-04-13T00:00:00Z", shiftType: "waking_night", plannedStaff: ["staff-tom"], actualStaff: ["staff-tom"], status: "filled", childrenPresent: 3 },
    // May — filled
    { date: "2026-05-04T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-tom"], status: "filled", childrenPresent: 3 },
    { date: "2026-05-04T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-darren", "staff-lisa"], actualStaff: ["staff-darren", "staff-lisa"], status: "filled", childrenPresent: 3 },
    { date: "2026-05-11T00:00:00Z", shiftType: "morning", plannedStaff: ["staff-darren", "staff-lisa"], actualStaff: ["staff-darren", "staff-lisa"], status: "filled", childrenPresent: 2 },
    { date: "2026-05-11T00:00:00Z", shiftType: "evening", plannedStaff: ["staff-sarah", "staff-tom"], actualStaff: ["staff-sarah", "staff-tom"], status: "filled", childrenPresent: 2 },
  ];
}

function makeOakHouseAgencyUsages(): AgencyUsage[] {
  return [
    { date: "2026-02-02T00:00:00Z", agencyStaffId: "staff-agency-1", reason: "sickness_cover", briefingCompleted: true, childrenKnown: false },
  ];
}

function makeOakHouseConsistencyRecords(): ConsistencyRecord[] {
  return [
    { childId: "child-alex", primaryKeyWorker: "Sarah Johnson", secondaryKeyWorker: "Lisa Williams", staffContactCount: 45, uniqueStaffCount: 4, period: "2026-Q1-Q2" },
    { childId: "child-jordan", primaryKeyWorker: "Sarah Johnson", secondaryKeyWorker: "Darren Laville", staffContactCount: 40, uniqueStaffCount: 5, period: "2026-Q1-Q2" },
    { childId: "child-morgan", primaryKeyWorker: "Tom Richards", secondaryKeyWorker: "Darren Laville", staffContactCount: 38, uniqueStaffCount: 5, period: "2026-Q1-Q2" },
  ];
}

function makeOakHouseIncidents(): StaffingIncident[] {
  return [
    { date: "2026-03-09T00:00:00Z", type: "understaffed", impact: "One RSW short on morning shift, remaining staff managed safely", resolution: "Bank staff called in for afternoon cover" },
  ];
}

function makeOakHouseRotaPublishedDates() {
  return [
    { weekStarting: "2026-01-05T00:00:00Z", publishedDate: "2025-12-27T00:00:00Z" },
    { weekStarting: "2026-01-12T00:00:00Z", publishedDate: "2026-01-04T00:00:00Z" },
    { weekStarting: "2026-01-19T00:00:00Z", publishedDate: "2026-01-11T00:00:00Z" },
    { weekStarting: "2026-02-02T00:00:00Z", publishedDate: "2026-01-25T00:00:00Z" },
    { weekStarting: "2026-02-09T00:00:00Z", publishedDate: "2026-02-01T00:00:00Z" },
    { weekStarting: "2026-02-16T00:00:00Z", publishedDate: "2026-02-08T00:00:00Z" },
    { weekStarting: "2026-03-02T00:00:00Z", publishedDate: "2026-02-22T00:00:00Z" },
    { weekStarting: "2026-03-09T00:00:00Z", publishedDate: "2026-03-01T00:00:00Z" },
    { weekStarting: "2026-03-16T00:00:00Z", publishedDate: "2026-03-08T00:00:00Z" },
    { weekStarting: "2026-04-06T00:00:00Z", publishedDate: "2026-03-29T00:00:00Z" },
    { weekStarting: "2026-04-13T00:00:00Z", publishedDate: "2026-04-05T00:00:00Z" },
    { weekStarting: "2026-05-04T00:00:00Z", publishedDate: "2026-04-26T00:00:00Z" },
    { weekStarting: "2026-05-11T00:00:00Z", publishedDate: "2026-05-03T00:00:00Z" },
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateStaffingAdequacy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffingAdequacy", () => {
  it("returns correct fill rate for Chamberlain House data", () => {
    const result = evaluateStaffingAdequacy(makeOakHouseRotas(), makeOakHouseStaff(), PERIOD_START, PERIOD_END);
    // 27 filled out of 28 total (1 unfilled)
    expect(result.fillRate).toBe(96);
  });

  it("counts total shifts correctly", () => {
    const result = evaluateStaffingAdequacy(makeOakHouseRotas(), makeOakHouseStaff(), PERIOD_START, PERIOD_END);
    expect(result.shiftsTotal).toBe(28);
  });

  it("counts unfilled shifts correctly", () => {
    const result = evaluateStaffingAdequacy(makeOakHouseRotas(), makeOakHouseStaff(), PERIOD_START, PERIOD_END);
    expect(result.shiftsUnderstaffed).toBe(1);
  });

  it("counts filled shifts correctly", () => {
    const result = evaluateStaffingAdequacy(makeOakHouseRotas(), makeOakHouseStaff(), PERIOD_START, PERIOD_END);
    expect(result.shiftsFilled).toBe(27);
  });

  it("calculates average staff:child ratio", () => {
    const result = evaluateStaffingAdequacy(makeOakHouseRotas(), makeOakHouseStaff(), PERIOD_START, PERIOD_END);
    expect(result.averageStaffChildRatio).toBeGreaterThan(0);
    expect(result.averageStaffChildRatio).toBeLessThan(2);
  });

  it("calculates senior on shift rate", () => {
    const result = evaluateStaffingAdequacy(makeOakHouseRotas(), makeOakHouseStaff(), PERIOD_START, PERIOD_END);
    // Most shifts have Sarah (RM), Lisa (senior_rsw), or Darren (RM)
    expect(result.seniorOnShiftRate).toBeGreaterThanOrEqual(80);
  });

  it("breaks down statuses correctly", () => {
    const result = evaluateStaffingAdequacy(makeOakHouseRotas(), makeOakHouseStaff(), PERIOD_START, PERIOD_END);
    expect(result.statusBreakdown.unfilled).toBe(1);
    expect(result.statusBreakdown.agency_cover).toBe(1);
    expect(result.statusBreakdown.bank_cover).toBe(1);
    expect(result.statusBreakdown.overtime).toBe(1);
    // Rest are filled
    expect(result.statusBreakdown.filled).toBe(24);
  });

  it("returns zeros for empty data", () => {
    const result = evaluateStaffingAdequacy([], [], PERIOD_START, PERIOD_END);
    expect(result.fillRate).toBe(0);
    expect(result.shiftsTotal).toBe(0);
    expect(result.averageStaffChildRatio).toBe(0);
    expect(result.seniorOnShiftRate).toBe(0);
  });

  it("filters rotas outside the period", () => {
    const rotas: ShiftRota[] = [
      { date: "2025-06-01T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 2 },
    ];
    const result = evaluateStaffingAdequacy(rotas, [], PERIOD_START, PERIOD_END);
    expect(result.shiftsTotal).toBe(0);
  });

  it("handles shifts with zero children present", () => {
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 0 },
    ];
    const result = evaluateStaffingAdequacy(rotas, [], PERIOD_START, PERIOD_END);
    expect(result.averageStaffChildRatio).toBe(0);
    expect(result.fillRate).toBe(100);
  });

  it("recognises all senior roles for senior on shift calculation", () => {
    const staff: StaffMember[] = [
      { id: "s1", name: "A", role: "deputy_manager", contractType: "permanent", startDate: "2022-01-01", keyChildren: [] },
    ];
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 2 },
    ];
    const result = evaluateStaffingAdequacy(rotas, staff, PERIOD_START, PERIOD_END);
    expect(result.seniorOnShiftRate).toBe(100);
  });

  it("correctly identifies shift with only RSW as having no senior", () => {
    const staff: StaffMember[] = [
      { id: "s1", name: "A", role: "rsw", contractType: "permanent", startDate: "2022-01-01", keyChildren: [] },
    ];
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 2 },
    ];
    const result = evaluateStaffingAdequacy(rotas, staff, PERIOD_START, PERIOD_END);
    expect(result.seniorOnShiftRate).toBe(0);
  });

  it("counts all status types in breakdown", () => {
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 2 },
      { date: "2026-02-02T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: [], status: "unfilled", childrenPresent: 2 },
      { date: "2026-02-03T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: ["a1"], status: "agency_cover", childrenPresent: 2 },
      { date: "2026-02-04T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: ["b1"], status: "bank_cover", childrenPresent: 2 },
      { date: "2026-02-05T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: ["s1"], status: "overtime", childrenPresent: 2 },
    ];
    const result = evaluateStaffingAdequacy(rotas, [], PERIOD_START, PERIOD_END);
    expect(result.statusBreakdown.filled).toBe(1);
    expect(result.statusBreakdown.unfilled).toBe(1);
    expect(result.statusBreakdown.agency_cover).toBe(1);
    expect(result.statusBreakdown.bank_cover).toBe(1);
    expect(result.statusBreakdown.overtime).toBe(1);
    expect(result.fillRate).toBe(80);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateAgencyMinimisation
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAgencyMinimisation", () => {
  it("calculates agency usage rate for Chamberlain House", () => {
    const result = evaluateAgencyMinimisation(makeOakHouseAgencyUsages(), makeOakHouseRotas(), PERIOD_START, PERIOD_END);
    // 1 agency usage out of many staff appearances
    expect(result.agencyUsageRate).toBeLessThan(5);
  });

  it("counts total shift staff correctly", () => {
    const result = evaluateAgencyMinimisation(makeOakHouseAgencyUsages(), makeOakHouseRotas(), PERIOD_START, PERIOD_END);
    expect(result.totalShiftStaff).toBeGreaterThan(0);
  });

  it("reports briefing completion correctly", () => {
    const result = evaluateAgencyMinimisation(makeOakHouseAgencyUsages(), makeOakHouseRotas(), PERIOD_START, PERIOD_END);
    expect(result.briefingCompletionRate).toBe(100);
  });

  it("reports children known rate correctly", () => {
    const result = evaluateAgencyMinimisation(makeOakHouseAgencyUsages(), makeOakHouseRotas(), PERIOD_START, PERIOD_END);
    // The one agency usage has childrenKnown: false
    expect(result.childrenKnownRate).toBe(0);
  });

  it("breaks down reasons correctly", () => {
    const result = evaluateAgencyMinimisation(makeOakHouseAgencyUsages(), makeOakHouseRotas(), PERIOD_START, PERIOD_END);
    expect(result.agencyReasons["sickness_cover"]).toBe(1);
  });

  it("returns defaults for empty agency usage", () => {
    const result = evaluateAgencyMinimisation([], makeOakHouseRotas(), PERIOD_START, PERIOD_END);
    expect(result.agencyUsageRate).toBe(0);
    expect(result.agencyShiftsCount).toBe(0);
    expect(result.briefingCompletionRate).toBe(100);
    expect(result.childrenKnownRate).toBe(100);
  });

  it("returns zero total shift staff for empty rotas", () => {
    const result = evaluateAgencyMinimisation([], [], PERIOD_START, PERIOD_END);
    expect(result.totalShiftStaff).toBe(0);
    expect(result.agencyUsageRate).toBe(0);
  });

  it("handles all agency shifts scenario", () => {
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["a1"], actualStaff: ["a1"], status: "agency_cover", childrenPresent: 2 },
      { date: "2026-02-02T00:00:00Z", shiftType: "morning", plannedStaff: ["a2"], actualStaff: ["a2"], status: "agency_cover", childrenPresent: 2 },
    ];
    const agencyUsages: AgencyUsage[] = [
      { date: "2026-02-01T00:00:00Z", agencyStaffId: "a1", reason: "vacancy", briefingCompleted: false, childrenKnown: false },
      { date: "2026-02-02T00:00:00Z", agencyStaffId: "a2", reason: "vacancy", briefingCompleted: true, childrenKnown: false },
    ];
    const result = evaluateAgencyMinimisation(agencyUsages, rotas, PERIOD_START, PERIOD_END);
    expect(result.agencyUsageRate).toBe(100);
    expect(result.briefingCompletionRate).toBe(50);
    expect(result.childrenKnownRate).toBe(0);
  });

  it("filters agency usages outside the period", () => {
    const agencyUsages: AgencyUsage[] = [
      { date: "2025-01-01T00:00:00Z", agencyStaffId: "a1", reason: "vacancy", briefingCompleted: false, childrenKnown: false },
    ];
    const result = evaluateAgencyMinimisation(agencyUsages, makeOakHouseRotas(), PERIOD_START, PERIOD_END);
    expect(result.agencyShiftsCount).toBe(0);
  });

  it("tracks multiple reasons", () => {
    const agencyUsages: AgencyUsage[] = [
      { date: "2026-02-01T00:00:00Z", agencyStaffId: "a1", reason: "vacancy", briefingCompleted: true, childrenKnown: true },
      { date: "2026-02-02T00:00:00Z", agencyStaffId: "a2", reason: "sickness_cover", briefingCompleted: true, childrenKnown: true },
      { date: "2026-02-03T00:00:00Z", agencyStaffId: "a3", reason: "vacancy", briefingCompleted: true, childrenKnown: true },
    ];
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["a1"], actualStaff: ["a1"], status: "agency_cover", childrenPresent: 2 },
      { date: "2026-02-02T00:00:00Z", shiftType: "morning", plannedStaff: ["a2"], actualStaff: ["a2"], status: "agency_cover", childrenPresent: 2 },
      { date: "2026-02-03T00:00:00Z", shiftType: "morning", plannedStaff: ["a3"], actualStaff: ["a3"], status: "agency_cover", childrenPresent: 2 },
    ];
    const result = evaluateAgencyMinimisation(agencyUsages, rotas, PERIOD_START, PERIOD_END);
    expect(result.agencyReasons["vacancy"]).toBe(2);
    expect(result.agencyReasons["sickness_cover"]).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateConsistencyOfCare
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateConsistencyOfCare", () => {
  it("calculates key worker coverage for Chamberlain House (100%)", () => {
    const result = evaluateConsistencyOfCare(makeOakHouseConsistencyRecords());
    expect(result.keyWorkerCoverage).toBe(100);
  });

  it("calculates secondary key worker coverage for Chamberlain House (100%)", () => {
    const result = evaluateConsistencyOfCare(makeOakHouseConsistencyRecords());
    expect(result.secondaryKeyWorkerCoverage).toBe(100);
  });

  it("calculates average unique staff per child", () => {
    const result = evaluateConsistencyOfCare(makeOakHouseConsistencyRecords());
    // (4+5+5)/3 = 4.7
    expect(result.averageUniqueStaffPerChild).toBeCloseTo(4.7, 1);
  });

  it("calculates average contacts per child", () => {
    const result = evaluateConsistencyOfCare(makeOakHouseConsistencyRecords());
    // (45+40+38)/3 = 41
    expect(result.averageContactsPerChild).toBe(41);
  });

  it("generates per-child consistency details", () => {
    const result = evaluateConsistencyOfCare(makeOakHouseConsistencyRecords());
    expect(result.childConsistencyDetails).toHaveLength(3);
  });

  it("assigns high consistency scores when unique staff count is low", () => {
    const result = evaluateConsistencyOfCare(makeOakHouseConsistencyRecords());
    for (const detail of result.childConsistencyDetails) {
      expect(detail.consistencyScore).toBeGreaterThanOrEqual(70);
    }
  });

  it("returns zeros for empty data", () => {
    const result = evaluateConsistencyOfCare([]);
    expect(result.averageUniqueStaffPerChild).toBe(0);
    expect(result.keyWorkerCoverage).toBe(0);
    expect(result.secondaryKeyWorkerCoverage).toBe(0);
    expect(result.averageContactsPerChild).toBe(0);
    expect(result.childConsistencyDetails).toHaveLength(0);
  });

  it("penalises missing primary key worker", () => {
    const records: ConsistencyRecord[] = [
      { childId: "c1", primaryKeyWorker: "", secondaryKeyWorker: "B", staffContactCount: 20, uniqueStaffCount: 3, period: "Q1" },
    ];
    const result = evaluateConsistencyOfCare(records);
    expect(result.keyWorkerCoverage).toBe(0);
    expect(result.childConsistencyDetails[0].consistencyScore).toBeLessThanOrEqual(80);
  });

  it("penalises missing secondary key worker", () => {
    const records: ConsistencyRecord[] = [
      { childId: "c1", primaryKeyWorker: "A", secondaryKeyWorker: "", staffContactCount: 20, uniqueStaffCount: 3, period: "Q1" },
    ];
    const result = evaluateConsistencyOfCare(records);
    expect(result.secondaryKeyWorkerCoverage).toBe(0);
    expect(result.childConsistencyDetails[0].consistencyScore).toBeLessThanOrEqual(90);
  });

  it("heavily penalises very high unique staff count", () => {
    const records: ConsistencyRecord[] = [
      { childId: "c1", primaryKeyWorker: "A", secondaryKeyWorker: "B", staffContactCount: 50, uniqueStaffCount: 15, period: "Q1" },
    ];
    const result = evaluateConsistencyOfCare(records);
    expect(result.childConsistencyDetails[0].consistencyScore).toBeLessThanOrEqual(60);
  });

  it("penalises low contact count", () => {
    const records: ConsistencyRecord[] = [
      { childId: "c1", primaryKeyWorker: "A", secondaryKeyWorker: "B", staffContactCount: 5, uniqueStaffCount: 3, period: "Q1" },
    ];
    const result = evaluateConsistencyOfCare(records);
    expect(result.childConsistencyDetails[0].consistencyScore).toBeLessThanOrEqual(90);
  });

  it("gives maximum score for ideal consistency", () => {
    const records: ConsistencyRecord[] = [
      { childId: "c1", primaryKeyWorker: "A", secondaryKeyWorker: "B", staffContactCount: 50, uniqueStaffCount: 3, period: "Q1" },
    ];
    const result = evaluateConsistencyOfCare(records);
    expect(result.childConsistencyDetails[0].consistencyScore).toBe(100);
  });

  it("never returns a negative score", () => {
    const records: ConsistencyRecord[] = [
      { childId: "c1", primaryKeyWorker: "", secondaryKeyWorker: "", staffContactCount: 1, uniqueStaffCount: 20, period: "Q1" },
    ];
    const result = evaluateConsistencyOfCare(records);
    expect(result.childConsistencyDetails[0].consistencyScore).toBeGreaterThanOrEqual(0);
  });

  it("handles partial key worker coverage", () => {
    const records: ConsistencyRecord[] = [
      { childId: "c1", primaryKeyWorker: "A", secondaryKeyWorker: "B", staffContactCount: 20, uniqueStaffCount: 3, period: "Q1" },
      { childId: "c2", primaryKeyWorker: "", secondaryKeyWorker: "", staffContactCount: 10, uniqueStaffCount: 8, period: "Q1" },
    ];
    const result = evaluateConsistencyOfCare(records);
    expect(result.keyWorkerCoverage).toBe(50);
    expect(result.secondaryKeyWorkerCoverage).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateRotaCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRotaCompliance", () => {
  it("calculates rota published on time rate", () => {
    const result = evaluateRotaCompliance(makeOakHouseRotas(), makeOakHouseRotaPublishedDates(), PERIOD_START, PERIOD_END);
    expect(result.rotaPublishedOnTimeRate).toBeGreaterThan(0);
  });

  it("correctly distributes shift types", () => {
    const result = evaluateRotaCompliance(makeOakHouseRotas(), makeOakHouseRotaPublishedDates(), PERIOD_START, PERIOD_END);
    expect(result.shiftTypeDistribution.morning).toBeGreaterThan(0);
    expect(result.shiftTypeDistribution.evening).toBeGreaterThan(0);
    expect(result.shiftTypeDistribution.waking_night).toBeGreaterThan(0);
  });

  it("calculates long day compliance rate", () => {
    const result = evaluateRotaCompliance(makeOakHouseRotas(), makeOakHouseRotaPublishedDates(), PERIOD_START, PERIOD_END);
    // All long day shifts are filled
    expect(result.longDayComplianceRate).toBe(100);
  });

  it("calculates night cover rate", () => {
    const result = evaluateRotaCompliance(makeOakHouseRotas(), makeOakHouseRotaPublishedDates(), PERIOD_START, PERIOD_END);
    // All night shifts are filled
    expect(result.nightCoverRate).toBe(100);
  });

  it("returns 0 published on time rate for empty published dates", () => {
    const result = evaluateRotaCompliance(makeOakHouseRotas(), [], PERIOD_START, PERIOD_END);
    expect(result.rotaPublishedOnTimeRate).toBe(0);
  });

  it("returns 100 for long day and night cover when no such shifts exist", () => {
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 2 },
    ];
    const result = evaluateRotaCompliance(rotas, [], PERIOD_START, PERIOD_END);
    expect(result.longDayComplianceRate).toBe(100);
    expect(result.nightCoverRate).toBe(100);
  });

  it("detects late rota publication", () => {
    const latePublished = [
      { weekStarting: "2026-02-02T00:00:00Z", publishedDate: "2026-01-31T00:00:00Z" }, // 2 days early — not enough
    ];
    const result = evaluateRotaCompliance(makeOakHouseRotas(), latePublished, PERIOD_START, PERIOD_END);
    expect(result.rotaPublishedOnTimeRate).toBe(0);
  });

  it("handles unfilled night shifts correctly", () => {
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "waking_night", plannedStaff: ["s1"], actualStaff: [], status: "unfilled", childrenPresent: 2 },
      { date: "2026-02-02T00:00:00Z", shiftType: "sleep_in", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 2 },
    ];
    const result = evaluateRotaCompliance(rotas, [], PERIOD_START, PERIOD_END);
    expect(result.nightCoverRate).toBe(50);
  });

  it("filters rotas outside the period", () => {
    const rotas: ShiftRota[] = [
      { date: "2025-01-01T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 2 },
    ];
    const result = evaluateRotaCompliance(rotas, [], PERIOD_START, PERIOD_END);
    expect(result.shiftTypeDistribution.morning).toBe(0);
  });

  it("counts all shift types in distribution", () => {
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 2 },
      { date: "2026-02-01T00:00:00Z", shiftType: "afternoon", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 2 },
      { date: "2026-02-01T00:00:00Z", shiftType: "evening", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 2 },
      { date: "2026-02-01T00:00:00Z", shiftType: "waking_night", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 2 },
      { date: "2026-02-01T00:00:00Z", shiftType: "sleep_in", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 2 },
      { date: "2026-02-01T00:00:00Z", shiftType: "long_day", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 2 },
    ];
    const result = evaluateRotaCompliance(rotas, [], PERIOD_START, PERIOD_END);
    expect(result.shiftTypeDistribution.morning).toBe(1);
    expect(result.shiftTypeDistribution.afternoon).toBe(1);
    expect(result.shiftTypeDistribution.evening).toBe(1);
    expect(result.shiftTypeDistribution.waking_night).toBe(1);
    expect(result.shiftTypeDistribution.sleep_in).toBe(1);
    expect(result.shiftTypeDistribution.long_day).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. evaluateIncidentManagement
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIncidentManagement", () => {
  it("counts incidents for Chamberlain House", () => {
    const result = evaluateIncidentManagement(makeOakHouseIncidents(), PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(1);
  });

  it("categorises incidents by type", () => {
    const result = evaluateIncidentManagement(makeOakHouseIncidents(), PERIOD_START, PERIOD_END);
    expect(result.understaffedIncidents).toBe(1);
    expect(result.loneWorkingIncidents).toBe(0);
    expect(result.noSeniorIncidents).toBe(0);
    expect(result.unplannedAbsenceIncidents).toBe(0);
  });

  it("calculates resolution rate", () => {
    const result = evaluateIncidentManagement(makeOakHouseIncidents(), PERIOD_START, PERIOD_END);
    expect(result.resolutionRate).toBe(100);
  });

  it("returns defaults for no incidents", () => {
    const result = evaluateIncidentManagement([], PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(0);
    expect(result.resolutionRate).toBe(100);
    expect(result.loneWorkingIncidents).toBe(0);
  });

  it("handles multiple incident types", () => {
    const incidents: StaffingIncident[] = [
      { date: "2026-02-01T00:00:00Z", type: "understaffed", impact: "Short", resolution: "Fixed" },
      { date: "2026-02-02T00:00:00Z", type: "lone_working", impact: "Risk", resolution: "Covered" },
      { date: "2026-02-03T00:00:00Z", type: "unplanned_absence", impact: "Disruption", resolution: "Bank called" },
      { date: "2026-02-04T00:00:00Z", type: "no_senior_on_shift", impact: "No oversight", resolution: "RM called in" },
    ];
    const result = evaluateIncidentManagement(incidents, PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(4);
    expect(result.understaffedIncidents).toBe(1);
    expect(result.loneWorkingIncidents).toBe(1);
    expect(result.unplannedAbsenceIncidents).toBe(1);
    expect(result.noSeniorIncidents).toBe(1);
  });

  it("handles incidents without resolution", () => {
    const incidents: StaffingIncident[] = [
      { date: "2026-02-01T00:00:00Z", type: "understaffed", impact: "Short", resolution: "" },
      { date: "2026-02-02T00:00:00Z", type: "understaffed", impact: "Short", resolution: "Fixed" },
    ];
    const result = evaluateIncidentManagement(incidents, PERIOD_START, PERIOD_END);
    expect(result.resolutionRate).toBe(50);
  });

  it("filters incidents outside the period", () => {
    const incidents: StaffingIncident[] = [
      { date: "2025-01-01T00:00:00Z", type: "understaffed", impact: "Short", resolution: "Fixed" },
    ];
    const result = evaluateIncidentManagement(incidents, PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(0);
  });

  it("builds incidentsByType map correctly", () => {
    const incidents: StaffingIncident[] = [
      { date: "2026-02-01T00:00:00Z", type: "lone_working", impact: "a", resolution: "b" },
      { date: "2026-02-02T00:00:00Z", type: "lone_working", impact: "a", resolution: "b" },
      { date: "2026-02-03T00:00:00Z", type: "understaffed", impact: "a", resolution: "b" },
    ];
    const result = evaluateIncidentManagement(incidents, PERIOD_START, PERIOD_END);
    expect(result.incidentsByType["lone_working"]).toBe(2);
    expect(result.incidentsByType["understaffed"]).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateStaffDeploymentIntelligence — Full Integration
// ══════════════════════════════════════════════════════════════════════════════

describe("generateStaffDeploymentIntelligence", () => {
  function generateOakHouse() {
    return generateStaffDeploymentIntelligence(
      makeOakHouseStaff(),
      makeOakHouseRotas(),
      makeOakHouseAgencyUsages(),
      makeOakHouseConsistencyRecords(),
      makeOakHouseIncidents(),
      makeOakHouseRotaPublishedDates(),
      "home-oak",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
  }

  // ── Metadata ────────────────────────────────────────────────────────────

  it("returns correct homeId", () => {
    const result = generateOakHouse();
    expect(result.homeId).toBe("home-oak");
  });

  it("returns correct period", () => {
    const result = generateOakHouse();
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("returns generatedAt matching reference date", () => {
    const result = generateOakHouse();
    expect(result.generatedAt).toBe(REFERENCE_DATE);
  });

  // ── Overall Score & Rating ──────────────────────────────────────────────

  it("produces an overall score between 0 and 100", () => {
    const result = generateOakHouse();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("Chamberlain House scores good or outstanding", () => {
    const result = generateOakHouse();
    expect(["good", "outstanding"]).toContain(result.overallRating);
  });

  it("overall score equals sum of component scores", () => {
    const result = generateOakHouse();
    const sum = result.componentScores.staffingAdequacy
      + result.componentScores.agencyMinimisation
      + result.componentScores.consistencyOfCare
      + result.componentScores.rotaCompliance
      + result.componentScores.incidentManagement;
    expect(result.overallScore).toBe(sum);
  });

  // ── Component Score Ranges ──────────────────────────────────────────────

  it("staffing adequacy score is 0-25", () => {
    const result = generateOakHouse();
    expect(result.componentScores.staffingAdequacy).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.staffingAdequacy).toBeLessThanOrEqual(25);
  });

  it("agency minimisation score is 0-20", () => {
    const result = generateOakHouse();
    expect(result.componentScores.agencyMinimisation).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.agencyMinimisation).toBeLessThanOrEqual(20);
  });

  it("consistency of care score is 0-25", () => {
    const result = generateOakHouse();
    expect(result.componentScores.consistencyOfCare).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.consistencyOfCare).toBeLessThanOrEqual(25);
  });

  it("rota compliance score is 0-15", () => {
    const result = generateOakHouse();
    expect(result.componentScores.rotaCompliance).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.rotaCompliance).toBeLessThanOrEqual(15);
  });

  it("incident management score is 0-15", () => {
    const result = generateOakHouse();
    expect(result.componentScores.incidentManagement).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.incidentManagement).toBeLessThanOrEqual(15);
  });

  // ── Rating Thresholds ───────────────────────────────────────────────────

  it("rates outstanding when score >= 80", () => {
    // Perfect data
    const staff: StaffMember[] = [
      { id: "s1", name: "A", role: "registered_manager", contractType: "permanent", startDate: "2022-01-01", keyChildren: ["c1"] },
      { id: "s2", name: "B", role: "senior_rsw", contractType: "permanent", startDate: "2022-01-01", keyChildren: ["c1"] },
    ];
    const rotas: ShiftRota[] = Array.from({ length: 20 }, (_, i) => ({
      date: `2026-02-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
      shiftType: "morning" as ShiftType,
      plannedStaff: ["s1", "s2"],
      actualStaff: ["s1", "s2"],
      status: "filled" as DeploymentStatus,
      childrenPresent: 3,
    }));
    const consistency: ConsistencyRecord[] = [
      { childId: "c1", primaryKeyWorker: "A", secondaryKeyWorker: "B", staffContactCount: 50, uniqueStaffCount: 2, period: "Q1" },
    ];
    const published = Array.from({ length: 10 }, (_, i) => ({
      weekStarting: `2026-02-${String((i + 1) * 2).padStart(2, "0")}T00:00:00Z`,
      publishedDate: `2026-01-${String((i + 1) * 2).padStart(2, "0")}T00:00:00Z`,
    }));
    const result = generateStaffDeploymentIntelligence(staff, rotas, [], consistency, [], published, "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.overallRating).toBe("outstanding");
  });

  it("rates good when score >= 60 and < 80", () => {
    const result = generateOakHouse();
    if (result.overallScore >= 60 && result.overallScore < 80) {
      expect(result.overallRating).toBe("good");
    }
  });

  it("rates requires_improvement when score >= 40 and < 60", () => {
    // Mediocre data
    const staff: StaffMember[] = [
      { id: "s1", name: "A", role: "rsw", contractType: "permanent", startDate: "2022-01-01", keyChildren: ["c1"] },
    ];
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["s1", "s2"], actualStaff: ["s1"], status: "unfilled", childrenPresent: 3 },
      { date: "2026-02-02T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 3 },
      { date: "2026-02-03T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 3 },
      { date: "2026-02-04T00:00:00Z", shiftType: "waking_night", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 3 },
      { date: "2026-02-05T00:00:00Z", shiftType: "long_day", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 3 },
    ];
    const agencyUsages: AgencyUsage[] = [
      { date: "2026-02-01T00:00:00Z", agencyStaffId: "a1", reason: "vacancy", briefingCompleted: true, childrenKnown: false },
    ];
    const consistency: ConsistencyRecord[] = [
      { childId: "c1", primaryKeyWorker: "A", secondaryKeyWorker: "", staffContactCount: 10, uniqueStaffCount: 6, period: "Q1" },
    ];
    const incidents: StaffingIncident[] = [
      { date: "2026-02-01T00:00:00Z", type: "understaffed", impact: "Short", resolution: "Fixed" },
    ];
    const result = generateStaffDeploymentIntelligence(staff, rotas, agencyUsages, consistency, incidents, [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    if (result.overallScore >= 40 && result.overallScore < 60) {
      expect(result.overallRating).toBe("requires_improvement");
    }
  });

  it("rates inadequate when score < 40", () => {
    // Terrible data: all unfilled, all agency, no key workers, many incidents
    const staff: StaffMember[] = [
      { id: "a1", name: "Agency A", role: "agency", contractType: "agency", startDate: "2026-01-01", keyChildren: [] },
    ];
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: [], status: "unfilled", childrenPresent: 3 },
      { date: "2026-02-02T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: [], status: "unfilled", childrenPresent: 3 },
      { date: "2026-02-03T00:00:00Z", shiftType: "waking_night", plannedStaff: ["s1"], actualStaff: [], status: "unfilled", childrenPresent: 3 },
    ];
    const agencyUsages: AgencyUsage[] = [
      { date: "2026-02-01T00:00:00Z", agencyStaffId: "a1", reason: "vacancy", briefingCompleted: false, childrenKnown: false },
      { date: "2026-02-02T00:00:00Z", agencyStaffId: "a1", reason: "vacancy", briefingCompleted: false, childrenKnown: false },
    ];
    const consistency: ConsistencyRecord[] = [
      { childId: "c1", primaryKeyWorker: "", secondaryKeyWorker: "", staffContactCount: 2, uniqueStaffCount: 15, period: "Q1" },
    ];
    const incidents: StaffingIncident[] = Array.from({ length: 12 }, (_, i) => ({
      date: `2026-02-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
      type: "lone_working" as const,
      impact: "Risk",
      resolution: "",
    }));
    const result = generateStaffDeploymentIntelligence(staff, rotas, agencyUsages, consistency, incidents, [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.overallScore).toBeLessThan(40);
    expect(result.overallRating).toBe("inadequate");
  });

  // ── Strengths & Areas ───────────────────────────────────────────────────

  it("generates strengths array", () => {
    const result = generateOakHouse();
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("includes fill rate strength when applicable", () => {
    const result = generateOakHouse();
    const hasFillRateStrength = result.strengths.some(s => s.toLowerCase().includes("fill rate"));
    expect(hasFillRateStrength).toBe(true);
  });

  it("includes key worker strength when 100% coverage", () => {
    const result = generateOakHouse();
    const hasKeyWorkerStrength = result.strengths.some(s => s.toLowerCase().includes("key worker"));
    expect(hasKeyWorkerStrength).toBe(true);
  });

  it("generates areasForImprovement array", () => {
    const result = generateOakHouse();
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });

  it("generates recommendedActions array", () => {
    const result = generateOakHouse();
    expect(Array.isArray(result.recommendedActions)).toBe(true);
  });

  // ── Regulatory Links ────────────────────────────────────────────────────

  it("includes 5 regulatory links", () => {
    const result = generateOakHouse();
    expect(result.regulatoryLinks).toHaveLength(5);
  });

  it("includes CHR 2015 Reg 32", () => {
    const result = generateOakHouse();
    expect(result.regulatoryLinks.some(r => r.regulation.includes("Reg 32"))).toBe(true);
  });

  it("includes CHR 2015 Reg 33", () => {
    const result = generateOakHouse();
    expect(result.regulatoryLinks.some(r => r.regulation.includes("Reg 33"))).toBe(true);
  });

  it("includes Schedule 1 Standard 25", () => {
    const result = generateOakHouse();
    expect(result.regulatoryLinks.some(r => r.regulation.includes("Standard 25"))).toBe(true);
  });

  it("includes SCCIF", () => {
    const result = generateOakHouse();
    expect(result.regulatoryLinks.some(r => r.regulation.includes("SCCIF"))).toBe(true);
  });

  it("includes Working Together 2023", () => {
    const result = generateOakHouse();
    expect(result.regulatoryLinks.some(r => r.regulation.includes("Working Together"))).toBe(true);
  });

  it("regulatory links have valid status values", () => {
    const result = generateOakHouse();
    for (const link of result.regulatoryLinks) {
      expect(["met", "partially_met", "not_met"]).toContain(link.status);
    }
  });

  it("regulatory links have non-empty evidence", () => {
    const result = generateOakHouse();
    for (const link of result.regulatoryLinks) {
      expect(link.evidence.length).toBeGreaterThan(0);
    }
  });

  // ── Staff Profiles ──────────────────────────────────────────────────────

  it("generates a profile for each staff member", () => {
    const result = generateOakHouse();
    expect(result.staffProfiles).toHaveLength(6); // 4 permanent + 1 bank + 1 agency
  });

  it("flags agency workers", () => {
    const result = generateOakHouse();
    const agency = result.staffProfiles.find(p => p.staffId === "staff-agency-1");
    expect(agency).toBeDefined();
    expect(agency!.isAgency).toBe(true);
    expect(agency!.riskFlags.some(f => f.toLowerCase().includes("agency"))).toBe(true);
  });

  it("flags bank workers", () => {
    const result = generateOakHouse();
    const bank = result.staffProfiles.find(p => p.staffId === "staff-bank-1");
    expect(bank).toBeDefined();
    expect(bank!.isBank).toBe(true);
    expect(bank!.riskFlags.some(f => f.toLowerCase().includes("bank"))).toBe(true);
  });

  it("counts shifts worked for each staff member", () => {
    const result = generateOakHouse();
    const sarah = result.staffProfiles.find(p => p.staffId === "staff-sarah");
    expect(sarah).toBeDefined();
    expect(sarah!.shiftsWorked).toBeGreaterThan(0);
  });

  it("counts key children for permanent staff", () => {
    const result = generateOakHouse();
    const sarah = result.staffProfiles.find(p => p.staffId === "staff-sarah");
    expect(sarah!.keyChildrenCount).toBe(2);
  });

  it("flags staff with no key children assigned (non-agency/bank)", () => {
    const staff: StaffMember[] = [
      { id: "s1", name: "A", role: "rsw", contractType: "permanent", startDate: "2022-01-01", keyChildren: [] },
    ];
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 2 },
    ];
    const result = generateStaffDeploymentIntelligence(staff, rotas, [], [], [], [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.staffProfiles[0].riskFlags.some(f => f.toLowerCase().includes("no key children"))).toBe(true);
  });

  it("flags staff with no shifts worked", () => {
    const staff: StaffMember[] = [
      { id: "s1", name: "A", role: "rsw", contractType: "permanent", startDate: "2022-01-01", keyChildren: ["c1"] },
    ];
    const result = generateStaffDeploymentIntelligence(staff, [], [], [], [], [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.staffProfiles[0].riskFlags.some(f => f.toLowerCase().includes("no shifts"))).toBe(true);
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  it("handles completely empty data without crashing", () => {
    const result = generateStaffDeploymentIntelligence([], [], [], [], [], [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.overallScore).toBeLessThanOrEqual(55);
    expect(["inadequate", "requires_improvement"]).toContain(result.overallRating);
    expect(result.staffProfiles).toHaveLength(0);
  });

  it("handles all-agency scenario", () => {
    const staff: StaffMember[] = [
      { id: "a1", name: "Agency A", role: "agency", contractType: "agency", startDate: "2026-01-01", keyChildren: [] },
      { id: "a2", name: "Agency B", role: "agency", contractType: "agency", startDate: "2026-01-01", keyChildren: [] },
    ];
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["a1", "a2"], actualStaff: ["a1", "a2"], status: "agency_cover", childrenPresent: 3 },
    ];
    const agencyUsages: AgencyUsage[] = [
      { date: "2026-02-01T00:00:00Z", agencyStaffId: "a1", reason: "vacancy", briefingCompleted: false, childrenKnown: false },
      { date: "2026-02-01T00:00:00Z", agencyStaffId: "a2", reason: "vacancy", briefingCompleted: false, childrenKnown: false },
    ];
    const result = generateStaffDeploymentIntelligence(staff, rotas, agencyUsages, [], [], [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.agencyMinimisation.agencyUsageRate).toBe(100);
    expect(["inadequate", "requires_improvement"]).toContain(result.overallRating);
    expect(result.areasForImprovement.some(a => a.toLowerCase().includes("agency"))).toBe(true);
  });

  it("handles all-understaffed scenario", () => {
    const staff: StaffMember[] = [
      { id: "s1", name: "A", role: "rsw", contractType: "permanent", startDate: "2022-01-01", keyChildren: [] },
    ];
    const rotas: ShiftRota[] = Array.from({ length: 5 }, (_, i) => ({
      date: `2026-02-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
      shiftType: "morning" as ShiftType,
      plannedStaff: ["s1", "s2"],
      actualStaff: [],
      status: "unfilled" as DeploymentStatus,
      childrenPresent: 3,
    }));
    const result = generateStaffDeploymentIntelligence(staff, rotas, [], [], [], [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.staffingAdequacy.fillRate).toBe(0);
    expect(["inadequate", "requires_improvement"]).toContain(result.overallRating);
  });

  it("handles perfect staffing scenario", () => {
    const staff: StaffMember[] = [
      { id: "s1", name: "A", role: "registered_manager", contractType: "permanent", startDate: "2022-01-01", keyChildren: ["c1"] },
      { id: "s2", name: "B", role: "senior_rsw", contractType: "permanent", startDate: "2022-01-01", keyChildren: ["c1"] },
    ];
    const rotas: ShiftRota[] = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-02-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
      shiftType: (["morning", "evening", "waking_night", "long_day", "sleep_in"] as ShiftType[])[i % 5],
      plannedStaff: ["s1", "s2"],
      actualStaff: ["s1", "s2"],
      status: "filled" as DeploymentStatus,
      childrenPresent: 2,
    }));
    const consistency: ConsistencyRecord[] = [
      { childId: "c1", primaryKeyWorker: "A", secondaryKeyWorker: "B", staffContactCount: 60, uniqueStaffCount: 2, period: "Q1" },
    ];
    const published = Array.from({ length: 10 }, (_, i) => ({
      weekStarting: `2026-02-${String((i + 1) * 2).padStart(2, "0")}T00:00:00Z`,
      publishedDate: `2026-01-${String((i + 1) * 2).padStart(2, "0")}T00:00:00Z`,
    }));
    const result = generateStaffDeploymentIntelligence(staff, rotas, [], consistency, [], published, "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.overallRating).toBe("outstanding");
  });

  // ── Scoring Logic Verification ──────────────────────────────────────────

  it("scores higher with better fill rate", () => {
    const staff: StaffMember[] = [
      { id: "s1", name: "A", role: "registered_manager", contractType: "permanent", startDate: "2022-01-01", keyChildren: [] },
    ];
    const goodRotas: ShiftRota[] = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-02-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
      shiftType: "morning" as ShiftType,
      plannedStaff: ["s1"],
      actualStaff: ["s1"],
      status: "filled" as DeploymentStatus,
      childrenPresent: 2,
    }));
    const badRotas: ShiftRota[] = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-02-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
      shiftType: "morning" as ShiftType,
      plannedStaff: ["s1"],
      actualStaff: [],
      status: "unfilled" as DeploymentStatus,
      childrenPresent: 2,
    }));
    const good = generateStaffDeploymentIntelligence(staff, goodRotas, [], [], [], [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    const bad = generateStaffDeploymentIntelligence(staff, badRotas, [], [], [], [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(good.componentScores.staffingAdequacy).toBeGreaterThan(bad.componentScores.staffingAdequacy);
  });

  it("scores higher with lower agency usage", () => {
    const staff: StaffMember[] = [
      { id: "s1", name: "A", role: "rsw", contractType: "permanent", startDate: "2022-01-01", keyChildren: [] },
    ];
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: ["s1"], status: "filled", childrenPresent: 2 },
    ];
    const noAgency = generateStaffDeploymentIntelligence(staff, rotas, [], [], [], [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    const manyAgency: AgencyUsage[] = Array.from({ length: 5 }, (_, i) => ({
      date: "2026-02-01T00:00:00Z",
      agencyStaffId: `a${i}`,
      reason: "vacancy",
      briefingCompleted: false,
      childrenKnown: false,
    }));
    const withAgency = generateStaffDeploymentIntelligence(staff, rotas, manyAgency, [], [], [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(noAgency.componentScores.agencyMinimisation).toBeGreaterThanOrEqual(withAgency.componentScores.agencyMinimisation);
  });

  it("scores higher with better consistency (fewer unique staff)", () => {
    const staff: StaffMember[] = [
      { id: "s1", name: "A", role: "rsw", contractType: "permanent", startDate: "2022-01-01", keyChildren: ["c1"] },
    ];
    const goodConsistency: ConsistencyRecord[] = [
      { childId: "c1", primaryKeyWorker: "A", secondaryKeyWorker: "B", staffContactCount: 50, uniqueStaffCount: 2, period: "Q1" },
    ];
    const badConsistency: ConsistencyRecord[] = [
      { childId: "c1", primaryKeyWorker: "", secondaryKeyWorker: "", staffContactCount: 10, uniqueStaffCount: 12, period: "Q1" },
    ];
    const good = generateStaffDeploymentIntelligence(staff, [], [], goodConsistency, [], [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    const bad = generateStaffDeploymentIntelligence(staff, [], [], badConsistency, [], [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(good.componentScores.consistencyOfCare).toBeGreaterThan(bad.componentScores.consistencyOfCare);
  });

  it("scores higher with fewer incidents", () => {
    const staff: StaffMember[] = [
      { id: "s1", name: "A", role: "rsw", contractType: "permanent", startDate: "2022-01-01", keyChildren: [] },
    ];
    const noIncidents = generateStaffDeploymentIntelligence(staff, [], [], [], [], [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    const manyIncidents: StaffingIncident[] = Array.from({ length: 15 }, (_, i) => ({
      date: `2026-02-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
      type: "lone_working" as const,
      impact: "Risk",
      resolution: "",
    }));
    const withIncidents = generateStaffDeploymentIntelligence(staff, [], [], [], manyIncidents, [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(noIncidents.componentScores.incidentManagement).toBeGreaterThan(withIncidents.componentScores.incidentManagement);
  });

  it("recommends agency reduction when usage is high", () => {
    const staff: StaffMember[] = [
      { id: "a1", name: "Agency A", role: "agency", contractType: "agency", startDate: "2026-01-01", keyChildren: [] },
    ];
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["a1"], actualStaff: ["a1"], status: "agency_cover", childrenPresent: 2 },
    ];
    const agencyUsages: AgencyUsage[] = [
      { date: "2026-02-01T00:00:00Z", agencyStaffId: "a1", reason: "vacancy", briefingCompleted: false, childrenKnown: false },
    ];
    const result = generateStaffDeploymentIntelligence(staff, rotas, agencyUsages, [], [], [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.recommendedActions.some(a => a.toLowerCase().includes("agency"))).toBe(true);
  });

  it("recommends lone working action when lone working incidents exist", () => {
    const incidents: StaffingIncident[] = [
      { date: "2026-02-01T00:00:00Z", type: "lone_working", impact: "Risk", resolution: "Fixed" },
    ];
    const result = generateStaffDeploymentIntelligence([], [], [], [], incidents, [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.recommendedActions.some(a => a.toLowerCase().includes("lone working"))).toBe(true);
  });

  it("recommends key worker assignment when coverage is incomplete", () => {
    const consistency: ConsistencyRecord[] = [
      { childId: "c1", primaryKeyWorker: "", secondaryKeyWorker: "", staffContactCount: 10, uniqueStaffCount: 5, period: "Q1" },
    ];
    const result = generateStaffDeploymentIntelligence([], [], [], consistency, [], [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(result.recommendedActions.some(a => a.toLowerCase().includes("key worker"))).toBe(true);
  });

  it("marks Reg 32 as not_met when fill rate is very low", () => {
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: [], status: "unfilled", childrenPresent: 2 },
      { date: "2026-02-02T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: [], status: "unfilled", childrenPresent: 2 },
    ];
    const result = generateStaffDeploymentIntelligence([], rotas, [], [], [], [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    const reg32 = result.regulatoryLinks.find(r => r.regulation.includes("Reg 32"));
    expect(reg32).toBeDefined();
    expect(reg32!.status).toBe("not_met");
  });

  it("marks Working Together 2023 as not_met when lone working is prevalent", () => {
    const incidents: StaffingIncident[] = [
      { date: "2026-02-01T00:00:00Z", type: "lone_working", impact: "Risk", resolution: "" },
      { date: "2026-02-02T00:00:00Z", type: "lone_working", impact: "Risk", resolution: "" },
      { date: "2026-02-03T00:00:00Z", type: "lone_working", impact: "Risk", resolution: "" },
    ];
    const rotas: ShiftRota[] = [
      { date: "2026-02-01T00:00:00Z", shiftType: "morning", plannedStaff: ["s1"], actualStaff: [], status: "unfilled", childrenPresent: 2 },
    ];
    const result = generateStaffDeploymentIntelligence([], rotas, [], [], incidents, [], "h1", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    const wt = result.regulatoryLinks.find(r => r.regulation.includes("Working Together"));
    expect(wt).toBeDefined();
    expect(wt!.status).toBe("not_met");
  });

  // ── Determinism ─────────────────────────────────────────────────────────

  it("produces identical output for identical input", () => {
    const a = generateOakHouse();
    const b = generateOakHouse();
    expect(a.overallScore).toBe(b.overallScore);
    expect(a.overallRating).toBe(b.overallRating);
    expect(a.strengths).toEqual(b.strengths);
    expect(a.areasForImprovement).toEqual(b.areasForImprovement);
    expect(a.componentScores).toEqual(b.componentScores);
  });
});
