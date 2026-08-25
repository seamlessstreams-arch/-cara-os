// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME DAILY ROUTINE & CARE CONTINUITY INTELLIGENCE ENGINE
// Tracks daily routine personalisation, duty log completeness, shift note quality,
// cleaning standards, and sleep-in arrangements to ensure consistent, high-quality care.
// Pure deterministic engine. CHR 2015 Reg 9/40.
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets, rate } from "@/lib/metrics/rate";

// ── Input types ─────────────────────────────────────────────────────────────

export interface DailyRoutineInput {
  id: string;
  child_id: string;
  is_current: boolean;
  last_reviewed: string;
  personalised: boolean;
}

export interface DutyLogInput {
  id: string;
  date: string;
  shift_type: string;
  completed: boolean;
  incidents_recorded: number;
  handover_completed: boolean;
}

export interface ShiftNoteInput {
  id: string;
  staff_id: string;
  date: string;
  quality_adequate: boolean;
  child_observations_included: boolean;
}

export interface CleaningCheckInput {
  id: string;
  date: string;
  area: string;
  standard_met: boolean;
  issues_found: number;
  issues_resolved: number;
}

export interface SleepInInput {
  id: string;
  date: string;
  staff_id: string;
  wake_ups: number;
  response_adequate: boolean;
  handover_completed: boolean;
}

export interface DailyRoutineCareInput {
  today: string;
  total_children: number;
  total_staff: number;
  daily_routines: DailyRoutineInput[];
  duty_logs: DutyLogInput[];
  shift_notes: ShiftNoteInput[];
  cleaning_checks: CleaningCheckInput[];
  sleep_ins: SleepInInput[];
}

// ── Output types ────────────────────────────────────────────────────────────

