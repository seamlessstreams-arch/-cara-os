// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME RETURN HOME INTERVIEW QUALITY INTELLIGENCE ENGINE
// Pure deterministic engine: interview completion, timeliness, independence,
// exploitation screening, child voice, and action follow-through.
// CHR 2015 Reg 12: "The protection of children standard." SCCIF: Safeguarding.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ReturnInterviewRecordInput {
  id: string;
  child_id: string;
  interview_status: string; // "completed"|"offered_declined"|"pending"|"not_yet_due"
  independent_of_home: boolean;
  has_push_factors: boolean;
  has_pull_factors: boolean;
  risks_identified_count: number;
  exploitation_concerns: boolean;
  has_child_voice: boolean;
  actions_total: number;
  actions_completed: number;
  shared_with_count: number;
}

export interface ReturnInterviewQualityInput {
  today: string;
  total_children: number;
  interviews: ReturnInterviewRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ReturnInterviewRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ReturnInterviewQualityResult {
  interview_rating: ReturnInterviewRating;
  interview_score: number;
  headline: string;
  total_interviews: number;
  completion_rate: number;
  independence_rate: number;
  child_voice_rate: number;
  exploitation_screening_rate: number;
  action_completion_rate: number;
  information_sharing_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref: string;
  }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): ReturnInterviewRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeReturnInterviewQuality(
  input: ReturnInterviewQualityInput,
): ReturnInterviewQualityResult {
  const { interviews, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      interview_rating: "insufficient_data",
      interview_score: 0,
      headline: "No data available for return interview analysis",
      total_interviews: 0,
      completion_rate: 0,
      independence_rate: 0,
      child_voice_rate: 0,
      exploitation_screening_rate: 0,
      action_completion_rate: 0,
      information_sharing_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = interviews.length;

  const completed = interviews.filter(i => i.interview_status === "completed").length;
  const completionRate = pct(completed, total);

  const independent = interviews.filter(i => i.independent_of_home).length;
  const independenceRate = pct(independent, total);

  const withVoice = interviews.filter(i => i.has_child_voice).length;
  const childVoiceRate = pct(withVoice, total);

  // Exploitation screening: interviews where exploitation is flagged or risks identified
  const withExploitationScreening = interviews.filter(i => i.exploitation_concerns || i.risks_identified_count > 0).length;
  const exploitationScreeningRate = pct(withExploitationScreening, total);

  const totalActions = interviews.reduce((s, i) => s + i.actions_total, 0);
  const completedActions = interviews.reduce((s, i) => s + i.actions_completed, 0);
  const actionCompletionRate = pct(completedActions, totalActions);

  const withSharing = interviews.filter(i => i.shared_with_count > 0).length;
  const sharingRate = pct(withSharing, total);

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Completion rate
  if (total === 0) {
    score -= 3;
  } else {
    if (completionRate >= 90) score += 6;
    else if (completionRate >= 70) score += 2;
    else if (completionRate < 50) score -= 5;
  }

  // Modifier 2: Independence rate (independent person conducts interview)
  if (total === 0) {
    // no adjustment
  } else {
    if (independenceRate >= 80) score += 5;
    else if (independenceRate >= 50) score += 2;
    else if (independenceRate < 30) score -= 5;
  }

  // Modifier 3: Child voice captured
  if (total === 0) {
    score -= 1;
  } else {
    if (childVoiceRate >= 90) score += 5;
    else if (childVoiceRate >= 70) score += 2;
    else if (childVoiceRate < 50) score -= 4;
  }

  // Modifier 4: Action completion
  if (totalActions === 0 && total > 0) {
    score += 2;
  } else if (totalActions === 0) {
    // no interviews
  } else {
    if (actionCompletionRate >= 85) score += 5;
    else if (actionCompletionRate >= 60) score += 2;
    else if (actionCompletionRate < 40) score -= 5;
  }

  // Modifier 5: Information sharing
  if (total === 0) {
    score -= 1;
  } else {
    if (sharingRate >= 80) score += 4;
    else if (sharingRate >= 50) score += 1;
    else if (sharingRate < 30) score -= 4;
  }

  // Modifier 6: Push/pull factor analysis depth
  const withFactors = interviews.filter(i => i.has_push_factors || i.has_pull_factors).length;
  const factorRate = pct(withFactors, total);
  if (total === 0) {
    score -= 2;
  } else {
    if (factorRate >= 80) score += 5;
    else if (factorRate >= 50) score += 2;
    else if (factorRate < 30) score -= 3;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Return home interviews are thorough, independent and drive protective action for children";
      break;
    case "good":
      headline = "Good return interview practice with effective child voice capture and follow-through";
      break;
    case "adequate":
      headline = "Return interviews are completed but need stronger independence and deeper analysis";
      break;
    case "inadequate":
      headline = "Return interview practice is inadequate — children at risk are not being properly heard";
      break;
    default:
      headline = "No data available for return interview analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (completionRate >= 90 && total > 0) strengths.push("Return interviews are completed for virtually all missing episodes");
  if (independenceRate >= 80 && total > 0) strengths.push("Interviews are conducted by independent persons — children can speak freely");
  if (childVoiceRate >= 90 && total > 0) strengths.push("Children's voices are consistently captured in return interviews");
  if (actionCompletionRate >= 85 && totalActions > 0) strengths.push("Actions from return interviews are followed through effectively");
  if (sharingRate >= 80 && total > 0) strengths.push("Information is shared with relevant professionals after every interview");
  if (factorRate >= 80 && total > 0) strengths.push("Push and pull factors are thoroughly analysed to understand why children go missing");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No return interviews recorded — statutory safeguarding requirement is not being met");
  if (completionRate < 50 && total > 0) concerns.push("Most return interviews are not completed — children are not being heard after missing episodes");
  if (independenceRate < 30 && total > 0) concerns.push("Return interviews lack independence — children may not feel safe to disclose");
  if (childVoiceRate < 50 && total > 0) concerns.push("Children's views are missing from most return interviews");
  if (actionCompletionRate < 40 && totalActions > 0) concerns.push("Actions from return interviews are not being completed — learning is lost");
  if (sharingRate < 30 && total > 0) concerns.push("Interview findings are rarely shared with partners — safeguarding intelligence is siloed");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: ReturnInterviewQualityResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Implement return home interviews for all missing episodes as a statutory requirement", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }
  if (completionRate < 70 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure return interviews are offered and completed within 72 hours of every return", urgency: "immediate", regulatory_ref: "SCCIF Safeguarding" });
  }
  if (independenceRate < 50 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Commission independent return interviewers to ensure children can speak freely", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }
  if (childVoiceRate < 70 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Strengthen child voice capture in return interviews using creative engagement tools", urgency: "soon", regulatory_ref: "SCCIF Voice of Child" });
  }
  if (actionCompletionRate < 60 && totalActions > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Track and complete all actions arising from return interviews to close the learning loop", urgency: "soon", regulatory_ref: "SCCIF Safeguarding" });
  }
  if (sharingRate < 50 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Share return interview findings with social workers and police as standard practice", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: ReturnInterviewQualityResult["insights"] = [];

  if (completionRate >= 90 && independenceRate >= 80 && childVoiceRate >= 90 && total >= 5) {
    insights.push({ text: "Return interview practice is exemplary — children are heard, protected and understood after every missing episode", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "No return interviews means the home cannot demonstrate it understands why children go missing — a critical regulatory gap", severity: "critical" });
  }
  if (independenceRate < 30 && total > 0) {
    insights.push({ text: "Without independent interviewers, children may not disclose exploitation, abuse or peer pressure", severity: "warning" });
  }
  if (childVoiceRate >= 90 && total > 0) {
    insights.push({ text: "Strong child voice capture means the home truly understands what drives missing behaviour", severity: "positive" });
  }
  if (actionCompletionRate >= 85 && totalActions > 0) {
    insights.push({ text: "Actions from return interviews are completed — the home learns and adapts from every incident", severity: "positive" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    interview_rating: rating,
    interview_score: score,
    headline,
    total_interviews: total,
    completion_rate: completionRate,
    independence_rate: independenceRate,
    child_voice_rate: childVoiceRate,
    exploitation_screening_rate: exploitationScreeningRate,
    action_completion_rate: actionCompletionRate,
    information_sharing_rate: sharingRate,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
