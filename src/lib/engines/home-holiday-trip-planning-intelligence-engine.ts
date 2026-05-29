// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HOLIDAY & TRIP PLANNING INTELLIGENCE ENGINE
// Monitors holiday activity planning, trip risk assessment completion, consent
// documentation, memorable experience creation, and child participation in
// planning. Measures how well the home promotes positive experiences through
// well-planned, safe, consent-compliant, and child-centred holidays and trips.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Engaging and enjoyable activities), Reg 7 (Protection of
// children). SCCIF: "Children enjoy a wide range of activities and experiences."
// Store keys: holidayPlanRecords, tripRiskAssessmentRecords,
//             consentManagementRecords, experienceRecords,
//             childParticipationRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface HolidayPlanRecordInput {
  id: string;
  child_id: string;
  holiday_name: string;
  destination: string;
  start_date: string;
  end_date: string;
  planning_completed: boolean;
  itinerary_documented: boolean;
  budget_approved: boolean;
  staffing_confirmed: boolean;
  transport_arranged: boolean;
  accommodation_confirmed: boolean;
  activities_planned: boolean;
  dietary_needs_addressed: boolean;
  medical_needs_addressed: boolean;
  emergency_plan_in_place: boolean;
  child_briefed: boolean;
  social_worker_notified: boolean;
  status: "planned" | "approved" | "in_progress" | "completed" | "cancelled";
  holiday_type: "day_trip" | "overnight" | "residential" | "abroad" | "activity_camp" | "other";
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface TripRiskAssessmentRecordInput {
  id: string;
  holiday_plan_id: string;
  child_id: string;
  assessment_date: string;
  risk_type: "travel" | "activity" | "environment" | "health" | "behaviour" | "safeguarding" | "weather" | "other";
  risk_identified: string;
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  mitigation_measures: string;
  mitigation_in_place: boolean;
  assessor: string;
  reviewed: boolean;
  review_date: string | null;
  approved: boolean;
  approved_by: string | null;
  dynamic_risk_assessment_planned: boolean;
  created_at: string;
}

export interface ConsentManagementRecordInput {
  id: string;
  holiday_plan_id: string;
  child_id: string;
  consent_type: "parent_guardian" | "social_worker" | "placing_authority" | "child" | "medical" | "photographic" | "other";
  consent_requested_date: string;
  consent_received: boolean;
  consent_received_date: string | null;
  consent_method: "written" | "email" | "verbal" | "portal" | "other";
  consent_documented: boolean;
  chased_count: number;
  refused: boolean;
  refusal_reason: string | null;
  expiry_date: string | null;
  created_at: string;
}

export interface ExperienceRecordInput {
  id: string;
  holiday_plan_id: string;
  child_id: string;
  experience_date: string;
  activity_description: string;
  experience_type: "adventure" | "cultural" | "educational" | "social" | "relaxation" | "creative" | "sport" | "nature" | "other";
  child_enjoyment_rating: number; // 1-5
  child_feedback: string | null;
  child_feedback_positive: boolean;
  memorable_moment_captured: boolean;
  photos_taken: boolean;
  new_skill_learned: boolean;
  social_interaction_positive: boolean;
  staff_observation: string | null;
  staff_member: string;
  created_at: string;
}

