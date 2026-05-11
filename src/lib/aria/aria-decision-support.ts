// ══════════════════════════════════════════════════════════════════════════════
// ARIA Decision Support + Formulation Engine
//
// Synthesises per-child clinical formulations (4-Ps: Predisposing,
// Precipitating, Perpetuating, Protective) from live records, and ranks
// recommended next actions for managers based on the open safeguarding
// patterns, active early warnings, current risks and care graph evidence.
//
// Every formulation and recommendation is an AI draft. A manager must
// accept, modify, defer or reject before any influence on statutory plans.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type {
  AriaFormulation,
  AriaFormulationFactor,
  AriaFormulationFactorType,
  AriaDecisionRecommendation,
  AriaDecisionAction,
  AriaDecisionPriority,
  AriaDecisionSupportSnapshot,
  AriaSafeguardingEvidenceRef,
  AriaSafeguardingPattern,
  AriaEarlyWarning,
} from "@/types/aria-studio";
import type { RiskAssessment } from "@/types/extended";

const DEFAULT_LOOKBACK_DAYS = 90;

interface RunOptions {
  lookbackDays?: number;
  childId?: string | null;
  generatedBy?: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function evidenceFromPattern(p: AriaSafeguardingPattern): AriaSafeguardingEvidenceRef {
  return {
    source_table: "aria_safeguarding_patterns",
    source_id: p.id,
    date: p.detected_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    excerpt: p.title,
  };
}

function evidenceFromRisk(r: RiskAssessment): AriaSafeguardingEvidenceRef {
  return {
    source_table: "risk_assessments",
    source_id: r.id,
    date: r.assessed_date,
    excerpt: `${r.domain} risk — ${r.current_level} (${r.trend})`,
  };
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function priorityFor(severity: "low" | "medium" | "high" | "critical"): AriaDecisionPriority {
  switch (severity) {
    case "critical": return "p1";
    case "high":     return "p2";
    case "medium":   return "p3";
    default:         return "p4";
  }
}

function dueDateFor(priority: AriaDecisionPriority): string {
  const offsets: Record<AriaDecisionPriority, number> = { p1: 1, p2: 3, p3: 7, p4: 14 };
  const d = new Date();
  d.setDate(d.getDate() + offsets[priority]);
  return d.toISOString().slice(0, 10);
}

// ── Formulation builder ──────────────────────────────────────────────────────

function buildFormulationForChild(params: {
  homeId: string;
  childId: string;
  patterns: AriaSafeguardingPattern[];
  warnings: AriaEarlyWarning[];
  risks: RiskAssessment[];
}): Omit<AriaFormulation, "id"> {
  const { homeId, childId, patterns, warnings, risks } = params;
  const factors: AriaFormulationFactor[] = [];

  // Predisposing — from triggers in current risk assessments
  const triggers = new Set<string>();
  for (const r of risks) for (const t of r.triggers ?? []) triggers.add(t);
  if (triggers.size > 0) {
    factors.push({
      factor_type: "predisposing",
      label: "Identified vulnerability factors",
      detail: `Documented triggers: ${Array.from(triggers).slice(0, 6).join("; ")}`,
      evidence_refs: risks.slice(0, 3).map(evidenceFromRisk),
      confidence: clamp01(0.5 + Math.min(triggers.size, 4) * 0.1),
    });
  }

  // Precipitating — from recent high/critical patterns
  const highPatterns = patterns.filter(
    (p) => p.severity === "high" || p.severity === "critical",
  );
  if (highPatterns.length > 0) {
    factors.push({
      factor_type: "precipitating",
      label: "Recent precipitating events",
      detail: highPatterns.map((p) => p.title).join("; "),
      evidence_refs: highPatterns.slice(0, 4).map(evidenceFromPattern),
      confidence: clamp01(0.55 + highPatterns.length * 0.1),
    });
  }

  // Perpetuating — repeating patterns and oversight gaps
  const perpetuating = patterns.filter(
    (p) =>
      p.pattern_type === "repeat_missing" ||
      p.pattern_type === "repeat_restraint" ||
      p.pattern_type === "oversight_gap" ||
      p.pattern_type === "night_time_cluster",
  );
  if (perpetuating.length > 0) {
    factors.push({
      factor_type: "perpetuating",
      label: "Maintaining patterns",
      detail: perpetuating
        .map((p) => `${p.pattern_type.replace(/_/g, " ")} — ${p.title}`)
        .join("; "),
      evidence_refs: perpetuating.slice(0, 4).map(evidenceFromPattern),
      confidence: clamp01(0.5 + perpetuating.length * 0.1),
    });
  }

  // Protective — effective mitigations
  const protectiveItems: { strategy: string; refs: AriaSafeguardingEvidenceRef[] }[] = [];
  for (const r of risks) {
    for (const mit of r.mitigations ?? []) {
      if (mit.effectiveness === "effective" || mit.effectiveness === "partially_effective") {
        protectiveItems.push({
          strategy: mit.strategy,
          refs: [evidenceFromRisk(r)],
        });
      }
    }
  }
  if (protectiveItems.length > 0) {
    factors.push({
      factor_type: "protective",
      label: "Protective factors in place",
      detail: protectiveItems.slice(0, 6).map((p) => p.strategy).join("; "),
      evidence_refs: protectiveItems.slice(0, 4).flatMap((p) => p.refs),
      confidence: clamp01(0.45 + protectiveItems.length * 0.08),
    });
  }

  // Hypotheses — heuristic, evidence-anchored
  const hypotheses: string[] = [];
  if (perpetuating.some((p) => p.pattern_type === "repeat_missing")) {
    hypotheses.push(
      "Repeat missing episodes may reflect contextual safeguarding pull factors that overpower current placement protective factors.",
    );
  }
  if (perpetuating.some((p) => p.pattern_type === "night_time_cluster")) {
    hypotheses.push(
      "Concentration of incidents at night suggests dysregulation linked to bedtime routine, sensory load or staffing pattern.",
    );
  }
  if (perpetuating.some((p) => p.pattern_type === "oversight_gap")) {
    hypotheses.push(
      "Outstanding oversight on incidents indicates a management review backlog that may be eroding learning loops.",
    );
  }
  if (highPatterns.length >= 2) {
    hypotheses.push(
      "Multiple concurrent high-severity patterns suggest the current care plan may not be calibrated to this child's presenting needs.",
    );
  }

  // Recommended focus
  const recommendedFocus: string[] = [];
  if (perpetuating.some((p) => p.pattern_type === "repeat_missing")) {
    recommendedFocus.push("Contextual safeguarding mapping with child and trusted adult");
  }
  if (perpetuating.some((p) => p.pattern_type === "repeat_restraint")) {
    recommendedFocus.push("Positive handling plan refresh with clinical input");
  }
  if (perpetuating.some((p) => p.pattern_type === "oversight_gap")) {
    recommendedFocus.push("Manager oversight backlog review");
  }
  if (warnings.some((w) => w.severity === "critical")) {
    recommendedFocus.push("Immediate strategy meeting");
  }
  if (recommendedFocus.length === 0) {
    recommendedFocus.push("Continue monitoring with key worker reflective session");
  }

  const narrative = factors
    .map(
      (f) =>
        `${f.factor_type.toUpperCase()}: ${f.label}. ${f.detail}`,
    )
    .join("\n\n");

  return {
    home_id: homeId,
    child_id: childId,
    title: `Formulation — ${childId}`,
    narrative: narrative || "Insufficient evidence to draft a formulation.",
    factors,
    hypotheses,
    recommended_focus: recommendedFocus,
    source_pattern_ids: patterns.map((p) => p.id),
    source_warning_ids: warnings.map((w) => w.id),
    source_risk_ids: risks.map((r) => r.id),
    status: "ai_draft",
    is_ai_draft: true,
    generated_at: new Date().toISOString(),
    approved_by: null,
    approved_at: null,
    reviewer_note: null,
    superseded_by: null,
  };
}

// ── Recommendation builder ───────────────────────────────────────────────────

interface RecommendationDraft {
  action: AriaDecisionAction;
  title: string;
  rationale: string;
  expected_impact: string;
  priority: AriaDecisionPriority;
  confidence: number;
  source_pattern_ids: string[];
  source_warning_ids: string[];
}

function recommendationsFor(params: {
  patterns: AriaSafeguardingPattern[];
  warnings: AriaEarlyWarning[];
}): RecommendationDraft[] {
  const { patterns, warnings } = params;
  const drafts: RecommendationDraft[] = [];

  // Critical warnings → strategy meeting
  const criticalWarnings = warnings.filter((w) => w.severity === "critical");
  if (criticalWarnings.length > 0) {
    drafts.push({
      action: "convene_strategy_meeting",
      title: "Convene strategy meeting",
      rationale: `${criticalWarnings.length} active critical early warning(s).`,
      expected_impact: "Multi-agency planning and immediate protective response.",
      priority: "p1",
      confidence: 0.9,
      source_pattern_ids: criticalWarnings
        .map((w) => w.source_pattern_id)
        .filter((x): x is string => Boolean(x)),
      source_warning_ids: criticalWarnings.map((w) => w.id),
    });
  }

  // Repeat missing → reg40 + contextual safeguarding
  const repeatMissing = patterns.filter((p) => p.pattern_type === "repeat_missing");
  if (repeatMissing.length > 0) {
    const sev = repeatMissing.some((p) => p.severity === "critical") ? "critical" : "high";
    drafts.push({
      action: "trigger_reg40_notification",
      title: "Review Reg 40 notification threshold",
      rationale: "Repeat missing pattern detected.",
      expected_impact: "Ensures Ofsted is notified where threshold met; reduces compliance risk.",
      priority: priorityFor(sev),
      confidence: 0.78,
      source_pattern_ids: repeatMissing.map((p) => p.id),
      source_warning_ids: [],
    });
    drafts.push({
      action: "review_contextual_safeguarding",
      title: "Refresh contextual safeguarding map",
      rationale: "Repeat missing episodes typically signal pull factors outside the home.",
      expected_impact: "Identifies extra-familial risks and trusted adults to mobilise.",
      priority: priorityFor(sev),
      confidence: 0.72,
      source_pattern_ids: repeatMissing.map((p) => p.id),
      source_warning_ids: [],
    });
  }

  // Repeat restraint → behaviour plan + clinical input
  const repeatRestraint = patterns.filter((p) => p.pattern_type === "repeat_restraint");
  if (repeatRestraint.length > 0) {
    drafts.push({
      action: "review_behaviour_plan",
      title: "Review behaviour support plan",
      rationale: "Repeat physical interventions detected.",
      expected_impact: "Updates de-escalation strategy and reduces restrictive practice.",
      priority: priorityFor(repeatRestraint[0].severity),
      confidence: 0.74,
      source_pattern_ids: repeatRestraint.map((p) => p.id),
      source_warning_ids: [],
    });
    drafts.push({
      action: "request_clinical_input",
      title: "Request clinical / therapeutic input",
      rationale: "Sustained restraint pattern warrants psychological consultation.",
      expected_impact: "Brings formulation depth and trauma-informed approach.",
      priority: priorityFor(repeatRestraint[0].severity),
      confidence: 0.66,
      source_pattern_ids: repeatRestraint.map((p) => p.id),
      source_warning_ids: [],
    });
  }

  // Escalating severity → risk review
  const escalating = patterns.filter((p) => p.pattern_type === "escalating_severity");
  if (escalating.length > 0) {
    drafts.push({
      action: "review_risk_assessment",
      title: "Review risk assessment urgently",
      rationale: "Severity is trending upward across recent incidents.",
      expected_impact: "Recalibrates risk level, mitigations and contingency plan.",
      priority: priorityFor(escalating[0].severity),
      confidence: 0.7,
      source_pattern_ids: escalating.map((p) => p.id),
      source_warning_ids: [],
    });
  }

  // Night-time cluster → supervision review
  const night = patterns.filter((p) => p.pattern_type === "night_time_cluster");
  if (night.length > 0) {
    drafts.push({
      action: "increase_supervision",
      title: "Review night-time supervision arrangements",
      rationale: "Incident concentration during night hours.",
      expected_impact: "Reduces overnight incidents through staffing or routine change.",
      priority: priorityFor(night[0].severity),
      confidence: 0.62,
      source_pattern_ids: night.map((p) => p.id),
      source_warning_ids: [],
    });
  }

  // Oversight gap → audit
  const gap = patterns.filter((p) => p.pattern_type === "oversight_gap");
  if (gap.length > 0) {
    drafts.push({
      action: "audit_oversight_gap",
      title: "Clear oversight backlog",
      rationale: "Incidents are awaiting management oversight beyond threshold.",
      expected_impact: "Restores learning loop; protects audit trail integrity.",
      priority: "p2",
      confidence: 0.85,
      source_pattern_ids: gap.map((p) => p.id),
      source_warning_ids: [],
    });
  }

  // Cross-child trend → home-level lessons learned
  const cross = patterns.filter((p) => p.pattern_type === "cross_child_trend");
  if (cross.length > 0) {
    drafts.push({
      action: "trigger_lessons_learned",
      title: "Convene lessons-learned review",
      rationale: "Pattern affects multiple children at the home.",
      expected_impact: "Enables home-wide reflective practice and policy adjustment.",
      priority: priorityFor(cross[0].severity),
      confidence: 0.68,
      source_pattern_ids: cross.map((p) => p.id),
      source_warning_ids: [],
    });
  }

  return drafts;
}

// ── Public API ───────────────────────────────────────────────────────────────

export function runDecisionSupport(
  homeId: string,
  options: RunOptions = {},
): AriaDecisionSupportSnapshot {
  const childIdFilter = options.childId ?? null;

  // Source records
  const allPatterns = db.ariaSafeguardingPatterns
    .findOpen(homeId)
    .filter((p) => (childIdFilter ? p.child_id === childIdFilter : true));
  const allWarnings = db.ariaEarlyWarnings
    .findActive(homeId)
    .filter((w) => (childIdFilter ? w.child_id === childIdFilter : true));
  const allRisks = db.riskAssessments
    .findAll()
    .filter(
      (r) =>
        r.home_id === homeId &&
        r.status === "current" &&
        (childIdFilter ? r.child_id === childIdFilter : true),
    );

  // Per-child formulations: persist (idempotent — supersede prior ai_draft)
  const childIds = new Set<string>();
  for (const p of allPatterns) if (p.child_id) childIds.add(p.child_id);
  for (const w of allWarnings) if (w.child_id) childIds.add(w.child_id);
  for (const r of allRisks) childIds.add(r.child_id);
  if (childIdFilter) {
    childIds.clear();
    childIds.add(childIdFilter);
  }

  const formulations: AriaFormulation[] = [];
  for (const childId of childIds) {
    const childPatterns = allPatterns.filter((p) => p.child_id === childId);
    const childWarnings = allWarnings.filter((w) => w.child_id === childId);
    const childRisks = allRisks.filter((r) => r.child_id === childId);
    if (childPatterns.length === 0 && childWarnings.length === 0 && childRisks.length === 0) {
      continue;
    }
    const draft = buildFormulationForChild({
      homeId,
      childId,
      patterns: childPatterns,
      warnings: childWarnings,
      risks: childRisks,
    });

    // Supersede prior ai_draft formulation for this child
    const prior = db.ariaFormulations
      .findByChild(homeId, childId)
      .find((f) => f.status === "ai_draft");
    if (prior) {
      db.ariaFormulations.patch(prior.id, { status: "superseded" });
    }
    const created = db.ariaFormulations.create(draft);
    if (prior) {
      db.ariaFormulations.patch(prior.id, { superseded_by: created.id });
    }
    formulations.push(created);
  }

  // Recommendations: home-level (group by signal), idempotent on (action, child_id)
  const drafts = recommendationsFor({ patterns: allPatterns, warnings: allWarnings });
  const recommendations: AriaDecisionRecommendation[] = [];
  for (const d of drafts) {
    // Determine child_id by majority of source patterns/warnings
    const sourceChildIds = [
      ...allPatterns.filter((p) => d.source_pattern_ids.includes(p.id)).map((p) => p.child_id),
      ...allWarnings.filter((w) => d.source_warning_ids.includes(w.id)).map((w) => w.child_id),
    ].filter((x): x is string => Boolean(x));
    const childId =
      sourceChildIds.length > 0
        ? sourceChildIds.sort(
            (a, b) =>
              sourceChildIds.filter((x) => x === b).length -
              sourceChildIds.filter((x) => x === a).length,
          )[0]
        : null;

    if (childIdFilter && childId && childId !== childIdFilter) continue;

    // Idempotency: if there is an open recommendation with same (action, child_id), patch it
    const existing = db.ariaDecisionRecommendations
      .findOpen(homeId)
      .find((r) => r.action === d.action && r.child_id === childId);

    const formulation = childId
      ? formulations.find((f) => f.child_id === childId)
      : null;

    const payload: Omit<AriaDecisionRecommendation, "id"> = {
      home_id: homeId,
      child_id: childId,
      formulation_id: formulation?.id ?? null,
      source_pattern_ids: d.source_pattern_ids,
      source_warning_ids: d.source_warning_ids,
      action: d.action,
      title: d.title,
      rationale: d.rationale,
      expected_impact: d.expected_impact,
      priority: d.priority,
      confidence: d.confidence,
      status: "ai_draft",
      is_ai_draft: true,
      generated_at: new Date().toISOString(),
      decided_by: null,
      decided_at: null,
      decision_note: null,
      due_date: dueDateFor(d.priority),
    };

    if (existing) {
      const patched = db.ariaDecisionRecommendations.patch(existing.id, payload);
      if (patched) recommendations.push(patched);
    } else {
      const created = db.ariaDecisionRecommendations.create(payload);
      recommendations.push(created);
    }
  }

  const summary = {
    formulations: formulations.length,
    recommendations: recommendations.length,
    p1: recommendations.filter((r) => r.priority === "p1").length,
    p2: recommendations.filter((r) => r.priority === "p2").length,
    p3: recommendations.filter((r) => r.priority === "p3").length,
    p4: recommendations.filter((r) => r.priority === "p4").length,
    high_confidence: recommendations.filter((r) => r.confidence >= 0.75).length,
  };

  // Touch lookback option to keep parameter active for future use
  void (options.lookbackDays ?? DEFAULT_LOOKBACK_DAYS);

  return {
    home_id: homeId,
    child_id: childIdFilter,
    generated_at: new Date().toISOString(),
    formulations,
    recommendations,
    summary,
  };
}

export function loadDecisionSupport(
  homeId: string,
  childId?: string | null,
): AriaDecisionSupportSnapshot {
  const formulations = db.ariaFormulations
    .findAll(homeId)
    .filter((f) => f.status !== "superseded" && f.status !== "rejected")
    .filter((f) => (childId ? f.child_id === childId : true));
  const recommendations = db.ariaDecisionRecommendations
    .findAll(homeId)
    .filter((r) =>
      ["ai_draft", "modified", "deferred", "accepted"].includes(r.status),
    )
    .filter((r) => (childId ? r.child_id === childId : true));

  const summary = {
    formulations: formulations.length,
    recommendations: recommendations.length,
    p1: recommendations.filter((r) => r.priority === "p1").length,
    p2: recommendations.filter((r) => r.priority === "p2").length,
    p3: recommendations.filter((r) => r.priority === "p3").length,
    p4: recommendations.filter((r) => r.priority === "p4").length,
    high_confidence: recommendations.filter((r) => r.confidence >= 0.75).length,
  };

  return {
    home_id: homeId,
    child_id: childId ?? null,
    generated_at: new Date().toISOString(),
    formulations,
    recommendations,
    summary,
  };
}
