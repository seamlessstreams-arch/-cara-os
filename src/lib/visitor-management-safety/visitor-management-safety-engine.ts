// ══════════════════════════════════════════════════════════════════════════════
// VISITOR MANAGEMENT SAFETY INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how well a children's residential
// care home manages visitor access, DBS verification, safeguarding checks,
// and staff awareness for visitor safety.
//
// Regulatory basis:
//   - CHR 2015, Reg 12 — The health and safety standard (visitor access control)
//   - CHR 2015, Reg 22 — Arrangements for the protection of children
//   - SCCIF — Social Care Common Inspection Framework (Ofsted)
//   - KCSIE 2024 — Keeping Children Safe in Education (visitor management)
//   - NMS 10 — National Minimum Standards: safety of children (premises security)
//   - Children Act 1989 — Duty of care and safeguarding arrangements
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type VisitorType =
  | "parent"
  | "social_worker"
  | "professional"
  | "family_member"
  | "friend"
  | "contractor"
  | "inspector"
  | "volunteer"
  | "other";

export type VisitPurpose =
  | "contact"
  | "review"
  | "assessment"
  | "maintenance"
  | "inspection"
  | "therapy"
  | "education"
  | "social"
  | "other";

export type VerificationStatus =
  | "verified"
  | "pending"
  | "expired"
  | "not_required"
  | "failed";

export type VisitOutcome =
  | "completed"
  | "shortened"
  | "cancelled"
  | "refused"
  | "supervised_throughout";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface VisitorRecord {
  id: string;
  visitorName: string;
  visitorType: VisitorType;
  visitDate: string;
  visitPurpose: VisitPurpose;
  childId?: string;
  childName?: string;
  signedIn: boolean;
  signedOut: boolean;
  idChecked: boolean;
  dbsVerified: VerificationStatus;
  supervisedVisit: boolean;
  staffPresent: string;
  visitOutcome: VisitOutcome;
  safeguardingBriefGiven: boolean;
}

export interface VisitorPolicy {
  id: string;
  policyReviewDate: string;
  signInSystemInPlace: boolean;
  idCheckMandatory: boolean;
  dbsCheckRequired: boolean;
  safeguardingBriefRequired: boolean;
  visitorGuideAvailable: boolean;
  restrictedVisitorListMaintained: boolean;
}

export interface VisitorIncident {
  id: string;
  incidentDate: string;
  visitorName: string;
  incidentType:
    | "unauthorised_access"
    | "safeguarding_concern"
    | "policy_breach"
    | "complaint"
    | "other";
  actionTaken: string;
  reportedTo: string;
  resolved: boolean;
}

