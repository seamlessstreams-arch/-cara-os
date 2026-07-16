// ─────────────────────────────────────────────────────────────────────────────
// Voice Follow-Through Engine (Practice Intelligence OS §5.2)
//
// The existing voice engines measure whether a child's voice is CAPTURED and
// whether it INFLUENCED decisions. This engine tracks the half that was
// missing: what happened to each concern a child actually raised — the closed
// loop the brief specifies:
//
//   LISTEN → SAFEGUARDING CHECK → CONSIDER → AGREE ACTION → ACT
//         → EXPLAIN BACK TO CHILD → REVIEW WITH CHILD
//
// A concern is not "done" when an adult acted; it is done when the child has
// been told what happened and asked whether it helped. Scenario J lives here:
// the same concern raised repeatedly with no visible response must surface to
// the manager as a detection with evidence — a prompt, never an accusation.
//
// Pure and deterministic: caller supplies `now`; no store import; no AI.
// ─────────────────────────────────────────────────────────────────────────────

export type VoiceLoopStage =
  | "listened"            // recorded; safeguarding check pending
  | "safeguarding_checked"
  | "considered"
  | "action_agreed"       // requires an owner
  | "acting"
  | "explained_back"      // the child has been told what happened
  | "reviewed_with_child" // the child has said whether it helped
  | "closed";

export const VOICE_LOOP_STAGES: VoiceLoopStage[] = [
  "listened",
  "safeguarding_checked",
  "considered",
  "action_agreed",
  "acting",
  "explained_back",
  "reviewed_with_child",
  "closed",
];