export interface ChildParticipationRecordInput {
  id: string;
  holiday_plan_id: string;
  child_id: string;
  participation_date: string;
  participation_type: "destination_choice" | "activity_selection" | "menu_planning" | "packing" | "itinerary_input" | "budget_input" | "feedback_session" | "other";
  child_involved: boolean;
  child_views_recorded: boolean;
  child_views_acted_upon: boolean;
  child_enthusiasm_rating: number; // 1-5
  barriers_to_participation: string | null;
  barriers_addressed: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface HolidayTripInput {
  today: string;
  total_children: number;
  holiday_plan_records: HolidayPlanRecordInput[];
  trip_risk_assessment_records: TripRiskAssessmentRecordInput[];
  consent_management_records: ConsentManagementRecordInput[];
  experience_records: ExperienceRecordInput[];
  child_participation_records: ChildParticipationRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type HolidayTripRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface HolidayTripInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface HolidayTripRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HolidayTripResult {
  holiday_rating: HolidayTripRating;
  holiday_score: number;
  headline: string;
  total_holiday_plans: number;
  total_risk_assessments: number;
  holiday_planning_rate: number;
  risk_assessment_rate: number;
  consent_compliance_rate: number;
  experience_quality_rate: number;
  child_participation_rate: number;
  child_enjoyment_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: HolidayTripRecommendation[];
  insights: HolidayTripInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): HolidayTripRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: HolidayTripRating,
  score: number,
  headline: string,
): HolidayTripResult {
  return {
    holiday_rating: rating,
    holiday_score: score,
    headline,
    total_holiday_plans: 0,
    total_risk_assessments: 0,
    holiday_planning_rate: 0,
    risk_assessment_rate: 0,
    consent_compliance_rate: 0,
    experience_quality_rate: 0,
    child_participation_rate: 0,
    child_enjoyment_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHolidayTripPlanning(
  input: HolidayTripInput,
): HolidayTripResult {
  const {
    total_children,
    holiday_plan_records,
    trip_risk_assessment_records,
    consent_management_records,
    experience_records,
    child_participation_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    holiday_plan_records.length === 0 &&
    trip_risk_assessment_records.length === 0 &&
    consent_management_records.length === 0 &&
    experience_records.length === 0 &&
    child_participation_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess holiday and trip planning intelligence.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No holiday or trip planning data recorded despite children on placement — holiday and trip planning requires urgent attention.",
      ),
      concerns: [
        "No holiday plans, trip risk assessments, consent records, experience records, or child participation records exist despite children being on placement — the home cannot evidence any holiday or trip planning activity, risk management, or memorable experience creation.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of holiday plans, trip risk assessments, consent management, experience documentation, and child participation to evidence the home's approach to holidays and trips.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engaging and enjoyable activities",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has opportunities for holidays and trips with documented planning, risk assessment, consent, and participation in decision-making about their experiences.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
        },
      ],
      insights: [
        {
          text: "The complete absence of holiday and trip planning records means Ofsted cannot verify that children are being offered enriching experiences, that risks are assessed, or that consent is properly managed. This represents a fundamental gap in Reg 5 and Reg 7 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Holiday planning metrics ---
  const totalHolidayPlans = holiday_plan_records.length;

  // Planning completeness: composite of key planning checks
  const planningChecks = [
    (h: HolidayPlanRecordInput) => h.planning_completed,
    (h: HolidayPlanRecordInput) => h.itinerary_documented,
    (h: HolidayPlanRecordInput) => h.budget_approved,
    (h: HolidayPlanRecordInput) => h.staffing_confirmed,
    (h: HolidayPlanRecordInput) => h.transport_arranged,
    (h: HolidayPlanRecordInput) => h.accommodation_confirmed,
    (h: HolidayPlanRecordInput) => h.activities_planned,
    (h: HolidayPlanRecordInput) => h.dietary_needs_addressed,
    (h: HolidayPlanRecordInput) => h.medical_needs_addressed,
    (h: HolidayPlanRecordInput) => h.emergency_plan_in_place,
  ];
  const totalPlanningChecksPossible = totalHolidayPlans * planningChecks.length;
  let totalPlanningChecksPassed = 0;
  for (const rec of holiday_plan_records) {
    for (const check of planningChecks) {
      if (check(rec)) totalPlanningChecksPassed++;
    }
  }
  const holidayPlanningRate = pct(totalPlanningChecksPassed, totalPlanningChecksPossible);

  const childBriefed = holiday_plan_records.filter((h) => h.child_briefed).length;
  const childBriefingRate = pct(childBriefed, totalHolidayPlans);

  const socialWorkerNotified = holiday_plan_records.filter((h) => h.social_worker_notified).length;
  const socialWorkerNotificationRate = pct(socialWorkerNotified, totalHolidayPlans);

  const completedHolidays = holiday_plan_records.filter((h) => h.status === "completed").length;
  const cancelledHolidays = holiday_plan_records.filter((h) => h.status === "cancelled").length;
  const completionRate = pct(completedHolidays, totalHolidayPlans > 0 ? totalHolidayPlans - cancelledHolidays : 0);

  // Holiday type distribution
  const holidayTypes: Record<string, number> = {};
  for (const h of holiday_plan_records) {
    holidayTypes[h.holiday_type] = (holidayTypes[h.holiday_type] ?? 0) + 1;
  }

  // Unique children with holidays
  const uniqueChildrenWithHolidays = new Set(
    holiday_plan_records.map((h) => h.child_id),
  ).size;
  const holidayCoverageRate = total_children > 0 ? pct(uniqueChildrenWithHolidays, total_children) : 0;

  // --- Risk assessment metrics ---
  const totalRiskAssessments = trip_risk_assessment_records.length;

  const mitigationInPlace = trip_risk_assessment_records.filter((r) => r.mitigation_in_place).length;
  const mitigationRate = pct(mitigationInPlace, totalRiskAssessments);

  const riskReviewed = trip_risk_assessment_records.filter((r) => r.reviewed).length;
  const riskReviewRate = pct(riskReviewed, totalRiskAssessments);

  const riskApproved = trip_risk_assessment_records.filter((r) => r.approved).length;
  const riskApprovalRate = pct(riskApproved, totalRiskAssessments);

  const dynamicRAPlanned = trip_risk_assessment_records.filter((r) => r.dynamic_risk_assessment_planned).length;
  const dynamicRARate = pct(dynamicRAPlanned, totalRiskAssessments);

  // Composite risk assessment rate: mitigation + reviewed + approved
  const riskAssessmentNumerator = mitigationInPlace + riskReviewed + riskApproved;
  const riskAssessmentDenominator = totalRiskAssessments * 3;
  const riskAssessmentRate = pct(riskAssessmentNumerator, riskAssessmentDenominator);

  // High-risk unmitigated assessments
  const highRiskUnmitigated = trip_risk_assessment_records.filter(
    (r) => (r.likelihood === "high" || r.impact === "high") && !r.mitigation_in_place,
  ).length;

  // Risk type distribution
  const riskTypes: Record<string, number> = {};
  for (const r of trip_risk_assessment_records) {
    riskTypes[r.risk_type] = (riskTypes[r.risk_type] ?? 0) + 1;
  }

  // Holiday plans with risk assessments
  const holidayPlanIdsWithRA = new Set(
    trip_risk_assessment_records.map((r) => r.holiday_plan_id),
  );
  const plansWithRA = holiday_plan_records.filter((h) => holidayPlanIdsWithRA.has(h.id)).length;
  const riskAssessmentCoverageRate = pct(plansWithRA, totalHolidayPlans);

  // --- Consent management metrics ---
  const totalConsentRecords = consent_management_records.length;

  const consentReceived = consent_management_records.filter((c) => c.consent_received).length;
  const consentReceivedRate = pct(consentReceived, totalConsentRecords);

  const consentDocumented = consent_management_records.filter((c) => c.consent_documented).length;
  const consentDocumentedRate = pct(consentDocumented, totalConsentRecords);

  const consentRefused = consent_management_records.filter((c) => c.refused).length;
  const consentRefusedRate = pct(consentRefused, totalConsentRecords);

  // Composite consent compliance: received + documented
  const consentComplianceNumerator = consentReceived + consentDocumented;
  const consentComplianceDenominator = totalConsentRecords * 2;
  const consentComplianceRate = pct(consentComplianceNumerator, consentComplianceDenominator);

  // Outstanding (not yet received, not refused)
  const consentOutstanding = consent_management_records.filter(
    (c) => !c.consent_received && !c.refused,
  ).length;
  const consentOutstandingRate = pct(consentOutstanding, totalConsentRecords);

  // Consent type distribution
  const consentTypes: Record<string, number> = {};
  for (const c of consent_management_records) {
    consentTypes[c.consent_type] = (consentTypes[c.consent_type] ?? 0) + 1;
  }

  // Holiday plans with consent
  const holidayPlanIdsWithConsent = new Set(
    consent_management_records.filter((c) => c.consent_received).map((c) => c.holiday_plan_id),
  );
  const plansWithConsent = holiday_plan_records.filter((h) => holidayPlanIdsWithConsent.has(h.id)).length;
  const consentCoverageRate = pct(plansWithConsent, totalHolidayPlans);

  // --- Experience quality metrics ---
  const totalExperiences = experience_records.length;

  const enjoymentSum = experience_records.reduce((sum, e) => sum + e.child_enjoyment_rating, 0);
  const avgEnjoymentRating =
    totalExperiences > 0
      ? Math.round((enjoymentSum / totalExperiences) * 100) / 100
      : 0;

  const positiveFeedback = experience_records.filter((e) => e.child_feedback_positive).length;
  const positiveFeedbackRate = pct(positiveFeedback, totalExperiences);

  const memorableMoments = experience_records.filter((e) => e.memorable_moment_captured).length;
  const memorableMomentRate = pct(memorableMoments, totalExperiences);

  const photosTaken = experience_records.filter((e) => e.photos_taken).length;
  const photosRate = pct(photosTaken, totalExperiences);

  const newSkills = experience_records.filter((e) => e.new_skill_learned).length;
  const newSkillRate = pct(newSkills, totalExperiences);

  const socialInteractionPositive = experience_records.filter((e) => e.social_interaction_positive).length;
  const socialInteractionRate = pct(socialInteractionPositive, totalExperiences);

  // Composite experience quality: feedback_positive + memorable + photos + skills + social
  const expQualityNumerator = positiveFeedback + memorableMoments + photosTaken + newSkills + socialInteractionPositive;
  const expQualityDenominator = totalExperiences * 5;
  const experienceQualityRate = pct(expQualityNumerator, expQualityDenominator);

  // Child enjoyment rate: enjoyment >= 4 out of 5
  const highEnjoyment = experience_records.filter((e) => e.child_enjoyment_rating >= 4).length;
  const childEnjoymentRate = pct(highEnjoyment, totalExperiences);

  // Experience type distribution
  const experienceTypes: Record<string, number> = {};
  for (const e of experience_records) {
    experienceTypes[e.experience_type] = (experienceTypes[e.experience_type] ?? 0) + 1;
  }

  // --- Child participation metrics ---
  const totalParticipation = child_participation_records.length;

  const childInvolved = child_participation_records.filter((p) => p.child_involved).length;
  const childInvolvementRate = pct(childInvolved, totalParticipation);

  const viewsRecorded = child_participation_records.filter((p) => p.child_views_recorded).length;
  const viewsRecordedRate = pct(viewsRecorded, totalParticipation);

  const viewsActedUpon = child_participation_records.filter((p) => p.child_views_acted_upon).length;
  const viewsActedUponRate = pct(viewsActedUpon, totalParticipation);

  const enthusiasmSum = child_participation_records.reduce((sum, p) => sum + p.child_enthusiasm_rating, 0);
  const avgEnthusiasmRating =
    totalParticipation > 0
      ? Math.round((enthusiasmSum / totalParticipation) * 100) / 100
      : 0;

  const barriersIdentified = child_participation_records.filter(
    (p) => p.barriers_to_participation !== null && p.barriers_to_participation !== "",
  ).length;
  const barriersAddressed = child_participation_records.filter(
    (p) => p.barriers_to_participation !== null && p.barriers_to_participation !== "" && p.barriers_addressed,
  ).length;
  const barrierResolutionRate = pct(barriersAddressed, barriersIdentified);

  // Composite child participation rate: involved + views recorded + views acted upon
  const participationNumerator = childInvolved + viewsRecorded + viewsActedUpon;
  const participationDenominator = totalParticipation * 3;
  const childParticipationRate = pct(participationNumerator, participationDenominator);

  // Participation type distribution
  const participationTypes: Record<string, number> = {};
  for (const p of child_participation_records) {
    participationTypes[p.participation_type] = (participationTypes[p.participation_type] ?? 0) + 1;
  }

  // Unique children with participation records
  const uniqueChildrenWithParticipation = new Set(
    child_participation_records.map((p) => p.child_id),
  ).size;
  const participationCoverageRate = total_children > 0 ? pct(uniqueChildrenWithParticipation, total_children) : 0;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: holidayPlanningRate (>=90: +4, >=70: +2) ---
  if (holidayPlanningRate >= 90) score += 4;
  else if (holidayPlanningRate >= 70) score += 2;

  // --- Bonus 2: riskAssessmentRate (>=90: +4, >=70: +2) ---
  if (riskAssessmentRate >= 90) score += 4;
  else if (riskAssessmentRate >= 70) score += 2;

  // --- Bonus 3: consentComplianceRate (>=90: +4, >=70: +2) ---
  if (consentComplianceRate >= 90) score += 4;
  else if (consentComplianceRate >= 70) score += 2;

  // --- Bonus 4: experienceQualityRate (>=85: +3, >=65: +1) ---
  if (experienceQualityRate >= 85) score += 3;
  else if (experienceQualityRate >= 65) score += 1;

  // --- Bonus 5: childParticipationRate (>=90: +3, >=70: +1) ---
  if (childParticipationRate >= 90) score += 3;
  else if (childParticipationRate >= 70) score += 1;

  // --- Bonus 6: childEnjoymentRate (>=90: +3, >=70: +1) ---
  if (childEnjoymentRate >= 90) score += 3;
  else if (childEnjoymentRate >= 70) score += 1;

  // --- Bonus 7: riskAssessmentCoverageRate (>=90: +3, >=70: +1) ---
  if (riskAssessmentCoverageRate >= 90) score += 3;
  else if (riskAssessmentCoverageRate >= 70) score += 1;

  // --- Bonus 8: holidayCoverageRate (>=80: +2, >=50: +1) ---
  if (holidayCoverageRate >= 80) score += 2;
  else if (holidayCoverageRate >= 50) score += 1;

  // --- Bonus 9: memorableMomentRate (>=85: +2, >=65: +1) ---
  if (memorableMomentRate >= 85) score += 2;
  else if (memorableMomentRate >= 65) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // holidayPlanningRate < 50 → -5
  if (holidayPlanningRate < 50 && holiday_plan_records.length > 0) score -= 5;

  // riskAssessmentRate < 50 → -5
  if (riskAssessmentRate < 50 && trip_risk_assessment_records.length > 0) score -= 5;

  // consentComplianceRate < 50 → -5
  if (consentComplianceRate < 50 && consent_management_records.length > 0) score -= 5;

  // childParticipationRate < 40 → -3
  if (childParticipationRate < 40 && child_participation_records.length > 0) score -= 3;

  score = clamp(score, 0, 100);

  const holiday_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (holidayPlanningRate >= 90 && totalHolidayPlans > 0) {
    strengths.push(
      `${holidayPlanningRate}% holiday planning completeness — holidays and trips are thoroughly planned with itineraries, budgets, staffing, transport, accommodation, and activities all confirmed, demonstrating excellent organisational practice.`,
    );
  } else if (holidayPlanningRate >= 70 && totalHolidayPlans > 0) {
    strengths.push(
      `${holidayPlanningRate}% holiday planning completeness — the home generally plans holidays and trips well with most key elements in place.`,
    );
  }

  if (riskAssessmentRate >= 90 && totalRiskAssessments > 0) {
    strengths.push(
      `${riskAssessmentRate}% risk assessment compliance — trip risks are consistently identified, mitigated, reviewed, and approved, ensuring children's safety is prioritised during holidays and outings.`,
    );
  } else if (riskAssessmentRate >= 70 && totalRiskAssessments > 0) {
    strengths.push(
      `${riskAssessmentRate}% risk assessment compliance — the home generally manages trip risk assessments effectively with mitigation measures in place.`,
    );
  }

  if (consentComplianceRate >= 90 && totalConsentRecords > 0) {
    strengths.push(
      `${consentComplianceRate}% consent compliance — consent is consistently obtained and documented for holidays and trips, ensuring regulatory compliance and proper authorisation from all required parties.`,
    );
  } else if (consentComplianceRate >= 70 && totalConsentRecords > 0) {
    strengths.push(
      `${consentComplianceRate}% consent compliance — the home generally obtains and documents consent for holidays and trips effectively.`,
    );
  }

  if (experienceQualityRate >= 85 && totalExperiences > 0) {
    strengths.push(
      `${experienceQualityRate}% experience quality — holidays and trips consistently create memorable moments, new skills, positive social interactions, and documented memories through photographs and child feedback.`,
    );
  } else if (experienceQualityRate >= 65 && totalExperiences > 0) {
    strengths.push(
      `${experienceQualityRate}% experience quality — the home generally creates positive, enriching experiences during holidays and trips.`,
    );
  }

  if (childParticipationRate >= 90 && totalParticipation > 0) {
    strengths.push(
      `${childParticipationRate}% child participation — children are actively involved in planning their holidays and trips, their views are recorded and acted upon, reflecting genuinely child-centred practice.`,
    );
  } else if (childParticipationRate >= 70 && totalParticipation > 0) {
    strengths.push(
      `${childParticipationRate}% child participation — most children are involved in planning and their views are generally recorded and considered.`,
    );
  }

  if (childEnjoymentRate >= 90 && totalExperiences > 0) {
    strengths.push(
      `${childEnjoymentRate}% child enjoyment rate — children consistently rate their holiday and trip experiences highly, indicating that activities are well-matched to their interests and preferences.`,
    );
  } else if (childEnjoymentRate >= 70 && totalExperiences > 0) {
    strengths.push(
      `${childEnjoymentRate}% child enjoyment rate — most children report enjoying their holiday and trip experiences.`,
    );
  }

  if (riskAssessmentCoverageRate >= 90 && totalHolidayPlans > 0) {
    strengths.push(
      `${riskAssessmentCoverageRate}% of holiday plans have associated risk assessments — the home ensures risk assessment is integral to every trip and holiday planning process.`,
    );
  } else if (riskAssessmentCoverageRate >= 70 && totalHolidayPlans > 0) {
    strengths.push(
      `${riskAssessmentCoverageRate}% of holiday plans have risk assessments — the home generally links risk assessment to trip planning.`,
    );
  }

  if (memorableMomentRate >= 85 && totalExperiences > 0) {
    strengths.push(
      `${memorableMomentRate}% of experiences include captured memorable moments — staff consistently record and celebrate special moments, helping children build positive memory banks and a sense of belonging.`,
    );
  } else if (memorableMomentRate >= 65 && totalExperiences > 0) {
    strengths.push(
      `${memorableMomentRate}% of experiences include memorable moments — the home generally captures and celebrates special moments during holidays and trips.`,
    );
  }

  if (socialWorkerNotificationRate >= 90 && totalHolidayPlans > 0) {
    strengths.push(
      `${socialWorkerNotificationRate}% social worker notification rate — social workers are consistently informed about holiday and trip plans, demonstrating strong multi-agency communication.`,
    );
  } else if (socialWorkerNotificationRate >= 70 && totalHolidayPlans > 0) {
    strengths.push(
      `${socialWorkerNotificationRate}% social worker notification rate — the home generally keeps social workers informed about holiday plans.`,
    );
  }

  if (childBriefingRate >= 90 && totalHolidayPlans > 0) {
    strengths.push(
      `${childBriefingRate}% of children briefed before holidays — children are consistently prepared and informed about upcoming trips, reducing anxiety and promoting engagement.`,
    );
  }

  if (newSkillRate >= 70 && totalExperiences > 0) {
    strengths.push(
      `${newSkillRate}% of experiences include new skill development — holidays and trips are used as opportunities for children to learn and grow, extending beyond recreation to genuine developmental enrichment.`,
    );
  }

  if (viewsActedUponRate >= 90 && totalParticipation > 0) {
    strengths.push(
      `${viewsActedUponRate}% of children's views acted upon — the home not only records children's preferences but demonstrably incorporates them into planning, evidencing meaningful participation.`,
    );
  }

  if (dynamicRARate >= 80 && totalRiskAssessments > 0) {
    strengths.push(
      `${dynamicRARate}% of risk assessments include dynamic assessment planning — the home plans for on-the-day risk management, showing sophisticated, responsive safety practice.`,
    );
  }

  if (holidayCoverageRate >= 80 && total_children > 0) {
    strengths.push(
      `${holidayCoverageRate}% of children have documented holiday or trip plans — the home ensures equitable access to enriching experiences for all children in placement.`,
    );
  }

  if (barrierResolutionRate >= 90 && barriersIdentified > 0) {
    strengths.push(
      `${barrierResolutionRate}% of identified participation barriers addressed — when obstacles to children's involvement are identified, the home takes effective action to overcome them.`,
    );
  }

  if (avgEnjoymentRating >= 4.0 && totalExperiences > 0) {
    strengths.push(
      `Average child enjoyment rating of ${avgEnjoymentRating}/5 — children consistently derive high levels of enjoyment from their holiday and trip experiences.`,
    );
  } else if (avgEnjoymentRating >= 3.5 && totalExperiences > 0) {
    strengths.push(
      `Average child enjoyment rating of ${avgEnjoymentRating}/5 — children generally enjoy their holiday and trip experiences.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (holidayPlanningRate < 50 && totalHolidayPlans > 0) {
    concerns.push(
      `Only ${holidayPlanningRate}% holiday planning completeness — the majority of holiday and trip plans are missing critical elements such as itineraries, budgets, staffing, or emergency plans, creating risks to children's safety and enjoyment.`,
    );
  } else if (holidayPlanningRate < 70 && holidayPlanningRate >= 50 && totalHolidayPlans > 0) {
    concerns.push(
      `Holiday planning completeness at ${holidayPlanningRate}% — some key planning elements are missing from holiday and trip documentation, which may leave gaps in preparation.`,
    );
  }

  if (riskAssessmentRate < 50 && totalRiskAssessments > 0) {
    concerns.push(
      `Only ${riskAssessmentRate}% risk assessment compliance — the majority of trip risk assessments lack proper mitigation, review, or approval, potentially exposing children to unmanaged risks during holidays and outings.`,
    );
  } else if (riskAssessmentRate < 70 && riskAssessmentRate >= 50 && totalRiskAssessments > 0) {
    concerns.push(
      `Risk assessment compliance at ${riskAssessmentRate}% — some risk assessments are not fully mitigated, reviewed, or approved, leaving gaps in safety management.`,
    );
  }

  if (consentComplianceRate < 50 && totalConsentRecords > 0) {
    concerns.push(
      `Only ${consentComplianceRate}% consent compliance — the majority of required consents are not obtained or documented, meaning holidays and trips may proceed without proper authorisation from parents, social workers, or placing authorities.`,
    );
  } else if (consentComplianceRate < 70 && consentComplianceRate >= 50 && totalConsentRecords > 0) {
    concerns.push(
      `Consent compliance at ${consentComplianceRate}% — some consents are not obtained or documented, creating regulatory and safeguarding risks.`,
    );
  }

  if (experienceQualityRate < 50 && totalExperiences > 0) {
    concerns.push(
      `Only ${experienceQualityRate}% experience quality — holidays and trips are not consistently creating positive, memorable, or developmental experiences for children, undermining the purpose of enrichment activities.`,
    );
  } else if (experienceQualityRate < 65 && experienceQualityRate >= 50 && totalExperiences > 0) {
    concerns.push(
      `Experience quality at ${experienceQualityRate}% — some holiday and trip experiences lack positive feedback, memorable moments, or developmental value.`,
    );
  }

  if (childParticipationRate < 40 && totalParticipation > 0) {
    concerns.push(
      `Only ${childParticipationRate}% child participation — children are largely excluded from planning their own holidays and trips, their views are not recorded, and their preferences are not acted upon. This fails to meet the voice of the child requirement.`,
    );
  } else if (childParticipationRate < 70 && childParticipationRate >= 40 && totalParticipation > 0) {
    concerns.push(
      `Child participation at ${childParticipationRate}% — children's involvement in planning, and the extent to which their views are recorded and acted upon, requires improvement.`,
    );
  }

  if (childEnjoymentRate < 50 && totalExperiences > 0) {
    concerns.push(
      `Only ${childEnjoymentRate}% child enjoyment rate — the majority of children are not rating their holiday and trip experiences highly, suggesting activities may not be well-matched to children's interests, abilities, or preferences.`,
    );
  } else if (childEnjoymentRate < 70 && childEnjoymentRate >= 50 && totalExperiences > 0) {
    concerns.push(
      `Child enjoyment rate at ${childEnjoymentRate}% — a notable proportion of children are not finding their holiday and trip experiences enjoyable.`,
    );
  }

  if (highRiskUnmitigated > 0) {
    concerns.push(
      `${highRiskUnmitigated} high-risk assessment${highRiskUnmitigated !== 1 ? "s" : ""} without mitigation measures in place — high-likelihood or high-impact risks have been identified but not adequately mitigated, which may expose children to avoidable harm during trips.`,
    );
  }

  if (consentOutstandingRate > 30 && totalConsentRecords > 0) {
    concerns.push(
      `${consentOutstandingRate}% of consents are outstanding (not received and not refused) — a significant proportion of required consents have not been obtained, potentially delaying or jeopardising planned holidays and trips.`,
    );
  }

  if (riskAssessmentCoverageRate < 50 && totalHolidayPlans > 0) {
    concerns.push(
      `Only ${riskAssessmentCoverageRate}% of holiday plans have associated risk assessments — the majority of planned holidays and trips do not have documented risk assessments, which is a fundamental gap in child protection.`,
    );
  } else if (riskAssessmentCoverageRate < 70 && riskAssessmentCoverageRate >= 50 && totalHolidayPlans > 0) {
    concerns.push(
      `Risk assessment coverage at ${riskAssessmentCoverageRate}% — some holiday plans do not have linked risk assessments.`,
    );
  }

  if (holidayCoverageRate < 50 && total_children > 0 && totalHolidayPlans > 0) {
    concerns.push(
      `Only ${holidayCoverageRate}% of children have documented holiday or trip plans — some children may be missing out on enriching experiences that their peers are accessing.`,
    );
  }

  if (socialWorkerNotificationRate < 50 && totalHolidayPlans > 0) {
    concerns.push(
      `Only ${socialWorkerNotificationRate}% social worker notification rate — social workers are not being consistently informed about holiday plans, which may breach communication requirements with placing authorities.`,
    );
  } else if (socialWorkerNotificationRate < 70 && socialWorkerNotificationRate >= 50 && totalHolidayPlans > 0) {
    concerns.push(
      `Social worker notification rate at ${socialWorkerNotificationRate}% — some social workers are not being informed about planned holidays and trips.`,
    );
  }

  if (avgEnjoymentRating < 2.5 && totalExperiences > 0) {
    concerns.push(
      `Average child enjoyment rating at only ${avgEnjoymentRating}/5 — children are consistently reporting poor enjoyment levels, which has implications for the home's ability to evidence enriching experiences.`,
    );
  } else if (avgEnjoymentRating < 3.0 && avgEnjoymentRating >= 2.5 && totalExperiences > 0) {
    concerns.push(
      `Average child enjoyment rating at ${avgEnjoymentRating}/5 — overall enjoyment across holidays and trips is below acceptable standards.`,
    );
  }

  if (totalHolidayPlans === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No holiday or trip plans exist despite children being on placement — the home cannot evidence that children are being offered planned holiday and trip experiences.",
    );
  }

  if (totalRiskAssessments === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No trip risk assessments recorded — the home cannot evidence that risks to children during outings and holidays are being assessed and managed.",
    );
  }

  if (totalConsentRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No consent management records exist — the home cannot evidence that proper authorisation is being obtained for children's holidays and trips from parents, social workers, or placing authorities.",
    );
  }

  if (viewsActedUponRate < 50 && totalParticipation > 0) {
    concerns.push(
      `Only ${viewsActedUponRate}% of children's views acted upon — while children may be asked for their preferences, their views are not being demonstrably incorporated into planning decisions.`,
    );
  }

  if (barrierResolutionRate < 50 && barriersIdentified > 0) {
    concerns.push(
      `Only ${barrierResolutionRate}% of identified participation barriers addressed — barriers preventing children from fully participating in holiday planning are recognised but not resolved.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: HolidayTripRecommendation[] = [];
  let rank = 0;

  if (holidayPlanningRate < 50 && totalHolidayPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and strengthen holiday planning processes — ensure every holiday and trip has a complete plan covering itinerary, budget, staffing, transport, accommodation, activities, dietary and medical needs, and emergency arrangements before the trip proceeds.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging and enjoyable activities",
    });
  }

  if (riskAssessmentRate < 50 && totalRiskAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve trip risk assessment quality — all identified risks must have documented mitigation measures in place, be reviewed by a senior staff member, and receive formal approval before any trip proceeds. Children's safety during outings is paramount.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (consentComplianceRate < 50 && totalConsentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement robust consent management — obtain and document written consent from all required parties (parents/guardians, social workers, placing authorities) before any holiday or trip proceeds. Establish a consent tracking system with escalation for overdue consents.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (highRiskUnmitigated > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Address ${highRiskUnmitigated} unmitigated high-risk assessment${highRiskUnmitigated !== 1 ? "s" : ""} immediately — no trip should proceed with high-likelihood or high-impact risks that lack mitigation measures. Review and implement controls before any related trip takes place.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (childParticipationRate < 40 && totalParticipation > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Involve children meaningfully in holiday and trip planning — consult children about destinations, activities, and preferences; record their views formally; and demonstrate how their input has shaped the final plans. This is essential for evidencing the voice of the child.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (totalHolidayPlans === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin documenting holiday and trip plans for every child on placement — without documented plans, the home cannot evidence that children are being offered planned, enriching holiday experiences.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging and enjoyable activities",
    });
  }

  if (totalRiskAssessments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commence trip risk assessments for all planned holidays and outings — risk assessment is a fundamental requirement for any activity that takes children away from the home.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (totalConsentRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a consent management process for all holidays and trips — obtain and document consent from parents, social workers, and placing authorities as required.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (childEnjoymentRate < 50 && totalExperiences > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review the quality and suitability of holiday and trip activities — consult children about what they would enjoy, match activities to their interests and abilities, and seek feedback after each experience to continuously improve.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (riskAssessmentCoverageRate < 50 && totalHolidayPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every holiday and trip plan has an associated risk assessment — risk assessment must be integral to the planning process and completed before any trip is approved.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (consentOutstandingRate > 30 && totalConsentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish an escalation process for outstanding consents — chase overdue consents promptly and escalate to management when responses are not received within agreed timescales to avoid trip delays or cancellations.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (socialWorkerNotificationRate < 50 && totalHolidayPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Notify social workers of all planned holidays and trips as part of standard planning — this is essential for maintaining transparency with placing authorities and ensuring they can raise any concerns.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging and enjoyable activities",
    });
  }

  if (experienceQualityRate < 50 && totalExperiences > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance the quality of holiday and trip experiences — ensure activities create memorable moments, opportunities for skill development, positive social interactions, and that these are documented through photographs and child feedback.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (
    holidayPlanningRate >= 50 &&
    holidayPlanningRate < 70 &&
    totalHolidayPlans > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve holiday planning completeness to at least 70% — review the planning checklist and ensure all key elements are addressed before trips are approved.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging and enjoyable activities",
    });
  }

  if (
    riskAssessmentRate >= 50 &&
    riskAssessmentRate < 70 &&
    totalRiskAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen risk assessment processes to ensure all assessments are mitigated, reviewed, and approved — establish a clear sign-off workflow before trips proceed.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (
    consentComplianceRate >= 50 &&
    consentComplianceRate < 70 &&
    totalConsentRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve consent documentation and tracking — aim for 70%+ compliance by establishing clear processes for requesting, recording, and storing consent from all required parties.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (
    childParticipationRate >= 40 &&
    childParticipationRate < 70 &&
    totalParticipation > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance child participation in holiday planning — provide more structured opportunities for children to contribute to destination, activity, and itinerary decisions, and evidence how their input shapes outcomes.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    childEnjoymentRate >= 50 &&
    childEnjoymentRate < 70 &&
    totalExperiences > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review activity selection to better match children's interests — seek regular child feedback on what they enjoy and use this to inform future trip planning.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (memorableMomentRate < 65 && totalExperiences > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Prioritise capturing memorable moments during holidays and trips — take photographs, create memory books, and involve children in documenting their experiences to build positive memories and a sense of identity.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (
    holidayCoverageRate < 50 &&
    total_children > 0 &&
    totalHolidayPlans > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure equitable access to holidays and trips for all children — review whether any children are being excluded from enrichment opportunities and address any barriers.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging and enjoyable activities",
    });
  }

  if (viewsActedUponRate < 50 && viewsActedUponRate >= 0 && totalParticipation > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Demonstrate how children's views are incorporated into planning — it is not sufficient to record children's preferences; the home must evidence that their input materially influences holiday and trip decisions.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: HolidayTripInsight[] = [];

  // -- Critical insights --

  if (holidayPlanningRate < 50 && totalHolidayPlans > 0) {
    insights.push({
      text: `Only ${holidayPlanningRate}% holiday planning completeness. Ofsted expects children's holidays and trips to be thoroughly planned with documented itineraries, risk management, and proper authorisation. Incomplete planning creates risks to children's safety and undermines the quality of their experiences.`,
      severity: "critical",
    });
  }

  if (riskAssessmentRate < 50 && totalRiskAssessments > 0) {
    insights.push({
      text: `Only ${riskAssessmentRate}% risk assessment compliance. When trip risks are not properly mitigated, reviewed, and approved, children may be exposed to avoidable harm. This represents a fundamental gap in the home's duty to protect children during activities outside the home.`,
      severity: "critical",
    });
  }

