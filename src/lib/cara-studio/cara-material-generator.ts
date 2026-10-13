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
import { softLower, tidy } from "./cara-text";

export interface MaterialGenInput {
  ctx: CaraChildContext;
  materialType: CaraMaterialType;
  theme: string;
  difficulty: "gentle" | "standard" | "stretch";
  formatPreference?: string;
}

type Blocks = CaraInteractiveMaterialOutput["blocks"];

function blocksFor(input: MaterialGenInput): { blocks: Blocks; visualPrompt: string | null; audio: string | null } {
  const { ctx } = input;
  const theme = tidy(input.theme);
  const name = ctx.name;
  const t = softLower(input.theme);

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
    case "reflection_cards":
      return {
        blocks: [
          { heading: "How to use", body: `A small deck for a walk or a quiet moment about ${t}. One card at a time, at the child's pace. "Pass" is always allowed — a pass still tells you something.` },
          { heading: "Card 1 — Now", body: `"On a scale from acorn to oak tree, how big does ${t} feel today?"`, childPrompt: "Hands can show it if words are too much." },
          { heading: "Card 2 — Story", body: `"When did ${t} last come up for you? What was happening just before?"`, childPrompt: "Beginning, middle, end — or just one bit of it." },
          { heading: "Card 3 — People", body: `"Who makes ${t} easier? Who makes it harder?"`, childPrompt: "No wrong names, nothing goes any further without your say." },
          { heading: "Card 4 — Forward", body: `"If ${t} got one percent better this week, what would be different?"`, childPrompt: "Small counts. Tiny counts." },
          { heading: "Blank card", body: "The child writes or says their own question — for you to answer honestly. Turn-taking is where trust is built.", childPrompt: "Your turn to ask me something." },
        ],
        visualPrompt: "A small deck of calm cards, one short question each, a little space to draw an answer.",
        audio: null,
      };
    case "role_play":
      return {
        blocks: [
          { heading: "Set-up", body: `A no-stakes rehearsal of a ${t} moment. The adult plays the tricky part first to model it, then you swap. Either of you can call "pause" or "rewind" at any point.`, childPrompt: "You direct — where should we start it?" },
          { heading: "The scene", body: `The moment just before ${t} gets hard. Keep it to about a minute of acting, then stop and talk.`, options: ["Child watches first", "Child tries first", "Do it side by side"] },
          { heading: "Rewind button", body: `When it goes wrong — and it will, that is the whole point — call "rewind" and try a different move. Mistakes in here are free.`, childPrompt: "What would you try differently on the rewind?" },
          { heading: "Swap roles", body: "The child plays the other person. Seeing it from the other side is usually where the learning lands." },
          { heading: "Step back out", body: `Shake it off together and name one thing that felt real. "That was pretend — you're you again." Never leave a child inside a hard role.` },
        ],
        visualPrompt: null,
        audio: null,
      };
    case "staff_script":
      return {
        blocks: [
          { heading: "Regulate yourself first", body: `Thirty seconds before you start: unclench your jaw, drop your shoulders, slow your out-breath. ${name} will borrow your nervous system — ${t} goes better coming from a calm adult.` },
          { heading: "Open sideways", body: `Don't open with the problem. "${name}, got a minute? Nothing's wrong — I just wanted a bit of time with you." Then bridge gently into ${t}.` },
          { heading: "Say less, wait more", body: `Ask one thing, then hold the silence for a slow five-count. The urge to fill the gap is yours to resist. Lead with curiosity, not questions: "I wonder if…" lands softer than "Why did you…".` },
          { heading: "If it heats up", body: `Name it and lower the stakes: "We don't have to sort this all out right now." Offer a break before the wobble, not after. Co-regulation first, content second.` },
          { heading: "Close warm", body: `End on the relationship, never on the hardest sentence: "Thanks for talking to me — we're good." Leave the door open for next time.` },
          { heading: "Afterwards", body: "Record what the child said in their own words, note what worked, and flag anything that needs a senior. Looking after yourself is part of the job — debrief if it was a heavy one." },
        ],
        visualPrompt: null,
        audio: null,
      };
    case "independence_task":
      return {
        blocks: [
          { heading: "A real task, done for real", body: `A genuine life skill tied to ${t} — practised together, for real, not on paper. Pick something that actually needs doing this week: a meal, a form, a journey, a budget, a phone call.`, childPrompt: "Which one feels useful to you right now?" },
          { heading: "I do, we do, you do", body: "First time, the adult leads and the child watches. Second time, do it together. Third, the child leads and the adult is nearby. Say out loud which stage you're at — no surprise hand-overs.", options: ["I do (you watch)", "We do (together)", "You do (I'm nearby)"] },
          { heading: "Make the hidden steps visible", body: `The invisible bits are what trip people up later — the 'ring to cancel', the 'read the small print', the 'what if it goes wrong'. Talk those through out loud, don't just do them for them.` },
          { heading: "When it goes wrong", body: `It will, and that is the lesson. Getting it wrong safely, with an adult here, is far cheaper than getting it wrong alone later. Who would you call? What is plan B?`, childPrompt: "Mine would be…" },
          { heading: "Log the win", body: "Record the skill practised against the pathway plan — small, real and evidenced. Independence is built one genuine task at a time." },
        ],
        visualPrompt: "A simple photo checklist of the real steps, ticked off as they are actually done.",
        audio: null,
      };
    case "living_with_others_activity":
      return {
        blocks: [
          { heading: "What this is", body: `Living alongside other people is a skill, not something you're just meant to know — ${t} is part of learning it. No blame and no house-rules lecture, just how we all rub along.` },
          { heading: "My space / our space", body: `Sort everyday things into "mine to decide" and "ours to share". The grey ones in the middle are the interesting conversation.`, options: ["My room", "The TV", "The kitchen", "Quiet times", "Noise", "Food"] },
          { heading: "When someone winds me up", body: `Everyone gets on everyone's nerves sometimes — that's normal, not a crisis. What's one move that makes it better, and one that makes it worse?`, childPrompt: "Walk away, say something, find an adult, take space — which is most like you?" },
          { heading: "Repair after a bust-up", body: `You don't have to be best friends — you have to be able to share a fridge. A small repair, even just "alright?", counts. Adults will help, no one is forced.` },
          { heading: "One thing I bring", body: "Living with others isn't only about putting up with people — it's also what you add. What's one good thing you bring to this house?", childPrompt: "Honest answer — everyone brings something." },
        ],
        visualPrompt: "A simple sorting mat: 'mine' and 'shared', warm and non-judgemental.",
        audio: null,
      };
    case "exploitation_awareness_activity":
      return {
        blocks: [
          { heading: "This isn't here to scare you", body: `Most people are kind. But a few people try to use young people, and that is called exploitation — it is never the young person's fault. This is about spotting the signs early so you've got the upper hand.` },
          { heading: "Signs something's off", body: `Gifts, money, vapes or a phone that seem too good to be true · being asked to hide things from the people who care about you · someone much older who 'gets you' very fast · being asked to go somewhere or do something that gives you a bad gut feeling · being split off from your friends.`, childPrompt: "Which of these would make YOUR gut say 'hmm'? (No need to tell me about anyone real.)" },
          { heading: "Your gut is good data", body: `That 'something's not right' feeling is your brain looking after you. You don't need proof and you don't need to be certain — 'a bit weird' is already enough to mention to someone.` },
          { heading: "Surprises and the other kind", body: `A surprise is a good thing saved for later, like a party. The other kind — where you're told you must never, ever tell, and it leaves you with a funny feeling — is exactly the kind worth telling a safe adult about. Telling is never grassing.` },
          { heading: "Your people", body: ctx.profile?.trusted_adults ? `${ctx.profile.trusted_adults} — plus anyone here, any time.` : `Who would you go to if your gut said 'hmm'? Staff here, your social worker, or Childline on 0800 1111 — all free, all on your side.`, childPrompt: "Name one person. You don't have to use them today — just know who they are." },
          { heading: "Our promise", body: `If you ever tell us something, we stay calm, we stay on your side, and we help. You will never be in trouble for being honest about something that was done to you.` },
        ],
        visualPrompt: "Calm, non-graphic icons for each sign — a gift, a phone, a gut feeling — nothing frightening.",
        audio: null,
      };
    case "digital_safety_activity":
      return {
        blocks: [
          { heading: "Your phone, mostly your rules", body: `Being online is a normal, good part of life. ${t} is just about keeping the good bits and spotting the few dodgy bits early. Nobody is taking your phone off you for talking about this.` },
          { heading: "People online aren't always who they say", body: `Online, a person can claim any age, any name, any photo. A fast new 'friend' who is really keen, really complimentary, and wants to move you onto a private app — that's a known pattern worth clocking.`, childPrompt: "What would make YOU trust someone online? What would make you doubt them?" },
          { heading: "Once it's sent, it's gone", body: `A photo or message can be screenshotted and passed on, even on apps that say they delete things. A good test: would I be okay if my favourite adult saw this? If not, it's about staying in control, not about being judged.` },
          { heading: "Pressure is the red flag", body: `Anyone who rushes you, flatters you, offers you things, or makes you feel you 'owe' them — online or off — is the thing to notice. Real friends don't pressure.`, childPrompt: "What does online pressure feel like in your body?" },
          { heading: "What to do", body: `Screenshot it, block them, report it with the app's own button, and tell a safe adult. You won't be in trouble and you won't lose your phone for being honest.`, childPrompt: "Who's your tell-a-safe-adult person?" },
          { heading: "Your people", body: ctx.profile?.trusted_adults ? `${ctx.profile.trusted_adults}, anyone here, or Childline on 0800 1111.` : `Staff here, your social worker, or Childline on 0800 1111 — all free, all on your side.` },
        ],
        visualPrompt: "Phone-screen style cards, calm and modern, each sign shown as a simple icon.",
        audio: null,
      };
    default:
      // True worksheet: a short, doing-first, three-part activity. Only the
      // `worksheet` type reaches this now — every other type has its own template.
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
    title: `${tidy(theme)} — ${input.materialType.replace(/_/g, " ")} for ${ctx.name}`,
    childFriendlyIntro:
      input.materialType === "staff_script"
        ? `A script for you, the adult — not the child. Make the words your own; the warmth matters more than the lines.`
        : `This is for you. No marks, no tests, no trick questions — you can talk, draw, point or pass.`,
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
