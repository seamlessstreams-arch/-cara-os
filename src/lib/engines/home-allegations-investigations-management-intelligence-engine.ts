// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ALLEGATIONS & INVESTIGATIONS MANAGEMENT INTELLIGENCE ENGINE
// Home-level: analyses allegation recording timeliness, LADO referral compliance,
// investigation completion rates, outcome documentation, and safeguarding
// response effectiveness.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 34 (Employment of staff), Reg 35 (Fitness of staff),
// Reg 36 (Review of quality of care), SCCIF: Safety.
// Store keys: allegationRecords, ladoReferralRecords, investigationRecords,
//             outcomeRecords, safeguardingResponseRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AllegationRecordInput {
  id: string;
  date_received: string;
  date_recorded: string;
  allegation_type: string; // "physical_abuse"|"emotional_abuse"|"sexual_abuse"|"neglect"|"inappropriate_behaviour"|"boundary_violation"|"professional_conduct"|"other"
  subject_role: string; // "permanent_staff"|"agency_staff"|"volunteer"|"manager"|"other"
  child_id: string | null;
  recorded_within_24h: boolean;
  initial_risk_assessment_completed: boolean;
  child_safeguarded_immediately: boolean;
  staff_member_suspended: boolean;
  witness_statements_taken: boolean;
  evidence_preserved: boolean;
  chronology_maintained: boolean;
  dbs_check_current: boolean;
  reporter_type: string; // "child"|"staff"|"parent"|"external_professional"|"anonymous"|"self_referral"|"other"
  severity: string; // "low"|"medium"|"high"|"critical"
  status: string; // "open"|"under_investigation"|"lado_referred"|"closed"|"nfa"
  created_at: string;
}

export interface LadoReferralRecordInput {
  id: string;
  allegation_id: string;
  date_allegation_received: string;
  date_lado_contacted: string;
  referred_within_1_working_day: boolean;
  lado_acknowledged: boolean;
  strategy_meeting_held: boolean;
  strategy_meeting_date: string | null;
  strategy_meeting_within_5_days: boolean;
  ofsted_notified: boolean;
  ofsted_notification_date: string | null;
  ofsted_notified_within_required_timeframe: boolean;
  dbs_referral_made: boolean;
  police_involved: boolean;
  local_authority_informed: boolean;
  multi_agency_approach: boolean;
  outcome_shared_with_home: boolean;
  referral_quality_adequate: boolean;
  status: string; // "pending"|"accepted"|"strategy_meeting"|"investigation"|"outcome_reached"|"closed"
  created_at: string;
}

export interface InvestigationRecordInput {
  id: string;
  allegation_id: string;
  investigation_type: string; // "internal"|"lado"|"police"|"joint"|"disciplinary"|"regulatory"
  date_opened: string;
  date_closed: string | null;
  is_open: boolean;
  target_completion_days: number;
  actual_completion_days: number; // -1 if still open
  completed_within_target: boolean;
  investigation_plan_in_place: boolean;
  terms_of_reference_set: boolean;
  investigator_independent: boolean;
  witness_interviews_completed: boolean;
  evidence_reviewed: boolean;
  interim_measures_in_place: boolean;
  child_supported_throughout: boolean;
  staff_member_supported: boolean;
  regular_updates_provided: boolean;
  findings_documented: boolean;
  management_oversight: boolean;
  quality_assured: boolean;
  created_at: string;
}

export interface OutcomeRecordInput {
  id: string;
  allegation_id: string;
  investigation_id: string | null;
  outcome_type: string; // "substantiated"|"unsubstantiated"|"unfounded"|"malicious"|"false"|"pending"
  date_outcome_reached: string;
  outcome_documented: boolean;
  outcome_shared_with_subject: boolean;
  outcome_shared_with_child: boolean;
  outcome_shared_with_parents: boolean;
  outcome_shared_with_placing_authority: boolean;
  action_plan_created: boolean;
  action_plan_implemented: boolean;
  lessons_learned_recorded: boolean;
  lessons_shared_with_team: boolean;
  policy_review_triggered: boolean;
  training_needs_identified: boolean;
  training_delivered: boolean;
  dbs_status_updated: boolean;
  single_central_record_updated: boolean;
  appeal_process_offered: boolean;
  support_plan_for_child: boolean;
  support_plan_for_staff: boolean;
  regulatory_notifications_completed: boolean;
  created_at: string;
}

export interface SafeguardingResponseRecordInput {
  id: string;
  allegation_id: string;
  date_allegation_received: string;
  date_response_initiated: string;
  response_within_1_hour: boolean;
  child_safety_plan_in_place: boolean;
  child_wishes_captured: boolean;
  child_informed_age_appropriately: boolean;
  independent_advocate_offered: boolean;
  other_children_risk_assessed: boolean;
  contact_restrictions_applied: boolean;
  supervision_arrangements_reviewed: boolean;
  staff_deployment_adjusted: boolean;
  whistleblowing_policy_followed: boolean;
  no_unsupervised_contact: boolean;
  safeguarding_lead_informed: boolean;
  ri_informed: boolean;
  management_oversight_documented: boolean;
  follow_up_actions_set: boolean;
  follow_up_actions_completed: boolean;
  created_at: string;
}