export interface StaffVisitorTraining {
  id: string;
  staffId: string;
  staffName: string;
  visitorPolicyTrained: boolean;
  safeguardingVisitors: boolean;
  signInProcedures: boolean;
  dbsCheckProcess: boolean;
  incidentReporting: boolean;
  restrictedVisitorAwareness: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface VisitorComplianceEvaluation {
  totalRecords: number;
  signInRate: number;
  signOutRate: number;
  idCheckRate: number;
  dbsVerifiedRate: number;
  safeguardingBriefRate: number;
  supervisedRate: number;
  visitsByType: Record<string, number>;
  visitsByPurpose: Record<string, number>;
  visitsByOutcome: Record<string, number>;
  visitorComplianceScore: number;
}

export interface PolicyAdherenceEvaluation {
  totalPolicies: number;
  signInSystemRate: number;
  idCheckMandatoryRate: number;
  dbsCheckRequiredRate: number;
  safeguardingBriefRequiredRate: number;
  visitorGuideRate: number;
  restrictedListRate: number;
  policyAdherenceScore: number;
}

export interface IncidentManagementEvaluation {
  totalIncidents: number;
  resolvedRate: number;
  reportedRate: number;
  byType: Record<string, number>;
  unauthorisedAccessCount: number;
  safeguardingConcernCount: number;
  incidentManagementScore: number;
}

export interface StaffVisitorReadinessEvaluation {
  totalStaff: number;
  visitorPolicyTrainedRate: number;
  safeguardingVisitorsRate: number;
  signInProceduresRate: number;
  dbsCheckProcessRate: number;
  incidentReportingRate: number;
  restrictedVisitorAwarenessRate: number;
  staffVisitorReadinessScore: number;
}

export interface ChildVisitorProfile {
  childId: string;
  childName: string;
  totalVisits: number;
  visitorTypes: string[];
  visitPurposes: string[];
  signedInRate: number;
  idCheckedRate: number;
  dbsVerifiedRate: number;
  safeguardingBriefRate: number;
  supervisedRate: number;
  safetyScore: number;
}

export interface VisitorManagementSafetyIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  visitorCompliance: VisitorComplianceEvaluation;
  policyAdherence: PolicyAdherenceEvaluation;
  incidentManagement: IncidentManagementEvaluation;
  staffVisitorReadiness: StaffVisitorReadinessEvaluation;
  childVisitorProfiles: ChildVisitorProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Maps & Getters ──────────────────────────────────────────────────

export function getVisitorTypeLabel(t: VisitorType): string {
  const labels: Record<VisitorType, string> = {
    parent: "Parent",
    social_worker: "Social Worker",
    professional: "Professional",
    family_member: "Family Member",
    friend: "Friend",
    contractor: "Contractor",
    inspector: "Inspector",
    volunteer: "Volunteer",
    other: "Other",
  };
  return labels[t] ?? t;
}

export function getVisitPurposeLabel(p: VisitPurpose): string {
  const labels: Record<VisitPurpose, string> = {
    contact: "Contact",
    review: "Review",
    assessment: "Assessment",
    maintenance: "Maintenance",
    inspection: "Inspection",
    therapy: "Therapy",
    education: "Education",
    social: "Social",
    other: "Other",
  };
  return labels[p] ?? p;
}

export function getVerificationStatusLabel(s: VerificationStatus): string {
  const labels: Record<VerificationStatus, string> = {
    verified: "Verified",
    pending: "Pending",
    expired: "Expired",
    not_required: "Not Required",
    failed: "Failed",
  };
  return labels[s] ?? s;
}

export function getVisitOutcomeLabel(o: VisitOutcome): string {
  const labels: Record<VisitOutcome, string> = {
    completed: "Completed",
    shortened: "Shortened",
    cancelled: "Cancelled",
    refused: "Refused",
    supervised_throughout: "Supervised Throughout",
  };
  return labels[o] ?? o;
}

export function getRatingLabel(r: Rating): string {
  const labels: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[r] ?? r;
}

export function getIncidentTypeLabel(
  t: VisitorIncident["incidentType"],
): string {
  const labels: Record<VisitorIncident["incidentType"], string> = {
    unauthorised_access: "Unauthorised Access",
    safeguarding_concern: "Safeguarding Concern",
    policy_breach: "Policy Breach",
    complaint: "Complaint",
    other: "Other",
  };
  return labels[t] ?? t;
}

// ── 1. Evaluate Visitor Compliance (25 points) ────────────────────────────

export function evaluateVisitorCompliance(
  records: VisitorRecord[],
): VisitorComplianceEvaluation {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      signInRate: 0,
      signOutRate: 0,
      idCheckRate: 0,
      dbsVerifiedRate: 0,
      safeguardingBriefRate: 0,
      supervisedRate: 0,
      visitsByType: {},
      visitsByPurpose: {},
      visitsByOutcome: {},
      visitorComplianceScore: 0,
    };
  }

  const total = records.length;

  // Sign-in rate
  const signedIn = records.filter((r) => r.signedIn).length;
  const signInRate = pct(signedIn, total);

  // Sign-out rate
  const signedOut = records.filter((r) => r.signedOut).length;
  const signOutRate = pct(signedOut, total);

  // ID check rate
  const idChecked = records.filter((r) => r.idChecked).length;
  const idCheckRate = pct(idChecked, total);

  // DBS verified rate (count "verified" and "not_required" as compliant)
  const dbsCompliant = records.filter(
    (r) => r.dbsVerified === "verified" || r.dbsVerified === "not_required",
  ).length;
  const dbsVerifiedRate = pct(dbsCompliant, total);

  // Safeguarding brief rate
  const briefGiven = records.filter((r) => r.safeguardingBriefGiven).length;
  const safeguardingBriefRate = pct(briefGiven, total);

  // Supervised visit rate
  const supervised = records.filter((r) => r.supervisedVisit).length;
  const supervisedRate = pct(supervised, total);

  // Breakdowns
  const visitsByType: Record<string, number> = {};
  for (const r of records) {
    visitsByType[r.visitorType] = (visitsByType[r.visitorType] ?? 0) + 1;
  }

  const visitsByPurpose: Record<string, number> = {};
  for (const r of records) {
    visitsByPurpose[r.visitPurpose] = (visitsByPurpose[r.visitPurpose] ?? 0) + 1;
  }

  const visitsByOutcome: Record<string, number> = {};
  for (const r of records) {
    visitsByOutcome[r.visitOutcome] = (visitsByOutcome[r.visitOutcome] ?? 0) + 1;
  }

  // Scoring: 25 points
  // Sign-in/out combined rate: 0-8 points
  const signInOutAvg = (signInRate + signOutRate) / 2;
  const signInOutScore = Math.round((signInOutAvg / 100) * 8);

  // ID check rate: 0-7 points
  const idScore = Math.round((idCheckRate / 100) * 7);

  // DBS verified rate: 0-6 points
  const dbsScore = Math.round((dbsVerifiedRate / 100) * 6);

  // Safeguarding brief rate: 0-4 points
  const briefScore = Math.round((safeguardingBriefRate / 100) * 4);

  const visitorComplianceScore = clamp(
    signInOutScore + idScore + dbsScore + briefScore,
    0,
    25,
  );

  return {
    totalRecords: total,
    signInRate,
    signOutRate,
    idCheckRate,
    dbsVerifiedRate,
    safeguardingBriefRate,
    supervisedRate,
    visitsByType,
    visitsByPurpose,
    visitsByOutcome,
    visitorComplianceScore,
  };
}

