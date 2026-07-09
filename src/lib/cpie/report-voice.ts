// ══════════════════════════════════════════════════════════════════════════════
// CARA — CPIE · Report VOICE (pure, deterministic)
//
// The weekly narrator must not read like a template — every child's report should
// sound individual, warm and compassionate, and see the CHILD, not the behaviour.
// This gives it a deterministic "voice": a stable per-child seed (from the child's
// id) selects from phrasing pools, so two children never sound the same, yet the
// same child reads consistently. It also weaves in WHO the child is — their
// interests and strengths, from the Digital Twin — so the report is grounded in
// the person, not just the week's events.
//
// NO LLM: variety and individualisation are achieved deterministically, so it
// works with zero AI credit. (An LLM enhancement pass can layer on top later.)
// ══════════════════════════════════════════════════════════════════════════════

/** FNV-1a hash → a stable per-child seed. */
export function seedOf(id: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
/** Deterministically pick one option, varied by child (seed) and sentence (slot). */
export function pick<T>(seed: number, slot: number, opts: T[]): T {
  const h = (seed ^ Math.imul(slot + 1, 0x9e3779b1)) >>> 0;
  return opts[h % opts.length];
}

const cap = (t: string): string => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const lower1 = (t: string): string => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t);
const listify = (xs: string[]): string => (xs.length <= 1 ? xs[0] || "" : xs.length === 2 ? `${xs[0]} and ${xs[1]}` : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/** Parse the twin's one-line "who" ("Football, Fishing · Loyal to my mates"). */
export function parseWho(who: string): { interests: string[]; strength: string } | null {
  if (!who || /little recorded|close that first|nothing recorded|very little/i.test(who)) return null;
  const parts = who.split("·");
  const interests = (parts[0] || "").split(",").map((x) => x.trim()).filter(Boolean);
  const strength = (parts[1] || "").trim();
  return interests.length || strength ? { interests, strength } : null;
}

/** A warm, individualising clause that names who the child is — varied per child. */
export function identityClause(who: string, seed: number): string {
  const id = parseWho(who);
  if (!id || !id.interests.length) return "";
  const soft = (w: string) => (/^[A-Z0-9]{2,}$/.test(w) ? w : lower1(w)); // keep acronyms (FIFA) intact
  const list = listify(id.interests.slice(0, 3).map(soft));
  const base = pick(seed, 10, [
    `someone who lights up around ${list}`,
    `a young person whose world is ${list}`,
    `someone who comes alive around ${list}`,
    `a person who's happiest with ${list}`,
  ]);
  const str = id.strength
    ? pick(seed, 11, [`, and who is ${lower1(id.strength)}`, ` — and, at heart, ${lower1(id.strength)}`, ``])
    : "";
  return base + str;
}

// ── Narrative (third-person Manager Summary) voice ────────────────────────────
export interface OpenerCtx { name: string; period: string; qualities: string; challenge: string; who: string; seed: number }
export function narrativeOpener(c: OpenerCtx): string {
  const idc = identityClause(c.who, c.seed);
  const q = c.qualities;
  const ch = c.challenge ? ` ${c.challenge}` : "";
  return pick(c.seed, 20, [
    () => `This ${c.period}, ${c.name}${idc ? ` — ${idc} —` : ""} has shown ${q}${ch}.`,
    () => `This ${c.period} for ${c.name} has held ${q}${ch}.${idc ? ` It helps to keep in mind that this is ${idc}.` : ""}`,
    () => `It's worth starting with who ${c.name} is${idc ? `: ${idc}` : ""}. Held in that light, this ${c.period} has shown ${q}${ch}.`,
    () => `Underneath everything this ${c.period}${idc ? `, ${c.name} is still ${idc}` : `, ${c.name} is still ${c.name}`} — and it's been a ${c.period} of ${q}${ch}.`,
    () => `${cap(c.name)}'s ${c.period} has carried ${q}${ch}, and through all of it, ${idc || `the same ${c.name} we know and care about`}.`,
  ])();
}

export interface OverallCtx { name: string; period: string; progressWord: string; strengths: string; emotionalConcern: boolean; possessive: string; who: string; seed: number }
export function narrativeOverall(c: OverallCtx): string {
  const inStrengths = c.strengths ? ` in ${c.strengths}` : "";
  const lead = pick(c.seed, 30, [
    `Overall, ${c.name} continues to show ${c.progressWord}${inStrengths}`,
    `Taken as a whole, this ${c.period} shows ${c.name}'s ${c.progressWord}${c.strengths ? `, especially in ${c.strengths}` : ""}`,
    `Stepping back, what stands out for ${c.name} is ${c.progressWord}${c.strengths ? ` — in ${c.strengths}` : ""}`,
  ]);
  const close = c.emotionalConcern
    ? pick(c.seed, 31, [
        `. While things can still feel overwhelming at times, ${c.possessive} ability to reach for comfort, reflect and come back speaks to real resilience — and to what consistent, relational care makes possible.`,
        `. Hard moments haven't gone away, but ${c.name} is showing that, with trusted people close, ${c.possessive} way back can be found — the quiet work of relational care paying off.`,
        `. The wobbles are real, and so is ${c.possessive} growing trust that someone will stay alongside ${c.possessive === "your" ? "you" : "them"} — which is exactly what helps a child feel safe enough to keep going.`,
      ])
    : pick(c.seed, 32, [
        `. The steadiness ${c.name} is showing reflects what consistent, relational care makes possible.`,
        `. This kind of steadiness grows in the soil of consistent, caring relationships — and it shows.`,
        `. ${cap(c.name)} is thriving in the ordinary this ${c.period}, and that is worth holding onto.`,
      ]);
  return lead + close;
}

/** Lead for the emotional/regulation paragraph — compassionate, whole-child. */
export function emoConcernLead(name: string, period: string, seed: number): string {
  return pick(seed, 40, [
    `Emotionally, this ${period} brought moments of heightened vulnerability, during which ${name} needed increased reassurance, containment and the steady presence of trusted adults`,
    `There were ${period}s within this one — some harder stretches where ${name} felt things deeply and needed a calm, reliable adult close by`,
    `This ${period} asked a lot of ${name} emotionally at times, and what ${name} needed most in those moments was warmth, patience and someone steady to hold the space`,
  ]);
}

// ── Report (second-person, to the child) voice ────────────────────────────────
export function wellDoneLead(name: string, period: string, seed: number): string {
  return pick(seed, 50, [
    `This ${period} has had real moments to be proud of, ${name}.`,
    `There's a lot to celebrate with you this ${period}, ${name}.`,
    `You've given us plenty to smile about this ${period}, ${name}.`,
    `${cap(name)}, this ${period} has shown so much of the best of you.`,
  ]);
}
export function proudClose(name: string, seed: number, slot: number): string {
  return pick(seed, 60 + slot, [
    `You should be really proud of how that has gone.`,
    `That's genuinely something to be proud of.`,
    `We're proud of you, and we hope you're proud of yourself too.`,
    `Hold on to how good that feels — you earned it.`,
  ]);
}
export function struggleLead(period: string, seed: number): string {
  return pick(seed, 70, [
    `There were a few moments this ${period} that were harder for you, and the team stayed close through them.`,
    `Some parts of this ${period} felt tougher, and you didn't have to face them on your own.`,
    `Not every moment this ${period} was easy — and in the harder ones, we made sure you weren't alone.`,
  ]);
}
export function struggleCameThrough(seed: number, slot: number): string {
  return pick(seed, 80 + slot, [
    `, but with the right support around you, you came through it`,
    `, and with someone steady beside you, you found your way back`,
    `, and you let us help you through it, which took real strength`,
    `, and you got through it — and we were proud of how you did`,
    `, and things settled again once you felt safe`,
  ]);
}
export function struggleClose(seed: number): string {
  return pick(seed, 90, [
    `None of this changes how well you're doing overall.`,
    `Harder moments are part of being human — they don't take away from everything you're getting right.`,
    `We see the whole of you, not just the difficult moments — and there's so much to be hopeful about.`,
  ]);
}

export { cap as capVoice };
