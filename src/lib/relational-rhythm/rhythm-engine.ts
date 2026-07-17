// ─────────────────────────────────────────────────────────────────────────────
// Relational Rhythm Engine (doctrine 2.1.3)
//
// Check In / Check Up / Check Out circles as first-class events in the home's
// weekly rhythm, with lightweight capture — themes, gratitude, emerging
// concerns — feeding the intelligence layer.
//
// THE WHOLE DESIGN HANGS ON ONE LINE OF THE DOCTRINE: "configurable, never
// mandatory-feeling — these are relational structures, not compliance tasks."
// A circle that gets a completion percentage stops being a circle. So:
//
//   · NO attendance. NO completion rate. NO "circles missed" red. A circle that
//     didn't happen is NOT a finding, and there is no function here that could
//     produce one. `recurring-checks` is the compliance path and materialises
//     TASKS; this deliberately does not use it. Reaching for that machinery
//     would turn the rhythm into the exact chore the doctrine forbids.
//
//   · NOT SURVEILLANCE, STRUCTURALLY. 2.3.5 wants circle data to inform team
//     health "supportively, never surveillantly". The difference is the unit of
//     analysis: "the team named tiredness in four of five circles" supports;
//     "Naomi attended three of eight" surveils. So a CircleNote HAS NO
//     ATTENDEE LIST AND NO PER-PERSON THEME ATTRIBUTION — not as a rule someone
//     must remember, but because the shape of the record makes the surveillant
//     report unwritable. Themes belong to the circle, never to a named adult.
//
//   · A CONCERN RAISED IN A CIRCLE IS A CONCERN, NOT "CIRCLE DATA". If someone
//     says they are worried about a child, recording it here is not the end of
//     the loop — it is a HANDOFF that must leave this page for the safeguarding,
//     voice or supervision path that actually owns it. Nothing here delays or
//     gates that (PHILOSOPHY.md). Cara surfaces and prompts; a human routes it.
//     Cara never auto-files a concern on someone's behalf.
//
// Configured rhythms reuse the calendar's CalendarRecurrence and its expansion
// maths rather than growing a second scheduler, so circles land on the same
// unified feed as everything else (2.4.4).
//
// Pure and deterministic: caller supplies `now`; no store import; no AI. The
// suggested question rotates on the date, never on a random number.
// ─────────────────────────────────────────────────────────────────────────────

import { nextOccurrenceStart, type CalendarRecurrence } from "@/lib/calendar/recurrence";
import { mentionsAny } from "@/lib/text/keyword-match";

export type CircleKind = "check_in" | "check_up" | "check_out";

export const CIRCLE_KINDS: readonly CircleKind[] = ["check_in", "check_up", "check_out"] as const;

export interface CircleDefinition {
  kind: CircleKind;
  label: string;
  /** What this circle is for — in practice language, not process language. */
  purpose: string;
  /** Suggested openers. Deterministic bank; the doctrine asks for "a suggested
   *  check-in question" before a circle (2.3.3), not a generated one. */
  prompts: readonly string[];
}

export const CIRCLE_DEFINITIONS: readonly CircleDefinition[] = [
  {
    kind: "check_in",
    label: "Check In",
    purpose: "How is everyone arriving? Said out loud, before the day takes over.",
    prompts: [
      "What are you carrying into today?",
      "On a scale of weather, what are you today?",
      "One word for how you've arrived.",
      "What would make today feel like a good one?",
      "Is there anything you'd like the rest of us to know before we start?",
    ],
  },
  {
    kind: "check_up",
    label: "Check Up",
    purpose: "Midway. What's working, what's wobbling, what needs a hand.",
    prompts: [
      "What's going better than expected this week?",
      "What's harder than it should be right now?",
      "Who could do with a hand, and with what?",
      "What have we noticed about the children this week?",
      "Is there anything we said we'd do that's quietly slipped?",
    ],
  },
  {
    kind: "check_out",
    label: "Check Out",
    purpose: "Closing. What we're taking with us, and what we're leaving behind.",
    prompts: [
      "What's one thing worth remembering from today?",
      "What are you taking home that you'd rather leave here?",
      "Who or what are you grateful for today?",
      "What went well that nobody has said out loud yet?",
      "Anything unfinished the next shift should know?",
    ],
  },
] as const;

export const circleDefinition = (kind: CircleKind): CircleDefinition =>
  CIRCLE_DEFINITIONS.find((d) => d.kind === kind) ?? CIRCLE_DEFINITIONS[0];

/** A configured circle in the home's rhythm. Every one of these is optional and
 *  switchable off — that is what "configurable, never mandatory-feeling" means
 *  in a data model. */
