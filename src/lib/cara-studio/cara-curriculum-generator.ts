// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — CURRICULUM MAP GENERATOR
//
// Turns the child's risk themes, key-work themes, strengths and desired
// outcomes into a modular weekly pathway: trust first, regulation second,
// the risk-driven work in the middle, independence and future-self last.
// Domain selection is scored from RISK_TO_DOMAINS — explainable, not magic.
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraCurriculumMapOutput } from "./cara-types";
import type { CaraChildContext } from "./cara-context-builder";
import { CARA_CURRICULUM_DOMAINS, RISK_TO_DOMAINS, RECORDING_PROMPTS, type CaraCurriculumDomain } from "./cara-prompt-library";
import { computeManagerReview, type ManagerReviewDecision } from "./cara-guardrails";
import { independenceSkillsForDomain } from "@/lib/cara/practice-frameworks";

export interface CurriculumGenInput {
  ctx: CaraChildContext;
  desiredOutcomes: string[];
  staffConcerns?: string;
  timeframeWeeks: number;
}

const FOUNDATION: CaraCurriculumDomain[] = ["Trust and safe adults", "Emotional literacy"];
const CLOSING: CaraCurriculumDomain[] = ["Independence skills", "Self-advocacy"];

function scoreDomains(input: CurriculumGenInput): CaraCurriculumDomain[] {
  const scores = new Map<CaraCurriculumDomain, number>();
  const bump = (d: CaraCurriculumDomain, by = 1) => scores.set(d, (scores.get(d) ?? 0) + by);

  const signals = [
    ...input.ctx.riskThemes,
    ...input.ctx.keyworkThemes,
    input.staffConcerns ?? "",
    ...input.desiredOutcomes,
  ].join(" ").toLowerCase();

  for (const [key, domains] of Object.entries(RISK_TO_DOMAINS)) {
    if (signals.includes(key.replace(/_/g, " ")) || signals.includes(key)) {
      domains.forEach((d, i) => bump(d, 3 - Math.min(i, 2)));
    }
  }
  // Living with others is near-universal in group living; recent incidents raise it.
  if (input.ctx.recentIncidentSummaries.length > 0) {
    bump("Processing incidents", 2);
    bump("Conflict and repair", 1);
    bump("Living with others", 1);
  }
  FOUNDATION.forEach((d) => bump(d, 1));
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([d]) => d);
  // Always include foundations at the front and closers at the back.
  const middle = ranked.filter((d) => !FOUNDATION.includes(d) && !CLOSING.includes(d));
  return [...FOUNDATION, ...middle, ...CLOSING].filter((d, i, a) => a.indexOf(d) === i);
}

const DOMAIN_SESSION_IDEAS: Partial<Record<CaraCurriculumDomain, string[]>> = {
  "Trust and safe adults": ["Safe adults map (draw who's in the circle)", "Two truths about the staff team — playful trust building"],
  "Emotional literacy": ["Body map: where do feelings live?", "Feelings thermometer with their own words"],
  "Living with others": ["Shared-space agreement they help write", "Noise and space: what's hard, what helps"],
  "Conflict and repair": ["Repair without shame: choose-your-own apology", "Replay a flashpoint with pause buttons"],
  "Exploitation awareness": ["Pressure vs friendship card sort", "Spotting the hook: scenario walk-through"],
  "Digital safety": ["What would you do? — screenshots scenario cards", "Who's really asking? online pressure quiz"],
  "Safety literacy": ["My safety plan, my words", "Safe places and safe people map"],
  "Understanding risk": ["Risk dial: rate situations together", "Future-me letter about a risky moment"],
  "Processing incidents": ["What happened / what I needed (no blame) walk-through", "Body signals before it went big"],
  "Independence skills": ["Cook one meal start-to-finish", "Money week: plan a tenner"],
  "Self-advocacy": ["My voice in meetings — practice cards", "How to complain safely (and be heard)"],
  "Managing rejection and disappointment": ["When plans fall through — bounce-back plan", "Mixed feelings about family time"],
  "Health and wellbeing": ["Sleep and mood detective week", "Vapes, cannabis and honest answers"],
  "Identity and belonging": ["My story, my strengths collage", "Culture, family and what makes me me"],
};

