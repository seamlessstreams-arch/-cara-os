// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME CARE EVENT QUALITY INTELLIGENCE ENGINE
// Home-level: analyses care event recording quality, verification compliance,
// routing effectiveness, audit trails, return/correction rates, and coverage
// to assess the quality and governance of care event documentation.
// CHR 2015 Reg 12 (Duty of Care), Reg 36 (Record Keeping).
// SCCIF: "Experiences and progress of children", "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface CareEventRecordInput {
  id: string;
  child_id: string;
  staff_id: string;
  date: string;                    // ISO date
  category: string;                // "behaviour" | "health" | "safeguarding" | "education" | "emotional" | "general"
  has_content: boolean;            // content non-empty
  is_verified: boolean;            // verified_by present
  is_locked: boolean;              // locked_by present
  has_return_note: boolean;        // returned_by present (was returned for corrections)
  route_count: number;             // number of routes for this event
  routes_completed: number;        // routes with status "completed"
  routes_failed: number;           // routes with status "failed" or error_message present
  audit_trail_count: number;       // number of audit log entries
  time_saved_minutes: number;      // sum of time_saved_minutes from routes
}

export interface CareEventQualityInput {
  today: string;
  total_children: number;
  total_staff: number;
  events: CareEventRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type CareEventQualityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CareEventInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface CareEventRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface CareEventQualityResult {
  event_rating: CareEventQualityRating;
  event_score: number;
  headline: string;
  total_events: number;
  events_last_90_days: number;
  recording_quality_rate: number;
  verification_rate: number;
  routing_completion_rate: number;
  audit_trail_rate: number;
  return_rate: number;
  unique_children_covered: number;
  category_diversity: number;
  total_time_saved_minutes: number;
  strengths: string[];
  concerns: string[];
  recommendations: CareEventRecommendation[];
  insights: CareEventInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function toRating(score: number): CareEventQualityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeCareEventQuality(
  input: CareEventQualityInput,
): CareEventQualityResult {
  const { today, total_children, total_staff, events: allEvents } = input;

  // Special case: no children → insufficient data
  if (total_children === 0) {
    return {
      event_rating: "insufficient_data",
      event_score: 0,
      headline: "No children placed — care event quality data not available.",
      total_events: allEvents.length,
      events_last_90_days: 0,
      recording_quality_rate: 0,
      verification_rate: 0,
      routing_completion_rate: 0,
      audit_trail_rate: 0,
      return_rate: 0,
      unique_children_covered: 0,
      category_diversity: 0,
      total_time_saved_minutes: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [{ text: "No children currently placed in this home. Care event quality metrics require active placements to assess.", severity: "warning" }],
    };
  }

  // Filter to last 90 days
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const events = allEvents.filter(e => e.date >= cutoffStr && e.date <= today);

  // Special case: 0 events with children present
  if (events.length === 0) {
    return {
      event_rating: "inadequate",
      event_score: 25,
      headline: "No care events recorded in the last 90 days — serious governance gap.",
      total_events: allEvents.length,
      events_last_90_days: 0,
      recording_quality_rate: 0,
      verification_rate: 0,
      routing_completion_rate: 0,
      audit_trail_rate: 0,
      return_rate: 0,
      unique_children_covered: 0,
      category_diversity: 0,
      total_time_saved_minutes: 0,
      strengths: [],
      concerns: ["No care events recorded in the last 90 days despite children being placed — Ofsted expects comprehensive daily recording of children's experiences, behaviours, and wellbeing."],
      recommendations: [{ rank: 1, recommendation: "Implement daily care event recording immediately — every shift must document children's experiences, health, behaviour, and safeguarding observations.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 36" }],
      insights: [{ text: "No care events recorded with children in placement. This represents a fundamental failure in recording practice. Ofsted will view the absence of care event records as evidence that the home cannot demonstrate the quality of care provided or evidence safeguarding decisions.", severity: "critical" }],
    };
  }

  // ── Compute Metrics ───────────────────────────────────────────────────

  const withContent = events.filter(e => e.has_content);
  const recordingQualityRate = pct(withContent.length, events.length);

  const verified = events.filter(e => e.is_verified);
  const verificationRate = pct(verified.length, events.length);

  const totalRoutes = events.reduce((sum, e) => sum + e.route_count, 0);
  const totalRoutesCompleted = events.reduce((sum, e) => sum + e.routes_completed, 0);
  const routingCompletionRate = pct(totalRoutesCompleted, totalRoutes);

  const withAuditTrail = events.filter(e => e.audit_trail_count >= 2);
  const auditTrailRate = pct(withAuditTrail.length, events.length);

  const withReturnNote = events.filter(e => e.has_return_note);
  const returnRate = pct(withReturnNote.length, events.length);

  const uniqueChildren = new Set(events.map(e => e.child_id));
  const uniqueChildrenCovered = uniqueChildren.size;

  const uniqueCategories = new Set(events.map(e => e.category));
  const categoryDiversity = uniqueCategories.size;

  const totalTimeSaved = events.reduce((sum, e) => sum + e.time_saved_minutes, 0);

  // Events per child
  const eventsPerChild = events.length / total_children;

  // ── Scoring: Base 52 + 6 modifiers ────────────────────────────────────

  let score = 52;

  // 1. Recording quality (has_content rate)
  if (recordingQualityRate >= 98) score += 6;
  else if (recordingQualityRate >= 90) score += 3;
  else if (recordingQualityRate < 50) score -= 8; // -5 + -3 extra
  else if (recordingQualityRate < 70) score -= 5;

  // 2. Verification compliance (is_verified rate)
  if (verificationRate >= 95) score += 5;
  else if (verificationRate >= 80) score += 2;
  else if (verificationRate < 60) score -= 5;

  // 3. Routing effectiveness (routes_completed / route_count)
  if (totalRoutes === 0) {
    score -= 1;
  } else {
    if (routingCompletionRate >= 95) score += 5;
    else if (routingCompletionRate >= 80) score += 2;
    else if (routingCompletionRate < 60) score -= 4;
  }

  // 4. Audit trail completeness (events with audit_trail_count >= 2)
  if (auditTrailRate >= 90) score += 5;
  else if (auditTrailRate >= 70) score += 2;
  else if (auditTrailRate < 50) score -= 4;

  // 5. Return/correction rate (lower is better)
  if (returnRate < 5) score += 4;
  else if (returnRate < 15) score += 2;
  else if (returnRate > 30) score -= 4;

  // 6. Coverage & timeliness
  const goodCoverage = eventsPerChild >= 5;   // at least 5 events per child in 90 days
  const okCoverage = eventsPerChild >= 2;     // at least 2 events per child
  const diverse = categoryDiversity >= 3;

  if (goodCoverage && diverse) score += 5;
  else if (okCoverage) score += 2;
  else score -= 3;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (recordingQualityRate >= 98) {
    strengths.push(`${recordingQualityRate}% of care events have substantive content — exemplary recording practice.`);
  } else if (recordingQualityRate >= 90) {
    strengths.push(`${recordingQualityRate}% recording quality rate — strong content standards across care events.`);
  }

  if (verificationRate >= 95) {
    strengths.push(`${verificationRate}% verification rate — management oversight of care events is comprehensive.`);
  } else if (verificationRate >= 80) {
    strengths.push(`${verificationRate}% verification rate — good management oversight of care event records.`);
  }

  if (totalRoutes > 0 && routingCompletionRate >= 95) {
    strengths.push(`${routingCompletionRate}% routing completion — care events are being processed and linked effectively.`);
  }

  if (auditTrailRate >= 90) {
    strengths.push(`${auditTrailRate}% of events have full audit trails — strong governance and accountability.`);
  }

  if (returnRate < 5 && events.length > 0) {
    strengths.push(`Only ${returnRate}% return rate — staff are recording accurately with minimal corrections needed.`);
  }

  if (goodCoverage && diverse) {
    strengths.push(`${categoryDiversity} categories covered with ${Math.round(eventsPerChild * 10) / 10} events per child — comprehensive recording across all care domains.`);
  }

  if (totalTimeSaved > 0) {
    strengths.push(`${totalTimeSaved} minutes saved through automated routing — care event workflows are efficient.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (recordingQualityRate < 70) {
    concerns.push(`Only ${recordingQualityRate}% of care events have content — ${events.length - withContent.length} events lack substantive recording, undermining the evidential value of the care record.`);
  }

  if (verificationRate < 60) {
    concerns.push(`Only ${verificationRate}% verification rate — ${events.length - verified.length} care events lack management verification, creating a significant oversight gap.`);
  }

  if (totalRoutes > 0 && routingCompletionRate < 60) {
    const failedRoutes = events.reduce((sum, e) => sum + e.routes_failed, 0);
    concerns.push(`Only ${routingCompletionRate}% routing completion with ${failedRoutes} failed routes — care event data is not reaching linked systems reliably.`);
  }

  if (auditTrailRate < 50) {
    concerns.push(`Only ${auditTrailRate}% of events have adequate audit trails — ${events.length - withAuditTrail.length} events lack the minimum two audit entries needed for accountability.`);
  }

  if (returnRate > 30) {
    concerns.push(`${returnRate}% return rate — nearly a third of care events are being returned for corrections, indicating quality issues in initial recording.`);
  }

  if (!okCoverage) {
    concerns.push(`Only ${Math.round(eventsPerChild * 10) / 10} events per child — recording frequency is too low to evidence daily care experiences.`);
  }

  if (categoryDiversity < 3 && events.length > 0) {
    concerns.push(`Only ${categoryDiversity} event ${categoryDiversity === 1 ? "category" : "categories"} recorded — care events should span behaviour, health, safeguarding, education, and emotional wellbeing.`);
  }

  if (uniqueChildrenCovered < total_children && total_children > 0) {
    const uncovered = total_children - uniqueChildrenCovered;
    concerns.push(`${uncovered} ${uncovered === 1 ? "child has" : "children have"} no care events recorded — every child must have documented evidence of their daily care.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recs: CareEventRecommendation[] = [];
  let rank = 1;

  if (recordingQualityRate < 70) {
    recs.push({ rank: rank++, recommendation: "Improve care event content quality — implement recording standards that require substantive descriptions of children's experiences and staff responses.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 36" });
  }

  if (verificationRate < 60) {
    recs.push({ rank: rank++, recommendation: "Establish daily verification workflow — managers must review and verify all care events within 24 hours of recording.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 36" });
  }

  if (totalRoutes > 0 && routingCompletionRate < 60) {
    recs.push({ rank: rank++, recommendation: "Investigate and resolve routing failures — care event data must flow to linked records (chronology, risk assessments, LAC reviews) without interruption.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }

  if (auditTrailRate < 50) {
    recs.push({ rank: rank++, recommendation: "Ensure audit trail completeness — every care event should have at least two audit entries (creation and verification) to evidence governance.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 36" });
  }

  if (returnRate > 30) {
    recs.push({ rank: rank++, recommendation: "Address high return rate through staff training — targeted support on recording standards will reduce corrections and improve first-time quality.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 36" });
  }

  if (!okCoverage) {
    recs.push({ rank: rank++, recommendation: "Increase care event recording frequency — each child should have multiple documented events per week covering daily experiences and progress.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 36" });
  }

  if (categoryDiversity < 3 && events.length > 0) {
    recs.push({ rank: rank++, recommendation: "Broaden care event categories — ensure events cover behaviour, health, safeguarding, education, and emotional wellbeing to evidence holistic care.", urgency: "planned", regulatory_ref: "SCCIF: Experiences and progress" });
  }

  if (uniqueChildrenCovered < total_children && total_children > 0) {
    recs.push({ rank: rank++, recommendation: `Ensure all ${total_children} children have documented care events — ${total_children - uniqueChildrenCovered} ${total_children - uniqueChildrenCovered === 1 ? "child currently has" : "children currently have"} no recorded events.`, urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: CareEventInsight[] = [];

  if (recordingQualityRate >= 98 && verificationRate >= 95 && auditTrailRate >= 90 && returnRate < 5) {
    insights.push({ text: `Care event quality is exemplary — ${recordingQualityRate}% content quality, ${verificationRate}% verified, ${auditTrailRate}% with full audit trails, and only ${returnRate}% returns. Ofsted will see a home where recording practice is embedded, management oversight is consistent, and the care record provides a comprehensive evidence base for every child.`, severity: "positive" });
  }

  if (verificationRate >= 95 && recordingQualityRate >= 90) {
    insights.push({ text: `Strong verification and recording quality combination — ${verificationRate}% verified with ${recordingQualityRate}% content quality shows that management is not just signing off events but ensuring substantive content. This evidences active oversight under the SCCIF "Well-led and managed" judgement area.`, severity: "positive" });
  }

  if (goodCoverage && diverse && recordingQualityRate >= 90) {
    insights.push({ text: `Comprehensive coverage across ${categoryDiversity} categories with ${Math.round(eventsPerChild * 10) / 10} events per child demonstrates that staff are recording holistically. This supports the SCCIF "Experiences and progress of children" judgement by evidencing that each child's daily life is documented across all care domains.`, severity: "positive" });
  }

  if (recordingQualityRate < 50) {
    insights.push({ text: `Recording quality is critically low at ${recordingQualityRate}%. More than half of care events lack substantive content. Without meaningful descriptions of children's experiences, the home cannot evidence the quality of care provided. Ofsted will view empty or minimal care events as a failure to maintain adequate records under Reg 36.`, severity: "critical" });
  }

  if (verificationRate < 60) {
    insights.push({ text: `Verification rate of ${verificationRate}% means most care events lack management sign-off. Under Reg 36, the registered manager must ensure records are accurate, complete, and maintained. Unverified care events cannot be relied upon as evidence of care quality and represent a significant governance weakness.`, severity: "critical" });
  }

  if (returnRate > 30) {
    insights.push({ text: `${returnRate}% of care events are being returned for corrections. This high return rate suggests staff may need additional training on recording standards, or that the expectations for care event content are unclear. While returns show management oversight is functioning, the volume indicates a systemic quality issue.`, severity: "warning" });
  }

  if (totalRoutes > 0 && routingCompletionRate < 60) {
    insights.push({ text: `Only ${routingCompletionRate}% of care event routes completing successfully. When care events fail to route to linked records, critical information may not reach chronologies, risk assessments, or LAC reviews. This fragmentation undermines the duty of care under Reg 12.`, severity: "critical" });
  }

  if (uniqueChildrenCovered < total_children && total_children > 0) {
    const uncovered = total_children - uniqueChildrenCovered;
    insights.push({ text: `${uncovered} of ${total_children} children have no care events recorded. Every child in the home must have documented evidence of their daily experiences and progress. An Ofsted inspector reviewing individual case files will immediately identify children without care event records as a safeguarding concern.`, severity: "critical" });
  }

  if (totalTimeSaved >= 60) {
    insights.push({ text: `Automated routing has saved ${totalTimeSaved} minutes (${Math.round(totalTimeSaved / 60 * 10) / 10} hours) of staff time. Efficient care event workflows allow staff to spend more time with children and less on administrative tasks, directly supporting better care outcomes.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding care event quality — ${recordingQualityRate}% content quality, ${verificationRate}% verified, ${categoryDiversity} categories covered.`;
  } else if (rating === "good") {
    headline = `Good care event practice — solid recording and verification with minor gaps in coverage or audit trails.`;
  } else if (rating === "adequate") {
    headline = "Adequate care event quality — recording and verification rates need improvement to fully evidence the quality of care.";
  } else {
    headline = "Care event quality is inadequate — low recording quality, verification gaps, or insufficient coverage undermine care governance.";
  }

  return {
    event_rating: rating,
    event_score: score,
    headline,
    total_events: allEvents.length,
    events_last_90_days: events.length,
    recording_quality_rate: recordingQualityRate,
    verification_rate: verificationRate,
    routing_completion_rate: routingCompletionRate,
    audit_trail_rate: auditTrailRate,
    return_rate: returnRate,
    unique_children_covered: uniqueChildrenCovered,
    category_diversity: categoryDiversity,
    total_time_saved_minutes: totalTimeSaved,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
