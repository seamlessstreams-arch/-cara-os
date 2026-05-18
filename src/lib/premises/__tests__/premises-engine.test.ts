// ══════════════════════════════════════════════════════════════════════════════
// TESTS — PREMISES & PHYSICAL ENVIRONMENT INTELLIGENCE ENGINE
//
// Pure deterministic tests for evaluateComplianceChecks, evaluateMaintenance,
// evaluateFireDrills, evaluateEnvironmentalRisks, generatePremisesIntelligence.
//
// Regulatory basis: CHR 2015 Reg 25 (premises), Reg 12, H&S Act 1974,
// Fire Safety Order 2005, SCCIF.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateComplianceChecks,
  evaluateMaintenance,
  evaluateFireDrills,
  evaluateEnvironmentalRisks,
  generatePremisesIntelligence,
  getCategoryLabel,
  type PremisesCheck,
  type MaintenanceRequest,
  type FireDrillRecord,
  type EnvironmentalRisk,
} from "../premises-engine";

// ── Demo Data ──────────────────────────────────────────────────────────────

const REF_DATE = "2025-06-15";
const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";

function demoChecks(): PremisesCheck[] {
  return [
    { id: "chk-01", homeId: "oak-house", category: "fire_safety", checkName: "Fire Alarm Weekly Test", lastCompletedDate: "2025-06-10", nextDueDate: "2025-06-17", frequencyDays: 7, status: "passed", completedBy: "Sarah Johnson", outcome: "satisfactory" },
    { id: "chk-02", homeId: "oak-house", category: "fire_safety", checkName: "Fire Risk Assessment", lastCompletedDate: "2025-03-15", nextDueDate: "2025-09-15", frequencyDays: 180, status: "not_due", completedBy: "External Assessor", outcome: "satisfactory" },
    { id: "chk-03", homeId: "oak-house", category: "water_temperature", checkName: "Hot Water Temperature Check", lastCompletedDate: "2025-06-12", nextDueDate: "2025-06-19", frequencyDays: 7, status: "passed", completedBy: "Tom Richards", outcome: "satisfactory" },
    { id: "chk-04", homeId: "oak-house", category: "gas_safety", checkName: "Annual Gas Safety Certificate", lastCompletedDate: "2024-08-20", nextDueDate: "2025-08-20", frequencyDays: 365, status: "not_due", completedBy: "Registered Gas Engineer", outcome: "satisfactory" },
    { id: "chk-05", homeId: "oak-house", category: "electrical_safety", checkName: "Electrical Installation Condition Report", lastCompletedDate: "2023-12-01", nextDueDate: "2025-06-01", frequencyDays: 365, status: "overdue", completedBy: "Registered Electrician", outcome: "satisfactory", notes: "Due for renewal — was satisfactory last inspection" },
    { id: "chk-06", homeId: "oak-house", category: "pat_testing", checkName: "Portable Appliance Testing", lastCompletedDate: "2025-01-15", nextDueDate: "2026-01-15", frequencyDays: 365, status: "not_due", completedBy: "In-house", outcome: "satisfactory" },
    { id: "chk-07", homeId: "oak-house", category: "legionella", checkName: "Legionella Risk Assessment", lastCompletedDate: "2025-02-01", nextDueDate: "2027-02-01", frequencyDays: 730, status: "not_due", completedBy: "Water Hygiene Ltd", outcome: "satisfactory" },
    { id: "chk-08", homeId: "oak-house", category: "ligature_assessment", checkName: "Ligature Point Assessment", lastCompletedDate: "2025-05-01", nextDueDate: "2025-08-01", frequencyDays: 90, status: "not_due", completedBy: "Lisa Williams", outcome: "action_required", notes: "Bathroom window cord needs replacing with breakaway fitting" },
    { id: "chk-09", homeId: "oak-house", category: "first_aid_supplies", checkName: "First Aid Kit Check", lastCompletedDate: "2025-06-01", nextDueDate: "2025-07-01", frequencyDays: 30, status: "due_soon", completedBy: "Tom Richards", outcome: "satisfactory" },
    { id: "chk-10", homeId: "oak-house", category: "building_maintenance", checkName: "Monthly Building Inspection", lastCompletedDate: "2025-06-05", nextDueDate: "2025-07-05", frequencyDays: 30, status: "not_due", completedBy: "Darren Laville", outcome: "satisfactory" },
    { id: "chk-11", homeId: "oak-house", category: "garden_outdoor", checkName: "Garden Safety Check", lastCompletedDate: "2025-06-08", nextDueDate: "2025-06-22", frequencyDays: 14, status: "passed", completedBy: "Tom Richards", outcome: "satisfactory" },
    { id: "chk-12", homeId: "oak-house", category: "decoration_homeliness", checkName: "Decoration & Homeliness Audit", lastCompletedDate: "2025-04-01", nextDueDate: "2025-07-01", frequencyDays: 90, status: "due_soon", completedBy: "Sarah Johnson", outcome: "satisfactory" },
    { id: "chk-13", homeId: "oak-house", category: "cctv", checkName: "CCTV Operational Check", lastCompletedDate: "2025-06-01", nextDueDate: "2025-07-01", frequencyDays: 30, status: "not_due", completedBy: "In-house", outcome: "satisfactory" },
    { id: "chk-14", homeId: "oak-house", category: "alarm_system", checkName: "Intruder Alarm Test", lastCompletedDate: "2025-05-15", nextDueDate: "2025-06-10", frequencyDays: 30, status: "failed", completedBy: "Alarm Co", outcome: "unsatisfactory", notes: "Zone 3 sensor fault — engineer revisit scheduled" },
  ];
}

