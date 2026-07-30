// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME CHILDREN'S RIGHTS & PARTICIPATION INTELLIGENCE ENGINE
// Home-level: aggregates children's rights entries, child-led meetings,
// feedback loops, pledges, participation entries, and advocacy records.
// CHR 2015 Reg 7: "The children's views, wishes and feelings standard."
// UNCRC Articles: Children's rights, participation, and voice.
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, meets } from "@/lib/metrics/rate";

// ── Input types ─────────────────────────────────────────────────────────────

export interface ChildrensRightInput {
  id: string;
  compliance_level: string; // "fully_met" | "partially_met" | "not_met" | "under_review"
  evidence_count: number;
  child_feedback_provided: boolean;
  action_needed_present: boolean;
}

export interface ChildLedMeetingInput {
  id: string;
  child_id: string;
  date: string;
  decisions_reached_count: number;
  child_agenda_count: number;
  proud_moments_count: number;
  visible_change_provided: boolean;
}

export interface FeedbackLoopInput {
  id: string;
  child_id: string;
  feedback_date: string;
  decision_made: string; // "accepted" | "partially_accepted" | "declined" | "deferred" | "not_applicable"
  child_accepts: boolean;
  duration_days_to_close: number;
  actions_taken_count: number;
  visible_change_provided: boolean;
}

export interface PledgeInput {
  id: string;
  child_id: string;
  status: string; // "active" | "met" | "in_progress" | "under_review" | "withdrawn"
  evidence_of_delivery_count: number;
  last_review_date: string;
  child_feedback_provided: boolean;
}

export interface ParticipationInput {
  id: string;
  date: string;
  children_involved_count: number;
  child_influenced: boolean;
  feedback_given_provided: boolean;
}

export interface AdvocacyInput {
  id: string;
  child_id: string;
  status: string; // "active" | "completed" | "on_hold" | "declined" | "referred"
  visits_count: number;
  review_date: string;
  child_view_provided: boolean;
}

