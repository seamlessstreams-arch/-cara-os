// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME EYE HEALTH & VISION CARE INTELLIGENCE ENGINE
// Monitors how well the home manages children's eye health — eye test
// compliance, prescription management, optician referral tracking,
// visual aid provision, and child engagement with eye care.
// Measures eye test compliance, prescription management, optician referral
// follow-through, visual aid provision, child engagement, and follow-up rates.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 14 (Health care), Reg 5 (Quality of care standard).
// SCCIF: "Children's health and well-being are promoted".
// Store keys: eyeTestRecords, prescriptionRecords,
//             opticianReferralRecords, visualAidRecords,
//             childEngagementRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface EyeTestRecordInput {
  id: string;
  child_id: string;
  scheduled_date: string;
  attended: boolean;
  date_attended: string | null;
  optician_name: string;
  practice_name: string;
  outcome: "normal" | "prescription_needed" | "referral_needed" | "follow_up" | "monitoring" | "not_attended";
  next_test_date: string | null;
  child_consented: boolean;
  child_accompanied_by: string;
  findings_summary: string | null;
  visual_acuity_left: string | null;
  visual_acuity_right: string | null;
  colour_vision_tested: boolean;
  field_test_completed: boolean;
  child_cooperative: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface PrescriptionRecordInput {
  id: string;
  child_id: string;
  date_prescribed: string;
  prescription_type: "glasses" | "contact_lenses" | "eye_drops" | "eye_patch" | "medication" | "other";
  prescribed_by: string;
  dispensed: boolean;
  date_dispensed: string | null;
  child_using_correctly: boolean;
  replacement_needed: boolean;
  replacement_arranged: boolean;
  review_date: string | null;
  review_completed: boolean;
  child_comfortable: boolean;
  child_consented: boolean;
  cost_covered: boolean;
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface OpticianReferralRecordInput {
  id: string;
  child_id: string;
  referral_date: string;
  referral_reason: "routine" | "concern" | "school_screening" | "headaches" | "squinting" | "follow_up" | "specialist" | "emergency" | "other";
  referred_by: string;
  referred_to: string;
  appointment_date: string | null;
  appointment_attended: boolean;
  outcome: "normal" | "prescription_issued" | "further_referral" | "monitoring" | "treatment_started" | "pending" | "not_attended";
  waiting_time_days: number;
  urgent: boolean;
  child_consented: boolean;
  parent_carer_informed: boolean;
  social_worker_informed: boolean;
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface VisualAidRecordInput {
  id: string;
  child_id: string;
  aid_type: "glasses" | "contact_lenses" | "magnifier" | "screen_filter" | "large_print" | "reading_aid" | "specialist_equipment" | "other";
  date_provided: string;
  condition: "new" | "good" | "fair" | "poor" | "broken" | "lost";
  child_using: boolean;
  child_comfortable_with_aid: boolean;
  replacement_needed: boolean;
  replacement_arranged: boolean;
  last_checked_date: string | null;
  check_overdue: boolean;
  suitable_for_needs: boolean;
  spare_available: boolean;
  school_notified: boolean;
  cost_covered: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface ChildEngagementRecordInput {
  id: string;
  child_id: string;
  date: string;
  engagement_type: "eye_test_preparation" | "prescription_discussion" | "visual_aid_choice" | "eye_health_education" | "feedback_session" | "self_care_training" | "other";
  child_participated: boolean;
  child_views_sought: boolean;
  child_views_recorded: boolean;
  child_understood_information: boolean;
  child_made_choices: boolean;
  age_appropriate_approach: boolean;
  positive_experience: boolean;
  concerns_raised_by_child: boolean;
  concerns_addressed: boolean;
  independence_promoted: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface EyeHealthInput {
  today: string;
  total_children: number;
  eye_test_records: EyeTestRecordInput[];
  prescription_records: PrescriptionRecordInput[];
  optician_referral_records: OpticianReferralRecordInput[];
  visual_aid_records: VisualAidRecordInput[];
  child_engagement_records: ChildEngagementRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type EyeHealthRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface EyeHealthInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface EyeHealthRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface EyeHealthResult {
  eye_health_rating: EyeHealthRating;
  eye_health_score: number | null;
  headline: string;
  total_eye_test_records: number;
  total_prescription_records: number;
  total_referral_records: number;
  total_visual_aid_records: number;
  total_engagement_records: number;
  eye_test_compliance_rate: number | null;
  prescription_management_rate: number | null;
  optician_referral_rate: number | null;
  visual_aid_rate: number | null;
  child_engagement_rate: number | null;
  follow_up_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: EyeHealthRecommendation[];
  insights: EyeHealthInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): EyeHealthRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: EyeHealthRating,
  score: number,
  headline: string,
): EyeHealthResult {
  return {
    eye_health_rating: rating,
    eye_health_score: score,
    headline,
    total_eye_test_records: 0,
    total_prescription_records: 0,
    total_referral_records: 0,
    total_visual_aid_records: 0,
    total_engagement_records: 0,
    eye_test_compliance_rate: 0,
    prescription_management_rate: 0,
    optician_referral_rate: 0,
    visual_aid_rate: 0,
    child_engagement_rate: 0,
    follow_up_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeEyeHealthVisionCare(
  input: EyeHealthInput,
): EyeHealthResult {
  const {
    total_children,
    eye_test_records,
    prescription_records,
    optician_referral_records,
    visual_aid_records,
    child_engagement_records,
  } = input;

  // ── Special case: all empty + 0 children -> insufficient_data ──────────
  const allEmpty =
    eye_test_records.length === 0 &&
    prescription_records.length === 0 &&
    optician_referral_records.length === 0 &&
    visual_aid_records.length === 0 &&
    child_engagement_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess eye health and vision care management.",
    );
  }

  // ── Special case: all empty + children > 0 -> inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No eye health or vision care data recorded despite children on placement — eye health management requires urgent attention.",
      ),
      concerns: [
        "No eye test records, prescription records, optician referral records, visual aid records, or child engagement records exist despite children being on placement — the home cannot evidence adequate eye health management or vision care.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of eye tests, prescription management, optician referrals, visual aid provision, and child engagement to evidence the home's management of children's eye health and vision care needs.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Health care",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has an up-to-date eye test, is registered with an optician, and receives appropriate vision care including any prescribed visual aids.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard",
        },
      ],
      insights: [
        {
          text: "The complete absence of eye health and vision care records means Ofsted cannot verify that children's eye health needs are being met, eye tests are attended, or visual aids are provided. This represents a fundamental gap in Reg 14 and Reg 5 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Eye test metrics ---
  const totalEyeTestRecords = eye_test_records.length;

  const eyeTestsAttended = eye_test_records.filter((r) => r.attended).length;
  const eyeTestAttendanceRate = pct(eyeTestsAttended, totalEyeTestRecords);

  const eyeTestsConsented = eye_test_records.filter((r) => r.child_consented).length;

  const childCooperative = eye_test_records.filter((r) => r.child_cooperative).length;

  const eyeTestsWithNextDate = eye_test_records.filter((r) => r.next_test_date !== null).length;
  const nextTestScheduledRate = pct(eyeTestsWithNextDate, totalEyeTestRecords);

  const normalOutcomes = eye_test_records.filter((r) => r.outcome === "normal").length;
  const normalOutcomeRate = pct(normalOutcomes, totalEyeTestRecords);

  const prescriptionNeeded = eye_test_records.filter((r) => r.outcome === "prescription_needed").length;

  // Composite eye test compliance: attended + consented + cooperative + next test scheduled
  const eyeTestComplianceNumerator = eyeTestsAttended + eyeTestsConsented + childCooperative + eyeTestsWithNextDate;
  const eyeTestComplianceDenominator = totalEyeTestRecords * 4;
  const eyeTestComplianceRate = pct(eyeTestComplianceNumerator, eyeTestComplianceDenominator);

  // --- Prescription management metrics ---
  const totalPrescriptionRecords = prescription_records.length;

  const prescriptionsDispensed = prescription_records.filter((r) => r.dispensed).length;

  const usingCorrectly = prescription_records.filter((r) => r.child_using_correctly).length;
  const correctUsageRate = pct(usingCorrectly, totalPrescriptionRecords);

  const childComfortable = prescription_records.filter((r) => r.child_comfortable).length;
  const comfortRate = pct(childComfortable, totalPrescriptionRecords);

  const reviewCompleted = prescription_records.filter((r) => r.review_completed).length;

  const replacementNeeded = prescription_records.filter((r) => r.replacement_needed).length;
  const replacementArranged = prescription_records.filter(
    (r) => r.replacement_needed && r.replacement_arranged,
  ).length;
  const replacementArrangedRate = pct(replacementArranged, replacementNeeded);

  const prescriptionFollowUpRequired = prescription_records.filter((r) => r.follow_up_required).length;
  const prescriptionFollowUpCompleted = prescription_records.filter(
    (r) => r.follow_up_required && r.follow_up_completed,
  ).length;

  // Composite prescription management: dispensed + using correctly + comfortable + review completed
  const prescriptionMgmtNumerator = prescriptionsDispensed + usingCorrectly + childComfortable + reviewCompleted;
  const prescriptionMgmtDenominator = totalPrescriptionRecords * 4;
  const prescriptionManagementRate = pct(prescriptionMgmtNumerator, prescriptionMgmtDenominator);

  // --- Optician referral metrics ---
  const totalReferralRecords = optician_referral_records.length;

  const referralsAttended = optician_referral_records.filter((r) => r.appointment_attended).length;
  const referralAttendanceRate = pct(referralsAttended, totalReferralRecords);

  const referralsConsented = optician_referral_records.filter((r) => r.child_consented).length;

  const parentInformed = optician_referral_records.filter((r) => r.parent_carer_informed).length;

  const socialWorkerInformed = optician_referral_records.filter((r) => r.social_worker_informed).length;

  const urgentReferrals = optician_referral_records.filter((r) => r.urgent).length;
  const urgentReferralsAttended = optician_referral_records.filter(
    (r) => r.urgent && r.appointment_attended,
  ).length;
  const urgentReferralAttendanceRate = pct(urgentReferralsAttended, urgentReferrals);

  const referralFollowUpRequired = optician_referral_records.filter((r) => r.follow_up_required).length;
  const referralFollowUpCompleted = optician_referral_records.filter(
    (r) => r.follow_up_required && r.follow_up_completed,
  ).length;

  const avgWaitingTime =
    totalReferralRecords > 0
      ? Math.round(optician_referral_records.reduce((sum, r) => sum + r.waiting_time_days, 0) / totalReferralRecords)
      : null;

  // Composite optician referral rate: attended + consented + parent informed + social worker informed
  const referralNumerator = referralsAttended + referralsConsented + parentInformed + socialWorkerInformed;
  const referralDenominator = totalReferralRecords * 4;
  const opticianReferralRate = pct(referralNumerator, referralDenominator);

  // --- Visual aid metrics ---
  const totalVisualAidRecords = visual_aid_records.length;

  const aidsInUse = visual_aid_records.filter((r) => r.child_using).length;

  const aidsComfortable = visual_aid_records.filter((r) => r.child_comfortable_with_aid).length;

  const aidsSuitable = visual_aid_records.filter((r) => r.suitable_for_needs).length;
  const aidSuitabilityRate = pct(aidsSuitable, totalVisualAidRecords);

  const aidsGoodCondition = visual_aid_records.filter(
    (r) => r.condition === "new" || r.condition === "good",
  ).length;

  const schoolNotified = visual_aid_records.filter((r) => r.school_notified).length;
  const schoolNotifiedRate = pct(schoolNotified, totalVisualAidRecords);

  const spareAvailable = visual_aid_records.filter((r) => r.spare_available).length;
  const spareAvailableRate = pct(spareAvailable, totalVisualAidRecords);

  const aidCheckOverdue = visual_aid_records.filter((r) => r.check_overdue).length;
  const aidCheckOverdueRate = pct(aidCheckOverdue, totalVisualAidRecords);

  const aidsPoorOrBroken = visual_aid_records.filter(
    (r) => r.condition === "poor" || r.condition === "broken" || r.condition === "lost",
  ).length;
  const aidPoorConditionRate = pct(aidsPoorOrBroken, totalVisualAidRecords);

  // Composite visual aid rate: using + comfortable + suitable + good condition
  const visualAidNumerator = aidsInUse + aidsComfortable + aidsSuitable + aidsGoodCondition;
  const visualAidDenominator = totalVisualAidRecords * 4;
  const visualAidRate = pct(visualAidNumerator, visualAidDenominator);

  // --- Child engagement metrics ---
  const totalEngagementRecords = child_engagement_records.length;

  const childParticipated = child_engagement_records.filter((r) => r.child_participated).length;

  const viewsSought = child_engagement_records.filter((r) => r.child_views_sought).length;

  const childUnderstood = child_engagement_records.filter((r) => r.child_understood_information).length;

  const childMadeChoices = child_engagement_records.filter((r) => r.child_made_choices).length;
  const choiceMakingRate = pct(childMadeChoices, totalEngagementRecords);

  const positiveExperience = child_engagement_records.filter((r) => r.positive_experience).length;
  const positiveExperienceRate = pct(positiveExperience, totalEngagementRecords);

  const independencePromoted = child_engagement_records.filter((r) => r.independence_promoted).length;
  const independenceRate = pct(independencePromoted, totalEngagementRecords);

  const concernsRaised = child_engagement_records.filter((r) => r.concerns_raised_by_child).length;
  const concernsAddressed = child_engagement_records.filter(
    (r) => r.concerns_raised_by_child && r.concerns_addressed,
  ).length;
  const concernsAddressedRate = pct(concernsAddressed, concernsRaised);

  // Composite child engagement: participated + views sought + understood + positive experience
  const engagementNumerator = childParticipated + viewsSought + childUnderstood + positiveExperience;
  const engagementDenominator = totalEngagementRecords * 4;
  const childEngagementRate = pct(engagementNumerator, engagementDenominator);

  // --- Follow-up composite rate ---
  let followUpNumerator = 0;
  let followUpDenominator = 0;

  if (prescriptionFollowUpRequired > 0) {
    followUpNumerator += prescriptionFollowUpCompleted;
    followUpDenominator += prescriptionFollowUpRequired;
  }
  if (referralFollowUpRequired > 0) {
    followUpNumerator += referralFollowUpCompleted;
    followUpDenominator += referralFollowUpRequired;
  }

  const followUpRate = pct(followUpNumerator, followUpDenominator);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: eyeTestComplianceRate (>=90: +5, >=70: +2) ---
  if (eyeTestComplianceRate >= 90) score += 5;
  else if (eyeTestComplianceRate >= 70) score += 2;

  // --- Bonus 2: prescriptionManagementRate (>=90: +5, >=70: +2) ---
  if (prescriptionManagementRate >= 90) score += 5;
  else if (prescriptionManagementRate >= 70) score += 2;

  // --- Bonus 3: opticianReferralRate (>=90: +4, >=70: +2) ---
  if (opticianReferralRate >= 90) score += 4;
  else if (opticianReferralRate >= 70) score += 2;

  // --- Bonus 4: visualAidRate (>=90: +4, >=70: +2) ---
  if (visualAidRate >= 90) score += 4;
  else if (visualAidRate >= 70) score += 2;

  // --- Bonus 5: childEngagementRate (>=90: +5, >=70: +2) ---
  if (childEngagementRate >= 90) score += 5;
  else if (childEngagementRate >= 70) score += 2;

  // --- Bonus 6: followUpRate (>=90: +5, >=70: +2) ---
  if (followUpRate >= 90) score += 5;
  else if (followUpRate >= 70) score += 2;

  // Max bonuses = 5+5+4+4+5+5 = 28

  // ── Penalties ─────────────────────────────────────────────────────────

  // eyeTestComplianceRate < 50 -> -5
  if (eyeTestComplianceRate < 50 && eye_test_records.length > 0) score -= 5;

  // prescriptionManagementRate < 50 -> -5
  if (prescriptionManagementRate < 50 && prescription_records.length > 0) score -= 5;

  // opticianReferralRate < 50 -> -4
  if (opticianReferralRate < 50 && optician_referral_records.length > 0) score -= 4;

  // childEngagementRate < 40 -> -4
  if (childEngagementRate < 40 && child_engagement_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const eye_health_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (eyeTestComplianceRate >= 90 && totalEyeTestRecords > 0) {
    strengths.push(
      `${eyeTestComplianceRate}% eye test compliance — children attend eye tests consistently, consent is obtained, and follow-up appointments are scheduled, ensuring early identification and management of vision problems.`,
    );
  } else if (eyeTestComplianceRate >= 70 && totalEyeTestRecords > 0) {
    strengths.push(
      `${eyeTestComplianceRate}% eye test compliance — the home generally ensures children attend scheduled eye tests with appropriate consent and follow-up scheduling.`,
    );
  }

  if (prescriptionManagementRate >= 90 && totalPrescriptionRecords > 0) {
    strengths.push(
      `${prescriptionManagementRate}% prescription management — prescriptions are dispensed promptly, children use their corrective aids correctly, and regular reviews ensure ongoing suitability.`,
    );
  } else if (prescriptionManagementRate >= 70 && totalPrescriptionRecords > 0) {
    strengths.push(
      `${prescriptionManagementRate}% prescription management — the home generally manages children's optical prescriptions effectively.`,
    );
  }

  if (opticianReferralRate >= 90 && totalReferralRecords > 0) {
    strengths.push(
      `${opticianReferralRate}% optician referral management — referrals are tracked effectively, appointments are attended, and all relevant parties are informed, ensuring comprehensive multi-agency communication.`,
    );
  } else if (opticianReferralRate >= 70 && totalReferralRecords > 0) {
    strengths.push(
      `${opticianReferralRate}% optician referral management — the home manages optician referrals effectively with good attendance and communication.`,
    );
  }

  if (visualAidRate >= 90 && totalVisualAidRecords > 0) {
    strengths.push(
      `${visualAidRate}% visual aid provision — visual aids are in good condition, suitable for children's needs, and children are comfortable using them, supporting their daily functioning and learning.`,
    );
  } else if (visualAidRate >= 70 && totalVisualAidRecords > 0) {
    strengths.push(
      `${visualAidRate}% visual aid provision — the home generally ensures children have appropriate visual aids in good condition.`,
    );
  }

  if (childEngagementRate >= 90 && totalEngagementRecords > 0) {
    strengths.push(
      `${childEngagementRate}% child engagement with eye care — children actively participate in decisions about their eye health, their views are sought and recorded, and they have positive experiences, reflecting genuine partnership in care.`,
    );
  } else if (childEngagementRate >= 70 && totalEngagementRecords > 0) {
    strengths.push(
      `${childEngagementRate}% child engagement — most children are positively involved in their eye health care decisions and experiences.`,
    );
  }

  if (followUpRate >= 90 && followUpDenominator > 0) {
    strengths.push(
      `${followUpRate}% follow-up completion — all required eye health follow-up appointments and reviews are completed, ensuring continuity of vision care.`,
    );
  } else if (followUpRate >= 70 && followUpDenominator > 0) {
    strengths.push(
      `${followUpRate}% follow-up completion — the home generally ensures eye health follow-up appointments are attended.`,
    );
  }

  if (eyeTestAttendanceRate >= 95 && totalEyeTestRecords > 0) {
    strengths.push(
      `${eyeTestAttendanceRate}% eye test attendance — near-perfect attendance demonstrates the home's commitment to children's visual health monitoring.`,
    );
  }

  if (correctUsageRate >= 90 && totalPrescriptionRecords > 0) {
    strengths.push(
      `${correctUsageRate}% correct prescription usage — children are supported to use their prescribed visual aids correctly, maximising the benefit of their prescriptions.`,
    );
  }

  if (replacementArrangedRate >= 90 && replacementNeeded > 0) {
    strengths.push(
      `${replacementArrangedRate}% replacement arrangement rate — when visual aids need replacing, the home acts promptly to arrange replacements, ensuring children are never without necessary visual support.`,
    );
  }

  if (schoolNotifiedRate >= 90 && totalVisualAidRecords > 0) {
    strengths.push(
      `${schoolNotifiedRate}% school notification of visual aids — schools are consistently informed about children's visual aids, ensuring continuity of support across settings.`,
    );
  }

  if (aidSuitabilityRate >= 95 && totalVisualAidRecords > 0) {
    strengths.push(
      `${aidSuitabilityRate}% visual aid suitability — virtually all visual aids are assessed as suitable for children's needs, indicating thorough needs assessment and appropriate provision.`,
    );
  }

  if (positiveExperienceRate >= 90 && totalEngagementRecords > 0) {
    strengths.push(
      `${positiveExperienceRate}% positive eye care experiences — children consistently report positive experiences during eye health interactions, indicating child-friendly, accessible approaches to vision care.`,
    );
  }

  if (independenceRate >= 85 && totalEngagementRecords > 0) {
    strengths.push(
      `${independenceRate}% independence promotion in eye care — the home actively promotes children's independence in managing their own eye health, building essential self-care skills for adulthood.`,
    );
  }

  if (concernsAddressedRate >= 90 && concernsRaised > 0) {
    strengths.push(
      `${concernsAddressedRate}% of child-raised concerns addressed — when children raise concerns about their eye health or vision care, these are consistently addressed, demonstrating responsive, child-centred practice.`,
    );
  }

  if (urgentReferralAttendanceRate >= 95 && urgentReferrals > 0) {
    strengths.push(
      `${urgentReferralAttendanceRate}% urgent referral attendance — all urgent eye health referrals are attended promptly, ensuring critical vision issues receive immediate clinical attention.`,
    );
  }

  if (normalOutcomeRate >= 80 && totalEyeTestRecords > 0) {
    strengths.push(
      `${normalOutcomeRate}% of eye tests show normal outcomes — the majority of children have healthy vision, which may indicate effective preventive care and early intervention.`,
    );
  }

  if (spareAvailableRate >= 80 && totalVisualAidRecords > 0) {
    strengths.push(
      `${spareAvailableRate}% of visual aids have spares available — the home ensures backup visual aids are available, preventing disruption when aids are damaged or lost.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (eyeTestComplianceRate < 50 && totalEyeTestRecords > 0) {
    concerns.push(
      `Only ${eyeTestComplianceRate}% eye test compliance — the majority of eye tests are not fully compliant (attendance, consent, cooperation, or follow-up scheduling is inadequate), directly compromising children's ability to have vision problems identified and managed.`,
    );
  } else if (eyeTestComplianceRate < 70 && eyeTestComplianceRate >= 50 && totalEyeTestRecords > 0) {
    concerns.push(
      `Eye test compliance at ${eyeTestComplianceRate}% — a significant proportion of eye tests lack full compliance, risking undetected vision problems.`,
    );
  }

  if (prescriptionManagementRate < 50 && totalPrescriptionRecords > 0) {
    concerns.push(
      `Only ${prescriptionManagementRate}% prescription management — prescriptions are not being dispensed promptly, children are not using corrective aids correctly, or reviews are not completed, meaning children may have vision needs that are not being met.`,
    );
  } else if (prescriptionManagementRate < 70 && prescriptionManagementRate >= 50 && totalPrescriptionRecords > 0) {
    concerns.push(
      `Prescription management at ${prescriptionManagementRate}% — some aspects of prescription management need improvement to ensure children's vision correction needs are fully met.`,
    );
  }

  if (opticianReferralRate < 50 && totalReferralRecords > 0) {
    concerns.push(
      `Only ${opticianReferralRate}% optician referral management — referral appointments are not being attended, consent is lacking, or relevant parties are not being informed, creating gaps in children's vision care pathway.`,
    );
  } else if (opticianReferralRate < 70 && opticianReferralRate >= 50 && totalReferralRecords > 0) {
    concerns.push(
      `Optician referral management at ${opticianReferralRate}% — referral processes need strengthening to ensure children receive timely specialist vision care.`,
    );
  }

  if (visualAidRate < 50 && totalVisualAidRecords > 0) {
    concerns.push(
      `Only ${visualAidRate}% visual aid provision — visual aids are in poor condition, not being used by children, uncomfortable, or unsuitable for their needs, meaning children's daily vision is not being adequately supported.`,
    );
  } else if (visualAidRate < 70 && visualAidRate >= 50 && totalVisualAidRecords > 0) {
    concerns.push(
      `Visual aid provision at ${visualAidRate}% — some visual aids are not meeting children's needs effectively and require review.`,
    );
  }

  if (childEngagementRate < 40 && totalEngagementRecords > 0) {
    concerns.push(
      `Child engagement with eye care at only ${childEngagementRate}% — children are not participating in decisions about their eye health, their views are not being sought, and experiences are not positive, which undermines their autonomy and may indicate barriers to accessing eye care.`,
    );
  } else if (childEngagementRate < 70 && childEngagementRate >= 40 && totalEngagementRecords > 0) {
    concerns.push(
      `Child engagement at ${childEngagementRate}% — some children are not positively engaged with their eye health care, which may indicate a need for more age-appropriate or child-centred approaches.`,
    );
  }

  if (followUpRate < 50 && followUpDenominator > 0) {
    concerns.push(
      `Only ${followUpRate}% of required eye health follow-ups completed — children are not attending follow-up appointments, risking deterioration of vision problems that require ongoing monitoring.`,
    );
  } else if (followUpRate < 70 && followUpRate >= 50 && followUpDenominator > 0) {
    concerns.push(
      `Eye health follow-up rate at ${followUpRate}% — some required follow-up appointments are being missed, potentially impacting continuity of vision care.`,
    );
  }

  if (eyeTestAttendanceRate < 50 && totalEyeTestRecords > 0) {
    concerns.push(
      `Only ${eyeTestAttendanceRate}% eye test attendance — the majority of scheduled eye tests are not being attended, meaning children's vision health is not being monitored.`,
    );
  }

  if (aidPoorConditionRate > 30 && totalVisualAidRecords > 0) {
    concerns.push(
      `${aidPoorConditionRate}% of visual aids are in poor, broken, or lost condition — children cannot effectively use visual aids that are not in working condition. Immediate replacement or repair is needed.`,
    );
  }

  if (aidCheckOverdueRate > 30 && totalVisualAidRecords > 0) {
    concerns.push(
      `${aidCheckOverdueRate}% of visual aid checks are overdue — regular checking ensures aids remain suitable and in good condition. Overdue checks may mean children are using aids that are no longer appropriate.`,
    );
  }

  if ((avgWaitingTime ?? 0) > 42 && totalReferralRecords > 0) {
    concerns.push(
      `Average optician referral waiting time is ${avgWaitingTime} days — extended waiting times mean children's vision issues are not being addressed promptly, which may impact their education, wellbeing, and daily functioning.`,
    );
  }

  if (correctUsageRate < 50 && totalPrescriptionRecords > 0) {
    concerns.push(
      `Only ${correctUsageRate}% of children are using their prescriptions correctly — children may be struggling with their visual aids, lacking support to wear or use them properly, or choosing not to use them due to discomfort or social factors.`,
    );
  }

  if (totalEyeTestRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No eye test records exist despite children being on placement — the home cannot evidence that children are receiving regular eye tests or that their vision health is being monitored.",
    );
  }

  if (totalPrescriptionRecords === 0 && prescriptionNeeded > 0) {
    concerns.push(
      `Eye tests identified ${prescriptionNeeded} children needing prescriptions but no prescription records exist — children who need vision correction may not be receiving it.`,
    );
  }

  if (totalVisualAidRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No visual aid records exist despite children being on placement — the home cannot evidence that children who need visual aids have them or that existing aids are maintained and suitable.",
    );
  }

  if (schoolNotifiedRate < 50 && totalVisualAidRecords > 0) {
    concerns.push(
      `Only ${schoolNotifiedRate}% of schools notified about visual aids — without school notification, children may not receive appropriate visual support in the classroom, impacting their education.`,
    );
  }

  if (concernsAddressedRate < 50 && concernsRaised > 0) {
    concerns.push(
      `Only ${concernsAddressedRate}% of child-raised eye health concerns are addressed — when children raise concerns about their vision or eye care, these are not being consistently responded to.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: EyeHealthRecommendation[] = [];
  let rank = 0;

  if (eyeTestComplianceRate < 50 && totalEyeTestRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve eye test compliance — ensure every child has a scheduled eye test, that barriers to attendance (anxiety, transport, consent) are identified and addressed, and that follow-up appointments are booked at every test.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (prescriptionManagementRate < 50 && totalPrescriptionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all optical prescriptions are dispensed promptly, children are supported to use their visual aids correctly, and regular reviews are completed. Uncollected or unused prescriptions mean children's vision is not being corrected.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (opticianReferralRate < 50 && totalReferralRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve optician referral processes — ensure all referral appointments are attended, relevant professionals and family members are informed, and children consent to and understand their referrals.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (childEngagementRate < 40 && totalEngagementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve children's engagement with eye care — use age-appropriate preparation, involve children in decisions about their vision care, seek their views meaningfully, and ensure eye health interactions are positive experiences.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (totalEyeTestRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule eye tests for all children immediately — the absence of any eye test records means the home cannot evidence that children's vision health is being monitored. Every child should have an eye test at least every two years.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (visualAidRate < 50 && totalVisualAidRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all visual aids — replace or repair aids in poor condition, ensure aids are suitable for children's current needs, and support children to use their aids comfortably.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard",
    });
  }

  if (aidPoorConditionRate > 30 && totalVisualAidRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Replace all damaged, broken, or lost visual aids immediately — children cannot function effectively without working visual aids. Arrange emergency replacements and ensure spare aids are available.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (followUpRate < 50 && followUpDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement an eye health follow-up tracker — ensure all required follow-up appointments are scheduled, attended, and documented. Missed follow-ups risk deterioration of treatable vision conditions.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    eyeTestComplianceRate >= 50 &&
    eyeTestComplianceRate < 70 &&
    totalEyeTestRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve eye test compliance to at least 70% — review appointment scheduling, transport arrangements, and child preparation to reduce missed tests and ensure consent and cooperation.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    prescriptionManagementRate >= 50 &&
    prescriptionManagementRate < 70 &&
    totalPrescriptionRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen prescription management — ensure all prescriptions are collected promptly, children receive support and encouragement to use their visual aids, and regular reviews confirm ongoing suitability.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    opticianReferralRate >= 50 &&
    opticianReferralRate < 70 &&
    totalReferralRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen optician referral processes — improve appointment attendance, ensure all parties are informed, and track referral outcomes systematically.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (
    visualAidRate >= 50 &&
    visualAidRate < 70 &&
    totalVisualAidRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and improve visual aid provision — conduct a full audit of all visual aids, replace unsuitable or damaged aids, and ensure children are comfortable and supported in using their aids.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard",
    });
  }

  if (
    childEngagementRate >= 40 &&
    childEngagementRate < 70 &&
    totalEngagementRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance children's participation in eye health decisions — use age-appropriate explanations, seek views meaningfully, and involve children in choosing their visual aids and planning their eye care appointments.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    followUpRate >= 50 &&
    followUpRate < 70 &&
    followUpDenominator > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve follow-up appointment attendance — review barriers to follow-up compliance and ensure staff track and prioritise outstanding eye health follow-ups.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (schoolNotifiedRate < 50 && totalVisualAidRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all schools are notified when children have visual aids — consistent notification allows schools to provide appropriate classroom support and accommodations for children's vision needs.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard",
    });
  }

  if (spareAvailableRate < 50 && totalVisualAidRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Arrange spare visual aids for all children who depend on them — children should never be without visual support because their primary aid is damaged, lost, or being repaired.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (correctUsageRate < 50 && totalPrescriptionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate and address barriers to correct prescription usage — some children may need additional support, encouragement, or comfortable alternatives to use their prescribed visual aids consistently.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care standard",
    });
  }

  if (aidCheckOverdueRate > 30 && totalVisualAidRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue visual aid checks — regular checking ensures aids remain suitable, comfortable, and in good condition. Establish a routine checking schedule for all visual aids.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if ((avgWaitingTime ?? 0) > 42 && totalReferralRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reduce optician referral waiting times — explore alternative providers, escalate urgent referrals, and consider private options where NHS waiting times are excessive. Children should not wait more than 6 weeks for non-urgent appointments.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Health care",
    });
  }

  if (concernsAddressedRate < 50 && concernsRaised > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all child-raised eye health concerns are responded to — implement a system where children's concerns about their vision or eye care are logged, investigated, and resolved with feedback to the child.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: EyeHealthInsight[] = [];

  // -- Critical insights --

  if (eyeTestComplianceRate < 50 && totalEyeTestRecords > 0) {
    insights.push({
      text: `Only ${eyeTestComplianceRate}% eye test compliance. Ofsted expects looked-after children to have regular eye tests as part of their health care. Poor compliance means vision problems go undetected, potentially impacting children's education, safety, and daily functioning.`,
      severity: "critical",
    });
  }

  if (prescriptionManagementRate < 50 && totalPrescriptionRecords > 0) {
    insights.push({
      text: `Prescription management at only ${prescriptionManagementRate}%. When prescriptions are not dispensed, not used correctly, or not reviewed, children are effectively going without the vision correction they have been assessed as needing. This directly impacts their quality of life and learning.`,
      severity: "critical",
    });
  }

  if (opticianReferralRate < 50 && totalReferralRecords > 0) {
    insights.push({
      text: `Optician referral management at only ${opticianReferralRate}%. Poor referral management means children with identified vision concerns are not receiving the specialist assessment and treatment they need. This represents a failure to follow through on clinical recommendations.`,
      severity: "critical",
    });
  }

  if (childEngagementRate < 40 && totalEngagementRecords > 0) {
    insights.push({
      text: `Child engagement with eye care at only ${childEngagementRate}%. Children who are not engaged in their eye health care are less likely to attend appointments, use their visual aids, and report problems. Low engagement may indicate anxiety, lack of understanding, or negative past experiences.`,
      severity: "critical",
    });
  }

  if (totalEyeTestRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No eye test records exist despite children being on placement. Without eye test records, the home cannot evidence that children's vision health is being monitored. Regular eye tests are essential for identifying and correcting vision problems that can significantly affect children's education and wellbeing.",
      severity: "critical",
    });
  }

  if (aidPoorConditionRate > 50 && totalVisualAidRecords > 0) {
    insights.push({
      text: `${aidPoorConditionRate}% of visual aids are in poor, broken, or lost condition. More than half of the visual aids in the home are not fit for purpose. Children cannot learn, play, or function safely without working visual aids. This requires urgent and comprehensive replacement.`,
      severity: "critical",
    });
  }

  if (correctUsageRate < 30 && totalPrescriptionRecords > 0) {
    insights.push({
      text: `Only ${correctUsageRate}% of children are using their prescriptions correctly. The vast majority of prescribed visual corrections are not being used as intended, meaning children's vision is not being corrected despite prescriptions being in place. This requires a whole-home approach to understanding and removing barriers.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    eyeTestComplianceRate >= 50 &&
    eyeTestComplianceRate < 70 &&
    totalEyeTestRecords > 0
  ) {
    insights.push({
      text: `Eye test compliance at ${eyeTestComplianceRate}% — improving but inconsistent. Some children are not fully engaging with eye tests or follow-up scheduling is incomplete. Review individual barriers to full compliance.`,
      severity: "warning",
    });
  }

  if (
    prescriptionManagementRate >= 50 &&
    prescriptionManagementRate < 70 &&
    totalPrescriptionRecords > 0
  ) {
    insights.push({
      text: `Prescription management at ${prescriptionManagementRate}% — some prescriptions are not being fully managed. Children may have prescriptions that are not dispensed, aids that are not comfortable, or reviews that are overdue.`,
      severity: "warning",
    });
  }

  if (
    opticianReferralRate >= 50 &&
    opticianReferralRate < 70 &&
    totalReferralRecords > 0
  ) {
    insights.push({
      text: `Optician referral management at ${opticianReferralRate}% — some referrals are not being fully tracked through to completion. Communication gaps may mean parents, carers, or social workers are not informed of referral outcomes.`,
      severity: "warning",
    });
  }

  if (
    visualAidRate >= 50 &&
    visualAidRate < 70 &&
    totalVisualAidRecords > 0
  ) {
    insights.push({
      text: `Visual aid provision at ${visualAidRate}% — some visual aids need attention. Children may have aids that are not in optimal condition, not comfortable, or not fully suitable for their current needs.`,
      severity: "warning",
    });
  }

  if (
    childEngagementRate >= 40 &&
    childEngagementRate < 70 &&
    totalEngagementRecords > 0
  ) {
    insights.push({
      text: `Child engagement with eye care at ${childEngagementRate}% — some children are not actively participating in their eye health care. Consider whether approaches are age-appropriate and whether children need additional preparation or support.`,
      severity: "warning",
    });
  }

  if (
    followUpRate >= 50 &&
    followUpRate < 70 &&
    followUpDenominator > 0
  ) {
    insights.push({
      text: `Follow-up completion at ${followUpRate}% — some required follow-up appointments are being missed. Incomplete follow-through means vision conditions may not be adequately monitored or managed.`,
      severity: "warning",
    });
  }

  if (
    aidPoorConditionRate > 20 &&
    aidPoorConditionRate <= 50 &&
    totalVisualAidRecords > 0
  ) {
    insights.push({
      text: `${aidPoorConditionRate}% of visual aids are in poor, broken, or lost condition — a notable proportion of aids need replacing. Children's visual support should not be compromised by equipment condition.`,
      severity: "warning",
    });
  }

  if (
    aidCheckOverdueRate > 20 &&
    totalVisualAidRecords > 0
  ) {
    insights.push({
      text: `${aidCheckOverdueRate}% of visual aid checks are overdue — aids that are not regularly checked may become unsuitable or unsafe. Establish a routine schedule for visual aid condition and suitability reviews.`,
      severity: "warning",
    });
  }

  if (
    (avgWaitingTime ?? 0) > 28 &&
    (avgWaitingTime ?? 0) <= 42 &&
    totalReferralRecords > 0
  ) {
    insights.push({
      text: `Average referral waiting time is ${avgWaitingTime} days — while within reasonable limits, children with vision concerns benefit from prompt assessment. Monitor waiting times and escalate if they increase.`,
      severity: "warning",
    });
  }

  if (
    schoolNotifiedRate >= 50 &&
    schoolNotifiedRate < 80 &&
    totalVisualAidRecords > 0
  ) {
    insights.push({
      text: `${schoolNotifiedRate}% school notification rate — not all schools are aware of children's visual aids. Without school awareness, classroom accommodations may not be made and visual aid use may not be supported during the school day.`,
      severity: "warning",
    });
  }

  // Referral reason analysis
  const referralReasons: Record<string, number> = {};
  for (const r of optician_referral_records) {
    referralReasons[r.referral_reason] = (referralReasons[r.referral_reason] ?? 0) + 1;
  }
  const topReasons = Object.entries(referralReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topReasons.length > 0) {
    const formatted = topReasons
      .map(([reason, count]) => `${reason.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common referral reasons: ${formatted}. Understanding referral patterns helps identify whether preventive eye health measures are working or whether certain vision issues are prevalent across the home.`,
      severity: "warning",
    });
  }

  // Visual aid type analysis
  const aidTypes: Record<string, number> = {};
  for (const a of visual_aid_records) {
    aidTypes[a.aid_type] = (aidTypes[a.aid_type] ?? 0) + 1;
  }
  const topAidTypes = Object.entries(aidTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topAidTypes.length > 0) {
    const formatted = topAidTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common visual aids: ${formatted}. Understanding the range of visual aids in use helps ensure the home has appropriate support infrastructure and staff competence to manage diverse vision care needs.`,
      severity: "warning",
    });
  }

  // Engagement type analysis
  const engagementTypes: Record<string, number> = {};
  for (const e of child_engagement_records) {
    engagementTypes[e.engagement_type] = (engagementTypes[e.engagement_type] ?? 0) + 1;
  }
  const topEngagementTypes = Object.entries(engagementTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topEngagementTypes.length > 0) {
    const formatted = topEngagementTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common engagement activities: ${formatted}. A balanced mix of engagement types ensures children receive holistic eye health support covering preparation, education, feedback, and choice-making.`,
      severity: "warning",
    });
  }

  // Prescription type analysis
  const prescriptionTypes: Record<string, number> = {};
  for (const p of prescription_records) {
    prescriptionTypes[p.prescription_type] = (prescriptionTypes[p.prescription_type] ?? 0) + 1;
  }
  const topPrescriptionTypes = Object.entries(prescriptionTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topPrescriptionTypes.length > 0) {
    const formatted = topPrescriptionTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most common prescription types: ${formatted}. Understanding the prescription profile of children in the home helps staff anticipate support needs and ensure appropriate resources are available.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (eye_health_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding eye health and vision care management — children attend eye tests consistently, prescriptions are managed effectively, visual aids are well maintained, referrals are tracked through to completion, and children are actively engaged in their eye care. This is strong evidence for Reg 14 and Reg 5 compliance.",
      severity: "positive",
    });
  }

  if (
    eyeTestComplianceRate >= 90 &&
    prescriptionManagementRate >= 90 &&
    totalEyeTestRecords > 0 &&
    totalPrescriptionRecords > 0
  ) {
    insights.push({
      text: `${eyeTestComplianceRate}% eye test compliance with ${prescriptionManagementRate}% prescription management — the combination of thorough eye testing and effective prescription follow-through demonstrates comprehensive vision care that ensures children's sight is monitored and corrected.`,
      severity: "positive",
    });
  }

  if (
    visualAidRate >= 90 &&
    aidSuitabilityRate >= 90 &&
    totalVisualAidRecords > 0
  ) {
    insights.push({
      text: `${visualAidRate}% visual aid provision with ${aidSuitabilityRate}% suitability — visual aids are well maintained, appropriate for children's needs, and effectively supporting their daily vision requirements. This proactive approach prevents unnecessary barriers to learning and activities.`,
      severity: "positive",
    });
  }

  if (
    childEngagementRate >= 90 &&
    positiveExperienceRate >= 85 &&
    totalEngagementRecords > 0
  ) {
    insights.push({
      text: `${childEngagementRate}% child engagement with ${positiveExperienceRate}% positive experiences — children actively participate in their eye health care, their views are valued, and interactions are consistently positive. This reflects genuinely child-centred, accessible practice.`,
      severity: "positive",
    });
  }

  if (
    opticianReferralRate >= 90 &&
    referralAttendanceRate >= 90 &&
    totalReferralRecords > 0
  ) {
    insights.push({
      text: `${opticianReferralRate}% referral management with ${referralAttendanceRate}% attendance — optician referrals are comprehensively managed from initiation through to appointment, with strong multi-agency communication ensuring continuity of care.`,
      severity: "positive",
    });
  }

  if (
    followUpRate >= 90 &&
    followUpDenominator > 0
  ) {
    insights.push({
      text: `${followUpRate}% follow-up completion — the home ensures complete continuity of eye health care through consistent follow-up. This prevents vision conditions from deteriorating and demonstrates robust health care tracking.`,
      severity: "positive",
    });
  }

  if (
    eyeTestAttendanceRate >= 95 &&
    nextTestScheduledRate >= 90 &&
    totalEyeTestRecords > 0
  ) {
    insights.push({
      text: `${eyeTestAttendanceRate}% eye test attendance with ${nextTestScheduledRate}% next appointments scheduled — the home maintains an excellent cycle of vision monitoring, ensuring no child falls behind on their eye health assessments.`,
      severity: "positive",
    });
  }

  if (
    correctUsageRate >= 90 &&
    comfortRate >= 85 &&
    totalPrescriptionRecords > 0
  ) {
    insights.push({
      text: `${correctUsageRate}% correct prescription usage with ${comfortRate}% comfort — children are successfully using their prescribed visual aids and finding them comfortable. This indicates effective support and well-fitted prescriptions.`,
      severity: "positive",
    });
  }

  if (
    schoolNotifiedRate >= 90 &&
    totalVisualAidRecords > 0
  ) {
    insights.push({
      text: `${schoolNotifiedRate}% school notification — excellent cross-setting communication ensures children's vision needs are supported consistently at school and at home. This collaborative approach maximises the benefit of visual aids.`,
      severity: "positive",
    });
  }

  if (
    independenceRate >= 85 &&
    choiceMakingRate >= 80 &&
    totalEngagementRecords > 0
  ) {
    insights.push({
      text: `${independenceRate}% independence promotion with ${choiceMakingRate}% choice-making — children are developing autonomous eye health management skills. This prepares them for independent living and embeds lifelong vision care habits.`,
      severity: "positive",
    });
  }

  if (
    replacementArrangedRate >= 90 &&
    spareAvailableRate >= 80 &&
    replacementNeeded > 0 &&
    totalVisualAidRecords > 0
  ) {
    insights.push({
      text: `${replacementArrangedRate}% replacements arranged with ${spareAvailableRate}% spares available — the home ensures children are never without working visual aids through prompt replacement and forward planning with spare provision.`,
      severity: "positive",
    });
  }

  if (
    urgentReferralAttendanceRate >= 95 &&
    urgentReferrals > 0
  ) {
    insights.push({
      text: `${urgentReferralAttendanceRate}% urgent referral attendance — the home responds swiftly and effectively to urgent eye health concerns, ensuring children receive timely clinical attention for critical vision issues.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (eye_health_rating === "outstanding") {
    headline =
      "Outstanding eye health and vision care management — children attend eye tests consistently, prescriptions are managed effectively, visual aids are well maintained, and children are actively engaged in their eye care.";
  } else if (eye_health_rating === "good") {
    headline = `Good eye health and vision care management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (eye_health_rating === "adequate") {
    headline = `Adequate eye health and vision care management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's vision care needs are consistently met.`;
  } else {
    headline = `Eye health and vision care management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's eye health is properly managed.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    eye_health_rating,
    eye_health_score: score,
    headline,
    total_eye_test_records: totalEyeTestRecords,
    total_prescription_records: totalPrescriptionRecords,
    total_referral_records: totalReferralRecords,
    total_visual_aid_records: totalVisualAidRecords,
    total_engagement_records: totalEngagementRecords,
    eye_test_compliance_rate: eyeTestComplianceRate,
    prescription_management_rate: prescriptionManagementRate,
    optician_referral_rate: opticianReferralRate,
    visual_aid_rate: visualAidRate,
    child_engagement_rate: childEngagementRate,
    follow_up_rate: followUpRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