export type DailyRoutineRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DailyRoutineResult {
  routine_rating: DailyRoutineRating;
  routine_score: number;
  headline: string;
  children_with_routines: number;
  /** null when the population is empty — nothing measured, not 0%. */
  duty_log_completion_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  shift_note_quality_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  cleaning_standard_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  sleep_in_response_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeDailyRoutineCare(
  input: DailyRoutineCareInput,
): DailyRoutineResult {
  const { total_children, daily_routines, duty_logs, shift_notes, cleaning_checks, sleep_ins } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_children === 0) {
    return {
      routine_rating: "insufficient_data",
      routine_score: 0,
      headline: "No children in placement — daily routine analysis not applicable.",
      children_with_routines: 0,
      duty_log_completion_rate: null,
      shift_note_quality_rate: null,
      cleaning_standard_rate: null,
      sleep_in_response_rate: null,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ───────────────────────────────────────────────────────────

  // Routine coverage
  const childrenWithRoutine = new Set(
    daily_routines
      .filter(r => r.is_current && r.personalised)
      .map(r => r.child_id),
  ).size;
  const routineRate = rate(childrenWithRoutine, total_children);

  // Duty log completeness
  const completedLogs = duty_logs.filter(l => l.completed).length;
  const completionRate = rate(completedLogs, duty_logs.length);
  const handoverLogs = duty_logs.filter(l => l.handover_completed).length;
  const handoverRate = rate(handoverLogs, duty_logs.length);

  // Shift note quality
  const qualityNotes = shift_notes.filter(n => n.quality_adequate).length;
  const qualityRate = rate(qualityNotes, shift_notes.length);
  const obsNotes = shift_notes.filter(n => n.child_observations_included).length;
  const obsRate = rate(obsNotes, shift_notes.length);

  // Cleaning standards
  const metChecks = cleaning_checks.filter(c => c.standard_met).length;
  const standardRate = rate(metChecks, cleaning_checks.length);

  // Sleep-in quality
  const adequateSleepIns = sleep_ins.filter(s => s.response_adequate).length;
  const responseRate = rate(adequateSleepIns, sleep_ins.length);
  const sleepHandovers = sleep_ins.filter(s => s.handover_completed).length;
  const sleepHandoverRate = rate(sleepHandovers, sleep_ins.length);

  // Issue resolution
  const totalIssues = cleaning_checks.reduce((sum, c) => sum + c.issues_found, 0);
  const totalResolved = cleaning_checks.reduce((sum, c) => sum + c.issues_resolved, 0);
  const resolveRate = rate(totalResolved, totalIssues);

  // ── Scoring ───────────────────────────────────────────────────────────
  let score = 52;

  // Mod 1: Daily routine coverage (±5)
  if (meets(routineRate, 90)) score += 5;
  else if (meets(routineRate, 75)) score += 3;
  else if (meets(routineRate, 50)) score += 0;
  else score -= 5;

  // Mod 2: Duty log completeness (±6)
  if (duty_logs.length === 0) {
    score -= 3;
  } else if (meets(completionRate, 95) && meets(handoverRate, 95)) {
    score += 6;
  } else if (meets(completionRate, 80) && meets(handoverRate, 80)) {
    score += 3;
  } else if (meets(completionRate, 60) && meets(handoverRate, 60)) {
    score += 0;
  } else {
    score -= 6;
  }

  // Mod 3: Shift note quality (±5)
  if (shift_notes.length === 0) {
    score -= 2;
  } else if (meets(qualityRate, 90) && meets(obsRate, 90)) {
    score += 5;
  } else if (meets(qualityRate, 75) && meets(obsRate, 75)) {
    score += 3;
  } else if (meets(qualityRate, 50) && meets(obsRate, 50)) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 4: Cleaning standards (±5)
  if (cleaning_checks.length === 0) {
    score -= 1;
  } else if (meets(standardRate, 95)) {
    score += 5;
  } else if (meets(standardRate, 80)) {
    score += 3;
  } else if (meets(standardRate, 60)) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 5: Sleep-in quality (±4)
  if (sleep_ins.length === 0) {
    score += 1;
  } else if (meets(responseRate, 95) && meets(sleepHandoverRate, 95)) {
    score += 4;
  } else if (meets(responseRate, 80) && meets(sleepHandoverRate, 80)) {
    score += 2;
  } else if (meets(responseRate, 60) && meets(sleepHandoverRate, 60)) {
    score += 0;
  } else {
    score -= 4;
  }

  // Mod 6: Issue resolution in cleaning (±4)
  if (totalIssues === 0) {
    score += 4;
  } else if (meets(resolveRate, 90)) {
    score += 4;
  } else if (meets(resolveRate, 70)) {
    score += 2;
  } else if (meets(resolveRate, 50)) {
    score += 0;
  } else {
    score -= 4;
  }

  // Clamp
  score = Math.max(0, Math.min(score, 100));

  // ── Rating ────────────────────────────────────────────────────────────
  let routine_rating: DailyRoutineRating;
  if (score >= 80) routine_rating = "outstanding";
  else if (score >= 65) routine_rating = "good";
  else if (score >= 45) routine_rating = "adequate";
  else routine_rating = "inadequate";

  // ── Strengths / Concerns / Recommendations / Insights ─────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  const insights: { text: string; severity: string }[] = [];
  let rank = 0;

  // Strengths
  if (meets(routineRate, 90)) {
    strengths.push("Personalised daily routines in place for over 90% of children — care is structured and individual.");
  }
  if (meets(completionRate, 95) && duty_logs.length > 0) {
    strengths.push("Duty logs completed at over 95% — operational accountability is strong.");
  }
  if (meets(qualityRate, 90) && shift_notes.length > 0) {
    strengths.push("Shift note quality over 90% — care continuity is assured.");
  }
  if (meets(standardRate, 95) && cleaning_checks.length > 0) {
    strengths.push("Cleaning standards met at over 95% — home environment is well maintained.");
  }
  if (meets(responseRate, 95) && sleep_ins.length > 0) {
    strengths.push("Sleep-in response quality over 95% — night care is reliable.");
  }

  // Concerns
  if (below(routineRate, 50)) {
    concerns.push("Under 50% of children have current personalised routines — care may lack structure.");
  }
  if (below(completionRate, 70) && duty_logs.length > 0) {
    concerns.push(`Duty log completion at ${completionRate}% — gaps in operational recording.`);
  }
  if (below(qualityRate, 60) && shift_notes.length > 0) {
    concerns.push(`Shift note quality at ${qualityRate}% — care continuity may be compromised.`);
  }
  if (below(standardRate, 60) && cleaning_checks.length > 0) {
    concerns.push(`Cleaning standards met at only ${standardRate}% — home environment concerns.`);
  }

  // Recommendations
  if (below(routineRate, 70)) {
    recommendations.push({ rank: ++rank, recommendation: "Establish personalised daily routines for all children to ensure structured, individualised care.", urgency: "soon", regulatory_ref: "Reg 9" });
  }
  if (below(completionRate, 80)) {
    recommendations.push({ rank: ++rank, recommendation: "Improve duty log completion rate to ensure full operational accountability across all shifts.", urgency: "immediate", regulatory_ref: "Reg 40" });
  }
  if (below(qualityRate, 75)) {
    recommendations.push({ rank: ++rank, recommendation: "Provide shift note writing training to improve detail and ensure care continuity between shifts.", urgency: "soon", regulatory_ref: "Reg 40" });
  }
  if (score < 65) {
    recommendations.push({ rank: ++rank, recommendation: "Develop care continuity improvement plan addressing routine coverage, recording quality, and handover practice.", urgency: "planned", regulatory_ref: "Reg 40" });
  }

  // Insights
  if (routine_rating === "outstanding") {
    insights.push({ text: "Care continuity is exemplary. Routines are personalised, handovers are seamless, and recording standards support outstanding practice. Ofsted will recognise this as a strength.", severity: "positive" });
  }
  if (routine_rating === "inadequate") {
    insights.push({ text: "Care continuity is critically compromised. Gaps in routines, recording, and handovers mean children may experience inconsistent care — this is a regulatory concern.", severity: "critical" });
  }
  if (meets(completionRate, 95) && meets(qualityRate, 90) && meets(handoverRate, 95)) {
    insights.push({ text: "Seamless care transitions demonstrated — duty logs, shift notes, and handovers are all at high standard, ensuring no child falls through the gaps between shifts.", severity: "positive" });
  }
  if (below(completionRate, 70) && below(qualityRate, 60)) {
    insights.push({ text: "Both duty log completion and shift note quality are below acceptable thresholds — potential for significant care gaps between shifts.", severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (routine_rating === "outstanding") {
    headline = "Outstanding daily care & continuity — routines are personalised, handovers seamless, and standards high.";
  } else if (routine_rating === "good") {
    headline = `Good daily care — ${concerns.length > 0 ? `${concerns.length} area(s) to address` : "consistent practice"}.`;
  } else if (routine_rating === "adequate") {
    headline = `Adequate daily care — ${below(routineRate, 70) ? "routine coverage" : "recording quality"} needs improvement.`;
  } else {
    headline = "Daily care & continuity inadequate — significant gaps in routines, recording, and standards.";
  }

  return {
    routine_rating,
    routine_score: score,
    headline,
    children_with_routines: childrenWithRoutine,
    duty_log_completion_rate: completionRate,
    shift_note_quality_rate: qualityRate,
    cleaning_standard_rate: standardRate,
    sleep_in_response_rate: responseRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
