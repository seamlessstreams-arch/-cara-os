// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MULTI-AGENCY COLLABORATION INTELLIGENCE ENGINE
// Tracks the quality and effectiveness of multi-agency working — LAC review
// attendance and timeliness, social worker visit frequency, CAMHS/therapeutic
// service engagement, education liaison, and inter-agency information sharing.
// Critical for Ofsted under Children's Homes Regulations 2015 (Reg 5 quality
// of care, Reg 22 contact with agencies, SCCIF leadership and management).
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Quality of care), Reg 22 (Contact with agencies).
// SCCIF: "Leadership and management", "Quality of care".
// Store keys: lacReviewRecords, socialWorkerVisitRecords,
//             therapeuticServiceRecords, educationLiaisonRecords,
//             informationSharingRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface LacReviewRecordInput {
  id: string;
  child_id: string;
  review_date: string;
  review_type: "initial" | "first" | "subsequent" | "emergency";
  on_time: boolean;
  attended_by_child: boolean;
  attended_by_social_worker: boolean;
  attended_by_carer: boolean;
  attended_by_iro: boolean;
  attended_by_education: boolean;
  attended_by_health: boolean;
  child_views_recorded: boolean;
  actions_set: number;
  actions_completed: number;
  minutes_circulated_within_target: boolean;
  next_review_date: string | null;
  outcome_quality: "good" | "adequate" | "poor";
  notes: string;
  created_at: string;
}

export interface SocialWorkerVisitRecordInput {
  id: string;
  child_id: string;
  visit_date: string;
  visit_type: "statutory" | "additional" | "unannounced" | "virtual";
  within_statutory_timescale: boolean;
  child_seen_alone: boolean;
  child_views_sought: boolean;
  visit_recorded_promptly: boolean;
  social_worker_name: string;
  social_worker_consistent: boolean;
  placement_plan_reviewed: boolean;
  actions_arising: number;
  actions_followed_up: boolean;
  quality_rating: "good" | "adequate" | "poor";
  notes: string;
  created_at: string;
}

export interface TherapeuticServiceRecordInput {
  id: string;
  child_id: string;
  service_type: "camhs" | "counselling" | "art_therapy" | "play_therapy" | "psychologist" | "psychiatrist" | "speech_and_language" | "occupational_therapy" | "other";
  referral_date: string;
  first_appointment_date: string | null;
  service_active: boolean;
  sessions_offered: number;
  sessions_attended: number;
  child_engaged: boolean;
  progress_reported: boolean;
  waiting_list: boolean;
  waiting_days: number;
  professional_name: string;
  home_liaison_quality: "good" | "adequate" | "poor";
  information_shared_with_home: boolean;
  notes: string;
  created_at: string;
}

export interface EducationLiaisonRecordInput {
  id: string;
  child_id: string;
  liaison_date: string;
  liaison_type: "pep_meeting" | "parents_evening" | "phone_call" | "email" | "school_visit" | "virtual_meeting" | "annual_review" | "exclusion_meeting" | "other";
  school_name: string;
  attended_by_home: boolean;
  attended_by_social_worker: boolean;
  pep_up_to_date: boolean;
  educational_progress_discussed: boolean;
  actions_agreed: number;
  actions_completed: number;
  pupil_premium_discussed: boolean;
  designated_teacher_involved: boolean;
  ehcp_relevant: boolean;
  ehcp_reviewed: boolean;
  quality_rating: "good" | "adequate" | "poor";
  notes: string;
  created_at: string;
}

export interface InformationSharingRecordInput {
  id: string;
  date: string;
  sharing_type: "multi_agency_meeting" | "strategy_meeting" | "professionals_meeting" | "case_conference" | "looked_after_review" | "email_update" | "phone_update" | "written_report" | "information_request" | "safeguarding_referral" | "other";
  agencies_involved: string[];
  initiated_by_home: boolean;
  timely: boolean;
  information_complete: boolean;
  consent_obtained: boolean;
  gdpr_compliant: boolean;
  outcome_recorded: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  child_id: string | null;
  is_multi_agency_meeting: boolean;
  notes: string;
  created_at: string;
}