export interface HomeChildrensRightsInput {
  today: string;
  rights_entries: ChildrensRightInput[];
  child_led_meetings: ChildLedMeetingInput[];
  feedback_loops: FeedbackLoopInput[];
  pledges: PledgeInput[];
  participation_entries: ParticipationInput[];
  advocacy_records: AdvocacyInput[];
  total_children: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type ChildrensRightsRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

// Null on empty across every "avg *" field below — no records ⇒ no average.
// "0 evidence / 0 decisions / 0 days to close / 0 pledges met / 0 involved /
// 0 visits" reads as "we did all this and it all failed", not "unmeasured".
export interface RightsComplianceProfile {
  total_rights: number;
  fully_met_count: number;
  partially_met_count: number;
  not_met_count: number;
  under_review_count: number;
  fully_met_rate: number;
  evidence_avg: number | null;
  child_feedback_rate: number;
}

export interface ChildLedMeetingProfile {
  total_meetings_90d: number;
  unique_children: number;
  avg_decisions: number | null;
  avg_child_agenda: number | null;
  visible_change_rate: number;
}

export interface FeedbackLoopProfile {
  total_loops_90d: number;
  acceptance_rate: number;
  child_accepts_rate: number;
  avg_closure_days: number | null;
  visible_change_rate: number;
}

export interface PledgeProfile {
  total_pledges: number;
  met_rate: number;
  active_in_progress_rate: number;
  avg_evidence: number | null;
  child_feedback_rate: number;
  overdue_reviews: number;
}

export interface ParticipationProfile {
  total_entries_90d: number;
  child_influence_rate: number;
  feedback_given_rate: number;
  avg_children_involved: number | null;
}

export interface AdvocacyProfile {
  total_records: number;
  active_count: number;
  child_coverage: number;
  avg_visits: number | null;
  child_view_rate: number;
  overdue_reviews: number;
}

export interface HomeChildrensRightsResult {
  rights_rating: ChildrensRightsRating;
  rights_score: number;
  headline: string;
  rights_compliance: RightsComplianceProfile;
  child_led_meetings: ChildLedMeetingProfile;
  feedback_loops: FeedbackLoopProfile;
  pledges: PledgeProfile;
  participation: ParticipationProfile;
  advocacy: AdvocacyProfile;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeChildrensRightsParticipation(
  input: HomeChildrensRightsInput,
): HomeChildrensRightsResult {
  const {
    today, rights_entries, child_led_meetings, feedback_loops,
    pledges, participation_entries, advocacy_records, total_children,
  } = input;

  // ── Insufficient data guard ──────────────────────────────────────────
  if (
    total_children === 0 &&
    rights_entries.length === 0 &&
    child_led_meetings.length === 0 &&
    feedback_loops.length === 0 &&
    pledges.length === 0 &&
    participation_entries.length === 0 &&
    advocacy_records.length === 0
  ) {
    return {
      rights_rating: "insufficient_data",
      rights_score: 0,
      headline: "No children's rights or participation data available for analysis.",
      rights_compliance: { total_rights: 0, fully_met_count: 0, partially_met_count: 0, not_met_count: 0, under_review_count: 0, fully_met_rate: 0, evidence_avg: null, child_feedback_rate: 0 },
      child_led_meetings: { total_meetings_90d: 0, unique_children: 0, avg_decisions: null, avg_child_agenda: null, visible_change_rate: 0 },
      feedback_loops: { total_loops_90d: 0, acceptance_rate: 0, child_accepts_rate: 0, avg_closure_days: null, visible_change_rate: 0 },
      pledges: { total_pledges: 0, met_rate: 0, active_in_progress_rate: 0, avg_evidence: null, child_feedback_rate: 0, overdue_reviews: 0 },
      participation: { total_entries_90d: 0, child_influence_rate: 0, feedback_given_rate: 0, avg_children_involved: null },
      advocacy: { total_records: 0, active_count: 0, child_coverage: 0, avg_visits: null, child_view_rate: 0, overdue_reviews: 0 },
      strengths: [],
      concerns: ["No children's rights or participation data — compliance with Reg 7 and UNCRC cannot be assessed."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Rights Compliance ────────────────────────────────────────────────
  const fullyMet = rights_entries.filter(r => r.compliance_level === "fully_met");
  const partiallyMet = rights_entries.filter(r => r.compliance_level === "partially_met");
  const notMet = rights_entries.filter(r => r.compliance_level === "not_met");
  const underReview = rights_entries.filter(r => r.compliance_level === "under_review");
  const fullyMetRate = pct(fullyMet.length, rights_entries.length);
  const rightsEvidenceAvg: number | null = rights_entries.length > 0
    ? Math.round((rights_entries.reduce((s, r) => s + r.evidence_count, 0) / rights_entries.length) * 10) / 10
    : null;
  const rightsChildFeedbackRate = pct(
    rights_entries.filter(r => r.child_feedback_provided).length,
    rights_entries.length,
  );

  const rightsProfile: RightsComplianceProfile = {
    total_rights: rights_entries.length,
    fully_met_count: fullyMet.length,
    partially_met_count: partiallyMet.length,
    not_met_count: notMet.length,
    under_review_count: underReview.length,
    fully_met_rate: fullyMetRate,
    evidence_avg: rightsEvidenceAvg,
    child_feedback_rate: rightsChildFeedbackRate,
  };

  // ── Child-Led Meetings (90d) ─────────────────────────────────────────
  const meetings90d = child_led_meetings.filter(m => {
    const d = daysBetween(m.date, today);
    return d >= 0 && d <= 90;
  });
  const meetingUniqueChildren = new Set(meetings90d.map(m => m.child_id));
  const avgDecisions: number | null = meetings90d.length > 0
    ? Math.round((meetings90d.reduce((s, m) => s + m.decisions_reached_count, 0) / meetings90d.length) * 10) / 10
    : null;
  const avgChildAgenda: number | null = meetings90d.length > 0
    ? Math.round((meetings90d.reduce((s, m) => s + m.child_agenda_count, 0) / meetings90d.length) * 10) / 10
    : null;
  const meetingVisibleChangeRate = pct(
    meetings90d.filter(m => m.visible_change_provided).length,
    meetings90d.length,
  );

  const meetingProfile: ChildLedMeetingProfile = {
    total_meetings_90d: meetings90d.length,
    unique_children: meetingUniqueChildren.size,
    avg_decisions: avgDecisions,
    avg_child_agenda: avgChildAgenda,
    visible_change_rate: meetingVisibleChangeRate,
  };

  // ── Feedback Loops (90d) ─────────────────────────────────────────────
  const loops90d = feedback_loops.filter(f => {
    const d = daysBetween(f.feedback_date, today);
    return d >= 0 && d <= 90;
  });
  const acceptedLoops = loops90d.filter(f =>
    f.decision_made === "accepted" || f.decision_made === "partially_accepted",
  );
  const acceptanceRate = pct(acceptedLoops.length, loops90d.length);
  const childAcceptsRate = pct(
    loops90d.filter(f => f.child_accepts).length,
    loops90d.length,
  );
  const avgClosureDays: number | null = loops90d.length > 0
    ? Math.round(loops90d.reduce((s, f) => s + f.duration_days_to_close, 0) / loops90d.length)
    : null;
  const loopVisibleChangeRate = pct(
    loops90d.filter(f => f.visible_change_provided).length,
    loops90d.length,
  );

  const feedbackLoopProfile: FeedbackLoopProfile = {
    total_loops_90d: loops90d.length,
    acceptance_rate: acceptanceRate,
    child_accepts_rate: childAcceptsRate,
    avg_closure_days: avgClosureDays,
    visible_change_rate: loopVisibleChangeRate,
  };

  // ── Pledges ──────────────────────────────────────────────────────────
  const metPledges = pledges.filter(p => p.status === "met");
  const activeInProgressPledges = pledges.filter(p =>
    p.status === "active" || p.status === "in_progress",
  );
  const metRate = pct(metPledges.length, pledges.length);
  const activeInProgressRate = pct(activeInProgressPledges.length, pledges.length);
  const avgEvidence: number | null = pledges.length > 0
    ? Math.round((pledges.reduce((s, p) => s + p.evidence_of_delivery_count, 0) / pledges.length) * 10) / 10
    : null;
  const pledgeChildFeedbackRate = pct(
    pledges.filter(p => p.child_feedback_provided).length,
    pledges.length,
  );
  const pledgeOverdueReviews = pledges.filter(p =>
    daysBetween(p.last_review_date, today) > 90,
  ).length;

  const pledgeProfile: PledgeProfile = {
    total_pledges: pledges.length,
    met_rate: metRate,
    active_in_progress_rate: activeInProgressRate,
    avg_evidence: avgEvidence,
    child_feedback_rate: pledgeChildFeedbackRate,
    overdue_reviews: pledgeOverdueReviews,
  };

  // ── Participation (90d) ──────────────────────────────────────────────
  const participation90d = participation_entries.filter(p => {
    const d = daysBetween(p.date, today);
    return d >= 0 && d <= 90;
  });
  const childInfluenceRate = pct(
    participation90d.filter(p => p.child_influenced).length,
    participation90d.length,
  );
  const feedbackGivenRate = pct(
    participation90d.filter(p => p.feedback_given_provided).length,
    participation90d.length,
  );
  const avgChildrenInvolved: number | null = participation90d.length > 0
    ? Math.round((participation90d.reduce((s, p) => s + p.children_involved_count, 0) / participation90d.length) * 10) / 10
    : null;

  const participationProfile: ParticipationProfile = {
    total_entries_90d: participation90d.length,
    child_influence_rate: childInfluenceRate,
    feedback_given_rate: feedbackGivenRate,
    avg_children_involved: avgChildrenInvolved,
  };

  // ── Advocacy ─────────────────────────────────────────────────────────
  const activeAdvocacy = advocacy_records.filter(a =>
    a.status === "active" || a.status === "completed",
  );
  const advocacyUniqueChildren = new Set(advocacy_records.map(a => a.child_id));
  const advocacyCoverage = pct(advocacyUniqueChildren.size, total_children);
  const avgVisits: number | null = advocacy_records.length > 0
    ? Math.round((advocacy_records.reduce((s, a) => s + a.visits_count, 0) / advocacy_records.length) * 10) / 10
    : null;
  const advocacyChildViewRate = pct(
    advocacy_records.filter(a => a.child_view_provided).length,
    advocacy_records.length,
  );
  const advocacyOverdueReviews = advocacy_records.filter(a =>
    a.status === "active" && daysBetween(a.review_date, today) > 0,
  ).length;

  const advocacyProfile: AdvocacyProfile = {
    total_records: advocacy_records.length,
    active_count: activeAdvocacy.length,
    child_coverage: advocacyCoverage,
    avg_visits: avgVisits,
    child_view_rate: advocacyChildViewRate,
    overdue_reviews: advocacyOverdueReviews,
  };

  // ── Scoring ──────────────────────────────────────────────────────────
  // Base 52 + max bonuses 28 = 80
  let score = 52;

  // mod1: Rights compliance level (±5) — fully_met rate high → +, not_met → −
  if (rights_entries.length === 0) {
    score += 0;
  } else {
    if (fullyMetRate >= 90) score += 5;
    else if (fullyMetRate >= 70) score += 3;
    else if (fullyMetRate >= 50) score += 0;
    else if (notMet.length > 0) score -= 5;
    else score -= 2;
  }

  // mod2: Feedback loop responsiveness (±4) — child_accepts rate + duration
  if (loops90d.length === 0) {
    score += 0;
  } else {
    if (childAcceptsRate >= 85 && (typeof avgClosureDays === "number" && avgClosureDays <= 14)) score += 4;
    else if (childAcceptsRate >= 70 && (typeof avgClosureDays === "number" && avgClosureDays <= 21)) score += 2;
    else if (childAcceptsRate >= 50) score += 0;
    else score -= 4;
  }

  // mod3: Child-led meeting quality (±3) — decisions + child agenda
  if (meetings90d.length === 0) {
    score += 0;
  } else {
    if (meets(avgDecisions, 2) && meets(avgChildAgenda, 2)) score += 3;
    else if (meets(avgDecisions, 1) && meets(avgChildAgenda, 1)) score += 1;
    else if (meets(avgDecisions, 1) || meets(avgChildAgenda, 1)) score += 0;
    else score -= 3;
  }

  // mod4: Pledge delivery (±4) — met/active rate + evidence
  if (pledges.length === 0) {
    score += 0;
  } else {
    const healthyPledgeRate = pct(metPledges.length + activeInProgressPledges.length, pledges.length);
    if (healthyPledgeRate >= 90 && meets(avgEvidence, 2)) score += 4;
    else if (healthyPledgeRate >= 70 && meets(avgEvidence, 1)) score += 2;
    else if (healthyPledgeRate >= 50) score += 0;
    else score -= 4;
  }

  // mod5: Participation influence (±3) — child_influenced rate
  if (participation90d.length === 0) {
    score += 0;
  } else {
    if (childInfluenceRate >= 80) score += 3;
    else if (childInfluenceRate >= 60) score += 1;
    else if (childInfluenceRate >= 40) score += 0;
    else score -= 3;
  }

  // mod6: Advocacy access (±3) — coverage + visits
  if (advocacy_records.length === 0) {
    score += (total_children > 0 ? -1 : 0);
  } else {
    if (advocacyCoverage >= 60 && meets(avgVisits, 2)) score += 3;
    else if (advocacyCoverage >= 40 && meets(avgVisits, 1)) score += 1;
    else if (advocacyCoverage >= 20) score += 0;
    else score -= 3;
  }

  // mod7: Child voice diversity (±3) — voice captured across multiple domains
  // Domains: rights feedback, meeting voice, feedback loops, pledge feedback, participation feedback, advocacy views
  let voiceDomains = 0;
  if (rightsChildFeedbackRate >= 50) voiceDomains++;
  if (meetings90d.length > 0 && meetingVisibleChangeRate >= 50) voiceDomains++;
  if (loops90d.length > 0 && childAcceptsRate >= 50) voiceDomains++;
  if (pledges.length > 0 && pledgeChildFeedbackRate >= 50) voiceDomains++;
  if (participation90d.length > 0 && feedbackGivenRate >= 50) voiceDomains++;
  if (advocacy_records.length > 0 && advocacyChildViewRate >= 50) voiceDomains++;

  if (voiceDomains >= 5) score += 3;
  else if (voiceDomains >= 3) score += 1;
  else if (voiceDomains >= 1) score += 0;
  else score -= 3;

  // mod8: Feedback loop closure time (±3) — fast → +, slow → −
  if (loops90d.length === 0) {
    score += 0;
  } else {
    if ((typeof avgClosureDays === "number" && avgClosureDays <= 7)) score += 3;
    else if ((typeof avgClosureDays === "number" && avgClosureDays <= 14)) score += 1;
    else if ((typeof avgClosureDays === "number" && avgClosureDays <= 30)) score += 0;
    else score -= 3;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ───────────────────────────────────────────────────────────
  let rights_rating: ChildrensRightsRating;
  if (score >= 80) rights_rating = "outstanding";
  else if (score >= 65) rights_rating = "good";
  else if (score >= 45) rights_rating = "adequate";
  else rights_rating = "inadequate";

  // ── Headline ─────────────────────────────────────────────────────────
  const headlines: Record<ChildrensRightsRating, string> = {
    outstanding: "Exceptional children's rights governance — participation, voice and advocacy all excelling.",
    good: "Strong rights and participation systems — most children actively engaged and heard.",
    adequate: "Rights and participation meet basic requirements but have room for improvement.",
    inadequate: "Critical gaps in children's rights and participation — urgent action required.",
    insufficient_data: "No children's rights or participation data available for analysis.",
  };
  const headline = headlines[rights_rating];

  // ── Strengths ────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (fullyMetRate >= 90 && rights_entries.length > 0)
    strengths.push(`Outstanding rights compliance — ${fullyMetRate}% of rights fully met.`);
  if (childAcceptsRate >= 85 && loops90d.length > 0)
    strengths.push(`Excellent feedback responsiveness — ${childAcceptsRate}% of children accept outcomes.`);
  if (meets(avgDecisions, 2) && meetings90d.length > 0)
    strengths.push(`Productive child-led meetings — averaging ${avgDecisions} decisions per meeting.`);
  if (metRate >= 50 && pledges.length > 0)
    strengths.push(`Strong pledge delivery — ${metRate}% of pledges met.`);
  if (childInfluenceRate >= 80 && participation90d.length > 0)
    strengths.push(`Children actively influencing decisions — ${childInfluenceRate}% influence rate.`);
  if (advocacyCoverage >= 60 && advocacy_records.length > 0)
    strengths.push(`Good advocacy access — ${advocacyCoverage}% of children have advocacy support.`);
  if (voiceDomains >= 5)
    strengths.push(`Diverse child voice — captured across ${voiceDomains} participation domains.`);
  if ((typeof avgClosureDays === "number" && avgClosureDays <= 7) && loops90d.length > 0)
    strengths.push(`Rapid feedback closure — averaging ${avgClosureDays} days.`);

  // ── Concerns ─────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (notMet.length > 0)
    concerns.push(`${notMet.length} children's right${notMet.length > 1 ? "s" : ""} not met — compliance action required.`);
  if (childAcceptsRate < 50 && loops90d.length > 0)
    concerns.push(`Only ${childAcceptsRate}% of children accept feedback outcomes — voice not being heard.`);
  if (meetings90d.length === 0 && total_children > 0)
    concerns.push("No child-led meetings in 90 days — children's participation in governance absent.");
  if (pledgeOverdueReviews > 0)
    concerns.push(`${pledgeOverdueReviews} pledge review${pledgeOverdueReviews > 1 ? "s" : ""} overdue — commitment tracking lapsed.`);
  if (childInfluenceRate < 40 && participation90d.length > 0)
    concerns.push(`Only ${childInfluenceRate}% of participation entries show child influence — tokenistic engagement.`);
  if (advocacy_records.length === 0 && total_children > 0)
    concerns.push("No advocacy records — children may lack independent representation.");
  if (advocacyOverdueReviews > 0)
    concerns.push(`${advocacyOverdueReviews} advocacy review${advocacyOverdueReviews > 1 ? "s" : ""} overdue.`);
  if (above(avgClosureDays, 30) && loops90d.length > 0)
    concerns.push(`Average feedback closure time ${avgClosureDays} days — children waiting too long for responses.`);

  // ── Recommendations ──────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let recRank = 0;

  if (notMet.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: `Address ${notMet.length} unmet children's right${notMet.length > 1 ? "s" : ""} — UNCRC compliance requires all rights to be actively upheld.`,
      urgency: "immediate",
      regulatory_ref: "UNCRC / CHR 2015 Reg 7",
    });
  }

  if (meetings90d.length === 0 && total_children > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: "Establish regular child-led meetings — Reg 7 requires children's views to inform home governance.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7",
    });
  }

  if (advocacy_records.length === 0 && total_children > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: "Arrange independent advocacy access for children — every child should know how to access an advocate.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7",
    });
  }

