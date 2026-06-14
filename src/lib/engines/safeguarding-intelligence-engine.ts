// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFEGUARDING INTELLIGENCE ENGINE
//
// Pure deterministic engine that aggregates incidents, missing episodes,
// restraints, risk assessments, and notifiable events to produce:
// - Safeguarding compliance profile (referrals, notifications, timeliness)
// - Restraint analysis (frequency, duration, debrief completion)
// - Risk assessment overview (per-child, per-domain, review status)
// - Missing episode analysis (patterns, contextual safeguarding)
// - Notifiable event compliance (Reg 40 timeliness)
// - Auto-generated Cara safeguarding insights (deterministic)
//
// Key regulatory requirements:
//   Reg 12 — Protection of children
//   Reg 33 — Employment of staff (DBS, suitability)
//   Reg 34 — Complaints
//   Reg 35 — Behaviour management
//   Reg 40 — Notification of serious events (Ofsted)
//   Reg 41 — Notification to placing authority/parents
//   SCCIF: "How well children are helped and protected"
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface IncidentInput {
  id: string;
  child_id: string;
  date: string;
  type: string;
  severity: string;
  status: string; // open, under_review, closed
  requires_oversight: boolean;
  oversight_by: string | null;
}

export interface MissingEpisodeInput {
  id: string;
  child_id: string;
  date_missing: string;
  status: string;
  risk_level: string;
  return_interview_completed: boolean;
  contextual_safeguarding_risk: boolean;
}

export interface RestraintInput {
  id: string;
  child_id: string;
  date: string;
  duration: number; // minutes
  reason: string;
  restraint_type: string;
  injuries: { person: string; description: string }[];
  child_debriefed: boolean;
  staff_debriefed: boolean;
  review_status: string; // reviewed, pending
  de_escalation_attempts: string[];
}

export interface RiskAssessmentInput {
  id: string;
  child_id: string;
  domain: string;
  current_level: string; // low, medium, high, very_high
  previous_level: string;
  trend: string; // increasing, stable, decreasing
  status: string; // current, archived
  review_date: string;
  assessed_date: string;
}

export interface NotifiableEventInput {
  id: string;
  date: string;
  event_type: string;
  child_id: string | null;
  ofsted_status: string; // pending, notified_within_24h, notified_late, not_required
}

