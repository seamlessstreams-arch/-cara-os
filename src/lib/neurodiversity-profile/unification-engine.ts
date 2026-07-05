// ══════════════════════════════════════════════════════════════════════════════
// CARA — UNIFIED NEURODIVERSITY PROFILE (pure engine)
//
// unifyNeuroProfile(input) merges a child's Autism plan, ADHD plan, sensory
// profile and EHCP into ONE readable profile (deduping, latest-plan-wins,
// honest "no profile"). deriveRecordingPrompts(profile, context) then turns that
// profile into the few things the person recording most needs to see RIGHT NOW —
// ordered for the context (a restraint leads with "what makes it worse" and the
// signs of shutdown, not defiance). No model calls, no store access.
// ══════════════════════════════════════════════════════════════════════════════

import {
  NEURO_PROFILE_VERSION,
  type NeuroPrompt,
  type NeuroRecordingContext,
  type NeuroReviewGap,
  type NeuroSensoryEntry,
  type NeuroSourceKind,
  type UnifiedCondition,
  type UnifiedNeuroProfile,
  type UnifyNeuroInput,
} from "./types";

const REGULATORY_LINKS = [
  "Equality Act 2010 — reasonable adjustments for disabled children.",
  "SEND Code of Practice 2015 — identifying and meeting special educational needs.",
  "Children's Homes (England) Regulations 2015, Reg 6 & 11 — meeting each child's needs.",
];

const clean = (arr?: (string | null | undefined)[]): string[] =>
  (arr ?? []).map((s) => (s ?? "").trim()).filter((s) => s.length > 0);

/** Merge many string lists, de-duplicated case-insensitively, first-seen order. */
function mergeUnique(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const s of list) {
      const k = s.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(s);
    }
  }
  return out;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

/** The latest plan by plan_date (so a refreshed plan supersedes an old one). */
function latest<T extends { plan_date?: string }>(plans: T[]): T | undefined {
  if (plans.length === 0) return undefined;
  return [...plans].sort((a, b) => (a.plan_date ?? "") < (b.plan_date ?? "") ? 1 : -1)[0];
}

