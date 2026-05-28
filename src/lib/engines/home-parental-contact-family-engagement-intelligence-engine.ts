// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PARENTAL CONTACT & FAMILY ENGAGEMENT INTELLIGENCE ENGINE
// Evaluates parental contact and family engagement quality: contact schedule
// compliance, family visit management, parental engagement assessments,
// supervised contact quality, and family relationship support.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 7 (Child's plan — contact), Reg 8 (Promoting contact),
// Reg 10 (Health & wellbeing — family relationships).
// SCCIF: "Children maintain contact with family where appropriate."
// Store keys: contactScheduleRecords, familyVisitRecords,
//             parentalEngagementRecords, supervisedContactRecords,
//             familySupportRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ContactScheduleRecordInput {
  id: string;
  child_id: string;
  parent_id: string;
  contact_type: "face_to_face" | "telephone" | "video_call" | "letter" | "supervised";
  scheduled_date: string;
  scheduled_time: string | null;
  occurred: boolean;
  cancelled: boolean;
  cancelled_by: "parent" | "child" | "social_worker" | "home" | null;
  cancellation_reason: string | null;
  rescheduled: boolean;
  rescheduled_date: string | null;
  duration_minutes: number | null;
  quality_rating: number | null; // 1-5
  child_voice_captured: boolean;
  child_wanted_contact: boolean;
  notes_recorded: boolean;
  social_worker_informed: boolean;
  created_at: string;
}

export interface FamilyVisitRecordInput {
  id: string;
  child_id: string;
  visit_type: "home_visit" | "community_visit" | "overnight_stay" | "day_visit" | "holiday_contact";
  visit_date: string;
  planned: boolean;
  occurred: boolean;
  duration_hours: number | null;
  quality_rating: number | null; // 1-5
  risk_assessment_completed: boolean;
  child_feedback_positive: boolean | null;
  child_voice_captured: boolean;
  safeguarding_concerns_raised: boolean;
  safeguarding_actions_taken: boolean;
  report_completed: boolean;
  approved_by: string | null;
  created_at: string;
}

export interface ParentalEngagementRecordInput {
  id: string;
  child_id: string;
  parent_id: string;
  engagement_type: "review_attendance" | "care_plan_input" | "education_involvement" | "health_involvement" | "key_decision_participation" | "progress_update";
  engagement_date: string;
  parent_participated: boolean;
  parent_invited: boolean;
  invitation_method: "letter" | "phone" | "email" | "in_person" | null;
  parent_views_recorded: boolean;
  parent_views_incorporated: boolean;
  barriers_identified: string | null;
  support_offered: boolean;
  quality_rating: number | null; // 1-5
  created_at: string;
}

export interface SupervisedContactRecordInput {
  id: string;
  child_id: string;
  parent_id: string;
  session_date: string;
  session_duration_minutes: number | null;
  supervisor_present: boolean;
  supervisor_name: string | null;
  contact_plan_followed: boolean;
  boundaries_maintained: boolean;
  child_distressed: boolean;
  child_positive_response: boolean;
  child_voice_captured: boolean;
  incident_occurred: boolean;
  incident_description: string | null;
  incident_reported: boolean;
  quality_rating: number | null; // 1-5
  recommendations_made: boolean;
  follow_up_actions: string | null;
  report_completed: boolean;
  created_at: string;
}

export interface FamilySupportRecordInput {
  id: string;
  child_id: string;
  support_type: "family_therapy" | "mediation" | "parenting_support" | "relationship_building" | "reunification_planning" | "sibling_contact" | "life_story_work";
  start_date: string;
  end_date: string | null;
  active: boolean;
  sessions_planned: number;
  sessions_attended: number;
  provider_name: string | null;
  quality_rating: number | null; // 1-5
  child_voice_captured: boolean;
  child_engagement_positive: boolean;
  parent_engagement_positive: boolean;
  outcomes_documented: boolean;
  progress_rating: "significant" | "moderate" | "minimal" | "none" | "regressed" | null;
  created_at: string;
}

