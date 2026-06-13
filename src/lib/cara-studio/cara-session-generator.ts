// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — SESSION PLAN GENERATOR
//
// Builds the 10-part session structure (before-you-start → follow-up) sized to
// the requested duration (5' micro / 10' conversation / 20' key work / 45'
// planned), shaped by the child's learning style, SEND needs, readiness and
// the staff member's confidence. Deterministic scaffold first; optional LLM
// enrichment can re-voice scripts but never changes the structure.
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraSessionPlanOutput } from "./cara-types";
import type { CaraChildContext } from "./cara-context-builder";
import {
  PACE_OPENINGS, PACE_VALIDATIONS, PACE_CURIOSITY, PACE_REPAIR,
  RECORDING_PROMPTS, STAFF_REGULATION_REMINDERS,
} from "./cara-prompt-library";
import { computeManagerReview, type ManagerReviewDecision } from "./cara-guardrails";
import { safetyPlanConversationPrompts } from "@/lib/aria/practice-frameworks";

const SAFETY_THEME_RE = /safe|calm|regulat|crisis|overwhelm|missing|self.?harm|de-?escalat|melt ?down|big feelings|anger/i;

export interface SessionGenInput {
  ctx: CaraChildContext;
  theme: string;
  aim: string;
  durationMinutes: number;
  childReadiness: "low" | "medium" | "high";
  emotionalIntensity: "low" | "medium" | "high";
  staffConfidence: "low" | "medium" | "high";
  preferredActivityType?: string;
}

