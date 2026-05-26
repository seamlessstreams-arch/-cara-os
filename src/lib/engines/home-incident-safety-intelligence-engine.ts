// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME INCIDENT SAFETY INTELLIGENCE ENGINE
// Home-level: synthesises incidents, restraints, notifiable events, and
// handover continuity to produce an overall safety intelligence score.
// CHR 2015 Reg 12, 13, 35, 40. SCCIF: "How well children are helped and
// protected" and "The effectiveness of leaders and managers."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface IncidentInput {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  child_id: string;
  date: string;                           // YYYY-MM-DD
  status: "open" | "closed" | "under_review";
  body_map_required: boolean;
  body_map_completed: boolean;
  requires_oversight: boolean;
  oversight_completed: boolean;
  notifications_sent: number;
  has_lessons_learned: boolean;
}

export interface RestraintInput {
  id: string;
  child_id: string;
  date: string;                           // YYYY-MM-DD
  duration_minutes: number;
  has_child_debrief: boolean;
  has_staff_debrief: boolean;
  body_map_completed: boolean;
  injury_count: number;
}

export interface NotifiableEventInput {
  id: string;
  date: string;                           // YYYY-MM-DD
  event_type: string;
  ofsted_status: string;
}

export interface HandoverInput {
  id: string;
  shift_date: string;                     // YYYY-MM-DD
  is_completed: boolean;
  is_signed_off: boolean;
  child_updates_count: number;
  flags_count: number;
  linked_incident_count: number;
}