export interface ChildRef {
  id: string;
  name: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface SafeguardingProfile {
  total_incidents_90d: number;
  open_incidents: number;
  incidents_needing_oversight: number;
  safeguarding_incidents_90d: number;
  incident_trend: "increasing" | "stable" | "decreasing";
}

export interface RestraintProfile {
  total_restraints_90d: number;
  total_restraints_30d: number;
  children_restrained: number;
  average_duration_minutes: number;
  injuries_during_restraint: number;
  debrief_completion_rate: number; // percentage
  review_completion_rate: number; // percentage
  de_escalation_always_attempted: boolean;
}

export interface RiskAssessmentProfile {
  total_current: number;
  high_or_very_high: number;
  overdue_reviews: number;
  improving_trend: number;
  stable_trend: number;
  worsening_trend: number;
  by_domain: { domain: string; count: number; highest_level: string }[];
}

export interface MissingProfile {
  total_episodes_90d: number;
  total_episodes_30d: number;
  children_with_episodes: number;
  repeat_missing_children: number; // 3+ episodes in 90 days
  return_interview_rate: number; // percentage
  contextual_safeguarding_flagged: number;
  high_risk_episodes: number;
}

export interface NotifiableEventProfile {
  total_events: number;
  notified_on_time: number;
  notified_late: number;
  pending_notification: number;
  compliance_rate: number; // percentage
  by_type: { type: string; count: number }[];
}

export interface CaraInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface SafeguardingIntelligenceResult {
  profile: SafeguardingProfile;
  restraints: RestraintProfile;
  risk_assessments: RiskAssessmentProfile;
  missing: MissingProfile;
  notifiable_events: NotifiableEventProfile;
  insights: CaraInsight[];
}

export interface SafeguardingIntelligenceInput {
  incidents: IncidentInput[];
  missingEpisodes: MissingEpisodeInput[];
  restraints: RestraintInput[];
  riskAssessments: RiskAssessmentInput[];
  notifiableEvents: NotifiableEventInput[];
  children: ChildRef[];
  today?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

/** Classify an incident type as safeguarding-related */
export function isSafeguardingIncident(type: string): boolean {
  const sgTypes = [
    "safeguarding", "child_protection", "allegation", "disclosure",
    "exploitation", "abuse", "neglect", "radicalisation",
    "trafficking", "fgm", "forced_marriage", "honour_based",
    "sexual_exploitation", "criminal_exploitation", "county_lines",
    "online_harm", "peer_on_peer", "cse", "cce",
  ];
  const lower = type.toLowerCase().replace(/[- ]/g, "_");
  return sgTypes.some((t) => lower.includes(t));
}

/** Compute trend from two period counts */
export function computeTrend(
  recentCount: number,
  olderCount: number,
): "increasing" | "stable" | "decreasing" {
  if (recentCount > olderCount + 1) return "increasing";
  if (recentCount < olderCount - 1) return "decreasing";
  return "stable";
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function computeSafeguardingIntelligence(
  input: SafeguardingIntelligenceInput,
): SafeguardingIntelligenceResult {
  const today = input.today ?? todayStr();
  const { incidents, missingEpisodes, restraints, riskAssessments, notifiableEvents, children } = input;

  const ninetyDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  })();

  const thirtyDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();

  const fortyFiveDaysAgo = (() => {
    const d = new Date(today + "T00:00:00Z");
    d.setDate(d.getDate() - 45);
    return d.toISOString().slice(0, 10);
  })();

  // ── Safeguarding Profile ──────────────────────────────────────────────

  const incidents90d = incidents.filter((i) => i.date >= ninetyDaysAgo);
  const openIncidents = incidents.filter((i) => i.status === "open" || i.status === "under_review");
  const needingOversight = incidents.filter((i) => i.requires_oversight && !i.oversight_by);
  const safeguardingIncidents90d = incidents90d.filter((i) => isSafeguardingIncident(i.type));

  // Trend: compare last 45 days vs prior 45 days
  const recentIncidents = incidents.filter((i) => i.date >= fortyFiveDaysAgo).length;
  const olderIncidents = incidents.filter((i) => i.date >= ninetyDaysAgo && i.date < fortyFiveDaysAgo).length;
  const incidentTrend = computeTrend(recentIncidents, olderIncidents);

  const profile: SafeguardingProfile = {
    total_incidents_90d: incidents90d.length,
    open_incidents: openIncidents.length,
    incidents_needing_oversight: needingOversight.length,
    safeguarding_incidents_90d: safeguardingIncidents90d.length,
    incident_trend: incidentTrend,
  };

  // ── Restraint Profile ─────────────────────────────────────────────────

  const restraints90d = restraints.filter((r) => r.date >= ninetyDaysAgo);
  const restraints30d = restraints.filter((r) => r.date >= thirtyDaysAgo);
  const restrainedChildren = new Set(restraints90d.map((r) => r.child_id));

  const avgDuration = restraints90d.length > 0
    ? Math.round((restraints90d.reduce((sum, r) => sum + r.duration, 0) / restraints90d.length) * 10) / 10
    : 0;

  const totalInjuries = restraints90d.reduce((sum, r) => sum + r.injuries.length, 0);

  const childDebriefed = restraints90d.filter((r) => r.child_debriefed).length;
  const staffDebriefed = restraints90d.filter((r) => r.staff_debriefed).length;
  const totalDebriefable = restraints90d.length * 2; // child + staff per restraint
  const debriefRate = totalDebriefable > 0
    ? Math.round(((childDebriefed + staffDebriefed) / totalDebriefable) * 100)
    : 100;

