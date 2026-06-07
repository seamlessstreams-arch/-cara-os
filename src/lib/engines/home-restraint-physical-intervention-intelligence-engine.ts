// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME RESTRAINT & PHYSICAL INTERVENTION INTELLIGENCE ENGINE
// Home-level: analyses restraint records to assess de-escalation practice,
// Team Teach compliance, child debriefs, review completion, documentation
// quality, duration/injury monitoring, and identifies repeat patterns.
// Pure deterministic engine — no imports required.
// CHR 2015 Reg 12, 13, 35. SCCIF: "Helped and protected",
// "Leadership and management".
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface RestraintRecordInput {
  id: string;
  child_id: string;
  date: string;                                 // ISO date YYYY-MM-DD
  duration_minutes: number;
  staff_count: number;
  all_staff_team_teach_trained: boolean;
  reason: string;                               // "imminent_harm_to_others" | "imminent_harm_to_self"
  restraint_type: string;                       // "planned_hold" | "standing_hold" | "wrap_hold"
  de_escalation_attempt_count: number;
  has_justification: boolean;
  has_injury: boolean;
  injury_count: number;
  child_debriefed: boolean;
  staff_debriefed: boolean;
  has_witness: boolean;
  review_status: string;                        // RestraintReviewStatus: "pending_rm" | "pending_ri" | "reviewed" | "referred_lado"
  has_body_map: boolean;
  has_medical_check: boolean;
  notification_count: number;
  has_linked_incident: boolean;
}

