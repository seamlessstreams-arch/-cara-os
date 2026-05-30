// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HANDOVER & COMMUNICATION QUALITY INTELLIGENCE ENGINE
// Measures shift handover quality, communication log completeness,
// critical information transfer, handover timeliness, staff satisfaction
// with handovers, and handover action completion across the home.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 16 (Statement of purpose), Reg 5 (Engaging with the wider
// system of care), SCCIF: "Leadership and management".
// Store keys: handoverRecords, communicationLogRecords,
//             criticalInfoRecords, timelinessRecords,
//             actionCompletionRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface HandoverRecordInput {
  id: string;
  shift_date: string;
  shift_type: "day_to_night" | "night_to_day" | "early_to_late" | "late_to_early" | "other";
  outgoing_staff_id: string;
  incoming_staff_id: string;
  handover_completed: boolean;
  handover_method: "face_to_face" | "written_only" | "verbal_phone" | "digital_log" | "mixed";
  all_children_covered: boolean;
  behaviour_updates_included: boolean;
  medication_updates_included: boolean;
  safeguarding_updates_included: boolean;
  incident_updates_included: boolean;
  emotional_wellbeing_covered: boolean;
  appointments_handover_included: boolean;
  quality_rating: number; // 1-5
  manager_reviewed: boolean;
  issues_identified: string[];
  issues_resolved: boolean;
  notes: string | null;
  created_at: string;
}

export interface CommunicationLogRecordInput {
  id: string;
  date: string;
  staff_id: string;
  log_type: "daily_log" | "shift_summary" | "incident_note" | "professional_contact" | "family_contact" | "internal_memo" | "other";
  completeness_score: number; // 1-5
  timely_entry: boolean;
  relevant_detail_included: boolean;
  professional_language_used: boolean;
  actions_documented: boolean;
  follow_up_identified: boolean;
  follow_up_completed: boolean;
  reviewed_by_manager: boolean;
  child_ids_referenced: string[];
  created_at: string;
}

export interface CriticalInfoRecordInput {
  id: string;
  date: string;
  info_type: "safeguarding_alert" | "medical_emergency" | "medication_change" | "placement_risk" | "missing_child" | "court_order" | "professional_directive" | "behavioural_escalation" | "other";
  originating_staff_id: string;
  priority: "urgent" | "high" | "standard";
  all_relevant_staff_notified: boolean;
  notification_method: "face_to_face" | "phone" | "email" | "system_alert" | "handover_only" | "mixed";
  acknowledged_by_count: number;
  total_staff_to_notify: number;
  documented_in_handover: boolean;
  follow_up_actions_set: boolean;
  follow_up_completed: boolean;
  escalated_to_manager: boolean;
  time_to_notify_minutes: number | null;
  information_accurate: boolean;
  created_at: string;
}

export interface TimelinessRecordInput {
  id: string;
  shift_date: string;
  shift_type: "day_to_night" | "night_to_day" | "early_to_late" | "late_to_early" | "other";
  scheduled_handover_time: string;
  actual_handover_time: string | null;
  handover_started_on_time: boolean;
  handover_duration_minutes: number;
  adequate_duration: boolean;
  overlap_period_available: boolean;
  rushing_noted: boolean;
  both_staff_present: boolean;
  interruptions_count: number;
  created_at: string;
}

export interface ActionCompletionRecordInput {
  id: string;
  handover_date: string;
  action_description: string;
  assigned_to_staff_id: string;
  priority: "urgent" | "high" | "standard" | "low";
  due_by: string | null;
  completed: boolean;
  completed_on_time: boolean;
  completion_date: string | null;
  verified_by_manager: boolean;
  outcome_recorded: boolean;
  carried_forward_count: number;
  created_at: string;
}

