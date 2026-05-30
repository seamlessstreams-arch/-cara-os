// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME EMERGENCY CONTACT & NEXT OF KIN INTELLIGENCE ENGINE
// Monitors emergency contact management — contact information currency,
// accessibility of emergency numbers, update frequency, multi-contact coverage,
// out-of-hours availability, and verification practices.
// Measures contact currency, accessibility, update frequency, multi-contact
// coverage, out-of-hours availability, and verification rates.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Engagement with parents, etc.), Reg 22 (Review of quality
// of care), Reg 40 (Notification of serious events). SCCIF: Safety.
// Store keys: contactInformationRecords, accessibilityRecords,
//             updateFrequencyRecords, multiContactRecords,
//             outOfHoursRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ContactInformationRecordInput {
  id: string;
  child_id: string;
  contact_name: string;
  relationship: string;
  contact_type: "parent" | "guardian" | "relative" | "social_worker" | "next_of_kin" | "emergency_contact" | "other";
  phone_primary: string;
  phone_secondary: string | null;
  email: string | null;
  address_on_file: boolean;
  last_verified_date: string | null;
  is_current: boolean;
  consent_to_contact: boolean;
  priority_order: number;
  notes: string | null;
  created_at: string;
}

export interface AccessibilityRecordInput {
  id: string;
  child_id: string;
  contact_id: string;
  test_date: string;
  phone_reachable: boolean;
  answered_within_3_rings: boolean;
  voicemail_available: boolean;
  alternative_method_tested: boolean;
  alternative_method_successful: boolean;
  response_time_minutes: number | null;
  tested_by: string;
  test_type: "routine_check" | "drill" | "actual_emergency" | "periodic_review";
  notes: string | null;
  created_at: string;
}

export interface UpdateFrequencyRecordInput {
  id: string;
  child_id: string;
  contact_id: string;
  update_date: string;
  update_type: "scheduled_review" | "contact_initiated" | "staff_initiated" | "placement_change" | "annual_review" | "incident_triggered";
  fields_updated: string[];
  verified_accurate: boolean;
  updated_by: string;
  next_review_due: string | null;
  review_overdue: boolean;
  notes: string | null;
  created_at: string;
}

export interface MultiContactRecordInput {
  id: string;
  child_id: string;
  total_contacts_on_file: number;
  emergency_contacts_count: number;
  next_of_kin_designated: boolean;
  social_worker_contact_on_file: boolean;
  placing_authority_contact_on_file: boolean;
  out_of_area_contact_available: boolean;
  diverse_relationship_types: boolean;
  last_reviewed_date: string;
  gaps_identified: string[];
  gaps_addressed: boolean;
  reviewed_by: string;
  created_at: string;
}

export interface OutOfHoursRecordInput {
  id: string;
  child_id: string;
  out_of_hours_contact_designated: boolean;
  edt_number_on_file: boolean;
  on_call_manager_accessible: boolean;
  nhs_111_accessible: boolean;
  local_hospital_number_on_file: boolean;
  police_non_emergency_on_file: boolean;
  placing_authority_ooh_on_file: boolean;
  last_tested_date: string | null;
  test_successful: boolean;
  backup_contact_available: boolean;
  escalation_procedure_documented: boolean;
  staff_aware_of_procedure: boolean;
  reviewed_by: string;
  created_at: string;
}

