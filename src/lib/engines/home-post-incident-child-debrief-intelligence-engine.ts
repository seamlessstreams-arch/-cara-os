// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME POST-INCIDENT CHILD DEBRIEF INTELLIGENCE ENGINE
// Pure deterministic engine: debrief completion, timeliness, child readiness,
// voice capture depth, restorative actions, child-requested changes,
// follow-up scheduling, and method diversity.
// CHR 2015 Reg 13 (Behaviour management) / Reg 35 (Behaviour management).
// SCCIF: Helped and protected; Experiences and progress.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PostIncidentDebriefRecordInput {
  id: string;
  child_id: string;
  incident_date: string; // ISO date
  debrief_date: string; // ISO date
  debrief_method: string; // "conversation"|"drawing"|"visual_cards"|"walk_and_talk"|"written"|"through_advocate"
  child_ready_to_debrief: boolean;
  has_child_account: boolean;
  has_feelings_before_during: boolean;
  has_feelings_now: boolean;
  has_wishes_different: boolean;
  what_helped_count: number;
  what_did_not_help_count: number;
  child_requests_count: number;
  has_apologies_offered: boolean;
  has_apologies_received: boolean;
  repairs_agreed_count: number;
  child_accepts_outcome: boolean;
  has_support_needed: boolean;
  has_follow_up_date: boolean;
}

