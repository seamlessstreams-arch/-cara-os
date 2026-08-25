// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME CHILD'S VOICE & PARTICIPATION INTELLIGENCE ENGINE
// Home-level: assesses how effectively children's voices are heard and
// their participation is enabled across the home. Tracks children's meeting
// attendance, consultation effectiveness, feedback acted upon, child council
// and house meeting engagement, and whether children feel heard.
// CHR 2015 Reg 7: "The children's views, wishes and feelings standard."
// CHR 2015 Reg 5: "Engaging with children — consultation and participation."
// Ofsted SCCIF: Voice of the child — children are listened to and their
// views shape the care they receive.
// Pure deterministic engine — no imports, no LLM, no external deps.
// Store keys: meetingAttendanceRecords, consultationRecords,
//             feedbackActionRecords, councilEngagementRecords,
//             feelingHeardRecords
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, meanOf, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface MeetingAttendanceRecordInput {
  id: string;
  child_id: string;
  date: string;
  meeting_type: "house_meeting" | "child_council" | "review" | "consultation" | "key_worker" | "other";
  attended: boolean;
  invited: boolean;
  contributed: boolean;
  chaired_by_child: boolean;
  minutes_recorded: boolean;
  actions_from_meeting: number;
  actions_completed: number;
  child_feedback_positive: boolean;
  duration_minutes: number;
  notes: string;
  created_at: string;
}

export interface ConsultationRecordInput {
  id: string;
  child_id: string;
  date: string;
  consultation_type: "individual" | "group" | "survey" | "suggestion_box" | "informal" | "formal" | "other";
  topic: string;
  child_engaged: boolean;
  child_views_recorded: boolean;
  views_shared_with_staff: boolean;
  outcome_communicated_to_child: boolean;
  child_satisfied_with_process: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  duration_minutes: number;
  facilitator: string;
  notes: string;
  created_at: string;
}

export interface FeedbackActionRecordInput {
  id: string;
  child_id: string;
  date: string;
  feedback_source: "child_direct" | "meeting" | "survey" | "key_worker" | "complaint" | "suggestion" | "advocate" | "other";
  feedback_category: "care" | "food" | "activities" | "environment" | "staff" | "rules" | "contact" | "education" | "health" | "other";
  feedback_received: boolean;
  acknowledged: boolean;
  action_planned: boolean;
  action_taken: boolean;
  outcome_communicated: boolean;
  child_satisfied_with_outcome: boolean;
  days_to_action: number;
  escalated: boolean;
  notes: string;
  created_at: string;
}

export interface CouncilEngagementRecordInput {
  id: string;
  child_id: string;
  date: string;
  council_type: "child_council" | "house_meeting" | "residents_meeting" | "young_people_forum" | "committee" | "other";
  role: "member" | "chair" | "secretary" | "observer" | "contributor" | "other";
  attended: boolean;
  contributed: boolean;
  agenda_item_raised: boolean;
  agenda_item_actioned: boolean;
  minutes_shared: boolean;
  child_felt_listened_to: boolean;
  decisions_influenced: number;
  notes: string;
  created_at: string;
}

export interface FeelingHeardRecordInput {
  id: string;
  child_id: string;
  date: string;
  assessment_method: "direct_question" | "survey" | "key_worker_session" | "advocate_visit" | "reg44_visit" | "ofsted_visit" | "other";
  feels_listened_to: boolean;
  feels_views_matter: boolean;
  feels_changes_happen: boolean;
  knows_how_to_complain: boolean;
  knows_advocate: boolean;
  overall_satisfaction: number; // 1-5
  specific_concern: string;
  concern_addressed: boolean;
  notes: string;
  created_at: string;
}

