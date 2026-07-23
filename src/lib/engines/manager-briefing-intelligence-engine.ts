// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGER'S INTELLIGENCE BRIEFING ENGINE
//
// Pure deterministic meta-engine — no DB calls, no side effects, no LLM calls.
// Aggregates outputs from ALL domain intelligence engines into a single
// comprehensive daily briefing for the Registered Manager.
//
// Cross-cuts: Safeguarding, Behaviour, Workforce, Premises, Complaints,
// Quality Assurance, Health, Education, Placement, Contact, Finance,
// Supervision, Leaving Care, Night Monitoring + all sub-domain engines.
//
// Regulatory: CHR 2015 Reg 5 (RM duties), Reg 45 (quality of care review),
// SCCIF: Overall Experiences, Helped & Protected, Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import { meanOf, meets, below, formatRate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export type DomainStatus = "green" | "amber" | "red";

export interface DomainDigest {
  domain: string;
  domain_label: string;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  total_alerts: number;
  compliance_rate: number | null;
  overdue_count: number;
  improving_count: number;
  worsening_count: number;
  key_metric_label: string;
  key_metric_value: number | null;
  key_metric_target: number | null;
  alerts: Array<{ severity: string; message: string }>;
  insights: Array<{ severity: string; text: string }>;
}

export interface ChildAttentionInput {
  child_id: string;
  child_name: string;
  domains_flagged: string[];
  highest_severity: "critical" | "high" | "medium" | "low";
  flags: string[];
}

