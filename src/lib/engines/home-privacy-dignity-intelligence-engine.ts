// ==============================================================================
// CORNERSTONE -- HOME PRIVACY & DIGNITY INTELLIGENCE ENGINE
// Tracks how well the home respects children's privacy and dignity -- private
// space provision, knock-before-entry compliance, personal boundary respect,
// confidentiality of records, and dignity in care practices.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Quality of care), Reg 7 (Children's views), Reg 10 (Privacy),
// Reg 21 (Privacy and confidentiality), SCCIF "Experiences and progress".
// Store keys: privacyAuditRecords, knockEntryRecords, boundaryRespectRecords,
//             confidentialityRecords, dignityCareRecords
// ==============================================================================

// -- Input Types --------------------------------------------------------------

export interface PrivacyAuditRecordInput {
  id: string;
  child_id: string;
  date: string;
  private_space_available: boolean;
  private_space_adequate: boolean;
  lock_on_bedroom_door: boolean;
  lock_functional: boolean;
  personal_storage_provided: boolean;
  personal_storage_lockable: boolean;
  bathroom_privacy_adequate: boolean;
  phone_call_privacy: boolean;
  correspondence_privacy: boolean;
  private_meeting_space_available: boolean;
  child_satisfaction: number; // 1-5
  issues_identified: string[];
  issues_resolved: number;
  auditor: string;
  notes: string;
  created_at: string;
}

export interface KnockEntryRecordInput {
  id: string;
  child_id: string;
  date: string;
  staff_member: string;
  knocked_before_entry: boolean;
  waited_for_response: boolean;
  child_consent_obtained: boolean;
  reason_for_entry: "routine_check" | "welfare_concern" | "emergency" | "requested_by_child" | "medication" | "other";
  time_of_day: "morning" | "afternoon" | "evening" | "night";
  child_complaint_raised: boolean;
  complaint_resolved: boolean;
  override_justified: boolean; // if entry without consent, was it justified?
  notes: string;
  created_at: string;
}

export interface BoundaryRespectRecordInput {
  id: string;
  child_id: string;
  date: string;
  boundary_type: "physical" | "emotional" | "social" | "digital" | "spatial" | "communication";
  boundary_respected: boolean;
  boundary_documented_in_plan: boolean;
  staff_aware_of_boundary: boolean;
  child_communicated_boundary: boolean;
  staff_member: string;
  breach_occurred: boolean;
  breach_severity: "minor" | "moderate" | "serious" | "none";
  breach_addressed: boolean;
  child_satisfaction: number; // 1-5
  restorative_action_taken: boolean;
  notes: string;
  created_at: string;
}

export interface ConfidentialityRecordInput {
  id: string;
  child_id: string;
  date: string;
  record_type: "care_plan" | "health_record" | "education_record" | "incident_report" | "assessment" | "correspondence" | "other";
  stored_securely: boolean;
  access_controlled: boolean;
  shared_appropriately: boolean;
  consent_for_sharing_obtained: boolean;
  child_informed_of_sharing: boolean;
  breach_occurred: boolean;
  breach_severity: "minor" | "moderate" | "serious" | "none";
  breach_reported: boolean;
  breach_resolved: boolean;
  data_minimisation_applied: boolean;
  child_has_access_to_own_records: boolean;
  notes: string;
  created_at: string;
}

export interface DignityCareRecordInput {
  id: string;
  child_id: string;
  date: string;
  care_type: "personal_care" | "health_appointment" | "medication" | "emotional_support" | "daily_routine" | "mealtime" | "bedtime" | "other";
  dignity_maintained: boolean;
  child_choice_offered: boolean;
  child_preference_followed: boolean;
  age_appropriate_approach: boolean;
  cultural_sensitivity_shown: boolean;
  same_gender_carer_requested: boolean;
  same_gender_carer_provided: boolean;
  child_consent_obtained: boolean;
  child_satisfaction: number; // 1-5
  staff_member: string;
  complaint_raised: boolean;
  complaint_resolved: boolean;
  notes: string;
  created_at: string;
}