  if (consentComplianceRate < 50 && totalConsentRecords > 0) {
    insights.push({
      text: `Only ${consentComplianceRate}% consent compliance. Holidays and trips proceeding without proper consent from parents, social workers, or placing authorities represent a serious safeguarding and regulatory concern. Consent is not optional — it is a legal and regulatory requirement.`,
      severity: "critical",
    });
  }

  if (childParticipationRate < 40 && totalParticipation > 0) {
    insights.push({
      text: `Child participation at only ${childParticipationRate}%. Children who are excluded from planning their own holiday and trip experiences miss a crucial opportunity for empowerment and agency. Ofsted expects children to be active participants in decisions that affect them, not passive recipients of adult decisions.`,
      severity: "critical",
    });
  }

  if (highRiskUnmitigated > 0) {
    insights.push({
      text: `${highRiskUnmitigated} high-risk assessment${highRiskUnmitigated !== 1 ? "s" : ""} lack mitigation measures. High-likelihood or high-impact risks without documented controls represent an immediate safeguarding concern. No trip should proceed until these risks are adequately mitigated.`,
      severity: "critical",
    });
  }

  if (totalHolidayPlans === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No holiday or trip plans exist despite children being on placement. Without documented plans, the home cannot evidence that children are being offered enriching holiday experiences. This is a gap in Reg 5 compliance — children should enjoy a wide range of planned activities.",
      severity: "critical",
    });
  }

  if (totalRiskAssessments === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No trip risk assessments recorded despite children being on placement. Every outing and holiday requires risk assessment under Reg 7. The complete absence of risk assessment records means the home cannot demonstrate it is managing children's safety during off-site activities.",
      severity: "critical",
    });
  }

  if (totalConsentRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No consent management records exist despite children being on placement. The home cannot evidence that proper authorisation has been obtained for children's holidays and trips. This is a fundamental compliance gap.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    holidayPlanningRate >= 50 &&
    holidayPlanningRate < 70 &&
    totalHolidayPlans > 0
  ) {
    insights.push({
      text: `Holiday planning completeness at ${holidayPlanningRate}% — improving but some key planning elements are still missing from trip documentation. Review which elements are most commonly incomplete and address systematically.`,
      severity: "warning",
    });
  }

  if (
    riskAssessmentRate >= 50 &&
    riskAssessmentRate < 70 &&
    totalRiskAssessments > 0
  ) {
    insights.push({
      text: `Risk assessment compliance at ${riskAssessmentRate}% — some assessments lack complete mitigation, review, or approval. Establish a clear workflow requiring all three elements before trip approval.`,
      severity: "warning",
    });
  }

  if (
    consentComplianceRate >= 50 &&
    consentComplianceRate < 70 &&
    totalConsentRecords > 0
  ) {
    insights.push({
      text: `Consent compliance at ${consentComplianceRate}% — some consents are not obtained or documented. Review whether consent processes are robust and whether staff understand the requirements for each consent type.`,
      severity: "warning",
    });
  }

  if (
    childParticipationRate >= 40 &&
    childParticipationRate < 70 &&
    totalParticipation > 0
  ) {
    insights.push({
      text: `Child participation at ${childParticipationRate}% — children's involvement in planning is inconsistent. Some children may be more difficult to engage, but the home should persist in seeking creative ways to include all children in decisions about their experiences.`,
      severity: "warning",
    });
  }

  if (
    childEnjoymentRate >= 50 &&
    childEnjoymentRate < 70 &&
    totalExperiences > 0
  ) {
    insights.push({
      text: `Child enjoyment rate at ${childEnjoymentRate}% — not all children are finding their experiences enjoyable. Consider whether activities are age-appropriate, interest-matched, and whether children with specific needs or preferences are being accommodated.`,
      severity: "warning",
    });
  }

  if (
    experienceQualityRate >= 50 &&
    experienceQualityRate < 65 &&
    totalExperiences > 0
  ) {
    insights.push({
      text: `Experience quality at ${experienceQualityRate}% — holidays and trips are meeting some quality indicators but falling short on others. Review whether experiences consistently create memorable moments, learning opportunities, and documented memories.`,
      severity: "warning",
    });
  }

  if (
    riskAssessmentCoverageRate >= 50 &&
    riskAssessmentCoverageRate < 70 &&
    totalHolidayPlans > 0
  ) {
    insights.push({
      text: `Risk assessment coverage at ${riskAssessmentCoverageRate}% — some holiday plans do not have linked risk assessments. Every trip requires risk assessment regardless of perceived risk level.`,
      severity: "warning",
    });
  }

  if (
    consentOutstandingRate > 20 &&
    consentOutstandingRate <= 30 &&
    totalConsentRecords > 0
  ) {
    insights.push({
      text: `${consentOutstandingRate}% of consents remain outstanding — while below the threshold for immediate concern, any outstanding consent may delay planned holidays and trips or indicate communication issues with external stakeholders.`,
      severity: "warning",
    });
  }

  if (
    avgEnjoymentRating >= 2.5 &&
    avgEnjoymentRating < 3.5 &&
    totalExperiences > 0
  ) {
    insights.push({
      text: `Average child enjoyment rating at ${avgEnjoymentRating}/5 — enjoyment levels are mediocre. This suggests systemic issues with activity selection, planning, or delivery rather than isolated dissatisfaction.`,
      severity: "warning",
    });
  }

  if (
    socialWorkerNotificationRate >= 50 &&
    socialWorkerNotificationRate < 70 &&
    totalHolidayPlans > 0
  ) {
    insights.push({
      text: `Social worker notification rate at ${socialWorkerNotificationRate}% — some social workers are not being informed about planned holidays and trips. This may create communication gaps with placing authorities.`,
      severity: "warning",
    });
  }

  // Experience type analysis
  const topExperienceTypes = Object.entries(experienceTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topExperienceTypes.length > 0) {
    const formatted = topExperienceTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common experience types: ${formatted}. A diverse range of experience types (adventure, cultural, educational, social, creative) indicates a well-rounded programme of enrichment activities.`,
      severity: "warning",
    });
  }

  // Risk type analysis
  const topRiskTypes = Object.entries(riskTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topRiskTypes.length > 0) {
    const formatted = topRiskTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common risk types identified: ${formatted}. Understanding the risk profile of trips helps the home target training and preparation to the most frequently encountered hazards.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (holiday_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding holiday and trip planning — activities are thoroughly planned, risks are assessed and mitigated, consent is properly managed, children actively participate in planning, and experiences consistently create positive, memorable moments. This is strong evidence for Reg 5 and Reg 7 compliance.",
      severity: "positive",
    });
  }

  if (
    holidayPlanningRate >= 90 &&
    riskAssessmentRate >= 90 &&
    totalHolidayPlans > 0 &&
    totalRiskAssessments > 0
  ) {
    insights.push({
      text: `${holidayPlanningRate}% planning completeness with ${riskAssessmentRate}% risk assessment compliance — the combination of thorough planning and rigorous risk management demonstrates that the home takes children's safety and enjoyment equally seriously during holidays and trips.`,
      severity: "positive",
    });
  }

  if (
    consentComplianceRate >= 90 &&
    totalConsentRecords > 0
  ) {
    insights.push({
      text: `${consentComplianceRate}% consent compliance — the home consistently obtains and documents consent from all required parties, demonstrating robust governance and respect for the legal framework around looked-after children's activities.`,
      severity: "positive",
    });
  }

  if (
    childParticipationRate >= 90 &&
    childEnjoymentRate >= 90 &&
    totalParticipation > 0 &&
    totalExperiences > 0
  ) {
    insights.push({
      text: `${childParticipationRate}% child participation with ${childEnjoymentRate}% enjoyment rate — when children are actively involved in planning their experiences, they enjoy them more. This correlation demonstrates the value of genuine child-centred practice.`,
      severity: "positive",
    });
  }

  if (
    experienceQualityRate >= 85 &&
    totalExperiences > 0
  ) {
    insights.push({
      text: `${experienceQualityRate}% experience quality — holidays and trips consistently create memorable moments, develop new skills, foster positive social interactions, and produce documented memories. These are exactly the enriching experiences Ofsted wants to see for looked-after children.`,
      severity: "positive",
    });
  }

  if (
    childEnjoymentRate >= 90 &&
    totalExperiences > 0
  ) {
    insights.push({
      text: `${childEnjoymentRate}% child enjoyment rate — children consistently derive high levels of enjoyment from their holiday and trip experiences. This reflects activities that are genuinely matched to children's interests, abilities, and preferences.`,
      severity: "positive",
    });
  }

  if (
    riskAssessmentCoverageRate >= 90 &&
    totalHolidayPlans > 0
  ) {
    insights.push({
      text: `${riskAssessmentCoverageRate}% of holiday plans have linked risk assessments — risk assessment is embedded in the planning process, ensuring safety considerations are systematically addressed for every trip.`,
      severity: "positive",
    });
  }

  if (
    memorableMomentRate >= 85 &&
    photosRate >= 85 &&
    totalExperiences > 0
  ) {
    insights.push({
      text: `${memorableMomentRate}% memorable moments captured with ${photosRate}% photographs taken — the home excels at documenting positive experiences, building children's memory banks, and creating lasting records of enjoyment and achievement.`,
      severity: "positive",
    });
  }

  if (
    viewsActedUponRate >= 90 &&
    totalParticipation > 0
  ) {
    insights.push({
      text: `${viewsActedUponRate}% of children's views acted upon in planning — the home not only listens to children but demonstrably incorporates their preferences into holiday and trip decisions. This is strong evidence of meaningful participation.`,
      severity: "positive",
    });
  }

  if (
    holidayCoverageRate >= 80 &&
    total_children > 0
  ) {
    insights.push({
      text: `${holidayCoverageRate}% of children have documented holiday or trip plans — the home ensures equitable access to enriching experiences, with the vast majority of children benefiting from planned holidays and trips.`,
      severity: "positive",
    });
  }

  if (
    newSkillRate >= 70 &&
    totalExperiences > 0
  ) {
    insights.push({
      text: `${newSkillRate}% of experiences include new skill development — holidays and trips serve as developmental opportunities, not just recreation. Children are gaining new capabilities, confidence, and achievements through their experiences.`,
      severity: "positive",
    });
  }

  if (
    barrierResolutionRate >= 90 &&
    barriersIdentified > 0
  ) {
    insights.push({
      text: `${barrierResolutionRate}% of participation barriers resolved — when obstacles to children's involvement are identified, the home takes effective action to overcome them, ensuring no child is excluded from the planning process.`,
      severity: "positive",
    });
  }

  if (
    avgEnthusiasmRating >= 4.0 &&
    totalParticipation > 0
  ) {
    insights.push({
      text: `Average child enthusiasm rating of ${avgEnthusiasmRating}/5 during participation — children are genuinely enthusiastic about planning their holidays and trips, indicating that the participation process itself is engaging and empowering.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (holiday_rating === "outstanding") {
    headline =
      "Outstanding holiday and trip planning — activities are thoroughly planned, risks are managed, consent is properly obtained, and children actively participate in creating memorable experiences.";
  } else if (holiday_rating === "good") {
    headline = `Good holiday and trip planning — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (holiday_rating === "adequate") {
    headline = `Adequate holiday and trip planning — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children experience well-planned, safe, and enjoyable holidays.`;
  } else {
    headline = `Holiday and trip planning is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's holidays and trips are properly planned, risk-assessed, and consented.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    holiday_rating,
    holiday_score: score,
    headline,
    total_holiday_plans: totalHolidayPlans,
    total_risk_assessments: totalRiskAssessments,
    holiday_planning_rate: holidayPlanningRate,
    risk_assessment_rate: riskAssessmentRate,
    consent_compliance_rate: consentComplianceRate,
    experience_quality_rate: experienceQualityRate,
    child_participation_rate: childParticipationRate,
    child_enjoyment_rate: childEnjoymentRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