export interface ChildVoiceInput {
  today: string;
  total_children: number;
  meeting_attendance_records: MeetingAttendanceRecordInput[];
  consultation_records: ConsultationRecordInput[];
  feedback_action_records: FeedbackActionRecordInput[];
  council_engagement_records: CouncilEngagementRecordInput[];
  feeling_heard_records: FeelingHeardRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ChildVoiceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ChildVoiceInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface ChildVoiceRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface ChildVoiceResult {
  voice_rating: ChildVoiceRating;
  voice_score: number;
  headline: string;
  total_meeting_records: number;
  total_consultation_records: number;
  total_feedback_records: number;
  total_council_records: number;
  total_feeling_heard_records: number;
  /** null when the population is empty — nothing measured, not 0%. */
  meeting_attendance_rate: number | null;
  // Null when the underlying record collection is empty — "0% consultation /
  // 0% council engagement / 0% feeling heard / 0% satisfaction" reads as
  // "children were consulted / engaged / asked / rated and it all failed",
  // when in fact no data exists to measure. Same fab-0 doctrine as elsewhere.
  consultation_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  feedback_action_rate: number | null;
  council_engagement_rate: number | null;
  feeling_heard_rate: number | null;
  child_satisfaction_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: ChildVoiceRecommendation[];
  insights: ChildVoiceInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): ChildVoiceRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: ChildVoiceRating,
  score: number,
  headline: string,
): ChildVoiceResult {
  return {
    voice_rating: rating,
    voice_score: score,
    headline,
    total_meeting_records: 0,
    total_consultation_records: 0,
    total_feedback_records: 0,
    total_council_records: 0,
    total_feeling_heard_records: 0,
    meeting_attendance_rate: null,
    consultation_rate: null,
    feedback_action_rate: null,
    council_engagement_rate: null,
    feeling_heard_rate: null,
    child_satisfaction_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeChildVoiceParticipation(
  input: ChildVoiceInput,
): ChildVoiceResult {
  const {
    total_children,
    meeting_attendance_records,
    consultation_records,
    feedback_action_records,
    council_engagement_records,
    feeling_heard_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    meeting_attendance_records.length === 0 &&
    consultation_records.length === 0 &&
    feedback_action_records.length === 0 &&
    council_engagement_records.length === 0 &&
    feeling_heard_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess child voice and participation.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No child voice or participation data recorded despite children on placement — children's views, consultation, and participation require urgent attention.",
      ),
      concerns: [
        "No meeting attendance, consultation, feedback, council engagement, or feeling heard records exist despite children being on placement — the home cannot evidence that children's voices are heard or that they participate in decisions affecting their care.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of children's meeting attendance, consultations, feedback, council engagement, and feeling heard assessments to evidence that children's views shape the care they receive.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
        },
        {
          rank: 2,
          recommendation:
            "Establish regular children's meetings, a child council or house meeting, and individual consultation processes so every child has meaningful opportunities to express their views and influence decisions.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engaging, consulting and communicating",
        },
      ],
      insights: [
        {
          text: "The complete absence of child voice and participation records means the home cannot demonstrate compliance with Reg 7 (children's views) or Reg 5 (engaging and consulting). Ofsted will expect robust evidence that children are listened to, consulted, and that their views influence the care they receive. This is a critical gap.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Meeting attendance metrics ---
  const totalMeetingRecords = meeting_attendance_records.length;
  const invitedToMeeting = meeting_attendance_records.filter((m) => m.invited).length;
  const attendedMeeting = meeting_attendance_records.filter((m) => m.attended).length;
  const meetingAttendanceRate = rate(attendedMeeting, invitedToMeeting > 0 ? invitedToMeeting : totalMeetingRecords);

  const contributedInMeeting = meeting_attendance_records.filter((m) => m.attended && m.contributed).length;
  const meetingContributionRate = rate(contributedInMeeting, attendedMeeting);

  const chairedByChild = meeting_attendance_records.filter((m) => m.chaired_by_child).length;
  const childChairRate = rate(chairedByChild, totalMeetingRecords);

  const minutesRecorded = meeting_attendance_records.filter((m) => m.minutes_recorded).length;
  const minutesRecordedRate = rate(minutesRecorded, totalMeetingRecords);

  const totalMeetingActions = meeting_attendance_records.reduce(
    (sum, m) => sum + m.actions_from_meeting,
    0,
  );
  const totalMeetingActionsCompleted = meeting_attendance_records.reduce(
    (sum, m) => sum + m.actions_completed,
    0,
  );
  const meetingActionCompletionRate = rate(totalMeetingActionsCompleted, totalMeetingActions);

  const positiveMeetingFeedback = meeting_attendance_records.filter(
    (m) => m.attended && m.child_feedback_positive,
  ).length;

  const uniqueChildrenInMeetings = new Set(
    meeting_attendance_records.filter((m) => m.attended).map((m) => m.child_id),
  ).size;
  const meetingChildCoverage = total_children > 0 ? rate(uniqueChildrenInMeetings, total_children) : 0;

  // --- Consultation metrics ---
  const totalConsultationRecords = consultation_records.length;
  const engagedConsultations = consultation_records.filter((c) => c.child_engaged).length;
  const consultationEngagementRate = rate(engagedConsultations, totalConsultationRecords);

  const viewsRecorded = consultation_records.filter((c) => c.child_views_recorded).length;
  const viewsRecordedRate = rate(viewsRecorded, totalConsultationRecords);

  const outcomeCommunicated = consultation_records.filter(
    (c) => c.outcome_communicated_to_child,
  ).length;
  const outcomeCommunicatedRate = rate(outcomeCommunicated, totalConsultationRecords);

  const satisfiedWithProcess = consultation_records.filter(
    (c) => c.child_satisfied_with_process,
  ).length;
  const consultationSatisfactionRate = rate(satisfiedWithProcess, totalConsultationRecords);

  const followUpRequired = consultation_records.filter((c) => c.follow_up_required).length;
  const followUpCompleted = consultation_records.filter(
    (c) => c.follow_up_required && c.follow_up_completed,
  ).length;
  const followUpCompletionRate = rate(followUpCompleted, followUpRequired);

  // Composite consultation rate: engagement + views recorded + outcome communicated.
  // Null on empty — no consultations ⇒ nothing to measure engagement across.
  const consultationRate: number | null =
    totalConsultationRecords > 0 ? Math.round(
          (consultationEngagementRate! + viewsRecordedRate! + outcomeCommunicatedRate!) / 3) : null;

  // --- Feedback action metrics ---
  const totalFeedbackRecords = feedback_action_records.length;
  const feedbackReceived = feedback_action_records.filter((f) => f.feedback_received).length;
  const feedbackAcknowledged = feedback_action_records.filter(
    (f) => f.feedback_received && f.acknowledged,
  ).length;
  const feedbackAcknowledgedRate = rate(feedbackAcknowledged, feedbackReceived);

  const actionTaken = feedback_action_records.filter(
    (f) => f.feedback_received && f.action_taken,
  ).length;
  const feedbackActionRate = rate(actionTaken, feedbackReceived);

  const outcomeCommunicatedFeedback = feedback_action_records.filter(
    (f) => f.feedback_received && f.outcome_communicated,
  ).length;
  const feedbackOutcomeCommunicatedRate = rate(outcomeCommunicatedFeedback, feedbackReceived);

  const childSatisfiedWithOutcome = feedback_action_records.filter(
    (f) => f.feedback_received && f.child_satisfied_with_outcome,
  ).length;

  // Null on empty — no actions taken ⇒ no delay to report.
  const avgDaysToAction: number | null =
    actionTaken > 0
      ? Math.round(
          feedback_action_records
            .filter((f) => f.feedback_received && f.action_taken)
            .reduce((sum, f) => sum + f.days_to_action, 0) / actionTaken,
        )
      : null;

  // --- Council engagement metrics ---
  const totalCouncilRecords = council_engagement_records.length;
  const attendedCouncil = council_engagement_records.filter((c) => c.attended).length;
  const councilAttendanceRate = rate(attendedCouncil, totalCouncilRecords);

  const contributedCouncil = council_engagement_records.filter(
    (c) => c.attended && c.contributed,
  ).length;
  const councilContributionRate = rate(contributedCouncil, attendedCouncil);

  const feltListenedTo = council_engagement_records.filter(
    (c) => c.attended && c.child_felt_listened_to,
  ).length;
  const councilFeltListenedRate = rate(feltListenedTo, attendedCouncil);

  const totalDecisionsInfluenced = council_engagement_records.reduce(
    (sum, c) => sum + c.decisions_influenced,
    0,
  );

  // Composite council engagement rate — null on empty (no council meetings ⇒ nothing to engage with).
  // Mean of what is measured: contribution/felt-listened only exist for attended
  // sessions, so an unattended term no longer drags the composite with phantom 0s.
  const councilEngagementRate: number | null = meanOf([
    councilAttendanceRate,
    councilContributionRate,
    councilFeltListenedRate,
  ]);

  // Leadership roles
  const leadershipRoles = council_engagement_records.filter(
    (c) => c.role === "chair" || c.role === "secretary",
  ).length;
  const leadershipRate = rate(leadershipRoles, totalCouncilRecords);

  // --- Feeling heard metrics ---
  const totalFeelingHeardRecords = feeling_heard_records.length;
  const feelsListenedTo = feeling_heard_records.filter((f) => f.feels_listened_to).length;
  const feelsListenedToRate = rate(feelsListenedTo, totalFeelingHeardRecords);

  const feelsViewsMatter = feeling_heard_records.filter((f) => f.feels_views_matter).length;
  const feelsViewsMatterRate = rate(feelsViewsMatter, totalFeelingHeardRecords);

  const feelsChangesHappen = feeling_heard_records.filter((f) => f.feels_changes_happen).length;
  const feelsChangesHappenRate = rate(feelsChangesHappen, totalFeelingHeardRecords);

  const knowsHowToComplain = feeling_heard_records.filter((f) => f.knows_how_to_complain).length;
  const knowsComplainRate = rate(knowsHowToComplain, totalFeelingHeardRecords);

  const knowsAdvocate = feeling_heard_records.filter((f) => f.knows_advocate).length;
  const knowsAdvocateRate = rate(knowsAdvocate, totalFeelingHeardRecords);

  // Null on empty — no feeling-heard records ⇒ no satisfaction to average.
  const avgSatisfaction: number | null =
    totalFeelingHeardRecords > 0
      ? Math.round(
          (feeling_heard_records.reduce((sum, f) => sum + f.overall_satisfaction, 0) /
            totalFeelingHeardRecords) *
            100,
        ) / 100
      : null;

  const specificConcerns = feeling_heard_records.filter(
    (f) => f.specific_concern && f.specific_concern.length > 0,
  ).length;
  const concernsAddressed = feeling_heard_records.filter(
    (f) => f.specific_concern && f.specific_concern.length > 0 && f.concern_addressed,
  ).length;
  const concernAddressedRate = rate(concernsAddressed, specificConcerns);

  // Composite feeling heard rate — null on empty (no feeling-heard records ⇒ nothing to score).
  const feelingHeardRate: number | null =
    totalFeelingHeardRecords > 0 ? Math.round(
          (feelsListenedToRate! + feelsViewsMatterRate! + feelsChangesHappenRate!) / 3) : null;

  // --- Child satisfaction composite ---
  // Across meeting feedback, consultation satisfaction, feedback satisfaction, council felt listened, feeling heard
  const satisfactionNumerators: number[] = [];
  const satisfactionDenominators: number[] = [];

  if (attendedMeeting > 0) {
    satisfactionNumerators.push(positiveMeetingFeedback);
    satisfactionDenominators.push(attendedMeeting);
  }
  if (totalConsultationRecords > 0) {
    satisfactionNumerators.push(satisfiedWithProcess);
    satisfactionDenominators.push(totalConsultationRecords);
  }
  if (feedbackReceived > 0) {
    satisfactionNumerators.push(childSatisfiedWithOutcome);
    satisfactionDenominators.push(feedbackReceived);
  }
  if (attendedCouncil > 0) {
    satisfactionNumerators.push(feltListenedTo);
    satisfactionDenominators.push(attendedCouncil);
  }
  if (totalFeelingHeardRecords > 0) {
    satisfactionNumerators.push(feelsListenedTo);
    satisfactionDenominators.push(totalFeelingHeardRecords);
  }

  const totalSatisNum = satisfactionNumerators.reduce((a, b) => a + b, 0);
  const totalSatisDenom = satisfactionDenominators.reduce((a, b) => a + b, 0);
  const childSatisfactionRate = rate(totalSatisNum, totalSatisDenom);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: meetingAttendanceRate (>=90: +4, >=70: +2) ---
  if (meets(meetingAttendanceRate, 90)) score += 4;
  else if (meets(meetingAttendanceRate, 70)) score += 2;

  // --- Bonus 2: consultationRate (>=90: +4, >=70: +2) ---
  if (meets(consultationRate, 90)) score += 4;
  else if (meets(consultationRate, 70)) score += 2;

  // --- Bonus 3: feedbackActionRate (>=90: +4, >=70: +2) ---
  if (meets(feedbackActionRate, 90)) score += 4;
  else if (meets(feedbackActionRate, 70)) score += 2;

  // --- Bonus 4: councilEngagementRate (>=90: +3, >=70: +1) ---
  if (meets(councilEngagementRate, 90)) score += 3;
  else if (meets(councilEngagementRate, 70)) score += 1;

  // --- Bonus 5: feelingHeardRate (>=90: +4, >=70: +2) ---
  if (meets(feelingHeardRate, 90)) score += 4;
  else if (meets(feelingHeardRate, 70)) score += 2;

  // --- Bonus 6: childSatisfactionRate (>=90: +3, >=70: +1) ---
  if (meets(childSatisfactionRate, 90)) score += 3;
  else if (meets(childSatisfactionRate, 70)) score += 1;

  // --- Bonus 7: meetingActionCompletionRate (>=90: +3, >=70: +1) ---
  if (meets(meetingActionCompletionRate, 90)) score += 3;
  else if (meets(meetingActionCompletionRate, 70)) score += 1;

  // --- Bonus 8: concernAddressedRate (>=90: +3, >=70: +1) ---
  if (meets(concernAddressedRate, 90)) score += 3;
  else if (meets(concernAddressedRate, 70)) score += 1;

  // max bonuses = 4+4+4+3+4+3+3+3 = 28

  // ── Penalties ─────────────────────────────────────────────────────────

  // meetingAttendanceRate < 40 → -5 (guarded)
  if (below(meetingAttendanceRate, 40) && meeting_attendance_records.length > 0) score -= 5;

  // feedbackActionRate < 40 → -5 (guarded)
  if (below(feedbackActionRate, 40) && feedback_action_records.length > 0) score -= 5;

  // below(feelingHeardRate, 40) → -5 (guarded)
  if (below(feelingHeardRate, 40) && feeling_heard_records.length > 0) score -= 5;

  // below(councilEngagementRate, 30) → -3 (guarded)
  if (below(councilEngagementRate, 30) && council_engagement_records.length > 0) score -= 3;

  score = clamp(score, 0, 100);

  const voice_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(meetingAttendanceRate, 90) && totalMeetingRecords > 0) {
    strengths.push(
      `${meetingAttendanceRate}% meeting attendance rate — children consistently attend and engage with meetings, demonstrating that the home creates a culture where children's participation is valued and expected.`,
    );
  } else if (meets(meetingAttendanceRate, 70) && totalMeetingRecords > 0) {
    strengths.push(
      `${meetingAttendanceRate}% meeting attendance — good levels of children attending meetings, indicating children feel their attendance matters and that meetings are accessible.`,
    );
  }

  if (meets(consultationRate, 90) && totalConsultationRecords > 0) {
    strengths.push(
      `${consultationRate}% consultation effectiveness — children are actively engaged in consultations, their views are recorded, and outcomes are communicated back to them. This demonstrates exemplary practice in seeking and acting on children's views.`,
    );
  } else if (meets(consultationRate, 70) && totalConsultationRecords > 0) {
    strengths.push(
      `${consultationRate}% consultation effectiveness rate — good practice in consulting children, recording their views, and communicating outcomes back to them.`,
    );
  }

  if (meets(feedbackActionRate, 90) && feedbackReceived > 0) {
    strengths.push(
      `${feedbackActionRate}% of children's feedback acted upon — the home demonstrates outstanding responsiveness to children's views, taking action on virtually all feedback received. Children can see that speaking up leads to real change.`,
    );
  } else if (meets(feedbackActionRate, 70) && feedbackReceived > 0) {
    strengths.push(
      `${feedbackActionRate}% of feedback acted upon — good evidence that children's feedback leads to action, reinforcing the value of sharing their views.`,
    );
  }

  if (meets(councilEngagementRate, 90) && totalCouncilRecords > 0) {
    strengths.push(
      `${councilEngagementRate}% council engagement rate — children actively attend, contribute to, and feel listened to in council and house meetings. The child council is a genuine forum for children's participation in decision-making.`,
    );
  } else if (meets(councilEngagementRate, 70) && totalCouncilRecords > 0) {
    strengths.push(
      `${councilEngagementRate}% council engagement — good levels of attendance, contribution, and children feeling listened to in council and house meetings.`,
    );
  }

  if (meets(feelingHeardRate, 90) && totalFeelingHeardRecords > 0) {
    strengths.push(
      `${feelingHeardRate}% of children feel heard — children overwhelmingly report feeling listened to, that their views matter, and that changes happen as a result. This is the gold standard for Reg 7 compliance.`,
    );
  } else if (meets(feelingHeardRate, 70) && totalFeelingHeardRecords > 0) {
    strengths.push(
      `${feelingHeardRate}% feeling heard rate — the majority of children feel listened to, believe their views matter, and see changes happen as a result of speaking up.`,
    );
  }

  if (meets(childSatisfactionRate, 90) && totalSatisDenom > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction across voice and participation activities — children are consistently positive about how their views are sought, heard, and acted upon.`,
    );
  } else if (meets(childSatisfactionRate, 70) && totalSatisDenom > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction rate — children generally feel positive about how the home listens to and responds to their views.`,
    );
  }

  if (meets(meetingActionCompletionRate, 90) && totalMeetingActions > 0) {
    strengths.push(
      `${meetingActionCompletionRate}% of meeting actions completed — the home follows through on commitments made in children's meetings, demonstrating that meetings lead to tangible outcomes.`,
    );
  } else if (meets(meetingActionCompletionRate, 70) && totalMeetingActions > 0) {
    strengths.push(
      `${meetingActionCompletionRate}% meeting action completion — good follow-through on actions arising from children's meetings.`,
    );
  }

  if (meets(meetingContributionRate, 90) && attendedMeeting > 0) {
    strengths.push(
      `${meetingContributionRate}% of children who attend meetings actively contribute — meetings are structured to enable genuine participation, not passive attendance.`,
    );
  } else if (meets(meetingContributionRate, 70) && attendedMeeting > 0) {
    strengths.push(
      `${meetingContributionRate}% meeting contribution rate — the majority of attending children actively contribute to discussions.`,
    );
  }

  if (meets(concernAddressedRate, 90) && specificConcerns > 0) {
    strengths.push(
      `${concernAddressedRate}% of specific concerns raised by children have been addressed — the home demonstrates exceptional responsiveness to individual children's worries and issues.`,
    );
  } else if (meets(concernAddressedRate, 70) && specificConcerns > 0) {
    strengths.push(
      `${concernAddressedRate}% of children's specific concerns addressed — good evidence that the home responds to individual children's worries.`,
    );
  }

  if (meets(followUpCompletionRate, 90) && followUpRequired > 0) {
    strengths.push(
      `${followUpCompletionRate}% of consultation follow-ups completed — the home consistently follows through after consulting children, closing the feedback loop.`,
    );
  }

  if (meets(childChairRate, 30) && totalMeetingRecords > 0) {
    strengths.push(
      `${childChairRate}% of meetings chaired by children — children are given real leadership opportunities in meetings, promoting agency and ownership of the participation process.`,
    );
  }

  if (meets(leadershipRate, 20) && totalCouncilRecords > 0) {
    strengths.push(
      `${leadershipRate}% of council records involve children in leadership roles (chair/secretary) — the home actively develops children's leadership skills through participation structures.`,
    );
  }

  if (meets(knowsComplainRate, 90) && totalFeelingHeardRecords > 0) {
    strengths.push(
      `${knowsComplainRate}% of children know how to make a complaint — children are well-informed about their rights and the complaints process, supporting Reg 7 compliance.`,
    );
  }

  if (meets(knowsAdvocateRate, 90) && totalFeelingHeardRecords > 0) {
    strengths.push(
      `${knowsAdvocateRate}% of children know their advocate — strong awareness of independent advocacy supports children's ability to have their voice heard outside the home.`,
    );
  }

  if (meets(meetingChildCoverage, 100) && total_children > 0) {
    strengths.push(
      "Every child has attended at least one meeting — participation is genuinely inclusive and no child is left without a voice in the home's decision-making.",
    );
  } else if (meets(meetingChildCoverage, 80) && total_children > 0) {
    strengths.push(
      `${meetingChildCoverage}% of children have attended meetings — strong coverage ensuring most children have opportunities to participate.`,
    );
  }

  if (meets(avgSatisfaction, 4.0) && totalFeelingHeardRecords > 0) {
    strengths.push(
      `Children's overall satisfaction with voice and participation averages ${avgSatisfaction}/5 — children feel genuinely valued, listened to, and empowered.`,
    );
  } else if (meets(avgSatisfaction, 3.5) && totalFeelingHeardRecords > 0) {
    strengths.push(
      `Children's overall satisfaction with being heard averages ${avgSatisfaction}/5 — positive overall experience of voice and participation.`,
    );
  }

  if (totalDecisionsInfluenced > 0 && totalCouncilRecords > 0) {
    strengths.push(
      `Children have influenced ${totalDecisionsInfluenced} decision${totalDecisionsInfluenced !== 1 ? "s" : ""} through council engagement — demonstrating that children's participation leads to real impact on the life of the home.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(meetingAttendanceRate, 40) && totalMeetingRecords > 0) {
    concerns.push(
      `Only ${meetingAttendanceRate}% meeting attendance — the majority of children are not attending meetings, indicating significant barriers to participation or a lack of engagement with the meeting process.`,
    );
  } else if (meets(meetingAttendanceRate, 40) && below(meetingAttendanceRate, 70) && totalMeetingRecords > 0) {
    concerns.push(
      `Meeting attendance at ${meetingAttendanceRate}% — not all children are attending meetings, suggesting some barriers or lack of motivation to participate.`,
    );
  }

  if (below(consultationRate, 40) && totalConsultationRecords > 0) {
    concerns.push(
      `Consultation effectiveness at only ${consultationRate}% — consultations are not effectively engaging children, recording their views, or communicating outcomes. The consultation process requires fundamental review.`,
    );
  } else if (meets(consultationRate, 40) && below(consultationRate, 70) && totalConsultationRecords > 0) {
    concerns.push(
      `Consultation effectiveness at ${consultationRate}% — gaps exist in engagement, recording of views, or communication of outcomes to children.`,
    );
  }

  if (below(feedbackActionRate, 40) && feedbackReceived > 0) {
    concerns.push(
      `Only ${feedbackActionRate}% of children's feedback is acted upon — the home is failing to respond to children's views, which undermines children's trust in the participation process and breaches the principle that children's voices should lead to change.`,
    );
  } else if (meets(feedbackActionRate, 40) && below(feedbackActionRate, 70) && feedbackReceived > 0) {
    concerns.push(
      `Feedback action rate at ${feedbackActionRate}% — not all children's feedback is being acted upon, risking children feeling their views do not matter.`,
    );
  }

  if (below(councilEngagementRate, 30) && totalCouncilRecords > 0) {
    concerns.push(
      `Council engagement at only ${councilEngagementRate}% — the child council or house meeting is not functioning as an effective forum for children's participation. Children are not attending, contributing, or feeling listened to in these forums.`,
    );
  } else if (meets(councilEngagementRate, 30) && below(councilEngagementRate, 70) && totalCouncilRecords > 0) {
    concerns.push(
      `Council engagement at ${councilEngagementRate}% — not all children are actively engaged in council or house meetings. The forum may not feel accessible or meaningful to all children.`,
    );
  }

  if (below(feelingHeardRate, 40) && totalFeelingHeardRecords > 0) {
    concerns.push(
      `Only ${feelingHeardRate}% of children feel heard — the majority of children do not feel listened to, do not believe their views matter, or do not see changes happen as a result of speaking up. This is a critical failure under Reg 7.`,
    );
  } else if (meets(feelingHeardRate, 40) && below(feelingHeardRate, 70) && totalFeelingHeardRecords > 0) {
    concerns.push(
      `Feeling heard rate at ${feelingHeardRate}% — a significant minority of children do not feel adequately listened to or do not see their views leading to change.`,
    );
  }

  if (below(childSatisfactionRate, 40) && totalSatisDenom > 0) {
    concerns.push(
      `Child satisfaction with voice and participation at only ${childSatisfactionRate}% — children are not positive about how their views are sought and responded to across the home's participation activities.`,
    );
  } else if (meets(childSatisfactionRate, 40) && below(childSatisfactionRate, 70) && totalSatisDenom > 0) {
    concerns.push(
      `Child satisfaction at ${childSatisfactionRate}% — some children are not satisfied with how the home listens to and responds to their views.`,
    );
  }

  if (below(meetingActionCompletionRate, 50) && totalMeetingActions > 0) {
    concerns.push(
      `Only ${meetingActionCompletionRate}% of meeting actions completed — the home is not following through on commitments made in children's meetings, undermining the purpose and credibility of the meeting process.`,
    );
  } else if (meets(meetingActionCompletionRate, 50) && below(meetingActionCompletionRate, 70) && totalMeetingActions > 0) {
    concerns.push(
      `Meeting action completion at ${meetingActionCompletionRate}% — some actions from children's meetings are not being completed, which may erode children's trust in the process.`,
    );
  }

  if (below(feedbackAcknowledgedRate, 50) && feedbackReceived > 0) {
    concerns.push(
      `Only ${feedbackAcknowledgedRate}% of children's feedback acknowledged — failure to acknowledge receipt of feedback signals to children that their views are not valued.`,
    );
  }

  if (below(feedbackOutcomeCommunicatedRate, 50) && feedbackReceived > 0) {
    concerns.push(
      `Only ${feedbackOutcomeCommunicatedRate}% of feedback outcomes communicated back to children — without closing the loop, children cannot see that their feedback makes a difference.`,
    );
  }

  if (above(avgDaysToAction, 14) && actionTaken > 0) {
    concerns.push(
      `Average ${avgDaysToAction} days to act on children's feedback — delays in responding to feedback undermine children's confidence that their views lead to timely change.`,
    );
  }

  if (below(concernAddressedRate, 50) && specificConcerns > 0) {
    concerns.push(
      `Only ${concernAddressedRate}% of children's specific concerns have been addressed — individual children's worries and issues are not being resolved, which directly impacts their sense of being heard and cared for.`,
    );
  }

  if (below(knowsComplainRate, 50) && totalFeelingHeardRecords > 0) {
    concerns.push(
      `Only ${knowsComplainRate}% of children know how to make a complaint — children must be informed of their right to complain and how to do so (Reg 7).`,
    );
  }

  if (below(knowsAdvocateRate, 50) && totalFeelingHeardRecords > 0) {
    concerns.push(
      `Only ${knowsAdvocateRate}% of children know their advocate — children should know how to access independent advocacy support.`,
    );
  }

  if (below(meetingChildCoverage, 50) && total_children > 0 && totalMeetingRecords > 0) {
    concerns.push(
      `Only ${meetingChildCoverage}% of children have attended any meeting — many children are not accessing participation opportunities, suggesting exclusion or disengagement.`,
    );
  }

  if (below(followUpCompletionRate, 50) && followUpRequired > 0) {
    concerns.push(
      `Only ${followUpCompletionRate}% of consultation follow-ups completed — the home is not following through after consulting children, breaking the consultation-action cycle.`,
    );
  }

  if (totalConsultationRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No consultation records despite children being on placement — the home cannot evidence that it actively consults children about their care, wishes, and feelings.",
    );
  }

  if (totalFeelingHeardRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No feeling heard assessments recorded — the home cannot evidence that it monitors whether children feel listened to and that their views make a difference.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: ChildVoiceRecommendation[] = [];
  let rank = 0;

  if (below(meetingAttendanceRate, 40) && totalMeetingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review barriers to children's meeting attendance — consider timing, format, accessibility, and whether children understand the purpose and value of meetings. Involve children in redesigning the meeting structure to make it meaningful and accessible.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (below(feedbackActionRate, 40) && feedbackReceived > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a robust feedback-to-action process — every piece of feedback from a child must be acknowledged, an action plan created, the action completed in a timely manner, and the outcome communicated back to the child. This is fundamental to demonstrating that children's voices lead to change.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (below(feelingHeardRate, 40) && totalFeelingHeardRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently investigate why children do not feel heard — conduct individual sessions with each child to understand barriers, and develop an action plan to rebuild trust in the home's participation processes. Children must believe their views matter and lead to change.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (below(councilEngagementRate, 30) && totalCouncilRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and restructure the child council or house meeting format — ensure it is genuinely child-led, that children set the agenda, that their contributions are valued, and that they can see the impact of their participation on decisions affecting the home.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, consulting and communicating",
    });
  }

  if (below(consultationRate, 40) && totalConsultationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Redesign the consultation process to ensure children are genuinely engaged, their views are accurately recorded, and outcomes are always communicated back to the child. Consultations must be meaningful, not tokenistic.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, consulting and communicating",
    });
  }

  if (totalConsultationRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a structured consultation process — implement regular individual and group consultations with children about all aspects of their care, ensuring views are recorded, shared with staff, and outcomes communicated back to each child.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, consulting and communicating",
    });
  }

  if (totalFeelingHeardRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin regular feeling heard assessments with each child — use a mix of direct questions, surveys, key worker sessions, and independent visitor/advocate feedback to build a picture of whether children genuinely feel listened to and empowered.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (below(knowsComplainRate, 50) && totalFeelingHeardRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child knows how to make a complaint — provide age-appropriate information about the complaints process, revisit it regularly, and confirm understanding. This is a Reg 7 requirement.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (below(knowsAdvocateRate, 50) && totalFeelingHeardRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child knows their advocate and how to access independent advocacy — independent advocacy is a fundamental safeguard for children's voice and must be actively promoted.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (below(meetingActionCompletionRate, 50) && totalMeetingActions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a meeting action tracker with assigned owners, deadlines, and child-friendly updates — children must see that actions from their meetings are completed, or the meeting process loses credibility.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (below(feedbackOutcomeCommunicatedRate, 50) && feedbackReceived > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Close the feedback loop with every child — ensure that when feedback is received and acted upon, the outcome is always communicated back to the child in a way they understand. Children need to see the impact of their voice.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (above(avgDaysToAction, 14) && actionTaken > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reduce the time taken to act on children's feedback — set a target of 7 days for acknowledgement and action planning, with completion tracked and reported. Timely response demonstrates that children's views are a priority.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (
    meets(meetingAttendanceRate, 40) &&
    below(meetingAttendanceRate, 70) &&
    totalMeetingRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve meeting attendance by reviewing format, timing, and accessibility — seek children's views on how meetings could be more engaging and relevant to their interests.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (
    meets(feedbackActionRate, 40) &&
    below(feedbackActionRate, 70) &&
    feedbackReceived > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen the feedback-to-action process to ensure more feedback leads to concrete change — review cases where feedback was not acted upon and identify systemic barriers.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (
    meets(feelingHeardRate, 40) &&
    below(feelingHeardRate, 70) &&
    totalFeelingHeardRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop targeted strategies for children who do not feel heard — work individually with children to understand what would help them feel more listened to and what changes they want to see.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (
    meets(councilEngagementRate, 30) &&
    below(councilEngagementRate, 70) &&
    totalCouncilRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop the child council to increase engagement — consider rotating chair roles, using creative formats, linking to activities children enjoy, and visibly celebrating outcomes that result from council discussions.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, consulting and communicating",
    });
  }

  if (
    meets(consultationRate, 40) &&
    below(consultationRate, 70) &&
    totalConsultationRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve consultation effectiveness by ensuring all three elements are consistently met: child engagement, accurate recording of views, and communication of outcomes. Review gaps and provide staff with guidance on effective consultation.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging, consulting and communicating",
    });
  }

  if (
    below(meetingChildCoverage, 80) &&
    meets(meetingChildCoverage, 50) &&
    total_children > 0 &&
    totalMeetingRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend meeting participation to reach all children — identify children who have not yet attended and explore alternative participation methods that suit their preferences and communication needs.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (
    meets(concernAddressedRate, 50) &&
    below(concernAddressedRate, 70) &&
    specificConcerns > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the rate at which children's specific concerns are addressed — ensure each concern has an allocated responder, a timeline for resolution, and that the child is updated throughout.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: ChildVoiceInsight[] = [];

  // -- Critical insights --

  if (below(meetingAttendanceRate, 40) && totalMeetingRecords > 0) {
    insights.push({
      text: `Only ${meetingAttendanceRate}% meeting attendance. Low attendance at children's meetings indicates that the home's participation structures are not working — children may not see the point of meetings, feel unsafe to speak, or face practical barriers. Ofsted will look for evidence that meetings are meaningful and well-attended.`,
      severity: "critical",
    });
  }

  if (below(feedbackActionRate, 40) && feedbackReceived > 0) {
    insights.push({
      text: `Only ${feedbackActionRate}% of children's feedback acted upon. When children share their views and nothing changes, they learn that speaking up is pointless. This fundamentally undermines the voice of the child and creates a culture where children disengage from participation. Reg 7 requires that children's views shape the care they receive.`,
      severity: "critical",
    });
  }

  if (below(feelingHeardRate, 40) && totalFeelingHeardRecords > 0) {
    insights.push({
      text: `Only ${feelingHeardRate}% of children feel heard. This is the most direct measure of voice and participation effectiveness — if children themselves report not feeling heard, all other participation activities are failing in their purpose. This requires urgent and fundamental review of how the home listens to and acts on children's views.`,
      severity: "critical",
    });
  }

  if (below(councilEngagementRate, 30) && totalCouncilRecords > 0) {
    insights.push({
      text: `Council engagement at only ${councilEngagementRate}%. The child council or house meeting is not functioning as an effective participation forum — children are not attending, not contributing, or not feeling listened to. The council should be the centrepiece of children's democratic participation in the home.`,
      severity: "critical",
    });
  }

  if (totalConsultationRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No consultation records exist despite children being on placement. Without evidence of structured consultation, the home cannot demonstrate that it actively seeks children's views about their care. Reg 5 requires the registered person to engage and consult children. This is a significant regulatory gap.",
      severity: "critical",
    });
  }

  if (totalFeelingHeardRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No feeling heard assessments have been recorded. Without directly asking children whether they feel listened to, the home is relying on assumptions rather than evidence. Ofsted will want to see that the home actively monitors children's experience of being heard and acts on the findings.",
      severity: "critical",
    });
  }

  if (below(knowsComplainRate, 50) && totalFeelingHeardRecords > 0) {
    insights.push({
      text: `Only ${knowsComplainRate}% of children know how to make a complaint. This is a specific Reg 7 requirement — every child must understand their right to complain and know the process. Without this knowledge, children cannot effectively use complaints as a voice mechanism.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(meetingAttendanceRate, 40) &&
    below(meetingAttendanceRate, 70) &&
    totalMeetingRecords > 0
  ) {
    insights.push({
      text: `Meeting attendance at ${meetingAttendanceRate}% — while some children attend, a significant proportion do not. Review whether meetings are held at accessible times, in child-friendly formats, and whether children feel their attendance makes a difference.`,
      severity: "warning",
    });
  }

  if (
    meets(consultationRate, 40) &&
    below(consultationRate, 70) &&
    totalConsultationRecords > 0
  ) {
    insights.push({
      text: `Consultation effectiveness at ${consultationRate}% — the consultation process is partially effective but gaps in engagement, recording, or communication of outcomes mean some children's views are not being fully captured or acted upon.`,
      severity: "warning",
    });
  }

  if (
    meets(feedbackActionRate, 40) &&
    below(feedbackActionRate, 70) &&
    feedbackReceived > 0
  ) {
    insights.push({
      text: `Feedback action rate at ${feedbackActionRate}% — while some feedback is being acted upon, a significant proportion is not. This risks creating an inconsistent experience where some children see their views leading to change while others do not.`,
      severity: "warning",
    });
  }

  if (
    meets(councilEngagementRate, 30) &&
    below(councilEngagementRate, 70) &&
    totalCouncilRecords > 0
  ) {
    insights.push({
      text: `Council engagement at ${councilEngagementRate}% — the child council has some positive participation but is not yet fully effective. Consider whether the format, frequency, and follow-through on council decisions could be improved.`,
      severity: "warning",
    });
  }

  if (
    meets(feelingHeardRate, 40) &&
    below(feelingHeardRate, 70) &&
    totalFeelingHeardRecords > 0
  ) {
    insights.push({
      text: `Feeling heard rate at ${feelingHeardRate}% — while some children feel heard, a significant minority do not. This suggests the home's participation efforts are reaching some children but not all. Individual work with children who do not feel heard is essential.`,
      severity: "warning",
    });
  }

  if (
    meets(childSatisfactionRate, 40) &&
    below(childSatisfactionRate, 70) &&
    totalSatisDenom > 0
  ) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% — children's overall experience of voice and participation is mixed. Identify what works well for satisfied children and replicate those approaches for those who are less positive.`,
      severity: "warning",
    });
  }

  if (
    meets(meetingActionCompletionRate, 50) &&
    below(meetingActionCompletionRate, 70) &&
    totalMeetingActions > 0
  ) {
    insights.push({
      text: `Meeting action completion at ${meetingActionCompletionRate}% — while many actions are completed, incomplete follow-through can erode children's trust in the meeting process. A transparent action tracker visible to children would help.`,
      severity: "warning",
    });
  }

  if (above(avgDaysToAction, 7) && (typeof avgDaysToAction === "number" && avgDaysToAction <= 14) && actionTaken > 0) {
    insights.push({
      text: `Average ${avgDaysToAction} days to act on feedback — while within a reasonable timeframe, faster response would reinforce to children that their views are a priority. Consider whether quicker acknowledgement is possible even when full resolution takes longer.`,
      severity: "warning",
    });
  }

  if (
    below(minutesRecordedRate, 70) &&
    totalMeetingRecords > 0
  ) {
    insights.push({
      text: `Only ${minutesRecordedRate}% of meetings have minutes recorded — without proper records, the home cannot evidence what was discussed, what children said, and what actions were agreed. This weakens the evidential trail for Reg 7 compliance.`,
      severity: "warning",
    });
  }

  if (
    meets(avgSatisfaction, 2.0) &&
    below(avgSatisfaction, 3.0) &&
    totalFeelingHeardRecords > 0
  ) {
    insights.push({
      text: `Children's overall satisfaction with being heard averages only ${avgSatisfaction}/5 — this indicates that children's experience of voice and participation is below what should be expected. A systemic review of how the home listens to children is needed.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (voice_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding child voice and participation — children consistently attend meetings, consultations are effective, feedback is acted upon, council engagement is strong, and children overwhelmingly feel heard. This represents exemplary Reg 7 and Reg 5 compliance and shows that children's voices genuinely shape the care they receive.",
      severity: "positive",
    });
  }

  if (
    meets(meetingAttendanceRate, 90) &&
    meets(meetingContributionRate, 90) &&
    totalMeetingRecords > 0 &&
    attendedMeeting > 0
  ) {
    insights.push({
      text: `${meetingAttendanceRate}% attendance with ${meetingContributionRate}% active contribution — meetings are not just well-attended but genuinely participatory. Children are not passive attendees but active contributors to discussions that shape their care.`,
      severity: "positive",
    });
  }

  if (
    meets(feedbackActionRate, 90) &&
    meets(feedbackOutcomeCommunicatedRate, 90) &&
    feedbackReceived > 0
  ) {
    insights.push({
      text: `${feedbackActionRate}% of feedback acted upon with ${feedbackOutcomeCommunicatedRate}% of outcomes communicated — the home operates a complete feedback cycle where children's views are received, acted on, and the result communicated back. This builds genuine trust in the participation process.`,
      severity: "positive",
    });
  }

  if (
    meets(feelingHeardRate, 90) &&
    totalFeelingHeardRecords > 0
  ) {
    insights.push({
      text: `${feelingHeardRate}% of children feel heard — this is the definitive measure of voice and participation success. When children themselves confirm they feel listened to, that their views matter, and that changes happen as a result, the home is achieving the gold standard of Reg 7 compliance.`,
      severity: "positive",
    });
  }

  if (
    meets(councilEngagementRate, 90) &&
    totalCouncilRecords > 0
  ) {
    insights.push({
      text: `${councilEngagementRate}% council engagement — the child council is functioning as a genuine democratic forum where children attend, contribute, and feel listened to. This demonstrates that children have real influence over decisions affecting the life of the home.`,
      severity: "positive",
    });
  }

  if (
    meets(consultationRate, 90) &&
    meets(consultationSatisfactionRate, 90) &&
    totalConsultationRecords > 0
  ) {
    insights.push({
      text: `${consultationRate}% consultation effectiveness with ${consultationSatisfactionRate}% child satisfaction — consultations are not only procedurally strong but children are satisfied with the process. This shows that consultation is meaningful, not tokenistic.`,
      severity: "positive",
    });
  }

  if (
    meets(meetingActionCompletionRate, 90) &&
    totalMeetingActions > 0
  ) {
    insights.push({
      text: `${meetingActionCompletionRate}% of meeting actions completed — the home consistently follows through on commitments made in children's meetings. This builds trust and demonstrates that participation leads to real outcomes.`,
      severity: "positive",
    });
  }

  if (
    meets(concernAddressedRate, 90) &&
    specificConcerns > 0
  ) {
    insights.push({
      text: `${concernAddressedRate}% of children's specific concerns addressed — the home is highly responsive to individual children's worries, demonstrating personalised attention to each child's voice.`,
      severity: "positive",
    });
  }

  if (
    meets(avgSatisfaction, 4.0) &&
    totalFeelingHeardRecords > 0
  ) {
    insights.push({
      text: `Children's overall satisfaction averages ${avgSatisfaction}/5 — children feel genuinely valued, listened to, and empowered. This level of satisfaction reflects a deeply embedded culture of listening to and acting on children's views.`,
      severity: "positive",
    });
  }

  if (
    meets(knowsComplainRate, 90) &&
    meets(knowsAdvocateRate, 90) &&
    totalFeelingHeardRecords > 0
  ) {
    insights.push({
      text: `${knowsComplainRate}% know how to complain and ${knowsAdvocateRate}% know their advocate — children are well-informed about their rights and how to access independent support, ensuring multiple pathways for their voice to be heard.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (voice_rating === "outstanding") {
    headline =
      "Outstanding child voice and participation — children consistently attend meetings, consultations are effective, feedback is acted upon, and children overwhelmingly feel heard.";
  } else if (voice_rating === "good") {
    headline = `Good child voice and participation — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (voice_rating === "adequate") {
    headline = `Adequate child voice and participation — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's voices are consistently heard and acted upon.`;
  } else {
    headline = `Child voice and participation is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children are listened to, consulted, and that their views shape the care they receive.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    voice_rating,
    voice_score: score,
    headline,
    total_meeting_records: totalMeetingRecords,
    total_consultation_records: totalConsultationRecords,
    total_feedback_records: totalFeedbackRecords,
    total_council_records: totalCouncilRecords,
    total_feeling_heard_records: totalFeelingHeardRecords,
    meeting_attendance_rate: meetingAttendanceRate,
    consultation_rate: consultationRate,
    feedback_action_rate: feedbackActionRate,
    council_engagement_rate: councilEngagementRate,
    feeling_heard_rate: feelingHeardRate,
    // Preserve null-on-empty semantic: rate() returns 0 for empty denominator,
    // but the field promises null-on-unmeasured. Gate on totalSatisDenom.
    child_satisfaction_rate: totalSatisDenom > 0 ? childSatisfactionRate : null,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
