// ══════════════════════════════════════════════════════════════════════════════
// Ask CARA — EVALUATION READS (leg three)
//
// Records tell CARA what happened; the knowledge base tells it what good looks
// like. This adds the third leg: the platform's own deterministic EVALUATION
// engines, distilled into a compact per-child "read" the Ask CARA engine can
// narrate — so "how is Alex doing?" comes back as a practitioner's assessment
// (direction, relationships, emotional safety), not a tally.
//
// Engines fused (all pure, all already live on their own cockpits):
//   · Outcome Intelligence   — per-child direction across 5 SCCIF-aligned domains
//   · Emotional Safety       — what triggers the child, what helps them regulate
//   · Relational Timeline    — secure / developing / fragile + trusted adults
//
// Deterministic, no LLM. Each engine call is isolated in try/catch so a data
// hiccup in one child's records can never take Ask CARA down.
// ══════════════════════════════════════════════════════════════════════════════

import type { getStore } from "@/lib/db/store";
import { buildOutcomeIntelligence } from "@/lib/outcome-intelligence/outcome-intelligence-engine";
import { buildEmotionalSafetyAnalysis } from "@/lib/emotional-safety/emotional-safety-engine";
import { buildRelationalTimeline } from "@/lib/relational-timeline/relational-timeline-engine";
import { buildInspectionReadiness } from "@/lib/inspection-intelligence/inspection-intelligence-engine";
import type { AskCaraChildEvaluation, AskCaraHomeEvaluation } from "./types";

type Store = ReturnType<typeof getStore>;

const s = (v: unknown): string => (typeof v === "string" ? v : "");

export function buildChildEvaluations(store: Store, nowIso: string): AskCaraChildEvaluation[] {
  const children = (store.youngPeople ?? []) as unknown as Array<Record<string, unknown>>;
  const current = children.filter((c) => (s(c.status) || "current") === "current");
  const out: AskCaraChildEvaluation[] = [];

  // Injected name resolver — keeps the relational engine pure & testable.
  const staffById = new Map(
    ((store.staff ?? []) as unknown as Array<Record<string, unknown>>).map((st) => [
      String(st.id),
      s(st.full_name) || [st.first_name, st.last_name].filter(Boolean).join(" ") || String(st.id),
    ]),
  );
  const staffName = (id: string): string => staffById.get(id) ?? id;

  for (const c of current) {
    const childId = String(c.id);
    const childName = s(c.preferred_name) || s(c.first_name) || s(c.full_name) || childId;
    const pace = (store.childPaceProfiles ?? []).find((p) => p.childId === childId);
    const ev: AskCaraChildEvaluation = { childId };

    // Outcome Intelligence — direction of travel across the 5 domains.
    try {
      const o = buildOutcomeIntelligence({
        childId,
        childName,
        now: nowIso,
        keyWorkingSessions: store.keyWorkingSessions ?? [],
        incidents: store.incidents ?? [],
        missingEpisodes: store.missingEpisodes ?? [],
        educationRecords: store.educationRecords ?? [],
        positiveAchievements: store.positiveAchievements ?? [],
        familyTimeSessions: store.familyTimeSessions ?? [],
        returnInterviews: store.returnInterviews ?? [],
        lacReviews: store.lacReviews ?? [],
        trustedAdults: pace?.trustedAdults ?? [],
      });
      ev.outcome = {
        trajectory: o.overallTrajectory,
        status: o.overallStatus,
        headline: o.headline,
        improving: o.domainsImproving,
        declining: o.domainsDeclining,
        focus: o.domains.filter((d) => d.status === "needs_focus").map((d) => d.label),
      };
    } catch { /* leave undefined — the engine narrates honestly */ }

    // Emotional Safety — triggers, regulation, escalation pattern.
    try {
      const e = buildEmotionalSafetyAnalysis({
        childId,
        childName,
        now: nowIso,
        behaviourLog: store.behaviourLog ?? [],
        incidents: store.incidents ?? [],
        keyWorkingSessions: store.keyWorkingSessions ?? [],
        knownTriggers: pace?.knownTriggers ?? [],
        calmingApproaches: pace?.calmingApproaches ?? [],
      });
      ev.emotional = {
        status: e.status,
        reason: e.statusReason,
        trend: e.escalation.trend,
        peakTime: e.escalation.peakTime,
        topTriggers: e.triggers.slice(0, 3).map((t) => t.label),
        whatHelps: e.whatHelps.slice(0, 3).map((w) => w.label),
      };
    } catch { /* as above */ }

    // Relational Timeline — connection, repair, trusted adults.
    try {
      const r = buildRelationalTimeline({
        childId,
        childName,
        now: nowIso,
        keyWorkingSessions: store.keyWorkingSessions ?? [],
        debriefRecords: store.debriefRecords ?? [],
        incidents: store.incidents ?? [],
        familyTimeSessions: store.familyTimeSessions ?? [],
        missingEpisodes: store.missingEpisodes ?? [],
        returnInterviews: store.returnInterviews ?? [],
        positiveAchievements: store.positiveAchievements ?? [],
        educationRecords: store.educationRecords ?? [],
        lacReviews: store.lacReviews ?? [],
        trustedAdults: pace?.trustedAdults ?? [],
        staffName,
      });
      ev.relational = {
        status: r.stability.status,
        reason: r.stability.statusReason,
        trustedAdults: r.stability.trustedAdults.slice(0, 4),
        keyConnector: r.stability.keyConnectors[0]?.name,
        connections30d: r.stability.connectionsLast30d,
        repairs: r.stability.repairCount,
        ruptures: r.stability.ruptureCount,
      };
    } catch { /* as above */ }

    if (ev.outcome || ev.emotional || ev.relational) out.push(ev);
  }

  return out;
}