function demoMaintenance(): MaintenanceRequest[] {
  return [
    { id: "maint-01", homeId: "oak-house", category: "building_maintenance", description: "Kitchen tap leaking", reportedDate: "2025-05-20", reportedBy: "Tom Richards", urgency: "medium", status: "completed", completedDate: "2025-05-25", completedBy: "Plumber" },
    { id: "maint-02", homeId: "oak-house", category: "building_maintenance", description: "Bathroom extractor fan broken", reportedDate: "2025-06-01", reportedBy: "Lisa Williams", urgency: "medium", status: "completed", completedDate: "2025-06-10", completedBy: "Electrician" },
    { id: "maint-03", homeId: "oak-house", category: "garden_outdoor", description: "Fence panel blown down — garden not secure", reportedDate: "2025-06-10", reportedBy: "Darren Laville", urgency: "high", status: "scheduled", completedDate: undefined, completedBy: undefined },
    { id: "maint-04", homeId: "oak-house", category: "decoration_homeliness", description: "Morgan's bedroom needs repainting after damage", reportedDate: "2025-05-15", reportedBy: "Sarah Johnson", urgency: "low", status: "completed", completedDate: "2025-06-05", completedBy: "In-house" },
    { id: "maint-05", homeId: "oak-house", category: "alarm_system", description: "Zone 3 intruder alarm sensor fault", reportedDate: "2025-06-10", reportedBy: "Sarah Johnson", urgency: "critical", status: "in_progress", completedDate: undefined, completedBy: undefined },
    { id: "maint-06", homeId: "oak-house", category: "building_maintenance", description: "Lounge radiator not heating evenly", reportedDate: "2025-04-01", reportedBy: "Tom Richards", urgency: "low", status: "deferred", completedDate: undefined, completedBy: undefined },
    { id: "maint-07", homeId: "oak-house", category: "electrical_safety", description: "Light fitting in hallway flickering", reportedDate: "2025-06-12", reportedBy: "Lisa Williams", urgency: "medium", status: "reported", completedDate: undefined, completedBy: undefined },
  ];
}

