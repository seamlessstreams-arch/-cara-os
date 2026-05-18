// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Online Safety & Digital Wellbeing Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// Regulatory framework:
//   KCSIE 2024 Part 2       — Online safety responsibilities
//   CHR 2015 Reg 12         — Protection of children (includes online harm)
//   CHR 2015 Reg 13         — Behaviour management (digital behaviour)
//   Working Together 2023   — Online exploitation & abuse recognition
//   SCCIF                   — Digital safety culture, risk-aware practice
//   Voyeurism (Offences) Act 2019
//   Online Safety Act 2023  — Duties of care for online services
//   UNCRC Article 16        — Right to privacy (balancing safety & privacy)
//   UNCRC Article 17        — Access to information from mass media
//
// Key requirements:
//   1. Online safety policy in place and reviewed
//   2. Staff trained in online safety (updated annually)
//   3. Age-appropriate filtering and monitoring on home devices
//   4. Each child has an individual online safety risk assessment
//   5. Children educated about online safety (age-appropriate)
//   6. Online incidents (grooming, bullying, sharing images) recorded & managed
//   7. Device usage agreements in place for each child
//   8. Balance between safety monitoring and privacy rights
//   9. Social media risk awareness
//   10. Reporting pathways clear (CEOP, IWF, etc.)
//
// Scoring breakdown (0–100):
//   Risk assessment coverage:    20  — All children have online risk assessments
//   Staff training:              20  — Online safety training compliance
//   Safety measures:             15  — Filtering, monitoring, device agreements
//   Education delivery:          15  — E-safety education for children
//   Incident management:         15  — How well online incidents are handled
//   Policy & review:             15  — Online safety policy current
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type OnlineRiskCategory =
  | "grooming"
  | "cyberbullying"
  | "sexting"
  | "exposure_harmful_content"
  | "radicalisation"
  | "gaming_addiction"
  | "online_exploitation"
  | "identity_fraud"
  | "data_sharing"
  | "self_harm_content"
  | "catfishing"
  | "sextortion";

export type OnlineRiskLevel = "low" | "medium" | "high" | "very_high";

export type OnlineIncidentType =
  | "cyberbullying_victim"
  | "cyberbullying_perpetrator"
  | "inappropriate_content_accessed"
  | "inappropriate_content_shared"
  | "contact_from_unknown_adult"
  | "sharing_personal_information"
  | "sexting_received"
  | "sexting_sent"
  | "online_threats"
  | "gaming_spend"
  | "excessive_screen_time"
  | "social_media_misuse"
  | "attempted_grooming"
  | "self_harm_content_accessed"
  | "radicalisation_concern";

export type OnlineIncidentSeverity = 1 | 2 | 3 | 4 | 5;
// 1 = Low concern, 2 = Moderate, 3 = Significant, 4 = Serious, 5 = Critical

export type EducationTopic =
  | "online_identity"
  | "privacy_settings"
  | "recognising_grooming"
  | "healthy_relationships_online"
  | "cyberbullying_awareness"
  | "image_sharing_law"
  | "reporting_concerns"
  | "screen_time_balance"
  | "critical_thinking_online"
  | "gaming_safety"
  | "social_media_safety"
  | "digital_footprint";

export type DeviceType =
  | "home_desktop"
  | "home_laptop"
  | "home_tablet"
  | "personal_phone"
  | "personal_tablet"
  | "gaming_console"
  | "smart_tv";

export type SafetyMeasure =
  | "content_filtering"
  | "monitoring_software"
  | "time_restrictions"
  | "age_verification"
  | "wifi_scheduling"
  | "app_restrictions"
  | "location_sharing_off"
  | "privacy_settings_reviewed"
  | "parental_controls";

// ── Data Models ───────────────────────────────────────────────────────────────

export interface OnlineSafetyChild {
  id: string;
  name: string;
  dateOfBirth: string;
  currentPlacement: boolean;
}

