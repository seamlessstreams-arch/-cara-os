// ══════════════════════════════════════════════════════════════════════════════
// CARA — EMERGENCY PREPAREDNESS INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses protocol drills, emergency plans, and overall preparedness to
// surface compliance gaps, overdue drills, expired plans, and response
// time patterns.
//
// Regulatory: Reg 22 (arrangements for protection of children — emergency
// planning), Reg 25 (premises — safe environment, fire safety), Reg 40
// (notifications — serious incidents).
// SCCIF: "Helped & Protected" and "Leadership & Management".
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ProtocolDrillInput {
  id: string;
  date: string; // YYYY-MM-DD
  scenario_type: string;
  lead_by: string;
  participants: string[];
  response_time_minutes: number;
  protocol_followed: boolean;
  outcome: string; // "satisfactory" | "needs_improvement" | "failed"
  next_drill_due: string;
  actions_required: string[];
  learning_points: string[];
}

export interface EmergencyPlanInput {
  id: string;
  title: string;
  plan_type: string;
  status: string; // "current" | "review_due" | "draft"
  last_tested: string;
  next_test: string;
  evacuation_required: boolean;
}

export interface StaffRef {
  id: string;
  name: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface EmergencyOverview {
  total_drills: number;
  drills_last_90_days: number;
  avg_response_time_minutes: number;
  protocol_followed_rate: number;
  satisfactory_rate: number;
  total_plans: number;
  current_plans: number;
  expired_plans: number;
  total_actions_outstanding: number;
}

export interface DrillTypeStatus {
  scenario_type: string;
  type_label: string;
  drill_count: number;
  last_drill_date: string | null;
  next_due: string | null;
  status: "current" | "due" | "overdue";
}

export interface RecentDrill {
  drill_id: string;
  date: string;
  scenario_type: string;
  type_label: string;
  response_time_minutes: number;
  outcome: string;
  issues_count: number;
}

export interface PlanCoverage {
  plan_types_required: number;
  plan_types_covered: number;
  plans_current: number;
  plans_review_due: number;
  plans_draft: number;
}

export interface EmergencyAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraEmergencyInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface EmergencyIntelligenceResult {
  overview: EmergencyOverview;
  drill_types: DrillTypeStatus[];
  recent_drills: RecentDrill[];
  plan_coverage: PlanCoverage;
  alerts: EmergencyAlert[];
  insights: CaraEmergencyInsight[];
}

// ── Constants ───────────────────────────────────────────────────────────────

export const SCENARIO_TYPE_LABELS: Record<string, string> = {
  missing_child: "Missing Child",
  medical_emergency: "Medical Emergency",
  power_failure: "Power Failure",
  intruder_alert: "Intruder Alert",
  flooding: "Flooding",
  evacuation: "Evacuation",
  medication_error_response: "Medication Error Response",
};

export const ALL_SCENARIO_TYPES = Object.keys(SCENARIO_TYPE_LABELS);

export const ALL_PLAN_TYPES = [
  "fire_evacuation",
  "power_failure",
  "flood_water_damage",
  "infectious_disease",
  "serious_incident",
];

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysUntil(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
  );
}

export function daysSince(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
  );
}