function demoDrills(): FireDrillRecord[] {
  return [
    { id: "fd-01", homeId: "oak-house", date: "2025-01-20", timeOfDay: "day", evacuationTimeMinutes: 2.5, allChildrenAccountedFor: true, allStaffParticipated: true, childrenPresent: 3, staffPresent: 2, issuesIdentified: [], actionsTaken: [], conductedBy: "Sarah Johnson" },
    { id: "fd-02", homeId: "oak-house", date: "2025-03-15", timeOfDay: "evening", evacuationTimeMinutes: 3.0, allChildrenAccountedFor: true, allStaffParticipated: true, childrenPresent: 3, staffPresent: 2, issuesIdentified: ["Jordan initially went to wrong assembly point"], actionsTaken: ["Reviewed fire evacuation procedure with Jordan"], conductedBy: "Darren Laville" },
    { id: "fd-03", homeId: "oak-house", date: "2025-05-10", timeOfDay: "day", evacuationTimeMinutes: 2.0, allChildrenAccountedFor: true, allStaffParticipated: false, childrenPresent: 2, staffPresent: 1, issuesIdentified: ["One staff member was off-shift and not replaced"], actionsTaken: ["Reviewed lone working evacuation procedure"], conductedBy: "Lisa Williams" },
    { id: "fd-04", homeId: "oak-house", date: "2025-06-08", timeOfDay: "night", evacuationTimeMinutes: 4.5, allChildrenAccountedFor: true, allStaffParticipated: true, childrenPresent: 3, staffPresent: 1, issuesIdentified: ["Alex needed additional reassurance during night drill"], actionsTaken: ["Added night drill preparation to Alex's care plan"], conductedBy: "Tom Richards" },
  ];
}

function demoRisks(): EnvironmentalRisk[] {
  return [
    { id: "risk-01", homeId: "oak-house", riskArea: "Kitchen", riskDescription: "Sharp knives accessible in unlocked drawer", riskLevel: "high", identifiedDate: "2025-01-10", mitigationInPlace: true, mitigationDescription: "Magnetic knife rack installed at height, drawer lock fitted", reviewDate: "2025-07-10", status: "mitigated" },
    { id: "risk-02", homeId: "oak-house", riskArea: "Bathroom (upstairs)", riskDescription: "Ligature point — window cord", riskLevel: "high", identifiedDate: "2025-05-01", mitigationInPlace: false, reviewDate: "2025-06-01", status: "open" },
    { id: "risk-03", homeId: "oak-house", riskArea: "Garden", riskDescription: "Shed contains garden tools accessible to children", riskLevel: "medium", identifiedDate: "2025-02-15", mitigationInPlace: true, mitigationDescription: "Padlock fitted to shed, key held by staff on shift", reviewDate: "2025-08-15", status: "mitigated" },
    { id: "risk-04", homeId: "oak-house", riskArea: "Front entrance", riskDescription: "CCTV blind spot near side gate", riskLevel: "medium", identifiedDate: "2025-03-01", mitigationInPlace: true, mitigationDescription: "Additional camera installed covering side gate", reviewDate: "2025-09-01", status: "closed" },
    { id: "risk-05", homeId: "oak-house", riskArea: "Medication storage", riskDescription: "Medication cabinet lock intermittently sticking", riskLevel: "critical", identifiedDate: "2025-06-05", mitigationInPlace: false, reviewDate: "2025-06-12", status: "open" },
  ];
}

// ── getCategoryLabel ──────────────────────────────────────────────────────

describe("getCategoryLabel", () => {
  it("returns Fire Safety for fire_safety", () => {
    expect(getCategoryLabel("fire_safety")).toBe("Fire Safety");
  });
  it("returns Ligature Assessment for ligature_assessment", () => {
    expect(getCategoryLabel("ligature_assessment")).toBe("Ligature Assessment");
  });
  it("returns Water Temperature for water_temperature", () => {
    expect(getCategoryLabel("water_temperature")).toBe("Water Temperature");
  });
  it("returns Decoration & Homeliness for decoration_homeliness", () => {
    expect(getCategoryLabel("decoration_homeliness")).toBe("Decoration & Homeliness");
  });
});

// ── evaluateComplianceChecks ──────────────────────────────────────────────

