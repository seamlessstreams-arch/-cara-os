import { describe, it, expect } from "vitest";
import { getCompetenceWarnings } from "../competence-warnings";
import type { StaffCompetenceRecord } from "@/types/intelligence.layer";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

const healthyRecord: StaffCompetenceRecord = {
  id: "rec-1",
  staffId: "staff-1",
  homeId: "home-1",
  saferRecruitmentComplete: true,
  dbsStatus: "current",
  dbsDate: daysAgo(100),
  dbsUpdateService: true,
  referencesReceived: true,
  referenceCount: 2,
  rightToWork: true,
  inductionComplete: true,
  inductionDate: daysAgo(200),
  probationStatus: "passed",
  probationEndDate: daysAgo(100),
  level3Status: "achieved",
  mandatoryTrainingComplete: true,
  safeguardingTrainingDate: daysAgo(100),
  medicationCompetency: true,
  medicationCompetencyDate: daysAgo(90),
  physicalInterventionTrained: true,
  physicalInterventionDate: daysAgo(90),
  lastSupervisionDate: daysAgo(14),
  supervisionFrequencyWeeks: 4,
  lastAppraisalDate: daysAgo(180),
  canLeadShift: true,
  canAdministerMedication: true,
  canLoneWork: true,
  canSuperviseOthers: true,
  restrictions: [],
  compliments: [],
  performanceConcerns: [],
  roleCompetencies: {},
  createdAt: daysAgo(365),
  updatedAt: daysAgo(1),
};

describe("getCompetenceWarnings", () => {
  it("returns no warnings for a fully competent staff member", () => {
    const warnings = getCompetenceWarnings(healthyRecord);
    expect(warnings).toHaveLength(0);
  });

  it("flags cannot_lead_shift when canLeadShift is false", () => {
    const record: StaffCompetenceRecord = {
      ...healthyRecord,
      canLeadShift: false,
      inductionComplete: false,
    };
    const warnings = getCompetenceWarnings(record);
    const w = warnings.find((w) => w.type === "cannot_lead_shift");
    expect(w).toBeDefined();
    expect(w?.severity).toBe("high");
    expect(w?.detail).toContain("induction not complete");
  });

  it("flags cannot_administer_medication", () => {
    const record: StaffCompetenceRecord = {
      ...healthyRecord,
      canAdministerMedication: false,
      medicationCompetency: false,
    };
    const warnings = getCompetenceWarnings(record);
    expect(warnings.some((w) => w.type === "cannot_administer_medication")).toBe(true);
  });

  it("flags cannot_lone_work", () => {
    const record: StaffCompetenceRecord = {
      ...healthyRecord,
      canLoneWork: false,
    };
    const warnings = getCompetenceWarnings(record);
    expect(warnings.some((w) => w.type === "cannot_lone_work")).toBe(true);
  });

  it("flags dbs_expired as critical", () => {
    const record: StaffCompetenceRecord = {
      ...healthyRecord,
      dbsStatus: "expired",
    };
    const warnings = getCompetenceWarnings(record);
    const w = warnings.find((w) => w.type === "dbs_expired");
    expect(w).toBeDefined();
    expect(w?.severity).toBe("critical");
  });

  it("flags dbs_due_renewal as high", () => {
    const record: StaffCompetenceRecord = {
      ...healthyRecord,
      dbsStatus: "due_renewal",
    };
    const warnings = getCompetenceWarnings(record);
    const w = warnings.find((w) => w.type === "dbs_due_renewal");
    expect(w).toBeDefined();
    expect(w?.severity).toBe("high");
  });

  it("flags supervision_overdue based on frequency", () => {
    const record: StaffCompetenceRecord = {
      ...healthyRecord,
      lastSupervisionDate: daysAgo(50),
      supervisionFrequencyWeeks: 4,
    };
    const warnings = getCompetenceWarnings(record);
    expect(warnings.some((w) => w.type === "supervision_overdue")).toBe(true);
  });

  it("escalates supervision to high when >2x overdue", () => {
    const record: StaffCompetenceRecord = {
      ...healthyRecord,
      lastSupervisionDate: daysAgo(70),
      supervisionFrequencyWeeks: 4,
    };
    const warnings = getCompetenceWarnings(record);
    const w = warnings.find((w) => w.type === "supervision_overdue");
    expect(w?.severity).toBe("high");
  });

  it("flags mandatory training incomplete", () => {
    const record: StaffCompetenceRecord = {
      ...healthyRecord,
      mandatoryTrainingComplete: false,
    };
    const warnings = getCompetenceWarnings(record);
    expect(warnings.some((w) => w.type === "training_expired" && w.title.includes("Mandatory"))).toBe(true);
  });

  it("flags safeguarding training overdue for refresher (>365 days)", () => {
    const record: StaffCompetenceRecord = {
      ...healthyRecord,
      safeguardingTrainingDate: daysAgo(400),
    };
    const warnings = getCompetenceWarnings(record);
    expect(warnings.some((w) => w.title.includes("Safeguarding training overdue"))).toBe(true);
  });

  it("flags probation_review_overdue when past end date", () => {
    const record: StaffCompetenceRecord = {
      ...healthyRecord,
      probationStatus: "in_progress",
      probationEndDate: daysAgo(10),
    };
    const warnings = getCompetenceWarnings(record);
    expect(warnings.some((w) => w.type === "probation_review_overdue")).toBe(true);
  });

  it("flags induction_incomplete", () => {
    const record: StaffCompetenceRecord = {
      ...healthyRecord,
      canLeadShift: true,
      inductionComplete: false,
    };
    const warnings = getCompetenceWarnings(record);
    expect(warnings.some((w) => w.type === "induction_incomplete")).toBe(true);
  });

  it("flags each active restriction", () => {
    const record: StaffCompetenceRecord = {
      ...healthyRecord,
      restrictions: ["Cannot work with Child A", "No lone working with under-12s"],
    };
    const warnings = getCompetenceWarnings(record);
    const restrictionWarnings = warnings.filter((w) => w.type === "restriction_active");
    expect(restrictionWarnings).toHaveLength(2);
    expect(restrictionWarnings[0].detail).toBe("Cannot work with Child A");
  });
});
