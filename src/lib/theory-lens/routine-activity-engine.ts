// ─────────────────────────────────────────────────────────────────────────────
// Routine-Activity Lens (doctrine 2.2.10, lens from 1.13)
//
// "Harm concentrates where a motivated person, a suitable target, and an absent
// capable guardian coincide — so supervision patterns and opportunity reduction
// are protective levers."
//
// THE TRIANGLE HAS THREE LEGS. CARA COMPUTES EXACTLY ONE OF THEM.
//
//   · "motivated person"  — Cara must NEVER compute this. It would mean marking
//     a child, or a colleague, as the danger in the building. There is no field
//     for it here and there never will be.
//   · "suitable target"   — Cara must NEVER compute this either. It would mean
//     scoring a child on how exploitable they are. The idea is repellent and
//     the output would be worse than useless.
//   · "absent capable guardian" — THE ONLY LEG THIS ENGINE TOUCHES. It is the
//     one that points at US: our rota, our arrangements, who is around at four
//     o'clock on a Tuesday. It is the one the doctrine itself calls a
//     protective lever. And it is the only one anybody can actually change —
//     you cannot rota away motivation, but you can change who is in the room.
//
// So the question is never "who is dangerous". It is: WHEN AND WHERE IS THIS
// HOME THINNEST, AND DOES ANYTHING CLUSTER THERE?
//
// THREE HONESTY RULES.
//
// 1. A CLUSTER IS NOT A CAUSE. "Incidents peak at 16:00 when two staff are on"
//    has (at least) two readings: thin cover made the hour harder, OR 16:00 is
//    school-return — the hardest hour of the day — which is precisely why you
//    would staff it. Cara cannot tell them apart, and says so every time,
//    rather than picking the reading that sounds most like an insight.
//
// 2. AN INCIDENT-FREE HOUR IS NOT A SAFE HOUR. It may be the hour everyone is
//    at school, or asleep. This engine will never name a "safest time" — that
//    number is an artefact of who was in the building, not of safety.
//
// 3. IT NEVER SILENTLY MERGES PLACES. "Alex's Room" and "Alex's Bedroom" are
//    almost certainly one place recorded two ways — but Cara does not know
//    that, and merging them on a guess would be inventing evidence. It counts
//    them separately and SAYS they might be the same, because a split count
//    UNDER-reports a concentration, and under-reporting is the direction that
//    gets a child hurt.
//
// Output feeds risk-assessment review (2.2.10). It is a prompt to look at an
// arrangement, never a verdict about a person, and it never lectures theory
// (1.13) — nothing here says "routine activity theory holds that…" at anyone.
//
// Pure and deterministic: caller supplies `now` and the records; no store; no AI.
// ─────────────────────────────────────────────────────────────────────────────

/** Deliberately NOT reused from emotional-safety's `timeBucket`, which returns
 *  "afternoon" for an unparseable time. That is a harmless default when you are
 *  sketching one child's day; here, concentration IS the signal, so a silent
 *  default would pile every unstamped record into afternoon and manufacture the
 *  very cluster this engine exists to detect. Unknown gets to be unknown. */
export type Band = "morning" | "afternoon" | "evening" | "night" | "unknown";

export const BANDS: readonly Band[] = ["morning", "afternoon", "evening", "night"] as const;

export const bandOf = (time: string | null | undefined): Band => {
  const m = /^([01]\d|2[0-3]):[0-5]\d/.exec((time ?? "").trim());
  if (!m) return "unknown";
  const hour = Number(m[1]);
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
};

export const bandLabel = (b: Band): string =>
  ({
    morning: "Morning (06:00–12:00)",
    afternoon: "Afternoon (12:00–17:00)",
    evening: "Evening (17:00–22:00)",
    night: "Night (22:00–06:00)",
    unknown: "No time recorded",
  })[b];

/** The engine's own minimal view of an incident. */
export interface IncidentPoint {
  id: string;
  date: string;
  time: string | null;
  location: string | null;
  severity?: string | null;
}

