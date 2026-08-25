import { above, below, meanOf, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF DEBRIEFING & CRITICAL INCIDENT SUPPORT INTELLIGENCE ENGINE
// Pure deterministic engine: debriefing completion, critical incident support
// timeliness, emotional wellbeing follow-up, learning extraction, support access,
// and staff satisfaction with debriefing & support processes.
// CHR 2015 Reg 16: "Statement of purpose — staff welfare and support."
// CHR 2015 Reg 34: "Safeguarding of children — staff support post-incident."
// SCCIF: "Leadership and management — supporting and developing staff."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface DebriefingRecordInput {
  id: string;
  staff_id: string;
  incident_id: string;
  debrief_type: string; // "formal_structured"|"informal_check_in"|"group_debrief"|"one_to_one"|"peer_led"|"manager_led"|"external_facilitator"
  status: string; // "completed"|"scheduled"|"overdue"|"declined"|"not_offered"
  offered_within_24h: boolean;
  completed_within_48h: boolean;
  staff_felt_supported: boolean;
  confidentiality_maintained: boolean;
  action_plan_created: boolean;
  follow_up_scheduled: boolean;
  follow_up_completed: boolean;
  emotional_impact_level: string; // "low"|"moderate"|"high"|"severe"
  debrief_quality_rating: number; // 1-5 staff self-rating of debrief quality
}

export interface CriticalIncidentRecordInput {
  id: string;
  incident_type: string; // "physical_assault"|"serious_injury"|"allegation"|"death"|"abscond"|"self_harm"|"restraint"|"police_involvement"|"medical_emergency"|"safeguarding_referral"
  severity: string; // "low"|"moderate"|"high"|"critical"
  staff_involved_count: number;
  immediate_support_offered: boolean;
  immediate_support_accepted: boolean;
  debrief_completed: boolean;
  external_support_offered: boolean;
  management_response_within_1h: boolean;
  incident_documented: boolean;
  lessons_identified: boolean;
  staff_welfare_check_completed: boolean;
}

export interface WellbeingFollowupRecordInput {
  id: string;
  staff_id: string;
  related_incident_id: string;
  followup_type: string; // "welfare_check"|"return_to_work"|"occupational_health"|"counselling_referral"|"supervision_extra"|"phased_return"|"adjusted_duties"
  status: string; // "completed"|"scheduled"|"overdue"|"declined"
  completed_on_time: boolean;
  staff_satisfied: boolean;
  outcome_positive: boolean;
  days_since_incident: number;
  needs_further_followup: boolean;
  further_followup_scheduled: boolean;
}

export interface LearningExtractionRecordInput {
  id: string;
  related_incident_id: string;
  learning_type: string; // "practice_change"|"training_need"|"policy_update"|"environmental_change"|"communication_improvement"|"supervision_focus"|"team_development"
  learning_shared_with_team: boolean;
  implemented: boolean;
  impact_assessed: boolean;
  linked_to_training_plan: boolean;
  documented_in_learning_log: boolean;
  review_date_set: boolean;
}

export interface SupportAccessRecordInput {
  id: string;
  staff_id: string;
  support_type: string; // "eap"|"counselling"|"peer_support"|"supervision"|"occupational_health"|"mental_health_first_aid"|"trauma_informed_support"|"union_rep"|"chaplaincy"
  access_route: string; // "self_referral"|"manager_referral"|"automatic_post_incident"|"team_provision"|"external_referral"
  accessed: boolean;
  timely_access: boolean; // within agreed timeframe
  staff_found_helpful: boolean;
  barriers_reported: boolean;
  barrier_type: string; // "none"|"stigma"|"availability"|"awareness"|"cost"|"time"|"location"|"other"
  confidential: boolean;
  repeat_access: boolean;
}