export interface OnlineRiskAssessment {
  id: string;
  childId: string;
  assessmentDate: string;
  reviewDueDate: string;
  assessedBy: string;
  overallRiskLevel: OnlineRiskLevel;
  risksIdentified: {
    category: OnlineRiskCategory;
    level: OnlineRiskLevel;
    mitigations: string[];
  }[];
  devicesAccessed: DeviceType[];
  safetyMeasuresInPlace: SafetyMeasure[];
  deviceAgreementSigned: boolean;
  socialMediaAccounts: string[];
  screenTimeAgreementHours?: number;
}

export interface OnlineIncident {
  id: string;
  childId: string;
  date: string;
  incidentType: OnlineIncidentType;
  severity: OnlineIncidentSeverity;
  description: string;
  reportedTo: string[];
  ceopReferral: boolean;
  policeInvolved: boolean;
  socialWorkerNotified: boolean;
  parentNotified: boolean;
  deviceSeized: boolean;
  safeguardingActionTaken: string[];
  outcome?: string;
  resolved: boolean;
  resolvedDate?: string;
}

export interface OnlineEducationSession {
  id: string;
  date: string;
  topic: EducationTopic;
  childIds: string[];
  deliveredBy: string;
  method: "group_session" | "one_to_one" | "online_resource" | "external_workshop";
  childrenEngaged: boolean;
  followUpNeeded: boolean;
  notes?: string;
}

export interface StaffOnlineTraining {
  staffId: string;
  staffName: string;
  trainingName: string;
  completionDate: string;
  expiryDate?: string;
  provider: string;
  certificateHeld: boolean;
}