export interface ParentalContactFamilyEngagementInput {
  today: string;
  total_children: number;
  contact_schedule_records: ContactScheduleRecordInput[];
  family_visit_records: FamilyVisitRecordInput[];
  parental_engagement_records: ParentalEngagementRecordInput[];
  supervised_contact_records: SupervisedContactRecordInput[];
  family_support_records: FamilySupportRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FamilyEngagementRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface FamilyEngagementInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface FamilyEngagementRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface ParentalContactFamilyEngagementResult {
  engagement_rating: FamilyEngagementRating;
  engagement_score: number;
  headline: string;
  total_scheduled_contacts: number;
  total_family_visits: number;
  total_supervised_sessions: number;
  contact_compliance_rate: number;
  family_visit_quality_rate: number;
  parental_engagement_rate: number;
  supervised_contact_adherence_rate: number;
  family_support_coverage_rate: number;
  child_voice_in_contact_rate: number;
  contact_quality_avg: number;
  visit_risk_assessment_rate: number;
  parent_invitation_rate: number;
  parent_views_incorporation_rate: number;
  supervised_boundary_adherence_rate: number;
  family_support_attendance_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: FamilyEngagementRecommendation[];
  insights: FamilyEngagementInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): FamilyEngagementRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function safeAvg(values: (number | null)[]): number {
  const valid = values.filter((v): v is number => v !== null && v !== undefined);
  if (valid.length === 0) return 0;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100;
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: FamilyEngagementRating,
  score: number,
  headline: string,
): ParentalContactFamilyEngagementResult {
  return {
    engagement_rating: rating,
    engagement_score: score,
    headline,
    total_scheduled_contacts: 0,
    total_family_visits: 0,
    total_supervised_sessions: 0,
    contact_compliance_rate: 0,
    family_visit_quality_rate: 0,
    parental_engagement_rate: 0,
    supervised_contact_adherence_rate: 0,
    family_support_coverage_rate: 0,
    child_voice_in_contact_rate: 0,
    contact_quality_avg: 0,
    visit_risk_assessment_rate: 0,
    parent_invitation_rate: 0,
    parent_views_incorporation_rate: 0,
    supervised_boundary_adherence_rate: 0,
    family_support_attendance_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeParentalContactFamilyEngagement(
  input: ParentalContactFamilyEngagementInput,
): ParentalContactFamilyEngagementResult {
  const {
    total_children,
    contact_schedule_records,
    family_visit_records,
    parental_engagement_records,
    supervised_contact_records,
    family_support_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    contact_schedule_records.length === 0 &&
    family_visit_records.length === 0 &&
    parental_engagement_records.length === 0 &&
    supervised_contact_records.length === 0 &&
    family_support_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess parental contact and family engagement.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No parental contact or family engagement data recorded despite children on placement — contact and family engagement require urgent attention.",
      ),
      concerns: [
        "No contact schedule records, family visit records, parental engagement records, supervised contact records, or family support records exist despite children being on placement — the home cannot evidence that children are maintaining family relationships as required.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of all parental contact schedules, family visits, parental engagement, supervised contact, and family support to evidence compliance with contact arrangements and the promotion of family relationships.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 8 — Promoting contact",
        },
        {
          rank: 2,
          recommendation:
            "Review all children's care plans to ensure contact arrangements are documented and being actively facilitated, including any court-ordered contact schedules and social worker directives.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Child's plan",
        },
      ],
      insights: [
        {
          text: "The complete absence of parental contact and family engagement records means Ofsted cannot verify that children are maintaining family relationships, contact arrangements are being facilitated, or family engagement is being promoted. This represents a fundamental gap in Reg 8 compliance and the home's duty to promote contact.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // ─── 1. Contact compliance ────────────────────────────────────────────
  const totalScheduledContacts = contact_schedule_records.length;
  const contactsOccurred = contact_schedule_records.filter((c) => c.occurred).length;
  const contactComplianceRate = pct(contactsOccurred, totalScheduledContacts);

  // ─── 2. Contact quality ───────────────────────────────────────────────
  const contactQualityRatings = contact_schedule_records
    .filter((c) => c.occurred && c.quality_rating !== null)
    .map((c) => c.quality_rating);
  const contactQualityAvg = safeAvg(contactQualityRatings);

  // ─── 3. Contact cancellations ─────────────────────────────────────────
  const cancelledContacts = contact_schedule_records.filter((c) => c.cancelled).length;
  const cancelledByParent = contact_schedule_records.filter(
    (c) => c.cancelled && c.cancelled_by === "parent",
  ).length;
  const cancelledByHome = contact_schedule_records.filter(
    (c) => c.cancelled && c.cancelled_by === "home",
  ).length;
  const rescheduledContacts = contact_schedule_records.filter(
    (c) => c.cancelled && c.rescheduled,
  ).length;
  const rescheduledRate = pct(rescheduledContacts, cancelledContacts);

  // ─── 4. Contact notes compliance ──────────────────────────────────────
  const contactsWithNotes = contact_schedule_records.filter(
    (c) => c.occurred && c.notes_recorded,
  ).length;
  const contactNotesRate = pct(contactsWithNotes, contactsOccurred);

  // ─── 5. Social worker informed rate ───────────────────────────────────
  const contactsSWInformed = contact_schedule_records.filter(
    (c) => c.occurred && c.social_worker_informed,
  ).length;
  const swInformedRate = pct(contactsSWInformed, contactsOccurred);

  // ─── 6. Child wanted contact rate ─────────────────────────────────────
  const childWantedContact = contact_schedule_records.filter(
    (c) => c.child_wanted_contact,
  ).length;
  const childWantedContactRate = pct(childWantedContact, totalScheduledContacts);

  // ─── 7. Family visit metrics ──────────────────────────────────────────
  const totalFamilyVisits = family_visit_records.length;
  const visitsOccurred = family_visit_records.filter((v) => v.occurred).length;
  const visitOccurrenceRate = pct(visitsOccurred, totalFamilyVisits);

  const visitQualityRatings = family_visit_records
    .filter((v) => v.occurred && v.quality_rating !== null)
    .map((v) => v.quality_rating);
  const visitQualityAvg = safeAvg(visitQualityRatings);

  const visitsWithHighQuality = family_visit_records.filter(
    (v) => v.occurred && v.quality_rating !== null && v.quality_rating >= 4,
  ).length;
  const familyVisitQualityRate = pct(visitsWithHighQuality, visitsOccurred);

  const visitsWithRiskAssessment = family_visit_records.filter(
    (v) => v.risk_assessment_completed,
  ).length;
  const visitRiskAssessmentRate = pct(visitsWithRiskAssessment, totalFamilyVisits);

  const visitsWithReport = family_visit_records.filter(
    (v) => v.occurred && v.report_completed,
  ).length;
  const visitReportRate = pct(visitsWithReport, visitsOccurred);

  const visitsWithPositiveFeedback = family_visit_records.filter(
    (v) => v.occurred && v.child_feedback_positive === true,
  ).length;
  const visitPositiveFeedbackRate = pct(visitsWithPositiveFeedback, visitsOccurred);

  const visitsWithSafeguardingConcerns = family_visit_records.filter(
    (v) => v.safeguarding_concerns_raised,
  ).length;
  const safeguardingConcernsActedOn = family_visit_records.filter(
    (v) => v.safeguarding_concerns_raised && v.safeguarding_actions_taken,
  ).length;
  const safeguardingResponseRate = pct(safeguardingConcernsActedOn, visitsWithSafeguardingConcerns);

  // ─── 8. Parental engagement metrics ───────────────────────────────────
  const totalEngagementRecords = parental_engagement_records.length;
  const parentParticipated = parental_engagement_records.filter(
    (e) => e.parent_participated,
  ).length;
  const parentalEngagementRate = pct(parentParticipated, totalEngagementRecords);

  const parentInvited = parental_engagement_records.filter(
    (e) => e.parent_invited,
  ).length;
  const parentInvitationRate = pct(parentInvited, totalEngagementRecords);

  const parentViewsRecorded = parental_engagement_records.filter(
    (e) => e.parent_participated && e.parent_views_recorded,
  ).length;
  const parentViewsRecordedRate = pct(parentViewsRecorded, parentParticipated);

  const parentViewsIncorporated = parental_engagement_records.filter(
    (e) => e.parent_participated && e.parent_views_incorporated,
  ).length;
  const parentViewsIncorporationRate = pct(parentViewsIncorporated, parentParticipated);

  const engagementSupportOffered = parental_engagement_records.filter(
    (e) => !e.parent_participated && e.support_offered,
  ).length;
  const nonParticipatingParents = totalEngagementRecords - parentParticipated;
  const supportOfferedRate = pct(engagementSupportOffered, nonParticipatingParents);

  const engagementWithBarriers = parental_engagement_records.filter(
    (e) => e.barriers_identified !== null && e.barriers_identified !== "",
  ).length;

  const engagementQualityRatings = parental_engagement_records
    .filter((e) => e.parent_participated && e.quality_rating !== null)
    .map((e) => e.quality_rating);
  const engagementQualityAvg = safeAvg(engagementQualityRatings);

  // ─── 9. Supervised contact metrics ────────────────────────────────────
  const totalSupervisedSessions = supervised_contact_records.length;

  const supervisorPresent = supervised_contact_records.filter(
    (s) => s.supervisor_present,
  ).length;
  const supervisorPresenceRate = pct(supervisorPresent, totalSupervisedSessions);

  const contactPlanFollowed = supervised_contact_records.filter(
    (s) => s.contact_plan_followed,
  ).length;
  const contactPlanAdherenceRate = pct(contactPlanFollowed, totalSupervisedSessions);

  const boundariesMaintained = supervised_contact_records.filter(
    (s) => s.boundaries_maintained,
  ).length;
  const supervisedBoundaryAdherenceRate = pct(boundariesMaintained, totalSupervisedSessions);

  // Composite: adherence = average of supervisor presence, plan followed, boundaries maintained
  const supervisedContactAdherenceRate =
    totalSupervisedSessions > 0
      ? Math.round(
          (supervisorPresenceRate + contactPlanAdherenceRate + supervisedBoundaryAdherenceRate) / 3,
        )
      : 0;

  const childDistressed = supervised_contact_records.filter(
    (s) => s.child_distressed,
  ).length;
  const childDistressRate = pct(childDistressed, totalSupervisedSessions);

  const childPositiveResponse = supervised_contact_records.filter(
    (s) => s.child_positive_response,
  ).length;
  const childPositiveResponseRate = pct(childPositiveResponse, totalSupervisedSessions);

  const supervisedIncidents = supervised_contact_records.filter(
    (s) => s.incident_occurred,
  ).length;
  const supervisedIncidentsReported = supervised_contact_records.filter(
    (s) => s.incident_occurred && s.incident_reported,
  ).length;
  const incidentReportingRate = pct(supervisedIncidentsReported, supervisedIncidents);

  const supervisedReportsCompleted = supervised_contact_records.filter(
    (s) => s.report_completed,
  ).length;
  const supervisedReportRate = pct(supervisedReportsCompleted, totalSupervisedSessions);

  const supervisedQualityRatings = supervised_contact_records
    .filter((s) => s.quality_rating !== null)
    .map((s) => s.quality_rating);
  const supervisedQualityAvg = safeAvg(supervisedQualityRatings);

  const supervisedRecommendationsMade = supervised_contact_records.filter(
    (s) => s.recommendations_made,
  ).length;

  // ─── 10. Family support metrics ───────────────────────────────────────
  const totalFamilySupport = family_support_records.length;
  const activeFamilySupport = family_support_records.filter((f) => f.active).length;

  const uniqueChildrenWithSupport = new Set(
    family_support_records.filter((f) => f.active).map((f) => f.child_id),
  ).size;
  const familySupportCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithSupport, total_children) : 0;

  const totalSessionsPlanned = family_support_records.reduce(
    (sum, f) => sum + f.sessions_planned,
    0,
  );
  const totalSessionsAttended = family_support_records.reduce(
    (sum, f) => sum + f.sessions_attended,
    0,
  );
  const familySupportAttendanceRate = pct(totalSessionsAttended, totalSessionsPlanned);

  const supportOutcomesDocumented = family_support_records.filter(
    (f) => f.outcomes_documented,
  ).length;
  const supportOutcomesRate = pct(supportOutcomesDocumented, totalFamilySupport);

  const supportQualityRatings = family_support_records
    .filter((f) => f.quality_rating !== null)
    .map((f) => f.quality_rating);
  const supportQualityAvg = safeAvg(supportQualityRatings);

  const significantProgress = family_support_records.filter(
    (f) => f.progress_rating === "significant",
  ).length;
  const moderateProgress = family_support_records.filter(
    (f) => f.progress_rating === "moderate",
  ).length;
  const positiveProgressRate = pct(significantProgress + moderateProgress, totalFamilySupport);

  const childEngagementPositive = family_support_records.filter(
    (f) => f.child_engagement_positive,
  ).length;
  const childSupportEngagementRate = pct(childEngagementPositive, totalFamilySupport);

  const parentEngagementPositive = family_support_records.filter(
    (f) => f.parent_engagement_positive,
  ).length;
  const parentSupportEngagementRate = pct(parentEngagementPositive, totalFamilySupport);

  const regressedRecords = family_support_records.filter(
    (f) => f.progress_rating === "regressed",
  ).length;

  // Family therapy and sibling contact counts
  const familyTherapySessions = family_support_records.filter(
    (f) => f.support_type === "family_therapy",
  ).length;
  const siblingContactRecords = family_support_records.filter(
    (f) => f.support_type === "sibling_contact",
  ).length;
  const lifeStoryWorkRecords = family_support_records.filter(
    (f) => f.support_type === "life_story_work",
  ).length;
  const reunificationRecords = family_support_records.filter(
    (f) => f.support_type === "reunification_planning",
  ).length;

  // ─── 11. Child voice in contact (composite across all arrays) ─────────
  const contactChildVoice = contact_schedule_records.filter(
    (c) => c.occurred && c.child_voice_captured,
  ).length;
  const visitChildVoice = family_visit_records.filter(
    (v) => v.occurred && v.child_voice_captured,
  ).length;
  const supervisedChildVoice = supervised_contact_records.filter(
    (s) => s.child_voice_captured,
  ).length;
  const supportChildVoice = family_support_records.filter(
    (f) => f.child_voice_captured,
  ).length;

  const totalChildVoiceOpportunities =
    contactsOccurred + visitsOccurred + totalSupervisedSessions + totalFamilySupport;
  const totalChildVoiceCaptured =
    contactChildVoice + visitChildVoice + supervisedChildVoice + supportChildVoice;
  const childVoiceInContactRate = pct(totalChildVoiceCaptured, totalChildVoiceOpportunities);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: contactComplianceRate (>=95: +4, >=80: +2) — max 4 ---
  if (contactComplianceRate >= 95) score += 4;
  else if (contactComplianceRate >= 80) score += 2;

  // --- Bonus 2: familyVisitQualityRate (>=90: +3, >=70: +1) — max 3 ---
  if (familyVisitQualityRate >= 90) score += 3;
  else if (familyVisitQualityRate >= 70) score += 1;

  // --- Bonus 3: parentalEngagementRate (>=90: +3, >=70: +1) — max 3 ---
  if (parentalEngagementRate >= 90) score += 3;
  else if (parentalEngagementRate >= 70) score += 1;

  // --- Bonus 4: supervisedContactAdherenceRate (>=95: +4, >=80: +2) — max 4 ---
  if (supervisedContactAdherenceRate >= 95) score += 4;
  else if (supervisedContactAdherenceRate >= 80) score += 2;

  // --- Bonus 5: familySupportCoverageRate (>=100: +3, >=80: +1) — max 3 ---
  if (familySupportCoverageRate >= 100) score += 3;
  else if (familySupportCoverageRate >= 80) score += 1;

  // --- Bonus 6: childVoiceInContactRate (>=90: +3, >=70: +1) — max 3 ---
  if (childVoiceInContactRate >= 90) score += 3;
  else if (childVoiceInContactRate >= 70) score += 1;

  // --- Bonus 7: visitRiskAssessmentRate (>=100: +2, >=80: +1) — max 2 ---
  if (visitRiskAssessmentRate >= 100) score += 2;
  else if (visitRiskAssessmentRate >= 80) score += 1;

  // --- Bonus 8: parentViewsIncorporationRate (>=90: +3, >=70: +1) — max 3 ---
  if (parentViewsIncorporationRate >= 90) score += 3;
  else if (parentViewsIncorporationRate >= 70) score += 1;

  // --- Bonus 9: familySupportAttendanceRate (>=90: +3, >=70: +1) — max 3 ---
  if (familySupportAttendanceRate >= 90) score += 3;
  else if (familySupportAttendanceRate >= 70) score += 1;

  // Total possible bonus: 4+3+3+4+3+3+2+3+3 = 28, so max = 52 + 28 = 80

  // ── Penalties ─────────────────────────────────────────────────────────

  // Penalty 1: contactComplianceRate < 50 → -5 (guard: totalScheduledContacts > 0)
  if (contactComplianceRate < 50 && totalScheduledContacts > 0) score -= 5;

  // Penalty 2: supervisedContactAdherenceRate < 50 → -5 (guard: totalSupervisedSessions > 0)
  if (supervisedContactAdherenceRate < 50 && totalSupervisedSessions > 0) score -= 5;

  // Penalty 3: familySupportCoverageRate < 30 → -4 (guard: total_children > 0)
  if (familySupportCoverageRate < 30 && total_children > 0) score -= 4;

  // Penalty 4: childVoiceInContactRate < 30 → -4 (guard: totalChildVoiceOpportunities > 0)
  if (childVoiceInContactRate < 30 && totalChildVoiceOpportunities > 0) score -= 4;

  score = clamp(score, 0, 100);

  const engagement_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  // Contact compliance strengths
  if (contactComplianceRate >= 95 && totalScheduledContacts > 0) {
    strengths.push(
      `${contactComplianceRate}% contact compliance — virtually all scheduled contacts are taking place, demonstrating the home's commitment to facilitating family relationships.`,
    );
  } else if (contactComplianceRate >= 80 && totalScheduledContacts > 0) {
    strengths.push(
      `${contactComplianceRate}% contact compliance — the majority of scheduled contacts occur as planned, supporting children's family connections.`,
    );
  }

  // Contact quality strengths
  if (contactQualityAvg >= 4.0 && contactQualityRatings.length > 0) {
    strengths.push(
      `Contact quality averages ${contactQualityAvg}/5 — contacts are consistently high-quality experiences for children and their families.`,
    );
  } else if (contactQualityAvg >= 3.0 && contactQualityRatings.length > 0) {
    strengths.push(
      `Contact quality averages ${contactQualityAvg}/5 — contacts are generally positive experiences that support family relationships.`,
    );
  }

  // Family visit quality strengths
  if (familyVisitQualityRate >= 90 && visitsOccurred > 0) {
    strengths.push(
      `${familyVisitQualityRate}% of family visits rated high quality — family visits are well-managed and create positive experiences for children.`,
    );
  } else if (familyVisitQualityRate >= 70 && visitsOccurred > 0) {
    strengths.push(
      `${familyVisitQualityRate}% of family visits rated high quality — the majority of family visits provide meaningful contact experiences.`,
    );
  }

  // Risk assessment strengths
  if (visitRiskAssessmentRate >= 100 && totalFamilyVisits > 0) {
    strengths.push(
      "Risk assessments completed for every family visit — the home demonstrates rigorous safeguarding practice in managing family contact.",
    );
  } else if (visitRiskAssessmentRate >= 80 && totalFamilyVisits > 0) {
    strengths.push(
      `${visitRiskAssessmentRate}% of family visits have completed risk assessments — strong safeguarding practice in contact management.`,
    );
  }

  // Parental engagement strengths
  if (parentalEngagementRate >= 90 && totalEngagementRecords > 0) {
    strengths.push(
      `${parentalEngagementRate}% parental engagement rate — parents are actively involved in their children's care planning, education, and health decisions.`,
    );
  } else if (parentalEngagementRate >= 70 && totalEngagementRecords > 0) {
    strengths.push(
      `${parentalEngagementRate}% parental engagement rate — good levels of parental involvement in key decisions about their children's care.`,
    );
  }

  // Parent views incorporation strengths
  if (parentViewsIncorporationRate >= 90 && parentParticipated > 0) {
    strengths.push(
      `${parentViewsIncorporationRate}% of parent views incorporated into decisions — parents' perspectives are genuinely influencing outcomes for their children.`,
    );
  } else if (parentViewsIncorporationRate >= 70 && parentParticipated > 0) {
    strengths.push(
      `${parentViewsIncorporationRate}% of parent views incorporated — the home actively considers parental perspectives in care decisions.`,
    );
  }

  // Supervised contact strengths
  if (supervisedContactAdherenceRate >= 95 && totalSupervisedSessions > 0) {
    strengths.push(
      `${supervisedContactAdherenceRate}% supervised contact adherence — supervision arrangements are meticulously maintained, ensuring children's safety during family contact.`,
    );
  } else if (supervisedContactAdherenceRate >= 80 && totalSupervisedSessions > 0) {
    strengths.push(
      `${supervisedContactAdherenceRate}% supervised contact adherence — strong compliance with supervision requirements during family contact.`,
    );
  }

  // Child positive response in supervised contact
  if (childPositiveResponseRate >= 80 && totalSupervisedSessions > 0) {
    strengths.push(
      `${childPositiveResponseRate}% of supervised contacts result in positive child response — children benefit from well-managed family contact.`,
    );
  }

  // Family support coverage strengths
  if (familySupportCoverageRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has access to active family support services — comprehensive provision supporting family relationships for all children.",
    );
  } else if (familySupportCoverageRate >= 80 && total_children > 0) {
    strengths.push(
      `${familySupportCoverageRate}% family support coverage — the majority of children are accessing family support to maintain and strengthen family relationships.`,
    );
  }

  // Family support attendance strengths
  if (familySupportAttendanceRate >= 90 && totalSessionsPlanned > 0) {
    strengths.push(
      `${familySupportAttendanceRate}% family support session attendance — strong engagement with family support services demonstrates commitment to family relationship building.`,
    );
  } else if (familySupportAttendanceRate >= 70 && totalSessionsPlanned > 0) {
    strengths.push(
      `${familySupportAttendanceRate}% family support session attendance — good engagement levels with family support programmes.`,
    );
  }

  // Child voice in contact strengths
  if (childVoiceInContactRate >= 90 && totalChildVoiceOpportunities > 0) {
    strengths.push(
      `${childVoiceInContactRate}% child voice captured in contact — children's wishes and feelings about family contact are consistently recorded and considered.`,
    );
  } else if (childVoiceInContactRate >= 70 && totalChildVoiceOpportunities > 0) {
    strengths.push(
      `${childVoiceInContactRate}% child voice captured — the home regularly records children's views about their family contact experiences.`,
    );
  }

  // Positive progress in family support
  if (positiveProgressRate >= 80 && totalFamilySupport > 0) {
    strengths.push(
      `${positiveProgressRate}% of family support records show moderate or significant progress — family support is making a demonstrable difference to family relationships.`,
    );
  }

  // Sibling contact
  if (siblingContactRecords > 0) {
    strengths.push(
      `${siblingContactRecords} sibling contact arrangement${siblingContactRecords !== 1 ? "s" : ""} in place — the home facilitates sibling relationships alongside parental contact.`,
    );
  }

  // Life story work
  if (lifeStoryWorkRecords > 0) {
    strengths.push(
      `${lifeStoryWorkRecords} life story work programme${lifeStoryWorkRecords !== 1 ? "s" : ""} active — helping children understand their family history and identity.`,
    );
  }

  // Rescheduling of cancelled contacts
  if (rescheduledRate >= 80 && cancelledContacts > 0) {
    strengths.push(
      `${rescheduledRate}% of cancelled contacts rescheduled — the home proactively ensures children do not lose contact opportunities when sessions are cancelled.`,
    );
  }

  // Social worker informed
  if (swInformedRate >= 90 && contactsOccurred > 0) {
    strengths.push(
      `${swInformedRate}% of contacts have social worker informed — excellent communication with placing authorities about contact arrangements.`,
    );
  }

  // Incident reporting in supervised contact
  if (incidentReportingRate >= 100 && supervisedIncidents > 0) {
    strengths.push(
      "Every incident during supervised contact has been reported — robust safeguarding reporting practice.",
    );
  }

  // Visit report completion
  if (visitReportRate >= 90 && visitsOccurred > 0) {
    strengths.push(
      `${visitReportRate}% of family visits have completed reports — thorough documentation of contact outcomes.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  // Low contact compliance
  if (contactComplianceRate < 50 && totalScheduledContacts > 0) {
    concerns.push(
      `Only ${contactComplianceRate}% of scheduled contacts occurring — the majority of planned family contacts are not taking place, which directly harms children's ability to maintain family relationships.`,
    );
  } else if (contactComplianceRate < 80 && contactComplianceRate >= 50 && totalScheduledContacts > 0) {
    concerns.push(
      `Contact compliance at ${contactComplianceRate}% — a significant number of scheduled contacts are not occurring, reducing children's family contact below planned levels.`,
    );
  }

  // High cancellation rate
  if (totalScheduledContacts > 0) {
    const cancellationRate = pct(cancelledContacts, totalScheduledContacts);
    if (cancellationRate >= 30) {
      concerns.push(
        `${cancellationRate}% contact cancellation rate — high cancellation undermines the reliability of contact arrangements and children's sense of security in family relationships.`,
      );
    }
  }

  // Cancelled by home
  if (cancelledByHome > 0 && totalScheduledContacts > 0) {
    const homeCancellationRate = pct(cancelledByHome, totalScheduledContacts);
    if (homeCancellationRate >= 10) {
      concerns.push(
        `${homeCancellationRate}% of contacts cancelled by the home — the home should be facilitating contact, not contributing to cancellations. This requires investigation.`,
      );
    }
  }

  // Low visit risk assessment completion
  if (visitRiskAssessmentRate < 80 && totalFamilyVisits > 0) {
    concerns.push(
      `Only ${visitRiskAssessmentRate}% of family visits have completed risk assessments — safeguarding practice around family contact is incomplete and children may be exposed to unassessed risks.`,
    );
  }

  // Low family visit quality
  if (familyVisitQualityRate < 50 && visitsOccurred > 0) {
    concerns.push(
      `Only ${familyVisitQualityRate}% of family visits rated high quality — the majority of family visits are not providing the quality of experience children need to maintain meaningful family relationships.`,
    );
  } else if (familyVisitQualityRate < 70 && familyVisitQualityRate >= 50 && visitsOccurred > 0) {
    concerns.push(
      `Family visit quality rate at ${familyVisitQualityRate}% — some visits are not meeting quality expectations, which may affect children's experiences of family contact.`,
    );
  }

  // Low parental engagement
  if (parentalEngagementRate < 50 && totalEngagementRecords > 0) {
    concerns.push(
      `Only ${parentalEngagementRate}% parental engagement — the majority of parents are not participating in key decisions about their children's care, education, and health.`,
    );
  } else if (parentalEngagementRate < 70 && parentalEngagementRate >= 50 && totalEngagementRecords > 0) {
    concerns.push(
      `Parental engagement at ${parentalEngagementRate}% — a significant proportion of parents are not actively involved in their children's care planning and decision-making.`,
    );
  }

  // Low parent invitation rate
  if (parentInvitationRate < 80 && totalEngagementRecords > 0) {
    concerns.push(
      `Only ${parentInvitationRate}% of engagement opportunities include parent invitation — parents cannot participate if they are not consistently invited to be involved.`,
    );
  }

  // Low supervised contact adherence
  if (supervisedContactAdherenceRate < 50 && totalSupervisedSessions > 0) {
    concerns.push(
      `Only ${supervisedContactAdherenceRate}% supervised contact adherence — supervision requirements are not being consistently met, potentially compromising children's safety during family contact.`,
    );
  } else if (supervisedContactAdherenceRate < 80 && supervisedContactAdherenceRate >= 50 && totalSupervisedSessions > 0) {
    concerns.push(
      `Supervised contact adherence at ${supervisedContactAdherenceRate}% — some supervision requirements are not being met, which may create safeguarding gaps during family contact.`,
    );
  }

  // High child distress during supervised contact
  if (childDistressRate >= 30 && totalSupervisedSessions > 0) {
    concerns.push(
      `${childDistressRate}% of supervised contacts involve child distress — a significant proportion of children are becoming distressed during family contact, requiring review of contact arrangements and support strategies.`,
    );
  }

  // Low family support coverage
  if (familySupportCoverageRate < 30 && total_children > 0) {
    concerns.push(
      `Only ${familySupportCoverageRate}% family support coverage — the majority of children have no access to active family support services to maintain and strengthen family relationships.`,
    );
  } else if (familySupportCoverageRate < 80 && familySupportCoverageRate >= 30 && total_children > 0) {
    concerns.push(
      `Family support coverage at ${familySupportCoverageRate}% — not all children have access to family support services to promote their family relationships.`,
    );
  }

  // Low family support attendance
  if (familySupportAttendanceRate < 50 && totalSessionsPlanned > 0) {
    concerns.push(
      `Only ${familySupportAttendanceRate}% family support session attendance — planned support sessions are not being attended, undermining the effectiveness of family relationship programmes.`,
    );
  } else if (familySupportAttendanceRate < 70 && familySupportAttendanceRate >= 50 && totalSessionsPlanned > 0) {
    concerns.push(
      `Family support attendance at ${familySupportAttendanceRate}% — some planned sessions are being missed, which may slow progress in family relationship work.`,
    );
  }

  // Low child voice in contact
  if (childVoiceInContactRate < 30 && totalChildVoiceOpportunities > 0) {
    concerns.push(
      `Only ${childVoiceInContactRate}% child voice captured in contact — children's wishes and feelings about their family contact are rarely being recorded, which means contact may not reflect what children want or need.`,
    );
  } else if (childVoiceInContactRate < 70 && childVoiceInContactRate >= 30 && totalChildVoiceOpportunities > 0) {
    concerns.push(
      `Child voice in contact at ${childVoiceInContactRate}% — children's views about their family contact are not consistently captured, undermining child-centred practice.`,
    );
  }

  // Regressed family support
  if (regressedRecords > 0 && totalFamilySupport > 0) {
    concerns.push(
      `${regressedRecords} family support record${regressedRecords !== 1 ? "s" : ""} show regression — some family relationships are deteriorating despite support being in place, requiring urgent review of the support approach.`,
    );
  }

  // Unreported incidents in supervised contact
  if (supervisedIncidents > 0 && incidentReportingRate < 100) {
    concerns.push(
      `${pct(supervisedIncidents - supervisedIncidentsReported, supervisedIncidents)}% of incidents during supervised contact not reported — all incidents must be documented and reported for safeguarding compliance.`,
    );
  }

  // Contact notes not recorded
  if (contactNotesRate < 80 && contactsOccurred > 0) {
    concerns.push(
      `Only ${contactNotesRate}% of contacts have notes recorded — documentation of contact outcomes is incomplete, which limits the home's ability to evidence and review contact quality.`,
    );
  }

  // No scheduled contacts despite children on placement
  if (totalScheduledContacts === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No scheduled contacts recorded despite children being on placement — the home may not be actively facilitating or recording family contact arrangements.",
    );
  }

  // Low parent views incorporation
  if (parentViewsIncorporationRate < 50 && parentParticipated > 0) {
    concerns.push(
      `Only ${parentViewsIncorporationRate}% of parent views incorporated into decisions — parents may feel their involvement is tokenistic if their views do not influence outcomes.`,
    );
  }

  // Safeguarding concerns not acted on
  if (visitsWithSafeguardingConcerns > 0 && safeguardingResponseRate < 100) {
    concerns.push(
      `${pct(visitsWithSafeguardingConcerns - safeguardingConcernsActedOn, visitsWithSafeguardingConcerns)}% of safeguarding concerns raised during family visits have not been acted on — every safeguarding concern must trigger documented action.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: FamilyEngagementRecommendation[] = [];
  let rank = 0;

  // Immediate recommendations

  if (contactComplianceRate < 50 && totalScheduledContacts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review contact schedules and identify barriers to contact occurring — ensure the home is actively facilitating all planned contacts and escalate systemic barriers to the placing authority.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 — Promoting contact",
    });
  }

  if (supervisedContactAdherenceRate < 50 && totalSupervisedSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and strengthen supervised contact arrangements immediately — ensure supervisors are present, contact plans are followed, and boundaries are maintained at every session to safeguard children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 — Promoting contact, Reg 12 — Safeguarding",
    });
  }

  if (visitRiskAssessmentRate < 80 && totalFamilyVisits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure risk assessments are completed for every family visit before contact takes place — unassessed contact creates safeguarding risks that the home cannot justify to Ofsted.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Protection of children",
    });
  }

  if (childVoiceInContactRate < 30 && totalChildVoiceOpportunities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement systematic capture of children's wishes and feelings about family contact before, during, and after every contact session — children's views must inform contact arrangements.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (familySupportCoverageRate < 30 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review family support provision and ensure all children have access to appropriate family support services — family therapy, sibling contact, life story work, or relationship-building programmes as needed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 8 — Promoting contact",
    });
  }

  if (childDistressRate >= 30 && totalSupervisedSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all supervised contact arrangements where children experience distress — consider whether contact plans need adjustment, additional support is needed, or professional advice should be sought about the appropriateness of contact.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 10 — Health and wellbeing",
    });
  }

  if (visitsWithSafeguardingConcerns > 0 && safeguardingResponseRate < 100) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every safeguarding concern raised during family visits triggers documented action — unaddressed safeguarding concerns represent a regulatory compliance failure.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Protection of children",
    });
  }

  if (supervisedIncidents > 0 && incidentReportingRate < 100) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all incidents occurring during supervised contact sessions are fully documented and reported in line with the home's safeguarding and incident reporting procedures.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Protection of children",
    });
  }

  // Soon recommendations

  if (parentalEngagementRate < 50 && totalEngagementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a parental engagement strategy that identifies and addresses barriers to participation — consider flexible meeting times, virtual attendance options, and proactive outreach to improve involvement.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Child's plan",
    });
  }

  if (parentInvitationRate < 80 && totalEngagementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all parents are consistently invited to every engagement opportunity — parents cannot participate if they are not aware of meetings, reviews, and consultations about their child.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Child's plan",
    });
  }

  if (familySupportAttendanceRate < 50 && totalSessionsPlanned > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate barriers to family support session attendance and implement strategies to improve engagement — consider practical support, timing adjustments, and motivational approaches.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 — Promoting contact",
    });
  }

  if (contactNotesRate < 80 && contactsOccurred > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve contact documentation — ensure notes are recorded for every contact session, capturing the nature and quality of interaction, any concerns, and the child's response.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Record keeping",
    });
  }

  if (regressedRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a multi-disciplinary review of all family support cases showing regression — assess whether alternative approaches, additional resources, or specialist intervention is needed.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 — Promoting contact",
    });
  }

  if (parentViewsIncorporationRate < 50 && parentParticipated > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review how parent views are captured and incorporated into care decisions — ensure parental involvement is meaningful and that parents see their contributions reflected in outcomes.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Child's plan",
    });
  }

  if (
    contactComplianceRate >= 50 &&
    contactComplianceRate < 80 &&
    totalScheduledContacts > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve contact compliance to at least 80% — track reasons for non-occurrence and develop action plans for recurring barriers to ensure children's contact entitlements are met.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 — Promoting contact",
    });
  }

  // Planned recommendations

  if (
    supervisedContactAdherenceRate >= 50 &&
    supervisedContactAdherenceRate < 80 &&
    totalSupervisedSessions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen supervised contact adherence to at least 80% — review supervision arrangements, staff training needs, and contact plan clarity to improve compliance.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 8 — Promoting contact",
    });
  }

  if (
    familySupportCoverageRate >= 30 &&
    familySupportCoverageRate < 80 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend family support coverage to all children who would benefit — review each child's care plan to identify where family support could strengthen relationships and outcomes.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 8 — Promoting contact",
    });
  }

  if (
    childVoiceInContactRate >= 30 &&
    childVoiceInContactRate < 70 &&
    totalChildVoiceOpportunities > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop consistent practice for capturing children's voices about family contact — use age-appropriate tools and embed voice capture into every contact interaction.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    parentalEngagementRate >= 50 &&
    parentalEngagementRate < 70 &&
    totalEngagementRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Continue to develop parental engagement by building on current levels — identify parents who are not yet engaged and develop personalised approaches to encourage involvement.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Child's plan",
    });
  }

  if (
    familySupportAttendanceRate >= 50 &&
    familySupportAttendanceRate < 70 &&
    totalSessionsPlanned > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Continue to improve family support attendance — celebrate progress, address ongoing barriers, and consider whether session formats and schedules meet families' needs.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 8 — Promoting contact",
    });
  }

  if (totalScheduledContacts === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all contact arrangements are documented in the schedule — review each child's care plan to ensure their contact entitlements are recorded and actively facilitated.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 8 — Promoting contact",
    });
  }

  if (cancelledByHome > 0 && totalScheduledContacts > 0) {
    const homeCancelRate = pct(cancelledByHome, totalScheduledContacts);
    if (homeCancelRate >= 10) {
      recommendations.push({
        rank: ++rank,
        recommendation:
          "Investigate and eliminate home-initiated cancellations — the home has a duty to facilitate contact and should not be contributing to disruptions in children's family contact.",
        urgency: "immediate",
        regulatory_ref: "CHR 2015 Reg 8 — Promoting contact",
      });
    }
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: FamilyEngagementInsight[] = [];

  // -- Critical insights --

  if (contactComplianceRate < 50 && totalScheduledContacts > 0) {
    insights.push({
      text: `Only ${contactComplianceRate}% of scheduled contacts occurring. Ofsted will view this as a failure to promote contact as required under Reg 8. Children are being denied their right to maintain family relationships through inadequate facilitation of planned contacts.`,
      severity: "critical",
    });
  }

  if (supervisedContactAdherenceRate < 50 && totalSupervisedSessions > 0) {
    insights.push({
      text: `Only ${supervisedContactAdherenceRate}% supervised contact adherence. Supervision requirements exist to protect children — failure to maintain supervisor presence, follow contact plans, and enforce boundaries creates serious safeguarding risks during family contact.`,
      severity: "critical",
    });
  }

  if (childVoiceInContactRate < 30 && totalChildVoiceOpportunities > 0) {
    insights.push({
      text: `Child voice captured in only ${childVoiceInContactRate}% of contact interactions. Without understanding children's wishes and feelings about family contact, the home cannot demonstrate that contact arrangements are child-centred or that children's emotional wellbeing during contact is being monitored.`,
      severity: "critical",
    });
  }

  if (familySupportCoverageRate < 30 && total_children > 0) {
    insights.push({
      text: `Only ${familySupportCoverageRate}% of children have access to family support services. The majority of children have no active family support programme, which limits the home's ability to promote, maintain, and strengthen family relationships as required under Reg 8.`,
      severity: "critical",
    });
  }

