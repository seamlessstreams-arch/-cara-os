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
import { buildStrengthsRecordingIndex } from "@/lib/strengths-recording-index/strengths-recording-engine";
import { buildRepairCycleIntelligence } from "@/lib/repair-cycle-intelligence/repair-cycle-engine";
import { buildRelationalSafetyMap } from "@/lib/relational-safety-map/relational-safety-map-engine";
import { buildTeamApproachConsistency } from "@/lib/team-approach-consistency/team-approach-engine";
import { buildPracticeCultureScorecard } from "@/lib/practice-culture-scorecard/practice-culture-engine";
import { buildPracticeFrameworkUsage } from "@/lib/practice-framework-usage/framework-usage-engine";
import { buildStaffRecordingPathway } from "@/lib/staff-recording-quality-pathway/staff-recording-pathway-engine";
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

  // Strengths Recording Index — are we writing the child's strengths down?
  try {
    const sr = buildStrengthsRecordingIndex(store);
    out.strengthsRecording = {
      overallRate: sr.summary.overallRate,
      topPractitionerName: sr.summary.topPractitioner?.name,
      topCategoryLabel: sr.summary.topStrengthsCategoryLabel ?? undefined,
      perChild: sr.childProfiles.map((c) => ({
        childId: c.childId,
        rate: c.strengthsRate,
        topPhrase: c.topStrengthPhrase ?? undefined,
      })),
    };
  } catch { /* absent → skill answers honestly */ }

  // Repair Cycle Intelligence — is the rupture-repair cycle being completed?
  try {
    const rc = buildRepairCycleIntelligence(store);
    out.repairCycle = {
      overallCompletionRate: rc.summary.overallCompletionRate,
      totalIncidents: rc.summary.totalIncidents,
      incidentsWithChildPerspective: rc.summary.incidentsWithChildPerspective,
      mostCommonMissingStep: rc.summary.mostCommonMissingStep,
      avgDebriefTurnaroundDays: rc.summary.avgDebriefTurnaroundDays,
      perChild: rc.childSummaries.map((c) => ({
        childId: c.childId,
        completionRate: c.cycleCompletionRate,
        noRepair: c.incidentsWithNoRepair,
        missingStep: c.mostCommonMissingStep ?? undefined,
      })),
    };
  } catch { /* as above */ }

  // Relational Safety Map — key-worker coverage + trusted-adult synthesis.
  try {
    const rs = buildRelationalSafetyMap(store);
    out.relationalSafety = {
      secureCount: rs.summary.secureCount,
      developingCount: rs.summary.developingCount,
      fragileCount: rs.summary.fragileCount,
      noKeyWorker: rs.summary.noKeyWorkerAssigned,
      noKeyWork30d: rs.summary.noKeyWorkLast30d,
      overallStatus: rs.summary.overallStatus,
      perChild: rs.childProfiles.map((c) => ({
        childId: c.childId,
        status: c.status,
        reason: c.statusReason,
        keyWorkerName: c.keyWorker?.fullName ?? undefined, // StaffSnapshot field is `fullName`, not `name` — the `.name` read was always undefined ⇒ false "no key worker"
        sessions30d: c.sessionsLast30d,
        trustedAdults: c.trustedAdultCount,
      })),
    };
  } catch { /* as above */ }

  // Practice Culture Scorecard — the whole-home 5-dimension culture synthesis.
  try {
    const pc = buildPracticeCultureScorecard(store);
    const dims = (pc.dimensions as unknown as Array<Record<string, unknown>>).map((d) => ({
      label: String(d.label ?? d.id ?? "dimension"),
      score: typeof d.score === "number" ? d.score : 0,
      status: String(d.status ?? ""),
    }));
    out.practiceCulture = {
      overallScore: pc.overallScore,
      overallStatus: String(pc.overallStatus),
      priorityLabel: pc.summary.priorityLabel,
      priorityPrompt: pc.summary.priorityPrompt ?? undefined,
      strongestLabel: pc.summary.strongestLabel,
      frameworksEngaged: pc.summary.frameworksEngaged,
      totalFrameworks: pc.summary.totalFrameworks,
      dimensions: dims,
    };
  } catch { /* absent → skill answers honestly */ }

  // Practice Framework Usage — which frameworks live in the recording.
  try {
    const fu = buildPracticeFrameworkUsage(store);
    const tp = fu.summary.topPractitioner as unknown;
    out.frameworkUsage = {
      totalEngagements: fu.summary.totalEngagements,
      activeFrameworks: fu.summary.activeFrameworks,
      mostActiveTitle: fu.summary.mostActiveFramework?.title ?? undefined,
      needsAttentionTitle: fu.summary.needsAttentionFramework?.title ?? undefined,
      topPractitionerName: typeof tp === "string" ? tp : ((tp as unknown as Record<string, unknown> | null)?.name as string | undefined) ?? undefined,
      frameworks: (fu.frameworks as unknown as Array<Record<string, unknown>>).map((f) => ({
        title: String(f.title ?? f.frameworkId ?? "framework"),
        signal: String(f.signal ?? ""),
        trend: String(f.trend ?? ""),
      })),
    };
  } catch { /* as above */ }

  // Staff Recording Quality Pathway — per-staff writing engagement (MANAGEMENT).
  try {
    const srq = buildStaffRecordingPathway(store);
    const profiles = (srq.profiles as unknown as Array<Record<string, unknown>>).map((p) => ({
      name: String(p.name ?? p.staffName ?? p.staffId ?? "staff member"),
      signal: String(p.overallSignal ?? p.signal ?? ""),
      acceptanceRate: typeof p.acceptanceRate === "number" ? p.acceptanceRate : undefined,
    }));
    const order: Record<string, number> = { needs_support: 0, developing: 1, progressing: 2 };
    profiles.sort((a, b) => (order[a.signal] ?? 3) - (order[b.signal] ?? 3));
    out.staffRecording = {
      totalStaff: srq.summary.totalStaff,
      staffWithData: srq.summary.staffWithData,
      avgAcceptanceRate: (srq.summary as unknown as Record<string, unknown>).avgAcceptanceRate as number ?? 0,
      topTeamIssueType: ((srq.summary as unknown as Record<string, unknown>).topTeamIssueType as string | null) ?? undefined,
      needsSupportCount: profiles.filter((p) => p.signal === "needs_support").length,
      perStaff: profiles,
    };
  } catch { /* as above */ }

  // Team Approach Consistency — is the team consistent child by child?
  try {
    const ta = buildTeamApproachConsistency(store);
    out.teamApproach = {
      consistentCount: ta.summary.consistentCount,
      mixedCount: ta.summary.mixedCount,
      divergentCount: ta.summary.divergentCount,
      overallTherapeuticRate: ta.summary.overallTherapeuticRate,
      divergencePattern: ta.summary.mostCommonDivergencePattern,
      perChild: ta.childProfiles.map((c) => ({
        childId: c.childId,
        level: c.consistencyLevel,
        therapeuticRate: c.overallTherapeuticRate,
        variance: c.therapeuticRateVariance,
        mostTherapeutic: c.mostTherapeuticStaff ?? undefined,
        leastTherapeutic: c.leastTherapeuticStaff ?? undefined,
      })),
    };
  } catch { /* as above */ }

  return out;
}