// ── 2. Evaluate Policy Adherence (25 points) ──────────────────────────────

export function evaluatePolicyAdherence(
  policies: VisitorPolicy[],
): PolicyAdherenceEvaluation {
  if (policies.length === 0) {
    return {
      totalPolicies: 0,
      signInSystemRate: 0,
      idCheckMandatoryRate: 0,
      dbsCheckRequiredRate: 0,
      safeguardingBriefRequiredRate: 0,
      visitorGuideRate: 0,
      restrictedListRate: 0,
      policyAdherenceScore: 0,
    };
  }

  const total = policies.length;

  // Sign-in system in place
  const signInSystem = policies.filter((p) => p.signInSystemInPlace).length;
  const signInSystemRate = pct(signInSystem, total);

  // ID check mandatory
  const idCheckMandatory = policies.filter((p) => p.idCheckMandatory).length;
  const idCheckMandatoryRate = pct(idCheckMandatory, total);

  // DBS check required
  const dbsCheckRequired = policies.filter((p) => p.dbsCheckRequired).length;
  const dbsCheckRequiredRate = pct(dbsCheckRequired, total);

  // Safeguarding brief required
  const safeguardingBriefRequired = policies.filter(
    (p) => p.safeguardingBriefRequired,
  ).length;
  const safeguardingBriefRequiredRate = pct(safeguardingBriefRequired, total);

  // Visitor guide available
  const visitorGuide = policies.filter((p) => p.visitorGuideAvailable).length;
  const visitorGuideRate = pct(visitorGuide, total);

  // Restricted visitor list maintained
  const restrictedList = policies.filter(
    (p) => p.restrictedVisitorListMaintained,
  ).length;
  const restrictedListRate = pct(restrictedList, total);

  // Scoring: 25 points
  // Sign-in system: 0-5 points
  const signInScore = Math.round((signInSystemRate / 100) * 5);

  // ID check mandatory: 0-5 points
  const idScore = Math.round((idCheckMandatoryRate / 100) * 5);

  // DBS check required: 0-5 points
  const dbsScore = Math.round((dbsCheckRequiredRate / 100) * 5);

  // Safeguarding brief required: 0-4 points
  const briefScore = Math.round((safeguardingBriefRequiredRate / 100) * 4);

  // Visitor guide available: 0-3 points
  const guideScore = Math.round((visitorGuideRate / 100) * 3);

  // Restricted list maintained: 0-3 points
  const restrictedScore = Math.round((restrictedListRate / 100) * 3);

  const policyAdherenceScore = clamp(
    signInScore + idScore + dbsScore + briefScore + guideScore + restrictedScore,
    0,
    25,
  );

  return {
    totalPolicies: total,
    signInSystemRate,
    idCheckMandatoryRate,
    dbsCheckRequiredRate,
    safeguardingBriefRequiredRate,
    visitorGuideRate,
    restrictedListRate,
    policyAdherenceScore,
  };
}

