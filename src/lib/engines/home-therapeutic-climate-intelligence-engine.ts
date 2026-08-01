// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME THERAPEUTIC CLIMATE INTELLIGENCE ENGINE
// Home-level: meta-analysis combining behaviour log, restraints, incidents,
// and missing episodes to assess the overall therapeutic atmosphere of the
// home. Measures positive-to-concerning behaviour ratio, restraint frequency,
// de-escalation effectiveness, debrief compliance, and pattern analysis.
// CHR 2015 Reg 19 (Behaviour Management), Reg 20 (Restraint), Reg 35.
// SCCIF: "How well children are helped and protected" / "The effectiveness
// of leaders and managers."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface BehaviourLogInput {
  id: string;
  child_id: string;
  date: string;
  direction: string;             // positive | concerning
  intensity: string;             // low | medium | high
}

export interface RestraintInput {
  id: string;
  child_id: string;
  date: string;
  duration_minutes: number;
  de_escalation_count: number;   // number of de-escalation attempts before restraint
  child_debriefed: boolean;
  staff_debriefed: boolean;
  injuries_count: number;
}

export interface ClimateIncidentInput {
  id: string;
  child_id: string;
  date: string;
  severity: string;              // low | medium | high | critical
}

export interface ClimateMissingInput {
  id: string;
  child_id: string;
  date: string;
}

export interface HomeTherapeuticClimateInput {
  today: string;
  behaviour_log: BehaviourLogInput[];
  restraints: RestraintInput[];
  incidents: ClimateIncidentInput[];
  missing_episodes: ClimateMissingInput[];
  total_children: number;
  lookback_days?: number;        // default 90
}

// ── Output Types ────────────────────────────────────────────────────────────

export type TherapeuticClimateRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface BehaviourClimateProfile {
  total_entries: number;
  positive_count: number;
  concerning_count: number;
  positive_ratio: number;        // % positive
  high_intensity_count: number;
  children_with_entries: number;
}

export interface RestraintClimateProfile {
  total_restraints: number;
  restraint_rate_per_child: number | null;
  avg_duration_minutes: number | null;
  avg_de_escalation_attempts: number | null;
  child_debrief_rate: number | null;
  staff_debrief_rate: number | null;
  injuries_count: number;
  children_restrained: number;
}

export interface SafetyClimateProfile {
  total_incidents: number;
  high_severity_count: number;
  missing_episodes: number;
  incident_rate_per_child: number | null;
  combined_event_rate: number | null;   // (incidents + missing) / children
}

export interface PatternProfile {
  most_active_children: number;  // children with ≥3 combined events
  children_with_no_events: number;
  calm_rate: number | null;             // % of children with no concerning behaviour, incidents, or restraints
}

export interface TherapeuticClimateInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface TherapeuticClimateRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeTherapeuticClimateResult {
  climate_rating: TherapeuticClimateRating;
  climate_score: number | null;
  headline: string;
  behaviour_profile: BehaviourClimateProfile;
  restraint_profile: RestraintClimateProfile;
  safety_profile: SafetyClimateProfile;
  pattern_profile: PatternProfile;
  strengths: string[];
  concerns: string[];
  recommendations: TherapeuticClimateRecommendation[];
  insights: TherapeuticClimateInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): TherapeuticClimateRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function emptyBehaviour(): BehaviourClimateProfile {
  return { total_entries: 0, positive_count: 0, concerning_count: 0, positive_ratio: 0, high_intensity_count: 0, children_with_entries: 0 };
}

function emptyRestraint(): RestraintClimateProfile {
  return { total_restraints: 0, restraint_rate_per_child: 0, avg_duration_minutes: 0, avg_de_escalation_attempts: 0, child_debrief_rate: 0, staff_debrief_rate: 0, injuries_count: 0, children_restrained: 0 };
}

function emptySafety(): SafetyClimateProfile {
  return { total_incidents: 0, high_severity_count: 0, missing_episodes: 0, incident_rate_per_child: 0, combined_event_rate: 0 };
}

function emptyPattern(): PatternProfile {
  return { most_active_children: 0, children_with_no_events: 0, calm_rate: 0 };
}

// ── Main Function ──────────────────────────────────────────────────────────