function getLabel(scenarioType: string): string {
  return SCENARIO_TYPE_LABELS[scenarioType] ?? scenarioType;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeEmergencyIntelligence(input: {
  drills: ProtocolDrillInput[];
  plans: EmergencyPlanInput[];
  staff: StaffRef[];
  today?: string;
}): EmergencyIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { drills, plans } = input;

  // ── Drill analysis ──────────────────────────────────────────────────────

  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().slice(0, 10);

  const drillsLast90 = drills.filter((d) => d.date >= ninetyDaysAgoStr);

  const avgResponseTime =
    drills.length > 0
      ? Math.round(
          (drills.reduce((sum, d) => sum + d.response_time_minutes, 0) /
            drills.length) *
            10,
        ) / 10
      : 0;

  const protocolFollowedCount = drills.filter((d) => d.protocol_followed).length;
  const protocolFollowedRate =
    drills.length > 0
      ? Math.round((protocolFollowedCount / drills.length) * 100)
      : 100;

  const satisfactoryCount = drills.filter((d) => d.outcome === "satisfactory").length;
  const satisfactoryRate =
    drills.length > 0
      ? Math.round((satisfactoryCount / drills.length) * 100)
      : 100;

  const totalActionsOutstanding = drills.reduce(
    (sum, d) => sum + d.actions_required.length,
    0,
  );

  // ── Drill type statuses ─────────────────────────────────────────────────

  const drillsByType = new Map<string, ProtocolDrillInput[]>();
  for (const d of drills) {
    const arr = drillsByType.get(d.scenario_type) ?? [];
    arr.push(d);
    drillsByType.set(d.scenario_type, arr);
  }

  const drill_types: DrillTypeStatus[] = ALL_SCENARIO_TYPES.map((scenarioType) => {
    const typeDrills = drillsByType.get(scenarioType) ?? [];
    const drillCount = typeDrills.length;

    // Sort by date descending to find latest
    const sorted = [...typeDrills].sort((a, b) => b.date.localeCompare(a.date));
    const lastDrillDate = sorted.length > 0 ? sorted[0].date : null;

    // Find earliest next_drill_due from the most recent drill
    const nextDue = sorted.length > 0 ? sorted[0].next_drill_due : null;

    let status: "current" | "due" | "overdue";
    if (drillCount === 0) {
      status = "overdue";
    } else if (!nextDue) {
      status = "overdue";
    } else {
      const daysToNext = daysUntil(today, nextDue);
      if (daysToNext < 0) {
        status = "overdue";
      } else if (daysToNext <= 30) {
        status = "due";
      } else {
        status = "current";
      }
    }

    return {
      scenario_type: scenarioType,
      type_label: getLabel(scenarioType),
      drill_count: drillCount,
      last_drill_date: lastDrillDate,
      next_due: nextDue,
      status,
    };
  });

  // ── Recent drills (sorted by date descending) ───────────────────────────

  const recent_drills: RecentDrill[] = [...drills]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)
    .map((d) => ({
      drill_id: d.id,
      date: d.date,
      scenario_type: d.scenario_type,
      type_label: getLabel(d.scenario_type),
      response_time_minutes: d.response_time_minutes,
      outcome: d.outcome,
      issues_count: d.actions_required.length + (d.protocol_followed ? 0 : 1),
    }));

  // ── Plan coverage ───────────────────────────────────────────────────────

  const currentPlanTypes = new Set(
    plans.filter((p) => p.status === "current").map((p) => p.plan_type),
  );

  const plansCurrent = plans.filter((p) => p.status === "current").length;
  const plansReviewDue = plans.filter((p) => p.status === "review_due").length;
  const plansDraft = plans.filter((p) => p.status === "draft").length;

  const plan_coverage: PlanCoverage = {
    plan_types_required: ALL_PLAN_TYPES.length,
    plan_types_covered: currentPlanTypes.size,
    plans_current: plansCurrent,
    plans_review_due: plansReviewDue,
    plans_draft: plansDraft,
  };

  // ── Expired plans (next_test < today) ───────────────────────────────────

  const expiredPlans = plans.filter((p) => daysUntil(today, p.next_test) < 0);

  // ── Overview ────────────────────────────────────────────────────────────

  const overview: EmergencyOverview = {
    total_drills: drills.length,
    drills_last_90_days: drillsLast90.length,
    avg_response_time_minutes: avgResponseTime,
    protocol_followed_rate: protocolFollowedRate,
    satisfactory_rate: satisfactoryRate,
    total_plans: plans.length,
    current_plans: plansCurrent,
    expired_plans: expiredPlans.length,
    total_actions_outstanding: totalActionsOutstanding,
  };

  // ── Alerts ────────────────────────────────────────────────────────────

  const alerts: EmergencyAlert[] = [];

  // Critical: drill type never conducted
  for (const dt of drill_types) {
    if (dt.drill_count === 0) {
      alerts.push({
        severity: "critical",
        message: `'${dt.type_label}' drill has never been conducted — schedule immediately`,
      });
    }
  }

  // High: drill type overdue (has been done before but next_due < today)
  for (const dt of drill_types) {
    if (dt.status === "overdue" && dt.drill_count > 0 && dt.next_due) {
      alerts.push({
        severity: "high",
        message: `'${dt.type_label}' drill is overdue (due ${dt.next_due})`,
      });
    }
  }

  // High: plan expired/review_due
  for (const p of plans) {
    if (daysUntil(today, p.next_test) < 0) {
      alerts.push({
        severity: "high",
        message: `Emergency plan '${p.title}' needs review (due ${p.next_test})`,
      });
    }
  }

  // Medium: drill outcome "needs_improvement" or "failed" in last drill of that type
  for (const dt of drill_types) {
    if (dt.drill_count === 0) continue;
    const typeDrills = drillsByType.get(dt.scenario_type) ?? [];
    const sorted = [...typeDrills].sort((a, b) => b.date.localeCompare(a.date));
    const lastDrill = sorted[0];
    if (lastDrill.outcome === "needs_improvement" || lastDrill.outcome === "failed") {
      alerts.push({
        severity: "medium",
        message: `Last '${dt.type_label}' drill outcome: ${lastDrill.outcome} — address actions before next drill`,
      });
    }
  }

  // Medium: protocol compliance < 90%
  if (protocolFollowedRate < 90 && drills.length > 0) {
    alerts.push({
      severity: "medium",
      message: `Protocol compliance rate is ${protocolFollowedRate}% (below 90% threshold) — review training needs`,
    });
  }

  // Low: outstanding actions > 3
  if (totalActionsOutstanding > 3) {
    alerts.push({
      severity: "low",
      message: `${totalActionsOutstanding} outstanding actions from drills — review and allocate to responsible staff`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────

  const insights: CaraEmergencyInsight[] = [];

  // Critical: drill type never conducted
  const neverConducted = drill_types.filter((dt) => dt.drill_count === 0);
  if (neverConducted.length > 0) {
    const types = neverConducted.map((dt) => dt.type_label).join(", ");
    insights.push({
      severity: "critical",
      text: `${neverConducted.length} drill type(s) never conducted: ${types}. Under Reg 22, the home must demonstrate readiness for all foreseeable emergency scenarios. Schedule these drills immediately.`,
    });
  }

  // Warning: overdue drills
  const overdueDrills = drill_types.filter(
    (dt) => dt.status === "overdue" && dt.drill_count > 0,
  );
  if (overdueDrills.length > 0) {
    const types = overdueDrills.map((dt) => dt.type_label).join(", ");
    insights.push({
      severity: "warning",
      text: `${overdueDrills.length} drill type(s) overdue: ${types}. Overdue drills create gaps in emergency preparedness evidence. Ofsted inspectors and Reg 44 visitors will examine drill schedules.`,
    });
  }

  // Warning: expired plans
  if (expiredPlans.length > 0) {
    insights.push({
      severity: "warning",
      text: `${expiredPlans.length} emergency plan(s) have passed their test date without renewal. Under SCCIF "Leadership & Management", inspectors expect current and tested emergency plans for all identified risks.`,
    });
  }

  // Warning: low protocol compliance
  if (protocolFollowedRate < 90 && drills.length > 0) {
    insights.push({
      severity: "warning",
      text: `Protocol compliance during drills is ${protocolFollowedRate}%. Staff are deviating from agreed procedures — this indicates a training gap or that protocols need revision to be practical.`,
    });
  }

  // Warning: failed drills
  const failedDrills = drills.filter((d) => d.outcome === "failed");
  if (failedDrills.length > 0) {
    insights.push({
      severity: "warning",
      text: `${failedDrills.length} drill(s) resulted in a "failed" outcome. Failed drills indicate the home cannot effectively respond to that scenario — urgent remedial action and re-drill required.`,
    });
  }

  // Positive: all types drilled recently (within 90 days)
  const allTypesDrilled = ALL_SCENARIO_TYPES.every((type) => {
    const typeDrills = drillsByType.get(type) ?? [];
    return typeDrills.some((d) => d.date >= ninetyDaysAgoStr);
  });
  if (allTypesDrilled && drills.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${ALL_SCENARIO_TYPES.length} emergency scenario types have been drilled within the last 90 days. This demonstrates excellent preparedness and proactive safety management under Reg 22.`,
    });
  }

  // Positive: high protocol compliance >= 95%
  if (protocolFollowedRate >= 95 && drills.length > 0) {
    insights.push({
      severity: "positive",
      text: `Protocol compliance rate is ${protocolFollowedRate}%. Staff consistently follow agreed emergency procedures — this is strong evidence of effective training and leadership.`,
    });
  }

  // Positive: all satisfactory
  if (satisfactoryRate === 100 && drills.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${drills.length} drills achieved a satisfactory outcome. The home consistently demonstrates effective emergency response capability.`,
    });
  }

  // Positive: all plans current
  const allPlansCurrent =
    plans.length >= ALL_PLAN_TYPES.length &&
    plans.every((p) => p.status === "current") &&
    expiredPlans.length === 0;
  if (allPlansCurrent && plans.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${plans.length} emergency plans are current and within their test dates. The home has comprehensive emergency planning coverage as required under Reg 22.`,
    });
  }

  // Positive: low response times (below 5 min average)
  if (avgResponseTime > 0 && avgResponseTime < 5 && drills.length > 0) {
    insights.push({
      severity: "positive",
      text: `Average drill response time is ${avgResponseTime} minutes (below 5-minute target). Fast response times indicate well-rehearsed staff who can act decisively in emergencies.`,
    });
  }

  return {
    overview,
    drill_types,
    recent_drills,
    plan_coverage,
    alerts,
    insights,
  };
}