// ── 3. Evaluate Incident Management (25 points) ──────────────────────────

export function evaluateIncidentManagement(
  incidents: VisitorIncident[],
): IncidentManagementEvaluation {
  // No incidents = excellent — score 25
  if (incidents.length === 0) {
    return {
      totalIncidents: 0,
      resolvedRate: 0,
      reportedRate: 0,
      byType: {},
      unauthorisedAccessCount: 0,
      safeguardingConcernCount: 0,
      incidentManagementScore: 25,
    };
  }

  const total = incidents.length;

  // By type
  const byType: Record<string, number> = {};
  for (const inc of incidents) {
    byType[inc.incidentType] = (byType[inc.incidentType] ?? 0) + 1;
  }

  // Resolution rate
  const resolved = incidents.filter((i) => i.resolved).length;
  const resolvedRate = pct(resolved, total);

  // Reported rate (has reportedTo filled)
  const reported = incidents.filter(
    (i) => i.reportedTo.trim().length > 0,
  ).length;
  const reportedRate = pct(reported, total);

  // Severity counts
  const unauthorisedAccessCount = incidents.filter(
    (i) => i.incidentType === "unauthorised_access",
  ).length;
  const safeguardingConcernCount = incidents.filter(
    (i) => i.incidentType === "safeguarding_concern",
  ).length;

  // Scoring: 25 points (incidents exist = start from base, earn by response quality)
  // Resolution rate: 0-10 points
  const resolvedScore = Math.round((resolvedRate / 100) * 10);

  // Reported rate: 0-8 points
  const reportedScore = Math.round((reportedRate / 100) * 8);

  // No unauthorised access bonus: 0-4 points
  const noUnauthorisedBonus = unauthorisedAccessCount === 0 ? 4 : 0;

  // No safeguarding concerns bonus: 0-3 points
  const noSafeguardingBonus = safeguardingConcernCount === 0 ? 3 : 0;

  const incidentManagementScore = clamp(
    resolvedScore + reportedScore + noUnauthorisedBonus + noSafeguardingBonus,
    0,
    25,
  );

  return {
    totalIncidents: total,
    resolvedRate,
    reportedRate,
    byType,
    unauthorisedAccessCount,
    safeguardingConcernCount,
    incidentManagementScore,
  };
}

// ── 4. Evaluate Staff Visitor Readiness (25 points) ──────────────────────

export function evaluateStaffVisitorReadiness(
  training: StaffVisitorTraining[],
): StaffVisitorReadinessEvaluation {
  if (training.length === 0) {
    return {
      totalStaff: 0,
      visitorPolicyTrainedRate: 0,
      safeguardingVisitorsRate: 0,
      signInProceduresRate: 0,
      dbsCheckProcessRate: 0,
      incidentReportingRate: 0,
      restrictedVisitorAwarenessRate: 0,
      staffVisitorReadinessScore: 0,
    };
  }

  const total = training.length;

  // Visitor policy trained
  const policyTrained = training.filter((t) => t.visitorPolicyTrained).length;
  const visitorPolicyTrainedRate = pct(policyTrained, total);

  // Safeguarding visitors
  const safeguarding = training.filter((t) => t.safeguardingVisitors).length;
  const safeguardingVisitorsRate = pct(safeguarding, total);

  // Sign-in procedures
  const signIn = training.filter((t) => t.signInProcedures).length;
  const signInProceduresRate = pct(signIn, total);

  // DBS check process
  const dbs = training.filter((t) => t.dbsCheckProcess).length;
  const dbsCheckProcessRate = pct(dbs, total);

  // Incident reporting
  const incident = training.filter((t) => t.incidentReporting).length;
  const incidentReportingRate = pct(incident, total);

  // Restricted visitor awareness
  const restricted = training.filter(
    (t) => t.restrictedVisitorAwareness,
  ).length;
  const restrictedVisitorAwarenessRate = pct(restricted, total);

  // Scoring: 25 points
  // Visitor policy trained: 0-5 points
  const policyScore = Math.round((visitorPolicyTrainedRate / 100) * 5);

  // Safeguarding visitors: 0-5 points
  const safeguardingScore = Math.round((safeguardingVisitorsRate / 100) * 5);

  // Sign-in procedures: 0-4 points
  const signInScore = Math.round((signInProceduresRate / 100) * 4);

  // DBS check process: 0-4 points
  const dbsScore = Math.round((dbsCheckProcessRate / 100) * 4);

  // Incident reporting: 0-4 points
  const incidentScore = Math.round((incidentReportingRate / 100) * 4);

  // Restricted visitor awareness: 0-3 points
  const restrictedScore = Math.round(
    (restrictedVisitorAwarenessRate / 100) * 3,
  );

  const staffVisitorReadinessScore = clamp(
    policyScore +
      safeguardingScore +
      signInScore +
      dbsScore +
      incidentScore +
      restrictedScore,
    0,
    25,
  );

  return {
    totalStaff: total,
    visitorPolicyTrainedRate,
    safeguardingVisitorsRate,
    signInProceduresRate,
    dbsCheckProcessRate,
    incidentReportingRate,
    restrictedVisitorAwarenessRate,
    staffVisitorReadinessScore,
  };
}