  if (visitRiskAssessmentRate < 50 && totalFamilyVisits > 0) {
    insights.push({
      text: `Only ${visitRiskAssessmentRate}% of family visits have completed risk assessments. Allowing family visits without risk assessments exposes children to unassessed risks and represents a fundamental safeguarding failure that Ofsted will view as a serious breach of Reg 12.`,
      severity: "critical",
    });
  }

  if (childDistressRate >= 50 && totalSupervisedSessions > 0) {
    insights.push({
      text: `${childDistressRate}% of supervised contacts involve child distress — a majority of children are becoming distressed during family contact. This requires urgent professional review of whether current contact arrangements are in children's best interests.`,
      severity: "critical",
    });
  }

  if (visitsWithSafeguardingConcerns > 0 && safeguardingResponseRate < 100) {
    insights.push({
      text: `Safeguarding concerns raised during family visits have not all been acted upon. Every safeguarding concern during contact must trigger documented action — failure to respond to concerns represents a direct breach of the home's safeguarding duties under Reg 12.`,
      severity: "critical",
    });
  }

  if (totalScheduledContacts === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No scheduled contacts recorded despite children being on placement. This may indicate that contact arrangements are not being actively managed or that the home is not recording contact schedules. Ofsted expects to see evidence of proactive contact facilitation.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    contactComplianceRate >= 50 &&
    contactComplianceRate < 80 &&
    totalScheduledContacts > 0
  ) {
    insights.push({
      text: `Contact compliance at ${contactComplianceRate}% — improving but some children's scheduled contacts are not taking place. Each missed contact is a lost opportunity for a child to maintain their family relationship.`,
      severity: "warning",
    });
  }

