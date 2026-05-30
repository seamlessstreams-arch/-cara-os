// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME POLICY REVIEW CYCLE COMPLIANCE INTELLIGENCE ENGINE
// Measures policy review schedule adherence, version control, staff
// acknowledgement tracking, regulatory alignment, and policy accessibility.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 36 (Policies for the protection of children), SCCIF leadership
// and management ("leaders and managers ensure that the home is effectively
// run and managed").
// Store keys: policyReviewScheduleRecords, policyVersionControlRecords,
//             policyAcknowledgementRecords, policyAlignmentRecords,
//             policyAccessibilityRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PolicyReviewScheduleRecordInput {
  id: string;
  policy_id: string;
  policy_name: string;
  category: "safeguarding" | "health_safety" | "care_practice" | "staffing" | "behaviour" | "complaints" | "administration" | "other";
  last_review_date: string;
  next_review_due: string;
  review_completed: boolean;
  review_completed_date: string | null;
  reviewer: string;
  review_outcome: "approved" | "minor_updates" | "major_revision" | "pending" | null;
  days_overdue: number;
  review_frequency_months: number;
  responsible_person: string;
  consultation_undertaken: boolean;
  young_people_consulted: boolean;
  notes: string | null;
  created_at: string;
}

export interface PolicyVersionControlRecordInput {
  id: string;
  policy_id: string;
  policy_name: string;
  version_number: string;
  previous_version: string | null;
  change_date: string;
  change_type: "new_policy" | "scheduled_review" | "regulatory_update" | "incident_response" | "minor_amendment" | "major_revision";
  change_summary: string;
  approved_by: string;
  approval_date: string | null;
  superseded_version_archived: boolean;
  change_log_maintained: boolean;
  rationale_documented: boolean;
  effective_date: string;
  created_at: string;
}

export interface PolicyAcknowledgementRecordInput {
  id: string;
  policy_id: string;
  policy_name: string;
  staff_id: string;
  staff_name: string;
  acknowledgement_required_date: string;
  acknowledged: boolean;
  acknowledgement_date: string | null;
  comprehension_confirmed: boolean;
  assessment_passed: boolean | null;
  days_to_acknowledge: number;
  reminder_sent: boolean;
  version_acknowledged: string;
  created_at: string;
}

export interface PolicyAlignmentRecordInput {
  id: string;
  policy_id: string;
  policy_name: string;
  regulation_reference: string;
  regulation_description: string;
  alignment_status: "fully_aligned" | "partially_aligned" | "not_aligned" | "under_review";
  last_alignment_check_date: string;
  gaps_identified: string[];
  remediation_actions: string[];
  remediation_completed: boolean;
  legislative_change_tracked: boolean;
  ofsted_recommendation_addressed: boolean;
  next_alignment_review_due: string;
  created_at: string;
}

export interface PolicyAccessibilityRecordInput {
  id: string;
  policy_id: string;
  policy_name: string;
  digital_copy_available: boolean;
  physical_copy_available: boolean;
  staff_accessible: boolean;
  young_people_version_available: boolean;
  easy_read_version_available: boolean;
  translated_versions_available: boolean;
  location_documented: boolean;
  last_accessibility_check_date: string;
  accessibility_issues: string[];
  issues_resolved: boolean;
  created_at: string;
}

