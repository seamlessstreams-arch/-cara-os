// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Staff Training & CPD Compliance Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateMandatoryCompliance,
  evaluateCertifications,
  evaluateCpd,
  evaluateQualifications,
  evaluateSpecialistTraining,
  buildStaffProfiles,
  generateStaffTrainingIntelligence,
  getCategoryLabel,
  getRoleLabel,
  getMandatoryCategories,
} from "../staff-training-engine";
import type {
  TrainingRecord,
  StaffMember,
  ChildNeed,
} from "../staff-training-engine";

// ── Test Constants ───────────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-12-31";
const REFERENCE_DATE = "2025-06-15";

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────────
// Staff: Sarah Johnson (RM), Tom Richards (RSW), Lisa Williams (RSW), Darren Laville (RM/RI)
// Children: Alex (14), Jordan (13), Morgan (15)

const demoStaff: StaffMember[] = [
  { id: "staff-sarah", name: "Sarah Johnson", role: "registered_manager", startDate: "2020-03-01", qualificationLevel: "level_5_diploma", qualificationDate: "2019-06-15", isPlaced: true },
  { id: "staff-tom", name: "Tom Richards", role: "rsw", startDate: "2022-01-15", qualificationLevel: "level_3_diploma", qualificationDate: "2023-08-20", isPlaced: true },
  { id: "staff-lisa", name: "Lisa Williams", role: "senior_rsw", startDate: "2021-06-01", qualificationLevel: "level_3_diploma", qualificationDate: "2022-11-10", isPlaced: true },
  { id: "staff-darren", name: "Darren Laville", role: "registered_manager", startDate: "2018-01-10", qualificationLevel: "level_5_diploma", qualificationDate: "2017-09-01", isPlaced: true },
  { id: "staff-agency1", name: "Agency Worker A", role: "bank_staff", startDate: "2025-01-01", qualificationLevel: "other_relevant", isPlaced: false },
];