export interface OnlineSafetyPolicy {
  lastReviewDate: string;
  nextReviewDue: string;
  filteringProvider?: string;
  monitoringProvider?: string;
  reportingPathwayDocumented: boolean;
  childFriendlyVersion: boolean;
  staffBriefedDate?: string;
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface RiskAssessmentResult {
  totalChildren: number;
  childrenWithAssessment: number;
  assessmentRate: number;
  overdueAssessments: number;
  riskLevelBreakdown: { level: OnlineRiskLevel; count: number }[];
  deviceAgreementRate: number;
  averageSafetyMeasures: number;
  childrenAtHighRisk: string[];
}

export interface IncidentAnalysisResult {
  totalIncidents: number;
  averageSeverity: number;
  resolvedRate: number;
  ceopReferrals: number;
  policeInvolvement: number;
  typeBreakdown: { incidentType: OnlineIncidentType; count: number }[];
  severityBreakdown: { severity: number; count: number }[];
  childrenWithIncidents: number;
  childrenWithMultipleIncidents: string[];
}

export interface EducationResult {
  totalSessions: number;
  sessionsPerChild: number;
  topicsCovered: number;
  totalTopics: number;
  topicCoverageRate: number;
  engagementRate: number;
  topicBreakdown: { topic: EducationTopic; count: number }[];
  childrenWithNoEducation: string[];
}

export interface StaffTrainingResult {
  totalStaff: number;
  staffTrained: number;
  trainingRate: number;
  expiredTraining: number;
  staffMissingTraining: string[];
}

export interface ChildOnlineProfile {
  childId: string;
  childName: string;
  hasRiskAssessment: boolean;
  assessmentOverdue: boolean;
  overallRiskLevel?: OnlineRiskLevel;
  riskCount: number;
  deviceAgreementSigned: boolean;
  safetyMeasureCount: number;
  incidentCount: number;
  highSeverityIncidents: number;
  educationSessionCount: number;
  socialMediaAccounts: number;
  primaryConcern?: string;
}

export interface OnlineSafetyIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  riskAssessments: RiskAssessmentResult;
  incidentAnalysis: IncidentAnalysisResult;
  education: EducationResult;
  staffTraining: StaffTrainingResult;
  childProfiles: ChildOnlineProfile[];
  policyStatus: {
    current: boolean;
    overdue: boolean;
    filteringInPlace: boolean;
    monitoringInPlace: boolean;
    reportingPathway: boolean;
    childFriendly: boolean;
  };
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Labels ────────────────────────────────────────────────────────────────────

const RISK_CATEGORY_LABELS: Record<OnlineRiskCategory, string> = {
  grooming: "Online Grooming",
  cyberbullying: "Cyberbullying",
  sexting: "Sexting / Image Sharing",
  exposure_harmful_content: "Harmful Content Exposure",
  radicalisation: "Online Radicalisation",
  gaming_addiction: "Gaming Addiction",
  online_exploitation: "Online Exploitation",
  identity_fraud: "Identity Fraud",
  data_sharing: "Personal Data Sharing",
  self_harm_content: "Self-Harm Content",
  catfishing: "Catfishing",
  sextortion: "Sextortion",
};

const INCIDENT_TYPE_LABELS: Record<OnlineIncidentType, string> = {
  cyberbullying_victim: "Cyberbullying (Victim)",
  cyberbullying_perpetrator: "Cyberbullying (Perpetrator)",
  inappropriate_content_accessed: "Inappropriate Content Accessed",
  inappropriate_content_shared: "Inappropriate Content Shared",
  contact_from_unknown_adult: "Contact from Unknown Adult",
  sharing_personal_information: "Personal Info Shared",
  sexting_received: "Sexting Received",
  sexting_sent: "Sexting Sent",
  online_threats: "Online Threats",
  gaming_spend: "Unauthorised Gaming Spend",
  excessive_screen_time: "Excessive Screen Time",
  social_media_misuse: "Social Media Misuse",
  attempted_grooming: "Attempted Grooming",
  self_harm_content_accessed: "Self-Harm Content Accessed",
  radicalisation_concern: "Radicalisation Concern",
};

const EDUCATION_TOPIC_LABELS: Record<EducationTopic, string> = {
  online_identity: "Online Identity",
  privacy_settings: "Privacy Settings",
  recognising_grooming: "Recognising Grooming",
  healthy_relationships_online: "Healthy Online Relationships",
  cyberbullying_awareness: "Cyberbullying Awareness",
  image_sharing_law: "Image Sharing & the Law",
  reporting_concerns: "Reporting Concerns",
  screen_time_balance: "Screen Time Balance",
  critical_thinking_online: "Critical Thinking Online",
  gaming_safety: "Gaming Safety",
  social_media_safety: "Social Media Safety",
  digital_footprint: "Digital Footprint",
};

export function getRiskCategoryLabel(c: OnlineRiskCategory): string {
  return RISK_CATEGORY_LABELS[c] ?? c.replace(/_/g, " ");
}

export function getIncidentTypeLabel(t: OnlineIncidentType): string {
  return INCIDENT_TYPE_LABELS[t] ?? t.replace(/_/g, " ");
}

export function getEducationTopicLabel(t: EducationTopic): string {
  return EDUCATION_TOPIC_LABELS[t] ?? t.replace(/_/g, " ");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

const ALL_TOPICS: EducationTopic[] = [
  "online_identity",
  "privacy_settings",
  "recognising_grooming",
  "healthy_relationships_online",
  "cyberbullying_awareness",
  "image_sharing_law",
  "reporting_concerns",
  "screen_time_balance",
  "critical_thinking_online",
  "gaming_safety",
  "social_media_safety",
  "digital_footprint",
];

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * Evaluates online risk assessment coverage.
 */
export function evaluateRiskAssessments(
  children: OnlineSafetyChild[],
  assessments: OnlineRiskAssessment[],
  currentDate: string,
): RiskAssessmentResult {
  const placed = children.filter((c) => c.currentPlacement);
  const totalChildren = placed.length;

  const childAssessmentMap = new Map<string, OnlineRiskAssessment>();
  for (const a of assessments) {
    if (!placed.some((c) => c.id === a.childId)) continue;
    const existing = childAssessmentMap.get(a.childId);
    if (!existing || a.assessmentDate > existing.assessmentDate) {
      childAssessmentMap.set(a.childId, a);
    }
  }

  const childrenWithAssessment = childAssessmentMap.size;
  const assessmentRate = pct(childrenWithAssessment, totalChildren);

  const overdueAssessments = Array.from(childAssessmentMap.values()).filter(
    (a) => a.reviewDueDate < currentDate,
  ).length;

  // Risk level breakdown
  const levelCounts = new Map<OnlineRiskLevel, number>();
  for (const a of childAssessmentMap.values()) {
    levelCounts.set(
      a.overallRiskLevel,
      (levelCounts.get(a.overallRiskLevel) ?? 0) + 1,
    );
  }
  const riskLevelBreakdown = (
    ["very_high", "high", "medium", "low"] as OnlineRiskLevel[]
  ).map((level) => ({
    level,
    count: levelCounts.get(level) ?? 0,
  }));

  // Device agreement rate
  const withAgreement = Array.from(childAssessmentMap.values()).filter(
    (a) => a.deviceAgreementSigned,
  ).length;
  const deviceAgreementRate = pct(withAgreement, childrenWithAssessment);

  // Average safety measures
  const totalMeasures = Array.from(childAssessmentMap.values()).reduce(
    (sum, a) => sum + a.safetyMeasuresInPlace.length,
    0,
  );
  const averageSafetyMeasures =
    childrenWithAssessment === 0
      ? 0
      : Math.round((totalMeasures / childrenWithAssessment) * 10) / 10;

  // Children at high/very_high risk
  const childrenAtHighRisk = Array.from(childAssessmentMap.entries())
    .filter(
      ([, a]) =>
        a.overallRiskLevel === "high" || a.overallRiskLevel === "very_high",
    )
    .map(([childId]) => {
      const child = placed.find((c) => c.id === childId);
      return child?.name ?? childId;
    });

  return {
    totalChildren,
    childrenWithAssessment,
    assessmentRate,
    overdueAssessments,
    riskLevelBreakdown,
    deviceAgreementRate,
    averageSafetyMeasures,
    childrenAtHighRisk,
  };
}

/**
 * Analyses online safety incidents.
 */
export function analyseOnlineIncidents(
  children: OnlineSafetyChild[],
  incidents: OnlineIncident[],
  periodStart: string,
  periodEnd: string,
): IncidentAnalysisResult {
  const placed = children.filter((c) => c.currentPlacement);
  const periodIncidents = incidents.filter(
    (i) =>
      inPeriod(i.date, periodStart, periodEnd) &&
      placed.some((c) => c.id === i.childId),
  );
  const totalIncidents = periodIncidents.length;

  const averageSeverity =
    totalIncidents === 0
      ? 0
      : Math.round(
          (periodIncidents.reduce((sum, i) => sum + i.severity, 0) /
            totalIncidents) *
            10,
        ) / 10;

  const resolved = periodIncidents.filter((i) => i.resolved).length;
  const resolvedRate = pct(resolved, totalIncidents);

  const ceopReferrals = periodIncidents.filter(
    (i) => i.ceopReferral,
  ).length;
  const policeInvolvement = periodIncidents.filter(
    (i) => i.policeInvolved,
  ).length;

  // Type breakdown
  const typeCounts = new Map<OnlineIncidentType, number>();
  for (const i of periodIncidents) {
    typeCounts.set(
      i.incidentType,
      (typeCounts.get(i.incidentType) ?? 0) + 1,
    );
  }
  const typeBreakdown = Array.from(typeCounts.entries())
    .map(([incidentType, count]) => ({ incidentType, count }))
    .sort((a, b) => b.count - a.count);

  // Severity breakdown
  const sevCounts = new Map<number, number>();
  for (const i of periodIncidents) {
    sevCounts.set(i.severity, (sevCounts.get(i.severity) ?? 0) + 1);
  }
  const severityBreakdown = Array.from(sevCounts.entries())
    .map(([severity, count]) => ({ severity, count }))
    .sort((a, b) => b.severity - a.severity);

  // Children with incidents
  const childIncidentCounts = new Map<string, number>();
  for (const i of periodIncidents) {
    childIncidentCounts.set(
      i.childId,
      (childIncidentCounts.get(i.childId) ?? 0) + 1,
    );
  }
  const childrenWithIncidents = childIncidentCounts.size;
  const childrenWithMultipleIncidents = Array.from(
    childIncidentCounts.entries(),
  )
    .filter(([, count]) => count >= 2)
    .map(([childId]) => {
      const child = placed.find((c) => c.id === childId);
      return child?.name ?? childId;
    });

  return {
    totalIncidents,
    averageSeverity,
    resolvedRate,
    ceopReferrals,
    policeInvolvement,
    typeBreakdown,
    severityBreakdown,
    childrenWithIncidents,
    childrenWithMultipleIncidents,
  };
}

/**
 * Evaluates online safety education delivery.
 */
export function evaluateEducation(
  children: OnlineSafetyChild[],
  sessions: OnlineEducationSession[],
  periodStart: string,
  periodEnd: string,
): EducationResult {
  const placed = children.filter((c) => c.currentPlacement);
  const periodSessions = sessions.filter((s) =>
    inPeriod(s.date, periodStart, periodEnd),
  );
  const totalSessions = periodSessions.length;
  const sessionsPerChild =
    placed.length === 0
      ? 0
      : Math.round((totalSessions / placed.length) * 10) / 10;

  // Topics covered
  const topicsCoveredSet = new Set(periodSessions.map((s) => s.topic));
  const topicsCovered = topicsCoveredSet.size;
  const totalTopics = ALL_TOPICS.length;
  const topicCoverageRate = pct(topicsCovered, totalTopics);

  // Engagement rate
  const engaged = periodSessions.filter((s) => s.childrenEngaged).length;
  const engagementRate = pct(engaged, totalSessions);

  // Topic breakdown
  const topicCounts = new Map<EducationTopic, number>();
  for (const s of periodSessions) {
    topicCounts.set(s.topic, (topicCounts.get(s.topic) ?? 0) + 1);
  }
  const topicBreakdown = Array.from(topicCounts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);

  // Children with no education
  const childrenInSessions = new Set(
    periodSessions.flatMap((s) => s.childIds),
  );
  const childrenWithNoEducation = placed
    .filter((c) => !childrenInSessions.has(c.id))
    .map((c) => c.name);

  return {
    totalSessions,
    sessionsPerChild,
    topicsCovered,
    totalTopics,
    topicCoverageRate,
    engagementRate,
    topicBreakdown,
    childrenWithNoEducation,
  };
}

/**
 * Evaluates staff online safety training.
 */
export function evaluateStaffTraining(
  training: StaffOnlineTraining[],
  staffIds: string[],
  currentDate: string,
): StaffTrainingResult {
  const totalStaff = staffIds.length;
  const staffWithTraining = new Set(training.map((t) => t.staffId));
  const staffTrained = staffIds.filter((id) =>
    staffWithTraining.has(id),
  ).length;
  const trainingRate = pct(staffTrained, totalStaff);

  const expiredTraining = training.filter(
    (t) => t.expiryDate && t.expiryDate < currentDate,
  ).length;

  const staffMissingTraining = staffIds.filter(
    (id) => !staffWithTraining.has(id),
  );

  return {
    totalStaff,
    staffTrained,
    trainingRate,
    expiredTraining,
    staffMissingTraining,
  };
}

/**
 * Builds per-child online safety profiles.
 */
export function buildChildOnlineProfiles(
  children: OnlineSafetyChild[],
  assessments: OnlineRiskAssessment[],
  incidents: OnlineIncident[],
  sessions: OnlineEducationSession[],
  periodStart: string,
  periodEnd: string,
  currentDate: string,
): ChildOnlineProfile[] {
  const placed = children.filter((c) => c.currentPlacement);

  return placed.map((child) => {
    // Latest assessment
    const childAssessments = assessments
      .filter((a) => a.childId === child.id)
      .sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));
    const latest = childAssessments[0];
    const hasRiskAssessment = !!latest;
    const assessmentOverdue = hasRiskAssessment
      ? latest.reviewDueDate < currentDate
      : false;

    // Incidents
    const childIncidents = incidents.filter(
      (i) =>
        i.childId === child.id && inPeriod(i.date, periodStart, periodEnd),
    );
    const incidentCount = childIncidents.length;
    const highSeverityIncidents = childIncidents.filter(
      (i) => i.severity >= 4,
    ).length;

    // Education sessions
    const childSessions = sessions.filter(
      (s) =>
        s.childIds.includes(child.id) &&
        inPeriod(s.date, periodStart, periodEnd),
    );
    const educationSessionCount = childSessions.length;

    // Primary concern
    let primaryConcern: string | undefined;
    if (!hasRiskAssessment) {
      primaryConcern = "No online safety risk assessment on record";
    } else if (highSeverityIncidents >= 1) {
      primaryConcern = `${highSeverityIncidents} high-severity online incident${highSeverityIncidents !== 1 ? "s" : ""} — enhanced monitoring needed`;
    } else if (
      latest?.overallRiskLevel === "very_high" ||
      latest?.overallRiskLevel === "high"
    ) {
      primaryConcern = `Online risk level: ${latest.overallRiskLevel.replace(/_/g, " ")} — active mitigation required`;
    } else if (incidentCount >= 3) {
      primaryConcern = `${incidentCount} online incidents in period — pattern review needed`;
    } else if (educationSessionCount === 0) {
      primaryConcern = "No online safety education received in period";
    } else if (assessmentOverdue) {
      primaryConcern = "Online safety assessment overdue for review";
    }

    return {
      childId: child.id,
      childName: child.name,
      hasRiskAssessment,
      assessmentOverdue,
      overallRiskLevel: latest?.overallRiskLevel,
      riskCount: latest?.risksIdentified.length ?? 0,
      deviceAgreementSigned: latest?.deviceAgreementSigned ?? false,
      safetyMeasureCount: latest?.safetyMeasuresInPlace.length ?? 0,
      incidentCount,
      highSeverityIncidents,
      educationSessionCount,
      socialMediaAccounts: latest?.socialMediaAccounts.length ?? 0,
      primaryConcern,
    };
  });
}