  if (
    familyVisitQualityRate >= 50 &&
    familyVisitQualityRate < 70 &&
    visitsOccurred > 0
  ) {
    insights.push({
      text: `Family visit quality rate at ${familyVisitQualityRate}% — some visits are not meeting quality expectations. Consider what additional planning, support, or resources could improve the experience for children and families.`,
      severity: "warning",
    });
  }

  if (
    parentalEngagementRate >= 50 &&
    parentalEngagementRate < 70 &&
    totalEngagementRecords > 0
  ) {
    insights.push({
      text: `Parental engagement at ${parentalEngagementRate}% — a significant proportion of parents are not participating in key decisions about their children. Consider whether barriers such as communication methods, meeting times, or relationship dynamics are limiting engagement.`,
      severity: "warning",
    });
  }

  if (
    supervisedContactAdherenceRate >= 50 &&
    supervisedContactAdherenceRate < 80 &&
    totalSupervisedSessions > 0
  ) {
    insights.push({
      text: `Supervised contact adherence at ${supervisedContactAdherenceRate}% — some supervision requirements are not consistently met. This creates potential safeguarding gaps that may be identified during inspection.`,
      severity: "warning",
    });
  }

  if (
    familySupportCoverageRate >= 30 &&
    familySupportCoverageRate < 80 &&
    total_children > 0
  ) {
    insights.push({
      text: `Family support coverage at ${familySupportCoverageRate}% — not all children have access to family support services. Review each child's care plan to identify where additional family support could strengthen relationships and outcomes.`,
      severity: "warning",
    });
  }