const demoRecords: TrainingRecord[] = [
  // ── Sarah Johnson — RM, fully compliant ──────────────────────────────
  { id: "tr-s01", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "safeguarding", courseName: "Advanced Safeguarding (Level 3)", completedDate: "2025-02-10", expiryDate: "2026-02-10", hoursCompleted: 12, provider: "Local Authority" },
  { id: "tr-s02", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "first_aid", courseName: "Paediatric First Aid", completedDate: "2024-06-15", expiryDate: "2027-06-15", hoursCompleted: 12, provider: "St John Ambulance" },
  { id: "tr-s03", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "physical_intervention", courseName: "PRICE Physical Intervention", completedDate: "2025-03-20", expiryDate: "2026-03-20", hoursCompleted: 6, provider: "PRICE Training" },
  { id: "tr-s04", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "fire_safety", courseName: "Fire Safety Awareness", completedDate: "2025-01-15", hoursCompleted: 2, provider: "In-house" },
  { id: "tr-s05", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "medication_administration", courseName: "Medication Administration", completedDate: "2025-01-20", hoursCompleted: 3, provider: "In-house" },
  { id: "tr-s06", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "health_and_safety", courseName: "Health & Safety at Work", completedDate: "2025-02-01", hoursCompleted: 2, provider: "E-learning" },
  { id: "tr-s07", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "data_protection", courseName: "UK-GDPR & Data Protection", completedDate: "2025-01-25", hoursCompleted: 2, provider: "E-learning" },
  { id: "tr-s08", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "equality_diversity", courseName: "EDI in Children's Services", completedDate: "2025-03-10", hoursCompleted: 3, provider: "External" },
  // Specialist
  { id: "tr-s09", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "attachment_trauma", courseName: "Attachment Theory & Trauma-Informed Care", completedDate: "2025-04-05", hoursCompleted: 6, provider: "External" },
  { id: "tr-s10", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "therapeutic_parenting", courseName: "PACE Model in Practice", completedDate: "2025-05-12", hoursCompleted: 6, provider: "External" },
  { id: "tr-s11", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "csea", courseName: "CSE/A Recognition & Response", completedDate: "2025-03-15", hoursCompleted: 4, provider: "Local Authority" },
  { id: "tr-s12", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "self_harm_suicide", courseName: "Self-Harm Awareness", completedDate: "2025-06-01", hoursCompleted: 3, provider: "External" },

  // ── Tom Richards — RSW, most mandatory done, one missing (equality_diversity) ──
  { id: "tr-t01", staffId: "staff-tom", staffName: "Tom Richards", category: "safeguarding", courseName: "Safeguarding Children (Level 2)", completedDate: "2025-02-15", expiryDate: "2026-02-15", hoursCompleted: 6, provider: "Local Authority" },
  { id: "tr-t02", staffId: "staff-tom", staffName: "Tom Richards", category: "first_aid", courseName: "First Aid at Work", completedDate: "2023-09-10", expiryDate: "2026-09-10", hoursCompleted: 12, provider: "Red Cross" },
  { id: "tr-t03", staffId: "staff-tom", staffName: "Tom Richards", category: "physical_intervention", courseName: "PRICE Physical Intervention", completedDate: "2025-03-22", expiryDate: "2026-03-22", hoursCompleted: 6, provider: "PRICE Training" },
  { id: "tr-t04", staffId: "staff-tom", staffName: "Tom Richards", category: "fire_safety", courseName: "Fire Safety Awareness", completedDate: "2025-01-16", hoursCompleted: 2, provider: "In-house" },
  { id: "tr-t05", staffId: "staff-tom", staffName: "Tom Richards", category: "medication_administration", courseName: "Medication Administration", completedDate: "2025-01-20", hoursCompleted: 3, provider: "In-house" },
  { id: "tr-t06", staffId: "staff-tom", staffName: "Tom Richards", category: "health_and_safety", courseName: "Health & Safety at Work", completedDate: "2025-02-05", hoursCompleted: 2, provider: "E-learning" },
  { id: "tr-t07", staffId: "staff-tom", staffName: "Tom Richards", category: "data_protection", courseName: "UK-GDPR & Data Protection", completedDate: "2025-01-28", hoursCompleted: 2, provider: "E-learning" },
  // Tom missing equality_diversity
  // Specialist
  { id: "tr-t08", staffId: "staff-tom", staffName: "Tom Richards", category: "attachment_trauma", courseName: "Attachment & Trauma Basics", completedDate: "2025-04-10", hoursCompleted: 4, provider: "External" },
  { id: "tr-t09", staffId: "staff-tom", staffName: "Tom Richards", category: "online_safety", courseName: "Online Safety for Care Staff", completedDate: "2025-05-20", hoursCompleted: 3, provider: "E-learning" },

  // ── Lisa Williams — Senior RSW, fully compliant ──────────────────────
  { id: "tr-l01", staffId: "staff-lisa", staffName: "Lisa Williams", category: "safeguarding", courseName: "Safeguarding Children (Level 3)", completedDate: "2025-02-12", expiryDate: "2026-02-12", hoursCompleted: 12, provider: "Local Authority" },
  { id: "tr-l02", staffId: "staff-lisa", staffName: "Lisa Williams", category: "first_aid", courseName: "Paediatric First Aid", completedDate: "2024-08-20", expiryDate: "2027-08-20", hoursCompleted: 12, provider: "St John Ambulance" },
  { id: "tr-l03", staffId: "staff-lisa", staffName: "Lisa Williams", category: "physical_intervention", courseName: "PRICE Physical Intervention", completedDate: "2025-03-25", expiryDate: "2026-03-25", hoursCompleted: 6, provider: "PRICE Training" },
  { id: "tr-l04", staffId: "staff-lisa", staffName: "Lisa Williams", category: "fire_safety", courseName: "Fire Safety Awareness", completedDate: "2025-01-18", hoursCompleted: 2, provider: "In-house" },
  { id: "tr-l05", staffId: "staff-lisa", staffName: "Lisa Williams", category: "medication_administration", courseName: "Medication Administration", completedDate: "2025-01-22", hoursCompleted: 3, provider: "In-house" },
  { id: "tr-l06", staffId: "staff-lisa", staffName: "Lisa Williams", category: "health_and_safety", courseName: "Health & Safety at Work", completedDate: "2025-02-08", hoursCompleted: 2, provider: "E-learning" },
  { id: "tr-l07", staffId: "staff-lisa", staffName: "Lisa Williams", category: "data_protection", courseName: "UK-GDPR & Data Protection", completedDate: "2025-01-30", hoursCompleted: 2, provider: "E-learning" },
  { id: "tr-l08", staffId: "staff-lisa", staffName: "Lisa Williams", category: "equality_diversity", courseName: "EDI in Children's Services", completedDate: "2025-03-12", hoursCompleted: 3, provider: "External" },
  // Specialist
  { id: "tr-l09", staffId: "staff-lisa", staffName: "Lisa Williams", category: "attachment_trauma", courseName: "Attachment Theory & Trauma-Informed Care", completedDate: "2025-04-08", hoursCompleted: 6, provider: "External" },
  { id: "tr-l10", staffId: "staff-lisa", staffName: "Lisa Williams", category: "therapeutic_parenting", courseName: "PACE Model in Practice", completedDate: "2025-05-15", hoursCompleted: 6, provider: "External" },
  { id: "tr-l11", staffId: "staff-lisa", staffName: "Lisa Williams", category: "mental_health_awareness", courseName: "Mental Health First Aid", completedDate: "2025-04-20", hoursCompleted: 8, provider: "MHFA England" },
  { id: "tr-l12", staffId: "staff-lisa", staffName: "Lisa Williams", category: "self_harm_suicide", courseName: "Self-Harm Prevention", completedDate: "2025-06-05", hoursCompleted: 3, provider: "External" },

  // ── Darren Laville — RM, fully compliant, some training before period ──
  { id: "tr-d01", staffId: "staff-darren", staffName: "Darren Laville", category: "safeguarding", courseName: "Designated Safeguarding Lead", completedDate: "2025-01-08", expiryDate: "2026-01-08", hoursCompleted: 12, provider: "Local Authority" },
  { id: "tr-d02", staffId: "staff-darren", staffName: "Darren Laville", category: "first_aid", courseName: "First Aid at Work", completedDate: "2023-11-15", expiryDate: "2025-07-15", hoursCompleted: 12, provider: "Red Cross", linkedChildNeeds: ["child-alex"] },
  { id: "tr-d03", staffId: "staff-darren", staffName: "Darren Laville", category: "physical_intervention", courseName: "PRICE Physical Intervention", completedDate: "2025-03-18", expiryDate: "2026-03-18", hoursCompleted: 6, provider: "PRICE Training" },
  { id: "tr-d04", staffId: "staff-darren", staffName: "Darren Laville", category: "fire_safety", courseName: "Fire Safety Awareness", completedDate: "2025-01-10", hoursCompleted: 2, provider: "In-house" },
  { id: "tr-d05", staffId: "staff-darren", staffName: "Darren Laville", category: "medication_administration", courseName: "Medication Administration", completedDate: "2025-01-18", hoursCompleted: 3, provider: "In-house" },
  { id: "tr-d06", staffId: "staff-darren", staffName: "Darren Laville", category: "health_and_safety", courseName: "Health & Safety at Work", completedDate: "2025-02-03", hoursCompleted: 2, provider: "E-learning" },
  { id: "tr-d07", staffId: "staff-darren", staffName: "Darren Laville", category: "data_protection", courseName: "UK-GDPR & Data Protection", completedDate: "2025-01-22", hoursCompleted: 2, provider: "E-learning" },
  { id: "tr-d08", staffId: "staff-darren", staffName: "Darren Laville", category: "equality_diversity", courseName: "EDI for Managers", completedDate: "2025-03-08", hoursCompleted: 4, provider: "External" },
  // Specialist
  { id: "tr-d09", staffId: "staff-darren", staffName: "Darren Laville", category: "therapeutic_parenting", courseName: "DDP Principles for Managers", completedDate: "2025-05-10", hoursCompleted: 6, provider: "External" },
  { id: "tr-d10", staffId: "staff-darren", staffName: "Darren Laville", category: "csea", courseName: "CSE/A Strategic Response", completedDate: "2025-03-20", hoursCompleted: 4, provider: "Local Authority" },
];

