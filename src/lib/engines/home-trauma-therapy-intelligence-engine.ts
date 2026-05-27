// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME TRAUMA THERAPY INTELLIGENCE ENGINE
// Pure deterministic engine: therapy attendance, session-level mood improvement,
// child engagement, modality diversity, escalation patterns, regulation
// strategy use, and child voice in therapeutic process.
// CHR 2015 Reg 6 (Health and well-being) / Reg 9 (Quality of care).
// SCCIF: Health and well-being; Experiences and progress.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface TraumaTherapyRecordInput {
  id: string;
  child_id: string;
  session_date: string; // ISO date
  modality: string;
  session_format: string;
  session_length_minutes: number;
  attended: boolean;
  child_presentation: string; // "engaged"|"withdrawn"|"avoidant"|"distressed"|"mixed"|"building_trust"
  pre_session_mood: number; // 1-10
  post_session_mood: number; // 1-10
  regulation_strategy_count: number;
  has_escalation_flags: boolean;
  escalation_flag_count: number;
  has_child_voice: boolean;
  has_staff_observation: boolean;
  has_next_session: boolean;
}

export interface TraumaTherapyInput {
  today: string;
  total_children: number;
  logs: TraumaTherapyRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type TraumaTherapyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface TraumaTherapyResult {
  therapy_rating: TraumaTherapyRating;
  therapy_score: number;
  headline: string;
  total_sessions: number;
  children_in_therapy_rate: number;
  attendance_rate: number;
  mood_improvement_rate: number;
  engagement_rate: number;
  child_voice_rate: number;
  modality_diversity: number;
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

function toRating(score: number): TraumaTherapyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeTraumaTherapy(
  input: TraumaTherapyInput,
): TraumaTherapyResult {
  const { logs, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      therapy_rating: "insufficient_data",
      therapy_score: 0,
      headline: "No data available for trauma therapy intelligence analysis",
      total_sessions: 0,
      children_in_therapy_rate: 0,
      attendance_rate: 0,
      mood_improvement_rate: 0,
      engagement_rate: 0,
      child_voice_rate: 0,
      modality_diversity: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = logs.length;
  const uniqueChildren = new Set(logs.map(l => l.child_id)).size;
  const childrenInTherapyRate = pct(uniqueChildren, total_children);

  const attended = logs.filter(l => l.attended).length;
  const attendanceRate = pct(attended, total);

  const attendedSessions = logs.filter(l => l.attended);
  const moodImproved = attendedSessions.filter(l => l.post_session_mood > l.pre_session_mood).length;
  const moodImprovementRate = pct(moodImproved, attendedSessions.length);

  const engaged = attendedSessions.filter(l => l.child_presentation === "engaged" || l.child_presentation === "building_trust").length;
  const engagementRate = pct(engaged, attendedSessions.length);

  const withChildVoice = logs.filter(l => l.has_child_voice).length;
  const childVoiceRate = pct(withChildVoice, total);

  const uniqueModalities = new Set(logs.map(l => l.modality)).size;

  const withEscalation = logs.filter(l => l.has_escalation_flags).length;
  const totalEscalations = logs.reduce((s, l) => s + l.escalation_flag_count, 0);
  const withRegulationStrategies = attendedSessions.filter(l => l.regulation_strategy_count > 0).length;

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Children in therapy (coverage)
  if (total === 0) {
    score -= 3;
  } else {
    if (childrenInTherapyRate >= 80) score += 6;
    else if (childrenInTherapyRate >= 50) score += 2;
    else if (childrenInTherapyRate < 30) score -= 5;
  }

  // Modifier 2: Attendance rate
  if (total === 0) {
    score -= 1;
  } else {
    if (attendanceRate >= 85) score += 5;
    else if (attendanceRate >= 60) score += 2;
    else if (attendanceRate < 40) score -= 5;
  }

  // Modifier 3: Mood improvement after sessions
  if (total === 0) {
    score -= 1;
  } else {
    if (attendedSessions.length === 0) score -= 1;
    else if (moodImprovementRate >= 70) score += 5;
    else if (moodImprovementRate >= 40) score += 2;
    else if (moodImprovementRate < 20) score -= 4;
  }

  // Modifier 4: Child engagement in sessions
  if (total === 0) {
    // no adjustment
  } else {
    if (attendedSessions.length === 0) score -= 1;
    else if (engagementRate >= 75) score += 5;
    else if (engagementRate >= 50) score += 2;
    else if (engagementRate < 25) score -= 4;
  }

  // Modifier 5: Child voice captured
  if (total === 0) {
    score -= 1;
  } else {
    if (childVoiceRate >= 80) score += 4;
    else if (childVoiceRate >= 50) score += 1;
    else if (childVoiceRate < 20) score -= 4;
  }

  // Modifier 6: Modality diversity
  if (total === 0) {
    score -= 2;
  } else {
    if (uniqueModalities >= 4) score += 5;
    else if (uniqueModalities >= 2) score += 2;
    else if (uniqueModalities < 2) score -= 3;
  }

  score = clamp(score, 0, 100);

  const therapy_rating = total === 0 && logs.length === 0
    ? "insufficient_data"
    : toRating(score);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (childrenInTherapyRate >= 80 && total > 0)
    strengths.push("Most children are engaged in therapeutic support — the home prioritises trauma-informed recovery");
  if (attendanceRate >= 85 && total > 0)
    strengths.push("Therapy attendance is excellent — children are consistently supported to attend their sessions");
  if (moodImprovementRate >= 70 && attendedSessions.length > 0)
    strengths.push("Mood improvement after sessions indicates therapy is having a positive emotional impact");
  if (engagementRate >= 75 && attendedSessions.length > 0)
    strengths.push("Children are actively engaged in their therapeutic sessions — building trust and therapeutic alliance");
  if (childVoiceRate >= 80 && total > 0)
    strengths.push("Children's voices are consistently captured in therapy records — their experience shapes the therapeutic journey");
  if (uniqueModalities >= 4 && total > 0)
    strengths.push("Diverse therapy modalities are available — children receive approaches tailored to their individual needs");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0 && total_children > 0)
    concerns.push("No trauma therapy records — children's therapeutic needs are not being formally addressed");
  if (childrenInTherapyRate < 50 && total > 0)
    concerns.push("Fewer than half of children are receiving therapy — therapeutic support may not be reaching those who need it");
  if (attendanceRate < 40 && total > 0)
    concerns.push("Therapy attendance is low — sessions are being missed, undermining therapeutic progress");
  if (moodImprovementRate < 20 && attendedSessions.length > 0)
    concerns.push("Mood rarely improves after therapy sessions — the current approach may not be effective for these children");
  if (engagementRate < 25 && attendedSessions.length > 0)
    concerns.push("Children are rarely engaged in sessions — therapeutic alliance may not be forming");
  if (childVoiceRate < 20 && total > 0)
    concerns.push("Children's voices are rarely captured in therapy records — their therapeutic experience is undocumented");
  if (totalEscalations > 5)
    concerns.push("Multiple escalation flags across therapy sessions suggest unresolved therapeutic risk factors");

  // ── Recommendations ────────────────────────────────────────────────────
  const recommendations: TraumaTherapyResult["recommendations"] = [];
  let rank = 0;

  if (total === 0 && total_children > 0)
    recommendations.push({ rank: ++rank, recommendation: "Arrange therapeutic assessments for all children and establish regular therapy provision", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 6" });
  if (attendanceRate < 60 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Investigate barriers to therapy attendance and implement support strategies", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 9" });
  if (moodImprovementRate < 40 && attendedSessions.length > 0)
    recommendations.push({ rank: ++rank, recommendation: "Review therapeutic approaches — consider alternative modalities if current methods are not improving outcomes", urgency: "soon", regulatory_ref: "CHR 2015 Reg 6" });
  if (childVoiceRate < 50 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Ensure children's views about their therapy are routinely captured and used to shape their therapeutic plan", urgency: "soon", regulatory_ref: "SCCIF Experiences" });
  if (uniqueModalities < 2 && total > 0)
    recommendations.push({ rank: ++rank, recommendation: "Explore additional therapy modalities to ensure children have access to approaches suited to their needs", urgency: "planned", regulatory_ref: "CHR 2015 Reg 9" });
  if (engagementRate < 50 && attendedSessions.length > 0)
    recommendations.push({ rank: ++rank, recommendation: "Work with therapists to build therapeutic alliance — consider adjusting session formats or environments", urgency: "soon", regulatory_ref: "SCCIF Experiences" });

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: TraumaTherapyResult["insights"] = [];
  if (total === 0 && total_children > 0)
    insights.push({ text: "No therapy records means Ofsted cannot verify how the home supports children's trauma recovery", severity: "critical" });
  if (total > 0 && moodImprovementRate >= 70 && engagementRate >= 75)
    insights.push({ text: "Strong mood improvement with high engagement indicates therapy is effectively supporting children's emotional recovery", severity: "positive" });
  if (totalEscalations > 3 && total > 0)
    insights.push({ text: "Escalation flags in therapy sessions may indicate unprocessed trauma or mismatched therapeutic approaches", severity: "warning" });
  if (withRegulationStrategies > 0 && attendedSessions.length > 0 && pct(withRegulationStrategies, attendedSessions.length) >= 70)
    insights.push({ text: "Children are learning and using regulation strategies after sessions — therapy is building practical coping skills", severity: "positive" });
  if (uniqueModalities >= 4 && total > 0)
    insights.push({ text: "Diverse therapeutic modalities demonstrate a personalised approach to each child's trauma journey", severity: "positive" });
  if (total > 0 && attendanceRate < 50)
    insights.push({ text: "Low attendance may signal anxiety about therapy, poor therapeutic match, or practical barriers the home should address", severity: "warning" });

  // ── Headline ───────────────────────────────────────────────────────────
  let headline = "";
  if (therapy_rating === "insufficient_data") {
    headline = "No data available for trauma therapy intelligence analysis";
  } else if (therapy_rating === "outstanding") {
    headline = "Outstanding trauma therapy provision — children attend regularly, engage deeply and show measurable emotional progress";
  } else if (therapy_rating === "good") {
    headline = "Good therapy provision with positive attendance and mood improvement patterns";
  } else if (therapy_rating === "adequate") {
    headline = "Therapy exists but attendance, engagement or mood outcomes need strengthening";
  } else {
    headline = "Inadequate therapy provision — children are not consistently accessing or benefiting from therapeutic support";
  }

  return {
    therapy_rating,
    therapy_score: score,
    headline,
    total_sessions: total,
    children_in_therapy_rate: childrenInTherapyRate,
    attendance_rate: attendanceRate,
    mood_improvement_rate: moodImprovementRate,
    engagement_rate: engagementRate,
    child_voice_rate: childVoiceRate,
    modality_diversity: uniqueModalities,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