/**
 * Home-level read: the Inspection Intelligence engine's SCCIF projection —
 * evidence strength + gaps per judgement area. Deliberately the NO-GRADE
 * engine: CARA describes readiness and evidence, it never predicts an
 * inspection outcome (that discipline is a hard platform rule).
 */
export function buildHomeEvaluation(store: Store, nowIso: string): AskCaraHomeEvaluation | undefined {
  try {
    const children = ((store.youngPeople ?? []) as unknown as Array<Record<string, unknown>>)
      .filter((yp) => (s(yp.status) || "current") === "current")
      .map((yp) => ({ id: String(yp.id), name: s(yp.preferred_name) || s(yp.first_name) || "Child" }));

    const r = buildInspectionReadiness({
      now: nowIso,
      children,
      incidents: store.incidents ?? [],
      debriefRecords: store.debriefRecords ?? [],
      missingEpisodes: store.missingEpisodes ?? [],
      returnInterviews: store.returnInterviews ?? [],
      keyWorkingSessions: store.keyWorkingSessions ?? [],
      lacReviews: store.lacReviews ?? [],
      positiveAchievements: store.positiveAchievements ?? [],
      educationRecords: store.educationRecords ?? [],
      riskAssessments: store.riskAssessments ?? [],
      welfareChecks: store.welfareChecks ?? [],
      carePlans: store.carePlans ?? [],
      supervisions: store.supervisions ?? [],
      trainingRecords: store.trainingRecords ?? [],
    });

    return {
      headline: r.headline,
      areasStrong: r.areasStrong,
      areasDeveloping: r.areasDeveloping,
      areasLimited: r.areasLimited,
      areas: r.areas.map((a) => ({ label: a.label, strength: a.strength, summary: a.summary })),
      priorities: r.priorities.slice(0, 4).map((p) => ({
        area: p.area,
        label: p.label,
        detail: p.detail,
        childNames: (p.childRefs ?? []).map((c) => c.name),
      })),
    };
  } catch {
    return undefined; // the engine narrates honestly when there's no read
  }
}