  const reviewed = restraints90d.filter((r) => r.review_status === "reviewed").length;
  const reviewRate = restraints90d.length > 0
    ? Math.round((reviewed / restraints90d.length) * 100)
    : 100;

  const deEscalationAlways = restraints90d.length === 0 ||
    restraints90d.every((r) => r.de_escalation_attempts.length > 0);

  const restraintProfile: RestraintProfile = {
    total_restraints_90d: restraints90d.length,
    total_restraints_30d: restraints30d.length,
    children_restrained: restrainedChildren.size,
    average_duration_minutes: avgDuration,
    injuries_during_restraint: totalInjuries,
    debrief_completion_rate: debriefRate,
    review_completion_rate: reviewRate,
    de_escalation_always_attempted: deEscalationAlways,
  };

  // ── Risk Assessment Profile ───────────────────────────────────────────

  const currentAssessments = riskAssessments.filter((r) => r.status === "current");
  const highOrVeryHigh = currentAssessments.filter(
    (r) => r.current_level === "high" || r.current_level === "very_high"
  ).length;

  const overdueReviews = currentAssessments.filter(
    (r) => r.review_date < today
  ).length;

  const improving = currentAssessments.filter((r) => r.trend === "decreasing").length;
  const stable = currentAssessments.filter((r) => r.trend === "stable").length;
  const worsening = currentAssessments.filter((r) => r.trend === "increasing").length;

  // Domain breakdown
  const domainMap = new Map<string, { count: number; levels: string[] }>();
  for (const ra of currentAssessments) {
    const existing = domainMap.get(ra.domain);
    if (existing) {
      existing.count++;
      existing.levels.push(ra.current_level);
    } else {
      domainMap.set(ra.domain, { count: 1, levels: [ra.current_level] });
    }
  }

  const levelOrder: Record<string, number> = { very_high: 4, high: 3, medium: 2, low: 1 };
  const byDomain = Array.from(domainMap.entries())
    .map(([domain, data]) => ({
      domain,
      count: data.count,
      highest_level: data.levels.sort((a, b) => (levelOrder[b] ?? 0) - (levelOrder[a] ?? 0))[0],
    }))
    .sort((a, b) => (levelOrder[b.highest_level] ?? 0) - (levelOrder[a.highest_level] ?? 0));

  const riskProfile: RiskAssessmentProfile = {
    total_current: currentAssessments.length,
    high_or_very_high: highOrVeryHigh,
    overdue_reviews: overdueReviews,
    improving_trend: improving,
    stable_trend: stable,
    worsening_trend: worsening,
    by_domain: byDomain,
  };

  // ── Missing Profile ───────────────────────────────────────────────────

  const missing90d = missingEpisodes.filter((m) => m.date_missing >= ninetyDaysAgo);
  const missing30d = missingEpisodes.filter((m) => m.date_missing >= thirtyDaysAgo);
  const childrenWithEpisodes = new Set(missing90d.map((m) => m.child_id));

  // Count per-child episodes for repeat detection
  const childEpisodeCounts = new Map<string, number>();
  for (const m of missing90d) {
    childEpisodeCounts.set(m.child_id, (childEpisodeCounts.get(m.child_id) ?? 0) + 1);
  }
  const repeatMissing = Array.from(childEpisodeCounts.values()).filter((c) => c >= 3).length;

  const closedEpisodes = missing90d.filter((m) => m.status === "closed");
  const returnInterviewed = closedEpisodes.filter((m) => m.return_interview_completed).length;
  const returnInterviewRate = closedEpisodes.length > 0
    ? Math.round((returnInterviewed / closedEpisodes.length) * 100)
    : 100;

  const csFlagged = missing90d.filter((m) => m.contextual_safeguarding_risk).length;
  const highRiskEpisodes = missing90d.filter((m) => m.risk_level === "high").length;

