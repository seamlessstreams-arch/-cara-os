// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — CONVERSATION COACH
//
// PACE-informed conversation blueprints with phrases staff can actually say,
// branch plans for shutdown/anger/upset/walking away, avoid-phrases, and
// staff regulation reminders. High emotional risk always routes to manager
// review (§23). Deterministic from the phrase banks.
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraConversationBlueprintOutput } from "./cara-types";
import type { CaraChildContext } from "./cara-context-builder";
import {
  PACE_OPENINGS, PACE_VALIDATIONS, PACE_CURIOSITY, PACE_REPAIR, PACE_SAFETY,
  AVOID_PHRASES, STAFF_REGULATION_REMINDERS, SHUTDOWN_RESPONSES, RECORDING_PROMPTS,
} from "./cara-prompt-library";
import { computeManagerReview, type ManagerReviewDecision } from "./cara-guardrails";
import { safetyPlanConversationPrompts } from "@/lib/cara/practice-frameworks";

const SAFETY_TOPIC_RE = /safe|calm|regulat|upset|angr|overwhelm|crisis|missing|self.?harm|hurt|de-?escalat|melt ?down/i;

export interface ConversationGenInput {
  ctx: CaraChildContext;
  conversationTopic: string;
  reasonForConversation: string;
  emotionalRisk: "low" | "medium" | "high";
  desiredOutcome?: string;
  staffConcern?: string;
  recentContext?: string;
}

export function generateCaraConversationBlueprint(input: ConversationGenInput): { output: CaraConversationBlueprintOutput; review: ManagerReviewDecision } {
  const { ctx } = input;
  const name = ctx.name;

  const review = computeManagerReview({
    emotionalIntensity: input.emotionalRisk,
    topicOrTheme: input.conversationTopic + " " + input.reasonForConversation,
    childTriggerMatch: ctx.triggerMatch || ctx.avoidedTopicMatch,
    guardrailSeverity: null,
    outputText: input.staffConcern ?? "",
  });

  const bestTime = ctx.profile?.calming_strategies
    ? `After a regulated, ordinary moment — ideally alongside something ${name} finds settling (${ctx.profile.calming_strategies}). Never straight after conflict, never at bedtime unless safety demands it.`
    : `Pick a regulated, ordinary moment — food, a drive, an activity ${name} enjoys. Never straight after conflict, never cold.`;

  const output: CaraConversationBlueprintOutput = {
    title: `Talking with ${name} about ${input.conversationTopic}`,
    bestTimeToApproach: bestTime,
    staffPreparation: [
      `Know your aim in one sentence: ${input.desiredOutcome || input.reasonForConversation}. Hold it lightly — connection beats completion.`,
      "Decide your opening line and your exit line before you start.",
      ctx.profile?.trusted_adults
        ? `If it wobbles, ${ctx.profile.trusted_adults} are the trusted adults to bring in — consider whether one of them should lead instead.`
        : "Know who the child's most trusted adult on shift is — consider whether it should be them having this conversation.",
      input.emotionalRisk === "high" ? "High emotional risk: agree the plan with a manager first and make sure another adult knows the conversation is happening." : "Let the shift know roughly when you're taking the moment, so you're not interrupted.",
    ],
    openingLines: [PACE_OPENINGS[0], PACE_OPENINGS[3], `"I've noticed ${input.recentContext ? input.recentContext.toLowerCase() : "things have felt a bit heavier lately"} — and I care more about you than about any rule."`],
    validationStatements: [PACE_VALIDATIONS[0], PACE_VALIDATIONS[2], PACE_VALIDATIONS[3]],
    curiosityQuestions: [...PACE_CURIOSITY.slice(0, 4)],
    reflectivePrompts: [PACE_REPAIR[0], PACE_REPAIR[1]],
    safetyQuestions: (() => {
      const base = input.emotionalRisk === "low" ? [PACE_SAFETY[2]] : [...PACE_SAFETY];
      // When the conversation is about safety / regulation, gently build the
      // child's own safety plan (what helps, warning signs, safe adults).
      const safetyRelevant = input.emotionalRisk === "high" || SAFETY_TOPIC_RE.test(`${input.conversationTopic} ${input.reasonForConversation}`);
      return safetyRelevant ? [...base, ...safetyPlanConversationPrompts()] : base;
    })(),
    avoidPhrases: [...AVOID_PHRASES],
    ifChildShutsDown: SHUTDOWN_RESPONSES.shutsDown,
    ifChildBecomesAngry: SHUTDOWN_RESPONSES.becomesAngry,
    ifChildBecomesUpset: SHUTDOWN_RESPONSES.becomesUpset,
    ifChildWalksAway: SHUTDOWN_RESPONSES.walksAway,
    closingLines: [
      `"Thank you for talking to me — I know it's not easy. Nothing you said changes how we see you."`,
      `"We can pick this up whenever you want. I'm not going anywhere."`,
    ],
    staffRegulationReminders: [...STAFF_REGULATION_REMINDERS.slice(0, 4)],
    staffGuidance:
      "Use your own words — these lines are a tone, not a script. Two questions maximum before you give something back (validation, your own small share, or silence). The child should leave the conversation feeling more connected, not processed.",
    adaptationNotes: [
      ctx.profile?.communication_needs ? `Communication: ${ctx.profile.communication_needs}` : "Short sentences, one question at a time, real wait time.",
      "No forced eye contact — side-by-side beats face-to-face.",
      ctx.avoidedTopicMatch ? `CAUTION: this topic appears in ${name}'s avoided-topics list — go slower, or reconsider whether now is right.` : "If engagement drops, switch from questions to gentle statements.",
    ],
    safeguardingNotes:
      input.emotionalRisk === "high"
        ? "High-risk territory. If a disclosure emerges: listen, don't probe, don't promise secrecy, record promptly and follow the safeguarding procedure the same day."
        : "If anything concerning emerges, be honest that you may need to share it to keep them safe, and follow the home's procedure.",
    signsToPause: ["One-word answers turning flat", "Body angling away or freezing", "Anger rising in you — pause yourself first", "Any 'I'm done' signal — honour it immediately"],
    followUpActions: ["Record the conversation while fresh", review.required ? "Debrief with the manager (review required for this topic)" : "Mention at handover", "Re-offer connection within 24 hours — a snack, a game, anything ordinary"],
    recordingPrompt: RECORDING_PROMPTS.conversation,
    managerReviewNeeded: review.required,
  };

  return { output, review };
}
