// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MINOR REPAIRS & MAINTENANCE INTELLIGENCE ENGINE
// Monitors premises maintenance quality including maintenance request tracking,
// repair completion timeliness, health & safety compliance checks, premises
// condition audits, and planned preventative maintenance.
// Measures request response rate, repair completion rate, safety check rate,
// condition compliance rate, preventative maintenance rate, and child
// environment rate.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Premises), Reg 5 (Fitness of premises).
// SCCIF: "Safety", "Living in the home".
// Store keys: maintenanceRequestRecords, repairCompletionRecords,
//             safetyCheckRecords, conditionAuditRecords,
//             preventativeMaintenanceRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface MaintenanceRequestRecordInput {
  id: string;
  date_reported: string;
  reported_by: string;
  category:
    | "plumbing"
    | "electrical"
    | "structural"
    | "decorating"
    | "fixtures"
    | "appliances"
    | "heating"
    | "ventilation"
    | "roofing"
    | "windows_doors"
    | "flooring"
    | "other";
  priority: "emergency" | "urgent" | "routine" | "cosmetic";
  description: string;
  location: string;
  acknowledged: boolean;
  acknowledged_within_target: boolean;
  assigned_to: string;
  status: "open" | "in_progress" | "completed" | "cancelled" | "deferred";
  child_reported: boolean;
  child_id: string | null;
  affects_safety: boolean;
  affects_child_area: boolean;
  date_resolved: string | null;
  resolution_notes: string;
  created_at: string;
}

export interface RepairCompletionRecordInput {
  id: string;
  request_id: string;
  date_started: string;
  date_completed: string;
  completed_within_target: boolean;
  target_days: number;
  actual_days: number;
  repair_quality: "excellent" | "good" | "acceptable" | "poor" | "failed";
  contractor_used: boolean;
  contractor_name: string;
  cost_gbp: number;
  sign_off_by: string;
  sign_off_date: string | null;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  child_area_restored: boolean;
  photographic_evidence: boolean;
  notes: string;
  created_at: string;
}

export interface SafetyCheckRecordInput {
  id: string;
  check_type:
    | "gas_safety"
    | "electrical_safety"
    | "fire_safety"
    | "legionella"
    | "asbestos"
    | "pat_testing"
    | "water_hygiene"
    | "radon"
    | "structural"
    | "general_hs"
    | "other";
  date_completed: string;
  next_due_date: string;
  compliant: boolean;
  certificate_obtained: boolean;
  actions_required: number;
  actions_completed: number;
  inspector: string;
  regulatory_requirement: boolean;
  overdue: boolean;
  risk_level: "high" | "medium" | "low" | "none";
  notes: string;
  created_at: string;
}

export interface ConditionAuditRecordInput {
  id: string;
  date: string;
  area_inspected: string;
  auditor: string;
  overall_condition: "excellent" | "good" | "fair" | "poor" | "critical";
  cleanliness_score: number; // 1-5
  decoration_score: number; // 1-5
  structural_score: number; // 1-5
  safety_score: number; // 1-5
  child_friendly: boolean;
  issues_found: number;
  issues_resolved: number;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  photographic_evidence: boolean;
  child_feedback_sought: boolean;
  child_feedback_positive: boolean;
  notes: string;
  created_at: string;
}

export interface PreventativeMaintenanceRecordInput {
  id: string;
  task_name: string;
  category:
    | "boiler_servicing"
    | "gutter_clearing"
    | "roof_inspection"
    | "pest_control"
    | "garden_grounds"
    | "painting_decorating"
    | "plumbing_check"
    | "electrical_check"
    | "ventilation"
    | "damp_proofing"
    | "window_maintenance"
    | "general"
    | "other";
  frequency: "weekly" | "monthly" | "quarterly" | "biannual" | "annual" | "ad_hoc";
  last_completed: string;
  next_due: string;
  completed_on_schedule: boolean;
  overdue: boolean;
  contractor_required: boolean;
  contractor_booked: boolean;
  cost_gbp: number;
  documented: boolean;
  risk_if_missed: "high" | "medium" | "low";
  affects_child_environment: boolean;
  notes: string;
  created_at: string;
}