// ── 5. Build Child Visitor Profiles ──────────────────────────────────────

export function buildChildVisitorProfiles(
  childIds: string[],
  childNames: Record<string, string>,
  records: VisitorRecord[],
): ChildVisitorProfile[] {
  return childIds.map((childId) => {
    const childRecords = records.filter((r) => r.childId === childId);
    const totalVisits = childRecords.length;
    const childName = childNames[childId] ?? childId;

    const visitorTypes = Array.from(
      new Set(childRecords.map((r) => r.visitorType)),
    );
    const visitPurposes = Array.from(
      new Set(childRecords.map((r) => r.visitPurpose)),
    );

    const signedInCount = childRecords.filter((r) => r.signedIn).length;
    const signedInRate = pct(signedInCount, totalVisits);

    const idCheckedCount = childRecords.filter((r) => r.idChecked).length;
    const idCheckedRate = pct(idCheckedCount, totalVisits);

    const dbsVerifiedCount = childRecords.filter(
      (r) => r.dbsVerified === "verified" || r.dbsVerified === "not_required",
    ).length;
    const dbsVerifiedRate = pct(dbsVerifiedCount, totalVisits);

    const briefGivenCount = childRecords.filter(
      (r) => r.safeguardingBriefGiven,
    ).length;
    const safeguardingBriefRate = pct(briefGivenCount, totalVisits);

    const supervisedCount = childRecords.filter(
      (r) => r.supervisedVisit,
    ).length;
    const supervisedRate = pct(supervisedCount, totalVisits);

    // Safety score: 0-10
    // Sign-in (0-2), ID check (0-2), DBS verified (0-2), safeguarding brief (0-2), supervised (0-2)
    let safetyScore = 0;
    if (totalVisits > 0) {
      safetyScore += Math.round((signedInRate / 100) * 2);
      safetyScore += Math.round((idCheckedRate / 100) * 2);
      safetyScore += Math.round((dbsVerifiedRate / 100) * 2);
      safetyScore += Math.round((safeguardingBriefRate / 100) * 2);
      safetyScore += Math.round((supervisedRate / 100) * 2);
    }
    safetyScore = clamp(safetyScore, 0, 10);

    return {
      childId,
      childName,
      totalVisits,
      visitorTypes,
      visitPurposes,
      signedInRate,
      idCheckedRate,
      dbsVerifiedRate,
      safeguardingBriefRate,
      supervisedRate,
      safetyScore,
    };
  });
}

// ── 6. Generate Full Intelligence ────────────────────────────────────────

