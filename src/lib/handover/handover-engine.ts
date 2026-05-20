/* ──────────────────────────────────────────────────────────────
   Handover Intelligence Engine

   Pure deterministic engine for evaluating how effectively a
   children's residential home manages shift handovers — ensuring
   critical information is reliably transferred between staff at
   every shift change.

   Regulatory basis:
     - CHR 2015 Reg 22 — Records to be kept
     - CHR 2015 Reg 13 — Leadership and management
     - NMS 19 — Staffing and supervision
     - SCCIF — Leadership: communication and information sharing
     - Children Act 1989 s.22 — Duty of care
     - Quality Standards 2015 — Standard 7 (effective management)
     - CHR 2015 Reg 5 — Fitness of employees

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type HandoverCategory =
  | "shift_handover"
  | "medication_handover"
  | "incident_handover"
  | "child_update"
  | "risk_update"
  | "appointment_reminder"
  | "contact_update"
  | "task_completion";

export type HandoverOutcome =
  | "fully_communicated"
  | "partially_communicated"
  | "information_gap"
  | "follow_up_required"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const handoverCategoryLabels: Record<HandoverCategory, string> = {
  shift_handover: "Shift Handover",
  medication_handover: "Medication Handover",
  incident_handover: "Incident Handover",
  child_update: "Child Update",
  risk_update: "Risk Update",
  appointment_reminder: "Appointment Reminder",
  contact_update: "Contact Update",
  task_completion: "Task Completion",
};

const handoverOutcomeLabels: Record<HandoverOutcome, string> = {
  fully_communicated: "Fully Communicated",
  partially_communicated: "Partially Communicated",
  information_gap: "Information Gap",
  follow_up_required: "Follow-up Required",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getHandoverCategoryLabel(category: HandoverCategory): string {
  return handoverCategoryLabels[category];
}

export function getHandoverOutcomeLabel(outcome: HandoverOutcome): string {
  return handoverOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface HandoverRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: HandoverCategory;
  outcome: HandoverOutcome;
  allChildrenCovered: boolean;
  medicationStatusUpdated: boolean;
  incidentsCommunicated: boolean;
  tasksHandedOver: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface HandoverPolicy {
  handoverPolicy: boolean;
  shiftHandoverProcedure: boolean;
  medicationHandoverProtocol: boolean;
  incidentCommunicationPolicy: boolean;
  taskTrackingProcedure: boolean;
  handoverRecordKeeping: boolean;
  handoverAuditPolicy: boolean;
}

export interface StaffHandoverTraining {
  staffId: string;
  handoverCommunication: boolean;
  medicationHandoverSkills: boolean;
  incidentReporting: boolean;
  taskPrioritisation: boolean;
  childStatusAssessment: boolean;
  handoverDocumentation: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface HandoverQualityResult {
  totalRecords: number;
  allChildrenCoveredRate: number;
  medicationStatusUpdatedRate: number;
  incidentsCommunicatedRate: number;
  tasksHandedOverRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface HandoverComplianceResult {
  totalRecords: number;
  documentationRate: number;
  timelyRecordingRate: number;
  allChildrenCoveredRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface HandoverPolicyResult {
  handoverPolicy: boolean;
  shiftHandoverProcedure: boolean;
  medicationHandoverProtocol: boolean;
  incidentCommunicationPolicy: boolean;
  taskTrackingProcedure: boolean;
  handoverRecordKeeping: boolean;
  handoverAuditPolicy: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface StaffHandoverReadinessResult {
  totalStaff: number;
  handoverCommunicationRate: number;
  medicationHandoverSkillsRate: number;
  incidentReportingRate: number;
  taskPrioritisationRate: number;
  childStatusAssessmentRate: number;
  handoverDocumentationRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface ChildHandoverProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  allChildrenCoveredRate: number;
  medicationStatusUpdatedRate: number;
  uniqueCategories: number;
  handoverScore: number;
}

export interface HandoverIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  handoverQuality: HandoverQualityResult;
  handoverCompliance: HandoverComplianceResult;
  handoverPolicy: HandoverPolicyResult;
  staffReadiness: StaffHandoverReadinessResult;
  childProfiles: ChildHandoverProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Handover Quality (0-25) ─────────────────────────────────

export function evaluateHandoverQuality(
  records: HandoverRecord[],
): HandoverQualityResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      allChildrenCoveredRate: 0,
      medicationStatusUpdatedRate: 0,
      incidentsCommunicatedRate: 0,
      tasksHandedOverRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No handover records found — handover quality cannot be assessed"],
    };
  }

  const coveredCount = records.filter((r) => r.allChildrenCovered).length;
  const allChildrenCoveredRate = pct(coveredCount, totalRecords);

  const medCount = records.filter((r) => r.medicationStatusUpdated).length;
  const medicationStatusUpdatedRate = pct(medCount, totalRecords);

  const incidentCount = records.filter((r) => r.incidentsCommunicated).length;
  const incidentsCommunicatedRate = pct(incidentCount, totalRecords);

  const taskCount = records.filter((r) => r.tasksHandedOver).length;
  const tasksHandedOverRate = pct(taskCount, totalRecords);

  // Weights: allChildrenCoveredRate 7 + medicationStatusUpdatedRate 6 + incidentsCommunicatedRate 6 + tasksHandedOverRate 6 = 25
  let score = 0;
  score += (allChildrenCoveredRate / 100) * 7;
  score += (medicationStatusUpdatedRate / 100) * 6;
  score += (incidentsCommunicatedRate / 100) * 6;
  score += (tasksHandedOverRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (allChildrenCoveredRate >= 80) {
    strengths.push("Strong child coverage in handovers: " + allChildrenCoveredRate + "% of handovers cover all children");
  } else if (allChildrenCoveredRate < 50) {
    concerns.push("Child coverage rate at " + allChildrenCoveredRate + "% — not all children consistently included in handovers");
  }

  if (medicationStatusUpdatedRate >= 80) {
    strengths.push("Excellent medication handover: " + medicationStatusUpdatedRate + "% of handovers include medication updates");
  } else if (medicationStatusUpdatedRate < 50) {
    concerns.push("Medication update rate at " + medicationStatusUpdatedRate + "% — medication safety at risk");
  }

  if (incidentsCommunicatedRate >= 80) {
    strengths.push("Good incident communication: " + incidentsCommunicatedRate + "% of handovers include incident briefing");
  } else if (incidentsCommunicatedRate < 50) {
    concerns.push("Incident communication rate at " + incidentsCommunicatedRate + "% — critical information may not transfer between shifts");
  }

  if (tasksHandedOverRate >= 80) {
    strengths.push("Strong task handover: " + tasksHandedOverRate + "% of handovers include task transfer");
  } else if (tasksHandedOverRate < 50) {
    concerns.push("Task handover rate at " + tasksHandedOverRate + "% — tasks may be dropped between shifts");
  }

  return {
    totalRecords,
    allChildrenCoveredRate,
    medicationStatusUpdatedRate,
    incidentsCommunicatedRate,
    tasksHandedOverRate,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 2: Handover Compliance (0-25) ──────────────────────────────

export function evaluateHandoverCompliance(
  records: HandoverRecord[],
): HandoverComplianceResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      documentationRate: 0,
      timelyRecordingRate: 0,
      allChildrenCoveredRate: 0,
      categoryDiversityRatio: 0,
      uniqueCategories: 0,
      score: 0,
      strengths: [],
      concerns: ["No handover records found — compliance cannot be assessed"],
    };
  }

  const docCount = records.filter((r) => r.documentationComplete).length;
  const documentationRate = pct(docCount, totalRecords);

  const timelyCount = records.filter((r) => r.timelyRecording).length;
  const timelyRecordingRate = pct(timelyCount, totalRecords);

  const coveredCount = records.filter((r) => r.allChildrenCovered).length;
  const allChildrenCoveredRate = pct(coveredCount, totalRecords);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  // Weights: documentationRate 8 + timelyRecordingRate 7 + allChildrenCoveredRate 5 + categoryDiversityRatio 5 = 25
  let score = 0;
  score += (documentationRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (allChildrenCoveredRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (documentationRate >= 90) {
    strengths.push("Excellent documentation: " + documentationRate + "% of handovers fully documented");
  } else if (documentationRate < 50) {
    concerns.push("Documentation rate at " + documentationRate + "% — handover records are incomplete");
  }

  if (timelyRecordingRate >= 90) {
    strengths.push("Timely recording: " + timelyRecordingRate + "% of handovers recorded on time");
  } else if (timelyRecordingRate < 50) {
    concerns.push("Timely recording rate at " + timelyRecordingRate + "% — handovers not recorded promptly");
  }

  if (allChildrenCoveredRate >= 90) {
    strengths.push("Comprehensive child coverage: " + allChildrenCoveredRate + "% of handovers cover all children");
  } else if (allChildrenCoveredRate < 50) {
    concerns.push("Child coverage at " + allChildrenCoveredRate + "% — gaps in information transfer for some children");
  }

  if (uniqueCategories >= 6) {
    strengths.push("Comprehensive handover coverage: " + uniqueCategories + " of 8 categories represented");
  } else if (uniqueCategories <= 2) {
    concerns.push("Only " + uniqueCategories + " handover category(ies) covered — limited handover scope");
  }

  return {
    totalRecords,
    documentationRate,
    timelyRecordingRate,
    allChildrenCoveredRate,
    categoryDiversityRatio,
    uniqueCategories,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 3: Handover Policy (0-25) ──────────────────────────────────

export function evaluateHandoverPolicy(
  policy: HandoverPolicy | null,
): HandoverPolicyResult {
  if (policy === null) {
    return {
      handoverPolicy: false,
      shiftHandoverProcedure: false,
      medicationHandoverProtocol: false,
      incidentCommunicationPolicy: false,
      taskTrackingProcedure: false,
      handoverRecordKeeping: false,
      handoverAuditPolicy: false,
      score: 0,
      strengths: [],
      concerns: ["No handover policy in place — URGENT: develop comprehensive handover policy immediately"],
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.handoverPolicy) score += 4;
  if (policy.shiftHandoverProcedure) score += 4;
  if (policy.medicationHandoverProtocol) score += 4;
  if (policy.incidentCommunicationPolicy) score += 4;
  if (policy.taskTrackingProcedure) score += 3;
  if (policy.handoverRecordKeeping) score += 3;
  if (policy.handoverAuditPolicy) score += 3;

  const strengths: string[] = [];
  const concerns: string[] = [];

  const trueCount = [
    policy.handoverPolicy,
    policy.shiftHandoverProcedure,
    policy.medicationHandoverProtocol,
    policy.incidentCommunicationPolicy,
    policy.taskTrackingProcedure,
    policy.handoverRecordKeeping,
    policy.handoverAuditPolicy,
  ].filter(Boolean).length;

  if (trueCount === 7) {
    strengths.push("Complete handover policy framework in place (7/7 components)");
  } else if (trueCount >= 5) {
    strengths.push("Good policy coverage: " + trueCount + "/7 handover policy components in place");
  }

  if (!policy.handoverPolicy) {
    concerns.push("No overarching handover policy — staff may lack clear guidance on handover expectations");
  }
  if (!policy.shiftHandoverProcedure) {
    concerns.push("No shift handover procedure — inconsistent handover practice may result");
  }
  if (!policy.medicationHandoverProtocol) {
    concerns.push("No medication handover protocol — medication safety at risk during shift changes");
  }
  if (!policy.incidentCommunicationPolicy) {
    concerns.push("No incident communication policy — critical incidents may not be relayed between shifts");
  }
  if (!policy.taskTrackingProcedure) {
    concerns.push("No task tracking procedure — tasks may be dropped between shifts");
  }
  if (!policy.handoverRecordKeeping) {
    concerns.push("No handover record-keeping procedure — audit trail compromised");
  }
  if (!policy.handoverAuditPolicy) {
    concerns.push("No handover audit policy — quality of handovers cannot be monitored");
  }

  return {
    handoverPolicy: policy.handoverPolicy,
    shiftHandoverProcedure: policy.shiftHandoverProcedure,
    medicationHandoverProtocol: policy.medicationHandoverProtocol,
    incidentCommunicationPolicy: policy.incidentCommunicationPolicy,
    taskTrackingProcedure: policy.taskTrackingProcedure,
    handoverRecordKeeping: policy.handoverRecordKeeping,
    handoverAuditPolicy: policy.handoverAuditPolicy,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 4: Staff Handover Readiness (0-25) ─────────────────────────

export function evaluateStaffHandoverReadiness(
  training: StaffHandoverTraining[],
): StaffHandoverReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      handoverCommunicationRate: 0,
      medicationHandoverSkillsRate: 0,
      incidentReportingRate: 0,
      taskPrioritisationRate: 0,
      childStatusAssessmentRate: 0,
      handoverDocumentationRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff training records — URGENT: schedule handover training for all staff"],
    };
  }

  const commCount = training.filter((t) => t.handoverCommunication).length;
  const handoverCommunicationRate = pct(commCount, totalStaff);

  const medCount = training.filter((t) => t.medicationHandoverSkills).length;
  const medicationHandoverSkillsRate = pct(medCount, totalStaff);

  const incidentCount = training.filter((t) => t.incidentReporting).length;
  const incidentReportingRate = pct(incidentCount, totalStaff);

  const taskCount = training.filter((t) => t.taskPrioritisation).length;
  const taskPrioritisationRate = pct(taskCount, totalStaff);

  const childCount = training.filter((t) => t.childStatusAssessment).length;
  const childStatusAssessmentRate = pct(childCount, totalStaff);

  const docCount = training.filter((t) => t.handoverDocumentation).length;
  const handoverDocumentationRate = pct(docCount, totalStaff);

  // Weights: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (handoverCommunicationRate / 100) * 6;
  score += (medicationHandoverSkillsRate / 100) * 5;
  score += (incidentReportingRate / 100) * 5;
  score += (taskPrioritisationRate / 100) * 4;
  score += (childStatusAssessmentRate / 100) * 3;
  score += (handoverDocumentationRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (handoverCommunicationRate >= 80) {
    strengths.push("Strong handover communication skills: " + handoverCommunicationRate + "% of staff");
  } else if (handoverCommunicationRate < 50) {
    concerns.push("Handover communication skills at " + handoverCommunicationRate + "% — foundational training needed");
  }

  if (medicationHandoverSkillsRate >= 80) {
    strengths.push("Good medication handover skills: " + medicationHandoverSkillsRate + "% of staff competent");
  } else if (medicationHandoverSkillsRate < 50) {
    concerns.push("Medication handover skills at " + medicationHandoverSkillsRate + "% — medication safety training required");
  }

  if (incidentReportingRate >= 80) {
    strengths.push("Strong incident reporting skills: " + incidentReportingRate + "% of staff");
  } else if (incidentReportingRate < 50) {
    concerns.push("Incident reporting skills at " + incidentReportingRate + "% — staff may fail to relay critical incidents");
  }

  if (taskPrioritisationRate >= 80) {
    strengths.push("Good task prioritisation skills: " + taskPrioritisationRate + "% of staff");
  } else if (taskPrioritisationRate < 50) {
    concerns.push("Task prioritisation skills at " + taskPrioritisationRate + "% — task handover may be incomplete");
  }

  if (childStatusAssessmentRate >= 80) {
    strengths.push("Child status assessment skills strong: " + childStatusAssessmentRate + "% of staff");
  } else if (childStatusAssessmentRate < 50) {
    concerns.push("Child status assessment skills at " + childStatusAssessmentRate + "% — children's needs may not be fully communicated");
  }

  if (handoverDocumentationRate >= 80) {
    strengths.push("Good handover documentation skills: " + handoverDocumentationRate + "% of staff");
  } else if (handoverDocumentationRate < 50) {
    concerns.push("Handover documentation skills at " + handoverDocumentationRate + "% — records may be incomplete");
  }

  return {
    totalStaff,
    handoverCommunicationRate,
    medicationHandoverSkillsRate,
    incidentReportingRate,
    taskPrioritisationRate,
    childStatusAssessmentRate,
    handoverDocumentationRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Handover Profiles ────────────────────────────────────────

export function buildChildHandoverProfiles(
  records: HandoverRecord[],
): ChildHandoverProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: HandoverRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;

    const coveredCount = child.records.filter((r) => r.allChildrenCovered).length;
    const allChildrenCoveredRate = pct(coveredCount, totalRecords);

    const medCount = child.records.filter((r) => r.medicationStatusUpdated).length;
    const medicationStatusUpdatedRate = pct(medCount, totalRecords);

    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const uniqueCategories = uniqueCategoriesSet.size;

    // frequency: >=10 records -> 2, >=5 -> 1, else 0
    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    // rate1 (allChildrenCoveredRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    let rate1Score = 0;
    if (allChildrenCoveredRate >= 80) rate1Score = 3;
    else if (allChildrenCoveredRate >= 60) rate1Score = 2;
    else if (allChildrenCoveredRate >= 40) rate1Score = 1;

    // rate2 (medicationStatusUpdatedRate): same thresholds
    let rate2Score = 0;
    if (medicationStatusUpdatedRate >= 80) rate2Score = 3;
    else if (medicationStatusUpdatedRate >= 60) rate2Score = 2;
    else if (medicationStatusUpdatedRate >= 40) rate2Score = 1;

    // diversity (unique categories): >=4 -> 2, >=2 -> 1, else 0
    let diversityBonus = 0;
    if (uniqueCategories >= 4) diversityBonus = 2;
    else if (uniqueCategories >= 2) diversityBonus = 1;

    const handoverScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return {
      childId: child.childId,
      childName: child.childName,
      totalRecords,
      allChildrenCoveredRate,
      medicationStatusUpdatedRate,
      uniqueCategories,
      handoverScore,
    };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateHandoverIntelligence(
  records: HandoverRecord[],
  policy: HandoverPolicy | null,
  training: StaffHandoverTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): HandoverIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter records to period
  const periodRecords = records.filter(
    (r) => r.date >= periodStart && r.date <= periodEnd,
  );

  // Evaluate each layer
  const handoverQuality = evaluateHandoverQuality(periodRecords);
  const handoverCompliance = evaluateHandoverCompliance(periodRecords);
  const handoverPolicyResult = evaluateHandoverPolicy(policy);
  const staffReadiness = evaluateStaffHandoverReadiness(training);

  // Build child profiles
  const childProfiles = buildChildHandoverProfiles(periodRecords);

  // Overall score capped at 100
  const overallScore = Math.min(
    100,
    Math.round(
      handoverQuality.score +
      handoverCompliance.score +
      handoverPolicyResult.score +
      staffReadiness.score,
    ),
  );

  const rating = getRating(overallScore);

  // Aggregate strengths
  const strengths = aggregateStrengths(
    handoverQuality, handoverCompliance, handoverPolicyResult, staffReadiness, overallScore,
  );

  // Aggregate areas for improvement
  const areasForImprovement = aggregateAreasForImprovement(
    handoverQuality, handoverCompliance, handoverPolicyResult, staffReadiness, overallScore,
  );

  // Generate actions
  const actions = generateActions(
    handoverQuality, handoverCompliance, handoverPolicyResult, staffReadiness, childProfiles,
  );

  // Regulatory links
  const regulatoryLinks = generateRegulatoryLinks();

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    handoverQuality,
    handoverCompliance,
    handoverPolicy: handoverPolicyResult,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Aggregate Strengths ──────────────────────────────────────────────────

function aggregateStrengths(
  quality: HandoverQualityResult,
  compliance: HandoverComplianceResult,
  policy: HandoverPolicyResult,
  staff: StaffHandoverReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall handover management rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall handover management rated Good (" + overallScore + "/100)");
  }

  if (quality.score >= 20) {
    strengths.push("Handover quality is strong (score " + quality.score + "/25)");
  }
  if (compliance.score >= 20) {
    strengths.push("Handover compliance is strong (score " + compliance.score + "/25)");
  }
  if (policy.score >= 20) {
    strengths.push("Handover policy framework is robust (score " + policy.score + "/25)");
  }
  if (staff.score >= 20) {
    strengths.push("Staff handover readiness is strong (score " + staff.score + "/25)");
  }

  strengths.push(...quality.strengths.slice(0, 2));
  strengths.push(...compliance.strengths.slice(0, 2));
  strengths.push(...policy.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ──────────────────────────────────────

function aggregateAreasForImprovement(
  quality: HandoverQualityResult,
  compliance: HandoverComplianceResult,
  policy: HandoverPolicyResult,
  staff: StaffHandoverReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall handover management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall handover management Requires Improvement (" + overallScore + "/100)");
  }

  if (quality.score < 15) {
    areas.push("Handover quality needs improvement (score " + quality.score + "/25)");
  }
  if (compliance.score < 15) {
    areas.push("Handover compliance needs improvement (score " + compliance.score + "/25)");
  }
  if (policy.score < 15) {
    areas.push("Handover policy framework needs improvement (score " + policy.score + "/25)");
  }
  if (staff.score < 15) {
    areas.push("Staff handover readiness needs improvement (score " + staff.score + "/25)");
  }

  areas.push(...quality.concerns);
  areas.push(...compliance.concerns);
  areas.push(...policy.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ─────────────────────────────────────────────────────

function generateActions(
  quality: HandoverQualityResult,
  compliance: HandoverComplianceResult,
  policy: HandoverPolicyResult,
  staff: StaffHandoverReadinessResult,
  childProfiles: ChildHandoverProfile[],
): string[] {
  const actions: string[] = [];

  if (policy.score === 0) {
    actions.push("URGENT: No handover policy in place — develop and implement comprehensive handover policy immediately");
  }

  if (staff.totalStaff === 0) {
    actions.push("URGENT: No staff handover training records — schedule handover training for all staff immediately");
  }

  if (quality.totalRecords > 0 && quality.allChildrenCoveredRate < 50) {
    actions.push("HIGH: Child coverage rate at " + quality.allChildrenCoveredRate + "% — ensure all children are included in every handover");
  }

  if (quality.totalRecords > 0 && quality.medicationStatusUpdatedRate < 50) {
    actions.push("HIGH: Medication update rate at " + quality.medicationStatusUpdatedRate + "% — medication safety at risk, review handover protocol");
  }

  if (compliance.totalRecords > 0 && compliance.documentationRate < 50) {
    actions.push("HIGH: Documentation rate at " + compliance.documentationRate + "% — strengthen handover recording practices");
  }

  if (compliance.totalRecords > 0 && compliance.timelyRecordingRate < 50) {
    actions.push("MEDIUM: Timely recording rate at " + compliance.timelyRecordingRate + "% — handovers must be recorded promptly");
  }

  if (quality.totalRecords > 0 && quality.incidentsCommunicatedRate < 50) {
    actions.push("MEDIUM: Incident communication rate at " + quality.incidentsCommunicatedRate + "% — embed incident briefing in every handover");
  }

  if (staff.totalStaff > 0 && staff.handoverCommunicationRate < 50) {
    actions.push("MEDIUM: Staff communication skills at " + staff.handoverCommunicationRate + "% — schedule refresher training on handover communication");
  }

  const lowScoreChildren = childProfiles.filter((p) => p.handoverScore <= 3);
  if (lowScoreChildren.length > 0) {
    actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low handover scores — review individual handover arrangements");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Handover systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ─────────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015 Reg 22 — Records to be kept",
    "CHR 2015 Reg 13 — Leadership and management",
    "NMS 19 — Staffing and supervision",
    "SCCIF — Leadership: communication and information sharing",
    "Children Act 1989 s.22 — Duty of care",
    "Quality Standards 2015 — Standard 7 (effective management)",
    "CHR 2015 Reg 5 — Fitness of employees",
  ];
}