const demoChildNeeds: ChildNeed[] = [
  { childId: "child-alex", childName: "Alex", need: "attachment_difficulties", requiredTraining: "attachment_trauma" },
  { childId: "child-alex", childName: "Alex", need: "self_harm_risk", requiredTraining: "self_harm_suicide" },
  { childId: "child-jordan", childName: "Jordan", need: "mental_health", requiredTraining: "mental_health_awareness" },
  { childId: "child-morgan", childName: "Morgan", need: "online_safety_risk", requiredTraining: "online_safety" },
  { childId: "child-morgan", childName: "Morgan", need: "csea_risk", requiredTraining: "csea" },
];

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Staff Training — evaluateMandatoryCompliance", () => {
  it("counts active staff only", () => {
    const result = evaluateMandatoryCompliance(demoStaff, demoRecords, PERIOD_START, PERIOD_END);
    // 5 staff, 1 not placed (agency) = 4 active
    expect(result.totalStaff).toBe(4);
  });

  it("lists 8 mandatory categories", () => {
    const result = evaluateMandatoryCompliance(demoStaff, demoRecords, PERIOD_START, PERIOD_END);
    expect(result.mandatoryCategories.length).toBe(8);
  });

  it("Sarah has 100% compliance", () => {
    const result = evaluateMandatoryCompliance(demoStaff, demoRecords, PERIOD_START, PERIOD_END);
    const sarah = result.staffCompliance.find((s) => s.staffId === "staff-sarah");
    expect(sarah!.complianceRate).toBe(100);
    expect(sarah!.missingCategories.length).toBe(0);
  });

  it("Tom has 7/8 mandatory completed (missing equality_diversity)", () => {
    const result = evaluateMandatoryCompliance(demoStaff, demoRecords, PERIOD_START, PERIOD_END);
    const tom = result.staffCompliance.find((s) => s.staffId === "staff-tom");
    expect(tom!.completedCategories.length).toBe(7);
    expect(tom!.missingCategories).toContain("equality_diversity");
    expect(tom!.complianceRate).toBe(88); // 7/8 = 87.5 → rounded to 88
  });

  it("Lisa has 100% compliance", () => {
    const result = evaluateMandatoryCompliance(demoStaff, demoRecords, PERIOD_START, PERIOD_END);
    const lisa = result.staffCompliance.find((s) => s.staffId === "staff-lisa");
    expect(lisa!.complianceRate).toBe(100);
  });

  it("calculates overall compliance rate", () => {
    const result = evaluateMandatoryCompliance(demoStaff, demoRecords, PERIOD_START, PERIOD_END);
    // Sarah 8 + Tom 7 + Lisa 8 + Darren 8 = 31 out of 32 = 97%
    expect(result.overallComplianceRate).toBe(97);
  });

  it("excludes non-placed staff", () => {
    const result = evaluateMandatoryCompliance(demoStaff, demoRecords, PERIOD_START, PERIOD_END);
    expect(result.staffCompliance.some((s) => s.staffId === "staff-agency1")).toBe(false);
  });

  it("handles empty staff list", () => {
    const result = evaluateMandatoryCompliance([], demoRecords, PERIOD_START, PERIOD_END);
    expect(result.totalStaff).toBe(0);
    expect(result.overallComplianceRate).toBe(0);
  });

  it("handles empty training records", () => {
    const result = evaluateMandatoryCompliance(demoStaff, [], PERIOD_START, PERIOD_END);
    expect(result.overallComplianceRate).toBe(0);
    for (const s of result.staffCompliance) {
      expect(s.complianceRate).toBe(0);
      expect(s.missingCategories.length).toBe(8);
    }
  });
});

