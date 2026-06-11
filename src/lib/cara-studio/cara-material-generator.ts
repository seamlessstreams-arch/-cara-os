// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — INTERACTIVE MATERIALS GENERATOR
//
// Builds the 19 material types as ordered content blocks plus printable text,
// an audio script and a low-writing alternative — every one shaped by the
// child's profile (literacy, attention, sensory) and theme. Deterministic
// templates with profile-aware adjustments; copy/print/save in the UI.
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraInteractiveMaterialOutput, CaraMaterialType } from "./cara-types";
import type { CaraChildContext } from "./cara-context-builder";
import { RECORDING_PROMPTS, PACE_REPAIR, PACE_VALIDATIONS } from "./cara-prompt-library";
import { computeManagerReview, type ManagerReviewDecision } from "./cara-guardrails";

export interface MaterialGenInput {
  ctx: CaraChildContext;
  materialType: CaraMaterialType;
  theme: string;
  difficulty: "gentle" | "standard" | "stretch";
  formatPreference?: string;
}

type Blocks = CaraInteractiveMaterialOutput["blocks"];

function blocksFor(input: MaterialGenInput): { blocks: Blocks; visualPrompt: string | null; audio: string | null } {
  const { theme, ctx } = input;
  const name = ctx.name;
  const t = theme.toLowerCase();

  switch (input.materialType) {
    case "visual_card":
      return {
        blocks: [
          { heading: "Key message", body: `One idea, big and simple: ${theme}.`, childPrompt: `What does "${t}" look like for you? Point, draw or say.` },
          { heading: "Staff use", body: "Hold it up in calm moments, leave it visible, never use it as a warning sign. Refer to it with curiosity: 'where are you on this right now?'" },
        ],
        visualPrompt: `A single warm, simple illustration for "${theme}" — soft colours, no text walls, one clear image a child can read at a glance.`,
        audio: null,
      };
    case "social_story": {
      const story = `Sometimes things feel big for me. When ${t} happens, my body might feel hot, fast or wobbly. That is my body trying to keep me safe. The adults here stay with me even when things feel big. I can take space, ask for a drink, or find a safe adult. Big feelings always pass. I am still cared about, every time.`;
      return {
        blocks: [
          { heading: "Story", body: story },
          { heading: "Scene ideas", body: "1) A calm everyday moment · 2) The feeling starting (colour change, not scary) · 3) Taking space or finding an adult · 4) Feeling settled again, adult nearby." },
          { heading: "After-story questions", body: "Which page feels most like you? Is there a page we should add?", childPrompt: "You can change any words — it's your story." },
        ],
        visualPrompt: "Four gentle scenes matching the story beats, same character throughout, warm and predictable style.",
        audio: `Read slowly, warmly: "${story}"`,
      };
    }
    case "scenario_cards":
      return {
        blocks: [
          { heading: "Card 1", body: `Someone you know asks you to do something about ${t} that feels a bit off.`, options: ["Go along with it", "Say 'not today'", "Check with someone you trust"], childPrompt: "What might you feel? What's the safer move — and what makes it hard?" },
          { heading: "Card 2", body: `It's late, you're tired, and ${t} suddenly gets difficult.`, options: ["Push through", "Take space", "Find an adult"], childPrompt: "Which one would future-you thank you for?" },
          { heading: "Card 3", body: `A friend tells you something worrying about ${t} and says it has to stay just between you two.`, options: ["Agree to stay quiet", "Explain that worrying things can't stay hidden", "Go with them to a safe adult"], childPrompt: "What's the difference between a surprise and a secret?" },
        ],
        visualPrompt: "Three simple scene illustrations, ambiguous enough to discuss, nothing graphic.",
        audio: null,
      };
    case "decision_tree":
      return {
        blocks: [
          { heading: "The situation", body: `${theme} — the moment where it could go either way.` },
          { heading: "Choice A", body: "The quick option.", options: ["What probably happens next?", "How does it feel in an hour?"] },
          { heading: "Choice B", body: "The harder-but-safer option.", options: ["What probably happens next?", "Who could help make it easier?"] },
          { heading: "Safer next step", body: `Whatever was chosen before, there's ALWAYS a safer next step from here. Name one together.`, childPrompt: "You can't make a choice so bad that the adults here stop being on your side." },
        ],
        visualPrompt: "A simple two-branch tree with friendly icons, both branches drawn with equal respect (no devil/angel framing).",
        audio: null,
      };
    case "restorative_conversation":
      return {
        blocks: [
          { heading: "Opening line", body: `"I'm not here to tell you off. Something happened and I want us to be okay — that's the whole agenda."` },
          { heading: "Validation", body: `"${PACE_VALIDATIONS[0]}"` },
          { heading: "Curiosity", body: `"What was going on for you?" · "What was the hardest bit?" · "What did you need that you didn't get?"` },
          { heading: "Repair", body: `"${PACE_REPAIR[1]}" — repair is offered, chosen and theirs. A forced sorry teaches hiding, not repairing.` },
          { heading: "Closing", body: `"We're okay. This doesn't follow you around."` },
        ],
        visualPrompt: null,
        audio: null,
      };
    case "audio_script":
      return {
        blocks: [
          { heading: "Tone", body: "Slow, warm, unhurried. Pauses are part of the script. Record on a phone or read live — side by side, not face to face." },
          { heading: "Script", body: `"This is a couple of minutes about ${t}. Nothing to get right. [pause] Lots of people find ${t} hard — there are real reasons it's hard. [pause] As you listen, notice one thing that feels true for you. You can tell me, draw it, or keep it. [pause] Whatever you do with this, you're doing okay."`, childPrompt: "One thing that felt true — say it, draw it, or keep it." },
        ],
        visualPrompt: null,
        audio: `"This is a couple of minutes about ${t}..." (full script in blocks)`,
      };
    case "comic_strip":
      return {
        blocks: [
          { heading: "Characters", body: `A young person (never named as ${name} unless they choose) and one safe adult.` },
          { heading: "Panels", body: `1) Ordinary moment · 2) ${theme} starts (show the body clue!) · 3) The fork: two thought bubbles · 4) Taking the safer fork — and it costing something (honest) · 5) Afterwards: still respected, still connected.` },
          { heading: "Learning point", body: "The safer choice can be hard AND worth it — and adults stay either way.", childPrompt: "Draw panel 6: what happens next evening?" },
        ],
        visualPrompt: "Five-panel comic, expressive but simple faces, body-signal close-up in panel 2.",
        audio: null,
      };
    case "feelings_cards":
      return {
        blocks: [
          { heading: "Card set", body: "8 cards: okay · wobbly · buzzing · flat · cross · scared · mixed up · proud. Each card: the word, a face, a body clue ('jaw tight', 'tummy flips')." },
          { heading: "How to use", body: `Daily, low-stakes: "${name}, pick today's card" at a settled moment. Never used as a quiz after incidents.`, childPrompt: "Pick one. Or two — feelings come in pairs sometimes." },
        ],
        visualPrompt: "8 simple cards, consistent friendly style, feeling word + face + one body clue each.",
        audio: null,
      };
    case "safety_plan":
      return {
        blocks: [
          { heading: "My early signs", body: "What do I notice first when things go off? (body, thoughts, urges)", childPrompt: "Circle or say yours." },
          { heading: "What helps me", body: ctx.profile?.calming_strategies ? `Known helpers: ${ctx.profile.calming_strategies}. Add or cross out — your plan.` : "Music · moving · outside · quiet · a person · food · phone someone", childPrompt: "Top three, in order." },
          { heading: "My people", body: ctx.profile?.trusted_adults ? `${ctx.profile.trusted_adults} — and anyone else you'd add.` : "Who would you actually go to? (honest answers only)", childPrompt: "First person I'd try:" },
          { heading: "If it gets really big", body: "The grown-up part: who does what, no surprises. Written WITH the child, agreed word by word." },
        ],
        visualPrompt: "One-page plan, traffic-light bands, the child's own words verbatim.",
        audio: null,
      };
    case "routine_builder":
      return {
        blocks: [
          { heading: "Pick the moment", body: `One routine only (${t} suggests itself). Small beats grand.` },
          { heading: "Build it together", body: "3–5 steps max, child chooses the order where possible, one step is always something they like.", childPrompt: "Which step should be the 'nice bit'?" },
          { heading: "Make it visible", body: "Photo strip or drawn cards on the wall — theirs to move, tick or rearrange." },
          { heading: "Review in a week", body: "Keep / tweak / bin — their call first." },
        ],
        visualPrompt: "Step cards with photos or icons, big ticks, child's name only if they want it.",
        audio: null,
      };
    case "quiz":
      return {
        blocks: [
          { heading: "Q1", body: `True or false: ${theme} is something lots of people your age find confusing.`, options: ["True", "False"], childPrompt: "(It's true — and that's the point of this.)" },
          { heading: "Q2", body: `Which of these is a SAFE move when ${t} gets difficult?`, options: ["Handle it completely alone", "Check it with someone you trust", "Pretend it's fine"] },
          { heading: "Q3", body: "Finish the sentence: 'One thing adults get wrong about this is…'", childPrompt: "No wrong answers — this one teaches US." },
        ],
        visualPrompt: null,
        audio: null,
      };
    default:
      // Worksheet-family fallback used by worksheet, role_play, reflection_cards,
      // staff_script, independence_task, living/exploitation/digital activities.
      return {
        blocks: [
          { heading: "What this is", body: `A short, doing-first activity about ${theme} for ${name}. Three parts, ten minutes, nothing graded.` },
          { heading: "Part 1 — Notice", body: `One example of ${t} from real life (theirs or invented).`, childPrompt: "Say it, draw it, or point at a card." },
          { heading: "Part 2 — Explore", body: "What makes it hard? What would make it 1% easier?", options: ["Talk", "Draw", "Sort cards", "Walk and talk"] },
          { heading: "Part 3 — One small move", body: "Pick one tiny thing to try this week. Staff pick one too — fair's fair.", childPrompt: "Mine is…" },
        ],
        visualPrompt: `Simple supporting visual for ${theme} — icons over text.`,
        audio: null,
      };
  }
}

