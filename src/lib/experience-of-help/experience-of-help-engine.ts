// ─────────────────────────────────────────────────────────────────────────────
// Experience-of-Help Reflection (doctrine 2.2.5, professional power from 1.6)
//
// "How is this child and family EXPERIENCING our help?" — rather than only "are
// they engaging?" The same intervention can be experienced as a door, a wall, a
// mirror, a gate, a trap, or a revolving door (1.6). The reflection separates
// barriers the family carries from barriers WE MADE, and ends in one concrete
// change that keeps the child safe.
//
// HOW THIS DIFFERS FROM THE INSTITUTIONAL SELF-CHECK (2.2.10), which reads some
// of the same records: that one asks whether OUR PATTERN is healthy, home-wide,
// derived, with no child in it. This one asks how ONE CHILD experiences us, IN
// THEIR OWN WORDS, and ends in a change. Same records, different question, and
// the answer here is not Cara's to compute.
//
// THREE RULES.
//
// 1. CARA NEVER PICKS THE LENS. Whether we are a door or a wall to this child is
//    the child's own view of their own life. There is no function here that
//    infers it, and there never will be — a system deciding how a child feels
//    about it is the exact professional power the doctrine is warning about.
//    Cara holds the answer someone recorded, and asks when nobody has.
//
// 2. A TEAM VIEW IS A HYPOTHESIS, NEVER THE ANSWER. `source` is required on
//    every reflection, and a `team_view` is labelled as ours, out loud. Adults
//    deciding among themselves how a child experiences them, and filing it as
//    the child's experience, would be worse than not asking — it puts words in
//    their mouth and closes the question.
//
// 3. THE BARRIERS CARA CAN SEE ARE OURS. It shows the ones its own records
//    prove — a concern raised and unanswered, support agreed and never arrived,
//    a decision still pending. It names them so they cannot be quietly
//    re-attributed to the child: "he doesn't engage" reads differently next to
//    "we cancelled three times". Cara never lists a barrier on the child's side;
//    those belong in the conversation, named WITH them, not about them.
//
// Pure and deterministic: caller supplies `now`, the reflections, and the
// barriers it derived elsewhere; no store; no AI.
// ─────────────────────────────────────────────────────────────────────────────

/** The six from doctrine 1.6. 2.2.5 abbreviates to "door, wall, gate, trap?";
 *  the full set is 1.6's, because a mirror and a revolving door are different
 *  experiences and a child offered only four boxes gets the nearest wrong one. */
export type HelpLens = "door" | "wall" | "mirror" | "gate" | "trap" | "revolving_door";

export interface LensDefinition {
  lens: HelpLens;
  label: string;
  /** Written from the child's side, in their terms — never a clinical gloss. */
  fromTheirView: string;
}

export const HELP_LENSES: readonly LensDefinition[] = [
  { lens: "door", label: "A door", fromTheirView: "Something opened. I got somewhere I couldn't get to on my own." },
  { lens: "wall", label: "A wall", fromTheirView: "I came up against you and nothing moved." },
  { lens: "mirror", label: "A mirror", fromTheirView: "You showed me myself — maybe usefully, maybe not." },
  { lens: "gate", label: "A gate", fromTheirView: "You decide what I get through to, and when." },
  { lens: "trap", label: "A trap", fromTheirView: "Saying yes to you cost me something I didn't expect." },
  { lens: "revolving_door", label: "A revolving door", fromTheirView: "Round and round. Same conversation, new person, and nothing I say lands anywhere." },
] as const;

export const lensDefinition = (l: HelpLens): LensDefinition =>
  HELP_LENSES.find((d) => d.lens === l) ?? HELP_LENSES[0];

/** Whose view this is. Required — the difference between asking a child and
 *  deciding on their behalf. */
export type ReflectionSource = "child" | "family" | "team_view";