export interface HomeIncidentSafetyInput {
  today: string;
  total_children: number;
  incidents: IncidentInput[];
  restraints: RestraintInput[];
  notifiable_events: NotifiableEventInput[];
  handovers: HandoverInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type IncidentSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface IncidentProfile {
  total_30d: number;
  total_90d: number;
  open_count: number;
  critical_count_30d: number;
  high_count_30d: number;
  by_type: { type: string; count: number }[];
  by_child: { child_id: string; count: number }[];
  body_map_compliance_rate: number;       // % of required body maps completed
  oversight_completion_rate: number;      // % of oversight-required incidents completed
  lessons_learned_rate: number;           // % of closed incidents with lessons
  trend: "improving" | "stable" | "worsening" | "insufficient_data";
}

export interface RestraintProfile {
  total_30d: number;
  total_90d: number;
  avg_duration_minutes: number | null;
  long_restraint_count: number;           // >10 min
  child_debrief_rate: number;             // 0-100
  staff_debrief_rate: number;             // 0-100
  body_map_rate: number;                  // 0-100
  injury_count: number;
  by_child: { child_id: string; count: number }[];
  trend: "improving" | "stable" | "worsening" | "insufficient_data";
}

export interface HandoverProfile {
  total_30d: number;
  completion_rate: number;                // % completed
  sign_off_rate: number;                  // % signed off
  avg_flags_per_handover: number;
  incident_linked_rate: number;           // % of handovers with linked incidents
}

export interface SafetyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SafetyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeIncidentSafetyResult {
  incident_safety_rating: IncidentSafetyRating;
  incident_safety_score: number;
  headline: string;
  incidents: IncidentProfile;
  restraints: RestraintProfile;
  handovers: HandoverProfile;
  strengths: string[];
  concerns: string[];
  recommendations: SafetyRecommendation[];
  insights: SafetyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): IncidentSafetyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeIncidentSafety(
  input: HomeIncidentSafetyInput,
): HomeIncidentSafetyResult {
  const { today, total_children, incidents, restraints, notifiable_events, handovers } = input;

  const totalData = incidents.length + restraints.length + notifiable_events.length + handovers.length;

  if (totalData < 2) {
    return {
      incident_safety_rating: "insufficient_data",
      incident_safety_score: 0,
      headline: "Insufficient safety data to produce an incident intelligence assessment.",
      incidents: emptyIncidents(),
      restraints: emptyRestraints(),
      handovers: emptyHandovers(),
      strengths: [],
      concerns: [],
      recommendations: [{ rank: 1, recommendation: "Begin recording incident and handover data to enable safety analysis.", urgency: "immediate", regulatory_ref: "Reg 12, 40" }],
      insights: [{ text: "Not enough data to assess home incident safety. Ensure incidents, restraints, and handovers are being recorded.", severity: "warning" }],
    };
  }

  // ── Incident Profile ────────────────────────────────────────────────────
  const inc30d = incidents.filter(i => { const d = daysBetween(i.date, today); return d >= 0 && d <= 30; });
  const inc90d = incidents.filter(i => { const d = daysBetween(i.date, today); return d >= 0 && d <= 90; });
  const openInc = incidents.filter(i => i.status === "open" || i.status === "under_review");
  const critical30d = inc30d.filter(i => i.severity === "critical").length;
  const high30d = inc30d.filter(i => i.severity === "high").length;

  // By type
  const typeMap = new Map<string, number>();
  inc90d.forEach(i => typeMap.set(i.type, (typeMap.get(i.type) ?? 0) + 1));
  const byType = [...typeMap.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // By child
  const childMap = new Map<string, number>();
  inc90d.forEach(i => childMap.set(i.child_id, (childMap.get(i.child_id) ?? 0) + 1));
  const byChild = [...childMap.entries()]
    .map(([child_id, count]) => ({ child_id, count }))
    .sort((a, b) => b.count - a.count);

  // Body map compliance
  const bodyMapRequired = incidents.filter(i => i.body_map_required);
  const bodyMapCompleted = bodyMapRequired.filter(i => i.body_map_completed);
  const bodyMapRate = bodyMapRequired.length > 0
    ? Math.round((bodyMapCompleted.length / bodyMapRequired.length) * 100)
    : 100;

  // Oversight completion
  const oversightRequired = incidents.filter(i => i.requires_oversight);
  const oversightDone = oversightRequired.filter(i => i.oversight_completed);
  const oversightRate = oversightRequired.length > 0
    ? Math.round((oversightDone.length / oversightRequired.length) * 100)
    : 100;

  // Lessons learned (from closed incidents)
  const closedInc = incidents.filter(i => i.status === "closed");
  const withLessons = closedInc.filter(i => i.has_lessons_learned);
  const lessonsRate = closedInc.length > 0
    ? Math.round((withLessons.length / closedInc.length) * 100)
    : 100;

  // Incident trend: compare first 45d vs last 45d of 90d window
  let incTrend: "improving" | "stable" | "worsening" | "insufficient_data" = "insufficient_data";
  if (inc90d.length >= 3) {
    const first45 = inc90d.filter(i => { const d = daysBetween(i.date, today); return d > 45 && d <= 90; });
    const last45 = inc90d.filter(i => { const d = daysBetween(i.date, today); return d >= 0 && d <= 45; });
    if (first45.length > 0 || last45.length > 0) {
      if (last45.length < first45.length - 1) incTrend = "improving";
      else if (last45.length > first45.length + 1) incTrend = "worsening";
      else incTrend = "stable";
    }
  }

  const incidentProfile: IncidentProfile = {
    total_30d: inc30d.length,
    total_90d: inc90d.length,
    open_count: openInc.length,
    critical_count_30d: critical30d,
    high_count_30d: high30d,
    by_type: byType,
    by_child: byChild,
    body_map_compliance_rate: bodyMapRate,
    oversight_completion_rate: oversightRate,
    lessons_learned_rate: lessonsRate,
    trend: incTrend,
  };

  // ── Restraint Profile ───────────────────────────────────────────────────
  const rst30d = restraints.filter(r => { const d = daysBetween(r.date, today); return d >= 0 && d <= 30; });
  const rst90d = restraints.filter(r => { const d = daysBetween(r.date, today); return d >= 0 && d <= 90; });

  const durations = rst90d.map(r => r.duration_minutes);
  const avgDuration = durations.length > 0
    ? Math.round((durations.reduce((s, v) => s + v, 0) / durations.length) * 10) / 10
    : null;
  const longRestraints = rst90d.filter(r => r.duration_minutes > 10).length;

  const childDebriefRate = rst90d.length > 0
    ? Math.round((rst90d.filter(r => r.has_child_debrief).length / rst90d.length) * 100)
    : 100;
  const staffDebriefRate = rst90d.length > 0
    ? Math.round((rst90d.filter(r => r.has_staff_debrief).length / rst90d.length) * 100)
    : 100;
  const rstBodyMapRate = rst90d.length > 0
    ? Math.round((rst90d.filter(r => r.body_map_completed).length / rst90d.length) * 100)
    : 100;
  const totalInjuries = rst90d.reduce((s, r) => s + r.injury_count, 0);

  // Restraint by child
  const rstChildMap = new Map<string, number>();
  rst90d.forEach(r => rstChildMap.set(r.child_id, (rstChildMap.get(r.child_id) ?? 0) + 1));
  const rstByChild = [...rstChildMap.entries()]
    .map(([child_id, count]) => ({ child_id, count }))
    .sort((a, b) => b.count - a.count);

  // Restraint trend
  let rstTrend: "improving" | "stable" | "worsening" | "insufficient_data" = "insufficient_data";
  if (rst90d.length >= 2) {
    const first45 = rst90d.filter(r => { const d = daysBetween(r.date, today); return d > 45 && d <= 90; });
    const last45 = rst90d.filter(r => { const d = daysBetween(r.date, today); return d >= 0 && d <= 45; });
    if (last45.length < first45.length) rstTrend = "improving";
    else if (last45.length > first45.length) rstTrend = "worsening";
    else rstTrend = "stable";
  }

  const restraintProfile: RestraintProfile = {
    total_30d: rst30d.length,
    total_90d: rst90d.length,
    avg_duration_minutes: avgDuration,
    long_restraint_count: longRestraints,
    child_debrief_rate: childDebriefRate,
    staff_debrief_rate: staffDebriefRate,
    body_map_rate: rstBodyMapRate,
    injury_count: totalInjuries,
    by_child: rstByChild,
    trend: rstTrend,
  };

  // ── Handover Profile ────────────────────────────────────────────────────
  const hnd30d = handovers.filter(h => {
    const d = daysBetween(h.shift_date, today);
    return d >= 0 && d <= 30;
  });

  const completionRate = hnd30d.length > 0
    ? Math.round((hnd30d.filter(h => h.is_completed).length / hnd30d.length) * 100)
    : 0;
  const signOffRate = hnd30d.length > 0
    ? Math.round((hnd30d.filter(h => h.is_signed_off).length / hnd30d.length) * 100)
    : 0;
  const avgFlags = hnd30d.length > 0
    ? Math.round((hnd30d.reduce((s, h) => s + h.flags_count, 0) / hnd30d.length) * 10) / 10
    : 0;
  const incLinkedRate = hnd30d.length > 0
    ? Math.round((hnd30d.filter(h => h.linked_incident_count > 0).length / hnd30d.length) * 100)
    : 0;

  const handoverProfile: HandoverProfile = {
    total_30d: hnd30d.length,
    completion_rate: completionRate,
    sign_off_rate: signOffRate,
    avg_flags_per_handover: avgFlags,
    incident_linked_rate: incLinkedRate,
  };

  // ── Scoring ─────────────────────────────────────────────────────────────
  // For safety, FEWER incidents and restraints is better. Start at 55.
  let score = 55;

  // Incident volume (±15)
  const incPer30d = inc30d.length;
  const incPerChild = total_children > 0 ? incPer30d / total_children : incPer30d;
  if (incPerChild === 0) score += 10;
  else if (incPerChild <= 1) score += 3;
  else if (incPerChild >= 3) score -= 10;
  else score -= 3;

  // Severity (±12)
  if (critical30d === 0 && high30d === 0) score += 8;
  else if (critical30d === 0) score += 2;
  else if (critical30d >= 2) score -= 12;
  else score -= 6;

  // Open incidents (±5)
  if (openInc.length === 0) score += 3;
  else if (openInc.length >= 4) score -= 5;
  else score -= 2;

  // Body map compliance (±5)
  if (bodyMapRate === 100) score += 3;
  else if (bodyMapRate < 80) score -= 5;

  // Oversight (±5)
  if (oversightRate === 100) score += 3;
  else if (oversightRate < 50) score -= 5;
  else if (oversightRate < 80) score -= 3;

  // Lessons learned (±3)
  if (lessonsRate >= 80) score += 3;
  else if (lessonsRate < 50) score -= 3;

  // Incident trend (±5)
  if (incTrend === "improving") score += 5;
  else if (incTrend === "worsening") score -= 5;

  // Restraints (±10) — fewer is better
  if (rst30d.length === 0) score += 6;
  else if (rst30d.length <= 1) score += 2;
  else if (rst30d.length >= 3) score -= 6;
  else score -= 2;

  // Restraint compliance (±8)
  if (rst90d.length > 0) {
    if (childDebriefRate === 100 && staffDebriefRate === 100) score += 5;
    else if (childDebriefRate < 80 || staffDebriefRate < 80) score -= 5;

    if (rstBodyMapRate === 100) score += 3;
    else if (rstBodyMapRate < 80) score -= 3;
  }

  // Injuries (±8)
  if (totalInjuries > 0) score -= 4 * Math.min(totalInjuries, 2);

  // Restraint trend (±3)
  if (rstTrend === "improving") score += 3;
  else if (rstTrend === "worsening") score -= 3;

  // Handovers (±8)
  if (hnd30d.length > 0) {
    if (completionRate === 100) score += 4;
    else if (completionRate < 80) score -= 4;

    if (signOffRate >= 80) score += 2;
    else if (signOffRate < 50) score -= 2;
  }

  // Notifiable events penalty
  const pendingNE = notifiable_events.filter(n => n.ofsted_status === "pending");
  if (pendingNE.length > 0) score -= 3 * Math.min(pendingNE.length, 3);

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (inc30d.length === 0) strengths.push("No incidents recorded in the last 30 days — home is in a calm, settled period.");
  if (critical30d === 0 && high30d === 0 && inc30d.length > 0) strengths.push("No critical or high-severity incidents in the last 30 days.");
  if (bodyMapRate === 100 && bodyMapRequired.length > 0) strengths.push("100% body map compliance — all required body maps completed.");
  if (lessonsRate >= 80 && closedInc.length > 0) strengths.push(`Lessons learned documented for ${lessonsRate}% of closed incidents — evidence of reflective practice.`);
  if (rst30d.length === 0 && restraints.length > 0) strengths.push("No restraints in the last 30 days — de-escalation strategies are working.");
  if (rst90d.length > 0 && childDebriefRate === 100 && staffDebriefRate === 100) strengths.push("100% debrief compliance for both children and staff after every restraint.");
  if (completionRate === 100 && hnd30d.length > 0) strengths.push("100% handover completion rate — continuity of care is strong.");
  if (incTrend === "improving") strengths.push("Incident trend is improving — evidence of effective preventative strategies.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (critical30d >= 2) concerns.push(`${critical30d} critical incidents in the last 30 days — pattern analysis and strategy review needed.`);
  else if (critical30d > 0) concerns.push(`${critical30d} critical incident in the last 30 days.`);
  if (openInc.length >= 3) concerns.push(`${openInc.length} incidents still open — timely closure and review is essential.`);
  if (bodyMapRate < 100 && bodyMapRequired.length > 0) concerns.push(`Body map compliance is ${bodyMapRate}% — ${bodyMapRequired.length - bodyMapCompleted.length} body map${bodyMapRequired.length - bodyMapCompleted.length > 1 ? "s" : ""} outstanding.`);
  if (oversightRate < 80 && oversightRequired.length > 0) concerns.push(`Manager oversight completion is only ${oversightRate}% — incidents require timely review.`);
  if (totalInjuries > 0) concerns.push(`${totalInjuries} injur${totalInjuries > 1 ? "ies" : "y"} recorded from restraints in the last 90 days.`);
  if (longRestraints > 0) concerns.push(`${longRestraints} restraint${longRestraints > 1 ? "s" : ""} exceeded 10 minutes — review proportionality.`);
  if (rst90d.length > 0 && childDebriefRate < 80) concerns.push(`Child debrief rate after restraint is only ${childDebriefRate}% — Reg 35 requires post-incident debriefs.`);
  if (completionRate < 80 && hnd30d.length > 0) concerns.push(`Handover completion rate is ${completionRate}% — information may be lost between shifts.`);
  if (incTrend === "worsening") concerns.push("Incident frequency is increasing — consider team reflection and strategy review.");

  // Concentration on one child
  if (byChild.length > 0 && byChild[0].count >= 4 && total_children > 1) {
    concerns.push(`${byChild[0].child_id} accounts for ${byChild[0].count} of ${inc90d.length} incidents (90d) — individual support plan may need review.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: SafetyRecommendation[] = [];
  let rank = 1;

  if (openInc.length >= 3) {
    recs.push({ rank: rank++, recommendation: `Review and close ${openInc.length} open incidents to ensure timely resolution and learning.`, urgency: "immediate", regulatory_ref: "Reg 40" });
  }
  if (pendingNE.length > 0) {
    recs.push({ rank: rank++, recommendation: `Submit ${pendingNE.length} pending Ofsted notification${pendingNE.length > 1 ? "s" : ""} — 24-hour statutory requirement.`, urgency: "immediate", regulatory_ref: "Reg 40" });
  }
  if (oversightRate < 80 && oversightRequired.length > 0) {
    recs.push({ rank: rank++, recommendation: `Complete manager oversight for ${oversightRequired.length - oversightDone.length} incident${oversightRequired.length - oversightDone.length > 1 ? "s" : ""}.`, urgency: "immediate", regulatory_ref: "Reg 13" });
  }
  if (totalInjuries > 0) {
    recs.push({ rank: rank++, recommendation: "Review all restraint-related injuries — assess technique, staffing levels, and de-escalation strategies.", urgency: "soon", regulatory_ref: "Reg 35" });
  }
  if (rst90d.length > 0 && childDebriefRate < 100) {
    recs.push({ rank: rank++, recommendation: "Ensure post-restraint child debriefs are completed for every incident.", urgency: "soon", regulatory_ref: "Reg 35" });
  }
  if (lessonsRate < 60 && closedInc.length > 0) {
    recs.push({ rank: rank++, recommendation: "Improve lessons-learned documentation — reflective practice is essential for continuous improvement.", urgency: "planned", regulatory_ref: "Reg 13" });
  }
  if (byChild.length > 0 && byChild[0].count >= 4) {
    recs.push({ rank: rank++, recommendation: `Review individual support strategies for ${byChild[0].child_id} — disproportionate incident involvement.`, urgency: "planned", regulatory_ref: "Reg 12" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: SafetyInsight[] = [];

  if (critical30d >= 2) {
    insights.push({ text: `${critical30d} critical incidents in 30 days represents a significant safety concern. Ofsted will examine pattern, response, and learning.`, severity: "critical" });
  }
  if (totalInjuries > 0) {
    insights.push({ text: `${totalInjuries} restraint-related injur${totalInjuries > 1 ? "ies" : "y"} in 90 days. Each injury must be individually reviewed, with technique and proportionality assessed.`, severity: "critical" });
  }
  if (pendingNE.length > 0) {
    insights.push({ text: `${pendingNE.length} notifiable event${pendingNE.length > 1 ? "s" : ""} awaiting Ofsted notification. Statutory breach requiring immediate action.`, severity: "critical" });
  }
  if (openInc.length >= 4) {
    insights.push({ text: `${openInc.length} open incidents suggest potential backlog in incident management. Timely closure is essential for learning and regulatory compliance.`, severity: "warning" });
  }
  if (inc30d.length === 0 && rst30d.length === 0 && hnd30d.length > 0) {
    insights.push({ text: "No incidents or restraints in 30 days with active handovers — evidence of a well-managed, settled home environment.", severity: "positive" });
  }
  if (incTrend === "improving" && rstTrend === "improving") {
    insights.push({ text: "Both incident and restraint trends are improving — preventative strategies and therapeutic approaches are having a positive impact.", severity: "positive" });
  }
  if (rst90d.length > 0 && childDebriefRate === 100 && staffDebriefRate === 100 && rstBodyMapRate === 100) {
    insights.push({ text: "Exemplary post-restraint practice: 100% compliance across child debriefs, staff debriefs, and body maps.", severity: "positive" });
  }
  if (rstTrend === "worsening") {
    insights.push({ text: "Restraint use is increasing — consider whether behaviour support plans, staffing levels, or environmental factors need review.", severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = "Incident safety is outstanding — minimal incidents, strong compliance, and effective learning culture.";
  } else if (rating === "good") {
    headline = `Good safety management overall — ${inc30d.length} incident${inc30d.length !== 1 ? "s" : ""} in 30 days with effective oversight.`;
  } else if (rating === "adequate") {
    const issues: string[] = [];
    if (openInc.length >= 3) issues.push("open incidents");
    if (critical30d > 0) issues.push("critical incidents");
    if (totalInjuries > 0) issues.push("restraint injuries");
    headline = `Adequate safety management — attention needed on ${issues.join(", ") || "several areas"}.`;
  } else {
    headline = "Incident safety is inadequate — significant concerns require urgent management attention.";
  }

  return {
    incident_safety_rating: rating,
    incident_safety_score: score,
    headline,
    incidents: incidentProfile,
    restraints: restraintProfile,
    handovers: handoverProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Defaults ──────────────────────────────────────────────────────────

function emptyIncidents(): IncidentProfile {
  return { total_30d: 0, total_90d: 0, open_count: 0, critical_count_30d: 0, high_count_30d: 0, by_type: [], by_child: [], body_map_compliance_rate: 0, oversight_completion_rate: 0, lessons_learned_rate: 0, trend: "insufficient_data" };
}

function emptyRestraints(): RestraintProfile {
  return { total_30d: 0, total_90d: 0, avg_duration_minutes: null, long_restraint_count: 0, child_debrief_rate: 0, staff_debrief_rate: 0, body_map_rate: 0, injury_count: 0, by_child: [], trend: "insufficient_data" };
}

function emptyHandovers(): HandoverProfile {
  return { total_30d: 0, completion_rate: 0, sign_off_rate: 0, avg_flags_per_handover: 0, incident_linked_rate: 0 };
}
