// ══════════════════════════════════════════════════════════════════════════════
// CARA — REFERRAL DOCUMENT EXTRACTION (Phase 6 · Intelligence · Module 1)
//
// The audit's confirmed Intelligence gap: there is no way to paste a referral
// document and get structured fields out — both admission create-paths are
// field-by-field (and the /admissions "New Referral" form doesn't even bind its
// own inputs). This is the deterministic FLOOR: a pure regex/keyword/UK-date
// extractor, mirroring the compliance-document extractor. It becomes the no-AI
// spine (prod has no AI credits); a governed invokeAiGateway pass can enrich on
// top in a later slice, falling back to this — never a dead end.
//
// HONESTY: it extracts only what the text actually says. An unlabelled field is
// null, never guessed. The output is a PREFILL for a human to review and correct
// before saving — it creates no referral itself.
// ══════════════════════════════════════════════════════════════════════════════

export type ReferralSource =
  | "local_authority"
  | "agency"
  | "emergency"
  | "internal_transfer"
  | "court_directed";

export interface ExtractedReferralFields {
  child_name: string | null;
  date_of_birth: string | null; // ISO
  gender: string | null;
  referral_source: ReferralSource | null;
  referred_by: string | null;
  local_authority: string | null;
  referral_date: string | null; // ISO
  presenting_needs: string[];
  risk_factors: string[];
  estimated_placement_date: string | null; // ISO
}

export interface ReferralExtraction {
  fields: ExtractedReferralFields;
  /** Field keys that were found in the text. */
  found: string[];
  /** Core field keys that were NOT found (for the UI to prompt on). */
  missing: string[];
  /** Overall 0–1 over the core fields. */
  confidence: number;
  note: string;
}

const NOTE =
  "Deterministic extraction — every field is drawn straight from the pasted text. Review and correct before saving; a blank field simply wasn't found.";

// ── UK-aware date parsing (self-contained; mirrors the compliance extractor) ──
const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
function iso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
/** Parse the first date in a string. ISO, dd/mm/yyyy (UK), "1 March 2026", "March 2026". */
export function parseDate(s: string): string | null {
  let m = s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})\b/);
  if (m) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return iso(y, +m[2], +m[1]); }
  m = s.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\.?\s+(\d{4})\b/);
  if (m && MONTHS[m[2].toLowerCase()]) return iso(+m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  m = s.match(/\b([A-Za-z]+)\.?\s+(\d{4})\b/);
  if (m && MONTHS[m[1].toLowerCase()]) return iso(+m[2], MONTHS[m[1].toLowerCase()], 1);
  return null;
}

const BULLET = /^\s*(?:[-*•·▪◦‣]|\d{1,2}[.)]|\[\s?[xX ]?\s?\])\s*/;

/** Value after a "Label: value" on one line, for the first matching label. */
function labelledValue(lines: string[], labelRe: RegExp): string | null {
  for (const raw of lines) {
    const m = raw.match(labelRe);
    if (m) {
      const after = raw.slice((m.index ?? 0) + m[0].length).replace(/^[:\-–—\s]+/, "").trim();
      if (after) return after;
    }
  }
  return null;
}