export interface AllegationsInvestigationsInput {
  today: string;
  total_children: number;
  allegation_records: AllegationRecordInput[];
  lado_referral_records: LadoReferralRecordInput[];
  investigation_records: InvestigationRecordInput[];
  outcome_records: OutcomeRecordInput[];
  safeguarding_response_records: SafeguardingResponseRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type AllegationsInvestigationsRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AllegationsInvestigationsInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface AllegationsInvestigationsRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface AllegationsInvestigationsResult {
  allegations_rating: AllegationsInvestigationsRating;
  allegations_score: number;
  headline: string;
  allegation_recording_rate: number;
  lado_referral_rate: number;
  investigation_completion_rate: number;
  outcome_documentation_rate: number;
  safeguarding_response_rate: number;
  timeliness_rate: number;
  total_allegations: number;
  total_lado_referrals: number;
  total_investigations: number;
  total_outcomes: number;
  total_safeguarding_responses: number;
  open_investigations: number;
  substantiated_count: number;
  strengths: string[];
  concerns: string[];
  recommendations: AllegationsInvestigationsRecommendation[];
  insights: AllegationsInvestigationsInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): AllegationsInvestigationsRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00Z");
  const b = new Date(dateB + "T00:00:00Z");
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: AllegationsInvestigationsRating,
  score: number,
  headline: string,
): AllegationsInvestigationsResult {
  return {
    allegations_rating: rating,
    allegations_score: score,
    headline,
    allegation_recording_rate: 0,
    lado_referral_rate: 0,
    investigation_completion_rate: 0,
    outcome_documentation_rate: 0,
    safeguarding_response_rate: 0,
    timeliness_rate: 0,
    total_allegations: 0,
    total_lado_referrals: 0,
    total_investigations: 0,
    total_outcomes: 0,
    total_safeguarding_responses: 0,
    open_investigations: 0,
    substantiated_count: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeAllegationsInvestigationsManagement(
  input: AllegationsInvestigationsInput,
): AllegationsInvestigationsResult {
  const {
    today,
    total_children,
    allegation_records,
    lado_referral_records,
    investigation_records,
    outcome_records,
    safeguarding_response_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    allegation_records.length === 0 &&
    lado_referral_records.length === 0 &&
    investigation_records.length === 0 &&
    outcome_records.length === 0 &&
    safeguarding_response_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess allegations and investigations management.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No allegations and investigations management data recorded despite children on placement — allegation handling procedures, LADO referral processes, and safeguarding response systems require urgent establishment.",
      ),
      concerns: [
        "No allegation records, LADO referral records, investigation records, outcome documentation, or safeguarding response records exist despite children being on placement — the home cannot evidence that it has systems in place to manage allegations against staff in accordance with Reg 34 and Reg 35.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Immediately establish a comprehensive allegations management framework including recording procedures, LADO referral protocols, investigation processes, outcome documentation, and safeguarding response plans. All staff must be trained on allegation handling procedures.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 34 — Employment of staff",
        },
        {
          rank: 2,
          recommendation:
            "Develop and implement safeguarding response protocols that ensure children are immediately safeguarded when an allegation is received, with child safety plans, risk assessments of other children, and documented management oversight throughout.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 35 — Fitness of staff",
        },
      ],
      insights: [
        {
          text: "The complete absence of allegations management records means Ofsted cannot verify that the home has effective systems to handle allegations against staff. Under Reg 34 and Reg 35, the home must demonstrate robust recruitment, supervision, and allegation handling to ensure children are safe. This is a fundamental SCCIF safety gap.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  const totalAllegations = allegation_records.length;
  const totalLadoReferrals = lado_referral_records.length;
  const totalInvestigations = investigation_records.length;
  const totalOutcomes = outcome_records.length;
  const totalSafeguardingResponses = safeguarding_response_records.length;

  // --- Allegation recording metrics ---

  // Recorded within 24 hours
  const recordedWithin24h = allegation_records.filter(
    (a) => a.recorded_within_24h,
  ).length;
  const allegationRecordingRate = pct(recordedWithin24h, totalAllegations);

  // Initial risk assessments completed
  const riskAssessmentsCompleted = allegation_records.filter(
    (a) => a.initial_risk_assessment_completed,
  ).length;
  const riskAssessmentRate = pct(riskAssessmentsCompleted, totalAllegations);

  // Children safeguarded immediately
  const childrenSafeguarded = allegation_records.filter(
    (a) => a.child_safeguarded_immediately,
  ).length;
  const immediateSafeguardingRate = pct(childrenSafeguarded, totalAllegations);

  // Evidence preservation
  const evidencePreserved = allegation_records.filter(
    (a) => a.evidence_preserved,
  ).length;
  const evidencePreservationRate = pct(evidencePreserved, totalAllegations);

  // Witness statements taken
  const witnessStatementsTaken = allegation_records.filter(
    (a) => a.witness_statements_taken,
  ).length;
  const witnessStatementRate = pct(witnessStatementsTaken, totalAllegations);

  // Chronology maintained
  const chronologyMaintained = allegation_records.filter(
    (a) => a.chronology_maintained,
  ).length;
  const chronologyRate = pct(chronologyMaintained, totalAllegations);

  // DBS checks current for subject of allegation
  const dbsCurrent = allegation_records.filter(
    (a) => a.dbs_check_current,
  ).length;
  const dbsCurrentRate = pct(dbsCurrent, totalAllegations);

  // Allegation type distribution
  const highSeverityAllegations = allegation_records.filter(
    (a) => a.severity === "high" || a.severity === "critical",
  ).length;
  const criticalAllegations = allegation_records.filter(
    (a) => a.severity === "critical",
  ).length;
  const openAllegations = allegation_records.filter(
    (a) => a.status === "open" || a.status === "under_investigation",
  ).length;

  // Allegations by subject role
  const agencyStaffAllegations = allegation_records.filter(
    (a) => a.subject_role === "agency_staff",
  ).length;
  const managerAllegations = allegation_records.filter(
    (a) => a.subject_role === "manager",
  ).length;

  // Repeat allegations (same child_id appearing multiple times)
  const childAllegationCounts = new Map<string, number>();
  for (const a of allegation_records) {
    if (a.child_id) {
      childAllegationCounts.set(
        a.child_id,
        (childAllegationCounts.get(a.child_id) ?? 0) + 1,
      );
    }
  }
  const childrenWithRepeatAllegations = Array.from(
    childAllegationCounts.values(),
  ).filter((c) => c > 1).length;

  // --- LADO referral metrics ---

  // Referred within 1 working day
  const referredWithin1Day = lado_referral_records.filter(
    (r) => r.referred_within_1_working_day,
  ).length;
  const ladoReferralRate = pct(referredWithin1Day, totalLadoReferrals);

  // Strategy meetings held
  const strategyMeetingsHeld = lado_referral_records.filter(
    (r) => r.strategy_meeting_held,
  ).length;
  const strategyMeetingRate = pct(strategyMeetingsHeld, totalLadoReferrals);

  // Strategy meetings within 5 days
  const strategyMeetingsTimely = lado_referral_records.filter(
    (r) => r.strategy_meeting_held && r.strategy_meeting_within_5_days,
  ).length;
  const strategyMeetingTimelinessRate = pct(
    strategyMeetingsTimely,
    strategyMeetingsHeld > 0 ? strategyMeetingsHeld : totalLadoReferrals,
  );

  // Ofsted notified
  const ofstedNotified = lado_referral_records.filter(
    (r) => r.ofsted_notified,
  ).length;
  const ofstedNotificationRate = pct(ofstedNotified, totalLadoReferrals);

  // Ofsted notified within required timeframe
  const ofstedNotifiedTimely = lado_referral_records.filter(
    (r) => r.ofsted_notified && r.ofsted_notified_within_required_timeframe,
  ).length;
  const ofstedTimelinessRate = pct(
    ofstedNotifiedTimely,
    ofstedNotified > 0 ? ofstedNotified : totalLadoReferrals,
  );

  // Multi-agency approach
  const multiAgencyApproach = lado_referral_records.filter(
    (r) => r.multi_agency_approach,
  ).length;
  const multiAgencyRate = pct(multiAgencyApproach, totalLadoReferrals);

  // Referral quality adequate
  const referralQualityAdequate = lado_referral_records.filter(
    (r) => r.referral_quality_adequate,
  ).length;
  const referralQualityRate = pct(referralQualityAdequate, totalLadoReferrals);

  // DBS referrals made where needed
  const dbsReferralsMade = lado_referral_records.filter(
    (r) => r.dbs_referral_made,
  ).length;
  const dbsReferralRate = pct(dbsReferralsMade, totalLadoReferrals);

  // Local authority informed
  const laInformed = lado_referral_records.filter(
    (r) => r.local_authority_informed,
  ).length;
  const laInformedRate = pct(laInformed, totalLadoReferrals);

  // Outcome shared with home
  const outcomeShared = lado_referral_records.filter(
    (r) => r.outcome_shared_with_home,
  ).length;
  const outcomeSharedRate = pct(outcomeShared, totalLadoReferrals);

  // --- Investigation metrics ---

  // Open investigations
  const openInvestigations = investigation_records.filter(
    (i) => i.is_open,
  ).length;

  // Completed investigations
  const completedInvestigations = investigation_records.filter(
    (i) => !i.is_open,
  ).length;
  const investigationCompletionRate = pct(
    completedInvestigations,
    totalInvestigations,
  );

  // Completed within target
  const completedWithinTarget = investigation_records.filter(
    (i) => !i.is_open && i.completed_within_target,
  ).length;
  const completionWithinTargetRate = pct(
    completedWithinTarget,
    completedInvestigations > 0 ? completedInvestigations : totalInvestigations,
  );

  // Investigation plan in place
  const investigationPlansInPlace = investigation_records.filter(
    (i) => i.investigation_plan_in_place,
  ).length;
  const investigationPlanRate = pct(
    investigationPlansInPlace,
    totalInvestigations,
  );

  // Terms of reference set
  const termsOfReferenceSet = investigation_records.filter(
    (i) => i.terms_of_reference_set,
  ).length;
  const termsOfReferenceRate = pct(termsOfReferenceSet, totalInvestigations);

  // Investigator independence
  const independentInvestigators = investigation_records.filter(
    (i) => i.investigator_independent,
  ).length;
  const independenceRate = pct(independentInvestigators, totalInvestigations);

  // Child supported throughout
  const childSupported = investigation_records.filter(
    (i) => i.child_supported_throughout,
  ).length;
  const childSupportRate = pct(childSupported, totalInvestigations);

  // Staff member supported
  const staffSupported = investigation_records.filter(
    (i) => i.staff_member_supported,
  ).length;
  const staffSupportRate = pct(staffSupported, totalInvestigations);

  // Regular updates provided
  const regularUpdates = investigation_records.filter(
    (i) => i.regular_updates_provided,
  ).length;
  const regularUpdatesRate = pct(regularUpdates, totalInvestigations);

  // Findings documented
  const findingsDocumented = investigation_records.filter(
    (i) => i.findings_documented,
  ).length;
  const findingsDocumentedRate = pct(findingsDocumented, totalInvestigations);

  // Management oversight
  const managementOversight = investigation_records.filter(
    (i) => i.management_oversight,
  ).length;
  const managementOversightRate = pct(managementOversight, totalInvestigations);

  // Quality assured
  const qualityAssured = investigation_records.filter(
    (i) => i.quality_assured,
  ).length;
  const qualityAssuredRate = pct(qualityAssured, totalInvestigations);

  // Interim measures
  const interimMeasures = investigation_records.filter(
    (i) => i.interim_measures_in_place,
  ).length;
  const interimMeasuresRate = pct(interimMeasures, totalInvestigations);

  // Average completion days for completed investigations
  const completedDays = investigation_records
    .filter((i) => !i.is_open && i.actual_completion_days >= 0)
    .map((i) => i.actual_completion_days);
  const avgCompletionDays =
    completedDays.length > 0
      ? Math.round(
          completedDays.reduce((sum, d) => sum + d, 0) / completedDays.length,
        )
      : 0;

  // Overdue open investigations (open longer than target). An open investigation
  // with a missing/invalid date_opened yields NaN — treat that as overdue too,
  // since NaN > target is false and would otherwise hide an un-dated open case.
  const overdueInvestigations = investigation_records.filter((i) => {
    if (!i.is_open) return false;
    const daysOpen = daysBetween(i.date_opened, today);
    return Number.isNaN(daysOpen) || daysOpen > i.target_completion_days;
  }).length;

  // --- Outcome documentation metrics ---

  // Outcomes documented
  const outcomesDocumented = outcome_records.filter(
    (o) => o.outcome_documented,
  ).length;
  const outcomeDocumentationRate = pct(outcomesDocumented, totalOutcomes);

  // Substantiated outcomes
  const substantiatedOutcomes = outcome_records.filter(
    (o) => o.outcome_type === "substantiated",
  ).length;

  // Action plans created
  const actionPlansCreated = outcome_records.filter(
    (o) => o.action_plan_created,
  ).length;
  const actionPlanRate = pct(actionPlansCreated, totalOutcomes);

  // Action plans implemented
  const actionPlansImplemented = outcome_records.filter(
    (o) => o.action_plan_created && o.action_plan_implemented,
  ).length;
  const actionPlanImplementationRate = pct(
    actionPlansImplemented,
    actionPlansCreated > 0 ? actionPlansCreated : totalOutcomes,
  );

  // Lessons learned recorded
  const lessonsRecorded = outcome_records.filter(
    (o) => o.lessons_learned_recorded,
  ).length;
  const lessonsRecordedRate = pct(lessonsRecorded, totalOutcomes);

  // Lessons shared with team
  const lessonsShared = outcome_records.filter(
    (o) => o.lessons_shared_with_team,
  ).length;
  const lessonsSharedRate = pct(lessonsShared, totalOutcomes);

  // Training needs identified
  const trainingNeedsIdentified = outcome_records.filter(
    (o) => o.training_needs_identified,
  ).length;
  const trainingNeedsRate = pct(trainingNeedsIdentified, totalOutcomes);

  // Training delivered
  const trainingDelivered = outcome_records.filter(
    (o) => o.training_needs_identified && o.training_delivered,
  ).length;
  const trainingDeliveryRate = pct(
    trainingDelivered,
    trainingNeedsIdentified > 0 ? trainingNeedsIdentified : totalOutcomes,
  );

  // Outcome shared with subject
  const sharedWithSubject = outcome_records.filter(
    (o) => o.outcome_shared_with_subject,
  ).length;
  const sharedWithSubjectRate = pct(sharedWithSubject, totalOutcomes);

  // Outcome shared with child
  const sharedWithChild = outcome_records.filter(
    (o) => o.outcome_shared_with_child,
  ).length;
  const sharedWithChildRate = pct(sharedWithChild, totalOutcomes);

  // Outcome shared with placing authority
  const sharedWithPlacingAuthority = outcome_records.filter(
    (o) => o.outcome_shared_with_placing_authority,
  ).length;
  const sharedWithPARate = pct(sharedWithPlacingAuthority, totalOutcomes);

  // Single central record updated
  const scrUpdated = outcome_records.filter(
    (o) => o.single_central_record_updated,
  ).length;
  const scrUpdateRate = pct(scrUpdated, totalOutcomes);

  // Regulatory notifications completed
  const regNotifications = outcome_records.filter(
    (o) => o.regulatory_notifications_completed,
  ).length;
  const regNotificationRate = pct(regNotifications, totalOutcomes);

  // Appeal process offered
  const appealOffered = outcome_records.filter(
    (o) => o.appeal_process_offered,
  ).length;
  const appealOfferedRate = pct(appealOffered, totalOutcomes);

  // Support plan for child
  const supportPlanChild = outcome_records.filter(
    (o) => o.support_plan_for_child,
  ).length;
  const supportPlanChildRate = pct(supportPlanChild, totalOutcomes);

  // Support plan for staff
  const supportPlanStaff = outcome_records.filter(
    (o) => o.support_plan_for_staff,
  ).length;
  const supportPlanStaffRate = pct(supportPlanStaff, totalOutcomes);

  // Policy review triggered
  const policyReview = outcome_records.filter(
    (o) => o.policy_review_triggered,
  ).length;
  const policyReviewRate = pct(policyReview, totalOutcomes);

  // --- Safeguarding response metrics ---

  // Response within 1 hour
  const responsesWithin1h = safeguarding_response_records.filter(
    (s) => s.response_within_1_hour,
  ).length;
  const safeguardingResponseRate = pct(
    responsesWithin1h,
    totalSafeguardingResponses,
  );

  // Child safety plan in place
  const childSafetyPlan = safeguarding_response_records.filter(
    (s) => s.child_safety_plan_in_place,
  ).length;
  const childSafetyPlanRate = pct(childSafetyPlan, totalSafeguardingResponses);

  // Child wishes captured
  const childWishesCaptured = safeguarding_response_records.filter(
    (s) => s.child_wishes_captured,
  ).length;
  const childWishesRate = pct(childWishesCaptured, totalSafeguardingResponses);

  // Child informed age-appropriately
  const childInformed = safeguarding_response_records.filter(
    (s) => s.child_informed_age_appropriately,
  ).length;
  const childInformedRate = pct(childInformed, totalSafeguardingResponses);

  // Independent advocate offered
  const advocateOffered = safeguarding_response_records.filter(
    (s) => s.independent_advocate_offered,
  ).length;
  const advocateOfferedRate = pct(advocateOffered, totalSafeguardingResponses);

  // Other children risk assessed
  const otherChildrenAssessed = safeguarding_response_records.filter(
    (s) => s.other_children_risk_assessed,
  ).length;
  const otherChildrenAssessedRate = pct(
    otherChildrenAssessed,
    totalSafeguardingResponses,
  );

  // No unsupervised contact ensured
  const noUnsupervisedContact = safeguarding_response_records.filter(
    (s) => s.no_unsupervised_contact,
  ).length;
  const noUnsupervisedContactRate = pct(
    noUnsupervisedContact,
    totalSafeguardingResponses,
  );

  // Safeguarding lead informed
  const safeguardingLeadInformed = safeguarding_response_records.filter(
    (s) => s.safeguarding_lead_informed,
  ).length;
  const safeguardingLeadRate = pct(
    safeguardingLeadInformed,
    totalSafeguardingResponses,
  );

  // RI informed
  const riInformed = safeguarding_response_records.filter(
    (s) => s.ri_informed,
  ).length;
  const riInformedRate = pct(riInformed, totalSafeguardingResponses);

  // Management oversight documented
  const mgmtOversightSafeguarding = safeguarding_response_records.filter(
    (s) => s.management_oversight_documented,
  ).length;
  const mgmtOversightSafeguardingRate = pct(
    mgmtOversightSafeguarding,
    totalSafeguardingResponses,
  );

  // Follow-up actions completed
  const followUpActionsSet = safeguarding_response_records.filter(
    (s) => s.follow_up_actions_set,
  ).length;
  const followUpCompleted = safeguarding_response_records.filter(
    (s) => s.follow_up_actions_set && s.follow_up_actions_completed,
  ).length;
  const followUpCompletionRate = pct(
    followUpCompleted,
    followUpActionsSet > 0 ? followUpActionsSet : totalSafeguardingResponses,
  );

  // Whistleblowing policy followed
  const whistleblowingFollowed = safeguarding_response_records.filter(
    (s) => s.whistleblowing_policy_followed,
  ).length;
  const whistleblowingRate = pct(
    whistleblowingFollowed,
    totalSafeguardingResponses,
  );

  // --- Composite timeliness rate ---
  // Average of: allegation recording (24h), LADO referral (1 day), investigation within target, response within 1h
  const timelinessComponents: number[] = [];
  if (totalAllegations > 0) timelinessComponents.push(allegationRecordingRate);
  if (totalLadoReferrals > 0) timelinessComponents.push(ladoReferralRate);
  if (completedInvestigations > 0)
    timelinessComponents.push(completionWithinTargetRate);
  if (totalSafeguardingResponses > 0)
    timelinessComponents.push(safeguardingResponseRate);
  const timelinessRate =
    timelinessComponents.length > 0
      ? Math.round(
          timelinessComponents.reduce((s, v) => s + v, 0) /
            timelinessComponents.length,
        )
      : 0;

  // ── Scoring: base 52 ─────────────────────────────────────────────────
  // 9 bonus categories summing to exactly 28 (max 80 = outstanding)

  let score = 52;

  // --- Bonus 1: allegationRecordingRate (>=90: +4, >=70: +2) --- [max 4]
  if (allegationRecordingRate >= 90) score += 4;
  else if (allegationRecordingRate >= 70) score += 2;

  // --- Bonus 2: ladoReferralRate (>=90: +4, >=70: +2) --- [max 4]
  if (ladoReferralRate >= 90) score += 4;
  else if (ladoReferralRate >= 70) score += 2;

  // --- Bonus 3: investigationCompletionRate (>=90: +3, >=70: +1) --- [max 3]
  if (investigationCompletionRate >= 90) score += 3;
  else if (investigationCompletionRate >= 70) score += 1;

  // --- Bonus 4: outcomeDocumentationRate (>=90: +3, >=70: +1) --- [max 3]
  if (outcomeDocumentationRate >= 90) score += 3;
  else if (outcomeDocumentationRate >= 70) score += 1;

  // --- Bonus 5: safeguardingResponseRate (>=90: +4, >=70: +2) --- [max 4]
  if (safeguardingResponseRate >= 90) score += 4;
  else if (safeguardingResponseRate >= 70) score += 2;

  // --- Bonus 6: managementOversightRate (>=90: +3, >=70: +1) --- [max 3]
  if (managementOversightRate >= 90) score += 3;
  else if (managementOversightRate >= 70) score += 1;

  // --- Bonus 7: lessonsRecordedRate (>=90: +2, >=70: +1) --- [max 2]
  if (lessonsRecordedRate >= 90) score += 2;
  else if (lessonsRecordedRate >= 70) score += 1;

  // --- Bonus 8: childSupportRate (>=90: +3, >=70: +1) --- [max 3]
  if (childSupportRate >= 90) score += 3;
  else if (childSupportRate >= 70) score += 1;

  // --- Bonus 9: independenceRate (>=90: +2, >=70: +1) --- [max 2]
  if (independenceRate >= 90) score += 2;
  else if (independenceRate >= 70) score += 1;

  // Total max bonuses: 4+4+3+3+4+3+2+3+2 = 28
  // Max score: 52 + 28 = 80

  // ── Penalties ─────────────────────────────────────────────────────────

  // allegationRecordingRate < 50 → -5 (guard: allegation_records.length > 0)
  if (allegationRecordingRate < 50 && allegation_records.length > 0) score -= 5;

  // ladoReferralRate < 50 → -5 (guard: lado_referral_records.length > 0)
  if (ladoReferralRate < 50 && lado_referral_records.length > 0) score -= 5;

  // investigationCompletionRate < 50 → -4 (guard: investigation_records.length > 0)
  if (investigationCompletionRate < 50 && investigation_records.length > 0)
    score -= 4;

  // safeguardingResponseRate < 50 → -4 (guard: safeguarding_response_records.length > 0)
  if (
    safeguardingResponseRate < 50 &&
    safeguarding_response_records.length > 0
  )
    score -= 4;

  score = clamp(score, 0, 100);

  const allegations_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  // Allegation recording strengths
  if (allegationRecordingRate >= 100 && totalAllegations > 0) {
    strengths.push(
      "Every allegation recorded within 24 hours of receipt — exemplary timeliness in allegation recording, demonstrating robust initial response procedures.",
    );
  } else if (allegationRecordingRate >= 80 && totalAllegations > 0) {
    strengths.push(
      `${allegationRecordingRate}% of allegations recorded within 24 hours — strong timeliness in initial allegation recording procedures.`,
    );
  }

  if (riskAssessmentRate >= 100 && totalAllegations > 0) {
    strengths.push(
      "Initial risk assessment completed for every allegation — the home consistently assesses risk before proceeding, ensuring children's immediate safety is prioritised.",
    );
  } else if (riskAssessmentRate >= 80 && totalAllegations > 0) {
    strengths.push(
      `${riskAssessmentRate}% of allegations have completed initial risk assessments — strong risk assessment practice when allegations are received.`,
    );
  }

  if (immediateSafeguardingRate >= 100 && totalAllegations > 0) {
    strengths.push(
      "Children safeguarded immediately in every allegation case — the home's first priority is consistently the safety and welfare of the child, in line with SCCIF expectations.",
    );
  } else if (immediateSafeguardingRate >= 80 && totalAllegations > 0) {
    strengths.push(
      `${immediateSafeguardingRate}% of allegations resulted in immediate safeguarding of the child — strong child-first response to allegations.`,
    );
  }

  if (evidencePreservationRate >= 90 && totalAllegations > 0) {
    strengths.push(
      `${evidencePreservationRate}% evidence preservation rate — the home consistently secures and preserves evidence when allegations are received, supporting thorough investigation.`,
    );
  }

  if (chronologyRate >= 90 && totalAllegations > 0) {
    strengths.push(
      `${chronologyRate}% chronology maintenance rate — detailed chronologies are maintained throughout allegation processes, providing clear audit trails.`,
    );
  }

  // LADO referral strengths
  if (ladoReferralRate >= 100 && totalLadoReferrals > 0) {
    strengths.push(
      "Every LADO referral made within 1 working day — the home demonstrates full compliance with LADO referral timeliness requirements.",
    );
  } else if (ladoReferralRate >= 80 && totalLadoReferrals > 0) {
    strengths.push(
      `${ladoReferralRate}% LADO referral timeliness — the majority of referrals are made within 1 working day of the allegation being received.`,
    );
  }

  if (strategyMeetingRate >= 100 && totalLadoReferrals > 0) {
    strengths.push(
      "Strategy meeting held for every LADO referral — the home consistently engages in multi-agency decision-making as required by safeguarding procedures.",
    );
  } else if (strategyMeetingRate >= 80 && totalLadoReferrals > 0) {
    strengths.push(
      `${strategyMeetingRate}% strategy meeting rate — strong engagement with multi-agency strategy discussions for LADO referrals.`,
    );
  }

  if (ofstedNotificationRate >= 100 && totalLadoReferrals > 0) {
    strengths.push(
      "Ofsted notified for every LADO referral — the home consistently meets its regulatory notification obligations.",
    );
  } else if (ofstedNotificationRate >= 80 && totalLadoReferrals > 0) {
    strengths.push(
      `${ofstedNotificationRate}% Ofsted notification rate for LADO referrals — strong regulatory compliance in notification procedures.`,
    );
  }

  if (multiAgencyRate >= 90 && totalLadoReferrals > 0) {
    strengths.push(
      `${multiAgencyRate}% multi-agency approach rate — the home consistently works collaboratively with external agencies during allegation investigations.`,
    );
  }

  if (referralQualityRate >= 90 && totalLadoReferrals > 0) {
    strengths.push(
      `${referralQualityRate}% referral quality rate — LADO referrals are consistently of adequate quality, ensuring effective multi-agency responses.`,
    );
  }

  // Investigation strengths
  if (investigationCompletionRate >= 100 && totalInvestigations > 0) {
    strengths.push(
      "Every investigation completed — no outstanding investigations, demonstrating effective investigation management and timely resolution.",
    );
  } else if (investigationCompletionRate >= 80 && totalInvestigations > 0) {
    strengths.push(
      `${investigationCompletionRate}% investigation completion rate — the majority of investigations are concluded in a timely manner.`,
    );
  }

  if (completionWithinTargetRate >= 90 && completedInvestigations > 0) {
    strengths.push(
      `${completionWithinTargetRate}% of completed investigations finished within target timeframe — investigations are managed efficiently without unnecessary delay.`,
    );
  }

  if (investigationPlanRate >= 90 && totalInvestigations > 0) {
    strengths.push(
      `${investigationPlanRate}% of investigations have a formal investigation plan — structured, planned investigations demonstrating professional standards.`,
    );
  }

  if (independenceRate >= 90 && totalInvestigations > 0) {
    strengths.push(
      `${independenceRate}% investigator independence rate — investigations are conducted by independent investigators, ensuring objectivity and fairness.`,
    );
  }

  if (childSupportRate >= 100 && totalInvestigations > 0) {
    strengths.push(
      "Children supported throughout every investigation — the home prioritises the welfare and emotional needs of children during what can be a distressing process.",
    );
  } else if (childSupportRate >= 80 && totalInvestigations > 0) {
    strengths.push(
      `${childSupportRate}% child support rate during investigations — strong practice in supporting children throughout the investigation process.`,
    );
  }

  if (managementOversightRate >= 100 && totalInvestigations > 0) {
    strengths.push(
      "Management oversight documented for every investigation — robust governance and accountability throughout all investigation processes.",
    );
  } else if (managementOversightRate >= 80 && totalInvestigations > 0) {
    strengths.push(
      `${managementOversightRate}% management oversight rate — strong governance and accountability in investigation management.`,
    );
  }

  if (qualityAssuredRate >= 90 && totalInvestigations > 0) {
    strengths.push(
      `${qualityAssuredRate}% quality assurance rate — investigation findings are consistently quality assured, ensuring robustness and reliability of conclusions.`,
    );
  }

  // Outcome strengths
  if (outcomeDocumentationRate >= 100 && totalOutcomes > 0) {
    strengths.push(
      "Every outcome fully documented — comprehensive outcome recording demonstrating thorough completion of the allegation management process.",
    );
  } else if (outcomeDocumentationRate >= 80 && totalOutcomes > 0) {
    strengths.push(
      `${outcomeDocumentationRate}% outcome documentation rate — the majority of investigation outcomes are formally documented.`,
    );
  }

  if (lessonsRecordedRate >= 90 && totalOutcomes > 0) {
    strengths.push(
      `${lessonsRecordedRate}% lessons learned recording rate — the home consistently captures learning from allegations and investigations, driving continuous improvement.`,
    );
  }

  if (lessonsSharedRate >= 90 && totalOutcomes > 0) {
    strengths.push(
      `${lessonsSharedRate}% lessons shared with team — learning from allegations is disseminated to the whole team, strengthening the home's safeguarding culture.`,
    );
  }

  if (actionPlanRate >= 90 && totalOutcomes > 0) {
    strengths.push(
      `${actionPlanRate}% action plan creation rate — the home consistently creates action plans following investigation outcomes to address identified issues.`,
    );
  }

  if (actionPlanImplementationRate >= 90 && actionPlansCreated > 0) {
    strengths.push(
      `${actionPlanImplementationRate}% action plan implementation rate — action plans are not just created but followed through, demonstrating genuine organisational learning.`,
    );
  }

  if (scrUpdateRate >= 90 && totalOutcomes > 0) {
    strengths.push(
      `${scrUpdateRate}% single central record update rate — the SCR is consistently updated following investigation outcomes, maintaining an accurate workforce record.`,
    );
  }

  // Safeguarding response strengths
  if (safeguardingResponseRate >= 100 && totalSafeguardingResponses > 0) {
    strengths.push(
      "Every safeguarding response initiated within 1 hour of allegation receipt — exemplary response speed demonstrating that child safety is the immediate priority.",
    );
  } else if (safeguardingResponseRate >= 80 && totalSafeguardingResponses > 0) {
    strengths.push(
      `${safeguardingResponseRate}% safeguarding responses within 1 hour — strong initial response timeliness when allegations are received.`,
    );
  }

  if (childWishesRate >= 90 && totalSafeguardingResponses > 0) {
    strengths.push(
      `${childWishesRate}% child wishes captured rate — the voice of the child is consistently central to the safeguarding response, reflecting SCCIF expectations.`,
    );
  }

  if (advocateOfferedRate >= 90 && totalSafeguardingResponses > 0) {
    strengths.push(
      `${advocateOfferedRate}% independent advocate offer rate — children are consistently offered independent advocacy support during the allegation process.`,
    );
  }

  if (otherChildrenAssessedRate >= 90 && totalSafeguardingResponses > 0) {
    strengths.push(
      `${otherChildrenAssessedRate}% other children risk assessed — the home consistently assesses the impact on all children in placement, not just the child directly involved.`,
    );
  }

  if (noUnsupervisedContactRate >= 100 && totalSafeguardingResponses > 0) {
    strengths.push(
      "No unsupervised contact ensured in every safeguarding response — the home consistently prevents the subject of an allegation from having unsupervised access to children.",
    );
  }

  if (followUpCompletionRate >= 90 && followUpActionsSet > 0) {
    strengths.push(
      `${followUpCompletionRate}% follow-up action completion rate — safeguarding actions identified during the response phase are consistently completed.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  // Allegation recording concerns
  if (allegationRecordingRate < 50 && totalAllegations > 0) {
    concerns.push(
      `Only ${allegationRecordingRate}% of allegations recorded within 24 hours — the majority of allegations are not recorded promptly, which delays safeguarding responses and compromises evidence integrity.`,
    );
  } else if (
    allegationRecordingRate >= 50 &&
    allegationRecordingRate < 80 &&
    totalAllegations > 0
  ) {
    concerns.push(
      `Allegation recording timeliness at ${allegationRecordingRate}% — some allegations are not recorded within 24 hours, creating gaps in the safeguarding timeline.`,
    );
  }

  if (riskAssessmentRate < 70 && totalAllegations > 0) {
    concerns.push(
      `Only ${riskAssessmentRate}% of allegations have completed initial risk assessments — without consistent risk assessment, the home cannot ensure children's safety is adequately evaluated when allegations arise.`,
    );
  }

  if (immediateSafeguardingRate < 70 && totalAllegations > 0) {
    concerns.push(
      `Only ${immediateSafeguardingRate}% of allegations resulted in immediate safeguarding of the child — children may remain at risk when allegations are not met with immediate protective action.`,
    );
  }

  if (evidencePreservationRate < 70 && totalAllegations > 0) {
    concerns.push(
      `Only ${evidencePreservationRate}% evidence preservation rate — poor evidence preservation may compromise investigations and reduce the likelihood of reaching reliable outcomes.`,
    );
  }

  if (highSeverityAllegations > 0 && totalAllegations > 0) {
    const highSevPct = pct(highSeverityAllegations, totalAllegations);
    if (highSevPct >= 50) {
      concerns.push(
        `${highSevPct}% of allegations are high or critical severity — a significant proportion of allegations involve serious concerns about staff conduct, requiring robust investigation and management oversight.`,
      );
    }
  }

  if (childrenWithRepeatAllegations > 0) {
    concerns.push(
      `${childrenWithRepeatAllegations} child${childrenWithRepeatAllegations !== 1 ? "ren" : ""} involved in repeat allegations — recurring allegations involving the same children may indicate systemic safeguarding failures that require investigation.`,
    );
  }

  if (agencyStaffAllegations > 0 && totalAllegations > 0) {
    const agencyPct = pct(agencyStaffAllegations, totalAllegations);
    if (agencyPct >= 40) {
      concerns.push(
        `${agencyPct}% of allegations involve agency staff — a disproportionate number of allegations against agency workers may indicate inadequate induction, supervision, or vetting of temporary staff.`,
      );
    }
  }

  // LADO referral concerns
  if (ladoReferralRate < 50 && totalLadoReferrals > 0) {
    concerns.push(
      `Only ${ladoReferralRate}% of LADO referrals made within 1 working day — the majority of referrals are delayed, which is a significant breach of LADO procedures and may delay multi-agency safeguarding responses.`,
    );
  } else if (
    ladoReferralRate >= 50 &&
    ladoReferralRate < 80 &&
    totalLadoReferrals > 0
  ) {
    concerns.push(
      `LADO referral timeliness at ${ladoReferralRate}% — some referrals are not made within the required 1 working day, potentially delaying multi-agency safeguarding responses.`,
    );
  }

  if (strategyMeetingRate < 70 && totalLadoReferrals > 0) {
    concerns.push(
      `Only ${strategyMeetingRate}% of LADO referrals resulted in a strategy meeting — strategy meetings are a critical component of the multi-agency response and must be pursued for all referrals.`,
    );
  }

  if (ofstedNotificationRate < 80 && totalLadoReferrals > 0) {
    concerns.push(
      `Only ${ofstedNotificationRate}% Ofsted notification rate — the home is failing to consistently notify Ofsted of LADO referrals as required by regulations.`,
    );
  }

  if (multiAgencyRate < 70 && totalLadoReferrals > 0) {
    concerns.push(
      `Only ${multiAgencyRate}% multi-agency approach rate — the home is not consistently working with partner agencies during allegation investigations, which may compromise safeguarding outcomes.`,
    );
  }

  // Investigation concerns
  if (investigationCompletionRate < 50 && totalInvestigations > 0) {
    concerns.push(
      `Only ${investigationCompletionRate}% investigation completion rate — the majority of investigations remain open, creating uncertainty for children, staff, and the home's ability to evidence safeguarding outcomes.`,
    );
  } else if (
    investigationCompletionRate >= 50 &&
    investigationCompletionRate < 80 &&
    totalInvestigations > 0
  ) {
    concerns.push(
      `Investigation completion rate at ${investigationCompletionRate}% — a significant number of investigations remain open, which prolongs uncertainty and may indicate procedural delays.`,
    );
  }

  if (overdueInvestigations > 0) {
    concerns.push(
      `${overdueInvestigations} investigation${overdueInvestigations !== 1 ? "s" : ""} overdue beyond target completion date — prolonged investigations cause distress to all parties and may indicate inefficient investigation management.`,
    );
  }

  if (investigationPlanRate < 70 && totalInvestigations > 0) {
    concerns.push(
      `Only ${investigationPlanRate}% of investigations have a formal plan — investigations without clear plans risk being unfocused, incomplete, or unfair to the subject.`,
    );
  }

  if (independenceRate < 70 && totalInvestigations > 0) {
    concerns.push(
      `Only ${independenceRate}% investigator independence — investigations conducted by non-independent investigators may lack objectivity and their findings may be challenged.`,
    );
  }

  if (childSupportRate < 70 && totalInvestigations > 0) {
    concerns.push(
      `Only ${childSupportRate}% child support rate during investigations — children are not consistently supported throughout the investigation process, which can cause additional distress and harm.`,
    );
  }

  if (managementOversightRate < 70 && totalInvestigations > 0) {
    concerns.push(
      `Only ${managementOversightRate}% management oversight rate — insufficient oversight of investigations undermines governance, accountability, and the quality of investigation outcomes.`,
    );
  }

  if (qualityAssuredRate < 60 && totalInvestigations > 0) {
    concerns.push(
      `Only ${qualityAssuredRate}% quality assurance rate — investigation findings are not being consistently quality assured, raising questions about the reliability and robustness of conclusions.`,
    );
  }

  // Substantiated allegations trigger the statutory DBS-referral duty (SVGA 2006):
  // where a person is dismissed (or would have been) for harming a child, the home
  // MUST refer them to the DBS. A substantiated outcome was previously computed but
  // never surfaced, so a missed referral was invisible.
  if (substantiatedOutcomes > 0) {
    const dbsGap = totalLadoReferrals > 0 && dbsReferralRate < 100
      ? ` and only ${dbsReferralRate}% of LADO referrals record a DBS referral`
      : "";
    concerns.push(
      `${substantiatedOutcomes} substantiated allegation${substantiatedOutcomes !== 1 ? "s" : ""} against staff${dbsGap} — confirm a DBS referral has been made and recorded for each (statutory duty under the Safeguarding Vulnerable Groups Act 2006).`,
    );
  }

  // Outcome documentation concerns
  if (outcomeDocumentationRate < 50 && totalOutcomes > 0) {
    concerns.push(
      `Only ${outcomeDocumentationRate}% outcome documentation rate — the majority of investigation outcomes are not formally documented, making it impossible to evidence the completion of allegation management processes.`,
    );
  } else if (
    outcomeDocumentationRate >= 50 &&
    outcomeDocumentationRate < 80 &&
    totalOutcomes > 0
  ) {
    concerns.push(
      `Outcome documentation at ${outcomeDocumentationRate}% — some investigation outcomes lack formal documentation, creating gaps in the allegation management record.`,
    );
  }

  if (lessonsRecordedRate < 60 && totalOutcomes > 0) {
    concerns.push(
      `Only ${lessonsRecordedRate}% lessons learned recording rate — the home is not consistently capturing learning from allegations, missing opportunities to prevent recurrence.`,
    );
  }

  if (actionPlanRate < 60 && totalOutcomes > 0) {
    concerns.push(
      `Only ${actionPlanRate}% action plan creation rate — without action plans following investigation outcomes, identified issues may not be addressed and improvements not implemented.`,
    );
  }

  if (actionPlanImplementationRate < 60 && actionPlansCreated > 0) {
    concerns.push(
      `Only ${actionPlanImplementationRate}% of action plans have been implemented — action plans exist but are not being followed through, indicating a gap between policy and practice.`,
    );
  }

  if (scrUpdateRate < 70 && totalOutcomes > 0) {
    concerns.push(
      `Only ${scrUpdateRate}% single central record update rate — the SCR is not being consistently updated following investigation outcomes, which may mean the home's workforce records are inaccurate.`,
    );
  }

  if (sharedWithChildRate < 70 && totalOutcomes > 0) {
    concerns.push(
      `Only ${sharedWithChildRate}% of outcomes shared with the child — children have a right to know the outcome of allegations that affect them, and failure to share outcomes undermines their trust and sense of safety.`,
    );
  }

  if (regNotificationRate < 70 && totalOutcomes > 0) {
    concerns.push(
      `Only ${regNotificationRate}% regulatory notification completion rate — the home is not consistently completing required notifications to regulators following investigation outcomes.`,
    );
  }

  // Safeguarding response concerns
  if (safeguardingResponseRate < 50 && totalSafeguardingResponses > 0) {
    concerns.push(
      `Only ${safeguardingResponseRate}% safeguarding responses within 1 hour — the majority of safeguarding responses are delayed, which may leave children at continued risk.`,
    );
  } else if (
    safeguardingResponseRate >= 50 &&
    safeguardingResponseRate < 80 &&
    totalSafeguardingResponses > 0
  ) {
    concerns.push(
      `Safeguarding response timeliness at ${safeguardingResponseRate}% — some responses are not initiated within 1 hour of the allegation being received.`,
    );
  }

  if (childSafetyPlanRate < 70 && totalSafeguardingResponses > 0) {
    concerns.push(
      `Only ${childSafetyPlanRate}% of safeguarding responses include a child safety plan — without a formal safety plan, the measures taken to protect the child may be inconsistent or inadequate.`,
    );
  }

  if (childWishesRate < 70 && totalSafeguardingResponses > 0) {
    concerns.push(
      `Only ${childWishesRate}% of safeguarding responses capture the child's wishes — the child's voice is not being consistently heard during safeguarding responses, which is a SCCIF expectation.`,
    );
  }

  if (otherChildrenAssessedRate < 70 && totalSafeguardingResponses > 0) {
    concerns.push(
      `Only ${otherChildrenAssessedRate}% of responses include risk assessment of other children — when an allegation is received, all children in the home may be affected and their safety must be assessed.`,
    );
  }

  if (noUnsupervisedContactRate < 80 && totalSafeguardingResponses > 0) {
    concerns.push(
      `Only ${noUnsupervisedContactRate}% of responses ensure no unsupervised contact — the subject of an allegation should not have unsupervised access to children pending investigation.`,
    );
  }

  if (safeguardingLeadRate < 80 && totalSafeguardingResponses > 0) {
    concerns.push(
      `Only ${safeguardingLeadRate}% of responses inform the safeguarding lead — the designated safeguarding lead must be informed of all allegations without exception.`,
    );
  }

  if (followUpCompletionRate < 60 && followUpActionsSet > 0) {
    concerns.push(
      `Only ${followUpCompletionRate}% of follow-up actions completed — safeguarding actions identified during the response phase are not being consistently followed through, potentially leaving children at risk.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: AllegationsInvestigationsRecommendation[] = [];
  let rank = 0;

  // Immediate recommendations (critical gaps)

  if (allegationRecordingRate < 50 && totalAllegations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and improve allegation recording procedures — the majority of allegations are not recorded within 24 hours. Implement a clear recording protocol with immediate notification to the designated safeguarding lead, and ensure all staff understand the requirement for prompt recording.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 — Employment of staff",
    });
  }

  if (ladoReferralRate < 50 && totalLadoReferrals > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address LADO referral timeliness — the majority of referrals are not made within 1 working day. Establish a clear protocol requiring same-day LADO contact when an allegation meeting the threshold is received, with designated responsibility for making the referral.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 35 — Fitness of staff",
    });
  }

  if (investigationCompletionRate < 50 && totalInvestigations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all open investigations and establish a clear completion plan for each — the majority of investigations remain incomplete. Assign investigation leads, set target dates, and implement weekly progress reviews to drive investigations to conclusion.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (safeguardingResponseRate < 50 && totalSafeguardingResponses > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement immediate safeguarding response protocols — the majority of responses are not initiated within 1 hour. Develop a rapid response checklist that includes child safety plan activation, contact restrictions, safeguarding lead notification, and management oversight.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (immediateSafeguardingRate < 50 && totalAllegations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately review and strengthen child safeguarding protocols when allegations are received — children are not being consistently safeguarded as the immediate priority. All staff must understand that child safety is the first and non-negotiable step when an allegation is received.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (noUnsupervisedContactRate < 50 && totalSafeguardingResponses > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure the subject of every allegation is immediately removed from unsupervised contact with children — this is a fundamental safeguarding requirement that must be applied without exception pending investigation.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 35 — Fitness of staff",
    });
  }

  if (overdueInvestigations > 2) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Address ${overdueInvestigations} overdue investigations as a matter of urgency — prolonged investigations cause distress to children and staff, and may indicate systemic failures in investigation management. Conduct a root cause analysis and implement corrective measures.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (ofstedNotificationRate < 50 && totalLadoReferrals > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address Ofsted notification failures — the majority of LADO referrals have not been notified to Ofsted as required. Implement a notification checklist and assign clear responsibility for regulatory notifications.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  // Soon recommendations (improvement areas)

  if (
    allegationRecordingRate >= 50 &&
    allegationRecordingRate < 80 &&
    totalAllegations > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve allegation recording timeliness to at least 80% — review barriers to prompt recording and ensure all staff are trained on the requirement to record allegations within 24 hours of receipt.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 — Employment of staff",
    });
  }

  if (
    ladoReferralRate >= 50 &&
    ladoReferralRate < 80 &&
    totalLadoReferrals > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve LADO referral timeliness to at least 80% — ensure the registered manager or designated person has a clear process for making LADO referrals within 1 working day.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 35 — Fitness of staff",
    });
  }

  if (
    investigationCompletionRate >= 50 &&
    investigationCompletionRate < 80 &&
    totalInvestigations > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve investigation completion rates — implement formal investigation tracking with regular progress reviews, clear milestones, and escalation procedures for investigations at risk of exceeding target timescales.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (
    safeguardingResponseRate >= 50 &&
    safeguardingResponseRate < 80 &&
    totalSafeguardingResponses > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve safeguarding response speed to at least 80% within 1 hour — review response protocols and ensure on-call arrangements support rapid safeguarding action at all times.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (
    outcomeDocumentationRate >= 50 &&
    outcomeDocumentationRate < 80 &&
    totalOutcomes > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve outcome documentation rates — ensure every investigation outcome is formally documented with clear findings, actions taken, and notifications completed.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (outcomeDocumentationRate < 50 && totalOutcomes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently establish consistent outcome documentation — the majority of outcomes are not formally recorded. Implement a standard outcome template covering findings, notifications, action plans, and lessons learned.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (lessonsRecordedRate < 70 && totalOutcomes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a lessons-learned framework for all completed investigations — recording lessons is essential to drive organisational learning and prevent recurrence of safeguarding failures.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (lessonsSharedRate < 70 && totalOutcomes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure lessons learned from allegations are shared with the full staff team — learning that stays with management cannot influence frontline practice or improve the safeguarding culture.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (childWishesRate < 70 && totalSafeguardingResponses > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure the child's wishes and feelings are consistently captured during safeguarding responses — the child's voice must be central to all safeguarding decisions as required by the SCCIF.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (advocateOfferedRate < 70 && totalSafeguardingResponses > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Offer independent advocacy to every child involved in an allegation — independent advocates provide crucial support and ensure the child's interests are represented throughout the process.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (otherChildrenAssessedRate < 70 && totalSafeguardingResponses > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure risk assessments of all other children in the home are completed whenever an allegation is received — allegations may indicate risks to children beyond the directly affected child.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (managementOversightRate < 80 && totalInvestigations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen management oversight of investigations — every investigation must have documented management oversight including regular reviews, decision rationales, and sign-off at key stages.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (scrUpdateRate < 80 && totalOutcomes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure the single central record is updated following every investigation outcome — the SCR must accurately reflect the status and history of all staff, including the outcomes of any allegations.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 — Employment of staff",
    });
  }

  // Planned recommendations (enhancement)

  if (
    allegationRecordingRate >= 80 &&
    allegationRecordingRate < 95 &&
    totalAllegations > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Work towards 95%+ allegation recording timeliness — review the small number of delayed recordings to identify and remove remaining barriers to prompt initial recording.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 34 — Employment of staff",
    });
  }

  if (qualityAssuredRate < 80 && totalInvestigations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement quality assurance for all investigation findings — independent review of investigation conclusions strengthens the reliability and defensibility of outcomes.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (trainingDeliveryRate < 80 && trainingNeedsIdentified > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address identified training needs arising from investigation outcomes — training needs have been identified but not consistently delivered, limiting the home's ability to prevent recurrence.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 34 — Employment of staff",
    });
  }

  if (policyReviewRate < 70 && totalOutcomes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure investigation outcomes trigger policy reviews where relevant — allegations may reveal weaknesses in policies or procedures that need updating to prevent future incidents.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 36 — Review of quality of care",
    });
  }

  if (appealOfferedRate < 80 && totalOutcomes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure the appeal process is offered to all subjects of allegations — due process requires that staff members are informed of their right to appeal investigation outcomes.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 35 — Fitness of staff",
    });
  }

  if (supportPlanChildRate < 70 && totalOutcomes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop support plans for children affected by allegations — the allegation process itself can be distressing and children may need ongoing support beyond the immediate safeguarding response.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Safety",
    });
  }

  if (supportPlanStaffRate < 70 && totalOutcomes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop support plans for staff members who are subjects of allegations — regardless of outcome, the allegation process is stressful and staff welfare must be considered to maintain a healthy workforce.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 34 — Employment of staff",
    });
  }

  if (staffSupportRate < 70 && totalInvestigations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve support for staff members during investigations — staff who feel unsupported may disengage, leave, or experience wellbeing issues that affect the quality of care for children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 34 — Employment of staff",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: AllegationsInvestigationsInsight[] = [];

  // -- Critical insights --

  if (allegationRecordingRate < 50 && totalAllegations > 0) {
    insights.push({
      text: `Only ${allegationRecordingRate}% of allegations recorded within 24 hours. Ofsted inspectors will view delayed recording as evidence that the home does not treat allegations with the urgency required by Reg 34. Late recording also risks loss of evidence and compromises the integrity of subsequent investigations.`,
      severity: "critical",
    });
  }

  if (ladoReferralRate < 50 && totalLadoReferrals > 0) {
    insights.push({
      text: `Only ${ladoReferralRate}% of LADO referrals made within 1 working day. LADO procedures require prompt referral to enable multi-agency safeguarding responses. Delayed referrals mean that the LADO cannot fulfil their role in overseeing the investigation, and children may remain at risk for longer than necessary.`,
      severity: "critical",
    });
  }

  if (investigationCompletionRate < 50 && totalInvestigations > 0) {
    insights.push({
      text: `Only ${investigationCompletionRate}% investigation completion rate. Incomplete investigations leave allegations unresolved, creating ongoing uncertainty for children and staff. Under Reg 36, the home must demonstrate effective management of its quality of care, which includes timely resolution of allegations.`,
      severity: "critical",
    });
  }

  if (safeguardingResponseRate < 50 && totalSafeguardingResponses > 0) {
    insights.push({
      text: `Only ${safeguardingResponseRate}% of safeguarding responses initiated within 1 hour. When an allegation is received, the first hour is critical for securing the child's safety, preserving evidence, and initiating protective measures. Delayed responses may leave children in situations of ongoing risk.`,
      severity: "critical",
    });
  }

  if (outcomeDocumentationRate < 50 && totalOutcomes > 0) {
    insights.push({
      text: `Only ${outcomeDocumentationRate}% of outcomes formally documented. Without documented outcomes, the home cannot evidence that allegations were properly resolved, lessons were learned, or appropriate action was taken. This is a serious Reg 36 compliance gap.`,
      severity: "critical",
    });
  }

  if (noUnsupervisedContactRate < 50 && totalSafeguardingResponses > 0) {
    insights.push({
      text: `Only ${noUnsupervisedContactRate}% of responses ensure no unsupervised contact. Allowing the subject of an allegation to maintain unsupervised access to children during an investigation represents a fundamental safeguarding failure under Reg 35.`,
      severity: "critical",
    });
  }

  if (criticalAllegations >= 2 && totalAllegations > 0) {
    insights.push({
      text: `${criticalAllegations} critical-severity allegations recorded. Multiple critical allegations indicate serious concerns about staff conduct that require immediate attention from the registered manager and may warrant regulatory notification and external review.`,
      severity: "critical",
    });
  }

  if (childrenWithRepeatAllegations >= 2) {
    insights.push({
      text: `${childrenWithRepeatAllegations} children involved in repeat allegations. Recurring allegations involving the same children raise significant safeguarding concerns and may indicate that previous interventions were insufficient, or that the child is in an environment where they are repeatedly at risk.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    allegationRecordingRate >= 50 &&
    allegationRecordingRate < 80 &&
    totalAllegations > 0
  ) {
    insights.push({
      text: `Allegation recording timeliness at ${allegationRecordingRate}% — while improving, some allegations are still not recorded promptly. Each delay creates a window where safeguarding responses may not be activated and evidence may be lost.`,
      severity: "warning",
    });
  }

  if (
    ladoReferralRate >= 50 &&
    ladoReferralRate < 80 &&
    totalLadoReferrals > 0
  ) {
    insights.push({
      text: `LADO referral timeliness at ${ladoReferralRate}% — some referrals are delayed beyond 1 working day. Ofsted expects prompt LADO contact as evidence that the home takes allegations seriously and engages proactively with the multi-agency framework.`,
      severity: "warning",
    });
  }

  if (
    investigationCompletionRate >= 50 &&
    investigationCompletionRate < 80 &&
    totalInvestigations > 0
  ) {
    insights.push({
      text: `Investigation completion rate at ${investigationCompletionRate}% — some investigations remain open. Prolonged investigations affect the wellbeing of all involved and may indicate resource constraints, procedural complexity, or insufficient management oversight.`,
      severity: "warning",
    });
  }

  if (overdueInvestigations > 0 && overdueInvestigations <= 2) {
    insights.push({
      text: `${overdueInvestigations} investigation${overdueInvestigations !== 1 ? "s" : ""} overdue beyond target completion date. While some delay can be legitimate (e.g., awaiting external agency decisions), prolonged investigations require documented rationale and ongoing management review.`,
      severity: "warning",
    });
  }

  if (
    safeguardingResponseRate >= 50 &&
    safeguardingResponseRate < 80 &&
    totalSafeguardingResponses > 0
  ) {
    insights.push({
      text: `Safeguarding response timeliness at ${safeguardingResponseRate}% — some responses are not initiated within 1 hour. Even short delays in safeguarding responses can affect the child's sense of safety and the home's ability to preserve critical evidence.`,
      severity: "warning",
    });
  }

  if (
    outcomeDocumentationRate >= 50 &&
    outcomeDocumentationRate < 80 &&
    totalOutcomes > 0
  ) {
    insights.push({
      text: `Outcome documentation at ${outcomeDocumentationRate}% — some outcomes are not formally recorded. Gaps in outcome documentation make it difficult for the home to demonstrate a complete audit trail from allegation through to resolution and learning.`,
      severity: "warning",
    });
  }

  if (lessonsRecordedRate < 70 && totalOutcomes > 0) {
    insights.push({
      text: `Only ${lessonsRecordedRate}% of outcomes have lessons learned recorded. Without systematic capture of learning, the home risks repeating the same failures. Reg 36 requires the registered person to review the quality of care, which includes learning from allegations.`,
      severity: "warning",
    });
  }

  if (childWishesRate < 70 && totalSafeguardingResponses > 0) {
    insights.push({
      text: `Only ${childWishesRate}% of safeguarding responses capture the child's wishes. The SCCIF places the child's voice at the centre of all safeguarding practice. Without consistently capturing children's views, the home cannot demonstrate a child-centred approach to allegation management.`,
      severity: "warning",
    });
  }

  if (
    managementOversightRate >= 50 &&
    managementOversightRate < 80 &&
    totalInvestigations > 0
  ) {
    insights.push({
      text: `Management oversight at ${managementOversightRate}% — some investigations lack documented management oversight. Without consistent oversight, investigations may lack direction, important decisions may not be properly recorded, and the registered manager cannot evidence their grip on safeguarding processes.`,
      severity: "warning",
    });
  }

  if (strategyMeetingRate < 80 && totalLadoReferrals > 0) {
    insights.push({
      text: `Strategy meeting rate at ${strategyMeetingRate}% — not all LADO referrals result in a strategy meeting. Strategy meetings are the cornerstone of the multi-agency response and their absence may mean that important perspectives and information are not shared.`,
      severity: "warning",
    });
  }

  if (
    agencyStaffAllegations > 0 &&
    pct(agencyStaffAllegations, totalAllegations) >= 30
  ) {
    insights.push({
      text: `${pct(agencyStaffAllegations, totalAllegations)}% of allegations involve agency staff. This pattern may indicate that agency workers are not receiving adequate induction, supervision, or oversight. The home should review its agency staff management practices under Reg 34.`,
      severity: "warning",
    });
  }

  if (managerAllegations > 0) {
    insights.push({
      text: `${managerAllegations} allegation${managerAllegations !== 1 ? "s" : ""} against management staff. Allegations against managers raise unique governance challenges — the responsible individual and/or external parties must be involved to ensure independent and fair investigation.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (allegations_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding allegations and investigations management — allegations are recorded promptly, LADO referrals are timely, investigations are completed efficiently, outcomes are thoroughly documented, and safeguarding responses are rapid and child-centred. This represents exemplary practice under Reg 34, Reg 35, and Reg 36.",
      severity: "positive",
    });
  }

  if (allegationRecordingRate >= 90 && totalAllegations > 0) {
    insights.push({
      text: `${allegationRecordingRate}% allegation recording timeliness — the home consistently records allegations within 24 hours, demonstrating that staff understand the urgency of allegation recording and that robust initial response procedures are in place.`,
      severity: "positive",
    });
  }

  if (ladoReferralRate >= 90 && totalLadoReferrals > 0) {
    insights.push({
      text: `${ladoReferralRate}% LADO referral timeliness — the home demonstrates strong compliance with LADO procedures, ensuring multi-agency safeguarding mechanisms are activated promptly for every qualifying allegation.`,
      severity: "positive",
    });
  }

  if (investigationCompletionRate >= 90 && totalInvestigations > 0) {
    insights.push({
      text: `${investigationCompletionRate}% investigation completion rate — investigations are managed efficiently and brought to conclusion, providing timely resolution for children and staff involved.`,
      severity: "positive",
    });
  }

  if (safeguardingResponseRate >= 90 && totalSafeguardingResponses > 0) {
    insights.push({
      text: `${safeguardingResponseRate}% safeguarding response rate within 1 hour — the home's immediate response to allegations consistently prioritises the safety and welfare of children, demonstrating a strong safeguarding culture.`,
      severity: "positive",
    });
  }

  if (childSupportRate >= 90 && totalInvestigations > 0) {
    insights.push({
      text: `${childSupportRate}% child support rate during investigations — children are consistently supported throughout what can be a distressing and confusing process, reflecting the home's child-centred approach.`,
      severity: "positive",
    });
  }

  if (lessonsRecordedRate >= 90 && lessonsSharedRate >= 90 && totalOutcomes > 0) {
    insights.push({
      text: `${lessonsRecordedRate}% lessons recorded and ${lessonsSharedRate}% shared with the team — the home demonstrates a genuine learning culture, using allegations as opportunities to strengthen safeguarding practice rather than treating them as isolated events.`,
      severity: "positive",
    });
  }

  if (
    managementOversightRate >= 90 &&
    qualityAssuredRate >= 80 &&
    totalInvestigations > 0
  ) {
    insights.push({
      text: `${managementOversightRate}% management oversight with ${qualityAssuredRate}% quality assurance — investigations benefit from robust governance and independent quality review, ensuring reliable and defensible outcomes.`,
      severity: "positive",
    });
  }

  if (
    noUnsupervisedContactRate >= 100 &&
    childSafetyPlanRate >= 90 &&
    totalSafeguardingResponses > 0
  ) {
    insights.push({
      text: "Every safeguarding response ensures no unsupervised contact and child safety plans are consistently in place — the home demonstrates exemplary immediate protective practice when allegations are received.",
      severity: "positive",
    });
  }

  if (
    multiAgencyRate >= 90 &&
    ofstedNotificationRate >= 90 &&
    totalLadoReferrals > 0
  ) {
    insights.push({
      text: `${multiAgencyRate}% multi-agency collaboration with ${ofstedNotificationRate}% Ofsted notification rate — the home consistently works within the multi-agency framework and meets its regulatory notification obligations, demonstrating transparency and partnership.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (allegations_rating === "outstanding") {
    headline =
      "Outstanding allegations and investigations management — allegations recorded promptly, LADO referrals timely, investigations completed efficiently, outcomes documented, and safeguarding responses are rapid and child-centred.";
  } else if (allegations_rating === "good") {
    headline = `Good allegations and investigations management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (allegations_rating === "adequate") {
    headline = `Adequate allegations and investigations management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure allegations are handled effectively and children are safeguarded.`;
  } else {
    headline = `Allegations and investigations management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure staff allegations are properly managed, investigated, and resolved.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    allegations_rating,
    allegations_score: score,
    headline,
    allegation_recording_rate: allegationRecordingRate,
    lado_referral_rate: ladoReferralRate,
    investigation_completion_rate: investigationCompletionRate,
    outcome_documentation_rate: outcomeDocumentationRate,
    safeguarding_response_rate: safeguardingResponseRate,
    timeliness_rate: timelinessRate,
    total_allegations: totalAllegations,
    total_lado_referrals: totalLadoReferrals,
    total_investigations: totalInvestigations,
    total_outcomes: totalOutcomes,
    total_safeguarding_responses: totalSafeguardingResponses,
    open_investigations: openInvestigations,
    substantiated_count: substantiatedOutcomes,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
