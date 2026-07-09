// ══════════════════════════════════════════════════════════════════════════════
// Ask CARA — CHILD-LEVEL PRACTICE INTELLIGENCE (leg four)
//
// Records tell CARA what happened; the knowledge base tells it what good looks
// like; the evaluation engines (leg three) read direction / triggers /
// relationships. This adds the child-level PRACTICE "critical friend" engines —
// the deterministic findings Ask CARA should surface when asked things like
// "is our language criminalising Alex?", "who is at cumulative risk?", "whose
// voice is missing?", "where are our recording gaps?" — so the answer comes from
// the ENGINE'S read of THIS home's records, not generic knowledge-base theory.
//
// Engines fused (all pure builders extracted from their cockpit routes):
//   · Care Language Audit    — criminalising/moralising/labelling language scan
//   · Child Voice Presence   — UN CRC Art.12 voice analysis across record types
//   · Recording Gap Intel.   — safeguarding-critical recording gaps per child
//   · Cumulative Risk Intel.  — 5-signal convergence → escalating/…/improving
//
// Deterministic, no LLM. Each engine call is isolated in try/catch so one
// engine's data hiccup can never take Ask CARA down — the block is simply
// absent and the skill answers honestly.
// ══════════════════════════════════════════════════════════════════════════════

import type { getStore } from "@/lib/db/store";
import { buildCareLanguageAudit } from "@/lib/care-language-audit/care-language-audit-engine";
import { buildChildVoicePresence } from "@/lib/child-voice-presence/child-voice-presence-engine";
import { buildRecordingGapIntelligence } from "@/lib/recording-gap-intelligence/recording-gap-engine";
import { buildCumulativeRiskIntelligence } from "@/lib/cumulative-risk-intelligence/cumulative-risk-engine";
import type { AskCaraPracticeDigest } from "./types";

type Store = ReturnType<typeof getStore>;

// Care Language pattern categories → readable labels.
const CARE_LANGUAGE_CATEGORY_LABEL: Record<string, string> = {
  criminalising: "criminalising language",
  moralising: "moralising language",
  power_control: "power & control language",
  minimising_trauma: "language that minimises trauma",
  character_labelling: "character labelling",
};

export function buildPracticeDigest(store: Store): AskCaraPracticeDigest {
  const out: AskCaraPracticeDigest = {};

  // Care Language Audit — is how we write about children criminalising them?
  try {
    const cl = buildCareLanguageAudit(store);
    const counts = (cl.summary.categoryCounts ?? {}) as Record<string, number>;
    const topCat = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    out.careLanguage = {
      hitRate: cl.summary.hitRate,
      totalHits: cl.summary.totalHits,
      childrenAffected: cl.summary.childrenAffected,
      topCategoryLabel: topCat && topCat[1] > 0 ? CARE_LANGUAGE_CATEGORY_LABEL[topCat[0]] ?? topCat[0] : undefined,
      mostFlaggedPhrase: cl.summary.mostFlaggedPhrase ?? undefined,
      perChild: cl.childProfiles.map((c) => ({
        childId: c.childId,
        totalHits: c.totalHits,
        topCategoryLabel: c.mostAffectedCategory ? CARE_LANGUAGE_CATEGORY_LABEL[c.mostAffectedCategory] ?? c.mostAffectedCategory : undefined,
      })),
    };
  } catch { /* absent → skill answers honestly */ }

  // Child Voice Presence — whose voice is (and isn't) in the records?
  try {
    const cv = buildChildVoicePresence(store);
    const typeLabel = new Map(cv.typeStats.map((t) => [t.type, t.label]));
    out.childVoice = {
      overallPresenceRate: cv.summary.overallPresenceRate,
      worstTypeLabel: cv.summary.worstType?.label,
      lacParticipationRate: cv.summary.lacParticipationRate,
      perChild: cv.childProfiles.map((c) => ({
        childId: c.childId,
        score: c.overallScore,
        hasData: c.hasData,
        topGapTypeLabel: c.topGapType ? typeLabel.get(c.topGapType) : undefined,
      })),
    };
  } catch { /* as above */ }

  // Recording Gap Intelligence — safeguarding-critical recording gaps.
  try {
    const rg = buildRecordingGapIntelligence(store);
    out.recordingGaps = {
      childrenWithCriticalGap: rg.summary.childrenWithCriticalGap,
      childrenWithAnyGap: rg.summary.childrenWithAnyGap,
      totalCriticalGaps: rg.summary.totalCriticalGaps,
      perChild: rg.childProfiles
        .filter((c) => c.overallSeverity !== "current")
        .map((c) => {
          const worst = c.gaps.find((g) => g.severity === "critical") ?? c.gaps[0];
          return { childId: c.childId, severity: c.overallSeverity, criticalGapCount: c.criticalGapCount, topGapLabel: worst?.domainLabel };
        }),
    };
  } catch { /* as above */ }

  // Cumulative Risk Intelligence — 5-signal convergence per child.
  try {
    const cr = buildCumulativeRiskIntelligence(store);
    out.cumulativeRisk = {
      escalatingCount: cr.summary.escalatingCount,
      urgentSupervisionCount: cr.summary.urgentSupervisionCount,
      mostCommonWorseningSignal: cr.summary.mostCommonWorseningSignal,
      perChild: cr.childProfiles
        .filter((c) => c.signal === "escalating" || c.signal === "concerning")
        .map((c) => ({
          childId: c.childId,
          signal: c.signal,
          priority: c.supervisionPriority,
          worseningSignals: c.worseningSignals,
          topWorseningLabel: c.signals.find((sig) => sig.direction === "worsening")?.label,
        })),
    };
  } catch { /* as above */ }

  return out;
}
