// ══════════════════════════════════════════════════════════════════════════════
// CARA — GOALS AND ASPIRATIONS INTELLIGENCE
// GET /api/v1/goals-aspirations-intelligence
//
// Surfaces each child's documented aspirations and outcome targets.
// Tracks whether outcomes are progressing, whether aspirations have
// supporting action plans, and whether the child's own voice is
// present throughout.
//
// "Every child in care has the right to aspire to a positive future.
//  Our role is to hold that hope with them and practically support it."
// — UN CRC Article 29; Children's Homes Regulations; Social Pedagogy
//
// Per-child profile:
//   - Aspirations documented (child_chose = true flags child ownership)
//   - Outcome targets: progressing / stable / regressing per target
//   - Voice capture: % of targets with yp_voice
//   - Overdue reviews
//   - Gap: aspirations with no linked outcome target
//
// All deterministic. No LLM calls.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";

type OutcomeDirection = string;
type OutcomeStatus = "active" | "achieved" | "on_hold" | "revised";
type AspirationRealism = string;

interface AspirationType {
  id: string;
  domain: string;
  aspiration: string;
  childChose: boolean;
  currentRealism: AspirationRealism;
  stepsTaken: number;
  stepsNext: number;
  blockers: string[];
  reviewDate: string;
  reviewOverdue: boolean;
}

interface OutcomeTargetProfile {
  id: string;
  domain: string;
  description: string;
  status: OutcomeStatus;
  direction: OutcomeDirection;
  progressSignal: "progressing" | "stable" | "regressing";
  hasChildVoice: boolean;
  childVoice: string | null;
  reviewDate: string;
  reviewOverdue: boolean;
}

interface ChildGoalsProfile {
  childId: string;
  childName: string;
  aspirationCount: number;
  childChosenAspirationCount: number;
  aspirations: AspirationType[];
  activeOutcomeCount: number;
  achievedOutcomeCount: number;
  progressingOutcomes: number;
  stableOutcomes: number;
  regressingOutcomes: number;
  outcomesWithChildVoice: number;
  childVoiceRate: number;  // 0–100
  overdueReviewCount: number;
  aspirationsWithNoOutcome: string[];  // aspiration texts without linked domains
  overallSignal: "flourishing" | "progressing" | "developing" | "needs_attention";
  supervisionPrompt: string;
}

interface GoalsAspirationsHomeSummary {
  totalChildren: number;
  childrenWithAspirations: number;
  childrenWithNoAspirations: number;
  childrenWithChildChosenAspiration: number;
  totalActiveOutcomes: number;
  totalAchievedOutcomes: number;
  overallProgressingRate: number | null;  // 0–100
  overallVoiceRate: number;  // 0–100
  overdueReviews: number;
  ofstedNote: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isOverdue(dateStr: string, now: Date): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < now;
}

function progressSignal(direction: OutcomeDirection, status: OutcomeStatus): "progressing" | "stable" | "regressing" {
  if (status === "achieved") return "progressing";
  if (direction === "improving") return "progressing";
  if (direction === "declining") return "regressing";
  return "stable";
}

function overallSignal(
  aspirations: number,
  progressing: number,
  stable: number,
  regressing: number,
  active: number,
  voiceRate: number,
): "flourishing" | "progressing" | "developing" | "needs_attention" {
  if (aspirations === 0 || active === 0) return "needs_attention";
  if (regressing > 0) return "developing";
  if (progressing >= 1 && voiceRate >= 50) return aspirations >= 2 && progressing > stable ? "flourishing" : "progressing";
  return "developing";
}

