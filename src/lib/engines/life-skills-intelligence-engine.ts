// ══════════════════════════════════════════════════════════════════════════════
// CARA — LIFE SKILLS & INDEPENDENCE INTELLIGENCE ENGINE
// Pure deterministic engine for independence readiness analysis.
// Reg 8 (enjoyment & achievement), Reg 9 (quality of care), Reg 14 (pathway
// planning), SCCIF Experiences & Progress.
// ══════════════════════════════════════════════════════════════════════════════

export interface PathwayDomainInput {
  name: string;
  score: number;
  max_score: number;
}

export interface IndependencePathwayInput {
  id: string;
  child_id: string;
  assessed_by: string;
  assessment_date: string;
  review_date: string;
  overall_readiness: number;
  domains: PathwayDomainInput[];
  status: string;
  pathway_plan_linked: boolean;
}

export interface ChildRef {
  id: string;
  name: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface LifeSkillsOverview {
  total_children: number;
  children_assessed: number;
  avg_readiness: number;
  pathway_plans_active: number;
  children_on_track: number;
  children_attention_needed: number;
  domains_count: number;
}

export interface DomainAverage {
  domain: string;
  avg_pct: number;
  children_assessed: number;
}

export interface ChildReadinessProfile {
  child_id: string;
  child_name: string;
  readiness: number;
  status: string;
  status_label: string;
  pathway_plan_linked: boolean;
  strongest_domain: string;
  weakest_domain: string;
  assessment_date: string;
  days_since_assessment: number;
  review_due_in_days: number;
  risk_flags: string[];
}

export interface LifeSkillsAlert {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraLifeSkillsInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface LifeSkillsIntelligenceResult {
  overview: LifeSkillsOverview;
  domain_averages: DomainAverage[];
  child_profiles: ChildReadinessProfile[];
  alerts: LifeSkillsAlert[];
  insights: CaraLifeSkillsInsight[];
}

interface EngineInput {
  pathways: IndependencePathwayInput[];
  children: ChildRef[];
  staff: StaffRef[];
  today?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

const STATUS_LABELS: Record<string, string> = {
  on_track: "On Track",
  attention_needed: "Attention Needed",
  not_age_appropriate: "Not Age-Appropriate",
};

function statusLabel(s: string): string {
  return STATUS_LABELS[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeLifeSkillsIntelligence(input: EngineInput): LifeSkillsIntelligenceResult {
  const { pathways, children, staff, today = new Date().toISOString().slice(0, 10) } = input;

  if (pathways.length === 0) {
    return {
      overview: {
        total_children: children.length,
        children_assessed: 0,
        avg_readiness: 0,
        pathway_plans_active: 0,
        children_on_track: 0,
        children_attention_needed: 0,
        domains_count: 0,
      },
      domain_averages: [],
      child_profiles: [],
      alerts: [],
      insights: [],
    };
  }

  const childMap = new Map(children.map((c) => [c.id, c.name]));

  // Take most recent pathway per child
  const latestByChild = new Map<string, IndependencePathwayInput>();
  for (const p of [...pathways].sort((a, b) => b.assessment_date.localeCompare(a.assessment_date))) {
    if (!latestByChild.has(p.child_id)) {
      latestByChild.set(p.child_id, p);
    }
  }
  const latest = [...latestByChild.values()];

  // ── Overview ────────────────────────────────────────────────────────────
  const avgReadiness = latest.length > 0
    ? Math.round(latest.reduce((sum, p) => sum + p.overall_readiness, 0) / latest.length)
    : 0;
  const withPathwayPlan = latest.filter((p) => p.pathway_plan_linked).length;
  const onTrack = latest.filter((p) => p.status === "on_track").length;
  const attentionNeeded = latest.filter((p) => p.status === "attention_needed").length;

  const allDomainNames = new Set<string>();
  for (const p of latest) {
    for (const d of p.domains) allDomainNames.add(d.name);
  }

  const overview: LifeSkillsOverview = {
    total_children: children.length,
    children_assessed: latest.length,
    avg_readiness: avgReadiness,
    pathway_plans_active: withPathwayPlan,
    children_on_track: onTrack,
    children_attention_needed: attentionNeeded,
    domains_count: allDomainNames.size,
  };

  // ── Domain averages ─────────────────────────────────────────────────────
  const domainScores = new Map<string, { total: number; count: number }>();
  for (const p of latest) {
    for (const d of p.domains) {
      const entry = domainScores.get(d.name) ?? { total: 0, count: 0 };
      entry.total += d.max_score > 0 ? Math.round((d.score / d.max_score) * 100) : 0;
      entry.count++;
      domainScores.set(d.name, entry);
    }
  }
  const domain_averages: DomainAverage[] = [...domainScores.entries()]
    .map(([domain, { total, count }]) => ({
      domain,
      avg_pct: Math.round(total / count),
      children_assessed: count,
    }))
    .sort((a, b) => b.avg_pct - a.avg_pct);

  // ── Child profiles ──────────────────────────────────────────────────────
  const child_profiles: ChildReadinessProfile[] = latest
    .map((p) => {
      const domainPcts = p.domains
        .filter((d) => d.max_score > 0)
        .map((d) => ({ name: d.name, pct: Math.round((d.score / d.max_score) * 100) }));
      const sorted = [...domainPcts].sort((a, b) => b.pct - a.pct);
      const strongest = sorted.length > 0 ? sorted[0].name : "N/A";
      const weakest = sorted.length > 0 ? sorted[sorted.length - 1].name : "N/A";

      const daysSinceAssessment = daysBetween(p.assessment_date, today);
      const reviewDueIn = daysBetween(today, p.review_date);

      const risk_flags: string[] = [];
      if (p.overall_readiness < 40) risk_flags.push("low_readiness");
      if (p.status === "attention_needed") risk_flags.push("attention_needed");
      if (!p.pathway_plan_linked) risk_flags.push("no_pathway_plan");
      if (daysSinceAssessment > 90) risk_flags.push("assessment_overdue");
      if (reviewDueIn < 0) risk_flags.push("review_overdue");

      const weakDomains = domainPcts.filter((d) => d.pct < 30);
      if (weakDomains.length >= 2) risk_flags.push("multiple_weak_domains");

      return {
        child_id: p.child_id,
        child_name: childMap.get(p.child_id) ?? p.child_id,
        readiness: p.overall_readiness,
        status: p.status,
        status_label: statusLabel(p.status),
        pathway_plan_linked: p.pathway_plan_linked,
        strongest_domain: strongest,
        weakest_domain: weakest,
        assessment_date: p.assessment_date,
        days_since_assessment: daysSinceAssessment,
        review_due_in_days: reviewDueIn,
        risk_flags,
      };
    })
    .sort((a, b) => b.readiness - a.readiness);

  // ── Alerts ──────────────────────────────────────────────────────────────
  const alerts: LifeSkillsAlert[] = [];

  // High: children with no assessment
  const assessedIds = new Set(latest.map((p) => p.child_id));
  const unassessed = children.filter((c) => !assessedIds.has(c.id));
  if (unassessed.length > 0) {
    alerts.push({
      type: "no_assessment",
      severity: "high",
      message: `${unassessed.map((c) => c.name).join(", ")} ha${unassessed.length > 1 ? "ve" : "s"} no independence pathway assessment. Reg 14 requires pathway planning for all children.`,
    });
  }

  // Medium: attention needed status
  for (const profile of child_profiles) {
    if (profile.status === "attention_needed") {
      alerts.push({
        type: "attention_needed",
        severity: "medium",
        message: `${profile.child_name} flagged as attention needed (${profile.readiness}% readiness). Review and intensify support in ${profile.weakest_domain}.`,
      });
    }
  }

  // Medium: low domain averages
  const weakDomains = domain_averages.filter((d) => d.avg_pct < 40);
  if (weakDomains.length > 0) {
    alerts.push({
      type: "weak_domains",
      severity: "medium",
      message: `${weakDomains.map((d) => d.domain).join(", ")} ${weakDomains.length > 1 ? "are" : "is"} below 40% average across the home. Consider group skill-building sessions.`,
    });
  }

  // Low: no pathway plan linked
  const noPathway = child_profiles.filter((p) => !p.pathway_plan_linked);
  if (noPathway.length > 0) {
    alerts.push({
      type: "no_pathway_plan",
      severity: "low",
      message: `${noPathway.map((p) => p.child_name).join(", ")} do${noPathway.length === 1 ? "es" : ""} not have a linked pathway plan. Ensure Reg 14 pathway planning requirements are met.`,
    });
  }

  // ── Cara Insights ──────────────────────────────────────────────────────
  const insights: CaraLifeSkillsInsight[] = [];

  // Warning: unassessed children
  if (unassessed.length > 0) {
    insights.push({
      severity: "warning",
      text: `${unassessed.length} child${unassessed.length > 1 ? "ren" : ""} without independence pathway assessment. Reg 14 requires pathway planning to support transition to adulthood.`,
    });
  }

  // Warning: low overall readiness
  const lowReadiness = child_profiles.filter((p) => p.readiness < 40);
  if (lowReadiness.length > 0) {
    for (const child of lowReadiness) {
      insights.push({
        severity: "warning",
        text: `${child.child_name} has ${child.readiness}% independence readiness — below threshold. Focus key work sessions on ${child.weakest_domain} and ${child.strongest_domain} reinforcement.`,
      });
    }
  }

  // Warning: weak domains across home
  if (weakDomains.length > 0) {
    insights.push({
      severity: "warning",
      text: `${weakDomains.map((d) => d.domain).join(" and ")} ${weakDomains.length > 1 ? "are" : "is"} the weakest skill domain${weakDomains.length > 1 ? "s" : ""} across the home (below 40%). Consider structured group programme.`,
    });
  }

  // Positive: high average readiness
  if (avgReadiness >= 60 && latest.length > 0) {
    insights.push({
      severity: "positive",
      text: `Average independence readiness of ${avgReadiness}% across ${latest.length} children. Strong foundation for transition preparation.`,
    });
  }

  // Positive: all children assessed
  if (latest.length >= children.length && children.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${children.length} children have independence pathway assessments. Reg 14 requirements met.`,
    });
  }

  // Positive: pathway plans linked
  if (withPathwayPlan >= latest.length && latest.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${latest.length} assessed children have linked pathway plans. Transition planning robust.`,
    });
  }

  // Positive: strong domains
  const strongDomains = domain_averages.filter((d) => d.avg_pct >= 70);
  if (strongDomains.length > 0) {
    insights.push({
      severity: "positive",
      text: `${strongDomains.map((d) => d.domain).join(", ")} ${strongDomains.length > 1 ? "are" : "is"} strong across the home (${strongDomains.length > 1 ? "all " : ""}≥70%). Demonstrates effective skill-building programmes.`,
    });
  }

  // Positive: all on track
  if (onTrack === latest.length && latest.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${latest.length} children are on track with their independence pathway. Reg 8 enjoyment and achievement standards evidenced.`,
    });
  }

  return {
    overview,
    domain_averages,
    child_profiles,
    alerts,
    insights,
  };
}
