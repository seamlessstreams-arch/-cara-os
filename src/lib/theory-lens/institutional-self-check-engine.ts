// ─────────────────────────────────────────────────────────────────────────────
// Institutional Self-Check (doctrine 2.2.10, lens from 1.13)
//
// "Harm is intensified when the institution fails to protect or respond — the
// organisation's own behaviour is a safeguarding variable to monitor."
// Or, as the brief puts it: CARA AUDITING CARA'S HOME IS PART OF SAFEGUARDING.
//
// It asks one question: does our own response pattern — slow escalations,
// unrepaired ruptures, unanswered child voice — risk compounding harm?
//
// FOUR RULES.
//
// 1. ABSENCE OF DATA IS NOT REASSURANCE. This inverts the rule the shift
//    lifecycle lives by, and the inversion is the point. There, no records must
//    never ACCUSE a team — you don't call a person negligent for something you
//    cannot see. Here, no records must never REASSURE the institution — a
//    self-check that goes green because nothing was written down is the most
//    dangerous output this engine could produce; it is exactly how an
//    organisation congratulates itself for not looking. The subject changed, so
//    the direction of charity changes with it: extend the benefit of the doubt
//    to the person, never to the institution auditing itself.
//
// 2. THE UNIT IS THE HOME, NEVER A PERSON. Institutional betrayal is a property
//    of an organisation's pattern of response. The moment this reads "Naomi is
//    slow to escalate" it stops being a safeguarding lens and becomes a
//    performance-management tool — which teaches people to hide things, and so
//    compounds the very harm it watches for. No finding here carries a staff id,
//    and there is no field to put one in.
//
// 3. IT SPEAKS FROM WHERE THE CHILD SITS. Not "escalation window exceeded" but
//    "Casey has raised this three times; from where she sits, nothing has
//    happened in eleven days." A timescale breach is an abstraction; a child
//    waiting is the thing that actually matters, and it is the same fact.
//
// 4. IT NEVER LECTURES THEORY (1.13). The lens is internal machinery. Nothing
//    here says "institutional betrayal theory holds that…" at a team. It says
//    what our own records show, plainly, and asks a question.
//
// This engine COMPOSES three engines that already exist; it re-derives nothing:
//   · escalation-quality  (#752) — slow escalations
//   · repair-cycle        — unrepaired ruptures
//   · voice-follow-through (#744) — unanswered child voice
//
// It is a prompt to look, never a verdict, and never a grade. Pure and
// deterministic: caller supplies `now` and the three results; no store; no AI.
// ─────────────────────────────────────────────────────────────────────────────

import type { EscalationQualityResult } from "@/lib/risk-escalation/escalation-quality-engine";
import type { VoiceFollowThroughResult } from "@/lib/voice-of-child/voice-follow-through-engine";
import type { RepairCycleData } from "@/lib/repair-cycle-intelligence/repair-cycle-engine";

/** The three ways an organisation's own response can compound harm. */
export type SelfCheckStrand = "responding" | "repairing" | "answering";

export type SelfCheckKey =
  | "slow_to_decide"
  | "everything_urgent"
  | "ruptures_left_unrepaired"
  | "child_perspective_missing"
  | "voice_unanswered"
  | "voice_not_explained_back"
  | "responding_well"
  | "repairing_well"
  | "answering_well";

/** Whether Cara can see enough to say anything at all. `unlit` is NOT good news
 *  — it means this part of our own behaviour is unmonitored. */
export type StrandVisibility = "lit" | "unlit";

export interface SelfCheckFinding {
  key: SelfCheckKey;
  strand: SelfCheckStrand;
  /** "prompt" invites a look; "positive" credits the home. Never a verdict. */
  tone: "prompt" | "positive";
  /** Said from where the child sits, in plain language. */
  headline: string;
  whyShown: string;
  /** The question this should start, not the answer it gives. */
  question: string;
  /** Ids in the source engines — always traceable back to records. */
  evidenceIds: string[];
}

export interface StrandView {
  strand: SelfCheckStrand;
  label: string;
  /** What this strand is asking, in the child's terms. */
  question: string;
  visibility: StrandVisibility;
  /** Stated whenever `unlit` — absence is reported, never scored as fine. */
  visibilityNote: string;
  findings: SelfCheckFinding[];
}

