// ══════════════════════════════════════════════════════════════════════════════
// CARA — STRATEGY DISCUSSION ASSEMBLY ENGINE (pure, deterministic)
//
// Auto-drafts a strategy-discussion request FROM THE CHILD'S EXISTING RECORDS:
// the eight reasoning sections, evidence separated by kind (direct / reported /
// observed / pattern), unknowns stated honestly, and urgency read from any
// live escalation decision. Staff then edit; a named manager judges.
//
// Classification rules are deterministic and conservative:
//   • the child's own quoted words        → DIRECT evidence + Child Impact
//   • incident records (staff wrote them) → OBSERVED evidence
//   • a disclosure-type incident          → REPORTED evidence (told to us)
//   • recurrence across records           → PATTERN evidence
// Anything the records cannot carry goes to UNKNOWNS — never invented.
//
// No model calls, no store access, no wall clock (caller injects `now`).
// ══════════════════════════════════════════════════════════════════════════════

import type {
  StrategyAssemblyInput,
  StrategyDiscussionRequest,
  StrategyDraftStatus,
  StrategyEvidenceItem,
  StrategySectionKey,
} from "./types";
import {
  SEVEN_THRESHOLD_QUESTIONS,
  STRATEGY_SECTION_LABELS,
  STRATEGY_SECTION_ORDER,
} from "./types";

export const STRATEGY_ENGINE_VERSION = "1.0.0";

const DISCLAIMER =
  "Cara assembled this draft from the records cited on each item. It structures the reasoning — the threshold judgement, and the decision to request a strategy discussion, belong to a named manager.";

const nonEmpty = (s?: string | null) => !!s && s.trim().length > 0;

// ── Draft assembly ────────────────────────────────────────────────────────────

export interface AssembledDraft {
  sections: Record<StrategySectionKey, string>;
  evidence: StrategyEvidenceItem[];
  professionalInterpretation: string[];
  unknowns: string[];
  alternativeExplanations: string[];
  urgency: string;
}