export interface MultiAgencyCollaborationInput {
  today: string;
  total_children: number;
  lac_review_records: LacReviewRecordInput[];
  social_worker_visit_records: SocialWorkerVisitRecordInput[];
  therapeutic_service_records: TherapeuticServiceRecordInput[];
  education_liaison_records: EducationLiaisonRecordInput[];
  information_sharing_records: InformationSharingRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type MultiAgencyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface MultiAgencyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface MultiAgencyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface MultiAgencyCollaborationResult {
  agency_rating: MultiAgencyRating;
  agency_score: number;
  headline: string;
  total_lac_reviews: number;
  total_sw_visits: number;
  total_therapeutic_records: number;
  total_education_liaisons: number;
  total_info_sharing_records: number;
  lac_review_timeliness_rate: number;
  social_worker_visit_rate: number;
  therapeutic_engagement_rate: number;
  education_liaison_rate: number;
  information_sharing_rate: number;
  multi_agency_meeting_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: MultiAgencyRecommendation[];
  insights: MultiAgencyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): MultiAgencyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: MultiAgencyRating,
  score: number,
  headline: string,
): MultiAgencyCollaborationResult {
  return {
    agency_rating: rating,
    agency_score: score,
    headline,
    total_lac_reviews: 0,
    total_sw_visits: 0,
    total_therapeutic_records: 0,
    total_education_liaisons: 0,
    total_info_sharing_records: 0,
    lac_review_timeliness_rate: 0,
    social_worker_visit_rate: 0,
    therapeutic_engagement_rate: 0,
    education_liaison_rate: 0,
    information_sharing_rate: 0,
    multi_agency_meeting_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeMultiAgencyCollaboration(
  input: MultiAgencyCollaborationInput,
): MultiAgencyCollaborationResult {
  const {
    total_children,
    lac_review_records,
    social_worker_visit_records,
    therapeutic_service_records,
    education_liaison_records,
    information_sharing_records,
  } = input;

  // ── Special case: all empty + 0 children -> insufficient_data ──────────
  const allEmpty =
    lac_review_records.length === 0 &&
    social_worker_visit_records.length === 0 &&
    therapeutic_service_records.length === 0 &&
    education_liaison_records.length === 0 &&
    information_sharing_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess multi-agency collaboration.",
    );
  }

  // ── Special case: all empty + children > 0 -> inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No multi-agency collaboration data recorded despite children on placement — LAC reviews, social worker visits, therapeutic services, education liaison, and inter-agency information sharing require urgent attention.",
      ),
      concerns: [
        "No LAC review records, social worker visit records, therapeutic service records, education liaison records, or information sharing records exist despite children being on placement — the home cannot evidence effective multi-agency working.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of all multi-agency interactions including LAC reviews, social worker visits, therapeutic service engagement, education liaison, and inter-agency information sharing to evidence effective partnership working under Regulation 22.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 22 — Contact between child and relevant agencies",
        },
        {
          rank: 2,
          recommendation:
            "Establish a multi-agency collaboration framework that ensures all statutory contacts, professional meetings, and inter-agency communications are recorded, tracked, and quality-assured to demonstrate the home's commitment to partnership working.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
        },
      ],
      insights: [
        {
          text: "The complete absence of multi-agency collaboration records means the home cannot demonstrate effective partnership working with placing authorities, social workers, therapeutic services, or education providers. This is a critical gap under Children's Homes Regulations 2015 Reg 22 and will be of significant concern to Ofsted inspectors assessing leadership and management.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- LAC Review metrics ---
  const totalLacReviews = lac_review_records.length;
  const onTimeLacReviews = lac_review_records.filter((r) => r.on_time).length;
  const lacReviewTimelinessRate = pct(onTimeLacReviews, totalLacReviews);

  const lacChildAttendance = lac_review_records.filter((r) => r.attended_by_child).length;
  const lacChildAttendanceRate = pct(lacChildAttendance, totalLacReviews);

  const lacSWAttendance = lac_review_records.filter((r) => r.attended_by_social_worker).length;
  const lacSWAttendanceRate = pct(lacSWAttendance, totalLacReviews);

  const lacCarerAttendance = lac_review_records.filter((r) => r.attended_by_carer).length;
  const lacCarerAttendanceRate = pct(lacCarerAttendance, totalLacReviews);

  const lacIROAttendance = lac_review_records.filter((r) => r.attended_by_iro).length;
  const lacIROAttendanceRate = pct(lacIROAttendance, totalLacReviews);

  const lacEducationAttendance = lac_review_records.filter((r) => r.attended_by_education).length;
  const lacEducationAttendanceRate = pct(lacEducationAttendance, totalLacReviews);

  const lacHealthAttendance = lac_review_records.filter((r) => r.attended_by_health).length;
  const lacHealthAttendanceRate = pct(lacHealthAttendance, totalLacReviews);

  const lacChildViewsRecorded = lac_review_records.filter((r) => r.child_views_recorded).length;
  const lacChildViewsRate = pct(lacChildViewsRecorded, totalLacReviews);

  const lacActionsSet = lac_review_records.reduce((sum, r) => sum + r.actions_set, 0);
  const lacActionsCompleted = lac_review_records.reduce((sum, r) => sum + r.actions_completed, 0);
  const lacActionCompletionRate = pct(lacActionsCompleted, lacActionsSet);

  const lacMinutesTimely = lac_review_records.filter((r) => r.minutes_circulated_within_target).length;
  const lacMinutesTimelyRate = pct(lacMinutesTimely, totalLacReviews);

  const lacGoodOutcomes = lac_review_records.filter((r) => r.outcome_quality === "good").length;
  const lacGoodOutcomeRate = pct(lacGoodOutcomes, totalLacReviews);

  const lacPoorOutcomes = lac_review_records.filter((r) => r.outcome_quality === "poor").length;
  const lacPoorOutcomeRate = pct(lacPoorOutcomes, totalLacReviews);

  // --- Social Worker Visit metrics ---
  const totalSWVisits = social_worker_visit_records.length;
  const withinTimescaleSW = social_worker_visit_records.filter((v) => v.within_statutory_timescale).length;
  const socialWorkerVisitRate = pct(withinTimescaleSW, totalSWVisits);

  const childSeenAlone = social_worker_visit_records.filter((v) => v.child_seen_alone).length;
  const childSeenAloneRate = pct(childSeenAlone, totalSWVisits);

  const childViewsSought = social_worker_visit_records.filter((v) => v.child_views_sought).length;
  const childViewsSoughtRate = pct(childViewsSought, totalSWVisits);

  const visitRecordedPromptly = social_worker_visit_records.filter((v) => v.visit_recorded_promptly).length;
  const visitRecordedPromptlyRate = pct(visitRecordedPromptly, totalSWVisits);

  const swConsistent = social_worker_visit_records.filter((v) => v.social_worker_consistent).length;
  const swConsistencyRate = pct(swConsistent, totalSWVisits);

  const placementPlanReviewed = social_worker_visit_records.filter((v) => v.placement_plan_reviewed).length;
  const placementPlanReviewRate = pct(placementPlanReviewed, totalSWVisits);

  const swActionsArisingTotal = social_worker_visit_records.reduce((sum, v) => sum + v.actions_arising, 0);
  const swActionsFollowedUp = social_worker_visit_records.filter((v) => v.actions_followed_up).length;
  const swFollowUpRate = pct(swActionsFollowedUp, totalSWVisits);

  const swGoodQuality = social_worker_visit_records.filter((v) => v.quality_rating === "good").length;
  const swGoodQualityRate = pct(swGoodQuality, totalSWVisits);

  const swPoorQuality = social_worker_visit_records.filter((v) => v.quality_rating === "poor").length;
  const swPoorQualityRate = pct(swPoorQuality, totalSWVisits);

  // --- Therapeutic Service metrics ---
  const totalTherapeuticRecords = therapeutic_service_records.length;
  const activeServices = therapeutic_service_records.filter((t) => t.service_active).length;

  const sessionsOffered = therapeutic_service_records.reduce((sum, t) => sum + t.sessions_offered, 0);
  const sessionsAttended = therapeutic_service_records.reduce((sum, t) => sum + t.sessions_attended, 0);
  const therapeuticAttendanceRate = pct(sessionsAttended, sessionsOffered);

  const therapeuticEngaged = therapeutic_service_records.filter((t) => t.child_engaged).length;
  const therapeuticEngagementRate = pct(therapeuticEngaged, totalTherapeuticRecords);

  const therapeuticProgressReported = therapeutic_service_records.filter((t) => t.progress_reported).length;
  const therapeuticProgressRate = pct(therapeuticProgressReported, totalTherapeuticRecords);

  const onWaitingList = therapeutic_service_records.filter((t) => t.waiting_list).length;
  const waitingListRate = pct(onWaitingList, totalTherapeuticRecords);

  const longWaits = therapeutic_service_records.filter((t) => t.waiting_list && t.waiting_days > 90).length;

  const therapeuticInfoShared = therapeutic_service_records.filter((t) => t.information_shared_with_home).length;
  const therapeuticInfoSharedRate = pct(therapeuticInfoShared, totalTherapeuticRecords);

  const therapeuticGoodLiaison = therapeutic_service_records.filter((t) => t.home_liaison_quality === "good").length;
  const therapeuticGoodLiaisonRate = pct(therapeuticGoodLiaison, totalTherapeuticRecords);

  const therapeuticPoorLiaison = therapeutic_service_records.filter((t) => t.home_liaison_quality === "poor").length;
  const therapeuticPoorLiaisonRate = pct(therapeuticPoorLiaison, totalTherapeuticRecords);

  const uniqueChildrenInTherapy = new Set(
    therapeutic_service_records.filter((t) => t.service_active).map((t) => t.child_id),
  ).size;

  // --- Education Liaison metrics ---
  const totalEducationLiaisons = education_liaison_records.length;
  const attendedByHome = education_liaison_records.filter((e) => e.attended_by_home).length;
  const educationLiaisonRate = pct(attendedByHome, totalEducationLiaisons);

  const attendedBySW = education_liaison_records.filter((e) => e.attended_by_social_worker).length;
  const educationSWAttendanceRate = pct(attendedBySW, totalEducationLiaisons);

  const pepUpToDate = education_liaison_records.filter((e) => e.pep_up_to_date).length;
  const pepUpToDateRate = pct(pepUpToDate, totalEducationLiaisons);

  const educationProgressDiscussed = education_liaison_records.filter((e) => e.educational_progress_discussed).length;
  const educationProgressRate = pct(educationProgressDiscussed, totalEducationLiaisons);

  const educationActionsAgreed = education_liaison_records.reduce((sum, e) => sum + e.actions_agreed, 0);
  const educationActionsCompleted = education_liaison_records.reduce((sum, e) => sum + e.actions_completed, 0);
  const educationActionCompletionRate = pct(educationActionsCompleted, educationActionsAgreed);

  const pupilPremiumDiscussed = education_liaison_records.filter((e) => e.pupil_premium_discussed).length;
  const pupilPremiumRate = pct(pupilPremiumDiscussed, totalEducationLiaisons);

  const designatedTeacherInvolved = education_liaison_records.filter((e) => e.designated_teacher_involved).length;
  const designatedTeacherRate = pct(designatedTeacherInvolved, totalEducationLiaisons);

  const ehcpRelevant = education_liaison_records.filter((e) => e.ehcp_relevant).length;
  const ehcpReviewed = education_liaison_records.filter((e) => e.ehcp_relevant && e.ehcp_reviewed).length;
  const ehcpReviewRate = pct(ehcpReviewed, ehcpRelevant);

  const educationGoodQuality = education_liaison_records.filter((e) => e.quality_rating === "good").length;
  const educationGoodQualityRate = pct(educationGoodQuality, totalEducationLiaisons);

  const educationPoorQuality = education_liaison_records.filter((e) => e.quality_rating === "poor").length;

  // --- Information Sharing metrics ---
  const totalInfoSharingRecords = information_sharing_records.length;
  const timelySharing = information_sharing_records.filter((i) => i.timely).length;
  const informationSharingRate = pct(timelySharing, totalInfoSharingRecords);

  const completeInfo = information_sharing_records.filter((i) => i.information_complete).length;
  const informationCompletenessRate = pct(completeInfo, totalInfoSharingRecords);

  const consentObtained = information_sharing_records.filter((i) => i.consent_obtained).length;
  const consentRate = pct(consentObtained, totalInfoSharingRecords);

  const gdprCompliant = information_sharing_records.filter((i) => i.gdpr_compliant).length;
  const gdprComplianceRate = pct(gdprCompliant, totalInfoSharingRecords);

  const outcomeRecorded = information_sharing_records.filter((i) => i.outcome_recorded).length;
  const outcomeRecordedRate = pct(outcomeRecorded, totalInfoSharingRecords);

  const homeInitiated = information_sharing_records.filter((i) => i.initiated_by_home).length;
  const homeInitiatedRate = pct(homeInitiated, totalInfoSharingRecords);

  const followUpRequired = information_sharing_records.filter((i) => i.follow_up_required).length;
  const followUpCompleted = information_sharing_records.filter((i) => i.follow_up_required && i.follow_up_completed).length;
  const followUpCompletionRate = pct(followUpCompleted, followUpRequired);

  // Multi-agency meeting rate — proportion of info sharing that are actual meetings
  const multiAgencyMeetings = information_sharing_records.filter((i) => i.is_multi_agency_meeting).length;
  const multiAgencyMeetingRate = pct(multiAgencyMeetings, totalInfoSharingRecords);

  // Unique agencies
  const allAgencies = new Set<string>();
  for (const record of information_sharing_records) {
    for (const agency of record.agencies_involved) {
      allAgencies.add(agency);
    }
  }
  const uniqueAgencyCount = allAgencies.size;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: lacReviewTimelinessRate (>=95: +4, >=80: +2) ---
  if (lacReviewTimelinessRate >= 95) score += 4;
  else if (lacReviewTimelinessRate >= 80) score += 2;

  // --- Bonus 2: socialWorkerVisitRate (>=95: +4, >=80: +2) ---
  if (socialWorkerVisitRate >= 95) score += 4;
  else if (socialWorkerVisitRate >= 80) score += 2;

  // --- Bonus 3: therapeuticEngagementRate (>=90: +3, >=70: +1) ---
  if (therapeuticEngagementRate >= 90) score += 3;
  else if (therapeuticEngagementRate >= 70) score += 1;

  // --- Bonus 4: educationLiaisonRate (>=95: +3, >=80: +1) ---
  if (educationLiaisonRate >= 95) score += 3;
  else if (educationLiaisonRate >= 80) score += 1;

  // --- Bonus 5: informationSharingRate (>=95: +3, >=80: +1) ---
  if (informationSharingRate >= 95) score += 3;
  else if (informationSharingRate >= 80) score += 1;

  // --- Bonus 6: lacActionCompletionRate (>=90: +3, >=70: +1) ---
  if (lacActionCompletionRate >= 90) score += 3;
  else if (lacActionCompletionRate >= 70) score += 1;

  // --- Bonus 7: childSeenAloneRate (>=95: +3, >=80: +1) ---
  if (childSeenAloneRate >= 95) score += 3;
  else if (childSeenAloneRate >= 80) score += 1;

  // --- Bonus 8: pepUpToDateRate (>=95: +3, >=70: +1) ---
  if (pepUpToDateRate >= 95) score += 3;
  else if (pepUpToDateRate >= 70) score += 1;

  // --- Bonus 9: gdprComplianceRate (>=95: +2, >=80: +1) ---
  if (gdprComplianceRate >= 95) score += 2;
  else if (gdprComplianceRate >= 80) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // lacReviewTimelinessRate < 50 -> -6 (guarded)
  if (lacReviewTimelinessRate < 50 && totalLacReviews > 0) score -= 6;

  // socialWorkerVisitRate < 50 -> -5 (guarded)
  if (socialWorkerVisitRate < 50 && totalSWVisits > 0) score -= 5;

  // therapeuticEngagementRate < 40 -> -4 (guarded)
  if (therapeuticEngagementRate < 40 && totalTherapeuticRecords > 0) score -= 4;

  // informationSharingRate < 50 -> -3 (guarded)
  if (informationSharingRate < 50 && totalInfoSharingRecords > 0) score -= 3;

  score = clamp(score, 0, 100);

  const agency_rating = toRating(score);

  // ── Headline ──────────────────────────────────────────────────────────

  const headlineParts: string[] = [];

  if (agency_rating === "outstanding") {
    headlineParts.push("Outstanding multi-agency collaboration");
  } else if (agency_rating === "good") {
    headlineParts.push("Good multi-agency collaboration");
  } else if (agency_rating === "adequate") {
    headlineParts.push("Adequate multi-agency collaboration with areas for improvement");
  } else {
    headlineParts.push("Inadequate multi-agency collaboration requiring urgent improvement");
  }

  if (totalLacReviews > 0) {
    headlineParts.push(`${lacReviewTimelinessRate}% LAC reviews on time`);
  }
  if (totalSWVisits > 0) {
    headlineParts.push(`${socialWorkerVisitRate}% SW visits within timescale`);
  }
  if (totalTherapeuticRecords > 0) {
    headlineParts.push(`${therapeuticEngagementRate}% therapeutic engagement`);
  }

  const headline = headlineParts.join(" — ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  // S1: LAC review timeliness
  if (lacReviewTimelinessRate >= 95 && totalLacReviews > 0) {
    strengths.push(
      `${lacReviewTimelinessRate}% of LAC reviews held on time — the home demonstrates excellent compliance with statutory review timescales, ensuring children's care plans are reviewed promptly.`,
    );
  } else if (lacReviewTimelinessRate >= 80 && totalLacReviews > 0) {
    strengths.push(
      `${lacReviewTimelinessRate}% LAC review timeliness — the home maintains good compliance with statutory review timescales.`,
    );
  }

  // S2: Social worker visit rate
  if (socialWorkerVisitRate >= 95 && totalSWVisits > 0) {
    strengths.push(
      `${socialWorkerVisitRate}% of social worker visits within statutory timescales — excellent partnership working ensures children are seen regularly by their allocated social worker.`,
    );
  } else if (socialWorkerVisitRate >= 80 && totalSWVisits > 0) {
    strengths.push(
      `${socialWorkerVisitRate}% social worker visit compliance — good levels of statutory visiting are maintained across the home.`,
    );
  }

  // S3: Therapeutic engagement
  if (therapeuticEngagementRate >= 90 && totalTherapeuticRecords > 0) {
    strengths.push(
      `${therapeuticEngagementRate}% therapeutic service engagement — children are actively engaged with CAMHS, counselling, and specialist therapeutic services, with the home effectively supporting attendance and participation.`,
    );
  } else if (therapeuticEngagementRate >= 70 && totalTherapeuticRecords > 0) {
    strengths.push(
      `${therapeuticEngagementRate}% therapeutic engagement rate — good levels of children's engagement with therapeutic and specialist services.`,
    );
  }

  // S4: Education liaison
  if (educationLiaisonRate >= 95 && totalEducationLiaisons > 0) {
    strengths.push(
      `${educationLiaisonRate}% home attendance at education liaisons — the home is fully engaged with education providers, ensuring children's educational progress is actively monitored and supported.`,
    );
  } else if (educationLiaisonRate >= 80 && totalEducationLiaisons > 0) {
    strengths.push(
      `${educationLiaisonRate}% education liaison attendance — good engagement with schools and education providers to support children's learning.`,
    );
  }

  // S5: Information sharing timeliness
  if (informationSharingRate >= 95 && totalInfoSharingRecords > 0) {
    strengths.push(
      `${informationSharingRate}% of inter-agency information shared on time — the home demonstrates exemplary communication with partner agencies, ensuring timely flow of critical information.`,
    );
  } else if (informationSharingRate >= 80 && totalInfoSharingRecords > 0) {
    strengths.push(
      `${informationSharingRate}% timely information sharing — good levels of inter-agency communication are maintained.`,
    );
  }

  // S6: LAC action completion
  if (lacActionCompletionRate >= 90 && lacActionsSet > 0) {
    strengths.push(
      `${lacActionCompletionRate}% of LAC review actions completed — the home follows through on actions arising from reviews, demonstrating commitment to improving children's outcomes.`,
    );
  } else if (lacActionCompletionRate >= 70 && lacActionsSet > 0) {
    strengths.push(
      `${lacActionCompletionRate}% LAC review action completion — the home generally delivers on actions agreed at statutory reviews.`,
    );
  }

  // S7: Child seen alone
  if (childSeenAloneRate >= 95 && totalSWVisits > 0) {
    strengths.push(
      `${childSeenAloneRate}% of children seen alone during social worker visits — children consistently have private opportunities to share their views and any concerns with their social worker.`,
    );
  } else if (childSeenAloneRate >= 80 && totalSWVisits > 0) {
    strengths.push(
      `${childSeenAloneRate}% of children seen alone by their social worker — good practice ensuring children have private time with their social worker.`,
    );
  }

  // S8: PEP up to date
  if (pepUpToDateRate >= 95 && totalEducationLiaisons > 0) {
    strengths.push(
      `${pepUpToDateRate}% PEPs up to date — personal education plans are current and regularly reviewed, supporting effective educational planning for looked-after children.`,
    );
  } else if (pepUpToDateRate >= 70 && totalEducationLiaisons > 0) {
    strengths.push(
      `${pepUpToDateRate}% of PEPs up to date — good compliance with personal education plan requirements.`,
    );
  }

  // S9: GDPR compliance
  if (gdprComplianceRate >= 95 && totalInfoSharingRecords > 0) {
    strengths.push(
      `${gdprComplianceRate}% GDPR compliance in information sharing — the home maintains excellent data protection standards when sharing information with partner agencies.`,
    );
  } else if (gdprComplianceRate >= 80 && totalInfoSharingRecords > 0) {
    strengths.push(
      `${gdprComplianceRate}% GDPR compliance — good data protection practice in inter-agency information sharing.`,
    );
  }

  // S10: Social worker consistency
  if (swConsistencyRate >= 90 && totalSWVisits > 0) {
    strengths.push(
      `${swConsistencyRate}% social worker consistency — children benefit from continuity of relationship with their allocated social worker, supporting attachment and trust.`,
    );
  }

  // S11: Child views at LAC reviews
  if (lacChildViewsRate >= 95 && totalLacReviews > 0) {
    strengths.push(
      `${lacChildViewsRate}% of LAC reviews recorded children's views — the home ensures children's voices are heard in their statutory reviews, supporting their participation in decisions about their care.`,
    );
  }

  // S12: Therapeutic progress reporting
  if (therapeuticProgressRate >= 90 && totalTherapeuticRecords > 0) {
    strengths.push(
      `${therapeuticProgressRate}% of therapeutic services reporting progress — the home effectively tracks therapeutic outcomes, enabling care plans to be adjusted based on evidence of progress.`,
    );
  }

  // S13: Multi-agency agency diversity
  if (uniqueAgencyCount >= 5 && totalInfoSharingRecords > 0) {
    strengths.push(
      `Information shared with ${uniqueAgencyCount} different agencies — the home maintains a broad professional network ensuring comprehensive multi-agency support for children.`,
    );
  }

  // S14: Home-initiated sharing
  if (homeInitiatedRate >= 70 && totalInfoSharingRecords > 0) {
    strengths.push(
      `${homeInitiatedRate}% of information sharing initiated by the home — the home is proactive in communication with partner agencies rather than simply responding to requests.`,
    );
  }

  // S15: Designated teacher involvement
  if (designatedTeacherRate >= 90 && totalEducationLiaisons > 0) {
    strengths.push(
      `${designatedTeacherRate}% education liaisons involve the designated teacher — strong engagement with the key professional responsible for looked-after children in education settings.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  // C1: LAC review timeliness low
  if (lacReviewTimelinessRate < 50 && totalLacReviews > 0) {
    concerns.push(
      `Only ${lacReviewTimelinessRate}% of LAC reviews held on time — the majority of statutory reviews are delayed, meaning children's care plans are not being reviewed within required timescales. This is a significant regulatory concern under Regulation 22.`,
    );
  } else if (lacReviewTimelinessRate < 80 && lacReviewTimelinessRate >= 50 && totalLacReviews > 0) {
    concerns.push(
      `LAC review timeliness at ${lacReviewTimelinessRate}% — not all statutory reviews are being held within required timescales, which may delay necessary changes to children's care plans.`,
    );
  }

  // C2: Social worker visit rate low
  if (socialWorkerVisitRate < 50 && totalSWVisits > 0) {
    concerns.push(
      `Only ${socialWorkerVisitRate}% of social worker visits within statutory timescales — the majority of visits are overdue, meaning children are not being seen by their social worker as required. This is a fundamental safeguarding concern.`,
    );
  } else if (socialWorkerVisitRate < 80 && socialWorkerVisitRate >= 50 && totalSWVisits > 0) {
    concerns.push(
      `Social worker visit compliance at ${socialWorkerVisitRate}% — not all visits are within statutory timescales, with some children waiting longer than they should between social worker contacts.`,
    );
  }

  // C3: Therapeutic engagement low
  if (therapeuticEngagementRate < 40 && totalTherapeuticRecords > 0) {
    concerns.push(
      `Only ${therapeuticEngagementRate}% therapeutic service engagement — the majority of children referred to therapeutic services are not engaged, raising serious concerns about whether their emotional and mental health needs are being met.`,
    );
  } else if (therapeuticEngagementRate < 70 && therapeuticEngagementRate >= 40 && totalTherapeuticRecords > 0) {
    concerns.push(
      `Therapeutic engagement at ${therapeuticEngagementRate}% — not all children are meaningfully engaging with their therapeutic services, which may impact their emotional wellbeing and recovery.`,
    );
  }

  // C4: Education liaison attendance low
  if (educationLiaisonRate < 60 && totalEducationLiaisons > 0) {
    concerns.push(
      `Only ${educationLiaisonRate}% home attendance at education liaisons — the home is not consistently attending education meetings, potentially missing critical information about children's educational needs and progress.`,
    );
  } else if (educationLiaisonRate < 80 && educationLiaisonRate >= 60 && totalEducationLiaisons > 0) {
    concerns.push(
      `Education liaison attendance at ${educationLiaisonRate}% — the home is not always present at education meetings, which may affect the quality of educational support for looked-after children.`,
    );
  }

  // C5: Information sharing timeliness low
  if (informationSharingRate < 50 && totalInfoSharingRecords > 0) {
    concerns.push(
      `Only ${informationSharingRate}% of information sharing is timely — the majority of inter-agency communications are delayed, which could compromise safeguarding and the quality of multi-agency decision-making.`,
    );
  } else if (informationSharingRate < 80 && informationSharingRate >= 50 && totalInfoSharingRecords > 0) {
    concerns.push(
      `Information sharing timeliness at ${informationSharingRate}% — some inter-agency communications are not timely, potentially affecting the quality of collaborative working.`,
    );
  }

  // C6: Waiting list / long waits
  if (longWaits > 0) {
    concerns.push(
      `${longWaits} therapeutic service referral${longWaits === 1 ? " has" : "s have"} been waiting over 90 days — children on lengthy waiting lists may not be receiving the specialist support they need in a timely manner.`,
    );
  } else if (waitingListRate >= 40 && totalTherapeuticRecords > 0) {
    concerns.push(
      `${waitingListRate}% of therapeutic service referrals are on waiting lists — significant waiting times may delay children receiving essential therapeutic support.`,
    );
  }

  // C7: Child not seen alone
  if (childSeenAloneRate < 60 && totalSWVisits > 0) {
    concerns.push(
      `Only ${childSeenAloneRate}% of children seen alone during social worker visits — children are not consistently given private opportunities to share their views and concerns, which is a fundamental safeguarding practice.`,
    );
  } else if (childSeenAloneRate < 80 && childSeenAloneRate >= 60 && totalSWVisits > 0) {
    concerns.push(
      `Children seen alone by social workers at ${childSeenAloneRate}% — not all children are having private time with their social worker during visits.`,
    );
  }

  // C8: PEP compliance low
  if (pepUpToDateRate < 50 && totalEducationLiaisons > 0) {
    concerns.push(
      `Only ${pepUpToDateRate}% of PEPs up to date — personal education plans are not being maintained, which means children's educational support and pupil premium allocation may not be properly planned.`,
    );
  } else if (pepUpToDateRate < 70 && pepUpToDateRate >= 50 && totalEducationLiaisons > 0) {
    concerns.push(
      `PEP compliance at ${pepUpToDateRate}% — not all personal education plans are current, potentially affecting the quality of educational planning for looked-after children.`,
    );
  }

  // C9: LAC poor outcomes
  if (lacPoorOutcomeRate >= 30 && totalLacReviews > 0) {
    concerns.push(
      `${lacPoorOutcomeRate}% of LAC reviews rated as poor outcome quality — a significant proportion of statutory reviews are not achieving good outcomes for children.`,
    );
  }

  // C10: GDPR compliance low
  if (gdprComplianceRate < 70 && totalInfoSharingRecords > 0) {
    concerns.push(
      `GDPR compliance in information sharing at only ${gdprComplianceRate}% — the home is not consistently meeting data protection requirements when sharing information with partner agencies, creating regulatory and legal risk.`,
    );
  }

  // C11: Therapeutic info not shared
  if (therapeuticInfoSharedRate < 60 && totalTherapeuticRecords > 0) {
    concerns.push(
      `Only ${therapeuticInfoSharedRate}% of therapeutic services sharing information with the home — lack of information flow from therapeutic providers limits the home's ability to provide consistent, trauma-informed care.`,
    );
  }

  // C12: SW poor quality visits
  if (swPoorQualityRate >= 25 && totalSWVisits > 0) {
    concerns.push(
      `${swPoorQualityRate}% of social worker visits rated as poor quality — the home should escalate concerns about visit quality with the placing authority to ensure children receive meaningful social work support.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: MultiAgencyRecommendation[] = [];
  let rank = 0;

  if (lacReviewTimelinessRate < 50 && totalLacReviews > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address LAC review timeliness — liaise with IROs and placing authorities to ensure all statutory reviews are scheduled and held within required timescales. Implement a tracking system with advance alerts to prevent delays.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 22 — Contact between child and relevant agencies",
    });
  }

  if (socialWorkerVisitRate < 50 && totalSWVisits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Escalate social worker visiting concerns to placing authorities immediately — children must be seen within statutory timescales. Document all instances of delayed visits and the impact on children to support formal escalation.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 22 — Contact between child and relevant agencies",
    });
  }

  if (therapeuticEngagementRate < 40 && totalTherapeuticRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review therapeutic service engagement with each child's professional network — identify barriers to engagement, consider alternative therapeutic approaches, and ensure the home is actively supporting children to attend and participate in their therapeutic sessions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (informationSharingRate < 50 && totalInfoSharingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a structured information-sharing protocol with clear timescales for all inter-agency communications — establish standard response times, escalation routes, and a central log to track and quality-assure all information sharing.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (childSeenAloneRate < 60 && totalSWVisits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children are routinely seen alone during social worker visits — this is fundamental safeguarding practice. Raise with placing authorities where social workers are not consistently seeing children privately.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (educationLiaisonRate < 60 && totalEducationLiaisons > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Prioritise attendance at all education liaison meetings — the home must be represented at PEP meetings, parents' evenings, and any education meetings concerning looked-after children to advocate effectively for their educational needs.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (longWaits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Escalate children on lengthy therapeutic waiting lists to placing authorities — explore interim therapeutic support, consult with the CAMHS team about bridging strategies, and document the impact of waiting on children's wellbeing.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (pepUpToDateRate < 50 && totalEducationLiaisons > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all PEPs are brought up to date and reviewed at least termly — work with designated teachers and virtual school heads to schedule PEP reviews and ensure pupil premium is being used effectively.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (gdprComplianceRate < 70 && totalInfoSharingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review GDPR compliance in all information-sharing processes — ensure consent is obtained, data is shared lawfully, and all staff understand their data protection responsibilities when communicating with partner agencies.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (lacReviewTimelinessRate >= 50 && lacReviewTimelinessRate < 80 && totalLacReviews > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve LAC review timeliness to at least 80% — review the scheduling process with IROs, set up advance reminders, and ensure the home is proactive in confirming and preparing for reviews.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 22 — Contact between child and relevant agencies",
    });
  }

  if (socialWorkerVisitRate >= 50 && socialWorkerVisitRate < 80 && totalSWVisits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Work with placing authorities to improve social worker visit compliance — maintain a visit tracking schedule, raise overdue visits promptly, and document the home's efforts to facilitate timely visiting.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 22 — Contact between child and relevant agencies",
    });
  }

  if (therapeuticEngagementRate >= 40 && therapeuticEngagementRate < 70 && totalTherapeuticRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop strategies to improve therapeutic engagement — work with therapeutic providers to understand barriers, consider timing and transport arrangements, and ensure keyworkers actively support children in attending sessions.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (educationLiaisonRate >= 60 && educationLiaisonRate < 80 && totalEducationLiaisons > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve education liaison attendance to at least 80% — review scheduling, ensure staff are allocated to attend all education meetings, and establish a protocol for covering when the usual representative is unavailable.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  if (informationSharingRate >= 50 && informationSharingRate < 80 && totalInfoSharingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve the timeliness of inter-agency information sharing — establish clear internal deadlines for responding to information requests and sharing updates, and use a tracking system to ensure nothing is delayed.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (lacActionCompletionRate < 70 && lacActionsSet > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve completion of LAC review actions — implement an action tracker with assigned owners and deadlines, review progress at team meetings, and escalate any actions that are dependent on external agencies.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 22 — Contact between child and relevant agencies",
    });
  }

  if (therapeuticInfoSharedRate < 60 && totalTherapeuticRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen information sharing with therapeutic service providers — establish regular liaison arrangements, agree information-sharing protocols, and ensure consent is in place to enable appropriate sharing of therapeutic progress.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Quality of care",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: MultiAgencyInsight[] = [];

  // -- Critical insights --

  if (lacReviewTimelinessRate < 50 && totalLacReviews > 0) {
    insights.push({
      text: `Only ${lacReviewTimelinessRate}% of LAC reviews held on time. Delayed statutory reviews mean children's care plans are not being updated promptly, actions are not being tracked, and the placing authority may not have current oversight of the child's progress. This is a significant concern under CHR 2015 Reg 22 and will feature prominently in any Ofsted inspection.`,
      severity: "critical",
    });
  }

  if (socialWorkerVisitRate < 50 && totalSWVisits > 0) {
    insights.push({
      text: `Only ${socialWorkerVisitRate}% of social worker visits within statutory timescales. Children who are not seen regularly by their social worker may not have their needs identified, their views heard, or their safety assessed. This is a fundamental safeguarding requirement that the home must escalate as a priority.`,
      severity: "critical",
    });
  }

  if (therapeuticEngagementRate < 40 && totalTherapeuticRecords > 0) {
    insights.push({
      text: `Therapeutic engagement at only ${therapeuticEngagementRate}%. When children referred to therapeutic services are not engaging, their emotional and mental health needs are not being addressed. The home should work with placing authorities and therapeutic providers to understand and overcome barriers to engagement.`,
      severity: "critical",
    });
  }

  if (informationSharingRate < 50 && totalInfoSharingRecords > 0) {
    insights.push({
      text: `Only ${informationSharingRate}% of inter-agency information shared on time. Delayed information sharing can compromise safeguarding, delay care planning decisions, and undermine the effectiveness of multi-agency working. Ofsted will assess the quality and timeliness of information sharing under leadership and management.`,
      severity: "critical",
    });
  }

  if (childSeenAloneRate < 60 && totalSWVisits > 0) {
    insights.push({
      text: `Only ${childSeenAloneRate}% of children seen alone during social worker visits. Seeing children privately is a fundamental safeguarding practice — without it, children may not feel safe to disclose concerns. The home must ensure this practice is embedded and raise concerns where social workers are not seeing children alone.`,
      severity: "critical",
    });
  }

  if (totalTherapeuticRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No therapeutic service records despite children being on placement. Most looked-after children have experienced trauma and may need therapeutic support. The absence of any therapeutic referral or engagement records suggests a gap in understanding and meeting children's emotional and mental health needs.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (lacReviewTimelinessRate >= 50 && lacReviewTimelinessRate < 80 && totalLacReviews > 0) {
    insights.push({
      text: `LAC review timeliness at ${lacReviewTimelinessRate}% — improving but still below the expected standard. Consistent timeliness demonstrates to Ofsted that the home takes statutory oversight seriously and actively engages with the review process.`,
      severity: "warning",
    });
  }

  if (socialWorkerVisitRate >= 50 && socialWorkerVisitRate < 80 && totalSWVisits > 0) {
    insights.push({
      text: `Social worker visit compliance at ${socialWorkerVisitRate}% — some visits are delayed. The home should maintain a proactive approach, tracking visit schedules and escalating overdue visits promptly to placing authorities.`,
      severity: "warning",
    });
  }

  if (therapeuticEngagementRate >= 40 && therapeuticEngagementRate < 70 && totalTherapeuticRecords > 0) {
    insights.push({
      text: `Therapeutic engagement at ${therapeuticEngagementRate}% — while some children are engaging, others are not. Consider whether the type, timing, or location of therapeutic services could be adjusted to improve participation and outcomes.`,
      severity: "warning",
    });
  }

  if (educationLiaisonRate >= 60 && educationLiaisonRate < 80 && totalEducationLiaisons > 0) {
    insights.push({
      text: `Education liaison attendance at ${educationLiaisonRate}% — some education meetings are not attended by the home. Consistent attendance demonstrates commitment to children's education and enables effective advocacy for their needs.`,
      severity: "warning",
    });
  }

  if (informationSharingRate >= 50 && informationSharingRate < 80 && totalInfoSharingRecords > 0) {
    insights.push({
      text: `Information sharing timeliness at ${informationSharingRate}% — some communications are delayed. Timely information sharing is essential for effective multi-agency working and safeguarding. Ofsted inspectors will assess whether information flows efficiently between agencies.`,
      severity: "warning",
    });
  }

  if (pepUpToDateRate >= 50 && pepUpToDateRate < 70 && totalEducationLiaisons > 0) {
    insights.push({
      text: `PEP compliance at ${pepUpToDateRate}% — not all personal education plans are current. Up-to-date PEPs are essential for ensuring pupil premium is used effectively and educational support is tailored to each child's needs.`,
      severity: "warning",
    });
  }

  if (swConsistencyRate < 70 && totalSWVisits > 0) {
    insights.push({
      text: `Social worker consistency at ${swConsistencyRate}% — frequent changes of social worker can be destabilising for looked-after children who need consistent, trusting relationships. The home should advocate with placing authorities for continuity.`,
      severity: "warning",
    });
  }

  if (lacActionCompletionRate >= 50 && lacActionCompletionRate < 70 && lacActionsSet > 0) {
    insights.push({
      text: `LAC review action completion at ${lacActionCompletionRate}% — some actions from statutory reviews are not being completed. Incomplete actions may delay improvements to children's care and undermine the purpose of the review process.`,
      severity: "warning",
    });
  }

  if (followUpCompletionRate < 70 && followUpRequired > 0) {
    insights.push({
      text: `Information sharing follow-up completion at ${followUpCompletionRate}% — some required follow-ups are incomplete. This may lead to important information being lost or actions not being tracked through to completion.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (lacReviewTimelinessRate >= 95 && socialWorkerVisitRate >= 95 && totalLacReviews > 0 && totalSWVisits > 0) {
    insights.push({
      text: `LAC review timeliness at ${lacReviewTimelinessRate}% and social worker visit compliance at ${socialWorkerVisitRate}% — the home demonstrates outstanding partnership working with placing authorities, ensuring children receive the statutory oversight they are entitled to.`,
      severity: "positive",
    });
  }

  if (therapeuticEngagementRate >= 90 && therapeuticProgressRate >= 90 && totalTherapeuticRecords > 0) {
    insights.push({
      text: `${therapeuticEngagementRate}% therapeutic engagement with ${therapeuticProgressRate}% progress reporting — children are not only attending therapeutic services but making demonstrable progress, indicating effective collaboration between the home and therapeutic providers.`,
      severity: "positive",
    });
  }

  if (educationLiaisonRate >= 95 && pepUpToDateRate >= 95 && totalEducationLiaisons > 0) {
    insights.push({
      text: `Education liaison attendance at ${educationLiaisonRate}% with ${pepUpToDateRate}% PEPs up to date — the home is fully engaged with education providers, ensuring looked-after children receive the educational support and advocacy they need.`,
      severity: "positive",
    });
  }

  if (informationSharingRate >= 95 && gdprComplianceRate >= 95 && totalInfoSharingRecords > 0) {
    insights.push({
      text: `${informationSharingRate}% timely information sharing with ${gdprComplianceRate}% GDPR compliance — the home maintains exemplary inter-agency communication while upholding data protection standards, demonstrating strong governance and leadership.`,
      severity: "positive",
    });
  }

  if (uniqueAgencyCount >= 5 && homeInitiatedRate >= 70 && totalInfoSharingRecords > 0) {
    insights.push({
      text: `The home proactively shares information with ${uniqueAgencyCount} different agencies, initiating ${homeInitiatedRate}% of communications. This demonstrates strong multi-agency leadership and a culture of proactive partnership working that Ofsted will view favourably under their leadership and management judgment.`,
      severity: "positive",
    });
  }

  if (childSeenAloneRate >= 95 && lacChildViewsRate >= 95 && totalSWVisits > 0 && totalLacReviews > 0) {
    insights.push({
      text: `${childSeenAloneRate}% of children seen alone by their social worker and ${lacChildViewsRate}% of LAC reviews recording children's views — the home ensures children's voices are central to multi-agency decision-making.`,
      severity: "positive",
    });
  }

  // ── Build result ──────────────────────────────────────────────────────

  return {
    agency_rating,
    agency_score: score,
    headline,
    total_lac_reviews: totalLacReviews,
    total_sw_visits: totalSWVisits,
    total_therapeutic_records: totalTherapeuticRecords,
    total_education_liaisons: totalEducationLiaisons,
    total_info_sharing_records: totalInfoSharingRecords,
    lac_review_timeliness_rate: lacReviewTimelinessRate,
    social_worker_visit_rate: socialWorkerVisitRate,
    therapeutic_engagement_rate: therapeuticEngagementRate,
    education_liaison_rate: educationLiaisonRate,
    information_sharing_rate: informationSharingRate,
    multi_agency_meeting_rate: multiAgencyMeetingRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