function pick<T>(arr: readonly T[], seedText: string, offset = 0): T {
  let h = offset;
  for (let i = 0; i < seedText.length; i++) h = (h * 31 + seedText.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

function activityFor(input: SessionGenInput): { name: string; description: string } {
  const style = input.ctx.profile?.learning_style;
  const pref = input.preferredActivityType?.toLowerCase() ?? "";
  if (pref.includes("walk") || style?.movement_based)
    return { name: "Walk-and-talk", description: `Side-by-side walk (garden or local loop). Raise "${input.theme}" casually mid-walk — movement lowers the pressure and removes eye contact demands.` };
  if (pref.includes("draw") || style?.creative)
    return { name: "Draw it out", description: `Big paper, pens. Invite ${input.ctx.name} to draw the situation, the feeling, or "what it looks like inside" — talking happens around the drawing, not face-to-face.` };
  if (pref.includes("card") || style?.visual)
    return { name: "Card sort", description: `Pre-made cards (feelings, choices or situations on the theme). Sort into piles — "me / not me", "okay / not okay", "easy / hard". Each pile is a doorway to one gentle question.` };
  if (pref.includes("audio") || style?.audio)
    return { name: "Listen and pause", description: `Read or play the short scenario aloud. Pause at marked points: "What might they be feeling here?" The child can answer, pass, or just listen.` };
  if (style?.practical)
    return { name: "Do it together", description: `Anchor the theme in a real task (making a snack, sorting their space, planning a journey). The learning rides alongside the doing.` };
  return { name: "Side-by-side chat", description: `Low-pressure conversation during an everyday moment — washing up, a drive, a drink. Two or three questions maximum.` };
}

export function generateCaraSessionPlan(input: SessionGenInput): { output: CaraSessionPlanOutput; review: ManagerReviewDecision } {
  const { ctx, theme, durationMinutes } = input;
  const name = ctx.name;
  const activity = activityFor(input);
  const shortBurst = ctx.profile?.learning_style?.short_bursts ?? false;

  // ── Duration-shaped structure (the 10 parts compress, never disappear) ──
  const micro = durationMinutes <= 7;
  const brief = durationMinutes <= 12;
  const main = Math.max(3, Math.round(durationMinutes * (micro ? 0.5 : 0.45)));
  const openMin = micro ? 1 : 2;
  const reflectMin = micro ? 1 : Math.max(2, Math.round(durationMinutes * 0.15));

  const structure: CaraSessionPlanOutput["sessionStructure"] = [
    { stepTitle: "Before you start", durationMinutes: 0, staffAction: `Check the moment is right: fed, not mid-conflict, not about to go out. Have the calming option ready${ctx.profile?.calming_strategies ? ` (${ctx.profile.calming_strategies})` : ""}.`, childOption: "Child can say 'not now' — offer a named later time." },
    { stepTitle: "Emotional check-in", durationMinutes: openMin, staffAction: "Quick temperature check — thumbs, 1–5, or just 'how's today been?'", childOption: "Point, gesture or pass.", adaptationNote: shortBurst ? "Keep to seconds, not minutes." : undefined },
    { stepTitle: "Soft opening", durationMinutes: openMin, staffAction: `Open sideways, not head-on: name something good first, then bridge to the theme.`, childOption: "Child chooses where to sit/stand and whether to look at you." },
    { stepTitle: `Main activity — ${activity.name}`, durationMinutes: main, staffAction: activity.description, childOption: "Talk, draw, point, sort or just listen — all count as taking part." },
    ...(micro ? [] : [{ stepTitle: "Reflection", durationMinutes: reflectMin, staffAction: "One reflective question, then hold the silence.", childOption: "One-word answers are fine." }]),
    { stepTitle: "Regulation pause", durationMinutes: micro ? 0 : 1, staffAction: "Offer a break or a drink before any wobble, not after.", childOption: "Break = allowed, any time, no explanation needed." },
    { stepTitle: "Child choice", durationMinutes: 1, staffAction: `Hand back control: "What should we do with this — keep it, bin it, stick it on your wall?"`, childOption: "Their work, their call." },
    { stepTitle: "Closing", durationMinutes: 1, staffAction: "End warm and forward-looking, never on the hardest bit.", childOption: "Child picks the next ordinary thing you do together." },
  ];

  const opening = pick(PACE_OPENINGS, theme + name);
  const validation = pick(PACE_VALIDATIONS, theme + name, 7);
  const reflective = [pick(PACE_CURIOSITY, theme, 1), pick(PACE_CURIOSITY, theme, 5), pick(PACE_REPAIR, theme, 3)];
  // Safety / regulation themes: weave in the child's own safety-plan building.
  const safetyTheme = SAFETY_THEME_RE.test(`${theme} ${input.aim}`);
  const safetyPlanPrompts = safetyTheme ? safetyPlanConversationPrompts() : [];

  const adaptations: string[] = [];
  if (ctx.profile?.send_needs) adaptations.push(`SEND: ${ctx.profile.send_needs} — keep demands low, offer choices over questions.`);
  if (ctx.profile?.literacy_level) adaptations.push(`Literacy (${ctx.profile.literacy_level}): nothing depends on reading or writing.`);
  if (ctx.profile?.sensory_profile) adaptations.push(`Sensory: ${ctx.profile.sensory_profile} — pick the setting accordingly.`);
  if (input.childReadiness === "low") adaptations.push("Low readiness: treat this as planting a seed — the offer matters more than completion.");
  if (shortBurst) adaptations.push("Short-burst learner: stop while it's going well; 'finished early' is a win.");
  if (adaptations.length === 0) adaptations.push("Keep it light, concrete and optional — adjust live to the child's cues.");

  const review = computeManagerReview({
    emotionalIntensity: input.emotionalIntensity,
    staffConfidence: input.staffConfidence,
    topicOrTheme: theme,
    childTriggerMatch: ctx.triggerMatch || ctx.avoidedTopicMatch,
    guardrailSeverity: null,
    outputText: theme + " " + input.aim,
  });

  const output: CaraSessionPlanOutput = {
    title: `${theme} — ${durationMinutes}-minute ${micro ? "micro-session" : brief ? "conversation" : "key-work session"} for ${name}`,
    childFriendlyTitle: micro ? `A quick two minutes about ${theme.toLowerCase()}` : `Some time for us: ${theme.toLowerCase()}`,
    purpose: input.aim,
    aims: [input.aim, `Strengthen ${name}'s sense that adults here are safe and on their side`, "Leave the door open for the next conversation", ...(safetyTheme ? [`Begin building ${name}'s own safety plan — what helps, the early warning signs, and who to go to`] : [])],
    emotionalSafetyCheck: `Before starting: is ${name} regulated, fed and not mid-crisis? ${ctx.triggerMatch ? `CAUTION — this theme overlaps known triggers (${ctx.profile?.emotional_triggers}). Pair with a trusted adult${ctx.profile?.trusted_adults ? ` (${ctx.profile.trusted_adults})` : ""} and have an exit plan.` : "If anything feels off, do the warm five-minute version instead and try the rest another day."}`,
    resourcesNeeded: activity.name === "Card sort" ? ["Theme cards (make or print)", "Flat space", "Drink/snack"] : activity.name === "Draw it out" ? ["Big paper", "Pens", "Drink/snack"] : ["Just you, time and a drink"],
    sessionStructure: structure,
    openingScript: `"${opening}" …then bridge: "I wanted a few minutes about ${theme.toLowerCase()} — not because you're in trouble. ${validation}"`,
    mainActivity: activity.description,
    reflectiveQuestions: [...reflective, ...safetyPlanPrompts.slice(0, 2)],
    regulationBreaks: [
      "Drink/snack break — offered, not earned",
      ctx.profile?.calming_strategies ? `Their known calmer: ${ctx.profile.calming_strategies}` : "Step outside / music / movement for two minutes",
    ],
    closingScript: `"Thanks for giving that a go — seriously. ${pick(PACE_REPAIR, name, 2)} Right — ${micro ? "let's get back to it" : "what shall we do now"}?"`,
    childFriendlySummary: `We spent a bit of time on ${theme.toLowerCase()}. Nothing was a test, nothing goes on a naughty list — it's about us understanding things together.`,
    staffGuidance: `${pick(STAFF_REGULATION_REMINDERS, theme, 4)} ${input.staffConfidence === "low" ? "You don't have to be the expert — curiosity is the skill. If it gets bigger than expected, pause and bring in a senior; that IS good practice." : "Follow their pace. The plan serves the child, not the other way round."}`,
    adaptationNotes: adaptations,
    safeguardingNotes: ctx.riskThemes.length
      ? `Live risk themes for ${name}: ${ctx.riskThemes.join(", ")}. If anything touches these, listen, don't probe for detail, and follow the safeguarding procedure. Never promise secrecy.`
      : "If a disclosure or concern emerges, follow the home's safeguarding procedure — be honest that some things must be shared to keep them safe.",
    signsToPause: ["Glazing over / going flat", "Sharp change in body language", "Self-blame talk", "Any request to stop — honoured immediately"],
    followUpActions: [
      "Update the daily log and key-work record",
      review.required ? "Share the plan and outcome with the manager (review required)" : "Mention how it went at handover",
      `Book the follow-up while it's warm — same theme, lighter touch, within a week`,
    ],
    recordingPrompt: RECORDING_PROMPTS.session_plan,
    managerReviewNeeded: review.required,
  };

  return { output, review };
}