/** Assemble the draft from record snapshots. Deterministic; cites every item. */
export function assembleStrategyDraft(input: StrategyAssemblyInput): AssembledDraft {
  const evidence: StrategyEvidenceItem[] = [];
  const unknowns: string[] = [];

  // DIRECT — the child's own words, verbatim from records.
  for (const q of input.childQuotes) {
    if (!nonEmpty(q.quote)) continue;
    evidence.push({
      kind: "direct",
      text: `The child said: ${q.quote.trim()}`,
      sourceRecords: [{ recordType: q.recordType, recordId: q.recordId }],
    });
  }

  // OBSERVED / REPORTED — incidents; disclosures are reported-to-us.
  const isDisclosure = (type: string, description: string) =>
    /disclos/i.test(type) || /disclos/i.test(description) || /safeguarding_concern/i.test(type);
  for (const inc of input.incidents) {
    evidence.push({
      kind: isDisclosure(inc.type, inc.description) ? "reported" : "observed",
      text: `${inc.date} — ${inc.type.replace(/_/g, " ")} (${inc.severity}): ${inc.description}`,
      sourceRecords: [{ recordType: "incidents", recordId: inc.id }],
    });
  }

  // PATTERN — recurrence the records themselves demonstrate.
  const concerning = input.behaviourEntries.filter((b) => /concern/i.test(b.direction));
  const triggerCounts = new Map<string, { count: number; ids: string[] }>();
  for (const b of concerning) {
    const key = b.trigger.trim().toLowerCase();
    if (!key) continue;
    const cur = triggerCounts.get(key) ?? { count: 0, ids: [] };
    cur.count += 1;
    cur.ids.push(b.id);
    triggerCounts.set(key, cur);
  }
  for (const [trigger, { count, ids }] of triggerCounts) {
    if (count >= 3) {
      evidence.push({
        kind: "pattern",
        text: `"${trigger}" recurs as a trigger across ${count} behaviour entries.`,
        sourceRecords: ids.map((id) => ({ recordType: "behaviourLog", recordId: id })),
      });
    }
  }
  const highIntensity = concerning.filter((b) => /high|critical|severe/i.test(b.intensity));
  if (highIntensity.length >= 2) {
    evidence.push({
      kind: "pattern",
      text: `${highIntensity.length} high-or-above intensity entries in the period reviewed.`,
      sourceRecords: highIntensity.map((b) => ({ recordType: "behaviourLog", recordId: b.id })),
    });
  }

  // Urgency — read from live escalation decisions; honest default otherwise.
  const decided = input.escalationDecisions.find((d) => d.status === "decided" && d.confirmedLevel);
  const awaiting = input.escalationDecisions.find((d) => d.status === "awaiting_decision");
  const urgency = decided
    ? `A manager has confirmed the escalation level "${decided.confirmedLevel!.replace(/_/g, " ")}" for a related concern.`
    : awaiting
      ? `An escalation assessment is awaiting a manager decision (Cara suggested "${awaiting.suggestedLevel.replace(/_/g, " ")}").`
      : "No escalation decision is recorded for this concern — state the urgency in plain words.";

  // Honest unknowns — what this assembly genuinely cannot read from records.
  if (input.childQuotes.length === 0) {
    unknowns.push("The child's own words on this concern are not yet in the records reviewed.");
  }
  if (input.currentPlans.length === 0) {
    unknowns.push("No current plan summaries were found in the records reviewed.");
  }
  unknowns.push("What the family and other agencies know or have seen is not visible to this assembly.");

  // The eight sections — drafted where records carry them, framed where not.
  const sections: Record<StrategySectionKey, string> = {
    headline_concern: input.concernSummary.trim(),
    type_of_harm: "", // A human names the harm type — Cara does not diagnose it.
    evidence: evidence.length
      ? `${evidence.length} evidenced items assembled below, separated by kind (direct / reported / observed / pattern).`
      : "No evidenced items could be assembled from the records reviewed — set out the evidence and its sources.",
    child_impact: input.childQuotes.length
      ? input.childQuotes.map((q) => `The child said: ${q.quote.trim()}`).join("\n")
      : "The child's own words are not yet in the records reviewed — capture their voice before the request is finalised, or record why that is not possible.",
    adult_response: input.incidents.length
      ? input.incidents
          .filter((i) => nonEmpty(i.immediateAction))
          .map((i) => `${i.date}: ${i.immediateAction}`)
          .join("\n") || "Immediate actions were not recorded on the incidents reviewed."
      : "Set out what adults have done in response so far.",
    current_plan: input.currentPlans.length
      ? input.currentPlans.map((p) => `• ${p.summary}`).join("\n")
      : "No current plan summaries found — set out what is in place today.",
    immediacy: urgency,
    purpose_of_strategy_discussion: "", // The requester states what the multi-agency discussion is FOR.
  };

  return {
    sections,
    evidence,
    professionalInterpretation: [],
    unknowns,
    alternativeExplanations: [],
    urgency,
  };
}

// ── Draft status ──────────────────────────────────────────────────────────────

export function computeStrategyDraftStatus(request: StrategyDiscussionRequest): StrategyDraftStatus {
  const sectionsComplete = STRATEGY_SECTION_ORDER.filter((k) => nonEmpty(request.sections[k])).length;
  const answered = new Set(
    request.thresholdAnswers.filter((a) => nonEmpty(a.answer)).map((a) => a.question),
  );
  const questionsAnswered = SEVEN_THRESHOLD_QUESTIONS.filter((q) => answered.has(q)).length;

  const evidenceByKind = { direct: 0, reported: 0, observed: 0, pattern: 0 };
  for (const e of request.evidence) evidenceByKind[e.kind] += 1;

  const outstanding: string[] = [];
  for (const key of STRATEGY_SECTION_ORDER) {
    if (!nonEmpty(request.sections[key])) {
      outstanding.push(`Complete the "${STRATEGY_SECTION_LABELS[key]}" section.`);
    }
  }
  for (const q of SEVEN_THRESHOLD_QUESTIONS) {
    if (!answered.has(q)) outstanding.push(`Answer: ${q}`);
  }
  if (request.alternativeExplanations.filter(nonEmpty).length === 0) {
    outstanding.push("Record what else could explain this information (alternative explanations).");
  }

  return {
    requestId: request.id,
    sectionsComplete,
    sectionsTotal: STRATEGY_SECTION_ORDER.length,
    questionsAnswered,
    questionsTotal: SEVEN_THRESHOLD_QUESTIONS.length,
    evidenceByKind,
    hasUnknownsRecorded: request.unknowns.filter(nonEmpty).length > 0,
    hasAlternativesRecorded: request.alternativeExplanations.filter(nonEmpty).length > 0,
    readyForManager: outstanding.length === 0,
    outstanding,
    disclaimer: DISCLAIMER,
  };
}