export interface CircleRhythm {
  id: string;
  home_id: string;
  kind: CircleKind;
  /** Anchor date+time of the first occurrence (ISO). */
  starts_at: string;
  /** Reuses the calendar's recurrence — one scheduler, not two. */
  recurrence: CalendarRecurrence | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/** What came out of one circle.
 *
 *  Deliberately NO `attendees`, NO `participants`, NO per-person attribution on
 *  themes or gratitude. `facilitated_by` is the author of the record, the same
 *  as any other record in Cara — it is never aggregated into a score here. */
export interface CircleNote {
  id: string;
  home_id: string;
  kind: CircleKind;
  /** YYYY-MM-DD. */
  date: string;
  facilitated_by: string;
  /** What the circle talked about. Belongs to the circle, not to a person. */
  themes: string[];
  /** Named out loud. Feeds recognition, not ranking. */
  gratitude: string[];
  /** Raised here, owned elsewhere. Recording one here is a handoff, not a
   *  resolution. */
  emerging_concerns: string[];
  created_at: string;
  created_by: string;
}

export interface ThemeSignal {
  theme: string;
  /** How many separate circles named it. Recurrence is the signal. */
  circles: number;
  lastHeard: string;
  kinds: CircleKind[];
  /** Why this is being shown — always stated, never a mystery score. */
  whyShown: string;
}

export interface Handoff {
  concern: string;
  raisedAt: string;
  kind: CircleKind;
  /** Where this belongs. Cara points; a person decides and does it. */
  suggestedRoute: string;
  why: string;
}

export interface UpcomingCircle {
  kind: CircleKind;
  label: string;
  /** ISO datetime of the next occurrence, or null if the rhythm has run out. */
  nextAt: string | null;
  /** The suggested opener for that circle (2.3.3). */
  suggestedPrompt: string;
  purpose: string;
}

export interface RhythmView {
  /** Configured and switched on. A home with none is not failing — it simply
   *  hasn't set a rhythm, and this says so plainly. */
  configured: boolean;
  upcoming: UpcomingCircle[];
  /** Themes the TEAM keeps naming — the supportive unit of analysis. */
  themes: ThemeSignal[];
  /** Recent gratitude, for recognition (2.3.4). */
  gratitude: { text: string; heardAt: string }[];
  /** Concerns that still need to leave this page. */
  handoffs: Handoff[];
  circlesInWindow: number;
  summary: string;
}

const DAY_MS = 86_400_000;
const norm = (s: string): string => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Deterministic prompt rotation — the same circle on the same day always
 *  suggests the same opener, so two staff comparing screens see one home. */
export function suggestPrompt(kind: CircleKind, dateIso: string): string {
  const def = circleDefinition(kind);
  const day = Math.floor(Date.parse(`${dateIso.slice(0, 10)}T00:00:00Z`) / DAY_MS);
  const idx = ((day % def.prompts.length) + def.prompts.length) % def.prompts.length;
  return def.prompts[idx];
}

/** Where a concern raised in a circle actually belongs. Cara suggests the door;
 *  it never walks through it on someone's behalf. */
function routeFor(concern: string): { route: string; why: string } {
  // mentionsAny is the house word-boundary matcher — a bare .includes() would
  // let "harmless" trip the safeguarding route.
  const mentions = (words: string[]) => mentionsAny(concern, words);

  if (mentions(["safeguarding", "disclosure", "unsafe", "harm", "hurt", "abuse", "grooming"])) {
    return {
      route: "Safeguarding — log it as a concern now",
      why: "This sounds like a safeguarding matter. A circle is where it was said; the safeguarding record is where it belongs, today.",
    };
  }
  if (mentions(["said", "asked", "wants", "told", "complained", "unhappy"])) {
    return {
      route: "Child voice — open a follow-through loop",
      why: "Something a child raised needs an answer that gets back to them.",
    };
  }
  if (mentions(["staffing", "cover", "tired", "exhausted", "workload", "short-staffed", "rota"])) {
    return {
      route: "Supervision or the manager — a capacity conversation",
      why: "Capacity named out loud should be negotiated, not quietly absorbed.",
    };
  }
  return {
    route: "Take it to supervision or the team meeting",
    why: "Raised in a circle, it needs an owner somewhere that tracks it.",
  };
}

export function buildRhythmView(
  rhythms: readonly CircleRhythm[],
  notes: readonly CircleNote[],
  now: Date,
  windowDays = 28,
): RhythmView {
  const nowIso = now.toISOString();
  const since = new Date(now.getTime() - windowDays * DAY_MS).toISOString().slice(0, 10);
  const live = rhythms.filter((r) => r.enabled);
  const recent = notes.filter((n) => n.date >= since).sort((a, b) => b.date.localeCompare(a.date));

  // Upcoming — computed by the calendar's own recurrence maths.
  const upcoming: UpcomingCircle[] = live
    .map((r) => {
      const nextAt = nextOccurrence(r, nowIso);
      const def = circleDefinition(r.kind);
      return {
        kind: r.kind,
        label: def.label,
        nextAt,
        suggestedPrompt: suggestPrompt(r.kind, nextAt ?? nowIso),
        purpose: def.purpose,
      };
    })
    .sort((a, b) => (a.nextAt ?? "9999").localeCompare(b.nextAt ?? "9999"));

  // Themes — counted across CIRCLES, never across people.
  const themeMap = new Map<string, { theme: string; circles: number; lastHeard: string; kinds: Set<CircleKind> }>();
  for (const n of recent) {
    for (const raw of n.themes) {
      const key = norm(raw);
      if (!key) continue;
      const hit = themeMap.get(key);
      if (hit) {
        hit.circles += 1;
        if (n.date > hit.lastHeard) hit.lastHeard = n.date;
        hit.kinds.add(n.kind);
      } else {
        themeMap.set(key, { theme: raw.trim(), circles: 1, lastHeard: n.date, kinds: new Set([n.kind]) });
      }
    }
  }

  const themes: ThemeSignal[] = [...themeMap.values()]
    .filter((t) => t.circles >= 2) // said once is a moment; said twice is a pattern
    .map((t) => ({
      theme: t.theme,
      circles: t.circles,
      lastHeard: t.lastHeard,
      kinds: [...t.kinds],
      whyShown: `The team named this in ${t.circles} separate circles in the last ${windowDays} days. Worth asking about — it is what they are telling you.`,
    }))
    .sort((a, b) => b.circles - a.circles || b.lastHeard.localeCompare(a.lastHeard));

  const gratitude = recent
    .flatMap((n) => n.gratitude.map((g) => ({ text: g, heardAt: n.date })))
    .slice(0, 8);

  const handoffs: Handoff[] = recent.flatMap((n) =>
    n.emerging_concerns.map((c) => {
      const r = routeFor(c);
      return { concern: c, raisedAt: n.date, kind: n.kind, suggestedRoute: r.route, why: r.why };
    }),
  );

  const summary = !live.length
    ? "No circles set up yet. They're optional — a rhythm is something a home chooses, not something Cara requires."
    : recent.length === 0
      ? `${live.length} circle${live.length === 1 ? "" : "s"} in the rhythm. Nothing captured in the last ${windowDays} days — the circles may well be happening; only what someone writes down can reach here.`
      : `${recent.length} circle${recent.length === 1 ? "" : "s"} captured in the last ${windowDays} days${themes.length ? `, with ${themes.length} theme${themes.length === 1 ? "" : "s"} the team has named more than once` : ""}.`;

  return {
    configured: live.length > 0,
    upcoming,
    themes,
    gratitude,
    handoffs,
    circlesInWindow: recent.length,
    summary,
  };
}

/** Next occurrence of a configured circle. Thin wrapper so callers don't have
 *  to know the calendar's recurrence internals. */
export function nextOccurrence(rhythm: CircleRhythm, nowIso: string): string | null {
  return nextOccurrenceStart(rhythm.starts_at, rhythm.recurrence, nowIso);
}

/** Write law for capture. Returns an error sentence, or null to allow.
 *
 *  It asks for almost nothing: a circle where nothing was said is still a
 *  circle that happened, and demanding content would make it a form to fill in. */
export function validateCircleNote(patch: {
  kind?: string;
  date?: string;
  themes?: string[];
  gratitude?: string[];
  emerging_concerns?: string[];
}): string | null {
  if (!patch.kind || !CIRCLE_KINDS.includes(patch.kind as CircleKind)) {
    return `Which circle was this? One of: ${CIRCLE_KINDS.join(", ")}.`;
  }
  if (!patch.date || !/^\d{4}-\d{2}-\d{2}$/.test(patch.date)) {
    return "A circle needs the date it happened.";
  }
  const total =
    (patch.themes?.length ?? 0) + (patch.gratitude?.length ?? 0) + (patch.emerging_concerns?.length ?? 0);
  if (total === 0) {
    return "Nothing to capture yet — add a theme, a thank you, or something that came up. A few words is plenty.";
  }
  return null;
}
