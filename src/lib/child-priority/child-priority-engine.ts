// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD PRIORITY (UNIFIED RISK) INTELLIGENCE ENGINE
//
// Pure deterministic META-engine — no DB calls, no side effects, no LLM calls.
//
// The registered manager's single morning question: "of all my children, and all
// the intelligence we hold, who needs me most today — and why?"
//
// This fuses three independent signals per child:
//   • Placement breakdown risk      (placement-breakdown-forecast engine)
//   • Complaints↔incident correlation (complaints-incident-correlation engine)
//   • Medication-error involvement   (per-child error load + harm)
//
// The core principle: a child flagged by MORE THAN ONE engine is the highest
// concern — convergent risk across domains is what gets missed when each system
// is reviewed in isolation. The output is one ranked list with an explainable
// "why" and a single most-important next action per child.
//
// Regulatory: CHR 2015 Reg 12/13 (protection & leadership oversight), Reg 5
// (engaging with the wider system around each child). SCCIF: leaders have an
// accurate, joined-up view of each child's risks and act on them.
// ══════════════════════════════════════════════════════════════════════════════

import {
  computePlacementBreakdownForecast,
  type ChildInput as PlacementChildInput,
  type IncidentInput as PlacementIncidentInput,
  type MissingInput,
  type RestraintInput,
  type SanctionInput,
  type BehaviourInput,
  type EducationInput,
  type KeyworkingInput,
} from "../placement-breakdown-forecast/placement-breakdown-forecast-engine";
import {
  computeComplaintsIncidentCorrelation,
  type ComplaintCorrInput,
} from "../complaints-incident-correlation/complaints-incident-correlation-engine";
import {
  computeStaffChildContinuity,
  type ContinuityStaffInput,
  type ContinuitySessionInput,
} from "../staff-child-continuity/staff-child-continuity-engine";

// ── Input Types ───────────────────────────────────────────────────────────────

export type MedErrorSeverity = "no_harm" | "low" | "moderate" | "severe" | "death";

export interface KeyWorkerLink {
  child_id: string;
  key_worker_id: string | null;
  secondary_worker_id: string | null;
}