describe("Staff Training — evaluateCertifications", () => {
  it("counts total certifications (records with expiry dates)", () => {
    const result = evaluateCertifications(demoRecords, REFERENCE_DATE);
    // Records with expiryDate: s01,s02,s03, t01,t02,t03, l01,l02,l03, d01,d02,d03 = 12
    expect(result.totalCertifications).toBe(12);
  });

  it("identifies Darren's first aid as expiring soon", () => {
    const result = evaluateCertifications(demoRecords, REFERENCE_DATE);
    // d02: expiryDate "2025-07-15", referenceDate "2025-06-15" = 30 days → expiring soon
    expect(result.expiringSoon).toBe(1);
    expect(result.expiringDetails[0].staffName).toBe("Darren Laville");
    expect(result.expiringDetails[0].category).toBe("first_aid");
    expect(result.expiringDetails[0].daysUntilExpiry).toBe(30);
  });

  it("all certifications still valid (none expired)", () => {
    const result = evaluateCertifications(demoRecords, REFERENCE_DATE);
    expect(result.expired).toBe(0);
    expect(result.validityRate).toBe(100);
  });

  it("detects expired certification", () => {
    const expiredRecord: TrainingRecord = {
      id: "tr-exp", staffId: "staff-tom", staffName: "Tom Richards",
      category: "first_aid", courseName: "Expired First Aid",
      completedDate: "2022-01-01", expiryDate: "2025-01-01",
      hoursCompleted: 12, provider: "Red Cross",
    };
    const result = evaluateCertifications([expiredRecord], REFERENCE_DATE);
    expect(result.expired).toBe(1);
    expect(result.expiredDetails[0].daysSinceExpiry).toBe(165); // Jan 1 to Jun 15
  });

  it("handles no certification records", () => {
    const noCerts: TrainingRecord[] = [
      { id: "nc-1", staffId: "s1", staffName: "S1", category: "fire_safety", courseName: "Fire", completedDate: "2025-01-01", hoursCompleted: 2, provider: "In-house" },
    ];
    const result = evaluateCertifications(noCerts, REFERENCE_DATE);
    expect(result.totalCertifications).toBe(0);
    expect(result.validityRate).toBe(0);
  });

  it("sorts expiring details by soonest first", () => {
    const result = evaluateCertifications(demoRecords, REFERENCE_DATE);
    if (result.expiringDetails.length > 1) {
      expect(result.expiringDetails[0].daysUntilExpiry).toBeLessThanOrEqual(
        result.expiringDetails[result.expiringDetails.length - 1].daysUntilExpiry,
      );
    }
  });
});