export function generateCaraCurriculumMap(input: CurriculumGenInput): { output: CaraCurriculumMapOutput; review: ManagerReviewDecision } {
  const { ctx, timeframeWeeks } = input;
  const domains = scoreDomains(input);
  const weeks = Math.max(2, Math.min(timeframeWeeks, 16));
  // Fit the arc to the timeframe: foundations open, the risk-driven middle
  // fills, and the map always CLOSES on independence/self-advocacy.
  const middle = domains.filter((d) => !FOUNDATION.includes(d) && !CLOSING.includes(d));
  const fitted =
    weeks <= 4
      ? [...FOUNDATION.slice(0, 1), ...middle.slice(0, weeks - 2), CLOSING[0]]
      : [...FOUNDATION, ...middle.slice(0, weeks - FOUNDATION.length - CLOSING.length), ...CLOSING];
  const weekly = fitted.slice(0, weeks).map((domain, i) => ({
    week: i + 1,
    focus: domain,
    why:
      i === 0
        ? "Everything builds on felt safety with adults — start here even if it feels 'too basic'."
        : ctx.riskThemes.some((r) => (RISK_TO_DOMAINS[r.toLowerCase()] ?? []).includes(domain))
          ? `Directly linked to ${ctx.name}'s current risk themes.`
          : "Builds on the previous week and keeps momentum without overload.",
    sessionIdeas: [
      ...(DOMAIN_SESSION_IDEAS[domain] ?? [`A short, practical session on ${domain.toLowerCase()}`, `A visual or walk-and-talk follow-up on ${domain.toLowerCase()}`]),
      // Blend in concrete preparation-for-adulthood skills that map to this domain.
      ...independenceSkillsForDomain(domain).slice(0, 2).map((s) => `Independence skill — ${s.skill}: ${s.summary}`),
    ],
  }));

  const priorityNeeds = [
    ...ctx.riskThemes.map((r) => `Address risk theme: ${r}`),
    ...(input.desiredOutcomes.length ? input.desiredOutcomes : ["Build trust with the staff team", "Grow emotional vocabulary"]),
  ].slice(0, 6);

  const review = computeManagerReview({
    topicOrTheme: domains.join(" "),
    guardrailSeverity: null,
    outputText: priorityNeeds.join(" "),
  });

  const output: CaraCurriculumMapOutput = {
    title: `${ctx.name}'s learning pathway — ${weeks} weeks`,
    summary: `A modular, trauma-informed pathway for ${ctx.name}${ctx.age != null ? ` (age ${ctx.age})` : ""}: safety and trust first, then the work the risk picture asks for, closing on independence and voice. Every session is optional, adapted and non-shaming; pace beats coverage.`,
    priorityNeeds,
    curriculumDomains: domains.slice(0, Math.max(weeks, 8)),
    weeklyPlan: weekly,
    suggestedSessionSequence: weekly.map((w) => `Week ${w.week}: ${w.focus} → ${w.sessionIdeas[0]}`),
    outcomeMeasures: [
      "Engagement: sessions offered vs joined (any format counts)",
      "Child's own words: can they name one thing they took from each block?",
      "Behaviour signals: incident frequency/intensity on linked themes",
      "Relationship: does the child seek staff out more readily?",
    ],
    reviewQuestions: [
      "Which sessions did the child actually engage with, and in what format?",
      "What did the child teach US about how they learn?",
      "Which week needs repeating rather than moving on?",
      "Has the risk picture shifted — does the map still fit?",
    ],
    staffGuidance:
      "Treat the map as a menu, not a march. Repeat weeks freely, swap formats to match the day, and let the child see the map — their pathway, their voice. Two short wins beat one long struggle.",
    adaptationNotes: ctx.profile
      ? [
          ctx.profile.send_needs ? `Every session pre-adapted for: ${ctx.profile.send_needs}` : "Adapt each session with the SEND engine before use",
          ctx.profile.learning_style.short_bursts ? "Default to 5–10 minute micro-formats" : "20-minute default, with micro fallbacks",
        ]
      : ["No learning profile yet — create one first so sessions adapt properly"],
    safeguardingNotes: ctx.riskThemes.length
      ? `The pathway intentionally addresses: ${ctx.riskThemes.join(", ")}. Exploitation/safety weeks must be reviewed by a manager before delivery and never run cold after an incident.`
      : "Re-map if a new risk theme emerges — the curriculum follows the child, not the calendar.",
    signsToPause: ["Engagement dropping across consecutive weeks", "Themes consistently triggering distress", "Child says it feels like punishment — stop and redesign together"],
    followUpActions: ["Review the map with the team at the next planning meeting", `Set the first review for week ${Math.min(4, weeks)}`, "Link each delivered session back to this map in records"],
    recordingPrompt: RECORDING_PROMPTS.curriculum,
    managerReviewNeeded: review.required,
  };

  return { output, review };
}

export const ALL_CURRICULUM_DOMAINS = CARA_CURRICULUM_DOMAINS;
