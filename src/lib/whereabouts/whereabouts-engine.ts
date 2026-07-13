// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD IN-OUT BOARD / EXPECTED WHEREABOUTS (Phase 5 · Home-Ops · Module 1)
//
// The audit's confirmed Home-Ops gap: Cara tracks where STAFF, visitors, keys and
// vehicles are, but has no view of where the CHILDREN are right now. The young-
// person record carries no presence field, and the movement data is scattered
// across retrospective logs. The one hard live signal is a missing episode.
//
// This projects an honest in-out board: for each resident child, are they IN,
// OUT (on a scheduled appointment or family-time window happening now, with a due-
// back time), or MISSING (an active missing episode). Pure + read-only.
//
// HONESTY: this is EXPECTED whereabouts derived from today's schedule plus the
// live missing-episode status — NOT a physical sign-out register (Cara has none).
// So "out" means "scheduled to be out right now"; "in" means "nothing on the
// schedule says otherwise". MISSING is the only hard, live state. The board says
// so, and a genuine sign-in/out capture is a later, write-path module.
// ══════════════════════════════════════════════════════════════════════════════

export interface WhereaboutsYoungPerson {
  id: string;
  first_name: string;
  last_name: string;
  status?: string; // placement status — only "current" residents are boarded
}

export interface WhereaboutsAppointment {
  child_id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM[:SS]
  type?: string;
  location?: string;
  status?: string; // scheduled | attended | cancelled | missed | rescheduled
}

export interface WhereaboutsFamilyTime {
  child_id: string;
  date: string;
  time: string;
  duration_minutes?: number;
  location?: string;
}

export interface WhereaboutsMissing {
  child_id: string;
  date_missing: string;
  time_missing?: string;
  date_returned?: string | null;
  status?: string; // active | returned | closed
  location_last_seen?: string;
}

export type PresenceState = "in" | "out" | "missing";

export interface ChildPresence {
  child_id: string;
  name: string;
  state: PresenceState;
  /** Human summary of the out/missing reason (empty-ish for "in"). */
  detail: string;
  location?: string;
  /** ISO datetime the out/missing period began, when known. */
  since?: string;
  /** ISO datetime the child is due back (scheduled out only); null when unknown/missing. */
  expected_back?: string | null;
  source: "missing_episode" | "appointment" | "family_time" | "none";
}

export interface InOutBoard {
  now: string;
  /** The honesty note — surfaced verbatim in the UI. */
  as_of_note: string;
  summary: { in: number; out: number; missing: number; total: number };
  /** Missing first, then out (soonest due back first), then in (alphabetical). */
  children: ChildPresence[];
}

/** Default assumed appointment length when no end/duration is recorded. */
const APPOINTMENT_DEFAULT_MINUTES = 90;

const AS_OF_NOTE =
  "Expected whereabouts from today's schedule and live missing-episode status — not a physical sign-out register.";

function parseDateTime(date?: string, time?: string): number | null {
  if (!date) return null;
  const d = date.slice(0, 10);
  let t = (time ?? "00:00").slice(0, 8); // "HH:MM" or "HH:MM:SS"
  if (t.length === 5) t = `${t}:00`; // "HH:MM" → "HH:MM:00"
  if (t.length !== 8) t = "00:00:00"; // malformed → midnight
  const ms = Date.parse(`${d}T${t}.000Z`);
  return Number.isNaN(ms) ? null : ms;
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

function isActiveMissing(m: WhereaboutsMissing): boolean {
  if (m.status) return m.status === "active";
  return !m.date_returned; // no status → treat as active only if not yet returned
}

/** Compute the in-out board. Pure. `nowIso` is injected (testable). */
export function computeInOutBoard(input: {
  youngPeople: readonly WhereaboutsYoungPerson[];
  appointments: readonly WhereaboutsAppointment[];
  familyTime: readonly WhereaboutsFamilyTime[];
  missing: readonly WhereaboutsMissing[];
  nowIso: string;
}): InOutBoard {
  const { nowIso } = input;
  const nowMs = Date.parse(nowIso);
  const today = nowIso.slice(0, 10);

  const residents = input.youngPeople.filter((y) => (y.status ?? "current") === "current");

  // Index the live/scheduled events by child.
  const activeMissingByChild = new Map<string, WhereaboutsMissing>();
  for (const m of input.missing) {
    if (isActiveMissing(m)) activeMissingByChild.set(m.child_id, m);
  }

  const children: ChildPresence[] = residents.map((yp) => {
    const name = `${yp.first_name} ${yp.last_name}`.trim();
    const base = { child_id: yp.id, name };

    // 1) MISSING — the one hard live signal, always wins.
    const missing = activeMissingByChild.get(yp.id);
    if (missing) {
      const since = parseDateTime(missing.date_missing, missing.time_missing);
      return {
        ...base,
        state: "missing" as const,
        detail: "Missing episode active",
        location: missing.location_last_seen,
        since: since != null ? toIso(since) : undefined,
        expected_back: null,
        source: "missing_episode" as const,
      };
    }

    // 2) OUT — a scheduled window that contains "now". Collect candidates and
    //    keep the one due back latest (the child is out until then).
    const candidates: { detail: string; location?: string; since: number; end: number; source: "appointment" | "family_time" }[] = [];

    for (const a of input.appointments) {
      if (a.child_id !== yp.id || a.date.slice(0, 10) !== today) continue;
      if (a.status === "cancelled" || a.status === "missed" || a.status === "rescheduled") continue;
      const start = parseDateTime(a.date, a.time);
      if (start == null) continue;
      const end = start + APPOINTMENT_DEFAULT_MINUTES * 60_000;
      if (nowMs >= start && nowMs < end) {
        candidates.push({
          detail: a.type ? `${a.type} appointment` : "Appointment",
          location: a.location,
          since: start,
          end,
          source: "appointment",
        });
      }
    }

    for (const f of input.familyTime) {
      if (f.child_id !== yp.id || f.date.slice(0, 10) !== today) continue;
      const start = parseDateTime(f.date, f.time);
      if (start == null) continue;
      const end = start + (f.duration_minutes && f.duration_minutes > 0 ? f.duration_minutes : APPOINTMENT_DEFAULT_MINUTES) * 60_000;
      if (nowMs >= start && nowMs < end) {
        candidates.push({
          detail: f.location ? `Family time (${f.location})` : "Family time",
          location: f.location,
          since: start,
          end,
          source: "family_time",
        });
      }
    }

    if (candidates.length > 0) {
      const out = candidates.sort((a, b) => b.end - a.end)[0];
      return {
        ...base,
        state: "out" as const,
        detail: out.detail,
        location: out.location,
        since: toIso(out.since),
        expected_back: toIso(out.end),
        source: out.source,
      };
    }

    // 3) IN — nothing on the schedule says otherwise.
    return { ...base, state: "in" as const, detail: "In the home", expected_back: null, source: "none" as const };
  });

  const rank: Record<PresenceState, number> = { missing: 0, out: 1, in: 2 };
  children.sort(
    (a, b) =>
      rank[a.state] - rank[b.state] ||
      // within "out", soonest due back first
      (a.state === "out" ? String(a.expected_back).localeCompare(String(b.expected_back)) : 0) ||
      a.name.localeCompare(b.name),
  );

  return {
    now: nowIso,
    as_of_note: AS_OF_NOTE,
    summary: {
      in: children.filter((c) => c.state === "in").length,
      out: children.filter((c) => c.state === "out").length,
      missing: children.filter((c) => c.state === "missing").length,
      total: children.length,
    },
    children,
  };
}