export interface HelpReflection {
  id: string;
  home_id: string;
  child_id: string;
  /** YYYY-MM-DD. */
  recorded_on: string;
  source: ReflectionSource;
  lens: HelpLens;
  /** What they actually said. A team_view records the team's reasoning instead. */
  their_words: string;
  /** Barriers this home made, as named in the conversation. */
  system_barriers_named: string[];
  /** The one concrete change (2.2.5). */
  one_change: string;
  /** "…while keeping the child safe" — the clause is in the doctrine, so it is
   *  in the record. */
  safety_consideration: string;
  recorded_by: string;
  created_at: string;
}

/** A barrier THIS HOME created, proved by its own records. Supplied by the
 *  caller from the engines that already own these facts — never re-derived. */
export interface SystemBarrier {
  id: string;
  childId: string;
  origin: "voice" | "support" | "decision";
  what: string;
  since: string;
}

export type HelpFindingKey =
  | "never_asked"
  | "only_team_view"
  | "reflection_stale"
  | "no_change_agreed"
  | "barriers_unnamed"
  | "asked_and_acted";

export interface HelpFinding {
  key: HelpFindingKey;
  tone: "prompt" | "positive";
  headline: string;
  whyShown: string;
  question: string;
  evidenceIds: string[];
}

export interface ChildHelpView {
  childId: string;
  childName: string;
  /** The most recent reflection, or null when nobody has asked. */
  latest: HelpReflection | null;
  /** True when the latest reflection is the team's view rather than the child's. */
  isHypothesis: boolean;
  /** Stated whenever isHypothesis — never inferred silently. */
  hypothesisNote: string;
  /** Barriers Cara's own records prove this home created. */
  systemBarriers: SystemBarrier[];
  findings: HelpFinding[];
}

export interface ExperienceOfHelpView {
  children: ChildHelpView[];
  summary: string;
  caveat: string;
}

export const HELP_CAVEAT =
  "Whether we are a door or a wall to a child is theirs to say, not ours to work out — Cara will never fill this in. It shows what someone recorded, whose view it was, and the barriers its own records prove we made. The rest is a conversation.";

/** How long before a recorded reflection stops describing now. Deliberately a
 *  visible constant: 2.2.5 asks for PERIODIC prompts, and a period nobody can
 *  see is a period nobody can argue with. */
export const REFLECTION_PERIOD_DAYS = 90;

const DAY = 86_400_000;
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);

/** Write law. Returns an error sentence, or null to allow. */
export function validateReflection(patch: {
  source?: string;
  lens?: string;
  their_words?: string;
  one_change?: string;
  safety_consideration?: string;
}): string | null {
  const sources: ReflectionSource[] = ["child", "family", "team_view"];
  if (!patch.source || !sources.includes(patch.source as ReflectionSource)) {
    return "Whose view is this — the child's, their family's, or the team's? It matters more than anything else here.";
  }
  if (!patch.lens || !HELP_LENSES.some((l) => l.lens === patch.lens)) {
    return `Which of these did it feel like: ${HELP_LENSES.map((l) => l.label.toLowerCase()).join(", ")}?`;
  }
  if (!(patch.their_words ?? "").trim()) {
    return patch.source === "team_view"
      ? "What made the team land on that? Say it plainly — this is the team's reasoning, and it should read like it."
      : "In their words, as close as you can get. That sentence is the evidence.";
  }
  if (!(patch.one_change ?? "").trim()) {
    return "What one change would make our involvement feel more helpful? One is the point — a list is a plan nobody does.";
  }
  if (!(patch.safety_consideration ?? "").trim()) {
    return "And how does that change keep the child safe? A change that makes us feel better and the child less safe is not the change.";
  }
  return null;
}