export interface HandoverCommunicationQualityInput {
  today: string;
  total_staff: number;
  handover_records: HandoverRecordInput[];
  communication_log_records: CommunicationLogRecordInput[];
  critical_info_records: CriticalInfoRecordInput[];
  timeliness_records: TimelinessRecordInput[];
  action_completion_records: ActionCompletionRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type HandoverRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface HandoverInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface HandoverRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HandoverCommunicationQualityResult {
  handover_rating: HandoverRating;
  handover_score: number;
  headline: string;
  total_handover_records: number;
  total_communication_logs: number;
  total_critical_info_transfers: number;
  handover_quality_rate: number;
  communication_log_rate: number;
  critical_info_rate: number;
  handover_timeliness_rate: number;
  staff_satisfaction_rate: number;
  action_completion_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: HandoverRecommendation[];
  insights: HandoverInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): HandoverRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: HandoverRating,
  score: number,
  headline: string,
): HandoverCommunicationQualityResult {
  return {
    handover_rating: rating,
    handover_score: score,
    headline,
    total_handover_records: 0,
    total_communication_logs: 0,
    total_critical_info_transfers: 0,
    handover_quality_rate: 0,
    communication_log_rate: 0,
    critical_info_rate: 0,
    handover_timeliness_rate: 0,
    staff_satisfaction_rate: 0,
    action_completion_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHandoverCommunicationQuality(
  input: HandoverCommunicationQualityInput,
): HandoverCommunicationQualityResult {
  const {
    total_staff,
    handover_records,
    communication_log_records,
    critical_info_records,
    timeliness_records,
    action_completion_records,
  } = input;

  // ── Special case: all empty + 0 staff → insufficient_data ──────────
  const allEmpty =
    handover_records.length === 0 &&
    communication_log_records.length === 0 &&
    critical_info_records.length === 0 &&
    timeliness_records.length === 0 &&
    action_completion_records.length === 0;

  if (allEmpty && total_staff === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No staff on record — insufficient data to assess handover and communication quality.",
    );
  }

  // ── Special case: all empty + staff > 0 → inadequate ───────────────
  if (allEmpty && total_staff > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No handover or communication data recorded despite active staff — handover quality monitoring requires urgent attention.",
      ),
      concerns: [
        "No handover records, communication logs, critical information transfers, timeliness records, or action completion records exist despite staff being on record — the home cannot evidence adequate shift handover and communication quality management.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of shift handovers, communication logs, critical information transfers, and handover action tracking to evidence the home's management of communication continuity between shifts.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 16 — Statement of purpose",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every shift change has a documented handover covering all children, with critical information transfer protocols, timeliness monitoring, and action completion tracking in place.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system of care",
        },
      ],
      insights: [
        {
          text: "The complete absence of handover and communication records means Ofsted cannot verify that critical information is transferred between shifts, staff are briefed on children's needs, or communication continuity is maintained. This represents a fundamental gap in Reg 16 and Reg 5 compliance and undermines the leadership and management judgement under SCCIF.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Handover quality metrics ---
  const totalHandovers = handover_records.length;

  const completedHandovers = handover_records.filter((r) => r.handover_completed).length;
  const handoverCompletionRate = pct(completedHandovers, totalHandovers);

  const faceToFaceHandovers = handover_records.filter(
    (r) => r.handover_method === "face_to_face" || r.handover_method === "mixed",
  ).length;
  const faceToFaceRate = pct(faceToFaceHandovers, totalHandovers);

  const allChildrenCovered = handover_records.filter((r) => r.all_children_covered).length;
  const childCoverageRate = pct(allChildrenCovered, totalHandovers);

  const behaviourIncluded = handover_records.filter((r) => r.behaviour_updates_included).length;
  const medicationIncluded = handover_records.filter((r) => r.medication_updates_included).length;
  const safeguardingIncluded = handover_records.filter((r) => r.safeguarding_updates_included).length;
  const incidentIncluded = handover_records.filter((r) => r.incident_updates_included).length;
  const emotionalCovered = handover_records.filter((r) => r.emotional_wellbeing_covered).length;
  const appointmentsCovered = handover_records.filter((r) => r.appointments_handover_included).length;

  const contentChecksPossible = totalHandovers * 6;
  const contentChecksPassed =
    behaviourIncluded + medicationIncluded + safeguardingIncluded +
    incidentIncluded + emotionalCovered + appointmentsCovered;
  const contentCompletenessRate = pct(contentChecksPassed, contentChecksPossible);

  const qualitySum = handover_records.reduce((sum, r) => sum + r.quality_rating, 0);
  const avgQualityRating =
    totalHandovers > 0
      ? Math.round((qualitySum / totalHandovers) * 100) / 100
      : 0;

  const managerReviewedHandovers = handover_records.filter((r) => r.manager_reviewed).length;
  const managerReviewRate = pct(managerReviewedHandovers, totalHandovers);

  const handoverIssuesIdentified = handover_records.filter(
    (r) => r.issues_identified.length > 0,
  ).length;
  const handoverIssuesResolved = handover_records.filter(
    (r) => r.issues_identified.length > 0 && r.issues_resolved,
  ).length;
  const handoverIssueResolutionRate = pct(handoverIssuesResolved, handoverIssuesIdentified);

  // Composite handover quality rate: completed + content completeness + quality >= 4
  const highQualityHandovers = handover_records.filter(
    (r) => r.handover_completed && r.all_children_covered && r.quality_rating >= 4,
  ).length;
  const handoverQualityRate = pct(highQualityHandovers, totalHandovers);

  // --- Communication log metrics ---
  const totalCommLogs = communication_log_records.length;

  const completeCommLogs = communication_log_records.filter(
    (r) => r.completeness_score >= 4,
  ).length;
  const logCompletenessRate = pct(completeCommLogs, totalCommLogs);

  const timelyEntries = communication_log_records.filter((r) => r.timely_entry).length;
  const timelyEntryRate = pct(timelyEntries, totalCommLogs);

  const relevantDetail = communication_log_records.filter((r) => r.relevant_detail_included).length;
  const relevantDetailRate = pct(relevantDetail, totalCommLogs);

  const professionalLanguage = communication_log_records.filter(
    (r) => r.professional_language_used,
  ).length;
  const professionalLanguageRate = pct(professionalLanguage, totalCommLogs);

  const actionsDocumented = communication_log_records.filter((r) => r.actions_documented).length;
  const actionsDocumentedRate = pct(actionsDocumented, totalCommLogs);

  const logFollowUpRequired = communication_log_records.filter(
    (r) => r.follow_up_identified,
  ).length;
  const logFollowUpCompleted = communication_log_records.filter(
    (r) => r.follow_up_identified && r.follow_up_completed,
  ).length;
  const logFollowUpRate = pct(logFollowUpCompleted, logFollowUpRequired);

  const logManagerReviewed = communication_log_records.filter(
    (r) => r.reviewed_by_manager,
  ).length;
  const logManagerReviewRate = pct(logManagerReviewed, totalCommLogs);

  // Composite communication log rate: timely + complete + relevant detail + professional
  const qualityLogs = communication_log_records.filter(
    (r) =>
      r.timely_entry &&
      r.completeness_score >= 4 &&
      r.relevant_detail_included &&
      r.professional_language_used,
  ).length;
  const communicationLogRate = pct(qualityLogs, totalCommLogs);

  // --- Critical info transfer metrics ---
  const totalCriticalInfo = critical_info_records.length;

  const allStaffNotified = critical_info_records.filter(
    (r) => r.all_relevant_staff_notified,
  ).length;
  const staffNotificationRate = pct(allStaffNotified, totalCriticalInfo);

  const acknowledgedAll = critical_info_records.filter(
    (r) => r.total_staff_to_notify > 0 && r.acknowledged_by_count >= r.total_staff_to_notify,
  ).length;
  const fullAcknowledgementRate = pct(acknowledgedAll, totalCriticalInfo);

  const documentedInHandover = critical_info_records.filter(
    (r) => r.documented_in_handover,
  ).length;
  const handoverDocumentationRate = pct(documentedInHandover, totalCriticalInfo);

  const critFollowUpSet = critical_info_records.filter(
    (r) => r.follow_up_actions_set,
  ).length;
  const critFollowUpCompleted = critical_info_records.filter(
    (r) => r.follow_up_actions_set && r.follow_up_completed,
  ).length;
  const critFollowUpRate = pct(critFollowUpCompleted, critFollowUpSet);

  const escalatedToManager = critical_info_records.filter(
    (r) => r.escalated_to_manager,
  ).length;
  const escalationRate = pct(escalatedToManager, totalCriticalInfo);

  const accurateInfo = critical_info_records.filter(
    (r) => r.information_accurate,
  ).length;
  const accuracyRate = pct(accurateInfo, totalCriticalInfo);

  const rapidNotification = critical_info_records.filter(
    (r) => r.time_to_notify_minutes !== null && r.time_to_notify_minutes <= 15,
  ).length;
  const rapidNotificationRate = pct(rapidNotification, totalCriticalInfo);

  const urgentItems = critical_info_records.filter((r) => r.priority === "urgent").length;
  const urgentNotified = critical_info_records.filter(
    (r) => r.priority === "urgent" && r.all_relevant_staff_notified,
  ).length;
  const urgentNotificationRate = pct(urgentNotified, urgentItems);

  // Composite critical info rate: notified + documented in handover + accurate
  const effectiveCriticalTransfers = critical_info_records.filter(
    (r) => r.all_relevant_staff_notified && r.documented_in_handover && r.information_accurate,
  ).length;
  const criticalInfoRate = pct(effectiveCriticalTransfers, totalCriticalInfo);

  // --- Timeliness metrics ---
  const totalTimeliness = timeliness_records.length;

  const onTimeHandovers = timeliness_records.filter((r) => r.handover_started_on_time).length;
  const onTimeRate = pct(onTimeHandovers, totalTimeliness);

  const adequateDuration = timeliness_records.filter((r) => r.adequate_duration).length;
  const adequateDurationRate = pct(adequateDuration, totalTimeliness);

  const overlapAvailable = timeliness_records.filter((r) => r.overlap_period_available).length;
  const overlapRate = pct(overlapAvailable, totalTimeliness);

  const rushingNoted = timeliness_records.filter((r) => r.rushing_noted).length;
  const rushingRate = pct(rushingNoted, totalTimeliness);

  const bothPresent = timeliness_records.filter((r) => r.both_staff_present).length;
  const bothPresentRate = pct(bothPresent, totalTimeliness);

  const noInterruptions = timeliness_records.filter((r) => r.interruptions_count === 0).length;
  const noInterruptionsRate = pct(noInterruptions, totalTimeliness);

  const avgDuration =
    totalTimeliness > 0
      ? Math.round(
          timeliness_records.reduce((sum, r) => sum + r.handover_duration_minutes, 0) /
            totalTimeliness,
        )
      : 0;

  // Composite timeliness rate: on time + adequate duration + both present + no rushing
  const timelyHandovers = timeliness_records.filter(
    (r) =>
      r.handover_started_on_time &&
      r.adequate_duration &&
      r.both_staff_present &&
      !r.rushing_noted,
  ).length;
  const handoverTimelinessRate = pct(timelyHandovers, totalTimeliness);

  // --- Staff satisfaction (derived from quality ratings on handovers) ---
  const satisfiedStaff = handover_records.filter((r) => r.quality_rating >= 4).length;
  const staffSatisfactionRate = pct(satisfiedStaff, totalHandovers);

  // --- Action completion metrics ---
  const totalActions = action_completion_records.length;

  const completedActions = action_completion_records.filter((r) => r.completed).length;
  const actionCompletionRate = pct(completedActions, totalActions);

  const completedOnTime = action_completion_records.filter(
    (r) => r.completed && r.completed_on_time,
  ).length;
  const onTimeCompletionRate = pct(completedOnTime, totalActions);

  const verifiedByManager = action_completion_records.filter(
    (r) => r.completed && r.verified_by_manager,
  ).length;
  const actionVerificationRate = pct(verifiedByManager, completedActions);

  const outcomeRecorded = action_completion_records.filter(
    (r) => r.completed && r.outcome_recorded,
  ).length;
  const outcomeRecordRate = pct(outcomeRecorded, completedActions);

  const urgentActions = action_completion_records.filter((r) => r.priority === "urgent").length;
  const urgentCompleted = action_completion_records.filter(
    (r) => r.priority === "urgent" && r.completed,
  ).length;
  const urgentCompletionRate = pct(urgentCompleted, urgentActions);

  const carriedForwardActions = action_completion_records.filter(
    (r) => r.carried_forward_count > 0,
  ).length;
  const carriedForwardRate = pct(carriedForwardActions, totalActions);

  const highCarryForward = action_completion_records.filter(
    (r) => r.carried_forward_count >= 3,
  ).length;
  const chronicCarryForwardRate = pct(highCarryForward, totalActions);

  // ── Scoring: base 52, max bonuses +28, 4 guarded penalties ────────

  let score = 52;

  // --- Bonus 1: handoverQualityRate (>=90: +5, >=70: +3) ---
  if (handoverQualityRate >= 90) score += 5;
  else if (handoverQualityRate >= 70) score += 3;

  // --- Bonus 2: communicationLogRate (>=90: +5, >=70: +2) ---
  if (communicationLogRate >= 90) score += 5;
  else if (communicationLogRate >= 70) score += 2;

  // --- Bonus 3: criticalInfoRate (>=90: +5, >=70: +3) ---
  if (criticalInfoRate >= 90) score += 5;
  else if (criticalInfoRate >= 70) score += 3;

  // --- Bonus 4: handoverTimelinessRate (>=90: +4, >=70: +2) ---
  if (handoverTimelinessRate >= 90) score += 4;
  else if (handoverTimelinessRate >= 70) score += 2;

  // --- Bonus 5: staffSatisfactionRate (>=90: +4, >=70: +2) ---
  if (staffSatisfactionRate >= 90) score += 4;
  else if (staffSatisfactionRate >= 70) score += 2;

  // --- Bonus 6: actionCompletionRate (>=90: +5, >=70: +2) ---
  if (actionCompletionRate >= 90) score += 5;
  else if (actionCompletionRate >= 70) score += 2;

  // ── Penalties (4 guarded) ─────────────────────────────────────────

  // handoverQualityRate < 50 → -6
  if (handoverQualityRate < 50 && totalHandovers > 0) score -= 6;

  // criticalInfoRate < 50 → -6
  if (criticalInfoRate < 50 && totalCriticalInfo > 0) score -= 6;

  // handoverTimelinessRate < 40 → -4
  if (handoverTimelinessRate < 40 && totalTimeliness > 0) score -= 4;

  // actionCompletionRate < 50 → -4
  if (actionCompletionRate < 50 && totalActions > 0) score -= 4;

  score = clamp(score, 0, 100);

  const handover_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (handoverQualityRate >= 90 && totalHandovers > 0) {
    strengths.push(
      `${handoverQualityRate}% handover quality — shift handovers are consistently completed, comprehensive, and rated highly, ensuring seamless continuity of care for all children.`,
    );
  } else if (handoverQualityRate >= 70 && totalHandovers > 0) {
    strengths.push(
      `${handoverQualityRate}% handover quality — the majority of shift handovers are completed to a good standard with adequate coverage of children's needs.`,
    );
  }

  if (communicationLogRate >= 90 && totalCommLogs > 0) {
    strengths.push(
      `${communicationLogRate}% communication log quality — communication logs are consistently timely, complete, professionally written, and include relevant detail for every entry.`,
    );
  } else if (communicationLogRate >= 70 && totalCommLogs > 0) {
    strengths.push(
      `${communicationLogRate}% communication log quality — the home generally maintains good standards of recording in communication logs.`,
    );
  }

  if (criticalInfoRate >= 90 && totalCriticalInfo > 0) {
    strengths.push(
      `${criticalInfoRate}% critical information transfer effectiveness — all relevant staff are notified, information is documented in handovers, and accuracy is maintained for critical updates.`,
    );
  } else if (criticalInfoRate >= 70 && totalCriticalInfo > 0) {
    strengths.push(
      `${criticalInfoRate}% critical information transfer effectiveness — the majority of critical updates are effectively communicated and documented across shifts.`,
    );
  }

  if (handoverTimelinessRate >= 90 && totalTimeliness > 0) {
    strengths.push(
      `${handoverTimelinessRate}% handover timeliness — handovers consistently start on time, have adequate duration, both staff are present, and no rushing is observed.`,
    );
  } else if (handoverTimelinessRate >= 70 && totalTimeliness > 0) {
    strengths.push(
      `${handoverTimelinessRate}% handover timeliness — the home generally ensures handovers are conducted in a timely and unhurried manner.`,
    );
  }

  if (staffSatisfactionRate >= 90 && totalHandovers > 0) {
    strengths.push(
      `${staffSatisfactionRate}% staff satisfaction with handovers — staff consistently rate handover quality highly, reflecting confidence in information transfer and shift continuity.`,
    );
  } else if (staffSatisfactionRate >= 70 && totalHandovers > 0) {
    strengths.push(
      `${staffSatisfactionRate}% staff satisfaction — the majority of staff are satisfied with the quality and completeness of shift handovers.`,
    );
  }

  if (actionCompletionRate >= 90 && totalActions > 0) {
    strengths.push(
      `${actionCompletionRate}% handover action completion — actions identified during handovers are consistently completed, evidencing strong follow-through and accountability.`,
    );
  } else if (actionCompletionRate >= 70 && totalActions > 0) {
    strengths.push(
      `${actionCompletionRate}% handover action completion — the home generally follows through on actions identified during shift handovers.`,
    );
  }

  if (faceToFaceRate >= 90 && totalHandovers > 0) {
    strengths.push(
      `${faceToFaceRate}% face-to-face or mixed handovers — the home prioritises direct communication between outgoing and incoming staff, which research shows significantly improves information retention and quality.`,
    );
  } else if (faceToFaceRate >= 70 && totalHandovers > 0) {
    strengths.push(
      `${faceToFaceRate}% face-to-face or mixed handovers — most handovers include direct staff-to-staff communication.`,
    );
  }

  if (contentCompletenessRate >= 90 && totalHandovers > 0) {
    strengths.push(
      `${contentCompletenessRate}% handover content completeness — behaviour, medication, safeguarding, incident, emotional wellbeing, and appointments are consistently covered in every handover.`,
    );
  } else if (contentCompletenessRate >= 70 && totalHandovers > 0) {
    strengths.push(
      `${contentCompletenessRate}% content completeness — handovers generally cover the full range of required information domains.`,
    );
  }

  if (managerReviewRate >= 90 && totalHandovers > 0) {
    strengths.push(
      `${managerReviewRate}% manager review of handovers — leadership actively oversees handover quality, demonstrating strong management oversight consistent with SCCIF expectations.`,
    );
  } else if (managerReviewRate >= 70 && totalHandovers > 0) {
    strengths.push(
      `${managerReviewRate}% manager review rate — managers generally review handover records to maintain quality standards.`,
    );
  }

  if (rapidNotificationRate >= 90 && totalCriticalInfo > 0) {
    strengths.push(
      `${rapidNotificationRate}% of critical information communicated within 15 minutes — the home responds rapidly to ensure all relevant staff are briefed on urgent matters.`,
    );
  } else if (rapidNotificationRate >= 70 && totalCriticalInfo > 0) {
    strengths.push(
      `${rapidNotificationRate}% rapid notification of critical information — most critical updates are communicated promptly.`,
    );
  }

  if (onTimeCompletionRate >= 90 && totalActions > 0) {
    strengths.push(
      `${onTimeCompletionRate}% of handover actions completed on time — actions are not only completed but delivered within expected timeframes, demonstrating reliable follow-through.`,
    );
  } else if (onTimeCompletionRate >= 70 && totalActions > 0) {
    strengths.push(
      `${onTimeCompletionRate}% on-time completion of handover actions — the majority of actions are completed within expected deadlines.`,
    );
  }

  if (handoverIssueResolutionRate >= 90 && handoverIssuesIdentified > 0) {
    strengths.push(
      `${handoverIssueResolutionRate}% of handover issues resolved — problems identified during handovers are addressed promptly, evidencing a learning and improvement culture.`,
    );
  }

  if (accuracyRate >= 95 && totalCriticalInfo > 0) {
    strengths.push(
      `${accuracyRate}% information accuracy in critical transfers — the home maintains excellent accuracy when communicating critical information, reducing risk of misunderstanding or error.`,
    );
  }

  if (bothPresentRate >= 90 && totalTimeliness > 0) {
    strengths.push(
      `${bothPresentRate}% of handovers with both outgoing and incoming staff present — the home ensures proper overlap for effective information transfer.`,
    );
  }

  if (logFollowUpRate >= 90 && logFollowUpRequired > 0) {
    strengths.push(
      `${logFollowUpRate}% of communication log follow-ups completed — actions identified in logs are consistently followed through.`,
    );
  }

  if (professionalLanguageRate >= 95 && totalCommLogs > 0) {
    strengths.push(
      `${professionalLanguageRate}% professional language in communication logs — staff maintain high standards of written communication, supporting effective information sharing and regulatory compliance.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (handoverQualityRate < 50 && totalHandovers > 0) {
    concerns.push(
      `Only ${handoverQualityRate}% handover quality — the majority of shift handovers are incomplete, lack coverage of all children, or are rated poorly. This directly compromises continuity of care and creates risk of critical information being lost between shifts.`,
    );
  } else if (handoverQualityRate < 70 && handoverQualityRate >= 50 && totalHandovers > 0) {
    concerns.push(
      `Handover quality at ${handoverQualityRate}% — inconsistent handover standards may leave incoming staff insufficiently briefed about children's needs and current situations.`,
    );
  }

  if (communicationLogRate < 50 && totalCommLogs > 0) {
    concerns.push(
      `Only ${communicationLogRate}% communication log quality — logs lack timeliness, completeness, relevant detail, or professional language. Poor recording undermines the home's ability to evidence care quality and track children's progress.`,
    );
  } else if (communicationLogRate < 70 && communicationLogRate >= 50 && totalCommLogs > 0) {
    concerns.push(
      `Communication log quality at ${communicationLogRate}% — some logs do not meet required standards for timeliness, completeness, or detail.`,
    );
  }

  if (criticalInfoRate < 50 && totalCriticalInfo > 0) {
    concerns.push(
      `Only ${criticalInfoRate}% critical information transfer effectiveness — staff are not being properly notified of critical updates, information is not documented in handovers, or accuracy is compromised. This creates serious safeguarding and welfare risks.`,
    );
  } else if (criticalInfoRate < 70 && criticalInfoRate >= 50 && totalCriticalInfo > 0) {
    concerns.push(
      `Critical information transfer at ${criticalInfoRate}% — some critical updates are not being effectively communicated, documented, or verified for accuracy across shifts.`,
    );
  }

  if (handoverTimelinessRate < 40 && totalTimeliness > 0) {
    concerns.push(
      `Only ${handoverTimelinessRate}% handover timeliness — handovers are frequently late, rushed, inadequately timed, or conducted without both staff present. This undermines the quality of information transfer and creates risk of important details being missed.`,
    );
  } else if (handoverTimelinessRate < 70 && handoverTimelinessRate >= 40 && totalTimeliness > 0) {
    concerns.push(
      `Handover timeliness at ${handoverTimelinessRate}% — some handovers are not starting on time, lack adequate duration, or are rushed, reducing their effectiveness.`,
    );
  }

  if (staffSatisfactionRate < 50 && totalHandovers > 0) {
    concerns.push(
      `Only ${staffSatisfactionRate}% staff satisfaction with handovers — the majority of staff do not rate handover quality highly, indicating systemic issues with information transfer that require management attention.`,
    );
  } else if (staffSatisfactionRate < 70 && staffSatisfactionRate >= 50 && totalHandovers > 0) {
    concerns.push(
      `Staff satisfaction with handovers at ${staffSatisfactionRate}% — a notable proportion of staff are not satisfied with handover quality, which may indicate gaps in communication or process.`,
    );
  }

  if (actionCompletionRate < 50 && totalActions > 0) {
    concerns.push(
      `Only ${actionCompletionRate}% handover action completion — the majority of actions identified during handovers are not being completed. This means agreed tasks are falling through the cracks, directly impacting children's care and safety.`,
    );
  } else if (actionCompletionRate < 70 && actionCompletionRate >= 50 && totalActions > 0) {
    concerns.push(
      `Handover action completion at ${actionCompletionRate}% — some handover actions are not being followed through, risking gaps in children's care.`,
    );
  }

  if (childCoverageRate < 50 && totalHandovers > 0) {
    concerns.push(
      `Only ${childCoverageRate}% of handovers cover all children — some children are being overlooked during shift changes, creating risk that their needs, incidents, or updates are not communicated to incoming staff.`,
    );
  } else if (childCoverageRate < 70 && childCoverageRate >= 50 && totalHandovers > 0) {
    concerns.push(
      `Child coverage in handovers at ${childCoverageRate}% — not all children are being discussed in every handover, potentially leaving incoming staff uninformed.`,
    );
  }

  if (rushingRate > 50 && totalTimeliness > 0) {
    concerns.push(
      `${rushingRate}% of handovers noted as rushed — rushed handovers significantly increase the risk of critical information being missed or misunderstood. The home needs to ensure adequate protected time for shift changes.`,
    );
  } else if (rushingRate > 30 && rushingRate <= 50 && totalTimeliness > 0) {
    concerns.push(
      `${rushingRate}% of handovers noted as rushed — some handovers are being conducted under time pressure, which may reduce their quality.`,
    );
  }

  if (carriedForwardRate > 40 && totalActions > 0) {
    concerns.push(
      `${carriedForwardRate}% of handover actions have been carried forward at least once — a high proportion of actions are not being completed in their original shift, suggesting workload or prioritisation issues.`,
    );
  }

  if (chronicCarryForwardRate > 20 && totalActions > 0) {
    concerns.push(
      `${chronicCarryForwardRate}% of actions carried forward 3+ times — some actions are chronically deferred, indicating systemic barriers to completion that require management intervention.`,
    );
  }

  if (urgentNotificationRate < 80 && urgentItems > 0) {
    concerns.push(
      `Only ${urgentNotificationRate}% of urgent critical information notifications completed — not all urgent items are reaching all relevant staff. Urgent information requires immediate, verified communication to every staff member.`,
    );
  }

  if (totalHandovers === 0 && total_staff > 0 && !allEmpty) {
    concerns.push(
      "No handover records exist despite staff being on record — the home cannot evidence that structured shift handovers take place or that information is transferred between shifts.",
    );
  }

  if (totalCommLogs === 0 && total_staff > 0 && !allEmpty) {
    concerns.push(
      "No communication log records exist — the home cannot evidence that staff maintain written records of daily events, professional contacts, or shift summaries.",
    );
  }

  if (totalCriticalInfo === 0 && total_staff > 0 && !allEmpty && totalHandovers > 0) {
    concerns.push(
      "No critical information transfer records exist — there is no evidence that the home has a structured process for communicating safeguarding alerts, medical emergencies, or other urgent information across shifts.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────

  const recommendations: HandoverRecommendation[] = [];
  let rank = 0;

  if (handoverQualityRate < 50 && totalHandovers > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve shift handover quality — implement a structured handover checklist covering all children, behaviour, medication, safeguarding, incidents, emotional wellbeing, and appointments. Ensure every handover is completed face-to-face with adequate protected time.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Statement of purpose",
    });
  }

  if (criticalInfoRate < 50 && totalCriticalInfo > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish robust critical information transfer protocols — all critical safeguarding, medical, and welfare information must reach every relevant staff member with verified acknowledgement. Implement a read-and-sign system for urgent communications.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system of care",
    });
  }

  if (actionCompletionRate < 50 && totalActions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement an accountable action tracking system for handover tasks — every action must have a named owner, deadline, and verification step. Incomplete actions must be escalated to management at end of shift.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (handoverTimelinessRate < 40 && totalTimeliness > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Protect dedicated handover time in shift schedules — ensure adequate overlap periods between shifts, mandate both outgoing and incoming staff presence, and eliminate rushing. Consider adjusting shift patterns to allow unhurried handovers.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Statement of purpose",
    });
  }

  if (communicationLogRate < 50 && totalCommLogs > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide staff training on professional recording standards — communication logs must be timely, complete, factual, and written in professional language. Implement manager oversight of recording quality with regular audits.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Statement of purpose",
    });
  }

  if (childCoverageRate < 50 && totalHandovers > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Mandate that every child is discussed individually during every handover — no child should be overlooked when shifts change. Use a structured child-by-child handover template to prevent omissions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system of care",
    });
  }

  if (urgentNotificationRate < 80 && urgentItems > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen urgent communication protocols — urgent safeguarding and welfare information must reach every relevant staff member within 15 minutes with documented acknowledgement. Review and test the escalation pathway.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system of care",
    });
  }

  if (totalHandovers === 0 && total_staff > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement structured shift handover recording immediately — every shift change must have a documented handover covering all children's needs, incidents, and ongoing plans.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Statement of purpose",
    });
  }

  if (staffSatisfactionRate < 50 && totalHandovers > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Consult staff about barriers to effective handovers — low satisfaction indicates systemic issues with handover processes. Conduct a staff survey and implement improvements based on frontline feedback.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (
    handoverQualityRate >= 50 &&
    handoverQualityRate < 70 &&
    totalHandovers > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve handover quality to above 70% — focus on ensuring every handover is completed, covers all children, and achieves a quality rating of at least 4/5 through structured templates and manager oversight.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16 — Statement of purpose",
    });
  }

  if (
    communicationLogRate >= 50 &&
    communicationLogRate < 70 &&
    totalCommLogs > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance communication log standards through peer review and manager feedback — aim for all logs to be timely, complete, and professionally written with relevant detail.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16 — Statement of purpose",
    });
  }

  if (
    criticalInfoRate >= 50 &&
    criticalInfoRate < 70 &&
    totalCriticalInfo > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen critical information transfer processes — ensure all critical updates are communicated to every relevant staff member, documented in the next handover, and verified for accuracy.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system of care",
    });
  }

  if (
    handoverTimelinessRate >= 40 &&
    handoverTimelinessRate < 70 &&
    totalTimeliness > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve handover timeliness — ensure handovers start on time, have protected duration, and are not rushed. Review shift scheduling to build in adequate overlap periods.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16 — Statement of purpose",
    });
  }

  if (
    actionCompletionRate >= 50 &&
    actionCompletionRate < 70 &&
    totalActions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen action completion tracking — ensure all handover actions are completed and documented by the assigned staff member within the required timeframe.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (managerReviewRate < 50 && totalHandovers > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase management oversight of handover records — regular manager review of handovers evidences leadership grip on communication quality and supports identification of patterns or gaps.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (faceToFaceRate < 70 && totalHandovers > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the proportion of face-to-face handovers — direct verbal communication between outgoing and incoming staff enables questions, clarification, and nuance that written-only handovers cannot provide.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 16 — Statement of purpose",
    });
  }

  if (
    staffSatisfactionRate >= 50 &&
    staffSatisfactionRate < 70 &&
    totalHandovers > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Seek staff feedback on how to improve handover processes — aim to increase satisfaction above 70% by addressing the practical barriers staff identify.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (logFollowUpRate < 70 && logFollowUpRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve follow-up completion from communication log entries — ensure actions identified in daily logs and shift summaries are tracked and completed.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 16 — Statement of purpose",
    });
  }

  if (carriedForwardRate > 40 && totalActions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address high action carry-forward rate — review why actions are being deferred across shifts and identify systemic barriers to completion. Consider workload distribution and prioritisation frameworks.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (overlapRate < 70 && totalTimeliness > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure overlap periods are available for all shift changes — adequate overlap is essential for thorough handover. Review rota design to guarantee protected handover time.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 16 — Statement of purpose",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────

  const insights: HandoverInsight[] = [];

  // -- Critical insights --

  if (handoverQualityRate < 50 && totalHandovers > 0) {
    insights.push({
      text: `Only ${handoverQualityRate}% handover quality. Ofsted expects residential homes to maintain robust communication systems that ensure staff coming on duty are fully briefed. Poor handover quality under Reg 16 means the home cannot demonstrate that its stated purpose of providing safe, consistent care is reflected in day-to-day practice.`,
      severity: "critical",
    });
  }

  if (criticalInfoRate < 50 && totalCriticalInfo > 0) {
    insights.push({
      text: `Only ${criticalInfoRate}% critical information transfer effectiveness. Failures in communicating safeguarding alerts, medical changes, or placement risks between shifts create immediate danger to children's welfare. Under Reg 5, the home must demonstrate effective information-sharing systems.`,
      severity: "critical",
    });
  }

  if (actionCompletionRate < 50 && totalActions > 0) {
    insights.push({
      text: `Only ${actionCompletionRate}% handover action completion. When agreed actions are not followed through, children's care is compromised — medication may not be administered, appointments missed, or safeguarding actions delayed. This evidences a failure of leadership oversight under SCCIF.`,
      severity: "critical",
    });
  }

  if (handoverTimelinessRate < 40 && totalTimeliness > 0) {
    insights.push({
      text: `Only ${handoverTimelinessRate}% handover timeliness. Rushed, late, or inadequately resourced handovers are a known risk factor for information loss in residential care. When handovers are not conducted properly, the risk of critical information gaps increases significantly.`,
      severity: "critical",
    });
  }

  if (childCoverageRate < 50 && totalHandovers > 0) {
    insights.push({
      text: `Only ${childCoverageRate}% of handovers cover all children. Any child not discussed during a handover is at risk of having their needs, incidents, or plans unknown to incoming staff. This represents a fundamental failure in the home's duty of care.`,
      severity: "critical",
    });
  }

  if (totalHandovers === 0 && total_staff > 0 && !allEmpty) {
    insights.push({
      text: "No handover records exist despite staff being on record. Without documented handovers, Ofsted cannot verify that information is transferred between shifts. This is a critical gap in evidence of communication continuity and leadership oversight.",
      severity: "critical",
    });
  }

  if (totalCommLogs === 0 && total_staff > 0 && !allEmpty) {
    insights.push({
      text: "No communication log records exist. Written records of daily events, contacts, and shift summaries are a fundamental regulatory requirement. Their absence means the home cannot evidence ongoing communication quality or track information flow.",
      severity: "critical",
    });
  }

  if (urgentNotificationRate < 80 && urgentItems > 0) {
    insights.push({
      text: `Only ${urgentNotificationRate}% of urgent critical information reached all relevant staff. Urgent safeguarding and welfare alerts must be communicated immediately and comprehensively. Failures here represent direct safeguarding risk under Reg 5.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    handoverQualityRate >= 50 &&
    handoverQualityRate < 70 &&
    totalHandovers > 0
  ) {
    insights.push({
      text: `Handover quality at ${handoverQualityRate}% — improving but inconsistent. Some handovers lack comprehensiveness or adequate quality ratings. Review whether staffing pressures, time constraints, or skill gaps are contributing factors.`,
      severity: "warning",
    });
  }

  if (
    communicationLogRate >= 50 &&
    communicationLogRate < 70 &&
    totalCommLogs > 0
  ) {
    insights.push({
      text: `Communication log quality at ${communicationLogRate}% — some logs are incomplete, late, or lack professional language. Inconsistent recording undermines the home's ability to demonstrate care quality and track children's progress.`,
      severity: "warning",
    });
  }

  if (
    criticalInfoRate >= 50 &&
    criticalInfoRate < 70 &&
    totalCriticalInfo > 0
  ) {
    insights.push({
      text: `Critical information transfer at ${criticalInfoRate}% — while the majority of critical updates are communicated effectively, gaps remain that could result in staff being unaware of important changes to children's circumstances.`,
      severity: "warning",
    });
  }

  if (
    handoverTimelinessRate >= 40 &&
    handoverTimelinessRate < 70 &&
    totalTimeliness > 0
  ) {
    insights.push({
      text: `Handover timeliness at ${handoverTimelinessRate}% — some handovers are not starting on time, lack adequate duration, or are rushed. Time pressure is a common contributor to information loss during shift changes.`,
      severity: "warning",
    });
  }

  if (
    staffSatisfactionRate >= 50 &&
    staffSatisfactionRate < 70 &&
    totalHandovers > 0
  ) {
    insights.push({
      text: `Staff satisfaction with handovers at ${staffSatisfactionRate}% — a notable proportion of staff do not feel handovers are of sufficient quality. Staff dissatisfaction often correlates with gaps in information transfer that affect their ability to care for children effectively.`,
      severity: "warning",
    });
  }

  if (
    actionCompletionRate >= 50 &&
    actionCompletionRate < 70 &&
    totalActions > 0
  ) {
    insights.push({
      text: `Handover action completion at ${actionCompletionRate}% — some actions identified during handovers are not being followed through. Incomplete actions may result in delays to children's care, missed appointments, or unresolved concerns.`,
      severity: "warning",
    });
  }

  if (rushingRate > 30 && totalTimeliness > 0) {
    insights.push({
      text: `${rushingRate}% of handovers noted as rushed. Rushed handovers are one of the most common causes of communication failure in residential care. Staff need protected, uninterrupted time to share critical information about children.`,
      severity: "warning",
    });
  }

  if (
    managerReviewRate >= 30 &&
    managerReviewRate < 70 &&
    totalHandovers > 0
  ) {
    insights.push({
      text: `Manager review rate at ${managerReviewRate}% — management oversight of handovers is inconsistent. Regular review by managers is essential for quality assurance, identifying patterns, and demonstrating leadership grip on communication standards.`,
      severity: "warning",
    });
  }

  if (carriedForwardRate > 30 && totalActions > 0) {
    insights.push({
      text: `${carriedForwardRate}% of actions carried forward between shifts. A high carry-forward rate suggests workload or prioritisation barriers are preventing timely completion. This can lead to action fatigue where important tasks drift indefinitely.`,
      severity: "warning",
    });
  }

  if (
    logFollowUpRate >= 50 &&
    logFollowUpRate < 70 &&
    logFollowUpRequired > 0
  ) {
    insights.push({
      text: `Communication log follow-up completion at ${logFollowUpRate}% — actions identified in daily logs are not always being completed. This represents a gap between recording and action that weakens the home's communication cycle.`,
      severity: "warning",
    });
  }

  // Shift type analysis
  const shiftTypeDistribution: Record<string, number> = {};
  for (const r of handover_records) {
    shiftTypeDistribution[r.shift_type] = (shiftTypeDistribution[r.shift_type] ?? 0) + 1;
  }
  const topShiftTypes = Object.entries(shiftTypeDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topShiftTypes.length > 0) {
    const formatted = topShiftTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Handover distribution by shift type: ${formatted}. Understanding which shift transitions are most common helps focus quality improvement efforts on the handovers that affect the greatest number of staff and children.`,
      severity: "warning",
    });
  }

  // Critical info type analysis
  const infoTypeDistribution: Record<string, number> = {};
  for (const r of critical_info_records) {
    infoTypeDistribution[r.info_type] = (infoTypeDistribution[r.info_type] ?? 0) + 1;
  }
  const topInfoTypes = Object.entries(infoTypeDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topInfoTypes.length > 0) {
    const formatted = topInfoTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common critical information types: ${formatted}. Understanding the pattern of critical communications helps the home prepare protocols and training for the most frequent scenarios.`,
      severity: "warning",
    });
  }

  // Communication log type analysis
  const logTypeDistribution: Record<string, number> = {};
  for (const r of communication_log_records) {
    logTypeDistribution[r.log_type] = (logTypeDistribution[r.log_type] ?? 0) + 1;
  }
  const topLogTypes = Object.entries(logTypeDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topLogTypes.length > 0) {
    const formatted = topLogTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Communication log distribution: ${formatted}. A healthy mix of log types indicates staff are recording across all domains of professional practice, not just reactive incident notes.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (handover_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding handover and communication quality — shift handovers are consistently thorough, communication logs are complete and professional, critical information is transferred effectively, handovers are timely and unhurried, and actions are followed through. This is strong evidence for Reg 16, Reg 5, and SCCIF leadership and management compliance.",
      severity: "positive",
    });
  }

  if (
    handoverQualityRate >= 90 &&
    contentCompletenessRate >= 90 &&
    totalHandovers > 0
  ) {
    insights.push({
      text: `${handoverQualityRate}% handover quality with ${contentCompletenessRate}% content completeness — the home's handovers are consistently comprehensive and high quality, covering all required domains and ensuring incoming staff are fully briefed on every child's needs.`,
      severity: "positive",
    });
  }

  if (
    criticalInfoRate >= 90 &&
    accuracyRate >= 95 &&
    totalCriticalInfo > 0
  ) {
    insights.push({
      text: `${criticalInfoRate}% critical information transfer with ${accuracyRate}% accuracy — the home maintains excellent standards for communicating and documenting urgent information. Staff can be confident that critical updates reach all relevant colleagues with verified accuracy.`,
      severity: "positive",
    });
  }

  if (
    handoverTimelinessRate >= 90 &&
    bothPresentRate >= 90 &&
    totalTimeliness > 0
  ) {
    insights.push({
      text: `${handoverTimelinessRate}% timeliness with ${bothPresentRate}% both-staff presence — handovers are conducted in protected time with both outgoing and incoming staff present. This creates the conditions for thorough, effective information transfer.`,
      severity: "positive",
    });
  }

  if (
    actionCompletionRate >= 90 &&
    onTimeCompletionRate >= 90 &&
    totalActions > 0
  ) {
    insights.push({
      text: `${actionCompletionRate}% action completion with ${onTimeCompletionRate}% on time — actions identified during handovers are reliably completed within expected timeframes. This evidences strong staff accountability and effective leadership oversight.`,
      severity: "positive",
    });
  }

  if (
    communicationLogRate >= 90 &&
    professionalLanguageRate >= 95 &&
    totalCommLogs > 0
  ) {
    insights.push({
      text: `${communicationLogRate}% communication log quality with ${professionalLanguageRate}% professional language — staff maintain excellent written communication standards. High-quality logs support continuity of care, evidence regulatory compliance, and enable effective analysis of children's progress.`,
      severity: "positive",
    });
  }

  if (
    staffSatisfactionRate >= 90 &&
    totalHandovers > 0
  ) {
    insights.push({
      text: `${staffSatisfactionRate}% staff satisfaction with handover quality — staff consistently rate handovers highly, reflecting confidence in the home's communication systems. High staff satisfaction with handovers correlates with better information retention and fewer care gaps.`,
      severity: "positive",
    });
  }

  if (
    managerReviewRate >= 90 &&
    totalHandovers > 0
  ) {
    insights.push({
      text: `${managerReviewRate}% manager review of handovers — leadership actively monitors communication quality through systematic handover review. This demonstrates the management grip that SCCIF expects under the leadership and management judgement.`,
      severity: "positive",
    });
  }

  if (
    faceToFaceRate >= 90 &&
    noInterruptionsRate >= 80 &&
    totalTimeliness > 0
  ) {
    insights.push({
      text: `${faceToFaceRate}% face-to-face handovers with ${noInterruptionsRate}% uninterrupted — the home prioritises direct, focused communication between shifts. Research consistently shows face-to-face handovers with minimal interruptions produce the highest quality information transfer.`,
      severity: "positive",
    });
  }

  if (
    logFollowUpRate >= 90 &&
    logFollowUpRequired > 0
  ) {
    insights.push({
      text: `${logFollowUpRate}% of communication log follow-ups completed — the home demonstrates a strong cycle of recording, identifying actions, and following through. This closed-loop communication system supports continuous improvement in care delivery.`,
      severity: "positive",
    });
  }

  if (
    handoverIssueResolutionRate >= 90 &&
    handoverIssuesIdentified > 0
  ) {
    insights.push({
      text: `${handoverIssueResolutionRate}% of handover issues resolved — the home identifies and addresses problems in its handover processes, demonstrating a responsive quality improvement culture.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────

  let headline: string;

  if (handover_rating === "outstanding") {
    headline =
      "Outstanding handover and communication quality — shift handovers are thorough, timely, and comprehensive, with effective critical information transfer and strong action follow-through.";
  } else if (handover_rating === "good") {
    headline = `Good handover and communication quality — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (handover_rating === "adequate") {
    headline = `Adequate handover and communication quality — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure consistent information transfer between shifts.`;
  } else {
    headline = `Handover and communication quality is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure safe and effective shift communication.`;
  }

  // ── Return ────────────────────────────────────────────────────────

  return {
    handover_rating,
    handover_score: score,
    headline,
    total_handover_records: totalHandovers,
    total_communication_logs: totalCommLogs,
    total_critical_info_transfers: totalCriticalInfo,
    handover_quality_rate: handoverQualityRate,
    communication_log_rate: communicationLogRate,
    critical_info_rate: criticalInfoRate,
    handover_timeliness_rate: handoverTimelinessRate,
    staff_satisfaction_rate: staffSatisfactionRate,
    action_completion_rate: actionCompletionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
