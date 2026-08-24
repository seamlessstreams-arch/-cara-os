// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME PLACEMENT JOURNEY INTELLIGENCE ENGINE
// Pre-admission, welcome, return interviews, objectives, anniversaries.
// Pure deterministic engine. CHR 2015 Reg 36/37.
// ══════════════════════════════════════════════════════════════════════════════

export interface PreAdmissionChecklistInput {
  id: string; child_id: string; completed_date: string;
  risk_assessment_included: boolean; all_sections_complete: boolean;
  placing_authority_consulted: boolean; child_visited_home: boolean;
}

export interface WarmWelcomePackInput {
  id: string; child_id: string; provided_date: string;
  personalised: boolean; child_friendly: boolean; photos_included: boolean;
}

export interface WelcomeTourInput {
  id: string; child_id: string; tour_date: string;
  completed: boolean; child_feedback_captured: boolean;
  buddy_assigned: boolean;
}

export interface ReturnInterviewInput {
  id: string; child_id: string; date: string;
  conducted_within_24h: boolean; child_views_recorded: boolean;
  actions_identified: number; actions_completed: number;
}

export interface PlacementObjectiveInput {
  id: string; child_id: string; set_date: string;
  progress_status: string; // "on_track" | "behind" | "achieved" | "not_started"
  review_date: string; child_involved: boolean;
}

export interface PlacementAnniversaryInput {
  id: string; child_id: string; anniversary_date: string;
  celebrated: boolean; child_voice_captured: boolean;
  memory_box_updated: boolean;
}

export interface HomePlacementJourneyInput {
  today: string;
  pre_admission_checklists: PreAdmissionChecklistInput[];
  warm_welcome_packs: WarmWelcomePackInput[];
  welcome_tours: WelcomeTourInput[];
  return_interviews: ReturnInterviewInput[];
  placement_objectives: PlacementObjectiveInput[];
  placement_anniversaries: PlacementAnniversaryInput[];
  total_children: number;
}

export type PlacementJourneyRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface PreAdmissionSummary { total: number; all_complete_rate: number | null; risk_included_rate: number | null; child_visited_rate: number | null; }
export interface WelcomePackSummary { total: number; child_coverage: number; personalised_rate: number | null; }
export interface WelcomeTourSummary { total: number; completed_rate: number | null; feedback_rate: number | null; buddy_rate: number | null; }
export interface ReturnInterviewSummary { total: number; within_24h_rate: number | null; child_views_rate: number | null; action_completion_rate: number | null; }
export interface ObjectiveSummary { total: number; on_track_rate: number | null; overdue_reviews: number; child_involved_rate: number | null; }
export interface AnniversarySummary { total: number; celebrated_rate: number | null; child_voice_rate: number | null; memory_box_rate: number | null; }

export interface HomePlacementJourneyResult {
  placement_journey_rating: PlacementJourneyRating; placement_journey_score: number; headline: string;
  pre_admission: PreAdmissionSummary; welcome_packs: WelcomePackSummary; welcome_tours: WelcomeTourSummary;
  return_interviews: ReturnInterviewSummary; objectives: ObjectiveSummary; anniversaries: AnniversarySummary;
  strengths: string[]; concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

function pct(n: number, d: number): number { return d === 0 ? 0 : Math.round((n / d) * 100); }
function daysBetween(a: string, b: string): number { return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000); }