  if (
    childVoiceInContactRate >= 30 &&
    childVoiceInContactRate < 70 &&
    totalChildVoiceOpportunities > 0
  ) {
    insights.push({
      text: `Child voice captured in ${childVoiceInContactRate}% of contact interactions — while some recording takes place, there are significant gaps. Consistent capture of children's wishes and feelings is essential for child-centred contact planning.`,
      severity: "warning",
    });
  }

  if (
    childDistressRate >= 15 &&
    childDistressRate < 30 &&
    totalSupervisedSessions > 0
  ) {
    insights.push({
      text: `${childDistressRate}% of supervised contacts involve child distress — while not the majority, this level warrants review of contact plans and support strategies to minimise emotional distress for children.`,
      severity: "warning",
    });
  }

  if (engagementWithBarriers > 0 && totalEngagementRecords > 0) {
    const barrierRate = pct(engagementWithBarriers, totalEngagementRecords);
    if (barrierRate >= 30) {
      insights.push({
        text: `Barriers to parental engagement identified in ${barrierRate}% of records — systematic barriers are preventing parents from fully participating. The home should develop targeted strategies to address these barriers.`,
        severity: "warning",
      });
    }
  }

  if (
    familySupportAttendanceRate >= 50 &&
    familySupportAttendanceRate < 70 &&
    totalSessionsPlanned > 0
  ) {
    insights.push({
      text: `Family support attendance at ${familySupportAttendanceRate}% — while engagement is present, missed sessions may slow progress. Consider practical barriers such as transport, timing, and emotional readiness.`,
      severity: "warning",
    });
  }