function buildSupervisionPrompt(
  childName: string,
  signal: "flourishing" | "progressing" | "developing" | "needs_attention",
  aspirationCount: number,
  childChosenCount: number,
  noOutcome: string[],
  voiceRate: number,
  overdueCount: number,
): string {
  if (signal === "flourishing") {
    return `${childName} has a strong aspirations picture — ${aspirationCount} aspirations, most child-chosen, and outcomes are progressing. Celebrate this in supervision and explore: what's helping this child believe in their future?`;
  }
  if (signal === "needs_attention") {
    if (aspirationCount === 0) {
      return `${childName} has no aspirations documented. Explore in supervision: does the team know what this child wants for their future? This is a rights-based gap — have we asked?`;
    }
    return `${childName} has aspirations documented but no active outcome targets. Explore: how are we practically supporting them to reach their goals?`;
  }
  if (voiceRate < 30) {
    return `${childName}'s outcome targets are mostly written without their voice. Explore in supervision: how can we co-produce next review's targets with ${childName} directly?`;
  }
  if (overdueCount > 0) {
    return `${childName} has ${overdueCount} overdue outcome review${overdueCount > 1 ? "s" : ""}. Reschedule in supervision this week.`;
  }
  if (noOutcome.length > 0) {
    return `${childName} has aspirations that aren't yet backed by outcome targets: ${noOutcome.slice(0, 2).map((a) => `"${a}"`).join(", ")}. Explore: how can we turn this aspiration into a supported goal?`;
  }
  if (childChosenCount === 0 && aspirationCount > 0) {
    return `${childName}'s aspirations have been recorded but none are marked as child-chosen. Explore: did ${childName} express these, or were they staff-identified? Children's own hopes carry more motivational power.`;
  }
  return `${childName}'s goals picture is developing. Review outcomes in next supervision and ensure ${childName} is co-producing their own targets.`;
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const store = getStore();
  const now = new Date();

  const youngPeople = (store.youngPeople ?? []) as Array<{
    id: string; first_name: string; last_name: string; status: string;
  }>;

  const aspirationRecords = (store.aspirationRecords ?? []) as Array<{
    id: string; child_id: string; domain: string; aspiration: string;
    child_chose: boolean; current_realism: string;
    steps_taken: string[]; steps_next: string[];
    blockers: string[]; review_date: string;
  }>;

  const outcomeTargets = (store.outcomeTargets ?? []) as Array<{
    id: string; child_id: string; domain: string;
    target_description: string; status: string;
    direction: string; yp_voice: string | null;
    review_date: string;
  }>;

  const currentChildren = youngPeople.filter((yp) => yp.status === "current");

  // ── Index by child ────────────────────────────────────────────────────────
  const aspByChild = new Map<string, typeof aspirationRecords[0][]>();
  for (const a of aspirationRecords) {
    const arr = aspByChild.get(a.child_id) ?? [];
    arr.push(a);
    aspByChild.set(a.child_id, arr);
  }

  const outByChild = new Map<string, typeof outcomeTargets[0][]>();
  for (const o of outcomeTargets) {
    const arr = outByChild.get(o.child_id) ?? [];
    arr.push(o);
    outByChild.set(o.child_id, arr);
  }

  // ── Build per-child profiles ──────────────────────────────────────────────
  const childProfiles: ChildGoalsProfile[] = currentChildren.map((yp) => {
    const aspirations = aspByChild.get(yp.id) ?? [];
    const outcomes    = outByChild.get(yp.id) ?? [];
    const activeOut   = outcomes.filter((o) => o.status === "active");
    const achieved    = outcomes.filter((o) => o.status === "achieved");

    const aspMapped: AspirationType[] = aspirations.map((a) => ({
      id: a.id,
      domain: a.domain,
      aspiration: a.aspiration,
      childChose: a.child_chose,
      currentRealism: a.current_realism,
      stepsTaken: (a.steps_taken ?? []).length,
      stepsNext: (a.steps_next ?? []).length,
      blockers: a.blockers ?? [],
      reviewDate: a.review_date,
      reviewOverdue: isOverdue(a.review_date, now),
    }));

    const outMapped: OutcomeTargetProfile[] = outcomes.map((o) => {
      const sig = progressSignal(o.direction, o.status as OutcomeStatus);
      return {
        id: o.id,
        domain: o.domain,
        description: o.target_description,
        status: o.status as OutcomeStatus,
        direction: o.direction,
        progressSignal: sig,
        hasChildVoice: !!(o.yp_voice && o.yp_voice.trim().length > 5),
        childVoice: o.yp_voice ?? null,
        reviewDate: o.review_date,
        reviewOverdue: isOverdue(o.review_date, now),
      };
    });

    const progressing = outMapped.filter((o) => o.progressSignal === "progressing").length;
    const stable      = outMapped.filter((o) => o.progressSignal === "stable").length;
    const regressing  = outMapped.filter((o) => o.progressSignal === "regressing").length;
    const withVoice   = outMapped.filter((o) => o.hasChildVoice).length;
    const voiceRate   = outMapped.length > 0 ? Math.round((withVoice / outMapped.length) * 100) : null;
    const overdue     = [...aspMapped.filter((a) => a.reviewOverdue), ...outMapped.filter((o) => o.reviewOverdue)].length;

    const childChosenCount = aspirations.filter((a) => a.child_chose).length;

    // Aspirations with no matching outcome domain
    const outDomains = new Set(outcomes.map((o) => o.domain));
    const aspirationsWithNoOutcome = aspirations
      .filter((a) => !outDomains.has(a.domain))
      .map((a) => a.aspiration)
      .slice(0, 3);

    const signal = overallSignal(
      aspirations.length, progressing, stable, regressing, activeOut.length, voiceRate,
    );

    return {
      childId: yp.id,
      childName: `${yp.first_name} ${yp.last_name}`,
      aspirationCount: aspirations.length,
      childChosenAspirationCount: childChosenCount,
      aspirations: aspMapped,
      activeOutcomeCount: activeOut.length,
      achievedOutcomeCount: achieved.length,
      progressingOutcomes: progressing,
      stableOutcomes: stable,
      regressingOutcomes: regressing,
      outcomesWithChildVoice: withVoice,
      childVoiceRate: voiceRate,
      overdueReviewCount: overdue,
      aspirationsWithNoOutcome,
      overallSignal: signal,
      supervisionPrompt: buildSupervisionPrompt(
        `${yp.first_name} ${yp.last_name}`, signal,
        aspirations.length, childChosenCount,
        aspirationsWithNoOutcome, voiceRate, overdue,
      ),
    };
  });

  // Sort: needs_attention → developing → progressing → flourishing
  const ORDER: Record<string, number> = { needs_attention: 0, developing: 1, progressing: 2, flourishing: 3 };
  childProfiles.sort((a, b) => ORDER[a.overallSignal] - ORDER[b.overallSignal]);

  // ── Home summary ──────────────────────────────────────────────────────────
  const withAsp     = childProfiles.filter((c) => c.aspirationCount > 0).length;
  const withChild   = childProfiles.filter((c) => c.childChosenAspirationCount > 0).length;
  const totalActive = childProfiles.reduce((s, c) => s + c.activeOutcomeCount, 0);
  const totalAch    = childProfiles.reduce((s, c) => s + c.achievedOutcomeCount, 0);
  const totalProg   = childProfiles.reduce((s, c) => s + c.progressingOutcomes, 0);
  const totalVoice  = childProfiles.reduce((s, c) => s + c.outcomesWithChildVoice, 0);
  const totalOut    = childProfiles.reduce((s, c) => s + c.activeOutcomeCount + c.achievedOutcomeCount, 0);
  const totalOverdue = childProfiles.reduce((s, c) => s + c.overdueReviewCount, 0);

  const overallProgRate = totalOut > 0 ? Math.round((totalProg / totalOut) * 100) : null;
  const overallVoiceRate = totalOut > 0 ? Math.round((totalVoice / totalOut) * 100) : null;

  const ofstedNote =
    childProfiles.filter((c) => c.aspirationCount === 0).length > 0
      ? `${childProfiles.filter((c) => c.aspirationCount === 0).length} child${childProfiles.filter((c) => c.aspirationCount === 0).length > 1 ? "ren" : ""} have no aspirations documented. An inspector will ask: do you know what each child hopes for their future?`
      : (overallVoiceRate ?? 0) < 30
      ? `Goals are documented but children's own voices are missing from ${100 - (overallVoiceRate ?? 0)}% of outcome targets. Co-production is an inspection focus.`
      : `${overallProgRate}% of outcomes are progressing. Aspirations are documented for ${withAsp} of ${currentChildren.length} current residents.`;

  const summary: GoalsAspirationsHomeSummary = {
    totalChildren: currentChildren.length,
    childrenWithAspirations: withAsp,
    childrenWithNoAspirations: currentChildren.length - withAsp,
    childrenWithChildChosenAspiration: withChild,
    totalActiveOutcomes: totalActive,
    totalAchievedOutcomes: totalAch,
    overallProgressingRate: overallProgRate,
    overallVoiceRate,
    overdueReviews: totalOverdue,
    ofstedNote,
  };

  return NextResponse.json({ data: { childProfiles, summary } });
}