describe("Staff Training — evaluateCpd", () => {
  it("targets 30 hours per year", () => {
    const result = evaluateCpd(demoStaff, demoRecords, PERIOD_START, PERIOD_END);
    expect(result.targetHoursPerYear).toBe(30);
  });

  it("calculates Sarah's CPD hours", () => {
    const result = evaluateCpd(demoStaff, demoRecords, PERIOD_START, PERIOD_END);
    const sarah = result.staffCpd.find((s) => s.staffId === "staff-sarah");
    // s01(12)+s03(6)+s04(2)+s05(3)+s06(2)+s07(2)+s08(3)+s09(6)+s10(6)+s11(4)+s12(3) = 49
    // s02 completed 2024-06-15 — outside period? No wait, period is 2025-01-01 to 2025-12-31
    // s02 completedDate: "2024-06-15" → BEFORE period, not counted
    expect(sarah!.hoursCompleted).toBe(49);
    expect(sarah!.targetMet).toBe(true);
  });

  it("calculates Tom's CPD hours", () => {
    const result = evaluateCpd(demoStaff, demoRecords, PERIOD_START, PERIOD_END);
    const tom = result.staffCpd.find((s) => s.staffId === "staff-tom");
    // t01(6)+t03(6)+t04(2)+t05(3)+t06(2)+t07(2)+t08(4)+t09(3) = 28
    // t02 completed 2023-09-10 → before period
    expect(tom!.hoursCompleted).toBe(28);
    expect(tom!.targetMet).toBe(false);
  });

  it("counts staff meeting target", () => {
    const result = evaluateCpd(demoStaff, demoRecords, PERIOD_START, PERIOD_END);
    // Sarah 49 ✓, Tom 28 ✗, Lisa needs calculation, Darren needs calculation
    // Lisa: l01(12)+l03(6)+l04(2)+l05(3)+l06(2)+l07(2)+l08(3)+l09(6)+l10(6)+l11(8)+l12(3) = 53
    // l02 completed 2024-08-20 → before period
    // Darren: d01(12)+d03(6)+d04(2)+d05(3)+d06(2)+d07(2)+d08(4)+d09(6)+d10(4) = 41
    // d02 completed 2023-11-15 → before period
    // Sarah ✓ (49), Tom ✗ (28), Lisa ✓ (53), Darren ✓ (41) → 3 meeting target
    expect(result.staffMeetingTarget).toBe(3);
  });

  it("calculates target met rate", () => {
    const result = evaluateCpd(demoStaff, demoRecords, PERIOD_START, PERIOD_END);
    // 3/4 = 75%
    expect(result.targetMetRate).toBe(75);
  });

  it("calculates average hours", () => {
    const result = evaluateCpd(demoStaff, demoRecords, PERIOD_START, PERIOD_END);
    // (49 + 28 + 53 + 41) / 4 = 171/4 = 42.75 → 42.8
    expect(result.averageHours).toBe(42.8);
  });

  it("excludes non-placed staff", () => {
    const result = evaluateCpd(demoStaff, demoRecords, PERIOD_START, PERIOD_END);
    expect(result.staffCpd.some((s) => s.staffId === "staff-agency1")).toBe(false);
  });

  it("handles empty data", () => {
    const result = evaluateCpd([], [], PERIOD_START, PERIOD_END);
    expect(result.averageHours).toBe(0);
    expect(result.targetMetRate).toBe(0);
  });
});

