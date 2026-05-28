// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SENSORY & ACCESSIBILITY SUPPORT INTELLIGENCE ENGINE
// Monitors how well the home identifies, assesses, and responds to children's
// sensory needs, ensures accessibility adaptations are in place and effective,
// tracks sensory room usage and equipment maintenance, and evaluates the
// effectiveness of sensory interventions.
// Measures sensory profile coverage, accessibility adaptation rates, sensory
// room utilisation, equipment maintenance, intervention effectiveness, and
// child feedback on sensory support.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 6 (Quality and purpose of care), Reg 10 (Health & wellbeing).
// SCCIF: "Children receive care that is focused on their individual needs."
// Store keys: sensoryProfileRecords, accessibilityAdaptationRecords,
//             sensoryRoomRecords, sensoryEquipmentRecords,
//             sensoryInterventionRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SensoryProfileInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessor_name: string;
  profile_type: "full" | "brief" | "screening" | "specialist";
  sensory_needs_identified: number;
  adaptations_recommended: number;
  adaptations_implemented: number;
  review_date: string | null;
  review_overdue: boolean;
  child_involved_in_assessment: boolean;
  parent_carer_consulted: boolean;
  professional_input: boolean;
  created_at: string;
}

export interface AccessibilityAdaptationInput {
  id: string;
  child_id: string;
  adaptation_type: "environmental" | "equipment" | "communication" | "routine" | "dietary" | "sensory";
  description: string;
  date_requested: string;
  date_implemented: string | null;
  implemented: boolean;
  effectiveness_rating: number; // 1-5
  child_feedback_positive: boolean;
  review_date: string | null;
  review_overdue: boolean;
  cost_approved: boolean;
  created_at: string;
}