export function unifyNeuroProfile(input: UnifyNeuroInput): UnifiedNeuroProfile {
  const { childId, childName, asOf } = input;
  const autism = latest(input.autismPlans.filter((p) => p.child_id === childId));
  const adhd = latest(input.adhdPlans.filter((p) => p.child_id === childId));
  const sensory = [...input.sensoryProfiles.filter((p) => p.child_id === childId)].sort((a, b) =>
    (a.review_date ?? "") < (b.review_date ?? "") ? 1 : -1,
  )[0];
  const ehcpRec = [...input.ehcps.filter((p) => p.child_id === childId)][0];

  const sources: NeuroSourceKind[] = [];
  const conditions: UnifiedCondition[] = [];

  if (autism) {
    sources.push("autism_plan");
    conditions.push({
      kind: "autism",
      label: "Autism",
      status: autism.diagnosis_status,
      date: autism.diagnosis_date,
      clinician: autism.diagnosing_clinician,
      source: "autism_plan",
    });
  }
  if (adhd) {
    sources.push("adhd_plan");
    conditions.push({
      kind: "adhd",
      label: "ADHD",
      status: adhd.diagnosis_status,
      date: adhd.diagnosis_date,
      source: "adhd_plan",
    });
  }

  // ── Sensory (merge the sensory profile's entries + the autism plan's) ─────
  const sensoryEntries: NeuroSensoryEntry[] = [];
  if (sensory) {
    sources.push("sensory_profile");
    for (const d of sensory.diagnosis ?? []) {
      if (clean([d]).length && !conditions.some((c) => c.label.toLowerCase() === d.toLowerCase())) {
        conditions.push({ kind: "other", label: d, status: "recorded", source: "sensory_profile" });
      }
    }
    for (const e of sensory.entries ?? []) {
      sensoryEntries.push({
        domain: e.domain,
        pattern: e.response_pattern,
        triggers: clean(e.triggers),
        calming: clean(e.calming),
        notes: (e.notes ?? "").trim(),
        source: "sensory_profile",
      });
    }
  }
  if (autism) {
    for (const s of autism.sensory_profile ?? []) {
      // Only add an autism-plan sensory note if that domain isn't already covered.
      if (!sensoryEntries.some((x) => x.domain.toLowerCase() === s.sense.toLowerCase())) {
        sensoryEntries.push({
          domain: s.sense,
          pattern: s.seeking_or_avoiding,
          triggers: [],
          calming: [],
          notes: (s.specific_notes ?? "").trim(),
          source: "autism_plan",
        });
      }
    }
  }

  const ehcp = ehcpRec
    ? {
        status: ehcpRec.plan_status,
        primaryNeed: ehcpRec.primary_need,
        secondaryNeeds: clean(ehcpRec.secondary_needs),
        outstandingActions: clean(ehcpRec.outstanding_actions),
        nextReviewDue: ehcpRec.next_annual_review_due || null,
      }
    : null;
  if (ehcpRec) sources.push("ehcp");

  const behaviour = {
    triggers: mergeUnique(clean(autism?.meltdown_triggers), sensoryEntries.flatMap((e) => e.triggers)),
    meltdownSupport: mergeUnique(clean(autism?.meltdown_support), sensoryEntries.flatMap((e) => e.calming)),
    shutdownIndicators: clean(autism?.shutdown_indicators),
    staffDo: mergeUnique(clean(autism?.staff_do_strategies), clean(adhd?.staff_do_strategies)),
    staffDoNot: mergeUnique(clean(autism?.staff_do_not_strategies), clean(adhd?.staff_do_not_strategies)),
    predictabilityNeeds: mergeUnique(clean(autism?.predictability_needs), clean(adhd?.executive_function_support)),
    transitionSupport: mergeUnique(clean(autism?.transition_support), clean(adhd?.time_blindness_strategies)),
  };

  // ── Review gaps (honest, actionable) ──────────────────────────────────────
  const reviewGaps: NeuroReviewGap[] = [];
  const gapForReview = (label: string, date: string | undefined, id: string) => {
    if (!date) return;
    const d = daysBetween(asOf, date);
    if (d < 0) reviewGaps.push({ id, severity: "overdue", message: `${label} review was due ${Math.abs(d)} day(s) ago.` });
    else if (d <= 30) reviewGaps.push({ id, severity: "due_soon", message: `${label} review is due in ${d} day(s).` });
  };
  if (autism) gapForReview("Autism plan", autism.review_date, "autism_review");
  if (adhd) gapForReview("ADHD plan", adhd.review_date, "adhd_review");
  if (sensory) gapForReview("Sensory profile", sensory.review_date, "sensory_review");
  if (ehcp?.nextReviewDue) gapForReview("EHCP annual", ehcp.nextReviewDue, "ehcp_review");
  // Autism recorded but no sensory profile — a known regulatory expectation.
  if (autism && !sensory) {
    reviewGaps.push({ id: "sensory_missing", severity: "missing", message: "Autism is recorded but no sensory profile is on file — one is expected." });
  }

  const hasProfile = sources.length > 0;

  return {
    childId,
    childName,
    hasProfile,
    conditions,
    sensory: {
      entries: sensoryEntries,
      adaptations: mergeUnique(clean(sensory?.environmental_adaptations)),
    },
    communication: {
      preferences: mergeUnique(clean(autism?.communication_preferences), clean(sensory?.communication_preferences)),
    },
    behaviour,
    specialInterests: clean(autism?.special_interests),
    ehcp,
    childVoice: (autism?.child_voice || adhd?.child_voice || sensory?.child_views || "").trim(),
    keyWorker: autism?.key_worker || adhd?.key_worker || "",
    reviewGaps,
    sources,
    regulatoryLinks: REGULATORY_LINKS,
    disclaimer: hasProfile
      ? `This brings together what is already recorded about ${childName}'s neurodiversity. It supports your judgement in the moment — it is not a diagnosis and not a substitute for knowing ${childName}.`
      : `No neurodiversity record is on file for ${childName}. If the team is seeing sensory, communication or regulation needs, consider whether an assessment or a profile is warranted.`,
    engineVersion: NEURO_PROFILE_VERSION,
  };
}

