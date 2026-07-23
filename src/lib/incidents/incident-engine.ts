// ══════════════════════════════════════════════════════════════════════════════
// Cara Incidents & Restraint — Compliance Engine
//
// Deterministic engine for managing incident records, physical intervention
// tracking, de-escalation compliance, and behavioural analysis.
//
// Aligned to:
//   - CHR 2015 Reg 35 — Behaviour management (no corporal punishment)
//   - CHR 2015 Reg 36 — Use of physical restraint
//   - CHR 2015 Reg 40(2)(a) — Record of restraints
//   - BILD/RRN Restraint Reduction Network standards
//   - DfE guidance on reducing restraint in children's homes
//
// Recording requirements for physical interventions:
//   1. Name of child, date/time, location
//   2. Staff involved (all persons)
//   3. Reason (immediate danger of harm)
//   4. De-escalation techniques attempted before restraint
//   5. Type of hold/intervention used
//   6. Duration of restraint
//   7. Injuries sustained (child or staff)
//   8. Post-incident debrief (child AND staff)
//   9. Medical attention provided
//  10. Notification: RM, social worker, parent/carer, Ofsted (if serious)
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { rate } from "../metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type IncidentCategory =
  | "physical_intervention"       // restraint applied
  | "verbal_aggression"           // threats, shouting, intimidation
  | "physical_aggression"         // violence without restraint needed
  | "self_harm"                   // self-injurious behaviour
  | "property_damage"             // damage to items/environment
  | "absconding"                  // leaving without permission (cross-ref missing)
  | "substance_use"              // alcohol, drugs, NPS
  | "criminal_behaviour"          // police-involved offence
  | "safeguarding_concern"        // disclosure, allegation, harm
  | "medication_error"            // wrong dose, refusal, missed
  | "near_miss"                   // something that could have caused harm
  | "other";

export type IncidentSeverity = 1 | 2 | 3 | 4 | 5;
// 1 = Minor (recorded for completeness)
// 2 = Low (no injury, minimal impact)
// 3 = Moderate (minor injury or significant disruption)
// 4 = Serious (injury requiring first aid, Ofsted notification)
// 5 = Critical (hospital attendance, police, strategy discussion)

export type RestraintType =
  | "standing_hold"
  | "seated_hold"
  | "ground_hold"
  | "escort"
  | "separation"           // guided to separate area
  | "wrap"                 // therapeutic hold
  | "other";

export type DeEscalationTechnique =
  | "verbal_reassurance"
  | "distraction"
  | "offering_choices"
  | "change_of_staff"
  | "change_of_environment"
  | "time_away"
  | "sensory_regulation"
  | "planned_ignoring"
  | "humour"
  | "scripted_response"
  | "low_arousal_approach";

export type PostIncidentAction =
  | "child_debrief"
  | "staff_debrief"
  | "medical_check"
  | "body_map_completed"
  | "parent_notified"
  | "social_worker_notified"
  | "rm_notified"
  | "ofsted_notified"
  | "police_notified"
  | "risk_assessment_updated"
  | "care_plan_updated"
  | "referral_made";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface Incident {
  id: string;
  childId: string;
  childName: string;
  homeId: string;
  category: IncidentCategory;
  severity: IncidentSeverity;

  // Timing
  occurredAt: string;
  reportedAt: string;
  location: string;

  // Description
  description: string;
  antecedent: string;          // what happened before (ABC model)
  behaviour: string;           // the behaviour observed
  consequence: string;         // what happened after

  // People
  staffInvolved: string[];
  staffWitnesses: string[];
  childrenAffected: string[];  // other children impacted

  // Physical intervention specifics (if applicable)
  restraint?: RestraintRecord;

  // De-escalation
  deEscalationAttempted: boolean;
  deEscalationTechniques: DeEscalationTechnique[];

  // Post-incident
  postIncidentActions: PostIncidentAction[];
  injuries: InjuryRecord[];
  notifications: NotificationRecord[];

  // Compliance
  completedWithin24h: boolean;
  signedOffBy?: string;
  signedOffAt?: string;

  // Metadata
  loggedBy: string;
  loggedAt: string;
}