describe("evaluateComplianceChecks", () => {
  const checks = demoChecks();
  const result = evaluateComplianceChecks(checks, REF_DATE);

  it("counts total checks", () => {
    expect(result.totalChecks).toBe(14);
  });

  it("counts passed checks", () => {
    expect(result.passed).toBe(3); // chk-01, chk-03, chk-11
  });

  it("counts failed checks", () => {
    expect(result.failed).toBe(1); // chk-14
  });

  it("counts overdue checks", () => {
    expect(result.overdue).toBe(1); // chk-05
  });

  it("counts due_soon checks", () => {
    expect(result.dueSoon).toBe(2); // chk-09, chk-12
  });

  it("counts not_due checks", () => {
    expect(result.notDue).toBe(7);
  });

  it("calculates compliance rate (passed + not_due / total)", () => {
    // (3 passed + 7 not_due) / 14 = 71%
    expect(result.complianceRate).toBe(71);
  });

  it("identifies overdue checks with days past due", () => {
    expect(result.overdueChecks.length).toBe(1);
    expect(result.overdueChecks[0].category).toBe("electrical_safety");
    expect(result.overdueChecks[0].daysPastDue).toBeGreaterThan(0);
  });

  it("identifies due_soon checks with days until due", () => {
    expect(result.dueSoonChecks.length).toBe(2);
    expect(result.dueSoonChecks[0].daysUntilDue).toBeLessThanOrEqual(30);
  });

  it("identifies failed checks", () => {
    expect(result.failedChecks.length).toBe(1);
    expect(result.failedChecks[0].category).toBe("alarm_system");
  });

  it("provides category breakdown", () => {
    expect(result.categoryBreakdown.length).toBeGreaterThan(0);
    const fireSafety = result.categoryBreakdown.find((c) => c.category === "fire_safety");
    expect(fireSafety).toBeDefined();
    expect(fireSafety!.total).toBe(2);
    expect(fireSafety!.passed).toBe(2); // 1 passed + 1 not_due
  });

  it("sorts overdue checks by days past due descending", () => {
    const multiOverdue: PremisesCheck[] = [
      { id: "a", homeId: "h", category: "fire_safety", checkName: "A", lastCompletedDate: "2025-01-01", nextDueDate: "2025-03-01", frequencyDays: 90, status: "overdue" },
      { id: "b", homeId: "h", category: "gas_safety", checkName: "B", lastCompletedDate: "2025-01-01", nextDueDate: "2025-05-01", frequencyDays: 90, status: "overdue" },
    ];
    const r = evaluateComplianceChecks(multiOverdue, REF_DATE);
    expect(r.overdueChecks[0].daysPastDue).toBeGreaterThanOrEqual(r.overdueChecks[1].daysPastDue);
  });

  it("handles empty checks array", () => {
    const r = evaluateComplianceChecks([], REF_DATE);
    expect(r.totalChecks).toBe(0);
    expect(r.complianceRate).toBe(0);
    expect(r.categoryBreakdown.length).toBe(0);
  });

  it("returns 100% compliance when all checks passed or not_due", () => {
    const allGood: PremisesCheck[] = [
      { id: "a", homeId: "h", category: "fire_safety", checkName: "A", lastCompletedDate: "2025-06-10", nextDueDate: "2025-06-20", frequencyDays: 7, status: "passed" },
      { id: "b", homeId: "h", category: "gas_safety", checkName: "B", lastCompletedDate: "2025-01-01", nextDueDate: "2026-01-01", frequencyDays: 365, status: "not_due" },
    ];
    const r = evaluateComplianceChecks(allGood, REF_DATE);
    expect(r.complianceRate).toBe(100);
  });
});

// ── evaluateMaintenance ──────────────────────────────────────────────────