// ── Point-of-work prompts — the few things to see RIGHT NOW, ordered for the
//    context. Empty lists are dropped; a profile with nothing to say returns []. ─

interface PromptSpec {
  id: string;
  priority: NeuroPrompt["priority"];
  label: string;
  items: string[];
  source: NeuroSourceKind;
}

export function deriveRecordingPrompts(profile: UnifiedNeuroProfile, context: NeuroRecordingContext): NeuroPrompt[] {
  if (!profile.hasProfile) return [];
  const b = profile.behaviour;
  const primarySource: NeuroSourceKind = profile.sources.includes("autism_plan")
    ? "autism_plan"
    : profile.sources.includes("adhd_plan")
      ? "adhd_plan"
      : profile.sources[0];

  const P = (id: string, priority: PromptSpec["priority"], label: string, items: string[], source: NeuroSourceKind): PromptSpec => ({
    id,
    priority,
    label,
    items,
    source,
  });

  let specs: PromptSpec[] = [];

  switch (context) {
    case "restraint":
      // Highest stakes: lead with what makes it worse and the signs this is
      // distress/shutdown, not defiance — before any physical response.
      specs = [
        P("avoid", "critical", "Avoid — this makes it worse", b.staffDoNot, primarySource),
        P("shutdown", "critical", "Signs of shutdown (distress, not defiance)", b.shutdownIndicators, "autism_plan"),
        P("calming", "important", "What helps them regulate", b.meltdownSupport, primarySource),
        P("comms", "important", "How they communicate", profile.communication.preferences, primarySource),
      ];
      break;
    case "incident":
      specs = [
        P("triggers", "important", "Known triggers to check against", b.triggers, primarySource),
        P("do", "important", "What helps — staff DO", b.staffDo, primarySource),
        P("avoid", "important", "What makes it worse — staff DO NOT", b.staffDoNot, primarySource),
        P("comms", "helpful", "How they communicate", profile.communication.preferences, primarySource),
      ];
      break;
    case "behaviour":
      specs = [
        P("predictability", "important", "Predictability & routine needs", b.predictabilityNeeds, primarySource),
        P("triggers", "important", "Known triggers", b.triggers, primarySource),
        P("do", "important", "What helps — staff DO", b.staffDo, primarySource),
        P("avoid", "helpful", "What makes it worse — staff DO NOT", b.staffDoNot, primarySource),
      ];
      break;
    case "key_work":
      specs = [
        P("interests", "helpful", "Special interests (a way in)", profile.specialInterests, "autism_plan"),
        P("comms", "helpful", "How they communicate", profile.communication.preferences, primarySource),
        P("transitions", "helpful", "Transition support", b.transitionSupport, primarySource),
      ];
      break;
    case "daily_log":
    case "care_plan":
    case "overview":
    default:
      specs = [
        P("triggers", "important", "Known triggers", b.triggers, primarySource),
        P("do", "important", "What helps — staff DO", b.staffDo, primarySource),
        P("predictability", "helpful", "Predictability & routine needs", b.predictabilityNeeds, primarySource),
        P("adaptations", "helpful", "Sensory adaptations in place", profile.sensory.adaptations, "sensory_profile"),
      ];
      break;
  }

  return specs.filter((s) => s.items.length > 0).map((s) => ({ ...s, items: s.items.slice(0, 6) }));
}

export { NEURO_PROFILE_VERSION };