/** A shift, for working out who was around. */
export interface ShiftPoint {
  id: string;
  staff_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface BandSupervision {
  band: Band;
  /** Typical number of people on shift covering this band, across the window. */
  typicalOnShift: number | null;
  /** Days in the window Cara could actually work this out for. */
  daysSeen: number;
}

export interface Concentration {
  band: Band;
  location: string;
  incidents: number;
  incidentIds: string[];
  /** People typically around at that time. Null when Cara cannot tell. */
  typicalOnShift: number | null;
  whyShown: string;
}

export interface RoutineActivityFinding {
  key: "convergence" | "thin_band" | "place_concentration" | "time_unrecorded";
  headline: string;
  whyShown: string;
  /** Both readings, always. Cara cannot tell them apart and does not pretend to. */
  readings: string[];
  question: string;
  incidentIds: string[];
}

export interface PossibleSamePlace {
  places: string[];
  why: string;
}

export interface RoutineActivityView {
  /** Enough records to see anything at all? */
  visible: boolean;
  windowDays: number;
  supervision: BandSupervision[];
  concentrations: Concentration[];
  findings: RoutineActivityFinding[];
  /** Locations that may be one place recorded two ways. Never merged. */
  possibleSamePlace: PossibleSamePlace[];
  summary: string;
  caveat: string;
}

export const ROUTINE_ACTIVITY_CAVEAT =
  "This looks at times and places, never at people. It cannot tell you why something clusters — only that it does, and who was around. A quiet hour is not a safe hour; it may just be the hour everyone is out. Treat every line here as a question for the risk assessment, not an answer.";

const DAY_MS = 86_400_000;
const MIN_FOR_PATTERN = 3;

/** Words that describe a kind of room rather than which room. */
const ROOM_WORDS = new Set([
  "room", "bedroom", "lounge", "area", "corridor", "hall", "hallway", "kitchen",
  "garden", "office", "the", "a",
]);

const distinctiveTokens = (s: string): string[] =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !ROOM_WORDS.has(t));

/** Conservative: two places share a distinctive word but are written
 *  differently. Reported, never acted on. */
function possiblySamePlace(a: string, b: string): boolean {
  if (a === b) return false;
  const ta = distinctiveTokens(a);
  const tb = distinctiveTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  return ta.some((t) => tb.includes(t));
}

/** Does a shift cover any of this band? Overnight shifts wrap past midnight. */
function coversBand(shift: ShiftPoint, band: Band): boolean {
  if (band === "unknown") return false;
  const hours: Record<Exclude<Band, "unknown">, [number, number]> = {
    morning: [6, 12],
    afternoon: [12, 17],
    evening: [17, 22],
    night: [22, 30], // 22:00 → 06:00 next day
  };
  const [from, to] = hours[band];
  const s = Number((shift.start_time ?? "").slice(0, 2));
  let e = Number((shift.end_time ?? "").slice(0, 2));
  if (Number.isNaN(s) || Number.isNaN(e)) return false;
  if (e <= s) e += 24; // wraps midnight

  // A wrapped shift (20:00 → 08:00) occupies [20, 32) on a 48-hour line, so it
  // covers tomorrow's morning too. Testing only against [6, 12) would miss the
  // 06:00–08:00 tail and report waking nights as absent from the morning they
  // actually worked — under-counting supervision is the dangerous direction.
  const overlaps = (from_: number, to_: number) => s < to_ && e > from_;
  return overlaps(from, to) || overlaps(from + 24, to + 24);
}

const median = (xs: number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round(((s[mid - 1] + s[mid]) / 2) * 10) / 10;
};