export interface StaffDebriefingInput {
  today: string;
  total_staff: number;
  debriefing_records: DebriefingRecordInput[];
  critical_incident_records: CriticalIncidentRecordInput[];
  wellbeing_followup_records: WellbeingFollowupRecordInput[];
  learning_extraction_records: LearningExtractionRecordInput[];
  support_access_records: SupportAccessRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StaffDebriefingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface StaffDebriefingResult {
  debriefing_rating: StaffDebriefingRating;
  debriefing_score: number | null;
  headline: string;

  // Counts
  total_debriefings: number;
  total_critical_incidents: number;
  total_wellbeing_followups: number;
  total_learning_extractions: number;
  total_support_accesses: number;

  // 6 rates
  debriefing_completion_rate: number | null;
  incident_support_rate: number | null;
  wellbeing_followup_rate: number | null;
  learning_extraction_rate: number | null;
  support_access_rate: number | null;
  staff_satisfaction_rate: number | null;

  // Sub-metrics
  offered_within_24h_rate: number | null;
  completed_within_48h_rate: number | null;
  management_response_rate: number | null;
  followup_on_time_rate: number | null;
  learning_implemented_rate: number | null;
  support_barriers_rate: number | null;

  // Qualitative
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref: string;
  }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): StaffDebriefingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function emptyResult(
  rating: StaffDebriefingRating,
  score: number,
  headline: string,
): StaffDebriefingResult {
  return {
    debriefing_rating: rating,
    debriefing_score: score,
    headline,
    total_debriefings: 0,
    total_critical_incidents: 0,
    total_wellbeing_followups: 0,
    total_learning_extractions: 0,
    total_support_accesses: 0,
    debriefing_completion_rate: null,
    incident_support_rate: null,
    wellbeing_followup_rate: null,
    learning_extraction_rate: null,
    support_access_rate: null,
    staff_satisfaction_rate: null,
    offered_within_24h_rate: null,
    completed_within_48h_rate: null,
    management_response_rate: null,
    followup_on_time_rate: null,
    learning_implemented_rate: null,
    support_barriers_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ENGINE
// ══════════════════════════════════════════════════════════════════════════════

export function computeStaffDebriefingCriticalIncidentSupport(
  input: StaffDebriefingInput,
): StaffDebriefingResult {
  const {
    total_staff,
    debriefing_records,
    critical_incident_records,
    wellbeing_followup_records,
    learning_extraction_records,
    support_access_records,
  } = input;

  // ── Special case: all empty + 0 staff → insufficient_data ────────────
  const allEmpty =
    debriefing_records.length === 0 &&
    critical_incident_records.length === 0 &&
    wellbeing_followup_records.length === 0 &&
    learning_extraction_records.length === 0 &&
    support_access_records.length === 0;

  if (allEmpty && total_staff === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No staff registered — insufficient data to assess debriefing and critical incident support.",
    );
  }

  // ── Special case: all empty + staff > 0 → inadequate ─────────────────
  if (allEmpty && total_staff > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No debriefing or critical incident support data recorded despite active staff — post-incident support requires urgent attention.",
      ),
      concerns: [
        "No debriefing records, critical incident support records, wellbeing follow-ups, learning extractions, or support access records exist despite staff being employed — the home cannot evidence adequate post-incident staff support.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured debriefing and critical incident support recording to evidence the home's post-incident staff welfare provision and comply with Reg 16 workforce welfare requirements.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 16 — Workforce",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every critical incident triggers a debriefing process, wellbeing follow-up, and learning extraction within documented timeframes to demonstrate safeguarding and staff welfare oversight.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
        },
      ],
      insights: [
        {
          text: "The complete absence of debriefing and critical incident support records means Ofsted cannot verify that the home supports staff after incidents. This represents a fundamental gap in Reg 16 and Reg 34 compliance and undermines the home's ability to evidence strong leadership and management under the SCCIF framework.",
          severity: "critical",
        },
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 1: DEBRIEFING COMPLETION METRICS
  // ══════════════════════════════════════════════════════════════════════

  const totalDebriefings = debriefing_records.length;

  // Completion rate: completed / total debriefing records
  const completedDebriefings = debriefing_records.filter(
    (r) => r.status === "completed",
  ).length;
  const debriefingCompletionRate = rate(completedDebriefings, totalDebriefings);

  // Offered within 24h rate
  const offeredWithin24h = debriefing_records.filter(
    (r) => r.offered_within_24h,
  ).length;
  const offeredWithin24hRate = rate(offeredWithin24h, totalDebriefings);

  // Completed within 48h rate (of those completed)
  const completedWithin48h = debriefing_records.filter(
    (r) => r.status === "completed" && r.completed_within_48h,
  ).length;
  const completedWithin48hRate = rate(completedWithin48h, completedDebriefings);

  // Debrief quality (average staff rating out of 5 → normalised to 100)
  const completedWithRating = debriefing_records.filter(
    (r) => r.status === "completed" && r.debrief_quality_rating > 0,
  );
  const avgQualityRating =
    completedWithRating.length > 0
      ? completedWithRating.reduce((sum, r) => sum + r.debrief_quality_rating, 0) /
        completedWithRating.length
      : 0;
  const qualityScore = Math.round((avgQualityRating / 5) * 100);

  // Staff felt supported rate (of completed)
  const feltSupported = debriefing_records.filter(
    (r) => r.status === "completed" && r.staff_felt_supported,
  ).length;
  const feltSupportedRate = rate(feltSupported, completedDebriefings);

  // Confidentiality maintained rate
  const confidentialityMaintained = debriefing_records.filter(
    (r) => r.status === "completed" && r.confidentiality_maintained,
  ).length;
  const confidentialityRate = rate(confidentialityMaintained, completedDebriefings);

  // Action plans created rate
  const actionPlans = debriefing_records.filter(
    (r) => r.status === "completed" && r.action_plan_created,
  ).length;
  const actionPlanRate = rate(actionPlans, completedDebriefings);

  // Overdue debriefings
  const overdueDebriefings = debriefing_records.filter(
    (r) => r.status === "overdue",
  ).length;

  // Declined debriefings
  const declinedDebriefings = debriefing_records.filter(
    (r) => r.status === "declined",
  ).length;

  // Not offered debriefings
  const notOfferedDebriefings = debriefing_records.filter(
    (r) => r.status === "not_offered",
  ).length;

  // Debrief type variety
  const uniqueDebriefTypes = new Set(
    debriefing_records.map((r) => r.debrief_type),
  ).size;

  // High/severe emotional impact debriefings
  const highImpactDebriefings = debriefing_records.filter(
    (r) =>
      r.emotional_impact_level === "high" ||
      r.emotional_impact_level === "severe",
  ).length;

  // Unique staff debriefed
  const uniqueStaffDebriefed = new Set(
    debriefing_records.map((r) => r.staff_id),
  ).size;
  const staffDebriefCoverageRate = rate(uniqueStaffDebriefed, total_staff);

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 2: CRITICAL INCIDENT SUPPORT METRICS
  // ══════════════════════════════════════════════════════════════════════

  const totalCriticalIncidents = critical_incident_records.length;

  // Immediate support offered rate
  const immediateSupportOffered = critical_incident_records.filter(
    (r) => r.immediate_support_offered,
  ).length;
  const incidentSupportRate = rate(immediateSupportOffered, totalCriticalIncidents);

  // Management response within 1h rate
  const managementResponsed = critical_incident_records.filter(
    (r) => r.management_response_within_1h,
  ).length;
  const managementResponseRate = rate(managementResponsed, totalCriticalIncidents);

  // Debrief completed after critical incidents
  const incidentDebriefCompleted = critical_incident_records.filter(
    (r) => r.debrief_completed,
  ).length;
  const incidentDebriefRate = rate(incidentDebriefCompleted, totalCriticalIncidents);

  // Staff welfare check completed rate
  const welfareCheckCompleted = critical_incident_records.filter(
    (r) => r.staff_welfare_check_completed,
  ).length;
  const welfareCheckRate = rate(welfareCheckCompleted, totalCriticalIncidents);

  // Critical severity incidents
  const criticalSeverityIncidents = critical_incident_records.filter(
    (r) => r.severity === "critical",
  ).length;

  // Support acceptance rate (of those offered)
  const supportAccepted = critical_incident_records.filter(
    (r) => r.immediate_support_offered && r.immediate_support_accepted,
  ).length;
  const supportAcceptanceRate = rate(supportAccepted, immediateSupportOffered);

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 3: WELLBEING FOLLOW-UP METRICS
  // ══════════════════════════════════════════════════════════════════════

  const totalWellbeingFollowups = wellbeing_followup_records.length;

  // Follow-up completion rate
  const completedFollowups = wellbeing_followup_records.filter(
    (r) => r.status === "completed",
  ).length;
  const wellbeingFollowupRate = rate(completedFollowups, totalWellbeingFollowups);

  // Follow-up on time rate (of completed)
  const followupsOnTime = wellbeing_followup_records.filter(
    (r) => r.status === "completed" && r.completed_on_time,
  ).length;
  const followupOnTimeRate = rate(followupsOnTime, completedFollowups);

  // Staff satisfied with follow-up
  const followupSatisfied = wellbeing_followup_records.filter(
    (r) => r.status === "completed" && r.staff_satisfied,
  ).length;
  const followupSatisfactionRate = rate(followupSatisfied, completedFollowups);

  // Positive outcome rate
  const positiveOutcomes = wellbeing_followup_records.filter(
    (r) => r.status === "completed" && r.outcome_positive,
  ).length;
  const positiveOutcomeRate = rate(positiveOutcomes, completedFollowups);

  // Overdue follow-ups
  const overdueFollowups = wellbeing_followup_records.filter(
    (r) => r.status === "overdue",
  ).length;

  // Further follow-up needed but not scheduled
  const furtherNeeded = wellbeing_followup_records.filter(
    (r) => r.needs_further_followup,
  ).length;
  const furtherScheduled = wellbeing_followup_records.filter(
    (r) => r.needs_further_followup && r.further_followup_scheduled,
  ).length;
  const furtherFollowupRate = rate(furtherScheduled, furtherNeeded);

  // Average days since incident for follow-ups
  const completedFollowupDays = wellbeing_followup_records
    .filter((r) => r.status === "completed")
    .map((r) => r.days_since_incident);
  const avgDaysSinceIncident =
    completedFollowupDays.length > 0
      ? Math.round(
          completedFollowupDays.reduce((s, d) => s + d, 0) /
            completedFollowupDays.length,
        )
      : null;

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 4: LEARNING EXTRACTION METRICS
  // ══════════════════════════════════════════════════════════════════════

  const totalLearningExtractions = learning_extraction_records.length;

  // Learning shared with team rate
  const learningShared = learning_extraction_records.filter(
    (r) => r.learning_shared_with_team,
  ).length;
  const learningSharedRate = rate(learningShared, totalLearningExtractions);

  // Learning implemented rate
  const learningImplemented = learning_extraction_records.filter(
    (r) => r.implemented,
  ).length;
  const learningImplementedRate = rate(learningImplemented, totalLearningExtractions);

  // Impact assessed rate
  const impactAssessed = learning_extraction_records.filter(
    (r) => r.impact_assessed,
  ).length;
  const impactAssessedRate = rate(impactAssessed, totalLearningExtractions);

  // Linked to training plan rate
  const linkedToTraining = learning_extraction_records.filter(
    (r) => r.linked_to_training_plan,
  ).length;
  const linkedToTrainingRate = rate(linkedToTraining, totalLearningExtractions);

  // Documented in learning log rate
  const documentedInLog = learning_extraction_records.filter(
    (r) => r.documented_in_learning_log,
  ).length;
  const documentedInLogRate = rate(documentedInLog, totalLearningExtractions);

  // Learning extraction rate (overall quality composite)
  // Combines: shared + implemented + documented
  const learningExtractionQuality =
    totalLearningExtractions > 0 ? Math.round((learningSharedRate! + learningImplementedRate! + documentedInLogRate!) / 3) : null;

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 5: SUPPORT ACCESS METRICS
  // ══════════════════════════════════════════════════════════════════════

  const totalSupportAccesses = support_access_records.length;

  // Accessed rate
  const supportAccessed = support_access_records.filter(
    (r) => r.accessed,
  ).length;
  const supportAccessRate = rate(supportAccessed, totalSupportAccesses);

  // Staff found helpful rate (of those who accessed)
  const foundHelpful = support_access_records.filter(
    (r) => r.accessed && r.staff_found_helpful,
  ).length;
  const foundHelpfulRate = rate(foundHelpful, supportAccessed);

  // Barriers reported rate
  const barriersReported = support_access_records.filter(
    (r) => r.barriers_reported,
  ).length;
  const barriersReportedRate = rate(barriersReported, totalSupportAccesses);

  // Confidential support rate
  const confidentialSupport = support_access_records.filter(
    (r) => r.confidential,
  ).length;
  const confidentialSupportRate = rate(confidentialSupport, totalSupportAccesses);

  // Repeat access rate (indicates ongoing support or unresolved need)
  const repeatAccess = support_access_records.filter(
    (r) => r.repeat_access,
  ).length;
  const repeatAccessRate = rate(repeatAccess, totalSupportAccesses);

  // Support type variety
  const uniqueSupportTypes = new Set(
    support_access_records.map((r) => r.support_type),
  ).size;

  // Unique staff accessing support
  const uniqueStaffAccessingSupport = new Set(
    support_access_records.map((r) => r.staff_id),
  ).size;
  const staffSupportCoverageRate = rate(uniqueStaffAccessingSupport, total_staff);

  // Barrier type breakdown
  const stigmaBarriers = support_access_records.filter(
    (r) => r.barrier_type === "stigma",
  ).length;
  const availabilityBarriers = support_access_records.filter(
    (r) => r.barrier_type === "availability",
  ).length;
  const awarenessBarriers = support_access_records.filter(
    (r) => r.barrier_type === "awareness",
  ).length;

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 6: STAFF SATISFACTION COMPOSITE
  // ══════════════════════════════════════════════════════════════════════

  // Staff satisfaction is a composite of:
  // - felt supported in debriefings
  // - satisfied with wellbeing follow-ups
  // - found support helpful
  const satisfactionComponents: (number | null)[] = [];
  if (completedDebriefings > 0) satisfactionComponents.push(feltSupportedRate);
  if (completedFollowups > 0) satisfactionComponents.push(followupSatisfactionRate);
  if (supportAccessed > 0) satisfactionComponents.push(foundHelpfulRate);

  const staffSatisfactionRate =
    meanOf(satisfactionComponents);

  // ══════════════════════════════════════════════════════════════════════
  // SCORING — base=52, max bonuses=+28, 4 penalties guarded by .length>0
  // ══════════════════════════════════════════════════════════════════════

  let score = 52;

  // ── Bonus 1: Debriefing completion quality (+0 to +7) ────────────────
  if (totalDebriefings > 0) {
    if (meets(debriefingCompletionRate, 90) && meets(offeredWithin24hRate, 85)) {
      score += 7;
    } else if (meets(debriefingCompletionRate, 80) && meets(offeredWithin24hRate, 70)) {
      score += 5;
    } else if (meets(debriefingCompletionRate, 65)) {
      score += 3;
    } else if (meets(debriefingCompletionRate, 50)) {
      score += 1;
    }
  }

  // ── Bonus 2: Critical incident support timeliness (+0 to +7) ────────
  if (totalCriticalIncidents > 0) {
    if (meets(incidentSupportRate, 95) && meets(managementResponseRate, 90)) {
      score += 7;
    } else if (meets(incidentSupportRate, 85) && meets(managementResponseRate, 75)) {
      score += 5;
    } else if (meets(incidentSupportRate, 70)) {
      score += 3;
    } else if (meets(incidentSupportRate, 50)) {
      score += 1;
    }
  }

  // ── Bonus 3: Wellbeing follow-up effectiveness (+0 to +7) ──────────
  if (totalWellbeingFollowups > 0) {
    if (meets(wellbeingFollowupRate, 90) && meets(followupOnTimeRate, 85) && meets(positiveOutcomeRate, 80)) {
      score += 7;
    } else if (meets(wellbeingFollowupRate, 80) && meets(followupOnTimeRate, 70)) {
      score += 5;
    } else if (meets(wellbeingFollowupRate, 65)) {
      score += 3;
    } else if (meets(wellbeingFollowupRate, 50)) {
      score += 1;
    }
  }

  // ── Bonus 4: Learning extraction & support access (+0 to +7) ───────
  if (totalLearningExtractions > 0 || totalSupportAccesses > 0) {
    // meanOf averages the measured components; both unmeasured -> null
    // instead of the old fabricated 0.
    const combinedAccessLearning = meanOf([
      totalLearningExtractions > 0 ? learningExtractionQuality : null,
      totalSupportAccesses > 0 ? supportAccessRate : null,
    ]);

    if ((combinedAccessLearning ?? 0) >= 85 && uniqueSupportTypes >= 4) {
      score += 7;
    } else if ((combinedAccessLearning ?? 0) >= 70) {
      score += 5;
    } else if ((combinedAccessLearning ?? 0) >= 55) {
      score += 3;
    } else if ((combinedAccessLearning ?? 0) >= 40) {
      score += 1;
    }
  }

  // ── Penalty 1: Overdue debriefings (guarded) ────────────────────────
  if (debriefing_records.length > 0) {
    const overdueRate = rate(overdueDebriefings, totalDebriefings);
    if (above(overdueRate, 30)) {
      score -= 8;
    } else if (above(overdueRate, 15)) {
      score -= 5;
    } else if (above(overdueRate, 5)) {
      score -= 2;
    }
  }

  // ── Penalty 2: Critical incidents without debrief (guarded) ─────────
  if (critical_incident_records.length > 0) {
    const noDebriefRate = rate(
      totalCriticalIncidents - incidentDebriefCompleted,
      totalCriticalIncidents,
    );
    if (above(noDebriefRate, 40)) {
      score -= 8;
    } else if (above(noDebriefRate, 20)) {
      score -= 5;
    } else if (above(noDebriefRate, 10)) {
      score -= 2;
    }
  }

  // ── Penalty 3: Overdue wellbeing follow-ups (guarded) ──────────────
  if (wellbeing_followup_records.length > 0) {
    const overdueFollowupRate = rate(overdueFollowups, totalWellbeingFollowups);
    if (above(overdueFollowupRate, 30)) {
      score -= 6;
    } else if (above(overdueFollowupRate, 15)) {
      score -= 3;
    } else if (above(overdueFollowupRate, 5)) {
      score -= 1;
    }
  }

  // ── Penalty 4: Support access barriers (guarded) ───────────────────
  if (support_access_records.length > 0) {
    if (above(barriersReportedRate, 40)) {
      score -= 6;
    } else if (above(barriersReportedRate, 20)) {
      score -= 3;
    } else if (above(barriersReportedRate, 10)) {
      score -= 1;
    }
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ══════════════════════════════════════════════════════════════════════
  // HEADLINE
  // ══════════════════════════════════════════════════════════════════════

  let headline: string;
  switch (rating) {
    case "outstanding":
      headline =
        "Staff debriefing and critical incident support is exemplary — timely, thorough, and staff report feeling genuinely supported after incidents";
      break;
    case "good":
      headline =
        "Good debriefing and incident support provision with effective follow-up and learning extraction from critical events";
      break;
    case "adequate":
      headline =
        "Debriefing and critical incident support exists but needs improvement in timeliness, completeness, or follow-through";
      break;
    case "inadequate":
      headline =
        "Staff debriefing and critical incident support is inadequate — staff welfare after incidents is not adequately managed";
      break;
    default:
      headline =
        "No data available for staff debriefing and critical incident support analysis";
  }

  // ══════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];

  // Debriefing strengths
  if (meets(debriefingCompletionRate, 90) && totalDebriefings > 0) {
    strengths.push(
      "Debriefing completion rate is outstanding — virtually all incidents receive structured debriefing, ensuring staff are consistently supported.",
    );
  }
  if (meets(offeredWithin24hRate, 90) && totalDebriefings > 0) {
    strengths.push(
      "Debriefings are almost always offered within 24 hours of an incident — timely support reduces the risk of long-term emotional impact on staff.",
    );
  }
  if (meets(feltSupportedRate, 90) && completedDebriefings > 0) {
    strengths.push(
      "Staff overwhelmingly report feeling supported during debriefings — this indicates a genuine culture of care and psychological safety.",
    );
  }
  if (qualityScore >= 80 && completedWithRating.length > 0) {
    strengths.push(
      "Staff rate debriefing quality highly — the process is meaningful, not just a tick-box exercise.",
    );
  }
  if (meets(confidentialityRate, 95) && completedDebriefings > 0) {
    strengths.push(
      "Confidentiality is consistently maintained in debriefings — staff can be open about their emotional responses without fear.",
    );
  }

  // Critical incident strengths
  if (meets(incidentSupportRate, 95) && totalCriticalIncidents > 0) {
    strengths.push(
      "Immediate support is offered in virtually all critical incidents — staff are not left unsupported after traumatic events.",
    );
  }
  if (meets(managementResponseRate, 90) && totalCriticalIncidents > 0) {
    strengths.push(
      "Management responds within one hour to critical incidents in the vast majority of cases — leadership presence during crises is strong.",
    );
  }
  if (meets(welfareCheckRate, 90) && totalCriticalIncidents > 0) {
    strengths.push(
      "Staff welfare checks are completed after nearly all critical incidents — demonstrating systematic concern for staff wellbeing.",
    );
  }

  // Wellbeing follow-up strengths
  if (meets(wellbeingFollowupRate, 90) && totalWellbeingFollowups > 0) {
    strengths.push(
      "Wellbeing follow-up completion rate is outstanding — staff receive sustained support, not just an initial response.",
    );
  }
  if (meets(followupOnTimeRate, 90) && completedFollowups > 0) {
    strengths.push(
      "Follow-ups are completed on time in the vast majority of cases — the home does not let post-incident support drift.",
    );
  }
  if (meets(positiveOutcomeRate, 85) && completedFollowups > 0) {
    strengths.push(
      "Follow-up outcomes are overwhelmingly positive — staff are recovering well with the support provided.",
    );
  }
  if (meets(furtherFollowupRate, 90) && furtherNeeded > 0) {
    strengths.push(
      "Where further follow-up is needed, it is reliably scheduled — ongoing support needs are not overlooked.",
    );
  }

  // Learning extraction strengths
  if (meets(learningImplementedRate, 85) && totalLearningExtractions > 0) {
    strengths.push(
      "Learning from incidents is implemented at a high rate — the home turns painful experiences into practice improvements.",
    );
  }
  if (meets(learningSharedRate, 90) && totalLearningExtractions > 0) {
    strengths.push(
      "Learning is shared with the wider team — ensuring the whole workforce benefits from incident reflections.",
    );
  }
  if (meets(impactAssessedRate, 80) && totalLearningExtractions > 0) {
    strengths.push(
      "The impact of learning actions is systematically assessed — demonstrating a mature approach to continuous improvement.",
    );
  }
  if (meets(linkedToTrainingRate, 75) && totalLearningExtractions > 0) {
    strengths.push(
      "Incident learning is linked to training plans — closing the loop between experience and professional development.",
    );
  }

  // Support access strengths
  if (meets(supportAccessRate, 90) && totalSupportAccesses > 0) {
    strengths.push(
      "Staff support access rate is outstanding — staff are actively using available support services.",
    );
  }
  if (meets(foundHelpfulRate, 90) && supportAccessed > 0) {
    strengths.push(
      "Staff overwhelmingly find support services helpful — indicating the right types of support are available.",
    );
  }
  if (uniqueSupportTypes >= 5 && totalSupportAccesses > 0) {
    strengths.push(
      "A wide variety of support types are available — staff can access the form of support that works best for them.",
    );
  }
  if (totalSupportAccesses > 0 && barriersReportedRate! <= 5) {
    strengths.push(
      "Very few barriers to accessing support are reported — the home has created an environment where seeking help is normalised.",
    );
  }
  if (meets(confidentialSupportRate, 95) && totalSupportAccesses > 0) {
    strengths.push(
      "Confidentiality in support provision is consistently maintained — encouraging staff to engage openly.",
    );
  }

  // Composite / cross-cutting strengths
  if (
    (staffSatisfactionRate ?? 0) >= 85 &&
    satisfactionComponents.length >= 2
  ) {
    strengths.push(
      "Staff satisfaction across debriefing, follow-up and support access is consistently high — the whole post-incident support pathway is effective.",
    );
  }
  if (
    meets(staffDebriefCoverageRate, 80) &&
    meets(staffSupportCoverageRate, 60) &&
    totalDebriefings > 0 &&
    totalSupportAccesses > 0
  ) {
    strengths.push(
      "Both debriefing and support access reach a wide proportion of staff — post-incident support is not concentrated on a few individuals.",
    );
  }

  const cappedStrengths = strengths.slice(0, 6);

  // ══════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ══════════════════════════════════════════════════════════════════════

  const concerns: string[] = [];

  // Debriefing concerns
  if (totalDebriefings === 0 && !allEmpty) {
    concerns.push(
      "No debriefing records exist despite other incident data being present — staff may not be receiving structured debriefing after incidents.",
    );
  }
  if (below(debriefingCompletionRate, 60) && totalDebriefings > 0) {
    concerns.push(
      "Debriefing completion rate is below 60% — a significant proportion of incidents do not result in completed debriefings, leaving staff unsupported.",
    );
  }
  if (below(offeredWithin24hRate, 50) && totalDebriefings > 0) {
    concerns.push(
      "Debriefings are offered within 24 hours in fewer than half of cases — delayed support reduces its therapeutic effectiveness.",
    );
  }
  if (overdueDebriefings > 0 && above(rate(overdueDebriefings, totalDebriefings), 15)) {
    concerns.push(
      `${overdueDebriefings} debriefings are overdue — staff are waiting for support that has been promised but not delivered.`,
    );
  }
  if (notOfferedDebriefings > 0 && above(rate(notOfferedDebriefings, totalDebriefings), 10)) {
    concerns.push(
      `${notOfferedDebriefings} debriefings were not offered — some staff are not being given the opportunity for post-incident support.`,
    );
  }
  if (below(feltSupportedRate, 60) && completedDebriefings > 0) {
    concerns.push(
      "Fewer than 60% of staff report feeling supported during debriefings — the process may lack depth, safety, or genuine engagement.",
    );
  }
  if (qualityScore < 50 && completedWithRating.length > 0) {
    concerns.push(
      "Staff rate debriefing quality poorly — the current approach may be perceived as perfunctory or unhelpful.",
    );
  }

  // Critical incident concerns
  if (totalCriticalIncidents === 0 && !allEmpty) {
    concerns.push(
      "No critical incident records exist despite other data being present — either incidents are not being classified or recording is incomplete.",
    );
  }
  if (below(incidentSupportRate, 70) && totalCriticalIncidents > 0) {
    concerns.push(
      "Immediate support is offered in fewer than 70% of critical incidents — staff involved in serious events may be left without timely help.",
    );
  }
  if (below(managementResponseRate, 60) && totalCriticalIncidents > 0) {
    concerns.push(
      "Management response within one hour is below 60% — leadership is not consistently present during critical incidents.",
    );
  }
  if (below(incidentDebriefRate, 60) && totalCriticalIncidents > 0) {
    concerns.push(
      "Debriefs are completed for fewer than 60% of critical incidents — many serious events lack structured reflection and support.",
    );
  }
  if (below(welfareCheckRate, 70) && totalCriticalIncidents > 0) {
    concerns.push(
      "Staff welfare checks are not completed after a significant proportion of critical incidents — ongoing welfare needs may go unidentified.",
    );
  }

  // Wellbeing follow-up concerns
  if (totalWellbeingFollowups === 0 && !allEmpty) {
    concerns.push(
      "No wellbeing follow-up records exist — staff may not be receiving sustained support after initial incident response.",
    );
  }
  if (below(wellbeingFollowupRate, 60) && totalWellbeingFollowups > 0) {
    concerns.push(
      "Wellbeing follow-up completion rate is below 60% — initial promises of ongoing support are not being fulfilled.",
    );
  }
  if (overdueFollowups > 0 && above(rate(overdueFollowups, totalWellbeingFollowups), 15)) {
    concerns.push(
      `${overdueFollowups} wellbeing follow-ups are overdue — staff with identified support needs are waiting for scheduled help.`,
    );
  }
  if (below(followupSatisfactionRate, 50) && completedFollowups > 0) {
    concerns.push(
      "Staff satisfaction with wellbeing follow-ups is below 50% — the support provided may not be meeting staff needs.",
    );
  }
  if (below(positiveOutcomeRate, 50) && completedFollowups > 0) {
    concerns.push(
      "Fewer than half of wellbeing follow-ups result in positive outcomes — the effectiveness of the support pathway needs review.",
    );
  }
  if (below(furtherFollowupRate, 60) && furtherNeeded > 0) {
    concerns.push(
      "Where further follow-up is identified as needed, it is not reliably scheduled — ongoing support needs are falling through gaps.",
    );
  }

  // Learning extraction concerns
  if (totalLearningExtractions === 0 && !allEmpty) {
    concerns.push(
      "No learning extraction records exist — the home is not systematically capturing lessons from incidents to improve practice.",
    );
  }
  if (below(learningImplementedRate, 50) && totalLearningExtractions > 0) {
    concerns.push(
      "Fewer than half of identified learning points are implemented — incidents are repeated without practice change.",
    );
  }
  if (below(learningSharedRate, 50) && totalLearningExtractions > 0) {
    concerns.push(
      "Learning is shared with the team in fewer than half of cases — lessons are being lost rather than embedded in practice.",
    );
  }
  if (below(documentedInLogRate, 50) && totalLearningExtractions > 0) {
    concerns.push(
      "Learning is not documented in a learning log in most cases — the home cannot evidence a systematic approach to incident learning.",
    );
  }

  // Support access concerns
  if (totalSupportAccesses === 0 && !allEmpty) {
    concerns.push(
      "No support access records exist — either staff are not being offered support or access is not being tracked.",
    );
  }
  if (below(supportAccessRate, 60) && totalSupportAccesses > 0) {
    concerns.push(
      "Support access rate is below 60% — staff may face barriers to accessing available support services.",
    );
  }
  if (above(barriersReportedRate, 30) && totalSupportAccesses > 0) {
    concerns.push(
      "More than 30% of staff report barriers to accessing support — the home needs to address systemic obstacles to help-seeking.",
    );
  }
  if (stigmaBarriers > 0 && above(rate(stigmaBarriers, totalSupportAccesses), 10)) {
    concerns.push(
      "Stigma is reported as a barrier to accessing support — the home's culture may discourage staff from seeking help when they need it.",
    );
  }
  if (awarenessBarriers > 0 && above(rate(awarenessBarriers, totalSupportAccesses), 15)) {
    concerns.push(
      "Lack of awareness is a significant barrier to support access — staff may not know what support is available to them.",
    );
  }
  if (below(foundHelpfulRate, 50) && supportAccessed > 0) {
    concerns.push(
      "Fewer than half of staff who access support find it helpful — the type or quality of support available needs review.",
    );
  }

  // Composite concerns
  if (
    (staffSatisfactionRate ?? 0) < 40 &&
    satisfactionComponents.length >= 2
  ) {
    concerns.push(
      "Staff satisfaction across the post-incident support pathway is poor — the home's approach to supporting staff after incidents is failing.",
    );
  }

  const cappedConcerns = concerns.slice(0, 6);

  // ══════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ══════════════════════════════════════════════════════════════════════

  const recs: StaffDebriefingResult["recommendations"] = [];

  // Immediate urgency recommendations
  if (below(debriefingCompletionRate, 50) && totalDebriefings > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Urgently review the debriefing process — fewer than half are completed. Ensure every incident triggers a debriefing within 24 hours and that staff are supported to attend.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }
  if (below(incidentSupportRate, 60) && totalCriticalIncidents > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Implement mandatory immediate support protocols for all critical incidents — the current response rate is unacceptable and may leave staff vulnerable to trauma.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }
  if (below(managementResponseRate, 50) && totalCriticalIncidents > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Establish a management on-call rota to ensure leadership presence within one hour of any critical incident — current response times are inadequate.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Leadership and Management",
    });
  }
  if (totalDebriefings === 0 && totalCriticalIncidents > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "No debriefings are recorded despite critical incidents occurring — implement a structured debriefing framework immediately.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }
  if (below(wellbeingFollowupRate, 50) && totalWellbeingFollowups > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Wellbeing follow-up completion is critically low — assign named responsibility for each follow-up and implement a tracking system.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  // Soon urgency recommendations
  if (below(offeredWithin24hRate, 70) && totalDebriefings > 0 && meets(debriefingCompletionRate, 50)) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Improve the timeliness of debriefing offers — aim for within 24 hours of every incident to maximise therapeutic benefit.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }
  if (below(learningImplementedRate, 60) && totalLearningExtractions > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Strengthen the learning implementation pathway — identified learning must be acted upon, tracked and reviewed to prevent incident recurrence.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and Management",
    });
  }
  if (below(learningSharedRate, 60) && totalLearningExtractions > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Ensure incident learning is systematically shared with the whole team through team meetings, supervision, or training sessions.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and Management",
    });
  }
  if (above(barriersReportedRate, 20) && totalSupportAccesses > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Investigate and address barriers to support access — staff cannot benefit from services they cannot reach.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33 — Employment of staff",
    });
  }
  if (below(welfareCheckRate, 80) && totalCriticalIncidents > 0 && meets(welfareCheckRate, 50)) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Ensure staff welfare checks are completed after every critical incident — embed this as a mandatory step in the incident response protocol.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 — Safeguarding",
    });
  }
  if (totalLearningExtractions === 0 && totalCriticalIncidents > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "No learning extraction records exist despite critical incidents — implement a structured learning extraction process for every incident.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and Management",
    });
  }

  // Planned urgency recommendations
  if (uniqueDebriefTypes < 3 && totalDebriefings > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Diversify debriefing approaches — offer group, peer-led, and external facilitation options alongside manager-led debriefs to suit different staff preferences.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and Management",
    });
  }
  if (uniqueSupportTypes < 3 && totalSupportAccesses > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Expand the range of support types available to staff — consider EAP, counselling, peer support, and trauma-informed approaches.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }
  if (below(actionPlanRate, 60) && completedDebriefings > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Increase the proportion of debriefings that result in action plans — structured follow-up actions help staff feel that debriefing leads to real change.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and Management",
    });
  }
  if (below(linkedToTrainingRate, 50) && totalLearningExtractions > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Link incident learning to the training and development plan — ensure identified training needs are addressed systematically.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 33 — Employment of staff",
    });
  }
  if (below(impactAssessedRate, 50) && totalLearningExtractions > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Implement impact assessment for implemented learning — without measuring outcomes, the home cannot evidence that learning leads to improvement.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and Management",
    });
  }
  if (below(staffDebriefCoverageRate, 50) && totalDebriefings > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Broaden debriefing coverage across the staff team — currently fewer than half of staff have received any debriefing.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }
  if (above(repeatAccessRate, 40) && totalSupportAccesses > 0) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Review cases of repeated support access — high repeat rates may indicate unresolved needs or chronic workplace stress.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }
  if (stigmaBarriers > 0 && above(rate(stigmaBarriers, totalSupportAccesses), 5)) {
    recs.push({
      rank: recs.length + 1,
      recommendation:
        "Address stigma around accessing support — normalise help-seeking through team discussion, leadership modelling, and visible promotion of services.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and Management",
    });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ══════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ══════════════════════════════════════════════════════════════════════

  const insights: StaffDebriefingResult["insights"] = [];

  // Critical insights
  if (
    totalCriticalIncidents > 0 &&
    below(incidentSupportRate, 50) &&
    below(debriefingCompletionRate, 50)
  ) {
    insights.push({
      text: "Both immediate incident support and debriefing completion are below 50% — the home's post-incident support system is failing staff. Ofsted will view this as a leadership and management weakness under the SCCIF framework, with implications for Reg 16 compliance.",
      severity: "critical",
    });
  }
  if (
    criticalSeverityIncidents > 0 &&
    above(rate(
      critical_incident_records.filter(
        (r) => r.severity === "critical" && !r.debrief_completed,
      ).length,
      criticalSeverityIncidents,
    ), 30)
  ) {
    insights.push({
      text: "Critical-severity incidents are occurring without completed debriefs — staff involved in the most traumatic events are being left without structured support. This is a safeguarding concern under Reg 34 as unsupported staff cannot provide safe care.",
      severity: "critical",
    });
  }
  if (
    totalWellbeingFollowups > 0 &&
    below(wellbeingFollowupRate, 40) &&
    overdueFollowups > 3
  ) {
    insights.push({
      text: "Wellbeing follow-up is systemically failing — multiple follow-ups are overdue and the completion rate is critically low. Staff with identified support needs are being left without the ongoing help they were promised.",
      severity: "critical",
    });
  }
  if (
    totalLearningExtractions === 0 &&
    totalCriticalIncidents > 3
  ) {
    insights.push({
      text: "Multiple critical incidents have occurred with no learning extraction — the home is not learning from adverse events. This is a serious SCCIF leadership concern and increases the risk of incident recurrence.",
      severity: "critical",
    });
  }
  if (
    above(barriersReportedRate, 40) &&
    stigmaBarriers > 0 &&
    totalSupportAccesses > 0
  ) {
    insights.push({
      text: "Widespread barriers to support access, including stigma, indicate a culture where staff do not feel safe seeking help. This undermines the entire post-incident support framework and may contribute to higher staff turnover and burnout.",
      severity: "critical",
    });
  }

  // Warning insights
  if (
    totalDebriefings > 0 &&
    meets(debriefingCompletionRate, 50) &&
    below(debriefingCompletionRate, 75)
  ) {
    insights.push({
      text: "Debriefing completion is adequate but not consistent — around a quarter to half of incidents do not receive completed debriefing. This inconsistency means some staff receive good support while others do not.",
      severity: "warning",
    });
  }
  if (
    totalCriticalIncidents > 0 &&
    meets(incidentSupportRate, 50) &&
    below(incidentSupportRate, 80)
  ) {
    insights.push({
      text: "Immediate support is offered in most but not all critical incidents — the gaps are concerning because staff involved in untreated critical events are at higher risk of burnout and secondary trauma.",
      severity: "warning",
    });
  }
  if (
    declinedDebriefings > 0 &&
    above(rate(declinedDebriefings, totalDebriefings), 20)
  ) {
    insights.push({
      text: "A significant proportion of debriefings are declined by staff — this may indicate the process is not trusted, not helpful, or that staff fear consequences of emotional disclosure. Consider reviewing the debriefing approach.",
      severity: "warning",
    });
  }
  if (
    totalLearningExtractions > 0 &&
    meets(learningImplementedRate, 50) &&
    below(learningImplementedRate, 75) &&
    below(impactAssessedRate, 50)
  ) {
    insights.push({
      text: "Learning is being extracted and partially implemented but impact is rarely assessed — the home cannot evidence whether changes actually improve practice. This closes the loop on paper but not in reality.",
      severity: "warning",
    });
  }
  if (
    highImpactDebriefings > 0 &&
    above(rate(highImpactDebriefings, totalDebriefings), 40)
  ) {
    insights.push({
      text: "A high proportion of debriefings relate to high or severe emotional impact incidents — the staff team is regularly exposed to significant trauma. Consider proactive wellbeing interventions beyond reactive debriefing.",
      severity: "warning",
    });
  }
  if (
    (avgDaysSinceIncident ?? 0) > 14 &&
    completedFollowupDays.length > 0
  ) {
    insights.push({
      text: "The average time between incidents and follow-up completion is over two weeks — while follow-ups are happening, the delay may reduce their effectiveness for staff recovery.",
      severity: "warning",
    });
  }
  if (
    availabilityBarriers > 0 &&
    above(rate(availabilityBarriers, totalSupportAccesses), 15)
  ) {
    insights.push({
      text: "Availability is a significant barrier to support access — staff may know what is available but cannot access it due to scheduling, location, or capacity constraints.",
      severity: "warning",
    });
  }
  if (
    below(supportAcceptanceRate, 60) &&
    immediateSupportOffered > 0
  ) {
    insights.push({
      text: "Staff acceptance of immediate support is below 60% — while support is offered, staff are choosing not to take it. This may reflect cultural, trust, or timing issues that need addressing.",
      severity: "warning",
    });
  }

  // Positive insights
  if (
    meets(debriefingCompletionRate, 90) &&
    meets(incidentSupportRate, 90) &&
    meets(wellbeingFollowupRate, 85) &&
    totalDebriefings > 0 &&
    totalCriticalIncidents > 0 &&
    totalWellbeingFollowups > 0
  ) {
    insights.push({
      text: "The home demonstrates an exemplary post-incident support system — debriefings are completed, incidents receive immediate support, and wellbeing follow-up is thorough. This is the standard Ofsted would expect for an outstanding rating under SCCIF leadership and management.",
      severity: "positive",
    });
  }
  if (
    meets(learningImplementedRate, 85) &&
    meets(learningSharedRate, 90) &&
    meets(impactAssessedRate, 80) &&
    totalLearningExtractions > 0
  ) {
    insights.push({
      text: "Learning extraction is exemplary — incidents generate shared learning that is implemented, documented, and impact-assessed. This is a hallmark of a reflective, learning-oriented home.",
      severity: "positive",
    });
  }
  if (
    (staffSatisfactionRate ?? 0) >= 90 &&
    satisfactionComponents.length >= 3
  ) {
    insights.push({
      text: "Staff satisfaction across all dimensions of post-incident support is outstanding — staff feel genuinely supported through debriefing, follow-up, and ongoing access to help. This is a significant retention and wellbeing asset.",
      severity: "positive",
    });
  }
  if (
    barriersReportedRate! <= 5 &&
    meets(supportAccessRate, 90) &&
    meets(foundHelpfulRate, 90) &&
    totalSupportAccesses > 0
  ) {
    insights.push({
      text: "Support services are accessible, well-used, and valued by staff — virtually no barriers are reported and satisfaction is very high. The home has built a genuine support culture.",
      severity: "positive",
    });
  }
  if (
    uniqueDebriefTypes >= 4 &&
    uniqueSupportTypes >= 4 &&
    totalDebriefings > 0 &&
    totalSupportAccesses > 0
  ) {
    insights.push({
      text: "The variety of debriefing approaches and support types available is impressive — staff can access support that matches their preferences and needs, which is critical for engagement.",
      severity: "positive",
    });
  }
  if (
    meets(welfareCheckRate, 95) &&
    meets(managementResponseRate, 95) &&
    totalCriticalIncidents > 0
  ) {
    insights.push({
      text: "Management response and welfare checks during critical incidents are near-universal — leadership is visibly and consistently present when staff need it most.",
      severity: "positive",
    });
  }
  if (
    meets(furtherFollowupRate, 95) &&
    meets(positiveOutcomeRate, 90) &&
    furtherNeeded > 0
  ) {
    insights.push({
      text: "Where ongoing support is needed, it is reliably scheduled and outcomes are overwhelmingly positive — the home does not give up on staff who need sustained help.",
      severity: "positive",
    });
  }

  const cappedInsights = insights.slice(0, 4);

  // ══════════════════════════════════════════════════════════════════════
  // RETURN
  // ══════════════════════════════════════════════════════════════════════

  return {
    debriefing_rating: rating,
    debriefing_score: score,
    headline,

    total_debriefings: totalDebriefings,
    total_critical_incidents: totalCriticalIncidents,
    total_wellbeing_followups: totalWellbeingFollowups,
    total_learning_extractions: totalLearningExtractions,
    total_support_accesses: totalSupportAccesses,

    debriefing_completion_rate: debriefingCompletionRate,
    incident_support_rate: incidentSupportRate,
    wellbeing_followup_rate: wellbeingFollowupRate,
    learning_extraction_rate: learningExtractionQuality,
    support_access_rate: supportAccessRate,
    staff_satisfaction_rate: staffSatisfactionRate,

    offered_within_24h_rate: offeredWithin24hRate,
    completed_within_48h_rate: completedWithin48hRate,
    management_response_rate: managementResponseRate,
    followup_on_time_rate: followupOnTimeRate,
    learning_implemented_rate: learningImplementedRate,
    support_barriers_rate: barriersReportedRate,

    strengths: cappedStrengths,
    concerns: cappedConcerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