describe("evaluateMaintenance", () => {
  const requests = demoMaintenance();
  const result = evaluateMaintenance(requests, REF_DATE);

  it("counts total requests", () => {
    expect(result.totalRequests).toBe(7);
  });

  it("counts open requests (reported + scheduled + in_progress)", () => {
    expect(result.open).toBe(3); // maint-03, maint-05, maint-07
  });

  it("counts completed requests", () => {
    expect(result.completed).toBe(3); // maint-01, maint-02, maint-04
  });

  it("counts deferred requests", () => {
    expect(result.deferred).toBe(1); // maint-06
  });

  it("calculates average resolution days", () => {
    // maint-01: 5 days, maint-02: 9 days, maint-04: 21 days → avg ~12
    expect(result.avgResolutionDays).toBeGreaterThan(0);
    expect(result.avgResolutionDays).toBeLessThan(30);
  });

  it("counts critical open requests", () => {
    expect(result.criticalOpen).toBe(1); // maint-05
  });

  it("counts high open requests", () => {
    expect(result.highOpen).toBe(1); // maint-03
  });

  it("calculates completion rate", () => {
    // 3 completed / 7 total = 43%
    expect(result.completionRate).toBe(43);
  });

  it("lists open requests sorted by urgency then days open", () => {
    expect(result.openRequests.length).toBe(3);
    // Critical should be first
    expect(result.openRequests[0].urgency).toBe("critical");
  });

  it("provides urgency breakdown", () => {
    expect(result.urgencyBreakdown.length).toBeGreaterThan(0);
    const critical = result.urgencyBreakdown.find((u) => u.urgency === "critical");
    expect(critical?.total).toBe(1);
    expect(critical?.open).toBe(1);
  });

  it("handles empty requests array", () => {
    const r = evaluateMaintenance([], REF_DATE);
    expect(r.totalRequests).toBe(0);
    expect(r.completionRate).toBe(0);
    expect(r.avgResolutionDays).toBe(0);
  });

  it("calculates correct days open for open requests", () => {
    const openReq = result.openRequests.find((r) => r.id === "maint-05");
    expect(openReq).toBeDefined();
    expect(openReq!.daysOpen).toBe(5); // 2025-06-10 to 2025-06-15
  });
});

// ── evaluateFireDrills ──────────────────────────────────────────────────

describe("evaluateFireDrills", () => {
  const drills = demoDrills();
  const result = evaluateFireDrills(drills, PERIOD_START, PERIOD_END);

  it("counts total drills", () => {
    expect(result.totalDrills).toBe(4);
  });

  it("counts drills in period", () => {
    expect(result.drillsInPeriod).toBe(4);
  });

  it("calculates average evacuation time", () => {
    // (2.5 + 3.0 + 2.0 + 4.5) / 4 = 3.0
    expect(result.avgEvacuationTime).toBe(3);
  });

  it("calculates children accounted for rate", () => {
    // All 4 drills had all children accounted for
    expect(result.allChildrenAccountedForRate).toBe(100);
  });

  it("calculates staff participation rate", () => {
    // 3 of 4 drills had all staff participating (fd-03 did not)
    expect(result.allStaffParticipatedRate).toBe(75);
  });

  it("counts issues identified", () => {
    // fd-02: 1 issue, fd-03: 1 issue, fd-04: 1 issue
    expect(result.issuesIdentifiedCount).toBe(3);
  });

  it("counts day drills", () => {
    expect(result.dayDrillsConducted).toBe(2); // fd-01, fd-03
  });

  it("counts evening drills", () => {
    expect(result.eveningDrillsConducted).toBe(1); // fd-02
  });

  it("counts night drills", () => {
    expect(result.nightDrillsConducted).toBe(1); // fd-04
  });

  it("assesses drill frequency adequacy", () => {
    // 6 months period, expect 2 drills minimum (1 per quarter), have 4
    expect(result.drillFrequencyAdequate).toBe(true);
  });

  it("provides drills by time of day", () => {
    expect(result.drillsByTimeOfDay.length).toBe(3);
    const dayEntry = result.drillsByTimeOfDay.find((d) => d.timeOfDay === "day");
    expect(dayEntry?.count).toBe(2);
    expect(dayEntry?.avgEvacTime).toBe(2.3); // (2.5 + 2.0) / 2 = 2.25 → 2.3 (rounded to 1dp)
  });

  it("handles empty drills array", () => {
    const r = evaluateFireDrills([], PERIOD_START, PERIOD_END);
    expect(r.totalDrills).toBe(0);
    expect(r.drillsInPeriod).toBe(0);
    expect(r.avgEvacuationTime).toBe(0);
    expect(r.allChildrenAccountedForRate).toBe(0);
    expect(r.drillFrequencyAdequate).toBe(false);
  });

  it("excludes out-of-period drills", () => {
    const outOfPeriod: FireDrillRecord[] = [
      { id: "fd-x", homeId: "h", date: "2024-12-01", timeOfDay: "day", evacuationTimeMinutes: 2, allChildrenAccountedFor: true, allStaffParticipated: true, childrenPresent: 3, staffPresent: 2, issuesIdentified: [], actionsTaken: [], conductedBy: "Test" },
    ];
    const r = evaluateFireDrills(outOfPeriod, PERIOD_START, PERIOD_END);
    expect(r.drillsInPeriod).toBe(0);
    expect(r.totalDrills).toBe(1);
  });

  it("identifies inadequate frequency for long periods with few drills", () => {
    const oneDrill: FireDrillRecord[] = [
      { id: "fd-1", homeId: "h", date: "2025-03-01", timeOfDay: "day", evacuationTimeMinutes: 2, allChildrenAccountedFor: true, allStaffParticipated: true, childrenPresent: 3, staffPresent: 2, issuesIdentified: [], actionsTaken: [], conductedBy: "Test" },
    ];
    // Full year period expects at least 4 drills
    const r = evaluateFireDrills(oneDrill, "2025-01-01", "2025-12-31");
    expect(r.drillFrequencyAdequate).toBe(false);
  });
});

