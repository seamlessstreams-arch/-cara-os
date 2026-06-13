// ══════════════════════════════════════════════════════════════════════════════
// CARA — Chronology import parser (pure)
//
// Converts a pasted/uploaded chronology (e.g. from a prior placement or local
// authority) into Cara's chronology format: each line with a leading date
// becomes a structured entry with an inferred category and significance.
// Continuation lines (no date) fold into the previous entry. UK day-first dates
// are assumed for numeric formats. Deterministic — no clock, no AI; the result
// is previewed and confirmed before anything is saved, and slots into the live
// chronology by date automatically.
// ══════════════════════════════════════════════════════════════════════════════

export type ImportCategory =
  | "placement" | "incident" | "missing" | "safeguarding" | "health"
  | "education" | "contact" | "legal" | "review" | "behaviour" | "other";
export type ImportSeverity = "routine" | "significant" | "critical";

export interface ParsedChronologyEntry {
  date: string; // ISO YYYY-MM-DD
  raw_date: string;
  title: string;
  description: string;
  category: ImportCategory;
  significance: ImportSeverity;
}

export interface ChronologyParseResult {
  entries: ParsedChronologyEntry[];
  unparsed: string[];
  total_lines: number;
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
  september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function valid(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= dim;
}
function normYear(raw: string): number {
  if (raw.length === 4) return parseInt(raw, 10);
  const yy = parseInt(raw, 10);
  return yy < 50 ? 2000 + yy : 1900 + yy;
}

/** Try to pull a leading date token off a line. Returns ISO + the remainder. */
export function extractDate(line: string): { iso: string; raw: string; rest: string } | null {
  const s = line.trim();

  // ISO: 2024-03-12 or 2024/03/12
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (m) {
    const y = +m[1], mo = +m[2], d = +m[3];
    if (valid(y, mo, d)) return { iso: `${y}-${pad(mo)}-${pad(d)}`, raw: m[0], rest: s.slice(m[0].length) };
  }

  // UK numeric day-first: 12/03/2024, 12-03-24, 12.03.2024
  m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})\b/);
  if (m) {
    const d = +m[1], mo = +m[2], y = normYear(m[3]);
    if (valid(y, mo, d)) return { iso: `${y}-${pad(mo)}-${pad(d)}`, raw: m[0], rest: s.slice(m[0].length) };
    // fall back to month-first if day-first invalid but month-first valid
    if (valid(y, d, mo)) return { iso: `${y}-${pad(d)}-${pad(mo)}`, raw: m[0], rest: s.slice(m[0].length) };
  }

  // Long: "12 March 2024", "3 Jan 2023", "12th March 2024"
  m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?\s+(\d{4})\b/);
  if (m) {
    const d = +m[1], mo = MONTHS[m[2].toLowerCase()], y = +m[3];
    if (mo && valid(y, mo, d)) return { iso: `${y}-${pad(mo)}-${pad(d)}`, raw: m[0], rest: s.slice(m[0].length) };
  }

  // Month-first long: "March 12, 2024" / "March 12 2024"
  m = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/);
  if (m) {
    const mo = MONTHS[m[1].toLowerCase()], d = +m[2], y = +m[3];
    if (mo && valid(y, mo, d)) return { iso: `${y}-${pad(mo)}-${pad(d)}`, raw: m[0], rest: s.slice(m[0].length) };
  }

  return null;
}

const CATEGORY_RULES: { cat: ImportCategory; re: RegExp }[] = [
  { cat: "safeguarding", re: /safeguard|abuse|disclosure|\bcse\b|\bcce\b|exploitation|neglect|s47|section 47|child protection|\bcp plan\b|strategy (meeting|discussion)/i },
  { cat: "missing", re: /missing|went missing|absent without|whereabouts|return interview|\bAWOL\b/i },
  { cat: "incident", re: /incident|restraint|physical intervention|assault|\bpolice\b|arrest|aggress|self-harm|self harm|overdose|damage to property/i },
  { cat: "legal", re: /court|hearing|solicitor|care order|placement order|\bjudge\b|proceedings|\bICO\b|\bEPO\b|legal/i },
  { cat: "review", re: /\blac review\b|looked after review|\biro\b|review meeting|chaired|\bcaafa\b|\bpep meeting\b/i },
  { cat: "health", re: /hospital|\ba&e\b|\bgp\b|dentist|optician|\bcamhs\b|medical|medication|injury|immunisation|health assessment/i },
  { cat: "education", re: /school|\bpep\b|exclusion|college|attendance|\bsen\b|\behcp\b|education|expelled|suspended from/i },
  { cat: "contact", re: /contact|family time|\bvisit\b|mother|father|sibling|\bparent\b|grandparent|supervised contact/i },
  { cat: "placement", re: /placement|moved to|arrived|admission|admitted|discharge|left the|respite|emergency placement|foster/i },
  { cat: "behaviour", re: /behaviour|sanction|reward|consequence|acting out|dysregulat/i },
];

export function inferCategory(text: string): ImportCategory {
  for (const r of CATEGORY_RULES) if (r.re.test(text)) return r.cat;
  return "other";
}

const CRITICAL_RE = /\bpolice\b|arrest|\ba&e\b|hospital|missing|safeguard|abuse|self-harm|self harm|overdose|assault|section 47|\bs47\b|\bcse\b|\bcce\b|strategy (meeting|discussion)|disclosure/i;
const SIGNIFICANT_RE = /incident|restraint|exclusion|court|review|injury|sanction|placement|moved|admission|discharge|hearing|suspend/i;

export function inferSignificance(text: string): ImportSeverity {
  if (CRITICAL_RE.test(text)) return "critical";
  if (SIGNIFICANT_RE.test(text)) return "significant";
  return "routine";
}

/** Trim a leading separator (-, –, —, :, |, tab) and surrounding space. */
function stripSeparator(rest: string): string {
  return rest.replace(/^\s*[-–—:|\t]+\s*/, "").trim();
}

function titleFrom(text: string): string {
  const firstSentence = text.match(/^(.{0,110}?[.!?])\s/);
  if (firstSentence) return firstSentence[1].trim();
  if (text.length <= 110) return text;
  const cut = text.slice(0, 110);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export function parseChronologyText(text: string): ChronologyParseResult {
  const lines = (text ?? "").split(/\r?\n/);
  const entries: ParsedChronologyEntry[] = [];
  const unparsed: string[] = [];
  let totalLines = 0;
  let current: ParsedChronologyEntry | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    totalLines += 1;

    const dateMatch = extractDate(line);
    if (dateMatch) {
      const body = stripSeparator(dateMatch.rest) || "(no description)";
      current = {
        date: dateMatch.iso,
        raw_date: dateMatch.raw.trim(),
        title: titleFrom(body),
        description: body,
        category: inferCategory(body),
        significance: inferSignificance(body),
      };
      entries.push(current);
    } else if (current) {
      // continuation of the previous entry
      current.description = `${current.description} ${line}`.trim();
      current.category = inferCategory(current.description);
      current.significance = inferSignificance(current.description);
      current.title = titleFrom(current.description);
    } else {
      unparsed.push(line);
    }
  }

  // newest-first for preview, matching how the chronology renders
  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return { entries, unparsed, total_lines: totalLines };
}
