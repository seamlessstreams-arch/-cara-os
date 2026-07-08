// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGEMENT OVERSIGHT · Practice Lens
//
// When CARA reviews, drafts or suggests, it must consider EVERYTHING that is
// coded and loaded — not just the record in front of it. This lens brings the
// full practice intelligence to every oversight review:
//
//   · Contextual safeguarding — deterministic signal scan of the narrative for
//     extra-familial harm (peers, places, online, exploitation), with NRM
//     advice where indicators fire (advice only — the DSL decides).
//   · The child's Digital Twin — did the response use what we KNOW helps this
//     child? Were known escalating phrases used? Strengths held in mind?
//   · Training — is the involved staff member's relevant training current?
//   · Practice knowledge — the loaded frameworks (PACE, behaviour drivers,
//     contextual safeguarding) grounding the reflective questions by record type.
//
// Pure + deterministic. Considerations the manager weighs — never decisions.
// ══════════════════════════════════════════════════════════════════════════════

import { activeSafeguardingSignals } from "@/lib/cara/safeguarding-signals";
import { assessNRMIndicators } from "@/lib/cara/nrm-modern-slavery";
import { contextualSafeguardingQuestions } from "@/lib/cara/contextual-safeguarding";
import { behaviourDriverQuestions } from "@/lib/cara/practice-frameworks";
import { getEntriesByTag } from "@/lib/cara/knowledge-base";
import { mentionsAny } from "@/lib/text/keyword-match";
import type { OversightInput } from "./types";

export interface PracticeLensFindings {
  contextualSafeguarding: string[];
  childLens: string[];
  trainingConsiderations: string[];
  knowledgeGrounding: string[];
}

const EXTRA_FAMILIAL_CUES = [
  "older friends", "new friends", "unknown adults", "group of", "peer", "peers", "park", "town centre",
  "online", "snapchat", "instagram", "tiktok", "phone from", "gifts", "money", "vapes", "trainers from",
  "different area", "out of area", "postcode", "county lines", "carrying", "package", "train station",
];

/** Which training matters for which record type (matched on course name).
 *  Keys are the workflow RecordType values hydrate actually emits. */
const TRAINING_RELEVANCE: Record<string, string[]> = {
  physical_intervention: ["restraint", "physical intervention", "team teach", "mapa", "pi refresher", "positive handling"],
  safeguarding: ["safeguarding"],
  allegation: ["safeguarding", "safer recruitment"],
  missing_episode: ["safeguarding", "missing"],
  medication: ["medication"],
  incident: ["de-escalation", "behaviour", "safeguarding"],
};

