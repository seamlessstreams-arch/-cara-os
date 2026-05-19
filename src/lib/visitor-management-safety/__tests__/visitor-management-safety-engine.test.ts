// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Visitor Management Safety Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateVisitorCompliance,
  evaluatePolicyAdherence,
  evaluateIncidentManagement,
  evaluateStaffVisitorReadiness,
  buildChildVisitorProfiles,
  generateVisitorManagementSafetyIntelligence,
  getRating,
  getVisitorTypeLabel,
  getVisitPurposeLabel,
  getVerificationStatusLabel,
  getVisitOutcomeLabel,
  getRatingLabel,
  getIncidentTypeLabel,
} from "../visitor-management-safety-engine";
import type {
  VisitorRecord,
  VisitorPolicy,
  VisitorIncident,
  StaffVisitorTraining,
} from "../visitor-management-safety-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const makeRecord = (overrides: Partial<VisitorRecord> = {}): VisitorRecord => ({
  id: "vr-001",
  visitorName: "Jane Smith",
  visitorType: "parent",
  visitDate: "2026-03-15",
  visitPurpose: "contact",
  childId: "child-alex",
  childName: "Alex",
  signedIn: true,
  signedOut: true,
  idChecked: true,
  dbsVerified: "verified",
  supervisedVisit: true,
  staffPresent: "Sarah Johnson",
  visitOutcome: "completed",
  safeguardingBriefGiven: true,
  ...overrides,
});

const makePolicy = (overrides: Partial<VisitorPolicy> = {}): VisitorPolicy => ({
  id: "pol-001",
  policyReviewDate: "2026-01-15",
  signInSystemInPlace: true,
  idCheckMandatory: true,
  dbsCheckRequired: true,
  safeguardingBriefRequired: true,
  visitorGuideAvailable: true,
  restrictedVisitorListMaintained: true,
  ...overrides,
});