describe("Staff Training — evaluateQualifications", () => {
  it("counts active staff only", () => {
    const result = evaluateQualifications(demoStaff);
    expect(result.totalStaff).toBe(4);
  });

  it("Sarah meets RM qualification (Level 5)", () => {
    const result = evaluateQualifications(demoStaff);
    const sarah = result.staffQualifications.find((s) => s.staffId === "staff-sarah");
    expect(sarah!.meetsRoleRequirement).toBe(true);
  });

  it("Tom meets RSW qualification (Level 3)", () => {
    const result = evaluateQualifications(demoStaff);
    const tom = result.staffQualifications.find((s) => s.staffId === "staff-tom");
    expect(tom!.meetsRoleRequirement).toBe(true);
  });

  it("all demo staff meet qualification requirements", () => {
    const result = evaluateQualifications(demoStaff);
    expect(result.qualificationComplianceRate).toBe(100);
  });

  it("detects qualification gap for unqualified RM", () => {
    const unqualifiedRM: StaffMember = {
      id: "bad-rm", name: "Unqualified Manager", role: "registered_manager",
      startDate: "2024-01-01", qualificationLevel: "level_3_diploma", isPlaced: true,
    };
    const result = evaluateQualifications([unqualifiedRM]);
    const rm = result.staffQualifications.find((s) => s.staffId === "bad-rm");
    expect(rm!.meetsRoleRequirement).toBe(false);
    expect(rm!.qualificationGap).toBeDefined();
    expect(rm!.qualificationGap).toContain("level 5");
  });

  it("handles empty staff", () => {
    const result = evaluateQualifications([]);
    expect(result.totalStaff).toBe(0);
    expect(result.qualificationComplianceRate).toBe(0);
  });
});

describe("Staff Training — evaluateSpecialistTraining", () => {
  it("identifies 5 child needs", () => {
    const result = evaluateSpecialistTraining(demoChildNeeds, demoRecords);
    expect(result.totalChildNeeds).toBe(5);
  });

  it("attachment_trauma covered (3 staff trained: Sarah, Tom, Lisa)", () => {
    const result = evaluateSpecialistTraining(demoChildNeeds, demoRecords);
    const attachmentNeed = result.needsCoverage.find((n) => n.need === "attachment_difficulties");
    expect(attachmentNeed!.trainedStaffCount).toBe(3);
    expect(attachmentNeed!.isCovered).toBe(true);
  });

  it("self_harm_suicide covered (2 staff: Sarah, Lisa)", () => {
    const result = evaluateSpecialistTraining(demoChildNeeds, demoRecords);
    const selfHarm = result.needsCoverage.find((n) => n.need === "self_harm_risk");
    expect(selfHarm!.trainedStaffCount).toBe(2);
    expect(selfHarm!.isCovered).toBe(true);
  });

  it("mental_health covered (1 staff: Lisa — NOT covered, needs ≥2)", () => {
    const result = evaluateSpecialistTraining(demoChildNeeds, demoRecords);
    const mh = result.needsCoverage.find((n) => n.need === "mental_health");
    expect(mh!.trainedStaffCount).toBe(1);
    expect(mh!.isCovered).toBe(false);
  });

  it("online_safety covered (1 staff: Tom — NOT covered)", () => {
    const result = evaluateSpecialistTraining(demoChildNeeds, demoRecords);
    const os = result.needsCoverage.find((n) => n.need === "online_safety_risk");
    expect(os!.trainedStaffCount).toBe(1);
    expect(os!.isCovered).toBe(false);
  });

  it("csea covered (2 staff: Sarah, Darren)", () => {
    const result = evaluateSpecialistTraining(demoChildNeeds, demoRecords);
    const csea = result.needsCoverage.find((n) => n.need === "csea_risk");
    expect(csea!.trainedStaffCount).toBe(2);
    expect(csea!.isCovered).toBe(true);
  });

  it("calculates coverage rate", () => {
    const result = evaluateSpecialistTraining(demoChildNeeds, demoRecords);
    // 3 covered (attachment, self_harm, csea) out of 5 = 60%
    expect(result.coverageRate).toBe(60);
  });

  it("counts uncovered needs", () => {
    const result = evaluateSpecialistTraining(demoChildNeeds, demoRecords);
    expect(result.uncoveredNeeds).toBe(2); // mental_health, online_safety
  });

  it("handles empty needs", () => {
    const result = evaluateSpecialistTraining([], demoRecords);
    expect(result.totalChildNeeds).toBe(0);
    expect(result.coverageRate).toBe(0);
  });
});

