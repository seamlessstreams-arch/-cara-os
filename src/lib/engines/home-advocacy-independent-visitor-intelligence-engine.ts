// ==============================================================================
// CARA -- HOME ADVOCACY & INDEPENDENT VISITOR INTELLIGENCE ENGINE
// Monitors independent visitor allocation, advocacy service access, child
// representation quality, visit frequency compliance, and child satisfaction
// with advocacy. Pure deterministic engine -- no imports, no LLM, no external
// deps.
// CHR 2015 Reg 5 (Engaging with the wider system), Reg 7 (Children's views),
// Reg 22 (Independent person), SCCIF "Voice of the child".
import { meets, below } from "@/lib/metrics/rate";

// Store keys: independentVisitorRecords, advocacyServiceRecords,
//             representationRecords, visitComplianceRecords,
//             childSatisfactionRecords
// ==============================================================================

// -- Input Types --------------------------------------------------------------

export interface IndependentVisitorRecordInput {
  id: string;
  child_id: string;
  visitor_name: string;
  visitor_organisation: string;
  allocated: boolean;
  allocation_date: string | null;
  dbs_cleared: boolean;
  training_completed: boolean;
  child_consented: boolean;
  child_matched: boolean;
  matching_quality: "excellent" | "good" | "adequate" | "poor" | "unmatched";
  relationship_established: boolean;
  visits_planned_per_quarter: number;
  visits_completed_per_quarter: number;
  last_visit_date: string | null;
  visit_duration_minutes: number;
  child_engaged_during_visit: boolean;
  issues_raised_by_visitor: number;
  issues_resolved: number;
  visitor_report_submitted: boolean;
  child_wishes_recorded: boolean;
  created_at: string;
}

export interface AdvocacyServiceRecordInput {
  id: string;
  child_id: string;
  advocacy_provider: string;
  service_type: "instructed" | "non_instructed" | "issue_based" | "independent_mental_capacity" | "general";
  referral_date: string;
  referral_accepted: boolean;
  advocate_allocated: boolean;
  advocate_name: string;
  first_contact_date: string | null;
  days_to_first_contact: number;
  advocacy_plan_in_place: boolean;
  child_informed_of_rights: boolean;
  child_understands_role: boolean;
  meetings_attended_by_advocate: number;
  meetings_total: number;
  outcome_achieved: boolean;
  outcome_documented: boolean;
  child_satisfaction: number; // 1-5
  advocacy_independent_of_home: boolean;
  created_at: string;
}

export interface RepresentationRecordInput {
  id: string;
  child_id: string;
  context: "lac_review" | "care_planning" | "complaints" | "education" | "health" | "court" | "transition" | "other";
  date: string;
  child_views_sought: boolean;
  child_views_documented: boolean;
  child_views_presented: boolean;
  child_attended_meeting: boolean;
  advocate_present: boolean;
  independent_visitor_consulted: boolean;
  child_felt_heard: boolean;
  decision_reflected_views: boolean;
  feedback_given_to_child: boolean;
  representation_quality: "excellent" | "good" | "adequate" | "poor";
  barriers_to_participation: string[];
  created_at: string;
}

export interface VisitComplianceRecordInput {
  id: string;
  child_id: string;
  visit_type: "independent_visitor" | "reg44" | "advocacy" | "social_worker" | "irp" | "other";
  scheduled_date: string;
  actual_date: string | null;
  visit_completed: boolean;
  within_timescale: boolean;
  visit_private: boolean;
  child_seen_alone: boolean;
  child_views_recorded: boolean;
  follow_up_actions: number;
  follow_up_completed: number;
  report_filed: boolean;
  report_filed_on_time: boolean;
  visit_quality: "excellent" | "good" | "adequate" | "poor";
  created_at: string;
}

export interface ChildSatisfactionRecordInput {
  id: string;
  child_id: string;
  survey_date: string;
  knows_independent_visitor: boolean;
  feels_listened_to: boolean;
  trusts_advocate: boolean;
  understands_complaints_process: boolean;
  would_use_advocacy_again: boolean;
  satisfaction_with_iv: number; // 1-5
  satisfaction_with_advocacy: number; // 1-5
  satisfaction_with_representation: number; // 1-5
  feels_views_make_difference: boolean;
  suggestions_for_improvement: string;
  child_voice_method: "face_to_face" | "written" | "digital" | "creative" | "other";
  created_at: string;
}

