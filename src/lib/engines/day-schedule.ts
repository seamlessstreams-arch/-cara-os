// ══════════════════════════════════════════════════════════════════════════════
// CARA — Day scheduler (pure, deterministic)
//
// Turns fixed commitments + a ranked list of flexible actions into an actual
// time-blocked plan for the day: "09:00 handover, 10:00 team meeting, 11:00
// chase training, 13:00 lunch, …". Anchors (meetings/appointments) sit at their
// real times; a start-of-shift block, lunch and a wrap-up block are reserved;
// the gaps are filled with priorities in order, each given an estimated
// duration. Anything that won't fit before the day ends becomes carry-over.
// Minute arithmetic only — no clock — so it's fully unit-testable.
// ══════════════════════════════════════════════════════════════════════════════

export interface ScheduleAnchor {
  time: string; // HH:MM
  duration_min: number;
  title: string;
  subtitle?: string | null;
  href?: string | null;
}
export interface ScheduleAction {
  id: string;
  severity: string;
  category: string;
  title: string;
  detail: string;
  href: string;
  duration_min: number;
}
export type ScheduleKind = "anchor" | "task" | "break" | "routine";
export interface ScheduleBlock {
  start: string; // HH:MM
  end: string; // HH:MM
  kind: ScheduleKind;
  title: string;
  detail?: string | null;
  severity?: string | null;
  category?: string | null;
  href?: string | null;
  fixed: boolean; // immovable commitment / routine
}
export interface DaySchedule<A extends ScheduleAction = ScheduleAction> {
  blocks: ScheduleBlock[];
  carry_over: A[];
  window: { start: string; end: string };
}

export interface BuildScheduleOptions<A extends ScheduleAction = ScheduleAction> {
  dayStart?: string; // default 09:00
  dayEnd?: string; // default 17:00
  /** Floor the schedule at this time (e.g. "now" when planning mid-day). */
  startFrom?: string | null;
  anchors: ScheduleAnchor[];
  actions: A[];
  /** Lunch preference; pass null to omit. Default { at:"13:00", min:30 }. */
  lunch?: { at: string; min: number } | null;
  morningBlockMin?: number; // default 30; 0 to omit
  wrapUpMin?: number; // default 30; 0 to omit
}

function toMin(hhmm: string): number {
  const m = hhmm.match(/(\d{1,2}):(\d{2})/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 0;
}
function toHHMM(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
function roundUp5(min: number): number {
  return Math.ceil(min / 5) * 5;
}

export function buildDaySchedule<A extends ScheduleAction = ScheduleAction>(
  opts: BuildScheduleOptions<A>,
): DaySchedule<A> {
  const dayStart = opts.dayStart ?? "09:00";
  const dayEnd = opts.dayEnd ?? "17:00";
  const startMin = toMin(dayStart);
  const endMin = toMin(dayEnd);
  const floor = opts.startFrom ? Math.max(startMin, roundUp5(toMin(opts.startFrom))) : startMin;

  const reserved: ScheduleBlock[] = [];
  const overlaps = (s: number, e: number) =>
    reserved.some((b) => s < toMin(b.end) && e > toMin(b.start));

  // ── Anchors (fixed timed commitments) ──
  for (const a of opts.anchors) {
    const s = toMin(a.time);
    if (s + a.duration_min <= floor) continue; // already in the past for this plan
    const start = Math.max(s, floor);
    reserved.push({
      start: toHHMM(start),
      end: toHHMM(s + a.duration_min),
      kind: "anchor",
      title: a.title,
      detail: a.subtitle ?? null,
      href: a.href ?? null,
      fixed: true,
    });
  }

  // ── Start-of-shift routine ──
  const mMin = opts.morningBlockMin ?? 30;
  if (mMin > 0 && floor + mMin <= endMin && !overlaps(floor, floor + mMin)) {
    reserved.push({ start: toHHMM(floor), end: toHHMM(floor + mMin), kind: "routine", title: "Start of shift — handover & review overnight", fixed: true });
  }

  // ── Wrap-up routine ──
  const wMin = opts.wrapUpMin ?? 30;
  if (wMin > 0 && endMin - wMin >= floor && !overlaps(endMin - wMin, endMin)) {
    reserved.push({ start: toHHMM(endMin - wMin), end: toHHMM(endMin), kind: "routine", title: "Recording, sign-offs & wrap-up", fixed: true });
  }

  // ── Lunch (placed near preference at a free slot) ──
  const lunch = opts.lunch === undefined ? { at: "13:00", min: 30 } : opts.lunch;
  if (lunch) {
    for (const off of [0, 30, -30, 60, -60, 90, -90]) {
      const s = toMin(lunch.at) + off;
      if (s >= floor && s + lunch.min <= endMin && !overlaps(s, s + lunch.min)) {
        reserved.push({ start: toHHMM(s), end: toHHMM(s + lunch.min), kind: "break", title: "Lunch", fixed: true });
        break;
      }
    }
  }

  // ── Free gaps between reserved blocks ──
  const sortedReserved = [...reserved].sort((a, b) => toMin(a.start) - toMin(b.start));
  const gaps: { start: number; end: number }[] = [];
  let cursor = floor;
  for (const b of sortedReserved) {
    const bs = toMin(b.start);
    if (bs > cursor) gaps.push({ start: cursor, end: bs });
    cursor = Math.max(cursor, toMin(b.end));
  }
  if (cursor < endMin) gaps.push({ start: cursor, end: endMin });

  // ── Fill gaps with ranked actions ──
  const queue = [...opts.actions];
  const scheduled: ScheduleBlock[] = [];
  for (const gap of gaps) {
    let c = gap.start;
    while (queue.length > 0 && c + queue[0].duration_min <= gap.end) {
      const a = queue.shift() as A;
      scheduled.push({
        start: toHHMM(c),
        end: toHHMM(c + a.duration_min),
        kind: "task",
        title: a.title,
        detail: a.detail,
        severity: a.severity,
        category: a.category,
        href: a.href,
        fixed: false,
      });
      c += a.duration_min;
    }
  }

  const blocks = [...reserved, ...scheduled].sort((a, b) => toMin(a.start) - toMin(b.start));
  return { blocks, carry_over: queue, window: { start: dayStart, end: dayEnd } };
}
