// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF REFLECTIVE PRACTICE INTELLIGENCE ENGINE
// Tracks staff reflections, supervision theme resolution, shadowing quality,
// and team meeting effectiveness to ensure a learning-oriented workforce.
// Pure deterministic engine. CHR 2015 Reg 32/33.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface StaffReflectionInput {
  id: string;
  staff_id: string;
  date: string;
  shared_with_manager: boolean;
  has_development_goal: boolean;
  linked_to_incident: boolean;
}

export interface SupervisionThemeInput {
  id: string;
  theme_area: string;           // "practice" | "wellbeing" | "safeguarding" | "development" | "policy"
  frequency_across_team: number;
  status: string;               // "active" | "resolved" | "monitoring"
  has_organisational_response: boolean;
  has_training_implications: boolean;
}

export interface ShadowingInput {
  id: string;
  staff_id: string;
  date: string;
  hours_shadowed: number;
  shadow_number: number;
  total_shadows_required: number;
  signed_off: boolean;
  ready_to_work_solo: string;   // "yes" | "nearly" | "not_yet"
}

export interface StaffMeetingInput {
  id: string;
  date: string;
  attendees_count: number;
  total_staff: number;
  actions_from_previous_completed: number;
  actions_from_previous_total: number;
  new_actions_count: number;
}