export interface RestraintPhysicalInterventionInput {
  today: string;
  total_children: number;
  restraints: RestraintRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type RestraintPhysicalInterventionRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface RestraintInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface RestraintRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface RestraintPhysicalInterventionResult {
  restraint_rating: RestraintPhysicalInterventionRating;
  restraint_score: number;
  headline: string;
  total_restraints: number;
  unique_children_restrained: number;
  average_duration_minutes: number;
  de_escalation_rate: number;
  team_teach_compliance_rate: number;
  child_debrief_rate: number;
  review_completion_rate: number;
  body_map_rate: number;
  notification_rate: number;
  injury_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: RestraintRecommendation[];
  insights: RestraintInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const pct = (n: number, d: number): number =>
  d === 0 ? 0 : Math.round((n / d) * 100);

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function toRating(score: number): RestraintPhysicalInterventionRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeRestraintPhysicalIntervention(
  input: RestraintPhysicalInterventionInput,
): RestraintPhysicalInterventionResult {
  const { today, total_children, restraints } = input;

  // ── Guard: insufficient data ──────────────────────────────────────────
  if (total_children === 0 || restraints.length === 0) {
    // If there are children but zero restraint records, that is genuinely
    // a good sign — but we still need children to contextualise it.
    if (total_children === 0) {
      return {
        restraint_rating: "insufficient_data",
        restraint_score: 0,
        headline: "No children on placement — insufficient data for restraint analysis.",
        total_restraints: 0,
        unique_children_restrained: 0,
        average_duration_minutes: 0,
        de_escalation_rate: 0,
        team_teach_compliance_rate: 0,
        child_debrief_rate: 0,
        review_completion_rate: 0,
        body_map_rate: 0,
        notification_rate: 0,
        injury_rate: 0,
        strengths: [],
        concerns: [],
        recommendations: [],
        insights: [],
      };
    }

    // Children exist but zero restraints — excellent indicator
    return {
      restraint_rating: "outstanding",
      restraint_score: 88,
      headline: "No physical interventions recorded — exemplary de-escalation culture.",
      total_restraints: 0,
      unique_children_restrained: 0,
      average_duration_minutes: 0,
      de_escalation_rate: 0,
      team_teach_compliance_rate: 0,
      child_debrief_rate: 0,
      review_completion_rate: 0,
      body_map_rate: 0,
      notification_rate: 0,
      injury_rate: 0,
      strengths: [
        "Zero physical interventions — this is an outstanding indicator of effective behaviour support and de-escalation practice.",
        "Staff are managing challenging behaviour without recourse to restrictive physical intervention.",
      ],
      concerns: [],
      recommendations: [],
      insights: [
        {
          text: "No restraints recorded. Ofsted will view this positively as evidence of a least restrictive culture — provided behaviour support plans are in place and functioning.",
          severity: "positive",
        },
      ],
    };
  }

  // ── Filter to 90-day window ───────────────────────────────────────────
  const r90d = restraints.filter(r => daysBetween(r.date, today) <= 90);
  const total = r90d.length;

  // If all records fall outside the 90-day window, treat as zero restraints
  if (total === 0) {
    return {
      restraint_rating: "good",
      restraint_score: 78,
      headline: "No physical interventions in the last 90 days — strong de-escalation practice.",
      total_restraints: 0,
      unique_children_restrained: 0,
      average_duration_minutes: 0,
      de_escalation_rate: 0,
      team_teach_compliance_rate: 0,
      child_debrief_rate: 0,
      review_completion_rate: 0,
      body_map_rate: 0,
      notification_rate: 0,
      injury_rate: 0,
      strengths: [
        "No physical interventions recorded in the last 90 days — evidence of effective de-escalation.",
      ],
      concerns: [],
      recommendations: [],
      insights: [
        {
          text: "All restraint records are older than 90 days. Recent practice shows a positive downward trend in physical interventions.",
          severity: "positive",
        },
      ],
    };
  }

  // ── Compute metrics ───────────────────────────────────────────────────

  // Unique children restrained
  const childIds = r90d.map(r => r.child_id);
  const uniqueChildren = Array.from(new Set(childIds));
  const uniqueChildrenRestrained = uniqueChildren.length;

  // Child restraint counts (for repeat pattern detection)
  const childCounts: Record<string, number> = {};
  for (const r of r90d) {
    childCounts[r.child_id] = (childCounts[r.child_id] || 0) + 1;
  }
  const repeatChildren = Object.entries(childCounts)
    .filter(([, count]) => count > 3)
    .map(([id]) => id);

  // Duration
  const totalDuration = r90d.reduce((sum, r) => sum + r.duration_minutes, 0);
  const averageDuration = total > 0 ? Math.round((totalDuration / total) * 10) / 10 : 0;

  // De-escalation rate: restraints where de_escalation_attempt_count > 0
  const withDeEscalation = r90d.filter(r => r.de_escalation_attempt_count > 0).length;
  const deEscalationRate = pct(withDeEscalation, total);

  // Team Teach compliance: all_staff_team_teach_trained
  const teamTeachCompliant = r90d.filter(r => r.all_staff_team_teach_trained).length;
  const teamTeachRate = pct(teamTeachCompliant, total);

  // Child debrief rate
  const childDebriefed = r90d.filter(r => r.child_debriefed).length;
  const childDebriefRate = pct(childDebriefed, total);

  // Staff debrief rate (tracked but not a primary modifier)
  const staffDebriefed = r90d.filter(r => r.staff_debriefed).length;
  const staffDebriefRate = pct(staffDebriefed, total);

  // Review completion rate. review_status is the canonical RestraintReviewStatus
  // ("pending_rm" | "pending_ri" | "reviewed" | "referred_lado"). Previously this
  // matched the literal "pending"/"reviewed" — values real data never uses — so
  // pendingReviews was ALWAYS 0 (the entire use-of-force review backlog was
  // hidden, with no concern/recommendation/critical insight) and a restraint
  // escalated to the LADO was miscounted as not reviewed. Mirrors the sibling
  // child-restrictive-practice engine.
  const reviewed = r90d.filter(r => r.review_status === "reviewed" || r.review_status === "referred_lado").length;
  const reviewCompletionRate = pct(reviewed, total);
  const pendingReviews = r90d.filter(r => r.review_status !== "reviewed" && r.review_status !== "referred_lado").length;

  // Body map rate
  const bodyMapDone = r90d.filter(r => r.has_body_map).length;
  const bodyMapRate = pct(bodyMapDone, total);

  // Notification rate: notification_count >= 2
  const notified = r90d.filter(r => r.notification_count >= 2).length;
  const notificationRate = pct(notified, total);

  // Injury rate
  const withInjury = r90d.filter(r => r.has_injury).length;
  const injuryRate = pct(withInjury, total);
  const totalInjuries = r90d.reduce((sum, r) => sum + r.injury_count, 0);

  // Medical checks
  const medicalCheckDone = r90d.filter(r => r.has_medical_check).length;
  const medicalCheckRate = pct(medicalCheckDone, total);

  // Justification rate
  const justified = r90d.filter(r => r.has_justification).length;
  const justificationRate = pct(justified, total);

  // Witness rate
  const witnessed = r90d.filter(r => r.has_witness).length;
  const witnessRate = pct(witnessed, total);

  // Linked incident rate
  const linked = r90d.filter(r => r.has_linked_incident).length;
  const linkedRate = pct(linked, total);

  // Frequency analysis
  const isHighFrequency = total > total_children * 2;

  // ── Scoring: base 52, 6 modifiers ─────────────────────────────────────
  let score = 52;

  // Modifier 1: De-escalation practice (+6 / +3 / -5)
  if (deEscalationRate >= 90) score += 6;
  else if (deEscalationRate >= 70) score += 3;
  else if (deEscalationRate < 40) score -= 5;
  // 0 records with children scenario already handled by guard above;
  // if we reach here there are records, so check edge case of 0 rate
  if (deEscalationRate === 0 && total > 0) score -= 3;

  // Modifier 2: Team Teach compliance (+5 / +2 / -5)
  if (teamTeachRate >= 95) score += 5;
  else if (teamTeachRate >= 80) score += 2;
  else if (teamTeachRate < 50) score -= 5;
  if (teamTeachRate === 0 && total > 0) score -= 1;

  // Modifier 3: Child debrief (+5 / +2 / -4)
  if (childDebriefRate >= 85) score += 5;
  else if (childDebriefRate >= 60) score += 2;
  else if (childDebriefRate < 30) score -= 4;
  if (childDebriefRate === 0 && total > 0) score -= 1;

  // Modifier 4: Review completion (+5 / +2 / -4)
  if (reviewCompletionRate >= 90) score += 5;
  else if (reviewCompletionRate >= 70) score += 2;
  else if (reviewCompletionRate < 40) score -= 4;

  // Modifier 5: Body map + notification (+4 / +2 / -4)
  if (bodyMapRate >= 90 && notificationRate >= 90) score += 4;
  else if (bodyMapRate >= 70 || notificationRate >= 70) score += 2;
  else if (bodyMapRate < 40 && notificationRate < 40) score -= 4;
  if (bodyMapRate === 0 && notificationRate === 0 && total > 0) score -= 1;

  // Modifier 6: Duration + injury monitoring (+5 / +2 / -3)
  if (averageDuration <= 5 && injuryRate === 0) score += 5;
  else if (averageDuration <= 10 || injuryRate <= 10) score += 2;
  else if (averageDuration > 15 || injuryRate > 30) score -= 3;
  if (averageDuration === 0 && injuryRate === 0 && total === 0) score -= 2;

  // Additional penalty: high frequency
  if (isHighFrequency) score -= 3;

  // Additional penalty: repeat children patterns
  if (repeatChildren.length > 0) score -= 2;

  score = clamp(score, 0, 100);
  const restraint_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (total <= 2 && total_children > 0) {
    strengths.push(
      `Only ${total} physical intervention${total === 1 ? "" : "s"} in 90 days for ${total_children} children — low use of restrictive practice.`,
    );
  }

  if (deEscalationRate >= 90) {
    strengths.push(
      `De-escalation attempted in ${deEscalationRate}% of interventions — strong evidence of least restrictive approach.`,
    );
  }

  if (teamTeachRate >= 95) {
    strengths.push(
      `Team Teach compliance at ${teamTeachRate}% — all staff involved are appropriately trained.`,
    );
  }

  if (childDebriefRate >= 85) {
    strengths.push(
      `Child debrief rate at ${childDebriefRate}% — therapeutic aftercare is embedded in practice.`,
    );
  }

  if (staffDebriefRate >= 85) {
    strengths.push(
      `Staff debriefed after ${staffDebriefRate}% of interventions — reflective practice culture in place.`,
    );
  }

  if (reviewCompletionRate >= 90) {
    strengths.push(
      `${reviewCompletionRate}% of restraints reviewed — robust management oversight of physical interventions.`,
    );
  }

  if (bodyMapRate >= 90) {
    strengths.push(
      `Body map completion at ${bodyMapRate}% — comprehensive post-intervention documentation.`,
    );
  }

  if (notificationRate >= 90) {
    strengths.push(
      `Notification rate at ${notificationRate}% — appropriate parties informed promptly after each intervention.`,
    );
  }

  if (injuryRate === 0) {
    strengths.push(
      "No injuries recorded during any physical intervention — techniques applied safely and proportionately.",
    );
  }

  if (averageDuration <= 5 && total > 0) {
    strengths.push(
      `Average intervention duration of ${averageDuration} minutes — restraints are brief and proportionate.`,
    );
  }

  if (justificationRate === 100 && total > 0) {
    strengths.push(
      "All interventions have documented justification — evidences proportionality and necessity.",
    );
  }

  if (witnessRate >= 90 && total > 0) {
    strengths.push(
      `${witnessRate}% of interventions witnessed — transparency and accountability in physical intervention.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (isHighFrequency) {
    concerns.push(
      `${total} restraints for ${total_children} children in 90 days — frequency exceeds 2x the number of children, indicating possible over-reliance on physical intervention.`,
    );
  }

  if (repeatChildren.length > 0) {
    const repeatDetails = repeatChildren
      .map(id => `${id} (${childCounts[id]} interventions)`)
      .join(", ");
    concerns.push(
      `${repeatChildren.length} child${repeatChildren.length > 1 ? "ren" : ""} restrained more than 3 times — pattern analysis required: ${repeatDetails}.`,
    );
  }

  if (deEscalationRate < 70) {
    concerns.push(
      `De-escalation rate at ${deEscalationRate}% — less restrictive interventions must always be attempted before physical intervention.`,
    );
  }

  if (teamTeachRate < 80) {
    concerns.push(
      `Team Teach compliance at ${teamTeachRate}% — untrained staff are participating in physical interventions.`,
    );
  }

  if (childDebriefRate < 60) {
    concerns.push(
      `Child debrief rate at ${childDebriefRate}% — children are not being debriefed after restraint, impacting therapeutic recovery.`,
    );
  }

  if (pendingReviews > 0) {
    concerns.push(
      `${pendingReviews} restraint${pendingReviews > 1 ? "s" : ""} pending review — all physical interventions must be reviewed promptly by the Registered Manager.`,
    );
  }

  if (bodyMapRate < 70) {
    concerns.push(
      `Body map completion at ${bodyMapRate}% — gaps in post-intervention medical documentation.`,
    );
  }

  if (notificationRate < 70) {
    concerns.push(
      `Notification rate at ${notificationRate}% — placing authorities and parents/carers may not be informed of restraint use.`,
    );
  }

  if (injuryRate > 20) {
    concerns.push(
      `Injury rate at ${injuryRate}% (${withInjury} intervention${withInjury > 1 ? "s" : ""} with ${totalInjuries} total injuries) — restraint techniques and proportionality require urgent review.`,
    );
  }

  if (averageDuration > 15) {
    concerns.push(
      `Average restraint duration of ${averageDuration} minutes — extended interventions carry elevated risk and require robust justification.`,
    );
  }

  if (justificationRate < 80 && total > 0) {
    concerns.push(
      `Justification documented in only ${justificationRate}% of interventions — every restraint must have a recorded reason.`,
    );
  }

  if (staffDebriefRate < 50) {
    concerns.push(
      `Staff debrief rate at ${staffDebriefRate}% — staff wellbeing and reflective practice are not being prioritised after interventions.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: RestraintRecommendation[] = [];
  let rank = 0;

  if (pendingReviews > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete ${pendingReviews} pending restraint review${pendingReviews > 1 ? "s" : ""} — the Registered Manager must review all physical interventions within 24 hours.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 35",
    });
  }

  if (injuryRate > 20) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Review restraint techniques urgently — ${injuryRate}% injury rate across ${total} interventions indicates potential issues with application or proportionality.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }

  if (deEscalationRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Implement mandatory de-escalation documentation — current rate of ${deEscalationRate}% falls below acceptable standards. Staff must evidence all pre-intervention strategies attempted.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 35",
    });
  }

  if (teamTeachRate < 80) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Schedule immediate Team Teach training — only ${teamTeachRate}% of interventions involved fully trained staff. No untrained staff member should participate in physical intervention.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 35",
    });
  }

  if (childDebriefRate < 60) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Embed child debrief as a mandatory post-intervention step — current rate of ${childDebriefRate}% denies children the therapeutic aftercare they need.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }

  if (repeatChildren.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Review and update behaviour support plans for ${repeatChildren.length} child${repeatChildren.length > 1 ? "ren" : ""} restrained more than 3 times — current strategies are not reducing restrictive intervention.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 35",
    });
  }

  if (isHighFrequency) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Commission a review of the home's overall approach to behaviour management — restraint frequency of ${total} in 90 days for ${total_children} children suggests systemic gaps.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 35",
    });
  }

  if (bodyMapRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Ensure body maps are completed for every physical intervention — current rate of ${bodyMapRate}% leaves gaps in post-incident evidence.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 13",
    });
  }

  if (notificationRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Improve notification processes — ${notificationRate}% compliance means placing authorities and families are not consistently informed of restraint use.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 35",
    });
  }

  if (staffDebriefRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Introduce mandatory staff debrief after every physical intervention — current rate of ${staffDebriefRate}% undermines reflective practice.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 13",
    });
  }

  if (averageDuration > 15) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Investigate extended restraint durations (avg ${averageDuration} min) — consider whether transition techniques or environmental changes could reduce hold times.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }

  if (justificationRate < 100 && total > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Ensure all restraints have documented justification — ${100 - justificationRate}% of records lack formal rationale for use of physical intervention.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 35",
    });
  }

  if (witnessRate < 70 && total > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Improve independent witnessing of physical interventions — only ${witnessRate}% had a witness present, reducing transparency and accountability.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 35",
    });
  }

  if (linkedRate < 50 && total > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Link restraint records to associated incident reports — only ${linkedRate}% are currently linked, making holistic analysis difficult.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 35",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: RestraintInsight[] = [];

  // Critical insights
  if (injuryRate > 30) {
    insights.push({
      text: `Injury rate of ${injuryRate}% across physical interventions is a serious safeguarding concern. Ofsted will scrutinise whether restraint techniques are safe and staff training is adequate.`,
      severity: "critical",
    });
  }

  if (pendingReviews >= 3) {
    insights.push({
      text: `${pendingReviews} physical interventions are unreviewed. Reg 35 requires the Registered Manager to review every restraint. This backlog presents a governance failure that Ofsted will flag.`,
      severity: "critical",
    });
  }

  if (deEscalationRate < 40) {
    insights.push({
      text: `De-escalation attempted in fewer than 40% of interventions. Ofsted expects to see evidence that physical intervention is always a last resort — this rate undermines that expectation.`,
      severity: "critical",
    });
  }

  if (teamTeachRate < 50) {
    insights.push({
      text: `Fewer than half of physical interventions involved fully trained staff. This is a significant safety risk and a likely Ofsted shortfall finding under Reg 35.`,
      severity: "critical",
    });
  }

  if (isHighFrequency && repeatChildren.length > 0) {
    insights.push({
      text: `High restraint frequency combined with repeat children suggests behaviour support plans are not effectively reducing the need for physical intervention. Ofsted will examine whether the home is learning from incidents.`,
      severity: "critical",
    });
  }

  // Warning insights
  if (pendingReviews > 0 && pendingReviews < 3) {
    insights.push({
      text: `${pendingReviews} restraint${pendingReviews > 1 ? "s" : ""} awaiting review. Timely management review is a regulatory requirement and demonstrates active governance oversight.`,
      severity: "warning",
    });
  }

  if (childDebriefRate < 60 && childDebriefRate >= 30) {
    insights.push({
      text: `Child debrief rate of ${childDebriefRate}% leaves many children without therapeutic aftercare following restraint. Ofsted views debriefing as essential to child-centred practice.`,
      severity: "warning",
    });
  }

  if (averageDuration > 10 && averageDuration <= 15) {
    insights.push({
      text: `Average restraint duration of ${averageDuration} minutes is elevated. Longer holds increase physical risk and Ofsted will expect clear justification for extended interventions.`,
      severity: "warning",
    });
  }

  if (injuryRate > 0 && injuryRate <= 20) {
    insights.push({
      text: `${withInjury} intervention${withInjury > 1 ? "s" : ""} resulted in injury (${injuryRate}% rate). While some risk is inherent, each injury should trigger a technique review and be reported.`,
      severity: "warning",
    });
  }

  if (repeatChildren.length > 0 && !isHighFrequency) {
    insights.push({
      text: `${repeatChildren.length} child${repeatChildren.length > 1 ? "ren" : ""} restrained more than 3 times in 90 days. BSP effectiveness for these children should be urgently reviewed.`,
      severity: "warning",
    });
  }

  // Reason analysis: check if reasons are predominantly one type
  const reasonCounts: Record<string, number> = {};
  for (const r of r90d) {
    reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
  }
  const dominantReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominantReason && total >= 3 && pct(dominantReason[1], total) >= 80) {
    const reasonLabel = dominantReason[0].replace(/_/g, " ");
    insights.push({
      text: `${pct(dominantReason[1], total)}% of interventions were for "${reasonLabel}". This dominant trigger pattern should inform targeted de-escalation strategy updates.`,
      severity: "warning",
    });
  }

  // Restraint type analysis
  const typeCounts: Record<string, number> = {};
  for (const r of r90d) {
    typeCounts[r.restraint_type] = (typeCounts[r.restraint_type] || 0) + 1;
  }
  const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominantType && total >= 3 && dominantType[0] === "wrap_hold" && pct(dominantType[1], total) >= 50) {
    insights.push({
      text: `Wrap holds used in ${pct(dominantType[1], total)}% of interventions. As the most restrictive common hold type, this warrants review to ensure proportionality and that less restrictive alternatives are considered first.`,
      severity: "warning",
    });
  }

  // Positive insights
  if (deEscalationRate >= 90 && total > 0) {
    insights.push({
      text: `De-escalation documented in ${deEscalationRate}% of interventions. This demonstrates a consistent least restrictive approach — a key Ofsted expectation under Reg 35.`,
      severity: "positive",
    });
  }

  if (childDebriefRate >= 85 && total > 0) {
    insights.push({
      text: `${childDebriefRate}% child debrief rate evidences therapeutically informed aftercare. Children's voices and experiences are prioritised following physical intervention.`,
      severity: "positive",
    });
  }

  if (teamTeachRate >= 95 && total > 0) {
    insights.push({
      text: `Team Teach compliance at ${teamTeachRate}% — all physical interventions are conducted by trained staff, demonstrating safe and competent practice.`,
      severity: "positive",
    });
  }

  if (reviewCompletionRate >= 90 && total > 0) {
    insights.push({
      text: `${reviewCompletionRate}% review completion rate — the Registered Manager is providing timely oversight of every physical intervention, evidencing strong governance.`,
      severity: "positive",
    });
  }

  if (injuryRate === 0 && total > 0) {
    insights.push({
      text: "Zero injuries across all physical interventions. Restraint techniques are being applied safely and proportionately.",
      severity: "positive",
    });
  }

  if (bodyMapRate >= 90 && notificationRate >= 90 && total > 0) {
    insights.push({
      text: `Body map (${bodyMapRate}%) and notification (${notificationRate}%) compliance is excellent — post-intervention documentation and communication meet regulatory standards.`,
      severity: "positive",
    });
  }

  if (total <= 2 && total_children >= 3) {
    insights.push({
      text: `Only ${total} intervention${total === 1 ? "" : "s"} for ${total_children} children indicates that the home's behaviour management approach is effectively reducing the need for physical intervention.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;

  if (restraint_rating === "outstanding") {
    headline = `Outstanding physical intervention governance — ${total} restraint${total === 1 ? "" : "s"} in 90 days with ${deEscalationRate}% de-escalation, ${childDebriefRate}% debrief, and ${reviewCompletionRate}% review compliance.`;
  } else if (restraint_rating === "good") {
    headline = `Good physical intervention practice — ${total} restraint${total === 1 ? "" : "s"} in 90 days, ${deEscalationRate}% de-escalation rate, ${teamTeachRate}% Team Teach compliance.`;
  } else if (restraint_rating === "adequate") {
    headline = `Adequate physical intervention management — ${concerns.length} area${concerns.length !== 1 ? "s" : ""} of concern identified across ${total} intervention${total !== 1 ? "s" : ""}, improvement action required.`;
  } else {
    headline = `Physical intervention practice is inadequate — ${total} restraint${total !== 1 ? "s" : ""} with significant gaps in ${deEscalationRate < 70 ? "de-escalation, " : ""}${childDebriefRate < 60 ? "child debriefs, " : ""}${reviewCompletionRate < 70 ? "reviews, " : ""}${teamTeachRate < 80 ? "training compliance, " : ""}requiring urgent action.`.replace(/, $/, ".");
  }

  // ── Return ────────────────────────────────────────────────────────────
  return {
    restraint_rating,
    restraint_score: score,
    headline,
    total_restraints: total,
    unique_children_restrained: uniqueChildrenRestrained,
    average_duration_minutes: averageDuration,
    de_escalation_rate: deEscalationRate,
    team_teach_compliance_rate: teamTeachRate,
    child_debrief_rate: childDebriefRate,
    review_completion_rate: reviewCompletionRate,
    body_map_rate: bodyMapRate,
    notification_rate: notificationRate,
    injury_rate: injuryRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