export interface SensoryRoomInput {
  id: string;
  child_id: string;
  session_date: string;
  duration_minutes: number;
  purpose: "regulation" | "therapy" | "recreation" | "crisis_support" | "scheduled";
  staff_present: boolean;
  child_engagement_rating: number; // 1-5
  outcome_rating: number; // 1-5
  child_requested: boolean;
  goals_met: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface SensoryEquipmentInput {
  id: string;
  equipment_name: string;
  equipment_type: "weighted" | "fidget" | "lighting" | "sound" | "tactile" | "proprioceptive" | "vestibular" | "other";
  date_acquired: string;
  last_maintenance_date: string | null;
  maintenance_due_date: string | null;
  maintenance_overdue: boolean;
  condition: "excellent" | "good" | "fair" | "poor" | "replaced";
  in_use: boolean;
  safety_checked: boolean;
  assigned_child_id: string | null;
  created_at: string;
}

export interface SensoryInterventionInput {
  id: string;
  child_id: string;
  intervention_type: "sensory_diet" | "therapeutic" | "environmental_modification" | "communication_support" | "routine_adaptation" | "specialist_referral";
  start_date: string;
  end_date: string | null;
  active: boolean;
  sessions_planned: number;
  sessions_completed: number;
  baseline_score: number; // 1-10
  current_score: number; // 1-10
  target_score: number; // 1-10
  child_reported_improvement: boolean;
  staff_reported_improvement: boolean;
  professional_involved: boolean;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface SensoryAccessibilitySupportInput {
  today: string;
  total_children: number;
  sensory_profile_records: SensoryProfileInput[];
  accessibility_adaptation_records: AccessibilityAdaptationInput[];
  sensory_room_records: SensoryRoomInput[];
  sensory_equipment_records: SensoryEquipmentInput[];
  sensory_intervention_records: SensoryInterventionInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SensoryAccessibilityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SensoryAccessibilityInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SensoryAccessibilityRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface SensoryAccessibilitySupportResult {
  sensory_rating: SensoryAccessibilityRating;
  sensory_score: number;
  headline: string;
  total_profiles: number;
  sensory_profile_coverage_rate: number;
  accessibility_adaptation_rate: number;
  sensory_room_utilisation_rate: number;
  equipment_maintenance_rate: number;
  intervention_effectiveness_rate: number;
  child_feedback_rate: number;
  adaptation_effectiveness_avg: number;
  intervention_progress_avg: number;
  strengths: string[];
  concerns: string[];
  recommendations: SensoryAccessibilityRecommendation[];
  insights: SensoryAccessibilityInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): SensoryAccessibilityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: SensoryAccessibilityRating,
  score: number,
  headline: string,
): SensoryAccessibilitySupportResult {
  return {
    sensory_rating: rating,
    sensory_score: score,
    headline,
    total_profiles: 0,
    sensory_profile_coverage_rate: 0,
    accessibility_adaptation_rate: 0,
    sensory_room_utilisation_rate: 0,
    equipment_maintenance_rate: 0,
    intervention_effectiveness_rate: 0,
    child_feedback_rate: 0,
    adaptation_effectiveness_avg: 0,
    intervention_progress_avg: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeSensoryAccessibilitySupport(
  input: SensoryAccessibilitySupportInput,
): SensoryAccessibilitySupportResult {
  const {
    total_children,
    sensory_profile_records,
    accessibility_adaptation_records,
    sensory_room_records,
    sensory_equipment_records,
    sensory_intervention_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    sensory_profile_records.length === 0 &&
    accessibility_adaptation_records.length === 0 &&
    sensory_room_records.length === 0 &&
    sensory_equipment_records.length === 0 &&
    sensory_intervention_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess sensory and accessibility support.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No sensory or accessibility data recorded despite children on placement — sensory assessment and accessibility support require urgent attention.",
      ),
      concerns: [
        "No sensory profiles, accessibility adaptations, sensory room records, equipment records, or intervention records exist despite children being on placement — the home cannot evidence individualised sensory and accessibility support.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured sensory profile assessments for all children to identify individual sensory needs and ensure care is tailored to each child's requirements.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
        },
        {
          rank: 2,
          recommendation:
            "Establish an accessibility adaptation tracking system to ensure that where sensory or accessibility needs are identified, appropriate adaptations are implemented, monitored, and reviewed.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 10 — Health and wellbeing",
        },
      ],
      insights: [
        {
          text: "The complete absence of sensory and accessibility records means the home cannot demonstrate that children's individual sensory needs are identified, assessed, or supported. Ofsted expects care to be tailored to each child's needs, and the absence of sensory assessments represents a fundamental gap in individualised care planning.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Sensory profile coverage ---
  const uniqueChildrenWithProfiles = new Set(
    sensory_profile_records.map((p) => p.child_id),
  ).size;
  const sensoryProfileCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithProfiles, total_children) : 0;

  const totalProfiles = sensory_profile_records.length;

  // --- Profile quality metrics ---
  const profilesWithChildInvolvement = sensory_profile_records.filter(
    (p) => p.child_involved_in_assessment,
  ).length;
  const childInvolvementRate = pct(profilesWithChildInvolvement, totalProfiles);

  const profilesWithProfessionalInput = sensory_profile_records.filter(
    (p) => p.professional_input,
  ).length;
  const professionalInputRate = pct(profilesWithProfessionalInput, totalProfiles);

  const overdueProfileReviews = sensory_profile_records.filter(
    (p) => p.review_overdue,
  ).length;
  const profileReviewComplianceRate = totalProfiles > 0
    ? pct(totalProfiles - overdueProfileReviews, totalProfiles)
    : 0;

  // --- Accessibility adaptations ---
  const totalAdaptations = accessibility_adaptation_records.length;
  const implementedAdaptations = accessibility_adaptation_records.filter(
    (a) => a.implemented,
  ).length;
  const accessibilityAdaptationRate = pct(implementedAdaptations, totalAdaptations);

  const adaptationEffectivenessSum = accessibility_adaptation_records
    .filter((a) => a.implemented)
    .reduce((sum, a) => sum + a.effectiveness_rating, 0);
  const adaptationEffectivenessAvg =
    implementedAdaptations > 0
      ? Math.round((adaptationEffectivenessSum / implementedAdaptations) * 100) / 100
      : 0;

  const adaptationChildFeedbackPositive = accessibility_adaptation_records.filter(
    (a) => a.implemented && a.child_feedback_positive,
  ).length;
  const adaptationFeedbackRate = pct(adaptationChildFeedbackPositive, implementedAdaptations);

  const overdueAdaptationReviews = accessibility_adaptation_records.filter(
    (a) => a.review_overdue,
  ).length;

  // --- Sensory room utilisation ---
  const totalSessions = sensory_room_records.length;
  const uniqueChildrenUsingSensoryRoom = new Set(
    sensory_room_records.map((s) => s.child_id),
  ).size;
  const sensoryRoomUtilisationRate =
    total_children > 0 ? pct(uniqueChildrenUsingSensoryRoom, total_children) : 0;

  const sessionsWithGoalsMet = sensory_room_records.filter(
    (s) => s.goals_met,
  ).length;
  const goalsMetRate = pct(sessionsWithGoalsMet, totalSessions);

  const sessionsWithNotes = sensory_room_records.filter(
    (s) => s.notes_recorded,
  ).length;
  const sessionDocumentationRate = pct(sessionsWithNotes, totalSessions);

  const childRequestedSessions = sensory_room_records.filter(
    (s) => s.child_requested,
  ).length;
  const childInitiatedRate = pct(childRequestedSessions, totalSessions);

  const sessionEngagementSum = sensory_room_records.reduce(
    (sum, s) => sum + s.child_engagement_rating,
    0,
  );
  const sessionEngagementAvg =
    totalSessions > 0
      ? Math.round((sessionEngagementSum / totalSessions) * 100) / 100
      : 0;

  const sessionOutcomeSum = sensory_room_records.reduce(
    (sum, s) => sum + s.outcome_rating,
    0,
  );
  const sessionOutcomeAvg =
    totalSessions > 0
      ? Math.round((sessionOutcomeSum / totalSessions) * 100) / 100
      : 0;

  // --- Equipment maintenance ---
  const totalEquipment = sensory_equipment_records.length;
  const activeEquipment = sensory_equipment_records.filter(
    (e) => e.in_use,
  ).length;
  const overdueMaintenanceEquipment = sensory_equipment_records.filter(
    (e) => e.maintenance_overdue && e.in_use,
  ).length;
  const equipmentMaintenanceRate =
    activeEquipment > 0
      ? pct(activeEquipment - overdueMaintenanceEquipment, activeEquipment)
      : 0;

  const safetyCheckedEquipment = sensory_equipment_records.filter(
    (e) => e.safety_checked && e.in_use,
  ).length;
  const safetyCheckRate = pct(safetyCheckedEquipment, activeEquipment);

  const poorConditionEquipment = sensory_equipment_records.filter(
    (e) => e.condition === "poor" && e.in_use,
  ).length;

  // --- Intervention effectiveness ---
  const totalInterventions = sensory_intervention_records.length;
  const activeInterventions = sensory_intervention_records.filter(
    (i) => i.active,
  ).length;

  const interventionsShowingImprovement = sensory_intervention_records.filter(
    (i) => i.current_score > i.baseline_score,
  ).length;
  const interventionEffectivenessRate = pct(
    interventionsShowingImprovement,
    totalInterventions,
  );

  const interventionProgressValues = sensory_intervention_records
    .filter((i) => i.target_score > i.baseline_score)
    .map((i) => {
      const range = i.target_score - i.baseline_score;
      const progress = i.current_score - i.baseline_score;
      return clamp(Math.round((progress / range) * 100), 0, 100);
    });
  const interventionProgressAvg =
    interventionProgressValues.length > 0
      ? Math.round(
          interventionProgressValues.reduce((sum, v) => sum + v, 0) /
            interventionProgressValues.length,
        )
      : 0;

  const childReportedImprovement = sensory_intervention_records.filter(
    (i) => i.child_reported_improvement,
  ).length;
  const childReportedImprovementRate = pct(childReportedImprovement, totalInterventions);

  const staffReportedImprovement = sensory_intervention_records.filter(
    (i) => i.staff_reported_improvement,
  ).length;
  const staffReportedImprovementRate = pct(staffReportedImprovement, totalInterventions);

  const sessionsCompletedTotal = sensory_intervention_records.reduce(
    (sum, i) => sum + i.sessions_completed,
    0,
  );
  const sessionsPlannedTotal = sensory_intervention_records.reduce(
    (sum, i) => sum + i.sessions_planned,
    0,
  );
  const sessionCompletionRate = pct(sessionsCompletedTotal, sessionsPlannedTotal);

  const overdueInterventionReviews = sensory_intervention_records.filter(
    (i) => i.review_overdue && i.active,
  ).length;

  const professionalInvolved = sensory_intervention_records.filter(
    (i) => i.professional_involved,
  ).length;
  const professionalInvolvementRate = pct(professionalInvolved, totalInterventions);

  // --- Child feedback rate (composite across adaptations and interventions) ---
  const totalFeedbackOpportunities = implementedAdaptations + totalInterventions;
  const totalPositiveFeedback = adaptationChildFeedbackPositive + childReportedImprovement;
  const childFeedbackRate = pct(totalPositiveFeedback, totalFeedbackOpportunities);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: sensoryProfileCoverageRate (>=100: +4, >=80: +2) ---
  if (sensoryProfileCoverageRate >= 100) score += 4;
  else if (sensoryProfileCoverageRate >= 80) score += 2;

  // --- Bonus 2: accessibilityAdaptationRate (>=100: +4, >=80: +2) ---
  if (accessibilityAdaptationRate >= 100) score += 4;
  else if (accessibilityAdaptationRate >= 80) score += 2;

  // --- Bonus 3: sensoryRoomUtilisationRate (>=80: +3, >=60: +1) ---
  if (sensoryRoomUtilisationRate >= 80) score += 3;
  else if (sensoryRoomUtilisationRate >= 60) score += 1;

  // --- Bonus 4: equipmentMaintenanceRate (>=100: +3, >=80: +1) ---
  if (equipmentMaintenanceRate >= 100) score += 3;
  else if (equipmentMaintenanceRate >= 80) score += 1;

  // --- Bonus 5: interventionEffectivenessRate (>=90: +4, >=70: +2) ---
  if (interventionEffectivenessRate >= 90) score += 4;
  else if (interventionEffectivenessRate >= 70) score += 2;

  // --- Bonus 6: childFeedbackRate (>=90: +3, >=70: +1) ---
  if (childFeedbackRate >= 90) score += 3;
  else if (childFeedbackRate >= 70) score += 1;

  // --- Bonus 7: adaptationEffectivenessAvg (>=4.0: +3, >=3.0: +1) ---
  if (adaptationEffectivenessAvg >= 4.0) score += 3;
  else if (adaptationEffectivenessAvg >= 3.0) score += 1;

  // --- Bonus 8: profileReviewComplianceRate (>=100: +2, >=80: +1) ---
  if (profileReviewComplianceRate >= 100) score += 2;
  else if (profileReviewComplianceRate >= 80) score += 1;

  // --- Bonus 9: sessionCompletionRate (>=90: +2, >=70: +1) ---
  if (sessionCompletionRate >= 90) score += 2;
  else if (sessionCompletionRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // sensoryProfileCoverageRate < 50 → -5
  if (sensoryProfileCoverageRate < 50 && total_children > 0) score -= 5;

  // accessibilityAdaptationRate < 50 → -5
  if (accessibilityAdaptationRate < 50 && totalAdaptations > 0) score -= 5;

  // equipmentMaintenanceRate < 50 → -4
  if (equipmentMaintenanceRate < 50 && activeEquipment > 0) score -= 4;

  // interventionEffectivenessRate < 40 → -4
  if (interventionEffectivenessRate < 40 && totalInterventions > 0) score -= 4;

  score = clamp(score, 0, 100);

  const sensory_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (sensoryProfileCoverageRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has a sensory profile assessment — the home demonstrates comprehensive identification of individual sensory needs.",
    );
  } else if (sensoryProfileCoverageRate >= 80 && total_children > 0) {
    strengths.push(
      `${sensoryProfileCoverageRate}% of children have sensory profiles — strong coverage in identifying children's individual sensory needs.`,
    );
  }

  if (accessibilityAdaptationRate >= 100 && totalAdaptations > 0) {
    strengths.push(
      "Every requested accessibility adaptation has been implemented — the home responds comprehensively to identified sensory and accessibility needs.",
    );
  } else if (accessibilityAdaptationRate >= 80 && totalAdaptations > 0) {
    strengths.push(
      `${accessibilityAdaptationRate}% of accessibility adaptations implemented — the home delivers the majority of requested adaptations.`,
    );
  }

  if (sensoryRoomUtilisationRate >= 80 && total_children > 0) {
    strengths.push(
      `${sensoryRoomUtilisationRate}% of children are using the sensory room — strong utilisation indicates children find the sensory environment beneficial.`,
    );
  } else if (sensoryRoomUtilisationRate >= 60 && total_children > 0) {
    strengths.push(
      `${sensoryRoomUtilisationRate}% sensory room utilisation — good levels of access to sensory spaces for children.`,
    );
  }

  if (equipmentMaintenanceRate >= 100 && activeEquipment > 0) {
    strengths.push(
      "All active sensory equipment is maintained and up to date — the home ensures safe, reliable access to sensory resources.",
    );
  } else if (equipmentMaintenanceRate >= 80 && activeEquipment > 0) {
    strengths.push(
      `${equipmentMaintenanceRate}% equipment maintenance compliance — the home generally maintains sensory equipment to a good standard.`,
    );
  }

  if (interventionEffectivenessRate >= 90 && totalInterventions > 0) {
    strengths.push(
      `${interventionEffectivenessRate}% of sensory interventions showing improvement — interventions are highly effective in supporting children's sensory needs.`,
    );
  } else if (interventionEffectivenessRate >= 70 && totalInterventions > 0) {
    strengths.push(
      `${interventionEffectivenessRate}% of interventions showing improvement — the majority of sensory interventions are achieving positive outcomes.`,
    );
  }

  if (childFeedbackRate >= 90 && totalFeedbackOpportunities > 0) {
    strengths.push(
      `${childFeedbackRate}% positive child feedback on sensory support — children report that adaptations and interventions are genuinely helping them.`,
    );
  } else if (childFeedbackRate >= 70 && totalFeedbackOpportunities > 0) {
    strengths.push(
      `${childFeedbackRate}% positive child feedback — most children report benefit from their sensory support arrangements.`,
    );
  }

  if (adaptationEffectivenessAvg >= 4.0 && implementedAdaptations > 0) {
    strengths.push(
      `Adaptation effectiveness averages ${adaptationEffectivenessAvg}/5 — high-quality adaptations that are making a real difference to children's daily experiences.`,
    );
  } else if (adaptationEffectivenessAvg >= 3.0 && implementedAdaptations > 0) {
    strengths.push(
      `Adaptation effectiveness averages ${adaptationEffectivenessAvg}/5 — competent delivery of accessibility adaptations.`,
    );
  }

  if (childInvolvementRate >= 90 && totalProfiles > 0) {
    strengths.push(
      "Children are involved in the vast majority of their sensory assessments — assessments are genuinely child-centred and participatory.",
    );
  } else if (childInvolvementRate >= 70 && totalProfiles > 0) {
    strengths.push(
      `${childInvolvementRate}% child involvement in sensory assessments — good practice in including children in understanding their own sensory needs.`,
    );
  }

  if (profileReviewComplianceRate >= 100 && totalProfiles > 0) {
    strengths.push(
      "All sensory profile reviews are up to date — the home ensures assessments remain current and reflective of children's evolving needs.",
    );
  } else if (profileReviewComplianceRate >= 80 && totalProfiles > 0) {
    strengths.push(
      `${profileReviewComplianceRate}% of sensory profile reviews on schedule — strong compliance with review timescales.`,
    );
  }

  if (sessionCompletionRate >= 90 && sessionsPlannedTotal > 0) {
    strengths.push(
      `${sessionCompletionRate}% of planned intervention sessions completed — the home delivers sensory interventions reliably and consistently.`,
    );
  } else if (sessionCompletionRate >= 70 && sessionsPlannedTotal > 0) {
    strengths.push(
      `${sessionCompletionRate}% intervention session completion — the home generally follows through on planned sensory support.`,
    );
  }

  if (safetyCheckRate >= 100 && activeEquipment > 0) {
    strengths.push(
      "All active sensory equipment has been safety-checked — the home prioritises children's safety when using sensory resources.",
    );
  }

  if (professionalInvolvementRate >= 80 && totalInterventions > 0) {
    strengths.push(
      `${professionalInvolvementRate}% of interventions involve professional input — the home draws on specialist expertise to support children's sensory needs.`,
    );
  }

  if (childInitiatedRate >= 50 && totalSessions > 0) {
    strengths.push(
      `${childInitiatedRate}% of sensory room sessions are child-initiated — children feel empowered to request sensory support when they need it.`,
    );
  }

  if (sessionDocumentationRate >= 90 && totalSessions > 0) {
    strengths.push(
      `${sessionDocumentationRate}% of sensory room sessions have documented notes — strong recording practice supporting evidence of sensory provision.`,
    );
  }

  if (goalsMetRate >= 80 && totalSessions > 0) {
    strengths.push(
      `${goalsMetRate}% of sensory room sessions meet their goals — sessions are purposeful and achieving intended outcomes.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (sensoryProfileCoverageRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${sensoryProfileCoverageRate}% of children have sensory profiles — the majority of children's sensory needs have not been formally assessed, preventing the home from delivering tailored support.`,
    );
  } else if (sensoryProfileCoverageRate < 80 && sensoryProfileCoverageRate >= 50 && total_children > 0) {
    concerns.push(
      `Sensory profile coverage at ${sensoryProfileCoverageRate}% — some children's sensory needs remain unassessed, which may result in unmet needs and inappropriate care responses.`,
    );
  }

  if (accessibilityAdaptationRate < 50 && totalAdaptations > 0) {
    concerns.push(
      `Only ${accessibilityAdaptationRate}% of requested accessibility adaptations have been implemented — the majority of identified needs are not being met, leaving children without necessary support.`,
    );
  } else if (accessibilityAdaptationRate < 80 && accessibilityAdaptationRate >= 50 && totalAdaptations > 0) {
    concerns.push(
      `Accessibility adaptation rate at ${accessibilityAdaptationRate}% — not all identified adaptations are in place, which may leave some children's needs unmet.`,
    );
  }

  if (sensoryRoomUtilisationRate < 40 && total_children > 0 && totalSessions > 0) {
    concerns.push(
      `Sensory room utilisation at only ${sensoryRoomUtilisationRate}% — the sensory room is available but most children are not accessing it, potentially indicating barriers to use or lack of awareness.`,
    );
  }

  if (equipmentMaintenanceRate < 50 && activeEquipment > 0) {
    concerns.push(
      `Only ${equipmentMaintenanceRate}% of active sensory equipment has current maintenance — overdue maintenance poses safety risks and may render equipment ineffective.`,
    );
  } else if (equipmentMaintenanceRate < 80 && equipmentMaintenanceRate >= 50 && activeEquipment > 0) {
    concerns.push(
      `Equipment maintenance rate at ${equipmentMaintenanceRate}% — some sensory equipment has overdue maintenance, which may affect safety and effectiveness.`,
    );
  }

  if (interventionEffectivenessRate < 40 && totalInterventions > 0) {
    concerns.push(
      `Only ${interventionEffectivenessRate}% of sensory interventions showing improvement — the majority of interventions are not achieving their intended outcomes, suggesting a need for fundamental review of approach.`,
    );
  } else if (interventionEffectivenessRate < 70 && interventionEffectivenessRate >= 40 && totalInterventions > 0) {
    concerns.push(
      `Intervention effectiveness at ${interventionEffectivenessRate}% — not all sensory interventions are achieving positive outcomes. Review is needed to ensure interventions are appropriately matched to individual needs.`,
    );
  }

  if (childFeedbackRate < 50 && totalFeedbackOpportunities > 0) {
    concerns.push(
      `Only ${childFeedbackRate}% positive child feedback on sensory support — most children are not reporting benefit from their adaptations and interventions, raising questions about whether support is truly meeting their needs.`,
    );
  } else if (childFeedbackRate < 70 && childFeedbackRate >= 50 && totalFeedbackOpportunities > 0) {
    concerns.push(
      `Child feedback rate at ${childFeedbackRate}% — a significant proportion of children do not report positive outcomes from their sensory support.`,
    );
  }

  if (overdueProfileReviews > 0 && totalProfiles > 0) {
    concerns.push(
      `${overdueProfileReviews} sensory profile review${overdueProfileReviews !== 1 ? "s are" : " is"} overdue — without timely reviews, profiles may not reflect children's current sensory needs.`,
    );
  }

  if (overdueAdaptationReviews > 0 && totalAdaptations > 0) {
    concerns.push(
      `${overdueAdaptationReviews} adaptation review${overdueAdaptationReviews !== 1 ? "s are" : " is"} overdue — adaptations must be reviewed regularly to confirm they remain effective and appropriate.`,
    );
  }

  if (overdueInterventionReviews > 0 && activeInterventions > 0) {
    concerns.push(
      `${overdueInterventionReviews} active intervention review${overdueInterventionReviews !== 1 ? "s are" : " is"} overdue — interventions without timely review may continue ineffectively or miss opportunities to adjust approach.`,
    );
  }

  if (poorConditionEquipment > 0) {
    concerns.push(
      `${poorConditionEquipment} piece${poorConditionEquipment !== 1 ? "s" : ""} of sensory equipment in poor condition while still in use — equipment in poor condition may be unsafe or ineffective and should be replaced or repaired.`,
    );
  }

  if (safetyCheckRate < 80 && activeEquipment > 0) {
    concerns.push(
      `Only ${safetyCheckRate}% of active sensory equipment has been safety-checked — equipment used by children must have documented safety checks to prevent harm.`,
    );
  }

  if (childInvolvementRate < 50 && totalProfiles > 0) {
    concerns.push(
      `Children involved in only ${childInvolvementRate}% of sensory assessments — assessments conducted without the child's meaningful participation may not accurately reflect their sensory experience.`,
    );
  }

  if (sessionCompletionRate < 50 && sessionsPlannedTotal > 0) {
    concerns.push(
      `Only ${sessionCompletionRate}% of planned intervention sessions completed — the home is not delivering the sensory support it has committed to, potentially leaving children's needs unmet.`,
    );
  }

  if (sessionDocumentationRate < 70 && totalSessions > 0) {
    concerns.push(
      `Sensory room session documentation at only ${sessionDocumentationRate}% — poor recording makes it difficult to evidence the purpose and outcomes of sensory room use.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: SensoryAccessibilityRecommendation[] = [];
  let rank = 0;

  if (sensoryProfileCoverageRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently complete sensory profile assessments for all children — every child's sensory needs must be formally assessed to enable individualised care planning and evidence compliance with the duty to meet each child's needs.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (accessibilityAdaptationRate < 50 && totalAdaptations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently implement all outstanding accessibility adaptations — where needs have been identified but adaptations not delivered, children are living without support they have been assessed as requiring.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 10 — Health and wellbeing",
    });
  }

  if (equipmentMaintenanceRate < 50 && activeEquipment > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately address overdue maintenance on sensory equipment — equipment that is not maintained may be unsafe for children. Implement a preventive maintenance schedule with documented checks.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (interventionEffectivenessRate < 40 && totalInterventions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and redesign ineffective sensory interventions — when the majority of interventions are not achieving improvement, the approach needs fundamental reassessment with specialist professional input.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (safetyCheckRate < 80 && activeEquipment > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete safety checks on all active sensory equipment — children must not use equipment without documented safety verification. Implement a safety check register with regular review cycles.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (poorConditionEquipment > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Replace or repair sensory equipment in poor condition — continuing to use equipment in poor condition poses risk to children and undermines the quality of sensory provision.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (childFeedbackRate < 50 && totalFeedbackOpportunities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review sensory support with children to understand why they are not reporting positive outcomes — adapt provision based on children's direct feedback to ensure it genuinely meets their needs.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Children receive care focused on individual needs",
    });
  }

  if (overdueProfileReviews > 0 && totalProfiles > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue sensory profile reviews — children's sensory needs evolve and profiles must be kept current to ensure care remains appropriate.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (overdueInterventionReviews > 0 && activeInterventions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue intervention reviews — without timely review, the home cannot ensure interventions remain appropriate and effective for each child.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (
    sensoryProfileCoverageRate >= 50 &&
    sensoryProfileCoverageRate < 80 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend sensory profile coverage to all children — aim for 100% coverage to ensure every child's sensory needs are formally identified and care can be tailored accordingly.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (
    accessibilityAdaptationRate >= 50 &&
    accessibilityAdaptationRate < 80 &&
    totalAdaptations > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase accessibility adaptation implementation rate to at least 80% — unimplemented adaptations represent unmet needs that the home has already identified.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 10 — Health and wellbeing",
    });
  }

  if (
    interventionEffectivenessRate >= 40 &&
    interventionEffectivenessRate < 70 &&
    totalInterventions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review sensory interventions that are not showing improvement — consider whether different approaches, increased professional input, or adjusted goals would better serve each child's needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (sessionCompletionRate < 70 && sessionsPlannedTotal > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve intervention session completion rate — when planned sessions are not delivered, children miss out on committed support. Review staffing, scheduling, and barriers to consistent delivery.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (childInvolvementRate < 70 && totalProfiles > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child involvement in sensory assessments — children must be active participants in understanding and describing their own sensory experiences to ensure assessments are accurate and meaningful.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (sessionDocumentationRate < 70 && totalSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve sensory room session documentation — each session should have recorded notes detailing purpose, engagement, and outcomes to evidence the therapeutic value of sensory provision.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (
    equipmentMaintenanceRate >= 50 &&
    equipmentMaintenanceRate < 80 &&
    activeEquipment > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve equipment maintenance compliance — implement a preventive maintenance calendar with automated reminders to ensure all sensory equipment remains in good working order.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (
    childFeedbackRate >= 50 &&
    childFeedbackRate < 70 &&
    totalFeedbackOpportunities > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Explore ways to improve the positive impact of sensory support as reported by children — regularly seek children's views on what is and is not working and adapt provision accordingly.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Children receive care focused on individual needs",
    });
  }

  if (professionalInvolvementRate < 50 && totalInterventions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase professional involvement in sensory interventions — specialist occupational therapy or sensory integration expertise will improve the quality and effectiveness of interventions.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 10 — Health and wellbeing",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: SensoryAccessibilityInsight[] = [];

  // -- Critical insights --

  if (sensoryProfileCoverageRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${sensoryProfileCoverageRate}% of children have sensory profiles. Without formal assessment of each child's sensory needs, the home cannot demonstrate that care is tailored to individual requirements. Ofsted expects evidence that the home understands and responds to each child's sensory profile as part of meeting Reg 6.`,
      severity: "critical",
    });
  }

  if (accessibilityAdaptationRate < 50 && totalAdaptations > 0) {
    insights.push({
      text: `Only ${accessibilityAdaptationRate}% of requested adaptations implemented. Where the home has identified a child needs accessibility support but has not provided it, this represents a failure to meet known needs. This directly undermines the home's ability to evidence individualised care under Reg 10.`,
      severity: "critical",
    });
  }

  if (equipmentMaintenanceRate < 50 && activeEquipment > 0) {
    insights.push({
      text: `Only ${equipmentMaintenanceRate}% of active sensory equipment has current maintenance. Poorly maintained equipment poses safety risks to children and may be ineffective. This is a health and safety concern that Ofsted will view seriously under Reg 25.`,
      severity: "critical",
    });
  }

  if (interventionEffectivenessRate < 40 && totalInterventions > 0) {
    insights.push({
      text: `Only ${interventionEffectivenessRate}% of sensory interventions showing improvement. When most interventions are not working, this indicates a systemic issue — interventions may not be appropriately matched to children's needs, professionally informed, or consistently delivered. A fundamental review with specialist input is needed.`,
      severity: "critical",
    });
  }

  if (poorConditionEquipment > 0 && safetyCheckRate < 80) {
    insights.push({
      text: `${poorConditionEquipment} equipment item${poorConditionEquipment !== 1 ? "s" : ""} in poor condition and ${100 - safetyCheckRate}% of equipment not safety-checked. The combination of poor condition and missing safety checks creates a significant risk to children's physical safety during sensory activities.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    sensoryProfileCoverageRate >= 50 &&
    sensoryProfileCoverageRate < 80 &&
    total_children > 0
  ) {
    insights.push({
      text: `Sensory profile coverage at ${sensoryProfileCoverageRate}% — improving but some children still lack a formal sensory assessment. Each unassessed child may have unidentified sensory needs affecting their daily experience and wellbeing.`,
      severity: "warning",
    });
  }

  if (
    accessibilityAdaptationRate >= 50 &&
    accessibilityAdaptationRate < 80 &&
    totalAdaptations > 0
  ) {
    insights.push({
      text: `Adaptation implementation at ${accessibilityAdaptationRate}% — some children are still waiting for identified adaptations to be put in place. Each outstanding adaptation represents an unmet need that the home has already acknowledged.`,
      severity: "warning",
    });
  }

  if (
    interventionEffectivenessRate >= 40 &&
    interventionEffectivenessRate < 70 &&
    totalInterventions > 0
  ) {
    insights.push({
      text: `Intervention effectiveness at ${interventionEffectivenessRate}% — some interventions are not achieving the expected improvement. Consider whether the approach, intensity, or goals need adjustment for individual children.`,
      severity: "warning",
    });
  }

  if (
    childFeedbackRate >= 50 &&
    childFeedbackRate < 70 &&
    totalFeedbackOpportunities > 0
  ) {
    insights.push({
      text: `Child feedback at ${childFeedbackRate}% positive — a notable proportion of children do not report benefiting from their sensory support. Children's subjective experience is the most important measure of whether support is working.`,
      severity: "warning",
    });
  }

  if (
    equipmentMaintenanceRate >= 50 &&
    equipmentMaintenanceRate < 80 &&
    activeEquipment > 0
  ) {
    insights.push({
      text: `Equipment maintenance at ${equipmentMaintenanceRate}% — some equipment has overdue maintenance. While the majority is maintained, any lapse increases the risk of equipment failure during use.`,
      severity: "warning",
    });
  }

  if (overdueProfileReviews > 0 && totalProfiles > 0) {
    insights.push({
      text: `${overdueProfileReviews} sensory profile review${overdueProfileReviews !== 1 ? "s" : ""} overdue. Children's sensory needs change over time, particularly during developmental stages. Out-of-date profiles may lead to inappropriate or insufficient support.`,
      severity: "warning",
    });
  }

  if (overdueInterventionReviews > 0 && activeInterventions > 0) {
    insights.push({
      text: `${overdueInterventionReviews} active intervention${overdueInterventionReviews !== 1 ? "s have" : " has"} overdue reviews. Without timely review, ineffective interventions may continue unchanged while children's needs remain unmet.`,
      severity: "warning",
    });
  }

  if (sessionCompletionRate < 70 && sessionCompletionRate >= 50 && sessionsPlannedTotal > 0) {
    insights.push({
      text: `Session completion at ${sessionCompletionRate}% — planned sessions are not being consistently delivered. Gaps in planned support may reduce the cumulative benefit of sensory interventions for children.`,
      severity: "warning",
    });
  }

  if (childInvolvementRate < 70 && childInvolvementRate >= 50 && totalProfiles > 0) {
    insights.push({
      text: `Child involvement in assessments at ${childInvolvementRate}% — some children are not actively participating in their sensory assessments. Assessments without the child's perspective may not capture the full picture of their sensory experience.`,
      severity: "warning",
    });
  }

  // Analysis of sensory equipment types
  const equipmentTypeCounts: Record<string, number> = {};
  for (const eq of sensory_equipment_records.filter((e) => e.in_use)) {
    equipmentTypeCounts[eq.equipment_type] = (equipmentTypeCounts[eq.equipment_type] ?? 0) + 1;
  }
  const topEquipmentTypes = Object.entries(equipmentTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topEquipmentTypes.length > 0 && activeEquipment >= 3) {
    const typeStr = topEquipmentTypes
      .map(([t, c]) => `${t} (${c})`)
      .join(", ");
    insights.push({
      text: `Active sensory equipment profile: ${typeStr}. Consider whether the equipment mix reflects the range of sensory needs across all children, including proprioceptive, vestibular, and auditory needs.`,
      severity: "warning",
    });
  }

  // Analysis of intervention types
  const interventionTypeCounts: Record<string, number> = {};
  for (const iv of sensory_intervention_records.filter((i) => i.active)) {
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
      text: `Active intervention types: ${ivStr}. A diverse intervention portfolio suggests the home tailors its approach to individual needs rather than applying a one-size-fits-all model.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (sensory_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding sensory and accessibility support — children's sensory needs are comprehensively assessed, adaptations are implemented effectively, equipment is well-maintained, and interventions are achieving positive outcomes. This is strong evidence of individualised, child-centred care under Reg 6.",
      severity: "positive",
    });
  }

  if (
    sensoryProfileCoverageRate >= 100 &&
    childInvolvementRate >= 90 &&
    total_children > 0 &&
    totalProfiles > 0
  ) {
    insights.push({
      text: "Every child has a sensory profile with high levels of child involvement — the home excels at identifying each child's unique sensory needs through participatory assessment, ensuring care is truly individualised.",
      severity: "positive",
    });
  }

  if (
    accessibilityAdaptationRate >= 100 &&
    adaptationEffectivenessAvg >= 4.0 &&
    totalAdaptations > 0
  ) {
    insights.push({
      text: `Every requested adaptation implemented with effectiveness averaging ${adaptationEffectivenessAvg}/5 — the home not only delivers adaptations comprehensively but ensures they make a genuine difference to children's daily lives.`,
      severity: "positive",
    });
  }