export interface VoiceConcernLoop {
  id: string;
  child_id: string;
  home_id: string;
  /** What the child raised, in their words where possible. */
  concern: string;
  /** Where it was raised (key work, house meeting, My Voice, complaint…). */
  raised_via: string;
  /** Every date the child has raised this — recurrence is the signal. */
  raised_dates: string[];
  stage: VoiceLoopStage;
  /** Stage the loop last moved, for age-at-stage calculations. */
  stage_changed_at: string;
  owner_id: string | null;
  agreed_action: string;
  /** Linked unified-task id where one was created. */
  task_id: string | null;
  explain_back_note: string;
  explained_at: string | null;
  review_with_child_note: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export type VoiceDetectionKey =
  | "voice_without_response"
  | "no_owner"
  | "explain_back_overdue"
  | "review_with_child_missing"
  | "stalled_loop"
  | "loop_closed_well";

export interface VoiceDetection {
  key: VoiceDetectionKey;
  tone: "prompt" | "positive";
  childId: string;
  loopId: string;
  headline: string;
  whyShown: string;
  evidence: { raisedDates: string[]; stage: VoiceLoopStage; daysAtStage: number };
  suggestedQuestions: string[];
}

export interface VoiceFollowThroughResult {
  loops: (VoiceConcernLoop & {
    daysAtStage: number;
    timesRaised: number;
    nextStep: string;
  })[];
  detections: VoiceDetection[];
  counts: { open: number; awaitingExplainBack: number; closed: number };
}

const DAY = 86_400_000;

// Age thresholds (days). Deliberately visible constants, not configuration —
// change them here with a reason, in review.
const EXPLAIN_BACK_WITHIN = 14;
const STAGE_STALL_AFTER = 21;

function days(now: Date, iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.floor((now.getTime() - t) / DAY);
}

const NEXT_STEP: Record<VoiceLoopStage, string> = {
  listened: "Safeguarding check: does anything here need sharing to keep someone safe?",
  safeguarding_checked: "Consider the concern properly — what would change look like?",
  considered: "Agree an action with an owner and a date.",
  action_agreed: "Do the agreed action.",
  acting: "Tell the child what has happened — in their terms.",
  explained_back: "Ask the child whether it helped — review together.",
  reviewed_with_child: "Close the loop, carrying any learning forward.",
  closed: "Nothing outstanding.",
};

const ACTIONABLE: VoiceLoopStage[] = ["listened", "safeguarding_checked", "considered", "action_agreed", "acting"];

export function computeVoiceFollowThrough(
  loops: VoiceConcernLoop[],
  now: Date,
): VoiceFollowThroughResult {
  const enriched = loops.map((l) => ({
    ...l,
    daysAtStage: days(now, l.stage_changed_at),
    timesRaised: l.raised_dates.length,
    nextStep: NEXT_STEP[l.stage],
  }));

  const detections: VoiceDetection[] = [];

  for (const l of enriched) {
    const evidence = { raisedDates: l.raised_dates, stage: l.stage, daysAtStage: l.daysAtStage };

    // Scenario J — the concern keeps being raised and the child has seen no
    // visible response. This is the engine's reason to exist.
    if (l.timesRaised >= 2 && ACTIONABLE.includes(l.stage) && !l.explained_at) {
      detections.push({
        key: "voice_without_response",
        tone: "prompt",
        childId: l.child_id,
        loopId: l.id,
        headline: `Raised ${l.timesRaised} times with no visible response yet: "${l.concern}"`,
        whyShown:
          `The child has raised this on ${l.raised_dates.join(", ")} and the loop is still at ` +
          `"${l.stage}" with nothing explained back to them. Repetition is the child telling us ` +
          `the first response did not land — this prompts a manager conversation, it does not allege fault.`,
        evidence,
        suggestedQuestions: [
          "What has actually changed since the child first raised this?",
          "Who is going to tell the child where this is up to, and when?",
          "Is the barrier capacity, disagreement, or has it simply dropped?",
        ],
      });
    }

    if ((l.stage === "action_agreed" || l.stage === "acting") && !l.owner_id) {
      detections.push({
        key: "no_owner",
        tone: "prompt",
        childId: l.child_id,
        loopId: l.id,
        headline: `Agreed action with no owner: "${l.concern}"`,
        whyShown: "An action without a named owner is a promise nobody is keeping.",
        evidence,
        suggestedQuestions: ["Who owns this today?", "What is the realistic date the child can be told?"],
      });
    }

    if (l.stage === "acting" && l.daysAtStage > EXPLAIN_BACK_WITHIN && !l.explained_at) {
      detections.push({
        key: "explain_back_overdue",
        tone: "prompt",
        childId: l.child_id,
        loopId: l.id,
        headline: `Child not yet told what happened (${l.daysAtStage} days in progress)`,
        whyShown:
          `Work has been under way for ${l.daysAtStage} days — longer than the ${EXPLAIN_BACK_WITHIN}-day ` +
          `explain-back expectation — and the child has not been told where it is up to. From the child's ` +
          `side, silence is indistinguishable from being ignored.`,
        evidence,
        suggestedQuestions: ["Even if unfinished — what can the child be told today?"],
      });
    }

    if (l.stage === "explained_back" && !l.reviewed_at && l.daysAtStage > EXPLAIN_BACK_WITHIN) {
      detections.push({
        key: "review_with_child_missing",
        tone: "prompt",
        childId: l.child_id,
        loopId: l.id,
        headline: "Explained, but the child has not been asked whether it helped",
        whyShown:
          "The loop closes when the child says whether the response helped — explaining is not the same as reviewing.",
        evidence,
        suggestedQuestions: ["When is the review conversation, and who has it?"],
      });
    }

    if (ACTIONABLE.includes(l.stage) && l.daysAtStage > STAGE_STALL_AFTER && l.timesRaised < 2) {
      detections.push({
        key: "stalled_loop",
        tone: "prompt",
        childId: l.child_id,
        loopId: l.id,
        headline: `No movement for ${l.daysAtStage} days: "${l.concern}"`,
        whyShown: `The loop has sat at "${l.stage}" for ${l.daysAtStage} days (threshold ${STAGE_STALL_AFTER}).`,
        evidence,
        suggestedQuestions: ["Is this still the right action?", "Does the child know it has not moved?"],
      });
    }

    if (l.stage === "closed" && l.explained_at && l.reviewed_at) {
      detections.push({
        key: "loop_closed_well",
        tone: "positive",
        childId: l.child_id,
        loopId: l.id,
        headline: `Closed with the child, end to end: "${l.concern}"`,
        whyShown: "Raised, acted on, explained back and reviewed with the child — the full loop. Worth naming.",
        evidence,
        suggestedQuestions: [],
      });
    }
  }

  return {
    loops: enriched,
    detections,
    counts: {
      open: enriched.filter((l) => l.stage !== "closed").length,
      awaitingExplainBack: enriched.filter((l) => ACTIONABLE.includes(l.stage) && !l.explained_at).length,
      closed: enriched.filter((l) => l.stage === "closed").length,
    },
  };
}

/** The only transitions the write path may perform — forward one stage at a
 *  time, with the two child-facing stages requiring their evidence note.
 *  Returns the reason a transition is invalid, or null when it may proceed. */
export function validateTransition(
  loop: VoiceConcernLoop,
  to: VoiceLoopStage,
  patch: { owner_id?: string | null; agreed_action?: string; explain_back_note?: string; review_with_child_note?: string },
): string | null {
  const fromIdx = VOICE_LOOP_STAGES.indexOf(loop.stage);
  const toIdx = VOICE_LOOP_STAGES.indexOf(to);
  if (toIdx === -1) return `Unknown stage "${to}".`;
  if (toIdx !== fromIdx + 1) return `Loops move one stage at a time (${loop.stage} → ${VOICE_LOOP_STAGES[fromIdx + 1] ?? "closed"}).`;
  if (to === "action_agreed" && !(patch.owner_id ?? loop.owner_id)) return "An agreed action needs a named owner.";
  if (to === "action_agreed" && !(patch.agreed_action ?? loop.agreed_action).trim()) return "Record what was agreed.";
  if (to === "explained_back" && !(patch.explain_back_note ?? loop.explain_back_note).trim())
    return "Record what the child was told — that conversation is the evidence.";
  if (to === "reviewed_with_child" && !(patch.review_with_child_note ?? loop.review_with_child_note).trim())
    return "Record what the child said when asked whether it helped.";
  return null;
}