export interface ManagerBriefingInput {
  domains: DomainDigest[];
  children_attention: ChildAttentionInput[];
  total_children: number;
  total_staff: number;
  home_name: string;
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

// "unknown" = no domain intelligence reached the briefing at all. Silence is not stability.
export type OverallRiskLevel = "critical" | "elevated" | "moderate" | "stable" | "unknown";

export interface ExecutiveSummary {
  overall_risk_level: OverallRiskLevel;
  headline: string;
  total_critical_alerts: number;
  total_high_alerts: number;
  total_alerts: number;
  domains_at_risk: number;
  domains_compliant: number;
  domains_total: number;
  avg_compliance_rate: number | null; // null when no domain reported a compliance rate
  children_requiring_attention: number;
  total_children: number;
  total_staff: number;
}

export interface DomainHealth {
  domain: string;
  domain_label: string;
  status: DomainStatus;
  compliance_rate: number | null;
  alert_count: number;
  critical_count: number;
  overdue_count: number;
  trend_direction: "improving" | "stable" | "worsening";
  key_metric: string;
  key_metric_value: number | null;
  key_metric_target: number | null;
}

export interface ChildAttentionSummary {
  child_id: string;
  child_name: string;
  severity: "critical" | "high" | "medium" | "low";
  domains_flagged: string[];
  flags: string[];
  action_required: string;
}

export interface PriorityAction {
  rank: number;
  domain: string;
  severity: "critical" | "high" | "medium";
  action: string;
  regulatory_ref: string;
}

export interface RegulatoryComplianceSummary {
  overall_compliance_pct: number | null;
  domains_above_threshold: number;
  domains_below_threshold: number;
  weakest_domain: string | null;
  weakest_domain_rate: number | null;
  strongest_domain: string | null;
  strongest_domain_rate: number | null;
}

export interface TrendAnalysis {
  domains_improving: number;
  domains_stable: number;
  domains_worsening: number;
  improving_domains: string[];
  worsening_domains: string[];
  overall_direction: "improving" | "stable" | "worsening";
}

export interface BriefingAlert {
  severity: "critical" | "high" | "medium" | "low";
  domain: string;
  message: string;
}

export interface BriefingInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ManagerBriefingResult {
  generated_at: string;
  home_name: string;
  executive_summary: ExecutiveSummary;
  domain_health: DomainHealth[];
  children_attention: ChildAttentionSummary[];
  priority_actions: PriorityAction[];
  regulatory_compliance: RegulatoryComplianceSummary;
  trend_analysis: TrendAnalysis;
  alerts: BriefingAlert[];
  insights: BriefingInsight[];
}

// ── Regulatory references per domain ────────────────────────────────────────

const DOMAIN_REG_MAP: Record<string, string> = {
  safeguarding: "Reg 12, 34, 35",
  behaviour: "Reg 19, 20",
  workforce: "Reg 31, 32, 33",
  premises: "Reg 25, 27",
  complaints: "Reg 39",
  quality_assurance: "Reg 45",
  health: "Reg 10",
  education: "Reg 8, 9",
  placement: "Reg 11, 36",
  contact: "Reg 22, 23",
  finance: "Reg 39",
  supervision: "Reg 33",
  leaving_care: "Reg 14",
  night_monitoring: "Reg 24, 40",
};

// ── Compute ─────────────────────────────────────────────────────────────────

function computeDomainStatus(d: DomainDigest): DomainStatus {
  if (d.critical_alerts > 0) return "red";
  if (d.high_alerts > 0 || d.overdue_count > 2) return "red";
  if (
    d.medium_alerts > 2 ||
    d.overdue_count > 0 ||
    below(d.compliance_rate, 80) ||
    d.worsening_count > d.improving_count
  ) {
    return "amber";
  }
  return "green";
}

function computeTrendDirection(d: DomainDigest): "improving" | "stable" | "worsening" {
  if (d.improving_count > d.worsening_count) return "improving";
  if (d.worsening_count > d.improving_count) return "worsening";
  return "stable";
}

function computeOverallRisk(
  totalCritical: number,
  totalHigh: number,
  domainsAtRisk: number,
  avgCompliance: number | null,
  domainsTotal: number,
): OverallRiskLevel {
  if (totalCritical > 0 || domainsAtRisk >= 3) return "critical";
  if (totalHigh > 2 || domainsAtRisk >= 2 || below(avgCompliance, 70)) return "elevated";
  if (totalHigh > 0 || domainsAtRisk >= 1 || below(avgCompliance, 85)) return "moderate";
  // No domains reported in: nothing has been assessed, which is not the same as stable.
  if (domainsTotal === 0) return "unknown";
  return "stable";
}

function generateHeadline(
  risk: OverallRiskLevel,
  criticals: number,
  domainsRed: number,
  childrenAttention: number,
  homeName: string,
): string {
  if (risk === "critical") {
    return `${homeName}: ${criticals} critical alert${criticals !== 1 ? "s" : ""} across ${domainsRed} domain${domainsRed !== 1 ? "s" : ""} — immediate RM action required`;
  }
  if (risk === "elevated") {
    return `${homeName}: Elevated risk — ${childrenAttention} child${childrenAttention !== 1 ? "ren" : ""} requiring attention, review high-priority items`;
  }
  if (risk === "moderate") {
    return `${homeName}: Moderate position — minor actions outstanding, no critical concerns`;
  }
  if (risk === "unknown") {
    return `${homeName}: No domain intelligence available yet — nothing has been evidenced, so no position can be reported`;
  }
  return `${homeName}: Stable — all domains within acceptable thresholds`;
}

function computeChildAction(severity: "critical" | "high" | "medium" | "low", flags: string[]): string {
  if (severity === "critical") return "Immediate safeguarding review required";
  if (severity === "high") return "Priority review within 24 hours";
  if (flags.length > 2) return "Multi-domain concerns — holistic review recommended";
  return "Monitor and review at next key-working session";
}

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function computeManagerBriefing(input: ManagerBriefingInput): ManagerBriefingResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);

  // ── Domain health ───────────────────────────────────────────────────────
  const domainHealth: DomainHealth[] = input.domains.map((d) => ({
    domain: d.domain,
    domain_label: d.domain_label,
    status: computeDomainStatus(d),
    compliance_rate: d.compliance_rate,
    alert_count: d.total_alerts,
    critical_count: d.critical_alerts,
    overdue_count: d.overdue_count,
    trend_direction: computeTrendDirection(d),
    key_metric: d.key_metric_label,
    key_metric_value: d.key_metric_value,
    key_metric_target: d.key_metric_target,
  }));

  const domainsAtRisk = domainHealth.filter((d) => d.status === "red").length;
  const domainsCompliant = domainHealth.filter((d) => d.status === "green").length;

  // ── Aggregate alerts ──────────────────────────────────────────────────
  const totalCritical = input.domains.reduce((s, d) => s + d.critical_alerts, 0);
  const totalHigh = input.domains.reduce((s, d) => s + d.high_alerts, 0);
  const totalAlerts = input.domains.reduce((s, d) => s + d.total_alerts, 0);

  // ── Compliance ────────────────────────────────────────────────────────
  const complianceDomains = input.domains.filter((d) => d.compliance_rate !== null);
  const avgCompliance = meanOf(input.domains.map((d) => d.compliance_rate));

  const sorted = [...complianceDomains].sort((a, b) => a.compliance_rate! - b.compliance_rate!);
  const weakest = sorted[0] ?? null;
  const strongest = sorted[sorted.length - 1] ?? null;
  const THRESHOLD = 80;

  const regulatory: RegulatoryComplianceSummary = {
    overall_compliance_pct: avgCompliance,
    domains_above_threshold: complianceDomains.filter((d) => meets(d.compliance_rate, THRESHOLD)).length,
    domains_below_threshold: complianceDomains.filter((d) => below(d.compliance_rate, THRESHOLD)).length,
    weakest_domain: weakest?.domain_label ?? null,
    weakest_domain_rate: weakest?.compliance_rate ?? null,
    strongest_domain: strongest?.domain_label ?? null,
    strongest_domain_rate: strongest?.compliance_rate ?? null,
  };

  // ── Trend analysis ────────────────────────────────────────────────────
  const improving = domainHealth.filter((d) => d.trend_direction === "improving");
  const worsening = domainHealth.filter((d) => d.trend_direction === "worsening");
  const stable = domainHealth.filter((d) => d.trend_direction === "stable");

  const overallDirection: "improving" | "stable" | "worsening" =
    improving.length > worsening.length ? "improving" :
    worsening.length > improving.length ? "worsening" : "stable";

  const trendAnalysis: TrendAnalysis = {
    domains_improving: improving.length,
    domains_stable: stable.length,
    domains_worsening: worsening.length,
    improving_domains: improving.map((d) => d.domain_label),
    worsening_domains: worsening.map((d) => d.domain_label),
    overall_direction: overallDirection,
  };

  // ── Children requiring attention ──────────────────────────────────────
  const childrenAttention: ChildAttentionSummary[] = input.children_attention
    .sort((a, b) => (SEVERITY_ORDER[a.highest_severity] ?? 9) - (SEVERITY_ORDER[b.highest_severity] ?? 9))
    .map((c) => ({
      child_id: c.child_id,
      child_name: c.child_name,
      severity: c.highest_severity,
      domains_flagged: c.domains_flagged,
      flags: c.flags,
      action_required: computeChildAction(c.highest_severity, c.flags),
    }));

  // ── Priority actions ──────────────────────────────────────────────────
  const allAlerts: Array<{ severity: string; message: string; domain: string }> = [];
  for (const d of input.domains) {
    for (const a of d.alerts) {
      allAlerts.push({ ...a, domain: d.domain });
    }
  }
  allAlerts.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));

  const priorityActions: PriorityAction[] = allAlerts
    .filter((a) => a.severity === "critical" || a.severity === "high" || a.severity === "medium")
    .slice(0, 15)
    .map((a, i) => ({
      rank: i + 1,
      domain: a.domain,
      severity: a.severity as "critical" | "high" | "medium",
      action: a.message,
      regulatory_ref: DOMAIN_REG_MAP[a.domain] ?? "",
    }));

  // ── Overall risk level ────────────────────────────────────────────────
  const overallRisk = computeOverallRisk(
    totalCritical,
    totalHigh,
    domainsAtRisk,
    avgCompliance,
    input.domains.length,
  );

  // ── Executive summary ─────────────────────────────────────────────────
  const executiveSummary: ExecutiveSummary = {
    overall_risk_level: overallRisk,
    headline: generateHeadline(overallRisk, totalCritical, domainsAtRisk, childrenAttention.length, input.home_name),
    total_critical_alerts: totalCritical,
    total_high_alerts: totalHigh,
    total_alerts: totalAlerts,
    domains_at_risk: domainsAtRisk,
    domains_compliant: domainsCompliant,
    domains_total: input.domains.length,
    avg_compliance_rate: avgCompliance,
    children_requiring_attention: childrenAttention.length,
    total_children: input.total_children,
    total_staff: input.total_staff,
  };

  // ── Briefing-level alerts (top across all domains) ────────────────────
  const briefingAlerts: BriefingAlert[] = allAlerts.slice(0, 20).map((a) => ({
    severity: (a.severity === "critical" || a.severity === "high" || a.severity === "medium" || a.severity === "low")
      ? a.severity as BriefingAlert["severity"]
      : "medium",
    domain: a.domain,
    message: a.message,
  }));

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: BriefingInsight[] = [];

  if (overallRisk === "critical") {
    insights.push({
      severity: "critical",
      text: `Cara Intelligence: ${totalCritical} critical alert${totalCritical !== 1 ? "s" : ""} detected across ${domainsAtRisk} domain${domainsAtRisk !== 1 ? "s" : ""}. Recommend immediate multi-domain review with deputy and safeguarding lead.`,
    });
  }

  if (regulatory.domains_below_threshold > 0) {
    insights.push({
      severity: "warning",
      text: `Compliance analysis: ${regulatory.domains_below_threshold} domain${regulatory.domains_below_threshold !== 1 ? "s" : ""} below ${THRESHOLD}% threshold. ${regulatory.weakest_domain} at ${regulatory.weakest_domain_rate}% requires priority action to maintain regulatory standing.`,
    });
  }

  if (trendAnalysis.domains_worsening > 0) {
    insights.push({
      severity: "warning",
      text: `Trend detection: ${trendAnalysis.worsening_domains.join(", ")} showing worsening trajectory. Consider root-cause analysis at next team meeting.`,
    });
  }

  if (childrenAttention.filter((c) => c.severity === "critical" || c.severity === "high").length > 0) {
    const highPriority = childrenAttention.filter((c) => c.severity === "critical" || c.severity === "high");
    insights.push({
      severity: "warning",
      text: `Child welfare: ${highPriority.length} child${highPriority.length !== 1 ? "ren" : ""} flagged across multiple domains — ${highPriority.map((c) => c.child_name).join(", ")}. Cross-domain patterns suggest holistic review needed.`,
    });
  }

  if (overallRisk === "unknown") {
    insights.push({
      severity: "warning",
      text: "No domain intelligence reached this briefing. Nothing has been evidenced for this home yet, so no compliance position — good or bad — can be reported.",
    });
  }

  if (overallRisk === "stable" && trendAnalysis.domains_improving > 0) {
    insights.push({
      severity: "positive",
      text: `Positive trajectory: ${trendAnalysis.improving_domains.join(", ")} showing improvement. ${
        avgCompliance === null
          ? "No domain has reported a compliance rate yet."
          : `Overall compliance at ${formatRate(avgCompliance)} — the home is in a strong regulatory position.`
      }`,
    });
  }

  if (overallRisk === "stable" && trendAnalysis.domains_improving === 0) {
    insights.push({
      severity: "positive",
      text: `Stable position across all ${input.domains.length} monitored domains. ${
        avgCompliance === null
          ? "No domain has reported a compliance rate yet."
          : `Average compliance at ${formatRate(avgCompliance)}.`
      } No critical or high alerts requiring immediate action.`,
    });
  }

  return {
    generated_at: today,
    home_name: input.home_name,
    executive_summary: executiveSummary,
    domain_health: domainHealth,
    children_attention: childrenAttention,
    priority_actions: priorityActions,
    regulatory_compliance: regulatory,
    trend_analysis: trendAnalysis,
    alerts: briefingAlerts,
    insights,
  };
}