export interface PolicyReviewCycleComplianceInput {
  today: string;
  total_staff: number;
  total_policies: number;
  review_schedule_records: PolicyReviewScheduleRecordInput[];
  version_control_records: PolicyVersionControlRecordInput[];
  acknowledgement_records: PolicyAcknowledgementRecordInput[];
  alignment_records: PolicyAlignmentRecordInput[];
  accessibility_records: PolicyAccessibilityRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type PolicyReviewRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PolicyReviewInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface PolicyReviewRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface PolicyReviewCycleComplianceResult {
  policy_rating: PolicyReviewRating;
  policy_score: number;
  headline: string;
  total_review_records: number;
  total_version_records: number;
  total_acknowledgement_records: number;
  total_alignment_records: number;
  total_accessibility_records: number;
  review_schedule_rate: number;
  version_control_rate: number;
  staff_acknowledgement_rate: number;
  regulatory_alignment_rate: number;
  accessibility_rate: number;
  update_timeliness_rate: number;
  review_schedule_records: PolicyReviewScheduleRecordInput[];
  version_control_records: PolicyVersionControlRecordInput[];
  acknowledgement_records: PolicyAcknowledgementRecordInput[];
  alignment_records: PolicyAlignmentRecordInput[];
  accessibility_records: PolicyAccessibilityRecordInput[];
  strengths: string[];
  concerns: string[];
  recommendations: PolicyReviewRecommendation[];
  insights: PolicyReviewInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PolicyReviewRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: PolicyReviewRating,
  score: number,
  headline: string,
): PolicyReviewCycleComplianceResult {
  return {
    policy_rating: rating,
    policy_score: score,
    headline,
    total_review_records: 0,
    total_version_records: 0,
    total_acknowledgement_records: 0,
    total_alignment_records: 0,
    total_accessibility_records: 0,
    review_schedule_rate: 0,
    version_control_rate: 0,
    staff_acknowledgement_rate: 0,
    regulatory_alignment_rate: 0,
    accessibility_rate: 0,
    update_timeliness_rate: 0,
    review_schedule_records: [],
    version_control_records: [],
    acknowledgement_records: [],
    alignment_records: [],
    accessibility_records: [],
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computePolicyReviewCycleCompliance(
  input: PolicyReviewCycleComplianceInput,
): PolicyReviewCycleComplianceResult {
  const {
    today,
    total_staff,
    total_policies,
    review_schedule_records,
    version_control_records,
    acknowledgement_records,
    alignment_records,
    accessibility_records,
  } = input;

  // ── Special case: all empty + 0 policies → insufficient_data ──────────
  const allEmpty =
    review_schedule_records.length === 0 &&
    version_control_records.length === 0 &&
    acknowledgement_records.length === 0 &&
    alignment_records.length === 0 &&
    accessibility_records.length === 0;

  if (allEmpty && total_policies === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No policies recorded — insufficient data to assess policy review cycle compliance.",
    );
  }

  // ── Special case: all empty + policies > 0 → inadequate ───────────────
  if (allEmpty && total_policies > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No policy review, version control, acknowledgement, alignment, or accessibility data recorded despite policies existing — policy governance requires urgent attention.",
      ),
      concerns: [
        "No policy review schedule records, version control records, staff acknowledgement records, regulatory alignment records, or accessibility records exist despite the home having documented policies — the home cannot evidence that policies are reviewed, updated, communicated to staff, aligned with regulations, or accessible to those who need them.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement a structured policy review cycle with scheduled reviews, version control, staff acknowledgement tracking, regulatory alignment checks, and accessibility audits to evidence the home's governance of its policy framework.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 36 — Policies for the protection of children",
        },
        {
          rank: 2,
          recommendation:
            "Ensure all staff receive, read, and acknowledge every policy relevant to their role, with version-controlled records maintained and comprehension confirmed through assessment or discussion.",
          urgency: "immediate",
          regulatory_ref: "SCCIF — Leadership and management",
        },
      ],
      insights: [
        {
          text: "The complete absence of policy governance records means Ofsted cannot verify that the home's policies are current, reviewed, communicated, regulatory-compliant, or accessible. This represents a fundamental gap in Reg 36 compliance and undermines the home's leadership and management evidence under SCCIF.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Review schedule metrics ---
  const totalReviewRecords = review_schedule_records.length;

  const reviewsCompleted = review_schedule_records.filter((r) => r.review_completed).length;
  const reviewScheduleRate = pct(reviewsCompleted, totalReviewRecords);

  const reviewsOnTime = review_schedule_records.filter(
    (r) => r.review_completed && r.days_overdue <= 0,
  ).length;
  const onTimeReviewRate = pct(reviewsOnTime, totalReviewRecords);

  const reviewsOverdue = review_schedule_records.filter(
    (r) => !r.review_completed && r.days_overdue > 0,
  ).length;
  const overdueRate = pct(reviewsOverdue, totalReviewRecords);

  const severelyOverdue = review_schedule_records.filter(
    (r) => !r.review_completed && r.days_overdue > 90,
  ).length;
  const severelyOverdueRate = pct(severelyOverdue, totalReviewRecords);

  const consultationUndertaken = review_schedule_records.filter(
    (r) => r.review_completed && r.consultation_undertaken,
  ).length;
  const consultationRate = pct(consultationUndertaken, reviewsCompleted);

  const youngPeopleConsulted = review_schedule_records.filter(
    (r) => r.review_completed && r.young_people_consulted,
  ).length;
  const youngPeopleConsultationRate = pct(youngPeopleConsulted, reviewsCompleted);

  // Safeguarding-specific tracking
  const safeguardingPolicies = review_schedule_records.filter(
    (r) => r.category === "safeguarding",
  );
  const safeguardingCompleted = safeguardingPolicies.filter((r) => r.review_completed).length;
  const safeguardingReviewRate = pct(safeguardingCompleted, safeguardingPolicies.length);

  const safeguardingOverdue = safeguardingPolicies.filter(
    (r) => !r.review_completed && r.days_overdue > 0,
  ).length;

  // --- Version control metrics ---
  const totalVersionRecords = version_control_records.length;

  const approvedVersions = version_control_records.filter(
    (r) => r.approval_date !== null && r.approval_date !== "",
  ).length;
  const approvalRate = pct(approvedVersions, totalVersionRecords);

  const archivedVersions = version_control_records.filter(
    (r) => r.superseded_version_archived,
  ).length;
  const archiveRate = pct(archivedVersions, totalVersionRecords);

  const changeLogMaintained = version_control_records.filter(
    (r) => r.change_log_maintained,
  ).length;
  const changeLogRate = pct(changeLogMaintained, totalVersionRecords);

  const rationalDocumented = version_control_records.filter(
    (r) => r.rationale_documented,
  ).length;
  const rationaleRate = pct(rationalDocumented, totalVersionRecords);

  // Version control composite: approved + archived + change_log + rationale
  const versionControlNumerator = approvedVersions + archivedVersions + changeLogMaintained + rationalDocumented;
  const versionControlDenominator = totalVersionRecords * 4;
  const versionControlRate = pct(versionControlNumerator, versionControlDenominator);

  // Update timeliness — policies updated within 14 days of effective date
  const timelyUpdates = version_control_records.filter((r) => {
    if (!r.approval_date || r.approval_date === "") return false;
    const daysToApprove = daysBetween(r.change_date, r.approval_date);
    return daysToApprove >= 0 && daysToApprove <= 14;
  }).length;
  const updateTimelinessRate = pct(timelyUpdates, totalVersionRecords);

  // --- Staff acknowledgement metrics ---
  const totalAcknowledgementRecords = acknowledgement_records.length;

  const acknowledged = acknowledgement_records.filter((r) => r.acknowledged).length;
  const staffAcknowledgementRate = pct(acknowledged, totalAcknowledgementRecords);

  const comprehensionConfirmed = acknowledgement_records.filter(
    (r) => r.acknowledged && r.comprehension_confirmed,
  ).length;
  const comprehensionRate = pct(comprehensionConfirmed, totalAcknowledgementRecords);

  const assessmentRequired = acknowledgement_records.filter(
    (r) => r.assessment_passed !== null,
  ).length;
  const assessmentPassed = acknowledgement_records.filter(
    (r) => r.assessment_passed === true,
  ).length;
  const assessmentPassRate = pct(assessmentPassed, assessmentRequired);

  const timelyAcknowledgements = acknowledgement_records.filter(
    (r) => r.acknowledged && r.days_to_acknowledge <= 14,
  ).length;
  const timelyAcknowledgementRate = pct(timelyAcknowledgements, totalAcknowledgementRecords);

  const outstandingAcknowledgements = acknowledgement_records.filter(
    (r) => !r.acknowledged,
  ).length;
  const outstandingAckRate = pct(outstandingAcknowledgements, totalAcknowledgementRecords);

  const remindersNeeded = acknowledgement_records.filter(
    (r) => !r.acknowledged && r.reminder_sent,
  ).length;

  // --- Regulatory alignment metrics ---
  const totalAlignmentRecords = alignment_records.length;

  const fullyAligned = alignment_records.filter(
    (r) => r.alignment_status === "fully_aligned",
  ).length;
  const regulatoryAlignmentRate = pct(fullyAligned, totalAlignmentRecords);

  const partiallyAligned = alignment_records.filter(
    (r) => r.alignment_status === "partially_aligned",
  ).length;
  const partialAlignmentRate = pct(partiallyAligned, totalAlignmentRecords);

  const notAligned = alignment_records.filter(
    (r) => r.alignment_status === "not_aligned",
  ).length;
  const nonAlignmentRate = pct(notAligned, totalAlignmentRecords);

  const gapsIdentified = alignment_records.filter(
    (r) => r.gaps_identified.length > 0,
  ).length;
  const totalGaps = alignment_records.reduce(
    (sum, r) => sum + r.gaps_identified.length, 0,
  );

  const remediationRequired = alignment_records.filter(
    (r) => r.remediation_actions.length > 0,
  ).length;
  const remediationCompleted = alignment_records.filter(
    (r) => r.remediation_actions.length > 0 && r.remediation_completed,
  ).length;
  const remediationCompletionRate = pct(remediationCompleted, remediationRequired);

  const legislativeTracked = alignment_records.filter(
    (r) => r.legislative_change_tracked,
  ).length;
  const legislativeTrackingRate = pct(legislativeTracked, totalAlignmentRecords);

  const ofstedRecsAddressed = alignment_records.filter(
    (r) => r.ofsted_recommendation_addressed,
  ).length;
  const ofstedRecRate = pct(ofstedRecsAddressed, totalAlignmentRecords);

  // --- Accessibility metrics ---
  const totalAccessibilityRecords = accessibility_records.length;

  const accessibilityChecks = [
    (a: PolicyAccessibilityRecordInput) => a.digital_copy_available,
    (a: PolicyAccessibilityRecordInput) => a.physical_copy_available,
    (a: PolicyAccessibilityRecordInput) => a.staff_accessible,
    (a: PolicyAccessibilityRecordInput) => a.young_people_version_available,
    (a: PolicyAccessibilityRecordInput) => a.easy_read_version_available,
    (a: PolicyAccessibilityRecordInput) => a.location_documented,
  ];
  const totalAccessChecksPossible = totalAccessibilityRecords * accessibilityChecks.length;
  let totalAccessChecksPassed = 0;
  for (const rec of accessibility_records) {
    for (const check of accessibilityChecks) {
      if (check(rec)) totalAccessChecksPassed++;
    }
  }
  const accessibilityRate = pct(totalAccessChecksPassed, totalAccessChecksPossible);

  const staffAccessible = accessibility_records.filter((r) => r.staff_accessible).length;
  const staffAccessRate = pct(staffAccessible, totalAccessibilityRecords);

  const youngPeopleVersions = accessibility_records.filter(
    (r) => r.young_people_version_available,
  ).length;
  const youngPeopleAccessRate = pct(youngPeopleVersions, totalAccessibilityRecords);

  const easyReadAvailable = accessibility_records.filter(
    (r) => r.easy_read_version_available,
  ).length;
  const easyReadRate = pct(easyReadAvailable, totalAccessibilityRecords);

  const translatedAvailable = accessibility_records.filter(
    (r) => r.translated_versions_available,
  ).length;
  const translationRate = pct(translatedAvailable, totalAccessibilityRecords);

  const accessIssuesIdentified = accessibility_records.filter(
    (r) => r.accessibility_issues.length > 0,
  ).length;
  const accessIssuesResolved = accessibility_records.filter(
    (r) => r.accessibility_issues.length > 0 && r.issues_resolved,
  ).length;
  const accessIssueResolutionRate = pct(accessIssuesResolved, accessIssuesIdentified);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: reviewScheduleRate (>=90: +5, >=70: +3) ---
  if (reviewScheduleRate >= 90) score += 5;
  else if (reviewScheduleRate >= 70) score += 3;

  // --- Bonus 2: versionControlRate (>=90: +5, >=70: +2) ---
  if (versionControlRate >= 90) score += 5;
  else if (versionControlRate >= 70) score += 2;

  // --- Bonus 3: staffAcknowledgementRate (>=90: +5, >=70: +2) ---
  if (staffAcknowledgementRate >= 90) score += 5;
  else if (staffAcknowledgementRate >= 70) score += 2;

  // --- Bonus 4: regulatoryAlignmentRate (>=90: +5, >=70: +2) ---
  if (regulatoryAlignmentRate >= 90) score += 5;
  else if (regulatoryAlignmentRate >= 70) score += 2;

  // --- Bonus 5: accessibilityRate (>=90: +4, >=70: +2) ---
  if (accessibilityRate >= 90) score += 4;
  else if (accessibilityRate >= 70) score += 2;

  // --- Bonus 6: updateTimelinessRate (>=90: +4, >=70: +2) ---
  if (updateTimelinessRate >= 90) score += 4;
  else if (updateTimelinessRate >= 70) score += 2;

  // Max bonuses: 5+5+5+5+4+4 = 28

  // ── Penalties (4 guarded) ─────────────────────────────────────────────

  // Penalty 1: reviewScheduleRate < 50 → -6
  if (reviewScheduleRate < 50 && totalReviewRecords > 0) score -= 6;

  // Penalty 2: staffAcknowledgementRate < 50 → -5
  if (staffAcknowledgementRate < 50 && totalAcknowledgementRecords > 0) score -= 5;

  // Penalty 3: regulatoryAlignmentRate < 40 → -5
  if (regulatoryAlignmentRate < 40 && totalAlignmentRecords > 0) score -= 5;

  // Penalty 4: severelyOverdueRate > 30 → -4
  if (severelyOverdueRate > 30 && totalReviewRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const policy_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (reviewScheduleRate >= 90 && totalReviewRecords > 0) {
    strengths.push(
      `${reviewScheduleRate}% policy review completion — the home maintains an exemplary review cycle ensuring all policies are current, relevant, and reflective of best practice. This demonstrates robust leadership and governance under SCCIF.`,
    );
  } else if (reviewScheduleRate >= 70 && totalReviewRecords > 0) {
    strengths.push(
      `${reviewScheduleRate}% policy review completion — the majority of policies are reviewed on schedule, demonstrating a generally effective review cycle.`,
    );
  }

  if (versionControlRate >= 90 && totalVersionRecords > 0) {
    strengths.push(
      `${versionControlRate}% version control compliance — policies are consistently approved, archived, change-logged, and rationale-documented, providing a comprehensive audit trail of policy evolution.`,
    );
  } else if (versionControlRate >= 70 && totalVersionRecords > 0) {
    strengths.push(
      `${versionControlRate}% version control compliance — the home generally maintains good version control practices across its policy framework.`,
    );
  }

  if (staffAcknowledgementRate >= 90 && totalAcknowledgementRecords > 0) {
    strengths.push(
      `${staffAcknowledgementRate}% staff policy acknowledgement — staff consistently read, understand, and confirm their awareness of policies, ensuring consistent practice across the home.`,
    );
  } else if (staffAcknowledgementRate >= 70 && totalAcknowledgementRecords > 0) {
    strengths.push(
      `${staffAcknowledgementRate}% staff policy acknowledgement — the majority of staff acknowledge policies within required timeframes.`,
    );
  }

  if (regulatoryAlignmentRate >= 90 && totalAlignmentRecords > 0) {
    strengths.push(
      `${regulatoryAlignmentRate}% regulatory alignment — policies are fully aligned with current legislation and regulatory requirements, demonstrating that the home proactively maintains compliance with Reg 36.`,
    );
  } else if (regulatoryAlignmentRate >= 70 && totalAlignmentRecords > 0) {
    strengths.push(
      `${regulatoryAlignmentRate}% regulatory alignment — the majority of policies are aligned with current regulatory requirements.`,
    );
  }

  if (accessibilityRate >= 90 && totalAccessibilityRecords > 0) {
    strengths.push(
      `${accessibilityRate}% policy accessibility — policies are available digitally, physically, in easy-read formats, and with young-people-friendly versions, ensuring everyone who needs them can access them.`,
    );
  } else if (accessibilityRate >= 70 && totalAccessibilityRecords > 0) {
    strengths.push(
      `${accessibilityRate}% policy accessibility — policies are generally accessible to staff and young people across multiple formats.`,
    );
  }

  if (updateTimelinessRate >= 90 && totalVersionRecords > 0) {
    strengths.push(
      `${updateTimelinessRate}% update timeliness — policy changes are approved and implemented promptly, ensuring the home always operates under current guidance.`,
    );
  } else if (updateTimelinessRate >= 70 && totalVersionRecords > 0) {
    strengths.push(
      `${updateTimelinessRate}% update timeliness — the majority of policy updates are approved within 14 days of the change being made.`,
    );
  }

  if (onTimeReviewRate >= 90 && totalReviewRecords > 0) {
    strengths.push(
      `${onTimeReviewRate}% of reviews completed on time — the home's review schedule discipline ensures policies never lapse, providing continuous protection for children.`,
    );
  } else if (onTimeReviewRate >= 70 && totalReviewRecords > 0) {
    strengths.push(
      `${onTimeReviewRate}% of reviews completed on time — the home generally meets its review schedule deadlines.`,
    );
  }

  if (comprehensionRate >= 90 && totalAcknowledgementRecords > 0) {
    strengths.push(
      `${comprehensionRate}% comprehension confirmation — staff not only acknowledge policies but confirm their understanding, ensuring knowledge is embedded in practice rather than just documented.`,
    );
  } else if (comprehensionRate >= 70 && totalAcknowledgementRecords > 0) {
    strengths.push(
      `${comprehensionRate}% comprehension confirmation — the majority of staff confirm they understand the policies they acknowledge.`,
    );
  }

  if (consultationRate >= 90 && reviewsCompleted > 0) {
    strengths.push(
      `${consultationRate}% consultation during reviews — the home routinely consults with stakeholders when reviewing policies, ensuring policies reflect diverse perspectives and practical realities.`,
    );
  } else if (consultationRate >= 70 && reviewsCompleted > 0) {
    strengths.push(
      `${consultationRate}% consultation during reviews — consultation is undertaken for the majority of policy reviews.`,
    );
  }

  if (youngPeopleConsultationRate >= 80 && reviewsCompleted > 0) {
    strengths.push(
      `${youngPeopleConsultationRate}% of reviews include young people's consultation — the home actively seeks the views of young people when reviewing policies that affect them, demonstrating child-centred governance.`,
    );
  }

  if (legislativeTrackingRate >= 90 && totalAlignmentRecords > 0) {
    strengths.push(
      `${legislativeTrackingRate}% legislative change tracking — the home proactively monitors legislative developments and ensures policies reflect current law.`,
    );
  }

  if (remediationCompletionRate >= 90 && remediationRequired > 0) {
    strengths.push(
      `${remediationCompletionRate}% remediation completion — where alignment gaps are identified, remediation actions are consistently completed, demonstrating responsive governance.`,
    );
  }

  if (safeguardingReviewRate >= 95 && safeguardingPolicies.length > 0) {
    strengths.push(
      `${safeguardingReviewRate}% safeguarding policy review completion — critical safeguarding policies are reviewed to the highest standard, reflecting the home's commitment to children's protection.`,
    );
  }

  if (youngPeopleAccessRate >= 80 && totalAccessibilityRecords > 0) {
    strengths.push(
      `${youngPeopleAccessRate}% of policies have young-people-friendly versions — the home ensures young people can understand and engage with policies that affect their care and rights.`,
    );
  }

  if (changeLogRate >= 90 && totalVersionRecords > 0) {
    strengths.push(
      `${changeLogRate}% change log maintenance — the home maintains a thorough audit trail of all policy amendments, supporting transparency and accountability.`,
    );
  }

  if (accessIssueResolutionRate >= 90 && accessIssuesIdentified > 0) {
    strengths.push(
      `${accessIssueResolutionRate}% of accessibility issues resolved — identified barriers to policy access are addressed promptly, ensuring policies remain available to all stakeholders.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (reviewScheduleRate < 50 && totalReviewRecords > 0) {
    concerns.push(
      `Only ${reviewScheduleRate}% of policy reviews completed — the majority of policies have not been reviewed on schedule, meaning the home is operating under potentially outdated guidance that may not reflect current legislation or best practice.`,
    );
  } else if (reviewScheduleRate < 70 && reviewScheduleRate >= 50 && totalReviewRecords > 0) {
    concerns.push(
      `Policy review completion at ${reviewScheduleRate}% — a notable proportion of policies have not been reviewed within their scheduled cycle, creating compliance risk.`,
    );
  }

  if (versionControlRate < 50 && totalVersionRecords > 0) {
    concerns.push(
      `Only ${versionControlRate}% version control compliance — policies lack proper approval, archiving, change logging, or rationale documentation, undermining the home's ability to demonstrate transparent governance of its policy framework.`,
    );
  } else if (versionControlRate < 70 && versionControlRate >= 50 && totalVersionRecords > 0) {
    concerns.push(
      `Version control compliance at ${versionControlRate}% — some policy changes are not fully documented, approved, or archived, weakening the audit trail.`,
    );
  }

  if (staffAcknowledgementRate < 50 && totalAcknowledgementRecords > 0) {
    concerns.push(
      `Only ${staffAcknowledgementRate}% staff policy acknowledgement — the majority of staff have not acknowledged key policies, meaning the home cannot evidence that staff understand the guidance under which they practice.`,
    );
  } else if (staffAcknowledgementRate < 70 && staffAcknowledgementRate >= 50 && totalAcknowledgementRecords > 0) {
    concerns.push(
      `Staff policy acknowledgement at ${staffAcknowledgementRate}% — a significant number of staff have not confirmed their awareness of current policies.`,
    );
  }

  if (regulatoryAlignmentRate < 40 && totalAlignmentRecords > 0) {
    concerns.push(
      `Only ${regulatoryAlignmentRate}% regulatory alignment — a significant proportion of policies are not aligned with current legislation, creating substantial compliance risk and potentially leaving children inadequately protected.`,
    );
  } else if (regulatoryAlignmentRate < 70 && regulatoryAlignmentRate >= 40 && totalAlignmentRecords > 0) {
    concerns.push(
      `Regulatory alignment at ${regulatoryAlignmentRate}% — some policies do not fully align with current regulations, requiring attention to ensure compliance.`,
    );
  }

  if (accessibilityRate < 50 && totalAccessibilityRecords > 0) {
    concerns.push(
      `Only ${accessibilityRate}% policy accessibility — policies are not consistently available in the formats and locations needed by staff and young people, undermining their practical usefulness.`,
    );
  } else if (accessibilityRate < 70 && accessibilityRate >= 50 && totalAccessibilityRecords > 0) {
    concerns.push(
      `Policy accessibility at ${accessibilityRate}% — some policies are not available in all required formats or accessible locations.`,
    );
  }

  if (severelyOverdueRate > 30 && totalReviewRecords > 0) {
    concerns.push(
      `${severelyOverdueRate}% of policies are more than 90 days overdue for review — severely overdue policies represent a governance failure and may contain guidance that is no longer legally compliant or reflective of current practice.`,
    );
  } else if (overdueRate > 30 && totalReviewRecords > 0) {
    concerns.push(
      `${overdueRate}% of policies are overdue for review — a substantial proportion of the policy framework is past its review date, creating cumulative compliance risk.`,
    );
  }

  if (safeguardingOverdue > 0 && safeguardingPolicies.length > 0) {
    concerns.push(
      `${safeguardingOverdue} safeguarding polic${safeguardingOverdue === 1 ? "y is" : "ies are"} overdue for review — safeguarding policies are the most critical component of the home's policy framework and must never be allowed to lapse.`,
    );
  }

  if (comprehensionRate < 50 && totalAcknowledgementRecords > 0) {
    concerns.push(
      `Only ${comprehensionRate}% comprehension confirmation — staff are acknowledging policies without confirming understanding, meaning acknowledgement is a procedural exercise rather than evidence of knowledge.`,
    );
  } else if (comprehensionRate < 70 && comprehensionRate >= 50 && totalAcknowledgementRecords > 0) {
    concerns.push(
      `Comprehension confirmation at ${comprehensionRate}% — not all staff who acknowledge policies confirm they understand the content.`,
    );
  }

  if (outstandingAckRate > 30 && totalAcknowledgementRecords > 0) {
    concerns.push(
      `${outstandingAckRate}% of policy acknowledgements remain outstanding — ${outstandingAcknowledgements} acknowledgement${outstandingAcknowledgements !== 1 ? "s have" : " has"} not been completed, meaning staff may be practising without awareness of current policies.`,
    );
  }

  if (nonAlignmentRate > 20 && totalAlignmentRecords > 0) {
    concerns.push(
      `${nonAlignmentRate}% of policies are not aligned with current regulations — ${notAligned} polic${notAligned === 1 ? "y does" : "ies do"} not meet regulatory requirements, creating direct non-compliance risk.`,
    );
  }

  if (remediationCompletionRate < 50 && remediationRequired > 0) {
    concerns.push(
      `Only ${remediationCompletionRate}% of alignment remediation actions completed — identified gaps between policies and regulations persist without resolution.`,
    );
  }

  if (youngPeopleAccessRate < 40 && totalAccessibilityRecords > 0) {
    concerns.push(
      `Only ${youngPeopleAccessRate}% of policies have young-people-friendly versions — young people cannot access or understand policies that directly affect their care, rights, and wellbeing.`,
    );
  }

  if (updateTimelinessRate < 50 && totalVersionRecords > 0) {
    concerns.push(
      `Only ${updateTimelinessRate}% update timeliness — policy changes are not being approved promptly, meaning staff may be working under outdated guidance for extended periods.`,
    );
  } else if (updateTimelinessRate < 70 && updateTimelinessRate >= 50 && totalVersionRecords > 0) {
    concerns.push(
      `Update timeliness at ${updateTimelinessRate}% — some policy changes take longer than 14 days to approve and implement.`,
    );
  }

  if (totalReviewRecords === 0 && total_policies > 0 && !allEmpty) {
    concerns.push(
      "No policy review schedule records exist despite the home having documented policies — the home cannot evidence that any policy has been formally reviewed.",
    );
  }

  if (totalAcknowledgementRecords === 0 && total_staff > 0 && !allEmpty) {
    concerns.push(
      "No staff policy acknowledgement records exist despite staff being employed — the home cannot evidence that staff have read or understood the policies under which they practice.",
    );
  }

  if (totalAlignmentRecords === 0 && total_policies > 0 && !allEmpty) {
    concerns.push(
      "No regulatory alignment records exist — the home cannot evidence that its policies are aligned with current legislation, CHR 2015 regulations, or SCCIF expectations.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: PolicyReviewRecommendation[] = [];
  let rank = 0;

  if (reviewScheduleRate < 50 && totalReviewRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all overdue policies — establish a prioritised schedule to bring the review cycle up to date, starting with safeguarding, health and safety, and care practice policies. Assign responsible reviewers and set clear deadlines.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Policies for the protection of children",
    });
  }

  if (safeguardingOverdue > 0 && safeguardingPolicies.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all overdue safeguarding policies immediately — safeguarding policies must be current and reflect the latest statutory guidance, local authority procedures, and learning from incidents. Overdue safeguarding policies are a serious regulatory concern.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Policies for the protection of children",
    });
  }

  if (staffAcknowledgementRate < 50 && totalAcknowledgementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement an urgent staff policy acknowledgement programme — ensure all staff receive, read, and formally acknowledge every policy relevant to their role. Track acknowledgements systematically and follow up on outstanding confirmations.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (regulatoryAlignmentRate < 40 && totalAlignmentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an immediate regulatory alignment audit across the entire policy framework — identify and address all gaps between policies and current legislation, CHR 2015 regulations, and SCCIF expectations. Non-aligned policies must be revised urgently.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Policies for the protection of children",
    });
  }

  if (severelyOverdueRate > 30 && totalReviewRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address all severely overdue policies (90+ days) as an immediate priority — policies this far past their review date pose significant compliance risk and may expose the home to regulatory criticism.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Policies for the protection of children",
    });
  }

  if (totalReviewRecords === 0 && total_policies > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a formal policy review schedule immediately — every policy must have a designated reviewer, review frequency, and next review date. Without review records, the home cannot evidence governance of its policy framework.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Policies for the protection of children",
    });
  }

  if (totalAcknowledgementRecords === 0 && total_staff > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a policy acknowledgement and tracking system — every staff member must formally acknowledge they have read and understood all policies relevant to their role, with records maintained as evidence of compliance.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (totalAlignmentRecords === 0 && total_policies > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission a regulatory alignment review across all policies — map each policy against relevant CHR 2015 regulations, SCCIF expectations, and current legislation to identify and address gaps.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Policies for the protection of children",
    });
  }

  if (versionControlRate < 50 && totalVersionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish robust version control processes — ensure every policy change is formally approved, previous versions archived, change logs maintained, and rationale documented. This audit trail is essential for demonstrating governance.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (accessibilityRate < 50 && totalAccessibilityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve policy accessibility across all formats — ensure policies are available digitally and physically, with young-people-friendly and easy-read versions. Policies must be accessible to everyone who needs them.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Policies for the protection of children",
    });
  }

  if (comprehensionRate < 50 && totalAcknowledgementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance policy acknowledgement to include comprehension checks — simple sign-off is insufficient; implement comprehension assessments, quizzes, or facilitated discussions to confirm staff truly understand policy content.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (remediationCompletionRate < 50 && remediationRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete outstanding alignment remediation actions — where gaps between policies and regulations have been identified, remediation must be completed promptly to achieve full compliance.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Policies for the protection of children",
    });
  }

  if (
    reviewScheduleRate >= 50 &&
    reviewScheduleRate < 70 &&
    totalReviewRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve policy review completion rate to at least 70% — review the review schedule for achievability, ensure responsible persons have protected time, and consider staggering reviews to distribute workload throughout the year.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Policies for the protection of children",
    });
  }

  if (
    staffAcknowledgementRate >= 50 &&
    staffAcknowledgementRate < 70 &&
    totalAcknowledgementRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase staff policy acknowledgement rate above 70% — implement reminder systems, include acknowledgement requirements in supervision, and provide protected time for staff to read and acknowledge policies.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (youngPeopleAccessRate < 40 && totalAccessibilityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop young-people-friendly versions of all key policies — ensure young people can understand policies affecting their care, rights, complaints, and safeguarding in age-appropriate and accessible formats.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    regulatoryAlignmentRate >= 40 &&
    regulatoryAlignmentRate < 70 &&
    totalAlignmentRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve regulatory alignment to at least 70% — prioritise policies that are partially or not aligned and schedule targeted review sessions to address identified gaps.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 36 — Policies for the protection of children",
    });
  }

  if (
    accessibilityRate >= 50 &&
    accessibilityRate < 70 &&
    totalAccessibilityRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance policy accessibility — ensure all policies are available in digital and physical formats, with easy-read and young-people-friendly versions prioritised for safeguarding and complaints policies.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 36 — Policies for the protection of children",
    });
  }

  if (
    versionControlRate >= 50 &&
    versionControlRate < 70 &&
    totalVersionRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen version control processes — ensure consistent change logging, rationale documentation, and archiving of superseded versions to maintain a complete audit trail.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (consultationRate < 70 && reviewsCompleted > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase stakeholder consultation during policy reviews — engage staff, young people, and relevant professionals in the review process to ensure policies are practical, inclusive, and reflective of lived experience.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (youngPeopleConsultationRate < 50 && reviewsCompleted > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Involve young people in policy reviews — ensure children and young people are consulted about policies that affect them, particularly safeguarding, complaints, behaviour management, and daily living policies.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    updateTimelinessRate >= 50 &&
    updateTimelinessRate < 70 &&
    totalVersionRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve the timeliness of policy change approvals — streamline the approval process to ensure policy updates are implemented within 14 days, minimising the period during which staff may be working under outdated guidance.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (easyReadRate < 50 && totalAccessibilityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create easy-read versions of key policies — ensure policies are available in formats accessible to staff and young people with different literacy levels or learning needs.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 36 — Policies for the protection of children",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: PolicyReviewInsight[] = [];

  // -- Critical insights --

  if (reviewScheduleRate < 50 && totalReviewRecords > 0) {
    insights.push({
      text: `Only ${reviewScheduleRate}% of policies reviewed on schedule. Ofsted expects that homes maintain a robust policy framework under Reg 36, with policies reviewed at appropriate intervals. When the majority of policies are out of date, the home cannot demonstrate effective governance or that children are protected by current guidance.`,
      severity: "critical",
    });
  }

  if (staffAcknowledgementRate < 50 && totalAcknowledgementRecords > 0) {
    insights.push({
      text: `Only ${staffAcknowledgementRate}% staff policy acknowledgement. When the majority of staff have not confirmed awareness of current policies, the home cannot evidence that practice is informed by policy. This creates risk that staff act inconsistently or contrary to the home's stated approach, undermining children's safety and care quality.`,
      severity: "critical",
    });
  }

  if (regulatoryAlignmentRate < 40 && totalAlignmentRecords > 0) {
    insights.push({
      text: `Only ${regulatoryAlignmentRate}% regulatory alignment. Policies that do not reflect current legislation and regulations leave the home exposed to non-compliance. Ofsted views regulatory alignment as fundamental to effective leadership and management — policies must be living documents that evolve with the regulatory landscape.`,
      severity: "critical",
    });
  }

  if (severelyOverdueRate > 30 && totalReviewRecords > 0) {
    insights.push({
      text: `${severelyOverdueRate}% of policies are more than 90 days overdue. Severely overdue policies represent a systemic governance failure. These policies may contain outdated procedures, superseded legislation references, or practices that have since been identified as inadequate. This directly undermines Reg 36 compliance.`,
      severity: "critical",
    });
  }

  if (safeguardingOverdue > 0 && safeguardingPolicies.length > 0) {
    insights.push({
      text: `${safeguardingOverdue} safeguarding polic${safeguardingOverdue === 1 ? "y is" : "ies are"} overdue for review. Safeguarding policies must always be current — they form the foundation of children's protection in the home. Overdue safeguarding policies are among the most serious concerns Ofsted can identify during inspection.`,
      severity: "critical",
    });
  }

  if (totalReviewRecords === 0 && total_policies > 0 && !allEmpty) {
    insights.push({
      text: "No policy review schedule records exist despite policies being documented. Without evidence of formal review, the home cannot demonstrate that policies are current, reflective of best practice, or responsive to regulatory changes. This is a fundamental governance gap under Reg 36.",
      severity: "critical",
    });
  }

  if (totalAcknowledgementRecords === 0 && total_staff > 0 && !allEmpty) {
    insights.push({
      text: "No staff policy acknowledgement records exist. Ofsted expects that staff are aware of, understand, and work within the home's policies. Without acknowledgement records, the home cannot evidence that policies translate into informed practice.",
      severity: "critical",
    });
  }

  if (totalAlignmentRecords === 0 && total_policies > 0 && !allEmpty) {
    insights.push({
      text: "No regulatory alignment records exist. Without alignment checks, the home cannot evidence that its policies meet the requirements of the Children's Homes (England) Regulations 2015, the SCCIF, or other relevant legislation. Policies may be in place but not legally compliant.",
      severity: "critical",
    });
  }

  if (nonAlignmentRate > 20 && totalAlignmentRecords > 0) {
    insights.push({
      text: `${nonAlignmentRate}% of policies are not aligned with current regulations. Non-aligned policies create direct regulatory risk — if policies do not reflect current law, staff may inadvertently breach regulatory requirements, and children may not receive the protection the legislation intends.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    reviewScheduleRate >= 50 &&
    reviewScheduleRate < 70 &&
    totalReviewRecords > 0
  ) {
    insights.push({
      text: `Policy review completion at ${reviewScheduleRate}% — improving but inconsistent. Some policies are not being reviewed within their scheduled cycle, which creates gradual drift from current practice and regulation. Consider whether the review schedule is realistic and whether reviewers have adequate time allocated.`,
      severity: "warning",
    });
  }

  if (
    versionControlRate >= 50 &&
    versionControlRate < 70 &&
    totalVersionRecords > 0
  ) {
    insights.push({
      text: `Version control compliance at ${versionControlRate}% — some policy changes lack full documentation. Incomplete version control means the home may struggle to demonstrate what changed, why, and when during Ofsted inspection. Consistent documentation builds a credible governance narrative.`,
      severity: "warning",
    });
  }

  if (
    staffAcknowledgementRate >= 50 &&
    staffAcknowledgementRate < 70 &&
    totalAcknowledgementRecords > 0
  ) {
    insights.push({
      text: `Staff acknowledgement at ${staffAcknowledgementRate}% — a proportion of staff have not confirmed awareness of current policies. Policy awareness gaps correlate with inconsistent practice. Consider whether the acknowledgement process is accessible and whether staff have protected time for policy reading.`,
      severity: "warning",
    });
  }

  if (
    regulatoryAlignmentRate >= 40 &&
    regulatoryAlignmentRate < 70 &&
    totalAlignmentRecords > 0
  ) {
    insights.push({
      text: `Regulatory alignment at ${regulatoryAlignmentRate}% — some policies require updating to reflect current regulatory requirements. Partial alignment creates uneven compliance across the policy framework, which may be highlighted during Ofsted inspection.`,
      severity: "warning",
    });
  }

  if (
    accessibilityRate >= 50 &&
    accessibilityRate < 70 &&
    totalAccessibilityRecords > 0
  ) {
    insights.push({
      text: `Policy accessibility at ${accessibilityRate}% — some policies are not available in all required formats or locations. When staff or young people cannot easily access a policy, it effectively does not exist for them. Accessibility is a practical prerequisite for policy implementation.`,
      severity: "warning",
    });
  }

  if (
    updateTimelinessRate >= 50 &&
    updateTimelinessRate < 70 &&
    totalVersionRecords > 0
  ) {
    insights.push({
      text: `Update timeliness at ${updateTimelinessRate}% — some policy changes are taking longer than 14 days to approve and implement. Delayed implementation means staff may be working under outdated guidance, creating a window of compliance risk.`,
      severity: "warning",
    });
  }

  if (
    comprehensionRate >= 50 &&
    comprehensionRate < 70 &&
    totalAcknowledgementRecords > 0
  ) {
    insights.push({
      text: `Comprehension confirmation at ${comprehensionRate}% — some staff acknowledge policies without confirming understanding. Acknowledgement without comprehension is a paper exercise. Genuine policy compliance requires that staff understand and can apply policy content in practice.`,
      severity: "warning",
    });
  }

  if (
    overdueRate > 20 &&
    overdueRate <= 30 &&
    totalReviewRecords > 0
  ) {
    insights.push({
      text: `${overdueRate}% of policies are overdue for review — while not yet at critical levels, accumulating overdue policies creates a backlog that becomes increasingly difficult to clear and may be noted during Ofsted inspection.`,
      severity: "warning",
    });
  }

  if (
    remediationCompletionRate >= 50 &&
    remediationCompletionRate < 70 &&
    remediationRequired > 0
  ) {
    insights.push({
      text: `Alignment remediation completion at ${remediationCompletionRate}% — some identified gaps between policies and regulations remain unresolved. Incomplete remediation means known compliance issues persist, which would be difficult to justify during inspection.`,
      severity: "warning",
    });
  }

  if (consultationRate < 50 && reviewsCompleted > 0) {
    insights.push({
      text: `Only ${consultationRate}% of reviews include stakeholder consultation. Policies developed without input from those who implement them or are affected by them may be impractical, disconnected from lived experience, or fail to address real operational challenges.`,
      severity: "warning",
    });
  }

  // Category analysis
  const categoryBreakdown: Record<string, { total: number; completed: number; overdue: number }> = {};
  for (const r of review_schedule_records) {
    if (!categoryBreakdown[r.category]) {
      categoryBreakdown[r.category] = { total: 0, completed: 0, overdue: 0 };
    }
    categoryBreakdown[r.category].total++;
    if (r.review_completed) categoryBreakdown[r.category].completed++;
    if (!r.review_completed && r.days_overdue > 0) categoryBreakdown[r.category].overdue++;
  }
  const worstCategories = Object.entries(categoryBreakdown)
    .filter(([, v]) => v.total > 0 && pct(v.completed, v.total) < 60)
    .sort((a, b) => pct(a[1].completed, a[1].total) - pct(b[1].completed, b[1].total))
    .slice(0, 3);
  if (worstCategories.length > 0) {
    const formatted = worstCategories
      .map(([cat, v]) => `${cat.replace(/_/g, " ")} (${pct(v.completed, v.total)}% completed, ${v.overdue} overdue)`)
      .join(", ");
    insights.push({
      text: `Weakest policy categories: ${formatted}. These categories require focused attention to bring review compliance up to standard. Consider whether workload, expertise, or prioritisation is causing the shortfall.`,
      severity: "warning",
    });
  }

  if (totalGaps > 5 && totalAlignmentRecords > 0) {
    insights.push({
      text: `${totalGaps} regulatory alignment gaps identified across ${gapsIdentified} polic${gapsIdentified === 1 ? "y" : "ies"}. A high number of gaps suggests systematic issues with how the home monitors and responds to regulatory changes, rather than isolated oversights.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (policy_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding policy governance — policies are reviewed on schedule, version-controlled effectively, acknowledged by staff with confirmed comprehension, aligned with current regulations, and accessible to all stakeholders. This is strong evidence of effective leadership and management under SCCIF and robust compliance with Reg 36.",
      severity: "positive",
    });
  }

  if (
    reviewScheduleRate >= 90 &&
    onTimeReviewRate >= 90 &&
    totalReviewRecords > 0
  ) {
    insights.push({
      text: `${reviewScheduleRate}% review completion with ${onTimeReviewRate}% on time — the home maintains exceptional discipline in its policy review cycle, ensuring that policies always reflect current practice, legislation, and best evidence. This proactive approach protects children and supports staff confidence.`,
      severity: "positive",
    });
  }

  if (
    staffAcknowledgementRate >= 90 &&
    comprehensionRate >= 90 &&
    totalAcknowledgementRecords > 0
  ) {
    insights.push({
      text: `${staffAcknowledgementRate}% acknowledgement with ${comprehensionRate}% comprehension confirmation — staff not only receive policies but demonstrably understand them. This ensures that policies genuinely inform practice, creating consistency and safety across the home.`,
      severity: "positive",
    });
  }

  if (
    regulatoryAlignmentRate >= 90 &&
    legislativeTrackingRate >= 90 &&
    totalAlignmentRecords > 0
  ) {
    insights.push({
      text: `${regulatoryAlignmentRate}% regulatory alignment with ${legislativeTrackingRate}% legislative change tracking — the home proactively monitors and responds to regulatory developments, ensuring policies are always compliant. This is exemplary governance under Reg 36.`,
      severity: "positive",
    });
  }

  if (
    versionControlRate >= 90 &&
    totalVersionRecords > 0
  ) {
    insights.push({
      text: `${versionControlRate}% version control compliance — every policy change is properly approved, archived, logged, and documented. This comprehensive audit trail demonstrates transparent governance and supports accountability.`,
      severity: "positive",
    });
  }

  if (
    accessibilityRate >= 90 &&
    totalAccessibilityRecords > 0
  ) {
    insights.push({
      text: `${accessibilityRate}% policy accessibility — policies are available in digital, physical, easy-read, and young-people-friendly formats. Exceptional accessibility means policies are living documents that inform practice rather than shelf documents.`,
      severity: "positive",
    });
  }

  if (
    updateTimelinessRate >= 90 &&
    totalVersionRecords > 0
  ) {
    insights.push({
      text: `${updateTimelinessRate}% update timeliness — policy changes are approved and implemented promptly, minimising the period during which staff might work under outdated guidance. This rapid response to change demonstrates agile governance.`,
      severity: "positive",
    });
  }

  if (youngPeopleConsultationRate >= 80 && youngPeopleAccessRate >= 80 && reviewsCompleted > 0 && totalAccessibilityRecords > 0) {
    insights.push({
      text: `${youngPeopleConsultationRate}% young people consultation with ${youngPeopleAccessRate}% young-people-friendly policy availability — the home actively involves children in shaping and accessing policies that affect them.`,
      severity: "positive",
    });
  }

  if (safeguardingReviewRate >= 95 && safeguardingPolicies.length > 0) {
    insights.push({
      text: `${safeguardingReviewRate}% safeguarding policy review completion — the most critical category of policies is reviewed to the highest standard, directly supporting children's protection.`,
      severity: "positive",
    });
  }

  if (consultationRate >= 90 && reviewsCompleted > 0) {
    insights.push({
      text: `${consultationRate}% consultation rate during reviews — the home consistently involves stakeholders in policy development, ensuring policies are practical and informed by lived experience.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (policy_rating === "outstanding") {
    headline =
      "Outstanding policy review cycle compliance — policies are reviewed on schedule, version-controlled, acknowledged by staff, regulatory-aligned, and accessible across the home.";
  } else if (policy_rating === "good") {
    headline = `Good policy review cycle compliance — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (policy_rating === "adequate") {
    headline = `Adequate policy review cycle compliance — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to demonstrate robust policy governance.`;
  } else {
    headline = `Policy review cycle compliance is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to evidence effective policy governance under Reg 36.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    policy_rating,
    policy_score: score,
    headline,
    total_review_records: totalReviewRecords,
    total_version_records: totalVersionRecords,
    total_acknowledgement_records: totalAcknowledgementRecords,
    total_alignment_records: totalAlignmentRecords,
    total_accessibility_records: totalAccessibilityRecords,
    review_schedule_rate: reviewScheduleRate,
    version_control_rate: versionControlRate,
    staff_acknowledgement_rate: staffAcknowledgementRate,
    regulatory_alignment_rate: regulatoryAlignmentRate,
    accessibility_rate: accessibilityRate,
    update_timeliness_rate: updateTimelinessRate,
    review_schedule_records,
    version_control_records,
    acknowledgement_records,
    alignment_records,
    accessibility_records,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