export function generateVisitorManagementSafetyIntelligence(
  records: VisitorRecord[],
  policies: VisitorPolicy[],
  incidents: VisitorIncident[],
  training: StaffVisitorTraining[],
  childIds: string[],
  childNames: Record<string, string>,
  homeId: string,
  periodStart: string,
  periodEnd: string,
  assessedAt: string,
): VisitorManagementSafetyIntelligence {
  const visitorCompliance = evaluateVisitorCompliance(records);
  const policyAdherence = evaluatePolicyAdherence(policies);
  const incidentManagement = evaluateIncidentManagement(incidents);
  const staffVisitorReadiness = evaluateStaffVisitorReadiness(training);
  const childVisitorProfiles = buildChildVisitorProfiles(
    childIds,
    childNames,
    records,
  );

  // ── Scoring (100 points) ──────────────────────────────────────────────
  const overallScore = clamp(
    visitorCompliance.visitorComplianceScore +
      policyAdherence.policyAdherenceScore +
      incidentManagement.incidentManagementScore +
      staffVisitorReadiness.staffVisitorReadinessScore,
    0,
    100,
  );

  const rating = getRating(overallScore);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (visitorCompliance.signInRate === 100 && visitorCompliance.totalRecords > 0)
    strengths.push("All visitors signed in on arrival — strong access control");
  if (visitorCompliance.signOutRate === 100 && visitorCompliance.totalRecords > 0)
    strengths.push("All visitors signed out on departure — complete visitor tracking");
  if (visitorCompliance.idCheckRate === 100 && visitorCompliance.totalRecords > 0)
    strengths.push("ID checks completed for all visitors — robust identity verification");
  if (visitorCompliance.dbsVerifiedRate === 100 && visitorCompliance.totalRecords > 0)
    strengths.push("DBS verification compliant for all visitors — safeguarding standards met");
  if (visitorCompliance.safeguardingBriefRate === 100 && visitorCompliance.totalRecords > 0)
    strengths.push("Safeguarding brief given to all visitors — children are well protected");

  if (policyAdherence.signInSystemRate === 100 && policyAdherence.totalPolicies > 0)
    strengths.push("Sign-in system in place across all policies — consistent access management");
  if (policyAdherence.idCheckMandatoryRate === 100 && policyAdherence.totalPolicies > 0)
    strengths.push("ID checks are mandatory under all policies — strong identity verification framework");
  if (policyAdherence.dbsCheckRequiredRate === 100 && policyAdherence.totalPolicies > 0)
    strengths.push("DBS checks required by all policies — rigorous safeguarding compliance");
  if (policyAdherence.safeguardingBriefRequiredRate === 100 && policyAdherence.totalPolicies > 0)
    strengths.push("Safeguarding brief required by policy — embedded safeguarding culture");
  if (policyAdherence.visitorGuideRate === 100 && policyAdherence.totalPolicies > 0)
    strengths.push("Visitor guide available — visitors are well informed of expectations");
  if (policyAdherence.restrictedListRate === 100 && policyAdherence.totalPolicies > 0)
    strengths.push("Restricted visitor list maintained — proactive risk management");

  if (incidentManagement.totalIncidents === 0)
    strengths.push("No visitor-related incidents recorded — effective preventive practices");
  if (incidentManagement.totalIncidents > 0 && incidentManagement.resolvedRate === 100)
    strengths.push("All visitor incidents have been resolved — responsive incident management");
  if (incidentManagement.totalIncidents > 0 && incidentManagement.reportedRate === 100)
    strengths.push("All visitor incidents reported appropriately — good reporting culture");

  if (staffVisitorReadiness.visitorPolicyTrainedRate === 100 && staffVisitorReadiness.totalStaff > 0)
    strengths.push("All staff trained on visitor policy — consistent application of procedures");
  if (staffVisitorReadiness.safeguardingVisitorsRate === 100 && staffVisitorReadiness.totalStaff > 0)
    strengths.push("All staff trained on safeguarding in relation to visitors — children are protected");
  if (staffVisitorReadiness.signInProceduresRate === 100 && staffVisitorReadiness.totalStaff > 0)
    strengths.push("All staff know sign-in procedures — reliable access control");
  if (staffVisitorReadiness.dbsCheckProcessRate === 100 && staffVisitorReadiness.totalStaff > 0)
    strengths.push("All staff understand the DBS check process for visitors");
  if (staffVisitorReadiness.incidentReportingRate === 100 && staffVisitorReadiness.totalStaff > 0)
    strengths.push("All staff trained on incident reporting for visitor-related concerns");
  if (staffVisitorReadiness.restrictedVisitorAwarenessRate === 100 && staffVisitorReadiness.totalStaff > 0)
    strengths.push("All staff aware of restricted visitor protocols — robust safeguarding practice");

  // ── Areas for Improvement ─────────────────────────────────────────────
  const areasForImprovement: string[] = [];

  if (visitorCompliance.totalRecords === 0)
    areasForImprovement.push("No visitor records on file — visitor management must be documented");
  if (visitorCompliance.signInRate < 100 && visitorCompliance.totalRecords > 0)
    areasForImprovement.push("Not all visitors signed in on arrival — access control gaps identified");
  if (visitorCompliance.signOutRate < 100 && visitorCompliance.totalRecords > 0)
    areasForImprovement.push("Not all visitors signed out on departure — tracking is incomplete");
  if (visitorCompliance.idCheckRate < 100 && visitorCompliance.totalRecords > 0)
    areasForImprovement.push("ID checks not completed for all visitors — identity verification must improve");
  if (visitorCompliance.dbsVerifiedRate < 100 && visitorCompliance.totalRecords > 0)
    areasForImprovement.push("DBS verification not compliant for all visitors — safeguarding risk");
  if (visitorCompliance.safeguardingBriefRate < 100 && visitorCompliance.totalRecords > 0)
    areasForImprovement.push("Safeguarding brief not given to all visitors — this is a safeguarding concern");

  if (policyAdherence.totalPolicies === 0)
    areasForImprovement.push("No visitor policies on file — a visitor management policy is required");
  if (policyAdherence.signInSystemRate < 100 && policyAdherence.totalPolicies > 0)
    areasForImprovement.push("Sign-in system not in place for all policies — access control must be standardised");
  if (policyAdherence.idCheckMandatoryRate < 100 && policyAdherence.totalPolicies > 0)
    areasForImprovement.push("ID checks not mandatory under all policies — this is a safeguarding gap");
  if (policyAdherence.dbsCheckRequiredRate < 100 && policyAdherence.totalPolicies > 0)
    areasForImprovement.push("DBS checks not required by all policies — regulatory non-compliance risk");
  if (policyAdherence.visitorGuideRate < 100 && policyAdherence.totalPolicies > 0)
    areasForImprovement.push("Visitor guide not available under all policies — visitors may be uninformed of expectations");
  if (policyAdherence.restrictedListRate < 100 && policyAdherence.totalPolicies > 0)
    areasForImprovement.push("Restricted visitor list not maintained under all policies — risk management gap");

  if (incidentManagement.totalIncidents > 0 && incidentManagement.resolvedRate < 100)
    areasForImprovement.push("Not all visitor incidents have been resolved — outstanding incidents require action");
  if (incidentManagement.totalIncidents > 0 && incidentManagement.reportedRate < 100)
    areasForImprovement.push("Not all visitor incidents reported appropriately — reporting must improve");
  if (incidentManagement.unauthorisedAccessCount > 0)
    areasForImprovement.push(`${incidentManagement.unauthorisedAccessCount} unauthorised access incident(s) recorded — urgent review of access control needed`);
  if (incidentManagement.safeguardingConcernCount > 0)
    areasForImprovement.push(`${incidentManagement.safeguardingConcernCount} safeguarding concern(s) from visitor incidents — safeguarding review required`);

  if (staffVisitorReadiness.totalStaff === 0)
    areasForImprovement.push("No staff visitor training records on file — training must be documented");
  if (staffVisitorReadiness.visitorPolicyTrainedRate < 100 && staffVisitorReadiness.totalStaff > 0)
    areasForImprovement.push("Not all staff trained on visitor policy — policy awareness must improve");
  if (staffVisitorReadiness.safeguardingVisitorsRate < 100 && staffVisitorReadiness.totalStaff > 0)
    areasForImprovement.push("Not all staff trained on safeguarding in relation to visitors — training gap");
  if (staffVisitorReadiness.signInProceduresRate < 100 && staffVisitorReadiness.totalStaff > 0)
    areasForImprovement.push("Not all staff know sign-in procedures — procedures training needed");
  if (staffVisitorReadiness.dbsCheckProcessRate < 100 && staffVisitorReadiness.totalStaff > 0)
    areasForImprovement.push("Not all staff understand the DBS check process — training required");
  if (staffVisitorReadiness.incidentReportingRate < 100 && staffVisitorReadiness.totalStaff > 0)
    areasForImprovement.push("Not all staff trained on visitor incident reporting — training gap");
  if (staffVisitorReadiness.restrictedVisitorAwarenessRate < 100 && staffVisitorReadiness.totalStaff > 0)
    areasForImprovement.push("Not all staff aware of restricted visitor protocols — awareness training needed");

  // ── Actions ───────────────────────────────────────────────────────────
  const actions: string[] = [];

  if (visitorCompliance.totalRecords === 0)
    actions.push("Establish a visitor log and begin recording all visits immediately");
  if (visitorCompliance.signInRate < 100 && visitorCompliance.totalRecords > 0)
    actions.push("Ensure all visitors sign in on arrival without exception");
  if (visitorCompliance.signOutRate < 100 && visitorCompliance.totalRecords > 0)
    actions.push("Ensure all visitors sign out on departure to maintain accurate records");
  if (visitorCompliance.idCheckRate < 100 && visitorCompliance.totalRecords > 0)
    actions.push("Implement mandatory ID checks for all visitors before entry");
  if (visitorCompliance.dbsVerifiedRate < 100 && visitorCompliance.totalRecords > 0)
    actions.push("Verify DBS status for all visitors who require it before unsupervised access");
  if (visitorCompliance.safeguardingBriefRate < 100 && visitorCompliance.totalRecords > 0)
    actions.push("Ensure all visitors receive a safeguarding brief upon arrival");

  if (policyAdherence.totalPolicies === 0)
    actions.push("Develop and implement a comprehensive visitor management policy");
  if (policyAdherence.signInSystemRate < 100 && policyAdherence.totalPolicies > 0)
    actions.push("Install a sign-in system at all entry points");
  if (policyAdherence.idCheckMandatoryRate < 100 && policyAdherence.totalPolicies > 0)
    actions.push("Update policies to mandate ID checks for all visitors");
  if (policyAdherence.dbsCheckRequiredRate < 100 && policyAdherence.totalPolicies > 0)
    actions.push("Update policies to require DBS checks where applicable");
  if (policyAdherence.visitorGuideRate < 100 && policyAdherence.totalPolicies > 0)
    actions.push("Create and distribute a visitor guide outlining expectations and procedures");
  if (policyAdherence.restrictedListRate < 100 && policyAdherence.totalPolicies > 0)
    actions.push("Establish and maintain a restricted visitor list with regular reviews");

  if (incidentManagement.totalIncidents > 0 && incidentManagement.resolvedRate < 100)
    actions.push("Resolve all outstanding visitor-related incidents without delay");
  if (incidentManagement.totalIncidents > 0 && incidentManagement.reportedRate < 100)
    actions.push("Ensure all visitor incidents are reported to the appropriate person");
  if (incidentManagement.unauthorisedAccessCount > 0)
    actions.push("Conduct an urgent review of access control measures following unauthorised access");
  if (incidentManagement.safeguardingConcernCount > 0)
    actions.push("Complete safeguarding review of all visitor-related safeguarding concerns");

  if (staffVisitorReadiness.totalStaff === 0)
    actions.push("Create staff training records for visitor management procedures");
  if (staffVisitorReadiness.visitorPolicyTrainedRate < 100 && staffVisitorReadiness.totalStaff > 0)
    actions.push("Deliver visitor policy training to all untrained staff");
  if (staffVisitorReadiness.safeguardingVisitorsRate < 100 && staffVisitorReadiness.totalStaff > 0)
    actions.push("Arrange safeguarding-visitors training for all staff who have not completed it");
  if (staffVisitorReadiness.signInProceduresRate < 100 && staffVisitorReadiness.totalStaff > 0)
    actions.push("Train all staff on sign-in procedures for visitors");
  if (staffVisitorReadiness.dbsCheckProcessRate < 100 && staffVisitorReadiness.totalStaff > 0)
    actions.push("Train all staff on the DBS check process for visitors");
  if (staffVisitorReadiness.incidentReportingRate < 100 && staffVisitorReadiness.totalStaff > 0)
    actions.push("Train all staff on reporting visitor-related incidents");
  if (staffVisitorReadiness.restrictedVisitorAwarenessRate < 100 && staffVisitorReadiness.totalStaff > 0)
    actions.push("Brief all staff on restricted visitor protocols and how to respond");

  // ── Regulatory Links ──────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 12 — The health and safety standard: the registered person must ensure premises are safe and visitor access is controlled",
    "CHR 2015, Reg 22 — Arrangements for the protection of children: visitors must be appropriately vetted and supervised",
    "SCCIF — Social Care Common Inspection Framework: Ofsted evaluates visitor management as part of overall safeguarding",
    "KCSIE 2024 — Keeping Children Safe in Education: guidance on managing visitors and DBS checks in care settings",
    "NMS 10 — National Minimum Standards: safety of children including premises security and visitor management",
    "Children Act 1989 — Duty of care: local authorities must ensure children in care are protected from harm by visitors",
  ];

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    visitorCompliance,
    policyAdherence,
    incidentManagement,
    staffVisitorReadiness,
    childVisitorProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
