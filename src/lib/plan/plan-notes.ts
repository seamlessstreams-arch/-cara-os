// ══════════════════════════════════════════════════════════════════════════════
// CARA — Plan-My-Day notes parser (pure)
//
// Turns a free-text brain-dump — pasted from an email, or dictated ("this is
// what's happening today…") — into discrete plan items. Each line/bullet becomes
// an item; a time mentioned in the line ("call the LA at 2pm", "14:30 review")
// anchors it to the schedule, otherwise it's a flexible action. Durations
// ("30 min", "1h") are honoured, else a default. Deterministic — no clock, no AI.
// ══════════════════════════════════════════════════════════════════════════════

export interface ParsedPlanItem {
  title: string;
  time: string | null; // HH:MM when a time was found in the line
  duration_min: number;
}

const DEFAULT_DURATION = 30;

/** Pull a time-of-day from a line, only when it's unambiguous (am/pm, :mm, or at/by/from N). */
function extractTime(line: string): string | null {
  // 1) HH:MM or HH.MM (+ optional am/pm)
  let m = line.match(/\b(\d{1,2})[:.](\d{2})\s*(am|pm)?\b/i);
  if (m) return normalise(+m[1], +m[2], m[3]);
  // 2) N am/pm  (e.g. "2pm", "9 am")
  m = line.match(/\b(\d{1,2})\s*(am|pm)\b/i);
  if (m) return normalise(+m[1], 0, m[2]);
  // 3) "at/by/from N" (+ optional :mm / am/pm)
  m = line.match(/\b(?:at|by|from)\s+(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?\b/i);
  if (m) return normalise(+m[1], m[2] ? +m[2] : 0, m[3]);
  return null;
}

function normalise(hour: number, min: number, ap?: string): string | null {
  if (min > 59) return null;
  let h = hour;
  const a = ap?.toLowerCase();
  if (a === "pm" && h < 12) h += 12;
  if (a === "am" && h === 12) h = 0;
  if (h > 23) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function extractDuration(line: string): number {
  const h = line.match(/\b(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/i);
  if (h) return Math.round(parseFloat(h[1]) * 60);
  const m = line.match(/\b(\d{1,3})\s*(?:m|min|mins|minute|minutes)\b/i);
  if (m) return parseInt(m[1], 10);
  return DEFAULT_DURATION;
}

/** Strip leading bullets / numbering / checkbox marks. */
function stripLead(line: string): string {
  return line
    .replace(/^\s*(?:[-*•·▪◦]|\d{1,2}[.)]|\[\s?[xX ]?\s?\])\s*/, "")
    .trim();
}

export function parsePlanNotes(text: string, opts: { max?: number } = {}): ParsedPlanItem[] {
  const max = opts.max ?? 40;
  if (!text || !text.trim()) return [];
  // Split on newlines first; if it's one big line, also split on ";" and " - " separators.
  const rawLines = text.split(/\r?\n/).flatMap((l) => (l.includes(";") ? l.split(";") : [l]));
  const items: ParsedPlanItem[] = [];
  const seen = new Set<string>();
  for (const raw of rawLines) {
    const line = stripLead(raw);
    if (line.length < 2) continue; // skip noise/empties
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ title: line.slice(0, 140), time: extractTime(line), duration_min: extractDuration(line) });
    if (items.length >= max) break;
  }
  return items;
}