  if (childAcceptsRate < 50 && loops90d.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: "Review feedback processes — low child acceptance suggests outcomes are not meeting expectations.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7",
    });
  }

  if (pledgeOverdueReviews > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: `Review ${pledgeOverdueReviews} overdue pledge${pledgeOverdueReviews > 1 ? "s" : ""} — pledges must be regularly reviewed with children.`,
      urgency: "planned",
      regulatory_ref: null,
    });
  }

  if (above(avgClosureDays, 30) && loops90d.length > 0) {
    recommendations.push({
      rank: ++recRank,
      recommendation: "Reduce feedback loop closure time — children deserve timely responses to their feedback.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7",
    });
  }

  // ── Insights ─────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];

  if (fullyMetRate >= 90 && childAcceptsRate >= 85 && childInfluenceRate >= 80)
    insights.push({ text: "Cara recognises a rights-respecting culture — children's views, wishes and feelings are central to home governance.", severity: "positive" });

  if (notMet.length >= 3)
    insights.push({ text: `Cara flags ${notMet.length} unmet rights — pattern suggests systemic rights compliance gap.`, severity: "critical" });

  if (voiceDomains >= 5)
    insights.push({ text: `Cara detects child voice across ${voiceDomains} domains — evidence of embedded participation culture.`, severity: "positive" });

  if (meetings90d.length >= 6 && total_children > 0)
    insights.push({ text: `${meetings90d.length} child-led meetings in 90 days — children are actively shaping their care experience.`, severity: "positive" });

  if (above(avgClosureDays, 30) && loops90d.length >= 5)
    insights.push({ text: `Cara flags average feedback closure of ${avgClosureDays} days across ${loops90d.length} loops — risk of children disengaging from feedback processes.`, severity: "warning" });

  if (advocacyOverdueReviews >= 2)
    insights.push({ text: `${advocacyOverdueReviews} advocacy reviews overdue — children's independent representation may be lapsing.`, severity: "warning" });

  const withdrawnPledges = pledges.filter(p => p.status === "withdrawn").length;
  if (withdrawnPledges >= 2)
    insights.push({ text: `${withdrawnPledges} pledges withdrawn — consider whether commitments are realistic and achievable.`, severity: "warning" });

  return {
    rights_rating,
    rights_score: score,
    headline,
    rights_compliance: rightsProfile,
    child_led_meetings: meetingProfile,
    feedback_loops: feedbackLoopProfile,
    pledges: pledgeProfile,
    participation: participationProfile,
    advocacy: advocacyProfile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