// ── evaluateEnvironmentalRisks ──────────────────────────────────────────

describe("evaluateEnvironmentalRisks", () => {
  const risks = demoRisks();
  const result = evaluateEnvironmentalRisks(risks, REF_DATE);

  it("counts total risks", () => {
    expect(result.totalRisks).toBe(5);
  });

  it("counts open risks", () => {
    expect(result.openRisks).toBe(2); // risk-02, risk-05
  });

  it("counts mitigated risks", () => {
    expect(result.mitigatedRisks).toBe(2); // risk-01, risk-03
  });

  it("counts closed risks", () => {
    expect(result.closedRisks).toBe(1); // risk-04
  });

  it("counts critical open risks", () => {
    expect(result.criticalOpen).toBe(1); // risk-05
  });

  it("counts high open risks", () => {
    expect(result.highOpen).toBe(1); // risk-02
  });

  it("calculates mitigation rate for active risks", () => {
    // Active = open(2) + mitigated(2) = 4. With mitigation = risk-01 + risk-03 = 2. Rate = 50%
    expect(result.mitigationRate).toBe(50);
  });

  it("identifies overdue reviews", () => {
    // risk-02 reviewDate 2025-06-01 < refDate 2025-06-15 → overdue
    // risk-05 reviewDate 2025-06-12 < refDate 2025-06-15 → overdue
    expect(result.overdueReviews.length).toBe(2);
    expect(result.overdueReviews[0].daysPastDue).toBeGreaterThanOrEqual(result.overdueReviews[1].daysPastDue);
  });

  it("provides risks by level", () => {
    expect(result.risksByLevel.length).toBeGreaterThan(0);
    const critical = result.risksByLevel.find((r) => r.level === "critical");
    expect(critical?.total).toBe(1);
    expect(critical?.open).toBe(1);
  });

  it("handles empty risks array", () => {
    const r = evaluateEnvironmentalRisks([], REF_DATE);
    expect(r.totalRisks).toBe(0);
    expect(r.mitigationRate).toBe(100); // No active risks → 100%
    expect(r.overdueReviews.length).toBe(0);
  });

  it("excludes closed risks from overdue review check", () => {
    const closedRisk: EnvironmentalRisk[] = [
      { id: "r1", homeId: "h", riskArea: "Test", riskDescription: "Test", riskLevel: "low", identifiedDate: "2025-01-01", mitigationInPlace: false, reviewDate: "2025-01-15", status: "closed" },
    ];
    const r = evaluateEnvironmentalRisks(closedRisk, REF_DATE);
    expect(r.overdueReviews.length).toBe(0);
  });

  it("counts accepted risks separately", () => {
    const risks: EnvironmentalRisk[] = [
      { id: "r1", homeId: "h", riskArea: "Test", riskDescription: "Low risk accepted", riskLevel: "low", identifiedDate: "2025-01-01", mitigationInPlace: false, reviewDate: "2026-01-01", status: "accepted" },
    ];
    const r = evaluateEnvironmentalRisks(risks, REF_DATE);
    expect(r.acceptedRisks).toBe(1);
    expect(r.openRisks).toBe(0);
  });
});