// ── Main Intelligence Function ────────────────────────────────────────────────

export function generateOnlineSafetyIntelligence(
  children: OnlineSafetyChild[],
  assessments: OnlineRiskAssessment[],
  incidents: OnlineIncident[],
  educationSessions: OnlineEducationSession[],
  staffTraining: StaffOnlineTraining[],
  staffIds: string[],
  policy: OnlineSafetyPolicy,
  homeId: string,
  periodStart: string,
  periodEnd: string,
): OnlineSafetyIntelligenceResult {
  const currentDate = periodEnd;

  const riskAssessments = evaluateRiskAssessments(
    children,
    assessments,
    currentDate,
  );
  const incidentAnalysis = analyseOnlineIncidents(
    children,
    incidents,
    periodStart,
    periodEnd,
  );
  const education = evaluateEducation(
    children,
    educationSessions,
    periodStart,
    periodEnd,
  );
  const training = evaluateStaffTraining(staffTraining, staffIds, currentDate);
  const childProfiles = buildChildOnlineProfiles(
    children,
    assessments,
    incidents,
    educationSessions,
    periodStart,
    periodEnd,
    currentDate,
  );

  const policyOverdue = policy.nextReviewDue < currentDate;
  const policyCurrent = !policyOverdue;

  const policyStatus = {
    current: policyCurrent,
    overdue: policyOverdue,
    filteringInPlace: !!policy.filteringProvider,
    monitoringInPlace: !!policy.monitoringProvider,
    reportingPathway: policy.reportingPathwayDocumented,
    childFriendly: policy.childFriendlyVersion,
  };

  // ── Scoring ──────────────────────────────────────────────────────────────

  // 1. Risk assessment coverage (20)
  let riskScore = 0;
  if (riskAssessments.assessmentRate === 100) riskScore += 10;
  else if (riskAssessments.assessmentRate >= 80) riskScore += 7;
  else if (riskAssessments.assessmentRate >= 50) riskScore += 4;

  if (riskAssessments.deviceAgreementRate >= 90) riskScore += 5;
  else if (riskAssessments.deviceAgreementRate >= 70) riskScore += 3;

  if (riskAssessments.averageSafetyMeasures >= 4) riskScore += 5;
  else if (riskAssessments.averageSafetyMeasures >= 2) riskScore += 3;
  else if (riskAssessments.averageSafetyMeasures >= 1) riskScore += 1;

  riskScore = Math.min(riskScore, 20);

  // 2. Staff training (20)
  let trainingScore = 0;
  if (training.trainingRate === 100) trainingScore += 15;
  else if (training.trainingRate >= 80) trainingScore += 10;
  else if (training.trainingRate >= 50) trainingScore += 5;

  if (training.expiredTraining === 0) trainingScore += 5;
  else if (training.expiredTraining <= 1) trainingScore += 2;

  trainingScore = Math.min(trainingScore, 20);

  // 3. Safety measures / policy (15)
  let safetyScore = 0;
  if (policyStatus.current) safetyScore += 4;
  if (policyStatus.filteringInPlace) safetyScore += 3;
  if (policyStatus.monitoringInPlace) safetyScore += 3;
  if (policyStatus.reportingPathway) safetyScore += 3;
  if (policyStatus.childFriendly) safetyScore += 2;
  safetyScore = Math.min(safetyScore, 15);

  // 4. Education delivery (15)
  let educationScore = 0;
  if (education.topicCoverageRate >= 75) educationScore += 6;
  else if (education.topicCoverageRate >= 50) educationScore += 4;
  else if (education.topicCoverageRate >= 25) educationScore += 2;

  if (education.childrenWithNoEducation.length === 0) educationScore += 4;
  else if (
    education.childrenWithNoEducation.length <
    riskAssessments.totalChildren
  )
    educationScore += 2;

  if (education.engagementRate >= 80) educationScore += 3;
  else if (education.engagementRate >= 60) educationScore += 2;

  if (education.sessionsPerChild >= 3) educationScore += 2;
  else if (education.sessionsPerChild >= 1) educationScore += 1;

  educationScore = Math.min(educationScore, 15);

  // 5. Incident management (15)
  let incidentScore = 15; // Start at max, deduct for issues
  if (incidentAnalysis.totalIncidents > 0) {
    if (incidentAnalysis.resolvedRate < 100) incidentScore -= 3;
    if (incidentAnalysis.averageSeverity >= 3.5) incidentScore -= 3;
    if (incidentAnalysis.childrenWithMultipleIncidents.length > 0)
      incidentScore -= 2;

    // Serious incidents without CEOP/police when warranted
    const seriousWithoutReferral = incidents.filter(
      (i) =>
        inPeriod(i.date, periodStart, periodEnd) &&
        i.severity >= 4 &&
        !i.ceopReferral &&
        !i.policeInvolved,
    ).length;
    if (seriousWithoutReferral > 0)
      incidentScore -= Math.min(seriousWithoutReferral * 3, 6);
  }
  incidentScore = Math.max(0, incidentScore);

  // 6. Penalties for high-risk children without mitigations
  let penaltyScore = 0;
  const highRiskWithoutMeasures = childProfiles.filter(
    (p) =>
      (p.overallRiskLevel === "high" || p.overallRiskLevel === "very_high") &&
      p.safetyMeasureCount < 3,
  ).length;
  if (highRiskWithoutMeasures > 0) penaltyScore += highRiskWithoutMeasures * 3;

  const overallScore = Math.min(
    100,
    Math.max(
      0,
      riskScore +
        trainingScore +
        safetyScore +
        educationScore +
        incidentScore -
        penaltyScore,
    ),
  );

  // ── Rating ──────────────────────────────────────────────────────────────
  const rating: OnlineSafetyIntelligenceResult["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths / Areas / Actions ─────────────────────────────────────────
  const strengths: string[] = [];
  const areasForDevelopment: string[] = [];
  const immediateActions: string[] = [];

  if (riskAssessments.assessmentRate === 100) {
    strengths.push("All children have online safety risk assessments");
  }
  if (riskAssessments.deviceAgreementRate === 100) {
    strengths.push("All children have signed device usage agreements");
  }
  if (training.trainingRate === 100) {
    strengths.push("All staff trained in online safety");
  }
  if (education.topicCoverageRate >= 75) {
    strengths.push(
      `Strong e-safety education coverage — ${education.topicCoverageRate}% of topics delivered`,
    );
  }
  if (
    incidentAnalysis.totalIncidents > 0 &&
    incidentAnalysis.resolvedRate === 100
  ) {
    strengths.push("All online safety incidents fully resolved");
  }
  if (incidentAnalysis.totalIncidents === 0) {
    strengths.push("No online safety incidents in period");
  }
  if (policyStatus.current && policyStatus.filteringInPlace) {
    strengths.push(
      "Online safety policy current with filtering and monitoring in place",
    );
  }
  if (strengths.length === 0) {
    strengths.push("No significant strengths identified — improvement needed");
  }

  // Areas for development
  if (riskAssessments.assessmentRate < 100) {
    areasForDevelopment.push(
      `${riskAssessments.totalChildren - riskAssessments.childrenWithAssessment} child${riskAssessments.totalChildren - riskAssessments.childrenWithAssessment !== 1 ? "ren" : ""} lack online safety risk assessments`,
    );
  }
  if (education.childrenWithNoEducation.length > 0) {
    areasForDevelopment.push(
      `${education.childrenWithNoEducation.join(", ")} received no e-safety education`,
    );
  }
  if (training.trainingRate < 100) {
    areasForDevelopment.push(
      `Online safety training incomplete — ${training.trainingRate}% staff trained`,
    );
  }
  if (riskAssessments.overdueAssessments > 0) {
    areasForDevelopment.push(
      `${riskAssessments.overdueAssessments} risk assessment${riskAssessments.overdueAssessments !== 1 ? "s" : ""} overdue for review`,
    );
  }
  if (policyStatus.overdue) {
    areasForDevelopment.push("Online safety policy overdue for review");
  }
  if (areasForDevelopment.length === 0) {
    areasForDevelopment.push("No significant areas for development identified");
  }

  // Immediate actions
  const childrenMissingAssessment = childProfiles.filter(
    (p) => !p.hasRiskAssessment,
  );
  if (childrenMissingAssessment.length > 0) {
    immediateActions.push(
      `URGENT: Complete online safety risk assessments for ${childrenMissingAssessment.map((p) => p.childName).join(", ")} — KCSIE requirement`,
    );
  }

  const highRiskChildren = childProfiles.filter(
    (p) => p.highSeverityIncidents > 0,
  );
  if (highRiskChildren.length > 0) {
    immediateActions.push(
      `URGENT: ${highRiskChildren.map((p) => p.childName).join(", ")} had high-severity online incident(s) — ensure enhanced monitoring and support`,
    );
  }

  if (policyStatus.overdue) {
    immediateActions.push(
      "HIGH: Online safety policy overdue — review and update immediately",
    );
  }

  if (training.staffMissingTraining.length > 0) {
    immediateActions.push(
      `HIGH: Schedule online safety training for ${training.staffMissingTraining.length} untrained staff member${training.staffMissingTraining.length !== 1 ? "s" : ""}`,
    );
  }

  if (incidentAnalysis.childrenWithMultipleIncidents.length > 0) {
    immediateActions.push(
      `MEDIUM: Review online safety plan for ${incidentAnalysis.childrenWithMultipleIncidents.join(", ")} — multiple incidents pattern`,
    );
  }

  if (immediateActions.length === 0) {
    immediateActions.push(
      "No immediate actions required — online safety framework is robust",
    );
  }

  // Regulatory links
  const regulatoryLinks: string[] = [
    "KCSIE 2024 Part 2 — Online safety responsibilities for all staff",
    "CHR 2015 Reg 12 — Protection of children (including online harm)",
    "Working Together 2023 — Online exploitation and abuse recognition",
    "Online Safety Act 2023 — Duties regarding online harms",
    "UNCRC Articles 16 & 17 — Privacy rights balanced with information access",
    "CEOP Command — Reporting pathway for online child exploitation",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    riskAssessments,
    incidentAnalysis,
    education,
    staffTraining: training,
    childProfiles,
    policyStatus,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}