export function buildExperienceOfHelp(input: {
  children: readonly { id: string; name: string }[];
  reflections: readonly HelpReflection[];
  barriers: readonly SystemBarrier[];
  now: Date;
}): ExperienceOfHelpView {
  const { children, reflections, barriers, now } = input;
  const nowIso = now.toISOString().slice(0, 10);

  const views: ChildHelpView[] = children.map((child) => {
    const mine = reflections
      .filter((r) => r.child_id === child.id)
      .sort((a, b) => b.recorded_on.localeCompare(a.recorded_on));
    const latest = mine[0] ?? null;
    const myBarriers = barriers.filter((b) => b.childId === child.id);
    const findings: HelpFinding[] = [];
    const isHypothesis = latest?.source === "team_view";

    if (!latest) {
      findings.push({
        key: "never_asked",
        tone: "prompt",
        headline: "Nobody has asked how this feels from where they sit",
        whyShown:
          "There is no record of anyone asking this child whether our involvement is a door or a wall. Engagement tells you whether they turn up; it does not tell you what it costs them.",
        question: "Who has the relationship to ask, and when?",
        evidenceIds: [],
      });
    } else {
      const age = daysBetween(latest.recorded_on, nowIso);

      if (isHypothesis) {
        findings.push({
          key: "only_team_view",
          tone: "prompt",
          headline: "What is recorded is our view of their experience, not theirs",
          whyShown:
            "The team's thinking is worth having and it is on record. It is still adults deciding how a child feels about adults.",
          question: "What would it take to ask them directly — and who should?",
          evidenceIds: [latest.id],
        });
      }

      if (age > REFLECTION_PERIOD_DAYS) {
        findings.push({
          key: "reflection_stale",
          tone: "prompt",
          headline: `The last time anyone asked was ${age} days ago`,
          whyShown: `How our help feels changes as the relationship changes. This one is past the ${REFLECTION_PERIOD_DAYS}-day mark.`,
          question: "Is that still how it feels to them now?",
          evidenceIds: [latest.id],
        });
      }

      if (!latest.one_change.trim()) {
        findings.push({
          key: "no_change_agreed",
          tone: "prompt",
          headline: "Asked, and nothing changed as a result",
          whyShown:
            "A reflection with no change out of it teaches a child that being asked is a form, not a door.",
          question: "What one thing could we actually do differently?",
          evidenceIds: [latest.id],
        });
      }

      // Barriers OUR records prove, that the conversation never mentioned.
      const named = new Set(latest.system_barriers_named.map((s) => s.trim().toLowerCase()));
      const unnamed = myBarriers.filter((b) => !named.has(b.what.trim().toLowerCase()));
      if (unnamed.length > 0) {
        findings.push({
          key: "barriers_unnamed",
          tone: "prompt",
          headline: `${unnamed.length} thing${unnamed.length === 1 ? "" : "s"} our own records show we did, that the conversation didn't mention`,
          whyShown:
            "These are ours, not theirs. Left off the page, they get quietly re-read as the child not engaging.",
          question: "Would they recognise these as part of why it feels the way it does?",
          evidenceIds: unnamed.map((b) => b.id),
        });
      }

      const asked = latest.source !== "team_view";
      if (asked && latest.one_change.trim() && age <= REFLECTION_PERIOD_DAYS) {
        findings.push({
          key: "asked_and_acted",
          tone: "positive",
          headline: `Asked ${age} days ago, in their own words, and one thing changed because of it`,
          whyShown: `They said it felt like ${lensDefinition(latest.lens).label.toLowerCase()}. The change agreed: ${latest.one_change}`,
          question: "Worth saying to them that this is why it changed — that is what makes the next answer honest.",
          evidenceIds: [latest.id],
        });
      }
    }

    return {
      childId: child.id,
      childName: child.name,
      latest,
      isHypothesis,
      hypothesisNote: isHypothesis
        ? "This is the team's hypothesis about how this child experiences us. They have not been asked."
        : "",
      systemBarriers: myBarriers,
      findings,
    };
  });

  const neverAsked = views.filter((v) => !v.latest).length;
  const hypotheses = views.filter((v) => v.isHypothesis).length;
  const asked = views.filter((v) => v.latest && !v.isHypothesis).length;

  const summary =
    views.length === 0
      ? "No children to reflect on yet."
      : neverAsked === views.length
        ? `Nobody has been asked how our help feels. Cara cannot answer this one — it can only keep asking whether anyone has.`
        : `${asked} of ${views.length} asked in their own words${hypotheses > 0 ? `, ${hypotheses} recorded as the team's view only` : ""}${neverAsked > 0 ? `, ${neverAsked} not asked at all` : ""}.`;

  return { children: views, summary, caveat: HELP_CAVEAT };
}
