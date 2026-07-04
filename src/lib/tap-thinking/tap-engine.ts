// ══════════════════════════════════════════════════════════════════════════════
// CARA — TAP THINKING ENGINE (pure, deterministic)
//
// The five-stage scaffold with its questions, and the session-status
// computation: which stages are complete, what remains unanswered, and the
// single next question that would move the thinking forward.
//
// TAP structures the thinking; the answers — and the judgements inside them —
// belong to the professionals in the room. No model calls, no store access.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  TapSession,
  TapSessionStatus,
  TapStage,
  TapStageDefinition,
  TapStageStatus,
} from "./types";
import { TAP_STAGES } from "./types";

export const TAP_ENGINE_VERSION = "1.0.0";

const DISCLAIMER =
  "TAP structures the thinking — it never supplies the answers. What is written here is the professionals' own reasoning, and the judgements in it remain theirs.";

// ── The five stages and their questions (per spec) ────────────────────────────

export const TAP_STAGE_DEFINITIONS: Record<TapStage, TapStageDefinition> = {
  see_clearly: {
    stage: "see_clearly",
    label: "See Clearly",
    intent: "Ground the discussion in the child's actual life, not just the risk list.",
    questions: [
      "What is the child's lived experience?",
      "What do we know beyond risks?",
      "What is present, missing or unclear?",
    ],
  },
  think_deeply: {
    stage: "think_deeply",
    label: "Think Deeply",
    intent: "Move from information to meaning — and test that meaning.",
    questions: [
      "What does this information mean?",
      "What patterns or contradictions exist?",
      "What alternative explanations should be considered?",
    ],
  },
  work_relationally: {
    stage: "work_relationally",
    label: "Work Relationally",
    intent: "Safety is made in relationships — examine them, including our own.",
    questions: [
      "How are family, staff, professional and system relationships shaping safety?",
      "Whose voice is missing?",
      "Are power dynamics affecting decisions?",
    ],
  },
  act_with_purpose: {
    stage: "act_with_purpose",
    label: "Act With Purpose",
    intent: "Decisions and actions that will make a meaningful difference — with their why.",
    questions: [
      "What decisions are needed?",
      "Why are they needed?",
      "What actions will make a meaningful difference?",
    ],
  },
  sustain_practice: {
    stage: "sustain_practice",
    label: "Sustain Practice",
    intent: "A plan is only as good as its review — decide now how we will know.",
    questions: [
      "How will the plan be reviewed?",
      "How will we know whether it is working?",
      "What will we do if it is not working?",
    ],
  },
};

const nonEmpty = (s?: string | null) => !!s && s.trim().length > 0;

// ── Session status ────────────────────────────────────────────────────────────

/** A stage is complete when every one of its questions has a non-empty answer. */
export function computeTapStatus(session: TapSession): TapSessionStatus {
  const stages: TapStageStatus[] = TAP_STAGES.map((stage) => {
    const def = TAP_STAGE_DEFINITIONS[stage];
    const answers = session.answers[stage] ?? [];
    const answeredQuestions = new Set(
      answers.filter((a) => nonEmpty(a.answer)).map((a) => a.question),
    );
    const unanswered = def.questions.filter((q) => !answeredQuestions.has(q));
    return {
      stage,
      label: def.label,
      answered: def.questions.length - unanswered.length,
      total: def.questions.length,
      complete: unanswered.length === 0,
      unanswered,
    };
  });

  const firstOpen = stages.find((s) => !s.complete);
  return {
    sessionId: session.id,
    stages,
    stagesComplete: stages.filter((s) => s.complete).length,
    allStagesComplete: stages.every((s) => s.complete),
    nextQuestion: firstOpen ? firstOpen.unanswered[0] ?? null : null,
    disclaimer: DISCLAIMER,
  };
}

/** Empty answers map for a new session. */
export function emptyTapAnswers(): TapSession["answers"] {
  return {
    see_clearly: [],
    think_deeply: [],
    work_relationally: [],
    act_with_purpose: [],
    sustain_practice: [],
  };
}

/** True when the question belongs to the stage's defined set. */
export function isKnownTapQuestion(stage: TapStage, question: string): boolean {
  return TAP_STAGE_DEFINITIONS[stage].questions.includes(question);
}
