// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME AUTOMATION ROI INTELLIGENCE ENGINE
// Home-level: measures platform automation effectiveness — time savings from
// automated routing, route success/failure rates, automation coverage, error
// rates, and operational efficiency gains.
// CHR 2015 Reg 12 (Duty of Care), Reg 36 (Record Keeping).
// SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SavedTimeMetricInput {
  id: string;
  care_event_id: string;
  route_type: string;
  minutes_saved: number;
  staff_id: string;
  recorded_at: string; // ISO date
}

export interface CareEventRouteInput {
  id: string;
  care_event_id: string;
  route_type: string;
  status: string; // "completed" | "failed" | "pending"
  has_error: boolean;
  retry_count: number;
  time_saved_minutes: number;
  created_at: string; // ISO date
}

export interface CareEventBasicInput {
  id: string;
  child_id: string;
  staff_id: string;
  category: string;
  date: string; // ISO date
  has_routes: boolean;
}

export interface AutomationROIInput {
  today: string;
  total_staff: number;
  metrics: SavedTimeMetricInput[];
  routes: CareEventRouteInput[];
  events: CareEventBasicInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type AutomationROIRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AutomationROIInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface AutomationROIRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface AutomationROIResult {
  automation_rating: AutomationROIRating;
  automation_score: number;
  headline: string;
  total_time_saved: number;
  route_success_rate: number;
  automation_coverage: number;
  error_rate: number;
  route_type_diversity: number;
  avg_minutes_per_route: number;
  strengths: string[];
  concerns: string[];
  recommendations: AutomationROIRecommendation[];
  insights: AutomationROIInsight[];
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

function toRating(score: number): AutomationROIRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeAutomationROI(
  input: AutomationROIInput,
): AutomationROIResult {
  const { today, total_staff, metrics: allMetrics, routes: allRoutes, events: allEvents } = input;

  // Special case: no staff → insufficient data
  if (total_staff === 0) {
    return {
      automation_rating: "insufficient_data",
      automation_score: 0,
      headline: "No staff registered — automation ROI data not available.",
      total_time_saved: 0,
      route_success_rate: 0,
      automation_coverage: 0,
      error_rate: 0,
      route_type_diversity: 0,
      avg_minutes_per_route: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [{ text: "No staff currently registered in this home. Automation ROI metrics require active staff to assess.", severity: "warning" }],
    };
  }

  // Filter to last 90 days
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const metrics = allMetrics.filter(m => m.recorded_at >= cutoffStr && m.recorded_at <= today);
  const routes = allRoutes.filter(r => r.created_at >= cutoffStr && r.created_at <= today);
  const events = allEvents.filter(e => e.date >= cutoffStr && e.date <= today);

  // Special case: 0 metrics AND 0 routes AND 0 events with staff present
  if (metrics.length === 0 && routes.length === 0 && events.length === 0) {
    return {
      automation_rating: "inadequate",
      automation_score: 25,
      headline: "No automation activity in the last 90 days — platform automation is not being utilised.",
      total_time_saved: 0,
      route_success_rate: 0,
      automation_coverage: 0,
      error_rate: 0,
      route_type_diversity: 0,
      avg_minutes_per_route: 0,
      strengths: [],
      concerns: ["No automation activity recorded in the last 90 days despite staff being registered — the platform's routing and automation capabilities are not being used to support care governance."],
      recommendations: [{ rank: 1, recommendation: "Enable automated routing for care events immediately — routing ensures that safeguarding, health, and behavioural data reaches the right records without manual intervention.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" }],
      insights: [{ text: "No automation activity recorded with staff in place. This means care event data is not being routed automatically, requiring manual processes that increase administrative burden and risk information being missed. Ofsted expects homes to use systems effectively to support care governance.", severity: "critical" }],
    };
  }

  // ── Compute Metrics ───────────────────────────────────────────────────

  const totalTimeSaved = metrics.reduce((sum, m) => sum + m.minutes_saved, 0);

  const completedRoutes = routes.filter(r => r.status === "completed");
  const failedRoutes = routes.filter(r => r.status === "failed");
  const routeSuccessRate = pct(completedRoutes.length, routes.length);

  const eventsWithRoutes = events.filter(e => e.has_routes);
  const automationCoverage = pct(eventsWithRoutes.length, events.length);

  const routesWithError = routes.filter(r => r.has_error);
  const errorRate = pct(routesWithError.length, routes.length);

  const uniqueRouteTypes = new Set(routes.map(r => r.route_type));
  const routeTypeDiversity = uniqueRouteTypes.size;

  const totalRouteTimeSaved = routes.reduce((sum, r) => sum + r.time_saved_minutes, 0);
  const avgMinutesPerRoute = routes.length === 0 ? 0 : Math.round((totalRouteTimeSaved / routes.length) * 10) / 10;

  // Minutes saved per staff member
  const minutesPerStaff = total_staff > 0 ? totalTimeSaved / total_staff : 0;

  // ── Scoring: Base 52 + 6 modifiers ────────────────────────────────────

  let score = 52;

  // 1. Route success rate
  if (routeSuccessRate >= 95) score += 6;
  else if (routeSuccessRate >= 80) score += 3;
  else if (routeSuccessRate < 50) score -= 8;
  else if (routeSuccessRate < 65) score -= 5;

  // 2. Automation coverage (events with routes / total events)
  if (automationCoverage >= 90) score += 5;
  else if (automationCoverage >= 70) score += 2;
  else if (automationCoverage < 40) score -= 5;

  // 3. Error rate (lower is better)
  if (routes.length === 0) {
    score -= 1;
  } else {
    if (errorRate < 5) score += 5;
    else if (errorRate < 15) score += 2;
    else if (errorRate > 30) score -= 4;
  }

  // 4. Time saved effectiveness (minutes per staff)
  if (minutesPerStaff >= 30) score += 5;
  else if (minutesPerStaff >= 15) score += 2;
  else if (minutesPerStaff < 5) score -= 4;

  // 5. Route type diversity
  if (routeTypeDiversity >= 4) score += 4;
  else if (routeTypeDiversity >= 2) score += 2;
  else if (routeTypeDiversity === 0) score -= 4;

  // 6. Retry rate and reliability
  const totalRetries = routes.reduce((sum, r) => sum + r.retry_count, 0);
  const retryRate = pct(routes.filter(r => r.retry_count > 0).length, routes.length);
  if (retryRate < 5 && routes.length > 0) score += 5;
  else if (retryRate < 15) score += 2;
  else if (retryRate > 30) score -= 4;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (routeSuccessRate >= 95 && routes.length > 0) {
    strengths.push(`${routeSuccessRate}% route success rate — automated routing is highly reliable and consistent.`);
  } else if (routeSuccessRate >= 80 && routes.length > 0) {
    strengths.push(`${routeSuccessRate}% route success rate — automated routing is performing well with minor failures.`);
  }

  if (automationCoverage >= 90) {
    strengths.push(`${automationCoverage}% automation coverage — nearly all care events are being routed automatically.`);
  } else if (automationCoverage >= 70) {
    strengths.push(`${automationCoverage}% automation coverage — good proportion of care events have automated routing.`);
  }

  if (routes.length > 0 && errorRate < 5) {
    strengths.push(`Only ${errorRate}% error rate — automation is running cleanly with minimal failures.`);
  }

  if (minutesPerStaff >= 30) {
    strengths.push(`${totalTimeSaved} minutes saved (${Math.round(minutesPerStaff * 10) / 10} per staff member) — automation is delivering significant time savings.`);
  } else if (minutesPerStaff >= 15) {
    strengths.push(`${totalTimeSaved} minutes saved (${Math.round(minutesPerStaff * 10) / 10} per staff member) — good time savings from automation.`);
  }

  if (routeTypeDiversity >= 4) {
    strengths.push(`${routeTypeDiversity} route types active — automation covers a broad range of care event workflows.`);
  }

  if (retryRate < 5 && routes.length > 0) {
    strengths.push(`Only ${retryRate}% of routes required retries — first-time routing reliability is excellent.`);
  }

  if (totalTimeSaved > 0) {
    strengths.push(`${totalTimeSaved} total minutes saved through automation — reducing administrative burden on care staff.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (routes.length > 0 && routeSuccessRate < 65) {
    concerns.push(`Only ${routeSuccessRate}% route success rate — ${failedRoutes.length} routes have failed, meaning care event data is not reaching linked records reliably.`);
  }

  if (events.length > 0 && automationCoverage < 40) {
    concerns.push(`Only ${automationCoverage}% automation coverage — ${events.length - eventsWithRoutes.length} care events have no automated routing, requiring manual data transfer.`);
  }

  if (routes.length > 0 && errorRate > 30) {
    concerns.push(`${errorRate}% error rate across ${routes.length} routes — automation errors are frequent and may indicate system configuration issues.`);
  }

  if (minutesPerStaff < 5 && total_staff > 0 && metrics.length > 0) {
    concerns.push(`Only ${Math.round(minutesPerStaff * 10) / 10} minutes saved per staff member — automation is not delivering meaningful time savings to support care practice.`);
  }

  if (routeTypeDiversity === 0 && routes.length === 0 && events.length > 0) {
    concerns.push("No route types active — care events are not being routed to any linked systems.");
  } else if (routeTypeDiversity === 1 && routes.length > 0) {
    concerns.push(`Only 1 route type active — automation should cover multiple workflow types including safeguarding, health, and behavioural routing.`);
  }

  if (retryRate > 30 && routes.length > 0) {
    concerns.push(`${retryRate}% of routes required retries with ${totalRetries} total retry attempts — routing reliability needs investigation.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recs: AutomationROIRecommendation[] = [];
  let rank = 1;

  if (routes.length > 0 && routeSuccessRate < 65) {
    recs.push({ rank: rank++, recommendation: "Investigate and resolve route failures — care event data must flow to chronologies, risk assessments, and LAC reviews without interruption.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }

  if (events.length > 0 && automationCoverage < 40) {
    recs.push({ rank: rank++, recommendation: "Expand automation coverage — configure routing rules for all care event categories to ensure data reaches linked records automatically.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 36" });
  }

  if (routes.length > 0 && errorRate > 30) {
    recs.push({ rank: rank++, recommendation: "Address high error rate in automated routing — review system configuration, network connectivity, and route definitions to reduce failures.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }

  if (minutesPerStaff < 5 && total_staff > 0 && metrics.length > 0) {
    recs.push({ rank: rank++, recommendation: "Optimise automation workflows to increase time savings — staff should be spending less time on administrative routing and more time with children.", urgency: "soon", regulatory_ref: "SCCIF: Well-led and managed" });
  }

  if (routeTypeDiversity < 2 && events.length > 0) {
    recs.push({ rank: rank++, recommendation: "Configure additional route types — automation should cover safeguarding alerts, health notifications, behavioural tracking, and education updates.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 36" });
  }

  if (retryRate > 30 && routes.length > 0) {
    recs.push({ rank: rank++, recommendation: "Investigate high retry rates — frequent retries suggest intermittent failures that increase processing time and risk data delivery delays.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: AutomationROIInsight[] = [];

  if (routeSuccessRate >= 95 && automationCoverage >= 90 && errorRate < 5 && routes.length > 0) {
    insights.push({ text: `Automation is exemplary — ${routeSuccessRate}% route success, ${automationCoverage}% coverage, and only ${errorRate}% errors. The platform is operating at peak efficiency, ensuring care event data flows seamlessly to all linked records. Ofsted will see a home where technology supports robust care governance.`, severity: "positive" });
  }

  if (routeSuccessRate >= 80 && automationCoverage >= 70 && routes.length > 0) {
    insights.push({ text: `Strong automation performance — ${routeSuccessRate}% success rate with ${automationCoverage}% coverage demonstrates that the platform is well-configured and staff are using automated workflows effectively. This supports the SCCIF "Well-led and managed" judgement area.`, severity: "positive" });
  }

  if (minutesPerStaff >= 30 && totalTimeSaved >= 60) {
    insights.push({ text: `Automation has saved ${totalTimeSaved} minutes (${Math.round(totalTimeSaved / 60 * 10) / 10} hours) across ${total_staff} staff members. This significant time saving allows staff to spend more time with children and less on administrative tasks, directly supporting better care outcomes.`, severity: "positive" });
  }

  if (routes.length > 0 && routeSuccessRate < 50) {
    insights.push({ text: `Route success rate is critically low at ${routeSuccessRate}%. More than half of automated routes are failing, meaning care event data is not reaching linked records. Without reliable routing, the home cannot evidence that safeguarding, health, and behavioural data is being tracked across all relevant systems.`, severity: "critical" });
  }

  if (events.length > 0 && automationCoverage < 40) {
    insights.push({ text: `Automation coverage of ${automationCoverage}% means most care events lack automated routing. Staff must manually transfer data between systems, increasing workload and the risk of information being missed. Effective automation is a key indicator of a well-managed home under SCCIF.`, severity: "critical" });
  }

  if (routes.length > 0 && errorRate > 30) {
    insights.push({ text: `${errorRate}% of routes have errors — this high error rate suggests systemic issues with the automation configuration. Frequent errors undermine staff confidence in the platform and may lead to manual workarounds that bypass governance controls.`, severity: "warning" });
  }

  if (retryRate > 30 && routes.length > 0) {
    insights.push({ text: `${retryRate}% of routes required retries with ${totalRetries} total attempts. While retries show the system is resilient, the volume indicates underlying reliability issues that should be investigated to prevent data delivery delays.`, severity: "warning" });
  }

  if (routeTypeDiversity >= 4 && routeSuccessRate >= 80) {
    insights.push({ text: `${routeTypeDiversity} route types operating with ${routeSuccessRate}% success rate demonstrates comprehensive automation coverage across multiple care domains. This breadth of automation supports holistic care governance.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding automation ROI — ${routeSuccessRate}% route success, ${automationCoverage}% coverage, ${totalTimeSaved} minutes saved.`;
  } else if (rating === "good") {
    headline = `Good automation performance — solid routing success and coverage with minor efficiency gaps.`;
  } else if (rating === "adequate") {
    headline = "Adequate automation ROI — routing and coverage rates need improvement to fully realise platform benefits.";
  } else {
    headline = "Automation ROI is inadequate — low route success, poor coverage, or high error rates undermine platform effectiveness.";
  }

  return {
    automation_rating: rating,
    automation_score: score,
    headline,
    total_time_saved: totalTimeSaved,
    route_success_rate: routeSuccessRate,
    automation_coverage: automationCoverage,
    error_rate: errorRate,
    route_type_diversity: routeTypeDiversity,
    avg_minutes_per_route: avgMinutesPerRoute,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