export interface RestraintRecord {
  type: RestraintType;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  reason: string;               // must be "immediate danger of harm"
  staffApplyingRestraint: string[];
  approvedTechnique: boolean;   // is the technique from approved training
  trainingProvider: string;     // e.g., "PRICE", "Team Teach", "MAPA"
  childDebriefed: boolean;
  childDebriefDate?: string;
  staffDebriefed: boolean;
  staffDebriefDate?: string;
}

export interface InjuryRecord {
  person: string;                // child name or staff name
  personType: "child" | "staff";
  description: string;
  bodyMapCompleted: boolean;
  medicalAttentionRequired: boolean;
  medicalAttentionProvided: boolean;
  hospitalAttendance: boolean;
}

export interface NotificationRecord {
  recipient: string;            // e.g., "Social Worker — Jane Smith"
  type: PostIncidentAction;
  notifiedAt: string;
  method: "phone" | "email" | "in_person" | "form";
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface IncidentComplianceResult {
  incidentId: string;
  isCompliant: boolean;
  issues: string[];
  restraintCompliant: boolean | null; // null if no restraint
  deEscalationDocumented: boolean;
  notificationsComplete: boolean;
  recordedWithin24h: boolean;
  postIncidentComplete: boolean;
}

export interface RestraintAnalysis {
  homeId: string;
  totalRestraints: number;
  restraintsThisMonth: number;
  restraintsThisQuarter: number;
  averageDurationMinutes: number;
  longestDurationMinutes: number;
  childrenRestrained: number;
  staffInvolved: number;
  // Null across the board when no restraint has been recorded: there is
  // nothing to rate, which is not the same as perfect practice.
  approvedTechniqueRate: number | null;     // %
  deEscalationAttemptedRate: number | null; // %
  childDebriefRate: number | null;          // %
  staffDebriefRate: number | null;          // %
  injuryRate: number | null;                // % incidents with injuries
  trend: "increasing" | "stable" | "decreasing";
  byChild: { childId: string; childName: string; count: number }[];
  byStaff: { staffId: string; count: number }[];
  byTimeOfDay: { period: string; count: number }[];
}

export interface IncidentMetrics {
  homeId: string;
  totalIncidents: number;
  incidentsThisMonth: number;
  incidentsThisQuarter: number;
  bySeverity: { severity: IncidentSeverity; count: number }[];
  byCategory: { category: IncidentCategory; count: number }[];
  complianceRate: number | null;     // %; null = no incidents recorded
  averageResponseMinutes: number | null; // report time - occurred time; null = no incidents
  childrenInvolved: number;
  repeatPatterns: { childId: string; childName: string; count: number }[];
  requiresOfstedNotification: number;
  restraintMetrics: RestraintAnalysis;
}

// ── Configuration ──────────────────────────────────────────────────────────

const MAX_REPORT_HOURS = 24;         // must record within 24 hours
const OFSTED_SEVERITY_THRESHOLD = 4; // severity 4+ requires Ofsted notification
const MAX_RESTRAINT_MINUTES = 20;    // flag if restraint exceeds 20 minutes

// ── Core: Evaluate Incident Compliance ───────────────────────────────────

export function evaluateIncidentCompliance(
  incident: Incident,
): IncidentComplianceResult {
  const issues: string[] = [];

  // 1. Recorded within 24h
  const occurredTime = new Date(incident.occurredAt).getTime();
  const reportedTime = new Date(incident.reportedAt).getTime();
  const hoursToReport = (reportedTime - occurredTime) / (60 * 60 * 1000);
  const recordedWithin24h = hoursToReport <= MAX_REPORT_HOURS;
  if (!recordedWithin24h) {
    issues.push(`Incident recorded ${Math.round(hoursToReport)}h after occurrence (max: ${MAX_REPORT_HOURS}h).`);
  }

  // 2. De-escalation documentation
  const deEscalationDocumented = incident.deEscalationAttempted &&
    incident.deEscalationTechniques.length > 0;
  if (incident.category === "physical_intervention" && !deEscalationDocumented) {
    issues.push("Physical intervention without documented de-escalation attempts.");
  }

  // 3. Restraint compliance (if applicable)
  let restraintCompliant: boolean | null = null;
  if (incident.restraint) {
    restraintCompliant = evaluateRestraintCompliance(incident.restraint, issues);
  }

  // 4. Notifications
  const notificationsComplete = checkNotifications(incident, issues);

  // 5. Post-incident actions
  const postIncidentComplete = checkPostIncidentActions(incident, issues);

  const isCompliant = issues.length === 0;

  return {
    incidentId: incident.id,
    isCompliant,
    issues,
    restraintCompliant,
    deEscalationDocumented,
    notificationsComplete,
    recordedWithin24h,
    postIncidentComplete,
  };
}

function evaluateRestraintCompliance(restraint: RestraintRecord, issues: string[]): boolean {
  let compliant = true;

  if (!restraint.approvedTechnique) {
    issues.push("Restraint technique not from approved training programme.");
    compliant = false;
  }

  if (restraint.durationMinutes > MAX_RESTRAINT_MINUTES) {
    issues.push(`Restraint duration ${restraint.durationMinutes} minutes exceeds ${MAX_RESTRAINT_MINUTES}-minute threshold.`);
    compliant = false;
  }

  if (!restraint.childDebriefed) {
    issues.push("Child not debriefed following physical intervention.");
    compliant = false;
  }

  if (!restraint.staffDebriefed) {
    issues.push("Staff not debriefed following physical intervention.");
    compliant = false;
  }

  if (restraint.staffApplyingRestraint.length === 0) {
    issues.push("No staff identified as applying restraint.");
    compliant = false;
  }

  return compliant;
}

function checkNotifications(incident: Incident, issues: string[]): boolean {
  let complete = true;

  // RM must be notified for severity 3+
  if (incident.severity >= 3 && !incident.postIncidentActions.includes("rm_notified")) {
    issues.push("Registered Manager not notified (required for severity 3+).");
    complete = false;
  }

  // Social worker for severity 3+
  if (incident.severity >= 3 && !incident.postIncidentActions.includes("social_worker_notified")) {
    issues.push("Social worker not notified (required for severity 3+).");
    complete = false;
  }

  // Ofsted for severity 4+
  if (incident.severity >= OFSTED_SEVERITY_THRESHOLD && !incident.postIncidentActions.includes("ofsted_notified")) {
    issues.push("Ofsted not notified (required for severity 4+).");
    complete = false;
  }

  // Parent/carer for all incidents
  if (!incident.postIncidentActions.includes("parent_notified")) {
    issues.push("Parent/carer not notified.");
    complete = false;
  }

  return complete;
}

function checkPostIncidentActions(incident: Incident, issues: string[]): boolean {
  let complete = true;

  // Child debrief always required
  if (!incident.postIncidentActions.includes("child_debrief")) {
    issues.push("Child debrief not recorded.");
    complete = false;
  }

  // Staff debrief for physical intervention or severity 3+
  if (
    (incident.category === "physical_intervention" || incident.severity >= 3) &&
    !incident.postIncidentActions.includes("staff_debrief")
  ) {
    issues.push("Staff debrief not recorded (required for PI or severity 3+).");
    complete = false;
  }

  // Medical check if injuries
  if (incident.injuries.length > 0 && !incident.postIncidentActions.includes("medical_check")) {
    issues.push("Medical check not documented despite injuries recorded.");
    complete = false;
  }

  // Body map for child injuries
  const childInjuries = incident.injuries.filter(i => i.personType === "child");
  if (childInjuries.length > 0 && !childInjuries.every(i => i.bodyMapCompleted)) {
    issues.push("Body map not completed for all child injuries.");
    complete = false;
  }

  return complete;
}

// ── Core: Restraint Analysis ─────────────────────────────────────────────

export function analyzeRestraints(
  incidents: Incident[],
  homeId: string,
  now?: string,
): RestraintAnalysis {
  const currentDate = now ? new Date(now) : new Date();
  const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const thisQuarter = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1);
  const threeMonthsAgo = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000);

  const homeIncidents = incidents.filter(i =>
    i.homeId === homeId && i.category === "physical_intervention" && i.restraint,
  );

  const thisMonthRestraints = homeIncidents.filter(i => new Date(i.occurredAt) >= thisMonth);
  const thisQuarterRestraints = homeIncidents.filter(i => new Date(i.occurredAt) >= thisQuarter);

  // Duration stats
  const durations = homeIncidents.map(i => i.restraint!.durationMinutes);
  const averageDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  const longestDuration = durations.length > 0 ? Math.max(...durations) : 0;

  // People
  const uniqueChildren = new Set(homeIncidents.map(i => i.childId));
  const allStaff = new Set(homeIncidents.flatMap(i => i.restraint!.staffApplyingRestraint));

  // Rates
  const approvedCount = homeIncidents.filter(i => i.restraint!.approvedTechnique).length;
  const deEscCount = homeIncidents.filter(i => i.deEscalationAttempted).length;
  const childDebriefCount = homeIncidents.filter(i => i.restraint!.childDebriefed).length;
  const staffDebriefCount = homeIncidents.filter(i => i.restraint!.staffDebriefed).length;
  const injuryCount = homeIncidents.filter(i => i.injuries.length > 0).length;

  const total = homeIncidents.length;
  const approvedTechniqueRate = rate(approvedCount, total);
  const deEscalationAttemptedRate = rate(deEscCount, total);
  const childDebriefRate = rate(childDebriefCount, total);
  const staffDebriefRate = rate(staffDebriefCount, total);
  const injuryRate = rate(injuryCount, total);

  // Trend (compare recent vs older)
  const recentRestraints = homeIncidents.filter(i => new Date(i.occurredAt) >= threeMonthsAgo);
  const olderRestraints = homeIncidents.filter(i => new Date(i.occurredAt) < threeMonthsAgo);
  let trend: RestraintAnalysis["trend"];
  if (recentRestraints.length > olderRestraints.length) trend = "increasing";
  else if (recentRestraints.length < olderRestraints.length) trend = "decreasing";
  else trend = "stable";

  // By child
  const childCounts = new Map<string, { name: string; count: number }>();
  for (const inc of homeIncidents) {
    const existing = childCounts.get(inc.childId);
    if (existing) existing.count++;
    else childCounts.set(inc.childId, { name: inc.childName, count: 1 });
  }
  const byChild = Array.from(childCounts.entries())
    .map(([childId, { name, count }]) => ({ childId, childName: name, count }))
    .sort((a, b) => b.count - a.count);

  // By staff
  const staffCounts = new Map<string, number>();
  for (const inc of homeIncidents) {
    for (const s of inc.restraint!.staffApplyingRestraint) {
      staffCounts.set(s, (staffCounts.get(s) ?? 0) + 1);
    }
  }
  const byStaff = Array.from(staffCounts.entries())
    .map(([staffId, count]) => ({ staffId, count }))
    .sort((a, b) => b.count - a.count);

  // By time of day
  const timePeriods = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  for (const inc of homeIncidents) {
    const hour = new Date(inc.occurredAt).getUTCHours();
    if (hour >= 6 && hour < 12) timePeriods.morning++;
    else if (hour >= 12 && hour < 17) timePeriods.afternoon++;
    else if (hour >= 17 && hour < 22) timePeriods.evening++;
    else timePeriods.night++;
  }
  const byTimeOfDay = Object.entries(timePeriods)
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => b.count - a.count);

  return {
    homeId,
    totalRestraints: total,
    restraintsThisMonth: thisMonthRestraints.length,
    restraintsThisQuarter: thisQuarterRestraints.length,
    averageDurationMinutes: averageDuration,
    longestDurationMinutes: longestDuration,
    childrenRestrained: uniqueChildren.size,
    staffInvolved: allStaff.size,
    approvedTechniqueRate,
    deEscalationAttemptedRate,
    childDebriefRate,
    staffDebriefRate,
    injuryRate,
    trend,
    byChild,
    byStaff,
    byTimeOfDay,
  };
}

