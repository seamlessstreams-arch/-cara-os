// ══════════════════════════════════════════════════════════════════════════════
// CARA — ETHICAL INTELLIGENCE ENGINE (pure, deterministic)
//
// Computes where a learning event sits on the ethical cycle
// (Experience → Insight → Decision → Impact → Learning → Integration), what is
// still outstanding at each stage, and whether every claim is traceable.
//
// No model calls. No store access. No wall clock — callers inject `now` where
// needed. Pairs with capture-service.ts (the write path) and the
// management-oversight sign-off (which stamps integration).
//
// Cara structures and evidences the cycle; the judgements inside it belong to
// named humans.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  EthicalCycleStage,
  EthicalCycleStageStatus,
  EthicalCycleStatus,
  EthicalIntegrationChecklist,
  EthicalIntelligenceEvent,
  EthicalSourceRef,
} from "./types";

export const ETHICAL_ENGINE_VERSION = "1.0.0";

const DISCLAIMER =
  "Cara traces the cycle and shows what is evidenced and what is outstanding. It does not judge whether the decisions were right — that remains the professional's and manager's accountability.";

const nonEmpty = (s?: string | null) => !!s && s.trim().length > 0;

// ── Traceability ──────────────────────────────────────────────────────────────

/**
 * "If Cara cannot trace it, Cara cannot claim it."
 * A stage record is traceable only when it cites ≥1 well-formed source ref.
 */
export function isTraceable(sourceRecords: EthicalSourceRef[] | undefined): boolean {
  return (
    Array.isArray(sourceRecords) &&
    sourceRecords.some((r) => nonEmpty(r?.recordType) && nonEmpty(r?.recordId))
  );
}

/** Every stage record on the event cites at least one source. */
export function isEventFullyTraceable(event: EthicalIntelligenceEvent): boolean {
  const stageRecords: Array<{ sourceRecords: EthicalSourceRef[] }> = [
    ...event.insights,
    ...event.decisions,
    ...event.actions,
    ...event.outcomes,
    ...event.learning,
  ];
  const triggerOk = nonEmpty(event.trigger?.recordType) && nonEmpty(event.trigger?.recordId);
  return triggerOk && stageRecords.every((r) => isTraceable(r.sourceRecords));
}

// ── Integration questions ─────────────────────────────────────────────────────

const INTEGRATION_QUESTIONS: Array<{
  key: keyof EthicalIntegrationChecklist;
  question: string;
}> = [
  { key: "childVoiceHeard", question: "Was the child's voice heard?" },
  { key: "childPlanUpdated", question: "Was the child's plan updated (or update considered)?" },
  { key: "riskAssessmentUpdated", question: "Was the risk assessment updated (or update considered)?" },
  { key: "behaviourSupportPlanUpdated", question: "Was the behaviour support plan updated (or update considered)?" },
  { key: "managementOversightCompleted", question: "Was management oversight completed?" },
  { key: "workflowFullyCompleted", question: "Was the workflow fully completed?" },
  { key: "outcomeReviewed", question: "Was the outcome reviewed?" },
];

/** Integration questions still open (unanswered) or answered "no". */
export function openIntegrationQuestions(checklist: EthicalIntegrationChecklist): string[] {
  return INTEGRATION_QUESTIONS.filter(({ key }) => checklist[key] !== true).map(
    ({ key, question }) => (checklist[key] === false ? `${question} — recorded as NO` : question),
  );
}

// ── Cycle status ──────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<EthicalCycleStage, string> = {
  experience: "Experience",
  insight: "Insight",
  decision: "Decision",
  impact: "Impact",
  learning: "Learning",
  integration: "Integration",
};