export interface MinorRepairsInput {
  today: string;
  total_children: number;
  maintenance_request_records: MaintenanceRequestRecordInput[];
  repair_completion_records: RepairCompletionRecordInput[];
  safety_check_records: SafetyCheckRecordInput[];
  condition_audit_records: ConditionAuditRecordInput[];
  preventative_maintenance_records: PreventativeMaintenanceRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type MinorRepairsRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface MinorRepairsInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface MinorRepairsRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface MinorRepairsResult {
  maintenance_rating: MinorRepairsRating;
  maintenance_score: number;
  headline: string;
  total_maintenance_requests: number;
  total_repair_completions: number;
  total_safety_checks: number;
  total_condition_audits: number;
  total_preventative_tasks: number;
  request_response_rate: number;
  repair_completion_rate: number;
  safety_check_rate: number;
  condition_compliance_rate: number;
  preventative_maintenance_rate: number;
  child_environment_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: MinorRepairsRecommendation[];
  insights: MinorRepairsInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): MinorRepairsRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: MinorRepairsRating,
  score: number,
  headline: string,
): MinorRepairsResult {
  return {
    maintenance_rating: rating,
    maintenance_score: score,
    headline,
    total_maintenance_requests: 0,
    total_repair_completions: 0,
    total_safety_checks: 0,
    total_condition_audits: 0,
    total_preventative_tasks: 0,
    request_response_rate: 0,
    repair_completion_rate: 0,
    safety_check_rate: 0,
    condition_compliance_rate: 0,
    preventative_maintenance_rate: 0,
    child_environment_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeMinorRepairsMaintenance(
  input: MinorRepairsInput,
): MinorRepairsResult {
  const {
    total_children,
    maintenance_request_records,
    repair_completion_records,
    safety_check_records,
    condition_audit_records,
    preventative_maintenance_records,
  } = input;

  // ── Special case: all empty + 0 children -> insufficient_data ──────────
  const allEmpty =
    maintenance_request_records.length === 0 &&
    repair_completion_records.length === 0 &&
    safety_check_records.length === 0 &&
    condition_audit_records.length === 0 &&
    preventative_maintenance_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess minor repairs and maintenance.",
    );
  }

  // ── Special case: all empty + children > 0 -> inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No maintenance, repair, safety check, condition audit, or preventative maintenance data recorded despite children on placement — premises maintenance requires urgent attention.",
      ),
      concerns: [
        "No maintenance request records, repair completion records, safety check records, condition audit records, or preventative maintenance records exist despite children being on placement — the home cannot evidence that premises are maintained to the standard required by regulation.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of maintenance requests, repair completions, safety compliance checks, premises condition audits, and planned preventative maintenance to evidence the home meets Reg 25 premises requirements.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
        {
          rank: 2,
          recommendation:
            "Establish a preventative maintenance schedule covering all statutory compliance checks (gas, electrical, fire safety, legionella, PAT testing) and routine premises upkeep to ensure the home is safe, well-maintained, and fit for purpose.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Fitness of premises",
        },
      ],
      insights: [
        {
          text: "The complete absence of maintenance and repair records means the home cannot demonstrate that premises are safe, well-maintained, and fit for purpose. This is a significant regulatory gap — Ofsted inspectors will expect to see evidence of a structured maintenance programme, timely repairs, statutory compliance checks, and a proactive approach to premises upkeep.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Maintenance request response metrics ---
  const totalMaintenanceRequests = maintenance_request_records.length;
  const acknowledgedRequests = maintenance_request_records.filter(
    (r) => r.acknowledged,
  ).length;
  const acknowledgedWithinTarget = maintenance_request_records.filter(
    (r) => r.acknowledged_within_target,
  ).length;
  const requestResponseRate = pct(acknowledgedWithinTarget, totalMaintenanceRequests);

  const safetyAffectingRequests = maintenance_request_records.filter(
    (r) => r.affects_safety,
  ).length;
  const safetyRequestsResolved = maintenance_request_records.filter(
    (r) => r.affects_safety && r.status === "completed",
  ).length;
  const safetyResolutionRate = pct(safetyRequestsResolved, safetyAffectingRequests);

  const childAreaRequests = maintenance_request_records.filter(
    (r) => r.affects_child_area,
  ).length;
  const childAreaResolved = maintenance_request_records.filter(
    (r) => r.affects_child_area && r.status === "completed",
  ).length;
  const childAreaResolutionRate = pct(childAreaResolved, childAreaRequests);

  const emergencyRequests = maintenance_request_records.filter(
    (r) => r.priority === "emergency",
  ).length;
  const emergencyResolved = maintenance_request_records.filter(
    (r) => r.priority === "emergency" && r.status === "completed",
  ).length;
  const emergencyResolutionRate = pct(emergencyResolved, emergencyRequests);

  const urgentRequests = maintenance_request_records.filter(
    (r) => r.priority === "urgent",
  ).length;
  const urgentResolved = maintenance_request_records.filter(
    (r) => r.priority === "urgent" && r.status === "completed",
  ).length;
  const urgentResolutionRate = pct(urgentResolved, urgentRequests);

  const childReportedRequests = maintenance_request_records.filter(
    (r) => r.child_reported,
  ).length;
  const childReportedResolved = maintenance_request_records.filter(
    (r) => r.child_reported && r.status === "completed",
  ).length;
  const childReportedResolutionRate = pct(childReportedResolved, childReportedRequests);

  const openRequests = maintenance_request_records.filter(
    (r) => r.status === "open" || r.status === "in_progress",
  ).length;
  const deferredRequests = maintenance_request_records.filter(
    (r) => r.status === "deferred",
  ).length;

  const completedRequests = maintenance_request_records.filter(
    (r) => r.status === "completed",
  ).length;
  const overallCompletionRate = pct(completedRequests, totalMaintenanceRequests);

  // --- Repair completion metrics ---
  const totalRepairCompletions = repair_completion_records.length;
  const completedWithinTarget = repair_completion_records.filter(
    (r) => r.completed_within_target,
  ).length;
  const repairCompletionRate = pct(completedWithinTarget, totalRepairCompletions);

  const excellentOrGoodRepairs = repair_completion_records.filter(
    (r) => r.repair_quality === "excellent" || r.repair_quality === "good",
  ).length;
  const repairQualityRate = pct(excellentOrGoodRepairs, totalRepairCompletions);

  const poorOrFailedRepairs = repair_completion_records.filter(
    (r) => r.repair_quality === "poor" || r.repair_quality === "failed",
  ).length;
  const poorRepairRate = pct(poorOrFailedRepairs, totalRepairCompletions);

  const signedOffRepairs = repair_completion_records.filter(
    (r) => r.sign_off_date !== null && r.sign_off_date !== "",
  ).length;
  const signOffRate = pct(signedOffRepairs, totalRepairCompletions);

  const followUpRequired = repair_completion_records.filter(
    (r) => r.follow_up_required,
  ).length;
  const followUpCompleted = repair_completion_records.filter(
    (r) => r.follow_up_required && r.follow_up_completed,
  ).length;
  const repairFollowUpRate = pct(followUpCompleted, followUpRequired);

  const childAreaRestored = repair_completion_records.filter(
    (r) => r.child_area_restored,
  ).length;
  const childAreaRestoredRate = pct(childAreaRestored, totalRepairCompletions);

  const photoEvidenceRepairs = repair_completion_records.filter(
    (r) => r.photographic_evidence,
  ).length;
  const photoEvidenceRate = pct(photoEvidenceRepairs, totalRepairCompletions);

  const avgActualDays =
    totalRepairCompletions > 0
      ? Math.round(
          repair_completion_records.reduce((sum, r) => sum + r.actual_days, 0) /
            totalRepairCompletions,
        )
      : 0;

  // --- Safety check compliance metrics ---
  const totalSafetyChecks = safety_check_records.length;
  const compliantChecks = safety_check_records.filter(
    (c) => c.compliant,
  ).length;
  const safetyCheckRate = pct(compliantChecks, totalSafetyChecks);

  const certificateObtained = safety_check_records.filter(
    (c) => c.certificate_obtained,
  ).length;
  const certificateRate = pct(certificateObtained, totalSafetyChecks);

  const overdueChecks = safety_check_records.filter(
    (c) => c.overdue,
  ).length;
  const overdueCheckRate = pct(overdueChecks, totalSafetyChecks);

  const regulatoryChecks = safety_check_records.filter(
    (c) => c.regulatory_requirement,
  ).length;
  const regulatoryCompliant = safety_check_records.filter(
    (c) => c.regulatory_requirement && c.compliant,
  ).length;
  const regulatoryComplianceRate = pct(regulatoryCompliant, regulatoryChecks);

  const highRiskChecks = safety_check_records.filter(
    (c) => c.risk_level === "high",
  ).length;
  const highRiskRate = pct(highRiskChecks, totalSafetyChecks);

  const totalSafetyActionsReq = safety_check_records.reduce(
    (sum, c) => sum + c.actions_required,
    0,
  );
  const totalSafetyActionsComp = safety_check_records.reduce(
    (sum, c) => sum + c.actions_completed,
    0,
  );
  const safetyActionCompletionRate = pct(totalSafetyActionsComp, totalSafetyActionsReq);

  // --- Condition audit metrics ---
  const totalConditionAudits = condition_audit_records.length;

  const excellentOrGoodCondition = condition_audit_records.filter(
    (a) => a.overall_condition === "excellent" || a.overall_condition === "good",
  ).length;
  const conditionComplianceRate = pct(excellentOrGoodCondition, totalConditionAudits);

  const poorOrCriticalCondition = condition_audit_records.filter(
    (a) => a.overall_condition === "poor" || a.overall_condition === "critical",
  ).length;
  const poorConditionRate = pct(poorOrCriticalCondition, totalConditionAudits);

  const childFriendlyAreas = condition_audit_records.filter(
    (a) => a.child_friendly,
  ).length;
  const childFriendlyRate = pct(childFriendlyAreas, totalConditionAudits);

  const avgCleanlinessScore =
    totalConditionAudits > 0
      ? Math.round(
          (condition_audit_records.reduce((sum, a) => sum + a.cleanliness_score, 0) /
            totalConditionAudits) *
            100,
        ) / 100
      : 0;
  const avgDecorationScore =
    totalConditionAudits > 0
      ? Math.round(
          (condition_audit_records.reduce((sum, a) => sum + a.decoration_score, 0) /
            totalConditionAudits) *
            100,
        ) / 100
      : 0;
  const avgStructuralScore =
    totalConditionAudits > 0
      ? Math.round(
          (condition_audit_records.reduce((sum, a) => sum + a.structural_score, 0) /
            totalConditionAudits) *
            100,
        ) / 100
      : 0;
  const avgSafetyScore =
    totalConditionAudits > 0
      ? Math.round(
          (condition_audit_records.reduce((sum, a) => sum + a.safety_score, 0) /
            totalConditionAudits) *
            100,
        ) / 100
      : 0;

  const totalConditionIssuesFound = condition_audit_records.reduce(
    (sum, a) => sum + a.issues_found,
    0,
  );
  const totalConditionIssuesResolved = condition_audit_records.reduce(
    (sum, a) => sum + a.issues_resolved,
    0,
  );
  const conditionIssueResolutionRate = pct(
    totalConditionIssuesResolved,
    totalConditionIssuesFound,
  );

  const auditFollowUpRequired = condition_audit_records.filter(
    (a) => a.follow_up_required,
  ).length;
  const auditFollowUpCompleted = condition_audit_records.filter(
    (a) => a.follow_up_required && a.follow_up_completed,
  ).length;
  const auditFollowUpRate = pct(auditFollowUpCompleted, auditFollowUpRequired);

  const childFeedbackSought = condition_audit_records.filter(
    (a) => a.child_feedback_sought,
  ).length;
  const childFeedbackSoughtRate = pct(childFeedbackSought, totalConditionAudits);

  const childFeedbackPositive = condition_audit_records.filter(
    (a) => a.child_feedback_sought && a.child_feedback_positive,
  ).length;
  const childFeedbackPositiveRate = pct(childFeedbackPositive, childFeedbackSought);

  const auditPhotoEvidence = condition_audit_records.filter(
    (a) => a.photographic_evidence,
  ).length;
  const auditPhotoRate = pct(auditPhotoEvidence, totalConditionAudits);

  // --- Preventative maintenance metrics ---
  const totalPreventativeTasks = preventative_maintenance_records.length;
  const completedOnSchedule = preventative_maintenance_records.filter(
    (p) => p.completed_on_schedule,
  ).length;
  const preventativeMaintenanceRate = pct(completedOnSchedule, totalPreventativeTasks);

  const overduePreventative = preventative_maintenance_records.filter(
    (p) => p.overdue,
  ).length;
  const overduePreventativeRate = pct(overduePreventative, totalPreventativeTasks);

  const highRiskMissed = preventative_maintenance_records.filter(
    (p) => p.overdue && p.risk_if_missed === "high",
  ).length;

  const documentedPreventative = preventative_maintenance_records.filter(
    (p) => p.documented,
  ).length;
  const preventativeDocumentationRate = pct(documentedPreventative, totalPreventativeTasks);

  const contractorRequired = preventative_maintenance_records.filter(
    (p) => p.contractor_required,
  ).length;
  const contractorBooked = preventative_maintenance_records.filter(
    (p) => p.contractor_required && p.contractor_booked,
  ).length;
  const contractorBookingRate = pct(contractorBooked, contractorRequired);

  const affectsChildEnvPreventative = preventative_maintenance_records.filter(
    (p) => p.affects_child_environment,
  ).length;
  const childEnvCompletedOnSchedule = preventative_maintenance_records.filter(
    (p) => p.affects_child_environment && p.completed_on_schedule,
  ).length;
  const childEnvPreventativeRate = pct(
    childEnvCompletedOnSchedule,
    affectsChildEnvPreventative,
  );

  // --- Child environment composite ---
  // Composite across child area resolution, child area restoration, child-friendly,
  // child environment preventative, and child feedback positive
  const childEnvNumerators: number[] = [];
  const childEnvDenominators: number[] = [];

  if (childAreaRequests > 0) {
    childEnvNumerators.push(childAreaResolved);
    childEnvDenominators.push(childAreaRequests);
  }
  if (totalRepairCompletions > 0) {
    childEnvNumerators.push(childAreaRestored);
    childEnvDenominators.push(totalRepairCompletions);
  }
  if (totalConditionAudits > 0) {
    childEnvNumerators.push(childFriendlyAreas);
    childEnvDenominators.push(totalConditionAudits);
  }
  if (affectsChildEnvPreventative > 0) {
    childEnvNumerators.push(childEnvCompletedOnSchedule);
    childEnvDenominators.push(affectsChildEnvPreventative);
  }
  if (childFeedbackSought > 0) {
    childEnvNumerators.push(childFeedbackPositive);
    childEnvDenominators.push(childFeedbackSought);
  }

  const totalChildEnvNum = childEnvNumerators.reduce((a, b) => a + b, 0);
  const totalChildEnvDenom = childEnvDenominators.reduce((a, b) => a + b, 0);
  const childEnvironmentRate = pct(totalChildEnvNum, totalChildEnvDenom);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: requestResponseRate (>=90: +4, >=70: +2) ---
  if (requestResponseRate >= 90) score += 4;
  else if (requestResponseRate >= 70) score += 2;

  // --- Bonus 2: repairCompletionRate (>=95: +4, >=80: +2) ---
  if (repairCompletionRate >= 95) score += 4;
  else if (repairCompletionRate >= 80) score += 2;

  // --- Bonus 3: safetyCheckRate (>=95: +4, >=80: +2) ---
  if (safetyCheckRate >= 95) score += 4;
  else if (safetyCheckRate >= 80) score += 2;

  // --- Bonus 4: conditionComplianceRate (>=90: +3, >=70: +1) ---
  if (conditionComplianceRate >= 90) score += 3;
  else if (conditionComplianceRate >= 70) score += 1;

  // --- Bonus 5: preventativeMaintenanceRate (>=90: +3, >=70: +1) ---
  if (preventativeMaintenanceRate >= 90) score += 3;
  else if (preventativeMaintenanceRate >= 70) score += 1;

  // --- Bonus 6: childEnvironmentRate (>=90: +3, >=70: +1) ---
  if (childEnvironmentRate >= 90) score += 3;
  else if (childEnvironmentRate >= 70) score += 1;

  // --- Bonus 7: repairQualityRate (>=90: +3, >=70: +1) ---
  if (repairQualityRate >= 90) score += 3;
  else if (repairQualityRate >= 70) score += 1;

  // --- Bonus 8: safetyActionCompletionRate (>=90: +2, >=70: +1) ---
  if (safetyActionCompletionRate >= 90) score += 2;
  else if (safetyActionCompletionRate >= 70) score += 1;

  // --- Bonus 9: preventativeDocumentationRate (>=90: +2, >=70: +1) ---
  if (preventativeDocumentationRate >= 90) score += 2;
  else if (preventativeDocumentationRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // requestResponseRate < 40 -> -5 (guarded)
  if (requestResponseRate < 40 && maintenance_request_records.length > 0) score -= 5;

  // safetyCheckRate < 50 -> -5 (guarded)
  if (safetyCheckRate < 50 && safety_check_records.length > 0) score -= 5;

  // conditionComplianceRate < 40 -> -4 (guarded)
  if (conditionComplianceRate < 40 && condition_audit_records.length > 0) score -= 4;

  // preventativeMaintenanceRate < 40 -> -4 (guarded)
  if (preventativeMaintenanceRate < 40 && preventative_maintenance_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const maintenance_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (requestResponseRate >= 90 && totalMaintenanceRequests > 0) {
    strengths.push(
      `${requestResponseRate}% of maintenance requests acknowledged within target — the home demonstrates excellent responsiveness to premises issues, ensuring problems are addressed promptly.`,
    );
  } else if (requestResponseRate >= 70 && totalMaintenanceRequests > 0) {
    strengths.push(
      `${requestResponseRate}% request response rate — the home generally responds to maintenance requests in a timely manner.`,
    );
  }

  if (repairCompletionRate >= 95 && totalRepairCompletions > 0) {
    strengths.push(
      `${repairCompletionRate}% of repairs completed within target timescale — exemplary repair turnaround ensuring premises remain safe and well-maintained.`,
    );
  } else if (repairCompletionRate >= 80 && totalRepairCompletions > 0) {
    strengths.push(
      `${repairCompletionRate}% repair completion rate within target — the home completes the majority of repairs in a timely manner.`,
    );
  }

  if (safetyCheckRate >= 95 && totalSafetyChecks > 0) {
    strengths.push(
      `${safetyCheckRate}% safety check compliance — the home maintains outstanding statutory and regulatory compliance across all health and safety checks.`,
    );
  } else if (safetyCheckRate >= 80 && totalSafetyChecks > 0) {
    strengths.push(
      `${safetyCheckRate}% safety check compliance rate — strong compliance with health and safety inspection requirements.`,
    );
  }

  if (conditionComplianceRate >= 90 && totalConditionAudits > 0) {
    strengths.push(
      `${conditionComplianceRate}% of premises areas rated excellent or good — the home is maintained to a high standard across inspected areas.`,
    );
  } else if (conditionComplianceRate >= 70 && totalConditionAudits > 0) {
    strengths.push(
      `${conditionComplianceRate}% condition compliance — the majority of premises areas are in good or excellent condition.`,
    );
  }

  if (preventativeMaintenanceRate >= 90 && totalPreventativeTasks > 0) {
    strengths.push(
      `${preventativeMaintenanceRate}% of preventative maintenance completed on schedule — the home has a proactive, well-managed approach to premises upkeep.`,
    );
  } else if (preventativeMaintenanceRate >= 70 && totalPreventativeTasks > 0) {
    strengths.push(
      `${preventativeMaintenanceRate}% preventative maintenance on schedule — the home generally completes planned maintenance tasks on time.`,
    );
  }

  if (childEnvironmentRate >= 90 && totalChildEnvDenom > 0) {
    strengths.push(
      `${childEnvironmentRate}% child environment quality — maintenance issues affecting children's living areas are prioritised and resolved effectively.`,
    );
  } else if (childEnvironmentRate >= 70 && totalChildEnvDenom > 0) {
    strengths.push(
      `${childEnvironmentRate}% child environment rate — good attention to maintaining the quality of children's living spaces.`,
    );
  }

  if (repairQualityRate >= 90 && totalRepairCompletions > 0) {
    strengths.push(
      `${repairQualityRate}% of repairs rated excellent or good quality — repairs are completed to a consistently high standard.`,
    );
  } else if (repairQualityRate >= 70 && totalRepairCompletions > 0) {
    strengths.push(
      `${repairQualityRate}% repair quality rate — the majority of repairs meet a good or excellent standard.`,
    );
  }

  if (emergencyResolutionRate >= 100 && emergencyRequests > 0) {
    strengths.push(
      "All emergency maintenance requests have been resolved — the home demonstrates the ability to respond effectively to urgent premises issues.",
    );
  }

  if (regulatoryComplianceRate >= 100 && regulatoryChecks > 0) {
    strengths.push(
      "100% compliance across all regulatory safety checks — the home meets every statutory safety requirement.",
    );
  } else if (regulatoryComplianceRate >= 90 && regulatoryChecks > 0) {
    strengths.push(
      `${regulatoryComplianceRate}% regulatory compliance across statutory safety checks — strong adherence to statutory inspection requirements.`,
    );
  }

  if (safetyActionCompletionRate >= 90 && totalSafetyActionsReq > 0) {
    strengths.push(
      `${safetyActionCompletionRate}% of safety check actions completed — follow-through on safety inspection findings is thorough and consistent.`,
    );
  }

  if (conditionIssueResolutionRate >= 90 && totalConditionIssuesFound > 0) {
    strengths.push(
      `${conditionIssueResolutionRate}% of condition audit issues resolved — the home addresses identified premises issues effectively.`,
    );
  }

  if (childFeedbackSoughtRate >= 80 && totalConditionAudits > 0) {
    strengths.push(
      `Children's feedback sought in ${childFeedbackSoughtRate}% of condition audits — the home actively involves children in assessing their living environment.`,
    );
  }

  if (signOffRate >= 90 && totalRepairCompletions > 0) {
    strengths.push(
      `${signOffRate}% of repairs formally signed off — strong governance and quality assurance in the repair completion process.`,
    );
  }

  if (overdueChecks === 0 && totalSafetyChecks > 0) {
    strengths.push(
      "No overdue safety checks — the home maintains an up-to-date programme of statutory compliance inspections.",
    );
  }

  if (overduePreventative === 0 && totalPreventativeTasks > 0) {
    strengths.push(
      "No overdue preventative maintenance tasks — the planned maintenance schedule is fully current.",
    );
  }

  if (contractorBookingRate >= 100 && contractorRequired > 0) {
    strengths.push(
      "All contractor-required maintenance tasks have contractors booked — proactive management of external maintenance dependencies.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (requestResponseRate < 40 && totalMaintenanceRequests > 0) {
    concerns.push(
      `Only ${requestResponseRate}% of maintenance requests acknowledged within target — the home is failing to respond to premises issues in a timely manner, risking the safety and wellbeing of children and staff.`,
    );
  } else if (
    requestResponseRate >= 40 &&
    requestResponseRate < 70 &&
    totalMaintenanceRequests > 0
  ) {
    concerns.push(
      `Maintenance request response rate at ${requestResponseRate}% — not all premises issues are being acknowledged within target timescales.`,
    );
  }

  if (repairCompletionRate < 50 && totalRepairCompletions > 0) {
    concerns.push(
      `Only ${repairCompletionRate}% of repairs completed within target — the majority of repairs are overrunning their target timescales, leaving premises issues unresolved for too long.`,
    );
  } else if (
    repairCompletionRate >= 50 &&
    repairCompletionRate < 80 &&
    totalRepairCompletions > 0
  ) {
    concerns.push(
      `Repair completion rate at ${repairCompletionRate}% — a significant proportion of repairs are not being completed within target timescales.`,
    );
  }

  if (safetyCheckRate < 50 && totalSafetyChecks > 0) {
    concerns.push(
      `Only ${safetyCheckRate}% safety check compliance — the home is failing to meet health and safety compliance requirements, creating significant risk to children and staff.`,
    );
  } else if (
    safetyCheckRate >= 50 &&
    safetyCheckRate < 80 &&
    totalSafetyChecks > 0
  ) {
    concerns.push(
      `Safety check compliance at ${safetyCheckRate}% — not all statutory and regulatory safety checks are compliant, indicating gaps in the home's safety management.`,
    );
  }

  if (conditionComplianceRate < 40 && totalConditionAudits > 0) {
    concerns.push(
      `Only ${conditionComplianceRate}% of premises areas rated good or excellent — the majority of areas are in fair, poor, or critical condition, indicating widespread maintenance neglect.`,
    );
  } else if (
    conditionComplianceRate >= 40 &&
    conditionComplianceRate < 70 &&
    totalConditionAudits > 0
  ) {
    concerns.push(
      `Condition compliance at ${conditionComplianceRate}% — a number of premises areas are not meeting acceptable condition standards.`,
    );
  }

  if (preventativeMaintenanceRate < 40 && totalPreventativeTasks > 0) {
    concerns.push(
      `Only ${preventativeMaintenanceRate}% of preventative maintenance completed on schedule — the home is not maintaining a proactive maintenance programme, increasing the risk of breakdowns and safety issues.`,
    );
  } else if (
    preventativeMaintenanceRate >= 40 &&
    preventativeMaintenanceRate < 70 &&
    totalPreventativeTasks > 0
  ) {
    concerns.push(
      `Preventative maintenance rate at ${preventativeMaintenanceRate}% — planned maintenance tasks are not consistently being completed on schedule.`,
    );
  }

  if (childEnvironmentRate < 50 && totalChildEnvDenom > 0) {
    concerns.push(
      `Child environment quality at only ${childEnvironmentRate}% — maintenance affecting children's living areas is not being adequately prioritised, impacting the quality of the home environment.`,
    );
  } else if (
    childEnvironmentRate >= 50 &&
    childEnvironmentRate < 70 &&
    totalChildEnvDenom > 0
  ) {
    concerns.push(
      `Child environment rate at ${childEnvironmentRate}% — there is room for improvement in how maintenance issues affecting children's spaces are managed.`,
    );
  }

  if (poorRepairRate >= 20 && totalRepairCompletions > 0) {
    concerns.push(
      `${poorRepairRate}% of repairs rated poor or failed quality — the standard of repair work is unacceptable and may require re-work, wasting resources and leaving premises issues unresolved.`,
    );
  } else if (
    poorRepairRate >= 10 &&
    poorRepairRate < 20 &&
    totalRepairCompletions > 0
  ) {
    concerns.push(
      `${poorRepairRate}% of repairs rated poor or failed — some repairs are not meeting acceptable quality standards.`,
    );
  }

  if (overdueCheckRate >= 20 && totalSafetyChecks > 0) {
    concerns.push(
      `${overdueCheckRate}% of safety checks are overdue — overdue statutory checks represent a significant compliance and safety risk.`,
    );
  } else if (
    overdueCheckRate >= 10 &&
    overdueCheckRate < 20 &&
    totalSafetyChecks > 0
  ) {
    concerns.push(
      `${overdueCheckRate}% of safety checks overdue — some compliance inspections are not being completed on time.`,
    );
  }

  if (highRiskRate >= 15 && totalSafetyChecks > 0) {
    concerns.push(
      `${highRiskRate}% of safety checks identified high risk — the proportion of high-risk findings requires urgent attention and remediation.`,
    );
  }

  if (highRiskMissed > 0) {
    concerns.push(
      `${highRiskMissed} high-risk preventative maintenance task${highRiskMissed !== 1 ? "s are" : " is"} overdue — failing to complete high-risk maintenance on schedule creates serious premises safety risks.`,
    );
  }

  if (poorConditionRate >= 20 && totalConditionAudits > 0) {
    concerns.push(
      `${poorConditionRate}% of premises areas rated poor or critical condition — significant parts of the premises are deteriorating and require urgent maintenance attention.`,
    );
  }

  if (safetyResolutionRate < 70 && safetyAffectingRequests > 0) {
    concerns.push(
      `Only ${safetyResolutionRate}% of safety-affecting maintenance requests resolved — unresolved safety issues represent a direct risk to children and staff.`,
    );
  }

  if (repairFollowUpRate < 60 && followUpRequired > 0) {
    concerns.push(
      `Only ${repairFollowUpRate}% of repair follow-ups completed — incomplete follow-through on repairs means issues may not be fully resolved.`,
    );
  }

  if (deferredRequests > 3) {
    concerns.push(
      `${deferredRequests} maintenance requests have been deferred — a high number of deferred repairs suggests maintenance is being deprioritised.`,
    );
  }

  if (overduePreventativeRate >= 30 && totalPreventativeTasks > 0) {
    concerns.push(
      `${overduePreventativeRate}% of preventative maintenance tasks are overdue — the planned maintenance programme is significantly behind schedule.`,
    );
  }

  if (avgSafetyScore < 3.0 && totalConditionAudits > 0) {
    concerns.push(
      `Average safety score from condition audits is ${avgSafetyScore}/5 — the premises safety standard as observed during audits is below acceptable levels.`,
    );
  }

  if (childFeedbackSoughtRate < 30 && totalConditionAudits > 0 && total_children > 0) {
    concerns.push(
      `Children's feedback sought in only ${childFeedbackSoughtRate}% of condition audits — the home is not consistently seeking children's views about their living environment.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: MinorRepairsRecommendation[] = [];
  let rank = 0;

  if (requestResponseRate < 40 && totalMaintenanceRequests > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review the maintenance request acknowledgement process — implement a triage system with defined response timescales for emergency, urgent, routine, and cosmetic requests. All requests must be acknowledged and assigned within target.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (safetyCheckRate < 50 && totalSafetyChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address safety check non-compliance — ensure all statutory checks (gas, electrical, fire safety, legionella, PAT testing) are completed by certified inspectors and that certificates are obtained and stored. Non-compliance creates serious regulatory and safety risk.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (conditionComplianceRate < 40 && totalConditionAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission a comprehensive premises improvement plan — the majority of audited areas are below acceptable standards. Prioritise areas affecting children's living spaces and safety, then systematically address remaining deficiencies.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Fitness of premises",
    });
  }

  if (preventativeMaintenanceRate < 40 && totalPreventativeTasks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Re-establish the preventative maintenance programme — create a master schedule with clear ownership, timescales, and escalation processes. High-risk tasks must be prioritised and completed without delay.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (safetyResolutionRate < 70 && safetyAffectingRequests > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Prioritise the resolution of all safety-affecting maintenance requests — unresolved safety issues must be escalated to management and resolved as a matter of urgency to protect children and staff.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (highRiskMissed > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue high-risk preventative maintenance tasks immediately — missed high-risk maintenance (such as boiler servicing, electrical checks, or damp proofing) creates serious safety hazards that must be addressed without delay.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (poorRepairRate >= 20 && totalRepairCompletions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and address the quality of repair work — a significant proportion of repairs are rated poor or failed. Consider whether contractor performance needs review, whether repairs are being inspected on completion, and whether a formal quality assurance process is needed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (overdueCheckRate >= 20 && totalSafetyChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Clear the backlog of overdue safety checks — implement a compliance calendar with automated reminders and escalation to the registered manager when checks approach their due dates.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (childEnvironmentRate < 50 && totalChildEnvDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Prioritise maintenance in children's living areas — ensure that repairs, condition audits, and preventative maintenance tasks affecting children's spaces are given priority and completed promptly to maintain a safe and comfortable living environment.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Living in the home",
    });
  }

  if (
    repairCompletionRate >= 50 &&
    repairCompletionRate < 80 &&
    totalRepairCompletions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve repair completion timescales — review the current workflow from request to completion, identify bottlenecks, and implement measures to ensure more repairs are completed within their target timescale.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    requestResponseRate >= 40 &&
    requestResponseRate < 70 &&
    totalMaintenanceRequests > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve request acknowledgement timescales — ensure all maintenance requests are acknowledged and triaged within the defined target period, with clear communication to the reporter about expected resolution timescales.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    safetyCheckRate >= 50 &&
    safetyCheckRate < 80 &&
    totalSafetyChecks > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen safety check compliance — ensure all statutory and regulatory safety checks are scheduled, completed on time, and that certificates and reports are properly filed. Implement a rolling compliance tracker.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    conditionComplianceRate >= 40 &&
    conditionComplianceRate < 70 &&
    totalConditionAudits > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a premises improvement programme targeting areas rated fair or below — prioritise structural and safety improvements, then address decoration and cosmetic issues to raise the overall standard of the home.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Fitness of premises",
    });
  }

  if (
    preventativeMaintenanceRate >= 40 &&
    preventativeMaintenanceRate < 70 &&
    totalPreventativeTasks > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve adherence to the preventative maintenance schedule — review why tasks are falling behind and implement monitoring to ensure planned maintenance is completed on time.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (safetyActionCompletionRate < 70 && totalSafetyActionsReq > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all actions arising from safety checks are completed — unresolved safety actions undermine the purpose of compliance inspections. Implement an action tracker with clear ownership and deadlines.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (repairFollowUpRate < 60 && followUpRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a systematic repair follow-up process — when follow-up is identified as required, ensure it is tracked, assigned, and completed to confirm repairs are fully effective.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (childFeedbackSoughtRate < 30 && totalConditionAudits > 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Routinely seek children's views during condition audits — children's perspectives on their living environment should inform maintenance priorities and improvement plans. This demonstrates the home values children's voice in matters affecting their daily life.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    childEnvironmentRate >= 50 &&
    childEnvironmentRate < 70 &&
    totalChildEnvDenom > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen the focus on children's living environment in maintenance planning — ensure that maintenance requests, repairs, and preventative tasks affecting children's spaces are tracked and prioritised appropriately.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Living in the home",
    });
  }

  if (preventativeDocumentationRate < 70 && totalPreventativeTasks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve documentation of preventative maintenance — ensure all completed tasks are properly recorded with dates, outcomes, and any issues found. This creates an audit trail for regulatory inspections.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (contractorBookingRate < 80 && contractorRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all contractor-required maintenance tasks have contractors booked in advance — delays in booking contractors lead to overdue maintenance and potential compliance failures.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    photoEvidenceRate < 60 &&
    totalRepairCompletions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase use of photographic evidence for repair completions — before and after photographs provide valuable evidence of repair quality and premises improvement for Ofsted inspections and Reg 44/45 visits.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: MinorRepairsInsight[] = [];

  // -- Critical insights --

  if (requestResponseRate < 40 && totalMaintenanceRequests > 0) {
    insights.push({
      text: `Only ${requestResponseRate}% of maintenance requests acknowledged within target. Slow response to premises issues signals poor governance and can allow minor problems to escalate into safety hazards. Ofsted expects homes to demonstrate prompt, systematic handling of maintenance requests.`,
      severity: "critical",
    });
  }

  if (safetyCheckRate < 50 && totalSafetyChecks > 0) {
    insights.push({
      text: `Only ${safetyCheckRate}% safety check compliance. Non-compliance with statutory safety checks (gas, electrical, fire, legionella, etc.) represents a serious regulatory breach. Ofsted and local authority inspectors will view this as a fundamental failure to safeguard children's safety.`,
      severity: "critical",
    });
  }

  if (conditionComplianceRate < 40 && totalConditionAudits > 0) {
    insights.push({
      text: `Only ${conditionComplianceRate}% of premises areas rated good or excellent. Widespread poor condition across the premises indicates systemic maintenance failure. Children deserve to live in a home that is clean, well-decorated, structurally sound, and safe — Reg 25 requires the registered person to ensure premises are maintained to this standard.`,
      severity: "critical",
    });
  }

  if (preventativeMaintenanceRate < 40 && totalPreventativeTasks > 0) {
    insights.push({
      text: `Only ${preventativeMaintenanceRate}% of preventative maintenance completed on schedule. A reactive-only approach to premises maintenance is significantly more costly, disruptive, and risky than planned preventative care. Without a functioning preventative programme, breakdowns and safety failures become inevitable.`,
      severity: "critical",
    });
  }

  if (highRiskMissed > 0) {
    insights.push({
      text: `${highRiskMissed} high-risk preventative maintenance task${highRiskMissed !== 1 ? "s" : ""} overdue. Missing high-risk maintenance such as boiler servicing, electrical safety checks, or structural inspections creates immediate safety hazards. This must be escalated to the registered manager for urgent resolution.`,
      severity: "critical",
    });
  }

  if (totalSafetyChecks === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No safety check records despite children being on placement. Statutory safety compliance (gas safety, electrical inspections, fire risk assessments, legionella testing, PAT testing) is a fundamental requirement under Reg 25. The absence of any safety check records is a critical gap.",
      severity: "critical",
    });
  }

  if (totalConditionAudits === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No condition audit records despite children being on placement. Regular premises condition audits demonstrate the home monitors and maintains its environment. Without condition audits, the home cannot evidence that premises are fit for purpose under Reg 5.",
      severity: "critical",
    });
  }

  if (totalPreventativeTasks === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No preventative maintenance records despite children being on placement. A planned preventative maintenance programme is essential to keep premises safe and well-maintained. Without one, the home is relying entirely on reactive repairs, which is more costly, more disruptive, and more risky.",
      severity: "critical",
    });
  }

  if (safetyResolutionRate < 50 && safetyAffectingRequests > 0) {
    insights.push({
      text: `Only ${safetyResolutionRate}% of safety-affecting maintenance requests resolved. Unresolved premises issues that affect safety represent an ongoing risk to children and staff. The registered manager must ensure safety-related maintenance is treated with the highest priority.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    requestResponseRate >= 40 &&
    requestResponseRate < 70 &&
    totalMaintenanceRequests > 0
  ) {
    insights.push({
      text: `Maintenance request response rate at ${requestResponseRate}% — improving but not yet consistently meeting target timescales. Reviewing the acknowledgement workflow and implementing triage would help ensure all requests are dealt with promptly.`,
      severity: "warning",
    });
  }

  if (
    repairCompletionRate >= 50 &&
    repairCompletionRate < 80 &&
    totalRepairCompletions > 0
  ) {
    insights.push({
      text: `Repair completion rate at ${repairCompletionRate}% — a significant number of repairs are taking longer than target timescales. Identifying and addressing bottlenecks in the repair process would improve premises maintenance outcomes.`,
      severity: "warning",
    });
  }

  if (
    safetyCheckRate >= 50 &&
    safetyCheckRate < 80 &&
    totalSafetyChecks > 0
  ) {
    insights.push({
      text: `Safety check compliance at ${safetyCheckRate}% — while some compliance is in place, gaps remain. Each non-compliant check represents a potential regulatory finding at inspection. A compliance calendar with early-warning reminders would help close gaps.`,
      severity: "warning",
    });
  }

  if (
    conditionComplianceRate >= 40 &&
    conditionComplianceRate < 70 &&
    totalConditionAudits > 0
  ) {
    insights.push({
      text: `Condition compliance at ${conditionComplianceRate}% — some areas of the premises need attention. A prioritised improvement plan targeting the lowest-scoring areas would demonstrate proactive management of the home environment.`,
      severity: "warning",
    });
  }

  if (
    preventativeMaintenanceRate >= 40 &&
    preventativeMaintenanceRate < 70 &&
    totalPreventativeTasks > 0
  ) {
    insights.push({
      text: `Preventative maintenance rate at ${preventativeMaintenanceRate}% — planned tasks are not consistently completed on schedule. This increases the risk of reactive breakdowns and may indicate resourcing or scheduling issues that need management attention.`,
      severity: "warning",
    });
  }

  if (
    childEnvironmentRate >= 50 &&
    childEnvironmentRate < 70 &&
    totalChildEnvDenom > 0
  ) {
    insights.push({
      text: `Child environment rate at ${childEnvironmentRate}% — while some attention is given to children's living spaces, there is room for improvement. Children's areas should be prioritised in all maintenance planning to ensure a comfortable and safe living environment.`,
      severity: "warning",
    });
  }

  if (
    poorRepairRate >= 10 &&
    poorRepairRate < 20 &&
    totalRepairCompletions > 0
  ) {
    insights.push({
      text: `${poorRepairRate}% of repairs rated poor or failed — some repairs are not meeting acceptable quality standards. Consider implementing a post-repair inspection process and reviewing contractor performance where applicable.`,
      severity: "warning",
    });
  }

  if (
    overduePreventativeRate >= 15 &&
    overduePreventativeRate < 30 &&
    totalPreventativeTasks > 0
  ) {
    insights.push({
      text: `${overduePreventativeRate}% of preventative maintenance tasks overdue — while the majority of planned maintenance is on track, overdue tasks should be identified and rescheduled to prevent the backlog from growing.`,
      severity: "warning",
    });
  }

  if (
    safetyActionCompletionRate >= 50 &&
    safetyActionCompletionRate < 70 &&
    totalSafetyActionsReq > 0
  ) {
    insights.push({
      text: `Safety action completion at ${safetyActionCompletionRate}% — while some actions from safety checks are being completed, gaps remain. Incomplete safety actions undermine the purpose of compliance inspections and leave identified risks unresolved.`,
      severity: "warning",
    });
  }

  if (avgActualDays > 14 && totalRepairCompletions > 0) {
    insights.push({
      text: `Average repair time is ${avgActualDays} days. While some repairs legitimately take time, a high average suggests systemic delays. Review whether contractor availability, material procurement, or internal prioritisation is causing bottlenecks.`,
      severity: "warning",
    });
  }

  if (
    contractorBookingRate >= 50 &&
    contractorBookingRate < 80 &&
    contractorRequired > 0
  ) {
    insights.push({
      text: `Contractor booking rate at ${contractorBookingRate}% — some contractor-dependent maintenance tasks do not yet have contractors booked, risking delays in completion.`,
      severity: "warning",
    });
  }

  // Identify most common maintenance request categories
  const categoryCounts: Record<string, number> = {};
  for (const r of maintenance_request_records) {
    categoryCounts[r.category] = (categoryCounts[r.category] ?? 0) + 1;
  }
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topCategories.length > 0 && totalMaintenanceRequests > 5) {
    const topCatStr = topCategories
      .map(([c, n]) => `${c.replace(/_/g, " ")} (${n})`)
      .join(", ");
    insights.push({
      text: `Most common maintenance request categories: ${topCatStr}. Recurring patterns may indicate underlying premises issues that require a more strategic approach — for example, frequent plumbing requests may signal ageing pipework that needs planned replacement rather than repeated reactive repair.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (maintenance_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding premises maintenance — requests are handled promptly, repairs are completed on time and to a high standard, safety compliance is strong, premises condition is good, and preventative maintenance is well-managed. This contributes directly to a safe and comfortable living environment for children.",
      severity: "positive",
    });
  }

  if (
    requestResponseRate >= 90 &&
    repairCompletionRate >= 90 &&
    totalMaintenanceRequests > 0 &&
    totalRepairCompletions > 0
  ) {
    insights.push({
      text: `${requestResponseRate}% request response and ${repairCompletionRate}% repair completion within target — the home demonstrates an efficient end-to-end maintenance process from issue reporting through to resolution. This ensures premises issues are addressed quickly and effectively.`,
      severity: "positive",
    });
  }

  if (
    safetyCheckRate >= 95 &&
    overdueChecks === 0 &&
    totalSafetyChecks > 0
  ) {
    insights.push({
      text: `${safetyCheckRate}% safety check compliance with no overdue checks — the home maintains exemplary statutory compliance across all health and safety inspections. This provides strong evidence for Ofsted that children's safety is prioritised.`,
      severity: "positive",
    });
  }

  if (
    conditionComplianceRate >= 90 &&
    childFriendlyRate >= 90 &&
    totalConditionAudits > 0
  ) {
    insights.push({
      text: `${conditionComplianceRate}% of premises areas in good or excellent condition with ${childFriendlyRate}% rated child-friendly — the home maintains a high-quality living environment that is welcoming, safe, and suited to children's needs.`,
      severity: "positive",
    });
  }

  if (
    preventativeMaintenanceRate >= 90 &&
    overduePreventative === 0 &&
    totalPreventativeTasks > 0
  ) {
    insights.push({
      text: `${preventativeMaintenanceRate}% preventative maintenance on schedule with no overdue tasks — the home's proactive approach to premises upkeep prevents breakdowns, reduces costs, and ensures a consistently well-maintained environment.`,
      severity: "positive",
    });
  }

  if (
    childEnvironmentRate >= 90 &&
    totalChildEnvDenom > 0
  ) {
    insights.push({
      text: `${childEnvironmentRate}% child environment quality — maintenance affecting children's living areas is clearly prioritised, with repairs completed promptly, conditions maintained to a high standard, and children's feedback actively sought and acted upon.`,
      severity: "positive",
    });
  }

  if (
    regulatoryComplianceRate >= 100 &&
    regulatoryChecks > 0 &&
    certificateRate >= 90
  ) {
    insights.push({
      text: `100% regulatory compliance with ${certificateRate}% certificate coverage — the home can fully evidence compliance with all statutory safety requirements, providing robust assurance for Ofsted inspections and Reg 44/45 visits.`,
      severity: "positive",
    });
  }

  if (
    repairQualityRate >= 90 &&
    signOffRate >= 90 &&
    totalRepairCompletions > 0
  ) {
    insights.push({
      text: `${repairQualityRate}% repair quality at good or excellent with ${signOffRate}% formally signed off — the home demonstrates a robust quality assurance process for repair work, ensuring completions are verified and meet the required standard.`,
      severity: "positive",
    });
  }

  if (
    childFeedbackSoughtRate >= 80 &&
    childFeedbackPositiveRate >= 80 &&
    childFeedbackSought > 0
  ) {
    insights.push({
      text: `Children's feedback sought in ${childFeedbackSoughtRate}% of audits with ${childFeedbackPositiveRate}% positive — the home actively involves children in assessing their environment and children feel positively about their living conditions. This evidences genuine attention to children's experience of the home.`,
      severity: "positive",
    });
  }

  if (
    emergencyResolutionRate >= 100 &&
    urgentResolutionRate >= 90 &&
    emergencyRequests > 0 &&
    urgentRequests > 0
  ) {
    insights.push({
      text: `All emergency and ${urgentResolutionRate}% of urgent maintenance requests resolved — the home demonstrates excellent capacity to respond to priority premises issues, ensuring safety is never compromised by maintenance delays.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (maintenance_rating === "outstanding") {
    headline =
      "Outstanding premises maintenance — requests are handled promptly, repairs completed on time, safety compliance is strong, premises condition is good, and preventative maintenance is well-managed.";
  } else if (maintenance_rating === "good") {
    headline = `Good premises maintenance — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (maintenance_rating === "adequate") {
    headline = `Adequate premises maintenance — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure the home is safe, well-maintained, and fit for purpose.`;
  } else {
    headline = `Premises maintenance is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure the safety and quality of the living environment.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    maintenance_rating,
    maintenance_score: score,
    headline,
    total_maintenance_requests: totalMaintenanceRequests,
    total_repair_completions: totalRepairCompletions,
    total_safety_checks: totalSafetyChecks,
    total_condition_audits: totalConditionAudits,
    total_preventative_tasks: totalPreventativeTasks,
    request_response_rate: requestResponseRate,
    repair_completion_rate: repairCompletionRate,
    safety_check_rate: safetyCheckRate,
    condition_compliance_rate: conditionComplianceRate,
    preventative_maintenance_rate: preventativeMaintenanceRate,
    child_environment_rate: childEnvironmentRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