export interface PriorityIncidentInput {
  child_id: string;
  date: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface PriorityMedErrorInput {
  child_id: string;
  date: string;            // ISO date
  severity: MedErrorSeverity;
}

export interface ChildPriorityInput {
  children: PlacementChildInput[];           // id,name,date_of_birth,placement_start,placement_type,risk_flags
  incidents: PriorityIncidentInput[];        // child_id,date,type,severity
  complaints: ComplaintCorrInput[];
  medicationErrors: PriorityMedErrorInput[];
  missingEpisodes: MissingInput[];
  restraints: RestraintInput[];
  sanctions: SanctionInput[];
  behaviour: BehaviourInput[];
  education: EducationInput[];
  keyworking: KeyworkingInput[];
  // Optional relational-continuity inputs (4th stream). When all three are
  // provided, a "continuity" risk domain is folded into the fusion.
  staff?: ContinuityStaffInput[];
  keyWorkingSessions?: ContinuitySessionInput[];
  keyWorkers?: KeyWorkerLink[];
  today?: string;
}

// ── Output Types ──────────────────────────────────────────────────────────────

export type PriorityBand = "critical" | "high" | "medium" | "low";
export type Domain = "placement" | "complaints" | "medication" | "continuity";

export interface DomainSignal {
  domain: Domain;
  label: string;
  score: number;           // 0-100 within the domain
  detail: string;
  active: boolean;         // meaningfully elevated
}

export interface PriorityAction {
  priority: "urgent" | "high" | "routine";
  action: string;
  regulatory_link: string;
  domain: Domain;
}

export interface ChildPriority {
  child_id: string;
  child_name: string;
  rank: number;
  priority_score: number;  // 0-100 fused
  priority_band: PriorityBand;
  multi_domain: boolean;
  safeguarding: boolean;
  domains: DomainSignal[];
  top_action: PriorityAction | null;
}

export interface PriorityOverview {
  children_analysed: number;
  critical_count: number;
  high_count: number;
  multi_domain_count: number;
  top_priority_child: string | null;
  top_priority_score: number;
}

export interface AriaPriorityInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ChildPriorityResult {
  overview: PriorityOverview;
  children: ChildPriority[];
  insights: AriaPriorityInsight[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DOMAIN_FLOOR = 10;        // below this a domain is noise — not shown or scored
const PRESENT_THRESHOLD = 20;  // a domain "counts" toward multi-domain at this score
const ACTIVE_THRESHOLD = 35;   // a domain is "elevated" (bonus) at this score
const MED_SEVERITY_RANK: Record<MedErrorSeverity, number> = {
  no_harm: 0, low: 1, moderate: 2, severe: 3, death: 4,
};
const SAFEGUARDING_INCIDENT = /safeguard|abuse|exploit|cse|missing|self.?harm/i;

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(date: string, today: string): number {
  return Math.floor((new Date(today).getTime() - new Date(date).getTime()) / 86_400_000);
}
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
function bandOf(score: number): PriorityBand {
  if (score >= 75) return "critical";
  if (score >= 55) return "high";
  if (score >= 35) return "medium";
  return "low";
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChildPriority(input: ChildPriorityInput): ChildPriorityResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);

  // ── Run the placement-breakdown forecast ───────────────────────────────
  const placement = computePlacementBreakdownForecast({
    children: input.children,
    incidents: input.incidents.map((i): PlacementIncidentInput => ({
      child_id: i.child_id,
      date: i.date,
      severity: i.severity,
    })),
    missingEpisodes: input.missingEpisodes,
    restraints: input.restraints,
    sanctions: input.sanctions,
    behaviour: input.behaviour,
    education: input.education,
    keyworking: input.keyworking,
    today,
  });
  const placementByChild = new Map(placement.child_forecasts.map((f) => [f.child_id, f]));

  // ── Run the complaints↔incident correlation ────────────────────────────
  const correlation = computeComplaintsIncidentCorrelation({
    children: input.children.map((c) => ({ id: c.id, name: c.name })),
    complaints: input.complaints,
    incidents: input.incidents,
    today,
  });
  const correlationByChild = new Map(correlation.child_correlations.map((c) => [c.child_id, c]));

  // ── Per-child medication-error involvement (last 90 days) ───────────────
  const medByChild = new Map<string, { count: number; maxRank: number }>();
  for (const e of input.medicationErrors) {
    const d = daysAgo(e.date, today);
    if (d < 0 || d >= 90) continue;
    const cur = medByChild.get(e.child_id) ?? { count: 0, maxRank: 0 };
    cur.count += 1;
    cur.maxRank = Math.max(cur.maxRank, MED_SEVERITY_RANK[e.severity] ?? 0);
    medByChild.set(e.child_id, cur);
  }

  // ── Relational continuity (4th stream) — optional ──────────────────────
  const continuityByChild = new Map<string, ReturnType<typeof computeStaffChildContinuity>["children"][number]>();
  if (input.staff && input.keyWorkingSessions && input.keyWorkers) {
    const kwLink = new Map(input.keyWorkers.map((k) => [k.child_id, k]));
    const continuity = computeStaffChildContinuity({
      children: input.children.map((c) => ({
        id: c.id,
        name: c.name,
        key_worker_id: kwLink.get(c.id)?.key_worker_id ?? null,
        secondary_worker_id: kwLink.get(c.id)?.secondary_worker_id ?? null,
      })),
      staff: input.staff,
      sessions: input.keyWorkingSessions,
      today,
    });
    for (const c of continuity.children) continuityByChild.set(c.child_id, c);
  }

  // ── Per-child safeguarding incident flag (last 90 days) ─────────────────
  const sgIncidentByChild = new Set<string>();
  for (const i of input.incidents) {
    const d = daysAgo(i.date, today);
    if (d < 0 || d >= 90) continue;
    if (SAFEGUARDING_INCIDENT.test(i.type) || i.severity === "critical") sgIncidentByChild.add(i.child_id);
  }

  // ── Fuse per child ──────────────────────────────────────────────────────
  const childIds = new Set<string>(input.children.map((c) => c.id));
  // include any child referenced only via a signal
  for (const c of input.complaints) childIds.add(c.child_id);
  for (const i of input.incidents) childIds.add(i.child_id);
  const nameById = new Map(input.children.map((c) => [c.id, c.name]));

  const children: ChildPriority[] = [];

  for (const childId of childIds) {
    if (!childId) continue;
    const pf = placementByChild.get(childId);
    const corr = correlationByChild.get(childId);
    const med = medByChild.get(childId);
    const cont = continuityByChild.get(childId);

    const domains: DomainSignal[] = [];

    // Placement domain
    const placementScore = pf?.risk_score ?? 0;
    if (placementScore >= DOMAIN_FLOOR) {
      domains.push({
        domain: "placement",
        label: "Placement breakdown risk",
        score: placementScore,
        detail: `${pf!.risk_band}${pf!.trend === "escalating" ? ", escalating" : pf!.trend === "improving" ? ", improving" : ""}${pf!.projected_days_to_critical != null ? ` — ~${pf!.projected_days_to_critical}d to critical` : ""}`,
        active: placementScore >= ACTIVE_THRESHOLD,
      });
    }

    // Complaints domain
    const complaintsScore = corr?.correlation_score ?? 0;
    if (complaintsScore >= DOMAIN_FLOOR && corr) {
      domains.push({
        domain: "complaints",
        label: "Complaints ↔ incident signal",
        score: complaintsScore,
        detail: `${corr.correlation_type.replace(/_/g, " ")}${corr.safeguarding_overlap ? ", safeguarding overlap" : ""}`,
        active: complaintsScore >= ACTIVE_THRESHOLD,
      });
    }

    // Medication domain
    let medScore = 0;
    if (med) {
      medScore = clamp(med.count * 6 + (med.maxRank >= 2 ? 25 : med.maxRank >= 1 ? 8 : 0), 0, 100);
    }
    if (med && medScore >= DOMAIN_FLOOR) {
      domains.push({
        domain: "medication",
        label: "Medication-error involvement",
        score: medScore,
        detail: `${med.count} error${med.count === 1 ? "" : "s"} in 90 days${med.maxRank >= 2 ? " (one caused harm)" : ""}`,
        active: medScore >= ACTIVE_THRESHOLD,
      });
    }

    // Continuity domain — low continuity of care is a relational risk.
    const continuityRisk = cont ? clamp(100 - cont.continuity_index, 0, 100) : 0;
    if (cont && continuityRisk >= DOMAIN_FLOOR) {
      domains.push({
        domain: "continuity",
        label: "Relationship continuity gap",
        score: continuityRisk,
        detail: `${cont.band} continuity (${cont.continuity_index}/100)${cont.flags[0] ? ` — ${cont.flags[0]}` : ""}`,
        active: continuityRisk >= ACTIVE_THRESHOLD,
      });
    }

    if (domains.length === 0) continue;

    // Fusion: reward a strong single domain, boost for convergent multi-domain risk.
    const scores = domains.map((d) => d.score);
    const base = Math.max(...scores);
    const secondary = scores.reduce((s, v) => s + v, 0) - base;
    const presentCount = domains.filter((d) => d.score >= PRESENT_THRESHOLD).length;
    const activeCount = domains.filter((d) => d.active).length;

    const safeguarding = !!corr?.safeguarding_overlap || pf?.risk_band === "critical" || sgIncidentByChild.has(childId);
    const safeguardingBoost = safeguarding ? 10 : 0;
    const multiBonus = activeCount >= 2 ? 12 : 0;

    const priority_score = Math.round(clamp(base + 0.35 * secondary + multiBonus + safeguardingBoost, 0, 100));

    children.push({
      child_id: childId,
      child_name: nameById.get(childId) ?? corr?.child_name ?? childId,
      rank: 0,
      priority_score,
      priority_band: bandOf(priority_score),
      multi_domain: presentCount >= 2,
      safeguarding,
      domains: domains.sort((a, b) => b.score - a.score),
      top_action: pickTopAction(domains, pf, corr, med, cont),
    });
  }

  children.sort((a, b) => b.priority_score - a.priority_score);
  children.forEach((c, i) => (c.rank = i + 1));

  const overview = buildOverview(children);
  const insights = buildInsights(children);

  return { overview, children, insights };
}

// ── Top-action picker ───────────────────────────────────────────────────────

function pickTopAction(
  domains: DomainSignal[],
  pf: ReturnType<typeof computePlacementBreakdownForecast>["child_forecasts"][number] | undefined,
  corr: ReturnType<typeof computeComplaintsIncidentCorrelation>["child_correlations"][number] | undefined,
  med: { count: number; maxRank: number } | undefined,
  cont: ReturnType<typeof computeStaffChildContinuity>["children"][number] | undefined,
): PriorityAction | null {
  const top = domains[0];
  if (!top) return null;

  if (top.domain === "placement" && pf && (pf.recommended_actions ?? []).length > 0) {
    const a = pf.recommended_actions[0];
    return { priority: a.priority, action: a.action, regulatory_link: a.regulatory_link, domain: "placement" };
  }
  if (top.domain === "complaints" && corr && (corr.recommended_actions ?? []).length > 0) {
    const a = corr.recommended_actions[0];
    return { priority: a.priority, action: a.action, regulatory_link: a.regulatory_link, domain: "complaints" };
  }
  if (top.domain === "medication" && med) {
    return {
      priority: med.maxRank >= 2 ? "urgent" : "high",
      action: med.maxRank >= 2
        ? "Review the medication error that caused harm with the child and complete duty of candour; check the wider medicines system"
        : "Review this child's recurring medication errors for a system cause (charting, double-checks, timing)",
      regulatory_link: "CHR 2015 Reg 23 — medicines; Reg 13 — learning",
      domain: "medication",
    };
  }
  if (top.domain === "continuity" && cont && (cont.recommended_actions ?? []).length > 0) {
    const a = cont.recommended_actions[0];
    return { priority: a.priority, action: a.action, regulatory_link: a.regulatory_link, domain: "continuity" };
  }
  return null;
}

// ── Overview & insights ──────────────────────────────────────────────────────

function buildOverview(children: ChildPriority[]): PriorityOverview {
  const top = children[0];
  return {
    children_analysed: children.length,
    critical_count: children.filter((c) => c.priority_band === "critical").length,
    high_count: children.filter((c) => c.priority_band === "high").length,
    multi_domain_count: children.filter((c) => c.multi_domain).length,
    top_priority_child: top && top.priority_score > 0 ? top.child_name : null,
    top_priority_score: top?.priority_score ?? 0,
  };
}

function buildInsights(children: ChildPriority[]): AriaPriorityInsight[] {
  const insights: AriaPriorityInsight[] = [];

  const multi = children.filter((c) => c.multi_domain);
  if (multi.length > 0) {
    const names = multi.slice(0, 3).map((c) => `${c.child_name} (${c.domains.map((d) => d.domain).join(" + ")})`).join("; ");
    insights.push({
      severity: "critical",
      text: `${multi.length} child${multi.length === 1 ? " is" : "ren are"} flagged across more than one intelligence stream — the clearest signal of who needs attention first: ${names}. Convergent risk is what gets missed when each system is reviewed alone; act on these children today.`,
    });
  }

  const topCritical = children.filter((c) => c.priority_band === "critical");
  if (topCritical.length > 0 && multi.length === 0) {
    insights.push({
      severity: "warning",
      text: `${topCritical.length} child${topCritical.length === 1 ? "" : "ren"} reach a critical priority from a single strong signal. Confirm the lead concern is owned and being acted on.`,
    });
  }

  if (children.length > 0 && topCritical.length === 0 && multi.length === 0) {
    insights.push({
      severity: "positive",
      text: `No child is showing convergent or critical cross-domain risk. Maintain oversight, but the joined-up picture is currently reassuring.`,
    });
  }

  return insights;
}