export interface PostIncidentDebriefInput {
  today: string;
  total_children: number;
  debriefs: PostIncidentDebriefRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type PostIncidentDebriefRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PostIncidentDebriefResult {
  debrief_rating: PostIncidentDebriefRating;
  debrief_score: number;
  headline: string;
  total_debriefs: number;
  children_debriefed_rate: number;
  timeliness_rate: number;
  child_readiness_rate: number;
  voice_depth_rate: number;
  restorative_action_rate: number;
  follow_up_rate: number;
  method_diversity: number;
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

function toRating(score: number): PostIncidentDebriefRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computePostIncidentDebrief(
  input: PostIncidentDebriefInput,
): PostIncidentDebriefResult {
  const { debriefs, total_children, today } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      debrief_rating: "insufficient_data",
      debrief_score: 0,
      headline: "No data available for post-incident debrief intelligence analysis",
      total_debriefs: 0,
      children_debriefed_rate: 0,
      timeliness_rate: 0,
      child_readiness_rate: 0,
      voice_depth_rate: 0,
      restorative_action_rate: 0,
      follow_up_rate: 0,
      method_diversity: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = debriefs.length;
  const uniqueChildren = new Set(debriefs.map(d => d.child_id)).size;
  const childrenDebriefedRate = pct(uniqueChildren, total_children);

  // Timeliness: debrief within 48 hours (2 days) of incident
  const timelyDebriefs = debriefs.filter(d => {
    if (!d.incident_date || !d.debrief_date) return false;
    const incidentMs = new Date(d.incident_date).getTime();
    const debriefMs = new Date(d.debrief_date).getTime();
    return (debriefMs - incidentMs) <= 2 * 86400000 && debriefMs >= incidentMs;
  });
  const timelinessRate = pct(timelyDebriefs.length, total);

  // Child readiness respected
  const readyDebriefs = debriefs.filter(d => d.child_ready_to_debrief);
  const childReadinessRate = pct(readyDebriefs.length, total);

  // Voice depth: debriefs with child_account + feelings_before_during + feelings_now
  const deepVoice = debriefs.filter(
    d => d.has_child_account && d.has_feelings_before_during && d.has_feelings_now,
  );
  const voiceDepthRate = pct(deepVoice.length, total);

  // Restorative actions: debriefs with repairs agreed or apologies (offered or received)
  const restorativeDebriefs = debriefs.filter(
    d => d.repairs_agreed_count > 0 || d.has_apologies_offered || d.has_apologies_received,
  );
  const restorativeActionRate = pct(restorativeDebriefs.length, total);

  // Follow-up scheduled
  const withFollowUp = debriefs.filter(d => d.has_follow_up_date).length;
  const followUpRate = pct(withFollowUp, total);

  // Method diversity
  const uniqueMethods = new Set(debriefs.map(d => d.debrief_method)).size;

  // Child requests for future
  const withRequests = debriefs.filter(d => d.child_requests_count > 0).length;

  // What helped / didn't help
  const withReflection = debriefs.filter(
    d => d.what_helped_count > 0 || d.what_did_not_help_count > 0,
  ).length;

  // Wishes different
  const withWishes = debriefs.filter(d => d.has_wishes_different).length;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Timeliness of debriefs
  if (total === 0) {
    score -= 3;
  } else {
    if (timelinessRate >= 80) score += 6;
    else if (timelinessRate >= 50) score += 2;
    else if (timelinessRate < 30) score -= 5;
  }

  // Modifier 2: Child readiness respected
  if (total === 0) {
    score -= 1;
  } else {
    if (childReadinessRate >= 85) score += 5;
    else if (childReadinessRate >= 60) score += 2;
    else if (childReadinessRate < 40) score -= 5;
  }

  // Modifier 3: Voice depth
  if (total === 0) {
    score -= 1;
  } else {
    if (voiceDepthRate >= 75) score += 5;
    else if (voiceDepthRate >= 45) score += 2;
    else if (voiceDepthRate < 20) score -= 4;
  }

  // Modifier 4: Restorative actions
  if (total === 0) {
    // no adjustment
  } else {
    if (restorativeActionRate >= 75) score += 5;
    else if (restorativeActionRate >= 50) score += 2;
    else if (restorativeActionRate < 25) score -= 4;
  }

  // Modifier 5: Follow-up scheduling
  if (total === 0) {
    score -= 1;
  } else {
    if (followUpRate >= 80) score += 4;
    else if (followUpRate >= 50) score += 1;
    else if (followUpRate < 20) score -= 4;
  }

  // Modifier 6: Method diversity and child requests
  if (total === 0) {
    score -= 2;
  } else {
    const requestRate = pct(withRequests, total);
    if (uniqueMethods >= 4 && requestRate >= 60) score += 5;
    else if (uniqueMethods >= 2 || requestRate >= 40) score += 2;
    else if (uniqueMethods < 2 && requestRate < 20) score -= 3;
  }

  score = clamp(score, 0, 100);

  const debrief_rating = total === 0 && debriefs.length === 0
    ? "insufficient_data"
    : toRating(score);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (timelinessRate >= 80 && total > 0)
    strengths.push("Debriefs are conducted promptly — children's experiences are explored while events are fresh");
  if (childReadinessRate >= 85 && total > 0)
    strengths.push("Children's readiness to debrief is consistently assessed — the process respects emotional capacity");
  if (voiceDepthRate >= 75 && total > 0)
    strengths.push("Debriefs capture deep child voice — accounts, feelings and reflections are thoroughly documented");
  if (restorativeActionRate >= 75 && total > 0)
    strengths.push("Restorative actions are embedded in the debrief process — repairs and apologies support healing");
  if (followUpRate >= 80 && total > 0)
    strengths.push("Follow-up is consistently scheduled after debriefs — continuity of support is assured");
  if (uniqueMethods >= 4 && total > 0)
    strengths.push("Diverse debrief methods are used — children can engage through the approach that suits them best");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0 && total_children > 0)
    concerns.push("No post-incident debriefs exist — children's experiences of incidents are not being formally explored");
  if (timelinessRate < 30 && total > 0)
    concerns.push("Debriefs are frequently delayed — children may not receive timely support after incidents");
  if (childReadinessRate < 40 && total > 0)
    concerns.push("Child readiness is often not confirmed — debriefs may be conducted before children are emotionally ready");
  if (voiceDepthRate < 20 && total > 0)
    concerns.push("Debriefs lack depth — children's accounts, feelings and reflections are not consistently captured");
  if (restorativeActionRate < 25 && total > 0)
    concerns.push("Restorative actions are rare — the debrief process is not supporting relational repair");
  if (followUpRate < 20 && total > 0)
    concerns.push("Follow-up is rarely scheduled — children may lack ongoing support after incidents");

  // ── Recommendations ────────────────────────────────────────────────────
  const recommendations: PostIncidentDebriefResult["recommendations"] = [];
  let rank = 0;

  if (total === 0 && total_children > 0)
    recommendations.push({ rank: ++rank, recommendation: "Implement a structured post-incident debrief process for all children involved in incidents", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 13" });
  if (timelinessRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Ensure debriefs occur within 48 hours of incidents while respecting child readiness", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 35" });
  if (voiceDepthRate < 45 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Deepen debrief quality by capturing children's full account, feelings before/during/after, and what they wish had been different", urgency: "soon", regulatory_ref: "SCCIF Experiences" });
  if (restorativeActionRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Embed restorative practices in the debrief process — facilitate apologies, acknowledgements and agreed repairs", urgency: "soon", regulatory_ref: "CHR 2015 Reg 13" });
  if (followUpRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Schedule follow-up for every debrief to ensure children receive ongoing support after incidents", urgency: "soon", regulatory_ref: "SCCIF Helped & Protected" });
  if (uniqueMethods < 2 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Offer diverse debrief methods — not all children engage through conversation; consider drawing, visual cards or walk-and-talk", urgency: "planned", regulatory_ref: "CHR 2015 Reg 35" });

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: PostIncidentDebriefResult["insights"] = [];
  if (total === 0 && total_children > 0)
    insights.push({ text: "No debrief records means Ofsted cannot verify children's post-incident experiences are explored or supported", severity: "critical" });
  if (total > 0 && voiceDepthRate >= 75 && restorativeActionRate >= 75)
    insights.push({ text: "Deep child voice combined with restorative actions demonstrates a genuinely child-centred response to incidents", severity: "positive" });
  if (total > 0 && timelinessRate >= 80 && childReadinessRate >= 85)
    insights.push({ text: "Prompt debriefs with readiness assessment show the home balances timeliness with emotional sensitivity", severity: "positive" });
  if (pct(withWishes, total) >= 60 && total > 0)
    insights.push({ text: "Children regularly share what they wish had been different — this feedback loop drives practice improvement", severity: "positive" });
  if (pct(withReflection, total) < 30 && total > 0)
    insights.push({ text: "Limited reflection on what helped and what did not suggests debriefs are not fully learning-oriented", severity: "warning" });
  if (uniqueMethods >= 4 && total > 0)
    insights.push({ text: "Multiple debrief methods demonstrate creative, child-centred approaches to post-incident support", severity: "positive" });

  // ── Headline ───────────────────────────────────────────────────────────
  let headline = "";
  if (debrief_rating === "insufficient_data") {
    headline = "No data available for post-incident debrief intelligence analysis";
  } else if (debrief_rating === "outstanding") {
    headline = "Outstanding post-incident debriefs — timely, child-led, restorative and deeply reflective";
  } else if (debrief_rating === "good") {
    headline = "Good debrief practice with consistent child voice and timely follow-through";
  } else if (debrief_rating === "adequate") {
    headline = "Debriefs occur but timeliness, depth or restorative elements need strengthening";
  } else {
    headline = "Inadequate debrief practice — children's post-incident experiences are not being properly explored";
  }

  return {
    debrief_rating,
    debrief_score: score,
    headline,
    total_debriefs: total,
    children_debriefed_rate: childrenDebriefedRate,
    timeliness_rate: timelinessRate,
    child_readiness_rate: childReadinessRate,
    voice_depth_rate: voiceDepthRate,
    restorative_action_rate: restorativeActionRate,
    follow_up_rate: followUpRate,
    method_diversity: uniqueMethods,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