// ── generatePremisesIntelligence — integration ──────────────────────────

describe("generatePremisesIntelligence", () => {
  const result = generatePremisesIntelligence(
    demoChecks(),
    demoMaintenance(),
    demoDrills(),
    demoRisks(),
    "oak-house",
    PERIOD_START,
    PERIOD_END,
    REF_DATE,
  );

  it("returns all required fields", () => {
    expect(result).toHaveProperty("homeId", "oak-house");
    expect(result).toHaveProperty("periodStart", PERIOD_START);
    expect(result).toHaveProperty("periodEnd", PERIOD_END);
    expect(result).toHaveProperty("compliance");
    expect(result).toHaveProperty("maintenance");
    expect(result).toHaveProperty("fireDrills");
    expect(result).toHaveProperty("environmentalRisks");
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("rating");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("areasForImprovement");
    expect(result).toHaveProperty("actions");
    expect(result).toHaveProperty("regulatoryLinks");
  });

  it("calculates overall score between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("assigns a valid rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("identifies strengths", () => {
    expect(result.strengths.length).toBeGreaterThanOrEqual(1);
  });

  it("identifies areas for improvement when issues exist", () => {
    // Has overdue checks, failed checks, critical open maintenance, critical open risks
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("suggests actions when issues exist", () => {
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("includes regulatory links", () => {
    expect(result.regulatoryLinks.length).toBe(5);
    expect(result.regulatoryLinks.some((l) => l.includes("Regulation 25"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Fire Safety"))).toBe(true);
  });

  it("flags overdue checks in areas for improvement", () => {
    expect(result.areasForImprovement.some((a) => a.includes("overdue"))).toBe(true);
  });

  it("flags critical open maintenance", () => {
    expect(result.areasForImprovement.some((a) => a.includes("critical maintenance"))).toBe(true);
  });

  it("flags critical open environmental risks", () => {
    expect(result.areasForImprovement.some((a) => a.includes("critical environmental risk"))).toBe(true);
  });

  it("credits fire drill variety in strengths", () => {
    // Has day, evening, and night drills
    expect(result.strengths.some((s) => s.includes("different times of day"))).toBe(true);
  });

  it("credits children accounted for in strengths", () => {
    expect(result.strengths.some((s) => s.includes("All children accounted for"))).toBe(true);
  });

  it("produces good or better rating with strong data", () => {
    const goodChecks: PremisesCheck[] = [
      { id: "a", homeId: "h", category: "fire_safety", checkName: "A", lastCompletedDate: "2025-06-10", nextDueDate: "2025-06-20", frequencyDays: 7, status: "passed" },
      { id: "b", homeId: "h", category: "gas_safety", checkName: "B", lastCompletedDate: "2025-01-01", nextDueDate: "2026-01-01", frequencyDays: 365, status: "not_due" },
      { id: "c", homeId: "h", category: "water_temperature", checkName: "C", lastCompletedDate: "2025-06-10", nextDueDate: "2025-06-20", frequencyDays: 7, status: "passed" },
    ];
    const goodMaintenance: MaintenanceRequest[] = [
      { id: "m1", homeId: "h", category: "building_maintenance", description: "Fixed", reportedDate: "2025-06-01", reportedBy: "Staff", urgency: "low", status: "completed", completedDate: "2025-06-05", completedBy: "Contractor" },
    ];
    const goodDrills: FireDrillRecord[] = [
      { id: "d1", homeId: "h", date: "2025-02-01", timeOfDay: "day", evacuationTimeMinutes: 2, allChildrenAccountedFor: true, allStaffParticipated: true, childrenPresent: 3, staffPresent: 2, issuesIdentified: [], actionsTaken: [], conductedBy: "Manager" },
      { id: "d2", homeId: "h", date: "2025-04-01", timeOfDay: "evening", evacuationTimeMinutes: 2.5, allChildrenAccountedFor: true, allStaffParticipated: true, childrenPresent: 3, staffPresent: 2, issuesIdentified: [], actionsTaken: [], conductedBy: "Manager" },
      { id: "d3", homeId: "h", date: "2025-06-01", timeOfDay: "night", evacuationTimeMinutes: 3, allChildrenAccountedFor: true, allStaffParticipated: true, childrenPresent: 3, staffPresent: 1, issuesIdentified: [], actionsTaken: [], conductedBy: "Manager" },
    ];
    const r = generatePremisesIntelligence(goodChecks, goodMaintenance, goodDrills, [], "h", PERIOD_START, PERIOD_END, REF_DATE);
    expect(r.overallScore).toBeGreaterThanOrEqual(60);
    expect(["outstanding", "good"]).toContain(r.rating);
  });

  it("produces inadequate rating with poor data", () => {
    const badChecks: PremisesCheck[] = [
      { id: "a", homeId: "h", category: "fire_safety", checkName: "A", lastCompletedDate: "2024-01-01", nextDueDate: "2024-06-01", frequencyDays: 180, status: "overdue" },
      { id: "b", homeId: "h", category: "gas_safety", checkName: "B", lastCompletedDate: "2024-01-01", nextDueDate: "2024-06-01", frequencyDays: 365, status: "overdue" },
      { id: "c", homeId: "h", category: "electrical_safety", checkName: "C", lastCompletedDate: "2024-01-01", nextDueDate: "2024-06-01", frequencyDays: 365, status: "failed" },
    ];
    const badMaintenance: MaintenanceRequest[] = [
      { id: "m1", homeId: "h", category: "building_maintenance", description: "Broken", reportedDate: "2025-01-01", reportedBy: "Staff", urgency: "critical", status: "reported" },
      { id: "m2", homeId: "h", category: "alarm_system", description: "Broken", reportedDate: "2025-01-01", reportedBy: "Staff", urgency: "critical", status: "in_progress" },
    ];
    const badRisks: EnvironmentalRisk[] = [
      { id: "r1", homeId: "h", riskArea: "A", riskDescription: "Bad", riskLevel: "critical", identifiedDate: "2025-01-01", mitigationInPlace: false, reviewDate: "2025-03-01", status: "open" },
    ];
    const r = generatePremisesIntelligence(badChecks, badMaintenance, [], badRisks, "h", PERIOD_START, PERIOD_END, REF_DATE);
    expect(r.overallScore).toBeLessThan(40);
    expect(r.rating).toBe("inadequate");
  });

  it("handles all empty data gracefully", () => {
    const r = generatePremisesIntelligence([], [], [], [], "oak-house", PERIOD_START, PERIOD_END, REF_DATE);
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
    expect(r.rating).toBeDefined();
    expect(r.strengths.length).toBeGreaterThanOrEqual(1);
  });

  it("suggests night-time drill when none conducted", () => {
    const dayOnly: FireDrillRecord[] = [
      { id: "d1", homeId: "h", date: "2025-03-01", timeOfDay: "day", evacuationTimeMinutes: 2, allChildrenAccountedFor: true, allStaffParticipated: true, childrenPresent: 3, staffPresent: 2, issuesIdentified: [], actionsTaken: [], conductedBy: "Manager" },
      { id: "d2", homeId: "h", date: "2025-05-01", timeOfDay: "day", evacuationTimeMinutes: 2.5, allChildrenAccountedFor: true, allStaffParticipated: true, childrenPresent: 3, staffPresent: 2, issuesIdentified: [], actionsTaken: [], conductedBy: "Manager" },
    ];
    const r = generatePremisesIntelligence([], [], dayOnly, [], "h", PERIOD_START, PERIOD_END, REF_DATE);
    expect(r.areasForImprovement.some((a) => a.includes("night"))).toBe(true);
    expect(r.actions.some((a) => a.includes("night"))).toBe(true);
  });

  it("suggests fire drill when none conducted in period", () => {
    const r = generatePremisesIntelligence([], [], [], [], "h", PERIOD_START, PERIOD_END, REF_DATE);
    expect(r.areasForImprovement.some((a) => a.includes("No fire drills"))).toBe(true);
    expect(r.actions.some((a) => a.includes("fire drill"))).toBe(true);
  });
});