export function buildPracticeLens(input: OversightInput): PracticeLensFindings {
  const out: PracticeLensFindings = {
    contextualSafeguarding: [],
    childLens: [],
    trainingConsiderations: [],
    knowledgeGrounding: [],
  };
  const ctx = input.practiceLensContext;
  const text = `${ctx?.narrativeText ?? ""} ${input.summary ?? ""}`.trim();
  const lower = text.toLowerCase();
  const childName = input.childName || "the child";

  // ── Contextual safeguarding: scan the narrative, not just the type ─────────
  if (text) {
    const signals = activeSafeguardingSignals(text);
    for (const sig of signals.slice(0, 3)) {
      out.contextualSafeguarding.push(
        `${sig.label} signal in this record — ${sig.requiredAction} (${sig.statutoryTrigger}; ${sig.requiredRole} to consider).`,
      );
    }
    const extraFamilial = EXTRA_FAMILIAL_CUES.filter((c) => lower.includes(c));
    if (extraFamilial.length >= 2) {
      out.contextualSafeguarding.push(
        `Possible extra-familial context (${extraFamilial.slice(0, 3).join(", ")}): assess the CONTEXTS around ${childName} — peers, places and online spaces — not only the behaviour. Guardianship, not surveillance.`,
      );
      const q = contextualSafeguardingQuestions()[0];
      if (q) out.contextualSafeguarding.push(`Contextual Safeguarding asks: ${q.question}`);
    }
    const nrm = assessNRMIndicators(text);
    if (nrm.adviseConsiderReferral) {
      out.contextualSafeguarding.push(`${nrm.advice} ${nrm.rationale}`);
    }
  }

  // ── The child's Digital Twin: did we use what we know? ─────────────────────
  if (ctx) {
    const usedEscalating = (ctx.childPhrasesThatEscalate ?? []).filter((p) => p && lower.includes(p.toLowerCase().replace(/[.]$/, "")));
    if (usedEscalating.length) {
      out.childLens.push(
        `The record contains phrasing ${childName}'s profile flags as escalating ("${usedEscalating[0]}") — worth exploring in debrief, without blame.`,
      );
    }
    const helps = ctx.childWhatHelps ?? [];
    if (helps.length && text) {
      const referenced = helps.some((h) => h && mentionsAny(lower, h.toLowerCase().split(/\s+/).filter((w) => w.length > 4).slice(0, 2)));
      if (!referenced) {
        out.childLens.push(
          `${childName}'s profile says these help: ${helps.slice(0, 3).join("; ")}. The record doesn't show them being tried — were they, and is the recording missing it?`,
        );
      } else {
        out.childLens.push(`The response drew on what ${childName}'s profile says helps — reinforce this with the team.`);
      }
    }
    if ((ctx.childTriggers ?? []).length && text) {
      const hit = (ctx.childTriggers ?? []).find((t) => t && lower.includes(t.toLowerCase().slice(0, 18)));
      if (hit) out.childLens.push(`A known trigger appears in this event (${hit}) — the plan already anticipates this; check the agreed response was followed and still fits.`);
    }
    if ((ctx.childStrengths ?? []).length) {
      out.childLens.push(`Hold the whole child in view: ${childName}'s strengths include ${ctx.childStrengths!.slice(0, 2).join(" and ")} — oversight should protect these, not just manage risk.`);
    }
  }

  // ── Training: is the practice underpinned? ──────────────────────────────────
  const relevance = TRAINING_RELEVANCE[input.recordType as string] ?? TRAINING_RELEVANCE.incident;
  for (const row of ctx?.staffTraining ?? []) {
    const course = row.course.toLowerCase();
    const relevant = relevance.some((r) => course.includes(r)) || row.mandatory;
    const lapsed = ["expired", "overdue", "not_started", "expiring_soon"].includes(row.status);
    if (relevant && lapsed) {
      out.trainingConsiderations.push(
        `${row.staffName}'s "${row.course}" training is ${row.status.replace(/_/g, " ")} — relevant to this record type; arrange the refresher and consider support in the meantime (a learning need, not a blame finding).`,
      );
    }
  }

  // ── Practice knowledge: ground the reflection in the loaded frameworks ──────
  const rt = input.recordType as string;
  if (rt === "physical_intervention") {
    const pace = getEntriesByTag("PACE")[0];
    if (pace) out.knowledgeGrounding.push(`${pace.title}: ${pace.principles.slice(0, 4).join(" · ")} — the repair conversation matters as much as the hold; check it happened and was recorded.`);
    const q = behaviourDriverQuestions()[0];
    if (q) out.knowledgeGrounding.push(`Behaviour-driver lens: ${q.question}`);
  } else if (rt === "missing_episode") {
    const q = contextualSafeguardingQuestions()[1] ?? contextualSafeguardingQuestions()[0];
    if (q) out.knowledgeGrounding.push(`Contextual Safeguarding lens: ${q.question}`);
  } else if (rt === "safeguarding" || rt === "allegation") {
    const trauma = getEntriesByTag("trauma-informed")[0];
    if (trauma) out.knowledgeGrounding.push(`${trauma.title}: ${trauma.principles.slice(0, 3).join(" · ")}.`);
  } else {
    const q = behaviourDriverQuestions()[0];
    if (q) out.knowledgeGrounding.push(`Behaviour-driver lens: ${q.question}`);
  }

  return out;
}