  if (
    interventionEffectivenessRate >= 90 &&
    childReportedImprovementRate >= 80 &&
    totalInterventions > 0
  ) {
    insights.push({
      text: `${interventionEffectivenessRate}% of interventions showing improvement with ${childReportedImprovementRate}% of children reporting benefit — both objective measures and children's own experience confirm that sensory interventions are working effectively.`,
      severity: "positive",
    });
  }

  if (
    equipmentMaintenanceRate >= 100 &&
    safetyCheckRate >= 100 &&
    activeEquipment > 0
  ) {
    insights.push({
      text: "All sensory equipment is maintained and safety-checked — the home operates exemplary equipment management, ensuring children have safe, reliable access to sensory resources.",
      severity: "positive",
    });
  }

  if (
    sensoryRoomUtilisationRate >= 80 &&
    goalsMetRate >= 80 &&
    total_children > 0 &&
    totalSessions > 0
  ) {
    insights.push({
      text: `${sensoryRoomUtilisationRate}% of children accessing the sensory room with ${goalsMetRate}% of sessions meeting their goals — the sensory room is a well-utilised, purposeful resource that is genuinely supporting children's sensory regulation.`,
      severity: "positive",
    });
  }

  if (
    childFeedbackRate >= 90 &&
    totalFeedbackOpportunities > 0
  ) {
    insights.push({
      text: `${childFeedbackRate}% positive child feedback on sensory support — children overwhelmingly report that the home's sensory provision genuinely helps them. This child-centred evidence is powerful for Ofsted.`,
      severity: "positive",
    });
  }

