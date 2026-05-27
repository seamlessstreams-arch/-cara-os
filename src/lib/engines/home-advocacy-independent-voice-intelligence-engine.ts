// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ADVOCACY & INDEPENDENT VOICE INTELLIGENCE ENGINE
// Pure deterministic engine: advocacy access, independence of advocates,
// child voice capture, visit frequency, private sessions, and action follow-through.
// CHR 2015 Reg 7: "The children's wishes and feelings standard." SCCIF: Voice.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface AdvocacyRecordInput {
  id: string;
  child_id: string;
  advocacy_type: string; // "independent"|"issue_based"|"peer"|"legal"|"complaints"
  status: string; // "active"|"completed"|"pending_referral"|"declined_by_yp"
  has_visits: boolean;
  visit_count: number;
  private_session_count: number;
  actions_raised_count: number;
  has_child_view: boolean;
  has_home_response: boolean;
  issues_raised_count: number;
}

export interface AdvocacyVoiceInput {
  today: string;
  total_children: number;
  records: AdvocacyRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type AdvocacyVoiceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AdvocacyVoiceResult {
  advocacy_rating: AdvocacyVoiceRating;
  advocacy_score: number;
  headline: string;
  total_records: number;
  active_rate: number;
  children_with_advocacy_rate: number;
  independent_rate: number;
  child_voice_rate: number;
  private_session_rate: number;
  advocacy_type_variety: number;
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

function toRating(score: number): AdvocacyVoiceRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeAdvocacyIndependentVoice(
  input: AdvocacyVoiceInput,
): AdvocacyVoiceResult {
  const { records, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      advocacy_rating: "insufficient_data",
      advocacy_score: 0,
      headline: "No data available for advocacy intelligence analysis",
      total_records: 0,
      active_rate: 0,
      children_with_advocacy_rate: 0,
      independent_rate: 0,
      child_voice_rate: 0,
      private_session_rate: 0,
      advocacy_type_variety: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = records.length;

  const active = records.filter(r => r.status === "active" || r.status === "completed").length;
  const activeRate = pct(active, total);

  const uniqueChildren = new Set(records.map(r => r.child_id)).size;
  const childrenWithAdvocacyRate = pct(uniqueChildren, total_children);

  const independent = records.filter(r => r.advocacy_type === "independent" || r.advocacy_type === "legal").length;
  const independentRate = pct(independent, total);

  const withChildVoice = records.filter(r => r.has_child_view).length;
  const childVoiceRate = pct(withChildVoice, total);

  const withVisits = records.filter(r => r.has_visits).length;
  const totalPrivateSessions = records.reduce((sum, r) => sum + r.private_session_count, 0);
  const totalVisits = records.reduce((sum, r) => sum + r.visit_count, 0);
  const privateSessionRate = pct(totalPrivateSessions, totalVisits);

  const uniqueTypes = new Set(records.map(r => r.advocacy_type)).size;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Active/completed rate (engaged advocacy)
  if (total === 0) {
    score -= 3;
  } else {
    if (activeRate >= 80) score += 5;
    else if (activeRate >= 50) score += 2;
    else if (activeRate < 30) score -= 5;
  }

  // Modifier 2: Children with advocacy access (coverage)
  if (total === 0) {
    // no adjustment
  } else {
    if (childrenWithAdvocacyRate >= 80) score += 6;
    else if (childrenWithAdvocacyRate >= 50) score += 2;
    else if (childrenWithAdvocacyRate < 30) score -= 5;
  }

  // Modifier 3: Independent advocacy rate
  if (total === 0) {
    score -= 1;
  } else {
    if (independentRate >= 50) score += 5;
    else if (independentRate >= 25) score += 2;
    else if (independentRate < 10) score -= 4;
  }

  // Modifier 4: Child voice captured
  if (total === 0) {
    // no adjustment
  } else {
    if (childVoiceRate >= 90) score += 5;
    else if (childVoiceRate >= 60) score += 2;
    else if (childVoiceRate < 30) score -= 4;
  }

  // Modifier 5: Private session availability
  if (total === 0) {
    score -= 1;
  } else {
    if (privateSessionRate >= 60) score += 4;
    else if (privateSessionRate >= 30) score += 1;
    else if (privateSessionRate < 10) score -= 4;
  }

  // Modifier 6: Advocacy type variety
  if (total === 0) {
    score -= 2;
  } else {
    if (uniqueTypes >= 4) score += 5;
    else if (uniqueTypes >= 2) score += 2;
    else if (uniqueTypes <= 1) score -= 3;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Children have excellent access to independent advocacy — their voices are heard and acted upon";
      break;
    case "good":
      headline = "Good advocacy provision with strong independent voice support for children";
      break;
    case "adequate":
      headline = "Advocacy is available but access, independence and child voice need strengthening";
      break;
    case "inadequate":
      headline = "Advocacy provision is inadequate — children lack independent support to express their views";
      break;
    default:
      headline = "No data available for advocacy intelligence analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (activeRate >= 80 && total > 0) strengths.push("Advocacy referrals are consistently progressed — children receive timely support");
  if (childrenWithAdvocacyRate >= 80 && total > 0) strengths.push("Most children have access to an advocate — the home proactively facilitates independent voice");
  if (independentRate >= 50 && total > 0) strengths.push("Strong use of independent advocates ensures children have truly independent support");
  if (childVoiceRate >= 90 && total > 0) strengths.push("Children's own views are captured in nearly all advocacy records");
  if (privateSessionRate >= 60 && total > 0) strengths.push("Private sessions are prioritised — children can speak freely without staff present");
  if (uniqueTypes >= 4 && total > 0) strengths.push("Diverse advocacy types including independent, peer, legal and complaints support");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No advocacy records — children may not have access to independent support");
  if (activeRate < 30 && total > 0) concerns.push("Most advocacy referrals are inactive — children are not receiving ongoing support");
  if (childrenWithAdvocacyRate < 30 && total > 0) concerns.push("Very few children have any advocacy contact — access is severely limited");
  if (independentRate < 10 && total > 0) concerns.push("Almost no independent advocacy — children lack a truly independent voice");
  if (childVoiceRate < 30 && total > 0) concerns.push("Children's views are rarely captured in advocacy records — their voice is being lost");
  if (privateSessionRate < 10 && total > 0) concerns.push("Private sessions are almost non-existent — children cannot speak freely");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: AdvocacyVoiceResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Establish advocacy referral pathways and ensure every child knows how to access an advocate", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 7" });
  }
  if (childrenWithAdvocacyRate < 50 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Proactively offer advocacy to all children including those who have not requested it", urgency: "soon", regulatory_ref: "SCCIF Voice" });
  }
  if (independentRate < 25 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Increase use of independent advocates from organisations such as NYAS or Coram Voice", urgency: "soon", regulatory_ref: "CHR 2015 Reg 7" });
  }
  if (childVoiceRate < 60 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure the child's own words and views are recorded in every advocacy interaction", urgency: "immediate", regulatory_ref: "SCCIF Voice" });
  }
  if (privateSessionRate < 30 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Facilitate private sessions where children can speak to advocates without staff present", urgency: "planned", regulatory_ref: "CHR 2015 Reg 7" });
  }
  if (uniqueTypes < 2 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Diversify advocacy types to include peer mentoring, complaints support and legal advocacy", urgency: "planned", regulatory_ref: "SCCIF Voice" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: AdvocacyVoiceResult["insights"] = [];

  if (childVoiceRate >= 90 && independentRate >= 50 && childrenWithAdvocacyRate >= 80 && total >= 10) {
    insights.push({ text: "Advocacy provision is exemplary — children are empowered through independent voices that genuinely represent their wishes", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "No advocacy records means Ofsted cannot verify that children have independent support to express their views", severity: "critical" });
  }
  if (childVoiceRate < 30 && total > 0) {
    insights.push({ text: "Children's voices are absent from advocacy records — this undermines the purpose of advocacy itself", severity: "warning" });
  }
  if (childrenWithAdvocacyRate >= 80 && total > 0) {
    insights.push({ text: "Wide advocacy access shows the home actively promotes children's right to be heard", severity: "positive" });
  }
  if (uniqueTypes >= 4 && total > 0) {
    insights.push({ text: "Diverse advocacy provision means children can access the right type of support for their specific needs", severity: "positive" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    advocacy_rating: rating,
    advocacy_score: score,
    headline,
    total_records: total,
    active_rate: activeRate,
    children_with_advocacy_rate: childrenWithAdvocacyRate,
    independent_rate: independentRate,
    child_voice_rate: childVoiceRate,
    private_session_rate: privateSessionRate,
    advocacy_type_variety: uniqueTypes,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