export function computeHomeTherapeuticClimate(
  input: HomeTherapeuticClimateInput,
): HomeTherapeuticClimateResult {
  const { today, total_children, lookback_days = 90 } = input;

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - lookback_days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  // Filter to lookback window
  const behaviour = input.behaviour_log.filter(b => b.date >= cutoffStr && b.date <= today);
  const restraints = input.restraints.filter(r => r.date >= cutoffStr && r.date <= today);
  const incidents = input.incidents.filter(i => i.date >= cutoffStr && i.date <= today);
  const missing = input.missing_episodes.filter(m => m.date >= cutoffStr && m.date <= today);

  // Need at least some data to assess climate
  const totalEvents = behaviour.length + restraints.length + incidents.length + missing.length;
  if (totalEvents === 0 && total_children === 0) {
    return {
      climate_rating: "insufficient_data",
      climate_score: 0,
      headline: "No therapeutic climate data available — the home's atmosphere cannot be assessed.",
      behaviour_profile: emptyBehaviour(),
      restraint_profile: emptyRestraint(),
      safety_profile: emptySafety(),
      pattern_profile: emptyPattern(),
      strengths: [],
      concerns: ["No behaviour, incident, restraint, or missing episode data recorded."],
      recommendations: [{ rank: 1, recommendation: "Ensure behaviour log, incident records, and restraint documentation are consistently maintained to evidence the home's therapeutic approach.", urgency: "immediate", regulatory_ref: "Reg 19" }],
      insights: [{ text: "No data is available to assess the therapeutic climate. Under Regulation 19, the registered person must have regard to the Guide to the Children's Homes Regulations which requires evidence that behaviour management is therapeutic, proportionate, and effectively documented.", severity: "critical" }],
    };
  }

  // ── Behaviour Climate Profile ─────────────────────────────────
  const positive = behaviour.filter(b => b.direction === "positive").length;
  const concerning = behaviour.filter(b => b.direction === "concerning").length;
  const positiveRatio = pct(positive, behaviour.length);
  const highIntensity = behaviour.filter(b => b.intensity === "high").length;
  const behaviourChildren = new Set(behaviour.map(b => b.child_id)).size;

  const behaviourProfile: BehaviourClimateProfile = {
    total_entries: behaviour.length,
    positive_count: positive,
    concerning_count: concerning,
    positive_ratio: positiveRatio,
    high_intensity_count: highIntensity,
    children_with_entries: behaviourChildren,
  };

  // ── Restraint Climate Profile ─────────────────────────────────
  const totalRestraints = restraints.length;
  const restraintRate = total_children > 0
    ? Math.round((totalRestraints / total_children) * 10) / 10
    : null;
  const avgDuration = totalRestraints > 0
    ? Math.round((restraints.reduce((s, r) => s + r.duration_minutes, 0) / totalRestraints) * 10) / 10
    : null;
  const avgDeEscalation = totalRestraints > 0
    ? Math.round((restraints.reduce((s, r) => s + r.de_escalation_count, 0) / totalRestraints) * 10) / 10
    : null;
  const childDebriefed = restraints.filter(r => r.child_debriefed).length;
  const staffDebriefed = restraints.filter(r => r.staff_debriefed).length;
  const childDebriefRate = pct(childDebriefed, totalRestraints);
  const staffDebriefRate = pct(staffDebriefed, totalRestraints);
  const injuriesCount = restraints.reduce((s, r) => s + r.injuries_count, 0);
  const restrainedChildren = new Set(restraints.map(r => r.child_id)).size;

  const restraintProfile: RestraintClimateProfile = {
    total_restraints: totalRestraints,
    restraint_rate_per_child: restraintRate,
    avg_duration_minutes: avgDuration,
    avg_de_escalation_attempts: avgDeEscalation,
    child_debrief_rate: childDebriefRate,
    staff_debrief_rate: staffDebriefRate,
    injuries_count: injuriesCount,
    children_restrained: restrainedChildren,
  };

  // ── Safety Climate Profile ────────────────────────────────────
  const totalIncidents = incidents.length;
  const highSeverity = incidents.filter(
    i => i.severity === "high" || i.severity === "critical",
  ).length;
  const totalMissing = missing.length;
  const incidentRate = total_children > 0
    ? Math.round((totalIncidents / total_children) * 10) / 10
    : null;
  const combinedRate = total_children > 0
    ? Math.round(((totalIncidents + totalMissing) / total_children) * 10) / 10
    : null;

  const safetyProfile: SafetyClimateProfile = {
    total_incidents: totalIncidents,
    high_severity_count: highSeverity,
    missing_episodes: totalMissing,
    incident_rate_per_child: incidentRate,
    combined_event_rate: combinedRate,
  };

  // ── Pattern Profile ───────────────────────────────────────────
  // Count combined concerning events per child
  const childEventCounts: Record<string, number> = {};
  for (const b of behaviour.filter(b => b.direction === "concerning")) {
    childEventCounts[b.child_id] = (childEventCounts[b.child_id] ?? 0) + 1;
  }
  for (const r of restraints) {
    childEventCounts[r.child_id] = (childEventCounts[r.child_id] ?? 0) + 1;
  }
  for (const i of incidents) {
    childEventCounts[i.child_id] = (childEventCounts[i.child_id] ?? 0) + 1;
  }
  for (const m of missing) {
    childEventCounts[m.child_id] = (childEventCounts[m.child_id] ?? 0) + 1;
  }

  const mostActive = Object.values(childEventCounts).filter(c => c >= 3).length;
  const allEventChildren = new Set(Object.keys(childEventCounts));
  const childrenNoEvents = Math.max(0, total_children - allEventChildren.size);
  const calmRate = pct(childrenNoEvents, total_children);

  const patternProfile: PatternProfile = {
    most_active_children: mostActive,
    children_with_no_events: childrenNoEvents,
    calm_rate: calmRate,
  };

  // ── Scoring ──────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52 + 28 = 80
  let score = 52;

  // 1. Positive behaviour ratio (±5)
  if (behaviour.length === 0) score += 0; // no data — neutral
  else if (positiveRatio >= 70) score += 5;
  else if (positiveRatio >= 50) score += 3;
  else if (positiveRatio >= 30) score += 0;
  else score -= 4;

  // 2. Restraint frequency (±4)
  if (totalRestraints === 0) score += 4;
  else if ((restraintRate ?? 0) <= 0.5) score += 2;
  else if ((restraintRate ?? 0) <= 1.0) score += 0;
  else score -= 3;

  // 3. Debrief compliance (±3)
  if (totalRestraints === 0) score += 3; // no restraints is best state
  else if (childDebriefRate >= 90 && staffDebriefRate >= 90) score += 3;
  else if (childDebriefRate >= 70) score += 1;
  else score -= 2;

  // 4. Incident rate (±4)
  if (totalIncidents === 0) score += 4;
  else if ((incidentRate ?? 0) <= 1.0) score += 2;
  else if ((incidentRate ?? 0) <= 2.0) score += 0;
  else score -= 3;

  // 5. High severity incidents (±3)
  if (highSeverity === 0) score += 3;
  else if (highSeverity <= 1) score += 1;
  else score -= 2;

  // 6. Missing episodes (±3)
  if (totalMissing === 0) score += 3;
  else if (totalMissing <= 1) score += 1;
  else if (totalMissing <= 3) score += 0;
  else score -= 2;

  // 7. Calm rate — children with no events (±3)
  if (total_children === 0) score += 0;
  else if (calmRate >= 75) score += 3;
  else if (calmRate >= 50) score += 1;
  else if (calmRate >= 25) score += 0;
  else score -= 2;

  // 8. Injury-free restraints (±3)
  if (totalRestraints === 0) score += 3;
  else if (injuriesCount === 0) score += 3;
  else if (injuriesCount <= 1) score += 1;
  else score -= 2;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────
  const strengths: string[] = [];
  if (positiveRatio >= 70 && behaviour.length > 0) strengths.push(`${positiveRatio}% of behaviour entries are positive — the home nurtures and celebrates good behaviour.`);
  if (totalRestraints === 0) strengths.push("Zero restraints in the review period — the home is managing behaviour through therapeutic means.");
  if (totalRestraints > 0 && childDebriefRate >= 90 && staffDebriefRate >= 90) strengths.push(`${childDebriefRate}% child and ${staffDebriefRate}% staff debrief completion — learning from every intervention.`);
  if (totalIncidents === 0) strengths.push("No incidents recorded — a calm and safe environment for children.");
  if (totalMissing === 0) strengths.push("No missing from care episodes — children feel safe and want to be here.");
  if (calmRate >= 75 && total_children > 0) strengths.push(`${calmRate}% of children have had no concerning events — strong therapeutic stability.`);
  if (totalRestraints > 0 && injuriesCount === 0) strengths.push("All restraints were injury-free — proportionate and safe physical intervention.");

  // ── Concerns ──────────────────────────────────────────────────
  const concerns: string[] = [];
  if (positiveRatio < 30 && behaviour.length > 0) concerns.push(`Only ${positiveRatio}% of behaviour entries are positive — the atmosphere may feel punitive rather than therapeutic.`);
  if ((restraintRate ?? 0) > 1.0) concerns.push(`Restraint rate of ${(restraintRate ?? 0)} per child — frequency suggests de-escalation strategies need strengthening.`);
  if (totalRestraints > 0 && childDebriefRate < 70) concerns.push(`Only ${childDebriefRate}% of children debriefed after restraint — their voice and wellbeing after intervention is being missed.`);
  if (injuriesCount > 1) concerns.push(`${injuriesCount} injuries during restraints — review technique and proportionality urgently.`);
  if (highSeverity > 1) concerns.push(`${highSeverity} high-severity incidents — pattern suggests escalation risk.`);
  if (totalMissing > 3) concerns.push(`${totalMissing} missing episodes — children may not feel safe or settled.`);
  if (mostActive > 0) concerns.push(`${mostActive} child${mostActive > 1 ? "ren have" : " has"} 3+ concerning events — concentrated patterns need therapeutic review.`);

  // ── Recommendations ───────────────────────────────────────────
  const recs: TherapeuticClimateRecommendation[] = [];
  let rank = 1;

  if (totalRestraints > 0 && childDebriefRate < 70) {
    recs.push({ rank: rank++, recommendation: `Child debrief rate is only ${childDebriefRate}% — ensure every child is debriefed within 24 hours of any restraint, with their views recorded.`, urgency: "immediate", regulatory_ref: "Reg 20" });
  }
  if (injuriesCount > 0) {
    recs.push({ rank: rank++, recommendation: `${injuriesCount} restraint injur${injuriesCount > 1 ? "ies" : "y"} recorded — review technique, notify appropriate bodies, and consider additional training.`, urgency: "immediate", regulatory_ref: "Reg 20" });
  }
  if (positiveRatio < 50 && behaviour.length > 0) {
    recs.push({ rank: rank++, recommendation: `Positive behaviour ratio is only ${positiveRatio}% — implement structured positive reinforcement and ensure staff are recording positive interactions.`, urgency: "soon", regulatory_ref: "Reg 19" });
  }
  if (mostActive > 0) {
    recs.push({ rank: rank++, recommendation: `${mostActive} child${mostActive > 1 ? "ren show" : " shows"} concentrated concerning patterns — convene therapeutic planning meetings to review individual interventions.`, urgency: "soon", regulatory_ref: "Reg 35" });
  }
  if ((restraintRate ?? 0) > 1.0) {
    recs.push({ rank: rank++, recommendation: `Restraint rate of ${restraintRate} per child exceeds therapeutic standard — review behaviour support plans and invest in de-escalation refresher training.`, urgency: "soon", regulatory_ref: "Reg 19" });
  }

  // ── Insights ──────────────────────────────────────────────────
  const insights: TherapeuticClimateInsight[] = [];

  if (rating === "outstanding") {
    insights.push({ text: `Exemplary therapeutic climate — ${positiveRatio}% positive behaviour ratio${totalRestraints === 0 ? ", zero restraints" : ""}, with ${calmRate}% of children experiencing no concerning events. The home demonstrates a genuine therapeutic ethos where children feel safe, behaviour is understood contextually, and positive choices are celebrated. Ofsted inspectors will find strong evidence of Regulation 19 and 20 compliance.`, severity: "positive" });
  }
  if (injuriesCount > 0) {
    insights.push({ text: `${injuriesCount} restraint injur${injuriesCount > 1 ? "ies" : "y"} recorded in the review period. Under Regulation 20, any injury during physical intervention requires investigation, notification, and review. Inspectors will scrutinise whether restraint is proportionate and whether alternatives were exhausted.`, severity: "critical" });
  }
  if (totalRestraints > 0 && (avgDeEscalation ?? 0) < 1) {
    insights.push({ text: `Average de-escalation attempts before restraint is ${avgDeEscalation}. The Guide to the Children's Homes Regulations states that physical intervention must be used 'only when other methods of managing the behaviour have been attempted and failed.' Low de-escalation evidence raises proportionality concerns.`, severity: "critical" });
  }
  if (positiveRatio >= 70 && behaviour.length >= 5) {
    insights.push({ text: `${positiveRatio}% positive behaviour recording demonstrates that staff are actively capturing and reinforcing positive choices. This evidences a strengths-based, trauma-informed approach consistent with best practice in therapeutic residential care.`, severity: "positive" });
  }
  if (mostActive > 0 && total_children > 0) {
    const concentrationRate = pct(mostActive, total_children);
    insights.push({ text: `${concentrationRate}% of children account for the majority of concerning events. Concentrated patterns suggest individual therapeutic needs are not fully met — consider whether behaviour support plans are adequate and whether additional specialist input is needed.`, severity: concentrationRate > 50 ? "critical" : "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding therapeutic climate — ${positiveRatio}% positive behaviour, ${totalRestraints === 0 ? "zero restraints" : `${totalRestraints} restraint${totalRestraints > 1 ? "s" : ""}`}, ${calmRate}% of children calm and settled.`;
  } else if (rating === "good") {
    headline = `Good therapeutic atmosphere — positive behaviour dominates with manageable incident levels.`;
  } else if (rating === "adequate") {
    headline = `Adequate therapeutic climate — ${concerning > 0 ? "mixed behaviour patterns" : "some safety concerns"} need targeted attention.`;
  } else {
    headline = `Inadequate therapeutic climate — ${(restraintRate ?? 0) > 1 ? "high restraint frequency" : "concerning behaviour patterns"} suggest the therapeutic approach needs significant review.`;
  }

  return {
    climate_rating: rating,
    climate_score: score,
    headline,
    behaviour_profile: behaviourProfile,
    restraint_profile: restraintProfile,
    safety_profile: safetyProfile,
    pattern_profile: patternProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