function looksLikeName(s: string): boolean {
  const t = s.trim();
  const words = t.split(/\s+/);
  return words.length >= 1 && words.length <= 4 && /^[A-Za-z][A-Za-z'’.\- ]{1,48}$/.test(t);
}

// ── referral_source: order matters, most specific first ──────────────────────
const SOURCE_RULES: { re: RegExp; source: ReferralSource }[] = [
  { re: /\b(emergency|urgent placement|out[- ]of[- ]hours|same[- ]day placement)\b/i, source: "emergency" },
  { re: /\b(court[- ]directed|court order|secure order|section 25|s\.?25|dols application)\b/i, source: "court_directed" },
  { re: /\b(internal transfer|transfer from (our|another) (home|placement)|moving between homes)\b/i, source: "internal_transfer" },
  { re: /\b(placement agency|via .{0,20}agency|through an agency|independent agency)\b/i, source: "agency" },
  { re: /\b(local authority|placing authority|county council|city council|borough council|social (services|care team))\b/i, source: "local_authority" },
];
function inferSource(text: string, labelled: string | null): ReferralSource | null {
  const hay = `${labelled ?? ""} ${text}`;
  for (const rule of SOURCE_RULES) if (rule.re.test(hay)) return rule.source;
  return null;
}

const LA_RE =
  /\b((?:London Borough of|Royal Borough of|City of)\s+[A-Z][a-zA-Z]+|[A-Z][a-zA-Z]+(?:[\s'-][A-Z][a-zA-Z]+)*\s+(?:County Council|City Council|Metropolitan Borough Council|Borough Council|Council))\b/;

function extractLocalAuthority(lines: string[], text: string): string | null {
  const labelled = labelledValue(lines, /\b(local authority|placing authority|responsible authority|commissioning (authority|la))\b/i);
  if (labelled) {
    const m = labelled.match(LA_RE);
    return (m ? m[1] : labelled).replace(/[.,;]+$/, "").trim();
  }
  const m = text.match(LA_RE);
  return m ? m[1].trim() : null;
}

// ── list sections (presenting needs / risk factors) ──────────────────────────
// A heading is a WHOLE line that is essentially just the heading (optionally with
// a trailing colon) — not any line that happens to contain the word. This is why
// a bullet like "…following family breakdown" does not end the section.
const SECTION_HEADING_LINE =
  /^\s*(presenting needs|support needs|identified needs|current needs|reason for referral|needs|risk factors|risks|vulnerabilities|safeguarding concerns|placement history|background|current situation|education|health|family|contact arrangements|legal status)\s*:?\s*$/i;
const NEEDS_HEAD = /^\s*(presenting needs|support needs|identified needs|current needs|reason for referral|needs)\s*:?\s*$/i;
const RISK_HEAD = /^\s*(risk factors|risks|vulnerabilities|safeguarding concerns)\s*:?\s*$/i;
const FIELD_LINE = /^[A-Za-z][A-Za-z '&/]{2,40}:\s*\S/;

function collectListSection(lines: string[], startHeadRe: RegExp): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  let active = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!active) {
      if (startHeadRe.test(line)) active = true;
      continue;
    }
    if (!line) { if (out.length) break; else continue; }
    // A different section heading or a "Field: value" line ends this section.
    if ((SECTION_HEADING_LINE.test(line) && !startHeadRe.test(line)) || FIELD_LINE.test(line)) break;
    const cleaned = line.replace(BULLET, "").replace(/\s+/g, " ").replace(/[.;]+$/, "").trim();
    const key = cleaned.toLowerCase();
    if (cleaned.length >= 3 && cleaned.length <= 200 && !seen.has(key)) {
      seen.add(key);
      out.push(cleaned);
    }
    if (out.length >= 12) break;
  }
  return out;
}

// Fallback risk scan — high-signal terms, only used to supplement an empty section.
const RISK_TERMS: { re: RegExp; label: string }[] = [
  { re: /\b(missing from (care|home)|going missing|absconding)\b/i, label: "History of going missing" },
  { re: /\b(self[- ]harm)\b/i, label: "Self-harm" },
  { re: /\b(child (criminal|sexual) exploitation|\bcce\b|\bcse\b|exploitation)\b/i, label: "Exploitation risk (CCE/CSE)" },
  { re: /\b(county lines|gang)\b/i, label: "County lines / gang association" },
  { re: /\b(substance (misuse|abuse)|drug use|alcohol misuse)\b/i, label: "Substance misuse" },
  { re: /\b(suicidal|suicide)\b/i, label: "Suicidal ideation" },
  { re: /\b(physical aggression|violence|assault)\b/i, label: "Aggression / violence" },
];
function scanRiskTerms(text: string): string[] {
  const out: string[] = [];
  for (const t of RISK_TERMS) if (t.re.test(text)) out.push(t.label);
  return out;
}

const CORE_FIELDS = [
  "child_name", "date_of_birth", "referral_source", "local_authority", "referral_date", "presenting_needs", "risk_factors",
] as const;

/** Extract structured referral fields from pasted text. Pure. */
export function extractReferralDocument(input: { text: string; fileName?: string; today: string }): ReferralExtraction {
  const text = input.text ?? "";
  const lines = text.split(/\r?\n/);

  // child_name
  const nameRaw = labelledValue(
    lines,
    /\b(child'?s name|young person'?s name|name of (child|young person)|referral for|child|young person|\bre\b|\bname\b|regarding)\b/i,
  );
  const child_name = nameRaw && looksLikeName(nameRaw) ? nameRaw.replace(/[.,;]+$/, "").trim() : null;

  // dates
  const dobRaw = labelledValue(lines, /\b(date of birth|d\.?o\.?b\.?|born)\b/i);
  const date_of_birth = dobRaw ? parseDate(dobRaw) : null;

  const refDateRaw = labelledValue(lines, /\b(referral date|date of referral|referred on|date received|received on)\b/i);
  const referral_date =
    refDateRaw ? parseDate(refDateRaw) : parseDate(lines.find((l) => /referral/i.test(l) && parseDate(l)) ?? "");

  const placeRaw = labelledValue(
    lines,
    /\b(estimated placement|proposed (placement|start|admission)|placement (start )?date|admission date|anticipated placement|target start)\b/i,
  );
  const estimated_placement_date = placeRaw ? parseDate(placeRaw) : null;

  // gender
  const genderRaw = labelledValue(lines, /\b(gender|sex)\b/i);
  const gender = genderRaw ? (genderRaw.match(/\b(male|female|non[- ]binary|other|m|f)\b/i)?.[0] ?? null) : null;

  // referred_by
  const referred_by = labelledValue(lines, /\b(referred by|referrer|social worker|allocated (sw|social worker)|contact)\b/i);

  // source + LA
  const sourceLabelled = labelledValue(lines, /\b(referral source|source of referral|route|referral type)\b/i);
  const referral_source = inferSource(text, sourceLabelled);
  const local_authority = extractLocalAuthority(lines, text);

  // list sections
  const presenting_needs = collectListSection(lines, NEEDS_HEAD);
  let risk_factors = collectListSection(lines, RISK_HEAD);
  if (risk_factors.length === 0) risk_factors = scanRiskTerms(text);

  const fields: ExtractedReferralFields = {
    child_name,
    date_of_birth,
    gender: gender ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase() : null,
    referral_source,
    referred_by: referred_by && looksLikeName(referred_by) ? referred_by.replace(/[.,;]+$/, "").trim() : referred_by,
    local_authority,
    referral_date,
    presenting_needs,
    risk_factors,
    estimated_placement_date,
  };

  const isPresent = (k: (typeof CORE_FIELDS)[number]): boolean => {
    const v = fields[k];
    return Array.isArray(v) ? v.length > 0 : v != null;
  };
  const found = CORE_FIELDS.filter(isPresent);
  const missing = CORE_FIELDS.filter((k) => !isPresent(k));

  return {
    fields,
    found: [...found],
    missing: [...missing],
    confidence: Math.round((found.length / CORE_FIELDS.length) * 100) / 100,
    note: NOTE,
  };
}