  if (cancelledByParent > 0 && totalScheduledContacts > 0) {
    const parentCancelRate = pct(cancelledByParent, totalScheduledContacts);
    if (parentCancelRate >= 20) {
      insights.push({
        text: `Parents cancelled ${parentCancelRate}% of scheduled contacts — frequent parental cancellations may indicate disengagement, unresolved conflict, or practical barriers that require support rather than acceptance.`,
        severity: "warning",
      });
    }
  }

  if (
    parentViewsIncorporationRate >= 50 &&
    parentViewsIncorporationRate < 70 &&
    parentParticipated > 0
  ) {
    insights.push({
      text: `Parent views incorporated in ${parentViewsIncorporationRate}% of cases — while parents are participating, their views are not always influencing outcomes. This risks parents perceiving their involvement as tokenistic.`,
      severity: "warning",
    });
  }

  if (
    visitRiskAssessmentRate >= 50 &&
    visitRiskAssessmentRate < 80 &&
    totalFamilyVisits > 0
  ) {
    insights.push({
      text: `Risk assessments completed for ${visitRiskAssessmentRate}% of family visits — gaps in risk assessment may expose children to unassessed risks during family contact.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (engagement_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding parental contact and family engagement — contact schedules are consistently adhered to, family visits are high-quality, parents are actively engaged in their children's lives, supervised contact is well-managed, and family support services are comprehensive. This is strong evidence for Reg 8 compliance.",
      severity: "positive",
    });
  }

  if (
    contactComplianceRate >= 95 &&
    contactQualityAvg >= 4.0 &&
    totalScheduledContacts > 0 &&
    contactQualityRatings.length > 0
  ) {
    insights.push({
      text: `${contactComplianceRate}% contact compliance with quality averaging ${contactQualityAvg}/5 — the home excels at both facilitating and ensuring the quality of family contact. Children's family relationships are being actively promoted.`,
      severity: "positive",
    });
  }