// ── Core: Home Incident Metrics ──────────────────────────────────────────

export function calculateIncidentMetrics(
  incidents: Incident[],
  homeId: string,
  now?: string,
): IncidentMetrics {
  const currentDate = now ? new Date(now) : new Date();
  const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const thisQuarter = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1);

  const homeIncidents = incidents.filter(i => i.homeId === homeId);

  const incidentsThisMonth = homeIncidents.filter(i => new Date(i.occurredAt) >= thisMonth).length;
  const incidentsThisQuarter = homeIncidents.filter(i => new Date(i.occurredAt) >= thisQuarter).length;

  // By severity
  const severityCounts = new Map<IncidentSeverity, number>();
  for (const inc of homeIncidents) {
    severityCounts.set(inc.severity, (severityCounts.get(inc.severity) ?? 0) + 1);
  }
  const bySeverity = ([1, 2, 3, 4, 5] as IncidentSeverity[]).map(severity => ({
    severity,
    count: severityCounts.get(severity) ?? 0,
  }));

  // By category
  const categoryCounts = new Map<IncidentCategory, number>();
  for (const inc of homeIncidents) {
    categoryCounts.set(inc.category, (categoryCounts.get(inc.category) ?? 0) + 1);
  }
  const byCategory = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Compliance rate
  const complianceResults = homeIncidents.map(evaluateIncidentCompliance);
  const compliantCount = complianceResults.filter(r => r.isCompliant).length;
  const complianceRate = rate(compliantCount, homeIncidents.length);

  // Average response time
  const responseTimes = homeIncidents.map(i => {
    const occurred = new Date(i.occurredAt).getTime();
    const reported = new Date(i.reportedAt).getTime();
    return (reported - occurred) / (60 * 1000);
  });
  const averageResponseMinutes = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : null;

  // Children involved
  const uniqueChildren = new Set(homeIncidents.map(i => i.childId));

  // Repeat patterns
  const childIncidentCounts = new Map<string, { name: string; count: number }>();
  for (const inc of homeIncidents) {
    const existing = childIncidentCounts.get(inc.childId);
    if (existing) existing.count++;
    else childIncidentCounts.set(inc.childId, { name: inc.childName, count: 1 });
  }
  const repeatPatterns = Array.from(childIncidentCounts.entries())
    .filter(([_, v]) => v.count >= 3)
    .map(([childId, { name, count }]) => ({ childId, childName: name, count }))
    .sort((a, b) => b.count - a.count);

  // Ofsted notifications required
  const requiresOfstedNotification = homeIncidents.filter(i => i.severity >= OFSTED_SEVERITY_THRESHOLD).length;

  // Restraint sub-analysis
  const restraintMetrics = analyzeRestraints(incidents, homeId, now);

  return {
    homeId,
    totalIncidents: homeIncidents.length,
    incidentsThisMonth,
    incidentsThisQuarter,
    bySeverity,
    byCategory,
    complianceRate,
    averageResponseMinutes,
    childrenInvolved: uniqueChildren.size,
    repeatPatterns,
    requiresOfstedNotification,
    restraintMetrics,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function getSeverityLabel(severity: IncidentSeverity): string {
  const labels: Record<IncidentSeverity, string> = {
    1: "Minor",
    2: "Low",
    3: "Moderate",
    4: "Serious",
    5: "Critical",
  };
  return labels[severity];
}

export function getCategoryLabel(category: IncidentCategory): string {
  const labels: Record<IncidentCategory, string> = {
    physical_intervention: "Physical Intervention",
    verbal_aggression: "Verbal Aggression",
    physical_aggression: "Physical Aggression",
    self_harm: "Self-Harm",
    property_damage: "Property Damage",
    absconding: "Absconding",
    substance_use: "Substance Use",
    criminal_behaviour: "Criminal Behaviour",
    safeguarding_concern: "Safeguarding Concern",
    medication_error: "Medication Error",
    near_miss: "Near Miss",
    other: "Other",
  };
  return labels[category];
}

export function getRestraintTypeLabel(type: RestraintType): string {
  const labels: Record<RestraintType, string> = {
    standing_hold: "Standing Hold",
    seated_hold: "Seated Hold",
    ground_hold: "Ground Hold",
    escort: "Escort / Guide Away",
    separation: "Separation",
    wrap: "Therapeutic Wrap",
    other: "Other",
  };
  return labels[type];
}
