// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HANDOVER CONTINUITY INTELLIGENCE ENGINE
// Home-level: analyses handover completion, sign-off coverage, child update
// quality, flag tracking, and incident linkage to assess continuity of care.
// CHR 2015 Reg 13 (Leadership & Management). SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface HandoverInput {
  id: string;
  shift_date: string;
  shift_from: string;
  shift_to: string;
  handover_time: string;
  completed_at: string | null;       // null = incomplete
  outgoing_staff_count: number;
  incoming_staff_count: number;
  signed_off_by: string | null;      // null = no manager sign-off
  sign_off_count: number;            // number of incoming staff who signed
  child_update_count: number;        // how many child updates included
  child_updates_with_mood: number;   // how many have a mood score
  child_updates_with_alerts: number; // how many have at least one alert
  total_children: number;            // total YP in the home
  flag_count: number;
  linked_incident_count: number;
  has_general_notes: boolean;
}

export interface HomeHandoverInput {
  today: string;
  handovers: HandoverInput[];
  lookback_days?: number;            // default 30
}

// ── Output Types ────────────────────────────────────────────────────────────

export type HandoverRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CompletionProfile {
  total_handovers: number;
  completed_count: number;
  incomplete_count: number;
  completion_rate: number;
}

export interface SignOffProfile {
  signed_off_count: number;         // handovers with manager sign-off
  sign_off_rate: number;            // % of handovers with manager sign-off
  avg_staff_sign_off_rate: number;  // avg % of incoming staff who signed per handover
  fully_signed_count: number;       // handovers where all incoming staff signed
}

export interface ChildCoverageProfile {
  avg_child_coverage: number;       // avg % of children covered per handover
  full_coverage_count: number;      // handovers covering all children
  mood_recording_rate: number;      // % of child updates with mood score
  alert_recording_rate: number;     // % of child updates with alerts (where alerts exist)
}

export interface ContinuityProfile {
  avg_flags_per_handover: number;
  handovers_with_flags: number;
  handovers_with_incidents: number;
  notes_recording_rate: number;     // % of handovers with general notes
}