export interface PrivacyDignityInput {
  today: string;
  total_children: number;
  privacy_audit_records: PrivacyAuditRecordInput[];
  knock_entry_records: KnockEntryRecordInput[];
  boundary_respect_records: BoundaryRespectRecordInput[];
  confidentiality_records: ConfidentialityRecordInput[];
  dignity_care_records: DignityCareRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type PrivacyDignityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PrivacyDignityInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface PrivacyDignityRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface PrivacyDignityResult {
  privacy_rating: PrivacyDignityRating;
  privacy_score: number;
  headline: string;
  privacy_audit_compliance_rate: number;
  knock_entry_rate: number;
  boundary_respect_rate: number;
  confidentiality_rate: number;
  dignity_practice_rate: number;
  child_satisfaction_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: PrivacyDignityRecommendation[];
  insights: PrivacyDignityInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PrivacyDignityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: PrivacyDignityRating,
  score: number,
  headline: string,
): PrivacyDignityResult {
  return {
    privacy_rating: rating,
    privacy_score: score,
    headline,
    privacy_audit_compliance_rate: 0,
    knock_entry_rate: 0,
    boundary_respect_rate: 0,
    confidentiality_rate: 0,
    dignity_practice_rate: 0,
    child_satisfaction_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computePrivacyDignity(
  input: PrivacyDignityInput,
): PrivacyDignityResult {
  const {
    total_children,
    privacy_audit_records,
    knock_entry_records,
    boundary_respect_records,
    confidentiality_records,
    dignity_care_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    privacy_audit_records.length === 0 &&
    knock_entry_records.length === 0 &&
    boundary_respect_records.length === 0 &&
    confidentiality_records.length === 0 &&
    dignity_care_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess privacy and dignity.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No privacy or dignity data recorded despite children on placement -- privacy audits, knock-before-entry compliance, boundary respect, confidentiality, and dignity in care practices require urgent attention.",
      ),
      concerns: [
        "No privacy audit, knock-before-entry, boundary respect, confidentiality, or dignity care records exist despite children being on placement -- the home cannot evidence that children's privacy and dignity are being respected and protected.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of privacy audits, knock-before-entry compliance, personal boundary respect, record confidentiality, and dignity in care practices to evidence the home's commitment to children's privacy and dignity rights.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 10 -- Privacy of children in children's homes",
        },
        {
          rank: 2,
          recommendation:
            "Conduct an immediate privacy audit of all children's living spaces, ensuring private space, locks, secure storage, and bathroom privacy are adequate. Document each child's privacy needs and preferences in their care plan.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 21 -- Privacy and confidentiality",
        },
      ],
      insights: [
        {
          text: "The complete absence of privacy and dignity records means Ofsted cannot verify that children's fundamental rights to privacy, confidentiality, and dignified care are being upheld. This represents a critical gap in Reg 10 and Reg 21 compliance and undermines the home's ability to demonstrate quality of care under Reg 5.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Privacy audit compliance ---
  const totalPrivacyAudits = privacy_audit_records.length;
  const privacyCompliantAudits = privacy_audit_records.filter(
    (r) =>
      r.private_space_available &&
      r.private_space_adequate &&
      r.bathroom_privacy_adequate &&
      r.personal_storage_provided,
  ).length;
  const privacyAuditComplianceRate = pct(privacyCompliantAudits, totalPrivacyAudits);

  const lockFunctionalCount = privacy_audit_records.filter(
    (r) => r.lock_on_bedroom_door && r.lock_functional,
  ).length;
  const lockComplianceRate = pct(lockFunctionalCount, totalPrivacyAudits);

  const lockableStorageCount = privacy_audit_records.filter(
    (r) => r.personal_storage_lockable,
  ).length;
  const lockableStorageRate = pct(lockableStorageCount, totalPrivacyAudits);

  const phonePrivacyCount = privacy_audit_records.filter(
    (r) => r.phone_call_privacy,
  ).length;
  const phonePrivacyRate = pct(phonePrivacyCount, totalPrivacyAudits);

  const correspondencePrivacyCount = privacy_audit_records.filter(
    (r) => r.correspondence_privacy,
  ).length;
  const correspondencePrivacyRate = pct(correspondencePrivacyCount, totalPrivacyAudits);

  const privateMeetingCount = privacy_audit_records.filter(
    (r) => r.private_meeting_space_available,
  ).length;
  const privateMeetingRate = pct(privateMeetingCount, totalPrivacyAudits);

  const privacyAuditSatisfactionSum = privacy_audit_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const privacyAuditSatisfactionAvg =
    totalPrivacyAudits > 0
      ? Math.round((privacyAuditSatisfactionSum / totalPrivacyAudits) * 100) / 100
      : 0;

  const privacyIssuesTotal = privacy_audit_records.reduce(
    (sum, r) => sum + r.issues_identified.length, 0,
  );
  const privacyIssuesResolved = privacy_audit_records.reduce(
    (sum, r) => sum + r.issues_resolved, 0,
  );
  const privacyIssueResolutionRate = pct(privacyIssuesResolved, privacyIssuesTotal);

  const uniqueChildrenAudited = new Set(
    privacy_audit_records.map((r) => r.child_id),
  ).size;

  // --- Knock-before-entry compliance ---
  const totalKnockRecords = knock_entry_records.length;
  const knockedAndWaited = knock_entry_records.filter(
    (r) => r.knocked_before_entry && r.waited_for_response,
  ).length;
  const knockEntryRate = pct(knockedAndWaited, totalKnockRecords);

  const consentObtained = knock_entry_records.filter(
    (r) => r.child_consent_obtained,
  ).length;
  const consentRate = pct(consentObtained, totalKnockRecords);

  const nonConsentEntries = knock_entry_records.filter(
    (r) => !r.child_consent_obtained && !r.knocked_before_entry,
  );
  const unjustifiedOverrides = nonConsentEntries.filter(
    (r) => !r.override_justified,
  ).length;

  const knockComplaints = knock_entry_records.filter(
    (r) => r.child_complaint_raised,
  ).length;
  const knockComplaintRate = pct(knockComplaints, totalKnockRecords);

  const knockComplaintsResolved = knock_entry_records.filter(
    (r) => r.child_complaint_raised && r.complaint_resolved,
  ).length;
  const knockComplaintResolutionRate = pct(knockComplaintsResolved, knockComplaints);

  const nightEntries = knock_entry_records.filter(
    (r) => r.time_of_day === "night",
  );
  const nightKnockCompliance = nightEntries.filter(
    (r) => r.knocked_before_entry || r.reason_for_entry === "welfare_concern" || r.reason_for_entry === "emergency",
  ).length;
  const nightComplianceRate = pct(nightKnockCompliance, nightEntries.length);

  // --- Boundary respect ---
  const totalBoundaryRecords = boundary_respect_records.length;
  const boundariesRespected = boundary_respect_records.filter(
    (r) => r.boundary_respected,
  ).length;
  const boundaryRespectRate = pct(boundariesRespected, totalBoundaryRecords);

  const boundariesDocumented = boundary_respect_records.filter(
    (r) => r.boundary_documented_in_plan,
  ).length;
  const boundaryDocumentationRate = pct(boundariesDocumented, totalBoundaryRecords);

  const staffAwareOfBoundary = boundary_respect_records.filter(
    (r) => r.staff_aware_of_boundary,
  ).length;
  const staffAwarenessRate = pct(staffAwareOfBoundary, totalBoundaryRecords);

  const breachesOccurred = boundary_respect_records.filter(
    (r) => r.breach_occurred,
  ).length;
  const breachRate = pct(breachesOccurred, totalBoundaryRecords);

  const seriousBreaches = boundary_respect_records.filter(
    (r) => r.breach_occurred && (r.breach_severity === "serious" || r.breach_severity === "moderate"),
  ).length;

  const breachesAddressed = boundary_respect_records.filter(
    (r) => r.breach_occurred && r.breach_addressed,
  ).length;
  const breachAddressedRate = pct(breachesAddressed, breachesOccurred);

  const restorativeActions = boundary_respect_records.filter(
    (r) => r.breach_occurred && r.restorative_action_taken,
  ).length;
  const restorativeRate = pct(restorativeActions, breachesOccurred);

  const boundarySatisfactionSum = boundary_respect_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const boundarySatisfactionAvg =
    totalBoundaryRecords > 0
      ? Math.round((boundarySatisfactionSum / totalBoundaryRecords) * 100) / 100
      : 0;

  const childCommunicatedBoundary = boundary_respect_records.filter(
    (r) => r.child_communicated_boundary,
  ).length;
  const childBoundaryVoiceRate = pct(childCommunicatedBoundary, totalBoundaryRecords);

  // --- Confidentiality ---
  const totalConfidentialityRecords = confidentiality_records.length;
  const storedSecurely = confidentiality_records.filter(
    (r) => r.stored_securely && r.access_controlled,
  ).length;
  const secureStorageRate = pct(storedSecurely, totalConfidentialityRecords);

  const sharedAppropriately = confidentiality_records.filter(
    (r) => r.shared_appropriately,
  ).length;
  const appropriateSharingRate = pct(sharedAppropriately, totalConfidentialityRecords);

  const consentForSharing = confidentiality_records.filter(
    (r) => r.consent_for_sharing_obtained,
  ).length;
  const sharingConsentRate = pct(consentForSharing, totalConfidentialityRecords);

  const childInformedOfSharing = confidentiality_records.filter(
    (r) => r.child_informed_of_sharing,
  ).length;
  const childInformedRate = pct(childInformedOfSharing, totalConfidentialityRecords);

  const confidentialityBreaches = confidentiality_records.filter(
    (r) => r.breach_occurred,
  ).length;
  const confidentialityBreachRate = pct(confidentialityBreaches, totalConfidentialityRecords);

  const seriousConfBreaches = confidentiality_records.filter(
    (r) => r.breach_occurred && (r.breach_severity === "serious" || r.breach_severity === "moderate"),
  ).length;

  const confBreachesReported = confidentiality_records.filter(
    (r) => r.breach_occurred && r.breach_reported,
  ).length;
  const confBreachReportRate = pct(confBreachesReported, confidentialityBreaches);

  const confBreachesResolved = confidentiality_records.filter(
    (r) => r.breach_occurred && r.breach_resolved,
  ).length;
  const confBreachResolutionRate = pct(confBreachesResolved, confidentialityBreaches);

  const dataMinimisation = confidentiality_records.filter(
    (r) => r.data_minimisation_applied,
  ).length;
  const dataMinimisationRate = pct(dataMinimisation, totalConfidentialityRecords);

  const childRecordAccess = confidentiality_records.filter(
    (r) => r.child_has_access_to_own_records,
  ).length;
  const childRecordAccessRate = pct(childRecordAccess, totalConfidentialityRecords);

  const confidentialityRate =
    totalConfidentialityRecords > 0
      ? Math.round((secureStorageRate + appropriateSharingRate + sharingConsentRate) / 3)
      : 0;

  // --- Dignity in care ---
  const totalDignityRecords = dignity_care_records.length;
  const dignityMaintained = dignity_care_records.filter(
    (r) => r.dignity_maintained,
  ).length;
  const dignityPracticeRate = pct(dignityMaintained, totalDignityRecords);

  const choiceOffered = dignity_care_records.filter(
    (r) => r.child_choice_offered,
  ).length;
  const choiceRate = pct(choiceOffered, totalDignityRecords);

  const preferenceFollowed = dignity_care_records.filter(
    (r) => r.child_preference_followed,
  ).length;
  const preferenceRate = pct(preferenceFollowed, totalDignityRecords);

  const ageAppropriate = dignity_care_records.filter(
    (r) => r.age_appropriate_approach,
  ).length;
  const ageAppropriateRate = pct(ageAppropriate, totalDignityRecords);

  const culturalSensitivity = dignity_care_records.filter(
    (r) => r.cultural_sensitivity_shown,
  ).length;
  const culturalSensitivityRate = pct(culturalSensitivity, totalDignityRecords);

  const sameGenderRequested = dignity_care_records.filter(
    (r) => r.same_gender_carer_requested,
  );
  const sameGenderProvided = sameGenderRequested.filter(
    (r) => r.same_gender_carer_provided,
  ).length;
  const sameGenderRate = pct(sameGenderProvided, sameGenderRequested.length);

  const dignityConsentObtained = dignity_care_records.filter(
    (r) => r.child_consent_obtained,
  ).length;
  const dignityConsentRate = pct(dignityConsentObtained, totalDignityRecords);

  const dignitySatisfactionSum = dignity_care_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const dignitySatisfactionAvg =
    totalDignityRecords > 0
      ? Math.round((dignitySatisfactionSum / totalDignityRecords) * 100) / 100
      : 0;

  const dignityComplaints = dignity_care_records.filter(
    (r) => r.complaint_raised,
  ).length;
  const dignityComplaintRate = pct(dignityComplaints, totalDignityRecords);

  const dignityComplaintsResolved = dignity_care_records.filter(
    (r) => r.complaint_raised && r.complaint_resolved,
  ).length;
  const dignityComplaintResolutionRate = pct(dignityComplaintsResolved, dignityComplaints);

  // --- Child satisfaction composite ---
  const satisfactionDenominator = totalPrivacyAudits + totalBoundaryRecords + totalDignityRecords;
  const satisfactionNumerator =
    privacy_audit_records.filter((r) => r.child_satisfaction >= 4).length +
    boundary_respect_records.filter((r) => r.child_satisfaction >= 4).length +
    dignity_care_records.filter((r) => r.child_satisfaction >= 4).length;
  const childSatisfactionRate = pct(satisfactionNumerator, satisfactionDenominator);

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: privacyAuditComplianceRate (>=90: +4, >=70: +2) ---
  if (privacyAuditComplianceRate >= 90) score += 4;
  else if (privacyAuditComplianceRate >= 70) score += 2;

  // --- Bonus 2: knockEntryRate (>=95: +4, >=80: +2) ---
  if (knockEntryRate >= 95) score += 4;
  else if (knockEntryRate >= 80) score += 2;

  // --- Bonus 3: boundaryRespectRate (>=90: +3, >=70: +1) ---
  if (boundaryRespectRate >= 90) score += 3;
  else if (boundaryRespectRate >= 70) score += 1;

  // --- Bonus 4: confidentialityRate (>=90: +4, >=70: +2) ---
  if (confidentialityRate >= 90) score += 4;
  else if (confidentialityRate >= 70) score += 2;

  // --- Bonus 5: dignityPracticeRate (>=90: +3, >=70: +1) ---
  if (dignityPracticeRate >= 90) score += 3;
  else if (dignityPracticeRate >= 70) score += 1;

  // --- Bonus 6: childSatisfactionRate (>=80: +3, >=60: +1) ---
  if (childSatisfactionRate >= 80) score += 3;
  else if (childSatisfactionRate >= 60) score += 1;

  // --- Bonus 7: lockComplianceRate (>=90: +3, >=70: +1) ---
  if (lockComplianceRate >= 90) score += 3;
  else if (lockComplianceRate >= 70) score += 1;

  // --- Bonus 8: sameGenderRate (>=90: +2, >=70: +1) ---
  if (sameGenderRate >= 90) score += 2;
  else if (sameGenderRate >= 70) score += 1;

  // --- Bonus 9: childRecordAccessRate (>=80: +2, >=60: +1) ---
  if (childRecordAccessRate >= 80) score += 2;
  else if (childRecordAccessRate >= 60) score += 1;

  // -- Penalties (4 with guards) -------------------------------------------

  // knockEntryRate < 50 -> -5
  if (knockEntryRate < 50 && knock_entry_records.length > 0) score -= 5;

  // boundaryRespectRate < 50 -> -5
  if (boundaryRespectRate < 50 && boundary_respect_records.length > 0) score -= 5;

  // confidentialityRate < 50 -> -4
  if (confidentialityRate < 50 && confidentiality_records.length > 0) score -= 4;

  // dignityPracticeRate < 50 -> -4
  if (dignityPracticeRate < 50 && dignity_care_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const privacy_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (privacyAuditComplianceRate >= 90 && totalPrivacyAudits > 0) {
    strengths.push(
      `${privacyAuditComplianceRate}% of privacy audits fully compliant -- children have adequate private space, bathroom privacy, and personal storage. The home demonstrates strong commitment to children's right to privacy.`,
    );
  } else if (privacyAuditComplianceRate >= 70 && totalPrivacyAudits > 0) {
    strengths.push(
      `${privacyAuditComplianceRate}% privacy audit compliance -- most children's living spaces meet privacy standards with adequate private areas and personal storage.`,
    );
  }

  if (lockComplianceRate >= 90 && lockableStorageRate >= 90 && totalPrivacyAudits > 0) {
    strengths.push(
      `${lockComplianceRate}% functional bedroom locks and ${lockableStorageRate}% lockable storage -- children can control access to their personal space and keep belongings secure.`,
    );
  } else if (lockComplianceRate >= 90 && totalPrivacyAudits > 0) {
    strengths.push(
      `${lockComplianceRate}% of children have functional locks on bedroom doors -- children can control access to their personal space.`,
    );
  }

  if (phonePrivacyRate >= 90 && correspondencePrivacyRate >= 90 && totalPrivacyAudits > 0) {
    strengths.push(
      `Phone call privacy at ${phonePrivacyRate}% and correspondence privacy at ${correspondencePrivacyRate}% -- children's communications are not monitored or intercepted without consent.`,
    );
  }

  if (privacyAuditSatisfactionAvg >= 4.0 && totalPrivacyAudits > 0) {
    strengths.push(
      `Children's satisfaction with privacy provision averages ${privacyAuditSatisfactionAvg}/5 -- children feel their privacy is genuinely respected.`,
    );
  }

  if (knockEntryRate >= 95 && totalKnockRecords > 0) {
    strengths.push(
      `${knockEntryRate}% knock-before-entry compliance with waiting for response -- staff consistently respect children's personal space and right to control who enters their room.`,
    );
  } else if (knockEntryRate >= 80 && totalKnockRecords > 0) {
    strengths.push(
      `${knockEntryRate}% knock-before-entry compliance -- strong culture of respecting children's private space with appropriate entry protocols.`,
    );
  }

  if (consentRate >= 90 && nightComplianceRate >= 90 && totalKnockRecords > 0 && nightEntries.length > 0) {
    strengths.push(
      `Consent obtained in ${consentRate}% of entries with ${nightComplianceRate}% night-time compliance -- staff respect children's autonomy around the clock, including during welfare checks.`,
    );
  } else if (consentRate >= 90 && totalKnockRecords > 0) {
    strengths.push(
      `Child consent obtained in ${consentRate}% of room entries -- staff demonstrate genuine respect for children's autonomy.`,
    );
  }

  if (boundaryRespectRate >= 90 && totalBoundaryRecords > 0) {
    strengths.push(
      `${boundaryRespectRate}% of personal boundaries respected -- staff consistently honour children's physical, emotional, and social boundaries.`,
    );
  } else if (boundaryRespectRate >= 70 && totalBoundaryRecords > 0) {
    strengths.push(
      `${boundaryRespectRate}% boundary respect rate -- most children's personal boundaries are being honoured by staff.`,
    );
  }

  if (boundaryDocumentationRate >= 90 && staffAwarenessRate >= 90 && totalBoundaryRecords > 0) {
    strengths.push(
      `${boundaryDocumentationRate}% boundary documentation with ${staffAwarenessRate}% staff awareness -- boundaries are formally recorded and staff consistently know each child's limits.`,
    );
  }

  if (breachesOccurred === 0 && totalBoundaryRecords > 0) {
    strengths.push(
      "Zero boundary breaches recorded -- staff demonstrate excellent awareness and respect for children's personal boundaries across all domains.",
    );
  }

  if (breachAddressedRate >= 90 && restorativeRate >= 80 && breachesOccurred > 0) {
    strengths.push(
      `${breachAddressedRate}% of breaches addressed with ${restorativeRate}% restorative action -- the home responds promptly to boundary violations and prioritises relationship repair.`,
    );
  }

  if (secureStorageRate >= 90 && totalConfidentialityRecords > 0) {
    strengths.push(
      `${secureStorageRate}% of records stored securely with controlled access -- children's confidential information is properly protected.`,
    );
  }

  if (appropriateSharingRate >= 90 && sharingConsentRate >= 90 && totalConfidentialityRecords > 0) {
    strengths.push(
      `Information shared appropriately in ${appropriateSharingRate}% of cases with consent obtained in ${sharingConsentRate}% -- children are actively involved in decisions about who sees their records.`,
    );
  }

  if (childRecordAccessRate >= 80 && totalConfidentialityRecords > 0) {
    strengths.push(
      `${childRecordAccessRate}% of children have access to their own records -- the home supports children's right to know what is written about them.`,
    );
  }

  if (confidentialityBreaches === 0 && dataMinimisationRate >= 90 && totalConfidentialityRecords > 0) {
    strengths.push(
      "Zero confidentiality breaches with strong data minimisation -- the home maintains excellent information governance and only records what is necessary.",
    );
  } else if (confidentialityBreaches === 0 && totalConfidentialityRecords > 0) {
    strengths.push(
      "Zero confidentiality breaches recorded -- the home maintains strong information governance and data protection standards.",
    );
  }

  if (dignityPracticeRate >= 90 && totalDignityRecords > 0) {
    strengths.push(
      `Dignity maintained in ${dignityPracticeRate}% of care interactions -- staff consistently deliver care that preserves children's self-respect and sense of worth.`,
    );
  } else if (dignityPracticeRate >= 70 && totalDignityRecords > 0) {
    strengths.push(
      `${dignityPracticeRate}% dignity practice rate -- most care interactions preserve children's dignity and self-respect.`,
    );
  }

  if (choiceRate >= 90 && preferenceRate >= 90 && totalDignityRecords > 0) {
    strengths.push(
      `Child choice offered in ${choiceRate}% and preferences followed in ${preferenceRate}% of care interactions -- children are genuinely empowered in decisions about their own care.`,
    );
  }

  if (ageAppropriateRate >= 90 && culturalSensitivityRate >= 90 && totalDignityRecords > 0) {
    strengths.push(
      `Age-appropriate approaches at ${ageAppropriateRate}% with ${culturalSensitivityRate}% cultural sensitivity -- care delivery is tailored to each child's developmental stage and cultural background.`,
    );
  }

  if (sameGenderRate >= 90 && sameGenderRequested.length > 0) {
    strengths.push(`Same-gender carer provided in ${sameGenderRate}% of requests -- children's gender preferences for personal care are consistently honoured.`);
  }

  if (dignityConsentRate >= 90 && dignitySatisfactionAvg >= 4.0 && totalDignityRecords > 0) {
    strengths.push(
      `Consent obtained in ${dignityConsentRate}% of care interactions with satisfaction averaging ${dignitySatisfactionAvg}/5 -- children feel respected and in control of their care.`,
    );
  }

  if (childSatisfactionRate >= 80 && satisfactionDenominator > 0) {
    strengths.push(`${childSatisfactionRate}% of children report high satisfaction (4+/5) with privacy and dignity -- children feel their rights are genuinely upheld.`);
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (privacyAuditComplianceRate < 50 && totalPrivacyAudits > 0) {
    concerns.push(
      `Only ${privacyAuditComplianceRate}% of privacy audits compliant -- the majority of children lack adequate private space, bathroom privacy, or personal storage. This is a fundamental failure to protect children's right to privacy.`,
    );
  } else if (privacyAuditComplianceRate < 70 && privacyAuditComplianceRate >= 50 && totalPrivacyAudits > 0) {
    concerns.push(
      `Privacy audit compliance at ${privacyAuditComplianceRate}% -- some children's living spaces do not meet privacy standards.`,
    );
  }

  if (lockComplianceRate < 50 && totalPrivacyAudits > 0) {
    concerns.push(
      `Only ${lockComplianceRate}% of children have functional bedroom door locks -- children cannot control access to their personal space, undermining their sense of safety and autonomy.`,
    );
  }

  if (lockableStorageRate < 50 && totalPrivacyAudits > 0) {
    concerns.push(
      `Only ${lockableStorageRate}% of children have lockable personal storage -- children cannot keep their personal belongings secure, eroding trust and privacy.`,
    );
  }

  if (privacyAuditSatisfactionAvg < 3.0 && totalPrivacyAudits > 0) {
    concerns.push(
      `Children's satisfaction with privacy provision averages only ${privacyAuditSatisfactionAvg}/5 -- children do not feel their privacy is adequately respected.`,
    );
  }

  if (privacyIssuesTotal > 0 && privacyIssueResolutionRate < 50) {
    concerns.push(
      `Only ${privacyIssueResolutionRate}% of privacy audit issues resolved -- identified problems are not being addressed, leaving children's privacy compromised.`,
    );
  }

  if (knockEntryRate < 50 && totalKnockRecords > 0) {
    concerns.push(
      `Only ${knockEntryRate}% knock-before-entry compliance -- staff are routinely entering children's rooms without knocking and waiting. This is a serious violation of children's privacy and can cause distress, anxiety, and a loss of trust.`,
    );
  } else if (knockEntryRate < 80 && knockEntryRate >= 50 && totalKnockRecords > 0) {
    concerns.push(
      `Knock-before-entry compliance at ${knockEntryRate}% -- too many room entries without proper knock-and-wait protocols.`,
    );
  }

  if (unjustifiedOverrides > 0) {
    concerns.push(
      `${unjustifiedOverrides} unjustified room entries without consent or knocking -- entries without child consent must have documented justification; unjustified entries breach children's privacy rights.`,
    );
  }

  if (knockComplaintRate >= 10 && totalKnockRecords > 0) {
    concerns.push(
      `${knockComplaintRate}% complaint rate about room entries -- children are raising concerns about how staff enter their private space.`,
    );
  }

  if (boundaryRespectRate < 50 && totalBoundaryRecords > 0) {
    concerns.push(
      `Only ${boundaryRespectRate}% of personal boundaries respected -- the majority of children's physical, emotional, and social boundaries are being violated. This is a fundamental failure to respect children's dignity and autonomy.`,
    );
  } else if (boundaryRespectRate < 70 && boundaryRespectRate >= 50 && totalBoundaryRecords > 0) {
    concerns.push(
      `Boundary respect at ${boundaryRespectRate}% -- too many children's personal boundaries are not being honoured by staff.`,
    );
  }

  if (seriousBreaches > 0) {
    concerns.push(
      `${seriousBreaches} moderate or serious boundary breach${seriousBreaches !== 1 ? "es" : ""} recorded -- serious violations of children's personal boundaries require immediate investigation and remedial action.`,
    );
  }

  if (boundaryDocumentationRate < 50 && totalBoundaryRecords > 0) {
    concerns.push(
      `Only ${boundaryDocumentationRate}% of children's boundaries documented in care plans -- without formal documentation, staff cannot consistently respect individual boundary needs.`,
    );
  }

  if (staffAwarenessRate < 60 && totalBoundaryRecords > 0) {
    concerns.push(
      `Staff aware of boundaries in only ${staffAwarenessRate}% of cases -- insufficient staff knowledge of children's boundary preferences increases the risk of unintentional violations.`,
    );
  }

  if (boundarySatisfactionAvg < 3.0 && totalBoundaryRecords > 0) {
    concerns.push(
      `Children's satisfaction with boundary respect averages only ${boundarySatisfactionAvg}/5 -- children do not feel their personal boundaries are being adequately honoured.`,
    );
  }

  if (secureStorageRate < 50 && totalConfidentialityRecords > 0) {
    concerns.push(
      `Only ${secureStorageRate}% of records stored securely with controlled access -- children's confidential information is at risk of unauthorised access or disclosure.`,
    );
  } else if (secureStorageRate < 80 && secureStorageRate >= 50 && totalConfidentialityRecords > 0) {
    concerns.push(
      `Secure storage rate at ${secureStorageRate}% -- some children's confidential records are not adequately protected.`,
    );
  }

  if (confidentialityBreachRate >= 10 && totalConfidentialityRecords > 0) {
    concerns.push(
      `Confidentiality breach rate at ${confidentialityBreachRate}% -- breaches of children's confidential information are occurring at an unacceptable rate.`,
    );
  }

  if (seriousConfBreaches > 0) {
    concerns.push(
      `${seriousConfBreaches} moderate or serious confidentiality breach${seriousConfBreaches !== 1 ? "es" : ""} recorded -- serious breaches of children's confidential information require urgent investigation and remedial action.`,
    );
  }

  if (sharingConsentRate < 50 && totalConfidentialityRecords > 0) {
    concerns.push(
      `Consent for information sharing obtained in only ${sharingConsentRate}% of cases -- children are not being given adequate say in who sees their personal information.`,
    );
  }

  if (childRecordAccessRate < 50 && totalConfidentialityRecords > 0) {
    concerns.push(
      `Only ${childRecordAccessRate}% of children have access to their own records -- children are being denied their right to see what is written about them.`,
    );
  }

  if (childInformedRate < 50 && totalConfidentialityRecords > 0) {
    concerns.push(
      `Children informed of information sharing in only ${childInformedRate}% of cases -- children are not being told when and with whom their information is shared.`,
    );
  }

  if (confidentialityRate < 50 && totalConfidentialityRecords > 0) {
    concerns.push(
      `Overall confidentiality rate at only ${confidentialityRate}% -- the home's information governance is failing to protect children's private information.`,
    );
  }

  if (dignityPracticeRate < 50 && totalDignityRecords > 0) {
    concerns.push(
      `Dignity maintained in only ${dignityPracticeRate}% of care interactions -- the majority of care delivery fails to preserve children's self-respect and sense of worth. This is a fundamental quality of care failure.`,
    );
  } else if (dignityPracticeRate < 70 && dignityPracticeRate >= 50 && totalDignityRecords > 0) {
    concerns.push(
      `Dignity practice rate at ${dignityPracticeRate}% -- too many care interactions are not preserving children's dignity.`,
    );
  }

  if (choiceRate < 50 && totalDignityRecords > 0) {
    concerns.push(
      `Child choice offered in only ${choiceRate}% of care interactions -- children are not being empowered to make decisions about their own care.`,
    );
  }

  if (sameGenderRate < 50 && sameGenderRequested.length > 0) {
    concerns.push(
      `Same-gender carer provided in only ${sameGenderRate}% of requests -- children's gender preferences for personal care are not being honoured, which can cause significant distress and undermine trust.`,
    );
  }

  if (dignitySatisfactionAvg < 3.0 && totalDignityRecords > 0) {
    concerns.push(
      `Children's satisfaction with dignity in care averages only ${dignitySatisfactionAvg}/5 -- children do not feel respected in how they are cared for.`,
    );
  }

  if (dignityComplaintRate >= 10 && totalDignityRecords > 0) {
    concerns.push(
      `${dignityComplaintRate}% complaint rate about dignity in care -- children are raising concerns about how care is delivered.`,
    );
  }

  if (totalPrivacyAudits === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No privacy audit records despite children being on placement -- the home has not assessed or documented whether children's living spaces meet privacy standards.",
    );
  }

  if (totalKnockRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No knock-before-entry records -- the home cannot evidence that staff respect children's private space through appropriate entry protocols.",
    );
  }

  if (totalConfidentialityRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No confidentiality records -- the home has not documented how children's records are stored, accessed, or shared.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: PrivacyDignityRecommendation[] = [];
  let rank = 0;

  if (knockEntryRate < 50 && knock_entry_records.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently reinforce knock-before-entry protocols with all staff -- every child has a right to control who enters their room. Implement retraining, observational audits, and consequences for non-compliance. Display knock-and-wait reminders outside every bedroom door.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 10 -- Privacy of children in children's homes",
    });
  }

  if (boundaryRespectRate < 50 && boundary_respect_records.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and address boundary violations -- ensure every child's boundaries are documented in their care plan, all staff are trained on individual boundary needs, and restorative action is taken after every breach. Boundary respect is fundamental to children's dignity and emotional safety.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care standard",
    });
  }

  if (confidentialityRate < 50 && confidentiality_records.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately strengthen information governance -- ensure all records are stored securely with controlled access, information is shared only with consent and on a need-to-know basis, and children are informed when their information is shared. Conduct a confidentiality audit across all record types.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 21 -- Privacy and confidentiality",
    });
  }

  if (dignityPracticeRate < 50 && dignity_care_records.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review dignity in all care practices -- ensure every care interaction offers choice, respects preferences, is age-appropriate, and preserves the child's self-respect. Implement dignity-focused supervision and practice observations.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care standard",
    });
  }

  if (privacyAuditComplianceRate < 50 && totalPrivacyAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct immediate remedial work on children's living spaces -- ensure every child has adequate private space, a functional bedroom door lock, lockable personal storage, and bathroom privacy. Prioritise the most deficient areas first.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 10 -- Privacy of children in children's homes",
    });
  }

  if (seriousBreaches > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate all moderate and serious boundary breaches -- identify root causes, implement targeted staff training, and ensure restorative action is taken with affected children. Escalate patterns of concern through safeguarding procedures.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care standard",
    });
  }

  if (seriousConfBreaches > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate all moderate and serious confidentiality breaches -- determine how breaches occurred, implement corrective measures, notify relevant parties, and review information governance procedures. Report breaches to the ICO where required.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 21 -- Privacy and confidentiality",
    });
  }

  if (unjustifiedOverrides > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all unjustified room entries and implement clear protocols defining when entry without consent is permissible. Staff must document the justification for every entry where consent is not obtained.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 10 -- Privacy of children in children's homes",
    });
  }

  if (lockComplianceRate < 70 && totalPrivacyAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Install or repair bedroom door locks for all children -- functional locks are essential for children to control access to their personal space. Where locks are removed for safety reasons, document individual risk assessments.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 10 -- Privacy of children in children's homes",
    });
  }

  if (sameGenderRate < 70 && sameGenderRequested.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review staffing rotas to ensure same-gender carers are available when requested for personal care. Children's gender preferences must be honoured to maintain dignity and prevent distress.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care standard",
    });
  }

  if (boundaryDocumentationRate < 70 && totalBoundaryRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Document every child's boundary preferences in their care plan -- include physical, emotional, social, digital, and spatial boundaries. Review with each child regularly and ensure all staff have access to and understand these preferences.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 -- Children's views, wishes and feelings",
    });
  }

  if (childRecordAccessRate < 60 && totalConfidentialityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children have appropriate access to their own records -- children have a right to know what is written about them. Implement age-appropriate processes for children to view, comment on, and contribute to their records.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 21 -- Privacy and confidentiality",
    });
  }

  if (sharingConsentRate < 70 && totalConfidentialityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen consent processes for information sharing -- children should be involved in decisions about who sees their personal information. Implement consent forms, regular reviews of sharing arrangements, and clear opt-out mechanisms.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 21 -- Privacy and confidentiality",
    });
  }

  if (knockEntryRate >= 50 && knockEntryRate < 80 && totalKnockRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve knock-before-entry compliance to at least 80% -- reinforce training, conduct spot-check observations, and address individual staff non-compliance through supervision.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 10 -- Privacy of children in children's homes",
    });
  }

  if (choiceRate < 70 && totalDignityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Embed genuine choice in all care interactions -- offer children meaningful options about how, when, and by whom care is delivered. Train staff on person-centred, dignity-preserving practice.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (staffAwarenessRate < 70 && totalBoundaryRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve staff awareness of individual children's boundary needs through targeted training, handover briefings, and accessible boundary summaries. Staff must know and respect each child's personal limits.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care standard",
    });
  }

  if (privacyAuditComplianceRate >= 50 && privacyAuditComplianceRate < 70 && totalPrivacyAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve privacy audit compliance to at least 70% -- review and upgrade children's living spaces to ensure adequate private areas, bathroom privacy, and personal storage for all children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 10 -- Privacy of children in children's homes",
    });
  }

  if (boundaryRespectRate >= 50 && boundaryRespectRate < 70 && totalBoundaryRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a boundary respect improvement plan targeting the specific boundary types most frequently violated. Use practice observations, reflective supervision, and child feedback to drive improvement.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care standard",
    });
  }

  if (dignityPracticeRate >= 50 && dignityPracticeRate < 70 && totalDignityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a dignity in care improvement programme -- use practice observations, peer mentoring, and regular child feedback to embed dignity-preserving practice across all care interactions.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care standard",
    });
  }

  if (dataMinimisationRate < 70 && totalConfidentialityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement data minimisation principles across all record keeping -- only record and share information that is necessary, proportionate, and relevant. Review existing records for excessive or unnecessary personal data.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 21 -- Privacy and confidentiality",
    });
  }

  if (totalPrivacyAudits === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement regular privacy audits of all children's living spaces -- assess private space, locks, storage, bathroom privacy, phone and correspondence privacy, and meeting space availability. Document findings and track remedial actions.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 10 -- Privacy of children in children's homes",
    });
  }

  if (totalKnockRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement knock-before-entry monitoring -- record and audit staff compliance with knock-and-wait protocols to evidence respect for children's private space.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 10 -- Privacy of children in children's homes",
    });
  }

  if (totalConfidentialityRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement confidentiality audits covering record storage security, access controls, sharing consent, and data protection compliance. Document all findings and remedial actions.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 21 -- Privacy and confidentiality",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: PrivacyDignityInsight[] = [];

  // --- Critical insights ---

  if (knockEntryRate < 50 && totalKnockRecords > 0) {
    insights.push({
      text: `Only ${knockEntryRate}% knock-before-entry compliance. Ofsted will view systematic failure to knock and wait before entering children's rooms as evidence that the home does not respect children's basic right to privacy -- a direct breach of Reg 10 that undermines trust and emotional safety.`,
      severity: "critical",
    });
  }

  if (boundaryRespectRate < 50 && totalBoundaryRecords > 0) {
    insights.push({
      text: `Only ${boundaryRespectRate}% of personal boundaries respected. Widespread boundary violations indicate a culture that does not prioritise children's autonomy and dignity -- Ofsted will view this as a fundamental quality of care failure under Reg 5.`,
      severity: "critical",
    });
  }

  if (confidentialityRate < 50 && totalConfidentialityRecords > 0) {
    insights.push({
      text: `Overall confidentiality rate at only ${confidentialityRate}%. Systematic failures in record security, appropriate sharing, and consent undermine children's trust and breach their right to privacy under Reg 21. This also poses data protection and safeguarding risks.`,
      severity: "critical",
    });
  }

  if (dignityPracticeRate < 50 && totalDignityRecords > 0) {
    insights.push({
      text: `Dignity maintained in only ${dignityPracticeRate}% of care interactions. When the majority of care delivery fails to preserve children's self-respect, Ofsted will conclude that the home's quality of care is fundamentally inadequate under Reg 5.`,
      severity: "critical",
    });
  }

  if (privacyAuditComplianceRate < 50 && totalPrivacyAudits > 0) {
    insights.push({
      text: `Only ${privacyAuditComplianceRate}% privacy audit compliance. Children lack basic privacy provisions in their living spaces -- this is a Reg 10 failure that Ofsted will view as evidence the home does not provide a suitable physical environment for children.`,
      severity: "critical",
    });
  }

  if (seriousBreaches >= 3) {
    insights.push({
      text: `${seriousBreaches} moderate or serious boundary breaches represent a pattern of concern. Ofsted may investigate whether boundary violations indicate wider safeguarding issues or a culture that normalises disrespect for children's personal limits.`,
      severity: "critical",
    });
  }

  if (seriousConfBreaches >= 2) {
    insights.push({
      text: `${seriousConfBreaches} moderate or serious confidentiality breaches represent a significant governance failure. Repeated breaches suggest systemic weaknesses in information governance that expose children's personal data and undermine their trust.`,
      severity: "critical",
    });
  }

  if (totalPrivacyAudits === 0 && totalKnockRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No privacy audit or knock-before-entry records despite children being on placement. Ofsted may interpret the absence of records as evidence that children's privacy is not being systematically assessed, monitored, or protected -- a significant omission under Reg 10.",
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (knockEntryRate >= 50 && knockEntryRate < 80 && totalKnockRecords > 0) {
    insights.push({
      text: `Knock-before-entry compliance at ${knockEntryRate}% -- improving but inconsistent. Every entry without knocking erodes a child's sense of safety in their own space. Target consistent 95%+ compliance.`,
      severity: "warning",
    });
  }

  if (boundaryRespectRate >= 50 && boundaryRespectRate < 80 && totalBoundaryRecords > 0) {
    insights.push({
      text: `Boundary respect at ${boundaryRespectRate}% -- some children's personal limits are still being crossed. Each unrespected boundary damages trust and can trigger trauma responses in children who have experienced abuse or neglect.`,
      severity: "warning",
    });
  }

  if (confidentialityRate >= 50 && confidentialityRate < 80 && totalConfidentialityRecords > 0) {
    insights.push({
      text: `Confidentiality rate at ${confidentialityRate}% -- while improving, gaps in record security, sharing consent, or appropriate disclosure put children's private information at risk.`,
      severity: "warning",
    });
  }

  if (dignityPracticeRate >= 50 && dignityPracticeRate < 80 && totalDignityRecords > 0) {
    insights.push({
      text: `Dignity practice rate at ${dignityPracticeRate}% -- care delivery does not consistently preserve children's self-respect. Children who feel undignified in care interactions may disengage from support.`,
      severity: "warning",
    });
  }

  if (privacyAuditComplianceRate >= 50 && privacyAuditComplianceRate < 80 && totalPrivacyAudits > 0) {
    insights.push({
      text: `Privacy audit compliance at ${privacyAuditComplianceRate}% -- some children's living spaces still fall short of privacy standards. Privacy is foundational to children feeling safe and settled in their home.`,
      severity: "warning",
    });
  }

  if (childSatisfactionRate >= 50 && childSatisfactionRate < 80 && satisfactionDenominator > 0) {
    insights.push({
      text: `Child satisfaction with privacy and dignity at ${childSatisfactionRate}% -- not all children feel their privacy and dignity are fully respected. Children's lived experience should be the primary measure of whether privacy and dignity provisions are working.`,
      severity: "warning",
    });
  }

  if (breachRate >= 15 && breachRate < 30 && totalBoundaryRecords > 0) {
    insights.push({
      text: `Boundary breach rate at ${breachRate}% -- while not the majority, this level of breaching indicates staff training or awareness gaps that need targeted attention.`,
      severity: "warning",
    });
  }

  if (knockComplaintRate >= 5 && knockComplaintRate < 15 && totalKnockRecords > 0) {
    insights.push({
      text: `${knockComplaintRate}% complaint rate about room entries -- children's complaints about privacy should be taken seriously as indicators of lived experience. Each complaint likely represents many unvoiced concerns.`,
      severity: "warning",
    });
  }

  if (choiceRate >= 50 && choiceRate < 80 && totalDignityRecords > 0) {
    insights.push({
      text: `Child choice offered in ${choiceRate}% of care interactions -- while some choice is provided, children in care often have fewer choices than peers. Every opportunity to offer genuine choice enhances dignity and autonomy.`,
      severity: "warning",
    });
  }

  if (sameGenderRate >= 50 && sameGenderRate < 90 && sameGenderRequested.length > 0) {
    insights.push({
      text: `Same-gender carer provided in ${sameGenderRate}% of requests -- gender preferences for personal care are particularly important for children with trauma histories. Staffing rotas should prioritise meeting these requests.`,
      severity: "warning",
    });
  }

  // --- Positive insights ---

  if (privacy_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding privacy and dignity provision -- children's right to privacy is actively protected, personal boundaries are consistently respected, confidential information is properly safeguarded, and care is delivered with genuine dignity. This is strong evidence of compliance with Reg 5, Reg 10, and Reg 21.",
      severity: "positive",
    });
  }

  if (knockEntryRate >= 95 && boundaryRespectRate >= 90 && totalKnockRecords > 0 && totalBoundaryRecords > 0) {
    insights.push({
      text: `${knockEntryRate}% knock-before-entry compliance with ${boundaryRespectRate}% boundary respect -- the home has embedded a culture of genuine respect for children's personal space and limits. This creates an environment where children feel safe, trusted, and in control.`,
      severity: "positive",
    });
  }

  if (privacyAuditComplianceRate >= 90 && lockComplianceRate >= 90 && totalPrivacyAudits > 0) {
    insights.push({
      text: `${privacyAuditComplianceRate}% privacy audit compliance with ${lockComplianceRate}% functional bedroom locks -- the physical environment actively supports children's privacy. Children can retreat to their own space knowing it is genuinely private and secure.`,
      severity: "positive",
    });
  }

  if (confidentialityRate >= 90 && confidentialityBreaches === 0 && totalConfidentialityRecords > 0) {
    insights.push({
      text: `${confidentialityRate}% confidentiality rate with zero breaches -- the home's information governance is exemplary. Children can trust that their personal information is safe, which is essential for honest engagement with care planning and therapeutic support.`,
      severity: "positive",
    });
  }

  if (dignityPracticeRate >= 90 && dignitySatisfactionAvg >= 4.0 && totalDignityRecords > 0) {
    insights.push({
      text: `${dignityPracticeRate}% dignity practice rate with child satisfaction averaging ${dignitySatisfactionAvg}/5 -- care is delivered with consistent respect for children's self-worth. Children feel valued, respected, and treated as individuals with agency.`,
      severity: "positive",
    });
  }

  if (childSatisfactionRate >= 80 && satisfactionDenominator > 0) {
    insights.push({
      text: `${childSatisfactionRate}% child satisfaction with privacy and dignity -- the strongest evidence of good practice is children's own testimony. High satisfaction indicates that privacy and dignity provisions are meaningful in children's lived experience, not just procedural.`,
      severity: "positive",
    });
  }

  if (childRecordAccessRate >= 80 && sharingConsentRate >= 80 && totalConfidentialityRecords > 0) {
    insights.push({
      text: `${childRecordAccessRate}% record access for children with ${sharingConsentRate}% sharing consent obtained -- children are genuine partners in decisions about their information. This empowering approach builds trust and supports children's developing autonomy.`,
      severity: "positive",
    });
  }

  if (sameGenderRate >= 90 && sameGenderRequested.length > 0 && culturalSensitivityRate >= 90 && totalDignityRecords > 0) {
    insights.push({
      text: `Same-gender carer requests met in ${sameGenderRate}% of cases with ${culturalSensitivityRate}% cultural sensitivity -- the home demonstrates sophisticated understanding of how gender, culture, and personal history shape children's experience of care delivery.`,
      severity: "positive",
    });
  }

  if (restorativeRate >= 80 && breachAddressedRate >= 90 && breachesOccurred > 0) {
    insights.push({
      text: `${breachAddressedRate}% of breaches addressed with ${restorativeRate}% restorative action -- when things go wrong, the home responds with accountability and relationship repair. This models healthy conflict resolution for children.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (privacy_rating === "outstanding") {
    headline =
      "Outstanding privacy and dignity provision -- children's right to privacy is actively protected, personal boundaries are respected, and care is delivered with genuine dignity.";
  } else if (privacy_rating === "good") {
    headline = `Good privacy and dignity provision -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (privacy_rating === "adequate") {
    headline = `Adequate privacy and dignity provision -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's privacy and dignity are fully upheld.`;
  } else {
    headline = `Privacy and dignity provision is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to protect children's fundamental rights to privacy and dignified care.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    privacy_rating,
    privacy_score: score,
    headline,
    privacy_audit_compliance_rate: privacyAuditComplianceRate,
    knock_entry_rate: knockEntryRate,
    boundary_respect_rate: boundaryRespectRate,
    confidentiality_rate: confidentialityRate,
    dignity_practice_rate: dignityPracticeRate,
    child_satisfaction_rate: childSatisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