export interface InstitutionalSelfCheck {
  strands: StrandView[];
  findings: SelfCheckFinding[];
  /** How many strands Cara can actually see. */
  lit: number;
  unlit: number;
  /** Plain summary. Never a grade, never a score, never a RAG rating. */
  summary: string;
  /** The standing caveat, always present. */
  caveat: string;
}

const STRANDS: { strand: SelfCheckStrand; label: string; question: string }[] = [
  {
    strand: "responding",
    label: "When we are worried, how fast do we act?",
    question: "If I were the child this concern is about, how long would I have been waiting?",
  },
  {
    strand: "repairing",
    label: "After it goes wrong, do we put it right?",
    question: "If I were the child, would anyone have come back to me afterwards?",
  },
  {
    strand: "answering",
    label: "When a child speaks, do they get an answer?",
    question: "If I were the child, would I know what happened to what I said?",
  },
];

const UNLIT_NOTE =
  "Cara has no records of this to look at. That is not the same as this going well — it means this part of our own response is unmonitored, and an organisation cannot audit itself on records it never made.";

/** The one caveat that must never be dropped, whatever the findings say. */
export const SELF_CHECK_CAVEAT =
  "This looks at our own pattern of response, never at any individual. It is a prompt to look, not a verdict and not a grade — the answer lives in the records and in the room, not on this page.";