describe("Staff Training — buildStaffProfiles", () => {
  const profiles = buildStaffProfiles(demoStaff, demoRecords, REFERENCE_DATE, PERIOD_START, PERIOD_END);

  it("builds 4 profiles (active staff only)", () => {
    expect(profiles.length).toBe(4);
  });

  it("Sarah rated excellent (100% mandatory, no expired, many courses)", () => {
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    expect(sarah!.mandatoryComplianceRate).toBe(100);
    expect(sarah!.certificationsExpired).toBe(0);
    expect(sarah!.overallReadiness).toBe("excellent");
  });

  it("Tom rated good (88% mandatory, no expired)", () => {
    const tom = profiles.find((p) => p.staffId === "staff-tom");
    expect(tom!.mandatoryComplianceRate).toBe(88);
    expect(tom!.overallReadiness).toBe("good");
  });

  it("Lisa rated excellent", () => {
    const lisa = profiles.find((p) => p.staffId === "staff-lisa");
    expect(lisa!.mandatoryComplianceRate).toBe(100);
    expect(lisa!.overallReadiness).toBe("excellent");
  });

  it("Darren has expiring soon certification", () => {
    const darren = profiles.find((p) => p.staffId === "staff-darren");
    expect(darren!.certificationsExpiringSoon).toBe(1);
  });

  it("counts specialist training per staff", () => {
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    // Sarah has: attachment_trauma, therapeutic_parenting, csea, self_harm_suicide = 4
    expect(sarah!.specialistTrainingCount).toBe(4);
  });

  it("includes role and qualification", () => {
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    expect(sarah!.role).toBe("registered_manager");
    expect(sarah!.qualificationLevel).toBe("level_5_diploma");
  });

  it("handles empty data", () => {
    const result = buildStaffProfiles([], [], REFERENCE_DATE, PERIOD_START, PERIOD_END);
    expect(result.length).toBe(0);
  });
});