const makeIncident = (overrides: Partial<VisitorIncident> = {}): VisitorIncident => ({
  id: "inc-001",
  incidentDate: "2026-03-20",
  visitorName: "Unknown Visitor",
  incidentType: "policy_breach",
  actionTaken: "Visitor escorted off premises",
  reportedTo: "Registered Manager",
  resolved: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffVisitorTraining> = {}): StaffVisitorTraining => ({
  id: "tr-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  visitorPolicyTrained: true,
  safeguardingVisitors: true,
  signInProcedures: true,
  dbsCheckProcess: true,
  incidentReporting: true,
  restrictedVisitorAwareness: true,
  ...overrides,
});

// ── Oak House Demo Data ────────────────────────────────────────────────────

const oakHouseRecords: VisitorRecord[] = [
  makeRecord({
    id: "vr-001", visitorName: "Jane Smith", visitorType: "parent",
    visitDate: "2026-02-10", visitPurpose: "contact", childId: "child-alex",
    childName: "Alex", staffPresent: "Sarah Johnson", visitOutcome: "completed",
  }),
  makeRecord({
    id: "vr-002", visitorName: "Dr Emily Carter", visitorType: "social_worker",
    visitDate: "2026-02-20", visitPurpose: "review", childId: "child-jordan",
    childName: "Jordan", staffPresent: "Tom Richards", visitOutcome: "completed",
  }),
  makeRecord({
    id: "vr-003", visitorName: "Mark Thompson", visitorType: "professional",
    visitDate: "2026-03-05", visitPurpose: "therapy", childId: "child-morgan",
    childName: "Morgan", staffPresent: "Sarah Johnson", visitOutcome: "completed",
  }),
  makeRecord({
    id: "vr-004", visitorName: "Jane Smith", visitorType: "parent",
    visitDate: "2026-03-18", visitPurpose: "contact", childId: "child-alex",
    childName: "Alex", staffPresent: "Darren Laville", visitOutcome: "completed",
  }),
  makeRecord({
    id: "vr-005", visitorName: "Lisa Brown", visitorType: "family_member",
    visitDate: "2026-04-01", visitPurpose: "social", childId: "child-jordan",
    childName: "Jordan", staffPresent: "Tom Richards", visitOutcome: "completed",
  }),
  makeRecord({
    id: "vr-006", visitorName: "James Wilson", visitorType: "inspector",
    visitDate: "2026-04-15", visitPurpose: "inspection",
    dbsVerified: "not_required", staffPresent: "Darren Laville",
    visitOutcome: "completed",
  }),
];

const oakHousePolicy: VisitorPolicy[] = [
  makePolicy({ id: "pol-001", policyReviewDate: "2026-01-15" }),
];

const oakHouseIncidents: VisitorIncident[] = [];

const oakHouseTraining: StaffVisitorTraining[] = [
  makeTraining({ id: "tr-001", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
  makeTraining({ id: "tr-002", staffId: "staff-tom", staffName: "Tom Richards" }),
  makeTraining({ id: "tr-003", staffId: "staff-darren", staffName: "Darren Laville" }),
  makeTraining({ id: "tr-004", staffId: "staff-emma", staffName: "Emma Clarke" }),
];

const oakHouseChildIds = ["child-alex", "child-jordan", "child-morgan"];
const oakHouseChildNames: Record<string, string> = {
  "child-alex": "Alex",
  "child-jordan": "Jordan",
  "child-morgan": "Morgan",
};

// ══════════════════════════════════════════════════════════════════════════════
// 1. VISITOR COMPLIANCE
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateVisitorCompliance", () => {
  it("returns zeroed result for empty records array", () => {
    const result = evaluateVisitorCompliance([]);
    expect(result.totalRecords).toBe(0);
    expect(result.visitorComplianceScore).toBe(0);
    expect(result.signInRate).toBe(0);
    expect(result.signOutRate).toBe(0);
    expect(result.idCheckRate).toBe(0);
    expect(result.dbsVerifiedRate).toBe(0);
    expect(result.safeguardingBriefRate).toBe(0);
    expect(result.supervisedRate).toBe(0);
  });

  it("returns empty breakdown objects for empty array", () => {
    const result = evaluateVisitorCompliance([]);
    expect(result.visitsByType).toEqual({});
    expect(result.visitsByPurpose).toEqual({});
    expect(result.visitsByOutcome).toEqual({});
  });

  it("scores 25/25 when all records are fully compliant", () => {
    const records = [makeRecord(), makeRecord({ id: "vr-002" })];
    const result = evaluateVisitorCompliance(records);
    expect(result.visitorComplianceScore).toBe(25);
  });

  it("calculates correct sign-in rate", () => {
    const records = [
      makeRecord({ id: "vr-001", signedIn: true }),
      makeRecord({ id: "vr-002", signedIn: false }),
    ];
    const result = evaluateVisitorCompliance(records);
    expect(result.signInRate).toBe(50);
  });

  it("calculates correct sign-out rate", () => {
    const records = [
      makeRecord({ id: "vr-001", signedOut: true }),
      makeRecord({ id: "vr-002", signedOut: false }),
      makeRecord({ id: "vr-003", signedOut: false }),
    ];
    const result = evaluateVisitorCompliance(records);
    expect(result.signOutRate).toBe(33);
  });

  it("calculates correct ID check rate", () => {
    const records = [
      makeRecord({ id: "vr-001", idChecked: true }),
      makeRecord({ id: "vr-002", idChecked: true }),
      makeRecord({ id: "vr-003", idChecked: false }),
    ];
    const result = evaluateVisitorCompliance(records);
    expect(result.idCheckRate).toBe(67);
  });

  it("counts not_required as compliant for DBS verified rate", () => {
    const records = [
      makeRecord({ id: "vr-001", dbsVerified: "verified" }),
      makeRecord({ id: "vr-002", dbsVerified: "not_required" }),
    ];
    const result = evaluateVisitorCompliance(records);
    expect(result.dbsVerifiedRate).toBe(100);
  });

  it("counts pending as non-compliant for DBS verified rate", () => {
    const records = [
      makeRecord({ id: "vr-001", dbsVerified: "verified" }),
      makeRecord({ id: "vr-002", dbsVerified: "pending" }),
    ];
    const result = evaluateVisitorCompliance(records);
    expect(result.dbsVerifiedRate).toBe(50);
  });

  it("counts expired as non-compliant for DBS verified rate", () => {
    const records = [
      makeRecord({ id: "vr-001", dbsVerified: "expired" }),
    ];
    const result = evaluateVisitorCompliance(records);
    expect(result.dbsVerifiedRate).toBe(0);
  });

  it("counts failed as non-compliant for DBS verified rate", () => {
    const records = [
      makeRecord({ id: "vr-001", dbsVerified: "failed" }),
    ];
    const result = evaluateVisitorCompliance(records);
    expect(result.dbsVerifiedRate).toBe(0);
  });

  it("calculates correct safeguarding brief rate", () => {
    const records = [
      makeRecord({ id: "vr-001", safeguardingBriefGiven: true }),
      makeRecord({ id: "vr-002", safeguardingBriefGiven: false }),
    ];
    const result = evaluateVisitorCompliance(records);
    expect(result.safeguardingBriefRate).toBe(50);
  });

  it("calculates correct supervised rate", () => {
    const records = [
      makeRecord({ id: "vr-001", supervisedVisit: true }),
      makeRecord({ id: "vr-002", supervisedVisit: true }),
      makeRecord({ id: "vr-003", supervisedVisit: false }),
    ];
    const result = evaluateVisitorCompliance(records);
    expect(result.supervisedRate).toBe(67);
  });

  it("populates visitsByType correctly", () => {
    const records = [
      makeRecord({ id: "vr-001", visitorType: "parent" }),
      makeRecord({ id: "vr-002", visitorType: "parent" }),
      makeRecord({ id: "vr-003", visitorType: "social_worker" }),
    ];
    const result = evaluateVisitorCompliance(records);
    expect(result.visitsByType).toEqual({ parent: 2, social_worker: 1 });
  });

  it("populates visitsByPurpose correctly", () => {
    const records = [
      makeRecord({ id: "vr-001", visitPurpose: "contact" }),
      makeRecord({ id: "vr-002", visitPurpose: "therapy" }),
      makeRecord({ id: "vr-003", visitPurpose: "contact" }),
    ];
    const result = evaluateVisitorCompliance(records);
    expect(result.visitsByPurpose).toEqual({ contact: 2, therapy: 1 });
  });

  it("populates visitsByOutcome correctly", () => {
    const records = [
      makeRecord({ id: "vr-001", visitOutcome: "completed" }),
      makeRecord({ id: "vr-002", visitOutcome: "refused" }),
    ];
    const result = evaluateVisitorCompliance(records);
    expect(result.visitsByOutcome).toEqual({ completed: 1, refused: 1 });
  });

  it("returns score 0 when all compliance fields are false", () => {
    const records = [
      makeRecord({
        signedIn: false,
        signedOut: false,
        idChecked: false,
        dbsVerified: "failed",
        safeguardingBriefGiven: false,
      }),
    ];
    const result = evaluateVisitorCompliance(records);
    expect(result.visitorComplianceScore).toBe(0);
  });

  it("scores proportionally for partial compliance", () => {
    const records = [
      makeRecord({ id: "vr-001" }),
      makeRecord({
        id: "vr-002",
        signedIn: false,
        signedOut: false,
        idChecked: false,
        dbsVerified: "pending",
        safeguardingBriefGiven: false,
      }),
    ];
    const result = evaluateVisitorCompliance(records);
    expect(result.visitorComplianceScore).toBeGreaterThan(0);
    expect(result.visitorComplianceScore).toBeLessThan(25);
  });

  it("never exceeds 25", () => {
    const records = Array.from({ length: 50 }, (_, i) =>
      makeRecord({ id: `vr-${i}` }),
    );
    const result = evaluateVisitorCompliance(records);
    expect(result.visitorComplianceScore).toBeLessThanOrEqual(25);
  });

  it("correctly counts total records", () => {
    const records = [
      makeRecord({ id: "vr-001" }),
      makeRecord({ id: "vr-002" }),
      makeRecord({ id: "vr-003" }),
    ];
    const result = evaluateVisitorCompliance(records);
    expect(result.totalRecords).toBe(3);
  });

  it("handles single record correctly", () => {
    const result = evaluateVisitorCompliance([makeRecord()]);
    expect(result.totalRecords).toBe(1);
    expect(result.signInRate).toBe(100);
    expect(result.visitorComplianceScore).toBe(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. POLICY ADHERENCE
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePolicyAdherence", () => {
  it("returns zeroed result for empty policies array", () => {
    const result = evaluatePolicyAdherence([]);
    expect(result.totalPolicies).toBe(0);
    expect(result.policyAdherenceScore).toBe(0);
    expect(result.signInSystemRate).toBe(0);
    expect(result.idCheckMandatoryRate).toBe(0);
    expect(result.dbsCheckRequiredRate).toBe(0);
    expect(result.safeguardingBriefRequiredRate).toBe(0);
    expect(result.visitorGuideRate).toBe(0);
    expect(result.restrictedListRate).toBe(0);
  });

  it("scores 25/25 when all policies are fully compliant", () => {
    const policies = [makePolicy()];
    const result = evaluatePolicyAdherence(policies);
    expect(result.policyAdherenceScore).toBe(25);
  });

  it("scores 0 when all policy fields are false", () => {
    const policies = [
      makePolicy({
        signInSystemInPlace: false,
        idCheckMandatory: false,
        dbsCheckRequired: false,
        safeguardingBriefRequired: false,
        visitorGuideAvailable: false,
        restrictedVisitorListMaintained: false,
      }),
    ];
    const result = evaluatePolicyAdherence(policies);
    expect(result.policyAdherenceScore).toBe(0);
  });

  it("calculates correct sign-in system rate", () => {
    const policies = [
      makePolicy({ id: "pol-001", signInSystemInPlace: true }),
      makePolicy({ id: "pol-002", signInSystemInPlace: false }),
    ];
    const result = evaluatePolicyAdherence(policies);
    expect(result.signInSystemRate).toBe(50);
  });

  it("calculates correct ID check mandatory rate", () => {
    const policies = [
      makePolicy({ id: "pol-001", idCheckMandatory: true }),
      makePolicy({ id: "pol-002", idCheckMandatory: false }),
      makePolicy({ id: "pol-003", idCheckMandatory: true }),
    ];
    const result = evaluatePolicyAdherence(policies);
    expect(result.idCheckMandatoryRate).toBe(67);
  });

  it("calculates correct DBS check required rate", () => {
    const policies = [
      makePolicy({ id: "pol-001", dbsCheckRequired: true }),
      makePolicy({ id: "pol-002", dbsCheckRequired: false }),
    ];
    const result = evaluatePolicyAdherence(policies);
    expect(result.dbsCheckRequiredRate).toBe(50);
  });

  it("calculates correct safeguarding brief required rate", () => {
    const policies = [
      makePolicy({ id: "pol-001", safeguardingBriefRequired: true }),
      makePolicy({ id: "pol-002", safeguardingBriefRequired: false }),
    ];
    const result = evaluatePolicyAdherence(policies);
    expect(result.safeguardingBriefRequiredRate).toBe(50);
  });

  it("calculates correct visitor guide rate", () => {
    const policies = [
      makePolicy({ id: "pol-001", visitorGuideAvailable: true }),
      makePolicy({ id: "pol-002", visitorGuideAvailable: false }),
    ];
    const result = evaluatePolicyAdherence(policies);
    expect(result.visitorGuideRate).toBe(50);
  });

  it("calculates correct restricted list rate", () => {
    const policies = [
      makePolicy({ id: "pol-001", restrictedVisitorListMaintained: true }),
      makePolicy({ id: "pol-002", restrictedVisitorListMaintained: true }),
      makePolicy({ id: "pol-003", restrictedVisitorListMaintained: false }),
    ];
    const result = evaluatePolicyAdherence(policies);
    expect(result.restrictedListRate).toBe(67);
  });

  it("never exceeds 25", () => {
    const policies = Array.from({ length: 20 }, (_, i) =>
      makePolicy({ id: `pol-${i}` }),
    );
    const result = evaluatePolicyAdherence(policies);
    expect(result.policyAdherenceScore).toBeLessThanOrEqual(25);
  });

  it("scores proportionally for partial compliance", () => {
    const policies = [
      makePolicy({
        signInSystemInPlace: true,
        idCheckMandatory: true,
        dbsCheckRequired: false,
        safeguardingBriefRequired: false,
        visitorGuideAvailable: false,
        restrictedVisitorListMaintained: false,
      }),
    ];
    const result = evaluatePolicyAdherence(policies);
    expect(result.policyAdherenceScore).toBeGreaterThan(0);
    expect(result.policyAdherenceScore).toBeLessThan(25);
  });

  it("handles multiple fully compliant policies", () => {
    const policies = [
      makePolicy({ id: "pol-001" }),
      makePolicy({ id: "pol-002" }),
    ];
    const result = evaluatePolicyAdherence(policies);
    expect(result.totalPolicies).toBe(2);
    expect(result.policyAdherenceScore).toBe(25);
  });

  it("handles single policy correctly", () => {
    const result = evaluatePolicyAdherence([makePolicy()]);
    expect(result.totalPolicies).toBe(1);
    expect(result.policyAdherenceScore).toBe(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. INCIDENT MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIncidentManagement", () => {
  it("returns score 25 for empty incidents (no incidents = excellent)", () => {
    const result = evaluateIncidentManagement([]);
    expect(result.totalIncidents).toBe(0);
    expect(result.incidentManagementScore).toBe(25);
  });

  it("returns zeroed rates for empty incidents", () => {
    const result = evaluateIncidentManagement([]);
    expect(result.resolvedRate).toBe(0);
    expect(result.reportedRate).toBe(0);
    expect(result.unauthorisedAccessCount).toBe(0);
    expect(result.safeguardingConcernCount).toBe(0);
  });

  it("returns empty byType for no incidents", () => {
    const result = evaluateIncidentManagement([]);
    expect(result.byType).toEqual({});
  });

  it("calculates correct resolved rate", () => {
    const incidents = [
      makeIncident({ id: "inc-001", resolved: true }),
      makeIncident({ id: "inc-002", resolved: false }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.resolvedRate).toBe(50);
  });

  it("calculates correct reported rate", () => {
    const incidents = [
      makeIncident({ id: "inc-001", reportedTo: "Manager" }),
      makeIncident({ id: "inc-002", reportedTo: "" }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.reportedRate).toBe(50);
  });

  it("treats whitespace-only reportedTo as not reported", () => {
    const incidents = [
      makeIncident({ id: "inc-001", reportedTo: "   " }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.reportedRate).toBe(0);
  });

  it("counts unauthorised access incidents", () => {
    const incidents = [
      makeIncident({ id: "inc-001", incidentType: "unauthorised_access" }),
      makeIncident({ id: "inc-002", incidentType: "unauthorised_access" }),
      makeIncident({ id: "inc-003", incidentType: "policy_breach" }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.unauthorisedAccessCount).toBe(2);
  });

  it("counts safeguarding concern incidents", () => {
    const incidents = [
      makeIncident({ id: "inc-001", incidentType: "safeguarding_concern" }),
      makeIncident({ id: "inc-002", incidentType: "complaint" }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.safeguardingConcernCount).toBe(1);
  });

  it("populates byType correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-001", incidentType: "policy_breach" }),
      makeIncident({ id: "inc-002", incidentType: "policy_breach" }),
      makeIncident({ id: "inc-003", incidentType: "complaint" }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.byType).toEqual({ policy_breach: 2, complaint: 1 });
  });

  it("scores high when all incidents are resolved and reported with no severe types", () => {
    const incidents = [
      makeIncident({
        id: "inc-001",
        incidentType: "complaint",
        resolved: true,
        reportedTo: "Manager",
      }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.incidentManagementScore).toBeGreaterThanOrEqual(20);
  });

  it("scores lower when incidents include unauthorised access", () => {
    const incidents = [
      makeIncident({
        id: "inc-001",
        incidentType: "unauthorised_access",
        resolved: true,
        reportedTo: "Manager",
      }),
    ];
    const result = evaluateIncidentManagement(incidents);
    // No unauthorised bonus = 0, so lower score
    const noAccessIncidents = [
      makeIncident({
        id: "inc-001",
        incidentType: "complaint",
        resolved: true,
        reportedTo: "Manager",
      }),
    ];
    const resultNoAccess = evaluateIncidentManagement(noAccessIncidents);
    expect(result.incidentManagementScore).toBeLessThan(resultNoAccess.incidentManagementScore);
  });

  it("scores lower when incidents include safeguarding concerns", () => {
    const incidents = [
      makeIncident({
        id: "inc-001",
        incidentType: "safeguarding_concern",
        resolved: true,
        reportedTo: "Manager",
      }),
    ];
    const result = evaluateIncidentManagement(incidents);
    const noSafeguardingIncidents = [
      makeIncident({
        id: "inc-001",
        incidentType: "complaint",
        resolved: true,
        reportedTo: "Manager",
      }),
    ];
    const resultNoSafeguarding = evaluateIncidentManagement(noSafeguardingIncidents);
    expect(result.incidentManagementScore).toBeLessThan(resultNoSafeguarding.incidentManagementScore);
  });

  it("scores 0 when incidents are unresolved, unreported, and severe", () => {
    const incidents = [
      makeIncident({
        id: "inc-001",
        incidentType: "unauthorised_access",
        resolved: false,
        reportedTo: "",
      }),
      makeIncident({
        id: "inc-002",
        incidentType: "safeguarding_concern",
        resolved: false,
        reportedTo: "",
      }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.incidentManagementScore).toBe(0);
  });

  it("never exceeds 25", () => {
    const incidents = [
      makeIncident({ id: "inc-001", incidentType: "complaint", resolved: true, reportedTo: "Manager" }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.incidentManagementScore).toBeLessThanOrEqual(25);
  });

  it("correctly counts total incidents", () => {
    const incidents = [
      makeIncident({ id: "inc-001" }),
      makeIncident({ id: "inc-002" }),
      makeIncident({ id: "inc-003" }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.totalIncidents).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. STAFF VISITOR READINESS
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffVisitorReadiness", () => {
  it("returns zeroed result for empty training array", () => {
    const result = evaluateStaffVisitorReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.staffVisitorReadinessScore).toBe(0);
    expect(result.visitorPolicyTrainedRate).toBe(0);
    expect(result.safeguardingVisitorsRate).toBe(0);
    expect(result.signInProceduresRate).toBe(0);
    expect(result.dbsCheckProcessRate).toBe(0);
    expect(result.incidentReportingRate).toBe(0);
    expect(result.restrictedVisitorAwarenessRate).toBe(0);
  });

  it("scores 25/25 when all staff are fully trained", () => {
    const training = [makeTraining()];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.staffVisitorReadinessScore).toBe(25);
  });

  it("scores 0 when no staff have any training", () => {
    const training = [
      makeTraining({
        visitorPolicyTrained: false,
        safeguardingVisitors: false,
        signInProcedures: false,
        dbsCheckProcess: false,
        incidentReporting: false,
        restrictedVisitorAwareness: false,
      }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.staffVisitorReadinessScore).toBe(0);
  });

  it("calculates correct visitor policy trained rate", () => {
    const training = [
      makeTraining({ id: "tr-001", visitorPolicyTrained: true }),
      makeTraining({ id: "tr-002", visitorPolicyTrained: false }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.visitorPolicyTrainedRate).toBe(50);
  });

  it("calculates correct safeguarding visitors rate", () => {
    const training = [
      makeTraining({ id: "tr-001", safeguardingVisitors: true }),
      makeTraining({ id: "tr-002", safeguardingVisitors: false }),
      makeTraining({ id: "tr-003", safeguardingVisitors: true }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.safeguardingVisitorsRate).toBe(67);
  });

  it("calculates correct sign-in procedures rate", () => {
    const training = [
      makeTraining({ id: "tr-001", signInProcedures: true }),
      makeTraining({ id: "tr-002", signInProcedures: false }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.signInProceduresRate).toBe(50);
  });

  it("calculates correct DBS check process rate", () => {
    const training = [
      makeTraining({ id: "tr-001", dbsCheckProcess: true }),
      makeTraining({ id: "tr-002", dbsCheckProcess: true }),
      makeTraining({ id: "tr-003", dbsCheckProcess: false }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.dbsCheckProcessRate).toBe(67);
  });

  it("calculates correct incident reporting rate", () => {
    const training = [
      makeTraining({ id: "tr-001", incidentReporting: true }),
      makeTraining({ id: "tr-002", incidentReporting: false }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.incidentReportingRate).toBe(50);
  });

  it("calculates correct restricted visitor awareness rate", () => {
    const training = [
      makeTraining({ id: "tr-001", restrictedVisitorAwareness: true }),
      makeTraining({ id: "tr-002", restrictedVisitorAwareness: false }),
      makeTraining({ id: "tr-003", restrictedVisitorAwareness: false }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.restrictedVisitorAwarenessRate).toBe(33);
  });

  it("scores proportionally for partial training", () => {
    const training = [
      makeTraining({
        visitorPolicyTrained: true,
        safeguardingVisitors: true,
        signInProcedures: false,
        dbsCheckProcess: false,
        incidentReporting: false,
        restrictedVisitorAwareness: false,
      }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.staffVisitorReadinessScore).toBeGreaterThan(0);
    expect(result.staffVisitorReadinessScore).toBeLessThan(25);
  });

  it("never exceeds 25", () => {
    const training = Array.from({ length: 30 }, (_, i) =>
      makeTraining({ id: `tr-${i}`, staffId: `staff-${i}`, staffName: `Staff ${i}` }),
    );
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.staffVisitorReadinessScore).toBeLessThanOrEqual(25);
  });

  it("correctly counts total staff", () => {
    const training = [
      makeTraining({ id: "tr-001" }),
      makeTraining({ id: "tr-002" }),
    ];
    const result = evaluateStaffVisitorReadiness(training);
    expect(result.totalStaff).toBe(2);
  });

  it("handles single staff member correctly", () => {
    const result = evaluateStaffVisitorReadiness([makeTraining()]);
    expect(result.totalStaff).toBe(1);
    expect(result.staffVisitorReadinessScore).toBe(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. CHILD VISITOR PROFILES
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildVisitorProfiles", () => {
  it("returns empty array for no children", () => {
    const result = buildChildVisitorProfiles([], {}, []);
    expect(result).toEqual([]);
  });

  it("returns profile with zero visits when child has no records", () => {
    const result = buildChildVisitorProfiles(
      ["child-alex"],
      { "child-alex": "Alex" },
      [],
    );
    expect(result).toHaveLength(1);
    expect(result[0].childId).toBe("child-alex");
    expect(result[0].childName).toBe("Alex");
    expect(result[0].totalVisits).toBe(0);
    expect(result[0].safetyScore).toBe(0);
  });

  it("uses childId as name when name not provided", () => {
    const result = buildChildVisitorProfiles(["child-unknown"], {}, []);
    expect(result[0].childName).toBe("child-unknown");
  });

  it("correctly counts total visits for a child", () => {
    const records = [
      makeRecord({ id: "vr-001", childId: "child-alex" }),
      makeRecord({ id: "vr-002", childId: "child-alex" }),
      makeRecord({ id: "vr-003", childId: "child-jordan" }),
    ];
    const result = buildChildVisitorProfiles(
      ["child-alex"],
      { "child-alex": "Alex" },
      records,
    );
    expect(result[0].totalVisits).toBe(2);
  });

  it("collects unique visitor types", () => {
    const records = [
      makeRecord({ id: "vr-001", childId: "child-alex", visitorType: "parent" }),
      makeRecord({ id: "vr-002", childId: "child-alex", visitorType: "parent" }),
      makeRecord({ id: "vr-003", childId: "child-alex", visitorType: "social_worker" }),
    ];
    const result = buildChildVisitorProfiles(
      ["child-alex"],
      { "child-alex": "Alex" },
      records,
    );
    expect(result[0].visitorTypes).toContain("parent");
    expect(result[0].visitorTypes).toContain("social_worker");
    expect(result[0].visitorTypes).toHaveLength(2);
  });

  it("collects unique visit purposes", () => {
    const records = [
      makeRecord({ id: "vr-001", childId: "child-alex", visitPurpose: "contact" }),
      makeRecord({ id: "vr-002", childId: "child-alex", visitPurpose: "contact" }),
      makeRecord({ id: "vr-003", childId: "child-alex", visitPurpose: "therapy" }),
    ];
    const result = buildChildVisitorProfiles(
      ["child-alex"],
      { "child-alex": "Alex" },
      records,
    );
    expect(result[0].visitPurposes).toContain("contact");
    expect(result[0].visitPurposes).toContain("therapy");
    expect(result[0].visitPurposes).toHaveLength(2);
  });

  it("calculates correct sign-in rate per child", () => {
    const records = [
      makeRecord({ id: "vr-001", childId: "child-alex", signedIn: true }),
      makeRecord({ id: "vr-002", childId: "child-alex", signedIn: false }),
    ];
    const result = buildChildVisitorProfiles(
      ["child-alex"],
      { "child-alex": "Alex" },
      records,
    );
    expect(result[0].signedInRate).toBe(50);
  });

  it("calculates correct ID checked rate per child", () => {
    const records = [
      makeRecord({ id: "vr-001", childId: "child-alex", idChecked: true }),
      makeRecord({ id: "vr-002", childId: "child-alex", idChecked: false }),
    ];
    const result = buildChildVisitorProfiles(
      ["child-alex"],
      { "child-alex": "Alex" },
      records,
    );
    expect(result[0].idCheckedRate).toBe(50);
  });

  it("calculates correct DBS verified rate per child", () => {
    const records = [
      makeRecord({ id: "vr-001", childId: "child-alex", dbsVerified: "verified" }),
      makeRecord({ id: "vr-002", childId: "child-alex", dbsVerified: "not_required" }),
      makeRecord({ id: "vr-003", childId: "child-alex", dbsVerified: "pending" }),
    ];
    const result = buildChildVisitorProfiles(
      ["child-alex"],
      { "child-alex": "Alex" },
      records,
    );
    expect(result[0].dbsVerifiedRate).toBe(67);
  });

  it("calculates correct safeguarding brief rate per child", () => {
    const records = [
      makeRecord({ id: "vr-001", childId: "child-alex", safeguardingBriefGiven: true }),
      makeRecord({ id: "vr-002", childId: "child-alex", safeguardingBriefGiven: false }),
    ];
    const result = buildChildVisitorProfiles(
      ["child-alex"],
      { "child-alex": "Alex" },
      records,
    );
    expect(result[0].safeguardingBriefRate).toBe(50);
  });

  it("calculates correct supervised rate per child", () => {
    const records = [
      makeRecord({ id: "vr-001", childId: "child-alex", supervisedVisit: true }),
      makeRecord({ id: "vr-002", childId: "child-alex", supervisedVisit: false }),
    ];
    const result = buildChildVisitorProfiles(
      ["child-alex"],
      { "child-alex": "Alex" },
      records,
    );
    expect(result[0].supervisedRate).toBe(50);
  });

  it("gives safety score 10 for fully compliant visits", () => {
    const records = [makeRecord({ id: "vr-001", childId: "child-alex" })];
    const result = buildChildVisitorProfiles(
      ["child-alex"],
      { "child-alex": "Alex" },
      records,
    );
    expect(result[0].safetyScore).toBe(10);
  });

  it("gives safety score 0 for completely non-compliant visits", () => {
    const records = [
      makeRecord({
        id: "vr-001",
        childId: "child-alex",
        signedIn: false,
        idChecked: false,
        dbsVerified: "failed",
        safeguardingBriefGiven: false,
        supervisedVisit: false,
      }),
    ];
    const result = buildChildVisitorProfiles(
      ["child-alex"],
      { "child-alex": "Alex" },
      records,
    );
    expect(result[0].safetyScore).toBe(0);
  });

  it("safety score never exceeds 10", () => {
    const records = Array.from({ length: 20 }, (_, i) =>
      makeRecord({ id: `vr-${i}`, childId: "child-alex" }),
    );
    const result = buildChildVisitorProfiles(
      ["child-alex"],
      { "child-alex": "Alex" },
      records,
    );
    expect(result[0].safetyScore).toBeLessThanOrEqual(10);
  });

  it("builds profiles for multiple children independently", () => {
    const records = [
      makeRecord({ id: "vr-001", childId: "child-alex" }),
      makeRecord({ id: "vr-002", childId: "child-alex" }),
      makeRecord({ id: "vr-003", childId: "child-jordan" }),
    ];
    const result = buildChildVisitorProfiles(
      ["child-alex", "child-jordan"],
      { "child-alex": "Alex", "child-jordan": "Jordan" },
      records,
    );
    expect(result).toHaveLength(2);
    expect(result[0].totalVisits).toBe(2);
    expect(result[1].totalVisits).toBe(1);
  });

  it("handles child with no matching records among many records", () => {
    const records = [
      makeRecord({ id: "vr-001", childId: "child-alex" }),
    ];
    const result = buildChildVisitorProfiles(
      ["child-morgan"],
      { "child-morgan": "Morgan" },
      records,
    );
    expect(result[0].totalVisits).toBe(0);
    expect(result[0].safetyScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. FULL INTELLIGENCE GENERATION
// ══════════════════════════════════════════════════════════════════════════════

describe("generateVisitorManagementSafetyIntelligence", () => {
  it("returns valid intelligence object with all required fields", () => {
    const result = generateVisitorManagementSafetyIntelligence(
      oakHouseRecords,
      oakHousePolicy,
      oakHouseIncidents,
      oakHouseTraining,
      oakHouseChildIds,
      oakHouseChildNames,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.assessedAt).toBe("2026-05-19");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
    expect(typeof result.overallScore).toBe("number");
    expect(typeof result.rating).toBe("string");
    expect(result.visitorCompliance).toBeDefined();
    expect(result.policyAdherence).toBeDefined();
    expect(result.incidentManagement).toBeDefined();
    expect(result.staffVisitorReadiness).toBeDefined();
    expect(result.childVisitorProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("overall score is sum of four evaluator scores capped at 100", () => {
    const result = generateVisitorManagementSafetyIntelligence(
      oakHouseRecords,
      oakHousePolicy,
      oakHouseIncidents,
      oakHouseTraining,
      oakHouseChildIds,
      oakHouseChildNames,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19",
    );

    const expectedSum =
      result.visitorCompliance.visitorComplianceScore +
      result.policyAdherence.policyAdherenceScore +
      result.incidentManagement.incidentManagementScore +
      result.staffVisitorReadiness.staffVisitorReadinessScore;

    expect(result.overallScore).toBe(Math.min(expectedSum, 100));
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns outstanding rating for Oak House demo data", () => {
    const result = generateVisitorManagementSafetyIntelligence(
      oakHouseRecords,
      oakHousePolicy,
      oakHouseIncidents,
      oakHouseTraining,
      oakHouseChildIds,
      oakHouseChildNames,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("generates strengths for fully compliant data", () => {
    const result = generateVisitorManagementSafetyIntelligence(
      oakHouseRecords,
      oakHousePolicy,
      oakHouseIncidents,
      oakHouseTraining,
      oakHouseChildIds,
      oakHouseChildNames,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates child profiles for all children", () => {
    const result = generateVisitorManagementSafetyIntelligence(
      oakHouseRecords,
      oakHousePolicy,
      oakHouseIncidents,
      oakHouseTraining,
      oakHouseChildIds,
      oakHouseChildNames,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19",
    );
    expect(result.childVisitorProfiles).toHaveLength(3);
    expect(result.childVisitorProfiles.map((p) => p.childId)).toEqual(
      expect.arrayContaining(["child-alex", "child-jordan", "child-morgan"]),
    );
  });

  it("includes regulatory links", () => {
    const result = generateVisitorManagementSafetyIntelligence(
      oakHouseRecords,
      oakHousePolicy,
      oakHouseIncidents,
      oakHouseTraining,
      oakHouseChildIds,
      oakHouseChildNames,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19",
    );
    expect(result.regulatoryLinks.length).toBeGreaterThanOrEqual(6);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("KCSIE"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act"))).toBe(true);
  });

  it("generates areas for improvement when data is poor", () => {
    const poorRecords = [
      makeRecord({
        signedIn: false,
        signedOut: false,
        idChecked: false,
        dbsVerified: "failed",
        safeguardingBriefGiven: false,
      }),
    ];
    const poorPolicies = [
      makePolicy({
        signInSystemInPlace: false,
        idCheckMandatory: false,
        dbsCheckRequired: false,
        safeguardingBriefRequired: false,
        visitorGuideAvailable: false,
        restrictedVisitorListMaintained: false,
      }),
    ];
    const poorIncidents = [
      makeIncident({
        incidentType: "unauthorised_access",
        resolved: false,
        reportedTo: "",
      }),
    ];
    const poorTraining = [
      makeTraining({
        visitorPolicyTrained: false,
        safeguardingVisitors: false,
        signInProcedures: false,
        dbsCheckProcess: false,
        incidentReporting: false,
        restrictedVisitorAwareness: false,
      }),
    ];

    const result = generateVisitorManagementSafetyIntelligence(
      poorRecords,
      poorPolicies,
      poorIncidents,
      poorTraining,
      ["child-alex"],
      { "child-alex": "Alex" },
      "test-home",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.rating).toBe("inadequate");
  });

  it("generates actions when compliance is poor", () => {
    const result = generateVisitorManagementSafetyIntelligence(
      [],
      [],
      [],
      [],
      [],
      {},
      "test-home",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19",
    );
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("scores overall 25 with only no-incidents (all other empty)", () => {
    const result = generateVisitorManagementSafetyIntelligence(
      [],
      [],
      [],
      [],
      [],
      {},
      "test-home",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19",
    );
    // Only incident management scores 25, rest score 0
    expect(result.overallScore).toBe(25);
  });

  it("handles empty child IDs gracefully", () => {
    const result = generateVisitorManagementSafetyIntelligence(
      oakHouseRecords,
      oakHousePolicy,
      oakHouseIncidents,
      oakHouseTraining,
      [],
      {},
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19",
    );
    expect(result.childVisitorProfiles).toEqual([]);
  });

  it("overall score never exceeds 100", () => {
    const result = generateVisitorManagementSafetyIntelligence(
      oakHouseRecords,
      oakHousePolicy,
      oakHouseIncidents,
      oakHouseTraining,
      oakHouseChildIds,
      oakHouseChildNames,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
      "2026-05-19",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. HELPERS / LABEL FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

describe("getVisitorTypeLabel", () => {
  it("returns correct labels for all visitor types", () => {
    expect(getVisitorTypeLabel("parent")).toBe("Parent");
    expect(getVisitorTypeLabel("social_worker")).toBe("Social Worker");
    expect(getVisitorTypeLabel("professional")).toBe("Professional");
    expect(getVisitorTypeLabel("family_member")).toBe("Family Member");
    expect(getVisitorTypeLabel("friend")).toBe("Friend");
    expect(getVisitorTypeLabel("contractor")).toBe("Contractor");
    expect(getVisitorTypeLabel("inspector")).toBe("Inspector");
    expect(getVisitorTypeLabel("volunteer")).toBe("Volunteer");
    expect(getVisitorTypeLabel("other")).toBe("Other");
  });
});

describe("getVisitPurposeLabel", () => {
  it("returns correct labels for all visit purposes", () => {
    expect(getVisitPurposeLabel("contact")).toBe("Contact");
    expect(getVisitPurposeLabel("review")).toBe("Review");
    expect(getVisitPurposeLabel("assessment")).toBe("Assessment");
    expect(getVisitPurposeLabel("maintenance")).toBe("Maintenance");
    expect(getVisitPurposeLabel("inspection")).toBe("Inspection");
    expect(getVisitPurposeLabel("therapy")).toBe("Therapy");
    expect(getVisitPurposeLabel("education")).toBe("Education");
    expect(getVisitPurposeLabel("social")).toBe("Social");
    expect(getVisitPurposeLabel("other")).toBe("Other");
  });
});

describe("getVerificationStatusLabel", () => {
  it("returns correct labels for all verification statuses", () => {
    expect(getVerificationStatusLabel("verified")).toBe("Verified");
    expect(getVerificationStatusLabel("pending")).toBe("Pending");
    expect(getVerificationStatusLabel("expired")).toBe("Expired");
    expect(getVerificationStatusLabel("not_required")).toBe("Not Required");
    expect(getVerificationStatusLabel("failed")).toBe("Failed");
  });
});

describe("getVisitOutcomeLabel", () => {
  it("returns correct labels for all visit outcomes", () => {
    expect(getVisitOutcomeLabel("completed")).toBe("Completed");
    expect(getVisitOutcomeLabel("shortened")).toBe("Shortened");
    expect(getVisitOutcomeLabel("cancelled")).toBe("Cancelled");
    expect(getVisitOutcomeLabel("refused")).toBe("Refused");
    expect(getVisitOutcomeLabel("supervised_throughout")).toBe("Supervised Throughout");
  });
});

describe("getRatingLabel", () => {
  it("returns correct labels for all ratings", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("getIncidentTypeLabel", () => {
  it("returns correct labels for all incident types", () => {
    expect(getIncidentTypeLabel("unauthorised_access")).toBe("Unauthorised Access");
    expect(getIncidentTypeLabel("safeguarding_concern")).toBe("Safeguarding Concern");
    expect(getIncidentTypeLabel("policy_breach")).toBe("Policy Breach");
    expect(getIncidentTypeLabel("complaint")).toBe("Complaint");
    expect(getIncidentTypeLabel("other")).toBe("Other");
  });
});