export interface EmergencyContactInput {
  today: string;
  total_children: number;
  contact_information_records: ContactInformationRecordInput[];
  accessibility_records: AccessibilityRecordInput[];
  update_frequency_records: UpdateFrequencyRecordInput[];
  multi_contact_records: MultiContactRecordInput[];
  out_of_hours_records: OutOfHoursRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type EmergencyContactRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface EmergencyContactInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface EmergencyContactRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface EmergencyContactResult {
  contact_rating: EmergencyContactRating;
  contact_score: number;
  headline: string;
  total_contact_records: number;
  total_accessibility_tests: number;
  contact_currency_rate: number;
  accessibility_rate: number;
  update_frequency_rate: number;
  multi_contact_rate: number;
  out_of_hours_rate: number;
  verification_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: EmergencyContactRecommendation[];
  insights: EmergencyContactInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  return Math.floor(Math.abs(d2 - d1) / msPerDay);
}

function toRating(score: number): EmergencyContactRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: EmergencyContactRating,
  score: number,
  headline: string,
): EmergencyContactResult {
  return {
    contact_rating: rating,
    contact_score: score,
    headline,
    total_contact_records: 0,
    total_accessibility_tests: 0,
    contact_currency_rate: 0,
    accessibility_rate: 0,
    update_frequency_rate: 0,
    multi_contact_rate: 0,
    out_of_hours_rate: 0,
    verification_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeEmergencyContactNextOfKin(
  input: EmergencyContactInput,
): EmergencyContactResult {
  const {
    today,
    total_children,
    contact_information_records,
    accessibility_records,
    update_frequency_records,
    multi_contact_records,
    out_of_hours_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    contact_information_records.length === 0 &&
    accessibility_records.length === 0 &&
    update_frequency_records.length === 0 &&
    multi_contact_records.length === 0 &&
    out_of_hours_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess emergency contact and next of kin management.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No emergency contact or next of kin data recorded despite children on placement — contact management requires urgent attention.",
      ),
      concerns: [
        "No contact information records, accessibility tests, update reviews, multi-contact assessments, or out-of-hours records exist despite children being on placement — the home cannot evidence adequate emergency contact management or next of kin arrangements.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of emergency contacts, accessibility testing, regular updates, multi-contact coverage, and out-of-hours arrangements for every child to evidence the home's management of emergency contact and next of kin information.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engagement with parents, relatives and others",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has at least two verified emergency contacts, a designated next of kin, and documented out-of-hours arrangements with tested escalation procedures.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 40 — Notification of serious events",
        },
      ],
      insights: [
        {
          text: "The complete absence of emergency contact and next of kin records means the home cannot evidence that it can reach responsible adults in an emergency, notify next of kin of serious events, or maintain current contact information. This represents a fundamental gap in Reg 5 and Reg 40 compliance and a direct safety concern.",
          severity: "critical",
        },
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // CORE METRICS
  // ══════════════════════════════════════════════════════════════════════

  // ── 1. Contact Information Currency ───────────────────────────────────

  const totalContactRecords = contact_information_records.length;

  const currentContacts = contact_information_records.filter((c) => c.is_current).length;
  const contactCurrentRate = pct(currentContacts, totalContactRecords);

  const consentedContacts = contact_information_records.filter((c) => c.consent_to_contact).length;
  const consentRate = pct(consentedContacts, totalContactRecords);

  const contactsWithAddress = contact_information_records.filter((c) => c.address_on_file).length;
  const addressOnFileRate = pct(contactsWithAddress, totalContactRecords);

  const contactsWithSecondaryPhone = contact_information_records.filter(
    (c) => c.phone_secondary !== null && c.phone_secondary !== "",
  ).length;
  const secondaryPhoneRate = pct(contactsWithSecondaryPhone, totalContactRecords);

  const contactsWithEmail = contact_information_records.filter(
    (c) => c.email !== null && c.email !== "",
  ).length;
  const emailOnFileRate = pct(contactsWithEmail, totalContactRecords);

  // Contacts verified within the last 90 days
  const recentlyVerifiedContacts = contact_information_records.filter((c) => {
    if (!c.last_verified_date) return false;
    return daysBetween(c.last_verified_date, today) <= 90;
  }).length;
  const recentVerificationRate = pct(recentlyVerifiedContacts, totalContactRecords);

  // Contacts ever verified
  const everVerifiedContacts = contact_information_records.filter(
    (c) => c.last_verified_date !== null && c.last_verified_date !== "",
  ).length;
  const verificationRate = pct(everVerifiedContacts, totalContactRecords);

  // Stale contacts — not verified in over 180 days
  const staleContacts = contact_information_records.filter((c) => {
    if (!c.last_verified_date) return true;
    return daysBetween(c.last_verified_date, today) > 180;
  }).length;
  const staleContactRate = pct(staleContacts, totalContactRecords);

  // Contact currency composite: current + consented + verified recently
  const currencyNumerator = currentContacts + consentedContacts + recentlyVerifiedContacts;
  const currencyDenominator = totalContactRecords * 3;
  const contactCurrencyRate = pct(currencyNumerator, currencyDenominator);

  // Unique children with at least one current contact
  const childrenWithCurrentContact = new Set(
    contact_information_records.filter((c) => c.is_current).map((c) => c.child_id),
  ).size;
  const childCoverageRate = total_children > 0 ? pct(childrenWithCurrentContact, total_children) : 0;

  // ── 2. Accessibility Metrics ──────────────────────────────────────────

  const totalAccessibilityTests = accessibility_records.length;

  const reachableTests = accessibility_records.filter((a) => a.phone_reachable).length;
  const reachableRate = pct(reachableTests, totalAccessibilityTests);

  const answeredQuickly = accessibility_records.filter((a) => a.answered_within_3_rings).length;
  const quickAnswerRate = pct(answeredQuickly, totalAccessibilityTests);

  const voicemailAvailable = accessibility_records.filter((a) => a.voicemail_available).length;
  const voicemailRate = pct(voicemailAvailable, totalAccessibilityTests);

  const altMethodTested = accessibility_records.filter((a) => a.alternative_method_tested).length;
  const altMethodTestedRate = pct(altMethodTested, totalAccessibilityTests);

  const altMethodSuccessful = accessibility_records.filter(
    (a) => a.alternative_method_tested && a.alternative_method_successful,
  ).length;
  const altMethodSuccessRate = pct(altMethodSuccessful, altMethodTested);

  // Rapid response — responded within 15 minutes
  const rapidResponse = accessibility_records.filter(
    (a) => a.response_time_minutes !== null && a.response_time_minutes <= 15,
  ).length;
  const rapidResponseRate = pct(rapidResponse, totalAccessibilityTests);

  // Accessibility composite: reachable + quick answer + voicemail
  const accessNumerator = reachableTests + answeredQuickly + voicemailAvailable;
  const accessDenominator = totalAccessibilityTests * 3;
  const accessibilityRate = pct(accessNumerator, accessDenominator);

  // ── 3. Update Frequency Metrics ───────────────────────────────────────

  const totalUpdateRecords = update_frequency_records.length;

  const verifiedAccurateUpdates = update_frequency_records.filter((u) => u.verified_accurate).length;
  const updateAccuracyRate = pct(verifiedAccurateUpdates, totalUpdateRecords);

  const overdueReviews = update_frequency_records.filter((u) => u.review_overdue).length;
  const overdueRate = pct(overdueReviews, totalUpdateRecords);
  const onTimeReviewRate = totalUpdateRecords > 0 ? 100 - overdueRate : 0;

  // Scheduled reviews vs reactive
  const scheduledUpdates = update_frequency_records.filter(
    (u) => u.update_type === "scheduled_review" || u.update_type === "annual_review",
  ).length;
  const scheduledUpdateRate = pct(scheduledUpdates, totalUpdateRecords);

  // Updates with fields actually changed
  const updatesWithFieldChanges = update_frequency_records.filter(
    (u) => u.fields_updated.length > 0,
  ).length;
  const fieldChangeRate = pct(updatesWithFieldChanges, totalUpdateRecords);

  // Update frequency composite: accuracy + on-time + scheduled
  const updateNumerator = verifiedAccurateUpdates + (totalUpdateRecords - overdueReviews) + scheduledUpdates;
  const updateDenominator = totalUpdateRecords * 3;
  const updateFrequencyRate = pct(updateNumerator, updateDenominator);

  // ── 4. Multi-Contact Coverage Metrics ─────────────────────────────────

  const totalMultiContactRecords = multi_contact_records.length;

  const withMinTwoContacts = multi_contact_records.filter(
    (m) => m.total_contacts_on_file >= 2,
  ).length;
  const minTwoContactRate = pct(withMinTwoContacts, totalMultiContactRecords);

  const withMinTwoEmergency = multi_contact_records.filter(
    (m) => m.emergency_contacts_count >= 2,
  ).length;
  const minTwoEmergencyRate = pct(withMinTwoEmergency, totalMultiContactRecords);

  const withNextOfKin = multi_contact_records.filter(
    (m) => m.next_of_kin_designated,
  ).length;
  const nextOfKinRate = pct(withNextOfKin, totalMultiContactRecords);

  const withSocialWorker = multi_contact_records.filter(
    (m) => m.social_worker_contact_on_file,
  ).length;
  const socialWorkerRate = pct(withSocialWorker, totalMultiContactRecords);

  const withPlacingAuthority = multi_contact_records.filter(
    (m) => m.placing_authority_contact_on_file,
  ).length;
  const placingAuthorityRate = pct(withPlacingAuthority, totalMultiContactRecords);

  const withDiverseRelationships = multi_contact_records.filter(
    (m) => m.diverse_relationship_types,
  ).length;
  const diverseRelationshipRate = pct(withDiverseRelationships, totalMultiContactRecords);

  const gapsIdentifiedRecords = multi_contact_records.filter(
    (m) => m.gaps_identified.length > 0,
  ).length;
  const gapsAddressedRecords = multi_contact_records.filter(
    (m) => m.gaps_identified.length > 0 && m.gaps_addressed,
  ).length;
  const gapResolutionRate = pct(gapsAddressedRecords, gapsIdentifiedRecords);

  // Multi-contact composite: min 2 contacts + next of kin + social worker + placing authority
  const multiNumerator = withMinTwoContacts + withNextOfKin + withSocialWorker + withPlacingAuthority;
  const multiDenominator = totalMultiContactRecords * 4;
  const multiContactRate = pct(multiNumerator, multiDenominator);

  // Unique children with multi-contact assessment
  const childrenWithMultiContact = new Set(
    multi_contact_records.map((m) => m.child_id),
  ).size;
  const multiContactCoverageRate = total_children > 0 ? pct(childrenWithMultiContact, total_children) : 0;

  // ── 5. Out-of-Hours Metrics ───────────────────────────────────────────

  const totalOOHRecords = out_of_hours_records.length;

  const oohDesignated = out_of_hours_records.filter(
    (o) => o.out_of_hours_contact_designated,
  ).length;
  const oohDesignatedRate = pct(oohDesignated, totalOOHRecords);

  const edtOnFile = out_of_hours_records.filter((o) => o.edt_number_on_file).length;
  const edtOnFileRate = pct(edtOnFile, totalOOHRecords);

  const onCallAccessible = out_of_hours_records.filter(
    (o) => o.on_call_manager_accessible,
  ).length;
  const onCallAccessibleRate = pct(onCallAccessible, totalOOHRecords);

  const nhs111Accessible = out_of_hours_records.filter(
    (o) => o.nhs_111_accessible,
  ).length;
  const nhs111Rate = pct(nhs111Accessible, totalOOHRecords);

  const hospitalOnFile = out_of_hours_records.filter(
    (o) => o.local_hospital_number_on_file,
  ).length;
  const hospitalOnFileRate = pct(hospitalOnFile, totalOOHRecords);

  const policeOnFile = out_of_hours_records.filter(
    (o) => o.police_non_emergency_on_file,
  ).length;
  const policeOnFileRate = pct(policeOnFile, totalOOHRecords);

  const placingAuthorityOOH = out_of_hours_records.filter(
    (o) => o.placing_authority_ooh_on_file,
  ).length;
  const placingAuthorityOOHRate = pct(placingAuthorityOOH, totalOOHRecords);

  const oohTested = out_of_hours_records.filter(
    (o) => o.last_tested_date !== null && o.last_tested_date !== "",
  ).length;
  const oohTestedRate = pct(oohTested, totalOOHRecords);

  const oohTestSuccessful = out_of_hours_records.filter(
    (o) => o.test_successful,
  ).length;
  const oohTestSuccessRate = pct(oohTestSuccessful, totalOOHRecords);

  const escalationDocumented = out_of_hours_records.filter(
    (o) => o.escalation_procedure_documented,
  ).length;
  const escalationDocumentedRate = pct(escalationDocumented, totalOOHRecords);

  const staffAware = out_of_hours_records.filter(
    (o) => o.staff_aware_of_procedure,
  ).length;
  const staffAwareRate = pct(staffAware, totalOOHRecords);

  const backupAvailable = out_of_hours_records.filter(
    (o) => o.backup_contact_available,
  ).length;
  const backupAvailableRate = pct(backupAvailable, totalOOHRecords);

  // OOH composite: designated + EDT + on-call + escalation documented + staff aware
  const oohChecks = [
    (o: OutOfHoursRecordInput) => o.out_of_hours_contact_designated,
    (o: OutOfHoursRecordInput) => o.edt_number_on_file,
    (o: OutOfHoursRecordInput) => o.on_call_manager_accessible,
    (o: OutOfHoursRecordInput) => o.escalation_procedure_documented,
    (o: OutOfHoursRecordInput) => o.staff_aware_of_procedure,
  ];
  const oohChecksPossible = totalOOHRecords * oohChecks.length;
  let oohChecksPassed = 0;
  for (const rec of out_of_hours_records) {
    for (const check of oohChecks) {
      if (check(rec)) oohChecksPassed++;
    }
  }
  const outOfHoursRate = pct(oohChecksPassed, oohChecksPossible);

  // ══════════════════════════════════════════════════════════════════════
  // SCORING: base 52, max bonuses +28, 4 penalties guarded by .length>0
  // ══════════════════════════════════════════════════════════════════════

  let score = 52;

  // --- Bonus 1: contactCurrencyRate (>=90: +4, >=70: +2) ---
  if (contactCurrencyRate >= 90) score += 4;
  else if (contactCurrencyRate >= 70) score += 2;

  // --- Bonus 2: accessibilityRate (>=90: +4, >=70: +2) ---
  if (accessibilityRate >= 90) score += 4;
  else if (accessibilityRate >= 70) score += 2;

  // --- Bonus 3: updateFrequencyRate (>=90: +3, >=70: +1) ---
  if (updateFrequencyRate >= 90) score += 3;
  else if (updateFrequencyRate >= 70) score += 1;

  // --- Bonus 4: multiContactRate (>=90: +4, >=70: +2) ---
  if (multiContactRate >= 90) score += 4;
  else if (multiContactRate >= 70) score += 2;

  // --- Bonus 5: outOfHoursRate (>=90: +4, >=70: +2) ---
  if (outOfHoursRate >= 90) score += 4;
  else if (outOfHoursRate >= 70) score += 2;

  // --- Bonus 6: verificationRate (>=90: +3, >=70: +1) ---
  if (verificationRate >= 90) score += 3;
  else if (verificationRate >= 70) score += 1;

  // --- Bonus 7: childCoverageRate (>=90: +3, >=60: +1) ---
  if (childCoverageRate >= 90) score += 3;
  else if (childCoverageRate >= 60) score += 1;

  // --- Bonus 8: nextOfKinRate (>=90: +3, >=70: +1) ---
  if (nextOfKinRate >= 90) score += 3;
  else if (nextOfKinRate >= 70) score += 1;

  // ── Penalties (4, guarded by .length > 0) ─────────────────────────────

  // contactCurrencyRate < 50 → -5
  if (contactCurrencyRate < 50 && contact_information_records.length > 0) score -= 5;

  // accessibilityRate < 50 → -5
  if (accessibilityRate < 50 && accessibility_records.length > 0) score -= 5;

  // outOfHoursRate < 50 → -4
  if (outOfHoursRate < 50 && out_of_hours_records.length > 0) score -= 4;

  // multiContactRate < 40 → -4
  if (multiContactRate < 40 && multi_contact_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const contact_rating = toRating(score);

  // ══════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];

  if (contactCurrencyRate >= 90 && totalContactRecords > 0) {
    strengths.push(
      `${contactCurrencyRate}% contact currency — emergency contact information is consistently current, consented, and recently verified, ensuring the home can reach responsible adults when needed.`,
    );
  } else if (contactCurrencyRate >= 70 && totalContactRecords > 0) {
    strengths.push(
      `${contactCurrencyRate}% contact currency — the home generally maintains up-to-date and verified emergency contact information.`,
    );
  }

  if (accessibilityRate >= 90 && totalAccessibilityTests > 0) {
    strengths.push(
      `${accessibilityRate}% accessibility rate — emergency contacts are consistently reachable, answer promptly, and have voicemail available, demonstrating robust communication pathways.`,
    );
  } else if (accessibilityRate >= 70 && totalAccessibilityTests > 0) {
    strengths.push(
      `${accessibilityRate}% accessibility rate — the majority of emergency contacts are reachable and responsive when tested.`,
    );
  }

  if (updateFrequencyRate >= 90 && totalUpdateRecords > 0) {
    strengths.push(
      `${updateFrequencyRate}% update frequency compliance — contact details are reviewed on schedule, verified for accuracy, and proactively maintained through planned reviews.`,
    );
  } else if (updateFrequencyRate >= 70 && totalUpdateRecords > 0) {
    strengths.push(
      `${updateFrequencyRate}% update frequency compliance — the home generally reviews and updates contact information on schedule.`,
    );
  }

  if (multiContactRate >= 90 && totalMultiContactRecords > 0) {
    strengths.push(
      `${multiContactRate}% multi-contact coverage — children have multiple emergency contacts, designated next of kin, and professional contacts on file, providing comprehensive safety nets.`,
    );
  } else if (multiContactRate >= 70 && totalMultiContactRecords > 0) {
    strengths.push(
      `${multiContactRate}% multi-contact coverage — most children have adequate emergency contact coverage with professional contacts on file.`,
    );
  }

  if (outOfHoursRate >= 90 && totalOOHRecords > 0) {
    strengths.push(
      `${outOfHoursRate}% out-of-hours readiness — the home maintains comprehensive out-of-hours arrangements with designated contacts, escalation procedures, and staff awareness.`,
    );
  } else if (outOfHoursRate >= 70 && totalOOHRecords > 0) {
    strengths.push(
      `${outOfHoursRate}% out-of-hours readiness — the home generally has appropriate out-of-hours emergency arrangements in place.`,
    );
  }

  if (verificationRate >= 90 && totalContactRecords > 0) {
    strengths.push(
      `${verificationRate}% of contacts verified — the home actively confirms the accuracy of emergency contact information, reducing the risk of outdated or incorrect details during emergencies.`,
    );
  } else if (verificationRate >= 70 && totalContactRecords > 0) {
    strengths.push(
      `${verificationRate}% of contacts verified — the majority of emergency contacts have been verified for accuracy.`,
    );
  }

  if (childCoverageRate >= 90 && total_children > 0) {
    strengths.push(
      `${childCoverageRate}% of children have current emergency contacts — every child on placement has at least one verified, current contact available.`,
    );
  } else if (childCoverageRate >= 70 && total_children > 0) {
    strengths.push(
      `${childCoverageRate}% of children have current emergency contacts — the majority of children have accessible emergency contact arrangements.`,
    );
  }

  if (nextOfKinRate >= 90 && totalMultiContactRecords > 0) {
    strengths.push(
      `${nextOfKinRate}% next of kin designation — nearly all children have a clearly designated next of kin, ensuring the home meets its notification obligations under Reg 40.`,
    );
  } else if (nextOfKinRate >= 70 && totalMultiContactRecords > 0) {
    strengths.push(
      `${nextOfKinRate}% next of kin designation — the majority of children have a designated next of kin on file.`,
    );
  }

  if (reachableRate >= 90 && totalAccessibilityTests > 0) {
    strengths.push(
      `${reachableRate}% phone reachability — emergency contacts are consistently reachable by telephone, providing confidence that the home can make urgent contact when required.`,
    );
  }

  if (escalationDocumentedRate >= 90 && totalOOHRecords > 0) {
    strengths.push(
      `${escalationDocumentedRate}% of out-of-hours escalation procedures documented — clear, documented procedures ensure staff know exactly who to contact and in what order during emergencies outside normal hours.`,
    );
  }

  if (staffAwareRate >= 90 && totalOOHRecords > 0) {
    strengths.push(
      `${staffAwareRate}% staff awareness of out-of-hours procedures — staff are well-informed about emergency escalation pathways, reducing response times and confusion during critical situations.`,
    );
  }

  if (gapResolutionRate >= 90 && gapsIdentifiedRecords > 0) {
    strengths.push(
      `${gapResolutionRate}% of identified contact gaps addressed — the home proactively identifies and resolves gaps in emergency contact arrangements, demonstrating continuous improvement.`,
    );
  }

  if (consentRate >= 90 && totalContactRecords > 0) {
    strengths.push(
      `${consentRate}% consent to contact recorded — the home maintains clear consent records for contacting emergency contacts, reflecting good data governance practice.`,
    );
  }

  if (socialWorkerRate >= 90 && totalMultiContactRecords > 0) {
    strengths.push(
      `${socialWorkerRate}% of children have social worker contact on file — professional contact information is readily available to support multi-agency working and rapid communication.`,
    );
  }

  if (rapidResponseRate >= 90 && totalAccessibilityTests > 0) {
    strengths.push(
      `${rapidResponseRate}% of contacts respond within 15 minutes — emergency contacts demonstrate excellent responsiveness, ensuring timely communication during critical situations.`,
    );
  }

  if (oohTestSuccessRate >= 90 && totalOOHRecords > 0) {
    strengths.push(
      `${oohTestSuccessRate}% out-of-hours test success rate — out-of-hours arrangements have been tested and confirmed to work, providing assurance that emergency pathways are functional.`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ══════════════════════════════════════════════════════════════════════

  const concerns: string[] = [];

  if (contactCurrencyRate < 50 && totalContactRecords > 0) {
    concerns.push(
      `Only ${contactCurrencyRate}% contact currency — the majority of emergency contact information is not current, not consented, or not recently verified, creating significant risk that the home cannot reach responsible adults in an emergency.`,
    );
  } else if (contactCurrencyRate < 70 && contactCurrencyRate >= 50 && totalContactRecords > 0) {
    concerns.push(
      `Contact currency at ${contactCurrencyRate}% — a notable proportion of emergency contacts are not fully current, consented, or recently verified.`,
    );
  }

  if (accessibilityRate < 50 && totalAccessibilityTests > 0) {
    concerns.push(
      `Only ${accessibilityRate}% accessibility rate — the majority of emergency contacts are not reliably reachable, undermining the home's ability to communicate urgently when children's safety is at stake.`,
    );
  } else if (accessibilityRate < 70 && accessibilityRate >= 50 && totalAccessibilityTests > 0) {
    concerns.push(
      `Accessibility rate at ${accessibilityRate}% — a significant proportion of emergency contacts are not consistently reachable when tested.`,
    );
  }

  if (updateFrequencyRate < 50 && totalUpdateRecords > 0) {
    concerns.push(
      `Only ${updateFrequencyRate}% update frequency compliance — contact reviews are overdue, unverified, or largely reactive rather than planned, risking outdated information being held on file.`,
    );
  } else if (updateFrequencyRate < 70 && updateFrequencyRate >= 50 && totalUpdateRecords > 0) {
    concerns.push(
      `Update frequency compliance at ${updateFrequencyRate}% — some contact reviews are overdue or not being conducted through planned schedules.`,
    );
  }

  if (multiContactRate < 40 && totalMultiContactRecords > 0) {
    concerns.push(
      `Only ${multiContactRate}% multi-contact coverage — children do not have adequate numbers of emergency contacts, next of kin designations, or professional contacts on file, leaving significant gaps in safety arrangements.`,
    );
  } else if (multiContactRate < 70 && multiContactRate >= 40 && totalMultiContactRecords > 0) {
    concerns.push(
      `Multi-contact coverage at ${multiContactRate}% — some children lack sufficient emergency contacts, next of kin designations, or professional contact records.`,
    );
  }

  if (outOfHoursRate < 50 && totalOOHRecords > 0) {
    concerns.push(
      `Only ${outOfHoursRate}% out-of-hours readiness — out-of-hours emergency arrangements are inadequate, with missing contacts, undocumented procedures, or staff unaware of escalation pathways. This is a direct safety risk.`,
    );
  } else if (outOfHoursRate < 70 && outOfHoursRate >= 50 && totalOOHRecords > 0) {
    concerns.push(
      `Out-of-hours readiness at ${outOfHoursRate}% — some out-of-hours arrangements are incomplete, untested, or not fully communicated to staff.`,
    );
  }

  if (verificationRate < 50 && totalContactRecords > 0) {
    concerns.push(
      `Only ${verificationRate}% of emergency contacts have been verified — the home holds contact information that has not been confirmed as accurate, creating a risk of failed communication during emergencies.`,
    );
  } else if (verificationRate < 70 && verificationRate >= 50 && totalContactRecords > 0) {
    concerns.push(
      `Contact verification rate at ${verificationRate}% — a significant proportion of emergency contacts have not been verified for accuracy.`,
    );
  }

  if (childCoverageRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${childCoverageRate}% of children have current emergency contacts — a significant number of children on placement do not have accessible, current emergency contact arrangements, which is a fundamental safeguarding failure.`,
    );
  } else if (childCoverageRate < 70 && childCoverageRate >= 50 && total_children > 0) {
    concerns.push(
      `Child emergency contact coverage at ${childCoverageRate}% — some children on placement lack current emergency contact arrangements.`,
    );
  }

  if (nextOfKinRate < 50 && totalMultiContactRecords > 0) {
    concerns.push(
      `Only ${nextOfKinRate}% of children have a designated next of kin — the home cannot meet its Reg 40 notification obligations for many children, as there is no clearly designated person to notify of serious events.`,
    );
  } else if (nextOfKinRate < 70 && nextOfKinRate >= 50 && totalMultiContactRecords > 0) {
    concerns.push(
      `Next of kin designation at ${nextOfKinRate}% — some children do not have a clearly designated next of kin, creating gaps in notification arrangements.`,
    );
  }

  if (staleContactRate > 50 && totalContactRecords > 0) {
    concerns.push(
      `${staleContactRate}% of contacts are stale (not verified in 180+ days) — a majority of emergency contacts have not been verified in over six months, significantly increasing the risk of holding outdated information.`,
    );
  } else if (staleContactRate > 30 && staleContactRate <= 50 && totalContactRecords > 0) {
    concerns.push(
      `${staleContactRate}% of contacts are stale — a notable proportion of contacts have not been verified in over six months.`,
    );
  }

  if (overdueRate > 50 && totalUpdateRecords > 0) {
    concerns.push(
      `${overdueRate}% of contact reviews are overdue — the majority of scheduled reviews have not been completed on time, undermining the home's ability to maintain current contact information.`,
    );
  } else if (overdueRate > 30 && overdueRate <= 50 && totalUpdateRecords > 0) {
    concerns.push(
      `${overdueRate}% of contact reviews are overdue — a significant proportion of scheduled reviews have not been completed on time.`,
    );
  }

  if (escalationDocumentedRate < 50 && totalOOHRecords > 0) {
    concerns.push(
      `Only ${escalationDocumentedRate}% of out-of-hours escalation procedures documented — staff may not know who to contact or in what order during an emergency outside normal hours.`,
    );
  }

  if (staffAwareRate < 50 && totalOOHRecords > 0) {
    concerns.push(
      `Only ${staffAwareRate}% staff awareness of out-of-hours procedures — staff are not adequately informed about emergency escalation pathways, which could lead to dangerous delays during critical situations.`,
    );
  }

  if (totalContactRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No emergency contact information records exist despite children being on placement — the home cannot evidence that emergency contacts are held or maintained for any child.",
    );
  }

  if (totalOOHRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No out-of-hours arrangements recorded — the home cannot evidence that emergency procedures are in place for evenings, weekends, and bank holidays.",
    );
  }

  if (totalMultiContactRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No multi-contact assessments recorded — the home has not assessed whether each child has adequate numbers and types of emergency contacts on file.",
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ══════════════════════════════════════════════════════════════════════

  const recommendations: EmergencyContactRecommendation[] = [];
  let rank = 0;

  if (contactCurrencyRate < 50 && totalContactRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and update all emergency contact information — verify that every contact is current, consented, and recently checked. Outdated or unverified contacts create unacceptable risk during emergencies.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engagement with parents, relatives and others",
    });
  }

  if (accessibilityRate < 50 && totalAccessibilityTests > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct urgent accessibility testing of all emergency contacts — contacts that cannot be reached serve no protective function. Establish alternative communication methods for unreachable contacts and update records accordingly.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of serious events",
    });
  }

  if (outOfHoursRate < 50 && totalOOHRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately review and strengthen out-of-hours emergency arrangements — ensure designated contacts, EDT numbers, on-call managers, escalation procedures, and staff awareness are all in place and tested. Children are vulnerable 24 hours a day.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of serious events",
    });
  }

  if (childCoverageRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child on placement has at least one current, verified emergency contact — children without accessible emergency contacts are at heightened risk if a serious incident occurs and the home cannot reach a responsible adult.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engagement with parents, relatives and others",
    });
  }

  if (nextOfKinRate < 50 && totalMultiContactRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Designate a next of kin for every child — the home has a legal obligation under Reg 40 to notify the relevant person of serious events. Without a designated next of kin, this obligation cannot be met.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of serious events",
    });
  }

  if (multiContactRate < 40 && totalMultiContactRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand emergency contact coverage for all children — ensure each child has at least two emergency contacts, a designated next of kin, and professional contacts (social worker, placing authority) on file to provide adequate safety nets.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engagement with parents, relatives and others",
    });
  }

  if (totalContactRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement immediate recording of emergency contact information for every child on placement — the absence of any contact records is a fundamental safeguarding failure.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engagement with parents, relatives and others",
    });
  }

  if (totalOOHRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish and document out-of-hours emergency arrangements immediately — include EDT contacts, on-call manager details, NHS 111, local hospital, police non-emergency, and placing authority out-of-hours numbers.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of serious events",
    });
  }

  if (totalMultiContactRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a multi-contact assessment for every child — review the number, type, and diversity of emergency contacts on file and identify any gaps that need to be addressed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engagement with parents, relatives and others",
    });
  }

  if (staffAwareRate < 50 && totalOOHRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide urgent training to all staff on out-of-hours emergency procedures — staff who do not know the escalation pathway cannot respond effectively to emergencies outside normal hours.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of serious events",
    });
  }

  if (escalationDocumentedRate < 50 && totalOOHRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Document clear escalation procedures for out-of-hours emergencies — every shift should have access to a written procedure detailing who to contact, in what order, and for what types of emergency.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of serious events",
    });
  }

  if (verificationRate < 50 && totalContactRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a systematic contact verification programme — schedule regular verification of all emergency contacts to confirm phone numbers, addresses, and consent are still accurate and current.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 22 — Review of quality of care",
    });
  }

  if (staleContactRate > 50 && totalContactRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Prioritise re-verification of stale contacts — contacts not verified in over 180 days should be re-checked as a matter of priority, starting with primary emergency contacts for each child.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 22 — Review of quality of care",
    });
  }

  if (overdueRate > 50 && totalUpdateRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Clear the backlog of overdue contact reviews — establish a schedule to bring all reviews up to date and implement reminder systems to prevent future backlogs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 22 — Review of quality of care",
    });
  }

  if (contactCurrencyRate >= 50 && contactCurrencyRate < 70 && totalContactRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve contact currency to at least 70% — focus on ensuring all contacts are current, have recorded consent, and are verified within the last 90 days.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engagement with parents, relatives and others",
    });
  }

  if (accessibilityRate >= 50 && accessibilityRate < 70 && totalAccessibilityTests > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance contact accessibility testing — increase the frequency of routine checks and establish alternative communication methods for contacts who are difficult to reach by phone.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of serious events",
    });
  }

  if (multiContactRate >= 40 && multiContactRate < 70 && totalMultiContactRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen multi-contact arrangements — work with placing authorities and families to ensure each child has adequate numbers and diversity of emergency contacts, including professional contacts.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engagement with parents, relatives and others",
    });
  }

  if (outOfHoursRate >= 50 && outOfHoursRate < 70 && totalOOHRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve out-of-hours arrangements to at least 70% — review gaps in designated contacts, escalation procedures, and staff awareness. Conduct regular drills to test out-of-hours pathways.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of serious events",
    });
  }

  if (nextOfKinRate >= 50 && nextOfKinRate < 70 && totalMultiContactRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children have a designated next of kin — review cases where next of kin is not designated and work with social workers and placing authorities to identify appropriate individuals.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of serious events",
    });
  }

  if (scheduledUpdateRate < 50 && totalUpdateRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Shift from reactive to proactive contact reviews — implement a scheduled review cycle (at minimum quarterly) rather than relying on incident-triggered or ad hoc updates.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 22 — Review of quality of care",
    });
  }

  if (gapResolutionRate < 70 && gapsIdentifiedRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address identified gaps in contact arrangements — gaps have been identified but not resolved. Assign responsibility for closing each gap and track progress to completion.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engagement with parents, relatives and others",
    });
  }

  if (updateFrequencyRate >= 50 && updateFrequencyRate < 70 && totalUpdateRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve the consistency and timeliness of contact information reviews — ensure all scheduled reviews are completed on time with documented verification of accuracy.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 22 — Review of quality of care",
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ══════════════════════════════════════════════════════════════════════

  const insights: EmergencyContactInsight[] = [];

  // -- Critical insights --

  if (contactCurrencyRate < 50 && totalContactRecords > 0) {
    insights.push({
      text: `Only ${contactCurrencyRate}% contact currency. Ofsted expects children's homes to maintain current, verified emergency contact information for every child. When the majority of contacts are outdated, unverified, or lack consent, the home cannot fulfil its duty to communicate with responsible adults during emergencies — a fundamental Reg 5 and Reg 40 failure.`,
      severity: "critical",
    });
  }

  if (accessibilityRate < 50 && totalAccessibilityTests > 0) {
    insights.push({
      text: `Only ${accessibilityRate}% accessibility rate. Emergency contacts that cannot be reached provide no protective function. When accessibility testing reveals that the majority of contacts are unreachable, the home's emergency communication capability is critically compromised, directly impacting children's safety.`,
      severity: "critical",
    });
  }

  if (outOfHoursRate < 50 && totalOOHRecords > 0) {
    insights.push({
      text: `Only ${outOfHoursRate}% out-of-hours readiness. Many serious incidents occur outside normal working hours. Inadequate out-of-hours arrangements — missing contacts, undocumented escalation procedures, or uninformed staff — mean the home may not be able to respond effectively to emergencies when children are most vulnerable.`,
      severity: "critical",
    });
  }

  if (childCoverageRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${childCoverageRate}% of children have current emergency contacts. Children without accessible emergency contact arrangements are at significantly heightened risk — the home cannot notify responsible adults of injuries, illnesses, missing episodes, or other serious events. This is a direct safeguarding concern.`,
      severity: "critical",
    });
  }

  if (nextOfKinRate < 50 && totalMultiContactRecords > 0) {
    insights.push({
      text: `Only ${nextOfKinRate}% next of kin designation. Under Reg 40, homes must notify the relevant person of serious events. Without a clearly designated next of kin for each child, the home cannot meet this legal obligation, which has significant implications for regulatory compliance and family engagement.`,
      severity: "critical",
    });
  }

  if (staffAwareRate < 50 && totalOOHRecords > 0) {
    insights.push({
      text: `Only ${staffAwareRate}% staff awareness of out-of-hours procedures. Staff who are not aware of emergency escalation pathways represent a direct safety risk — during a night-time or weekend emergency, delays in contacting the right people can have serious consequences for children's welfare.`,
      severity: "critical",
    });
  }

  if (totalContactRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No emergency contact information records exist despite children being on placement. Without any contact records, the home cannot evidence that emergency contacts are held, verified, or accessible for any child. This is a fundamental gap in safeguarding evidence and regulatory compliance.",
      severity: "critical",
    });
  }

  if (totalOOHRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No out-of-hours arrangements recorded. The absence of documented out-of-hours emergency procedures means the home cannot demonstrate preparedness for emergencies outside normal working hours. Ofsted expects robust out-of-hours arrangements as a core safety measure.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (contactCurrencyRate >= 50 && contactCurrencyRate < 70 && totalContactRecords > 0) {
    insights.push({
      text: `Contact currency at ${contactCurrencyRate}% — improving but inconsistent. Some contacts are outdated, lack consent, or have not been recently verified. The home should implement a systematic review cycle to ensure all contact information is confirmed at least quarterly.`,
      severity: "warning",
    });
  }

  if (accessibilityRate >= 50 && accessibilityRate < 70 && totalAccessibilityTests > 0) {
    insights.push({
      text: `Accessibility rate at ${accessibilityRate}% — some emergency contacts are not reliably reachable. Consider establishing alternative communication methods (text, email, alternative numbers) for contacts who are difficult to reach by phone.`,
      severity: "warning",
    });
  }

  if (updateFrequencyRate >= 50 && updateFrequencyRate < 70 && totalUpdateRecords > 0) {
    insights.push({
      text: `Update frequency compliance at ${updateFrequencyRate}% — contact reviews are not consistently on schedule. Regular, planned reviews are essential to maintaining current information. Consider linking contact reviews to existing review cycles (LAC reviews, placement reviews).`,
      severity: "warning",
    });
  }

  if (multiContactRate >= 40 && multiContactRate < 70 && totalMultiContactRecords > 0) {
    insights.push({
      text: `Multi-contact coverage at ${multiContactRate}% — some children do not have adequate emergency contact diversity. Children benefit from having multiple, different types of contacts (family, professional, community) to provide comprehensive safety coverage.`,
      severity: "warning",
    });
  }

  if (outOfHoursRate >= 50 && outOfHoursRate < 70 && totalOOHRecords > 0) {
    insights.push({
      text: `Out-of-hours readiness at ${outOfHoursRate}% — some gaps exist in the home's out-of-hours arrangements. Regular testing and staff training on escalation procedures would strengthen the home's emergency response capability outside normal hours.`,
      severity: "warning",
    });
  }

  if (staleContactRate > 30 && staleContactRate <= 50 && totalContactRecords > 0) {
    insights.push({
      text: `${staleContactRate}% of contacts are stale (not verified in 180+ days). Contact details change frequently — phone numbers, addresses, and relationship circumstances can all shift. Regular verification prevents the home from holding outdated information that fails when needed most.`,
      severity: "warning",
    });
  }

  if (overdueRate > 30 && overdueRate <= 50 && totalUpdateRecords > 0) {
    insights.push({
      text: `${overdueRate}% of contact reviews are overdue. Falling behind on scheduled reviews means contact information may drift out of date without the home being aware. Consider implementing automated reminders and linking reviews to placement review cycles.`,
      severity: "warning",
    });
  }

  if (verificationRate >= 50 && verificationRate < 70 && totalContactRecords > 0) {
    insights.push({
      text: `Contact verification rate at ${verificationRate}% — not all emergency contacts have been confirmed as accurate. Unverified contacts may contain outdated phone numbers or addresses that fail during emergencies. A systematic verification programme would reduce this risk.`,
      severity: "warning",
    });
  }

  if (scheduledUpdateRate < 50 && totalUpdateRecords > 0) {
    insights.push({
      text: `Only ${scheduledUpdateRate}% of contact updates are scheduled/planned. A reactive approach to contact maintenance — updating only when prompted by incidents or changes — means the home may miss gradual drift in contact accuracy. Proactive, scheduled reviews are best practice.`,
      severity: "warning",
    });
  }

  if (gapResolutionRate < 70 && gapResolutionRate >= 40 && gapsIdentifiedRecords > 0) {
    insights.push({
      text: `Contact gap resolution rate at ${gapResolutionRate}% — some identified gaps in contact arrangements remain unaddressed. The home has identified issues but not followed through to resolution, which limits the effectiveness of its review processes.`,
      severity: "warning",
    });
  }

  // Contact type analysis
  const contactTypes: Record<string, number> = {};
  for (const c of contact_information_records) {
    contactTypes[c.contact_type] = (contactTypes[c.contact_type] ?? 0) + 1;
  }
  const topContactTypes = Object.entries(contactTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  if (topContactTypes.length > 0) {
    const formatted = topContactTypes
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Contact type distribution: ${formatted}. A balanced mix of family, professional, and community contacts provides the most robust emergency coverage. Over-reliance on a single contact type creates vulnerability if that person is unavailable.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (contact_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding emergency contact and next of kin management — contact information is current and verified, emergency numbers are accessible, updates are timely, multi-contact coverage is comprehensive, and out-of-hours arrangements are robust. This is strong evidence for Reg 5, Reg 22, and Reg 40 compliance.",
      severity: "positive",
    });
  }

  if (contactCurrencyRate >= 90 && verificationRate >= 90 && totalContactRecords > 0) {
    insights.push({
      text: `${contactCurrencyRate}% contact currency with ${verificationRate}% verification — emergency contact information is both current and confirmed accurate. The home can be confident that contact details will be reliable when needed during emergencies.`,
      severity: "positive",
    });
  }

  if (accessibilityRate >= 90 && rapidResponseRate >= 90 && totalAccessibilityTests > 0) {
    insights.push({
      text: `${accessibilityRate}% accessibility with ${rapidResponseRate}% rapid response — emergency contacts are not only reachable but respond quickly. This demonstrates that the home has established effective communication pathways with families and professionals.`,
      severity: "positive",
    });
  }

  if (multiContactRate >= 90 && nextOfKinRate >= 90 && totalMultiContactRecords > 0) {
    insights.push({
      text: `${multiContactRate}% multi-contact coverage with ${nextOfKinRate}% next of kin designation — children have comprehensive emergency contact arrangements with clearly designated next of kin. The home meets its Reg 40 notification obligations and provides robust safety nets.`,
      severity: "positive",
    });
  }

  if (outOfHoursRate >= 90 && staffAwareRate >= 90 && totalOOHRecords > 0) {
    insights.push({
      text: `${outOfHoursRate}% out-of-hours readiness with ${staffAwareRate}% staff awareness — the home maintains excellent out-of-hours emergency arrangements and staff know exactly how to escalate concerns. This provides strong assurance of 24-hour emergency response capability.`,
      severity: "positive",
    });
  }

  if (escalationDocumentedRate >= 90 && oohTestSuccessRate >= 90 && totalOOHRecords > 0) {
    insights.push({
      text: `${escalationDocumentedRate}% escalation procedures documented with ${oohTestSuccessRate}% test success — out-of-hours procedures are not only documented but tested and confirmed to work. The home demonstrates excellent emergency preparedness.`,
      severity: "positive",
    });
  }

  if (childCoverageRate >= 90 && total_children > 0) {
    insights.push({
      text: `${childCoverageRate}% child coverage — virtually every child on placement has current, accessible emergency contacts. This universal coverage means the home can respond to any emergency with confidence that responsible adults can be reached.`,
      severity: "positive",
    });
  }

  if (gapResolutionRate >= 90 && gapsIdentifiedRecords > 0) {
    insights.push({
      text: `${gapResolutionRate}% gap resolution — the home actively identifies and addresses gaps in emergency contact arrangements. This proactive approach demonstrates continuous improvement in maintaining comprehensive safety nets for children.`,
      severity: "positive",
    });
  }

  if (updateFrequencyRate >= 90 && scheduledUpdateRate >= 80 && totalUpdateRecords > 0) {
    insights.push({
      text: `${updateFrequencyRate}% update frequency with ${scheduledUpdateRate}% scheduled reviews — the home maintains a proactive, systematic approach to keeping contact information current. Planned reviews, rather than reactive updates, ensure consistent data quality.`,
      severity: "positive",
    });
  }

  if (consentRate >= 90 && totalContactRecords > 0) {
    insights.push({
      text: `${consentRate}% consent to contact recorded — the home maintains excellent consent records, ensuring that emergency contact arrangements are both legally compliant and respectful of families' wishes.`,
      severity: "positive",
    });
  }

  if (socialWorkerRate >= 90 && placingAuthorityRate >= 90 && totalMultiContactRecords > 0) {
    insights.push({
      text: `${socialWorkerRate}% social worker and ${placingAuthorityRate}% placing authority contact coverage — professional contacts are comprehensively recorded, supporting effective multi-agency communication and rapid information sharing.`,
      severity: "positive",
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // HEADLINE
  // ══════════════════════════════════════════════════════════════════════

  let headline: string;

  if (contact_rating === "outstanding") {
    headline =
      "Outstanding emergency contact and next of kin management — contact information is current and verified, emergency numbers are accessible, and out-of-hours arrangements are comprehensive.";
  } else if (contact_rating === "good") {
    headline = `Good emergency contact management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (contact_rating === "adequate") {
    headline = `Adequate emergency contact management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's emergency contact arrangements are fully robust.`;
  } else {
    headline = `Emergency contact and next of kin management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children can be kept safe and responsible adults reached in emergencies.`;
  }

  // ══════════════════════════════════════════════════════════════════════
  // RETURN
  // ══════════════════════════════════════════════════════════════════════

  return {
    contact_rating,
    contact_score: score,
    headline,
    total_contact_records: totalContactRecords,
    total_accessibility_tests: totalAccessibilityTests,
    contact_currency_rate: contactCurrencyRate,
    accessibility_rate: accessibilityRate,
    update_frequency_rate: updateFrequencyRate,
    multi_contact_rate: multiContactRate,
    out_of_hours_rate: outOfHoursRate,
    verification_rate: verificationRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