export function computeHomePlacementJourney(input: HomePlacementJourneyInput): HomePlacementJourneyResult {
  const { today, pre_admission_checklists, warm_welcome_packs, welcome_tours, return_interviews, placement_objectives, placement_anniversaries, total_children } = input;

  if (total_children === 0 && pre_admission_checklists.length === 0 && warm_welcome_packs.length === 0 && welcome_tours.length === 0 && return_interviews.length === 0 && placement_objectives.length === 0 && placement_anniversaries.length === 0) {
    return {
      placement_journey_rating: "insufficient_data", placement_journey_score: 0,
      headline: "No placement journey data available for analysis.",
      pre_admission: { total: 0, all_complete_rate: null, risk_included_rate: null, child_visited_rate: null },
      welcome_packs: { total: 0, child_coverage: 0, personalised_rate: null },
      welcome_tours: { total: 0, completed_rate: null, feedback_rate: null, buddy_rate: null },
      return_interviews: { total: 0, within_24h_rate: null, child_views_rate: null, action_completion_rate: null },
      objectives: { total: 0, on_track_rate: null, overdue_reviews: 0, child_involved_rate: null },
      anniversaries: { total: 0, celebrated_rate: null, child_voice_rate: null, memory_box_rate: null },
      strengths: [], concerns: [], recommendations: [], insights: [],
    };
  }

  // Analysis
  const paComplete = pre_admission_checklists.filter(p => p.all_sections_complete).length;
  const paCompleteRate = pct(paComplete, pre_admission_checklists.length);
  const paRisk = pre_admission_checklists.filter(p => p.risk_assessment_included).length;
  const paRiskRate = pct(paRisk, pre_admission_checklists.length);
  const paVisited = pre_admission_checklists.filter(p => p.child_visited_home).length;
  const paVisitedRate = pct(paVisited, pre_admission_checklists.length);

  const wpChildIds = new Set(warm_welcome_packs.map(w => w.child_id));
  const wpCoverage = pct(wpChildIds.size, total_children);
  const wpPersonalised = warm_welcome_packs.filter(w => w.personalised).length;
  const wpPersonalisedRate = pct(wpPersonalised, warm_welcome_packs.length);

  const wtCompleted = welcome_tours.filter(t => t.completed).length;
  const wtCompletedRate = pct(wtCompleted, welcome_tours.length);
  const wtFeedback = welcome_tours.filter(t => t.child_feedback_captured).length;
  const wtFeedbackRate = pct(wtFeedback, welcome_tours.length);
  const wtBuddy = welcome_tours.filter(t => t.buddy_assigned).length;
  const wtBuddyRate = pct(wtBuddy, welcome_tours.length);

  const ri24h = return_interviews.filter(r => r.conducted_within_24h).length;
  const ri24hRate = pct(ri24h, return_interviews.length);
  const riViews = return_interviews.filter(r => r.child_views_recorded).length;
  const riViewsRate = pct(riViews, return_interviews.length);
  const riActTotal = return_interviews.reduce((s, r) => s + r.actions_identified, 0);
  const riActComp = return_interviews.reduce((s, r) => s + r.actions_completed, 0);
  const riActCompRate = pct(riActComp, riActTotal);

  const objOnTrack = placement_objectives.filter(o => o.progress_status === "on_track" || o.progress_status === "achieved").length;
  const objOnTrackRate = pct(objOnTrack, placement_objectives.length);
  const objOverdue = placement_objectives.filter(o => daysBetween(o.review_date, today) > 0).length;
  const objInvolved = placement_objectives.filter(o => o.child_involved).length;
  const objInvolvedRate = pct(objInvolved, placement_objectives.length);

  const annCelebrated = placement_anniversaries.filter(a => a.celebrated).length;
  const annCelebratedRate = pct(annCelebrated, placement_anniversaries.length);
  const annVoice = placement_anniversaries.filter(a => a.child_voice_captured).length;
  const annVoiceRate = pct(annVoice, placement_anniversaries.length);
  const annMemory = placement_anniversaries.filter(a => a.memory_box_updated).length;
  const annMemoryRate = pct(annMemory, placement_anniversaries.length);

  // Summaries
  const pre_admission: PreAdmissionSummary = { total: pre_admission_checklists.length, all_complete_rate: paCompleteRate, risk_included_rate: paRiskRate, child_visited_rate: paVisitedRate };
  const welcome_packs: WelcomePackSummary = { total: warm_welcome_packs.length, child_coverage: wpCoverage, personalised_rate: wpPersonalisedRate };
  const welcome_tours_sum: WelcomeTourSummary = { total: welcome_tours.length, completed_rate: wtCompletedRate, feedback_rate: wtFeedbackRate, buddy_rate: wtBuddyRate };
  const return_interviews_sum: ReturnInterviewSummary = { total: return_interviews.length, within_24h_rate: ri24hRate, child_views_rate: riViewsRate, action_completion_rate: riActCompRate };
  const objectives: ObjectiveSummary = { total: placement_objectives.length, on_track_rate: objOnTrackRate, overdue_reviews: objOverdue, child_involved_rate: objInvolvedRate };
  const anniversaries: AnniversarySummary = { total: placement_anniversaries.length, celebrated_rate: annCelebratedRate, child_voice_rate: annVoiceRate, memory_box_rate: annMemoryRate };

  // ═══════════════════════════════════════════════════════════════════════
  // SCORING
  // ═══════════════════════════════════════════════════════════════════════
  let score = 52;

  // Mod 1: Pre-admission thoroughness (±5)
  { let m = 0;
    if (pre_admission_checklists.length > 0) {
      if (paCompleteRate >= 90) m += 2; else if (paCompleteRate < 50) m -= 2;
      if (paRiskRate >= 90) m += 2; else if (paRiskRate < 50) m -= 2;
      if (paVisitedRate >= 70) m += 1; else if (paVisitedRate < 30) m -= 1;
    } else { if (total_children >= 2) m -= 2; }
    score += Math.max(-5, Math.min(5, m));
  }

  // Mod 2: Welcome process (±4)
  { let m = 0;
    if (warm_welcome_packs.length > 0) {
      if (wpCoverage >= 80) m += 2; else if (wpCoverage < 40) m -= 1;
      if (wpPersonalisedRate >= 80) m += 2; else if (wpPersonalisedRate < 40) m -= 1;
    } else { if (total_children >= 2) m -= 2; }
    score += Math.max(-4, Math.min(4, m));
  }

  // Mod 3: Welcome tour & orientation (±3)
  { let m = 0;
    if (welcome_tours.length > 0) {
      if (wtCompletedRate >= 90) m += 1; else if (wtCompletedRate < 50) m -= 1;
      if (wtFeedbackRate >= 80) m += 1; else if (wtFeedbackRate < 40) m -= 1;
      if (wtBuddyRate >= 70) m += 1; else if (wtBuddyRate < 30) m -= 1;
    } else { if (total_children >= 2) m -= 1; }
    score += Math.max(-3, Math.min(3, m));
  }

  // Mod 4: Return interview compliance (±4)
  { let m = 0;
    if (return_interviews.length > 0) {
      if (ri24hRate >= 90) m += 2; else if (ri24hRate < 50) m -= 1;
      if (riViewsRate >= 80) m += 1; else if (riViewsRate < 40) m -= 1;
      if (riActCompRate >= 80) m += 1; else if (riActCompRate < 40) m -= 1;
    }
    score += Math.max(-4, Math.min(4, m));
  }

  // Mod 5: Placement objectives (±3)
  { let m = 0;
    if (placement_objectives.length > 0) {
      if (objOnTrackRate >= 80) m += 1; else if (objOnTrackRate < 40) m -= 1;
      if (objOverdue === 0) m += 1; else if (objOverdue >= 5) m -= 2; else m -= 1;
      if (objInvolvedRate >= 80) m += 1; else if (objInvolvedRate < 40) m -= 1;
    } else { if (total_children >= 2) m -= 1; }
    score += Math.max(-3, Math.min(3, m));
  }

  // Mod 6: Anniversary & celebration (±3)
  { let m = 0;
    if (placement_anniversaries.length > 0) {
      if (annCelebratedRate >= 80) m += 1; else if (annCelebratedRate < 40) m -= 1;
      if (annVoiceRate >= 70) m += 1; else if (annVoiceRate < 30) m -= 1;
      if (annMemoryRate >= 70) m += 1; else if (annMemoryRate < 30) m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // Mod 7: Child voice across journey (±3)
  { let m = 0;
    const voices: number[] = [];
    if (welcome_tours.length > 0) voices.push(wtFeedbackRate);
    if (return_interviews.length > 0) voices.push(riViewsRate);
    if (placement_objectives.length > 0) voices.push(objInvolvedRate);
    if (placement_anniversaries.length > 0) voices.push(annVoiceRate);
    if (voices.length > 0) {
      const avg = Math.round(voices.reduce((s, v) => s + v, 0) / voices.length);
      if (avg >= 90) m += 3; else if (avg >= 70) m += 2; else if (avg >= 50) m += 1; else if (avg < 30) m -= 2;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // Mod 8: Review & documentation quality (±3)
  { let m = 0;
    const docSources: number[] = [];
    if (pre_admission_checklists.length > 0) docSources.push(paCompleteRate);
    if (return_interviews.length > 0) docSources.push(riActCompRate);
    if (docSources.length > 0) {
      const avg = Math.round(docSources.reduce((s, v) => s + v, 0) / docSources.length);
      if (avg >= 90) m += 3; else if (avg >= 70) m += 2; else if (avg >= 50) m += 1; else if (avg < 30) m -= 2;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  score = Math.max(0, Math.min(100, score));

  let placement_journey_rating: PlacementJourneyRating;
  if (score >= 80) placement_journey_rating = "outstanding";
  else if (score >= 65) placement_journey_rating = "good";
  else if (score >= 45) placement_journey_rating = "adequate";
  else placement_journey_rating = "inadequate";

  // Narrative
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: HomePlacementJourneyResult["recommendations"] = [];
  const insights: HomePlacementJourneyResult["insights"] = [];
  let rank = 0;

  if (pre_admission_checklists.length > 0 && paCompleteRate >= 90 && paRiskRate >= 90) strengths.push(`Thorough pre-admission process — ${paCompleteRate}% checklists complete with ${paRiskRate}% risk assessments included.`);
  if (warm_welcome_packs.length > 0 && wpCoverage >= 80 && wpPersonalisedRate >= 80) strengths.push(`Excellent welcome packs — ${wpCoverage}% child coverage with ${wpPersonalisedRate}% personalised.`);
  if (return_interviews.length > 0 && ri24hRate >= 90) strengths.push(`Strong return interview compliance — ${ri24hRate}% conducted within 24 hours.`);

  if (pre_admission_checklists.length === 0 && total_children >= 2) {
    concerns.push("No pre-admission checklists — placements are not being formally assessed before admission.");
    recommendations.push({ rank: ++rank, recommendation: "Implement pre-admission checklists for all new placements.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 36" });
  }
  if (warm_welcome_packs.length === 0 && total_children >= 2) {
    concerns.push("No warm welcome packs — children are not receiving personalised introductions to the home.");
    recommendations.push({ rank: ++rank, recommendation: "Create personalised warm welcome packs for all children.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 37" });
  }
  if (placement_objectives.length > 0 && objOverdue >= 5) {
    concerns.push(`${objOverdue} placement objectives are overdue for review — children's progress is not being tracked.`);
  }

  if (placement_journey_rating === "outstanding") insights.push({ text: `Placement journey is outstanding (${score}%). Pre-admission, welcome, objectives, and anniversaries all demonstrate excellent child-centred practice.`, severity: "positive" });
  if (placement_journey_rating === "inadequate") insights.push({ text: `Placement journey is inadequate (${score}%). Significant gaps in pre-admission processes, welcome procedures, or objective tracking. This is a regulatory concern.`, severity: "critical" });

  let headline: string;
  if (placement_journey_rating === "outstanding") headline = "Placement journey is outstanding — thorough pre-admission, warm welcomes, and strong objective tracking across the home.";
  else if (placement_journey_rating === "good") headline = "Good placement journey with effective processes, some areas for enhancement.";
  else if (placement_journey_rating === "adequate") headline = "Adequate placement journey but gaps in pre-admission, welcome, or objective processes need attention.";
  else headline = "Significant placement journey gaps — pre-admission, welcome, and objectives require urgent improvement.";

  return {
    placement_journey_rating, placement_journey_score: score, headline,
    pre_admission, welcome_packs, welcome_tours: welcome_tours_sum,
    return_interviews: return_interviews_sum, objectives, anniversaries,
    strengths, concerns, recommendations, insights,
  };
}