  const missingProfile: MissingProfile = {
    total_episodes_90d: missing90d.length,
    total_episodes_30d: missing30d.length,
    children_with_episodes: childrenWithEpisodes.size,
    repeat_missing_children: repeatMissing,
    return_interview_rate: returnInterviewRate,
    contextual_safeguarding_flagged: csFlagged,
    high_risk_episodes: highRiskEpisodes,
  };

  // ── Notifiable Events Profile ─────────────────────────────────────────

  const requiresNotification = notifiableEvents.filter(
    (n) => n.ofsted_status !== "not_required"
  );
  const notifiedOnTime = requiresNotification.filter(
    (n) => n.ofsted_status === "notified_within_24h"
  ).length;
  const notifiedLate = requiresNotification.filter(
    (n) => n.ofsted_status === "notified_late"
  ).length;
  const pending = requiresNotification.filter(
    (n) => n.ofsted_status === "pending"
  ).length;

  const complianceRate = requiresNotification.length > 0
    ? Math.round((notifiedOnTime / requiresNotification.length) * 100)
    : 100;

  // By type breakdown
  const typeMap = new Map<string, number>();
  for (const ne of notifiableEvents) {
    typeMap.set(ne.event_type, (typeMap.get(ne.event_type) ?? 0) + 1);
  }
  const byType = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const notifiableProfile: NotifiableEventProfile = {
    total_events: notifiableEvents.length,
    notified_on_time: notifiedOnTime,
    notified_late: notifiedLate,
    pending_notification: pending,
    compliance_rate: complianceRate,
    by_type: byType,
  };

  // ── Build child name lookup ───────────────────────────────────────────
  const childNameMap = new Map<string, string>();
  for (const c of children) {
    childNameMap.set(c.id, c.name);
  }
  const childName = (id: string) => childNameMap.get(id) ?? "Unknown child";

  // ── Cara Safeguarding Intelligence Insights ───────────────────────────
  const insights: CaraInsight[] = [];

  // 1. Pending Ofsted notifications (critical)
  if (pending > 0) {
    insights.push({
      severity: "critical",
      text: `${pending} Reg 40 notification(s) pending to Ofsted. Serious events must be notified without delay. Failure to notify is a compliance breach and will be scrutinised at inspection.`,
    });
  }

  // 2. Late notifications (warning)
  if (notifiedLate > 0) {
    insights.push({
      severity: "warning",
      text: `${notifiedLate} Ofsted notification(s) were sent late. While notified, timeliness is a key Ofsted indicator. Review notification processes to ensure immediate reporting.`,
    });
  }

  // 3. Incidents needing management oversight (critical)
  if (needingOversight.length > 0) {
    insights.push({
      severity: "critical",
      text: `${needingOversight.length} incident(s) require management oversight and have not been reviewed. Reg 45 requires the registered person to monitor and review safety. Complete review promptly.`,
    });
  }

  // 4. Restraint analysis
  if (restraints90d.length > 0) {
    const unDebriefed = restraints90d.filter((r) => !r.child_debriefed);
    if (unDebriefed.length > 0) {
      const unDebriefedNames = [...new Set(unDebriefed.map((r) => childName(r.child_id)))].join(", ");
      insights.push({
        severity: "warning",
        text: `${unDebriefed.length} restraint(s) without child debrief completion (${unDebriefedNames}). Post-restraint debriefs are essential for Reg 35 compliance and therapeutic recovery.`,
      });
    }

    if (totalInjuries > 0) {
      insights.push({
        severity: "warning",
        text: `${totalInjuries} injury/injuries recorded during restraints in the past 90 days. Each requires body map, medical check, and Reg 40 consideration. Review technique and proportionality.`,
      });
    }

    if (deEscalationAlways && restraints90d.length > 0) {
      insights.push({
        severity: "positive",
        text: "De-escalation attempts documented before every restraint. This evidences proportionate, last-resort approach consistent with Reg 35 and Team Teach principles.",
      });
    }
  }