export function buildRoutineActivityView(
  incidents: readonly IncidentPoint[],
  shifts: readonly ShiftPoint[],
  now: Date,
  windowDays = 90,
): RoutineActivityView {
  const since = new Date(now.getTime() - windowDays * DAY_MS).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  const recent = incidents.filter((i) => i.date >= since && i.date <= today);
  const worked = shifts.filter(
    (s) => s.date >= since && s.date <= today && s.status !== "cancelled" && s.status !== "no_show",
  );

  // ── The one leg Cara computes: who was around, by band.
  const dates = [...new Set(worked.map((s) => s.date))];
  const supervision: BandSupervision[] = BANDS.map((band) => {
    const perDay = dates
      .map((d) => worked.filter((s) => s.date === d && coversBand(s, band)).length)
      .filter((n) => n > 0);
    return { band, typicalOnShift: median(perDay), daysSeen: perDay.length };
  });
  const supFor = (b: Band) => supervision.find((s) => s.band === b)?.typicalOnShift ?? null;

  // ── Concentrations: band × place. Places are never merged.
  const key = (b: Band, l: string) => `${b}||${l}`;
  const buckets = new Map<string, IncidentPoint[]>();
  for (const i of recent) {
    const b = bandOf(i.time);
    const l = (i.location ?? "").trim() || "No place recorded";
    const k = key(b, l);
    buckets.set(k, [...(buckets.get(k) ?? []), i]);
  }

  const concentrations: Concentration[] = [...buckets.entries()]
    .filter(([, rows]) => rows.length >= MIN_FOR_PATTERN)
    .map(([k, rows]) => {
      const [band, location] = k.split("||") as [Band, string];
      const sup = supFor(band);
      return {
        band,
        location,
        incidents: rows.length,
        incidentIds: rows.map((r) => r.id),
        typicalOnShift: sup,
        whyShown: `${rows.length} of the last ${recent.length} recorded incidents happened here, in this part of the day${
          sup !== null ? `, when there are typically ${sup} people on` : ""
        }.`,
      };
    })
    .sort((a, b) => b.incidents - a.incidents);

  const findings: RoutineActivityFinding[] = [];

  // The thinnest band Cara can see, among those it can see at all.
  const known = supervision.filter((s) => s.typicalOnShift !== null && s.daysSeen > 0);
  const thinnest = [...known].sort((a, b) => (a.typicalOnShift ?? 0) - (b.typicalOnShift ?? 0))[0];

  for (const c of concentrations) {
    const isThin = !!thinnest && c.band === thinnest.band && c.band !== "unknown";
    if (isThin) {
      findings.push({
        key: "convergence",
        headline: `${c.incidents} incidents in ${c.location.toLowerCase()}, in the ${c.band}, the part of the day with the fewest people on`,
        whyShown: c.whyShown,
        readings: [
          "It may be that this part of the day is harder because fewer people are around to notice and steady things early.",
          `It may be that the ${c.band} is simply the hardest part of the day here — which would be a reason the rota looks the way it does, not a consequence of it.`,
          "Cara cannot tell these apart from records alone. The team can.",
        ],
        question: `When the risk assessment for this was written, was the ${c.band} in ${c.location.toLowerCase()} what anyone had in mind?`,
        incidentIds: c.incidentIds,
      });
    } else {
      findings.push({
        key: "place_concentration",
        headline: `${c.incidents} incidents concentrate in ${c.location.toLowerCase()}, in the ${c.band}`,
        whyShown: c.whyShown,
        readings: [
          "A place and a time can carry a pattern that no individual record shows.",
          "It may be about the room, the hour, who is in it, or what happens just before — the records cannot say which.",
        ],
        // Environmental curiosity, even where a place names a child: the
        // question is about the arrangement, never about the person.
        question: "What is that space like at that hour — who is around, what is happening just before?",
        incidentIds: c.incidentIds,
      });
    }
  }

  if (thinnest && thinnest.typicalOnShift !== null && known.length > 1) {
    findings.push({
      key: "thin_band",
      headline: `The ${thinnest.band} is typically the thinnest part of the day — around ${thinnest.typicalOnShift} on`,
      whyShown: `Across ${thinnest.daysSeen} days Cara can see, the ${thinnest.band} usually has the fewest people on shift.`,
      readings: [
        "Thin is not the same as wrong — a quiet part of the day may need fewer people.",
        "It is only worth a look alongside what actually happens then.",
      ],
      question: "Is that the part of the day we would choose to have fewest people, if we were choosing today?",
      incidentIds: [],
    });
  }

  const unstamped = recent.filter((i) => bandOf(i.time) === "unknown");
  if (unstamped.length > 0) {
    findings.push({
      key: "time_unrecorded",
      headline: `${unstamped.length} incident${unstamped.length === 1 ? "" : "s"} with no usable time`,
      whyShown:
        "Cara cannot place these in the day, so they sit outside every pattern here. It has not guessed at a time for them — a guess would invent a cluster that nobody could check.",
      readings: ["This is a gap in the record, not a finding about the home."],
      question: "Worth a look at how time gets captured on the incident form?",
      incidentIds: unstamped.map((i) => i.id),
    });
  }

  // ── Places that may be one place, written twice. Reported, never merged.
  const places = [...new Set(recent.map((i) => (i.location ?? "").trim()).filter(Boolean))];
  const possibleSamePlace: PossibleSamePlace[] = [];
  const paired = new Set<string>();
  for (let a = 0; a < places.length; a++) {
    for (let b = a + 1; b < places.length; b++) {
      if (!possiblySamePlace(places[a], places[b])) continue;
      const id = [places[a], places[b]].sort().join("||");
      if (paired.has(id)) continue;
      paired.add(id);
      possibleSamePlace.push({
        places: [places[a], places[b]],
        why: "These look like they might be the same place written two ways. Cara counts them separately — so if they are one place, any pattern there is stronger than it looks above, not weaker.",
      });
    }
  }

  const visible = recent.length > 0;
  const summary = !visible
    ? `No incidents recorded in the last ${windowDays} days. That is not the same as a safe ${windowDays} days — it is simply nothing for this lens to look at.`
    : concentrations.length === 0
      ? `${recent.length} incident${recent.length === 1 ? "" : "s"} in the last ${windowDays} days, none concentrating in one time and place often enough (${MIN_FOR_PATTERN}+) to call a pattern.`
      : `${concentrations.length} time-and-place${concentrations.length === 1 ? "" : "s"} where incidents concentrate, out of ${recent.length} recorded in the last ${windowDays} days.`;

  return {
    visible,
    windowDays,
    supervision,
    concentrations,
    findings,
    possibleSamePlace,
    summary,
    caveat: ROUTINE_ACTIVITY_CAVEAT,
  };
}
