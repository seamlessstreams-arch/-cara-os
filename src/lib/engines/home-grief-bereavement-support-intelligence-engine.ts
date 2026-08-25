import { above, below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME GRIEF & BEREAVEMENT SUPPORT INTELLIGENCE ENGINE
// Tracks grief and bereavement support quality — loss identification,
// bereavement counselling access, memory work facilitation, therapeutic grief
// interventions, and anniversary/trigger date management.
// Critical for Ofsted under Children's Homes Regulations 2015:
//   Reg 5 (Quality of care), Reg 14 (Health care)
//   SCCIF: Experiences and progress of children and young people
// Pure deterministic engine — no imports, no LLM, no external deps.
// Store keys: lossIdentificationRecords, counsellingAccessRecords,
//             memoryWorkRecords, griefInterventionRecords,
//             anniversaryManagementRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface LossIdentificationInput {
  id: string;
  child_id: string;
  loss_type: "bereavement" | "separation" | "placement_move" | "family_breakdown" | "pet_loss" | "friendship_loss" | "other";
  loss_date: string;
  identified_date: string;
  identified_by: "child_disclosure" | "social_worker" | "keyworker" | "family_member" | "therapist" | "school" | "other";
  relationship_to_deceased_or_lost: string;
  impact_severity: "severe" | "moderate" | "mild";
  child_informed_sensitively: boolean;
  care_plan_updated: boolean;
  risk_assessment_completed: boolean;
  support_plan_in_place: boolean;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface CounsellingAccessInput {
  id: string;
  child_id: string;
  counselling_type: "bereavement_specialist" | "general_therapeutic" | "play_therapy" | "art_therapy" | "group_therapy" | "peer_support" | "other";
  provider: string;
  referral_date: string;
  first_session_date: string | null;
  sessions_offered: number;
  sessions_attended: number;
  waiting_days: number;
  active: boolean;
  child_engagement_rating: number; // 1-5
  child_found_helpful: boolean;
  barriers_to_access: string[];
  discharge_reason: string | null;
  outcome_rating: number; // 1-5
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface MemoryWorkInput {
  id: string;
  child_id: string;
  activity_type: "memory_box" | "life_story_work" | "photo_album" | "memorial_visit" | "letter_writing" | "creative_expression" | "digital_memory" | "ritual_ceremony" | "other";
  activity_date: string;
  facilitated_by: "keyworker" | "therapist" | "family_member" | "child_led" | "group" | "other";
  child_engagement_rating: number; // 1-5
  child_found_meaningful: boolean;
  staff_observed_benefit: boolean;
  linked_to_loss_id: string | null;
  documented: boolean;
  follow_up_planned: boolean;
  follow_up_completed: boolean;
  created_at: string;
}

export interface GriefInterventionInput {
  id: string;
  child_id: string;
  intervention_type: "individual_therapy" | "group_work" | "psychoeducation" | "cbt_grief" | "narrative_therapy" | "emdr" | "creative_therapy" | "family_work" | "crisis_support" | "other";
  start_date: string;
  end_date: string | null;
  active: boolean;
  sessions_planned: number;
  sessions_completed: number;
  baseline_grief_score: number; // 1-10 (10 = most severe grief)
  current_grief_score: number; // 1-10
  target_grief_score: number; // 1-10
  child_reported_improvement: boolean;
  staff_reported_improvement: boolean;
  professional_involved: boolean;
  professional_name: string;
  therapeutic_approach: string;
  coping_strategies_taught: number;
  coping_strategies_used_by_child: number;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface AnniversaryManagementInput {
  id: string;
  child_id: string;
  anniversary_type: "death_anniversary" | "birthday_of_deceased" | "separation_date" | "placement_anniversary" | "significant_date" | "holiday_trigger" | "other";
  anniversary_date: string; // MM-DD or full date
  description: string;
  plan_in_place: boolean;
  plan_shared_with_staff: boolean;
  plan_shared_with_child: boolean;
  child_preferences_recorded: boolean;
  proactive_support_offered: boolean;
  day_managed_well: boolean | null; // null if not yet occurred
  child_feedback_positive: boolean | null;
  debrief_completed: boolean | null;
  created_at: string;
}

export interface GriefBereavementInput {
  today: string;
  total_children: number;
  loss_identification_records: LossIdentificationInput[];
  counselling_access_records: CounsellingAccessInput[];
  memory_work_records: MemoryWorkInput[];
  grief_intervention_records: GriefInterventionInput[];
  anniversary_management_records: AnniversaryManagementInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type GriefBereavementRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface GriefBereavementInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface GriefBereavementRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface GriefBereavementResult {
  grief_rating: GriefBereavementRating;
  grief_score: number;
  headline: string;
  total_losses_identified: number;
  /** null when the population is empty — nothing measured, not 0%. */
  loss_identification_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  counselling_access_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  memory_work_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  intervention_effectiveness_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  anniversary_management_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  child_coping_rate: number | null;
  // fab-0: null when no counselling records / no intervention data.
  counselling_wait_avg_days: number | null;
  intervention_progress_avg: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: GriefBereavementRecommendation[];
  insights: GriefBereavementInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): GriefBereavementRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: GriefBereavementRating,
  score: number,
  headline: string,
): GriefBereavementResult {
  return {
    grief_rating: rating,
    grief_score: score,
    headline,
    total_losses_identified: 0,
    loss_identification_rate: null,
    counselling_access_rate: null,
    memory_work_rate: null,
    intervention_effectiveness_rate: null,
    anniversary_management_rate: null,
    child_coping_rate: null,
    counselling_wait_avg_days: null,
    intervention_progress_avg: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeGriefBereavementSupport(
  input: GriefBereavementInput,
): GriefBereavementResult {
  const {
    total_children,
    loss_identification_records,
    counselling_access_records,
    memory_work_records,
    grief_intervention_records,
    anniversary_management_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    loss_identification_records.length === 0 &&
    counselling_access_records.length === 0 &&
    memory_work_records.length === 0 &&
    grief_intervention_records.length === 0 &&
    anniversary_management_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess grief and bereavement support.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No grief or bereavement support data recorded despite children on placement — loss identification and bereavement support require urgent attention.",
      ),
      concerns: [
        "No loss identification records, counselling access data, memory work records, grief interventions, or anniversary management records exist despite children being on placement — the home cannot evidence that children's grief and bereavement needs are identified or supported.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement a structured loss identification and assessment process for all children to ensure that experiences of bereavement, separation, and loss are formally recognised and care plans are updated accordingly.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
        },
        {
          rank: 2,
          recommendation:
            "Establish bereavement counselling referral pathways and memory work programmes to ensure children have access to therapeutic support and meaningful ways to process their grief.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Health care",
        },
      ],
      insights: [
        {
          text: "The complete absence of grief and bereavement support records means the home cannot demonstrate that children's experiences of loss are identified, understood, or therapeutically supported. Looked-after children are statistically more likely to have experienced significant loss, and Ofsted expects homes to proactively address grief as part of holistic care under Reg 5 and Reg 14.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Loss identification ---
  const totalLosses = loss_identification_records.length;
  const uniqueChildrenWithLoss = new Set(
    loss_identification_records.map((l) => l.child_id),
  ).size;

  const lossesWithSupportPlan = loss_identification_records.filter(
    (l) => l.support_plan_in_place,
  ).length;
  const lossIdentificationRate = rate(lossesWithSupportPlan, totalLosses);

  const lossesWithCarePlanUpdated = loss_identification_records.filter(
    (l) => l.care_plan_updated,
  ).length;
  const carePlanUpdateRate = rate(lossesWithCarePlanUpdated, totalLosses);

  const lossesWithRiskAssessment = loss_identification_records.filter(
    (l) => l.risk_assessment_completed,
  ).length;
  const riskAssessmentRate = rate(lossesWithRiskAssessment, totalLosses);

  const lossesChildInformedSensitively = loss_identification_records.filter(
    (l) => l.child_informed_sensitively,
  ).length;
  const sensitiveInformingRate = rate(lossesChildInformedSensitively, totalLosses);

  const overdueLossReviews = loss_identification_records.filter(
    (l) => l.review_overdue,
  ).length;

  const severeLosses = loss_identification_records.filter(
    (l) => l.impact_severity === "severe",
  ).length;
  const severeLossesWithSupport = loss_identification_records.filter(
    (l) => l.impact_severity === "severe" && l.support_plan_in_place,
  ).length;
  const severeLossSupportRate = rate(severeLossesWithSupport, severeLosses);

  // --- Counselling access ---
  const totalCounselling = counselling_access_records.length;
  const uniqueChildrenWithCounselling = new Set(
    counselling_access_records.map((c) => c.child_id),
  ).size;

  // Counselling access rate = children with loss who have counselling access
  const counsellingAccessRate =
    uniqueChildrenWithLoss > 0
      ? rate(uniqueChildrenWithCounselling, uniqueChildrenWithLoss)
      : totalCounselling > 0 ? 100 : 0;

  const activeCounselling = counselling_access_records.filter(
    (c) => c.active,
  ).length;

  const counsellingAttendanceTotal = counselling_access_records.reduce(
    (sum, c) => sum + c.sessions_attended,
    0,
  );
  const counsellingOfferedTotal = counselling_access_records.reduce(
    (sum, c) => sum + c.sessions_offered,
    0,
  );
  const counsellingAttendanceRate = rate(counsellingAttendanceTotal, counsellingOfferedTotal);

  const counsellingWaitDays = counselling_access_records
    .filter((c) => c.waiting_days >= 0)
    .map((c) => c.waiting_days);
  // fab-0: null when no counselling wait times recorded.
  const counsellingWaitAvgDays: number | null =
    counsellingWaitDays.length > 0
      ? Math.round(
          counsellingWaitDays.reduce((sum, d) => sum + d, 0) /
            counsellingWaitDays.length,
        )
      : null;

  const counsellingFoundHelpful = counselling_access_records.filter(
    (c) => c.child_found_helpful,
  ).length;
  const counsellingHelpfulRate = rate(counsellingFoundHelpful, totalCounselling);

  const overdueCounsellingReviews = counselling_access_records.filter(
    (c) => c.review_overdue && c.active,
  ).length;

  const counsellingWithBarriers = counselling_access_records.filter(
    (c) => c.barriers_to_access.length > 0,
  ).length;
  const barriersRate = rate(counsellingWithBarriers, totalCounselling);

  // --- Memory work ---
  const totalMemoryWork = memory_work_records.length;
  const uniqueChildrenWithMemoryWork = new Set(
    memory_work_records.map((m) => m.child_id),
  ).size;

  // Memory work rate = children with loss who have memory work
  const memoryWorkRate =
    uniqueChildrenWithLoss > 0
      ? rate(uniqueChildrenWithMemoryWork, uniqueChildrenWithLoss)
      : totalMemoryWork > 0 ? 100 : 0;

  const memoryWorkDocumented = memory_work_records.filter(
    (m) => m.documented,
  ).length;
  const memoryWorkDocumentationRate = rate(memoryWorkDocumented, totalMemoryWork);

  const memoryWorkMeaningful = memory_work_records.filter(
    (m) => m.child_found_meaningful,
  ).length;
  const memoryWorkMeaningfulRate = rate(memoryWorkMeaningful, totalMemoryWork);

  const memoryWorkStaffBenefit = memory_work_records.filter(
    (m) => m.staff_observed_benefit,
  ).length;
  const memoryWorkBenefitRate = rate(memoryWorkStaffBenefit, totalMemoryWork);

  const childLedMemoryWork = memory_work_records.filter(
    (m) => m.facilitated_by === "child_led",
  ).length;
  const childLedRate = rate(childLedMemoryWork, totalMemoryWork);

  // --- Grief interventions ---
  const totalInterventions = grief_intervention_records.length;
  const activeInterventions = grief_intervention_records.filter(
    (i) => i.active,
  ).length;

  // Intervention effectiveness: grief score decreased (lower = improvement for grief)
  const interventionsShowingImprovement = grief_intervention_records.filter(
    (i) => i.current_grief_score < i.baseline_grief_score,
  ).length;
  const interventionEffectivenessRate = rate(
    interventionsShowingImprovement,
    totalInterventions,
  );

  // Progress towards target
  const interventionProgressValues = grief_intervention_records
    .filter((i) => i.baseline_grief_score > i.target_grief_score)
    .map((i) => {
      const range = i.baseline_grief_score - i.target_grief_score;
      const progress = i.baseline_grief_score - i.current_grief_score;
      return clamp(Math.round((progress / range) * 100), 0, 100);
    });
  // fab-0: null when no interventions with quantifiable progress ranges.
  const interventionProgressAvg: number | null =
    interventionProgressValues.length > 0
      ? Math.round(
          interventionProgressValues.reduce((sum, v) => sum + v, 0) /
            interventionProgressValues.length,
        )
      : null;

  const childReportedImprovement = grief_intervention_records.filter(
    (i) => i.child_reported_improvement,
  ).length;
  const childReportedImprovementRate = rate(childReportedImprovement, totalInterventions);

  const staffReportedImprovement = grief_intervention_records.filter(
    (i) => i.staff_reported_improvement,
  ).length;
  const staffReportedImprovementRate = rate(staffReportedImprovement, totalInterventions);

  const sessionsCompletedTotal = grief_intervention_records.reduce(
    (sum, i) => sum + i.sessions_completed,
    0,
  );
  const sessionsPlannedTotal = grief_intervention_records.reduce(
    (sum, i) => sum + i.sessions_planned,
    0,
  );
  const sessionCompletionRate = rate(sessionsCompletedTotal, sessionsPlannedTotal);

  const overdueInterventionReviews = grief_intervention_records.filter(
    (i) => i.review_overdue && i.active,
  ).length;

  const professionalInvolved = grief_intervention_records.filter(
    (i) => i.professional_involved,
  ).length;
  const professionalInvolvementRate = rate(professionalInvolved, totalInterventions);

  // Coping strategies
  const totalCopingTaught = grief_intervention_records.reduce(
    (sum, i) => sum + i.coping_strategies_taught,
    0,
  );
  const totalCopingUsed = grief_intervention_records.reduce(
    (sum, i) => sum + i.coping_strategies_used_by_child,
    0,
  );
  const copingStrategyUptakeRate = rate(totalCopingUsed, totalCopingTaught);

  // --- Anniversary management ---
  const totalAnniversaries = anniversary_management_records.length;

  const anniversariesWithPlan = anniversary_management_records.filter(
    (a) => a.plan_in_place,
  ).length;
  const anniversaryManagementRate = rate(anniversariesWithPlan, totalAnniversaries);

  const childPreferencesRecorded = anniversary_management_records.filter(
    (a) => a.child_preferences_recorded,
  ).length;
  const preferencesRecordedRate = rate(childPreferencesRecorded, totalAnniversaries);

  const proactiveSupportOffered = anniversary_management_records.filter(
    (a) => a.proactive_support_offered,
  ).length;
  const proactiveSupportRate = rate(proactiveSupportOffered, totalAnniversaries);

  // For anniversaries that have occurred
  const occurredAnniversaries = anniversary_management_records.filter(
    (a) => a.day_managed_well !== null,
  );
  const managedWell = occurredAnniversaries.filter(
    (a) => a.day_managed_well === true,
  ).length;
  const dayManagedWellRate = rate(managedWell, occurredAnniversaries.length);

  const feedbackPositiveAnniv = occurredAnniversaries.filter(
    (a) => a.child_feedback_positive === true,
  ).length;
  const anniversaryFeedbackRate = rate(feedbackPositiveAnniv, occurredAnniversaries.length);

  // --- Child coping rate (composite: child-reported improvement + counselling helpful + memory work meaningful) ---
  const totalCopingOpportunities =
    totalInterventions + totalCounselling + totalMemoryWork;
  const totalPositiveCoping =
    childReportedImprovement + counsellingFoundHelpful + memoryWorkMeaningful;
  const childCopingRate = rate(totalPositiveCoping, totalCopingOpportunities);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: lossIdentificationRate (>=90: +4, >=70: +2) ---
  if (meets(lossIdentificationRate, 90)) score += 4;
  else if (meets(lossIdentificationRate, 70)) score += 2;

  // --- Bonus 2: counsellingAccessRate (>=90: +4, >=70: +2) ---
  if (meets(counsellingAccessRate, 90)) score += 4;
  else if (meets(counsellingAccessRate, 70)) score += 2;

  // --- Bonus 3: memoryWorkRate (>=80: +3, >=60: +1) ---
  if (meets(memoryWorkRate, 80)) score += 3;
  else if (meets(memoryWorkRate, 60)) score += 1;

  // --- Bonus 4: interventionEffectivenessRate (>=90: +4, >=70: +2) ---
  if (meets(interventionEffectivenessRate, 90)) score += 4;
  else if (meets(interventionEffectivenessRate, 70)) score += 2;

  // --- Bonus 5: anniversaryManagementRate (>=90: +3, >=70: +1) ---
  if (meets(anniversaryManagementRate, 90)) score += 3;
  else if (meets(anniversaryManagementRate, 70)) score += 1;

  // --- Bonus 6: childCopingRate (>=90: +3, >=70: +1) ---
  if (meets(childCopingRate, 90)) score += 3;
  else if (meets(childCopingRate, 70)) score += 1;

  // --- Bonus 7: counsellingAttendanceRate (>=90: +3, >=70: +1) ---
  if (meets(counsellingAttendanceRate, 90)) score += 3;
  else if (meets(counsellingAttendanceRate, 70)) score += 1;

  // --- Bonus 8: carePlanUpdateRate (>=100: +2, >=80: +1) ---
  if (meets(carePlanUpdateRate, 100)) score += 2;
  else if (meets(carePlanUpdateRate, 80)) score += 1;

  // --- Bonus 9: proactiveSupportRate (>=90: +2, >=70: +1) ---
  if (meets(proactiveSupportRate, 90)) score += 2;
  else if (meets(proactiveSupportRate, 70)) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // lossIdentificationRate < 50 → -5
  if (below(lossIdentificationRate, 50) && loss_identification_records.length > 0) score -= 5;

  // counsellingAccessRate < 50 → -5
  if (below(counsellingAccessRate, 50) && counselling_access_records.length > 0) score -= 5;

  // interventionEffectivenessRate < 40 → -4
  if (below(interventionEffectivenessRate, 40) && grief_intervention_records.length > 0) score -= 4;

  // anniversaryManagementRate < 50 → -4
  if (below(anniversaryManagementRate, 50) && anniversary_management_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const grief_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(lossIdentificationRate, 90) && totalLosses > 0) {
    strengths.push(
      `${lossIdentificationRate}% of identified losses have a support plan in place — the home demonstrates comprehensive, systematic response to children's experiences of loss.`,
    );
  } else if (meets(lossIdentificationRate, 70) && totalLosses > 0) {
    strengths.push(
      `${lossIdentificationRate}% of losses have support plans — strong practice in ensuring children's grief is formally acknowledged and responded to.`,
    );
  }

  if (meets(counsellingAccessRate, 90) && uniqueChildrenWithLoss > 0) {
    strengths.push(
      `${counsellingAccessRate}% of bereaved children have access to counselling — the home ensures therapeutic support is available to children who have experienced loss.`,
    );
  } else if (meets(counsellingAccessRate, 70) && uniqueChildrenWithLoss > 0) {
    strengths.push(
      `${counsellingAccessRate}% counselling access for bereaved children — good practice in connecting children with therapeutic grief support.`,
    );
  }

  if (meets(memoryWorkRate, 80) && uniqueChildrenWithLoss > 0) {
    strengths.push(
      `${memoryWorkRate}% of bereaved children engage in memory work — the home facilitates meaningful ways for children to process and honour their experiences of loss.`,
    );
  } else if (meets(memoryWorkRate, 60) && uniqueChildrenWithLoss > 0) {
    strengths.push(
      `${memoryWorkRate}% memory work participation — good engagement in activities that help children maintain connections and process grief.`,
    );
  }

  if (meets(interventionEffectivenessRate, 90) && totalInterventions > 0) {
    strengths.push(
      `${interventionEffectivenessRate}% of grief interventions showing improvement — therapeutic interventions are highly effective in supporting children's grief recovery.`,
    );
  } else if (meets(interventionEffectivenessRate, 70) && totalInterventions > 0) {
    strengths.push(
      `${interventionEffectivenessRate}% of grief interventions showing improvement — the majority of therapeutic grief support is achieving positive outcomes for children.`,
    );
  }

  if (meets(anniversaryManagementRate, 90) && totalAnniversaries > 0) {
    strengths.push(
      `${anniversaryManagementRate}% of anniversaries and trigger dates have management plans — the home proactively prepares for emotionally significant dates.`,
    );
  } else if (meets(anniversaryManagementRate, 70) && totalAnniversaries > 0) {
    strengths.push(
      `${anniversaryManagementRate}% anniversary management — good practice in planning ahead for known trigger dates and anniversaries.`,
    );
  }

  if (meets(childCopingRate, 90) && totalCopingOpportunities > 0) {
    strengths.push(
      `${childCopingRate}% positive coping outcomes reported by children — children consistently report that grief support is genuinely helping them cope with their loss.`,
    );
  } else if (meets(childCopingRate, 70) && totalCopingOpportunities > 0) {
    strengths.push(
      `${childCopingRate}% positive coping outcomes — most children report benefiting from the grief support provided.`,
    );
  }

  if (meets(counsellingAttendanceRate, 90) && counsellingOfferedTotal > 0) {
    strengths.push(
      `${counsellingAttendanceRate}% counselling session attendance — children are consistently engaging with their bereavement counselling, indicating trust in the therapeutic relationship.`,
    );
  } else if (meets(counsellingAttendanceRate, 70) && counsellingOfferedTotal > 0) {
    strengths.push(
      `${counsellingAttendanceRate}% counselling attendance — good levels of engagement with bereavement counselling services.`,
    );
  }

  if (meets(carePlanUpdateRate, 100) && totalLosses > 0) {
    strengths.push(
      "Every identified loss has resulted in an updated care plan — the home integrates bereavement needs into each child's wider care planning.",
    );
  } else if (meets(carePlanUpdateRate, 80) && totalLosses > 0) {
    strengths.push(
      `${carePlanUpdateRate}% of care plans updated following loss — strong practice in integrating grief support into care planning.`,
    );
  }

  if (meets(proactiveSupportRate, 90) && totalAnniversaries > 0) {
    strengths.push(
      `${proactiveSupportRate}% of anniversary dates receive proactive support — the home anticipates children's emotional needs rather than waiting for crisis.`,
    );
  } else if (meets(proactiveSupportRate, 70) && totalAnniversaries > 0) {
    strengths.push(
      `${proactiveSupportRate}% proactive anniversary support — good anticipatory care around known emotional trigger dates.`,
    );
  }

  if (meets(sensitiveInformingRate, 90) && totalLosses > 0) {
    strengths.push(
      `${sensitiveInformingRate}% of children informed about losses in a sensitive manner — the home handles disclosure of difficult news with care and compassion.`,
    );
  }

  if (meets(riskAssessmentRate, 90) && totalLosses > 0) {
    strengths.push(
      `${riskAssessmentRate}% of losses have risk assessments completed — the home systematically evaluates the impact of bereavement on children's safety and wellbeing.`,
    );
  }

  if (meets(memoryWorkMeaningfulRate, 90) && totalMemoryWork > 0) {
    strengths.push(
      `${memoryWorkMeaningfulRate}% of memory work activities found meaningful by children — activities are genuinely child-centred and emotionally resonant.`,
    );
  }

  if (meets(copingStrategyUptakeRate, 80) && totalCopingTaught > 0) {
    strengths.push(
      `${copingStrategyUptakeRate}% of taught coping strategies actively used by children — children are internalising therapeutic tools and applying them independently.`,
    );
  }

  if (meets(professionalInvolvementRate, 80) && totalInterventions > 0) {
    strengths.push(
      `${professionalInvolvementRate}% of grief interventions involve professional input — the home draws on specialist bereavement expertise to support children.`,
    );
  }

  if (above(totalCounselling, 0) && counsellingWaitAvgDays !== null && counsellingWaitAvgDays <= 14) {
    strengths.push(
      `Average counselling waiting time of ${counsellingWaitAvgDays} days — children access bereavement counselling promptly when needed.`,
    );
  }

  if (meets(dayManagedWellRate, 90) && occurredAnniversaries.length > 0) {
    strengths.push(
      `${dayManagedWellRate}% of occurred anniversaries were managed well — children are effectively supported through emotionally difficult dates.`,
    );
  }

  if (meets(childLedRate, 40) && totalMemoryWork > 0) {
    strengths.push(
      `${childLedRate}% of memory work activities are child-led — children are empowered to direct their own grief processing at their own pace.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(lossIdentificationRate, 50) && totalLosses > 0) {
    concerns.push(
      `Only ${lossIdentificationRate}% of identified losses have support plans — the majority of children's grief experiences are not being formally supported, preventing the home from evidencing individualised bereavement care.`,
    );
  } else if (below(lossIdentificationRate, 70) && meets(lossIdentificationRate, 50) && totalLosses > 0) {
    concerns.push(
      `Loss support plan rate at ${lossIdentificationRate}% — some children who have experienced loss do not have formal support plans, meaning their grief may not be systematically addressed.`,
    );
  }

  if (below(counsellingAccessRate, 50) && uniqueChildrenWithLoss > 0) {
    concerns.push(
      `Only ${counsellingAccessRate}% of bereaved children have access to counselling — the majority of children who have experienced loss are not receiving therapeutic support, leaving significant emotional needs unmet.`,
    );
  } else if (below(counsellingAccessRate, 70) && meets(counsellingAccessRate, 50) && uniqueChildrenWithLoss > 0) {
    concerns.push(
      `Counselling access at ${counsellingAccessRate}% — some bereaved children lack access to bereavement counselling, meaning their grief may not receive the professional support it requires.`,
    );
  }

  if (below(memoryWorkRate, 40) && uniqueChildrenWithLoss > 0) {
    concerns.push(
      `Only ${memoryWorkRate}% of bereaved children engage in memory work — most children do not have access to memory work activities, missing opportunities to process grief through meaningful connection.`,
    );
  } else if (below(memoryWorkRate, 60) && meets(memoryWorkRate, 40) && uniqueChildrenWithLoss > 0) {
    concerns.push(
      `Memory work participation at ${memoryWorkRate}% — not all bereaved children are offered or engaging in memory work activities that could support their grief processing.`,
    );
  }

  if (below(interventionEffectivenessRate, 40) && totalInterventions > 0) {
    concerns.push(
      `Only ${interventionEffectivenessRate}% of grief interventions showing improvement — the majority of therapeutic interventions are not achieving their intended outcomes, suggesting a fundamental review of approach is needed.`,
    );
  } else if (below(interventionEffectivenessRate, 70) && meets(interventionEffectivenessRate, 40) && totalInterventions > 0) {
    concerns.push(
      `Intervention effectiveness at ${interventionEffectivenessRate}% — not all grief interventions are achieving positive outcomes. Review is needed to ensure interventions are appropriately matched to individual children's grief experiences.`,
    );
  }

  if (below(anniversaryManagementRate, 50) && totalAnniversaries > 0) {
    concerns.push(
      `Only ${anniversaryManagementRate}% of anniversaries have management plans — the majority of known trigger dates and anniversaries lack proactive planning, leaving children vulnerable to unmanaged emotional distress.`,
    );
  } else if (below(anniversaryManagementRate, 70) && meets(anniversaryManagementRate, 50) && totalAnniversaries > 0) {
    concerns.push(
      `Anniversary management at ${anniversaryManagementRate}% — some known trigger dates lack proactive plans, meaning children may face emotionally difficult days without prepared support.`,
    );
  }

  if (below(childCopingRate, 50) && totalCopingOpportunities > 0) {
    concerns.push(
      `Only ${childCopingRate}% positive coping outcomes — most children do not report that grief support is helping them, raising serious questions about whether the home's bereavement provision genuinely meets children's emotional needs.`,
    );
  } else if (below(childCopingRate, 70) && meets(childCopingRate, 50) && totalCopingOpportunities > 0) {
    concerns.push(
      `Child coping rate at ${childCopingRate}% — a significant proportion of children do not report positive outcomes from grief support provision.`,
    );
  }

  if (totalCounselling > 0 && counsellingWaitAvgDays !== null && counsellingWaitAvgDays > 42) {
    concerns.push(
      `Average counselling waiting time is ${counsellingWaitAvgDays} days — excessive delays in accessing bereavement counselling mean children are left without professional support during a critical period of grief.`,
    );
  } else if (totalCounselling > 0 && counsellingWaitAvgDays !== null && counsellingWaitAvgDays > 28 && counsellingWaitAvgDays <= 42) {
    concerns.push(
      `Average counselling waiting time of ${counsellingWaitAvgDays} days — delays in accessing bereavement support may prolong children's distress and complicate their grief recovery.`,
    );
  }

  if (below(carePlanUpdateRate, 50) && totalLosses > 0) {
    concerns.push(
      `Only ${carePlanUpdateRate}% of care plans updated following loss — most children's care plans do not reflect their bereavement needs, meaning daily care may not account for the impact of grief.`,
    );
  }

  if (overdueLossReviews > 0 && totalLosses > 0) {
    concerns.push(
      `${overdueLossReviews} loss review${overdueLossReviews !== 1 ? "s are" : " is"} overdue — without timely reviews, the home cannot ensure bereavement support remains appropriate to each child's evolving grief.`,
    );
  }

  if (overdueCounsellingReviews > 0 && activeCounselling > 0) {
    concerns.push(
      `${overdueCounsellingReviews} active counselling review${overdueCounsellingReviews !== 1 ? "s are" : " is"} overdue — counselling arrangements must be reviewed to confirm they remain effective and appropriate.`,
    );
  }

  if (above(overdueInterventionReviews, 0) && activeInterventions > 0) {
    concerns.push(
      `${overdueInterventionReviews} active grief intervention review${overdueInterventionReviews !== 1 ? "s are" : " is"} overdue — interventions without timely review may continue ineffectively while children's grief needs evolve.`,
    );
  }

  if (below(counsellingAttendanceRate, 50) && counsellingOfferedTotal > 0) {
    concerns.push(
      `Only ${counsellingAttendanceRate}% counselling session attendance — poor engagement with bereavement counselling suggests barriers, mismatched provision, or unaddressed reluctance that needs exploration.`,
    );
  }

  if (above(severeLosses, 0) && below(severeLossSupportRate, 100)) {
    concerns.push(
      `${severeLosses - severeLossesWithSupport} severe-impact loss${(severeLosses - severeLossesWithSupport) !== 1 ? "es lack" : " lacks"} a support plan — children experiencing severe grief impact must have immediate, structured bereavement support.`,
    );
  }

  if (above(barriersRate, 40) && totalCounselling > 0) {
    concerns.push(
      `${barriersRate}% of counselling referrals have identified barriers to access — systemic barriers are preventing children from receiving the bereavement support they need.`,
    );
  }

  if (below(memoryWorkDocumentationRate, 70) && totalMemoryWork > 0) {
    concerns.push(
      `Memory work documentation at only ${memoryWorkDocumentationRate}% — poor recording makes it difficult to evidence the purpose and outcomes of memory work activities.`,
    );
  }

  if (below(sessionCompletionRate, 50) && sessionsPlannedTotal > 0) {
    concerns.push(
      `Only ${sessionCompletionRate}% of planned intervention sessions completed — the home is not delivering the grief support it has committed to, leaving children's therapeutic needs unmet.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: GriefBereavementRecommendation[] = [];
  let rank = 0;

  if (below(lossIdentificationRate, 50) && totalLosses > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently establish support plans for all identified losses — every child who has experienced bereavement or significant loss must have a formal, documented plan detailing how the home will support them through their grief.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (below(counsellingAccessRate, 50) && uniqueChildrenWithLoss > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently arrange bereavement counselling access for all children who have experienced loss — children cannot be left without professional therapeutic support during such a vulnerable period.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(interventionEffectivenessRate, 40) && totalInterventions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and redesign ineffective grief interventions — when the majority of interventions are not achieving improvement in grief scores, the therapeutic approach needs fundamental reassessment with specialist bereavement professional input.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(anniversaryManagementRate, 50) && totalAnniversaries > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately create anniversary management plans for all known trigger dates — children should never face emotionally significant anniversaries without proactive, prepared support from the home.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (severeLosses > 0 && below(severeLossSupportRate, 100)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all severe-impact losses have immediate support plans — children experiencing the most intense grief must receive priority attention with structured, specialist bereavement support.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (totalCounselling > 0 && counsellingWaitAvgDays !== null && counsellingWaitAvgDays > 42) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address excessive counselling waiting times — explore alternative providers, interim support arrangements, or fast-track pathways to ensure bereaved children access professional help without prolonged delay.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(childCopingRate, 50) && totalCopingOpportunities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review grief support with children to understand why they are not reporting positive coping outcomes — adapt provision based on children's direct feedback to ensure bereavement care genuinely meets their emotional needs.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (below(carePlanUpdateRate, 50) && totalLosses > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Update all care plans to reflect bereavement needs — without integration into wider care planning, grief support remains isolated from the child's daily care experience.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (overdueLossReviews > 0 && totalLosses > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue loss reviews — children's grief evolves over time and support plans must be kept current to remain effective and appropriate.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (overdueInterventionReviews > 0 && activeInterventions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue grief intervention reviews — without timely review, the home cannot ensure therapeutic support remains appropriate and effective for each child.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (overdueCounsellingReviews > 0 && activeCounselling > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue counselling reviews — active counselling arrangements must be regularly reviewed to confirm the therapeutic relationship and approach remain beneficial.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    meets(lossIdentificationRate, 50) &&
    below(lossIdentificationRate, 70) &&
    totalLosses > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend bereavement support planning to all identified losses — aim for comprehensive coverage to ensure every child's grief is formally acknowledged and supported.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    meets(counsellingAccessRate, 50) &&
    below(counsellingAccessRate, 70) &&
    uniqueChildrenWithLoss > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase counselling access for bereaved children to at least 70% — children who have experienced loss should be routinely offered professional therapeutic support.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    meets(interventionEffectivenessRate, 40) &&
    below(interventionEffectivenessRate, 70) &&
    totalInterventions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review grief interventions not showing improvement — consider whether different therapeutic approaches, increased session frequency, or adjusted goals would better serve each child's grief journey.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    meets(anniversaryManagementRate, 50) &&
    below(anniversaryManagementRate, 70) &&
    totalAnniversaries > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve anniversary management coverage — ensure all known significant dates have documented support plans that are shared with the team and co-created with the child.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (below(sessionCompletionRate, 70) && sessionsPlannedTotal > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve grief intervention session completion rate — when planned sessions are not delivered, children miss committed therapeutic support. Review staffing, scheduling, and barriers to consistent delivery.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(memoryWorkRate, 60) && uniqueChildrenWithLoss > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand memory work activities to more bereaved children — memory work provides children with meaningful ways to maintain connections, process grief, and build resilience around loss.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (below(professionalInvolvementRate, 50) && totalInterventions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase professional involvement in grief interventions — specialist bereavement counsellors and therapists bring expertise that improves the quality and effectiveness of therapeutic grief support.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(counsellingAttendanceRate, 70) && counsellingOfferedTotal > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address barriers to counselling attendance — explore why children are not attending offered sessions and adapt the counselling approach, timing, or setting to improve engagement.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (below(preferencesRecordedRate, 70) && totalAnniversaries > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Record children's preferences for how they wish to mark anniversaries and significant dates — child-centred planning ensures support is genuinely responsive to each child's wishes.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (below(memoryWorkDocumentationRate, 70) && totalMemoryWork > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve documentation of memory work activities — recording the purpose, engagement, and outcomes of each activity evidences the therapeutic value of memory work and supports continuity of care.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (
    totalCounselling > 0 &&
    counsellingWaitAvgDays !== null &&
    counsellingWaitAvgDays > 28 &&
    counsellingWaitAvgDays <= 42
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reduce counselling waiting times — explore additional providers or interim support options to ensure bereaved children do not wait more than 4 weeks for professional help.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: GriefBereavementInsight[] = [];

  // -- Critical insights --

  if (below(lossIdentificationRate, 50) && totalLosses > 0) {
    insights.push({
      text: `Only ${lossIdentificationRate}% of identified losses have support plans. Without structured bereavement support for each loss, the home cannot demonstrate that children's grief is being actively and individually addressed. Ofsted expects evidence of responsive, child-centred care under Reg 5, and the absence of support plans for the majority of losses represents a fundamental gap.`,
      severity: "critical",
    });
  }

  if (below(counsellingAccessRate, 50) && uniqueChildrenWithLoss > 0) {
    insights.push({
      text: `Only ${counsellingAccessRate}% of bereaved children have access to counselling. Looked-after children who experience loss without professional therapeutic support are at significantly increased risk of complicated grief, emotional dysregulation, and mental health difficulties. This gap directly undermines the home's duty under Reg 14 to promote children's health and emotional wellbeing.`,
      severity: "critical",
    });
  }

  if (below(interventionEffectivenessRate, 40) && totalInterventions > 0) {
    insights.push({
      text: `Only ${interventionEffectivenessRate}% of grief interventions showing improvement. When most therapeutic interventions are not reducing grief severity, this indicates a systemic issue — interventions may not be appropriately matched to children's grief experiences, professionally informed, or consistently delivered. A fundamental review with specialist bereavement expertise is needed.`,
      severity: "critical",
    });
  }

  if (below(anniversaryManagementRate, 50) && totalAnniversaries > 0) {
    insights.push({
      text: `Only ${anniversaryManagementRate}% of known anniversaries have management plans. Anniversary dates and grief triggers are predictable, and the failure to prepare for them means children are likely to experience avoidable emotional crises. Proactive anniversary management is a hallmark of high-quality bereavement care.`,
      severity: "critical",
    });
  }

  if (severeLosses > 0 && below(severeLossSupportRate, 50)) {
    insights.push({
      text: `${severeLosses} severe-impact losses identified but only ${severeLossSupportRate}% have support plans. Children experiencing the most intense grief reactions are not receiving structured support — this represents an immediate welfare concern requiring urgent action.`,
      severity: "critical",
    });
  }

  if (totalCounselling > 0 && counsellingWaitAvgDays !== null && counsellingWaitAvgDays > 42) {
    insights.push({
      text: `Average counselling waiting time of ${counsellingWaitAvgDays} days exceeds 6 weeks. Research demonstrates that timely access to bereavement counselling is critical during the acute grief period. Prolonged delays risk grief becoming entrenched or complicated, with lasting impacts on children's emotional development.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(lossIdentificationRate, 50) &&
    below(lossIdentificationRate, 70) &&
    totalLosses > 0
  ) {
    insights.push({
      text: `Loss support plan rate at ${lossIdentificationRate}% — improving but some children still lack formal bereavement support plans. Each child without a plan may have unaddressed grief affecting their daily wellbeing and behaviour.`,
      severity: "warning",
    });
  }

  if (
    meets(counsellingAccessRate, 50) &&
    below(counsellingAccessRate, 70) &&
    uniqueChildrenWithLoss > 0
  ) {
    insights.push({
      text: `Counselling access at ${counsellingAccessRate}% — some bereaved children remain without professional therapeutic support. Each child without access to counselling is processing complex grief without specialist help.`,
      severity: "warning",
    });
  }

  if (
    meets(interventionEffectivenessRate, 40) &&
    below(interventionEffectivenessRate, 70) &&
    totalInterventions > 0
  ) {
    insights.push({
      text: `Intervention effectiveness at ${interventionEffectivenessRate}% — some grief interventions are not achieving the expected reduction in grief severity. Consider whether the therapeutic approach, intensity, or goals need adjustment for individual children.`,
      severity: "warning",
    });
  }

  if (
    meets(anniversaryManagementRate, 50) &&
    below(anniversaryManagementRate, 70) &&
    totalAnniversaries > 0
  ) {
    insights.push({
      text: `Anniversary management at ${anniversaryManagementRate}% — some known trigger dates still lack proactive plans. Anniversaries without plans may result in children experiencing predictable distress without adequate preparation.`,
      severity: "warning",
    });
  }

  if (
    meets(childCopingRate, 50) &&
    below(childCopingRate, 70) &&
    totalCopingOpportunities > 0
  ) {
    insights.push({
      text: `Child coping rate at ${childCopingRate}% positive — a notable proportion of children do not report benefiting from grief support. Children's subjective experience is the most important measure of whether bereavement support is genuinely helping.`,
      severity: "warning",
    });
  }

  if (
    totalCounselling > 0 &&
    counsellingWaitAvgDays !== null &&
    counsellingWaitAvgDays > 28 &&
    counsellingWaitAvgDays <= 42
  ) {
    insights.push({
      text: `Average counselling waiting time of ${counsellingWaitAvgDays} days. While within a manageable range, any delay in accessing bereavement support extends the period during which children cope without professional help. Consider interim support arrangements.`,
      severity: "warning",
    });
  }

  if (overdueLossReviews > 0 && totalLosses > 0) {
    insights.push({
      text: `${overdueLossReviews} loss review${overdueLossReviews !== 1 ? "s" : ""} overdue. Children's grief changes over time — acute grief may shift to complex grief, or new triggers may emerge. Out-of-date reviews mean support may no longer match the child's current needs.`,
      severity: "warning",
    });
  }

  if (overdueInterventionReviews > 0 && activeInterventions > 0) {
    insights.push({
      text: `${overdueInterventionReviews} active grief intervention${overdueInterventionReviews !== 1 ? "s have" : " has"} overdue reviews. Without timely review, ineffective interventions may continue unchanged while children's grief needs evolve.`,
      severity: "warning",
    });
  }

  if (below(sessionCompletionRate, 70) && meets(sessionCompletionRate, 50) && sessionsPlannedTotal > 0) {
    insights.push({
      text: `Session completion at ${sessionCompletionRate}% — planned grief therapy sessions are not being consistently delivered. Gaps in therapeutic continuity may undermine the cumulative benefit of grief interventions.`,
      severity: "warning",
    });
  }

  if (above(barriersRate, 40) && totalCounselling > 0) {
    insights.push({
      text: `${barriersRate}% of counselling referrals have identified barriers to access. Systemic barriers such as transport, availability, or waitlists are preventing children from receiving bereavement support. The home should actively work to remove these barriers.`,
      severity: "warning",
    });
  }

  if (
    meets(counsellingAttendanceRate, 50) &&
    below(counsellingAttendanceRate, 70) &&
    counsellingOfferedTotal > 0
  ) {
    insights.push({
      text: `Counselling attendance at ${counsellingAttendanceRate}% — not all offered sessions are being attended. Low attendance may indicate mismatched provision, scheduling issues, or unaddressed reluctance that needs sensitive exploration with the child.`,
      severity: "warning",
    });
  }

  // Analysis of loss types
  const lossTypeCounts: Record<string, number> = {};
  for (const loss of loss_identification_records) {
    lossTypeCounts[loss.loss_type] = (lossTypeCounts[loss.loss_type] ?? 0) + 1;
  }
  const topLossTypes = Object.entries(lossTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topLossTypes.length > 0 && totalLosses >= 3) {
    const typeStr = topLossTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Loss profile across children: ${typeStr}. Understanding the pattern of loss types helps the home tailor bereavement training and ensure staff are equipped to support the specific grief experiences present.`,
      severity: "warning",
    });
  }

  // Analysis of intervention types
  const interventionTypeCounts: Record<string, number> = {};
  for (const iv of grief_intervention_records.filter((i) => i.active)) {
    interventionTypeCounts[iv.intervention_type] = (interventionTypeCounts[iv.intervention_type] ?? 0) + 1;
  }
  const topInterventionTypes = Object.entries(interventionTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topInterventionTypes.length > 0 && activeInterventions >= 3) {
    const ivStr = topInterventionTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Active grief intervention types: ${ivStr}. A diverse therapeutic portfolio suggests the home tailors its grief support approach to individual children rather than applying a one-size-fits-all model.`,
      severity: "warning",
    });
  }

  // Analysis of memory work types
  const memoryWorkTypeCounts: Record<string, number> = {};
  for (const mw of memory_work_records) {
    memoryWorkTypeCounts[mw.activity_type] = (memoryWorkTypeCounts[mw.activity_type] ?? 0) + 1;
  }
  const topMemoryWorkTypes = Object.entries(memoryWorkTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topMemoryWorkTypes.length > 0 && totalMemoryWork >= 3) {
    const mwStr = topMemoryWorkTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Memory work activity types: ${mwStr}. A range of memory work approaches gives children multiple ways to engage with their grief, accommodating different developmental stages and emotional readiness.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (grief_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding grief and bereavement support — children's losses are comprehensively identified, therapeutic support is accessible and effective, memory work is meaningful, and anniversary dates are proactively managed. This is strong evidence of compassionate, child-centred care under Reg 5 and Reg 14.",
      severity: "positive",
    });
  }

  if (
    meets(lossIdentificationRate, 90) &&
    meets(carePlanUpdateRate, 90) &&
    totalLosses > 0
  ) {
    insights.push({
      text: `${lossIdentificationRate}% of losses have support plans and ${carePlanUpdateRate}% of care plans updated — the home excels at formally recognising each child's grief and integrating bereavement needs into holistic care planning.`,
      severity: "positive",
    });
  }

  if (
    meets(counsellingAccessRate, 90) &&
    meets(counsellingHelpfulRate, 80) &&
    uniqueChildrenWithLoss > 0 &&
    totalCounselling > 0
  ) {
    insights.push({
      text: `${counsellingAccessRate}% counselling access with ${counsellingHelpfulRate}% of children finding it helpful — bereaved children have excellent access to professional support that they report genuinely benefits them.`,
      severity: "positive",
    });
  }

  if (
    meets(interventionEffectivenessRate, 90) &&
    meets(childReportedImprovementRate, 80) &&
    totalInterventions > 0
  ) {
    insights.push({
      text: `${interventionEffectivenessRate}% of grief interventions showing improvement with ${childReportedImprovementRate}% of children reporting benefit — both objective grief scores and children's own experience confirm that therapeutic interventions are effectively supporting grief recovery.`,
      severity: "positive",
    });
  }

  if (
    meets(anniversaryManagementRate, 90) &&
    meets(proactiveSupportRate, 90) &&
    totalAnniversaries > 0
  ) {
    insights.push({
      text: `${anniversaryManagementRate}% anniversary management with ${proactiveSupportRate}% proactive support — the home exemplifies anticipatory bereavement care, preparing children and staff for emotionally significant dates rather than reacting to crisis.`,
      severity: "positive",
    });
  }

  if (
    meets(memoryWorkMeaningfulRate, 90) &&
    meets(memoryWorkBenefitRate, 80) &&
    totalMemoryWork > 0
  ) {
    insights.push({
      text: `${memoryWorkMeaningfulRate}% of memory work found meaningful by children and ${memoryWorkBenefitRate}% showing observed benefit — memory work activities are genuinely resonant and therapeutically valuable for children processing grief.`,
      severity: "positive",
    });
  }

  if (
    meets(childCopingRate, 90) &&
    totalCopingOpportunities > 0
  ) {
    insights.push({
      text: `${childCopingRate}% positive coping outcomes — children overwhelmingly report that the home's grief and bereavement provision is helping them cope with their loss. This child-centred evidence is powerful for Ofsted.`,
      severity: "positive",
    });
  }

  if (
    meets(staffReportedImprovementRate, 80) &&
    meets(childReportedImprovementRate, 80) &&
    totalInterventions > 0
  ) {
    insights.push({
      text: `Both staff (${staffReportedImprovementRate}%) and children (${childReportedImprovementRate}%) report improvement — the convergence of staff observation and child self-report provides compelling evidence that grief interventions are genuinely transformative.`,
      severity: "positive",
    });
  }

  if (
    meets(copingStrategyUptakeRate, 80) &&
    totalCopingTaught > 0
  ) {
    insights.push({
      text: `${copingStrategyUptakeRate}% of taught coping strategies actively used by children — children are internalising grief management tools and applying them independently, building long-term emotional resilience.`,
      severity: "positive",
    });
  }

  if (
    totalCounselling > 0 &&
    counsellingWaitAvgDays !== null &&
    counsellingWaitAvgDays <= 14 &&
    meets(counsellingAttendanceRate, 90)
  ) {
    insights.push({
      text: `Average wait of ${counsellingWaitAvgDays} days with ${counsellingAttendanceRate}% attendance — children access bereavement counselling swiftly and engage consistently, creating optimal conditions for therapeutic benefit.`,
      severity: "positive",
    });
  }

  if (
    meets(dayManagedWellRate, 90) &&
    meets(anniversaryFeedbackRate, 80) &&
    occurredAnniversaries.length > 0
  ) {
    insights.push({
      text: `${dayManagedWellRate}% of anniversaries managed well with ${anniversaryFeedbackRate}% positive child feedback — when trigger dates arrive, the home's preparation translates into genuine emotional support that children recognise and value.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (grief_rating === "outstanding") {
    headline =
      "Outstanding grief and bereavement support — children's losses are identified, therapeutic support is effective, and anniversary dates are proactively managed.";
  } else if (grief_rating === "good") {
    headline = `Good grief and bereavement support — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (grief_rating === "adequate") {
    headline = `Adequate grief and bereavement support — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's grief and loss needs are fully met.`;
  } else {
    headline = `Grief and bereavement support is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children receive appropriate bereavement care.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    grief_rating,
    grief_score: score,
    headline,
    total_losses_identified: totalLosses,
    loss_identification_rate: lossIdentificationRate,
    counselling_access_rate: counsellingAccessRate,
    memory_work_rate: memoryWorkRate,
    intervention_effectiveness_rate: interventionEffectivenessRate,
    anniversary_management_rate: anniversaryManagementRate,
    child_coping_rate: childCopingRate,
    counselling_wait_avg_days: counsellingWaitAvgDays,
    intervention_progress_avg: interventionProgressAvg,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