  // 5. Missing from care patterns
  if (repeatMissing > 0) {
    const repeatChildren = Array.from(childEpisodeCounts.entries())
      .filter(([, count]) => count >= 3)
      .map(([id]) => childName(id));
    insights.push({
      severity: "critical",
      text: `${repeatChildren.join(", ")} — repeat missing pattern (3+ episodes in 90 days). Requires multi-agency strategy discussion, updated risk assessment, and potential NRM/MACE referral.`,
    });
  }

  if (csFlagged > 0) {
    insights.push({
      severity: "warning",
      text: `${csFlagged} missing episode(s) flagged for contextual safeguarding risk. Ensure contextual safeguarding mapping is updated and shared with placing authority and police.`,
    });
  }

  if (returnInterviewRate < 100 && closedEpisodes.length > 0) {
    insights.push({
      severity: "warning",
      text: `Return interview completion rate is ${returnInterviewRate}%. Every missing episode must have a return home interview within 72 hours to identify safeguarding concerns.`,
    });
  }

  // 6. Risk assessments
  if (overdueReviews > 0) {
    insights.push({
      severity: "warning",
      text: `${overdueReviews} risk assessment(s) overdue for review. Current assessments must be reviewed regularly to remain effective. Update before next inspection or review meeting.`,
    });
  }

  if (worsening > 0) {
    const worseningAssessments = currentAssessments.filter((r) => r.trend === "increasing");
    const worseningChildren = [...new Set(worseningAssessments.map((r) => childName(r.child_id)))];
    const worseningDomains = [...new Set(worseningAssessments.map((r) => r.domain.replace(/_/g, " ")))];
    insights.push({
      severity: "warning",
      text: `${worsening} risk assessment(s) showing increasing trend (${worseningChildren.join(", ")} — ${worseningDomains.join(", ")}). Review mitigation strategies and consider multi-agency input.`,
    });
  }

  // 7. Positive safeguarding patterns
  if (safeguardingIncidents90d.length === 0 && incidents90d.length > 0) {
    insights.push({
      severity: "positive",
      text: "No safeguarding-specific incidents in 90 days. General incident management is in place. Continue vigilance and proactive recording.",
    });
  }

  if (improving > 0 && worsening === 0) {
    insights.push({
      severity: "positive",
      text: `${improving} risk assessment(s) showing decreasing risk trend with zero worsening. Evidence of effective risk management and positive progress for children.`,
    });
  }

  if (restraints90d.length === 0 && children.length > 0) {
    insights.push({
      severity: "positive",
      text: "Zero restraints in the past 90 days. This evidences effective de-escalation practice and a settled, therapeutic home environment.",
    });
  }

  if (missing90d.length === 0 && children.length > 0) {
    insights.push({
      severity: "positive",
      text: "No missing from care episodes in 90 days. Children are settled and engaged. Continue building trusting relationships and monitoring wellbeing.",
    });
  }

  // 8. Overall compliance
  if (pending === 0 && notifiedLate === 0 && needingOversight.length === 0 && overdueReviews === 0) {
    insights.push({
      severity: "positive",
      text: "Safeguarding compliance strong — all notifications timely, all oversight complete, all risk reviews current. Continue robust safeguarding practice.",
    });
  }

  // Ensure at least one insight
  if (insights.length === 0) {
    insights.push({
      severity: "positive",
      text: "Safeguarding intelligence engine active. Recording and monitoring systems in place. Continue evidencing practice against Reg 12, 35, 40, and SCCIF criteria.",
    });
  }

  return {
    profile,
    restraints: restraintProfile,
    risk_assessments: riskProfile,
    missing: missingProfile,
    notifiable_events: notifiableProfile,
    insights,
  };
}