  if (
    supervisedContactAdherenceRate >= 95 &&
    childPositiveResponseRate >= 80 &&
    totalSupervisedSessions > 0
  ) {
    insights.push({
      text: `${supervisedContactAdherenceRate}% supervised contact adherence with ${childPositiveResponseRate}% positive child response — supervised contact is both safe and beneficial, demonstrating that robust safeguarding and positive family experiences can coexist.`,
      severity: "positive",
    });
  }

  if (
    parentalEngagementRate >= 90 &&
    parentViewsIncorporationRate >= 90 &&
    totalEngagementRecords > 0 &&
    parentParticipated > 0
  ) {
    insights.push({
      text: `${parentalEngagementRate}% parental engagement with ${parentViewsIncorporationRate}% views incorporated — parents are genuine partners in their children's care, with their perspectives actively shaping decisions and outcomes.`,
      severity: "positive",
    });
  }

  if (
    familySupportCoverageRate >= 100 &&
    familySupportAttendanceRate >= 90 &&
    total_children > 0 &&
    totalSessionsPlanned > 0
  ) {
    insights.push({
      text: `Every child has family support with ${familySupportAttendanceRate}% attendance — comprehensive and well-attended family support demonstrates the home's commitment to strengthening family relationships for every child.`,
      severity: "positive",
    });
  }