export interface StaffReflectivePracticeInput {
  today: string;
  total_staff: number;
  reflections: StaffReflectionInput[];
  supervision_themes: SupervisionThemeInput[];
  shadowings: ShadowingInput[];
  staff_meetings: StaffMeetingInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ReflectivePracticeRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ReflectivePracticeResult {
  reflective_rating: ReflectivePracticeRating;
  reflective_score: number;
  headline: string;
  staff_reflecting: number;
  reflection_sharing_rate: number;
  shadowing_completion_rate: number;
  meeting_attendance_rate: number;
  themes_resolved_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function ratingFromScore(score: number): ReflectivePracticeRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeStaffReflectivePractice(
  input: StaffReflectivePracticeInput,
): ReflectivePracticeResult {
  const { total_staff, reflections, supervision_themes, shadowings, staff_meetings } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_staff === 0) {
    return {
      reflective_rating: "insufficient_data",
      reflective_score: 0,
      headline: "No active staff registered.",
      staff_reflecting: 0,
      reflection_sharing_rate: 0,
      shadowing_completion_rate: 0,
      meeting_attendance_rate: 0,
      themes_resolved_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Derived metrics ───────────────────────────────────────────────────

  const uniqueStaffReflecting = new Set(reflections.map((r) => r.staff_id)).size;
  const reflectionRate = pct(uniqueStaffReflecting, total_staff);

  const sharedCount = reflections.filter((r) => r.shared_with_manager).length;
  const sharedRate = pct(sharedCount, reflections.length);

  const goalCount = reflections.filter((r) => r.has_development_goal).length;
  const goalRate = pct(goalCount, reflections.length);

  const incidentLinkedCount = reflections.filter((r) => r.linked_to_incident).length;
  const incidentLinkedRate = pct(incidentLinkedCount, reflections.length);

  const resolvedThemes = supervision_themes.filter((t) => t.status === "resolved").length;
  const resolvedRate = pct(resolvedThemes, supervision_themes.length);

  const signedOffShadowings = shadowings.filter((s) => s.signed_off).length;
  const signedOffRate = pct(signedOffShadowings, shadowings.length);

  // Meeting attendance: average of (attendees_count / total_staff * 100) across meetings
  const avgAttendRate =
    staff_meetings.length === 0
      ? 0
      : Math.round(
          staff_meetings.reduce((sum, m) => sum + (m.total_staff === 0 ? 0 : (m.attendees_count / m.total_staff) * 100), 0) /
            staff_meetings.length,
        );

  // Action completion: total completed / total previous actions across all meetings
  const totalPrevActions = staff_meetings.reduce((s, m) => s + m.actions_from_previous_total, 0);
  const totalCompActions = staff_meetings.reduce((s, m) => s + m.actions_from_previous_completed, 0);
  const actionCompRate = pct(totalCompActions, totalPrevActions);

  // ── Scoring ───────────────────────────────────────────────────────────

  const BASE_SCORE = 52;
  let score = BASE_SCORE;

  // Mod 1: Reflection engagement (±6)
  const mod1 =
    reflectionRate >= 80 ? 6 :
    reflectionRate >= 60 ? 3 :
    reflectionRate >= 40 ? 0 : -6;
  score += mod1;

  // Mod 2: Reflection quality — sharing & development goals (±5)
  const mod2 =
    reflections.length === 0 ? 0 :
    (sharedRate >= 80 && goalRate >= 80) ? 5 :
    (sharedRate >= 60 && goalRate >= 60) ? 2 :
    (sharedRate >= 40 || goalRate >= 40) ? 0 : -5;
  score += mod2;

  // Mod 3: Supervision themes management (±5)
  const mod3 =
    supervision_themes.length === 0 ? 2 :
    resolvedRate >= 80 ? 5 :
    resolvedRate >= 60 ? 2 :
    resolvedRate >= 40 ? 0 : -5;
  score += mod3;

  // Mod 4: Shadowing completion (±5)
  const mod4 =
    shadowings.length === 0 ? 1 :
    signedOffRate >= 90 ? 5 :
    signedOffRate >= 70 ? 3 :
    signedOffRate >= 50 ? 0 : -5;
  score += mod4;

  // Mod 5: Staff meeting attendance & action completion (±5)
  const mod5 =
    staff_meetings.length === 0 ? -2 :
    (avgAttendRate >= 80 && actionCompRate >= 80) ? 5 :
    (avgAttendRate >= 60 && actionCompRate >= 60) ? 2 :
    (avgAttendRate >= 40 || actionCompRate >= 40) ? 0 : -5;
  score += mod5;

  // Mod 6: Reflective culture indicators (±4)
  const mod6 =
    reflections.length === 0 ? -1 :
    (incidentLinkedRate >= 30 && reflectionRate >= 60) ? 4 :
    incidentLinkedRate >= 15 ? 2 :
    reflections.length > 0 ? 0 : -4;
  score += mod6;

  // Clamp
  score = Math.max(0, Math.min(score, 100));

  const reflective_rating = ratingFromScore(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];
  if (reflectionRate >= 80) {
    strengths.push("Over 80% of staff submit reflections — strong reflective culture.");
  }
  if (sharedRate >= 80 && reflections.length > 0) {
    strengths.push("Staff consistently share reflections with managers — openness supports development.");
  }
  if (resolvedRate >= 80 && supervision_themes.length > 0) {
    strengths.push("Supervision themes are actively resolved — organisational learning is embedded.");
  }
  if (signedOffRate >= 90 && shadowings.length > 0) {
    strengths.push("Shadowing sign-off rate over 90% — new staff are properly supported.");
  }
  if (actionCompRate >= 80 && staff_meetings.length > 0) {
    strengths.push("Staff meeting actions completed at over 80% — accountability is strong.");
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];
  if (reflectionRate < 40) {
    concerns.push("Under 40% of staff engage in reflection — practice may be unexamined.");
  }
  if (resolvedRate < 40 && supervision_themes.length >= 3) {
    concerns.push("Most supervision themes unresolved — systemic issues are not being addressed.");
  }
  if (signedOffRate < 50 && shadowings.length >= 2) {
    concerns.push("Under 50% of shadowings signed off — new staff may be working unsupported.");
  }
  if (staff_meetings.length === 0) {
    concerns.push("No staff meetings recorded — team communication and planning at risk.");
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;

  if (reflectionRate < 60) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Implement structured reflective practice time to increase staff engagement with reflective writing.",
      urgency: "soon",
      regulatory_ref: "Reg 33",
    });
  }
  if (resolvedRate < 60 && supervision_themes.length >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Escalate unresolved supervision themes to senior leadership for organisational response.",
      urgency: "immediate",
      regulatory_ref: "Reg 33",
    });
  }
  if (signedOffRate < 70 && shadowings.length >= 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Complete outstanding shadowing sign-offs to ensure new staff are safe to work independently.",
      urgency: "soon",
      regulatory_ref: "Reg 32",
    });
  }
  if (score < 65) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Develop reflective practice improvement plan covering reflections, supervision themes, and shadowing.",
      urgency: "planned",
      regulatory_ref: "Reg 33",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: { text: string; severity: string }[] = [];

  if (reflective_rating === "outstanding") {
    insights.push({
      text: "Reflective practice culture is embedded and active — staff learning from experience is a clear strength.",
      severity: "positive",
    });
  }
  if (reflective_rating === "inadequate") {
    insights.push({
      text: "Reflective practice is significantly weak — staff are not routinely examining or learning from their practice.",
      severity: "critical",
    });
  }
  if (incidentLinkedRate >= 30 && sharedRate >= 70) {
    insights.push({
      text: "Staff reflect on practice events and share findings with managers — strong learning loop after incidents.",
      severity: "positive",
    });
  }
  if (supervision_themes.length >= 5 && resolvedRate < 40) {
    insights.push({
      text: "Multiple supervision themes remain unresolved — systemic issues may be accumulating without organisational response.",
      severity: "warning",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  const headline =
    reflective_rating === "outstanding"
      ? "Outstanding reflective practice — staff learning culture is embedded and active."
      : reflective_rating === "good"
        ? `Good reflective practice — ${concerns.length > 0 ? `${concerns.length} area(s) to address` : "consistent engagement"}.`
        : reflective_rating === "adequate"
          ? `Adequate reflective practice — gaps in ${reflectionRate < 60 ? "engagement" : "quality"} need attention.`
          : "Reflective practice inadequate — staff development and organisational learning are significantly weak.";

  return {
    reflective_rating,
    reflective_score: score,
    headline,
    staff_reflecting: uniqueStaffReflecting,
    reflection_sharing_rate: sharedRate,
    shadowing_completion_rate: signedOffRate,
    meeting_attendance_rate: avgAttendRate,
    themes_resolved_rate: resolvedRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