export function buildInstitutionalSelfCheck(input: {
  escalation: EscalationQualityResult | null;
  repair: RepairCycleData | null;
  voice: VoiceFollowThroughResult | null;
}): InstitutionalSelfCheck {
  const findings: SelfCheckFinding[] = [];

  // ── Strand 1: responding. Composed from escalation-quality (#752).
  const esc = input.escalation;
  const respondingLit = !!esc && esc.counts.total > 0;
  if (esc && respondingLit) {
    const overdue = esc.findings.filter((f) => f.key === "decision_overdue" || f.key === "slow_decision_pattern");
    for (const f of overdue) {
      findings.push({
        key: "slow_to_decide",
        strand: "responding",
        tone: "prompt",
        // Re-voiced from the child's seat; the underlying fact is the engine's.
        headline: `A child is waiting on a decision: ${f.headline}`,
        whyShown: f.whyShown,
        question: "What is in the way of deciding this, and who can move it today?",
        evidenceIds: f.evidenceIds,
      });
    }
    const fatigue = esc.findings.find((f) => f.key === "alert_fatigue_risk");
    if (fatigue) {
      findings.push({
        key: "everything_urgent",
        strand: "responding",
        tone: "prompt",
        headline: "Nearly everything is marked urgent — so nothing reads as urgent",
        whyShown: fatigue.whyShown,
        question: "If everything is urgent, how would the genuinely urgent thing reach us?",
        evidenceIds: fatigue.evidenceIds,
      });
    }
    if (overdue.length === 0 && !fatigue && esc.counts.exceededWindow === 0) {
      findings.push({
        key: "responding_well",
        strand: "responding",
        tone: "positive",
        headline: "Concerns are being decided inside their windows",
        whyShown: `${esc.counts.total} escalation decision${esc.counts.total === 1 ? "" : "s"} on record, none past its window. Children are not left waiting on us.`,
        question: "Worth saying out loud to the team — what is making this work?",
        evidenceIds: [],
      });
    }
  }

  // ── Strand 2: repairing. Composed from repair-cycle intelligence.
  const rep = input.repair;
  const repairingLit = !!rep && rep.summary.totalIncidents > 0;
  if (rep && repairingLit) {
    const s = rep.summary;
    const unrepaired = s.totalIncidents - s.incidentsWithCompleteRepair;
    if (unrepaired > 0) {
      findings.push({
        key: "ruptures_left_unrepaired",
        strand: "repairing",
        tone: "prompt",
        headline: `${unrepaired} of ${s.totalIncidents} ruptures have no completed repair`,
        whyShown: `The step most often missing is ${s.mostCommonMissingStep}. A rupture nobody returns to teaches a child that adults leave things broken.`,
        question: "Which of these can still be repaired — and what would the child need for it to count?",
        evidenceIds: rep.incidentProfiles
          .filter((p) => p.cycleStatus !== "complete")
          .slice(0, 8)
          .map((p) => p.incidentId),
      });
    }
    const noPerspective = s.totalIncidents - s.incidentsWithChildPerspective;
    if (noPerspective > 0) {
      findings.push({
        key: "child_perspective_missing",
        strand: "repairing",
        tone: "prompt",
        headline: `${noPerspective} incident${noPerspective === 1 ? "" : "s"} recorded without the child's account of it`,
        whyShown:
          "The record holds what the adults saw. Without the child's own account, the story of what happened to them is told entirely by other people.",
        question: "Whose version of this is on file — and would the child recognise it?",
        evidenceIds: rep.incidentProfiles
          .filter((p) => !p.childPerspectiveCaptured)
          .slice(0, 8)
          .map((p) => p.incidentId),
      });
    }
    if (unrepaired === 0 && noPerspective === 0) {
      findings.push({
        key: "repairing_well",
        strand: "repairing",
        tone: "positive",
        headline: "Every rupture on record has been returned to, with the child's account in it",
        whyShown: `${s.totalIncidents} incident${s.totalIncidents === 1 ? "" : "s"}, all with a completed repair cycle.`,
        question: "What is the team doing here that is worth protecting?",
        evidenceIds: [],
      });
    }
  }

  // ── Strand 3: answering. Composed from voice-follow-through (#744).
  const voice = input.voice;
  const answeringLit = !!voice && voice.loops.length > 0;
  if (voice && answeringLit) {
    const unanswered = voice.detections.filter((d) => d.key === "voice_without_response" || d.key === "stalled_loop");
    if (unanswered.length > 0) {
      findings.push({
        key: "voice_unanswered",
        strand: "answering",
        tone: "prompt",
        headline: `${unanswered.length} thing${unanswered.length === 1 ? "" : "s"} a child raised, with nothing visibly done`,
        whyShown:
          "A child who raises something and hears nothing learns that speaking up changes nothing — which is what stops the next disclosure.",
        question: "What would this child say has happened since they told us?",
        evidenceIds: unanswered.map((d) => d.loopId),
      });
    }
    const notExplained = voice.detections.filter((d) => d.key === "explain_back_overdue" || d.key === "review_with_child_missing");
    if (notExplained.length > 0) {
      findings.push({
        key: "voice_not_explained_back",
        strand: "answering",
        tone: "prompt",
        headline: `${notExplained.length} where adults acted but nobody went back to the child`,
        whyShown:
          "Acting on what a child said is only half of it. If nobody tells them, from where they sit the adults did nothing at all.",
        question: "Who is going back to tell them what happened, and when?",
        evidenceIds: notExplained.map((d) => d.loopId),
      });
    }
    if (unanswered.length === 0 && notExplained.length === 0) {
      findings.push({
        key: "answering_well",
        strand: "answering",
        tone: "positive",
        headline: "Every concern a child raised has been answered back to them",
        whyShown: `${voice.loops.length} loop${voice.loops.length === 1 ? "" : "s"} on record, none waiting on us.`,
        question: "Worth naming in supervision — this is the hard half, and it is being done.",
        evidenceIds: [],
      });
    }
  }

  const litBy: Record<SelfCheckStrand, boolean> = {
    responding: respondingLit,
    repairing: repairingLit,
    answering: answeringLit,
  };

  const strands: StrandView[] = STRANDS.map((s) => ({
    ...s,
    visibility: litBy[s.strand] ? "lit" : "unlit",
    visibilityNote: litBy[s.strand] ? "" : UNLIT_NOTE,
    findings: findings.filter((f) => f.strand === s.strand),
  }));

  const lit = strands.filter((s) => s.visibility === "lit").length;
  const unlit = strands.length - lit;
  const prompts = findings.filter((f) => f.tone === "prompt").length;

  // RULE 1 in the summary line: silence is reported as silence, never as fine.
  const summary =
    lit === 0
      ? "Cara cannot see any of our own response pattern — no escalation decisions, no incidents, no child-voice loops on record. That is not a clean bill of health; it means nothing here is being monitored."
      : prompts === 0
        ? `Nothing in our own response pattern is asking for a look right now, across the ${lit} strand${lit === 1 ? "" : "s"} Cara can see.${unlit > 0 ? ` ${unlit} strand${unlit === 1 ? " is" : "s are"} unmonitored — worth knowing, not worth relaxing about.` : ""}`
        : `${prompts} thing${prompts === 1 ? "" : "s"} in our own response pattern worth a look${unlit > 0 ? `, and ${unlit} strand${unlit === 1 ? "" : "s"} Cara cannot see at all` : ""}.`;

  return { strands, findings, lit, unlit, summary, caveat: SELF_CHECK_CAVEAT };
}