export function generateCaraInteractiveMaterial(input: MaterialGenInput): { output: CaraInteractiveMaterialOutput; review: ManagerReviewDecision } {
  const { ctx, theme } = input;
  const { blocks, visualPrompt, audio } = blocksFor(input);

  const printable = blocks
    .map((b) => `${b.heading.toUpperCase()}\n${b.body}${b.options ? `\nOptions: ${b.options.join(" / ")}` : ""}${b.childPrompt ? `\n→ ${b.childPrompt}` : ""}`)
    .join("\n\n");

  const review = computeManagerReview({
    topicOrTheme: theme + " " + input.materialType,
    childTriggerMatch: ctx.triggerMatch || ctx.avoidedTopicMatch,
    guardrailSeverity: null,
    outputText: printable,
  });

  const output: CaraInteractiveMaterialOutput = {
    materialType: input.materialType,
    title: `${theme} — ${input.materialType.replace(/_/g, " ")} for ${ctx.name}`,
    childFriendlyIntro: `This is for you. No marks, no tests, no trick questions — you can talk, draw, point or pass.`,
    blocks,
    printableText: printable,
    audioScript: audio,
    visualPrompt,
    lowWritingAlternative:
      "Everything here works with zero writing: read it aloud together, let the child point, sort, draw or thumb-vote. Staff scribe the child's words verbatim if anything needs keeping.",
    staffGuidance: `${input.difficulty === "gentle" ? "Gentle mode: offer, don't steer — partial engagement is full success." : input.difficulty === "stretch" ? "Stretch mode: this child is ready for a little challenge — still optional, still warm." : "Standard: follow their energy; shrink it live if attention dips."} ${ctx.usedApprovedResource ? "Built with approved library resources." : "AI/deterministic draft — review before first use with the child."}`,
    adaptationNotes: [
      ctx.profile?.learning_style?.low_literacy ? "Low-literacy profile: lead with the spoken/visual route." : "Reading is optional throughout.",
      ctx.profile?.learning_style?.short_bursts ? "Short-burst: one block per sitting is plenty." : "All blocks fit one sitting; split freely.",
      ctx.profile?.sensory_profile ? `Sensory: ${ctx.profile.sensory_profile}` : "Choose a calm space; busy rooms tax everything.",
    ],
    safeguardingNotes: "If the material surfaces anything concerning, pause the activity, stay warm, and follow the safeguarding procedure. Materials never probe for disclosures.",
    signsToPause: ["Rushing to 'get it over with'", "Going quiet or flat", "Self-criticism — repair the moment before the content"],
    followUpActions: ["Note which format landed and feed it back into the learning profile", "Reuse the material's best block as a 2-minute refresher within the week"],
    recordingPrompt: RECORDING_PROMPTS.material,
    managerReviewNeeded: review.required,
  };

  return { output, review };
}