  if (
    childVoiceInContactRate >= 90 &&
    totalChildVoiceOpportunities > 0
  ) {
    insights.push({
      text: `${childVoiceInContactRate}% child voice captured in contact — children's wishes and feelings about family contact are consistently recorded, ensuring contact arrangements genuinely reflect what children want and need.`,
      severity: "positive",
    });
  }

  if (
    visitRiskAssessmentRate >= 100 &&
    totalFamilyVisits > 0
  ) {
    insights.push({
      text: "Risk assessments completed for every family visit — the home demonstrates exemplary safeguarding practice in managing family contact, ensuring children's safety is assessed before every visit takes place.",
      severity: "positive",
    });
  }

  if (
    rescheduledRate >= 90 &&
    cancelledContacts > 0
  ) {
    insights.push({
      text: `${rescheduledRate}% of cancelled contacts rescheduled — the home proactively ensures that cancelled contacts do not become lost contact opportunities, demonstrating a genuine commitment to maximising children's family time.`,
      severity: "positive",
    });
  }

  if (positiveProgressRate >= 80 && totalFamilySupport > 0) {
    insights.push({
      text: `${positiveProgressRate}% of family support cases showing positive progress — family support interventions are making a demonstrable difference to the quality of family relationships.`,
      severity: "positive",
    });
  }

  if (
    siblingContactRecords > 0 &&
    lifeStoryWorkRecords > 0
  ) {
    insights.push({
      text: `The home provides both sibling contact (${siblingContactRecords} arrangement${siblingContactRecords !== 1 ? "s" : ""}) and life story work (${lifeStoryWorkRecords} programme${lifeStoryWorkRecords !== 1 ? "s" : ""}) — a holistic approach to family identity and relationships that goes beyond basic contact facilitation.`,
      severity: "positive",
    });
  }

  if (
    incidentReportingRate >= 100 &&
    supervisedIncidents > 0
  ) {
    insights.push({
      text: "Every incident during supervised contact has been reported — the home maintains robust incident reporting during family contact, ensuring safeguarding concerns are documented and addressed.",
      severity: "positive",
    });
  }

  if (
    visitReportRate >= 100 &&
    visitsOccurred > 0
  ) {
    insights.push({
      text: "Reports completed for every family visit — thorough documentation supports evidence-based review of contact quality and informs future contact planning.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (engagement_rating === "outstanding") {
    headline =
      "Outstanding parental contact and family engagement — contact schedules are consistently met, family visits are high-quality, and family support is comprehensive.";
  } else if (engagement_rating === "good") {
    headline = `Good parental contact and family engagement — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (engagement_rating === "adequate") {
    headline = `Adequate parental contact and family engagement — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children maintain meaningful family relationships.`;
  } else {
    headline = `Parental contact and family engagement is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's family relationships are promoted and safeguarded.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    engagement_rating,
    engagement_score: score,
    headline,
    total_scheduled_contacts: totalScheduledContacts,
    total_family_visits: totalFamilyVisits,
    total_supervised_sessions: totalSupervisedSessions,
    contact_compliance_rate: contactComplianceRate,
    family_visit_quality_rate: familyVisitQualityRate,
    parental_engagement_rate: parentalEngagementRate,
    supervised_contact_adherence_rate: supervisedContactAdherenceRate,
    family_support_coverage_rate: familySupportCoverageRate,
    child_voice_in_contact_rate: childVoiceInContactRate,
    contact_quality_avg: contactQualityAvg,
    visit_risk_assessment_rate: visitRiskAssessmentRate,
    parent_invitation_rate: parentInvitationRate,
    parent_views_incorporation_rate: parentViewsIncorporationRate,
    supervised_boundary_adherence_rate: supervisedBoundaryAdherenceRate,
    family_support_attendance_rate: familySupportAttendanceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