/** Compute where the event sits on the cycle and what each stage still needs. */
export function computeEthicalCycleStatus(event: EthicalIntelligenceEvent): EthicalCycleStatus {
  const stages: EthicalCycleStageStatus[] = [];

  // 1. Experience — what happened, ideally in the child's and staff's voices.
  {
    const outstanding: string[] = [];
    if (!nonEmpty(event.whatHappened)) outstanding.push("Record what happened.");
    if (!nonEmpty(event.childExperience)) outstanding.push("Record what the child experienced — their words where possible.");
    if (!nonEmpty(event.staffObserved)) outstanding.push("Record what staff observed.");
    stages.push(status("experience", nonEmpty(event.whatHappened), outstanding));
  }

  // 2. Insight — what was known, interpreted, and what else could explain it.
  {
    const outstanding: string[] = [];
    if (event.insights.length === 0) {
      outstanding.push("Capture what was known at the time and what was made of it.");
    } else {
      if (!event.insights.some((i) => i.alternativeExplanations.filter(nonEmpty).length > 0)) {
        outstanding.push("Record what alternative explanations were considered.");
      }
    }
    stages.push(status("insight", event.insights.length > 0, outstanding));
  }

  // 3. Decision — a named human's decision, evidenced.
  {
    const outstanding: string[] = [];
    if (event.decisions.length === 0) {
      outstanding.push("Record the decision made, who made it, and the evidence that supported it.");
    } else {
      if (!event.decisions.some((d) => nonEmpty(d.decisionMaker))) {
        outstanding.push("Name the decision maker.");
      }
      if (!event.decisions.some((d) => d.evidence.filter(nonEmpty).length > 0)) {
        outstanding.push("Record the evidence that supported the decision.");
      }
    }
    stages.push(status("decision", event.decisions.length > 0, outstanding));
  }

  // 4. Impact — action taken and what changed. Complete only when an outcome
  //    has been recorded (an action alone is intent, not impact).
  {
    const outstanding: string[] = [];
    if (event.actions.length === 0) outstanding.push("Record what action was taken.");
    if (event.outcomes.length === 0) outstanding.push("Record what changed as a result — honestly, including “too early to say”.");
    stages.push(status("impact", event.actions.length > 0 && event.outcomes.length > 0, outstanding));
  }

  // 5. Learning — what this taught us and where it must be embedded.
  {
    const outstanding: string[] = [];
    if (event.learning.length === 0) {
      outstanding.push("Record what was learned and what needs to be embedded into future practice.");
    } else if (!event.learning.some((l) => l.embedded)) {
      outstanding.push("Learning is captured but not yet embedded — complete the embed targets.");
    }
    stages.push(status("learning", event.learning.length > 0, outstanding));
  }

  // 6. Integration — the closure questions, all answered yes.
  {
    const open = openIntegrationQuestions(event.integration);
    stages.push(status("integration", open.length === 0, open));
  }

  const stagesComplete = stages.filter((s) => s.complete).length;
  const firstIncomplete = stages.find((s) => !s.complete);

  return {
    eventId: event.id,
    stages,
    stagesComplete,
    cycleComplete: stagesComplete === stages.length,
    nextStep: firstIncomplete ? firstIncomplete.outstanding[0] ?? `Complete the ${firstIncomplete.label} stage.` : null,
    openIntegration: openIntegrationQuestions(event.integration),
    fullyTraceable: isEventFullyTraceable(event),
    disclaimer: DISCLAIMER,
  };
}

function status(stage: EthicalCycleStage, complete: boolean, outstanding: string[]): EthicalCycleStageStatus {
  return { stage, label: STAGE_LABELS[stage], complete, outstanding: complete ? outstanding.filter(keepEvenWhenComplete(stage)) : outstanding };
}

// Experience counts as complete once "what happened" is recorded, but the two
// voice prompts stay visible until answered — presence of the record must not
// silence the child's voice prompt. Same for insight's alternatives prompt.
function keepEvenWhenComplete(stage: EthicalCycleStage): (o: string) => boolean {
  if (stage === "experience") return (o) => /child experienced|staff observed/.test(o);
  if (stage === "insight") return (o) => /alternative explanations/.test(o);
  if (stage === "decision") return (o) => /decision maker|evidence/.test(o);
  if (stage === "learning") return (o) => /not yet embedded/.test(o);
  return () => false;
}

// ── Empty checklist helper ────────────────────────────────────────────────────

/** All questions honestly unanswered — never defaulted. */
export function emptyIntegrationChecklist(): EthicalIntegrationChecklist {
  return {
    childVoiceHeard: null,
    childPlanUpdated: null,
    riskAssessmentUpdated: null,
    behaviourSupportPlanUpdated: null,
    managementOversightCompleted: null,
    workflowFullyCompleted: null,
    outcomeReviewed: null,
  };
}