describe("Staff Training — generateStaffTrainingIntelligence (integration)", () => {
  const result = generateStaffTrainingIntelligence(
    demoStaff, demoRecords, demoChildNeeds,
    "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
  );

  it("returns complete structure", () => {
    expect(result).toHaveProperty("homeId", "oak-house");
    expect(result).toHaveProperty("periodStart", PERIOD_START);
    expect(result).toHaveProperty("periodEnd", PERIOD_END);
    expect(result).toHaveProperty("referenceDate", REFERENCE_DATE);
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("rating");
    expect(result).toHaveProperty("mandatoryCompliance");
    expect(result).toHaveProperty("certifications");
    expect(result).toHaveProperty("cpd");
    expect(result).toHaveProperty("qualifications");
    expect(result).toHaveProperty("specialistTraining");
    expect(result).toHaveProperty("staffProfiles");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("areasForDevelopment");
    expect(result).toHaveProperty("immediateActions");
    expect(result).toHaveProperty("regulatoryLinks");
  });

  it("achieves good or outstanding rating", () => {
    expect(["good", "outstanding"]).toContain(result.rating);
  });

  it("scores at least 60", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
  });

  it("produces inadequate with no data", () => {
    const empty = generateStaffTrainingIntelligence([], [], [], "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(empty.rating).toBe("inadequate");
    expect(empty.overallScore).toBe(0);
  });

  it("links to Reg 32", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 32"))).toBe(true);
  });

  it("links to Reg 33", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 33"))).toBe(true);
  });

  it("links to SCCIF", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("identifies certification strength when none expired", () => {
    expect(result.strengths.some((s) => s.toLowerCase().includes("certific"))).toBe(true);
  });

  it("identifies qualification strength", () => {
    expect(result.strengths.some((s) => s.toLowerCase().includes("qualific"))).toBe(true);
  });

  it("identifies specialist coverage gap", () => {
    expect(result.areasForDevelopment.some((a) => a.toLowerCase().includes("need"))).toBe(true);
  });

  it("generates no urgent actions with demo data", () => {
    // No expired certs, no missing safeguarding, RM has Level 5
    expect(result.immediateActions.some((a) => a.includes("URGENT"))).toBe(false);
  });

  it("generates urgent for missing safeguarding training", () => {
    const staffNoSafeguarding: StaffMember[] = [
      { id: "s1", name: "S1", role: "rsw", startDate: "2025-01-01", qualificationLevel: "level_3_diploma", isPlaced: true },
    ];
    const r = generateStaffTrainingIntelligence(staffNoSafeguarding, [], [], "home", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.immediateActions.some((a) => a.includes("safeguarding"))).toBe(true);
  });

  it("generates urgent for expired certifications", () => {
    const expiredRecs: TrainingRecord[] = [
      { id: "exp1", staffId: "s1", staffName: "S1", category: "first_aid", courseName: "FA",
        completedDate: "2020-01-01", expiryDate: "2023-01-01", hoursCompleted: 12, provider: "X" },
    ];
    const r = generateStaffTrainingIntelligence(demoStaff, expiredRecs, [], "home", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.immediateActions.some((a) => a.includes("expired"))).toBe(true);
  });

  it("generates urgent for unqualified RM", () => {
    const badStaff: StaffMember[] = [
      { id: "bad-rm", name: "Bad RM", role: "registered_manager", startDate: "2024-01-01", qualificationLevel: "none", isPlaced: true },
    ];
    const r = generateStaffTrainingIntelligence(badStaff, [], [], "home", PERIOD_START, PERIOD_END, REFERENCE_DATE);
    expect(r.immediateActions.some((a) => a.includes("Level 5"))).toBe(true);
  });

  it("includes 4 staff profiles", () => {
    expect(result.staffProfiles.length).toBe(4);
  });
});

describe("Staff Training — Labels", () => {
  it("returns Safeguarding label", () => {
    expect(getCategoryLabel("safeguarding")).toBe("Safeguarding");
  });

  it("returns First Aid label", () => {
    expect(getCategoryLabel("first_aid")).toBe("First Aid");
  });

  it("returns Physical Intervention label", () => {
    expect(getCategoryLabel("physical_intervention")).toBe("Physical Intervention");
  });

  it("returns Fire Safety label", () => {
    expect(getCategoryLabel("fire_safety")).toBe("Fire Safety");
  });

  it("returns Medication Administration label", () => {
    expect(getCategoryLabel("medication_administration")).toBe("Medication Administration");
  });

  it("returns Attachment & Trauma label", () => {
    expect(getCategoryLabel("attachment_trauma")).toBe("Attachment & Trauma");
  });

  it("returns PACE label", () => {
    expect(getCategoryLabel("therapeutic_parenting")).toBe("Therapeutic Parenting / PACE");
  });

  it("returns CSE/A label", () => {
    expect(getCategoryLabel("csea")).toBe("CSE/A Awareness");
  });

  it("returns Registered Manager role label", () => {
    expect(getRoleLabel("registered_manager")).toBe("Registered Manager");
  });

  it("returns RSW role label", () => {
    expect(getRoleLabel("rsw")).toBe("Residential Support Worker");
  });

  it("returns Senior RSW role label", () => {
    expect(getRoleLabel("senior_rsw")).toBe("Senior RSW");
  });

  it("returns mandatory categories list", () => {
    const cats = getMandatoryCategories();
    expect(cats.length).toBe(8);
    expect(cats).toContain("safeguarding");
    expect(cats).toContain("first_aid");
  });
});