  if (
    sessionCompletionRate >= 90 &&
    professionalInvolvementRate >= 80 &&
    sessionsPlannedTotal > 0 &&
    totalInterventions > 0
  ) {
    insights.push({
      text: `${sessionCompletionRate}% session completion with ${professionalInvolvementRate}% professional involvement — the home delivers interventions reliably and draws on specialist expertise, creating a robust foundation for effective sensory support.`,
      severity: "positive",
    });
  }

  if (
    staffReportedImprovementRate >= 80 &&
    childReportedImprovementRate >= 80 &&
    totalInterventions > 0
  ) {
    insights.push({
      text: `Both staff (${staffReportedImprovementRate}%) and children (${childReportedImprovementRate}%) report improvement — the convergence of staff observation and child self-report provides compelling evidence that sensory interventions are genuinely transformative.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (sensory_rating === "outstanding") {
    headline =
      "Outstanding sensory and accessibility support — children's sensory needs are comprehensively assessed, adaptations are implemented, and interventions are achieving positive outcomes.";
  } else if (sensory_rating === "good") {
    headline = `Good sensory and accessibility support — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (sensory_rating === "adequate") {
    headline = `Adequate sensory and accessibility support — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's sensory needs are fully met.`;
  } else {
    headline = `Sensory and accessibility support is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children receive individualised sensory support.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    sensory_rating,
    sensory_score: score,
    headline,
    total_profiles: totalProfiles,
    sensory_profile_coverage_rate: sensoryProfileCoverageRate,
    accessibility_adaptation_rate: accessibilityAdaptationRate,
    sensory_room_utilisation_rate: sensoryRoomUtilisationRate,
    equipment_maintenance_rate: equipmentMaintenanceRate,
    intervention_effectiveness_rate: interventionEffectivenessRate,
    child_feedback_rate: childFeedbackRate,
    adaptation_effectiveness_avg: adaptationEffectivenessAvg,
    intervention_progress_avg: interventionProgressAvg,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