export interface HandoverInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface HandoverRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeHandoverResult {
  handover_rating: HandoverRating;
  handover_score: number;
  headline: string;
  completion_profile: CompletionProfile;
  sign_off_profile: SignOffProfile;
  child_coverage_profile: ChildCoverageProfile;
  continuity_profile: ContinuityProfile;
  strengths: string[];
  concerns: string[];
  recommendations: HandoverRecommendation[];
  insights: HandoverInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): HandoverRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeHandoverContinuity(
  input: HomeHandoverInput,
): HomeHandoverResult {
  const { today, handovers: allHandovers, lookback_days = 30 } = input;

  // Filter to lookback window
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - lookback_days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const handovers = allHandovers.filter(h => h.shift_date >= cutoffStr && h.shift_date <= today);

  // Insufficient data
  if (handovers.length === 0) {
    return {
      handover_rating: "insufficient_data",
      handover_score: 0,
      headline: "No handover data found — shift handover records not available.",
      completion_profile: emptyCompletionProfile(),
      sign_off_profile: emptySignOffProfile(),
      child_coverage_profile: emptyCoverageProfile(),
      continuity_profile: emptyContinuityProfile(),
      strengths: [],
      concerns: ["No handover records — Ofsted expects a systematic handover process to ensure continuity of care."],
      recommendations: [{ rank: 1, recommendation: "Establish a formal handover process with documented completion, child updates, and staff sign-off at every shift change.", urgency: "immediate", regulatory_ref: "Reg 13" }],
      insights: [{ text: "No handover records found. Without documented handovers, there is no evidence that critical information about children is being communicated between shifts. Ofsted will assess how the home ensures continuity and safety through shift transitions.", severity: "critical" }],
    };
  }

  // ── Completion Profile ─────────────────────────────────────────────
  const completedCount = handovers.filter(h => h.completed_at !== null).length;
  const incompleteCount = handovers.length - completedCount;
  const completionRate = pct(completedCount, handovers.length);

  const completionProfile: CompletionProfile = {
    total_handovers: handovers.length,
    completed_count: completedCount,
    incomplete_count: incompleteCount,
    completion_rate: completionRate,
  };

  // ── Sign-Off Profile ──────────────────────────────────────────────
  const signedOffCount = handovers.filter(h => h.signed_off_by !== null).length;
  const signOffRate = pct(signedOffCount, handovers.length);

  const staffSignOffRates = handovers.map(h =>
    h.incoming_staff_count > 0 ? pct(h.sign_off_count, h.incoming_staff_count) : 0
  );
  const avgStaffSignOffRate = staffSignOffRates.length > 0
    ? Math.round(staffSignOffRates.reduce((a, b) => a + b, 0) / staffSignOffRates.length)
    : 0;

  const fullySignedCount = handovers.filter(h =>
    h.incoming_staff_count > 0 && h.sign_off_count >= h.incoming_staff_count
  ).length;

  const signOffProfile: SignOffProfile = {
    signed_off_count: signedOffCount,
    sign_off_rate: signOffRate,
    avg_staff_sign_off_rate: avgStaffSignOffRate,
    fully_signed_count: fullySignedCount,
  };

  // ── Child Coverage Profile ────────────────────────────────────────
  const coverageRates = handovers.map(h =>
    h.total_children > 0 ? pct(h.child_update_count, h.total_children) : 0
  );
  const avgChildCoverage = coverageRates.length > 0
    ? Math.round(coverageRates.reduce((a, b) => a + b, 0) / coverageRates.length)
    : 0;

  const fullCoverageCount = handovers.filter(h =>
    h.total_children > 0 && h.child_update_count >= h.total_children
  ).length;

  const totalChildUpdates = handovers.reduce((s, h) => s + h.child_update_count, 0);
  const totalWithMood = handovers.reduce((s, h) => s + h.child_updates_with_mood, 0);
  const totalWithAlerts = handovers.reduce((s, h) => s + h.child_updates_with_alerts, 0);
  const moodRecordingRate = pct(totalWithMood, totalChildUpdates);
  const alertRecordingRate = pct(totalWithAlerts, totalChildUpdates);

  const childCoverageProfile: ChildCoverageProfile = {
    avg_child_coverage: avgChildCoverage,
    full_coverage_count: fullCoverageCount,
    mood_recording_rate: moodRecordingRate,
    alert_recording_rate: alertRecordingRate,
  };

  // ── Continuity Profile ────────────────────────────────────────────
  const totalFlags = handovers.reduce((s, h) => s + h.flag_count, 0);
  const avgFlags = handovers.length > 0
    ? Math.round((totalFlags / handovers.length) * 10) / 10
    : 0;

  const handoversWithFlags = handovers.filter(h => h.flag_count > 0).length;
  const handoversWithIncidents = handovers.filter(h => h.linked_incident_count > 0).length;
  const notesRate = pct(
    handovers.filter(h => h.has_general_notes).length,
    handovers.length,
  );

  const continuityProfile: ContinuityProfile = {
    avg_flags_per_handover: avgFlags,
    handovers_with_flags: handoversWithFlags,
    handovers_with_incidents: handoversWithIncidents,
    notes_recording_rate: notesRate,
  };

  // ── Scoring ───────────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52+28 = 80
  let score = 52;

  // 1. Completion rate (±5)
  if (completionRate >= 90) score += 5;
  else if (completionRate >= 70) score += 2;
  else if (completionRate >= 50) score -= 1;
  else score -= 4;

  // 2. Manager sign-off rate (±4)
  if (signOffRate >= 80) score += 4;
  else if (signOffRate >= 60) score += 1;
  else if (signOffRate >= 30) score -= 1;
  else score -= 3;

  // 3. Staff sign-off coverage (±3)
  if (avgStaffSignOffRate >= 80) score += 3;
  else if (avgStaffSignOffRate >= 50) score += 1;
  else score -= 2;

  // 4. Child coverage (±4)
  if (avgChildCoverage >= 90) score += 4;
  else if (avgChildCoverage >= 70) score += 2;
  else if (avgChildCoverage >= 50) score -= 1;
  else score -= 3;

  // 5. Mood recording (±3)
  if (totalChildUpdates > 0) {
    if (moodRecordingRate >= 80) score += 3;
    else if (moodRecordingRate >= 50) score += 1;
    else score -= 2;
  }

  // 6. Full coverage consistency (±3)
  const fullCoverageRate = pct(fullCoverageCount, handovers.length);
  if (fullCoverageRate >= 80) score += 3;
  else if (fullCoverageRate >= 50) score += 1;
  else score -= 1;

  // 7. Notes recording (±3)
  if (notesRate >= 80) score += 3;
  else if (notesRate >= 50) score += 1;
  else score -= 1;

  // 8. Incident linkage bonus (±3)
  if (handoversWithIncidents > 0) {
    // Having incidents linked to handovers shows good practice
    const linkageRate = pct(handoversWithIncidents, handovers.length);
    if (linkageRate >= 30) score += 3;
    else score += 1;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (completionRate === 100) strengths.push("100% handover completion — every shift change has a documented handover.");
  else if (completionRate >= 90) strengths.push(`${completionRate}% handover completion rate — consistent documentation at shift changes.`);
  if (signOffRate >= 80) strengths.push(`${signOffRate}% manager sign-off rate — leadership oversight of handover quality.`);
  if (avgChildCoverage >= 90) strengths.push(`${avgChildCoverage}% average child coverage — all young people discussed at handovers.`);
  if (moodRecordingRate >= 80 && totalChildUpdates > 0) strengths.push(`${moodRecordingRate}% mood score recording — emotional wellbeing tracked at every transition.`);
  if (fullySignedCount === handovers.length && handovers.length > 0) strengths.push("All incoming staff signed off on every handover — full team acknowledgement.");
  if (notesRate >= 80) strengths.push("General notes recorded on most handovers — good contextual information sharing.");
  if (handoversWithIncidents > 0) strengths.push("Incidents linked to relevant handovers — good traceability between events and communication.");

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (incompleteCount > 0) concerns.push(`${incompleteCount} handover${incompleteCount > 1 ? "s" : ""} incomplete — critical information may not have been communicated.`);
  if (signOffRate < 50) concerns.push(`Only ${signOffRate}% of handovers have manager sign-off — insufficient leadership oversight.`);
  if (avgStaffSignOffRate < 50) concerns.push(`Average staff sign-off rate is ${avgStaffSignOffRate}% — incoming staff not consistently acknowledging handover information.`);
  if (avgChildCoverage < 70) concerns.push(`Only ${avgChildCoverage}% average child coverage — some young people not discussed at handovers.`);
  if (moodRecordingRate < 50 && totalChildUpdates > 0) concerns.push(`Only ${moodRecordingRate}% of child updates include mood scores — emotional wellbeing not consistently tracked.`);
  if (notesRate < 50) concerns.push(`Only ${notesRate}% of handovers have general notes — limited contextual information sharing.`);
  if (completionRate < 50) concerns.push("Fewer than half of handovers are completed — serious gap in shift communication.");

  // ── Recommendations ───────────────────────────────────────────────
  const recs: HandoverRecommendation[] = [];
  let rank = 1;

  if (completionRate < 70) {
    recs.push({ rank: rank++, recommendation: "Ensure all handovers are completed before staff leave the building — implement a sign-off gate at shift end.", urgency: "immediate", regulatory_ref: "Reg 13" });
  }
  if (signOffRate < 50) {
    recs.push({ rank: rank++, recommendation: "Implement manager sign-off as mandatory — leadership must evidence oversight of every handover.", urgency: "immediate", regulatory_ref: "Reg 13" });
  }
  if (avgChildCoverage < 70) {
    recs.push({ rank: rank++, recommendation: "Ensure every child is covered in every handover — use a template that lists all current young people.", urgency: "soon", regulatory_ref: "Reg 13" });
  }
  if (moodRecordingRate < 50 && totalChildUpdates > 0) {
    recs.push({ rank: rank++, recommendation: "Record a mood score for each child at every handover — this provides a real-time emotional wellbeing tracker.", urgency: "soon", regulatory_ref: "Reg 13" });
  }
  if (avgStaffSignOffRate < 50) {
    recs.push({ rank: rank++, recommendation: "Require all incoming staff to sign off on the handover before starting their shift — ensures information receipt.", urgency: "soon", regulatory_ref: "Reg 13" });
  }
  if (notesRate < 50) {
    recs.push({ rank: rank++, recommendation: "Add contextual notes to each handover — environmental issues, maintenance flags, and professional contacts.", urgency: "planned", regulatory_ref: "Reg 13" });
  }

  // ── Insights ──────────────────────────────────────────────────────
  const insights: HandoverInsight[] = [];

  if (completionRate >= 90 && signOffRate >= 80 && avgChildCoverage >= 90) {
    insights.push({ text: `Handover practice is exemplary — ${completionRate}% completion, ${signOffRate}% manager sign-off, and ${avgChildCoverage}% child coverage. Ofsted will see strong evidence that the home ensures continuity of care across shift changes, with every young person's needs communicated consistently.`, severity: "positive" });
  }
  if (incompleteCount > 0 && completionRate < 70) {
    insights.push({ text: `${incompleteCount} of ${handovers.length} handovers are incomplete. When handovers are not completed, critical safety information — medication changes, mood concerns, incidents — may be lost between shifts. This is a safeguarding risk that Ofsted will identify as a leadership failure.`, severity: "critical" });
  }
  if (signOffRate < 30) {
    insights.push({ text: `Only ${signOffRate}% of handovers have manager sign-off. Without leadership oversight of handovers, there is no assurance that the quality and accuracy of information shared is monitored. This weakens the home's evidence of effective management oversight.`, severity: "critical" });
  }
  if (avgChildCoverage < 50) {
    insights.push({ text: `Average child coverage is only ${avgChildCoverage}%. When young people are not discussed at handovers, incoming staff lack essential context about mood, behaviour, and risk. This compromises individualised care and may contribute to incidents.`, severity: "critical" });
  }
  if (moodRecordingRate >= 80 && avgChildCoverage >= 80 && totalChildUpdates > 0) {
    insights.push({ text: `Strong child-centred handover practice — ${moodRecordingRate}% mood recording and ${avgChildCoverage}% child coverage. This means incoming staff arrive informed about each young person's emotional state, enabling proactive, trauma-informed responses.`, severity: "positive" });
  }
  if (handoversWithFlags > 0 && handoversWithIncidents > 0) {
    insights.push({ text: `Handovers include ${totalFlags} flags and ${handoversWithIncidents} incident linkages. This demonstrates that handovers are being used as a live continuity tool — not just an administrative exercise — connecting safety events to shift communication.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding handover practice — ${completionRate}% completion, ${signOffRate}% sign-off, and ${avgChildCoverage}% child coverage across ${handovers.length} handovers.`;
  } else if (rating === "good") {
    headline = `Good handover continuity — consistent documentation with minor gaps in sign-off or coverage.`;
  } else if (rating === "adequate") {
    headline = "Adequate handover practice — completion and sign-off rates need improvement to ensure continuity.";
  } else {
    headline = "Handover practice is inadequate — incomplete handovers, low sign-off, or poor child coverage risk continuity of care.";
  }

  return {
    handover_rating: rating,
    handover_score: score,
    headline,
    completion_profile: completionProfile,
    sign_off_profile: signOffProfile,
    child_coverage_profile: childCoverageProfile,
    continuity_profile: continuityProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ──────────────────────────────────────────────────────────

function emptyCompletionProfile(): CompletionProfile {
  return { total_handovers: 0, completed_count: 0, incomplete_count: 0, completion_rate: 0 };
}

function emptySignOffProfile(): SignOffProfile {
  return { signed_off_count: 0, sign_off_rate: 0, avg_staff_sign_off_rate: 0, fully_signed_count: 0 };
}

function emptyCoverageProfile(): ChildCoverageProfile {
  return { avg_child_coverage: 0, full_coverage_count: 0, mood_recording_rate: 0, alert_recording_rate: 0 };
}

function emptyContinuityProfile(): ContinuityProfile {
  return { avg_flags_per_handover: 0, handovers_with_flags: 0, handovers_with_incidents: 0, notes_recording_rate: 0 };
}