export interface AdvocacyVisitorInput {
  today: string;
  total_children: number;
  independent_visitor_records: IndependentVisitorRecordInput[];
  advocacy_service_records: AdvocacyServiceRecordInput[];
  representation_records: RepresentationRecordInput[];
  visit_compliance_records: VisitComplianceRecordInput[];
  child_satisfaction_records: ChildSatisfactionRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type AdvocacyVisitorRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AdvocacyVisitorInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface AdvocacyVisitorRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface AdvocacyVisitorResult {
  advocacy_rating: AdvocacyVisitorRating;
  advocacy_score: number;
  headline: string;
  visitor_allocation_rate: number;
  advocacy_access_rate: number;
  representation_quality_rate: number;
  visit_compliance_rate: number;
  child_voice_rate: number;
  // fab-0: null when no satisfaction records / no components.
  child_satisfaction_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: AdvocacyVisitorRecommendation[];
  insights: AdvocacyVisitorInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): AdvocacyVisitorRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: AdvocacyVisitorRating,
  score: number,
  headline: string,
): AdvocacyVisitorResult {
  return {
    advocacy_rating: rating,
    advocacy_score: score,
    headline,
    visitor_allocation_rate: 0,
    advocacy_access_rate: 0,
    representation_quality_rate: 0,
    visit_compliance_rate: 0,
    child_voice_rate: 0,
    child_satisfaction_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeAdvocacyIndependentVisitor(
  input: AdvocacyVisitorInput,
): AdvocacyVisitorResult {
  const {
    total_children,
    independent_visitor_records,
    advocacy_service_records,
    representation_records,
    visit_compliance_records,
    child_satisfaction_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    independent_visitor_records.length === 0 &&
    advocacy_service_records.length === 0 &&
    representation_records.length === 0 &&
    visit_compliance_records.length === 0 &&
    child_satisfaction_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess advocacy and independent visitor provision.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No advocacy or independent visitor data recorded despite children on placement -- independent visitor allocation, advocacy access, child representation, and visit compliance require urgent attention.",
      ),
      concerns: [
        "No independent visitor, advocacy service, representation, visit compliance, or child satisfaction records exist despite children being on placement -- the home cannot evidence that children have access to independent advocacy or that their voices are being heard outside the care system.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of independent visitor allocations, advocacy service referrals, child representation at meetings, visit compliance tracking, and child satisfaction surveys to evidence the home's commitment to children's independent advocacy rights.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider system",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child is offered an independent visitor and has access to an independent advocacy service. Document the allocation process, child consent, and any refusals with clear reasoning.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 22 -- Independent person",
        },
      ],
      insights: [
        {
          text: "The complete absence of advocacy and independent visitor records means Ofsted cannot verify that children have access to independent representation or that their voices are heard outside the home's staff team. This represents a fundamental gap in Reg 5, Reg 7, and Reg 22 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Independent visitor allocation ---
  const totalIVRecords = independent_visitor_records.length;
  const allocatedIV = independent_visitor_records.filter((r) => r.allocated).length;
  const visitorAllocationRate = pct(allocatedIV, totalIVRecords);

  const matchQualityGood = independent_visitor_records.filter(
    (r) => r.matching_quality === "excellent" || r.matching_quality === "good",
  ).length;
  const matchQualityRate = pct(matchQualityGood, totalIVRecords);

  const relationshipEstablished = independent_visitor_records.filter(
    (r) => r.relationship_established,
  ).length;
  const relationshipRate = pct(relationshipEstablished, totalIVRecords);

  const totalIVVisitsPlanned = independent_visitor_records.reduce(
    (sum, r) => sum + r.visits_planned_per_quarter, 0,
  );
  const totalIVVisitsCompleted = independent_visitor_records.reduce(
    (sum, r) => sum + r.visits_completed_per_quarter, 0,
  );
  const ivVisitCompletionRate = pct(totalIVVisitsCompleted, totalIVVisitsPlanned);

  const ivEngaged = independent_visitor_records.filter(
    (r) => r.child_engaged_during_visit,
  ).length;
  const ivEngagementRate = pct(ivEngaged, totalIVRecords);

  const totalIVIssuesRaised = independent_visitor_records.reduce(
    (sum, r) => sum + r.issues_raised_by_visitor, 0,
  );
  const totalIVIssuesResolved = independent_visitor_records.reduce(
    (sum, r) => sum + r.issues_resolved, 0,
  );
  const ivIssueResolutionRate = pct(totalIVIssuesResolved, totalIVIssuesRaised);

  const ivWishesRecorded = independent_visitor_records.filter(
    (r) => r.child_wishes_recorded,
  ).length;

  // --- Advocacy service access ---
  const totalAdvocacyRecords = advocacy_service_records.length;
  const advocateAllocated = advocacy_service_records.filter(
    (r) => r.advocate_allocated,
  ).length;
  const advocacyAccessRate = pct(advocateAllocated, totalAdvocacyRecords);

  const childInformedOfRights = advocacy_service_records.filter(
    (r) => r.child_informed_of_rights,
  ).length;
  const rightsInformedRate = pct(childInformedOfRights, totalAdvocacyRecords);

  const totalAdvocacyMeetingsAttended = advocacy_service_records.reduce(
    (sum, r) => sum + r.meetings_attended_by_advocate, 0,
  );
  const totalAdvocacyMeetings = advocacy_service_records.reduce(
    (sum, r) => sum + r.meetings_total, 0,
  );
  const advocacyMeetingAttendanceRate = pct(totalAdvocacyMeetingsAttended, totalAdvocacyMeetings);

  const outcomeAchieved = advocacy_service_records.filter(
    (r) => r.outcome_achieved,
  ).length;
  const outcomeRate = pct(outcomeAchieved, totalAdvocacyRecords);

  const advocacySatisfactionSum = advocacy_service_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  // fab-0: null when no advocacy records.
  const advocacySatisfactionAvg: number | null =
    totalAdvocacyRecords > 0
      ? Math.round((advocacySatisfactionSum / totalAdvocacyRecords) * 100) / 100
      : null;

  const advocacyIndependent = advocacy_service_records.filter(
    (r) => r.advocacy_independent_of_home,
  ).length;
  const independenceRate = pct(advocacyIndependent, totalAdvocacyRecords);

  const timeliness = advocacy_service_records.filter(
    (r) => r.days_to_first_contact <= 5,
  ).length;
  const timelinessRate = pct(timeliness, totalAdvocacyRecords);

  // --- Representation quality ---
  const totalRepRecords = representation_records.length;
  const viewsSought = representation_records.filter(
    (r) => r.child_views_sought,
  ).length;

  const childFeltHeard = representation_records.filter(
    (r) => r.child_felt_heard,
  ).length;
  const feltHeardRate = pct(childFeltHeard, totalRepRecords);

  const decisionReflectedViews = representation_records.filter(
    (r) => r.decision_reflected_views,
  ).length;
  const decisionReflectionRate = pct(decisionReflectedViews, totalRepRecords);

  const feedbackGiven = representation_records.filter(
    (r) => r.feedback_given_to_child,
  ).length;
  const feedbackRate = pct(feedbackGiven, totalRepRecords);

  const repQualityGood = representation_records.filter(
    (r) => r.representation_quality === "excellent" || r.representation_quality === "good",
  ).length;
  const representationQualityRate = pct(repQualityGood, totalRepRecords);

  const repBarriersTotal = representation_records.filter(
    (r) => r.barriers_to_participation.length > 0,
  ).length;
  const repBarrierRate = pct(repBarriersTotal, totalRepRecords);

  // --- Visit compliance ---
  const totalVisitRecords = visit_compliance_records.length;
  const visitsCompleted = visit_compliance_records.filter(
    (r) => r.visit_completed,
  ).length;
  const visitComplianceRate = pct(visitsCompleted, totalVisitRecords);

  const seenAlone = visit_compliance_records.filter(
    (r) => r.child_seen_alone,
  ).length;
  const seenAloneRate = pct(seenAlone, totalVisitRecords);

  const visitViewsRecorded = visit_compliance_records.filter(
    (r) => r.child_views_recorded,
  ).length;

  const totalFollowUp = visit_compliance_records.reduce(
    (sum, r) => sum + r.follow_up_actions, 0,
  );
  const totalFollowUpCompleted = visit_compliance_records.reduce(
    (sum, r) => sum + r.follow_up_completed, 0,
  );
  const followUpCompletionRate = pct(totalFollowUpCompleted, totalFollowUp);

  const reportFiled = visit_compliance_records.filter(
    (r) => r.report_filed,
  ).length;
  const reportFiledRate = pct(reportFiled, totalVisitRecords);

  const reportOnTime = visit_compliance_records.filter(
    (r) => r.report_filed_on_time,
  ).length;
  const reportTimelinessRate = pct(reportOnTime, totalVisitRecords);

  // --- Child satisfaction composite ---
  const totalSatRecords = child_satisfaction_records.length;
  const knowsIV = child_satisfaction_records.filter(
    (r) => r.knows_independent_visitor,
  ).length;
  const knowsIVRate = pct(knowsIV, totalSatRecords);

  const feelsListened = child_satisfaction_records.filter(
    (r) => r.feels_listened_to,
  ).length;
  const feelsListenedRate = pct(feelsListened, totalSatRecords);

  const trustsAdvocate = child_satisfaction_records.filter(
    (r) => r.trusts_advocate,
  ).length;
  const trustRate = pct(trustsAdvocate, totalSatRecords);

  const understandsComplaints = child_satisfaction_records.filter(
    (r) => r.understands_complaints_process,
  ).length;
  const complaintsUnderstandingRate = pct(understandsComplaints, totalSatRecords);

  const wouldUseAgain = child_satisfaction_records.filter(
    (r) => r.would_use_advocacy_again,
  ).length;
  const wouldUseAgainRate = pct(wouldUseAgain, totalSatRecords);

  const feelsViewsMakeDifference = child_satisfaction_records.filter(
    (r) => r.feels_views_make_difference,
  ).length;
  const viewsMakeDifferenceRate = pct(feelsViewsMakeDifference, totalSatRecords);

  const satIVSum = child_satisfaction_records.reduce(
    (sum, r) => sum + r.satisfaction_with_iv, 0,
  );
  // fab-0: null when no satisfaction records.
  const satIVAvg: number | null =
    totalSatRecords > 0
      ? Math.round((satIVSum / totalSatRecords) * 100) / 100
      : null;

  const satAdvocacySum = child_satisfaction_records.reduce(
    (sum, r) => sum + r.satisfaction_with_advocacy, 0,
  );
  const satAdvocacyAvg: number | null =
    totalSatRecords > 0
      ? Math.round((satAdvocacySum / totalSatRecords) * 100) / 100
      : null;

  const satRepSum = child_satisfaction_records.reduce(
    (sum, r) => sum + r.satisfaction_with_representation, 0,
  );
  const satRepAvg: number | null =
    totalSatRecords > 0
      ? Math.round((satRepSum / totalSatRecords) * 100) / 100
      : null;

  const overallSatisfactionAvg: number | null =
    totalSatRecords > 0 && satIVAvg !== null && satAdvocacyAvg !== null && satRepAvg !== null
      ? Math.round(((satIVAvg + satAdvocacyAvg + satRepAvg) / 3) * 100) / 100
      : null;

  // --- Child voice composite ---
  const voiceNumerator = ivWishesRecorded + viewsSought + visitViewsRecorded;
  const voiceDenominator = totalIVRecords + totalRepRecords + totalVisitRecords;
  const childVoiceRate = pct(voiceNumerator, voiceDenominator);

  // --- Child satisfaction composite rate ---
  const satBoolCount =
    (feelsListened > 0 ? feelsListenedRate : 0) +
    (trustsAdvocate > 0 ? trustRate : 0) +
    (feelsViewsMakeDifference > 0 ? viewsMakeDifferenceRate : 0);
  const satBoolDivisor =
    (feelsListened > 0 ? 1 : 0) +
    (trustsAdvocate > 0 ? 1 : 0) +
    (feelsViewsMakeDifference > 0 ? 1 : 0);
  // fab-0: null when no satisfaction records at all. With records present but
  // every bool false, satBoolDivisor is 0 → keep returning 0 (that IS the
  // finding: children feel unheard); guard the divide-by-zero with || 1.
  const childSatisfactionRate: number | null =
    totalSatRecords > 0
      ? Math.round(satBoolCount / (satBoolDivisor || 1))
      : null;

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: visitorAllocationRate (>=90: +5, >=70: +3) ---
  if (visitorAllocationRate >= 90) score += 5;
  else if (visitorAllocationRate >= 70) score += 3;

  // --- Bonus 2: advocacyAccessRate (>=90: +5, >=70: +3) ---
  if (advocacyAccessRate >= 90) score += 5;
  else if (advocacyAccessRate >= 70) score += 3;

  // --- Bonus 3: representationQualityRate (>=90: +4, >=70: +2) ---
  if (representationQualityRate >= 90) score += 4;
  else if (representationQualityRate >= 70) score += 2;

  // --- Bonus 4: visitComplianceRate (>=90: +4, >=70: +2) ---
  if (visitComplianceRate >= 90) score += 4;
  else if (visitComplianceRate >= 70) score += 2;

  // --- Bonus 5: childVoiceRate (>=80: +4, >=60: +2) ---
  if (childVoiceRate >= 80) score += 4;
  else if (childVoiceRate >= 60) score += 2;

  // --- Bonus 6: childSatisfactionRate (>=80: +3, >=60: +1) ---
  if (meets(childSatisfactionRate, 80)) score += 3;
  else if (meets(childSatisfactionRate, 60)) score += 1;

  // --- Bonus 7: independenceRate (>=90: +3, >=70: +1) ---
  if (independenceRate >= 90) score += 3;
  else if (independenceRate >= 70) score += 1;

  // Max bonuses: 5+5+4+4+4+3+3 = 28

  // -- Penalties (4 with guards) -------------------------------------------

  // visitorAllocationRate < 50 -> -5
  if (visitorAllocationRate < 50 && totalIVRecords > 0) score -= 5;

  // advocacyAccessRate < 50 -> -5
  if (advocacyAccessRate < 50 && totalAdvocacyRecords > 0) score -= 5;

  // visitComplianceRate < 50 -> -4
  if (visitComplianceRate < 50 && totalVisitRecords > 0) score -= 4;

  // representationQualityRate < 30 -> -4
  if (representationQualityRate < 30 && totalRepRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const advocacy_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (visitorAllocationRate >= 90 && totalIVRecords > 0) {
    strengths.push(
      `${visitorAllocationRate}% of children have an allocated independent visitor -- the home demonstrates strong commitment to ensuring children have trusted adults outside the care system.`,
    );
  } else if (visitorAllocationRate >= 70 && totalIVRecords > 0) {
    strengths.push(
      `${visitorAllocationRate}% independent visitor allocation rate -- most children have access to an independent trusted adult.`,
    );
  }

  if (matchQualityRate >= 80 && totalIVRecords > 0) {
    strengths.push(
      `${matchQualityRate}% of independent visitor matches rated good or excellent -- children are well matched with visitors who understand their needs and backgrounds.`,
    );
  }

  if (relationshipRate >= 80 && totalIVRecords > 0) {
    strengths.push(
      `Relationships established in ${relationshipRate}% of independent visitor placements -- children have meaningful, trusting relationships with their independent visitors.`,
    );
  }

  if (ivVisitCompletionRate >= 90 && totalIVVisitsPlanned > 0) {
    strengths.push(
      `${ivVisitCompletionRate}% of planned independent visitor visits completed -- visit schedules are consistently maintained.`,
    );
  } else if (ivVisitCompletionRate >= 70 && totalIVVisitsPlanned > 0) {
    strengths.push(
      `${ivVisitCompletionRate}% of planned independent visitor visits completed -- good visit completion rate.`,
    );
  }

  if (ivEngagementRate >= 80 && totalIVRecords > 0) {
    strengths.push(
      `Children engaged during ${ivEngagementRate}% of independent visitor visits -- visits are meaningful and child-centred.`,
    );
  }

  if (advocacyAccessRate >= 90 && totalAdvocacyRecords > 0) {
    strengths.push(
      `${advocacyAccessRate}% advocacy access rate -- children have excellent access to independent advocacy services when they need them.`,
    );
  } else if (advocacyAccessRate >= 70 && totalAdvocacyRecords > 0) {
    strengths.push(
      `${advocacyAccessRate}% advocacy access rate -- most children can access independent advocacy services.`,
    );
  }

  if (rightsInformedRate >= 90 && totalAdvocacyRecords > 0) {
    strengths.push(
      `${rightsInformedRate}% of children informed of their advocacy rights -- the home ensures children know they can access independent support.`,
    );
  }

  if (advocacyMeetingAttendanceRate >= 90 && totalAdvocacyMeetings > 0) {
    strengths.push(
      `Advocates attended ${advocacyMeetingAttendanceRate}% of relevant meetings -- children's voices are consistently amplified through professional advocacy.`,
    );
  }

  if (outcomeRate >= 80 && totalAdvocacyRecords > 0) {
    strengths.push(
      `${outcomeRate}% of advocacy interventions achieved their outcome -- advocacy is effective in securing positive results for children.`,
    );
  }

  if (independenceRate >= 90 && totalAdvocacyRecords > 0) {
    strengths.push(
      `${independenceRate}% of advocacy services are independent of the home -- genuine independence is maintained in advocacy provision.`,
    );
  }

  if (timelinessRate >= 80 && totalAdvocacyRecords > 0) {
    strengths.push(
      `${timelinessRate}% of first advocacy contacts made within 5 working days -- children receive timely access to their advocate.`,
    );
  }

  if (representationQualityRate >= 90 && totalRepRecords > 0) {
    strengths.push(
      `${representationQualityRate}% of representation events rated good or excellent -- children's views are being powerfully represented in decisions about their lives.`,
    );
  } else if (representationQualityRate >= 70 && totalRepRecords > 0) {
    strengths.push(
      `${representationQualityRate}% of representation events rated good or excellent -- children are generally well represented.`,
    );
  }

  if (feltHeardRate >= 80 && totalRepRecords > 0) {
    strengths.push(
      `${feltHeardRate}% of children felt heard during meetings and reviews -- children experience genuine participation, not tokenistic involvement.`,
    );
  }

  if (decisionReflectionRate >= 80 && totalRepRecords > 0) {
    strengths.push(
      `${decisionReflectionRate}% of decisions reflected children's expressed views -- children can see that their voices make a real difference to outcomes.`,
    );
  }

  if (feedbackRate >= 80 && totalRepRecords > 0) {
    strengths.push(
      `Feedback given to children after ${feedbackRate}% of representation events -- the home closes the loop, ensuring children know how their views were used.`,
    );
  }

  if (visitComplianceRate >= 90 && totalVisitRecords > 0) {
    strengths.push(
      `${visitComplianceRate}% visit compliance rate -- scheduled visits are consistently completed, demonstrating reliable oversight of children's welfare.`,
    );
  } else if (visitComplianceRate >= 70 && totalVisitRecords > 0) {
    strengths.push(
      `${visitComplianceRate}% visit compliance rate -- most scheduled visits are being completed.`,
    );
  }

  if (seenAloneRate >= 80 && totalVisitRecords > 0) {
    strengths.push(
      `Children seen alone in ${seenAloneRate}% of visits -- children have private opportunities to share concerns away from staff.`,
    );
  }

  if (followUpCompletionRate >= 90 && totalFollowUp > 0) {
    strengths.push(
      `${followUpCompletionRate}% of visit follow-up actions completed -- issues identified during visits are resolved promptly.`,
    );
  }

  if (reportTimelinessRate >= 90 && totalVisitRecords > 0) {
    strengths.push(
      `${reportTimelinessRate}% of visit reports filed on time -- documentation is timely and supports effective oversight.`,
    );
  }

  if (totalSatRecords > 0 && meets(childSatisfactionRate, 80)) {
    strengths.push(
      `Child satisfaction composite rate at ${childSatisfactionRate}% -- children feel listened to, trust their advocates, and believe their views make a difference.`,
    );
  } else if (totalSatRecords > 0 && meets(childSatisfactionRate, 60)) {
    strengths.push(
      `Child satisfaction composite rate at ${childSatisfactionRate}% -- children generally feel supported by advocacy and independent visitor provision.`,
    );
  }

  if (totalSatRecords > 0 && overallSatisfactionAvg !== null && overallSatisfactionAvg >= 4.0) {
    strengths.push(
      `Overall advocacy satisfaction averages ${overallSatisfactionAvg}/5 -- children rate their experience of advocacy and independent visiting highly.`,
    );
  }

  if (wouldUseAgainRate >= 80 && totalSatRecords > 0) {
    strengths.push(
      `${wouldUseAgainRate}% of children would use advocacy services again -- children trust and value the advocacy provision.`,
    );
  }

  if (childVoiceRate >= 80 && voiceDenominator > 0) {
    strengths.push(
      `Child voice captured in ${childVoiceRate}% of advocacy, visiting, and representation contexts -- children's wishes and feelings genuinely shape the support they receive.`,
    );
  } else if (childVoiceRate >= 60 && voiceDenominator > 0) {
    strengths.push(
      `Child voice captured in ${childVoiceRate}% of advocacy, visiting, and representation contexts -- good practice in consulting children about their independent support.`,
    );
  }

  if (ivIssueResolutionRate >= 90 && totalIVIssuesRaised > 0) {
    strengths.push(
      `${ivIssueResolutionRate}% of issues raised by independent visitors resolved -- the home responds effectively to independent visitor feedback.`,
    );
  }

  if (complaintsUnderstandingRate >= 90 && totalSatRecords > 0) {
    strengths.push(
      `${complaintsUnderstandingRate}% of children understand the complaints process -- children are empowered to raise concerns through formal channels.`,
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (visitorAllocationRate < 50 && totalIVRecords > 0) {
    concerns.push(
      `Only ${visitorAllocationRate}% of children have an allocated independent visitor -- the majority of children lack a trusted independent adult outside the care system, denying them a critical safeguard.`,
    );
  } else if (visitorAllocationRate < 70 && visitorAllocationRate >= 50 && totalIVRecords > 0) {
    concerns.push(
      `Independent visitor allocation at ${visitorAllocationRate}% -- not all children who would benefit have an allocated independent visitor.`,
    );
  }

  if (matchQualityRate < 50 && totalIVRecords > 0) {
    concerns.push(
      `Only ${matchQualityRate}% of independent visitor matches rated good or excellent -- poor matching undermines the effectiveness of the independent visitor scheme and risks children disengaging.`,
    );
  }

  if (relationshipRate < 60 && totalIVRecords > 0) {
    concerns.push(
      `Relationships established in only ${relationshipRate}% of independent visitor placements -- without genuine relationships, independent visiting becomes a compliance exercise rather than meaningful support.`,
    );
  }

  if (ivVisitCompletionRate < 50 && totalIVVisitsPlanned > 0) {
    concerns.push(
      `Only ${ivVisitCompletionRate}% of planned independent visitor visits completed -- children are not receiving the regularity of contact they are entitled to.`,
    );
  } else if (ivVisitCompletionRate < 70 && ivVisitCompletionRate >= 50 && totalIVVisitsPlanned > 0) {
    concerns.push(
      `Independent visitor visit completion at ${ivVisitCompletionRate}% -- some children are missing scheduled visits.`,
    );
  }

  if (advocacyAccessRate < 50 && totalAdvocacyRecords > 0) {
    concerns.push(
      `Only ${advocacyAccessRate}% advocacy access rate -- the majority of children referred for advocacy do not have an allocated advocate, denying them independent support at critical moments.`,
    );
  } else if (advocacyAccessRate < 70 && advocacyAccessRate >= 50 && totalAdvocacyRecords > 0) {
    concerns.push(
      `Advocacy access at ${advocacyAccessRate}% -- not all children who need advocacy can access it in a timely manner.`,
    );
  }

  if (rightsInformedRate < 50 && totalAdvocacyRecords > 0) {
    concerns.push(
      `Only ${rightsInformedRate}% of children informed of their advocacy rights -- children cannot exercise rights they do not know they have.`,
    );
  }

  if (independenceRate < 70 && totalAdvocacyRecords > 0) {
    concerns.push(
      `Only ${independenceRate}% of advocacy services are independent of the home -- lack of independence compromises the integrity of advocacy and may prevent children from speaking freely.`,
    );
  }

  if (timelinessRate < 50 && totalAdvocacyRecords > 0) {
    concerns.push(
      `Only ${timelinessRate}% of first advocacy contacts made within 5 working days -- delays in accessing advocacy mean children wait too long for independent support at critical moments.`,
    );
  }

  if (totalAdvocacyRecords > 0 && advocacySatisfactionAvg !== null && advocacySatisfactionAvg < 3.0) {
    concerns.push(
      `Children's satisfaction with advocacy averages only ${advocacySatisfactionAvg}/5 -- children are not experiencing advocacy as helpful or effective.`,
    );
  }

  if (representationQualityRate < 30 && totalRepRecords > 0) {
    concerns.push(
      `Only ${representationQualityRate}% of representation events rated good or excellent -- children's views are not being adequately presented or considered in decisions about their lives.`,
    );
  } else if (representationQualityRate < 70 && representationQualityRate >= 30 && totalRepRecords > 0) {
    concerns.push(
      `Representation quality rated good or excellent in only ${representationQualityRate}% of events -- the quality of child representation needs improvement.`,
    );
  }

  if (feltHeardRate < 50 && totalRepRecords > 0) {
    concerns.push(
      `Only ${feltHeardRate}% of children felt heard during meetings and reviews -- children's participation is tokenistic rather than genuine, undermining their confidence in the care system.`,
    );
  } else if (feltHeardRate < 70 && feltHeardRate >= 50 && totalRepRecords > 0) {
    concerns.push(
      `Only ${feltHeardRate}% of children felt heard -- some children are not experiencing genuine participation in decisions about their lives.`,
    );
  }

  if (decisionReflectionRate < 50 && totalRepRecords > 0) {
    concerns.push(
      `Only ${decisionReflectionRate}% of decisions reflected children's expressed views -- children's voices are being sought but not acted upon, which erodes trust.`,
    );
  }

  if (repBarrierRate >= 30 && totalRepRecords > 0) {
    concerns.push(
      `Barriers to participation encountered in ${repBarrierRate}% of representation events -- persistent obstacles are preventing children from fully engaging in meetings about their care.`,
    );
  }

  if (visitComplianceRate < 50 && totalVisitRecords > 0) {
    concerns.push(
      `Only ${visitComplianceRate}% visit compliance rate -- the majority of scheduled visits are not being completed, representing a significant failure of independent oversight.`,
    );
  } else if (visitComplianceRate < 70 && visitComplianceRate >= 50 && totalVisitRecords > 0) {
    concerns.push(
      `Visit compliance at ${visitComplianceRate}% -- not all scheduled visits are being completed.`,
    );
  }

  if (seenAloneRate < 50 && totalVisitRecords > 0) {
    concerns.push(
      `Children seen alone in only ${seenAloneRate}% of visits -- children may not have private opportunities to share concerns, which undermines the safeguarding value of visits.`,
    );
  }

  if (followUpCompletionRate < 50 && totalFollowUp > 0) {
    concerns.push(
      `Only ${followUpCompletionRate}% of visit follow-up actions completed -- issues identified during visits are not being resolved, undermining the purpose of independent oversight.`,
    );
  }

  if (reportFiledRate < 70 && totalVisitRecords > 0) {
    concerns.push(
      `Visit reports filed for only ${reportFiledRate}% of visits -- incomplete reporting undermines accountability and the ability to track children's welfare over time.`,
    );
  }

  if (totalSatRecords > 0 && below(childSatisfactionRate, 50)) {
    concerns.push(
      `Child satisfaction composite rate at only ${childSatisfactionRate}% -- children do not feel listened to, do not trust their advocates, or do not believe their views make a difference.`,
    );
  }

  if (totalSatRecords > 0 && overallSatisfactionAvg !== null && overallSatisfactionAvg < 3.0) {
    concerns.push(
      `Overall advocacy satisfaction averages only ${overallSatisfactionAvg}/5 -- children rate their experience of advocacy and independent visiting poorly.`,
    );
  }

  if (knowsIVRate < 50 && totalSatRecords > 0) {
    concerns.push(
      `Only ${knowsIVRate}% of children know who their independent visitor is -- children cannot benefit from a service they do not know exists.`,
    );
  }

  if (childVoiceRate < 50 && voiceDenominator > 0) {
    concerns.push(
      `Child voice captured in only ${childVoiceRate}% of advocacy, visiting, and representation contexts -- children's wishes and feelings are not sufficiently shaping the support they receive.`,
    );
  } else if (childVoiceRate < 60 && childVoiceRate >= 50 && voiceDenominator > 0) {
    concerns.push(
      `Child voice rate at ${childVoiceRate}% -- children's views need to be more consistently captured across advocacy, visiting, and representation contexts.`,
    );
  }

  if (totalIVRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No independent visitor records despite children being on placement -- the home may not be assessing or recording whether children have been offered an independent visitor.",
    );
  }

  if (totalAdvocacyRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No advocacy service records -- the home has not documented whether children have access to independent advocacy services or whether referrals have been made.",
    );
  }

  if (totalRepRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No representation records -- the home has not documented how children's views are sought, presented, and acted upon in key decisions.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: AdvocacyVisitorRecommendation[] = [];
  let rank = 0;

  if (visitorAllocationRate < 50 && totalIVRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review independent visitor allocation -- every child who would benefit should be offered an independent visitor. Contact the local independent visitor scheme and prioritise allocation for children who have been in care longest or who have limited family contact.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 22 -- Independent person",
    });
  }

  if (advocacyAccessRate < 50 && totalAdvocacyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children have timely access to an independent advocacy service -- review referral pathways, commission advocacy from accredited providers, and ensure every child knows how to request an advocate.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider system",
    });
  }

  if (visitComplianceRate < 50 && totalVisitRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address the critical shortfall in visit compliance -- ensure all scheduled visits (independent visitor, Reg 44, advocacy, social worker) are completed within timescale. Implement a tracking system and escalation process for missed visits.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 22 -- Independent person",
    });
  }

  if (representationQualityRate < 30 && totalRepRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review the quality of child representation at meetings and reviews -- ensure children's views are actively sought, professionally presented, and demonstrably influence decisions. Provide staff training on child-centred participation methods.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 -- Children's views",
    });
  }

  if (childVoiceRate < 50 && voiceDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Embed child voice across all advocacy, visiting, and representation contexts -- use age-appropriate methods to capture children's wishes and feelings before, during, and after key events. Ensure children's views are documented and demonstrably acted upon.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Voice of the child",
    });
  }

  if (rightsInformedRate < 50 && totalAdvocacyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child is informed of their right to an independent advocate -- produce child-friendly information about advocacy services, display it prominently in the home, and discuss it during keywork sessions and admission meetings.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider system",
    });
  }

  if (independenceRate < 70 && totalAdvocacyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure advocacy services are genuinely independent of the home -- review current arrangements and commission advocacy from providers that have no contractual or financial relationship with the home to protect the integrity of children's independent representation.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider system",
    });
  }

  if (feltHeardRate < 50 && totalRepRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve children's experience of being heard at meetings -- consider child-friendly meeting formats, pre-meeting preparation with the child, advocate presence, and post-meeting feedback. Children must feel their participation is genuine, not tokenistic.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 -- Children's views",
    });
  }

  if (seenAloneRate < 50 && totalVisitRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children are seen alone during visits -- this is essential for children to speak freely about their care without staff presence. Brief all visitors and staff on the expectation that private time with the child is a standard part of every visit.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 22 -- Independent person",
    });
  }

  if (followUpCompletionRate < 50 && totalFollowUp > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a robust follow-up action tracking system for issues arising from visits -- assign responsibility, set deadlines, and review completion at team meetings. Unresolved actions undermine the purpose of independent oversight.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 22 -- Independent person",
    });
  }

  if (matchQualityRate < 50 && totalIVRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review independent visitor matching processes -- consider children's backgrounds, interests, culture, and preferences when matching to improve relationship quality and child engagement.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 22 -- Independent person",
    });
  }

  if (knowsIVRate < 50 && totalSatRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Raise children's awareness of their independent visitor -- ensure every child knows who their IV is, how to contact them, and what they can do. Use visual aids, photos, and regular introductions.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 22 -- Independent person",
    });
  }

  if (decisionReflectionRate < 50 && totalRepRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen the link between children's expressed views and care decisions -- document how each child's views were considered and explain to the child how the decision was reached, including where their views could not be fully followed.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 -- Children's views",
    });
  }

  if (visitorAllocationRate >= 50 && visitorAllocationRate < 70 && totalIVRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase independent visitor allocation to at least 70% -- review which children have not been offered an IV and prioritise those with limited external contact.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 22 -- Independent person",
    });
  }

  if (advocacyAccessRate >= 50 && advocacyAccessRate < 70 && totalAdvocacyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve advocacy access to at least 70% -- review referral pathways and response times to ensure children are not waiting for advocacy support.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider system",
    });
  }

  if (representationQualityRate >= 30 && representationQualityRate < 70 && totalRepRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Invest in improving representation quality -- provide staff training on child-centred participation, use creative methods to capture children's views, and ensure advocates attend all key meetings.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 -- Children's views",
    });
  }

  if (visitComplianceRate >= 50 && visitComplianceRate < 70 && totalVisitRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve visit compliance to at least 70% -- review scheduling processes and ensure adequate notice, backup arrangements, and escalation for cancellations.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 22 -- Independent person",
    });
  }

  if (reportFiledRate < 70 && totalVisitRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve visit report filing to at least 70% -- set clear expectations for visitors and staff that reports must be filed within 5 working days and implement a chase process for overdue reports.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 22 -- Independent person",
    });
  }

  if (totalIVRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement independent visitor assessments for every child and begin recording allocations, visit completion, and child engagement to evidence the home's commitment to Reg 22 compliance.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 22 -- Independent person",
    });
  }

  if (totalAdvocacyRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission and document access to an independent advocacy service for all children -- record referrals, allocations, and outcomes to evidence Reg 5 compliance.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider system",
    });
  }

  if (totalRepRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording how children's views are sought, presented, and acted upon in every significant meeting and decision -- this is essential evidence for Reg 7 compliance and SCCIF inspection.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 -- Children's views",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: AdvocacyVisitorInsight[] = [];

  // --- Critical insights ---

  if (visitorAllocationRate < 50 && totalIVRecords > 0) {
    insights.push({
      text: `Only ${visitorAllocationRate}% of children have an allocated independent visitor. Ofsted will view the failure to provide independent visitors as evidence that the home does not prioritise children's access to trusted adults outside the care system -- a direct failure under Reg 22.`,
      severity: "critical",
    });
  }

  if (advocacyAccessRate < 50 && totalAdvocacyRecords > 0) {
    insights.push({
      text: `Only ${advocacyAccessRate}% advocacy access rate. Children who cannot access independent advocacy are unable to challenge decisions or raise concerns through independent channels -- this undermines Reg 5 compliance and the fundamental principle of child-centred care.`,
      severity: "critical",
    });
  }

  if (visitComplianceRate < 50 && totalVisitRecords > 0) {
    insights.push({
      text: `Only ${visitComplianceRate}% visit compliance rate. Missed visits mean children lose vital contact with independent adults who can identify concerns, monitor their welfare, and amplify their voices. Ofsted will view this as a significant safeguarding gap.`,
      severity: "critical",
    });
  }

  if (representationQualityRate < 30 && totalRepRecords > 0) {
    insights.push({
      text: `Representation quality rated good or excellent in only ${representationQualityRate}% of events. Children's views are not being effectively presented or considered in decisions about their lives -- this is a fundamental failure of the home's duty to hear and act on children's voices under Reg 7.`,
      severity: "critical",
    });
  }

  if (totalIVRecords === 0 && totalAdvocacyRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No independent visitor or advocacy records despite children being on placement. Ofsted may interpret the absence of records as evidence that children have no access to independent adults or advocacy services -- this is a significant omission under Reg 5, Reg 7, and Reg 22.",
      severity: "critical",
    });
  }

  if (independenceRate < 50 && totalAdvocacyRecords > 0) {
    insights.push({
      text: `Only ${independenceRate}% of advocacy services are independent of the home. Advocacy that is not genuinely independent cannot fulfil its purpose -- children may not feel safe to raise concerns about their care if their advocate has ties to the home.`,
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (visitorAllocationRate >= 50 && visitorAllocationRate < 70 && totalIVRecords > 0) {
    insights.push({
      text: `Independent visitor allocation at ${visitorAllocationRate}% -- improving but some children still lack access to an independent trusted adult. Each unallocated child misses out on a vital safeguard.`,
      severity: "warning",
    });
  }

  if (advocacyAccessRate >= 50 && advocacyAccessRate < 70 && totalAdvocacyRecords > 0) {
    insights.push({
      text: `Advocacy access at ${advocacyAccessRate}% -- not all children who need independent advocacy can access it. Consider whether referral pathways are clear and responsive.`,
      severity: "warning",
    });
  }

  if (representationQualityRate >= 30 && representationQualityRate < 70 && totalRepRecords > 0) {
    insights.push({
      text: `Representation quality rated good or excellent in ${representationQualityRate}% of events -- there is room to improve how children's views are captured, presented, and acted upon in decisions.`,
      severity: "warning",
    });
  }

  if (visitComplianceRate >= 50 && visitComplianceRate < 70 && totalVisitRecords > 0) {
    insights.push({
      text: `Visit compliance at ${visitComplianceRate}% -- some visits are being missed, reducing the frequency of independent oversight. Review scheduling and cancellation processes.`,
      severity: "warning",
    });
  }

  if (childVoiceRate >= 50 && childVoiceRate < 80 && voiceDenominator > 0) {
    insights.push({
      text: `Child voice captured in ${childVoiceRate}% of advocacy, visiting, and representation contexts -- while some consultation is happening, children's wishes and feelings need to be more consistently shaping their support.`,
      severity: "warning",
    });
  }

  if (totalSatRecords > 0 && childSatisfactionRate !== null && childSatisfactionRate >= 50 && childSatisfactionRate < 80) {
    insights.push({
      text: `Child satisfaction composite at ${childSatisfactionRate}% -- while children generally feel supported, there is scope to improve how children experience advocacy, visiting, and representation.`,
      severity: "warning",
    });
  }

  if (followUpCompletionRate >= 50 && followUpCompletionRate < 90 && totalFollowUp > 0) {
    insights.push({
      text: `Follow-up action completion at ${followUpCompletionRate}% -- some issues raised during visits are not being resolved. This risks Ofsted identifying a pattern of unaddressed concerns.`,
      severity: "warning",
    });
  }

  if (repBarrierRate >= 30 && totalRepRecords > 0) {
    insights.push({
      text: `Barriers to participation encountered in ${repBarrierRate}% of representation events -- persistent obstacles suggest systemic issues with meeting formats, timing, or support that need targeted resolution.`,
      severity: "warning",
    });
  }

  if (timelinessRate >= 50 && timelinessRate < 80 && totalAdvocacyRecords > 0) {
    insights.push({
      text: `First advocacy contact within 5 days in ${timelinessRate}% of cases -- while most children receive timely contact, delays can leave children unsupported at critical moments.`,
      severity: "warning",
    });
  }

  // --- Diversity of visit types insight ---
  const visitTypes = new Set(
    visit_compliance_records.map((r) => r.visit_type),
  );
  if (visitTypes.size >= 4) {
    insights.push({
      text: `The home manages ${visitTypes.size} distinct visit types -- this breadth of independent oversight is positive but requires robust scheduling, tracking, and follow-up systems to maintain compliance across all visit categories.`,
      severity: "warning",
    });
  }

  // --- Positive insights ---

  if (advocacy_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding advocacy and independent visitor provision -- children have access to independent adults, their voices are powerfully represented, and they are satisfied with the support they receive. This is strong evidence for Reg 5, Reg 7, and Reg 22 compliance.",
      severity: "positive",
    });
  }

  if (visitorAllocationRate >= 90 && advocacyAccessRate >= 90 && totalIVRecords > 0 && totalAdvocacyRecords > 0) {
    insights.push({
      text: `Independent visitor allocation at ${visitorAllocationRate}% and advocacy access at ${advocacyAccessRate}% -- the home provides comprehensive independent support for children. Ofsted will recognise this as evidence of genuinely child-centred practice and robust Reg 22 compliance.`,
      severity: "positive",
    });
  }

  if (feltHeardRate >= 80 && decisionReflectionRate >= 80 && totalRepRecords > 0) {
    insights.push({
      text: `${feltHeardRate}% of children felt heard and ${decisionReflectionRate}% of decisions reflected their views -- children experience genuine participation, not tokenistic involvement. This is exemplary practice under Reg 7 and SCCIF voice of the child standards.`,
      severity: "positive",
    });
  }

  if (visitComplianceRate >= 90 && seenAloneRate >= 80 && totalVisitRecords > 0) {
    insights.push({
      text: `${visitComplianceRate}% visit compliance with ${seenAloneRate}% of children seen alone -- independent oversight is consistent and children have private opportunities to share concerns. This demonstrates robust safeguarding practice.`,
      severity: "positive",
    });
  }

  if (childVoiceRate >= 80 && voiceDenominator > 0) {
    insights.push({
      text: `Child voice captured in ${childVoiceRate}% of advocacy, visiting, and representation contexts -- children's wishes and feelings genuinely shape the independent support they receive. This is exemplary practice in respecting children's autonomy and rights.`,
      severity: "positive",
    });
  }

  if (totalSatRecords > 0 && overallSatisfactionAvg !== null && overallSatisfactionAvg >= 4.0 && wouldUseAgainRate >= 80) {
    insights.push({
      text: `Overall satisfaction at ${overallSatisfactionAvg}/5 with ${wouldUseAgainRate}% willing to use advocacy again -- children trust and value the independent support available to them. This reflects a culture where children's voices are genuinely heard and respected.`,
      severity: "positive",
    });
  }

  if (ivIssueResolutionRate >= 90 && followUpCompletionRate >= 90 && totalIVIssuesRaised > 0 && totalFollowUp > 0) {
    insights.push({
      text: `${ivIssueResolutionRate}% IV issue resolution with ${followUpCompletionRate}% follow-up completion -- the home responds promptly and effectively to concerns raised through independent channels. This demonstrates accountability and continuous improvement.`,
      severity: "positive",
    });
  }

  if (independenceRate >= 90 && rightsInformedRate >= 90 && totalAdvocacyRecords > 0) {
    insights.push({
      text: `${independenceRate}% advocacy independence with ${rightsInformedRate}% rights awareness -- advocacy is genuinely independent and children know their rights. This creates the conditions for children to speak freely and seek support without fear.`,
      severity: "positive",
    });
  }

  if (reportTimelinessRate >= 90 && reportFiledRate >= 90 && totalVisitRecords > 0) {
    insights.push({
      text: `${reportFiledRate}% of visit reports filed with ${reportTimelinessRate}% on time -- documentation is thorough and timely, supporting effective oversight and providing a clear evidence trail for regulatory inspection.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (advocacy_rating === "outstanding") {
    headline =
      "Outstanding advocacy and independent visitor provision -- children have access to independent adults, their voices are powerfully represented, and visit compliance is strong.";
  } else if (advocacy_rating === "good") {
    headline = `Good advocacy and independent visitor provision -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (advocacy_rating === "adequate") {
    headline = `Adequate advocacy and independent visitor provision -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's independent advocacy and representation needs are fully met.`;
  } else {
    headline = `Advocacy and independent visitor provision is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children have access to independent advocates and their voices are heard.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    advocacy_rating,
    advocacy_score: score,
    headline,
    visitor_allocation_rate: visitorAllocationRate,
    advocacy_access_rate: advocacyAccessRate,
    representation_quality_rate: representationQualityRate,
    visit_compliance_rate: visitComplianceRate,
    child_voice_rate: childVoiceRate,
    child_satisfaction_rate: childSatisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
